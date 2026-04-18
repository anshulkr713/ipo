"""Chittorgarh IPO dashboard — upcoming/open/closed IPOs with dates & price bands."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from ..parse import (
    canonical_slug,
    clean_text,
    detect_category,
    determine_status,
    parse_date,
    parse_int,
    parse_number,
    parse_price_band,
)
from ._diagnostics import classify_response, describe_failure, snippet
from .base import Source, SourceResult

DASHBOARD_URL = "https://www.chittorgarh.com/ipo/ipo_dashboard.asp"
LIST_URL = "https://www.chittorgarh.com/report/mainline-ipo-list-in-india-bse-nse/84/"
LIST_SME_URL = "https://www.chittorgarh.com/report/list-of-sme-ipo/83/"


class ChittorgarhDashboard(Source):
    name = "chittorgarh_dashboard"

    def run(self) -> SourceResult:
        result = SourceResult()
        rows: dict[str, dict[str, Any]] = {}

        # Warm up session on the root so later requests carry cookies.
        self.http.warm_up("https://www.chittorgarh.com/")

        for url, default_cat in (
            (DASHBOARD_URL, None),
            (LIST_URL, "Mainboard"),
            (LIST_SME_URL, "SME"),
        ):
            self._scrape_table(url, default_cat, rows, result)

        if not rows:
            result.status = "failed"
            # If we got here with no rows AND no per-URL errors, every
            # page returned 200 OK but the parser found no IPO tables.
            # That usually means we hit a Cloudflare challenge. Log
            # a snippet of the last response so the next run is
            # actionable — "failed, 0 errors" is a debugging dead-end.
            if not result.errors:
                result.errors.append(
                    "no IPO tables parsed from any dashboard URL — "
                    "likely bot-wall / challenge page served on 200"
                )
            return result

        for row in rows.values():
            row["last_scraped_at"] = datetime.now(timezone.utc).isoformat()
            row["scrape_source"] = self.name

        result.records_found = len(rows)
        result.records_updated = self.db.upsert_ipos(list(rows.values()))
        if result.records_updated == 0:
            result.status = "partial"
        return result

    # ------------------------------------------------------------- #

    def _scrape_table(
        self,
        url: str,
        default_category: str | None,
        rows: dict[str, dict[str, Any]],
        result: SourceResult,
    ) -> None:
        resp = self.http.get(url, referer="https://www.chittorgarh.com/")
        if resp is None or resp.status_code != 200:
            result.errors.append(
                describe_failure(resp, url=url, expected="dashboard page")
            )
            return

        tag = classify_response(resp)
        if tag != "ok":
            # 200 but body looks wrong (e.g. Cloudflare challenge). Abort
            # this URL with a diagnostic rather than handing gibberish
            # to the parser.
            result.errors.append(
                f"{url} → 200 [{tag}]: {snippet(resp)}"
            )
            return

        soup = BeautifulSoup(resp.text, "html.parser")
        tables = soup.find_all("table")
        matched = 0
        for table in tables:
            header_text = " ".join(th.get_text(" ", strip=True).lower() for th in table.find_all("th"))
            if "ipo" not in header_text:
                continue
            matched += 1
            header_cols = [th.get_text(" ", strip=True).lower() for th in table.find_all("th")]
            idx = _column_indexes(header_cols)

            for tr in table.find_all("tr")[1:]:
                tds = tr.find_all("td")
                if len(tds) < 3:
                    continue
                name_cell = tds[idx.get("name", 0)]
                name = clean_text(name_cell.get_text(" ", strip=True)) if tds else ""
                if not name:
                    continue
                slug = canonical_slug(name)
                if not slug:
                    continue

                row = rows.setdefault(
                    slug,
                    {
                        "slug": slug,
                        "ipo_name": name,
                        "company_name": name.replace(" IPO", "").strip(),
                        "category": default_category or detect_category(name),
                    },
                )

                # Cache the detail-page URL so the detail scraper can reuse it.
                link = name_cell.find("a")
                if link and link.get("href") and not row.get("detail_url"):
                    href = link["href"]
                    row["detail_url"] = (
                        href if href.startswith("http") else f"https://www.chittorgarh.com{href}"
                    )

                open_date = _safe_col(tds, idx.get("open"))
                close_date = _safe_col(tds, idx.get("close"))
                listing_date = _safe_col(tds, idx.get("listing"))
                price_band_text = _safe_col(tds, idx.get("price"))
                lot_text = _safe_col(tds, idx.get("lot"))
                issue_size_text = _safe_col(tds, idx.get("issue_size"))

                if open_date:
                    row["open_date"] = parse_date(open_date) or row.get("open_date")
                if close_date:
                    row["close_date"] = parse_date(close_date) or row.get("close_date")
                if listing_date:
                    row["listing_date"] = parse_date(listing_date) or row.get("listing_date")

                if price_band_text:
                    lo, hi = parse_price_band(price_band_text)
                    row["min_price"] = lo if lo is not None else row.get("min_price")
                    row["max_price"] = hi if hi is not None else row.get("max_price")

                if lot_text:
                    row["lot_size"] = parse_int(lot_text) or row.get("lot_size") or 1

                if issue_size_text:
                    row["issue_size_cr"] = parse_number(issue_size_text) or row.get("issue_size_cr")

                row["status"] = determine_status(
                    row.get("open_date"),
                    row.get("close_date"),
                    row.get("listing_date"),
                )

        if matched == 0:
            # 200 OK, looked like HTML, but no table had "ipo" in its
            # headers. Surface the first ~240 chars so we can tell
            # whether the page structure changed vs. the server
            # returned an error/placeholder body.
            result.errors.append(
                f"{url} → 200 [no-ipo-table]: {snippet(resp)}"
            )


def _column_indexes(headers: list[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, h in enumerate(headers):
        if "name" in h or "issuer" in h or "company" in h:
            out.setdefault("name", i)
        elif "open" in h:
            out.setdefault("open", i)
        elif "close" in h:
            out.setdefault("close", i)
        elif "listing" in h:
            out.setdefault("listing", i)
        elif "price" in h or "band" in h:
            out.setdefault("price", i)
        elif "lot" in h:
            out.setdefault("lot", i)
        elif "issue size" in h or "size" in h:
            out.setdefault("issue_size", i)
    return out


def _safe_col(tds, idx: int | None) -> str:
    if idx is None or idx >= len(tds):
        return ""
    return clean_text(tds[idx].get_text(" ", strip=True))
