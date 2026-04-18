"""Niftytrader IPO calendar — JSON API (no rendering needed).

The niftytrader.in/ipo/calendar page fetches its data client-side from
`https://webapi.niftytrader.in/webapi/Ipo/ipo-company-list`, which
returns a clean JSON list of ~500 IPOs (every mainboard/SME IPO in
their database — historical + upcoming + open). We hit that endpoint
directly to avoid booting Chromium for a plain JSON read.

Fields we read per record:
    slug_url, ipo_name, company_name, type ("SME"|"Mainboard"),
    ipo_category ("Upcoming"|"Open"|"Closed"|"Listed"),
    start_date, end_date, listing_date,
    lot_size, minimum_price, maximum_price,
    total_issue_price ("₹27.56 Cr"), listing_price, last_trade_price.

We canonicalise the slug ourselves (via canonical_slug on ipo_name) so
rows merge with Chittorgarh's upserts — niftytrader's slug_url
contains a trailing "-ipo" token our slug stripper drops.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from ..parse import (
    canonical_slug,
    clean_text,
    detect_category,
    determine_status,
    parse_date,
    parse_int,
    parse_number,
)
from .base import Source, SourceResult

API_URL = "https://webapi.niftytrader.in/webapi/Ipo/ipo-company-list"
REFERER = "https://www.niftytrader.in/ipo/calendar"

# Niftytrader uses its own category vocabulary ("Current", "Recent",
# "Closed"). We prefer date-derived status via determine_status() and
# use the API label only as a tie-breaker when dates are missing.
_STATUS_MAP = {
    "upcoming": "upcoming",
    "open": "open",
    "current": "open",
    "closed": "closed",
    "listed": "listed",
    "recent": "listed",
}


class NiftytraderCalendar(Source):
    name = "niftytrader_calendar"

    def run(self) -> SourceResult:
        result = SourceResult()

        self.http.warm_up("https://www.niftytrader.in/")
        resp = self.http.get(API_URL, referer=REFERER)
        if resp is None or resp.status_code != 200:
            result.status = "failed"
            result.errors.append(
                f"{API_URL} → {getattr(resp, 'status_code', 'no-response')}"
            )
            return result

        try:
            payload = resp.json()
        except ValueError as exc:
            result.status = "failed"
            result.errors.append(
                f"niftytrader returned non-JSON ({exc}); first 240 chars: "
                f"{resp.text[:240]!r}"
            )
            return result

        records = payload.get("resultData") if isinstance(payload, dict) else None
        if not isinstance(records, list):
            result.status = "failed"
            result.errors.append(
                f"unexpected payload shape: keys={list(payload.keys()) if isinstance(payload, dict) else type(payload)}"
            )
            return result

        now_iso = datetime.now(timezone.utc).isoformat()
        ipos_updates: list[dict[str, Any]] = []

        for rec in records:
            if not isinstance(rec, dict):
                continue
            raw_name = clean_text(rec.get("ipo_name") or rec.get("company_name") or "")
            if not raw_name:
                continue
            slug = canonical_slug(raw_name)
            if not slug:
                continue

            row: dict[str, Any] = {
                "slug": slug,
                "ipo_name": raw_name,
                "company_name": clean_text(
                    rec.get("company_name") or raw_name
                ).replace(" IPO", "").strip() or raw_name,
                "category": _category(rec.get("type"), raw_name),
                "last_scraped_at": now_iso,
                "scrape_source": self.name,
            }

            open_date = _iso_date(rec.get("start_date"))
            close_date = _iso_date(rec.get("end_date"))
            listing_date = _iso_date(rec.get("listing_date"))
            if open_date:
                row["open_date"] = open_date
            if close_date:
                row["close_date"] = close_date
            if listing_date:
                row["listing_date"] = listing_date

            # Prefer date-derived status — niftytrader tags 98% of rows
            # "Closed" regardless of actual listing state, so their label
            # is an unreliable primary signal. Fall back to the label
            # only when we have no dates at all.
            if open_date or close_date or listing_date:
                row["status"] = determine_status(open_date, close_date, listing_date)
            else:
                label = _STATUS_MAP.get(
                    clean_text(rec.get("ipo_category") or "").lower()
                )
                if label:
                    row["status"] = label

            # min_price / max_price are INT columns (Indian IPO bands are
            # always whole-rupee). niftytrader returns floats like 115.0,
            # which PostgREST rejects with "22P02 invalid input syntax
            # for type integer". Cast after null/zero filtering.
            lo = _positive_number(rec.get("minimum_price"))
            hi = _positive_number(rec.get("maximum_price"))
            if lo is not None:
                row["min_price"] = int(round(lo))
            if hi is not None:
                row["max_price"] = int(round(hi))

            # lot_size is NOT NULL on `ipos`. Old/SME IPOs occasionally
            # have a 0 or missing lot in the API; fall back to 1 so the
            # INSERT path (new slug) doesn't trip 23502. Chittorgarh's
            # dashboard source uses the same `or 1` fallback.
            row["lot_size"] = parse_int(str(rec.get("lot_size") or "")) or 1

            if issue_size := parse_number(rec.get("total_issue_price")):
                row["issue_size_cr"] = issue_size

            # Post-listing enrichment: niftytrader publishes an actual
            # listing price once the IPO lists. Zero means "not yet
            # listed" — the frontend treats 0 as a data bug, so write
            # only when we have a real number.
            listing_price = _positive_number(rec.get("listing_price"))
            if listing_price is not None:
                row["actual_listing_price"] = listing_price
                if lo is not None and lo > 0:
                    row["listing_gain_percent"] = round(
                        (listing_price - lo) / lo * 100, 2
                    )

            # Niftytrader's per-IPO page uses the slug_url they assign.
            # Cache it — a later per-IPO source can use it without
            # re-hitting the calendar.
            if slug_url := clean_text(rec.get("slug_url") or ""):
                row["detail_url"] = f"https://www.niftytrader.in/ipo/{slug_url}"

            ipos_updates.append(row)

        result.records_found = len(ipos_updates)
        result.records_updated = self.db.upsert_ipos(ipos_updates)
        if result.records_updated == 0:
            result.status = "partial"
        return result


def _iso_date(value: Any) -> str | None:
    """Take an API date ('2025-07-09T00:00:00' or similar) → 'YYYY-MM-DD'."""
    if not value:
        return None
    s = str(value)
    # Niftytrader consistently returns ISO with time; slicing is cheap
    # and avoids parse_date's full format-rotation for a known shape.
    if len(s) >= 10 and s[4] == "-" and s[7] == "-":
        return s[:10]
    return parse_date(s)


def _positive_number(value: Any) -> float | None:
    n = parse_number(str(value)) if value is not None else None
    if n is None or n <= 0:
        return None
    return n


def _category(type_value: Any, name: str) -> str:
    t = clean_text(str(type_value or "")).lower()
    if "sme" in t:
        return "SME"
    if "main" in t:
        return "Mainboard"
    return detect_category(name)
