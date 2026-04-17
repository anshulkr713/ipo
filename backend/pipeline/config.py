"""Environment loading and global pipeline constants."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH, override=False)


class ConfigError(RuntimeError):
    pass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_key: str

    # Rate-limit knobs. Tuned conservatively so a single run stays
    # well under anything that looks like a bot burst.
    per_host_min_gap_sec: float = 6.0        # minimum seconds between hits on the same host
    per_host_jitter_sec: float = 4.0         # add up to this many seconds of random jitter
    inter_source_gap_sec: float = 3.0        # gap after a full source finishes
    max_retries: int = 4
    backoff_base_sec: float = 2.0            # exponential base for 429/5xx backoff
    backoff_cap_sec: float = 60.0
    request_timeout_sec: int = 25
    per_host_max_requests_per_run: int = 40  # hard ceiling per host per invocation

    # Detail-scrape throttle: how many per-IPO detail pages we pull per run.
    detail_batch_size: int = 10

    # Upload batch size for Supabase chunks.
    upload_chunk_size: int = 40

    # A polite contact string surfaced in User-Agent when operators want to reach us.
    operator_contact: str = field(
        default_factory=lambda: os.getenv("OPERATOR_CONTACT", "")
    )

    @staticmethod
    def load() -> "Settings":
        url = os.getenv("SUPABASE_URL", "").strip()
        key = os.getenv("SUPABASE_KEY", "").strip()
        if not url or url.startswith("https://your-project-id"):
            raise ConfigError("SUPABASE_URL is not set. Populate backend/.env.")
        if not key or "your-service-role-key-here" in key:
            raise ConfigError("SUPABASE_KEY is not set. Populate backend/.env.")
        return Settings(supabase_url=url, supabase_key=key)


# Browser user-agents we rotate between sessions. We keep a short list of
# current, real Chrome/Firefox strings — long lists raise the odds of a
# mismatch between UA and other fingerprints.
USER_AGENTS: tuple[str, ...] = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
)

# HTTP status codes that should trigger polite retry with backoff.
RETRYABLE_STATUS: frozenset[int] = frozenset({408, 425, 429, 500, 502, 503, 504})
