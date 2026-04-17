"""NSE Official API — current IPO issues.

The NSE API requires a prior hit on the root page to set cookies, otherwise
subsequent JSON calls come back 401.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from ..parse import (
    canonical_slug,
    detect_category,
    determine_status,
    parse_date,
    parse_int,
    parse_number,
)
from .base import Source, SourceResult

NSE_ROOT = "https://www.nseindia.com/"
NSE_URL = "https://www.nseindia.com/api/ipo-current-issues"


class NSECurrentIssues(Source):
    name = "nse_current_issues"

    def run(self) -> SourceResult:
        result = SourceResult()
        # Warm up twice — NSE assigns cookies on first hit but fully clears
        # bot flags only after a second page view.
        self.http.warm_up(NSE_ROOT)
        self.http.warm_up(NSE_ROOT + "market-data/new-stock-exchange-listings-recent")

        resp = self.http.get(NSE_URL, referer=NSE_ROOT, accept_json=True)
        if resp is None or resp.status_code != 200:
            result.errors.append(f"{NSE_URL} → {getattr(resp, 'status_code', 'no-response')}")
            result.status = "failed"
            return result

        try:
            payload = resp.json()
        except ValueError as exc:
            result.errors.append(f"json decode failed: {exc}")
            result.status = "failed"
            return result

        items = payload.get("data") if isinstance(payload, dict) else payload
        if not isinstance(items, list):
            result.status = "failed"
            result.errors.append("unexpected payload shape")
            return result

        now_iso = datetime.now(timezone.utc).isoformat()
        rows: list[dict[str, Any]] = []

        for item in items:
            name: str = (item.get("companyName") or item.get("symbol") or "").strip()
            if not name:
                continue
            slug = canonical_slug(name)
            if not slug:
                continue

            open_date = parse_date(item.get("issueStartDate"))
            close_date = parse_date(item.get("issueEndDate"))
            listing_date = parse_date(item.get("listingDate"))

            rows.append(
                {
                    "slug": slug,
                    "ipo_name": f"{name} IPO",
                    "company_name": name,
                    "category": detect_category(name, item.get("series", "")),
                    "issue_size_cr": parse_number(item.get("issueSize")),
                    "min_price": parse_int(item.get("priceRangeMin") or item.get("minPrice")),
                    "max_price": parse_int(item.get("priceRangeMax") or item.get("maxPrice")),
                    "lot_size": parse_int(item.get("lotSize") or item.get("marketLot")) or 1,
                    "open_date": open_date,
                    "close_date": close_date,
                    "listing_date": listing_date,
                    "status": determine_status(open_date, close_date, listing_date),
                    "exchange": ["NSE"],
                    "last_scraped_at": now_iso,
                    "scrape_source": self.name,
                }
            )

        result.records_found = len(rows)
        result.records_updated = self.db.upsert_ipos(rows)
        if result.records_updated == 0:
            result.status = "partial"
        return result
