-- ============================================================
-- IPO Pipeline — additive schema migration
--
-- Idempotent. Safe to re-run. Only adds columns/tables that
-- don't already exist. Does NOT drop or rename anything.
--
-- Run this in the Supabase SQL editor (as project owner) once.
-- ============================================================

-- ---------- ipos: ensure extra columns exist -----------------
-- These are all columns the Astro frontend reads. Some may
-- already exist; IF NOT EXISTS makes this safe.

ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS parent_company     text;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS industry_sector    text;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS drhp_status        text;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS drhp_filed_date    date;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS rhp_status         text;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS rhp_filed_date     date;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS sebi_approval_date date;

-- Timeline dates the calendar_events source needs in order to derive
-- timeline_events JSONB. Safe if already present.
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS allotment_date     date;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS refund_date        date;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS demat_credit_date  date;

ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS kostak_rate        numeric;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS subject_rate       numeric;

ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS subscription_bnii      numeric;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS subscription_employee  numeric;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS subscription_shareholder numeric;

ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS actual_listing_price   numeric;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS listing_gain_percent   numeric;

ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS registrar              text;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS registrar_website      text;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS allotment_link         text;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS allotment_link_active  boolean DEFAULT false;

ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS lead_managers          text[];
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS exchange               text[];
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS company_website        text;

ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS fresh_issue_size_cr    numeric;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS ofs_size_cr            numeric;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS face_value             numeric;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS issue_type             text;

ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS about_company          text;

-- URL to the per-IPO detail page on the primary source. Cached so the
-- detail scraper doesn't need to re-resolve it every run.
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS detail_url             text;

-- JSONB collections referenced by the detail page
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS financials             jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS shareholding           jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS objectives             jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS faqs                   jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS documents              jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS anchor_investors       jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS comparables            jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS reviews                jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS reservations           jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS risks                  jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS technical_analysis_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS timeline_events        jsonb DEFAULT '[]'::jsonb;

-- Pipeline bookkeeping
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS last_scraped_at        timestamptz;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS scrape_source          text;
ALTER TABLE public.ipos ADD COLUMN IF NOT EXISTS data_quality_score     int;

-- Indexes for common frontend queries
CREATE INDEX IF NOT EXISTS idx_ipos_status      ON public.ipos (status);
CREATE INDEX IF NOT EXISTS idx_ipos_open_date   ON public.ipos (open_date);
CREATE INDEX IF NOT EXISTS idx_ipos_close_date  ON public.ipos (close_date);
CREATE INDEX IF NOT EXISTS idx_ipos_listing_date ON public.ipos (listing_date);
CREATE INDEX IF NOT EXISTS idx_ipos_category    ON public.ipos (category);
CREATE INDEX IF NOT EXISTS idx_ipos_featured    ON public.ipos (is_featured) WHERE is_featured = true;

-- ---------- gmp_history: append-only time series -------------
CREATE TABLE IF NOT EXISTS public.gmp_history (
    id              bigserial PRIMARY KEY,
    ipo_slug        text        NOT NULL,
    gmp_amount      numeric,
    gmp_percentage  numeric,
    kostak_rate     numeric,
    subject_rate    numeric,
    issue_price     numeric,
    expected_listing_price numeric,
    source          text        NOT NULL,
    scraped_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gmp_history_slug_time
    ON public.gmp_history (ipo_slug, scraped_at DESC);

CREATE INDEX IF NOT EXISTS idx_gmp_history_time
    ON public.gmp_history (scraped_at DESC);

-- ---------- subscription_history: append-only ----------------
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id              bigserial PRIMARY KEY,
    ipo_slug        text        NOT NULL,
    subscription_retail      numeric,
    subscription_nii         numeric,
    subscription_bnii        numeric,
    subscription_snii        numeric,
    subscription_qib         numeric,
    subscription_employee    numeric,
    subscription_shareholder numeric,
    subscription_total       numeric,
    day_number      int,
    source          text        NOT NULL,
    scraped_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_history_slug_time
    ON public.subscription_history (ipo_slug, scraped_at DESC);

-- ---------- scraping_runs: operational log -------------------
CREATE TABLE IF NOT EXISTS public.scraping_runs (
    id               bigserial PRIMARY KEY,
    run_id           uuid        NOT NULL,
    source           text        NOT NULL,
    status           text        NOT NULL, -- 'success' | 'partial' | 'failed' | 'skipped'
    records_found    int         DEFAULT 0,
    records_updated  int         DEFAULT 0,
    records_appended int         DEFAULT 0,
    errors_count     int         DEFAULT 0,
    error_details    jsonb,
    http_status_codes jsonb,
    started_at       timestamptz NOT NULL DEFAULT now(),
    finished_at      timestamptz,
    duration_ms      int
);

CREATE INDEX IF NOT EXISTS idx_runs_source_time
    ON public.scraping_runs (source, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_runs_run_id
    ON public.scraping_runs (run_id);

-- ---------- helpful views ------------------------------------
-- Latest GMP per IPO (for convenience; the frontend can query
-- this view directly or keep using ipos.current_gmp).
CREATE OR REPLACE VIEW public.v_latest_gmp AS
SELECT DISTINCT ON (ipo_slug)
    ipo_slug,
    gmp_amount,
    gmp_percentage,
    kostak_rate,
    subject_rate,
    issue_price,
    expected_listing_price,
    source,
    scraped_at
FROM public.gmp_history
ORDER BY ipo_slug, scraped_at DESC;

CREATE OR REPLACE VIEW public.v_latest_subscription AS
SELECT DISTINCT ON (ipo_slug)
    ipo_slug,
    subscription_retail,
    subscription_nii,
    subscription_bnii,
    subscription_snii,
    subscription_qib,
    subscription_employee,
    subscription_shareholder,
    subscription_total,
    day_number,
    source,
    scraped_at
FROM public.subscription_history
ORDER BY ipo_slug, scraped_at DESC;

-- ---------- RLS: read-only for anon, writable by service role ----
-- If RLS was enabled on ipos previously, these policies shouldn't
-- collide since we use a service-role key on the backend. The new
-- tables below get public read + service-only write.

ALTER TABLE public.gmp_history          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_runs        ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gmp_history' AND policyname='anon read gmp_history') THEN
        CREATE POLICY "anon read gmp_history" ON public.gmp_history
            FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscription_history' AND policyname='anon read sub_history') THEN
        CREATE POLICY "anon read sub_history" ON public.subscription_history
            FOR SELECT TO anon USING (true);
    END IF;
    -- scraping_runs stays service-role only; no anon read policy.
END $$;
