"""CLI entrypoint.

Usage:
    python -m pipeline run <group-or-source> [<group-or-source> ...]
    python -m pipeline list

Examples:
    python -m pipeline run hot          # GMP + subscription
    python -m pipeline run core         # dashboard + exchange APIs
    python -m pipeline run cold         # DRHP/RHP + allotment + shareholder
    python -m pipeline run detail       # per-IPO deep scrape (throttled)
    python -m pipeline run all          # full pass
    python -m pipeline run chittorgarh_gmp chittorgarh_subscription
"""

from __future__ import annotations

import argparse
import sys

from .config import ConfigError, Settings
from .logger import get_logger
from .registry import ALL_SOURCES, GROUPS, resolve
from .runner import run

log = get_logger("pipeline.cli")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser("pipeline", description="IPO data pipeline")
    sub = parser.add_subparsers(dest="cmd", required=True)

    run_p = sub.add_parser("run", help="Run a source or group")
    run_p.add_argument(
        "targets",
        nargs="+",
        help="Source name(s) or group name(s). See `pipeline list`.",
    )

    sub.add_parser("list", help="List known sources and groups")

    args = parser.parse_args(argv)

    if args.cmd == "list":
        print("Sources:")
        for name in sorted(ALL_SOURCES):
            print(f"  - {name}")
        print("\nGroups:")
        for g, members in GROUPS.items():
            print(f"  - {g}: {', '.join(members)}")
        return 0

    try:
        settings = Settings.load()
    except ConfigError as exc:
        log.error("config error", extra={"error": str(exc)})
        print(f"error: {exc}", file=sys.stderr)
        return 2

    # Expand group names to their constituent sources. Dedupe while
    # keeping order so "core cold" doesn't double-run calendar_events.
    expanded: list[str] = []
    seen: set[str] = set()
    for t in args.targets:
        try:
            for s in resolve(t):
                if s in seen:
                    continue
                seen.add(s)
                expanded.append(s)
        except KeyError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 2

    log.info("starting pipeline run", extra={"sources": expanded})
    report = run(expanded, settings=settings)

    print()
    print("=" * 70)
    print("Pipeline run complete")
    print("=" * 70)
    for line in report.summary_lines():
        print(line)

    # Exit code: 0 even if some sources are "partial" (expected in the wild),
    # non-zero only if *every* source failed.
    total = len(report.results)
    failed = sum(1 for r in report.results.values() if r.status == "failed")
    return 1 if total and failed == total else 0


if __name__ == "__main__":
    sys.exit(main())
