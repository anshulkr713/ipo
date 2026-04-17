"""Parsers for the GMP trend and day-wise subscription tables found on
Chittorgarh per-IPO detail pages. Shared by `chittorgarh_detail` and
`chittorgarh_history_backfill` so both write consistent history rows.

The tables look roughly like this (column set varies slightly by IPO):

    GMP Trend
    ---------
    Date          | IPO Price | GMP | Kostak | Subject to Sauda
    2026-04-14    | 300       | 55  | 700    | 3000
    ...

    Subscription Status (Bidding Detail)
    ------------------------------------
    Date            | QIB  | NII  | Retail | Employee | Total
    Day 1 (Apr 10)  | 0.12 | 0.23 | 0.87   | 0.10     | 0.36
    ...
"""

from __future__ import annotations

import re
from typing import Any, Optional

from bs4 import BeautifulSoup, Tag

from ..parse import clean_text, parse_date, parse_number


def parse_gmp_trend(soup: BeautifulSoup, slug: str, source_name: str) -> list[dict[str, Any]]:
    """Returns one gmp_history row per observation, with `scraped_at` set
    to the row's observation date (YYYY-MM-DD at 00:00 UTC)."""
    table = _find_table_after_heading(
        soup,
        keywords=("gmp trend", "grey market premium"),
        required_headers=("gmp", "date"),
    )
    if table is None:
        return []

    cols = _header_index(
        table,
        {
            "date": ("date",),
            "issue_price": ("ipo price", "issue price", "price"),
            "gmp": ("gmp",),
            "kostak": ("kostak",),
            "subject": ("subject",),
        },
    )
    if cols.get("date") is None or cols.get("gmp") is None:
        return []

    rows: list[dict[str, Any]] = []
    for tr in table.find_all("tr")[1:]:
        tds = tr.find_all("td")
        if not tds:
            continue
        iso = parse_date(_cell(tds, cols["date"]))
        if not iso:
            continue
        gmp_amount = parse_number(_cell(tds, cols["gmp"]))
        issue_price = parse_number(_cell(tds, cols.get("issue_price")))
        kostak = parse_number(_cell(tds, cols.get("kostak")))
        subject = parse_number(_cell(tds, cols.get("subject")))

        gmp_pct: Optional[float] = None
        if issue_price and issue_price > 0 and gmp_amount is not None:
            gmp_pct = round(gmp_amount / issue_price * 100, 2)

        expected_listing: Optional[float] = None
        if issue_price is not None and gmp_amount is not None:
            expected_listing = issue_price + gmp_amount

        rows.append(
            {
                "ipo_slug": slug,
                "gmp_amount": gmp_amount,
                "gmp_percentage": gmp_pct,
                "kostak_rate": kostak,
                "subject_rate": subject,
                "issue_price": issue_price,
                "expected_listing_price": expected_listing,
                "source": source_name,
                "scraped_at": f"{iso}T00:00:00+00:00",
            }
        )
    return rows


def parse_subscription_trend(
    soup: BeautifulSoup, slug: str, source_name: str
) -> list[dict[str, Any]]:
    """Returns one subscription_history row per day, with scraped_at set
    to the parsed observation date (when available) or left unset so
    Postgres stamps `now()`."""
    table = _find_table_after_heading(
        soup,
        keywords=(
            "subscription status",
            "bidding detail",
            "day wise subscription",
        ),
        required_headers=("qib", "retail"),
    )
    if table is None:
        return []

    cols = _header_index(
        table,
        {
            "date": ("date",),
            "day": ("day",),
            "qib": ("qib",),
            "bnii": ("bnii", "b-nii", "bhni", "> 10"),
            "snii": ("snii", "s-nii", "shni", "< 10"),
            "nii": ("nii",),
            "retail": ("retail",),
            "employee": ("employee", "emp"),
            "shareholder": ("shareholder",),
            "total": ("total",),
        },
    )
    # Some IPOs have only "Day" column, no explicit date — we fall back to
    # the day number and let Postgres stamp scraped_at with now().
    if cols.get("qib") is None and cols.get("retail") is None:
        return []

    rows: list[dict[str, Any]] = []
    for tr in table.find_all("tr")[1:]:
        tds = tr.find_all("td")
        if not tds:
            continue

        day_text = _cell(tds, cols.get("day")) or _cell(tds, cols.get("date"))
        if not day_text:
            continue
        day_number = _extract_day_number(day_text)
        iso_date = parse_date(_cell(tds, cols.get("date"))) or parse_date(day_text)

        row: dict[str, Any] = {
            "ipo_slug": slug,
            "subscription_qib": parse_number(_cell(tds, cols.get("qib"))),
            "subscription_nii": parse_number(_cell(tds, cols.get("nii"))),
            "subscription_bnii": parse_number(_cell(tds, cols.get("bnii"))),
            "subscription_snii": parse_number(_cell(tds, cols.get("snii"))),
            "subscription_retail": parse_number(_cell(tds, cols.get("retail"))),
            "subscription_employee": parse_number(_cell(tds, cols.get("employee"))),
            "subscription_shareholder": parse_number(_cell(tds, cols.get("shareholder"))),
            "subscription_total": parse_number(_cell(tds, cols.get("total"))),
            "day_number": day_number,
            "source": source_name,
        }
        if iso_date:
            row["scraped_at"] = f"{iso_date}T00:00:00+00:00"

        # Drop entirely empty rows (summary rows, footers).
        if all(
            row[k] is None
            for k in (
                "subscription_qib",
                "subscription_nii",
                "subscription_retail",
                "subscription_total",
            )
        ):
            continue
        rows.append(row)
    return rows


# ---------------------------------------------------------------- helpers


_DAY_NUM_RE = re.compile(r"day\s*(\d+)", re.IGNORECASE)


def _extract_day_number(text: str) -> Optional[int]:
    m = _DAY_NUM_RE.search(text or "")
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    return None


def _cell(tds: list[Tag], i: Optional[int]) -> str:
    if i is None or i >= len(tds):
        return ""
    return clean_text(tds[i].get_text(" ", strip=True))


def _find_table_after_heading(
    soup: BeautifulSoup,
    *,
    keywords: tuple[str, ...],
    required_headers: tuple[str, ...],
) -> Optional[Tag]:
    """Locate a `<table>` preceded by a heading whose text contains any of
    `keywords`. As a fallback, scan every `<table>` and return the first
    whose header row contains all `required_headers`."""
    for heading in soup.find_all(["h2", "h3", "h4"]):
        htxt = heading.get_text(" ", strip=True).lower()
        if not any(k in htxt for k in keywords):
            continue
        for sib in heading.find_all_next(limit=6):
            if sib.name == "table":
                if _table_has_headers(sib, required_headers):
                    return sib
                break
            if sib.name in ("h2", "h3") and sib is not heading:
                break

    for table in soup.find_all("table"):
        if _table_has_headers(table, required_headers):
            return table
    return None


def _table_has_headers(table: Tag, required: tuple[str, ...]) -> bool:
    headers = " ".join(
        th.get_text(" ", strip=True).lower() for th in table.find_all("th")
    )
    return all(r in headers for r in required)


def _header_index(table: Tag, mapping: dict[str, tuple[str, ...]]) -> dict[str, Optional[int]]:
    headers = [th.get_text(" ", strip=True).lower() for th in table.find_all("th")]
    out: dict[str, Optional[int]] = {k: None for k in mapping}

    # Priority: assign in definition order so "nii" doesn't steal "bnii"/"snii".
    taken: set[int] = set()
    for key, tokens in mapping.items():
        for i, h in enumerate(headers):
            if i in taken:
                continue
            if any(tok in h for tok in tokens):
                out[key] = i
                taken.add(i)
                break
    return out
