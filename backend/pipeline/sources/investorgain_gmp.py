"""Investorgain GMP — primary GMP source.

Replaces chittorgarh_gmp after Chittorgarh outsourced GMP data to
investorgain.com in early 2026. Chittorgarh's old GMP report page
(/report/ipo-grey-market-premium-gmp-current-rate/83/) now just lists
IPOs with backlinks here instead of serving its own GMP values.

The investorgain table is a client-rendered DataTables widget — no rows
in the initial SSR HTML, so we render with Chromium and wait for the
`GMP` column header to appear. Cell format for the GMP column is
`₹ 4.5 (4.59%) 4.50 ↓ / 4.50 ↑` — amount + percentage + day-low/high.
We parse the leading number as the GMP amount and the parenthesised
figure as the percentage.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from ..parse import canonical_slug, clean_text, parse_int, parse_number
from .base import Source, SourceResult

GMP_URL = "https://www.investorgain.com/report/live-ipo-gmp/331/"
_WAIT_SELECTOR = 'th:has-text("GMP")'

# Investorgain appends exchange + status markers to the displayed IPO
# name. Shape is: " <exchange/IPO> <status>" where
#   exchange = BSE | NSE | BSE SME | NSE SME | IPO
#   status   = O (open) | U (upcoming) | C (closed)
#            | L (listed) — optionally "L@<listing-price> (<return>%)"
# Examples we have to normalise to the bare company name:
#   "Leapfrog Engineering BSE SME U"            → "Leapfrog Engineering"
#   "Citius Transnet InvIT IPO O"               → "Citius Transnet InvIT"
#   "Om Power Transmission IPO L@178.00 (1.71%)"→ "Om Power Transmission"
#   "Emiac Technologies BSE SME L@107.80 (10%)" → "Emiac Technologies"
# Without this, canonical_slug produces "leapfrog-engineering-bse-sme-u"
# and upserts fork from the chittorgarh "leapfrog-engineering" row.
# Anchored to `$` so an embedded "NSE" inside the name (e.g. "India NSE
# Foobar IPO O") doesn't trigger a leftmost over-strip.
_NAME_TAIL_RE = re.compile(
    r"\s+(?:BSE(?:\s+SME)?|NSE(?:\s+SME)?|IPO)"
    r"(?:\s+(?:[OUC]|L(?:@[\d.,]+\s*\([-+\d.]+%\))?))?"
    r"\s*$",
    re.IGNORECASE,
)

_PERCENT_RE = re.compile(r"\(([-+\d.]+)\s*%\)")


class InvestorgainGMP(Source):
    name = "investorgain_gmp"
    needs_browser = True

    def run(self) -> SourceResult:
        result = SourceResult()

        if self.browser is None:
            result.status = "failed"
            result.errors.append("browser not injected — runner misconfig")
            return result

        try:
            html = self.browser.fetch(
                GMP_URL,
                wait_for_selector=_WAIT_SELECTOR,
                wait_timeout_ms=25_000,
                referer="https://www.investorgain.com/",
            )
        except Exception as exc:  # noqa: BLE001
            result.status = "failed"
            result.errors.append(
                f"browser fetch failed for {GMP_URL}: "
                f"{type(exc).__name__}: {str(exc)[:300]}"
            )
            return result

        soup = BeautifulSoup(html, "html.parser")
        target = None
        for table in soup.find_all("table"):
            header_text = " ".join(
                th.get_text(" ", strip=True).lower() for th in table.find_all("th")
            )
            # The page also carries a small summary table — match on the
            # combination of GMP + Price/IPO-Size to pick the live table.
            if "gmp" in header_text and ("price" in header_text or "ipo size" in header_text):
                target = table
                break
        if target is None:
            result.status = "failed"
            result.errors.append(
                f"GMP table not found at {GMP_URL} "
                f"(rendered len={len(html)} tables={html.lower().count('<table')})"
            )
            return result

        header_cols = [
            th.get_text(" ", strip=True).lower() for th in target.find_all("th")
        ]
        idx = _gmp_columns(header_cols)

        # Enrichment-only: never INSERT new rows. The ipos table has
        # NOT NULL columns (category, company_name, lot_size) we don't
        # have authoritative values for — creating minimal stubs here
        # would either clobber later dashboard-source data or fail
        # the INSERT outright. Instead we pre-filter to slugs the
        # dashboard sources (niftytrader_calendar / chittorgarh_dashboard)
        # have already created, and skip unknowns. A new IPO propagates
        # from those dashboards within one "core" run (≤60 min) before
        # the next "hot" run enriches it.
        #
        # Using fetch_known_slugs (not fetch_active_slugs) because
        # investorgain carries post-listing rows too — fetch_active_slugs
        # drops 'listed' status and we'd silently skip fresh GMP deltas
        # for just-listed IPOs.
        known = self.db.fetch_known_slugs()

        ipos_updates: list[dict[str, Any]] = []
        history_rows: list[dict[str, Any]] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for tr in target.find_all("tr")[1:]:
            tds = tr.find_all("td")
            if len(tds) < 3:
                continue
            raw_name = clean_text(tds[idx.get("name", 0)].get_text(" ", strip=True))
            name = _clean_name(raw_name)
            if not name:
                continue
            slug = canonical_slug(name)
            if not slug:
                continue

            gmp_text = clean_text(tds[idx.get("gmp", 1)].get_text(" ", strip=True))
            price_text = _cell(tds, idx.get("price"))

            gmp_amount = parse_number(gmp_text.split("(")[0])
            issue_price = parse_number(price_text)

            pct_match = _PERCENT_RE.search(gmp_text)
            pct = float(pct_match.group(1)) if pct_match else None
            if pct is None and issue_price and issue_price > 0 and gmp_amount is not None:
                pct = round(gmp_amount / issue_price * 100, 2)

            expected_listing = None
            if issue_price is not None and gmp_amount is not None:
                expected_listing = issue_price + gmp_amount

            if slug in known:
                ipos_updates.append(
                    {
                        "slug": slug,
                        "ipo_name": name,
                        "current_gmp": (
                            parse_int(str(gmp_amount))
                            if gmp_amount is not None
                            else None
                        ),
                        "gmp_percentage": pct,
                        "last_scraped_at": now_iso,
                        "scrape_source": self.name,
                    }
                )
            history_rows.append(
                {
                    "ipo_slug": slug,
                    "gmp_amount": gmp_amount,
                    "gmp_percentage": pct,
                    "issue_price": issue_price,
                    "expected_listing_price": expected_listing,
                    "source": self.name,
                }
            )

        # records_found counts every row we *parsed* (history gets them
        # all). records_updated is just the subset that enriched ipos.
        # bulk_update_ipos (not upsert_ipos) — see Database.bulk_update_ipos
        # docstring: NOT NULL is checked before ON CONFLICT DO UPDATE,
        # so a partial-payload upsert trips on ipos.company_name even
        # when the slug already exists.
        result.records_found = len(history_rows)
        result.records_updated = self.db.bulk_update_ipos(ipos_updates)
        result.records_appended = self.db.append_gmp_history(history_rows)
        if result.records_found == 0:
            result.status = "partial"
        return result


def _clean_name(raw: str) -> str:
    if not raw:
        return ""
    return _NAME_TAIL_RE.sub("", raw).strip()


def _cell(tds, i):
    if i is None or i >= len(tds):
        return ""
    return clean_text(tds[i].get_text(" ", strip=True))


def _gmp_columns(headers: list[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, h in enumerate(headers):
        if "name" in h and "updated" not in h:
            out.setdefault("name", i)
        elif "gmp" in h:
            out.setdefault("gmp", i)
        elif "price" in h:
            out.setdefault("price", i)
    out.setdefault("name", 0)
    out.setdefault("gmp", 1)
    return out
