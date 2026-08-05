# Phase 5 Slice E Analytics Lab, Candle Review and Level Analysis Plan

**Status:** Retained but disabled from the online dashboard. The former Analytics Lab routes redirect to Analytics until a future owner-approved scope makes the feature useful enough to restore.
**Repository:** `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
**Branch:** `codex/traderlink-platform-replacement`
**Runtime:** Port 3010 remains off until the combined visual checkpoint

## Outcome

Slice E reconnects Analytics Lab, Candle Review and Level Analysis without
restoring V3 analytics, V3 authentication, repository-local sample authority,
or the shared legacy SQLite database. All trade selection starts from the
server-derived active Journal account and stable Journal round-trip identity.

The approved light Material dashboard shell remains unchanged. Analytics Lab is
not included in the public navigation or reachable as a separate experience at
this stage. Its implementation and saved-view data are retained for later work;
they are not deleted or presented as ready.

## Audit findings

1. The replacement Journal Analytics engine already publishes a strict query
   contract, exact result values, explicit coverage and a 210-capability
   registry. The disabled Analytics Lab route does not use it yet.
2. The preserved full Analytics Lab client still imports a V3/sample runtime,
   exposes groupings that the replacement engine cannot honestly calculate,
   converts financial authority to browser numbers, and saves views in a
   V3-named JSON directory.
3. Candle Review still resolves completed trades through V3, persists review
   JSON in a V3-named directory and uses V3 route authorization.
4. The experimental candle-analysis page loads a public standalone chart
   script and its simulation API is limited to hard-coded symbols. Neither is
   accepted ordinary runtime authority.
5. `lightweight-charts` 5.2.0 is installed. Local typings confirm the v5
   `chart.addSeries(SeriesType, options)` and `createSeriesMarkers` APIs,
   second-based `UTCTimestamp` values and client-only lifecycle requirements.
6. Level Analysis has extensive reusable validation, delivery, link and
   factual read-model contracts. Its current SQLite repositories use the
   legacy Trader Intelligence database accessor, and its active APIs use V3
   authorization.
7. No legacy Analytics Lab, Candle Review or Level Analysis feature directory
   was found beneath the current private-data root. Legacy database table
   content is not adopted merely because an old repository can create those
   tables. Fixtures remain test contracts only.

## E1 - replacement Analytics Lab query surface

- Build the route and query actions on `JournalAnalyticsService`, the accepted
  query contract and the active Journal account derived on the server.
- Never send internal user, workspace or account UUIDs to the browser. Every
  read carries the opaque expected account-selection reference and fails on a
  stale selection rather than silently showing a different Journal account.
- Publish every registry metric. Implemented and conditional capabilities are
  selectable. Unavailable capabilities remain visible with their exact missing
  fact/reason instead of returning a zero, sample or guessed value.
- Expose only accepted query dimensions: closing day/week/month/year, entry
  weekday/time bucket, instrument, direction, provenance, holding-duration,
  entered-quantity, maximum-position, entry-notional and realized-outcome.
- Expose the accepted date, currency, symbol, direction, provenance, outcome,
  weekday, time-bucket, holding-duration, entered-quantity,
  maximum-position and entry-notional filters. Do not retain legacy session,
  trade-sequence, repeat-attempt, pre-entry-state or prior-streak controls until
  their required facts exist.
- Keep calculation values as exact Journal result values. Numeric conversion is
  permitted only for local chart geometry. All visible trading-data numbers use
  at most two decimal places; unavailable and partial coverage remain explicit.
- Evidence tables use stable round-trip IDs only as server-side targets. The
  browser receives the existing opaque round-trip navigation key, not an
  account identity.
- Do not use sample data in ordinary runtime. An empty account renders a real
  empty state.

## E2 - saved Analytics Lab views

Before the first write:

1. confirm target ports are stopped and the replacement WAL is empty;
2. create and restore-verify a fresh online backup;
3. approve the exact immutable migration descriptor and schema digest; and
4. apply and verify the migration on a disposable restored database first.

Migration `0008_journal_analytics_saved_views` will create:

- `journal_analytics_saved_views` for the current account-scoped view identity,
  lifecycle and optimistic revision; and
- `journal_analytics_saved_view_versions` for immutable normalized query JSON,
  query digest, name and creation evidence.

The server derives workspace/account/author identity, validates queries through
the same accepted allowlist used for execution, rejects stale account selection
and revision, caps active saved views at 100 per Journal account, and never
writes repository-local JSON. Existing V3-named saved-view files are preserved
as legacy evidence but are not copied without a separately proven non-test
record and exact query conversion.

The exact migration, normalization, lifecycle and ownership contract is in
[Phase 5 Slice E Saved Analytics Views Schema](phase-5-slice-e-saved-analytics-views-schema.md).

## E3 - Candle Review and market-data facts

The exact migration, provider, normalized-fact and review-version contract is
in [Phase 5 Slice E Candle Review and Market Facts Schema](phase-5-slice-e-candle-review-market-facts-schema.md).

- Resolve the requested target through the selected Journal account and stable
  ready-closed round trip. Never accept a broker trade key as authority.
- A candle request occurs only after the trader presses the review action. That
  explicit action authorizes sending only the displayed symbol, required
  interval and bounded start/end times to the configured market-data provider.
  Never send statements, broker/source-account identifiers, user/workspace/
  Journal-account identities, notes, tags, rules or unrelated executions.
- Provider facts preserve provider name, request and retrieval timestamps,
  interval, provider timezone semantics, adjustment policy, coverage window,
  normalized candle digest and coverage/failure reason. Provider failure never
  changes Journal execution or round-trip facts.
- Normalized candle facts and derived review observations are versioned in the
  replacement database under a Level Analysis/market-data migration. Raw
  provider payloads are not stored unless a later reviewed evidence-vault
  contract requires them.
- Review language is factual observation or clearly labeled assistance. It is
  never a trade grade, recommendation or factual trader-intent classification.
- Use the installed `lightweight-charts` 5.2.0 package for any production chart.
  Do not load the public standalone script, use old v4 methods, pre-shift source
  timestamps or recreate the chart on every React render.
- The hard-coded simulation-symbol route remains development evidence only and
  is removed from ordinary runtime or converted to an explicitly isolated
  design-preview boundary.

## E4 - Level Analysis persistence and compatibility APIs

The exact accepted migration, ownership, ingestion, resolution and route
contract is in [Phase 5 Slice E Level Analysis Deliveries and Links
Schema](phase-5-slice-e-level-analysis-deliveries-and-links-schema.md).

- Reuse the existing strict delivery, snapshot, trade-link, coverage and
  facts-only UI contracts after removing their V3 database/authentication
  dependencies.
- Level Analysis owns versioned provider deliveries and symbol facts. Journal
  owns the account-scoped stable-round-trip link to an accepted delivery
  version. No broker identity chooses that relationship.
- A new immutable migration is designed and reviewed after E1/E2 and before any
  real Level Analysis write. Existing legacy tables and fixture packages are
  not copied into the replacement runtime merely because they exist.
- Compatibility APIs derive the local Platform request scope, enforce the
  selected Journal account and return honest disabled/unavailable/limited
  states when no accepted delivery is linked.
- Provider ingestion requires bounded payloads, schema/version validation,
  immutable digest evidence, idempotency and explicit provider allowlisting.

## Focused verification gates

Each sub-slice must pass:

1. active-file V3/sample/shared-database dependency verification;
2. strict input and stale-account/revision tests;
3. exact-value/coverage and unsupported-combination tests;
4. targeted lint and dependency-scoped TypeScript;
5. one-worker focused tests with no file parallelism;
6. disposable migration/write/read proof for persistence changes;
7. privacy-safe real-database verification with hash/WAL evidence; and
8. the later combined route/browser checkpoint, not a separate dev-server run
   after each implementation change.

No full test suite, production build, push, deployment or port 3010 start was
part of the Slice E focused gates. Those checks remain required at the Phase 6
whole-product acceptance boundary.

## Stop conditions

Stop the affected work if a query needs an unaccepted fact, a provider request
would disclose anything beyond symbol/interval/bounded time, a saved view cannot
be normalized without guessing, a Level Analysis link cannot resolve one exact
account-scoped stable round trip, the replacement database changes outside the
authorized migration/write step, or another task begins overlapping writes.
