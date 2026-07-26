# GA1-D checkpoint two: deterministic period-comparison scope

## Objective

Turn the existing exact `TradeQueryComparison` authority into a bounded Coach capability for current-versus-prior periods. This is the smallest deferred GA1-D slice that enables a truthful response to the existing `habit_trend_analysis` intent without adding an LLM, UI, memory, notifications, or market data.

## Current project focus

- Complete the Analytics Engine and one user-facing Coach intelligence path first; do not distribute effort across incomplete public agents or half-built engines.
- Expand Coach through capabilities that current verified trade data can support truthfully: analytics, behaviour findings, trends, evidence, limitations, unsupported-data responses, and Coach-ready structured findings.
- Build capabilities in data-authority order. Missing-data work remains deferred or blocked; it is never approximated or faked.
- Simulations are near-term support only for `rules_to_test` or already accepted GA1-C functionality.
- Notifications, market context, candle setup detection, memory/profile, dashboards, and extra agent surfaces remain lower priority until the Analytics Engine and Coach intelligence layer are strong.

## Selected scope

- Accept explicit deterministic current and prior date-range filters from the structured request; callers may supply weekly or monthly windows, but Coach does not infer dates from natural language.
- Execute both aggregate queries through the accepted GA1-A gateway with identical partition, currency, metrics, limits, and policy authority.
- Build and retain the existing content-addressed comparison artifact, including target/baseline plan, result, and evidence identities.
- Expose period-comparison evidence and limitations in the Coach result only when both executions satisfy the accepted comparison contract.
- Move `habit_trend_analysis` from its blanket period-comparison unsupported response only for these governed windows; unsupported tag, setup, risk-plan, market, and candle requests remain explicit unsupported responses.

## Non-goals

- No free-form date interpretation, LLM mapping, UI, charts, notifications, saved memory/profile data, simulations, or market/candle integrations.
- No causal habit claim: the result reports observed metric movement, sample sizes, evidence, and limitations.
- No comparison across owner/account/currency partitions, and no comparison of unverified, grouped, or mismatched-metric results.
- No attempt to advance another GA1-D slice as part of this checkpoint handoff.

## Authority boundary

`TradeQueryComparison` already rejects non-executor-issued results, incompatible partition/currency authority, non-aggregate results, and mismatched metrics. Checkpoint two must reuse that contract rather than create a Coach-specific comparison calculator.

## Acceptance evidence

- Focused tests cover explicit current/prior windows, compatible comparison construction, result identity/evidence linkage, and insufficient/missing-period handling.
- Targeted TypeScript and changed-path ESLint run only after functional implementation.
- The full repository suite, E2E, production build, merge, deployment, and GA1-E remain out of scope.
