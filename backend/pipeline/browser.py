"""Headless Chromium wrapper for sources that need JS-rendered HTML.

One browser + context per pipeline run, shared across every source that
sets `needs_browser = True`. Pages are opened per fetch and closed after.
Images, fonts, and known tracking hosts are aborted at the router to cut
bandwidth (each scrape loads <200KB instead of ~5MB) and cold-start time.

Lifecycle is driven by `runner.py`: the browser is lazy-started the first
time a source calls `self.browser.fetch(...)` and closed in a finally
block at the end of the run. Sources never instantiate this themselves.
"""

from __future__ import annotations

import random
from contextlib import contextmanager
from typing import Iterator, Optional

from .config import USER_AGENTS, Settings
from .logger import get_logger

log = get_logger("pipeline.browser")


# Drop everything a scraper does not need. Keeping these off shaves
# ~4-5 seconds and ~5MB off every fetch on chittorgarh / investorgain.
_BLOCKED_RESOURCE_TYPES = frozenset({"image", "font", "media", "stylesheet"})

# Analytics, ads, and other third-party beacons. Chittorgarh in
# particular pulls in ~15 of these and some are slow to TCP-ACK,
# pushing `networkidle` out by 8+ seconds.
_BLOCKED_HOST_SUFFIXES = (
    "googletagmanager.com",
    "google-analytics.com",
    "doubleclick.net",
    "googlesyndication.com",
    "adservice.google.com",
    "facebook.net",
    "fbcdn.net",
    "hotjar.com",
    "cloudflareinsights.com",
    "adnxs.com",
    "outbrain.com",
    "taboola.com",
    "clarity.ms",
    "newrelic.com",
    "nr-data.net",
)


class HeadlessBrowser:
    """Lazy Playwright wrapper — started on first fetch, closed by runner."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self._playwright = None
        self._browser = None
        self._context = None
        self._user_agent = ""

    # -------------------------------------------------------------- #
    # lifecycle
    # -------------------------------------------------------------- #

    def _ensure_started(self) -> None:
        if self._browser is not None:
            return
        # Local import so `import pipeline` doesn't require Playwright for
        # runs that don't use the browser (schema migration, reads, etc.).
        from playwright.sync_api import sync_playwright

        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                # Real Chrome sends this off; turning it off here hides the
                # `navigator.webdriver === true` tell that some anti-bot
                # scripts key on.
                "--disable-blink-features=AutomationControlled",
            ],
        )
        self._user_agent = random.choice(USER_AGENTS)
        self._context = self._browser.new_context(
            user_agent=self._user_agent,
            viewport={"width": 1366, "height": 900},
            locale="en-IN",
            timezone_id="Asia/Kolkata",
            extra_http_headers={
                "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
                "Accept-Encoding": "gzip, deflate, br",
            },
        )
        # 45s for nav (some pages take time on Cloudflare), 15s default
        # for `wait_for_selector` — sources override where needed.
        self._context.set_default_navigation_timeout(45_000)
        self._context.set_default_timeout(15_000)
        log.info("browser started", extra={"user_agent": self._user_agent})

    def close(self) -> None:
        # Close in reverse startup order, each step defensive so a crash
        # in one doesn't leak the rest.
        for obj, method in (
            (self._context, "close"),
            (self._browser, "close"),
            (self._playwright, "stop"),
        ):
            if obj is None:
                continue
            try:
                getattr(obj, method)()
            except Exception as exc:  # noqa: BLE001
                log.debug("browser close step failed: %s", exc)
        self._context = self._browser = self._playwright = None

    # -------------------------------------------------------------- #
    # primary API
    # -------------------------------------------------------------- #

    @contextmanager
    def page(self) -> Iterator[object]:
        """Yield a fresh Playwright Page with request-routing applied."""
        self._ensure_started()
        page = self._context.new_page()  # type: ignore[union-attr]

        def _router(route):
            req = route.request
            if req.resource_type in _BLOCKED_RESOURCE_TYPES:
                return route.abort()
            host = ""
            if "://" in req.url:
                try:
                    host = req.url.split("/", 3)[2]
                except Exception:
                    host = ""
            if any(host.endswith(s) for s in _BLOCKED_HOST_SUFFIXES):
                return route.abort()
            return route.continue_()

        page.route("**/*", _router)
        try:
            yield page
        finally:
            try:
                page.close()
            except Exception:  # noqa: BLE001
                pass

    def fetch(
        self,
        url: str,
        *,
        wait_for_selector: Optional[str] = None,
        wait_timeout_ms: int = 20_000,
        referer: Optional[str] = None,
    ) -> str:
        """Navigate to `url`, wait for content, return rendered HTML.

        If `wait_for_selector` is given, block until the selector appears
        (how we know the React tree finished hydrating). Otherwise wait
        for `networkidle`, which is looser but ok for smaller pages.
        """
        with self.page() as page:
            page.goto(
                url,
                wait_until="domcontentloaded",
                referer=referer,
            )
            if wait_for_selector:
                page.wait_for_selector(wait_for_selector, timeout=wait_timeout_ms)
            else:
                try:
                    page.wait_for_load_state("networkidle", timeout=wait_timeout_ms)
                except Exception:  # noqa: BLE001
                    # Some sites keep long-poll connections open forever.
                    # Fall through — the content may already be rendered.
                    log.debug("networkidle timeout for %s", url)
            return page.content()
