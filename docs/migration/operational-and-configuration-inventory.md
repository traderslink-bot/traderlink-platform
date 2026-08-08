# TraderLink Operational and Configuration Inventory

The consolidated production go-live checklist is maintained in
[TraderLink Platform Live Launch Readiness](traderlink-platform-live-launch-readiness.md).
This inventory supplies configuration evidence; the launch-readiness document
is the single cross-feature status and acceptance view.

**Phase:** 1 - inventory and baseline  
**Status:** Legacy source inventory complete; accepted replacement configuration names are updated through Phase 3. Installed Big Time machine-schedule state remains deferred and is not a Journal blocker.
**Safety:** Values of secrets, tokens, user IDs, account IDs, and private origins are intentionally omitted.

## Runtime and lifecycle commands

| Area | Package commands | Current ownership/disposition |
| --- | --- | --- |
| Development/runtime | `dev`, `start` | Both use the protected V3 local-server wrapper. Replace the V3-named entry point only after Platform owner/access and loopback protection are available. |
| Build/static checks | `build`, `build:webpack`, `lint`, `check` | Preserve. Academy registry validation is a required pre-build safeguard. `check` currently includes a full build. |
| Tests | `test`, `test:watch`, `test:e2e`, `test:e2e:headed`, `test:e2e:level-analysis` | Preserve/recalibrate to replacement boundaries. No tests were run in Phase 1. |
| Deployment | `deploy:prod`, `deploy:prod:check` | Preserve the guarded deployment path. Never call raw production Vercel deployment as replacement work. |
| Academy | `validate:academy-registry` | Preserve as Academy progress/slug protection. |
| Market/Levels research | `audit:market-structure`, `calibrate:market-structure`, `debug:trade-analysis`, `compare:trade-debug`, `compare:levels-system`, `build:ibkr-backfill-manifest`, readiness summaries, `verify:levels-system`, `verify:layer2`, `verify:layer3` | Operational/research. Keep supported reusable tooling; separate from Journal truth/ordinary analytics acceptance. |
| Import/review calibration | `calibrate:decision-review`, `compare:decision-review-calibrations`, `calibrate:saved-import` | Legacy calibration evidence. Map useful Data Decision behavior; do not make it an ordinary dashboard gate. |
| Big Time content | `bigtime:scrape`, `bigtime:scrape:poll`, `bigtime:local:run`, `bigtime:local:install-task`, `bigtime:local:status` | Preserve as low-priority News/content automation. It is outside the core Journal/database replacement; resolve machine schedule ownership only before changing/reactivating it or cleaning related folders. |
| V3 verification | all `verify:ti-v3:*` commands and GA scale scripts | Legacy acceptance evidence. Replace with Platform/Journal/Analytics checks in stages; do not simply disable before equivalent safeguards exist. |
| Aggregate verification | `verify:all` | Rework at a checkpoint so it targets accepted module contracts rather than preserving V3 architecture. |

## Script file inventory

### Repository scripts

- `scripts/guard-production-deploy.cjs`: validates branch, remote, clean state, Vercel project and allowed paths before production deploy.
- `scripts/load-temporary-ibkr-statement.ts`: untracked January IBKR test loader; can dry-run/replace and creates a timestamped pre-load backup. Preservation input, not the final importer.
- `scripts/run-trader-intelligence-local-server-node.mjs`: older Node local-server wrapper; V3 listener token/loopback behavior.

### `src/scripts`

- `audit-experimental-market-structure.ts`.
- `build-ibkr-daily-4h-backfill-manifest.ts`.
- `build-ibkr-warehouse-backfill-manifest.ts`.
- `compare-decision-review-calibrations.ts`.
- `compare-levels-system-support-resistance.ts`.
- `compare-trade-analysis-debug-runs.ts`.
- `debug-trade-analysis-request.ts`.
- `run-decision-review-quality-dashboard.ts`.
- `run-ibkr-grouping-review-report.ts`.
- `run-saved-import-calibration.ts`.
- `run-trader-intelligence-local-server.ts`.
- `summarize-decision-review-calibration.ts`.
- `summarize-market-data-readiness.ts`.
- `summarize-real-data-calibration-public.ts`.
- `summarize-session-time-readiness.ts`.
- `verify-layer2-pattern-detection.ts`.
- `verify-layer3-pattern-normalization.ts`.
- `verify-trader-intelligence-v3-architecture.ts`.
- `verify-trader-intelligence-v3-ga0-b.ts`.
- `verify-trader-intelligence-v3-ga1-a.ts`.
- `verify-trader-intelligence-v3-ga1-b.ts`.
- `verify-trader-intelligence-v3-ga1-b-scale.ts`.
- `verify-trader-intelligence-v3-ga1-c.ts`.
- `verify-trader-intelligence-v3-private-data.ts`.

The untracked focused test for the temporary loader is recorded in the source manifest. Test files are not operational entry points.

### Big Time Pennies tools

- `tools/big-time-pennies/scrape-bigtime-weekly.js`.
- `tools/big-time-pennies/run-weekly-scrape-until-new.js`.
- `tools/big-time-pennies/run-weekly-local.ps1`.
- `tools/big-time-pennies/install-local-weekly-task.ps1`.
- `tools/big-time-pennies/show-local-weekly-status.ps1`.

The local runner can pull `main`, generate content, commit, push, create and merge a PR, create a temporary deploy worktree, and deploy production. It is operationally powerful and must be isolated from an active dirty development checkout. The current runner predates the strict modern production-deploy guard and invokes Vercel directly from its own clean-worktree procedure; this requires a dedicated safety review before future use.

## Automation/CI inventory

| File/system | Trigger | Current effect | Replacement disposition |
| --- | --- | --- | --- |
| `.github/workflows/ci.yml` | Push to `main`; ready-for-review PR | Runs all tests, multiple V3 GA/architecture/private-data checks, Layer 2 and Layer 3 | Keep CI; replace V3 jobs incrementally with module acceptance jobs |
| `.github/workflows/level-analysis-trade-detail-facts.yml` | Path-filtered PR/push | Installs Chromium and runs seeded Level Analysis trade-detail E2E | Preserve until Level Analysis/Journal contract has replacement coverage |
| `.github/workflows/trader-intelligence-v3-ga1-b-scale.yml` | Manual dispatch | Runs 10,000-row governed V3 scale proof and uploads artifacts | Historical/manual; replace or retire after analytics replacement proof |
| Dependabot | Scheduled in `.github/dependabot.yml` | Dependency update schedule | Preserve |
| `vercel.json` | Build configuration only | `npm ci` and webpack build; no cron entries | Preserve/review build configuration; no Vercel Cron dependency found |
| Windows Task Scheduler | Intended task `TradersLink BigTime Week-Ahead Scraper`, Sundays 5 PM | May run/push/merge/deploy weekly content | Preserve and defer. Installed state/path unknown because Windows denied enumeration; not a Phase 2 Journal blocker |

No Big Time local status file was present at `%LOCALAPPDATA%\TradersLink\bigtime-week-ahead` during inspection. That does not prove the task is uninstalled.

## Environment-variable inventory

This inventory includes runtime configuration names read directly or indirectly through environment maps/constants. Generic OS/CI variables are included where source behavior branches on them.

### Platform/runtime/deployment signals

- `NODE_ENV`, `PORT`, `CI`, `NEXT_TELEMETRY_DISABLED`.
- `VERCEL`, `VERCEL_ENV`, `TRADER_INTELLIGENCE_DEPLOYED_ENVIRONMENT`.
- Hosted-platform signals read by the V3 deployment check: `AWS_LAMBDA_FUNCTION_NAME`, `K_SERVICE`, `FLY_APP_NAME`, `RAILWAY_ENVIRONMENT`, `RENDER`, `DYNO`.
- Local/tool paths: `APPDATA`, `LOCALAPPDATA`, `TEMP`, `USERDOMAIN`, `USERNAME`, `npm_execpath`.

### Identity, access, site, and product links

- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_GUILD_ID`, `DISCORD_PREMIUM_ROLE_ID`, `DISCORD_REDIRECT_URI`, `DISCORD_INVITE_URL`.
- `TRADERSLINK_PREMIUM_DISCORD_ROLE_ID`, `TRADERSLINK_FREE_DISCORD_INVITE_URL`, `TRADERSLINK_COOKIE_DOMAIN`, `TRADERSLINK_WHOP_PRODUCT_URL`.
- `LIVE_WATCHLIST_REQUIRE_LOCAL_AUTH`.

### Database/storage selection

- `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `NEON_DATABASE_URL`.
- `ACADEMY_DATABASE_URL`, `ACADEMY_PROGRESS_STORAGE`.
- `AFFILIATE_REFERRAL_DATABASE_URL`, `AFFILIATE_REFERRAL_STORAGE`.
- `NEWS_DATABASE_URL`, `TRADERSLINK_NEWS_DB_PATH`.
- `LIVE_WATCHLIST_DATABASE_URL`, `LIVE_WATCHLIST_DB_PATH`, `LIVE_WATCHLIST_STORAGE`.
- `TRADER_INTELLIGENCE_DB_PATH`, `TRADER_INTELLIGENCE_RULES_DB_PATH`, `TRADER_INTELLIGENCE_JOURNAL_DB_PATH`, `TRADER_INTELLIGENCE_PRIVATE_DATA_ROOT`.

### Accepted replacement Platform/Journal configuration

- Database/repository boundary: `TRADERLINK_PLATFORM_DB_PATH`,
  `TRADERLINK_PLATFORM_REPOSITORY_ROOT`.
- Protected operational scheduler authentication: `CRON_SECRET`. This is a
  server-only bearer secret for the host-neutral AI Review calendar trigger;
  its value must not enter browser code, logs or this inventory.
- Versioned broker-account identity authority:
  `TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION`,
  `TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON`.
- Development-only Journal source gate:
  `TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH`,
  `TRADERLINK_PLATFORM_ALLOW_JOURNAL_SOURCE_IDENTITY_PREPARATION`,
  `TRADERLINK_PLATFORM_ALLOW_JOURNAL_SOURCE_IMPORT`.
- Append-only evidence boundary:
  `TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT`,
  `TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON`.
- Versioned Journal execution/content authority:
  `TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION`,
  `TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON`.

These are server-only names. Their values, statement path, raw account identity,
fingerprints, and HMAC material must never enter Git, client output, logs, or
migration documents. The accepted local authority record and evidence vault are
outside both repositories and outside one another's protected storage roots.

### V3 deployment, owner, analytics, and ingestion

- `TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE`, `TRADER_INTELLIGENCE_HOSTING_MODE`, `TRADER_INTELLIGENCE_STORAGE_MODE`, `TRADER_INTELLIGENCE_DATA_MODE`.
- `TRADER_INTELLIGENCE_OWNER_ID`, `TRADER_INTELLIGENCE_OWNER_DISCORD_SUBJECT`, `TRADER_INTELLIGENCE_APPROVED_ORIGINS`, `TRADER_INTELLIGENCE_TIER`.
- `TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN` is process-internal and set by the protected launcher; it must not be a persisted/shared secret.
- `TRADER_INTELLIGENCE_V3_ANALYTICS_BINDING_PATH`, `TRADER_INTELLIGENCE_V3_EXECUTION_ANALYTICS_ROOT`, `TRADER_INTELLIGENCE_V3_EXECUTION_ACCOUNT_KEY`, `TRADER_INTELLIGENCE_V3_EXECUTION_INSTRUMENTS_JSON`.
- `TI_PROCESS_PHASE`, `TI_REPOSITORY_MODULE_URL`.

These names are migration inputs. The replacement must use Platform/Journal names and explicit module configuration; it must not carry forward V3 naming merely for convenience.

### Level Analysis and market data

- Feature gates: `LEVEL_ANALYSIS_JOURNAL_DELIVERY_API_ENABLED`, `LEVEL_ANALYSIS_JOURNAL_DELIVERY_RAW_DEBUG_ENABLED`, `LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_API_ENABLED`, `LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_ADMIN_DEBUG_ENABLED`, `LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED`, `LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_UI_ENABLED`, `LEVEL_ANALYSIS_JOURNAL_REVIEW_QUEUE_LEVEL_FACTS_ENABLED`.
- Provider/warehouse: `LEVELS_SYSTEM_PROVIDER`, `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY`, `LEVELS_SYSTEM_WAREHOUSE_MODE`, `LEVELS_SYSTEM_ON_DEMAND_HYDRATION`.
- Lookbacks: `LEVELS_SYSTEM_DAILY_LOOKBACK_BARS`, `LEVELS_SYSTEM_4H_LOOKBACK_BARS`, `LEVELS_SYSTEM_5M_LOOKBACK_BARS`.
- IBKR connection: `LEVELS_SYSTEM_IBKR_HOST`, `LEVELS_SYSTEM_IBKR_PORT`, `LEVELS_SYSTEM_IBKR_CLIENT_ID`, `LEVELS_SYSTEM_IBKR_TIMEOUT_MS`, `LEVELS_SYSTEM_IBKR_CONNECTION_TIMEOUT_MS`.
- Accepted legacy aliases: `LEVEL_BACKFILL_IBKR_HOST`, `LEVEL_BACKFILL_IBKR_PORT`, `LEVEL_BACKFILL_IBKR_CLIENT_ID`, `LEVEL_BACKFILL_IBKR_TIMEOUT_MS`, `LEVEL_BACKFILL_IBKR_CONNECTION_TIMEOUT_MS`, and the corresponding `LEVEL_VALIDATION_IBKR_*` names.
- EODHD: `EODHD_API_TOKEN`, `LEVEL_EODHD_API_TOKEN`, `EODHD_EXCHANGE_SUFFIX`, `LEVEL_EODHD_EXCHANGE_SUFFIX`, `EODHD_BASE_URL`, `LEVEL_EODHD_BASE_URL`.
- Other data/integration keys: `FINNHUB_API_KEY`, `TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN`, `NEON_SYMBOL_WRITE_MAX_ATTEMPTS`.

### News, analytics/AI, and site telemetry

- `NEWS_PUBLIC_BASE_URL`, `NEWS_PUBLISH_TOKEN`.
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TIMEOUT_MS`, `PRESS_RELEASE_OPENAI_MODEL`.
- `NEXT_PUBLIC_DISABLE_GA`, `NEXT_PUBLIC_ENABLE_GA_IN_DEV`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`.

### Big Time local automation

- `BIGTIME_ENV_FILE`, `TRADERSLINK_SITE_DIR`.
- `BIGTIME_POLL_INTERVAL_MS`, `BIGTIME_POLL_MAX_ATTEMPTS`, `BIGTIME_POLL_MAX_TRANSIENT_FAILURES`.
- `BIGTIME_OPENAI_MODEL`, `BIGTIME_OPENAI_TEMPERATURE`, `BIGTIME_OPENAI_MAX_ATTEMPTS`, `BIGTIME_MAX_PUBLISHED_ARTICLES`.

### Verification-only flags

- `TI_V3_GA1_A_SCALE_PROOF`, `TI_V3_GA1_B_SCALE_PROOF`, `TI_V3_GA1_B_SCALE_STAGE_LOG`, `TI_V3_GA1_C_SCALE_PROOF`.

## Current `.env.local` ownership finding

At the Phase 1 legacy checkpoint, only the V3 private-owner/local SQLite
configuration and owner/account/instrument/origin values were observed among the
relevant storage settings. Academy/News/Watchlist/affiliate/general hosted
database URLs and the Journal tag DB override were absent, allowing several
legacy modules to fall through to one V3 path. The replacement does not copy
that `.env.local`; Phase 2/3 operations use the explicit replacement names above
and a separately protected local authority record. Exact secret values are not
part of the migration documents.

## External-service inventory

| Service | Current use | Replacement ownership |
| --- | --- | --- |
| Discord OAuth/API | Identity, guild/role membership, Academy/Watchlist access | Platform identity/access |
| Neon/Postgres | Hosted Academy, News, Watchlist, affiliate stores through separate fallback chains | One hosted SQL target with explicit logical module ownership; provider decision remains later |
| Vercel | Builds and guarded production deployment | Platform operations |
| GitHub/GitHub Actions/Dependabot/GH CLI | Source, CI, PR/merge automation | Platform operations; preserve review/green-gate rules |
| OpenAI API | Big Time article rewriting/processing | News operational tool, not Journal analytics |
| Big Time Penny Stocks | Source content for weekly article automation | News operational source with provenance |
| TradingView embed | Watchlist chart UI | Watchlist external UI dependency |
| Interactive Brokers/TWS or Gateway | Statement source plus optional Levels System market-data provider | Journal broker source and Level Analysis provider through separate contracts |
| EODHD, Yahoo, Finnhub | Market data/source options in chart/analysis/watchlist code | Market-data provider contracts; never implicit Journal facts |
| Whop | Product/access links | Platform/Account commerce link; no payment persistence identified in this repo |
| Google Analytics | Public-site telemetry | Platform telemetry; must exclude private Journal data |
| Vendored `levels-system-v2` | Local package for support/resistance/market structure | Market/Level Analysis module; reconcile external source folders before cleanup |

## Operational risks requiring explicit follow-up

1. A source-controlled Windows task runner can mutate Git and deploy production; its installed target path is unknown. The owner classified this as low priority, so preserve it unchanged and resolve it only before reactivation/change or related cleanup.
2. Default `dev`/`start` and CI remain V3-coupled.
3. Generic storage fallbacks couple unrelated modules to the Journal/V3 database.
4. Auto-discovery reads sibling `levels-system` warehouse folders, so workspace cleanup can silently change market-data behavior.
5. Provider APIs and OpenAI must never receive broker statements, account identifiers, notes, or other private Journal records unless a future explicit privacy contract authorizes it.
6. Public telemetry must never capture private dashboard URLs with sensitive query data or payloads.
