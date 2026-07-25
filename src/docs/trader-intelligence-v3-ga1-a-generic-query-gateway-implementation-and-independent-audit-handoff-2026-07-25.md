# Trader Intelligence v3 GA1-A Generic Query Gateway — Implementation and Independent-Audit Handoff

Date: 2026-07-25 America/Toronto  
Status: implementation complete; independent audit required  
Branch: `agent/trader-intelligence-v3-ga1-a-generic-query-gateway`  
Draft PR: `#160`  
Exact accepted starting base: `b640ba599a4b9604395d203b6224b45d9de21208`  
Accepted-main documentation sync: `fee0eed6d745f963db83fd97b93aa118a25ffae7`  
Executable head: `d8f371153fdb4e8b359584661766dc7f32290e7e`  
Documentation/current head: this separate Markdown-only commit; record its exact SHA in the PR and final handoff  
Owner checkout: preserved; all work occurred in the isolated Codex worktree  
Production: not deployed

## Stop boundary

Keep PR #160 draft, open, unmerged, and undeployed. Do not mark it ready,
merge it, deploy it, resolve independent-review threads, begin GA1-B, or add
agent, UI, model, market-data, simulation, broker, database-write, payment, or
authentication work.

The executable checkpoint is `d8f371153fdb4e8b359584661766dc7f32290e7e`.
This handoff is a separate Markdown-only commit and must not be treated as a
reason to repeat unrelated expensive verification. The executable-head CI
record below is the final scale authority.

## Architecture delivered

GA1-A supplies one closed, versioned, content-addressed query-plan DSL and one
generic deterministic executor over the accepted GA0-B verified analytical
dataset. The plan binds snapshot, canonical filter, dataset and derivation
receipts, partition/currency, owner/account scope, selected filters, one
grouping, metrics, ordering, limits, and policies.

Execution accepts no SQL and exposes no database handle. A read-only gateway
verifies the selected dataset and partition, applies canonical row semantics,
filters once, groups once, calculates exact metrics with accepted
decimal/ratio primitives, emits bounded deterministic evidence, and returns an
immutable content-addressed result and execution receipt. Persisted replay
revalidates the plan and authority, re-enters through the same gateway and
executor, and requires semantic equality of the complete result graph.

The result and evidence verifiers reconstruct nested content-addressed
artifacts, bind them to the verified query-plan authority, and resolve evidence
references to exact analytical rows, execution digests, and occurrence keys.
The intended execution shape is approximately `O(R + G log G + E)`, aside from
accepted authority verification and bounded median projections.

## Requirement-to-file map

| Requirement | Implementation and proof |
| --- | --- |
| Plan contract, validation, normalization, authority, limits | `analytics/query/contracts/query-plan.ts`; contract tests in `__tests__/ga1-a/query-plan-contract.test.ts` |
| Exact result and receipt contracts | `analytics/query/contracts/query-result.ts`; execution/replay tests |
| Read-only validated gateway | `analytics/query/gateway/read-only-query-gateway.ts` |
| Canonical temporal/session/repeat semantics | `analytics/query/execution/row-semantics.ts` |
| Generic executor | `analytics/query/execution/query-executor.ts` |
| Fifteen initial filters | `analytics/query/filters/filter-engine.ts`; independent filter/boundary tests |
| Fourteen initial grouping kinds | `analytics/query/grouping/grouping-engine.ts`; order, identity, boundary, account/currency tests |
| Twenty-two exact metrics | `analytics/query/metrics/query-metrics.ts`; independently calculated synthetic expectations |
| Deterministic evidence and exact resolution | `analytics/query/evidence/query-evidence.ts` |
| Persisted semantic replay and tamper rejection | `analytics/query/replay/persisted-query-replay.ts` |
| Fixed deterministic fixtures | `analytics/query/testing/synthetic-query-authority.ts` |
| Property and scale proof | `__tests__/ga1-a/query-property-scale.test.ts` |
| Consolidated verifier | `src/scripts/verify-trader-intelligence-v3-ga1-a.ts`; `package.json` |
| CI integration | `.github/workflows/ci.yml` |
| Architecture identity domain | `domain/identity/content-digest.ts` |
| Controlling decision | `src/docs/trader-intelligence-v3-adr-ga1-a-generic-deterministic-query-gateway-v1.md` |
| Roadmap/resume state | `plan.md`, `src/docs/codex-project-log.md`, post-GA0-B project-log addendum |

## Changed files

Compared with the accepted-main sync `fee0eed6d745f963db83fd97b93aa118a25ffae7`,
the executable head changes 34 paths:

- `.github/workflows/ci.yml`
- `package.json`
- `plan.md`
- `src/docs/codex-project-log.md`
- `src/docs/trader-intelligence-v3-adr-ga1-a-generic-deterministic-query-gateway-v1.md`
- `src/docs/trader-intelligence-v3-project-log-addendum-post-ga0-b-direction-2026-07-25.md`
- four files under `src/lib/trader-intelligence-v3/__tests__/ga1-a/`
- `src/lib/trader-intelligence-v3/analytics/index.ts`
- 21 contract, gateway, execution, filter, grouping, metric, evidence, replay,
  testing, and barrel files under `src/lib/trader-intelligence-v3/analytics/query/`
- `src/lib/trader-intelligence-v3/domain/identity/content-digest.ts`
- `src/scripts/verify-trader-intelligence-v3-ga1-a.ts`

The branch also contains the accepted-main documentation-only sync
`src/docs/trader-intelligence-v3-market-data-source-and-levels-system-correction-2026-07-25.md`;
that file came from PR #159 and is not GA1-A implementation.

## Capacity contract

| Boundary | Maximum |
| --- | ---: |
| filters | 15 |
| metrics | 22 |
| orderings | 3 |
| groups / rows | 256 |
| evidence candidates per group | 16 |
| total evidence candidates | 512 |
| diagnostics | 128 |
| grouping boundaries | 64 |
| serialized plan | 65,536 code units |
| serialized result | 1,048,576 code units |

Contract tests cover max-plus-one failure. The fixed-seed scale fixture contains
10,000 included USD rows in the selected partition; the scale test executes an
aggregate query, weekday/time/direction groupings, the full metric set, bounded
evidence and serialization, stable repeated identity, and the documented
150-second execution budget. Small deterministic tests independently prove
input-permutation identity, exact evidence resolution, grouped/aggregate
conservation, and stable max-plus-one rejection.

## Local executable evidence

The following results were recorded before the executable head. The user
directed that the new GA1-A 10,000-row scale proof not be run locally.

- Focused GA1-A suite: 4 files, 41 tests passed, 1 scale test skipped by its
  explicit environment gate.
- Final evidence/result hardening: 1 affected file, 4 tests passed.
- Small fixed 200-row property/differential fixture: passed.
- Consolidated GA1-A verifier with `--skip-scale`: 3/3 executed stages; 41
  tests passed, 1 scale test skipped; architecture and private-data stages
  passed.
- Existing GA0-B non-scale B1/B2/B3/B4 suites: 6 files, 87 tests passed.
- Existing GA0-A2 verifier: 14 files, 308 tests passed; its architecture and
  private-data subchecks passed.
- TypeScript: `npx tsc --noEmit` passed, including after final hardening.
- Focused ESLint: passed for all changed source/test/script paths; final
  hardening's three affected paths also passed.
- Architecture verifier: passed; final hardening result was 466 scanned
  architecture files, 43 API routes, and 82 classified Trader Intelligence
  routes.
- Private-data verifier: passed; earlier checkpoint scanned 23,749 records.
- `git diff --check`: passed.
- `npm run build`: Academy registry validation passed, then Turbopack rejected
  the temporary out-of-worktree `node_modules` junction as outside its
  filesystem root. This is an environmental build-path failure, not a pass.
- `npm run build:webpack`: passed the production build fallback, TypeScript,
  and generation of 127 pages.

The temporary `node_modules` junction used to access the compatible installed
dependencies was verified and removed before each commit. No dependency or
lockfile changed.

## CI evidence

Executable-head CI completed successfully:

- CI run `30160437357`, job `89684772634` (`test-and-verify`): passed.
- Repository suite: 196 files passed; 2,022 tests passed and 1 skipped.
- GA0-A2, architecture, private-data, GA0-B, Layer 2, and Layer 3 steps:
  passed.
- Consolidated GA1-A verifier: 4/4 stages passed in 34,326 ms.
- GA1-A focused stage: 4 files, 41 passed and 1 gated scale test skipped;
  duration 9.55 seconds.
- Final fixed-seed GA1-A scale stage: 1 targeted scale test passed; test time
  17.54 seconds and stage duration 19.60 seconds, below the 150-second budget.
- Final GA1-A architecture result: 466 architecture files, 43 API routes, 82
  classified Trader Intelligence routes.
- Final GA1-A private-data result: 23,856 scanned records, 23,750 final-tree
  records, and 106 PR-history blobs.
- Seeded trade-detail facts run `30160437536`, job `89684772868`: passed.

## Deliberately unrun or not repeated

- The GA1-A 10,000-row scale proof was deliberately not run locally, at the
  user's direction. Its one final execution belongs to executable-head CI.
- Playwright/e2e was not run locally because GA1-A has no browser-facing work.
- `npm ci` was not run locally because dependencies did not change.
- Full local `npm test` was not run; GitHub CI owns the repository-wide suite.
- The full GA0-B verifier was not rerun locally because it includes its
  unrelated expensive scale proof; the six affected non-scale suites passed
  87/87 and CI owns the consolidated verifier.
- The default Turbopack build was not repeatedly retried after the verified
  junction/environment failure; the targeted webpack production build passed.
- No verifier is rerun for this later Markdown-only commit.

## Known limitations

- GA1-A is a domain/server-side deterministic foundation. It has no natural
  language compiler, public preset registry, agent, owner-facing UI, or
  production database adapter.
- One primary grouping is accepted per query plan. Comparison is represented by
  two separately validated executions.
- Empty grouping buckets are omitted.
- Profit factor is unavailable when its exact loss denominator is zero.
- Position-size metrics are unavailable when accepted notional authority is
  incomplete.
- The in-memory adapter is deliberate for this slice; a future production
  adapter must preserve the same read-only gateway contract.

## Explicit exclusion confirmation

No UI, chat, chart, AI/model, Analytics Agent, Coach Agent, Simulation Bot,
candle or other market-data access, VWAP/EMA/MFE/MAE/setup/catalyst/level/zone
analysis, counterfactual simulation, broker integration, unrestricted SQL,
database migration or write, payment, authentication, hosting, deployment,
owner trade row, credential, private database, GA1-B, merge, or ready-for-review
work occurred.

## Ready-to-paste independent-auditor prompt

Audit draft PR #160 as an independent reviewer. Audit exact accepted starting
base `b640ba599a4b9604395d203b6224b45d9de21208`, accepted-main documentation sync
`fee0eed6d745f963db83fd97b93aa118a25ffae7`, executable head
`d8f371153fdb4e8b359584661766dc7f32290e7e`, and the later Markdown-only
documentation head recorded in the PR and final handoff. Keep the PR draft,
open, unmerged, and undeployed. Do not mark it ready, merge it, deploy it,
resolve review threads, begin GA1-B, or add agent/UI/model work.

Read `plan.md`, the post-GA0-B project-log addendum, the query/simulation/candle
direction lock, the GA1-A ADR, this handoff, and accepted GA0-B contracts,
runners, evidence, replay, architecture, and private-data guards. Treat the
product packaging/backlog document as non-controlling.

Review the generic plan contract for exact schema/version/key, immutable
normalization, content identity, complete upstream authority, owner/account and
currency scope, unknown/missing/accessor/non-plain rejection, duplicate and
contradictory selection rejection, unsupported combination rejection, and
stable max-plus-one failure. Independently test all fifteen filters and
important date/session/time/price/holding/size/sequence/repeat/previous-strictly-
completed boundaries, including simultaneous completion ambiguity. Review all
groupings for deterministic lower-inclusive/upper-exclusive bucket semantics,
canonical ordering, omitted-empty policy, stable group identity, permutation
invariance, and no cross-account or cross-currency leakage.

Independently calculate the 22 metrics over small deterministic fixtures.
Confirm all financial authority uses accepted exact decimal/ratio primitives,
not JavaScript floating point. Check zero-denominator and incomplete-notional
unavailability. Confirm the gateway accepts only verified plans and exact
dataset/derivation/partition authority, is read-only, exposes no SQL/database
handle/credentials/provider payload, and returns bounded immutable rows.

Trace the single executor from envelope/plan validation through gateway,
semantics, filtering, grouping, exact metrics, ordering, evidence, limitations,
result digest, and execution receipt. Confirm future named capabilities must
compile to this engine. Check the implementation for nested whole-population
rescans and assess the documented `O(R + G log G + E)` target.

Verify every material result row has bounded deterministic evidence binding
snapshot, filter, dataset, partition, query plan, policies, population, row,
execution, and occurrence identity. Exercise exact evidence resolution and
tampering of plans, authorities, results, receipts, evidence, policies, labels,
filters, groupings, metrics, ordering, and limits. Confirm persisted replay
re-enters through plan validation, the exact gateway, and the generic executor,
then requires semantic equality of the complete result graph.

Review the fixed-seed property and scale proof. Confirm the scale fixture has at
least 10,000 included rows in one selected USD partition, executes aggregate
plus weekday/time/direction groupings and the full metric set, emits bounded
resolvable evidence and serialized artifacts, preserves deterministic identity,
and stays below the documented 150-second budget. Verify max-plus-one failure
and small independent differential/property coverage. Use executable-head CI
run `30160437357`, job `89684772634`, for the one final scale proof;
do not repeat unrelated expensive verifiers merely because the later handoff
commit is Markdown-only. If the scale proof itself fails, fix only the affected
issue and rerun the affected focused tests plus the scale proof.

Confirm architecture and privacy guards reject UI/model/market/broker/write-
database imports or raw authority crossing future browser/model boundaries.
Inspect the Git diff for owner data, credentials, database files, real trade
rows, real candle data, scope drift, dependency changes, and duplicated engine
logic. Verify the owner checkout remained untouched as far as available
evidence permits.

Report code findings by severity with exact file/line evidence. Separately
report commands passed, failed, environmentally blocked, deliberately unrun,
CI run/job IDs and conclusions, capacity/scale evidence, and any facts that
cannot be independently verified. Stop after the audit verdict and handoff; do
not mutate the PR state or review threads.
