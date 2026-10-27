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

Investigation remains in progress. No broad CI-green or no-live-impact claim.
