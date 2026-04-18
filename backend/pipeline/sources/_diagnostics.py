"""Response diagnostics shared by all HTML/JSON sources.

When a source returns 200 OK but the body is garbage (Cloudflare challenge,
JSONP callback, bot-wall HTML), the old code just wrote a cryptic status
with no hint of what went wrong. This module puts a useful snippet and
a classification tag into `result.errors` so the next run's
`scraping_runs.error_details` tells you *why*, not just *that*.

Used by: dashboard, GMP, subscription, BSE.
"""

from __future__ import annotations

from typing import Any, Optional

import requests


_BLOCK_MARKERS = (
    "just a moment",
    "checking your browser",
    "enable javascript and cookies",
    "cf-challenge",
    "attention required",
    "access denied",
    "captcha",
    "please verify you are a human",
)


def classify_response(resp: Optional[requests.Response]) -> str:
    """Return a short tag describing what we think the response is.
    The tag is stable so you can grep scraping_runs for it."""
    if resp is None:
        return "no-response"
    body = (resp.text or "").lower()[:8192]
    if resp.status_code >= 500:
        return f"http-{resp.status_code}"
    if resp.status_code in (401, 403):
        return "blocked-http"
    if any(m in body for m in _BLOCK_MARKERS):
        return "blocked-challenge"
    server = (resp.headers.get("Server") or "").lower()
    cf_ray = resp.headers.get("cf-ray") or resp.headers.get("CF-RAY")
    if cf_ray and ("challenge" in body or "cloudflare" in body):
        return "blocked-challenge"
    if server.startswith("cloudflare") and resp.status_code in (403, 503):
        return "blocked-challenge"
    return "ok"


def snippet(resp: Optional[requests.Response], limit: int = 240) -> str:
    """First `limit` chars of body, collapsed to a single line, safe for
    `scraping_runs.error_details`. Strips NUL bytes because Postgres
    JSONB rejects \\u0000 and the detail column is JSONB."""
    if resp is None:
        return ""
    body = (resp.text or "").replace("\x00", "").strip()
    if not body:
        return ""
    body = " ".join(body.split())
    return body[:limit] + ("…" if len(body) > limit else "")


def describe_failure(
    resp: Optional[requests.Response],
    *,
    url: str,
    expected: str,
) -> str:
    """Build a diagnostic string for result.errors that names the URL,
    what we expected to find (e.g. 'GMP table'), and what we actually got.

    Shape: '<url> → <status> [<tag>]: <expected not found>: <snippet>'
    """
    status = getattr(resp, "status_code", "no-response")
    tag = classify_response(resp)
    snip = snippet(resp)
    head = f"{url} → {status} [{tag}]"
    if snip:
        return f"{head}: {expected} not found: {snip}"
    return f"{head}: {expected} not found"
