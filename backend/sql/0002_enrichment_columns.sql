-- ============================================================
-- 0002_enrichment_columns — additive columns for the second wave
-- of sources (shareholder quota, prospectus links, anchor totals).
--
-- Idempotent. Safe to re-run.
-- ============================================================

-- Shareholder quota enrichment (ipoji_shareholder_quota source).
-- `shareholder_quota` flags IPOs that reserve a portion of the issue
-- for parent-company shareholders. `parent_company` already exists
-- from migration 0001; we just add the boolean here.
ALTER TABLE public.ipos
    ADD COLUMN IF NOT EXISTS shareholder_quota boolean DEFAULT false;

-- Prospectus / DRHP direct-download URLs (for the detail page's
-- "documents" section, populated by the DRHP scraper). The original
-- `documents` jsonb stays for structured entries; these two are
-- convenience direct links surfaced in IPO cards.
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS prospectus_url text;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS drhp_url       text;

-- Anchor-book total: aggregate rupee amount raised from anchor
-- investors (pre-IPO day). `anchor_investors` jsonb captures the
-- itemised list; `anchor_amount_cr` is the sum for quick filtering.
ALTER TABLE public.ipos
    ADD COLUMN IF NOT EXISTS anchor_amount_cr numeric;

-- Indexes that these new columns enable.
CREATE INDEX IF NOT EXISTS idx_ipos_shareholder_quota
    ON public.ipos (shareholder_quota)
    WHERE shareholder_quota = true;
