# IPO Pipeline — Backend

A modular, polite, ban-resistant scraper for Indian IPO data. Writes
into the Supabase `ipos` table plus two append-only history tables
(`gmp_history`, `subscription_history`) and logs every run to
`scraping_runs`.

Designed to run from GitHub Actions on a cron — one invocation = one
"run", one report row per source in `scraping_runs`.

## Layout

```
backend/
├── main.py                  # FastAPI surface (unrelated to pipeline)
├── sql/
│   └── 0001_init_pipeline.sql   # Additive schema migration
└── pipeline/
    ├── __main__.py          # CLI entrypoint
    ├── config.py            # Settings + UA pool + retry status
    ├── http_client.py       # Polite per-host session + backoff
    ├── db.py                # Supabase writer
    ├── parse.py             # Shared slug / date / number parsing
    ├── runner.py            # Group orchestrator
    ├── registry.py          # Source + group registry
    └── sources/
        ├── base.py                       # Source ABC
        ├── chittorgarh_dashboard.py      # upcoming/open/closed IPOs
        ├── investorgain_gmp.py           # primary GMP (Playwright-rendered)
        ├── chittorgarh_subscription.py   # live bid status (Playwright-rendered)
        ├── chittorgarh_allotment.py      # registrar + allotment link
        ├── chittorgarh_drhp.py           # DRHP / RHP filings
        ├── chittorgarh_detail.py         # per-IPO deep scrape
        ├── chittorgarh_history_backfill.py # historical GMP / subscription backfill
        ├── _chittorgarh_history.py       # shared trend-table parsers
        ├── ipowatch_gmp.py               # secondary GMP cross-check
        ├── ipocentral_shareholder.py     # reservation breakdown
        ├── nse_current_issues.py         # NSE official API
        ├── bse_current_issues.py         # BSE official API
        └── calendar_events.py            # derives timeline_events
```

## First-time setup

1. **Install deps** (prefer a venv):
   ```bash
   cd backend
   python3 -m venv venv
   . venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Apply the migration** — open the Supabase SQL editor, paste
   `sql/0001_init_pipeline.sql`, and run it. The migration is
   idempotent; safe to re-run.

3. **Fill in `.env`**:
   ```bash
   cp .env.example .env
   # edit .env and set SUPABASE_URL + SUPABASE_KEY (service-role)
   ```

4. **List known sources / groups**:
   ```bash
   python -m pipeline list
   ```

5. **Run a group**:
   ```bash
   python -m pipeline run hot       # GMP + subscription
   python -m pipeline run core      # dashboard + NSE + BSE
   python -m pipeline run cold      # DRHP/RHP + allotment + shareholder
   python -m pipeline run detail    # per-IPO deep scrape (throttled)
   python -m pipeline run backfill  # historical GMP/subscription backfill (manual)
   python -m pipeline run all       # full pass
   ```

   Or run a specific source:
   ```bash
   python -m pipeline run investorgain_gmp
   ```

## How the ban-resistance works

The single most important lever is **per-host pacing**: the client
enforces a minimum gap between requests to the same host, plus random
jitter, plus a hard per-run cap. These are set in `config.py`:

| Knob | Default | What it does |
|------|---------|--------------|
| `per_host_min_gap_sec` | 6.0 | Minimum seconds between requests to one host |
| `per_host_jitter_sec`  | 4.0 | Random extra on top of the minimum gap |
| `inter_source_gap_sec` | 3.0 | Pause after a source finishes |
| `max_retries`          | 4   | Attempts per URL on retryable failures |
| `backoff_base_sec`     | 2.0 | Exponential backoff base (capped at 60s) |
| `per_host_max_requests_per_run` | 40 | Hard stop so a broken parser can't hammer a host |
| `detail_batch_size`    | 10  | Max IPOs deep-scraped per run |

Additional safeguards:

- **One `requests.Session` per host** — cookies stick, so sites that
  expect a user to warm up on the root (NSE, Chittorgarh) don't 403 us.
- **UA rotation per session** (not per request). Rotating per request
  looks like a bot; rotating per session looks like a person on a
  different machine today.
- **Retry-After honored** for 429/503. Exponential backoff otherwise.
- **Circuit breaker** — after two 401/403s on the same host, the
  client gives up on that host for the rest of the run.
- **Warm-ups** — every source that needs cookies pre-hits the site
  root before touching API/deep pages.

## How to tune without changing code

If you're getting blocked, in order of first resort:

1. Double `per_host_min_gap_sec`. That alone solves most bans.
2. Halve `per_host_max_requests_per_run` — run smaller, more often.
3. Move the affected source out of `hot` into `cold` in
   `registry.py`, so it runs less frequently.

## Groups and scheduling

The groups in `registry.py` are designed to be mapped onto cron
triggers in `.github/workflows/scrape.yml`:

| Group    | Suggested cadence | Scope |
|----------|-------------------|-------|
| `hot`    | every 30 min during IST market hours | GMP + subscription |
| `core`   | hourly                                | dashboard + NSE + BSE |
| `cold`   | every 6h                              | DRHP/RHP + allotment + shareholder |
| `detail` | daily                                 | per-IPO deep scrape |
| `backfill` | manual only                         | historical GMP / subscription for old IPOs |

`calendar_events` makes no network calls — it just re-derives
`timeline_events` from the date columns. It's appended to `core`,
`cold`, and `detail` groups so the timeline always reflects the
freshest dates.

## Append-only history

Two tables store time-series:

- `gmp_history` — every GMP observation from every source
- `subscription_history` — every subscription observation

The `ipos` table also gets the *latest* flattened numbers
(`current_gmp`, `subscription_total`, etc.) for fast frontend reads.
Views `v_latest_gmp` and `v_latest_subscription` are provided as an
alternative read path if you want to query the history tables directly.

### Backfilling historical IPOs

For IPOs that existed before the pipeline was running, there is no
history yet — the trend charts render empty. To fill them in:

```bash
python -m pipeline run backfill
```

This walks `ipos` rows that have a cached `detail_url` and zero
rows in the history tables, re-fetches the Chittorgarh detail page,
and pulls the "GMP Trend" + day-wise "Subscription Status" tables
into `gmp_history` / `subscription_history`. Rows are deduped by
`(slug, date)`, so re-running is safe. Capped at
`detail_batch_size` IPOs per invocation — run it repeatedly (or
dispatch the `backfill` workflow from the Actions tab) until
`fetch_ipos_missing_history` returns zero.

## Operational log

Every source invocation writes one row to `scraping_runs`:

```sql
select source, status, records_found, records_updated,
       records_appended, errors_count, duration_ms, started_at
from scraping_runs
order by started_at desc
limit 20;
```

If a source goes red for multiple runs in a row, check
`error_details` on those rows — it contains the exception trace for
crashes and the upstream URL/status for HTTP failures.
