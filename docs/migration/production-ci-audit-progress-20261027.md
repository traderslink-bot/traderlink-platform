# Production CI audit — 2026-10-27

## Owner scope and isolation

The owner asked the VPS release Coordinator to investigate the recorded failures,
separate invalid tests from real defects, fix proven defects without changing
approved feature behavior, and report what remains to deploy. This does not
select a production deployment. Community, Coach and Membership releases are
excluded from the deployment inventory. Preserve their active ownership and do
not activate held features, weaken authorization, or rewrite approved UI to make
legacy source assertions pass.

- Workspace: `/home/traderlink/projects/production-ci-audit`
- Branch: `codex/production-ci-audit-20261027`
- Production parent: `f9b33ce129b32cb3aefc727dd099ee86fbdbc78f`
- Initial HEAD: `cbf82ccc4cf67d52d1ec1cff3c3bbc97ca1a865b` (already-reviewed
  erasure fixture guard; 20/20 focused checks passed on released148 and legacy146).
- Existing installed dependencies are linked, not copied or reinstalled.
- Tests use synthetic or in-memory data only; no production/staging DB, secrets,
  providers, Discord sends, migrations, configuration changes or restarts.
- Heavy checks run serially. Temporary databases must be removed after their
  verification purpose; retain source and small result summaries only.

## Baseline

GitHub run40452583478 on productionf9b reported159 failed tests across60 files,
plus one failed suite setup. Complete case inventory is recorded in the
Coordinator's `operations/ci-failure-inventory-20261027.json` (160 items).

Initial grouping by source area: Platform30; Watchlist4; Journal26;
Analytics9; News4; Analyzer4; legacy architecture7; Coach31; Membership45.
Area is not a defect classification. Each case needs evidence before it is
called a test error, product defect, intentional held-feature boundary, or
resource-sensitive integration failure.

Previously verified: three Watchlist suites yielded identical61pass/4fail on
pre-Watchlist da7 runtime and currentf9b. This proves no new failure in those
three suites, not that their four failures are harmless or that all159 are old.

## Work order

1. Recover every failure and its actual assertion/exception; preserve coverage.
2. Investigate potentially real behavior failures first: authorization,
   Watchlist gains, Analyzer routes and Journal correction/reconciliation.
3. Separate stale mocks/source assertions, invalid fixtures, nonportable paths,
   held-feature expectations and native integration timing issues.
4. Apply minimal behavior-preserving corrections and meaningful focused checks.
5. Run a serial broader checkpoint after corrections, record all unresolved or
   owner-lane exclusions honestly, and remove disposable test artifacts.
6. Preserve narrow commits; report exact code corrections and deployment queue.

## Release inventory received

- Watchlist owner: no newer implemented candidate beyond livef9b/d398. A short
  date-label request remains unimplemented and is not part of this audit.
- Member-stats owner: da7 feature is already live throughf9b; no newer candidate.
- Test-only erasure fixture correctioncbf is prepared, not an additional runtime
  feature or justification for a stand-alone production restart.

## Results

### Verified Journal defects

- Pending manual/broker overlap withheld by canonical round-trip reconstruction
  remained in the Analytics fact reader. The resulting allocation-conservation
  exception rolled back valid imports. Match the canonical pending-provisional
  exclusion, retain conservation checks, and assert the original manual fact is
  still present. Four previously failing overlap scenarios now pass.
- Manual coverage decisions recognized only `manual_execution_v1`, while current
  capture writes v2. Accept both known layouts without changing date/timezone or
  account constraints. Three previously failing coverage decisions now pass.
- Focused Journal integrity + Analytics repository checkpoint: **45 passed,
  zero failed**. Initial two-case reproduction failed before corrections.
  Receipts: Coordinator operations/ci-audit-journal-{initial,corrections}-20261027.json.

### Local tooling and fixture audit

- Local development loader used a Windows-only parent separator and rejected
  valid Linux sibling storage. Use the host path separator; keep repository
  containment rejection and add a negative regression assertion.
- Database path tests supplied Windows drive paths on Linux. Replace test
  fixtures with host-native absolute temporary paths, not weaker validation.
- Admin authorization test still demanded a five-minute expiration explicitly
  removed by approved commit4980d577e. Preserve current runtime policy and test
  a valid owner after one hour plus missing-grant/non-owner rejection.
- Migration file verifier rejected valid single-quoted TypeScript metadata.
  Accept either matching quote style, keep exact ID/namespace/order comparisons.
  No applied migration source or checksum changed.

### Additional confirmed metadata defect

The registry already implements `average_trade_return` and `median_trade_return`,
but its declared capability inventory omitted both. Add only those existing IDs;
the emitted metric definitions, formulas and approved UI remain unchanged.
All four registry checks and the additive query contract checks pass. This is
metadata consistency, not two new product metrics or evidence of wrong P/L.

### Tests separated from runtime changes

- Watchlist gain fixture now provides the actual publication price/time rather
  than a removed card's price. Current numbered pullback and sign-in contracts
  are asserted without editing the UI. All65 Watchlist checks pass.
- Synthetic restricted-mode fixtures explicitly enforce their own commercial
  policies; production's owner-controlled default-off rollout is untouched.
  News push, Private Watchlist, Journal annotations and migration checks:33 pass.
- Identity fixtures now create durable auth links. Historical11-migration
  backfill fixtures seed the historical schema instead of invoking today's
  profile-aware repository against missing tables. Auth/email/storage group:
  19 pass. Account-scope group:4 pass, including member denial.
- Analyzer route mocks now include logical lookup, events, profit protection and
  written-review context. Current saved availability status remains unchanged.
  Manual route mocks include affected trade targets, fee intent and current
  response fields. A mock returning no queued IDs cannot promise one queued ID.
- Halt migration test seeded two tickers but expected one anchor; five active
  subscriptions correctly each receive the next revision. Assert both anchors,
  per-subscription revisions and aggregate delivery count. Applied SQL unchanged.
- Reverse-split0142 test now selects its exact0140 predecessor even after later
  migrations exist, retains its exact checksum and tests current erasure's
  pending-purge return contract rather than falsely claiming physical purge.
- Native import matrix case times measured up to52.3s, including repeated
  initialization/import/integrity checks. Preserve checks with bounded90s suite
  budget; smaller source-identity fixture matrix has bounded30s budget.
  Production request timeout and integrity validation are not changed.

### Explicit residual boundaries

The160-item Coordinator inventory is classified with per-case evidence. A
classification is not a resolution or universal safety finding:

-76 Coach/Membership items remain with their owner lanes and are excluded from
  this release. Deliberate generation/cache guards and default-off rollout must
  not be bypassed to make tests green. Source review also found stale provider,
  wording, notification defaults and a217-day range that no longer exceeds the
  current1500-day rule-result maximum.
-7 legacy V3 architecture assertions need current Platform route/frame inventory
  maintenance. Incomplete old audit coverage is not proof that new routes are
  safe, nor proof of a runtime authorization defect. No broad route rewrite.
-9 source/copy assertions remain test-maintenance debt: Trade Explorer's shared
  detail editor/sort options/server-only import ordering, clean Light chart theme,
  demo sx color props and capitalized unavailable-P/L wording. Do not restore
  obsolete UI to satisfy these assertions.
-All17 original default5000ms integration failures now completed their assertions
  in bounded serial runs. Source-identity's12-case matrix passed at30s. The final
  ten-case native check passed: smaller cases3.3–6.3s, large import/corruption
  matrices29.7–62.7s within the90s suite budget. No assertion was removed.
-Final login component group:9/9 passed after router/field/copy fixture repairs.

Original-case disposition:68 failures addressed by verified corrections;76
excluded owner-lane cases,7 legacy architecture inventory gaps and9 stale
source/copy assertions remain explicit. This is not a claim of full CI green.

No full-CI-green claim, no real-user deletion, no real notification/provider
delivery, no hosted mutation. The live app reports ready148 during this audit.
Full release build and fresh exact-target hosted/schema gates are still required
before selecting any corrected source for production.

## Compiler qualification

The default2GiB Node compiler heap exhausted during the full source check. A
single-process4GiB invocation (VPS had10GiB available) completed and reported only
two pre-existing Moomoo test-fixture type errors: empty objects are not a complete
`ProcessEnv` because `NODE_ENV` is required. Explicit synthetic `NODE_ENV:test`
fixes the fixture without changing readiness or alert runtime behavior. Focused
Moomoo tests and final compiler qualification are recorded separately; no
production environment setting or heap limit was changed.
