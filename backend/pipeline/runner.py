"""Orchestrator: runs a list of source names sequentially, waiting
`inter_source_gap_sec` between them. Returns an aggregate report.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field

from .browser import HeadlessBrowser
from .config import Settings
from .db import Database
from .http_client import PoliteClient
from .logger import get_logger
from .registry import ALL_SOURCES
from .sources.base import SourceResult

log = get_logger("pipeline.runner")


@dataclass
class RunReport:
    results: dict[str, SourceResult] = field(default_factory=dict)

    @property
    def total_errors(self) -> int:
        return sum(len(r.errors) for r in self.results.values())

    @property
    def any_failed(self) -> bool:
        return any(r.status == "failed" for r in self.results.values())

    def summary_lines(self) -> list[str]:
        lines: list[str] = []
        for name, res in self.results.items():
            lines.append(
                f"[{res.status:>7}] {name:<28} "
                f"found={res.records_found} updated={res.records_updated} "
                f"appended={res.records_appended} errors={len(res.errors)}"
            )
            # When something went wrong, dump the first error inline so
            # you can debug from the GitHub Actions log without needing
            # to query scraping_runs.error_details in Supabase.
            if res.errors and res.status != "success":
                first = str(res.errors[0]).replace("\n", " ")
                if len(first) > 500:
                    first = first[:500] + "…"
                lines.append(f"        └─ {first}")
        return lines


def run(sources: list[str], *, settings: Settings) -> RunReport:
    http = PoliteClient(settings)
    db = Database(settings)
    report = RunReport()

    # Lazy Chromium launch — only started if one of the scheduled
    # sources actually needs JS-rendered HTML. For a "hot" run with
    # only static-parse sources, the browser never boots.
    browser: HeadlessBrowser | None = None
    try:
        for i, name in enumerate(sources):
            cls = ALL_SOURCES.get(name)
            if cls is None:
                log.error("unknown source", extra={"source": name})
                continue

            if i > 0:
                time.sleep(settings.inter_source_gap_sec)

            if cls.needs_browser and browser is None:
                browser = HeadlessBrowser(settings)

            log.info("starting source", extra={"source": name})
            source = cls(http=http, db=db, browser=browser)
            result = source.execute()
            report.results[name] = result
            log.info(
                "finished source",
                extra={
                    "source": name,
                    "status": result.status,
                    "records_found": result.records_found,
                    "records_updated": result.records_updated,
                    "records_appended": result.records_appended,
                    "errors": len(result.errors),
                },
            )
    finally:
        if browser is not None:
            browser.close()

    return report
