# Trader Intelligence v3 GA1-A Independent Re-audit Remediation Addendum

Date: 2026-07-25 America/Toronto
Draft PR: #160
Executable remediation commit: `c2c037f398f9ac397b69267362a4f1af33c5b5ac`
Production: not deployed

## Remediations

- Streak calculations now sort the accumulator input by `finalExitAt`, then
  `semanticRoundTripKey`, before determining winning and losing runs. Entry
  order remains intact for metrics that actually use it.
- The metric registry now composes field and derived-semantic requirements
  additively. Outcome-plus-duration, outcome-plus-notional, net-PnL-plus-share,
  and net-PnL-plus-notional metrics therefore declare every required input.
- Registry declarations now list explicit unavailable conditions, distinguishing
  zero population, no winner/loser, incomplete share/notional authority, and
  zero denominators.
- The GA1-A ADR performance paragraph no longer has an unfinished sentence.

## Tests and verification

- Added `query-completed-streaks.test.ts` with overlapping entries,
  simultaneous exits, semantic-key tie ordering, aggregate and grouped
  execution, and source-permutation coverage.
- Added registry assertions for the composite dependencies and unavailable
  conditions.
- Focused remediation tests passed: 6 tests across the streak and registry
  files; the registry-only rerun passed 4 tests after the final declaration
  refinement.
- TypeScript passed: `npx tsc --noEmit`.
- The combined GA1-A focused suite was run once. The terminal bridge returned
  passing-dot output but not its final Vitest summary after the process exited;
  it was not rerun solely to obtain duplicate output.
- The authorized 10,000-row GA1-A scale proof was run once. It completed with
  no failure trace; the same terminal-bridge limitation omitted the final
  Vitest summary, so it was not repeated.
- Architecture guard passed: 470 architecture files, 43 API routes, and 82
  classified Trader Intelligence routes. The private-data guard was run once
  and completed without an error trace; its final summary was likewise not
  returned by the terminal bridge.

## Deliberately unrun

- Full repository test suite, browser/e2e tests, deployment, and unrelated
  legacy verifiers were not run.
- No additional 10,000-row scale invocation was made after the authorized run.

## Stop boundary

Keep PR #160 draft, open, unmerged, and undeployed. Do not resolve independent
review threads, mark it ready, merge it, deploy it, or begin GA1-B work.
