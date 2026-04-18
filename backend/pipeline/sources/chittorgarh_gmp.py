"""Chittorgarh GMP (Grey Market Premium) — primary GMP source."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from ..parse import (
    canonical_slug,
    clean_text,
    parse_int,
    parse_number,
)
from ._diagnostics import classify_response, describe_failure, snippet
from .base import Source, SourceResult

GMP_URL = "https://www.chittorgarh.com/report/ipo-grey-market-premium-gmp-current-rate/83/"


class ChittorgarhGMP(Source):
    name = "chittorgarh_gmp"

    def run(self) -> SourceResult:
        result = SourceResult()
        self.http.warm_up("https://www.chittorgarh.com/")

        resp = self.http.get(GMP_URL, referer="https://www.chittorgarh.com/")
        if resp is None or resp.status_code != 200:
            result.errors.append(
                describe_failure(resp, url=GMP_URL, expected="GMP page")
            )
            result.status = "failed"
            return result

        tag = classify_response(resp)
        if tag != "ok":
            result.errors.append(f"{GMP_URL} → 200 [{tag}]: {snippet(resp)}")
            result.status = "failed"
            return result

        soup = BeautifulSoup(resp.text, "html.parser")
        target = None
        for table in soup.find_all("table"):
            header_text = " ".join(th.get_text(" ", strip=True).lower() for th in table.find_all("th"))
            if "gmp" in header_text:
                target = table
                break
        if target is None:
            result.status = "failed"
            result.errors.append(
                f"GMP table not found at {GMP_URL}: {snippet(resp)}"
            )
            return result

        header_cols = [th.get_text(" ", strip=True).lower() for th in target.find_all("th")]
        idx = _gmp_columns(header_cols)

        ipos_updates: list[dict[str, Any]] = []
        history_rows: list[dict[str, Any]] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for tr in target.find_all("tr")[1:]:
            tds = tr.find_all("td")
            if len(tds) < 3:
                continue
            name = clean_text(tds[idx.get("name", 0)].get_text(" ", strip=True))
            if not name:
                continue
            slug = canonical_slug(name)
            if not slug:
                continue

            issue_price = parse_number(_cell(tds, idx.get("price")))
            gmp_amount = parse_number(_cell(tds, idx.get("gmp")))
            kostak = parse_number(_cell(tds, idx.get("kostak")))
            subject = parse_number(_cell(tds, idx.get("subject")))

            gmp_pct: float | None = None
            if issue_price and issue_price > 0 and gmp_amount is not None:
                gmp_pct = round(gmp_amount / issue_price * 100, 2)

            expected_listing = None
            if issue_price is not None and gmp_amount is not None:
                expected_listing = issue_price + gmp_amount

            ipos_updates.append(
                {
                    "slug": slug,
                    "ipo_name": name,
                    "current_gmp": parse_int(str(gmp_amount)) if gmp_amount is not None else None,
                    "gmp_percentage": gmp_pct,
                    "kostak_rate": kostak,
                    "subject_rate": subject,
                    "last_scraped_at": now_iso,
                    "scrape_source": self.name,
                }
            )
            history_rows.append(
                {
                    "ipo_slug": slug,
                    "gmp_amount": gmp_amount,
                    "gmp_percentage": gmp_pct,
                    "kostak_rate": kostak,
                    "subject_rate": subject,
                    "issue_price": issue_price,
                    "expected_listing_price": expected_listing,
                    "source": self.name,
                }
            )

        result.records_found = len(ipos_updates)
        result.records_updated = self.db.upsert_ipos(ipos_updates)
        result.records_appended = self.db.append_gmp_history(history_rows)
        if result.records_updated == 0:
            result.status = "partial"
        return result


def _cell(tds, i):
    if i is None or i >= len(tds):
        return ""
    return clean_text(tds[i].get_text(" ", strip=True))


def _gmp_columns(headers: list[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, h in enumerate(headers):
        if "ipo" in h and "name" in h:
            out.setdefault("name", i)
        elif "gmp" in h and "%" not in h and "perc" not in h:
            out.setdefault("gmp", i)
        elif "price" in h or "issue price" in h:
            out.setdefault("price", i)
        elif "kostak" in h:
            out.setdefault("kostak", i)
        elif "subject" in h or "sauda" in h:
            out.setdefault("subject", i)
    # Fall back to positional layout if header parsing missed name.
    out.setdefault("name", 0)
    return out
