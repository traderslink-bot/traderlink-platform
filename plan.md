# Trader Intelligence Plan Entry Point

**Last updated:** 2026-07-25 America/Toronto  
**Active architecture:** Trader Intelligence v3  
**Operating profile:** `private_owner_alpha`  
**Operational hosting:** local owner testing and private-owner beta  
**Primary domain:** U.S. listed small-cap and micro-cap active trading  
**Product boundary:** retrospective educational trade review, historical simulation, and self-improvement  
**Current gate:** GA1-A — generic deterministic query engine and read-only validated gateway; GA0-B4 accepted through PR #158 at `608f0854d14a70bef1e2220e66f97289c0bcf9be`
**Active implementation ADR:** `src/docs/trader-intelligence-v3-adr-ga1-a-generic-deterministic-query-gateway-v1.md`
**Controlling post-B4 direction:** `src/docs/trader-intelligence-v3-post-ga0-b-query-simulation-and-candle-direction-lock-2026-07-25.md`

Start here when resuming Trader Intelligence product, analytics, simulations,
query, evidence, AI, market context, persistence, or QA work.

---

# 1. Controlling read order

1. `src/docs/trader-intelligence-v3-project-log-addendum-post-ga0-b-direction-2026-07-25.md`
2. `src/docs/trader-intelligence-v3-post-ga0-b-query-simulation-and-candle-direction-lock-2026-07-25.md`
3. `src/docs/trader-intelligence-v3-project-log-addendum-ga0-b-2026-07-19.md`
4. `src/docs/trader-intelligence-v3-project-log.md` for preserved detailed history
5. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
6. `src/docs/trader-intelligence-v3-ga0-b-deterministic-proof-implementation-plan-2026-07-19.md`
7. accepted GA0-A and GA0-B ADRs
8. detailed v3 QA reviews and master plan when rationale is needed
9. legacy v1/v2 files only for preserved code, fixtures, routes, education, or migration evidence

Precedence:

1. latest explicit accepted owner/project-log direction;
2. controlling architecture specification;
3. active implementation plan for the current slice;
4. detailed reviews/master plan as rationale;
5. legacy documents.

The post-GA0-B direction lock changes work after B4. It does not weaken or
expand B4 itself.

Historical audit handoffs are evidence, not active implementation authority.

---

# 2. Accepted foundation

| Slice | Status | Merge |
| --- | --- | --- |
| GA0-A1 containment and architecture | accepted | `4f9e440116258c9548a2d13f7ea057a9075101c6` |
| GA0-A2 exact execution truth | accepted | `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a` |
| GA0-A3 temporal, manifest, eligibility, and query foundation | accepted | `72ca53940403dfab63979d403bd6b479539f41db` |
| GA0-B1 read-only analytical dataset and proof contracts | accepted | `7d8d8e03826e4b877b22e9a2a68d381bb42e585d` |
| GA0-B2 weekday deterministic proof | accepted | `4338cab7d46b8a0548b22346f81b42db5fec3bf0` |
| GA0-B3 consecutive-loss daily-stop proof | accepted | `e46d9fea331aeefc262a6dc7a187b5c73678b398` |
| GA0-B4 deterministic runner proof closeout | accepted | `608f0854d14a70bef1e2220e66f97289c0bcf9be` |

The accepted foundation provides:

- deterministic broker CSV ingress and validation;
- exact canonical financial values;
- canonical executions and occurrence identity;
- duplicate and correction handling;
- exact FIFO reconstruction;
- temporal correction replay;
- content-addressed dataset manifests;
- per-capability eligibility;
- canonical date/filter contracts;
- immutable snapshots and evidence inventories;
- runtime validation and stale states;
- read-only analytical rows and currency partitions;
- exact metrics, tables, claims, series, diagnostics, and receipts;
- persisted semantic replay;
- deterministic weekday analytics;
- deterministic consecutive-loss daily-stop simulation;
- architecture and private-data guards.

GA0-A is complete. GA0-B1 through B3 are complete. Do not reopen accepted PRs
merely to continue product work.

---

# 3. Product direction

```text
accepted exact journal truth
  -> deterministic analytics and simulations
  -> exact tables, evidence, and replay
  -> B4 reusable two-tool proof service
  -> short private calibration and data-gateway proof
  -> generic query, evidence, and simulation engines
  -> owner-facing query and accessible visuals
  -> owner-only AI planning and explanation
  -> private-owner candle relay and replay-safe market context
  -> candle-dependent simulations and broader tool packs
  -> usefulness calibration
  -> future public hardening
```

The product goal remains an AI-powered trading journal and historical Rule Lab.

> Code calculates the truth. AI selects, plans, connects, and explains the truth.

AI must not become the CSV parser, financial calculator, execution grouper,
database, unrestricted SQL author, candle calculator, chart-value generator,
live signal engine, or automated broker.

The user must not need to know internal tool names or ask one exact supported
sentence. Named tools are governed capabilities and presets behind broad
natural-language planning.

---

# 4. Current operating priorities

- The owner is currently the only tester.
- The app is not public or multi-user.
- Prioritize financial truth, analytical reliability, maintainability, evidence,
  performance, and visible usefulness.
- Keep accepted safeguards, but do not expand local privacy/network security as a
  product feature unrelated to the private beta.
- Move faster after B4 by building shared engines and coherent packs rather than
  one major PR and audit per ordinary question.
- Audit genuinely distinct semantics deeply; audit governed presets together when
  they reuse an accepted engine.
- Production hosting and public-user hardening remain future work.
- No live buy/sell/hold guidance, current targets, automated orders, guaranteed
  improvement, tax advice, or portfolio-allocation authority is allowed.

---

# 5. GA0-B — Deterministic proof

GA0-B proves the complete deterministic answer path using two questions:

1. **Why am I losing money on Fridays?**
2. **What happens if I stop trading after two consecutive losses?**

GA0-B includes:

- read-only current-data adapter;
- verified analytical rows and dataset receipts;
- exact metrics;
- deterministic tool registry;
- weekday analytics;
- consecutive-loss daily-stop simulation;
- exact tables and validated claims;
- included/excluded counts and reasons;
- stable evidence bundles;
- validated chart-ready series;
- consistency validation;
- diagnostics, reference/property/scale tests, and focused CI.

GA0-B excludes:

- model calls and prompts;
- natural-language parsing;
- query UI;
- rendered charts;
- market candles and market-context enrichment;
- setup, catalyst, support/resistance, or zone analysis;
- hosted/public users, migrations, or deployment.

---

# 6. GA0-B delivery sequence

## GA0-B1 — Read-only analytical dataset and proof contracts

Accepted and merged at `7d8d8e03826e4b877b22e9a2a68d381bb42e585d`.

## GA0-B2 — Weekday deterministic proof

Accepted and merged at `4338cab7d46b8a0548b22346f81b42db5fec3bf0`.

Primary capability:

- `analyze_performance_by_weekday:v1`.

## GA0-B3 — Consecutive-loss daily-stop proof

Accepted and merged through PR #156 at
`e46d9fea331aeefc262a6dc7a187b5c73678b398`.

Primary capability:

- `simulate_daily_stop_rule:v1`.

## GA0-B4 — Proof closeout

Branch:

`agent/trader-intelligence-v3-ga0-b4-proof-closeout`

Deliver:

- final two-tool registry and deterministic runner;
- generic persisted replay boundary;
- cross-artifact consistency validator;
- evidence resolution and diagnostics;
- cross-tool property and differential tests;
- deterministic 10,000-row scale proof;
- focused GA0-B verifier and CI;
- final GA0-B audit handoff.

Required handoff:

`src/docs/trader-intelligence-v3-ga0-b4-proof-closeout-implementation-and-audit-handoff-2026-07-19.md`

B4 must remain one draft PR until independently accepted. It does not add the
new generic query engine, additional tool packs, candles, UI, or AI.

---

# 7. Post-B4 direction lock

After B4 is accepted and merged, do not proceed by building one narrow named tool
per large delivery.

Build these reusable foundations:

1. generic deterministic trade-query engine;
2. read-only validated database gateway;
3. evidence retrieval and similar-trade search;
4. generic counterfactual simulation engine;
5. execution-only analytics and simulation packs;
6. owner-facing query/evidence experience and owner-only AI explanation;
7. private-owner candle relay;
8. replay-safe VWAP, EMA9, EMA20, MFE/MAE, giveback, and market-context features;
9. candle-dependent simulation packs.

The full controlling requirements are in:

`src/docs/trader-intelligence-v3-post-ga0-b-query-simulation-and-candle-direction-lock-2026-07-25.md`

## 7.1 Execution-Only Analytics Pack 1

Build together over the generic query engine:

- `analyze_performance_by_price_range`;
- `analyze_time_of_day`;
- `analyze_trade_sequence_performance`;
- `analyze_after_loss_behavior`;
- `analyze_after_win_behavior`;
- `analyze_ticker_repeat_attempts`;
- `analyze_holding_time`;
- `analyze_long_vs_short`;
- `analyze_position_size_performance`;
- `compare_periods`.

## 7.2 Evidence capabilities

- exact evidence retrieval for every material result;
- deterministic similar-trade search;
- supporting and counterexample trades;
- exact execution, snapshot, filter, dataset, partition, and policy identities.

## 7.3 Execution-only simulation pack

Prioritize:

- daily dollar and percentage drawdown stops;
- daily peak-realized-profit giveback stops;
- maximum trades and time cutoffs;
- wait-after-loss and repeat-attempt rules;
- fixed or normalized position sizing;
- reduce size after losses/drawdown;
- price, weekday, time, sequence, direction, and repeat-attempt exclusion rules.

## 7.4 Candle-dependent work

Use the private-owner beta candle relay for:

- VWAP;
- EMA9 and EMA20;
- session/premarket high and low distance;
- opening range and extension;
- MFE, MAE, peak unrealized P/L, and profit giveback;
- percentage/R targets and partial exits;
- fixed, break-even, trailing, and time stops;
- VWAP/EMA exits and entry filters.

Setup detection waits. Support/resistance and zone synthesis wait.

---

# 8. Private-owner beta candle decision

For the beta:

- owner-provided EODHD access is the primary historical candle source;
- candle requests may be fulfilled by a paired service on the owner computer, as
  the owner’s existing local application already does;
- Yahoo may be an optional limited same-day/recent fallback where availability,
  quality, and applicable terms permit;
- no fixed Yahoo coverage duration is assumed;
- provider credentials remain on the owner computer;
- credentials are never placed in the browser, website database, model, Git, or
  logs;
- the backend issues bounded, authorized requests;
- the local relay fetches, normalizes, validates, and uploads content-addressed
  candle snapshots;
- deterministic features and simulations consume only verified normalized candle
  snapshots, never raw provider payloads.

The detailed relay, quality, no-lookahead, and simulation-assumption requirements
are in the post-B4 direction-lock document.

---

# 9. Testing and delivery cadence

During implementation:

- run focused tests for the current module;
- do not run repository-wide TypeScript after every edit;
- run one final TypeScript checkpoint per coherent engine or pack;
- use property and differential tests for shared primitives;
- use independent references for genuinely distinct simulations;
- do not run local full repository tests without a concrete broad-regression
  reason;
- do not run Playwright unless browser-facing behavior changes;
- do not repeatedly run production builds;
- let GitHub CI own broad repository tests and Layer 2/3;
- never call interrupted or unrun commands passed.

After B4, the normal delivery unit is an engine or coherent pack, not an
individual ordinary question and not the entire roadmap.

Every Codex implementation or remediation run must still publish a detailed
Markdown handoff and complete independent-auditor prompt.

Codex does not resolve independent review threads, merge, deploy, or begin the
next slice without explicit authorization.

---

# 10. Revised phase sequence

## GA0-C — Short private calibration and gateway proof

- test accepted B1–B4 against owner data outside Git;
- reconcile exact results, filters, exclusions, evidence, and performance;
- convert defects into synthetic regressions;
- prove the read-only trade-data gateway contract;
- prove the private beta candle-request and normalized snapshot contract;
- keep this phase narrow.

## GA1 — Query, Evidence, and Simulation Foundation

Recommended coherent sub-slices:

1. generic deterministic query engine and read-only database gateway;
2. evidence retrieval, similar-trade search, and Execution-Only Analytics Pack 1;
3. generic counterfactual simulation engine and execution-only simulation pack;
4. minimal owner-facing query/evidence UI and owner-only AI routing/explanation;
5. beta candle relay, market-context feature pack, and candle-dependent simulation
   pack.

The exact sub-slice labels may change. The product order and scope do not change
without an explicit owner decision.

## Later

- setup detection/classification;
- support/resistance zone synthesis;
- catalyst enrichment;
- full market-universe strategy backtesting;
- broader coaching and reports;
- public/hosted hardening and production migration.

---

# 11. Immediate next action

1. Implement GA1-A on
   `agent/trader-intelligence-v3-ga1-a-generic-query-gateway` from accepted
   `main` at `b640ba599a4b9604395d203b6224b45d9de21208`.
2. Deliver only the generic query plan, read-only gateway, executor, exact
   metrics, bounded evidence, replay, tests, verifier, ADR, and audit handoff.
3. Keep the PR draft/open/unmerged and do not deploy.
4. Do not begin GA1-B, UI/model work, simulations, candles, setup,
   support/resistance, database writes, payment, or auth.
