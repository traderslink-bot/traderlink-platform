# Trader Intelligence v3 GA0-B1 Third Independent Re-audit Findings

**Date:** 2026-07-23 America/Toronto  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Branch:** `agent/trader-intelligence-v3-ga0-b1-read-model`  
**Draft PR:** `#133`  
**Immutable original branch base and merge base:** `153eaceecfca714a6c28848b513c412ca76b8e57`  
**Original audited executable head:** `5f74202033bf8ab10a48b8cf18ede18137e73bd1`  
**Original implementation handoff head:** `11dfaaf3118b332b37f8cd7c31957cd240718220`  
**First findings head:** `527a76e4c72dfe8d65675812f4be84f3358a767c`  
**First remediation executable head:** `57d999ae86852b44095d993369d25a117086d912`  
**First remediation handoff head:** `3ad263aacc9b5d1d392a9b2b0b4d03062004d320`  
**Second findings head:** `dae005c759e4abc4919e23d7feb5b9e54973f7a0`  
**Second-remediation tested executable head:** `bb27ddfcaeffe14758d669ca72b3f4a9a06e35ed`  
**Second-remediation handoff head:** `ae430951dfb39c4974e65bfbb04258a5eb5e5fe9`  
**Verdict:** `accept with required fixes`

> This file is independent audit evidence. It does not authorize merge,
> deployment, review-thread resolution, GA0-B2, or any later slice.

---

## 1. Independently verified state

- PR #133 was open, draft, mergeable, and unmerged at the start of this
  re-audit.
- `bb27ddfcaeffe14758d669ca72b3f4a9a06e35ed` is one executable remediation
  commit directly after second findings head
  `dae005c759e4abc4919e23d7feb5b9e54973f7a0`.
- `ae430951dfb39c4974e65bfbb04258a5eb5e5fe9` is exactly one documentation-only
  child of the executable head and adds only:

  `src/docs/trader-intelligence-v3-ga0-b1-second-remediation-and-independent-reaudit-handoff-2026-07-23.md`

- The immutable merge base remains
  `153eaceecfca714a6c28848b513c412ca76b8e57` while `main` has advanced
  independently.
- All fifteen prior independent-review threads remained unresolved. Outdated
  anchors remained unresolved threads and were not treated as resolved.
- No deployment or GA0-B2 work was observed.

The findings-only commit that adds this file is not part of the audited
executable implementation.

---

## 2. Verification limitation

The independent audit runtime did not contain a checkout and could not resolve
`github.com` when a clean clone was attempted. The failure occurred before
checkout or dependency installation. Consequently:

- independent `npm ci` did not run;
- independent TypeScript, ESLint, Vitest, and verifier commands did not run;
- no local command is represented as independently passed.

This audit instead used:

- GitHub-backed immutable file and commit inspection;
- complete second-findings-to-executable file inventory;
- complete changed runtime and focused-test review;
- all unresolved review-thread state;
- executable-head and documentation-head CI evidence;
- adversarial construction analysis of public builders and verifiers.

Implementer local results remain evidence, not independent proof. The handoff
records focused B1 passes but also honestly records a non-green 21-file local
verifier, a timed-out private Git-history unit, and a non-green local GA0-A2
aggregate. Clean GitHub CI passed the broad repository and verifier stages.

---

## 3. Per-finding verdict

| Finding | Verdict | Reason |
| --- | --- | --- |
| B1-REAUD-R1 dataset derivation | **partially satisfied** | Runtime admission is replay-branded, but persisted derivation content is not itself integrity-verified. |
| B1-REAUD-R2 currency partition | **partially satisfied** | Included rows are currency partitioned, but excluded-only currencies and excluded-only accounts cannot be represented faithfully. |
| B1-REAUD-R3 exact ratio claims | **partially satisfied** | Exact ratio arithmetic exists, but a difference can relabel source metrics under an unrelated claim metric key. |
| B1-REAUD-R4 registry output graph | **partially satisfied** | Completed/limited graphs are constrained, but blocked optional graphs may include undeclared artifact classes. |
| B1-REAUD-R5 reason ledger and one outcome | **partially satisfied** | Reason provenance is aggregated, but open/blocked exclusions are not reconciled against included reconstructed rows. |
| B1-REAUD-R6 calendar/session authority | **satisfied** | NYSE policy is allowlisted, weekend sessions reject, UTC stays non-exchange, and local-year lower-bound behavior is enforced. |
| B1-REAUD-R7 strict starting-inventory re-entry | **satisfied** | Descriptor-first validation, Proxy detection, safe copies, strict fields, and adapter exception conversion are present. |

---

# 4. Required findings

## B1-THIRD-R1 — Medium: persisted derivation receipt content is not verified

**Affected file**

- `src/lib/trader-intelligence-v3/analytics/adapters/snapshot-read-model.ts`

### Failure path

`rehydrateAnalyticalDatasetDerivation` correctly replays the complete exact
source authority. It then validates that the persisted value has the expected
field names, but it compares only:

```text
persisted.derivationDigest === replayed.derivationReceipt.derivationDigest
```

It does not:

- validate the claimed dependency values or their digest domains;
- recompute the persisted derivation digest from persisted content;
- compare every persisted field to the replayed canonical receipt.

A persisted object may therefore copy the genuine replay digest while carrying
arbitrary values for its claimed dataset, snapshot, manifest, filter, policy,
inventory, adapter, derivation, or calendar fields. The function returns safe
replayed authority, so this is not a direct P/L-forgery path, but it incorrectly
accepts a corrupt or falsely labelled content-addressed artifact as genuine.

### Required remediation

- Parse and validate every persisted derivation field.
- Recompute its `analytical_dataset_derivation` digest from its complete content.
- Require exact canonical equality with the replayed receipt, not only digest
  equality.
- Return the replayed protected object only after both persisted integrity and
  replay equivalence pass.
- Add field-by-field stale/corrupt receipt regressions using the correct genuine
  digest copied onto incorrect content.

---

## B1-THIRD-R2 — High/Medium: partition authority drops excluded-only scope

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/dataset/analytical-dataset.ts`
- `src/lib/trader-intelligence-v3/analytics/dataset/analytical-partition.ts`
- evidence/table/run-context contracts and tests

### Failure path

Dataset `currencyPartitions` are derived only from included rows. The partition
builder:

- requires the selected currency to be in that included-row currency list;
- includes only exclusions whose `candidate.currency` equals that currency;
- derives `accountScope` only from included rows.

Consequences:

1. A dataset with no included rows but one exact USD exclusion has no USD
   partition and cannot produce a blocked/limited run receipt.
2. A CAD candidate that is entirely excluded disappears from partition authority
   when no CAD row is included.
3. An excluded candidate belonging to an account with no included row may be
   included in partition counts while that account is absent from `accountScope`.
4. Exclusions with `currency: null` have no explicit global/unassigned scope and
   silently disappear from every currency partition.

This prevents exact included/excluded accounting for the cases where the tool
most needs to explain why no result could be produced.

### Required remediation

Define an explicit partition-scope policy that supports:

- currencies represented by included or excluded candidates;
- excluded-only partitions;
- exact owner/account scope for included and excluded candidates;
- an explicit global/unassigned exclusion policy rather than silent omission;
- blocked/limited runs with zero included rows;
- exact partition counts and evidence membership.

Add canonical owner/account/instrument scope to exclusion authority where needed.
Do not assign a currency or account by guesswork.

### Required regressions

- one USD exclusion and no rows yields a verified USD blocked partition;
- an excluded-only CAD candidate remains visible in a CAD partition;
- excluded-only account identity appears in exact account scope;
- null-currency exclusions are explicitly global/unassigned or block partition
  construction according to a versioned policy;
- no exclusion silently disappears;
- partition counts reconcile to the selected scope.

---

## B1-THIRD-R3 — High/Medium: difference claims can relabel another metric

**Affected file**

- `src/lib/trader-intelligence-v3/analytics/contracts/table-claim-series.ts`

### Failure path

The exact decimal/ratio subtraction implementation is mathematically exact.
However, the difference path does not require either source cell's `metricKey`
to equal the claim's `metricKey`.

`subtractMetricExactly` receives the caller-selected claim metric key and builds
a new effect using that key. Two compatible `gross_pnl` cells can therefore be
subtracted and published as a `net_pnl`, `expectancy`, or other unrelated claim
as long as unit and currency match.

The single-cell path rejects a metric-key mismatch, but the difference path
silently rewrites it.

### Required remediation

Choose and document one strict policy:

1. both operands must have the same exact metric key and that key must equal the
   claim metric key; or
2. an explicit content-addressed derived-metric policy must name the source
   metric keys and the resulting semantic metric key.

Do not let the claim's free string relabel source facts.

### Required regressions

- gross-P/L cells labelled as net P/L reject;
- win-rate cells labelled as expectancy reject;
- target and comparison metric-key mismatch rejects;
- valid decimal and ratio differences with matching semantic keys pass;
- derived-metric policy, when used, is explicit and content addressed.

---

## B1-THIRD-R4 — Medium/High: blocked optional graphs allow undeclared artifacts

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/contracts/run-receipt.ts`
- tool-registry contract and focused tests

### Failure path

Completed and limited runs enforce declared artifact classes. For a blocked run:

- `diagnostics_only` correctly prohibits all artifacts;
- `declared_artifacts_optional` performs no declared-versus-undeclared class
  check.

A registry entry that declares only `exact_table_v1` may therefore produce a
blocked receipt containing claims, series, or evidence bundles that the registry
did not declare.

### Required remediation

For `declared_artifacts_optional`:

- declared classes may be present or absent;
- undeclared classes must always be absent;
- every supplied artifact must remain internally referenced and verified;
- blocked diagnostics remain mandatory;
- contradictory completed/eligible semantics must fail.

Also add an explicit test for an eligibility-blocked or zero-included partition
so blocked receipt semantics are proven rather than only diagnostic-injected.

---

## B1-THIRD-R5 — High/Medium: open/blocked overlap can still create two outcomes

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/adapters/snapshot-read-model.ts`
- dataset exclusion and candidate-accounting tests

### Failure path

Manifest exclusions are promoted to a reconstructed round-trip identity before
reason aggregation. Open-position and blocked-reconstruction exclusions are not:

- they retain `semanticRoundTripKey: null`;
- they are grouped by execution-set or candidate identity;
- the included-row removal step removes only exclusions carrying a non-null
  semantic round-trip key.

If an accepted manifest or reconstruction authority represents an execution in
both a completed reconstructed round trip and an open/blocked candidate, the
result may contain:

- one included analytical row; and
- one open/blocked exclusion for the same underlying execution evidence.

The dataset then counts two outcomes for one semantic candidate. Upstream
manifest validation proves open executions are accepted but does not prove they
are disjoint from reconstructed closed evidence.

### Required remediation

Before final accounting:

- resolve every open-position and blocked-state execution set against reconstructed
  round trips;
- promote overlapping evidence to one semantic candidate identity;
- apply the versioned reason precedence/ledger policy;
- retain all provenance;
- emit exactly one included or excluded outcome;
- fail closed when overlap mapping is ambiguous.

### Required regressions

- open-position evidence overlapping a closed round trip yields one excluded
  semantic candidate, not one row plus one exclusion;
- blocked-state evidence overlapping a round trip follows documented precedence;
- partial execution overlap fails closed when semantic mapping is ambiguous;
- separate open and closed candidates remain separate;
- input ordering does not change identity, primary reason, or counts.

---

# 5. Findings independently satisfied

## B1-REAUD-R6 — Satisfied

The re-audit found that:

- UTC produces civil date/weekday with `session: not_applicable`;
- New York exchange classification requires the exact verified date receipt;
- the B1 adapter and session policy require `ti_v3_nyse_calendar:v1`;
- regular/early-close weekend evidence is rejected;
- holidays and missing evidence fail closed;
- early-close boundaries come from evidence;
- the lower bound uses resolved New York local year;
- pre-2007 New York values fail closed.

## B1-REAUD-R7 — Satisfied

Starting-inventory root, ledger, lot, charge, and locator records pass through the
shared descriptor-first exact-record boundary. The boundary rejects unknown
fields, symbols, accessors, hidden state, invalid prototypes, sparse arrays,
cycles, proxies, and bounded-resource violations and returns safe copies.
Unexpected read-model verification exceptions are converted into a stable
unverified-authority failure.

---

# 6. Test and CI evidence

## Implementer local evidence

The handoff reports:

- GA0-B1 analytical dataset: 13/13 passed;
- GA0-B1 proof contracts: 17/17 passed;
- direct starting-inventory cluster: 83/83 passed;
- TypeScript: passed with `--pretty false`;
- changed-path ESLint: passed over 15 TypeScript files;
- architecture and standalone private-data guards: passed.

It also truthfully records:

- private Git-history unit: timed out at the unchanged 15-second limit;
- consolidated 21-file verifier: 373/378, non-green;
- local `verify:ti-v3:ga0-a2`: 306/308, non-green because of the linked native
  SQLite binding;
- affected SQLite tests passed in a separate compatible dependency tree.

These are implementer results, not independent local evidence.

## GitHub CI

Executable head `bb27ddfcaeffe14758d669ca72b3f4a9a06e35ed`:

- workflow `CI`;
- run `30048702298`;
- job `89345746261` (`test-and-verify`);
- conclusion `success`;
- successful clean checkout, dependency install, repository tests, GA0-A2 exact
  truth, architecture, private-data, Layer 2, and Layer 3.

Documentation head `ae430951dfb39c4974e65bfbb04258a5eb5e5fe9`:

- workflow `CI`;
- run `30049216792`;
- job `89347337228` (`test-and-verify`);
- conclusion `success`;
- the same stages completed successfully.

Passing CI does not exercise the five adversarial paths above.

---

# 7. Scope result

The second remediation did not introduce:

- an executable weekday tool;
- a daily-stop simulation;
- a general executable runner;
- sample or conclusion policy;
- AI/model calls, prompts, or natural-language parsing;
- query UI, React, routes, pages, or chart rendering;
- market candles, VWAP, setup/catalyst, or support/resistance work;
- coaching, manual entry, reflections, Real Coach, Whop, or Academy work;
- hosted/public-user behavior;
- schema or owner-data migration;
- deployment;
- GA0-B2 or a later slice.

---

# 8. Required stop boundary

- Keep PR #133 open, draft, and unmerged.
- Do not resolve any original or later independent-review thread.
- Fix only B1-THIRD-R1 through B1-THIRD-R5.
- Preserve independently satisfied R6 and R7 behavior.
- Use focused tests during implementation.
- Run repository-wide TypeScript once near the final executable checkpoint.
- Let clean GitHub CI supply broad-suite evidence.
- Do not deploy or begin GA0-B2.
- End the Codex remediation run with a detailed Markdown handoff and a complete
  ready-to-paste independent re-auditor prompt.
