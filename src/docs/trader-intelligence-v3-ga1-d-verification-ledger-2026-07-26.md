# GA1-D Verification Ledger

Checkpoint scope: deterministic Coach foundation only. The targeted GA1-D suite
checks intent routing, source query receipt identity, bounded evidence, exact
daily drawdown/giveback metric exposure, session grouping, rule-to-test
semantics, and unsupported tag behavior. GA1-A and GA1-B remain the authority
and replay owners.

Required checkpoint commands are recorded in the final implementation handoff:
new GA1-D tests, directly affected GA1-A tests, TypeScript, targeted ESLint,
and `git diff --check`. No full repository suite, E2E, production build, or
large proof harness belongs to this checkpoint.
