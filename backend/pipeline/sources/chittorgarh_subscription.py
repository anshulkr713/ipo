"""Chittorgarh live subscription status — Playwright-rendered.

The /report/... page was migrated to Next.js App Router RSC. The initial
HTML ships an empty table shell and the rows stream in via React Server
Components. Static GETs return 0 tables / 0 rows even with brotli decoded.

We render with headless Chromium, wait for the `QIB` column header to
appear (that's our "the real table has hydrated" signal), then parse
exactly as before. The rendered DOM keeps the same table/th/td structure
the old static parser expected, so the header heuristic is unchanged.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bs4 import BeautifulSoup

from ..parse import canonical_slug, clean_text, parse_number
from .base import Source, SourceResult

SUB_URL = "https://www.chittorgarh.com/report/ipo-subscription-status-live-bidding-data-bse-nse/21/"

# The rendered table puts each subscription column in its own <th>.
# Waiting on `th:has-text("QIB")` avoids the premature match that plain
# `wait_for_selector('table')` gives us (an empty shell table exists in
# the SSR output and matches instantly).
_WAIT_SELECTOR = 'th:has-text("QIB")'


class ChittorgarhSubscription(Source):
    name = "chittorgarh_subscription"
    needs_browser = True

    def run(self) -> SourceResult:
        result = SourceResult()

        if self.browser is None:
            result.status = "failed"
            result.errors.append("browser not injected — runner misconfig")
            return result

        try:
            html = self.browser.fetch(
                SUB_URL,
                wait_for_selector=_WAIT_SELECTOR,
                wait_timeout_ms=25_000,
                referer="https://www.chittorgarh.com/",
            )
        except Exception as exc:  # noqa: BLE001
            # Playwright raises TimeoutError when the QIB column never
            # appears (either the page shape changed or the browser was
            # served a challenge). Record diagnostic context.
            result.status = "failed"
            result.errors.append(
                f"browser fetch failed for {SUB_URL}: "
                f"{type(exc).__name__}: {str(exc)[:300]}"
            )
            return result

        soup = BeautifulSoup(html, "html.parser")
        target = None
        for table in soup.find_all("table"):
            header_text = " ".join(
                th.get_text(" ", strip=True).lower() for th in table.find_all("th")
            )
            if "qib" in header_text and "retail" in header_text:
                target = table
                break
        if target is None:
            result.status = "failed"
            result.errors.append(
                f"subscription table not found at {SUB_URL} "
                f"(rendered len={len(html)} tables={html.lower().count('<table')})"
            )
            return result

        header_cols = [
            th.get_text(" ", strip=True).lower() for th in target.find_all("th")
        ]
        idx = _sub_columns(header_cols)

        # Enrichment-only: pre-filter to slugs already known to the
        # dashboard sources so we don't create stub rows that fail
        # NOT NULL on category/lot_size. See investorgain_gmp.py for
        # the same pattern — history inserts still run for every row.
        # fetch_known_slugs (not fetch_active_slugs) so listed IPOs
        # with late subscription updates still match.
        known = self.db.fetch_known_slugs()

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

            if slug in known:
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

        result.records_found = len(history_rows)
        # See Database.bulk_update_ipos — enrichment sources use pure
        # UPDATE, not upsert, to sidestep NOT NULL on INSERT.
        result.records_updated = self.db.bulk_update_ipos(ipos_updates)
        result.records_appended = self.db.append_subscription_history(history_rows)
        if result.records_found == 0:
            result.status = "partial"
        return result


def _cell(tds, i):
    if i is None or i >= len(tds):
        return ""
    return clean_text(tds[i].get_text(" ", strip=True))


def _sub_columns(headers: list[str]) -> dict[str, int]:
    """Map a header row to canonical column keys.

    Chittorgarh's rendered headers come through with trailing sort arrows
    and a `(x)` suffix on subscription-ratio columns (e.g. `qib (x)▲▼`).
    Beware the "Total Issue Amount (Incl. Firm reservations)" column
    that appears *before* the subscription block — an earlier version
    of this mapper matched it as `total` and we wrote issue size (in
    crores) into `subscription_total` by mistake. The `(x)` suffix is
    the reliable marker for the subscription total column.
    """
    out: dict[str, int] = {}
    for i, h in enumerate(headers):
        if "ipo" in h and "name" in h:
            out.setdefault("name", i)
        elif "company" in h:
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
        elif "total" in h and "amount" not in h and "issue" not in h:
            # Subscription total — NOT "Total Issue Amount".
            out.setdefault("total", i)
    out.setdefault("name", 0)
    return out
