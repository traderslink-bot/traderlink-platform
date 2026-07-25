# Trader Intelligence v3 GA1-A Audit Remediation and Expanded Statistics Independent Reaudit Handoff

Date: 2026-07-25

## Review boundary

- Pull request: #160
- Branch: `agent/trader-intelligence-v3-ga1-a-generic-query-gateway`
- Base: `main`
- Exact executable commit: `7991e0a370beedf177aaa54537f00a9a54cd9a6e`
- The pull request remains draft, open, unmerged, and undeployed.
- This handoff is Markdown-only and follows the executable commit.
- No review thread was replied to or resolved.
- No GA1-B, UI, AI/model, candle, simulation, broker, database-write, payment, authentication, Academy, merge, or deployment work was performed.

## Implemented audit remediations

### Grouped count authority

- Candidate groups are assigned from the verified pre-filter population.
- Included groups are assigned after filter evaluation.
- Every emitted group binds canonical `candidateCount`, `includedCount`, and `excludedCount`.
- Each group enforces `candidateCount = includedCount + excludedCount`.
- The aggregate row binds the top-level global counts, including source exclusions.
- Count metrics are verified against their bound row counts.
- Evidence verifies the group identity and the exact included population count.
- Permutation tests establish stable group, result, evidence, and receipt identity.

### Deterministic result bounding

- `groupLimit` remains a fail-closed rejection limit on the included group inventory.
- `resultRowLimit` is a deterministic post-ordering output bound, not a rejection threshold.
- Evidence is emitted only for the deterministically retained result rows.
- Bounded results include the `ti_v3_query_result_rows_bounded` limitation code.
- Focused tests distinguish group-limit rejection from result-row bounding.

## Expanded execution-only statistics foundation

- A content-addressed v1 metric registry contains 86 active execution-only metric declarations.
- Each declaration binds its authority, population, required fields, unit and currency semantics, calculation and aggregation rules, compatible filters and groupings, minimum sample, unavailable behavior, limitations, evidence policy, ordering, test keys, deprecation state, and digest.
- Registry and declaration verification reject tampering by reconstructing and canonical-comparing accepted content.
- A shared deterministic accumulator scans each included group once and supplies registry-backed projections.
- The generic executor contains no metric-specific branching.
- Exact decimal and ratio representations remain authoritative; financial values do not use floating-point authority.
- Coverage includes population, activity, P&L, charges and net values, daily behavior, outcome rates and averages, medians and ratios, profit factor, holding time, share and notional size, consistency, streaks, concentration, and leave-one-out metrics.
- New canonical filters cover entry-price, share-quantity, and entry-notional ranges. Legacy price and position-size names normalize to canonical meanings.
- New canonical groupings cover day, entry-price range, share-quantity bucket, and entry-notional bucket.
- Exit-price range remains deliberately unsupported because the analytical row does not contain an exact exit-price authority.
- A content-addressed exact comparison contract verifies two aggregate results under the same authority, partition, and currency, retaining both evidence digests. Percentage difference is unavailable for a zero or nonnumeric baseline.

## Tests written but not independently executed

The new cases added to these existing files were executed in the combined focused run but were not invoked later as standalone files:

- `query-plan-contract.test.ts`: registered metric maximum-plus-one rejection, result-row maximum-plus-one validation, filter maximum-plus-one validation, unsupported exit-price rejection, and canonical alias identity.
- `query-filters-grouping.test.ts`: expanded entry-price, share-quantity, entry-notional, day, and bucket semantics.

All newly created focused test files were both included in the combined run and subsequently represented by a directly affected standalone run where required.

## Focused test results

Combined focused command, run once:

```text
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga1-a --reporter=dot --maxWorkers=1 --pool=forks --no-file-parallelism
```

Initial combined result:

- 5 files passed and 1 file failed.
- 54 tests passed, 1 test failed, and the explicitly gated scale test was skipped.

Directly affected reruns:

- `query-expanded-statistics.test.ts`: 4/4 passed.
- `query-property-scale.test.ts`: 1/1 focused property test passed; its scale test remained intentionally skipped in that focused invocation.
- `query-audit-remediation-registry.test.ts`: 3/3 passed after the architecture-guard correction.

The combined suite was not redundantly rerun after the isolated corrections.

## Failures and corrections

1. Expanded-statistics fixture assertion:
   - Failure: expected longest winning streak `3`; canonical chronological ordering correctly produced `4`.
   - Correction: fixed the hand-calculated fixture expectation to `4`.
   - Verification: reran only `query-expanded-statistics.test.ts`; 4/4 passed.

2. First authorized 10,000-row scale proof:
   - Failure: a 64-group by 64-metric sequence result exceeded the contract's 1 MiB serialized-result limit.
   - Correction: retained the aggregate 64-metric maximum-capacity proof and used a representative 8-metric selection for grouped scale queries. The production result-size guard was not weakened.
   - Verification: reran only `query-property-scale.test.ts`, then reran the scale proof.

3. First architecture-boundary guard:
   - Failure: `query-result.ts` used `Number(...)` to compare array lengths with exact plan limits.
   - Correction: replaced both conversions with exact `BigInt` comparisons.
   - Verification: reran only the architecture guard and the directly affected result/evidence focused test.

4. Directly affected focused-test startup:
   - Non-execution: after dependency-junction cleanup, Vitest could not resolve `vitest/config`.
   - Correction: recreated the already verified temporary `node_modules` junction solely for the test invocation, verified its exact target, ran the test successfully, and removed the junction without touching its target.
   - This was an environmental startup failure, not a product-code failure.

## Final scale proof

Command:

```text
npm run verify:ti-v3:ga1-a -- --scale-only
```

Final result:

```text
GA1-A verifier passed: 1/1 executed stages; scaleProof=passed; elapsedMs=81619; no UI/model/market/broker/database-write/deployment calls.
```

The final scale-stage test duration was 67.93 seconds and the verifier stage duration was 80.14 seconds.

## Architecture and private-data guards

Architecture command:

```text
npm run verify:ti-v3:architecture
```

Final result:

```json
{"ok":true,"scannedArchitectureFileCount":469,"scannedApiRouteCount":43,"classifiedTraderIntelligenceRouteCount":82}
```

Private-data command:

```text
npm run verify:ti-v3:private-data
```

Result:

```json
{"ok":true,"scannedRecordCount":23830,"scannedFinalTreeRecordCount":23756,"scannedPrHistoryBlobCount":74}
```

The private-data guard passed on its first and only invocation. The architecture guard was rerun only after its directly affected exact-integer correction.

## Static verification

- `npx tsc --noEmit --pretty false`: passed.
- ESLint over all changed TypeScript and TSX paths: passed.
- `git diff --check`: passed.

## Remote executable-head verification

- Executable SHA: `7991e0a370beedf177aaa54537f00a9a54cd9a6e`
- CI run: `30162235686`
- Job: `test-and-verify` (`89689321048`)
- Result: passed in 6m24s.
- The remote job passed repository tests, GA0-A2 exact-truth verification, architecture and private-data guards, GA0-B deterministic proof, GA1-A generic-query verification, Layer 2, and Layer 3.
- Level Analysis Trade Detail Facts run `30162235690`: passed.

## Deliberately unrun locally

- The full repository test suite.
- Unrelated legacy GA0-A2 and GA0-B verifier commands.
- Layer 2 and Layer 3 verifier commands.
- Playwright or browser suites.
- `npm ci`.
- A local production build.
- Any deployment, production smoke test, database mutation, or external-service operation.

The existing PR CI performed its configured repository and legacy verification once for the executable head. Those expensive checks were not duplicated locally.

## Independent auditor prompt

```text
Independently audit Trader Intelligence v3 GA1-A on PR #160 at executable commit
7991e0a370beedf177aaa54537f00a9a54cd9a6e. Keep the PR draft, open,
unmerged, and undeployed. Do not reply to or resolve existing review threads.

Audit the implementation rather than trusting this handoff. Confirm:

1. Grouped candidate/included/excluded counts derive from authoritative
   pre-filter and post-filter populations, reconcile exactly per row and at the
   aggregate, and bind count metrics and evidence.
2. groupLimit rejects excess included groups while resultRowLimit
   deterministically bounds ordered output and emits evidence only for retained
   rows.
3. Permuting source rows preserves canonical plan/result/evidence/receipt
   identity.
4. The content-addressed registry contains at least 55 active execution-only
   metric declarations, rejects tampering, and fully declares authority,
   population, calculation, compatibility, unavailable behavior, evidence,
   ordering, tests, and deprecation.
5. The generic executor has no metric-specific branching and uses one shared
   accumulator scan per included group.
6. Financial authority remains exact and deterministic, including zero and
   unavailable states, comparisons, group ordering, and serialization.
7. Expanded filters and groupings use fields actually present on the
   AnalyticalRow. Verify that exit-price range is rejected because no exact
   exit-price field exists.
8. The comparison artifact verifies both aggregate inputs, authority,
   partition, currency, metric values, evidence digests, exact difference, and
   zero-baseline percentage unavailability.
9. Capacity and maximum-plus-one behavior is deterministic, fail-closed, and
   covered by focused tests.
10. The 10,000-row proof exercises broad aggregate statistics, representative
    grouped queries, evidence resolution, permutation identity, and serialized
    size bounds without UI, model, market, broker, database-write, or deployment
    calls.

Use focused inspection and targeted tests. Do not repeatedly rerun unrelated
expensive verifiers. Report actionable findings with file and line references.
Do not modify code, alter PR state, merge, or deploy.
```
