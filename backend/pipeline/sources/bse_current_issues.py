"""BSE public IPO listing.

BSE serves a JSON endpoint that's less strict about cookies than NSE.
Used to catch IPOs that list on BSE but aren't yet on NSE.
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

BSE_ROOT = "https://www.bseindia.com/"
BSE_URL = (
    "https://api.bseindia.com/BseIndiaAPI/api/ddmcURLgetIPOonGoing/w"
    "?ddrnwMarket=&ddIssueStatus="
)


class BSECurrentIssues(Source):
    name = "bse_current_issues"

    def run(self) -> SourceResult:
        result = SourceResult()
        self.http.warm_up(BSE_ROOT)

        resp = self.http.get(
            BSE_URL,
            referer="https://www.bseindia.com/publicissue.html",
            accept_json=True,
            extra_headers={"Origin": "https://www.bseindia.com"},
        )
        if resp is None or resp.status_code != 200:
            result.errors.append(f"{BSE_URL} → {getattr(resp, 'status_code', 'no-response')}")
            result.status = "failed"
            return result

        try:
            payload = resp.json()
        except ValueError as exc:
            result.errors.append(f"json decode failed: {exc}")
            result.status = "failed"
            return result

        items: list[dict[str, Any]] = payload if isinstance(payload, list) else payload.get("Table") or []
        if not items:
            result.status = "partial"
            return result

        now_iso = datetime.now(timezone.utc).isoformat()
        rows: list[dict[str, Any]] = []

        for item in items:
            name = (item.get("Issuer_Name") or item.get("CompanyName") or "").strip()
            if not name:
                continue
            slug = canonical_slug(name)
            if not slug:
                continue

            open_date = parse_date(item.get("Issue_Open_Date") or item.get("IssueOpenDate"))
            close_date = parse_date(item.get("Issue_Close_Date") or item.get("IssueCloseDate"))
            listing_date = parse_date(item.get("Listing_Date"))

            price_hi = parse_int(item.get("Issue_Price_High") or item.get("PriceHigh"))
            price_lo = parse_int(item.get("Issue_Price_Low") or item.get("PriceLow"))

            rows.append(
                {
                    "slug": slug,
                    "ipo_name": f"{name} IPO",
                    "company_name": name,
                    "category": detect_category(name, item.get("Market", "")),
                    "issue_size_cr": parse_number(item.get("Issue_Size")),
                    "min_price": price_lo,
                    "max_price": price_hi,
                    "lot_size": parse_int(item.get("Market_Lot")) or 1,
                    "face_value": parse_number(item.get("Face_Value")),
                    "open_date": open_date,
                    "close_date": close_date,
                    "listing_date": listing_date,
                    "status": determine_status(open_date, close_date, listing_date),
                    "exchange": ["BSE"],
                    "last_scraped_at": now_iso,
                    "scrape_source": self.name,
                }
            )

        result.records_found = len(rows)
        result.records_updated = self.db.upsert_ipos(rows)
        if result.records_updated == 0:
            result.status = "partial"
        return result
