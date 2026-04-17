"""Central registry of available sources and execution groups.

The CLI resolves command-line names to Source classes via this module.
Each group is a list of source names executed in order. Groups let us
bundle related sources for a single cron trigger (e.g. "hot" = GMP +
subscription, "cold" = DRHP/RHP + allotment).
"""

from __future__ import annotations

from typing import Type

from .sources.base import Source
from .sources.bse_current_issues import BSECurrentIssues
from .sources.calendar_events import CalendarEvents
from .sources.chittorgarh_allotment import ChittorgarhAllotment
from .sources.chittorgarh_dashboard import ChittorgarhDashboard
from .sources.chittorgarh_detail import ChittorgarhDetail
from .sources.chittorgarh_drhp import ChittorgarhDRHP
from .sources.chittorgarh_gmp import ChittorgarhGMP
from .sources.chittorgarh_subscription import ChittorgarhSubscription
from .sources.ipocentral_shareholder import IPOCentralShareholder
from .sources.ipowatch_gmp import IPOWatchGMP
from .sources.nse_current_issues import NSECurrentIssues


ALL_SOURCES: dict[str, Type[Source]] = {
    cls.name: cls
    for cls in (
        ChittorgarhDashboard,
        ChittorgarhGMP,
        ChittorgarhSubscription,
        ChittorgarhAllotment,
        ChittorgarhDRHP,
        ChittorgarhDetail,
        IPOWatchGMP,
        IPOCentralShareholder,
        NSECurrentIssues,
        BSECurrentIssues,
        CalendarEvents,
    )
}


# Execution order matters within each group. "calendar" always runs
# last so timelines reflect the freshest date columns.
GROUPS: dict[str, tuple[str, ...]] = {
    # High-frequency. Cheap. Safe to run every 30 min during market hours.
    "hot": (
        "chittorgarh_gmp",
        "ipowatch_gmp",
        "chittorgarh_subscription",
    ),
    # Once per hour: core dashboard + official exchange APIs.
    "core": (
        "chittorgarh_dashboard",
        "nse_current_issues",
        "bse_current_issues",
        "calendar_events",
    ),
    # Every 6h: slower-moving metadata.
    "cold": (
        "chittorgarh_drhp",
        "chittorgarh_allotment",
        "ipocentral_shareholder",
        "calendar_events",
    ),
    # Daily: per-IPO deep scrape (throttled by detail_batch_size).
    "detail": (
        "chittorgarh_detail",
        "calendar_events",
    ),
    # Full pass — use sparingly (e.g. initial backfill).
    "all": (
        "chittorgarh_dashboard",
        "nse_current_issues",
        "bse_current_issues",
        "chittorgarh_gmp",
        "ipowatch_gmp",
        "chittorgarh_subscription",
        "chittorgarh_allotment",
        "chittorgarh_drhp",
        "ipocentral_shareholder",
        "chittorgarh_detail",
        "calendar_events",
    ),
}


def resolve(name: str) -> list[str]:
    """Resolve a group or single-source name into an execution list."""
    if name in GROUPS:
        return list(GROUPS[name])
    if name in ALL_SOURCES:
        return [name]
    raise KeyError(
        f"unknown source or group: {name!r}. "
        f"Known sources: {sorted(ALL_SOURCES)}. Known groups: {sorted(GROUPS)}."
    )
