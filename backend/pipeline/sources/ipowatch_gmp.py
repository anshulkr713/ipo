"""IPOWatch GMP — secondary GMP source.

Used as a cross-check; writes to gmp_history with source=ipowatch_gmp but
only updates ipos if Chittorgarh hasn't written a fresher row this run.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from ..parse import canonical_slug, clean_text, parse_number
from .base import Source, SourceResult

IPOWATCH_URL = "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/"

_PERCENT_RE = re.compile(r"\(([-+\d.]+)\s*%\)")


class IPOWatchGMP(Source):
    name = "ipowatch_gmp"

    def run(self) -> SourceResult:
        result = SourceResult()
        self.http.warm_up("https://ipowatch.in/")

        resp = self.http.get(IPOWATCH_URL, referer="https://ipowatch.in/")
        if resp is None or resp.status_code != 200:
            result.errors.append(f"{IPOWATCH_URL} → {getattr(resp, 'status_code', 'no-response')}")
            result.status = "failed"
            return result

        soup = BeautifulSoup(resp.text, "html.parser")
        tables = soup.find_all("table")
        if not tables:
            result.status = "failed"
            result.errors.append("no tables found")
            return result
        target = tables[0]

        history: list[dict[str, Any]] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for tr in target.find_all("tr")[1:]:
            tds = tr.find_all("td")
            if len(tds) < 2:
                continue
            name = clean_text(tds[0].get_text(" ", strip=True))
            if not name:
                continue
            slug = canonical_slug(name)
            if not slug:
                continue

            gmp_text = clean_text(tds[1].get_text(" ", strip=True))
            price_text = clean_text(tds[2].get_text(" ", strip=True)) if len(tds) > 2 else ""

            gmp_amount = parse_number(gmp_text.split("(")[0])
            issue_price = parse_number(price_text)

            pct_match = _PERCENT_RE.search(gmp_text)
            pct = float(pct_match.group(1)) if pct_match else None
            if pct is None and issue_price and issue_price > 0 and gmp_amount is not None:
                pct = round(gmp_amount / issue_price * 100, 2)

            expected_listing = None
            if issue_price is not None and gmp_amount is not None:
                expected_listing = issue_price + gmp_amount

            history.append(
                {
                    "ipo_slug": slug,
                    "gmp_amount": gmp_amount,
                    "gmp_percentage": pct,
                    "issue_price": issue_price,
                    "expected_listing_price": expected_listing,
                    "source": self.name,
                }
            )

        result.records_found = len(history)
        result.records_appended = self.db.append_gmp_history(history)
        if result.records_found == 0:
            result.status = "partial"
        return result
