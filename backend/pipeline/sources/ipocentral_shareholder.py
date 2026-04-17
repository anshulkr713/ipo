"""IPO Central — shareholder quota and reservation breakdown.

This site publishes per-IPO reservation tables (retail / NII / QIB /
employee / shareholder) which Chittorgarh sometimes omits. We use it as
an enrichment pass: any IPO not found here is simply skipped.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from ..parse import canonical_slug, clean_text, parse_number
from .base import Source, SourceResult

LIST_URL = "https://ipocentral.in/ipo-calendar/"


class IPOCentralShareholder(Source):
    name = "ipocentral_shareholder"

    def run(self) -> SourceResult:
        result = SourceResult()
        self.http.warm_up("https://ipocentral.in/")

        resp = self.http.get(LIST_URL, referer="https://ipocentral.in/")
        if resp is None or resp.status_code != 200:
            result.errors.append(f"{LIST_URL} → {getattr(resp, 'status_code', 'no-response')}")
            result.status = "failed"
            return result

        soup = BeautifulSoup(resp.text, "html.parser")
        active = self.db.fetch_active_slugs()
        now_iso = datetime.now(timezone.utc).isoformat()
        rows: list[dict[str, Any]] = []

        for table in soup.find_all("table"):
            header_text = " ".join(
                th.get_text(" ", strip=True).lower() for th in table.find_all("th")
            )
            if "ipo" not in header_text:
                continue
            header_cols = [th.get_text(" ", strip=True).lower() for th in table.find_all("th")]
            idx = _columns(header_cols)
            if idx.get("name") is None:
                continue

            for tr in table.find_all("tr")[1:]:
                tds = tr.find_all("td")
                if len(tds) < 2:
                    continue
                name = clean_text(tds[idx["name"]].get_text(" ", strip=True))
                if not name:
                    continue
                slug = canonical_slug(name)
                if not slug:
                    continue
                # Only enrich IPOs we already track — don't discover new ones here.
                if active and slug not in active:
                    continue

                row: dict[str, Any] = {
                    "slug": slug,
                    "ipo_name": name,
                    "last_scraped_at": now_iso,
                    "scrape_source": self.name,
                }

                size = parse_number(_cell(tds, idx.get("issue_size")))
                if size is not None:
                    row["issue_size_cr"] = size

                # Reservation breakdown → stored in the reservations JSONB.
                reservations: list[dict[str, Any]] = []
                for key in ("qib", "nii", "retail", "employee", "shareholder"):
                    cell = _cell(tds, idx.get(key))
                    if not cell:
                        continue
                    reservations.append({"category": key.upper(), "allocation": cell})
                if reservations:
                    row["reservations"] = reservations

                if len(row) > 4:
                    rows.append(row)

        if not rows:
            result.status = "partial"
            return result

        result.records_found = len(rows)
        result.records_updated = self.db.upsert_ipos(rows)
        if result.records_updated == 0:
            result.status = "partial"
        return result


def _cell(tds, i):
    if i is None or i >= len(tds):
        return ""
    return clean_text(tds[i].get_text(" ", strip=True))


def _columns(headers: list[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, h in enumerate(headers):
        if "ipo" in h and ("name" in h or "company" in h):
            out.setdefault("name", i)
        elif "issue size" in h or "size" in h:
            out.setdefault("issue_size", i)
        elif "qib" in h:
            out.setdefault("qib", i)
        elif "nii" in h or "hni" in h:
            out.setdefault("nii", i)
        elif "retail" in h:
            out.setdefault("retail", i)
        elif "employee" in h:
            out.setdefault("employee", i)
        elif "shareholder" in h:
            out.setdefault("shareholder", i)
    return out
