"""DRHP / RHP tracker — feeds the "early stage" pipeline so we know what's
coming before the IPO dates are out.

Uses Chittorgarh's DRHP and RHP listing pages.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from ..parse import canonical_slug, clean_text, parse_date, parse_number
from .base import Source, SourceResult

SOURCES = (
    # (URL, document kind)
    ("https://www.chittorgarh.com/report/drhp-ipo-filings-list/71/", "drhp"),
    ("https://www.chittorgarh.com/report/rhp-list-india/72/", "rhp"),
)


class ChittorgarhDRHP(Source):
    name = "chittorgarh_drhp"

    def run(self) -> SourceResult:
        result = SourceResult()
        self.http.warm_up("https://www.chittorgarh.com/")
        all_rows: dict[str, dict[str, Any]] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        for url, kind in SOURCES:
            resp = self.http.get(url, referer="https://www.chittorgarh.com/")
            if resp is None or resp.status_code != 200:
                result.errors.append(f"{url} → {getattr(resp, 'status_code', 'no-response')}")
                continue
            self._parse_table(resp.text, kind, all_rows, now_iso)

        if not all_rows:
            result.status = "failed"
            return result

        result.records_found = len(all_rows)
        result.records_updated = self.db.upsert_ipos(list(all_rows.values()))
        if result.records_updated == 0:
            result.status = "partial"
        return result

    def _parse_table(
        self,
        html: str,
        kind: str,
        rows: dict[str, dict[str, Any]],
        now_iso: str,
    ) -> None:
        soup = BeautifulSoup(html, "html.parser")
        for table in soup.find_all("table"):
            headers = [th.get_text(" ", strip=True).lower() for th in table.find_all("th")]
            if not headers or "name" not in " ".join(headers):
                continue
            col = _columns(headers)
            for tr in table.find_all("tr")[1:]:
                tds = tr.find_all("td")
                if len(tds) < 2:
                    continue
                name = clean_text(tds[col.get("name", 0)].get_text(" ", strip=True))
                if not name:
                    continue
                slug = canonical_slug(name)
                if not slug:
                    continue

                filed_date = parse_date(_cell(tds, col.get("filed")))
                issue_size = parse_number(_cell(tds, col.get("issue_size")))
                industry = _cell(tds, col.get("industry"))

                row = rows.setdefault(
                    slug,
                    {
                        "slug": slug,
                        "ipo_name": name,
                        "company_name": name.replace(" IPO", "").strip(),
                        "last_scraped_at": now_iso,
                        "scrape_source": self.name,
                    },
                )

                if kind == "drhp":
                    row["drhp_status"] = "filed"
                    if filed_date:
                        row["drhp_filed_date"] = filed_date
                else:
                    row["rhp_status"] = "filed"
                    if filed_date:
                        row["rhp_filed_date"] = filed_date

                if issue_size is not None and not row.get("issue_size_cr"):
                    row["issue_size_cr"] = issue_size
                if industry and not row.get("industry_sector"):
                    row["industry_sector"] = industry


def _cell(tds, i):
    if i is None or i >= len(tds):
        return ""
    return clean_text(tds[i].get_text(" ", strip=True))


def _columns(headers: list[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, h in enumerate(headers):
        if "name" in h or "issuer" in h or "company" in h:
            out.setdefault("name", i)
        elif "filed" in h or "date" in h:
            out.setdefault("filed", i)
        elif "issue size" in h or "size" in h:
            out.setdefault("issue_size", i)
        elif "industry" in h or "sector" in h:
            out.setdefault("industry", i)
    return out
