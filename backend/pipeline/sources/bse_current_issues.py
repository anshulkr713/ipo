"""BSE public IPO listing.

BSE serves a JSON endpoint that's less strict about cookies than NSE.
Used to catch IPOs that list on BSE but aren't yet on NSE.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import json
import re

from ..parse import (
    canonical_slug,
    detect_category,
    determine_status,
    parse_date,
    parse_int,
    parse_number,
)
from ._diagnostics import classify_response, describe_failure, snippet
from .base import Source, SourceResult

# BSE occasionally returns JSONP like `myCallback({...})`. Strip it.
_JSONP_RE = re.compile(r"^\s*[A-Za-z_$][\w$]*\s*\(\s*(.*?)\s*\)\s*;?\s*$", re.DOTALL)

BSE_ROOT = "https://www.bseindia.com/"
BSE_URL = (
    "https://api.bseindia.com/BseIndiaAPI/api/ddmcURLgetIPOonGoing/w"
    "?ddrnwMarket=&ddIssueStatus="
)


class BSECurrentIssues(Source):
    name = "bse_current_issues"
    expected_flaky = True  # BSE blocks GH Actions IPs — don't alarm on it.

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
            result.errors.append(
                describe_failure(resp, url=BSE_URL, expected="BSE IPO JSON")
            )
            result.status = "skipped"  # see `expected_flaky` above
            return result

        tag = classify_response(resp)
        if tag != "ok":
            result.errors.append(f"{BSE_URL} → 200 [{tag}]: {snippet(resp)}")
            result.status = "skipped"
            return result

        payload = _decode_bse_json(resp.text)
        if payload is None:
            result.errors.append(
                f"{BSE_URL} → 200 [non-json]: {snippet(resp)}"
            )
            result.status = "skipped"
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


def _decode_bse_json(text: str):
    """BSE's endpoint sometimes returns bare JSON, sometimes JSONP, and
    when the edge blocks us it returns HTML. Return the decoded object,
    or None if we can't find valid JSON anywhere in the body."""
    if not text:
        return None
    stripped = text.strip()
    # Bare JSON
    try:
        return json.loads(stripped)
    except ValueError:
        pass
    # JSONP callback wrapper
    m = _JSONP_RE.match(stripped)
    if m:
        try:
            return json.loads(m.group(1))
        except ValueError:
            pass
    # HTML / challenge — give up, caller will log the snippet.
    return None
