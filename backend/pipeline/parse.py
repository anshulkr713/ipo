"""Shared parsing helpers. One canonical implementation for the whole pipeline."""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Optional

# ---- text ------------------------------------------------------------

_WS_RE = re.compile(r"\s+")


def clean_text(text: Optional[str]) -> str:
    if not text:
        return ""
    # Replace non-breaking spaces + collapse whitespace.
    return _WS_RE.sub(" ", text.replace("\xa0", " ")).strip()


# ---- slug ------------------------------------------------------------

_SLUG_NOISE = re.compile(
    r"\(sme\)|\(mainboard\)|\b(ipo|limited|ltd\.?|pvt\.?|private|company)\b",
    flags=re.IGNORECASE,
)
_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def canonical_slug(name: Optional[str]) -> str:
    """Canonical slug used as the primary key across all sources.

    Idempotent. Designed so "Zepto IPO", "Zepto Limited", and "Zepto
    Private Limited" all collapse to "zepto". Must stay in sync with the
    slug the frontend expects in URLs.
    """
    if not name:
        return ""
    lower = name.lower()
    lower = _SLUG_NOISE.sub(" ", lower)
    lower = _NON_ALNUM.sub("-", lower)
    return lower.strip("-")


# ---- numbers ---------------------------------------------------------

_NUM_RE = re.compile(r"-?\d[\d,]*(?:\.\d+)?")


def parse_number(text: Optional[str]) -> Optional[float]:
    if text is None:
        return None
    s = str(text)
    if not s or s.strip() in {"-", "N/A", "NA", "--", "—"}:
        return None
    s = s.replace("\u20b9", "").replace("Rs.", "").replace("Rs", "").replace(",", "")
    m = _NUM_RE.search(s)
    if not m:
        return None
    try:
        return float(m.group())
    except ValueError:
        return None


def parse_int(text: Optional[str]) -> Optional[int]:
    val = parse_number(text)
    return int(val) if val is not None else None


# Parses "₹76 – ₹81" or "76-81" into (low, high).
def parse_price_band(text: Optional[str]) -> tuple[Optional[int], Optional[int]]:
    if not text:
        return (None, None)
    nums = [int(float(n.replace(",", ""))) for n in re.findall(r"\d[\d,]*(?:\.\d+)?", text)]
    if not nums:
        return (None, None)
    if len(nums) == 1:
        return (nums[0], nums[0])
    return (min(nums), max(nums))


# ---- dates -----------------------------------------------------------

_DATE_FORMATS: tuple[str, ...] = (
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%d %b %Y",
    "%d %B %Y",
    "%b %d, %Y",
    "%B %d, %Y",
    "%d-%b-%Y",
    "%d-%B-%Y",
)

_ORDINAL_RE = re.compile(r"(?<=\d)(st|nd|rd|th)", flags=re.IGNORECASE)


def parse_date(text: Optional[str]) -> Optional[str]:
    """Parse a date in any of the common Indian-market formats. Returns YYYY-MM-DD or None."""
    if not text:
        return None
    s = clean_text(text)
    if not s or s in {"-", "N/A", "NA", "TBA", "--", "—"}:
        return None
    s = _ORDINAL_RE.sub("", s)

    # Some sources prefix the ISO date, e.g. "2026-01-13 06th – 08th Jan 2026".
    iso_match = re.match(r"^(\d{4}-\d{2}-\d{2})", s)
    if iso_match:
        try:
            return datetime.strptime(iso_match.group(1), "%Y-%m-%d").date().isoformat()
        except ValueError:
            pass

    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def parse_date_range(text: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Parse strings like "06 – 08 Jan 2026" or "6th – 8th Jan 2026" into (start, end) ISO dates."""
    if not text:
        return (None, None)
    s = clean_text(text)
    s = _ORDINAL_RE.sub("", s)
    if not s:
        return (None, None)

    sep = None
    for candidate in ("–", "—", " to ", "-"):
        if candidate in s:
            sep = candidate
            break
    if sep is None:
        single = parse_date(s)
        return (single, single)

    left, right = s.split(sep, 1)
    left, right = left.strip(), right.strip()
    end = parse_date(right)
    start = parse_date(left)

    if start is None and end is not None:
        # Left side is a bare day number — e.g. "06" — inherit month/year from the right.
        day_match = re.search(r"\d+", left)
        if day_match:
            try:
                end_d = datetime.fromisoformat(end).date()
                start = end_d.replace(day=int(day_match.group())).isoformat()
            except ValueError:
                start = None
    return (start, end)


# ---- status ----------------------------------------------------------

def determine_status(open_date: Optional[str], close_date: Optional[str], listing_date: Optional[str] = None) -> str:
    today = date.today().isoformat()
    if listing_date and today >= listing_date:
        return "listed"
    if not open_date or not close_date:
        return "upcoming"
    if today < open_date:
        return "upcoming"
    if today > close_date:
        return "closed"
    return "open"


# ---- category --------------------------------------------------------

def detect_category(name: str, extra_hint: str = "") -> str:
    haystack = f"{name or ''} {extra_hint or ''}".lower()
    if " sme" in f" {haystack}" or "(sme)" in haystack or haystack.endswith(" sme"):
        return "SME"
    return "Mainboard"
