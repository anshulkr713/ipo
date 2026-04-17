"""Supabase writer layer. One client per pipeline run."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Iterable, Optional

from supabase import Client, create_client

from .config import Settings
from .logger import get_logger

log = get_logger("pipeline.db")


class Database:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client: Client = create_client(settings.supabase_url, settings.supabase_key)
        self.run_id: uuid.UUID = uuid.uuid4()

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
            {k: v for k, v in row.items() if v is not None}
            for row in rows
            if row.get("slug")
        ]
        sent = 0
        for chunk in _chunks(cleaned, self.settings.upload_chunk_size):
            self.client.table("ipos").upsert(chunk, on_conflict="slug").execute()
            sent += len(chunk)
        log.info("upserted ipos", extra={"records": sent})
        return sent

    def fetch_ipos_missing_detail(self, limit: int) -> list[dict[str, Any]]:
        """Candidates for the detail scraper: have a cached detail_url and
        haven't had their financials populated yet (or were last scraped >7d ago).
        Prioritise recently-opened IPOs."""
        resp = (
            self.client.table("ipos")
            .select(
                "slug, ipo_name, company_name, category, status, "
                "detail_url, open_date, last_scraped_at"
            )
            .not_.is_("detail_url", "null")
            .in_("status", ["upcoming", "open", "closed", "listed"])
            .order("open_date", desc=True)
            .limit(limit)
            .execute()
        )
        return resp.data or []

    def fetch_active_slugs(self) -> set[str]:
        resp = (
            self.client.table("ipos")
            .select("slug")
            .in_("status", ["upcoming", "open", "closed"])
            .execute()
        )
        return {row["slug"] for row in (resp.data or []) if row.get("slug")}

    def fetch_ipos_for_calendar(self) -> list[dict[str, Any]]:
        """Pulls the date fields needed to derive timeline_events JSONB."""
        resp = (
            self.client.table("ipos")
            .select(
                "slug, drhp_filed_date, rhp_filed_date, sebi_approval_date, "
                "open_date, close_date, allotment_date, refund_date, "
                "demat_credit_date, listing_date"
            )
            .in_("status", ["upcoming", "open", "closed", "listed"])
            .execute()
        )
        return resp.data or []

    # -------------------------------------------------------------- #
    # history tables (append-only)
    # -------------------------------------------------------------- #

    def append_gmp_history(self, rows: list[dict[str, Any]]) -> int:
        return self._append("gmp_history", rows)

    def append_subscription_history(self, rows: list[dict[str, Any]]) -> int:
        return self._append("subscription_history", rows)

    def _append(self, table: str, rows: Iterable[dict[str, Any]]) -> int:
        items = [r for r in rows if r.get("ipo_slug")]
        if not items:
            return 0
        sent = 0
        for chunk in _chunks(items, self.settings.upload_chunk_size):
            self.client.table(table).insert(chunk).execute()
            sent += len(chunk)
        log.info("appended history", extra={"records": sent, "source": table})
        return sent

    # -------------------------------------------------------------- #
    # scraping_runs
    # -------------------------------------------------------------- #

    def start_run(self, source: str) -> int:
        resp = (
            self.client.table("scraping_runs")
            .insert(
                {
                    "run_id": str(self.run_id),
                    "source": source,
                    "status": "running",
                    "started_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .execute()
        )
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
        self.client.table("scraping_runs").update(
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
        ).eq("id", row_id).execute()


def _chunks(seq: list[Any], size: int):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]
