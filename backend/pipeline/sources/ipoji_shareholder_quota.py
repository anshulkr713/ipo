"""Ipoji shareholder-quota list — upcoming IPOs that reserve a quota for
parent-company shareholders.

Tags rows in `ipos` with `shareholder_quota=True` + `parent_company`.
The frontend uses this to surface the "hold these shares to get
shareholder quota" filter on the upcoming-IPO list.

Page has two tables; we read only the primary one (3 cols: Subsidiary
IPO Name / Parent Company / SEBI IPO Status). Table 2 is a shorter
repeat that's already a subset of table 1.

Upsert-only. We never create new IPO rows here — the slug must already
exist in `ipos` (seeded by chittorgarh_dashboard or niftytrader_calendar).
If not, we just log the miss and move on; otherwise we'd insert
half-empty rows that trip NOT NULL on ipo_name when the upcoming IPO
isn't yet tracked by any dashboard source.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from ..parse import canonical_slug, clean_text
from .base import Source, SourceResult

URL = "https://www.ipoji.com/blog/upcoming-ipos-with-shareholders-quota-in-2026/"

# Strip parenthetical aliases ipoji routinely appends: "Bharat Coking
# Coal Limited (BCCL)" → "Bharat Coking Coal Limited". Without this,
# the slug becomes "bharat-coking-coal-bccl" and never matches the
# chittorgarh/niftytrader upsert.
_PAREN_ALIAS_RE = re.compile(r"\s*\([^)]*\)\s*")

# Some rows have a "*" marker meaning "planned but not filed yet".
# Drop trailing asterisks before slugging.
_TRAILING_STAR_RE = re.compile(r"\s*\*+\s*$")


class IpojiShareholderQuota(Source):
    name = "ipoji_shareholder_quota"

    def run(self) -> SourceResult:
        result = SourceResult()
        self.http.warm_up("https://www.ipoji.com/")

        resp = self.http.get(URL, referer="https://www.ipoji.com/")
        if resp is None or resp.status_code != 200:
            result.status = "failed"
            result.errors.append(
                f"{URL} → {getattr(resp, 'status_code', 'no-response')}"
            )
            return result

        soup = BeautifulSoup(resp.text, "html.parser")
        target = None
        for table in soup.find_all("table"):
            headers = " ".join(
                th.get_text(" ", strip=True).lower() for th in table.find_all("th")
            )
            if "subsidiary" in headers and "parent" in headers:
                target = table
                break
        if target is None:
            result.status = "failed"
            result.errors.append(
                f"no subsidiary/parent table at {URL} "
                f"(tables found: {len(soup.find_all('table'))})"
            )
            return result

        active_slugs = self.db.fetch_active_slugs()
        now_iso = datetime.now(timezone.utc).isoformat()

        updated_count = 0
        skipped_unknown = 0

        for tr in target.find_all("tr")[1:]:
            tds = tr.find_all("td")
            if len(tds) < 2:
                continue
            raw = clean_text(tds[0].get_text(" ", strip=True))
            parent = clean_text(tds[1].get_text(" ", strip=True))
            if not raw or not parent:
                continue

            name = _clean_name(raw)
            slug = canonical_slug(name)
            if not slug:
                continue

            # Only enrich rows the dashboard sources have already created.
            # Inserting from a rumours list risks half-empty rows that
            # break NOT NULL constraints downstream.
            if slug not in active_slugs:
                skipped_unknown += 1
                continue

            updated = self.db.update_ipo_by_slug(
                slug,
                {
                    "shareholder_quota": True,
                    "parent_company": parent,
                    "last_scraped_at": now_iso,
                    "scrape_source": self.name,
                },
            )
            updated_count += updated

        result.records_found = updated_count + skipped_unknown
        result.records_updated = updated_count
        if skipped_unknown:
            self.log.info(
                "skipped unknown slugs",
                extra={"source": self.name, "count": skipped_unknown},
            )
        if updated_count == 0:
            result.status = "partial"
        return result


def _clean_name(raw: str) -> str:
    out = _PAREN_ALIAS_RE.sub(" ", raw)
    out = _TRAILING_STAR_RE.sub("", out)
    return clean_text(out)
