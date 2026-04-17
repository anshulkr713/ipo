"""Backfill `gmp_history` and `subscription_history` for IPOs that
predate the live pipeline.

For every candidate (IPOs with a cached `detail_url` and zero history
rows yet), re-fetch the Chittorgarh detail page and extract whatever
the GMP-trend and day-wise-subscription tables contain. Rows are
deduped by (slug, date) so this source is safe to re-run.

Ordering is oldest-open-date first so the historical long-tail gets
filled before we ever come back to recent IPOs the live scrapers are
already covering.

Throttle:
- `detail_batch_size` (default 10) IPOs per invocation.
- One request per IPO (reuses the existing detail URL).
- The polite-client's per-host cap still applies globally.

Run manually when needed, e.g. `python -m pipeline run backfill`.
"""

from __future__ import annotations

from bs4 import BeautifulSoup

from ._chittorgarh_history import parse_gmp_trend, parse_subscription_trend
from .base import Source, SourceResult


class ChittorgarhHistoryBackfill(Source):
    name = "chittorgarh_history_backfill"

    def run(self) -> SourceResult:
        result = SourceResult()
        candidates = self.db.fetch_ipos_missing_history(self.db.settings.detail_batch_size)
        if not candidates:
            result.status = "skipped"
            return result

        self.http.warm_up("https://www.chittorgarh.com/")

        for ipo in candidates:
            url = ipo.get("detail_url")
            slug = ipo.get("slug")
            if not url or not slug:
                continue

            resp = self.http.get(url, referer="https://www.chittorgarh.com/")
            if resp is None or resp.status_code != 200:
                result.errors.append(
                    f"{slug}: {url} → {getattr(resp, 'status_code', 'no-response')}"
                )
                continue

            try:
                soup = BeautifulSoup(resp.text, "html.parser")
                gmp_rows = parse_gmp_trend(soup, slug, self.name)
                sub_rows = parse_subscription_trend(soup, slug, self.name)
            except Exception as exc:  # noqa: BLE001
                result.errors.append(f"{slug}: {type(exc).__name__}: {exc}")
                continue

            if gmp_rows:
                result.records_appended += self.db.append_gmp_history_dedupe(gmp_rows)
            if sub_rows:
                result.records_appended += self.db.append_subscription_history_dedupe(sub_rows)

            if gmp_rows or sub_rows:
                result.records_found += 1

        if result.records_found == 0:
            result.status = "partial" if result.errors else "skipped"
        return result
