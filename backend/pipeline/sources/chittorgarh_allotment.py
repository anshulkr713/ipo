"""Chittorgarh allotment directory — registrar names and their allotment-status pages."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from ..parse import canonical_slug, clean_text
from .base import Source, SourceResult

ALLOTMENT_URL = "https://www.chittorgarh.com/report/ipo-allotment-status-nse-bse-registrar/23/"


class ChittorgarhAllotment(Source):
    name = "chittorgarh_allotment"

    def run(self) -> SourceResult:
        result = SourceResult()
        self.http.warm_up("https://www.chittorgarh.com/")

        resp = self.http.get(ALLOTMENT_URL, referer="https://www.chittorgarh.com/")
        if resp is None or resp.status_code != 200:
            result.errors.append(f"{ALLOTMENT_URL} → {getattr(resp, 'status_code', 'no-response')}")
            result.status = "failed"
            return result

        soup = BeautifulSoup(resp.text, "html.parser")
        now_iso = datetime.now(timezone.utc).isoformat()
        rows: list[dict[str, Any]] = []

        for table in soup.find_all("table"):
            headers_text = " ".join(th.get_text(" ", strip=True).lower() for th in table.find_all("th"))
            if "registrar" not in headers_text and "allotment" not in headers_text:
                continue
            for tr in table.find_all("tr")[1:]:
                tds = tr.find_all("td")
                if len(tds) < 2:
                    continue
                name_cell = tds[0]
                name = clean_text(name_cell.get_text(" ", strip=True))
                if not name:
                    continue
                slug = canonical_slug(name)
                if not slug:
                    continue

                # Registrar name column and its link (second or third column).
                registrar_name = ""
                registrar_link = ""
                for cell in tds[1:]:
                    link = cell.find("a")
                    if link and link.get("href"):
                        href = link["href"]
                        if href.startswith("http"):
                            registrar_link = href
                        else:
                            registrar_link = f"https://www.chittorgarh.com{href}"
                        registrar_name = clean_text(link.get_text(" ", strip=True)) or registrar_name
                        break
                if not registrar_name:
                    registrar_name = clean_text(tds[1].get_text(" ", strip=True))

                rows.append(
                    {
                        "slug": slug,
                        "ipo_name": name,
                        "registrar": registrar_name or None,
                        "allotment_link": registrar_link or None,
                        "allotment_link_active": bool(registrar_link),
                        "last_scraped_at": now_iso,
                        "scrape_source": self.name,
                    }
                )

        result.records_found = len(rows)
        result.records_updated = self.db.upsert_ipos(rows)
        if result.records_updated == 0:
            result.status = "partial"
        return result
