# TraderLink Product Inventory

**Phase:** 1 - inventory and baseline  
**Status:** Evidence baseline in progress  
**Snapshot:** `main` at `4e19f51cdd5fceb8bf465b8eff0a21e0ee9314ca`, with the preserved dirty worktree recorded in the Phase 1 tracker  
**Purpose:** Controlling product-surface inventory for preservation decisions. Presence in this file does not mean the current implementation is approved or that its V3 dependency will survive.

## Disposition terms

| Term | Meaning |
| --- | --- |
| Preserve | Accepted product capability that the replacement must continue to provide. |
| Replace internals | Keep the user capability and usually its public URL, but replace V3 or confused storage/analytics internals. |
| Compatibility | Keep temporarily so existing links continue to work; not a separate product surface. |
| Review | Capability exists, but its finished product role or presentation needs owner review before implementation. |
| Legacy reference | Keep during migration only as evidence or as a source of reusable behavior; do not extend as the future architecture. |
| Operational | Development, data-maintenance, deployment, or scheduled tooling rather than an end-user feature. |

## Product modules

| Future owner | Current surfaces and capabilities | Current implementation areas | Phase 1 disposition |
| --- | --- | --- | --- |
| Platform | Landing page, shared site shell, shared dashboard shell, navigation, authentication/session, account, access boundaries, private-cache headers, platform readiness | `app/page.tsx`, `app/site-shell.tsx`, `src/components/site`, `app/(dashboard)/layout.tsx`, `app/dashboard-*`, `app/api/auth`, `app/api/me`, `app/account`, `next.config.ts` | Preserve capability; consolidate the two current shells under the approved Platform direction. Do not redesign UI in Phase 1. |
| Journal | Imports, statement preview/commit, mapping templates, Data Decisions/repair, canonical executions, manual entry, Trade Tracker, round trips, open positions, ticker grouping, calendar, rules, notes, tags, reviews, candle associations | `app/(dashboard)`, `app/api/import-*`, `app/api/csv-*`, `app/api/intelligence`, `app/api/trades`, `src/lib/trader-analytics`, `src/lib/execution-sources`, `src/lib/trader-intelligence-{day-session-journal,rules,tags}`, parts of `src/lib/trader-intelligence-v3` | Preserve capability and URLs where practical; replace V3 authority, import, grouping, and storage dependencies behind explicit Journal services. Data Decisions and the canonical execution ledger are foundational. |
| Journal Analytics | Workspace summary, Analytics Overview, Performance, Results, Timing, Execution, Analytics Lab, chart evidence, trade/ticker/session stories, reflection and behavior calculations | `app/(dashboard)/workspace`, `app/(dashboard)/analytics`, `app/analytics-server-page.tsx`, `app/api/analytics`, `app/api/intelligence/dashboard`, `src/lib/trader-analytics`, `src/lib/trader-intelligence-v3/analytics`, behavior/review libraries | Preserve useful supported analytics; replace the ordinary-dashboard dependency on V3 replay/proof/authority. Every metric needs one server-owned calculation contract and visible coverage. |
| Academy | Course and path browsing, lessons, lesson completion/progress, protected lesson slugs | `app/academy`, `app/api/academy`, `academy`, `src/lib/academy` | Preserve. Give Academy explicit storage ownership; protect live progress and slug compatibility. |
| Watchlist | Current watchlist, symbol view, archive, archive item, explanation page, ingestion, recap, streaming, symbol detail, archive reset | `app/watchlist`, `app/api/live-watchlist`, `src/lib/live-watchlist` | Preserve. Give Watchlist explicit storage and access ownership; retain current authentication gate until deliberately replaced. |
| News and market content | News index/ticker/article/free article, article ingest, weekly small-cap content, filtered-news access, market-plan content | `app/news`, `app/api/news`, `src/lib/news`, `src/content`, `app/small-cap-stocks`, `tools/big-time-pennies`, scanner-access and market-plan pages | Preserve as peer modules/content surfaces. Separate operational content collection from Journal data. |
| Coach and Review | Coaching summaries, behavior sequences, progress, review backlog/session, ticker/session stories, calibration, comparison, review cockpit, session recap | Primarily `app/intelligence/coach`, related `/intelligence` pages, `app/api/coach`, `app/api/review`, `src/lib/coaching`, behavior and user-facing review libraries | Review then preserve supported capabilities. Current pages are legacy-reference candidates; future Coach must consume published Journal/Analytics facts rather than V3 internals. |
| Level Analysis and Chart Review | External delivery validation/ingest, per-symbol data, trade linking, trade-detail facts, candle review and simulations | `app/api/level-analysis`, `app/api/admin/level-analysis`, trade APIs, `src/lib/level-analysis`, `src/lib/trade-candle-analysis`, support/resistance and pattern libraries | Preserve useful capability and exact provenance. Define Journal integration contract; do not let it own executions or round trips. |
| Market/behavior research engines | Raw timelines, market-data readiness, pattern detection/normalization/scoring, support/resistance, trade analysis, execution feedback | `src/lib/{raw-trade-timeline,market-data-sources,pattern-*,support-resistance,trade-analysis,execution-feedback}`, debug/calibration scripts and pages | Preserve as reusable libraries or operational tools only where inputs and claims are supported. They are not automatic dashboard authority. |
| Affiliate/referrals | Affiliate data and account relationships | `src/lib/affiliate-referrals` and current shared persistence fallbacks | Review product visibility; preserve data/schema until ownership is decided. Give it Platform/Account storage ownership, not Journal ownership. |

## Current dashboard product surface

This route family uses the owner-approved **light Material UI dashboard** with a persistent/collapsible left navigation. That visual shell is the preservation baseline. Its Calendar includes the accepted week/month views. Dark dashboards and legacy/experimental shells that omit Trades, Calendar, Analytics, Analytics Lab, or Trading Rules are not final-design candidates.

The navigation-visible dashboard is the clearest future route family and contains:

- Workspace: `/workspace`.
- Trades: `/calendar`, `/trade-tracker`, `/trades/roundtrips`, `/trades/ticker`, `/trades/open`.
- Analytics: `/analytics`, `/analytics/performance`, `/analytics/results`, `/analytics/timing`, `/analytics/execution`, `/analytics/lab`.
- Review tools: `/reflection-loop`, `/rules`, `/charts`.
- Data: `/imports`, `/manual-entry`, `/data-decisions`.

There are additional dashboard routes for date-specific Trade Tracker, candle review, an Analytics Lab candle-analysis surface, and compatibility redirects. All are enumerated in [Route Ownership](route-ownership.md).

The complete list above controls preservation. The named visual identifiers do not narrow the target list; they distinguish the approved dashboard from other legacy or experimental dashboards. Any visible replacement change requires owner review against this baseline.

## Legacy Trader Intelligence surface

`/intelligence` is not merely an old redirect target. It is a second, large application surface with 52 page routes, its own layout/navigation, imports, trades, analytics, coach, review, calibration, onboarding, admin, and debug pages. It still imports V3 code directly and remains reachable.

Phase 1 classification: **legacy reference pending item-by-item preservation mapping**. It must not be deleted, expanded as the future shell, or treated as canonical merely because older documentation says it is. Each unique capability must be preserved, replaced, explicitly deferred, or owner-rejected before retirement.

## Shared user-data rules controlling every module

- Owner and account isolation is enforced at the server boundary.
- Broker and manual executions enter one Journal ledger with provenance.
- Historical imports are order-independent across the complete affected execution chain.
- Contained bad records create contained decisions; they do not blank unrelated dashboard data.
- Academy progress, Watchlist data, News data, Journal facts, and affiliate data require named owners even if a future hosted SQL database contains all of them.
- Server-rendered pages read module services directly. HTTP routes remain for genuine browser/external HTTP boundaries, uploads, streams, and integrations.
- No module may reach into another module's tables as its public contract.

## Operational inventory summary

- Local development currently launches through a protected V3-named server wrapper rather than plain `next dev`.
- Package scripts contain V3 architecture/private-data/GA verification suites, analytics calibration utilities, market-data manifest/summarization tools, Academy validation, production deployment guards, and Big Time Pennies collection commands.
- GitHub CI currently treats several V3 verification commands as required jobs.
- The repository has no Vercel cron configuration. The Big Time Pennies tooling can install a Windows scheduled task and requires separate machine-state inventory.
- A temporary January IBKR loader exists as untracked work and is preservation input, not yet an accepted permanent import command.

## Decisions still required before implementation

1. Map all unique `/intelligence` behavior to a future module, explicit deferral, or owner rejection.
2. Decide which legacy HTTP endpoints remain as compatibility contracts during cutover.
3. Name the replacement database schema and module-owned migrations after the current data map is accepted.
4. Decide the future Trade Tracker multi-day entry presentation in a separate UI plan; the data behavior is already fixed.
5. Decide which research/coach metrics are supported after the analytics capability catalog proves their required facts.
