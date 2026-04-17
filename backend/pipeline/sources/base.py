"""Base class for all scraping sources.

Every source is a small class that knows:
  * which URL(s) to fetch,
  * how to parse rows into IPO / GMP / subscription dicts,
  * which DB tables to write.

The runner orchestrates them and writes a row in `scraping_runs` per source.
"""

from __future__ import annotations

import time
import traceback
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional

from ..db import Database
from ..http_client import HostBlocked, PoliteClient
from ..logger import get_logger


@dataclass
class SourceResult:
    records_found: int = 0
    records_updated: int = 0
    records_appended: int = 0
    errors: list[str] = field(default_factory=list)
    status: str = "success"  # success | partial | failed | skipped
    http_status_codes: list[int] = field(default_factory=list)


class Source(ABC):
    """Abstract base. Each concrete source sets `name` and implements `run`."""

    name: str = "base"

    def __init__(self, http: PoliteClient, db: Database):
        self.http = http
        self.db = db
        self.log = get_logger(f"pipeline.source.{self.name}")

    # -------------------------------------------------------------- #
    # orchestration
    # -------------------------------------------------------------- #

    def execute(self) -> SourceResult:
        """Run this source, recording start/finish rows in scraping_runs."""
        row_id = self.db.start_run(self.name)
        started = time.monotonic()
        result = SourceResult()
        try:
            result = self.run()
        except HostBlocked as exc:
            self.log.warning(
                "source blocked",
                extra={"source": self.name, "host": str(exc)},
            )
            result.status = "failed"
            result.errors.append(f"host blocked: {exc}")
        except Exception as exc:  # noqa: BLE001
            self.log.error("source crashed", extra={"source": self.name}, exc_info=exc)
            result.status = "failed"
            result.errors.append(f"{type(exc).__name__}: {exc}")
            result.errors.append(traceback.format_exc(limit=3))
        duration_ms = int((time.monotonic() - started) * 1000)
        self.db.finish_run(
            row_id,
            status=result.status,
            records_found=result.records_found,
            records_updated=result.records_updated,
            records_appended=result.records_appended,
            errors_count=len(result.errors),
            error_details={"errors": result.errors} if result.errors else None,
            duration_ms=duration_ms,
        )
        return result

    # -------------------------------------------------------------- #
    # subclasses override
    # -------------------------------------------------------------- #

    @abstractmethod
    def run(self) -> SourceResult: ...
