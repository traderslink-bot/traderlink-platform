# Trader Intelligence v3 GA0-B2 Weekday Proof Implementation and Audit Handoff

**Handoff date:** 2026-07-23 America/Toronto
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`
**Branch:** `agent/trader-intelligence-v3-ga0-b2-weekday-proof`
**Draft PR:** [#150](https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/150)
**Accepted GA0-B1 merge/base:** `7d8d8e03826e4b877b22e9a2a68d381bb42e585d`
**Tested executable commit:** `532f382859b60f19bcf701f4c731b1497c12dac1`
**Required state:** draft, open, and unmerged

## 1. Stop boundary

This handoff ends GA0-B2 implementation and begins independent audit.

Do not:

- mark PR #150 ready;
- merge or close it;
- deploy from this repository or any production repository;
- port this work into `traderslink.pro`;
- begin GA0-B3;
- resolve independent-review threads on behalf of the reviewer.

This repository remains the local Trader Intelligence v3 design and
implementation baseline. It is not the canonical production website checkout.

## 2. Base and continuity proof

Work began in a clean linked worktree from `origin/main` at the accepted GA0-B1
merge:

`7d8d8e03826e4b877b22e9a2a68d381bb42e585d`

Before implementation:

- local `origin/main` matched that SHA;
- `git merge-base --is-ancestor` confirmed the accepted B1 merge;
- no B2 branch or PR existed;
- the owner’s original checkout was dirty and was not modified;
- the linked worktree isolated all B2 source and documentation changes.

The tested executable commit has merge base:

`7d8d8e03826e4b877b22e9a2a68d381bb42e585d`

## 3. Implemented contract

GA0-B2 implements exactly one tool:

`analyze_performance_by_weekday:v1`

Primary files:

- `src/lib/trader-intelligence-v3/analytics/tools/weekday/weekday-policy.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/weekday/weekday-exact-math.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/weekday/weekday-analysis.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/weekday/index.ts`
- `src/lib/trader-intelligence-v3/analytics/tools/index.ts`
- `src/lib/trader-intelligence-v3/analytics/index.ts`
- `src/docs/trader-intelligence-v3-adr-ga0-b2-weekday-deterministic-proof-v1.md`

The executor consumes verified B1 authorities:

- immutable analysis snapshot and dependencies;
- canonical query filter;
- analytical dataset and derivation receipt;
- verified single-currency partition receipt;
- normalized, content-addressed tool arguments;
- registered tool and policy identity.

It emits:

- exact weekday table;
- exact target-versus-baseline table;
- exact effects/sensitivity table;
- exact distribution table;
- grouped exclusion-reason table;
- stable evidence bundles;
- evidence-bound validated claims when eligible;
- explicit counterexample evidence;
- verified chart-ready series;
- diagnostics;
- final content-addressed analysis run receipt.

No model, prompt, natural-language parser, chart renderer, current market data,
UI route, or journal mutation was added.

## 4. Tool and argument policy

The registry entry declares:

- key/version `analyze_performance_by_weekday:v1`;
- executable state `tool_specific_deterministic_executor`;
- minimum sample state `versioned_tool_policy`;
- comparison policy `all_other_represented_weekdays_v1`;
- evidence policy `ti_v3_weekday_conservative_evidence_v1`;
- outlier policy `ti_v3_weekday_outlier_contribution_v1`;
- CAD/USD and UTC/America_New_York support;
- table, claim, series, diagnostics, and receipt outputs;
- claims as the only output class optional for a limited run.

Arguments use canonical weekday values and default to Friday. Unsupported or
localized weekday values, foreign policy versions, and malformed arguments are
rejected rather than guessed.

## 5. Exact metric semantics

All financial calculations use exact decimal or exact rational primitives.
Financial truth does not pass through `Number`, `parseFloat`, `parseInt`,
unary numeric conversion, or `Math` arithmetic.

Metrics include:

- trade, win, loss, and flat counts;
- gross profit/loss, charges, net P/L, and expectancy;
- median trade P/L and win rate;
- best and worst trade;
- leave-one-out net P/L and direction;
- after-loss opportunity, traded count, and rate;
- quantity/notional availability, totals, and medians;
- target contribution to total net and absolute P/L.

Fractions are emitted as finite canonical decimals only when the denominator
terminates in base ten within the configured scale. Other values remain exact
ratios. Weekdays always use semantic Monday-through-Sunday ordering.

Target rows and baseline rows are verified as disjoint and exhaustive over the
included currency partition. Currencies are never converted or combined.

## 6. Sample, outlier, and claim policy

Versioned sample policy:

- target count below 5: `insufficient`;
- target count 5 through 9: `descriptive_only`;
- target count at least 10 and baseline count at least 20: `claim_eligible`;
- all other compositions: `descriptive_only`.

Outlier concentration is:

`largest absolute target trade P/L / sum absolute target trade P/L`

The concentration guard trips only when the exact ratio is strictly greater
than `2/5`. Leave-one-out directions are also calculated.

A claim requires:

- nonlimited authority;
- claim-eligible sample composition;
- non-flat target and baseline mean directions;
- target mean/median directional agreement;
- no leave-one-out direction reversal;
- no excessive outlier concentration.

When those conditions are not met, tables, series, diagnostics, and receipt
remain available while claims are omitted. Emitted claims include explicit
counterexample evidence bundle digests.

## 7. After-loss and unavailable-data semantics

After-loss state uses the immediately preceding completed trade in canonical
order within the same:

- owner;
- account;
- currency;
- session date.

A preceding loss activates the next-trade opportunity. A preceding win or flat
trade resets it. The first trade has no preceding-trade state.

Quantity and notional absence remains explicit. Entry-time buckets are
explicitly unavailable because the accepted B1 analytical row does not prove
entry time. B2 does not synthesize or infer that fact.

## 8. Evidence and artifact identity

Evidence bundles are content addressed and reference stable analytical-row
identities. Table rows and relevant cells carry evidence bundle digests.
Claims carry supporting and counterexample evidence. Chart points carry their
source evidence.

The chart-ready series are:

- weekday net P/L;
- weekday expectancy;
- weekday trade count;
- target-versus-baseline expectancy.

Monetary series preserve partition currency. Nonmonetary series have null
currency. Series denominators match the verified source table policy.

The run receipt binds:

- normalized argument digest;
- registry entry digest;
- snapshot and dependency authority;
- dataset, derivation, and partition receipts;
- table, claim, series, diagnostics, and evidence digests;
- included/excluded counts and partition currency;
- completed or limited run state.

Equivalent caller row/execution permutations reproduce the same artifact
identities.

## 9. Shared-contract changes

The shared GA0-B1 contracts were extended without invalidating accepted B1
payloads:

- registry supports versioned tool policies and deterministic executors;
- registry declares optional output classes for limited runs;
- table columns may restrict allowed value kinds;
- cells may carry evidence bundle digests;
- claims explicitly verify counterexample evidence;
- receipts include cell-level and counterexample evidence use;
- nonmonetary series may correctly use null currency in a currency partition.

Focused B1 regression tests pass with these additions.

## 10. Bounded graph-budget correction

The accepted B1 dataset permits up to 64 analytical rows, but the former global
1,024-key graph ceiling rejected a valid 30-trade B2 minimum eligible sample
before artifacts could be built.

The bounded limits are now:

- maximum nodes: 65,536;
- maximum total keys: 16,384.

Depth, string length, aggregate string length, array length, and per-object key
guards remain in force. Existing over-budget rejection tests derive their
inputs from the exported limits and pass.

Auditors should explicitly decide whether this bounded correction is the right
shared-contract remedy or whether a narrower artifact-budget design is
preferred before acceptance.

## 11. Test and verification evidence

All successful executable evidence below applies to commit:

`532f382859b60f19bcf701f4c731b1497c12dac1`

### Focused B2 development checkpoint

- 2 files passed;
- 14 tests passed.

### Consolidated affected regression checkpoint

Command covered:

- both GA0-B2 suites;
- both GA0-B1 suites;
- affected GA0-A2 canonical serialization, exact decimal/ratio, ordering,
  relationship, relationship resolution, FIFO, differential, and property
  suites;
- affected GA0-A3 manifest/eligibility/snapshot/evidence/filter suites;
- architecture boundary guard.

Result:

- 16 files passed;
- 296 tests passed.

### Canonical GA0-A2 verifier

`npm run verify:ti-v3:ga0-a2`

Result:

- 14 files passed;
- 308 tests passed;
- 10,000-execution relationship scale check passed;
- embedded architecture verifier passed;
- embedded private-data verifier passed.

The final successful scale observation was:

- elapsed: 1,150 ms;
- observed RSS delta: 7,467,008 bytes;
- thresholds: 120,000 ms and 805,306,368 bytes.

### Standalone verifiers

`npm run verify:ti-v3:architecture`

- passed;
- 427 architecture files scanned;
- 43 API routes scanned;
- 82 Trader Intelligence routes classified.

`npm run verify:ti-v3:private-data`

- passed;
- 23,702 records scanned;
- 23,683 final-tree records scanned;
- 19 PR-history blobs scanned.

### Static checks

- `npx tsc --noEmit --pretty false`: passed;
- ESLint on every changed TypeScript/test file: passed;
- `git diff --check`: passed;
- executable worktree was clean after commit.

### Build and browser checks

Build was not run because no route, UI, Next configuration, or package
dependency changed. Playwright was not run because no browser-facing behavior
changed. `npm ci` was not run because package files were unchanged.

## 12. Nonpass and environment record

Do not reinterpret these attempts as passing evidence:

1. Initial focused Vitest startup failed because an isolated `npx` runner could
   not resolve `vitest/config`.
2. A rerun used unsupported CLI option `--minWorkers`; no tests started.
3. Early fixture runs exposed and led to corrections for chronological
   reconstruction, canonical graph budget, series currency/denominator
   semantics, expected terminating ratio form, after-loss expectation, and
   test timeout.
4. Initial TypeScript run found four test-boundary assignments from the B1
   fixture’s untrusted `unknown` snapshot. The executor boundary was corrected
   to accept untrusted input and rely on runtime snapshot verification.
5. The first GA0-A2 verifier attempt reached 306 passing tests but its two
   SQLite cases failed before assertions because the borrowed dependency tree
   lacked the Node 24 native `better-sqlite3` binding.
6. A second dependency tree supplied SQLite but lacked `fast-check`; that run
   reached 289 passes and then failed at import time.
7. A preload experiment did not intercept Vitest’s transformed CommonJS
   boundary and was not counted.
8. Final verification used the complete dependency tree plus a temporary copy
   of an already-compatible native SQLite addon. The addon was moved back out
   after verification; no source or package file changed.

## 13. GitHub evidence

Executable CI run:

- workflow/job: `CI / test-and-verify`;
- run: `30064706886`;
- executable SHA: `532f382859b60f19bcf701f4c731b1497c12dac1`;
- conclusion: passed;
- duration reported by PR checks: 3m09s.

The handoff/status documentation is intentionally a later docs-only commit.
Because a committed file cannot truthfully contain its own final commit SHA,
the exact documentation/current head must be recorded in the top-level PR
comment and final implementation response after this file is committed. Audit
the executable SHA above for behavior and the later head only for documentation
and handoff integrity.

## 14. Known limitations and deferred scope

- No query-language or natural-language layer.
- No visible chart rendering or UI.
- No AI/model call or explanation.
- No market-data, VWAP, setup, catalyst, or level enrichment.
- No inferred entry-time bucket.
- No cross-currency comparison or conversion.
- No GA0-B3 daily-stop simulation.
- No public hosting, migration, deployment, or production handoff.
- Sample/outlier thresholds are explicit v1 product policy, not statistical
  proof of causality.
- Claims intentionally disappear when evidence is limited or unstable.

## 15. Independent auditor prompt

Use the following prompt in a fresh independent audit task:

```text
You are the independent auditor for Trader Intelligence v3 GA0-B2 — Weekday
Deterministic Proof.

Repository:
C:\Users\jerac\Documents\TraderLink\trader-intelligence-v3-ga0-b2-weekday-proof

Branch:
agent/trader-intelligence-v3-ga0-b2-weekday-proof

Draft PR:
https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/150

Accepted GA0-B1 merge/base:
7d8d8e03826e4b877b22e9a2a68d381bb42e585d

Tested executable commit:
532f382859b60f19bcf701f4c731b1497c12dac1

Mandatory handoff:
src/docs/trader-intelligence-v3-ga0-b2-weekday-proof-implementation-and-audit-handoff-2026-07-19.md

Controlling decision:
src/docs/trader-intelligence-v3-adr-ga0-b2-weekday-deterministic-proof-v1.md

Audit the implementation independently, piece by piece. Do not inherit the
implementation engineer's conclusions. First verify the branch, base,
merge-base, draft status, executable SHA, later docs-only SHA, and clean
worktree. Read AGENTS.md and the controlling GA0-B plans/architecture before
judging code.

Audit at minimum:

1. Registry and argument contract
   - tool identity/version and content addressing;
   - canonical weekday validation/default;
   - supported currency/time-zone constraints;
   - versioned sample, comparison, evidence, and outlier policies;
   - limited-output declarations and B1 backward compatibility.

2. Input authority
   - actual runtime verification of snapshot, dependencies, filter, dataset
     derivation, partition, registry, and normalized arguments;
   - no trust in caller-asserted types;
   - blocked/limited states preserve diagnostics and receipt truth.

3. Exact financial math
   - no binary floating-point financial arithmetic;
   - sums, expectancy, median, rates, contribution, and subtraction;
   - terminating-decimal versus exact-ratio behavior;
   - best/worst and leave-one-out calculations;
   - zero/flat/negative edge cases.

4. Population semantics
   - semantic Monday-through-Sunday order;
   - target/baseline exhaustive and disjoint membership;
   - represented-weekday baseline behavior;
   - input permutation determinism;
   - currency isolation and no conversion.

5. After-loss semantics
   - immediately preceding completed trade only;
   - owner/account/currency/session-date isolation;
   - first-trade, win, loss, and flat reset behavior;
   - canonical ordering and same-timestamp tie behavior.

6. Sample/outlier/claim policy
   - exact threshold boundaries below 5, 5-9, and 10/20;
   - strict greater-than 2/5 outlier threshold;
   - mean/median agreement;
   - leave-one-out reversal handling;
   - claim absence for limited/unstable evidence;
   - supporting and counterexample evidence.

7. Artifact graph
   - tables, cell value kinds, evidence, summaries, and exact currencies;
   - claims and counterexamples;
   - chart series derived from verified table cells;
   - diagnostics/exclusions;
   - run receipt coverage and digest/reference closure;
   - deterministic replay and no orphan evidence.

8. Shared-contract and graph-budget changes
   - B1 compatibility;
   - receipt optional-output behavior;
   - cell evidence and counterexample verification;
   - monetary versus nonmonetary series currency rules;
   - whether 65,536 nodes/16,384 keys is justified and still safely bounded.

9. Tests and adversarial gaps
   - independently rerun the focused B2 suites;
   - rerun affected B1/A2/A3 suites;
   - rerun TypeScript and architecture/private-data verifiers;
   - add or describe adversarial cases for exact threshold equality, duplicate
     identities, malformed evidence, cross-session/currency contamination,
     missing quantity/notional, and artifact tampering.

Treat startup failures, missing native dependencies, timeouts, or interrupted
commands as nonpasses. Do not rely on the implementation handoff's pass claims
without rerunning the relevant checks.

Return findings first, ordered by severity, with tight file/line references and
concrete failure scenarios. Separate validated defects from questions and
residual risks. If there are no findings, say so explicitly and list the exact
commands and SHAs audited.

Do not edit code, resolve review threads, mark the PR ready, merge, deploy, or
begin GA0-B3. Leave PR #150 draft and unmerged for the owner.
```
