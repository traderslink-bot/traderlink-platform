# Trader Intelligence v3 GA0-B4 Proof Closeout — Implementation and Audit Handoff

Date: 2026-07-25 America/Toronto
Status: implementation and executable checkpoint complete; independent audit required
Branch: `agent/trader-intelligence-v3-ga0-b4-proof-closeout`
Base: `origin/main` / accepted B3 merge `e46d9fea331aeefc262a6dc7a187b5c73678b398`
Tested executable head: `b7370c77` (`Implement GA0-B4 deterministic tool runner proof`)
Documentation/current head: this Markdown-only handoff commit; exact SHA is recorded in the PR comment
Owner checkout: preserved; implementation is isolated in a clean linked worktree
Production: not deployed; GA0-C, UI, AI, market data, broker, database, and hosted work are out of scope

## Stop boundary

Keep the PR draft, open, and unmerged. Do not mark it ready, merge it, deploy it,
resolve independent-review threads, begin GA0-C, or treat implementer evidence as
independent acceptance. The next action after this handoff is adversarial audit
of the exact tested/documented heads.

The implementation commit is intentionally separate from this handoff. The
documentation commit remains Markdown-only and is not a reason to repeat the
expensive executable verifier; only lightweight diff, path, SHA, and
handoff-content checks are required after it.

## Requirement-to-file map

| Requirement | Implementation and proof |
| --- | --- |
| Exact final registry | `analytics/registry/final-tool-registry.ts`; exactly `analyze_performance_by_weekday:v1` and `simulate_daily_stop_rule:v1`, canonical order and digest. |
| Closed generic runner | `analytics/runner/tool-runner.ts`; strict request shape, closed dispatch, exact arguments, pre-execution rejection, immutable result. |
| Generic persisted replay | `analytics/runner/persisted-replay.ts`; envelope identity, selected-tool rehydration, canonical graph equality. |
| Cross-artifact consistency | `analytics/consistency/cross-artifact-consistency.ts`; context, tables, claims, series, evidence, diagnostics, receipt, and tool identity. |
| Evidence resolution | `analytics/evidence/evidence-resolver.ts`; verified partition/dataset resolution and simulation candidate checks. |
| Stable diagnostics/property cases | `__tests__/ga0-b4/runner-and-consistency.test.ts`; unknown/foreign identities, tampering, substitution, repeat, thresholds 1–5, evidence, and deterministic registry checks. |
| Scale proof | `__tests__/ga0-b4/scale-proof.test.ts`; fixed seed `0x4b344c`, exactly 10,000 verified rows, 20 dates, mixed USD/EUR partitions, bounded artifacts, max-plus-one rejection, permutation digest. |
| Focused verifier | `src/scripts/verify-trader-intelligence-v3-ga0-b.ts`; B1/B2/B3/B4 tests, scale proof, architecture, private-data safety. |
| CI | `.github/workflows/ci.yml` invokes `npm run verify:ti-v3:ga0-b`; `package.json` owns the script. |
| Controlling ADR | `src/docs/trader-intelligence-v3-adr-ga0-b4-deterministic-tool-runner-proof-closeout-v1.md`. |

## Contract and performance decisions

The accepted B1 dataset/row/evidence limits were extended to 10,000 only for
the documented scale authority and retain max-plus-one rejection. Bounded runtime
and canonical serialization limits were raised to 25,000 array items, 500,000
keys, 2,000,000 nodes, and 16 MiB aggregate string/code-unit capacity. These
values are documented in the ADR and are not unbounded input acceptance.

The scale dataset contains 10,000 verified rows across 20 UTC dates. The selected
USD partition contains 100 rows (five per date), with wins, losses, flats, and
daily-stop threshold-reached/not-reached sessions. The remaining 9,900 verified
EUR rows stay in the second currency partition and are not silently discarded.
The analyzer is run once for both registered tools; the permuted input rebuilds
the verified dataset and compares its canonical receipt identity without
duplicating the expensive analyzer call in the same test. The recorded elapsed
time and environment are added below after the scale run completes.

## Executable evidence

Commands are run from the B4 worktree:

```text
npm ci
npx tsc --noEmit --pretty false
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-b4/runner-and-consistency.test.ts --reporter=dot
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-b4/scale-proof.test.ts --reporter=dot
npm run verify:ti-v3:ga0-b
npm run verify:ti-v3:ga0-a2
npm run verify:ti-v3:architecture
npm run verify:ti-v3:private-data
npm run build
git diff --check
```

Results to record on the tested executable head:

- `npm ci`: passed on the clean worktree; npm reported 606 packages added and 9 existing audit findings (2 low, 7 high); no audit fix was run.
- TypeScript: passed, `npx tsc --noEmit --pretty false`.
- Changed-path ESLint: passed with zero errors/warnings for the B4 analytics, tests, verifier, and touched B1/B2 boundary fixtures.
- B1: 2 files / 35 tests passed.
- B2: 2 files / 24 tests passed.
- B3: 1 file / 21 tests passed.
- B4 runner/consistency/replay/evidence/property suite: 1 file / 6 tests passed.
- 10,000-row scale proof: 1 test passed; 301.44 seconds in the final focused verifier, under the documented 600-second budget; standalone implementation run was 79.65 seconds. Environment: Node v24.11.0, Windows x64, Vitest 4.1.4.
- Focused GA0-B verifier: passed 7/7 stages; final elapsed `830281ms`; no model/market/broker/deployment calls.
- GA0-A2: passed 14 files / 308 tests; architecture and private-data subchecks passed.
- Architecture: passed; 445 files, 43 API routes, 82 classified Trader Intelligence routes.
- Private-data: passed; 23,719 records, 23,719 final-tree records, 0 PR-history blobs.
- Build: passed. Existing Turbopack warnings report broad filesystem patterns in unrelated Academy/news/levels code; no build failure.
- Playwright/e2e: deliberately not run; no UI or route change is in scope.

## Auditor scope and ready-to-paste prompt

Audit the draft PR as an independent reviewer. Start from the exact B4 tested
executable head and documentation/current head recorded in the PR comment and
this file. Verify that the branch is based on accepted B3 merge
`e46d9fea331aeefc262a6dc7a187b5c73678b398`, that the owner checkout was not
modified, and that no production deploy, merge, ready-for-review transition,
audit-thread mutation, GA0-C, UI, AI/model, market-data, broker, database, or
hosted operation was introduced.

Run the focused verifier and the final checkpoint commands from the worktree.
Inspect the final registry and prove it contains exactly the two accepted
tool/version pairs. Review runner pre-execution rejection for unknown tool,
unknown version, foreign arguments, registry tampering, and authority mismatch.
Review persisted replay for semantic graph equality and relabel/tamper failure.
Review cross-artifact validation for run-context, table, claim, series, evidence,
diagnostic, receipt, and tool-key identity. Review evidence resolution for
included/excluded candidate scope, duplicate/mixed candidate rejection, and
daily-stop simulation authority. Confirm B2 and B3 production/reference/replay
tests remain independent and that all supported B3 threshold values are covered.

For the scale proof, verify exactly 10,000 verified analytical rows, fixed seed
`0x4b344c`, 20 dates/weekdays, supported USD partition, mixed outcomes, bounded
artifact counts, serialized payload bound, receipt/identity graph checks,
permutation stability, stable max-plus-one rejection, and the documented elapsed
time/environment. Confirm capacity changes are bounded, justified, documented,
and not a silent weakening of validation. Report any environmental blockers and
deliberately unrun commands separately from code findings. Stop after audit;
do not merge, deploy, mark ready, resolve existing audit threads, or begin
GA0-C.
