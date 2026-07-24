# Trader Intelligence v3 GA0-B1 Second Remediation and Independent Re-audit Handoff

Date: 2026-07-23

Status: implementation complete; stop for independent re-audit
Verdict entering this remediation: accept with required fixes

## Evidence warning

This document contains implementer-supplied evidence. It is not independent
proof. The re-auditor must inspect the full diff, reconstruct the relevant
authorities, and rerun the checks at the immutable heads recorded below.
Passing tests, CI, this handoff, and the PR comment are evidence only.

## Repository and immutable references

- Repository: `traderslink-bot/traderslink-trader-improvement-system`
- Branch: `agent/trader-intelligence-v3-ga0-b1-read-model`
- Draft PR: `#133`
  (`https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/133`)
- Immutable original base and merge base:
  `153eaceecfca714a6c28848b513c412ca76b8e57`
- Current `origin/main` observed during the re-audit:
  `9a16ea0f209962f945e90ac9330c69fdb0249830`
- Originally audited executable head:
  `5f74202033bf8ab10a48b8cf18ede18137e73bd1`
- Originally audited implementer handoff head:
  `11dfaaf3118b332b37f8cd7c31957cd240718220`
- First independent findings head:
  `527a76e4c72dfe8d65675812f4be84f3358a767c`
- First remediation executable head:
  `57d999ae86852b44095d993369d25a117086d912`
- First remediation handoff head:
  `3ad263aacc9b5d1d392a9b2b0b4d03062004d320`
- Second independent findings head:
  `dae005c759e4abc4919e23d7feb5b9e54973f7a0`
- Tested second-remediation executable head:
  `bb27ddfcaeffe14758d669ca72b3f4a9a06e35ed`
- Documentation/current head: the later Markdown-only commit containing this
  file. A Git commit cannot embed its own SHA without changing that SHA, so the
  exact immutable documentation SHA and its terminal CI run/job are recorded
  in the top-level PR comment and final implementer response after this file is
  committed and CI completes.

`origin/main` was not merged, rebased, reset, or otherwise introduced. The
merge base remains the immutable original base.

## Complete branch chronology

Each row is `commit | parent | subject`.

```text
c8a669e5123410fa0c16c455da9c233092c07a31 | 153eaceecfca714a6c28848b513c412ca76b8e57 | feat(ti-v3): add GA0-B1 analytical read model
5f74202033bf8ab10a48b8cf18ede18137e73bd1 | c8a669e5123410fa0c16c455da9c233092c07a31 | fix(ti-v3): correct GA0-B1 type boundaries
11dfaaf3118b332b37f8cd7c31957cd240718220 | 5f74202033bf8ab10a48b8cf18ede18137e73bd1 | docs(ti-v3): hand off GA0-B1 for audit
527a76e4c72dfe8d65675812f4be84f3358a767c | 11dfaaf3118b332b37f8cd7c31957cd240718220 | docs(ti-v3): record independent GA0-B1 audit findings
57d999ae86852b44095d993369d25a117086d912 | 527a76e4c72dfe8d65675812f4be84f3358a767c | remediate GA0-B1 independent audit findings
3ad263aacc9b5d1d392a9b2b0b4d03062004d320 | 57d999ae86852b44095d993369d25a117086d912 | docs(ti-v3): hand off GA0-B1 audit remediation
dae005c759e4abc4919e23d7feb5b9e54973f7a0 | 3ad263aacc9b5d1d392a9b2b0b4d03062004d320 | Record GA0-B1 independent re-audit findings
bb27ddfcaeffe14758d669ca72b3f4a9a06e35ed | dae005c759e4abc4919e23d7feb5b9e54973f7a0 | fix(ti-v3): complete GA0-B1 second audit remediation
```

The documentation commit is a single child of the tested executable head and
contains only this handoff.

## Complete second-remediation file inventory

Executable checkpoint `dae005c...bb27ddfc` changed 17 files:

```text
M src/docs/codex-project-log.md
M src/docs/trader-intelligence-v3-adr-ga0-b1-independent-audit-remediation-v1.md
M src/lib/trader-intelligence-v3/__tests__/ga0-b1/analytical-dataset.test.ts
M src/lib/trader-intelligence-v3/__tests__/ga0-b1/proof-contracts.test.ts
M src/lib/trader-intelligence-v3/analytics/adapters/session-policy.ts
M src/lib/trader-intelligence-v3/analytics/adapters/snapshot-read-model.ts
M src/lib/trader-intelligence-v3/analytics/contracts/evidence-diagnostics.ts
M src/lib/trader-intelligence-v3/analytics/contracts/run-context.ts
M src/lib/trader-intelligence-v3/analytics/contracts/run-receipt.ts
M src/lib/trader-intelligence-v3/analytics/contracts/table-claim-series.ts
M src/lib/trader-intelligence-v3/analytics/dataset/analytical-dataset.ts
A src/lib/trader-intelligence-v3/analytics/dataset/analytical-partition.ts
M src/lib/trader-intelligence-v3/analytics/dataset/index.ts
M src/lib/trader-intelligence-v3/analytics/registry/tool-registry-contract.ts
M src/lib/trader-intelligence-v3/domain/accounting/starting-inventory.ts
M src/lib/trader-intelligence-v3/domain/identity/content-digest.ts
M src/lib/trader-intelligence-v3/domain/query/canonical-filter.ts
```

The later documentation checkpoint adds only:

```text
A src/docs/trader-intelligence-v3-ga0-b1-second-remediation-and-independent-reaudit-handoff-2026-07-23.md
```

## Finding-to-implementation map

### B1-REAUD-R1 — analytical dataset derivation authority

Production files:

- `analytics/adapters/snapshot-read-model.ts`
- `analytics/contracts/run-context.ts`
- `analytics/dataset/analytical-dataset.ts`
- `domain/identity/content-digest.ts`

Tests:

- `ga0-b1/analytical-dataset.test.ts`
- `ga0-b1/proof-contracts.test.ts`

Result: runtime derivation now emits a content-addressed derivation receipt and
retains its exact verified authority bundle. Persisted/untrusted receipts
re-enter only by replaying the snapshot read-model from that bundle and
requiring byte-for-byte canonical receipt identity. Run-context construction
requires that verified derivation authority and compares snapshot, manifest,
filter, correction/cutoff, eligibility, retrospective policy, evidence
namespace, inventories, adapter, derivation policy, rows, exclusions, counts,
limitations, and dataset digest.

Focused forgery tests cover recomputed row/receipt digests after changing P/L,
quantity, time/session/sequence, evidence, policies, namespaces, inventories,
adapter identity, and derivation identity. Genuine persisted replay is
accepted. Persistence IDs and caller ordering remain outside identity.

Limitation: this is a GA0-B1 replay contract, not a general tool runner or
database persistence API.

### B1-REAUD-R2 — one-currency analytical partition

Production files:

- `analytics/dataset/analytical-partition.ts`
- `analytics/dataset/index.ts`
- `analytics/contracts/run-context.ts`
- `analytics/contracts/table-claim-series.ts`
- `analytics/contracts/evidence-diagnostics.ts`
- `analytics/contracts/run-receipt.ts`

Tests:

- `ga0-b1/analytical-dataset.test.ts`
- `ga0-b1/proof-contracts.test.ts`

Result: `AnalyticalPartitionReceipt` binds the dataset, snapshot, filter,
currency, account scope, exact included/excluded keys, counts, limitations,
and partition digest. Run context and every financial proof artifact retain
that partition identity. Evidence keys must belong to the same partition.
Table counts and limitations are partition-derived. Separate USD and CAD
partitions are accepted; cross-currency financial evidence and combined
financial receipts reject.

Limitation: no FX policy and no cross-currency financial aggregation were
introduced.

### B1-REAUD-R3 — exact ratio claim effects

Production file:

- `analytics/contracts/table-claim-series.ts`

Test:

- `ga0-b1/proof-contracts.test.ts`

Result: direction is derived from exact integer arithmetic for decimals and
reduced ratios. Ratio-minus-ratio and decimal/ratio mixed subtraction promote
both operands to exact fractions, cross-multiply with `bigint`, and reduce by
GCD. Decimal-minus-decimal preserves the existing exact decimal result.
Nonterminating differences remain reduced ratios. Metric key, unit, currency,
unavailability, evidence, and digest remain bound. Incompatible units or
currencies reject.

No `Number`, `parseFloat`, `parseInt`, unary-plus, `toNumber`, or `Math`
rounding authority entered this path.

Limitation: no B2 sample threshold, confidence policy, or analytical
conclusion was added.

### B1-REAUD-R4 — registry-governed output graph

Production files:

- `analytics/registry/tool-registry-contract.ts`
- `analytics/contracts/run-receipt.ts`

Test:

- `ga0-b1/proof-contracts.test.ts`

Result: the registry declares allowed/required output contracts and a blocked
artifact policy. Completed/limited receipts require every declared class and
reject empty, missing, undeclared, duplicate, unused, foreign, or mixed-run
artifacts. Blocked receipts require a blocking diagnostic and enforce the
registry prohibition on contradictory proof artifacts. Diagnostic
`affectedKey` values must resolve within the accepted graph namespace or be
explicitly non-reference diagnostics. The graph remains dependencies → run
context → artifacts → final receipt.

Limitation: the implementation is the B1 contract graph; execution orchestration
is deferred.

### B1-REAUD-R5 — complete exclusion reason ledger

Production files:

- `analytics/dataset/analytical-dataset.ts`
- `analytics/adapters/snapshot-read-model.ts`
- `analytics/contracts/evidence-diagnostics.ts`

Tests:

- `ga0-b1/analytical-dataset.test.ts`
- `ga0-b1/proof-contracts.test.ts`

Result: every semantic exclusion has one deterministic primary reason plus
sorted secondary analytical reasons, original source reasons, source
authority, mapping policy key/version, related evidence, and limitations.
Aggregation is order-independent and identical duplicate provenance is
deduplicated. Manifest provenance survives collisions with filter,
open-position, or reconstruction exclusions. The complete ledger participates
in exclusion identity and excluded evidence; primary counts still sum to the
excluded count.

The reason ledger is versioned by
`ti_v3_analytical_exclusion_reason_ledger` / `v1`. Its deterministic primary
precedence is blocked reconstruction, ambiguous reconstruction, eligibility
blocked/pending/stale/incompatible, open lifecycle, filter exclusion, then
manifest exclusion, with canonical code ordering as the stable final
tie-break. Manifest source provenance remains in the ledger even when a
higher-precedence derived reason is primary.

Limitation: one semantic candidate still has one final analytical outcome; the
ledger preserves the other accepted evidence rather than creating duplicate
outcomes.

### B1-REAUD-R6 — accepted calendar authority

Production files:

- `analytics/adapters/session-policy.ts`
- `analytics/adapters/snapshot-read-model.ts`
- `domain/query/canonical-filter.ts`

Test:

- `ga0-b1/analytical-dataset.test.ts`

Result: GA0-B1 binds the allowlisted New York exchange calendar key/version
`ti_v3_nyse_calendar` / `v1` to the derivation policy, filter/date receipt, and
dataset. Unknown keys/versions fail closed. Saturday/Sunday `regular` and
`early_close` evidence reject. The 2007 lower bound uses the resolved New York
local year. Accepted weekday regular and early-close boundaries continue to
come from evidence. Holiday/missing evidence fail closed; UTC mode remains
`not_applicable`; deterministic rollover and DST behavior are preserved.

Limitation: exceptional weekend exchange sessions require a future explicit
policy and are intentionally unsupported.

### B1-REAUD-R7 — strict starting-inventory re-entry

Production files:

- `domain/accounting/starting-inventory.ts`
- `analytics/adapters/snapshot-read-model.ts`

Test:

- `ga0-b1/analytical-dataset.test.ts`

Result: root, ledger identity, every prior lot, charge, and locator cross the
accepted descriptor-first exact-record boundary. Unknown/hidden/symbol fields,
accessors, invalid prototypes, sparse arrays, cycles, hostile Proxy behavior,
and resource-bound violations reject without source-value logging. Accepted
content is rebuilt into protected canonical data before hashing. Valid
null-prototype persisted data reconstructs the same digest. The adapter catches
unexpected verification exceptions and returns
`ti_v3_analytics_authority_unverified`.

Limitation: failure remains deliberately coarse at the public starting-
inventory boundary to avoid leaking malformed source structure.

## Local verification ledger for executable head `bb27ddfc`

All commands used synthetic repository fixtures only.

### Focused GA0-B1

```powershell
node .\node_modules\vitest\vitest.mjs run src/lib/trader-intelligence-v3/__tests__/ga0-b1/analytical-dataset.test.ts --reporter=verbose --pool=vmThreads --maxWorkers=1 --fileParallelism=false
```

Result: exit `0`; 1 file, 13/13 tests passed; 107.56 seconds.

```powershell
node .\node_modules\vitest\vitest.mjs run src/lib/trader-intelligence-v3/__tests__/ga0-b1/proof-contracts.test.ts --reporter=verbose --pool=vmThreads --maxWorkers=1 --fileParallelism=false
```

Final result: exit `0`; 1 file, 17/17 tests passed; 136.11 seconds.
The first run was 16/17 because a new fixture omitted `partition`; the second
run exposed two wrongly placed expected-count edits. Those test-only mistakes
were corrected before the final green run.

### Complete direct starting-inventory cluster

Files:

- `ga0-a2-fifo-ledger.test.ts`
- `ga0-a2-fifo-differential.test.ts`
- `ga0-a2-property-based.test.ts`
- `ga0-b1/analytical-dataset.test.ts`

Result: exit `0`; 4 files, 83/83 tests passed; 395.54 seconds.

### Private-data Git-history unit

Target:

```text
src/lib/trader-intelligence-v3/__tests__/private-data-guard.test.ts
finds a private-looking blob committed and deleted later in PR history
```

Result: exit `1`; 1 failed, 6 skipped. The test body took 18.722 seconds and
exceeded its unchanged hard-coded 15-second timeout; the command took 95.76
seconds. The timeout was not raised, hidden, or described as a pass.

### Consolidated final focused verifier

The verifier contained all 13 `ga0-a2-*.test.ts` files, all four GA0-A3 files,
both GA0-B1 files, `architecture-boundaries.test.ts`, and
`private-data-guard.test.ts`.

Result: exit `1`; 18/21 files passed and 373/378 tests passed in 474.94
seconds. The five failures were:

- the known private Git-history 15-second timeout;
- two SQLite tests unable to load `better_sqlite3.node` from the default
  linked dependency tree;
- two GA0-A3 backup-parser tests with the same native-binding problem.

The two affected SQLite files were then run unchanged against the compatible
local dependency tree and passed 2 files, 14/14 tests in 98.04 seconds. The
default dependency junction was restored afterward.

### Repository GA0-A2 exact-truth aggregate

```powershell
$env:VITEST_MAX_WORKERS='1'
npm run verify:ti-v3:ga0-a2
```

Terminal result: exit `1`; 13/14 files and 306/308 tests passed in 1056.42
seconds. The two failures were solely the same missing local
`better_sqlite3.node` binding in the SQLite text-round-trip file. Those exact
tests passed 2/2 in the compatible-tree isolated retry. Because the script uses
`&&`, its chained architecture/private-data steps did not run; they were run
separately below. This local aggregate is non-green and is not represented as
a pass.

### TypeScript and ESLint

```powershell
npx tsc --noEmit --pretty false
```

Final result: exit `0`; no diagnostics. The first near-final attempt reported
four diagnostics (one branded timestamp fixture, one `not_applicable`
narrowing, and two analytical-row typing issues). They were corrected before
the single final pass.

ESLint was run over every changed TypeScript path (15 files). Final result:
exit `0`; no errors and no warnings. An earlier clean-exit run reported four
unused-symbol warnings; those were removed before the final run.

### Architecture, private-data, diff, and build

```powershell
npm run verify:ti-v3:architecture
```

Result: exit `0`;
`{"ok":true,"scannedArchitectureFileCount":420,"scannedApiRouteCount":43,"classifiedTraderIntelligenceRouteCount":82}`.

```powershell
npm run verify:ti-v3:private-data
```

Result: exit `0`;
`{"ok":true,"scannedRecordCount":23722,"scannedFinalTreeRecordCount":23668,"scannedPrHistoryBlobCount":54}`.
The first invocation was interrupted while running and produced no result. A
process check found no orphan. The clean restart above passed.

`git diff --check` and `git diff --cached --check` both passed.

`npm run build` was not run because no route, page, browser, dependency,
Next.js/build configuration, or other build-facing code changed.

### Deliberately unrun commands

- `npm ci`: package manifests and lockfiles did not change.
- full local `npm test`: no focused result established a broad-regression
  reason, and GitHub CI independently ran the full repository tests.
- Playwright: no browser-facing code changed.
- `npm run build`: no build-facing code changed.

## Executable-head GitHub CI

- Head: `bb27ddfcaeffe14758d669ca72b3f4a9a06e35ed`
- Run: `30048702298`
- Job: `89345746261` (`test-and-verify`)
- Conclusion: `success`
- Successful steps: clean checkout, dependency installation, full tests,
  GA0-A2 exact truth, architecture, private-data, Layer 2, and Layer 3.

The exact documentation-head CI run/job and conclusion are recorded in the
top-level PR comment after the later Markdown-only commit reaches terminal CI.
No heavy suite is repeated solely for the handoff.

## Known limitations and deferred work

- The local private Git-history unit exceeds its fixed 15-second timeout on the
  constrained workstation; current-head clean CI passed private-data safety.
- The default local linked dependency tree lacks the native
  `better_sqlite3.node` binary used by four consolidated-test cases and two
  GA0-A2 aggregate cases. Unchanged isolated retries passed with a compatible
  dependency tree, and clean current-head CI passed.
- Runtime WeakMap associations are only a fast path. Persisted artifacts must
  and do re-enter through deterministic derivation replay.
- No cross-currency financial aggregate or FX policy exists.
- The accepted calendar intentionally excludes weekend sessions.
- No executable analysis tool or general runner exists in B1.

No GA0-B2, weekday tool, daily-stop simulation, AI/model, prompt, embedding,
natural-language query, React/UI, route, chart-rendering, market-data, VWAP,
setup/catalyst, support/resistance, coaching, reflection, Real Coach/Whop,
Academy, migration, hosted-user, database-write, or deployment work entered
this remediation.

PR #133 must remain draft, open, unmerged, and undeployed. All independent
review threads must remain unresolved.

## Exact independent re-audit commands

Run in a clean independent checkout. Do not trust implementer runtime brands,
working-tree state, or dependency junctions.

```powershell
git fetch origin --prune
git checkout agent/trader-intelligence-v3-ga0-b1-read-model
git status --short
git rev-parse HEAD
git rev-parse origin/main
git merge-base HEAD origin/main
git log --reverse --format='%H|%P|%s' 153eaceecfca714a6c28848b513c412ca76b8e57..HEAD
git diff --stat 153eaceecfca714a6c28848b513c412ca76b8e57...HEAD
git diff 153eaceecfca714a6c28848b513c412ca76b8e57...HEAD
git diff --stat dae005c759e4abc4919e23d7feb5b9e54973f7a0...bb27ddfcaeffe14758d669ca72b3f4a9a06e35ed
git diff dae005c759e4abc4919e23d7feb5b9e54973f7a0...bb27ddfcaeffe14758d669ca72b3f4a9a06e35ed
git diff --check dae005c759e4abc4919e23d7feb5b9e54973f7a0...HEAD
npm ci
npx tsc --noEmit --pretty false
npx eslint src/lib/trader-intelligence-v3/__tests__/ga0-b1/analytical-dataset.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-b1/proof-contracts.test.ts src/lib/trader-intelligence-v3/analytics/adapters/session-policy.ts src/lib/trader-intelligence-v3/analytics/adapters/snapshot-read-model.ts src/lib/trader-intelligence-v3/analytics/contracts/evidence-diagnostics.ts src/lib/trader-intelligence-v3/analytics/contracts/run-context.ts src/lib/trader-intelligence-v3/analytics/contracts/run-receipt.ts src/lib/trader-intelligence-v3/analytics/contracts/table-claim-series.ts src/lib/trader-intelligence-v3/analytics/dataset/analytical-dataset.ts src/lib/trader-intelligence-v3/analytics/dataset/analytical-partition.ts src/lib/trader-intelligence-v3/analytics/dataset/index.ts src/lib/trader-intelligence-v3/analytics/registry/tool-registry-contract.ts src/lib/trader-intelligence-v3/domain/accounting/starting-inventory.ts src/lib/trader-intelligence-v3/domain/identity/content-digest.ts src/lib/trader-intelligence-v3/domain/query/canonical-filter.ts
node .\node_modules\vitest\vitest.mjs run src/lib/trader-intelligence-v3/__tests__/ga0-b1/analytical-dataset.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-b1/proof-contracts.test.ts --reporter=verbose --pool=vmThreads --maxWorkers=1 --fileParallelism=false
node .\node_modules\vitest\vitest.mjs run src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-ledger.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-differential.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-property-based.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-b1/analytical-dataset.test.ts --reporter=verbose --pool=vmThreads --maxWorkers=1 --fileParallelism=false
node .\node_modules\vitest\vitest.mjs run src/lib/trader-intelligence-v3/__tests__/private-data-guard.test.ts -t "finds a private-looking blob committed and deleted later in PR history" --reporter=verbose --pool=vmThreads --maxWorkers=1 --fileParallelism=false
npm run verify:ti-v3:ga0-a2
npm run verify:ti-v3:architecture
npm run verify:ti-v3:private-data
gh pr view 133 --repo traderslink-bot/traderslink-trader-improvement-system --json number,url,state,isDraft,headRefName,headRefOid,baseRefName,mergedAt
gh run list --repo traderslink-bot/traderslink-trader-improvement-system --branch agent/trader-intelligence-v3-ga0-b1-read-model --event pull_request --limit 10
```

Then run the complete 21-file focused verifier using all 13
`ga0-a2-*.test.ts` files, all four files under `__tests__/ga0-a3`, both files
under `__tests__/ga0-b1`, `architecture-boundaries.test.ts`, and
`private-data-guard.test.ts`, with one worker and no file parallelism.

## Ready-to-paste independent re-auditor prompt

```text
Act as the independent re-auditor for Trader Intelligence v3 GA0-B1 only.

Repository:
traderslink-bot/traderslink-trader-improvement-system

Existing branch:
agent/trader-intelligence-v3-ga0-b1-read-model

Existing draft PR:
https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/133

Immutable original base and merge base:
153eaceecfca714a6c28848b513c412ca76b8e57

Originally audited executable head:
5f74202033bf8ab10a48b8cf18ede18137e73bd1

Originally audited handoff head:
11dfaaf3118b332b37f8cd7c31957cd240718220

First findings head:
527a76e4c72dfe8d65675812f4be84f3358a767c

First remediation executable head:
57d999ae86852b44095d993369d25a117086d912

First remediation handoff head:
3ad263aacc9b5d1d392a9b2b0b4d03062004d320

Second findings head:
dae005c759e4abc4919e23d7feb5b9e54973f7a0

Second-remediation tested executable head:
bb27ddfcaeffe14758d669ca72b3f4a9a06e35ed

The exact later documentation/current head is the branch head containing:
src/docs/trader-intelligence-v3-ga0-b1-second-remediation-and-independent-reaudit-handoff-2026-07-23.md
Confirm it independently from the remote branch and top-level PR comment.

Independently re-audit mandatory findings B1-REAUD-R1 through B1-REAUD-R7 from:
src/docs/trader-intelligence-v3-ga0-b1-independent-reaudit-findings-2026-07-23.md

Do not treat the implementation handoff, PR comment, prior local tests, runtime
WeakMap branding, or passing CI as proof.

First confirm the branch, clean state, PR draft/open/unmerged state, immutable
merge base, complete commit chronology, current origin/main, and every
unresolved original and new review thread. Inspect the full base-to-head diff
and the exact second-findings-to-executable diff.

Re-prove:
1. Dataset derivation cannot be forged by rebuilding self-consistent rows and
   receipts, and genuine persisted/untrusted artifacts re-enter only through
   complete deterministic replay of exact snapshot dependencies.
2. Tables, evidence, claims, series, diagnostics, and final receipts retain one
   exact currency partition; cross-currency financial evidence fails closed.
3. Ratio signs and decimal/ratio differences use exact reduced arithmetic with
   no JavaScript-number authority.
4. Registry output contracts are executable graph constraints for completed,
   limited, and blocked runs; empty, missing, undeclared, duplicate, unused,
   foreign, contradictory, and mixed-run artifacts reject.
5. Exclusion aggregation is order-independent and preserves every analytical
   and source reason plus authority and mapping-policy provenance while keeping
   one primary outcome and exact primary counts.
6. Only the allowlisted NYSE calendar key/version is accepted; weekend regular
   and early-close evidence rejects; the 2007 lower bound uses New York local
   year; UTC/holiday/early-close/DST behavior remains correct.
7. Starting-inventory root and every nested record use descriptor-first exact
   validation; hostile getters, proxies, symbols, hidden state, prototypes,
   sparse arrays, cycles, and limits fail stably without raw exceptions or
   source leakage.

Preserve accepted A2/A3 authority, exact decimal behavior, canonical identity,
correction/manifest/eligibility/snapshot/filter/evidence binding, safe-copy and
deep immutability, no persistence IDs in analytical identity, no FX
aggregation, and the acyclic proof graph.

Use synthetic data only. Run npm ci in the clean independent checkout, final
TypeScript with --pretty false, ESLint across all changed TypeScript files, the
two GA0-B1 focused files, the complete direct starting-inventory cluster, the
exact private-data Git-history unit case without raising its timeout, the
complete 21-file focused verifier, verify:ti-v3:ga0-a2, architecture, and
private-data. Inspect current-head GitHub CI separately. Record every terminal
exit, file count, test count, elapsed time, correction, timeout, interruption,
or unrun command honestly.

Do not create a branch or PR. Do not modify implementation code. Do not reply
to or resolve review threads. Do not mark PR #133 ready, merge, deploy, or
begin GA0-B2. Do not implement a weekday tool, daily-stop simulation, general
runner, AI, UI, chart, market-data, support/resistance, Academy, migration, or
hosted-user work.

Deliver a fresh independent verdict for each B1-REAUD-R1 through R7 and an
overall verdict. If defects remain, add a new findings document and top-level
PR comment without resolving any existing thread. Otherwise state the exact
evidence supporting acceptance and stop at the draft PR boundary.
```
