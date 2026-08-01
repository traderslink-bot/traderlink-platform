# Trader Intelligence V3 Dependency Map

**Phase:** 1 - inventory and baseline  
**Status:** Direct source dependency map complete; deletion remains prohibited  
**Purpose:** Separate reusable safeguards and product behavior from the V3 authority/analytics architecture that is being replaced.

## Executive finding

V3 is not gone. It is still a structural dependency of the local launcher, dashboard layout and access gate, several modern dashboard pages, most Journal/import APIs, the legacy `/intelligence` application, rules, tags, persistence validation, CI, and analytics resolution.

An exact source search found **107 TypeScript/TSX files outside ordinary documentation that directly name `trader-intelligence-v3`**:

| Source area | Direct-reference files |
| --- | ---: |
| `app/api` | 49 |
| `app/(dashboard)` and shared dashboard code | 13 |
| `app/intelligence` | 17 |
| Other `src/lib` modules | 10 |
| `src/scripts` | 8 |
| Files inside V3 that use its own absolute import path | 9 |
| Other app source | 1 |
| **Total** | **107** |

This is a direct-import count, not the full transitive impact. A page that imports a non-V3 service can still reach V3 through that service.

## V3 implementation size

`src/lib/trader-intelligence-v3` contains these major areas:

| Area | TypeScript files including nested tests/helpers | Current role | Replacement disposition |
| --- | ---: | --- | --- |
| `analytics` | 116 | Dashboard resolution, query/capability/policy machinery, rules, projections, analytics contracts | Replace ordinary-dashboard authority; selectively port exact calculations and validation after capability review |
| `domain` | 45 | Validation, canonicalization, state/identity and other foundations | Inspect and selectively reuse safeguards without preserving V3 envelopes/proof as a dashboard prerequisite |
| `ingestion` | 12 | Import catalog, repair records, raw broker import | Replace with Journal import/source-row/execution/Data Decision services |
| `auth` | 6 | Private owner access for pages and Route Handlers | Replace with Platform identity/owner/account context; preserve isolation behavior |
| `deployment` | 4 | Deployment contract, local persistence, local network boundary | Preserve appropriate private-data and loopback safeguards until Platform equivalents exist |
| `contracts` | 2 | Route containment/contracts | Re-evaluate against the new route map; do not preserve legacy topology as architecture |
| `recovery` | 2 | Recovery/backup support | Preserve recovery intent and rewrite around replacement snapshots |
| `testing` | 19 | Architecture, route and contract verification support | Retire or rewrite as replacement acceptance checks |
| `__tests__` | 67 | V3 proof/regression suites | Keep as migration evidence until replacement coverage supersedes them; do not run in Phase 1 |

## Direct application dependencies

### Dashboard family

Direct V3 references exist in:

- `app/(dashboard)/layout.tsx`: renders `V3DashboardTemplate` and enforces V3 owner-page access for the entire dashboard family.
- `app/(dashboard)/workspace/page.tsx`: V3 owner access.
- `app/(dashboard)/trades/roundtrips/page.tsx`: V3 owner access and configured dashboard analytics.
- `app/(dashboard)/trades/candle-review/page.tsx`: V3 owner access and configured dashboard analytics.
- `app/(dashboard)/calendar/calendar-data.ts`: V3 analytics/data resolution.
- `app/(dashboard)/trade-tracker/page.tsx`, dated page, and `trade-tracker-data.ts`: V3 owner/data contracts.
- `app/(dashboard)/rules/page.tsx` and `rules-client.tsx`: V3 owner/rule types and service path.
- `app/(dashboard)/analytics/lab/lab-query.ts`, `lab-runtime.ts`, and `lab-saved-views.ts`: V3 analytics capability/query/runtime contracts.
- `app/analytics-server-page.tsx`: shared analytics page rendering over V3-related resolution.

Consequence: the newer-looking dashboard routes are not a replacement engine today. Their shell and several important pages remain V3-gated.

### Legacy `/intelligence` family

Seventeen files directly import V3, including the root/admin/debug layouts; the main Intelligence, analytics, coach, review, progress, calibration, import-health/imports/import-trials/CSV-mapping pages; trades list/detail; and ticker-story detail. Many other Intelligence components depend transitively on `trader-analytics` product/view models built from V3-governed saved data.

Consequence: `/intelligence` must be treated as the legacy application and preservation reference. It cannot be deleted after only replacing `/workspace`.

### Route Handlers

The 49 directly dependent handler files cover these exhaustive groups:

- All current `/api/import-batches` handlers, including preview, detail, commit, discard, repair item, and decision-review resume/status.
- All current `/api/csv-mapping-templates` handlers and `/api/csv-mapping-review/continue`.
- `/api/import-dry-run/decision-review`.
- `/api/analytics/latest`, `/api/coach/latest`, and `/api/review/latest`.
- `/api/execution-feedback/debug`, `/api/trade-analysis/debug`, and `/api/trader-analytics/debug`.
- All current `/api/trades` list/detail/note/review/mark-closed/Level Analysis handlers.
- Both `/api/admin/level-analysis` handlers.
- All six `/api/level-analysis` delivery/trade-link handlers.
- The current `/api/intelligence` broker import/history, overview, Day Session execution/notes/rule-review, execution import, import repair, rules, candle review/simulation, trade-tag, and trade-tag-assignment handlers.

The public Platform, Academy, News, and Watchlist handlers are not direct V3 imports, but their storage fallbacks can still select the V3-configured database. That is a database coupling, not a TypeScript import.

## Direct library and operational dependencies

Outside the V3 tree, direct dependencies include:

- Broker CSV ingestion and raw import bridging in `src/lib/execution-sources`.
- The SQLite import/saved-trade repository and current Workspace overview adapter in `src/lib/trader-analytics`.
- Trading rules repositories/services.
- Trade tags.
- Completed-trade and review storage for candle analysis.
- The local server launcher and seven V3 architecture/private-data/GA verification scripts.

`package.json` makes the V3 local-server wrapper the default `dev` and `start` path. GitHub CI invokes V3 architecture, private-data, dashboard-template, and GA verification commands. Removing the library directory before replacing those entry points would break development, CI, access enforcement, imports, and live routes.

## Dependency chains that caused the dashboard failure mode

```text
Dashboard page
  -> V3 owner/deployment gate
  -> configured dashboard analytics resolver
  -> governed query/projection/read authority
  -> required packet/proof/readiness state
  -> render data or withhold the dashboard result
```

The strict gate is global relative to the user-visible page. A contained unresolved execution/open chain can prevent unrelated valid trades from reaching ordinary metrics. That conflicts with the approved metric-specific eligibility and Data Decisions contract.

The replacement chain is:

```text
Dashboard Server Component
  -> Platform owner/account context
  -> Journal Analytics service
  -> metric contract over eligible Journal facts
  -> value plus included/open/pending/excluded coverage
```

Failure or ineligibility is returned at the affected record/metric/module scope. No proof receipt or authority envelope is required simply to display eligible facts.

## Preserve these safeguards or outcomes

These V3-era outcomes are still required, although their current code is not automatically accepted:

- Server-side owner, workspace, and trading-account isolation.
- Exact local-only network boundary while private owner mode remains in use.
- Private/no-store cache behavior for user data.
- Absolute, outside-repository database-path validation and protection from temporary/sample paths.
- Exact decimal representation for money/quantity and explicit currency scope.
- Deterministic timestamps, timezone/session rules, stable ordering, and identity.
- Bounded and validated untrusted inputs, filter allowlists, deduplication, audit evidence, and correction precedence.
- Explicit source coverage, limitations, unavailable states, and safe errors that do not leak private rows.
- Backup/restore intent and observable migration history.

Each safeguard must receive a replacement contract and focused acceptance evidence. Reusing code is optional; preserving the outcome is mandatory.

## Do not preserve as ordinary dashboard prerequisites

- V3 replay generation as proof that a metric may render. Execution replay can remain a useful Journal review feature.
- Proof receipts, digest chains, authority envelopes, formal policy registries, signed query plans, or route-containment topology as prerequisites for basic dashboards.
- One global dashboard readiness decision that hides unrelated eligible data.
- V3 sample-data fallback on a real-owner route.
- V3 names as permanent Platform, Journal, database, route, CI, or UI contracts.
- Independent browser-side financial calculations.
- Rebuilding a second permanent analytics engine beside the replacement engine.

## Ordered decoupling plan

1. Establish Platform owner/account context and replacement private-data configuration without weakening access isolation.
2. Create a replacement Journal database/repository boundary; migrate from a frozen V3 source snapshot rather than sharing writes.
3. Port source rows, import preview/acceptance, canonical executions, and Data Decisions.
4. Rebuild round trips across complete affected chains and preserve stable note/tag identities.
5. Implement the exact bounded analytics service with coverage and reconcile it to accepted executions/round trips.
6. Switch `/workspace`, `/trades`, and `/analytics` service dependencies while retaining approved URLs and shell behavior.
7. Map and port unique `/intelligence` Journal, Analytics, Coach, Review, and operational capabilities.
8. Replace the local launcher, CI checks, V3-named API internals, and remaining library imports only after equivalent acceptance evidence exists.
9. Retire V3 code through the migration register and deletion gate; never by folder-name cleanup.

## Exit evidence required before V3 retirement

- The direct-reference count is zero outside an explicitly accepted historical/archive boundary.
- No runtime route, action, script, CI job, environment variable, database writer, or scheduled process imports or expects V3.
- The replacement database restores successfully and reconciles to source statements/executions and accepted trader decisions.
- Workspace, Trades, Analytics, Imports, Data Decisions, Trade Tracker, rules, notes/tags/reviews, and every accepted `/intelligence` capability pass their acceptance inventory.
- The user has visually approved every changed UI slice.
- The owner explicitly accepts V3 retirement and the exact deletion list.
