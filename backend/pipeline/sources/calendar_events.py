"""Derives the `timeline_events` JSONB column from the dates already on
each IPO row. Makes no network calls — this is a tidy-up source that
turns scattered date columns into a consistent ordered timeline the
detail page can render as-is.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from .base import Source, SourceResult


# The order here is the natural chronological order; we sort by date
# once populated, and fall back to this order when dates are missing.
_EVENT_FIELDS: tuple[tuple[str, str], ...] = (
    ("drhp_filed_date", "DRHP Filed"),
    ("sebi_approval_date", "SEBI Approval"),
    ("rhp_filed_date", "RHP Filed"),
    ("open_date", "Issue Opens"),
    ("close_date", "Issue Closes"),
    ("allotment_date", "Basis of Allotment"),
    ("refund_date", "Initiation of Refunds"),
    ("demat_credit_date", "Credit to Demat"),
    ("listing_date", "Listing Date"),
)


class CalendarEvents(Source):
    name = "calendar_events"

    def run(self) -> SourceResult:
        result = SourceResult()
        ipos = self.db.fetch_ipos_for_calendar()
        if not ipos:
            result.status = "skipped"
            return result

        today = datetime.now(timezone.utc).date().isoformat()

        # Update in place — do NOT upsert. Calendar events only has
        # {slug, timeline_events}, so an upsert that missed the slug
        # conflict target would trip NOT NULL on ipo_name for a brand-new
        # row. `.update().eq("slug", …)` can only modify existing rows.
        updated = 0
        for ipo in ipos:
            slug = ipo.get("slug")
            if not slug:
                continue
            events = _build_events(ipo, today)
            if not events:
                continue
            n = self.db.update_ipo_by_slug(slug, {"timeline_events": events})
            if n > 0:
                updated += 1
            result.records_found += 1

        if result.records_found == 0:
            result.status = "skipped"
            return result

        result.records_updated = updated
        return result


def _build_events(ipo: dict[str, Any], today: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for field, label in _EVENT_FIELDS:
        date_str: Optional[str] = ipo.get(field)
        if not date_str:
            continue
        status = "done" if date_str <= today else "pending"
        out.append(
            {
                "event": label,
                "date": date_str,
                "status": status,
                "source_field": field,
            }
        )
    out.sort(key=lambda e: e["date"])
    return out
