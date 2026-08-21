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
| Platform | Landing page, shared site shell, shared dashboard shell, navigation, authentication/session, account, access boundaries, private-cache headers, platform readiness, installable PWA shell, offline scope/outbox coordination and Web Push | `app/page.tsx`, `app/site-shell.tsx`, `src/components/site`, `app/(dashboard)/layout.tsx`, `app/dashboard-*`, `app/api/auth`, `app/api/me`, `app/(dashboard)/account`, `app/(dashboard)/workspace/readiness`, `next.config.ts` | F5 connects privacy-safe replacement readiness inside the approved shell and intercepts legacy V3 routes. F6 implements Discord-first Platform sessions, current membership evidence, single-node hosted packaging and authorized hosted transfer; external activation remains pending. The owner-approved [PWA plan](traderlink-platform-pwa-plan.md) preserves the complete dashboard while adding bounded offline access and opt-in push without changing module data authority. |
| Journal Administration | Private owner overview, users/Journal accounts, import operations, statement-format learning, Data Decision operations, system health and audit | `app/admin/journal`, `app/api/admin/journal`, `src/modules/platform/server/administration`, `src/modules/journal/server/administration` | [QA-corrected detailed plan](journal-admin-dashboard-plan.md) is owner approved. Technical Admin 1-6 authorization, evidence, bounded read models, audited commands/downloads and complete light Material UI are assembled and focused-verified. `/admin/journal` uses fresh Discord-owner evidence plus a distinct Platform operator grant and does not reuse Watchlist/V3/Level Analysis administration. Integrated compile/build/browser acceptance and production activation remain pending. |
| Journal | Imports, statement preview/commit, mapping templates, Data Decisions/repair, canonical executions, manual entry, Day Trade Tracker, Swing Trade Tracker, round trips, open positions, ticker grouping, calendar, rules, notes, tags, reviews, candle associations | `app/(dashboard)`, `app/api/import-*`, `app/api/csv-*`, `app/api/intelligence`, `app/api/trades`, `src/lib/trader-analytics`, `src/lib/execution-sources`, `src/lib/trader-intelligence-{day-session-journal,rules,tags}`, parts of `src/lib/trader-intelligence-v3` | Preserve capability and URLs where practical; replace V3 authority, import, grouping, and storage dependencies behind explicit Journal services. The two trackers are separate workflows over one Data Decisions-protected canonical execution ledger. |
| Journal Analytics | Workspace summary, Analytics Overview, Performance, Results, Timing, Execution, Analytics Lab, chart evidence, trade/ticker/session stories, reflection and behavior calculations | `app/(dashboard)/workspace`, `app/(dashboard)/analytics`, `app/analytics-server-page.tsx`, `app/api/analytics`, `app/api/intelligence/dashboard`, `src/lib/trader-analytics`, `src/lib/trader-intelligence-v3/analytics`, behavior/review libraries | Preserve useful supported analytics; replace the ordinary-dashboard dependency on V3 replay/proof/authority. Every metric needs one server-owned calculation contract and visible coverage. |
| Academy | Course and path browsing, lessons, lesson completion/progress, protected lesson slugs | `app/academy`, `app/api/academy`, `academy`, `src/lib/academy`, `src/modules/academy` | F2 local replacement is connected to stable Platform user identity and Academy-owned progress/events. F6 adds public Platform identity plus exact hosted preview/transfer/reconciliation; production transfer remains pending and protected slugs remain unchanged. |
| Watchlist | Current watchlist, symbol view, archive, archive item, explanation page, ingestion, recap, streaming, symbol detail, archive reset | `app/watchlist`, `app/api/live-watchlist`, `src/lib/live-watchlist`, `src/modules/watchlist` | F3 storage and publisher authority are complete. F6 uses the same protected Platform database in the accepted single-node hosted runtime and current Discord membership for Premium access; exact production transfer remains pending. |
| News and market content | News index/ticker/article/free article, authenticated Press Releases channel feeds, article ingest, weekly small-cap content, filtered-news access, market-plan content | `app/news`, `app/(dashboard)/press-releases`, `app/api/news`, `src/lib/news`, `src/modules/news`, `src/content`, `app/small-cap-stocks`, `tools/big-time-pennies`, scanner-access and market-plan pages | F4 versioned News storage and the exact single-row local adoption are complete. The owner-approved Press Releases dashboard reuses each canonical article, adds sparse global read receipts, exact per-channel unread counts, Premium access and News-owned PWA delivery evidence without entering the general notification bell. Migration 0070 is protected-database applied and runtime-verified; the preserved route-tag `local` adoption row remains excluded from alert feeds. Production transfer and real eligible-article drawer acceptance remain pending; Big Time remains preserved low priority. |
| Coach and Review | Coaching summaries, behavior sequences, progress, review backlog/session, ticker/session stories, calibration, comparison, review cockpit, session recap | Primarily `app/intelligence/coach`, related `/intelligence` pages, `app/api/coach`, `app/api/review`, `src/lib/coaching`, behavior and user-facing review libraries | F1 connects Reflection Loop and latest APIs to published Journal/Analytics/Data Decision facts plus trader-authored annotations. Unique legacy page capabilities remain reference candidates requiring disposition; no automated subjective classification or sample fallback is accepted. |
| Level Analysis and Chart Review | External delivery validation/ingest, per-symbol data, trade linking, trade-detail facts, candle review and simulations | `app/api/level-analysis`, `app/api/admin/level-analysis`, trade APIs, `src/lib/level-analysis`, `src/lib/trade-candle-analysis`, support/resistance and pattern libraries | Preserve useful capability and exact provenance. Define Journal integration contract; do not let it own executions or round trips. |
| Market/behavior research engines | Raw timelines, market-data readiness, pattern detection/normalization/scoring, support/resistance, trade analysis, execution feedback | `src/lib/{raw-trade-timeline,market-data-sources,pattern-*,support-resistance,trade-analysis,execution-feedback}`, debug/calibration scripts and pages | Preserve as reusable libraries or operational tools only where inputs and claims are supported. They are not automatic dashboard authority. |
| Affiliate/referrals | Affiliate data and account relationships | `src/lib/affiliate-referrals`, `src/modules/affiliate`, filtered-news access | First-touch attribution is keyed to stable Platform user, never Journal account. F6 maps only exact Discord-linked hosted rows and leaves ambiguous/unmapped referrals pending; production transfer remains unexecuted. |

## Current dashboard product surface

This route family uses the owner-approved **light Material UI dashboard** with a persistent/collapsible left navigation. That visual shell is the preservation baseline. Its Calendar includes the accepted week/month views. Dark dashboards and legacy/experimental shells that omit Trades, Calendar, Analytics, Analytics Lab, or Trading Rules are not final-design candidates.

The navigation-visible dashboard is the clearest future route family and contains:

- Home: `/workspace`.
- Trades: `/trade-tracker` (Daily Trade Tracker),
  `/trade-tracker/swings` (Swing Trade Tracker), `/quick-trade-entry`,
  `/calendar`, `/analytics/trade-explorer`,
  `/analytics/trade-explorer/compare`, `/trades/open`, `/rules` and
  `/rules/results`.
- Trade Analyzer: `/analytics/trade-analyzer/day`, its Entry & Exit, MFE & MAE,
  Green-to-Red, Candle Patterns and Analyzed Trades child routes.
- Analytics: `/analytics`, `/analytics/results`, `/analytics/timing` and
  `/analytics/execution`.
- Standalone: `/ai-chat`, `/ai-reviews`, `/account`, `/imports`, `/charts`,
  `/data-decisions` and `/help`.

Notifications and the date/detail/help/account routes remain contextual parts
of the dashboard. Analytics Lab remains preserved but intentionally outside the
current public navigation until a later owner-approved scope restores it.
Retired compatibility routes do not become separate PWA destinations. The
complete installed-app and offline behavior matrix is controlled by the
[PWA plan](traderlink-platform-pwa-plan.md); route ownership remains enumerated
in [Route Ownership](route-ownership.md).

The complete list above controls preservation. The named visual identifiers do not narrow the target list; they distinguish the approved dashboard from other legacy or experimental dashboards. Any visible replacement change requires owner review against this baseline.

## Legacy Trader Intelligence surface

`/intelligence` is a preserved second application surface with 52 page routes,
its own layout/navigation, imports, trades, analytics, coach, review,
calibration, onboarding, admin and debug pages. Its source still imports V3,
but F5 configuration redirects every ordinary path before the filesystem, so
it is no longer a replacement dashboard entrypoint.

Current classification: **legacy reference with complete F5 item-by-item
disposition**. The exact 44 canonical, two compatibility, five operations-only
and one owner-rejected mappings are in the
[F5 route plan](phase-5-slice-f5-platform-peers-and-legacy-route-disposition-plan.md).
Source remains preserved until Phase 6 and final retirement acceptance.

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
4. Implement the accepted [Day Trade Tracker And Swing Trade Tracker Plan](day-and-swing-trade-tracker-plan.md), including per-row dates, bounded late entry, position-level intent and separate dated swing notes.
5. Decide which research/coach metrics are supported after the analytics capability catalog proves their required facts.
