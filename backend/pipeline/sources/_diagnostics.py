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


# High-specificity challenge markers only. Earlier versions included
# "captcha" and "access denied" — both produced false positives because
# normal React pages embed reCAPTCHA scripts and legitimate pages have
# unrelated "access denied" strings in error banners.
_BLOCK_MARKERS = (
    "just a moment",
    "checking your browser",
    "enable javascript and cookies",
    "cf-challenge-running",
    "cf_chl_opt",
    "cf-browser-verification",
    "please verify you are a human",
    "_cf_chl_opt",
)


def classify_response(resp: Optional[requests.Response]) -> str:
    """Return a short tag describing what we think the response is.
    The tag is stable so you can grep scraping_runs for it."""
    if resp is None:
        return "no-response"
    body = (resp.text or "").lower()[:16384]
    if resp.status_code >= 500:
        return f"http-{resp.status_code}"
    if resp.status_code in (401, 403):
        return "blocked-http"
    if any(m in body for m in _BLOCK_MARKERS):
        return "blocked-challenge"
    server = (resp.headers.get("Server") or "").lower()
    if server.startswith("cloudflare") and resp.status_code in (403, 503):
        return "blocked-challenge"
    return "ok"


def body_hints(resp: Optional[requests.Response]) -> str:
    """One-line fingerprint of the response body to help distinguish
    'Cloudflare ate it' from 'Next.js renders client-side' from 'real
    page but selector missed'. Dropped into error messages so the next
    run tells us which reality we're in without a browser DevTools
    session against Supabase."""
    if resp is None:
        return ""
    text = resp.text or ""
    lower = text.lower()
    hints = [
        f"len={len(text)}",
        f"tables={lower.count('<table')}",
        f"trs={lower.count('<tr')}",
    ]
    if "__next_data__" in lower or '"__next_data__"' in lower:
        hints.append("next-data=yes")
    if 'id="__nuxt"' in lower or "window.__nuxt__" in lower:
        hints.append("nuxt=yes")
    if "react-root" in lower or "data-reactroot" in lower or "charset=" not in lower and "charSet=" in text:
        hints.append("react-ssr=yes")
    srv = (resp.headers.get("Server") or "").lower()
    if srv:
        hints.append(f"server={srv.split()[0]}")
    if resp.headers.get("cf-ray"):
        hints.append("cf-ray=yes")
    return " ".join(hints)


def snippet(resp: Optional[requests.Response], limit: int = 600) -> str:
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
