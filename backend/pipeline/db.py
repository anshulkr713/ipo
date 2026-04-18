"""Supabase writer layer. One client per pipeline run."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Iterable, Optional

from supabase import Client, create_client

from .config import Settings
from .logger import get_logger

log = get_logger("pipeline.db")


# Postgres JSONB and text columns reject \u0000 (NUL) — SQLSTATE 22P05
# "unsupported Unicode escape sequence". Scraped HTML occasionally
# contains NULs (from truncated/binary response bodies, misdecoded
# gzip, or stray control chars in IPO names), and they're impossible
# to debug after the fact because the DB-side error doesn't name the
# offending field. Strip both the raw NUL byte AND the literal textual
# escape everywhere user-supplied data crosses into Supabase.
def _strip_nul(value: str) -> str:
    return value.replace("\x00", "").replace("\\u0000", "")


def _sanitize(value: Any) -> Any:
    if isinstance(value, str):
        return _strip_nul(value)
    if isinstance(value, dict):
        return {k: _sanitize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_sanitize(v) for v in value]
    if isinstance(value, tuple):
        return tuple(_sanitize(v) for v in value)
    return value


class Database:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client: Client = create_client(settings.supabase_url, settings.supabase_key)
        self.run_id: uuid.UUID = uuid.uuid4()

    def _execute(self, query: Any) -> Any:
        import time
        for attempt in range(4):
            try:
                return query.execute()
            except Exception as e:
                if attempt == 3:
                    raise
                msg = str(e).replace("\n", " ")
                log.warning("Database query failed, retrying (%s/3): %s", attempt + 1, msg[:200])
                time.sleep(2 ** attempt)

    # -------------------------------------------------------------- #
    # ipos table
    # -------------------------------------------------------------- #

    def upsert_ipos(self, rows: list[dict[str, Any]]) -> int:
        """Upsert IPO rows by slug. Returns number of rows sent."""
        if not rows:
            return 0
        # Strip None values — otherwise we'd overwrite good columns with NULL
        # whenever one source doesn't provide a given field.
        cleaned = [
            _sanitize({k: v for k, v in row.items() if v is not None})
            for row in rows
            if row.get("slug")
        ]
        sent = 0
        for chunk in _chunks(cleaned, self.settings.upload_chunk_size):
            self._execute(self.client.table("ipos").upsert(chunk, on_conflict="slug"))
            sent += len(chunk)
        log.info("upserted ipos", extra={"records": sent})
        return sent

    def update_ipo_by_slug(self, slug: str, changes: dict[str, Any]) -> int:
        """Update an existing IPO row by slug — never creates new rows.
        Use this when a source only has a partial view and must not
        accidentally insert half-empty rows (e.g. calendar_events, which
        only knows timeline_events: bulk upsert with just {slug,
        timeline_events} takes the INSERT path if the slug conflict
        doesn't match and then trips NOT NULL on ipo_name)."""
        if not slug or not changes:
            return 0
        cleaned = _sanitize({k: v for k, v in changes.items() if v is not None})
        if not cleaned:
            return 0
        query = self.client.table("ipos").update(cleaned).eq("slug", slug)
        resp = self._execute(query)
        return len(resp.data or [])

    def fetch_ipos_missing_detail(self, limit: int) -> list[dict[str, Any]]:
        """Candidates for the detail scraper: have a cached detail_url and
        haven't had their financials populated yet (or were last scraped >7d ago).
        Prioritise recently-opened IPOs."""
        query = (
            self.client.table("ipos")
            .select(
                "slug, ipo_name, company_name, category, status, "
                "detail_url, open_date, last_scraped_at"
            )
            .not_.is_("detail_url", "null")
            .in_("status", ["upcoming", "open", "closed", "listed"])
            .order("open_date", desc=True)
            .limit(limit)
        )
        resp = self._execute(query)
        return resp.data or []

    def fetch_ipos_missing_history(self, limit: int) -> list[dict[str, Any]]:
        """Candidates for the history backfill: have a detail_url and zero
        rows in both gmp_history and subscription_history. Ordered oldest
        first so listed/closed IPOs (the ones that predate the pipeline)
        get backfilled before we revisit recent ones."""
        gmp_resp = self._execute(self.client.table("gmp_history").select("ipo_slug"))
        sub_resp = self._execute(self.client.table("subscription_history").select("ipo_slug"))
        have_gmp = {r["ipo_slug"] for r in (gmp_resp.data or []) if r.get("ipo_slug")}
        have_sub = {r["ipo_slug"] for r in (sub_resp.data or []) if r.get("ipo_slug")}
        already = have_gmp & have_sub

        query = (
            self.client.table("ipos")
            .select("slug, ipo_name, detail_url, open_date, status")
            .not_.is_("detail_url", "null")
            .in_("status", ["closed", "listed", "open", "upcoming"])
            .order("open_date", desc=False)
            .limit(max(limit * 4, limit + 20))  # over-fetch, filter client-side
        )
        resp = self._execute(query)
        filtered = [r for r in (resp.data or []) if r.get("slug") and r["slug"] not in already]
        return filtered[:limit]

    def fetch_active_slugs(self) -> set[str]:
        query = (
            self.client.table("ipos")
            .select("slug")
            .in_("status", ["upcoming", "open", "closed"])
        )
        resp = self._execute(query)
        return {row["slug"] for row in (resp.data or []) if row.get("slug")}

    def fetch_ipos_for_calendar(self) -> list[dict[str, Any]]:
        """Pulls the date fields needed to derive timeline_events JSONB."""
        query = (
            self.client.table("ipos")
            .select(
                "slug, drhp_filed_date, rhp_filed_date, sebi_approval_date, "
                "open_date, close_date, allotment_date, refund_date, "
                "demat_credit_date, listing_date"
            )
            .in_("status", ["upcoming", "open", "closed", "listed"])
        )
        resp = self._execute(query)
        return resp.data or []

    # -------------------------------------------------------------- #
    # history tables (append-only)
    # -------------------------------------------------------------- #

    def append_gmp_history(self, rows: list[dict[str, Any]]) -> int:
        return self._append("gmp_history", rows)

    def append_subscription_history(self, rows: list[dict[str, Any]]) -> int:
        return self._append("subscription_history", rows)

    def append_gmp_history_dedupe(self, rows: list[dict[str, Any]]) -> int:
        """Insert only rows whose (ipo_slug, scraped_at-date) isn't already
        present. Used by the detail scraper and history backfill — they
        re-read the same Chittorgarh trend table each time, so without
        this every run would duplicate N days of observations."""
        return self._append_dedupe("gmp_history", rows)

    def append_subscription_history_dedupe(self, rows: list[dict[str, Any]]) -> int:
        return self._append_dedupe("subscription_history", rows)

    def _append_dedupe(self, table: str, rows: list[dict[str, Any]]) -> int:
        items = [r for r in rows if r.get("ipo_slug")]
        if not items:
            return 0
        slugs = sorted({r["ipo_slug"] for r in items})
        query = (
            self.client.table(table)
            .select("ipo_slug, scraped_at")
            .in_("ipo_slug", slugs)
        )
        resp = self._execute(query)
        existing: set[tuple[str, str]] = set()
        for r in resp.data or []:
            at = (r.get("scraped_at") or "")[:10]
            if at:
                existing.add((r["ipo_slug"], at))
        fresh = [
            r for r in items
            if (r["ipo_slug"], (r.get("scraped_at") or "")[:10]) not in existing
        ]
        return self._append(table, fresh)

    def _append(self, table: str, rows: Iterable[dict[str, Any]]) -> int:
        items = [_sanitize(r) for r in rows if r.get("ipo_slug")]
        if not items:
            return 0
        sent = 0
        for chunk in _chunks(items, self.settings.upload_chunk_size):
            self._execute(self.client.table(table).insert(chunk))
            sent += len(chunk)
        log.info("appended history", extra={"records": sent, "source": table})
        return sent

    # -------------------------------------------------------------- #
    # scraping_runs
    # -------------------------------------------------------------- #

    def start_run(self, source: str) -> int:
        query = (
            self.client.table("scraping_runs")
            .insert(
                {
                    "run_id": str(self.run_id),
                    "source": source,
                    "status": "running",
                    "started_at": datetime.now(timezone.utc).isoformat(),
                }
            )
        )
        resp = self._execute(query)
        data = resp.data or []
        return data[0]["id"] if data else 0

    def finish_run(
        self,
        row_id: int,
        *,
        status: str,
        records_found: int = 0,
        records_updated: int = 0,
        records_appended: int = 0,
        errors_count: int = 0,
        error_details: Optional[dict[str, Any]] = None,
        duration_ms: Optional[int] = None,
    ) -> None:
        if not row_id:
            return
        payload = _sanitize(
            {
                "status": status,
                "records_found": records_found,
                "records_updated": records_updated,
                "records_appended": records_appended,
                "errors_count": errors_count,
                "error_details": error_details,
                "duration_ms": duration_ms,
                "finished_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        query = self.client.table("scraping_runs").update(payload).eq("id", row_id)
        try:
            self._execute(query)
        except Exception as exc:  # noqa: BLE001
            # Last-ditch: if even sanitized error_details tripped something
            # (e.g. an exotic invalid-UTF-8 byte), fall back to an empty
            # error_details payload so the run-log row is at least written.
            # Losing the diagnostic is worse than losing the whole row.
            log.warning(
                "finish_run write failed, retrying without error_details: %s",
                str(exc).replace("\n", " ")[:200],
            )
            payload["error_details"] = None
            query = (
                self.client.table("scraping_runs").update(payload).eq("id", row_id)
            )
            self._execute(query)


def _chunks(seq: list[Any], size: int):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]
