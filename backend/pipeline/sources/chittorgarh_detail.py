"""Per-IPO detail scraper.

Populates the JSONB collections on `ipos` that drive the detail page:
about_company, financials, anchor_investors, shareholding, reservations,
objectives, documents, faqs, lead_managers, issue_type, fresh/ofs sizes.

Rate-limited tightly: we cap at `detail_batch_size` IPOs per run so a
single invocation never hammers Chittorgarh. Ordering is latest-first,
so upcoming/open IPOs refresh before historical ones.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional

from bs4 import BeautifulSoup, Tag

from ..parse import (
    canonical_slug,
    clean_text,
    parse_date,
    parse_int,
    parse_number,
    parse_price_band,
)
from .base import Source, SourceResult

_MONEY_RE = re.compile(r"([\d,.]+)\s*(cr|crore|lakh|lac)?", re.IGNORECASE)


class ChittorgarhDetail(Source):
    name = "chittorgarh_detail"

    def run(self) -> SourceResult:
        result = SourceResult()
        candidates = self.db.fetch_ipos_missing_detail(self.db.settings.detail_batch_size)
        if not candidates:
            result.status = "skipped"
            return result

        self.http.warm_up("https://www.chittorgarh.com/")
        now_iso = datetime.now(timezone.utc).isoformat()
        updates: list[dict[str, Any]] = []

        for ipo in candidates:
            url = ipo.get("detail_url")
            if not url:
                continue

            resp = self.http.get(url, referer="https://www.chittorgarh.com/")
            if resp is None or resp.status_code != 200:
                result.errors.append(f"{url} → {getattr(resp, 'status_code', 'no-response')}")
                continue

            try:
                row = self._parse_detail(ipo["slug"], resp.text)
            except Exception as exc:  # noqa: BLE001
                result.errors.append(f"{ipo['slug']}: {type(exc).__name__}: {exc}")
                continue

            if not row:
                continue
            row["last_scraped_at"] = now_iso
            row["scrape_source"] = self.name
            updates.append(row)

        if not updates:
            result.status = "partial" if result.errors else "skipped"
            return result

        result.records_found = len(updates)
        result.records_updated = self.db.upsert_ipos(updates)
        return result

    # -------------------------------------------------------------- #

    def _parse_detail(self, slug: str, html: str) -> Optional[dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        row: dict[str, Any] = {"slug": slug}

        about = _extract_about(soup)
        if about:
            row["about_company"] = about

        kv = _parse_keyvalue_tables(soup)
        self._apply_kv(row, kv)

        anchors = _parse_anchors(soup)
        if anchors:
            row["anchor_investors"] = anchors

        financials = _parse_financials(soup)
        if financials:
            row["financials"] = financials

        shareholding = _parse_shareholding(soup)
        if shareholding:
            row["shareholding"] = shareholding

        reservations = _parse_reservations(soup)
        if reservations:
            row["reservations"] = reservations

        objectives = _parse_objectives(soup)
        if objectives:
            row["objectives"] = objectives

        documents = _parse_documents(soup)
        if documents:
            row["documents"] = documents

        faqs = _parse_faqs(soup)
        if faqs:
            row["faqs"] = faqs

        # If nothing at all was found the detail page probably changed layout.
        if len(row) <= 1:
            return None
        return row

    def _apply_kv(self, row: dict[str, Any], kv: dict[str, str]) -> None:
        def g(*keys: str) -> Optional[str]:
            for k in keys:
                if k in kv and kv[k]:
                    return kv[k]
            return None

        val = g("price band", "ipo price", "issue price")
        if val:
            lo, hi = parse_price_band(val)
            if lo is not None:
                row["min_price"] = lo
            if hi is not None:
                row["max_price"] = hi

        val = g("face value")
        if val:
            fv = parse_number(val)
            if fv is not None:
                row["face_value"] = fv

        val = g("lot size", "market lot")
        if val:
            lot = parse_int(val)
            if lot:
                row["lot_size"] = lot

        val = g("issue size", "total issue size")
        if val:
            size = _money_to_cr(val)
            if size is not None:
                row["issue_size_cr"] = size

        val = g("fresh issue")
        if val:
            size = _money_to_cr(val)
            if size is not None:
                row["fresh_issue_size_cr"] = size

        val = g("offer for sale", "ofs")
        if val:
            size = _money_to_cr(val)
            if size is not None:
                row["ofs_size_cr"] = size

        val = g("issue type")
        if val:
            row["issue_type"] = val

        val = g("listing at", "listing on")
        if val:
            exch = _split_exchanges(val)
            if exch:
                row["exchange"] = exch

        val = g("registrar", "registrar to issue")
        if val:
            row["registrar"] = val

        val = g("lead manager", "book running lead managers", "brlm")
        if val:
            managers = [m.strip() for m in re.split(r",|\n|/", val) if m.strip()]
            if managers:
                row["lead_managers"] = managers

        val = g("basis of allotment", "allotment date")
        if val:
            d = parse_date(val)
            if d:
                row["allotment_date"] = d

        val = g("refund date", "initiation of refunds")
        if val:
            d = parse_date(val)
            if d:
                row["refund_date"] = d

        val = g("credit of shares", "credit to demat")
        if val:
            d = parse_date(val)
            if d:
                row["demat_credit_date"] = d

        val = g("listing date")
        if val:
            d = parse_date(val)
            if d:
                row["listing_date"] = d


# -------------------- parsing helpers --------------------------------- #


def _extract_about(soup: BeautifulSoup) -> str:
    heading = soup.find(
        lambda t: t.name in ("h2", "h3")
        and "about" in t.get_text(" ", strip=True).lower()
    )
    if not heading:
        return ""
    paragraphs: list[str] = []
    for sib in heading.find_all_next(limit=6):
        if sib.name in ("h2", "h3"):
            break
        if sib.name == "p":
            txt = clean_text(sib.get_text(" ", strip=True))
            if txt:
                paragraphs.append(txt)
    return " ".join(paragraphs)[:2000]


def _parse_keyvalue_tables(soup: BeautifulSoup) -> dict[str, str]:
    """Chittorgarh pages render a bunch of 2-column `<table>`s with
    label → value. Merge them all into a single lowercase-keyed dict."""
    out: dict[str, str] = {}
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        for tr in rows:
            cells = tr.find_all(["td", "th"])
            if len(cells) != 2:
                continue
            key = clean_text(cells[0].get_text(" ", strip=True)).lower().rstrip(":")
            value = clean_text(cells[1].get_text(" ", strip=True))
            if key and value and key not in out:
                out[key] = value
    return out


def _parse_anchors(soup: BeautifulSoup) -> list[dict[str, Any]]:
    heading = soup.find(
        lambda t: t.name in ("h2", "h3", "h4")
        and "anchor" in t.get_text(" ", strip=True).lower()
    )
    if not heading:
        return []
    table = heading.find_next("table")
    if not table:
        return []
    return _generic_table_to_json(table)


def _parse_financials(soup: BeautifulSoup) -> list[dict[str, Any]]:
    heading = soup.find(
        lambda t: t.name in ("h2", "h3", "h4")
        and "financial" in t.get_text(" ", strip=True).lower()
    )
    if not heading:
        return []
    table = heading.find_next("table")
    if not table:
        return []
    return _generic_table_to_json(table)


def _parse_shareholding(soup: BeautifulSoup) -> list[dict[str, Any]]:
    heading = soup.find(
        lambda t: t.name in ("h2", "h3", "h4")
        and "shareholding" in t.get_text(" ", strip=True).lower()
    )
    if not heading:
        return []
    table = heading.find_next("table")
    if not table:
        return []
    return _generic_table_to_json(table)


def _parse_reservations(soup: BeautifulSoup) -> list[dict[str, Any]]:
    heading = soup.find(
        lambda t: t.name in ("h2", "h3", "h4")
        and ("reservation" in t.get_text(" ", strip=True).lower()
             or "allocation" in t.get_text(" ", strip=True).lower())
    )
    if not heading:
        return []
    table = heading.find_next("table")
    if not table:
        return []
    return _generic_table_to_json(table)


def _parse_objectives(soup: BeautifulSoup) -> list[dict[str, Any]]:
    heading = soup.find(
        lambda t: t.name in ("h2", "h3", "h4")
        and "object" in t.get_text(" ", strip=True).lower()
    )
    if not heading:
        return []
    out: list[dict[str, Any]] = []
    for sib in heading.find_all_next(limit=8):
        if sib.name in ("h2", "h3"):
            break
        if sib.name in ("ul", "ol"):
            for li in sib.find_all("li"):
                txt = clean_text(li.get_text(" ", strip=True))
                if txt:
                    out.append({"objective": txt})
            break
    return out


def _parse_documents(soup: BeautifulSoup) -> list[dict[str, Any]]:
    """Pulls PDF links under headings like "Prospectus" or "Download"."""
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not href.lower().endswith(".pdf"):
            continue
        if href in seen:
            continue
        seen.add(href)
        title = clean_text(a.get_text(" ", strip=True)) or "Document"
        full_url = href if href.startswith("http") else f"https://www.chittorgarh.com{href}"
        out.append({"title": title, "url": full_url, "type": "pdf"})
    return out[:12]


def _parse_faqs(soup: BeautifulSoup) -> list[dict[str, Any]]:
    heading = soup.find(
        lambda t: t.name in ("h2", "h3")
        and ("faq" in t.get_text(" ", strip=True).lower()
             or "frequently asked" in t.get_text(" ", strip=True).lower())
    )
    if not heading:
        return []
    out: list[dict[str, Any]] = []
    question: Optional[str] = None
    for sib in heading.find_all_next(limit=40):
        if sib.name in ("h2",) and sib is not heading:
            break
        if sib.name in ("h3", "h4", "strong", "b"):
            text = clean_text(sib.get_text(" ", strip=True))
            if text.endswith("?"):
                question = text
        elif sib.name == "p" and question:
            answer = clean_text(sib.get_text(" ", strip=True))
            if answer:
                out.append({"question": question, "answer": answer})
                question = None
    return out


def _generic_table_to_json(table: Tag) -> list[dict[str, Any]]:
    headers = [clean_text(th.get_text(" ", strip=True)) for th in table.find_all("th")]
    rows: list[dict[str, Any]] = []
    for tr in table.find_all("tr"):
        tds = tr.find_all("td")
        if not tds:
            continue
        row: dict[str, Any] = {}
        for i, td in enumerate(tds):
            key = headers[i] if i < len(headers) else f"col_{i}"
            row[key or f"col_{i}"] = clean_text(td.get_text(" ", strip=True))
        if any(v for v in row.values()):
            rows.append(row)
    return rows


def _money_to_cr(text: str) -> Optional[float]:
    """Convert '₹123.45 Cr' or '12.5 lakh' into crores as float."""
    if not text:
        return None
    lowered = text.lower()
    m = _MONEY_RE.search(lowered.replace(",", ""))
    if not m:
        return None
    try:
        value = float(m.group(1))
    except ValueError:
        return None
    unit = (m.group(2) or "").lower()
    if unit in ("lakh", "lac"):
        return round(value / 100, 2)
    return value


def _split_exchanges(text: str) -> list[str]:
    out: list[str] = []
    t = text.upper()
    for ex in ("BSE SME", "NSE SME", "BSE", "NSE"):
        if ex in t and ex.split()[0] not in out:
            out.append(ex.split()[0])
    return out
