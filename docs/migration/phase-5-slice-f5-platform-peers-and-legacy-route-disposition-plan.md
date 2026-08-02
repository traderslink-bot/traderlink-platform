# Phase 5 Slice F5 - Platform Peers And Legacy Route Disposition

**Status:** locally accepted; focused registry and all 52 route dispositions passed in Phase 6

**Scope:** Phase 5 Slice F5 only

**Parent plans:** [Phase 5 Remaining Modules](phase-5-slice-f-remaining-modules-plan.md) and [Platform Replacement Plan](traderlink-platform-replacement-plan.md)

## Outcome

Make Platform readiness and the remaining peer surfaces part of the replacement
application, and remove every ordinary browser path into the retired V3
application without deleting its preserved source. Each of the 52 legacy
`/intelligence` pages has an exact capability disposition below.

The approved light Material dashboard remains the only Journal dashboard.
Legacy dark-shell pages, sample/mock review tools, fixture-driven readiness
pages and V3 authorization are not replacement surfaces.

## Owner decisions governing this slice

- Legacy trades, saved trades, rules, tags, notes and review records were test
  data and are not migration inputs.
- New rules, tags, daily notes and trade notes must remain bound to the stable
  Platform user, selected user-defined Journal account and stable round-trip or
  trading-day identity.
- A Journal account is user-defined. It is not a broker account and can contain
  imports or manual executions from more than one broker.
- Legacy source remains available for recovery/reference. Phase 5 deletes no
  legacy page or implementation file.
- Public Discord authentication and hosted-data adoption remain F6. Local
  loopback review stays login-free and uses the guarded development owner.

## Platform readiness contract

The canonical readiness surface is `/workspace/readiness` inside the approved
dashboard layout. `/platform-readiness` temporarily redirects to it.

Readiness is computed from the replacement application and database, not from
V3 feature registries or test fixtures. It reports only privacy-safe facts:

- replacement database connection and completed migration count;
- expected and observed replacement-owned table counts;
- stable Platform owner/workspace/Journal-account availability;
- the module boundary represented by every applied migration;
- the exact 52-route legacy disposition totals; and
- explicit pre-launch gates for public Discord identity, hosted row adoption
  and Phase 6 integrated verification.

The page must not reveal database paths, IDs, authentication subjects, broker
identifiers, statement values, credentials or private trade facts. It performs
no DDL and no writes.

## Redirect rules

- Configuration redirects are evaluated before the filesystem, so preserved
  legacy pages remain in source but are no longer ordinary browser entrypoints.
- Replacement redirects are temporary (`307`) until the complete application
  passes Phase 6 and the final route contract is accepted. This prevents a
  browser or search engine from permanently caching an in-progress migration.
- Existing query values are preserved by Next.js. Dynamic legacy identifiers
  are not treated as replacement stable identifiers unless an exact mapping is
  proven.
- End-user capabilities go to the closest completed canonical surface.
- Operational/debug-only and deliberately deferred capabilities go to
  `/workspace/readiness` with a privacy-safe capability key.
- Mock/sample review cases are owner-rejected as product data and return to the
  replacement workspace.

## Exact 52-page disposition

| # | Legacy route | Unique capability | Disposition | Canonical destination |
| ---: | --- | --- | --- | --- |
| 1 | `/intelligence` | legacy application entry | canonical redirect | `/workspace` |
| 2 | `/intelligence/admin` | QA/operations index | operations only | `/workspace/readiness?capability=legacy-admin` |
| 3 | `/intelligence/admin/broker-mappings` | broker mapping administration | canonical redirect | `/imports?mode=mapping` |
| 4 | `/intelligence/analytics` | analytics overview | canonical redirect | `/analytics` |
| 5 | `/intelligence/analytics/behavior` | execution behavior analysis | canonical redirect | `/analytics/execution` |
| 6 | `/intelligence/analytics/chart-evidence` | candle/chart evidence | canonical redirect | `/trades/candle-review` |
| 7 | `/intelligence/analytics/details` | analytics detail | canonical redirect | `/analytics/results` |
| 8 | `/intelligence/analytics/results` | analytics results | canonical redirect | `/analytics/results` |
| 9 | `/intelligence/analytics/review-plan` | factual review plan | canonical redirect | `/reflection-loop` |
| 10 | `/intelligence/analytics/session-stories` | trading-day performance | canonical redirect | `/analytics/performance` |
| 11 | `/intelligence/analytics/ticker-stories` | ticker-grouped performance | canonical redirect | `/trades/ticker` |
| 12 | `/intelligence/analytics/timing` | timing analytics | canonical redirect | `/analytics/timing` |
| 13 | `/intelligence/analytics/trade-explorer` | analytics exploration | canonical redirect | `/analytics/lab` |
| 14 | `/intelligence/calibration` | analytics calibration | canonical redirect | `/analytics/lab?view=calibration` |
| 15 | `/intelligence/coach` | coaching overview | canonical redirect | `/reflection-loop` |
| 16 | `/intelligence/coach/behavior-sequence` | execution sequence review | canonical redirect | `/reflection-loop?view=behavior-sequence` |
| 17 | `/intelligence/coach/details` | review detail | canonical redirect | `/reflection-loop` |
| 18 | `/intelligence/coach/next-session` | next-session focus | canonical redirect | `/reflection-loop?view=next-session` |
| 19 | `/intelligence/coach/progress` | reflection progress | canonical redirect | `/reflection-loop` |
| 20 | `/intelligence/coach/review-backlog` | unresolved review work | canonical redirect | `/reflection-loop?view=backlog` |
| 21 | `/intelligence/coach/review-session` | daily review | canonical redirect | `/trade-tracker` |
| 22 | `/intelligence/coach/session-stories` | day-level reflection | canonical redirect | `/reflection-loop?period=daily` |
| 23 | `/intelligence/coach/ticker-stories` | ticker-level reflection | canonical redirect | `/trades/ticker` |
| 24 | `/intelligence/compare-trades` | trade comparison | canonical redirect | `/analytics/lab?view=trade-comparison` |
| 25 | `/intelligence/csv-mapping-review` | manual statement mapping | canonical redirect | `/imports?mode=mapping` |
| 26 | `/intelligence/debug/execution-feedback` | execution-feedback harness | operations only | `/workspace/readiness?capability=execution-feedback-debug` |
| 27 | `/intelligence/debug/trade-analysis` | trade-analysis harness | operations only | `/workspace/readiness?capability=trade-analysis-debug` |
| 28 | `/intelligence/debug/trader-analytics` | fixture analytics harness | operations only | `/workspace/readiness?capability=analytics-debug` |
| 29 | `/intelligence/first-run` | first import guidance | canonical redirect | `/imports` |
| 30 | `/intelligence/import-dry-run` | pre-commit import inspection | canonical redirect | `/imports?mode=preview` |
| 31 | `/intelligence/import-health` | import health and broker support | canonical redirect | `/imports` |
| 32 | `/intelligence/import-trials` | fixture/import trial harness | operations only | `/workspace/readiness?capability=import-trials` |
| 33 | `/intelligence/imports` | import history | canonical redirect | `/imports` |
| 34 | `/intelligence/imports/[batchId]` | batch repair/detail | canonical redirect | `/data-decisions` |
| 35 | `/intelligence/onboarding` | Journal onboarding | canonical redirect | `/imports` |
| 36 | `/intelligence/progress` | review progress | canonical redirect | `/reflection-loop` |
| 37 | `/intelligence/repair-wizard` | import repair | canonical redirect | `/data-decisions` |
| 38 | `/intelligence/review` | guided review | canonical redirect | `/reflection-loop` |
| 39 | `/intelligence/review-cockpit` | review queue/actions | canonical redirect | `/reflection-loop?view=backlog` |
| 40 | `/intelligence/session-recap` | daily recap | canonical redirect | `/reflection-loop?period=daily` |
| 41 | `/intelligence/trader-intelligence` | mock review cases | owner-rejected test surface | `/workspace` |
| 42 | `/intelligence/trades` | saved trade list | canonical redirect | `/trades/roundtrips` |
| 43 | `/intelligence/trades/[tradeId]` | trade detail/review | canonical redirect | `/trades/roundtrips` |
| 44 | `/intelligence/trades/calendar` | trading calendar | canonical redirect | `/calendar` |
| 45 | `/intelligence/trades/day-session/[sessionDate]` | dated Trade Tracker | compatibility redirect | `/trade-tracker/[sessionDate]` |
| 46 | `/intelligence/trades/day-sessions` | Trade Tracker | compatibility redirect | `/trade-tracker` |
| 47 | `/intelligence/trades/open-swing` | intentional swing/open position review | canonical redirect | `/trades/open` |
| 48 | `/intelligence/trades/review-needed` | facts requiring trader decision | canonical redirect | `/data-decisions` |
| 49 | `/intelligence/trades/round-trips` | reconstructed round trips | canonical redirect | `/trades/roundtrips` |
| 50 | `/intelligence/trades/ticker-stories` | ticker history | canonical redirect | `/trades/ticker` |
| 51 | `/intelligence/trades/ticker-story/[threadId]` | one legacy ticker thread | canonical redirect | `/trades/ticker` |
| 52 | `/intelligence/upload-csv` | statement upload | canonical redirect | `/imports` |

## Peer surfaces

- `/charts` remains the dashboard-owned Market Charts page and is audited for
  shell compliance; market-chart provider behavior is not made a Journal fact.
- `/filtered-news-momentum-scanner-access` remains a public/shared-site peer.
  Its Platform identity and Affiliate ownership were established in F4, with
  the hosted public identity switch reserved for F6.
- News, Academy, Watchlist, landing and shared site routes remain owned by their
  named modules. F5 does not move them under Journal or copy their storage.
- Legacy top-level aliases such as `/review`, `/upload-csv` and `/coaching`
  must redirect directly to replacement routes rather than chaining through
  `/intelligence`.

## Implementation steps

1. Add a typed, count-checked route-disposition registry with all 52 entries.
2. Add the V3-free, read-only Platform readiness service and
   `/workspace/readiness` dashboard page.
3. Replace `/platform-readiness` with a compatibility redirect.
4. Apply the registry to `next.config.ts` before the preserved filesystem
   routes and replace top-level aliases with direct replacement destinations.
5. Extend the active-file static verifier to reject new V3 access and verify
   route count, destinations, temporary status and the readiness boundary.
6. Run focused TypeScript, targeted lint, static route verification and
   privacy-safe read-only real-database readiness verification. Focused Vitest
   files may be written, but their execution follows the active test policy.

## Acceptance gate

- Registry contains exactly 52 unique `/intelligence` sources and no duplicate
  or destination back into `/intelligence`.
- Each preserved page path is represented once.
- Requests cannot reach the legacy layout through an ordinary configured path.
- `/workspace/readiness` uses only replacement Platform services and the shared
  light Material dashboard.
- Readiness reflects the real replacement migration/table boundary and is
  privacy-safe and read-only.
- No legacy source is deleted, no test/sample data is migrated, and no database
  content changes.
- No port, Git staging, commit, push, deployment or production state changes.

## Phase boundary

Public Discord identity activation, hosted database reconciliation, production
environment changes, broad regression, production build, browser/E2E and final
route retirement remain F6/Phase 6 work.

## Technical completion checkpoint

- The typed registry contains exactly 52 unique filesystem-matched sources: 44
  canonical, two compatibility, five operations-only and one owner-rejected
  mock/test disposition.
- All replacement redirects are temporary, all static paths precede dynamic
  matches, and no destination returns to `/intelligence`.
- `/workspace/readiness` uses the approved shared dashboard and reads only the
  verified replacement database plus server-derived Platform scope.
  `/platform-readiness` is a compatibility redirect; its former V3/fixture
  runtime is no longer active.
- Focused TypeScript, targeted lint, `git diff --check` and the 122-file active
  no-V3 static verifier pass.
- The privacy-safe real-database proof reports 16 migrations, 59 domain tables
  plus the registry, seven module storage boundaries, one allowed/selected
  Journal account and unchanged main-file size/hash: 11,268,096 bytes and
  `9f14fade99348729336044c36f30edd4c9f0ad53a75dcb2de7b3eb5b9b9fae5d`.
- One focused three-case route-registry test is written but not executed under
  the active repository test rule. It remains part of the Phase 6 suite.
- No legacy source, database content, process, port, Git stage/commit/push,
  deployment or production state changed.
