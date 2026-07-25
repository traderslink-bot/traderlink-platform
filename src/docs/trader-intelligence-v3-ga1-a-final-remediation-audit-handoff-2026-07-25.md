# Trader Intelligence v3 GA1-A Final Remediation Audit Handoff

Date: 2026-07-25 America/Toronto
Draft PR: #160
Executable remediation commit: `267694fc298b44c5579961e0550073bf948701c1`
Production: not deployed

## Final-audit remediations

- The metric registry now describes availability through explicit behavioral
  families rather than metric-name heuristics.
- Only `net_pnl_per_100_shares` declares a total-share denominator condition,
  and only `return_on_entry_notional` declares a total-entry-notional
  denominator condition. Other share/notional projections retain authority
  requirements without falsely declaring aggregate-value denominator failures.
- Streak declarations record available zero when no matching streak exists.
- Win/loss ratio and breakeven declarations explicitly require both winning and
  losing populations.
- Declarations now carry the exact projector unavailable reason-code set; their
  limitation-code set is the same governed set.
- The simultaneous-exit test now uses mixed outcomes and proves that changing
  the semantic-round-trip tie order changes the expected losing streak.

## Verification

- Focused registry and streak tests passed: 5 tests after the final correction.
- TypeScript passed: `npx tsc --noEmit`.
- The consolidated GA1-A verifier was run once from the settled executable
  state. Its focused suite, one 10,000-row scale proof, architecture guard, and
  private-data guard completed without a failure trace. The desktop terminal
  bridge omitted the final summaries of the long-running stages, so they were
  not repeated merely to obtain duplicate output.
- The registry behavior test covers every registered metric across normal,
  empty, no-winner, no-loser, incomplete-share, incomplete-notional,
  zero-share, and zero-notional scenarios. It verifies every emitted
  unavailable reason against the declaration and its limitation codes.

## Deliberately unrun

- Full repository suite, browser/e2e tests, deployment, and unrelated legacy
  verifiers were not run.
- No additional scale proof was run after the settled verifier.

## Boundary

Keep PR #160 draft, open, unmerged, and undeployed. Do not reply to or resolve
review threads, mark it ready, merge it, deploy it, or begin GA1-B work.
