# TraderLink Route Ownership

**Phase:** 1 - inventory and baseline  
**Status:** Source inventory complete; final dispositions remain part of the Phase 1 approval checkpoint  
**Source of truth:** Current `app/`, `next.config.ts`, and route-local redirects at the Phase 1 snapshot. Older `docs/routes.md` is historical and conflicts with current source for the dashboard family.

## Route rules

- Next.js route groups such as `app/(dashboard)` do not appear in URLs.
- `Platform target` means the URL is a candidate for the finished modular app; it does not accept the current implementation.
- `Preserve` means the existing product capability must survive migration.
- `Legacy review` means the route remains available as preservation evidence until its unique behavior is mapped.
- `Compatibility` means the route redirects today or should remain temporarily for old links.
- No route is authorized for removal in Phase 1.

## Page inventory: 96 routes

### Platform and peer modules: 20

| Route | Current owner | Disposition |
| --- | --- | --- |
| `/` | Platform/site | Preserve |
| `/account` | Platform/Account | Preserve |
| `/platform-readiness` | Platform | Review; operational/product status surface |
| `/academy` | Academy | Preserve |
| `/academy/[...slug]` | Academy | Preserve |
| `/academy/courses/[courseId]` | Academy | Preserve |
| `/academy/paths/[pathId]` | Academy | Preserve |
| `/news` | News | Preserve |
| `/news/[ticker]` | News | Preserve |
| `/news/[ticker]/[slug]` | News | Preserve |
| `/news/free/[ticker]/[slug]` | News | Preserve |
| `/watchlist` | Watchlist | Preserve; authenticated |
| `/watchlist/[symbol]` | Watchlist | Preserve; authenticated |
| `/watchlist/archive` | Watchlist | Preserve; authenticated |
| `/watchlist/archive/[archiveId]` | Watchlist | Preserve; authenticated |
| `/watchlist/how-it-works` | Watchlist | Preserve |
| `/filtered-news-momentum-scanner-access` | News/access | Preserve pending access-contract review |
| `/small-cap-stocks/week-ahead` | News/content | Preserve |
| `/small-cap-stocks/week-ahead/[slug]` | News/content | Preserve |
| `/smokeys-12-week-market-structure-plan` | Academy/content | Preserve pending final module placement |

### Dashboard and future Journal/Analytics family: 24

| Route | Future owner | Disposition |
| --- | --- | --- |
| `/workspace` | Platform composition | Platform target; replace V3 data dependency |
| `/calendar` | Journal | Platform target |
| `/trade-tracker` | Journal | Platform target; UI workflow requires later owner review |
| `/trade-tracker/[sessionDate]` | Journal | Platform target; one trading day |
| `/trades` | Journal | Compatibility redirect to `/trades/roundtrips` |
| `/trades/roundtrips` | Journal | Platform target |
| `/trades/ticker` | Journal | Platform target |
| `/trades/open` | Journal | Platform target |
| `/trades/candle-review` | Journal/Level Analysis | Review and preserve useful behavior |
| `/trades/day-sessions` | Journal | Compatibility redirect to Trade Tracker |
| `/trades/day-session/[sessionDate]` | Journal | Compatibility redirect to dated Trade Tracker |
| `/analytics` | Journal Analytics | Platform target |
| `/analytics/performance` | Journal Analytics | Platform target |
| `/analytics/results` | Journal Analytics | Platform target |
| `/analytics/timing` | Journal Analytics | Platform target |
| `/analytics/execution` | Journal Analytics | Platform target |
| `/analytics/lab` | Journal Analytics | Review, then preserve supported analysis |
| `/analytics/lab/trade-candle-analysis` | Journal Analytics/Level Analysis | Review and preserve supported behavior |
| `/charts` | Market tools | Platform target; define module contract |
| `/reflection-loop` | Journal/Coach | Platform target; define ownership contract |
| `/rules` | Journal | Platform target |
| `/imports` | Journal | Platform target |
| `/manual-entry` | Journal | Platform target; canonical execution ledger |
| `/data-decisions` | Journal | Platform target and foundational replacement capability |

### Legacy `/intelligence` family: 52

Every route in this table is **Legacy review**. It remains preservation evidence until its behavior is assigned to Platform, Journal, Journal Analytics, Coach, Level Analysis, an operational-only tool, an explicit deferral, or an owner-approved rejection.

| Area | Routes |
| --- | --- |
| Entry/admin | `/intelligence`, `/intelligence/admin`, `/intelligence/admin/broker-mappings` |
| Analytics | `/intelligence/analytics`, `/intelligence/analytics/behavior`, `/intelligence/analytics/chart-evidence`, `/intelligence/analytics/details`, `/intelligence/analytics/results`, `/intelligence/analytics/review-plan`, `/intelligence/analytics/session-stories`, `/intelligence/analytics/ticker-stories`, `/intelligence/analytics/timing`, `/intelligence/analytics/trade-explorer` |
| Coach | `/intelligence/coach`, `/intelligence/coach/behavior-sequence`, `/intelligence/coach/details`, `/intelligence/coach/next-session`, `/intelligence/coach/progress`, `/intelligence/coach/review-backlog`, `/intelligence/coach/review-session`, `/intelligence/coach/session-stories`, `/intelligence/coach/ticker-stories` |
| Imports/data | `/intelligence/csv-mapping-review`, `/intelligence/import-dry-run`, `/intelligence/import-health`, `/intelligence/imports`, `/intelligence/imports/[batchId]`, `/intelligence/import-trials`, `/intelligence/repair-wizard`, `/intelligence/upload-csv` |
| Trades | `/intelligence/trades`, `/intelligence/trades/[tradeId]`, `/intelligence/trades/calendar`, `/intelligence/trades/open-swing`, `/intelligence/trades/review-needed`, `/intelligence/trades/round-trips`, `/intelligence/trades/ticker-stories`, `/intelligence/trades/ticker-story/[threadId]` |
| Trade compatibility | `/intelligence/trades/day-sessions` redirects to `/trade-tracker`; `/intelligence/trades/day-session/[sessionDate]` redirects to dated Trade Tracker |
| Review/workflow | `/intelligence/calibration`, `/intelligence/compare-trades`, `/intelligence/first-run`, `/intelligence/onboarding`, `/intelligence/progress`, `/intelligence/review`, `/intelligence/review-cockpit`, `/intelligence/session-recap`, `/intelligence/trader-intelligence` |
| Debug | `/intelligence/debug/execution-feedback`, `/intelligence/debug/trade-analysis`, `/intelligence/debug/trader-analytics` |

## Route Handler inventory: 61 routes

The methods below are exported by the current source. `Future handling` is the ownership/disposition, not permission to change the endpoint now.

### Platform and peer modules: 18

| Methods | Route | Future handling |
| --- | --- | --- |
| `POST, DELETE` | `/api/academy/lessons/complete` | Academy: preserve |
| `GET` | `/api/auth/discord/login` | Platform identity: preserve until auth plan replaces it |
| `GET` | `/api/auth/discord/callback` | Platform identity: preserve until auth plan replaces it |
| `POST` | `/api/auth/logout` | Platform identity: preserve |
| `GET` | `/api/me` | Platform identity: preserve or replace behind same client contract |
| `POST` | `/api/news/articles` | News ingest: preserve and owner-scope |
| `GET` | `/api/live-watchlist` | Watchlist: preserve |
| `POST` | `/api/live-watchlist/ingest` | Watchlist ingest: preserve |
| `GET` | `/api/live-watchlist/stream` | Watchlist stream: preserve HTTP boundary |
| `GET` | `/api/live-watchlist/recap` | Watchlist: preserve |
| `GET` | `/api/live-watchlist/symbols/[symbol]` | Watchlist: preserve |
| `POST` | `/api/live-watchlist/archive/reset` | Watchlist: preserve with authorization review |
| `POST` | `/api/level-analysis/deliveries` | Level Analysis integration: preserve |
| `GET` | `/api/level-analysis/deliveries/latest` | Level Analysis integration: preserve |
| `GET` | `/api/level-analysis/deliveries/latest/symbols/[symbol]` | Level Analysis integration: preserve |
| `POST` | `/api/level-analysis/deliveries/validate` | Level Analysis integration: preserve |
| `POST` | `/api/level-analysis/trade-links` | Level Analysis/Journal link: replace internals behind contract |
| `POST` | `/api/level-analysis/trade-links/resolve` | Level Analysis/Journal link: replace internals behind contract |

### Journal import and Data Decisions: 22

| Methods | Route | Future handling |
| --- | --- | --- |
| `GET` | `/api/import-batches` | Journal: replace V3/trader-analytics internals |
| `GET` | `/api/import-batches/[batchId]` | Journal: replace internals |
| `POST` | `/api/import-batches/preview` | Journal import HTTP boundary: preserve behavior |
| `POST` | `/api/import-batches/[batchId]/commit` | Journal: replace internals |
| `POST` | `/api/import-batches/[batchId]/discard` | Journal: replace internals |
| `GET` | `/api/import-batches/[batchId]/decision-review/status` | Journal Data Decisions: replace internals |
| `POST` | `/api/import-batches/[batchId]/decision-review/resume` | Journal Data Decisions: replace internals |
| `POST` | `/api/import-batches/[batchId]/repair-items/[repairItemId]` | Journal Data Decisions: replace internals |
| `GET, POST` | `/api/import-dry-run/decision-review` | Legacy/operational review; map useful behavior |
| `POST` | `/api/csv-mapping-review/continue` | Journal import mapping: replace internals |
| `POST` | `/api/csv-mapping-templates` | Journal import mapping: replace internals |
| `GET` | `/api/csv-mapping-templates/list` | Journal import mapping: replace internals |
| `PATCH, DELETE` | `/api/csv-mapping-templates/[templateId]` | Journal import mapping: replace internals |
| `POST` | `/api/intelligence/broker-csv-import/v1` | Legacy-prefixed Journal HTTP boundary; compatibility decision later |
| `GET` | `/api/intelligence/broker-csv-import/v1/history` | Legacy-prefixed Journal endpoint; compatibility decision later |
| `POST` | `/api/intelligence/execution-import/v1` | Journal import; replace internals |
| `GET, POST, DELETE` | `/api/intelligence/import-repair/v1` | Journal Data Decisions; replace internals |
| `POST` | `/api/intelligence/day-session-executions/v1` | Journal manual execution entry; preserve behavior, canonical ledger |
| `PUT` | `/api/intelligence/day-session/[sessionDate]/notes` | Journal daily notes; preserve behavior |
| `PUT` | `/api/intelligence/day-session/[sessionDate]/rule-reviews` | Journal daily reviews; preserve behavior |
| `POST` | `/api/intelligence/rules` | Journal rules; replace V3 deployment/storage dependency |
| `GET, POST` | `/api/intelligence/trade-tags` | Journal tags; preserve behavior |

### Journal records, analytics, review, and diagnostics: 21

| Methods | Route | Future handling |
| --- | --- | --- |
| `DELETE, PATCH` | `/api/intelligence/trade-tags/[tagId]` | Journal tags: preserve |
| `PUT` | `/api/intelligence/trades/[semanticRoundTripKey]/tags` | Journal trade tags: preserve across deterministic rebuilds |
| `GET` | `/api/intelligence/dashboard/overview` | Journal Analytics: replace V3 dependency; current patch is unverified |
| `GET` | `/api/intelligence/trade-candle-analysis/simulations` | Analytics/Level Analysis: review supported capability |
| `POST` | `/api/intelligence/trade-candle-analysis/review` | Journal/Level Analysis: preserve useful review behavior |
| `GET` | `/api/trades` | Legacy Journal list: replace internals/compatibility decision |
| `GET` | `/api/trades/[tradeId]` | Legacy Journal detail: replace internals/compatibility decision |
| `POST` | `/api/trades/[tradeId]/mark-closed` | Legacy manual-close workflow: reconcile with factual Data Decisions |
| `POST` | `/api/trades/[tradeId]/notes` | Journal notes: preserve behavior |
| `POST` | `/api/trades/[tradeId]/review-status` | Journal review: preserve behavior |
| `POST` | `/api/trades/[tradeId]/review-items/[itemId]` | Journal review: preserve behavior |
| `GET` | `/api/trades/[tradeId]/level-analysis` | Level Analysis/Journal: preserve |
| `GET` | `/api/trades/[tradeId]/level-analysis/facts` | Level Analysis/Journal: preserve |
| `GET` | `/api/analytics/latest` | Legacy analytics HTTP contract: map consumer and replace V3 internals |
| `GET` | `/api/coach/latest` | Coach: map consumer and replace V3 internals |
| `GET` | `/api/review/latest` | Review: map consumer and replace V3 internals |
| `GET, POST` | `/api/execution-feedback/debug` | Operational/debug; no finished-product dependency |
| `GET, POST` | `/api/trade-analysis/debug` | Operational/debug; no finished-product dependency |
| `GET, POST` | `/api/trader-analytics/debug` | Operational/debug; retire after replacement proof if unused |
| `GET` | `/api/admin/level-analysis/deliveries/[deliveryId]/raw` | Admin/Level Analysis: preserve if operationally required |
| `GET` | `/api/admin/level-analysis/trade-links/[linkId]` | Admin/Level Analysis: preserve if operationally required |

## Server Actions and other framework boundaries

- One explicit Server Action module exists: `app/(dashboard)/analytics/lab/actions.ts`. It belongs to Journal Analytics and currently depends on the V3 Analytics Lab runtime. Replace its service dependency before ordinary analytics cutover.
- `app/(dashboard)/layout.tsx` is the current dashboard layout and still renders `V3DashboardTemplate` with V3 owner-access enforcement.
- `app/intelligence/layout.tsx` is a separate legacy application layout.
- Root metadata/special files include `app/layout.tsx`, `robots.ts`, `sitemap.ts`, icons, Academy `not-found.tsx`, Intelligence admin/debug layouts, and ticker-story loading UI. They remain preserved until the owning route is dispositioned.
- No repository `middleware.ts` or `proxy.ts` was identified in the Phase 1 source inventory. Private cache headers and redirects are currently in `next.config.ts`.

## Redirect inventory

### Route-local compatibility redirects

- `/trades` -> `/trades/roundtrips`.
- `/trades/day-sessions` -> `/trade-tracker` while preserving the current design-preview query behavior.
- `/trades/day-session/[sessionDate]` -> `/trade-tracker/[sessionDate]`.
- `/intelligence/trades/day-sessions` -> `/trade-tracker`.
- `/intelligence/trades/day-session/[sessionDate]` -> `/trade-tracker/[sessionDate]`.
- Watchlist pages redirect unauthenticated visitors to Discord login with a return URL; these are access redirects, not route retirement.

### Configuration redirects

- `www.traderslink.pro/*` -> apex host.
- `/workspace/admin` -> `/intelligence/admin`.
- Legacy top-level coach/review/progress/import/calibration/onboarding/debug/admin aliases redirect into their `/intelligence` equivalents: `/coach/:path*`, `/review`, `/progress`, `/upload-csv`, `/trader-intelligence`, `/import-dry-run`, `/import-health`, `/import-trials`, `/repair-wizard`, `/review-cockpit`, `/session-recap`, `/compare-trades`, `/calibration`, `/onboarding`, `/first-run`, `/debug/:path*`, `/admin/broker-mappings`, and `/coaching`.
- Fourteen Academy legacy lesson/collection aliases redirect to current Academy slugs and are preservation requirements for progress/link compatibility.

## Documentation conflict to correct after acceptance

`docs/routes.md` says `/workspace`, `/analytics/*`, `/trades/*`, and `/imports/*` redirect into `/intelligence`. Current `next.config.ts` contains no such redirects, and the source contains real pages under `app/(dashboard)`. The source inventory governs Phase 1. The older document should be corrected in a later authorized documentation reconciliation; it must not drive deletion or route rewrites now.

## Phase 1 route conclusions

1. The dashboard route family is the best current same-URL target for Platform, Journal, and Journal Analytics replacement work.
2. `/intelligence` is a legacy application, not an occasional redirect artifact. Its 52 pages require capability mapping before retirement.
3. Several dashboard pages and most Journal HTTP routes still depend directly on V3, so modern-looking URLs do not imply replacement internals.
4. Legacy-prefixed endpoints can remain temporarily during service replacement when doing so reduces migration risk; route renaming is not an early-phase goal.
5. No route is accepted merely because it renders. Replacement acceptance requires data reconciliation, coverage behavior, applicable access checks, and owner UI approval for visible changes.
