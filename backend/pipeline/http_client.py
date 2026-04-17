"""Polite HTTP client with per-host rate limiting, backoff, and UA rotation.

Design goals:
  * One `requests.Session` per host so cookies stick — many sites reject
    naked requests but accept a session that first warmed up on the root.
  * Never two requests to the same host within `per_host_min_gap_sec` +
    random jitter. That single rule is the biggest anti-ban lever.
  * Honor Retry-After on 429/503. Fall back to exponential backoff otherwise.
  * Hard per-host request cap per run so a broken parser can't hammer a site.
"""

from __future__ import annotations

import random
import time
from dataclasses import dataclass, field
from typing import Optional
from urllib.parse import urlparse

import requests

from .config import RETRYABLE_STATUS, USER_AGENTS, Settings
from .logger import get_logger

log = get_logger("pipeline.http")


@dataclass
class _HostState:
    session: requests.Session
    last_request_at: float = 0.0
    request_count: int = 0
    user_agent: str = ""
    # If the site serves a 403 or 429 more than once, back off hard for
    # the rest of the run rather than keep pushing.
    consecutive_blocks: int = 0


_DEFAULT_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "DNT": "1",
}


class HostBlocked(RuntimeError):
    """Raised when a host has blocked us too many times this run."""


class PoliteClient:
    """Rate-limited HTTP client shared across all sources in a single run.

    Not thread-safe — the pipeline is intentionally sequential.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self._hosts: dict[str, _HostState] = {}

    # -------------------------------------------------------------- #
    # session management
    # -------------------------------------------------------------- #

    def _host_of(self, url: str) -> str:
        return urlparse(url).netloc.lower()

    def _state_for(self, host: str) -> _HostState:
        st = self._hosts.get(host)
        if st is None:
            sess = requests.Session()
            ua = random.choice(USER_AGENTS)
            sess.headers.update(_DEFAULT_HEADERS)
            sess.headers["User-Agent"] = ua
            st = _HostState(session=sess, user_agent=ua)
            self._hosts[host] = st
        return st

    # -------------------------------------------------------------- #
    # core fetch
    # -------------------------------------------------------------- #

    def get(
        self,
        url: str,
        *,
        referer: Optional[str] = None,
        extra_headers: Optional[dict[str, str]] = None,
        accept_json: bool = False,
    ) -> Optional[requests.Response]:
        host = self._host_of(url)
        st = self._state_for(host)

        if st.consecutive_blocks >= 2:
            log.warning(
                "host circuit-broken for this run; skipping",
                extra={"host": host},
            )
            raise HostBlocked(host)

        if st.request_count >= self.settings.per_host_max_requests_per_run:
            log.warning(
                "per-host request cap hit; skipping",
                extra={"host": host, "records": st.request_count},
            )
            raise HostBlocked(host)

        self._wait_for_host(st)

        headers: dict[str, str] = {}
        if referer:
            headers["Referer"] = referer
            headers["Sec-Fetch-Site"] = "same-origin"
        if accept_json:
            headers["Accept"] = "application/json, text/plain, */*"
        if extra_headers:
            headers.update(extra_headers)

        backoff = self.settings.backoff_base_sec
        last_status: Optional[int] = None

        for attempt in range(1, self.settings.max_retries + 1):
            try:
                resp = st.session.get(
                    url,
                    headers=headers,
                    timeout=self.settings.request_timeout_sec,
                    allow_redirects=True,
                )
            except requests.RequestException as exc:
                log.warning(
                    "request failed",
                    extra={"host": host, "attempt": attempt},
                    exc_info=exc,
                )
                time.sleep(min(backoff, self.settings.backoff_cap_sec))
                backoff *= 2
                continue
            finally:
                st.last_request_at = time.monotonic()
                st.request_count += 1

            last_status = resp.status_code

            if resp.status_code == 200:
                st.consecutive_blocks = 0
                return resp

            if resp.status_code in (401, 403):
                st.consecutive_blocks += 1
                log.warning(
                    "blocked response",
                    extra={"host": host, "status_code": resp.status_code, "attempt": attempt},
                )
                # Back off hard — and don't keep retrying if we've already
                # been blocked once.
                time.sleep(min(backoff * 2, self.settings.backoff_cap_sec))
                backoff *= 2
                continue

            if resp.status_code in RETRYABLE_STATUS:
                wait = self._retry_after(resp) or backoff
                log.info(
                    "retryable response",
                    extra={"host": host, "status_code": resp.status_code, "attempt": attempt},
                )
                time.sleep(min(wait, self.settings.backoff_cap_sec))
                backoff *= 2
                continue

            # 4xx non-retryable or unexpected — give up for this URL.
            log.info(
                "non-retryable response",
                extra={"host": host, "status_code": resp.status_code, "attempt": attempt},
            )
            return resp

        log.error(
            "exhausted retries",
            extra={"host": host, "status_code": last_status or 0},
        )
        return None

    # -------------------------------------------------------------- #
    # helpers
    # -------------------------------------------------------------- #

    def warm_up(self, root_url: str) -> None:
        """Hit the site root first so we pick up session cookies before
        requesting a deeper URL. Many anti-bot layers require this."""
        self.get(root_url)

    def _wait_for_host(self, st: _HostState) -> None:
        gap = self.settings.per_host_min_gap_sec + random.uniform(
            0.0, self.settings.per_host_jitter_sec
        )
        elapsed = time.monotonic() - st.last_request_at
        if st.last_request_at and elapsed < gap:
            time.sleep(gap - elapsed)

    def _retry_after(self, resp: requests.Response) -> Optional[float]:
        header = resp.headers.get("Retry-After")
        if not header:
            return None
        try:
            return float(header)
        except ValueError:
            return None
