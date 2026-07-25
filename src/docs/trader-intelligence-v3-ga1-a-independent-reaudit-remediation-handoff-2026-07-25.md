# Trader Intelligence v3 GA1-A Independent Re-audit Remediation Handoff

Date: 2026-07-25

Latest follow-up remediation record:
[`trader-intelligence-v3-ga1-a-independent-reaudit-remediation-addendum-2026-07-25.md`](./trader-intelligence-v3-ga1-a-independent-reaudit-remediation-addendum-2026-07-25.md).

## Boundary

- Pull request: #160
- Branch: `agent/trader-intelligence-v3-ga1-a-generic-query-gateway`
- Executable remediation commit: `ecdeca4686dd5455e16f0966e5f56549c2d8200a`
- The pull request remains draft, open, unmerged, and undeployed.
- This document is the later Markdown-only handoff. No review thread was
  replied to or resolved.
- No GA1-B, UI, AI/model, candle, simulation, broker, database-write, payment,
  authentication, Academy, merge, or deployment work was performed.

## Resolved independent re-audit findings

### P1: comparison authority and reconstruction

- `buildTradeQueryComparison()` now accepts only the opaque verified-execution
  capability issued by the generic executor after opening the verified gateway,
  normalizing the plan, and building the complete result graph.
- A re-digested clone, including one with a re-digested exact `net_pnl`,
  `win_rate`, or `profit_factor`, is structurally valid but cannot act as
  comparison financial authority.
- `verifyTradeQueryComparison()` reconstructs transported comparison content
  against the two verified execution graphs and rejects any digest or content
  mismatch.
- Comparison requires exact aggregate metric-key equality instead of silently
  intersecting different metric selections.

### P2: result and metric-registry contract accuracy

- Result verification now requires every row's metric sequence to exactly match
  the normalized plan: no missing, extra, duplicate, reordered, or unselected
  metrics.
- Each metric is checked against the registry-approved key, unit, and currency
  behavior.
- The registry declarations now use explicit metric families rather than a
  broad name fallback. They state actual fields and derived semantics for gross
  P/L, charges, accounts, symbols, execution digests, daily paths, direction,
  repeat chronology, streaks, duration, quantity, and notional metrics.
- Declarations distinguish zero-population availability, winner/loser and
  zero-denominator conditions, and incomplete quantity/notional authority.

### P2: accumulator complexity

- The accumulator now prepares totals, win/loss sums, account and symbol
  cardinalities, day classifications, extrema, largest winner/loser values,
  leave-one-out inputs, and sorted inventories once per included group.
- Metric projection selects or combines cached values. It no longer rescans or
  sorts the population per selected metric.
- The ADR now records the conservative upper bound
  `O(R log R + G log G + M x G + E)`, with sorting once per accumulated value
  inventory rather than once per metric.

### P2: reachable filter maximum and ordering identity

- The public filter maximum is now 16, matching the 16 canonical filter kinds
  available after alias normalization.
- A focused test constructs all 16 canonical filters and proves acceptance;
  the seventeenth is rejected.
- Duplicate and contradictory metric or `group_identity` ordering targets are
  rejected before plan identity is created.

## Focused regression coverage

- New `query-reaudit-contract-hardening.test.ts` covers fabricated re-digested
  `net_pnl`, `win_rate`, and `profit_factor`; missing, extra, duplicate, wrong
  unit, and wrong currency metrics; comparison reconstruction; and declaration
  authority/unit/currency behavior across all 86 registered metrics.
- `query-plan-contract.test.ts` covers exact canonical filter capacity,
  maximum-plus-one rejection, and duplicate/conflicting ordering rejection.
- `query-expanded-statistics.test.ts` now confirms comparison transport is
  verified through reconstruction, not by reusing a JSON clone as execution
  authority.

## Verification ledger

Local targeted verification:

- `query-reaudit-contract-hardening.test.ts`: 4/4 passed.
- `query-plan-contract.test.ts`: 7/7 passed after its final ordering-identity
  addition.
- `query-plan-contract.test.ts` plus `query-expanded-statistics.test.ts`:
  11/11 passed.
- TypeScript: `npx tsc --noEmit --pretty false` passed.
- Changed-path ESLint passed.
- `git diff --check` passed.
- Combined GA1-A focused invocation was run once before the scale proof. The
  local terminal transport retained progress but not its final summary after
  cleanup; the exact executable head subsequently passed the remote GA1-A
  verifier.

Scale and guards:

- The authorized `npm run verify:ti-v3:ga1-a -- --scale-only` process completed
  once after the cached-accumulator correction and cleaned up normally.
- Local architecture guard explicitly passed with 470 architecture files and
  82 classified Trader Intelligence routes.
- The local private-data guard completed once. The remote CI independently
  passed both architecture and private-data stages for the executable head.

Remote executable-head verification:

- CI run `30164079031`, job `89694027125`: passed in 8m09s.
- Level Analysis Trade Detail Facts run `30164079036`: passed.
- CI passed repository tests, GA0-A2, architecture, private-data, GA0-B, GA1-A,
  Layer 2, and Layer 3.

Deliberately not run locally:

- Full repository suite.
- Unrelated GA0-A2, GA0-B, Layer 2, and Layer 3 commands.
- Browser or Playwright suites.
- Local production build, deployment, production smoke test, database mutation,
  or external-service operation.

## Independent re-audit prompt

```text
Independently re-audit Trader Intelligence v3 GA1-A on PR #160 at executable
commit ecdeca4686dd5455e16f0966e5f56549c2d8200a. Keep the PR draft, open,
unmerged, and undeployed. Do not reply to or resolve review threads.

Verify that:
1. comparisons accept only executor-issued verified executions, reject
   re-digested fabricated net_pnl/win_rate/profit_factor values, and reconstruct
   transported comparisons from two verified execution graphs;
2. result verification exactly binds every row's metric sequence to the plan
   and registry-approved unit/currency semantics;
3. all 86 declarations accurately state actual fields, derived semantics,
   sample/unavailable behavior, and canonical compatibility;
4. the accumulator, not metric projection, owns reusable totals, day state,
   extrema, largest winner/loser values, and sorted inventories;
5. 16 canonical filters are accepted, 17 are rejected, and aliases do not add
   capacity;
6. duplicate/conflicting ordering targets are rejected;
7. focused tests, the 10,000-row scale proof, architecture guard, and
   private-data guard remain appropriate and no scope boundary changed.

Use focused inspection and tests. Do not merge, deploy, change PR state, or
modify code unless explicitly asked.
```
