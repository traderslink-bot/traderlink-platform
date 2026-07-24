# Trader Intelligence v3 GA0-B1 Read Model Implementation and Audit Handoff

> **IMPLEMENTER-SUPPLIED EVIDENCE ONLY — NOT INDEPENDENT PROOF.** Every claim in this handoff must be re-established by an independent auditor from the repository, immutable commits, draft PR, review state, and CI evidence. Do not accept this document as its own proof.

## Identity and status

- Repository: `traderslink-bot/traderslink-trader-improvement-system`
- Local implementation worktree: `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v3-ga0-b1-read-model`
- Branch: `agent/trader-intelligence-v3-ga0-b1-read-model`
- Draft PR: [#133](https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/133)
- Base branch: `main`
- Base identity at branch creation: `153eaceecfca714a6c28848b513c412ca76b8e57`
- Merge base of the tested executable head and `origin/main`: `153eaceecfca714a6c28848b513c412ca76b8e57`
- Tested executable head: `5f74202033bf8ab10a48b8cf18ede18137e73bd1`
- Documentation-only/current PR head: the single documentation-only commit containing this file, directly parented by `5f74202033bf8ab10a48b8cf18ede18137e73bd1`. A Git commit cannot embed its own content-addressed SHA. Per the no-loop rule, the exact resulting SHA and its later CI run are reported in the owner-facing completion response and can be discovered independently with `git rev-parse origin/agent/trader-intelligence-v3-ga0-b1-read-model`.
- PR state when this handoff was written: draft and unmerged.
- Deployment state: none.

The branch was created only after confirming that merged PRs #102, #104, #106, and #107 resolve to commits already reachable from `origin/main`. No prior B1 branch or PR existed.

## Commit chronology

1. `153eaceecfca714a6c28848b513c412ca76b8e57` — branch base and merge base (`origin/main` at preflight).
2. `c8a669e5123410fa0c16c455da9c233092c07a31` — `feat(ti-v3): add GA0-B1 analytical read model`.
3. `5f74202033bf8ab10a48b8cf18ede18137e73bd1` — `fix(ti-v3): correct GA0-B1 type boundaries`; this is the exact executable head used for the final local checkpoint and executable-head CI.
4. Documentation-only handoff commit — contains only this Markdown file, is directly parented by the tested executable head, and is the current PR head after the final push. Its exact SHA is intentionally reported outside its own content.

## Complete changed-file inventory

Executable head, relative to `origin/main`:

- `src/docs/trader-intelligence-v3-adr-ga0-b1-artifact-identity-dag-and-proof-contracts-v1.md`
- `src/docs/trader-intelligence-v3-adr-ga0-b1-snapshot-read-model-and-exact-metrics-v1.md`
- `src/lib/trader-intelligence-v3/__tests__/architecture-boundary-guard.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-b1/analytical-dataset.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-b1/proof-contracts.test.ts`
- `src/lib/trader-intelligence-v3/analytics/adapters/index.ts`
- `src/lib/trader-intelligence-v3/analytics/adapters/local-current-data-bridge.ts`
- `src/lib/trader-intelligence-v3/analytics/adapters/session-policy.ts`
- `src/lib/trader-intelligence-v3/analytics/adapters/snapshot-read-model.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/contract-validation.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/evidence-diagnostics.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/exact-metric.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/index.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/run-context.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/table-claim-series.ts`
- `src/lib/trader-intelligence-v3/analytics/dataset/analytical-dataset.ts`
- `src/lib/trader-intelligence-v3/analytics/dataset/analytical-row.ts`
- `src/lib/trader-intelligence-v3/analytics/dataset/index.ts`
- `src/lib/trader-intelligence-v3/analytics/index.ts`
- `src/lib/trader-intelligence-v3/analytics/registry/index.ts`
- `src/lib/trader-intelligence-v3/analytics/registry/tool-registry-contract.ts`
- `src/lib/trader-intelligence-v3/domain/foundation/runtime-validation.ts`
- `src/lib/trader-intelligence-v3/domain/identity/content-digest.ts`
- `src/lib/trader-intelligence-v3/testing/architecture-boundary-guard.ts`
- `src/lib/trader-intelligence-v3/testing/ga0-b/index.ts`
- `src/lib/trader-intelligence-v3/testing/ga0-b/synthetic-read-model-authority.ts`
- `src/lib/trader-intelligence-v3/testing/index.ts`

Documentation-only head adds:

- `src/docs/trader-intelligence-v3-ga0-b1-read-model-implementation-and-audit-handoff-2026-07-19.md`

Executable diff size: 27 files, 4,014 insertions, and 6 deletions.

## Requirement-to-code-and-test mapping

| Requirement | Primary implementation | Focused proof |
| --- | --- | --- |
| Read-only adapter over accepted A2/A3 authority | `analytics/adapters/snapshot-read-model.ts`, `local-current-data-bridge.ts` | `ga0-b1/analytical-dataset.test.ts` |
| Explicit deterministic session/date policy | `analytics/adapters/session-policy.ts` | `ga0-b1/analytical-dataset.test.ts` |
| Exact analytical row semantics | `analytics/dataset/analytical-row.ts` | `ga0-b1/analytical-dataset.test.ts` |
| Every candidate included or excluded exactly once with stable reason counts | `analytics/dataset/analytical-dataset.ts` | `ga0-b1/analytical-dataset.test.ts` |
| Exact, unit-bearing, currency-aware metric values | `analytics/contracts/exact-metric.ts` | `ga0-b1/proof-contracts.test.ts` |
| Snapshot/filter/dataset/argument-bound run context and receipt | `analytics/contracts/run-context.ts` | `ga0-b1/proof-contracts.test.ts` |
| Evidence bundles and diagnostics | `analytics/contracts/evidence-diagnostics.ts` | `ga0-b1/proof-contracts.test.ts` |
| Exact tables, claims, and chart-ready data-only series | `analytics/contracts/table-claim-series.ts` | `ga0-b1/proof-contracts.test.ts` |
| Contract-only registry with no runner or conclusion threshold | `analytics/registry/tool-registry-contract.ts` | `ga0-b1/proof-contracts.test.ts` |
| Re-entry validation, deep immutability, bounded collections, and unknown-field rejection | `analytics/contracts/contract-validation.ts` and all builders/verifiers | both B1 test files |
| Acyclic content identity domains | `domain/identity/content-digest.ts`, both B1 ADRs | `ga0-b1/proof-contracts.test.ts` |
| No forbidden B1 dependencies or executable later-slice behavior | `testing/architecture-boundary-guard.ts` | `architecture-boundary-guard.test.ts` and architecture script |
| Production-shaped synthetic authority without owner-data migration | `testing/ga0-b/synthetic-read-model-authority.ts` | `ga0-b1/analytical-dataset.test.ts` |

## Source-adapter selection and truthfulness

The selected adapter is an explicit, read-only exact-authority port. Its input must contain the accepted A2/A3 `AnalysisSnapshot`, exact snapshot dependencies, correction replay inputs, accepted canonical execution catalog, relationship-resolution inputs, starting inventory, accepted exact reconstruction, and B1 row/session policy.

Before deriving data, the adapter:

1. validates the supplied snapshot and dependencies;
2. rebuilds the snapshot from trusted dependencies;
3. recomputes and cross-checks manifest, filter, eligibility, enrichment, and evidence identities;
4. replays corrections;
5. rebuilds execution relationship resolution;
6. reruns accepted reconstruction;
7. rebuilds evidence inventories; and
8. rejects any digest, accepted-execution-set, or authority mismatch at dataset level.

The local current-data bridge exposes only `readCurrentExactAuthority`. It has no database, repository, migration, write, or legacy-number path. When no exact v3 authority provider is supplied, it fails closed with `ti_v3_current_data_exact_v3_authority_unavailable`. This is truthful because the existing saved legacy model does not contain the complete exact A2/A3 authority needed to prove a B1 dataset. The synthetic fixture travels through the same adapter boundary; it is test authority, not owner data.

No persistence ID, legacy JavaScript number, guessed timestamp, guessed session, digest storage order, or direct database read is accepted as analytical authority.

## Architecture decisions and invariants

- One analytical row is one accepted closed flat-to-flat reconstructed round trip.
- Gross P/L, charges, net P/L, direction, exact quantity, and supporting execution identities are copied from accepted reconstruction; B1 never recalculates P/L.
- Supporting executions are resolved against the accepted catalog and economically ordered with the A2 ordering authority. Digest array order is not economic order.
- The first economically ordered entry determines entry time and deterministic display-symbol metadata; the final economically ordered exit determines close time. Stable instrument identity remains authoritative, and symbol changes are disclosed.
- The session policy supports only UTC/`UTC` and exchange-owner-local/`America/New_York`, with explicit Gregorian, U.S. DST, weekday, and session-boundary logic. Locale APIs are not authority.
- GA0-B1 supports `trade_close_date` with `calendar_day`. Unsupported date/calendar semantics and setup filters fail at dataset level rather than being ignored.
- Exact entry notional is exact weighted-average entry price multiplied by exact entry quantity and is emitted only when the reduced rational terminates within the accepted money bounds; otherwise it is a structured unavailable value.
- The candidate set is the union of reconstructed round trips, round-trip inventory keys, manifest open positions/exclusions, and reconstruction blocked states. Every candidate appears exactly once as included or excluded. Primary-reason counts sum to the exclusion count.
- Accepted filter fields are applied directly. Currencies are separate canonical partitions; there is no FX policy or cross-currency financial aggregation.
- Exact metrics are content-addressed, unit-bearing values. Currency is explicit or null. Financial JavaScript numbers and implicit display rounding are rejected as authority.
- All new untrusted/persisted validators safe-copy input, reject unknown or unsafe nested fields, recompute identities, enforce bounds, and deeply freeze canonical content.
- Chart-ready series contain exact selected table cells and require the exact table as an accessible alternative. B1 performs no rendering.
- Registry entries are fixed at `contract_only_no_runner`; sample/conclusion policy is `deferred_to_tool_slice`. No weekday or daily-stop tool implementation is present.

### Acyclic artifact identity

The accepted authority graph is:

```text
verified snapshot + canonical filter + analytical dataset + normalized arguments
  -> analysis run context
  -> exact metrics
  -> evidence bundles / exact tables / claims / chart-ready series / diagnostics
  -> final analysis run receipt
```

Artifacts reference the run-context digest, never the final receipt digest. The final receipt is built once after all artifacts exist and references their completed digests. Nothing is placeholder-hashed or mutated after hashing. Operational timing, transient job IDs, persistence IDs, localized display text, and wall-clock execution time are excluded from analytical identity.

## Local executable evidence

All final checkpoint results below apply to executable head `5f74202033bf8ab10a48b8cf18ede18137e73bd1`.

### Focused development tests

1. Adapter and dataset suite:

   ```powershell
   .\node_modules\.bin\vitest.cmd run src/lib/trader-intelligence-v3/__tests__/ga0-b1/analytical-dataset.test.ts --reporter=dot --pool=forks --maxWorkers=1
   ```

   Result: exit 0; 1 file passed; 9 tests passed; duration 37.24 seconds.

2. Proof-contract suite:

   ```powershell
   .\node_modules\.bin\vitest.cmd run src/lib/trader-intelligence-v3/__tests__/ga0-b1/proof-contracts.test.ts --reporter=dot --pool=vmThreads --maxWorkers=1
   ```

   Result: exit 0; 1 file passed; 12 tests passed; duration 91.82 seconds.

3. Architecture-boundary unit suite:

   ```powershell
   .\node_modules\.bin\vitest.cmd run src/lib/trader-intelligence-v3/__tests__/architecture-boundary-guard.test.ts --reporter=dot --pool=vmThreads --maxWorkers=1
   ```

   Result: exit 0; 1 file passed; 41 tests passed; duration 81.88 seconds.

### Consolidated final focused checkpoint

```powershell
.\node_modules\.bin\vitest.cmd run src/lib/trader-intelligence-v3/__tests__/ga0-b1 src/lib/trader-intelligence-v3/__tests__/architecture-boundary-guard.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-serialization-and-digest.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-exact-decimal.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-ordering.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-relationship-resolution.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-ledger.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a3/filter-validation.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts --reporter=dot --pool=vmThreads --maxWorkers=1
```

Result: exit 0; 10 files passed; 203 tests passed; duration 83.67 seconds. The 10,000-execution relationship-resolution case completed in 1,577 milliseconds with an observed RSS delta of 9,183,232 bytes, below its declared limits.

### Final TypeScript command

```powershell
npx tsc --noEmit --pretty false
```

Result: exit 0 with no diagnostics. This was the one final successful repository-wide TypeScript check on `5f74202033bf8ab10a48b8cf18ede18137e73bd1` after the B1 type-boundary correction. It was not rerun for this Markdown-only handoff.

### Changed-path ESLint

```powershell
$changed = @(git diff --name-only origin/main...HEAD -- '*.ts' '*.tsx'); if ($changed.Count -eq 0) { throw 'NO_CHANGED_TYPESCRIPT_FILES' }; .\node_modules\.bin\eslint.cmd $changed
```

Result: exit 0; 25 changed TypeScript/TSX files checked; no warnings or errors.

### Architecture and private-data guards

```powershell
npm run verify:ti-v3:architecture
```

Result: exit 0; `{"ok":true,"scannedArchitectureFileCount":418,"scannedApiRouteCount":43,"classifiedTraderIntelligenceRouteCount":82}`.

```powershell
npm run verify:ti-v3:private-data
```

Result: exit 0; `{"ok":true,"scannedRecordCount":23690,"scannedFinalTreeRecordCount":23661,"scannedPrHistoryBlobCount":29}`.

```powershell
git diff --check
```

Result: exit 0 on the clean executable head.

### Build decision

`npm run build` was deliberately not run. GA0-B1 changed only domain/analytics contracts, adapters, validators, tests, architecture guards, and ADRs. It changed no route, rendered component, browser surface, Next.js configuration, dependency manifest, or other build-facing integration point. TypeScript, focused tests, repository guards, and CI are the proportionate executable evidence.

## GitHub CI evidence, separate from local evidence

Executable head `5f74202033bf8ab10a48b8cf18ede18137e73bd1`:

- Workflow: `CI`
- Actions run: [29890629263](https://github.com/traderslink-bot/traderslink-trader-improvement-system/actions/runs/29890629263)
- Job: `test-and-verify`, ID `88830202020`
- Observed result before this handoff commit: success, duration 2 minutes 54 seconds.
- Passed steps: repository tests, GA0-A2 exact-truth verification, Trader Intelligence v3 architecture boundaries, private-data safety, Layer 2, and Layer 3.
- Non-failing annotation: GitHub reported that Node.js 20 actions were being forced onto Node.js 24 due runner deprecation.

The documentation-only head CI run cannot exist until this file is committed and pushed. Its exact run ID and observed state must be queried after that push and reported to the owner without amending this file solely to insert the result.

## Interrupted or failed commands and corrections

No incomplete, timed-out, killed, inherited, or unrun command is counted as a pass.

1. The initial clean `git worktree add` was interrupted while materializing files at approximately 32 percent. Only the newly created worktree was repaired with `git restore --source=HEAD --staged --worktree -- .`; the dirty owner checkout was not touched. Base, branch, and merge base were reverified afterward.
2. An initial isolated `npx vitest` attempt failed before tests because the fresh worktree had no `node_modules` and the isolated package could not resolve `vitest/config`. A dependency junction was added and subsequent commands used the repository binary explicitly.
3. Two combined Vitest attempts failed during worker startup under unrelated concurrent TraderLink Node/build load. No test executed in those attempts, so neither is a pass. The suites were run individually, then the final consolidated single-worker `vmThreads` command passed 10 files and 203 tests.
4. A repository-wide TypeScript attempt on `c8a669e5123410fa0c16c455da9c233092c07a31` failed. The first dependency junction pointed at a tree missing lockfile packages `fast-check` and `@neondatabase/serverless`, producing missing-module and cascading inherited diagnostics. It also exposed B1 test narrowing and literal-default validator inference errors, plus an inherited `live-watchlist-store.ts` void/null diagnostic. The B1 errors were corrected in `5f74202033bf8ab10a48b8cf18ede18137e73bd1`; the junction was changed to a lockfile-matching dependency tree containing Vitest 4.1.4, fast-check 4.9.0, and `@neondatabase/serverless` 1.1.0. The one final TypeScript command then passed with no diagnostics.
5. PowerShell `Remove-Item` against the dependency junction failed with a null-reference error before mutation. The exact absolute junction path and target were verified, the junction itself was deleted non-recursively with `[System.IO.Directory]::Delete(...)`, and the workspace contents/target were not recursively removed.

## Commands deliberately not run

- `npm ci`: `package.json` and `package-lock.json` are unchanged; the clean worktree used a verified lockfile-matching dependency junction. GitHub CI independently installed dependencies.
- Full local `npm test`: no broad-scope reason was introduced. The final local selection covered B1 and affected A2/A3 contracts; GitHub CI ran the repository test step plus Layer 2/Layer 3.
- `npm run build`: unnecessary for the non-route, non-rendering, non-config scope, as documented above.
- Playwright/browser tests: no browser-facing code or route changed.
- Production-data migration/backfill: prohibited and unnecessary; no exact legacy-to-v3 authority bridge exists in this slice.
- Deployment commands: prohibited for this local-only implementation/audit slice.

## Known limitations, deferred work, and scope confirmation

- Current owner data is unavailable through B1 unless a future authorized provider can supply the complete exact A2/A3 authority bundle. The existing legacy store is not silently converted. There is no exact legacy-to-v3 bridge, migration, or direct database adapter here.
- Only the documented UTC and `America/New_York` session policies and `trade_close_date`/`calendar_day` semantics are supported.
- Entry notional can be a structured unavailable fact when the exact product is non-terminating or outside accepted bounds.
- The candidate collection is bounded by the shared canonical-node budget; the current testable dataset limit is 64 rows/candidates.
- Setup filtering, FX conversion, cross-currency aggregation, conclusion thresholds, weekday analysis, daily-stop simulation, a tool runner, UI, chart rendering, AI narrative, and persistence are deferred to explicitly authorized later slices.
- Contract-only claims and registry fixtures prove shape and binding only; they are not real analytical conclusions.

Confirmed absent from this branch: out-of-scope AI, UI, chart rendering, market-data ingestion, support/resistance logic, migrations, hosted-user behavior, Academy work, deployment, GA0-B2, and every later slice. No PR was marked ready or merged. No independent review thread was resolved.

## Exact independent-audit commands

Run from a clean independent checkout. Do not reuse implementer dependency state or accept this handoff as proof.

```powershell
git fetch origin --prune
git switch --detach origin/agent/trader-intelligence-v3-ga0-b1-read-model
$currentHead = git rev-parse HEAD
$base = git rev-parse origin/main
$mergeBase = git merge-base HEAD origin/main
Write-Output "CURRENT_HEAD=$currentHead"
Write-Output "BASE=$base"
Write-Output "MERGE_BASE=$mergeBase"
git log --reverse --format='%H|%P|%s' origin/main..HEAD
git diff --name-status origin/main...HEAD
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- src/lib/trader-intelligence-v3 src/docs/trader-intelligence-v3-adr-ga0-b1-artifact-identity-dag-and-proof-contracts-v1.md src/docs/trader-intelligence-v3-adr-ga0-b1-snapshot-read-model-and-exact-metrics-v1.md src/docs/trader-intelligence-v3-ga0-b1-read-model-implementation-and-audit-handoff-2026-07-19.md
git diff --check origin/main...HEAD
gh pr view 133 --repo traderslink-bot/traderslink-trader-improvement-system --json number,url,state,isDraft,mergeStateStatus,baseRefName,headRefName,headRefOid,commits,reviews,statusCheckRollup
gh run list --repo traderslink-bot/traderslink-trader-improvement-system --branch agent/trader-intelligence-v3-ga0-b1-read-model --limit 20 --json databaseId,workflowName,status,conclusion,url,headSha,event,createdAt
npm ci
npx tsc --noEmit --pretty false
$changed = @(git diff --name-only origin/main...HEAD -- '*.ts' '*.tsx'); if ($changed.Count -eq 0) { throw 'NO_CHANGED_TYPESCRIPT_FILES' }; .\node_modules\.bin\eslint.cmd $changed
.\node_modules\.bin\vitest.cmd run src/lib/trader-intelligence-v3/__tests__/ga0-b1 src/lib/trader-intelligence-v3/__tests__/architecture-boundary-guard.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-serialization-and-digest.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-exact-decimal.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-ordering.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-relationship-resolution.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-ledger.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a3/filter-validation.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts --reporter=dot --pool=vmThreads --maxWorkers=1
npm run verify:ti-v3:exact-truth
npm run verify:ti-v3:architecture
npm run verify:ti-v3:private-data
```

The auditor must also inspect unresolved review threads through GitHub and must not treat current-head CI as interchangeable with the tested executable-head local evidence.

## Ready-to-paste independent-auditor prompt

```text
Act as the independent auditor for Trader Intelligence v3 GA0-B1 only.

Repository: traderslink-bot/traderslink-trader-improvement-system
Branch: agent/trader-intelligence-v3-ga0-b1-read-model
Draft PR: https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/133 (#133)
Base branch: main
Expected branch base and tested-head merge base: 153eaceecfca714a6c28848b513c412ca76b8e57
Tested executable head: 5f74202033bf8ab10a48b8cf18ede18137e73bd1
Expected current documentation head: discover origin/agent/trader-intelligence-v3-ga0-b1-read-model independently; it must be exactly one documentation-only commit directly after the tested executable head and contain only the required handoff Markdown file.
Required handoff: src/docs/trader-intelligence-v3-ga0-b1-read-model-implementation-and-audit-handoff-2026-07-19.md

This is an independent audit, not an implementation continuation. Keep the PR draft and unmerged while auditing. Never deploy and never begin GA0-B2.

First read the repository AGENTS.md and all controlling Trader Intelligence v3 roadmap, behavior-audit, pattern-catalog, architecture, exact-truth, GA0-A2, GA0-A3, and GA0-B planning/ADR documents referenced by the implementation and handoff. Read the B1 handoff, but treat every statement in it as implementer-supplied evidence rather than proof.

Independently fetch the repository and verify the remote, branch, PR number/URL/state, base branch, immutable base identity, merge base, exact tested executable head, and exact current documentation head. Verify that the documentation head is a single docs-only descendant of the tested executable head. Inspect the complete origin/main...current-head diff, full commit chronology and parents, diff statistics, and every changed file. Inspect every changed runtime, contract, adapter, validator, identity-domain, registry, architecture-guard, synthetic-authority, test, ADR, and handoff file; do not sample.

Verify that the read-only bridge actually consumes accepted GA0-A2/A3 authority and independently rebuilds and cross-binds the snapshot, dependencies, correction replay, accepted execution catalog, relationship resolution, reconstruction, evidence inventories, manifest, eligibility, enrichment, and filter identities before any row is derived. Verify it fails closed without a complete exact provider. Prove that no legacy JavaScript number, persistence/database ID, guessed timestamp, guessed session, guessed ordering, digest storage order, direct database implementation, migration, or legacy saved-data conversion became v3 analytical authority.

Verify exact row and dataset semantics: accepted closed flat-to-flat round trips only; copied reconstruction P/L and quantity; economic execution ordering; deterministic display-symbol metadata without replacing stable instrument identity; explicit UTC and America/New_York session/date policy; exact terminating entry-notional behavior; one outcome per candidate; visible exclusions; reason counts; accepted-filter application; dataset-level failure for unsupported semantics; and strict currency partitions with no cross-currency aggregation.

Verify snapshot/dependency/evidence/filter/currency binding across every contract. Verify exact unit-bearing values, currency behavior, unavailable facts, exclusion accounting, content identities, digest re-entry checks, unknown-field rejection, bounded collections, safe-copy behavior, deep immutability, and rejection of mutated or malformed untrusted input.

Verify the artifact graph is acyclic: verified snapshot/filter/dataset/normalized arguments -> run context -> exact metrics and artifacts -> final receipt. Artifacts may bind to the run context but must never depend on the final receipt digest; there must be no placeholder hash, post-hash mutation, self-reference, operational timing, transient ID, persistence ID, or localized display string in analytical identity.

Verify exact tables, evidence bundles, claims, chart-ready data-only series, diagnostics, receipts, and the contract-only registry. Ensure series only select verified exact table cells and retain an accessible exact-table alternative. Ensure B1 contains no executable runner, weekday tool, daily-stop tool, sample threshold, real conclusion policy, chart rendering, or UI.

Inspect adversarial failure paths and the synthetic focused tests. Add or run independent adversarial probes where the existing tests do not prove the contract. Run from a clean dependency install: git diff --check; repository-wide TypeScript; changed-path ESLint; the complete GA0-B1 suites; affected adjacent A2/A3 suites; exact-truth, architecture, and private-data verifiers. Record exact commands, immutable tested SHAs, exits, counts, failures, and corrections. Do not call an interrupted, timed-out, inherited, pending, or unrun command a pass.

Inspect all unresolved GitHub review threads and comments. Inspect current-head GitHub CI directly, record exact workflow/run/job IDs and states, and distinguish current documentation-head CI from executable-head CI and from local test evidence. A passing implementer run does not replace independent review.

Verify scope exclusions: no AI, UI, chart rendering, market-data work, support/resistance logic, migration, hosted-user behavior, Academy work, deployment, GA0-B2, or later-slice work. Confirm the PR remains draft and unmerged during audit.

Return exactly one verdict: accept, accept with required fixes, or reject.

If remediation is required, create detailed immutable findings in GitHub and in a stable Markdown repository file. Leave the PR draft and unmerged, do not resolve the independent-review threads, and return a complete ready-to-paste Codex remediation prompt containing the repository, branch, PR, immutable heads, exact findings, required changes, required tests, CI expectations, scope limits, and stop conditions.

If accepted, record the acceptance durably, resolve only the independent-audit threads whose findings are accepted and satisfied, and merge only through the independent-auditor workflow. Never deploy and never begin GA0-B2 during B1 closeout.
```
