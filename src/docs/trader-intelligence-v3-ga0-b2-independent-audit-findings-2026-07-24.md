# Trader Intelligence v3 GA0-B2 Independent Audit Findings

**Date:** 2026-07-24 America/Toronto  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Branch:** `agent/trader-intelligence-v3-ga0-b2-weekday-proof`  
**Draft PR:** `#150`  
**Accepted GA0-B1 merge and immutable B2 merge base:** `7d8d8e03826e4b877b22e9a2a68d381bb42e585d`  
**Audited executable head:** `532f382859b60f19bcf701f4c731b1497c12dac1`  
**Audited implementation-handoff head:** `e81aede672ffacf0cfec7350b338d6e68ffa30d6`  
**Verdict:** `accept with required fixes`

> This file is independent audit evidence. It does not authorize merge,
> deployment, review-thread resolution, GA0-B3, or any later slice. The
> implementation handoff, implementer test results, and passing CI were treated
> as evidence rather than proof.

---

## 1. Independently verified state

- PR #150 was open, draft, mergeable, and unmerged when the audit began.
- The PR base is `main` at accepted GA0-B1 merge
  `7d8d8e03826e4b877b22e9a2a68d381bb42e585d`.
- `532f382859b60f19bcf701f4c731b1497c12dac1` is exactly one executable
  implementation commit after the accepted B1 merge.
- `e81aede672ffacf0cfec7350b338d6e68ffa30d6` is exactly one later
  documentation/status commit.
- The executable commit changed nineteen files. Every changed production,
  shared-contract, exact-math, policy, export, test, ADR, and status file was
  inspected.
- PR #150 had no inline review threads before this audit.
- Executable-head CI run `30064706886`, job `89393292286`, completed
  successfully.
- Documentation-head CI run `30064927770`, job `89393910299`, completed
  successfully.
- Both CI jobs completed clean checkout, dependency installation, repository
  tests, GA0-A2 exact-truth verification, architecture verification,
  private-data verification, Layer 2, and Layer 3.
- No UI, model, chart renderer, market-data, support/resistance, migration,
  deployment, GA0-B3, or later-slice implementation was observed.

## 2. Independent execution limitation

The audit runtime did not contain the supplied Windows checkout. A clean clone
was attempted, but the runtime could not resolve `github.com`; the failure
occurred before checkout and dependency installation. Consequently:

- independent `npm ci` did not run;
- independent TypeScript, ESLint, Vitest, and verifier commands did not run;
- no local command is represented as independently passed.

This audit instead used complete immutable GitHub file/diff inspection,
adversarial construction analysis of public builders/verifiers, review-state
inspection, and executable/documentation-head CI evidence.

---

# 3. Required findings

## B2-AUD-R1 — High: the persisted weekday result has no tool-specific replay verifier

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/weekday/weekday-analysis.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/table-claim-series.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/run-receipt.ts`
- weekday exports and focused tests

### Failure path

`executeWeekdayAnalysis` correctly calculates a deterministic graph from verified
B1 authority at runtime. However, no B2 authority verifies a persisted or
untrusted weekday result by re-executing the weekday calculation from the exact
snapshot/dataset/partition/argument authority.

The shared builders verify only generic graph consistency:

- `buildExactTable` verifies content shape, units, currency, counts, evidence
  existence, and content identity; it does not recalculate table cells from the
  analytical rows;
- claims derive from whichever verified table is supplied;
- series copy whichever verified table is supplied;
- `verifyAnalysisRunReceipt` rebuilds the supplied graph rather than rerunning
  `analyze_performance_by_weekday:v1`.

A caller holding one genuine run context and genuine evidence bundles can build
an internally consistent table with false Friday P/L or expectancy, build claims
and series from that false table, and create a final receipt that passes the
shared verifier. Content addressing proves the fabricated graph is internally
stable; it does not prove the weekday tool derived it.

This violates the B2 invariant that every number reconciles to the selected row
set and the requested deterministic-replay/tampering guarantees.

### Required remediation

1. Add a content-addressed weekday-execution or weekday-derivation receipt that
   binds:
   - the exact B2 tool and policy identities;
   - normalized arguments;
   - run context and verified dependencies;
   - exact selected row/evidence population;
   - every table, claim, series, diagnostic, and final receipt identity.
2. Add an untrusted/persisted re-entry verifier that reruns
   `executeWeekdayAnalysis` from the complete verified source authority and
   requires exact canonical equality with the supplied graph.
3. Do not rely on WeakMap branding as persisted proof.
4. Return only the protected replayed graph after supplied-content integrity and
   replay equality pass.

### Required adversarial tests

- change Friday net P/L and rebuild all generic digests: reject;
- change expectancy, median, win rate, sample state, outlier state, or after-loss
  values and rebuild the generic graph: reject;
- omit, add, or replace a table/claim/series/evidence artifact: reject;
- change normalized arguments or target weekday while retaining artifacts:
  reject;
- exact persisted graph plus exact replay authority: accept;
- caller order and persistence-ID-only changes preserve the replayed identity.

---

## B2-AUD-R2 — High: after-loss classification can use a trade that had not completed yet

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/weekday/weekday-analysis.ts`
- affected B1 row-order semantics and tests

### Failure path

The controlling B2 policy requires the immediately preceding **completed** trade.
`groupRowsByVerifiedSequence` instead sorts by B1 `sequenceInPartition` and uses
the prior row's final P/L. B1 assigns that sequence from meaningful first-entry
order, while each row separately carries `firstEntryAt` and `finalExitAt`.

For overlapping round trips:

- Trade A enters at 09:30 and exits at 11:00 with a loss.
- Trade B enters at 10:00 and exits at 10:30.

First-entry sequence places A before B. The current code classifies B as
`after_loss` using A's final outcome even though A was still open when B entered.
That is future-information leakage and is not the immediately preceding completed
trade.

### Required remediation

1. Define the exact decision timestamp for after-loss classification.
2. For each row, consider only trades in the same owner/account/currency/session
   whose `finalExitAt` is strictly before the current decision timestamp.
3. Select the immediately preceding completed trade using verified economic
   completion order and stable deterministic tie rules.
4. Fail closed or return an explicit unavailable/ambiguous state when completion
   order or same-timestamp precedence cannot be proven.
5. Preserve first-trade and flat-reset policy without using future outcomes.

### Required adversarial tests

- overlapping A/B example above;
- a later-entered trade that completes first;
- equal exit timestamps with and without authoritative tie evidence;
- open predecessor is not treated as completed;
- prior trade in another account/currency/session is isolated;
- permutation invariance under the corrected completion-order policy.

---

## B2-AUD-R3 — High/Medium: B2 limitations do not propagate into tables and series

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/weekday/weekday-analysis.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/table-claim-series.ts`
- run-receipt and focused tests

### Failure path

The table/series `limitations` array is calculated only from the B1 partition and
capability eligibility. Sample insufficiency, baseline insufficiency,
mean/median disagreement, leave-one-out changes, outlier concentration, and no
directional tendency are calculated later as diagnostics—after tables have
already been built.

The final receipt correctly becomes `limited`, but the authoritative tables and
chart-ready series can retain empty limitation lists. This contradicts the
controlling rule that limitations may not disappear from tables or series and
creates inconsistent surfaces for future UI/AI consumers.

The hard-coded unavailable entry-time decomposition also carries only an
unavailable metric reason, not a corresponding tool limitation or diagnostic.

### Required remediation

1. Calculate the complete B2 analysis state before final artifact construction.
2. Define versioned categories for:
   - artifact-visible limitations;
   - claim-blocking limitations;
   - informational diagnostics.
3. Include every applicable artifact-visible limitation in every affected exact
   table and chart-ready series.
4. Require receipt/table/series limitation equality or an explicit verified
   projection policy.
5. Preserve limitation evidence through claims and future consumers.

### Required tests

- target counts 0, 4, 5, 9, and 10;
- baseline counts 0, 19, and 20;
- exact 2/5 threshold and strictly greater-than threshold;
- mean/median disagreement;
- largest-win and largest-loss reversal;
- unavailable entry-time and partial notional facts;
- every limited result exposes the same required limitation set in receipt,
  relevant tables, and series.

---

## B2-AUD-R4 — High/Medium: a run that becomes limited from exclusion evidence can still emit an unqualified tentative claim

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/weekday/weekday-analysis.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/evidence-diagnostics.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/run-receipt.ts`

### Failure path

Excluded evidence bundles correctly add the primary exclusion reason to their
limitation set. The final run receipt aggregates evidence limitations and becomes
`limited`.

Claim promotion happens earlier and checks only:

- B1 partition/eligibility limitations;
- sample state;
- mean/median agreement;
- leave-one-out direction;
- outlier state.

It does not inspect relevant exclusion evidence or the final run status. A
30-trade claim-eligible partition plus one missing-occurrence, missing-execution,
reconstruction, or other evidence-quality exclusion can therefore emit a
`tentative` claim whose own limitations omit the exclusion, while the final
receipt is limited. The B2 ADR says limited or ineligible runs omit claims.

The promotion gate also does not enforce the ADR's explicit requirement that the
target mean and baseline mean are each non-flat; it checks only that their
*difference* is non-flat.

### Required remediation

1. Classify exclusion reasons under a versioned claim policy:
   - intentional canonical-filter exclusions may be neutral when policy says so;
   - evidence, coverage, reconstruction, eligibility, or authority exclusions
     must limit/block claim promotion.
2. Determine final claim eligibility from the complete analysis/evidence state,
   not only the early B1 limitation list.
3. Require target expectancy and baseline expectancy to be individually non-flat
   when the controlling ADR requires it.
4. Ensure every emitted claim carries all relevant claim limitations and cannot
   coexist with a final state that policy says must omit claims.
5. Align content-addressed sample-state literals with the ADR
   (`insufficient`, `descriptive_only`, `claim_eligible`) or explicitly amend the
   controlling decision.

### Required tests

- otherwise claim-eligible data plus one missing-occurrence exclusion: no claim;
- missing execution, reconstruction, and coverage exclusions: no claim;
- intentional filter exclusion follows the documented neutral/limiting policy;
- flat target mean and non-flat baseline: no claim;
- non-flat target and flat baseline: no claim;
- claim, table, evidence, diagnostics, and final receipt limitations reconcile.

---

## B2-AUD-R5 — Medium: required available decompositions are omitted or incorrectly declared unavailable

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/tools/weekday/weekday-analysis.ts`
- B2 ADR and focused tests

### Failure path

The accepted B1 analytical row carries an exact `firstEntryAt`, timezone, session
date, and stable evidence. The B2 plan requires average/median entry-time buckets
where available. The implementation hard-codes `entry_time_distribution` as
unavailable for every run and the ADR incorrectly states that B1 does not prove
entry time.

The controlling ADR also says B2 calculates target contribution to aggregate
net **and absolute** P/L. The effects table exposes target net-P/L share but no
target share of aggregate absolute P/L. Notional/quantity output provides totals,
medians, and availability buckets but not the required average/value-bucket
comparison where exact data is available.

### Required remediation

1. Define a deterministic, timezone-bound entry-time bucket policy from verified
   `firstEntryAt` and the accepted timezone/session authority.
2. Emit target/baseline entry-time distributions and exact average/median bucket
   facts, or return a limitation only for rows whose conversion cannot be proven.
3. Emit the ADR-declared target share of aggregate absolute P/L.
4. Add exact average and/or versioned value-bucket comparison for available
   notional/quantity facts, while retaining unavailable counts and limitations.
5. Correct the ADR statement that B1 lacks entry-time authority.

### Required tests

- UTC and America/New_York entry-time buckets;
- DST/session-bound conversion;
- partial unavailable notional population;
- exact notional average/median and bucket membership;
- exact target absolute-P/L share;
- permutation invariance for every new decomposition.

---

## B2-AUD-R6 — Medium: the globally increased runtime-validation budget does not bound property-key size

**Affected files**

- `src/lib/trader-intelligence-v3/domain/foundation/runtime-validation.ts`
- `src/lib/trader-intelligence-v3/domain/canonical/canonical-serialization.ts`
- budget tests and ADR

### Failure path

B2 increases shared limits to 65,536 nodes and 16,384 total keys. Canonical
serialization charges property-key code units against its aggregate 1 MiB budget.
The foundation runtime validator does not:

- bound an individual property-key length;
- charge key code units against `maxAggregateStringLength`.

It normalizes every key before the exact-record layer rejects unknown fields. A
hostile untrusted object may therefore provide thousands of extremely large key
names and force substantial normalization/allocation outside the advertised
aggregate payload bound.

The ADR documents that 1,024 keys was insufficient for one 30-trade graph but
provides no observed required node/key counts or justification for applying the
larger ceiling globally rather than to a B2 result domain.

### Required remediation

1. Add maximum key length and aggregate key-plus-value code-unit accounting to
   the descriptor-first runtime validator.
2. Add adversarial huge-key tests before and at the exact boundaries.
3. Record observed graph node/key counts for 30-row and accepted 64-row worst-case
   B2 artifacts.
4. Prefer a narrower B2/tool-result budget when the larger global foundation
   ceiling is not required by accepted B1 authorities.
5. Keep canonical and runtime validation budgets semantically aligned.

---

# 4. Validated strengths

The audit independently confirmed these strengths:

- strict content-addressed weekday arguments with explicit Friday default;
- canonical weekday enum validation and semantic Monday-through-Sunday order;
- actual B1 snapshot/dataset/partition authority entering the runtime executor;
- exact decimal/rational financial math without binary floating-point authority;
- exact median, expectancy, rates, subtraction, and deterministic tie selection;
- target and baseline disjoint/exhaustive membership checks;
- strict USD/CAD partition isolation and no FX conversion;
- exact table-cell evidence, counterexample evidence, series table selection, and
  generic artifact closure;
- diagnostics-only blocked output for verified zero-included partitions;
- B1 backward-compatible optional contract fields;
- no AI, UI, rendering, market-data, migration, deployment, or GA0-B3 scope.

---

# 5. Decision question and residual risks

## Q1 — Outlier denominator policy requires explicit acceptance

The implementation and B2 ADR define concentration as:

`largest absolute target trade / sum of absolute target trade P/L`

and correctly use strict `> 2/5` comparison. The broader GA0-B plan describes a
proportion of the total effect and separately requires largest-trade contribution
to total net P/L. The implemented concentration measure can be materially lower
when gains and losses offset.

This is documented rather than silent, so it is recorded as a policy decision
question rather than a separate implementation defect. Before acceptance, the
remediation should either:

- explicitly accept the absolute-activity concentration policy and explain why
  leave-one-out plus mean/median checks are sufficient; or
- use the more conservative maximum of absolute-activity concentration and
  absolute contribution to the relevant total/effect.

Required equality and offsetting-trade vectors must be added either way.

## R1 — Independent local execution remains unavailable

The clean independent audit commands could not run in the current runtime because
GitHub DNS resolution failed before clone. Clean GitHub CI is strong separate
evidence, but it does not replace the missing independent adversarial probes.
The remediation handoff must preserve this distinction and provide exact focused
commands for the next re-audit.

---

# 6. Required remediation boundary

Remediate B2-AUD-R1 through B2-AUD-R6 on the existing B2 branch and PR #150.
Do not create another B2 PR, mark ready, merge, deploy, resolve independent audit
threads, or begin GA0-B3.

Use focused tests while implementing. Run repository-wide TypeScript once near
the final executable checkpoint. Let GitHub CI perform the broad clean-install
suite. Finish with a later Markdown-only remediation handoff containing a
complete ready-to-paste independent re-auditor prompt.
