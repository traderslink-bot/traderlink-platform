# ADR: GA1-D Coach Trading Intelligence Foundation v1

## Decision

GA1-D adds a versioned deterministic Coach boundary over the accepted GA0-B,
GA1-A, GA1-B, and GA1-C authorities. There is one user-facing Coach. Natural
language, UI, personality, and model calls are deliberately absent.

The intent registry maps approved structured intents to one or more approved
capabilities. Each capability either compiles to the GA1-A generic query engine
or invokes a governed GA1-B preset; it never reads raw storage, recalculates
P/L, implements a second evidence system, or auto-runs a simulation. The Coach
result contains source query plan/result/receipt identity and bounded evidence.

## Consequences

- Financial calculations continue to use exact decimal/ratio primitives.
- Currency, owner, and account boundaries stay enforced by the read-only query
  gateway; no conversion policy is introduced.
- Missing setup tags, mistake tags, risk plan, market/candle data, or period
  comparisons return unsupported/limited results, never invented facts.
- Rule candidates are tests to consider and can link to GA1-C preset keys. They
  do not claim that a rule improved performance without a separate simulation.
- The approved result structure is suitable for a later Coach LLM to explain,
  but the LLM does not become an analytical or execution authority.

## Non-goals

No UI/chat, notifications, market data/candles, automatic setups, broker
changes, migrations, public multi-user hardening, GA1-E, deployment, merge, or
live buy/sell instructions are part of this ADR.
