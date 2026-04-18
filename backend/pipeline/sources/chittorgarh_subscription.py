"""Chittorgarh live subscription status."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from ..parse import canonical_slug, clean_text, parse_number
from ._diagnostics import body_hints, classify_response, describe_failure, snippet
from .base import Source, SourceResult

SUB_URL = "https://www.chittorgarh.com/report/ipo-subscription-status-live-bidding-data-bse-nse/21/"


class ChittorgarhSubscription(Source):
    name = "chittorgarh_subscription"

    def run(self) -> SourceResult:
        result = SourceResult()
        self.http.warm_up("https://www.chittorgarh.com/")

        resp = self.http.get(SUB_URL, referer="https://www.chittorgarh.com/")
        if resp is None or resp.status_code != 200:
            result.errors.append(
                describe_failure(resp, url=SUB_URL, expected="subscription page")
            )
            result.status = "failed"
            return result

        tag = classify_response(resp)
        if tag != "ok":
            result.errors.append(
                f"{SUB_URL} → 200 [{tag}] {body_hints(resp)}: {snippet(resp)}"
            )
            result.status = "failed"
            return result

        soup = BeautifulSoup(resp.text, "html.parser")
        target = None
        for table in soup.find_all("table"):
            header_text = " ".join(th.get_text(" ", strip=True).lower() for th in table.find_all("th"))
            if "qib" in header_text and "retail" in header_text:
                target = table
                break
        if target is None:
            result.status = "failed"
            result.errors.append(
                f"subscription table not found at {SUB_URL} [{body_hints(resp)}]: {snippet(resp)}"
            )
            return result

        header_cols = [th.get_text(" ", strip=True).lower() for th in target.find_all("th")]
        idx = _sub_columns(header_cols)

        ipos_updates: list[dict[str, Any]] = []
        history_rows: list[dict[str, Any]] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for tr in target.find_all("tr")[1:]:
            tds = tr.find_all("td")
            if len(tds) < 4:
                continue
            name = clean_text(tds[idx.get("name", 0)].get_text(" ", strip=True))
            if not name:
                continue
            slug = canonical_slug(name)
            if not slug:
                continue

            qib = parse_number(_cell(tds, idx.get("qib")))
            nii = parse_number(_cell(tds, idx.get("nii")))
            bnii = parse_number(_cell(tds, idx.get("bnii")))
            snii = parse_number(_cell(tds, idx.get("snii")))
            retail = parse_number(_cell(tds, idx.get("retail")))
            employee = parse_number(_cell(tds, idx.get("employee")))
            shareholder = parse_number(_cell(tds, idx.get("shareholder")))
            total = parse_number(_cell(tds, idx.get("total")))

            ipos_updates.append(
                {
                    "slug": slug,
                    "ipo_name": name,
                    "subscription_retail": retail,
                    "subscription_nii": nii,
                    "subscription_bnii": bnii,
                    "subscription_qib": qib,
                    "subscription_employee": employee,
                    "subscription_shareholder": shareholder,
                    "subscription_total": total,
                    "last_scraped_at": now_iso,
                    "scrape_source": self.name,
                }
            )
            history_rows.append(
                {
                    "ipo_slug": slug,
                    "subscription_retail": retail,
                    "subscription_nii": nii,
                    "subscription_bnii": bnii,
                    "subscription_snii": snii,
                    "subscription_qib": qib,
                    "subscription_employee": employee,
                    "subscription_shareholder": shareholder,
                    "subscription_total": total,
                    "source": self.name,
                }
            )

        result.records_found = len(ipos_updates)
        result.records_updated = self.db.upsert_ipos(ipos_updates)
        result.records_appended = self.db.append_subscription_history(history_rows)
        if result.records_updated == 0:
            result.status = "partial"
        return result


def _cell(tds, i):
    if i is None or i >= len(tds):
        return ""
    return clean_text(tds[i].get_text(" ", strip=True))


def _sub_columns(headers: list[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, h in enumerate(headers):
        if "ipo" in h and "name" in h:
            out.setdefault("name", i)
        elif "qib" in h:
            out.setdefault("qib", i)
        elif "bnii" in h or "b-nii" in h or "> 10" in h or "bhni" in h:
            out.setdefault("bnii", i)
        elif "snii" in h or "s-nii" in h or "< 10" in h or "shni" in h:
            out.setdefault("snii", i)
        elif "nii" in h:
            out.setdefault("nii", i)
        elif "retail" in h:
            out.setdefault("retail", i)
        elif "employee" in h or "emp" in h:
            out.setdefault("employee", i)
        elif "shareholder" in h:
            out.setdefault("shareholder", i)
        elif "total" in h:
            out.setdefault("total", i)
    out.setdefault("name", 0)
    return out
