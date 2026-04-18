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
from .sources.chittorgarh_history_backfill import ChittorgarhHistoryBackfill
from .sources.chittorgarh_subscription import ChittorgarhSubscription
from .sources.investorgain_gmp import InvestorgainGMP
from .sources.ipocentral_shareholder import IPOCentralShareholder
from .sources.ipoji_shareholder_quota import IpojiShareholderQuota
from .sources.ipowatch_gmp import IPOWatchGMP
from .sources.niftytrader_calendar import NiftytraderCalendar
from .sources.nse_current_issues import NSECurrentIssues


ALL_SOURCES: dict[str, Type[Source]] = {
    cls.name: cls
    for cls in (
        ChittorgarhDashboard,
        NiftytraderCalendar,
        InvestorgainGMP,
        ChittorgarhSubscription,
        ChittorgarhAllotment,
        ChittorgarhDRHP,
        ChittorgarhDetail,
        ChittorgarhHistoryBackfill,
        IPOWatchGMP,
        IPOCentralShareholder,
        IpojiShareholderQuota,
        NSECurrentIssues,
        BSECurrentIssues,
        CalendarEvents,
    )
}


# Execution order matters within each group. "calendar" always runs
# last so timelines reflect the freshest date columns.
GROUPS: dict[str, tuple[str, ...]] = {
    # High-frequency. Safe to run every 30 min during market hours.
    # investorgain_gmp is the primary GMP source after Chittorgarh outsourced
    # its GMP report to investorgain in early 2026. ipowatch_gmp stays as a
    # cross-check (writes to gmp_history only, never upserts ipos).
    "hot": (
        "investorgain_gmp",
        "ipowatch_gmp",
        "chittorgarh_subscription",
    ),
    # Once per hour: core dashboard + official exchange APIs.
    # niftytrader_calendar has the broadest coverage (500+ IPOs across
    # SME + Mainboard with post-listing prices), so it runs first and
    # seeds the ipos table. Chittorgarh fills in the registrar /
    # Indian-site-specific detail columns it alone provides.
    "core": (
        "niftytrader_calendar",
        "chittorgarh_dashboard",
        "nse_current_issues",
        "bse_current_issues",
        "calendar_events",
    ),
    # Every 6h: slower-moving metadata.
    # ipoji_shareholder_quota updates when SEBI sees a new filing from a
    # listed parent's subsidiary — rare, so cold cadence is plenty.
    "cold": (
        "chittorgarh_drhp",
        "chittorgarh_allotment",
        "ipocentral_shareholder",
        "ipoji_shareholder_quota",
        "calendar_events",
    ),
    # Daily: per-IPO deep scrape (throttled by detail_batch_size).
    "detail": (
        "chittorgarh_detail",
        "calendar_events",
    ),
    # Manual: walk historical IPOs that predate the pipeline and
    # populate gmp_history / subscription_history from archived pages.
    # Safe to re-run; history writes are deduped by (slug, date).
    "backfill": (
        "chittorgarh_history_backfill",
    ),
    # Full pass — use sparingly (e.g. initial backfill).
    "all": (
        "niftytrader_calendar",
        "chittorgarh_dashboard",
        "nse_current_issues",
        "bse_current_issues",
        "investorgain_gmp",
        "ipowatch_gmp",
        "chittorgarh_subscription",
        "chittorgarh_allotment",
        "chittorgarh_drhp",
        "ipocentral_shareholder",
        "ipoji_shareholder_quota",
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
