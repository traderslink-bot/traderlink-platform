# Trader Intelligence v3 GA0-A3 independent audit findings

Date: 2026-07-19 America/Toronto

## 1. Purpose

This file records the independent audit findings for Trader Intelligence v3 GA0-A3 on draft PR #106.

The verdict is:

```text
accept with required fixes
```

This is an audit artifact. It is not an implementation handoff, not permission to merge, and not authorization to begin GA0-B.

The implementation engineer must read this file completely, remediate every required finding on the existing GA0-A3 branch, document the final implementation accurately, keep PR #106 draft and unmerged, and stop for independent re-audit.

## 2. Immutable audited target

| Item | Value |
| --- | --- |
| Repository | `traderslink-bot/traderslink-trader-improvement-system` |
| Pull request | `#106` |
| Branch | `agent/trader-intelligence-v3-ga0-a3-manifests` |
| Accepted GA0-A2 base | `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a` |
| Audited executable head | `50d1d9c11883bf6777a0bf9929aef35ebdf2d7d6` |
| Audited documentation-only head | `865ff5d5dc2cfbe396474b349811e7bd7151916a` |
| Verdict | `accept with required fixes` |
| Required PR state | Draft, open, unmerged |
| Later phase | GA0-B must not begin |

The audited documentation-only head contains no executable changes after the executable head.

## 3. What the implementation got right

The branch remains correctly scoped to GA0-A3 and adds useful foundations:

- append-only correction records and cutoff replay;
- lifecycle and review-disposition separation;
- retrospective/open-position policy;
- content-addressed dataset manifests;
- capability eligibility contracts;
- immutable snapshot and evidence-reference contracts;
- canonical date/time/filter contracts;
- runtime-validation helpers;
- stale/invalidation states;
- WAL-consistent local SQLite backup and isolated restore;
- narrow parser hardening;
- focused synthetic tests;
- no analytics, AI, charting, market enrichment, public-user, hosted, migration, or deployment work.

Do not remove or weaken these boundaries while fixing the remaining defects.

## 4. Required findings

### A3-R1 — High: correction replay does not prove replacement execution existence

**Affected files**

- `src/lib/trader-intelligence-v3/domain/temporal/correction-record.ts`
- correction tests and ADR

**Violated requirement**

Correction replay may activate only verified canonical executions that exist in an available execution catalog. The base-active set and the available replacement catalog are different concepts.

**Concrete failure path**

`applyCorrectionSet` receives one `executionDigests` array and treats it as both the active set and the target lookup universe. A `replace` correction can name any syntactically valid replacement digest. The algorithm then adds that digest to the active set without proving that a canonical execution record exists for it.

Adding replacements to the initial active set is not a valid workaround because they would appear active before the correction cutoff.

**Required remediation boundary**

Introduce explicit inputs such as:

- `baseActiveExecutionDigests` or verified base occurrences;
- `availableExecutionCatalog` containing verified canonical execution identities;
- correction records;
- correction cutoff.

Requirements:

- every target resolves to exactly one base/current lineage execution;
- every replacement resolves to exactly one verified available execution;
- replacements are inactive until their correction applies;
- unknown, duplicate, or ambiguous replacement identities fail closed;
- result records the exact base set, available catalog identity, applied corrections, and final active set.

**Focused regressions**

- replacement digest absent from catalog blocks;
- replacement digest duplicated/ambiguous blocks;
- valid replacement remains inactive before cutoff;
- valid replacement becomes active at/after cutoff;
- input permutation does not change result.

---

### A3-R2 — High: superseding correction chains can cross targets

**Affected files**

- `src/lib/trader-intelligence-v3/domain/temporal/correction-record.ts`
- correction lineage tests and ADR

**Violated requirement**

A superseding correction must belong to the same factual correction lineage. A child correction may not declare target C while mutating the chain rooted at A merely because it references the parent correction key.

**Concrete failure path**

A child record can target execution C but set `supersedesCorrectionKey` to a correction of execution A. Target existence checks pass for both A and C. During replay, the child target is ignored and the algorithm follows the parent key, modifying A's replacement chain.

**Required remediation boundary**

Define a versioned lineage rule. For example, a child must prove one of:

- the same root execution identity as the parent lineage;
- the parent's active replacement identity;
- another explicit immutable lineage identifier.

Reject:

- cross-target supersession;
- child target incompatible with parent action/result;
- duplicate lineage roots;
- branching children unless the policy explicitly supports and orders them;
- correction after deletion.

**Focused regressions**

- A->B followed by child targeting C blocks;
- A->B followed by valid B->C lineage succeeds when policy permits;
- correction after deletion blocks;
- duplicate children block;
- cycle and input permutation remain deterministic.

---

### A3-R3 — High: capability eligibility is self-authorized

**Affected files**

- `src/lib/trader-intelligence-v3/domain/eligibility/capability-eligibility.ts`
- `src/lib/trader-intelligence-v3/domain/snapshot/analysis-snapshot.ts`
- eligibility/snapshot tests and ADR

**Violated requirement**

Authoritative eligibility must be derived from a verified dataset manifest, retrospective policy, correction state, and analysis cutoff. A caller must not be able to register arbitrary all-eligible results for an incomplete manifest.

**Concrete failure path**

`buildEligibilitySet` accepts caller-supplied capability states and registers the set as verified. `buildAnalysisSnapshot` then accepts that verified object when only manifest digest and cutoff match.

A caller can therefore mark coaching, AI explanation, or closed-trade analytics eligible despite manifest gaps or incomplete prior inventory.

The official calculator also ignores declared incomplete states including:

- `partial_account_period`;
- `multiple_accounts_partial`.

**Required remediation boundary**

- Make arbitrary eligibility construction internal/non-authoritative.
- Produce authoritative eligibility only through a calculator taking verified manifest, policy, correction result, cutoff, and required evidence.
- Runtime-brand calculated eligibility separately.
- Require exactly one result for every supported capability.
- Reject duplicate or missing capability results.
- Treat all incomplete coverage states consistently.
- Snapshot accepts only authoritative eligibility calculated for its exact dependencies.

**Focused regressions**

- forged all-eligible set rejected;
- partial account period limits/blocks appropriate capabilities;
- multiple-account partial coverage limits/blocks appropriate capabilities;
- one capability may remain eligible while another is blocked;
- missing/duplicate capability result rejected;
- deterministic reasons under input permutation.

---

### A3-R4 — High/Medium: snapshot enrichment identity is unverified

**Affected files**

- `src/lib/trader-intelligence-v3/domain/snapshot/analysis-snapshot.ts`
- snapshot tests and ADR

**Violated requirement**

A snapshot may bind only enrichment identity verified for the same manifest and analysis cutoff.

**Concrete failure path**

The snapshot accepts any syntactically valid `enrichment_set` digest. A digest created for another manifest/cutoff can be mixed into the snapshot.

**Required remediation boundary**

Until enrichment exists:

- define a canonical empty-enrichment-set content model;
- recompute its digest from the current manifest and analysis cutoff;
- accept only that exact verified empty set.

Later:

- accept a verified enrichment-set object;
- require manifest/cutoff/policy compatibility;
- include its verified digest in snapshot identity.

**Focused regressions**

- foreign enrichment digest rejected;
- wrong cutoff rejected;
- correct empty enrichment accepted;
- caller-provided lookalike object rejected.

---

### A3-R5 — High/Medium: evidence references are not built from verified snapshot dependencies

**Affected files**

- `src/lib/trader-intelligence-v3/domain/evidence/evidence-reference.ts`
- evidence/snapshot tests and ADR

**Violated requirement**

A verified evidence reference must be derived from one verified snapshot and must match its filter, cutoff, policy, correction, manifest, and subject scope.

**Concrete failure path**

The evidence builder accepts raw digest strings. `assertEvidenceScope` checks only manifest and snapshot digests. A reference may carry a filter digest or analysis cutoff from another run and still pass.

**Required remediation boundary**

- Build evidence from a verified snapshot object, not independent raw strings.
- Verify filter digest and analysis cutoff exactly match the snapshot.
- Verify policy and correction identity are members of the snapshot/manifest dependency set.
- Validate subject-specific identity:
  - execution occurrence exists in manifest;
  - correction exists in selected correction set;
  - round trip is produced by the snapshot's reconstruction authority;
  - filter evidence matches the snapshot filter.
- Runtime-brand evidence references produced by this verified path.

**Focused regressions**

- foreign filter rejected;
- foreign cutoff rejected;
- foreign correction/policy rejected;
- execution not in manifest rejected;
- valid evidence remains stable across persistence-ID-only reimport.

---

### A3-R6 — Medium/High: dataset manifest referential integrity is incomplete

**Affected files**

- `src/lib/trader-intelligence-v3/domain/manifest/dataset-manifest.ts`
- manifest, eligibility, snapshot tests and ADR

**Violated requirement**

A content-addressed verified manifest must be internally coherent, unique, and referentially complete.

**Concrete failure paths**

Current construction can permit:

- open-position execution digests absent from accepted executions;
- duplicate source-document entries;
- duplicate policy entries;
- duplicate prior-inventory ledger entries;
- duplicate open-position ledger entries;
- accepted executions with empty source coverage;
- accepted executions with empty currency coverage;
- complete coverage state coexisting with declared gaps/partial states;
- inconsistent owner/account/currency scope.

**Required remediation boundary**

Before hashing, enforce:

- unique semantic source identity/document digest entries;
- unique policy identity/version entries;
- unique ledger keys;
- open-position executions are a subset of active accepted executions;
- prior inventory and open positions match owner/account/instrument/currency scope;
- correction digests correspond to the selected correction result;
- nonempty executions require nonempty source and currency coverage;
- complete coverage cannot coexist with gaps/overlap/partial/unknown states;
- statement periods, gaps, overlaps, and exclusions are noncontradictory.

**Focused regressions**

- foreign open-position execution rejected;
- duplicate source/policy/ledger entries rejected;
- accepted executions with no source/currency rejected;
- complete plus gap/partial state rejected;
- equivalent persistence-ID changes preserve digest;
- each factual dimension changes digest.

---

### A3-R7 — Medium/High: canonical filter requested range is not bound to resolved range

**Affected files**

- `src/lib/trader-intelligence-v3/domain/query/canonical-filter.ts`
- filter tests and ADR

**Violated requirement**

The range displayed to the owner/AI and the UTC range executed by future tools must be the same verified resolution.

**Concrete failure path**

Requested dates, timezone, calendar basis, boundaries, relative anchor, and resolved UTC timestamps are validated independently. A filter can claim July 1-2 while carrying a July 10-11 execution range.

**Required remediation boundary**

Create a verified date-resolution receipt from an injected resolver containing:

- requested start/end;
- date/time/calendar basis;
- timezone;
- inclusivity/exclusivity;
- relative anchor and fixed clock;
- resolved absolute UTC range;
- calendar policy/version;
- early-close/holiday/session evidence where applicable.

Canonical filter construction must consume and verify this receipt.

For deterministic UTC calendar-day ranges, direct recomputation is acceptable.

**Focused regressions**

- mismatched requested/resolved range rejected;
- wrong boundary semantics rejected;
- wrong timezone receipt rejected;
- relative anchor mismatch rejected;
- fixed-clock relative ranges deterministic;
- DST, holiday, and early-close cases use explicit resolver evidence.

---

### A3-R8 — Medium: persisted JSON permits duplicate keys

**Affected files**

- `src/lib/trader-intelligence-v3/domain/foundation/payload-envelope.ts`
- runtime-validation tests

**Violated requirement**

Persisted and adapter/tool authority must not use last-value-wins JSON semantics for duplicate keys.

**Concrete failure path**

Ordinary `JSON.parse` silently collapses duplicate keys before validation.

**Required remediation boundary**

- Parse through the accepted strict duplicate-key parser.
- Reject raw and normalized duplicate keys.
- Then validate the payload envelope.
- Apply input-size limits before parsing.

**Focused regressions**

- duplicate `payloadKind` rejected;
- nested duplicate key rejected;
- Unicode-normalized duplicate key rejected;
- ordinary valid JSON accepted.

---

### A3-R9 — Medium: shared unknown-input record validation can invoke accessors or proxy traps

**Affected files**

- `src/lib/trader-intelligence-v3/domain/foundation/runtime-validation.ts`
- every new builder relying on it
- runtime-validator negative corpus

**Violated requirement**

Expected malformed runtime input must return structured failures. Validation must not invoke arbitrary getters, allow stateful reads, or leak proxy exceptions.

**Concrete failure path**

`Object.getPrototypeOf`, `Object.keys`, and downstream direct property reads can trigger proxy traps or getters. Raw exceptions or nondeterministic values can escape.

**Required remediation boundary**

- inspect descriptors before reading values;
- reject getters/setters without invocation;
- catch `getPrototypeOf`, `ownKeys`, descriptor, and other proxy failures;
- define symbol/nonenumerable policy;
- copy accepted data into a safe null-prototype record;
- enforce depth/node/key/string/aggregate limits or reuse the accepted canonical validation boundary;
- return stable codes without raw values.

**Focused regressions**

- throwing getter rejected without invocation;
- stateful getter rejected;
- proxy throwing on prototype/keys/descriptors returns stable failure;
- symbol/nonenumerable policy tested;
- valid null-prototype object accepted.

---

### A3-R10 — Medium: parser limits report failure but continue allocating/scanning

**Affected files**

- `src/lib/trader-intelligence-v3/ingestion/parser-hardening.ts`
- broker import integration and parser tests

**Violated requirement**

Declared payload and cell limits must actually bound CPU and memory before expensive parsing work.

**Concrete failure path**

Oversized input records an issue but continues delimiter detection and full row/cell allocation. Oversized cells continue growing after the threshold.

**Required remediation boundary**

- return immediately on payload-size overflow;
- avoid creating full UTF-8 copies solely to discover an already excessive string;
- stop/cap parsing immediately on cell overflow;
- preserve fail-closed issue codes;
- retain existing sectioned-IBKR compatibility.

**Focused regressions**

- oversized payload exits before row parsing;
- oversized cell stops growth/work;
- normal and sectioned IBKR files remain accepted;
- malformed quotes/width/delimiter failures remain correct.

## 5. Verification gap

The implementer ran focused GA0-A3 tests, TypeScript, changed-path ESLint, architecture, and private-data checks.

Current-head GitHub CI ran the full repository test suite plus Layer 2 and Layer 3 successfully.

However, neither local verification nor current CI ran a production build. The CI workflow currently has no build step.

After remediation, run the production build exactly once, preferably in GitHub CI or once locally near the final executable checkpoint. Do not run it after every edit or after documentation-only changes.

## 6. Efficient testing cadence

The owner explicitly requested that slow checks not be repeated after every module.

### During development

Run only focused tests for the current area:

- A3-R1/R2: correction replay and lineage tests;
- A3-R3: eligibility and snapshot tests;
- A3-R4/R5: snapshot/enrichment/evidence tests;
- A3-R6: manifest referential-integrity tests;
- A3-R7: filter/date-resolution tests;
- A3-R8/R9: runtime-validation and persisted-envelope negative tests;
- A3-R10: parser hardening plus existing broker-parser compatibility tests.

Do not run repository-wide TypeScript after each module.

Run `npx tsc --noEmit --pretty false` once near the end of all executable remediation changes.

Do not run local `npm test` unless a focused failure demonstrates a real broad regression risk.

Do not run Playwright because no browser-facing code should change.

### Final executable checkpoint

Run once after all executable changes:

1. `git diff --check`
2. `npm ci` only if package or lock files changed
3. `npx tsc --noEmit --pretty false`
4. changed-path ESLint
5. one GA0-A3 focused verifier including all GA0-A3 and adjacent parser tests
6. architecture guard
7. private-data guard
8. `npm run build` once, unless GitHub CI is updated to run it on the executable head

Let GitHub CI run the full repository suite and Layer 2/3.

### Documentation-only closeout

A final Markdown-only handoff commit does not require repeating Vitest, TypeScript, build, Layer 2/3, or Playwright.

Run only lightweight documentation-head checks and clearly distinguish the tested executable head from the documentation head.

## 7. Required remediation handoff

After executable fixes are complete, Codex must create:

`src/docs/trader-intelligence-v3-ga0-a3-remediation-and-independent-reaudit-handoff-2026-07-19.md`

The handoff must include:

- repository, branch, PR, base, executable head, documentation-only head;
- exact A3-R1 through A3-R10 implementation map;
- every changed file and purpose;
- corrected contracts and ADR decisions;
- focused test commands/results;
- one final TypeScript result;
- one final build result or exact GitHub build evidence;
- GitHub CI state;
- commands deliberately not run;
- intermediate failed attempts and their corrections;
- known limitations;
- confirmation no GA0-B, analytics, AI, charts, support/resistance, public-user, migration, or deployment work entered the branch;
- ready-to-paste independent re-auditor prompt.

The handoff is evidence supplied by the implementer, not proof and not an acceptance decision.

## 8. Scope restrictions

Do not implement:

- GA0-B analytics;
- AI/model calls, prompts, embeddings, or natural-language parsing;
- query UI;
- charts or reports;
- coaching, simulations, setup classification, or support/resistance;
- manual entry, reflections, Real Coach, or Whop;
- production migrations;
- public/hosted users;
- deployment;
- unrelated local privacy/security expansion.

Use synthetic data only.

## 9. Completion checklist

- [ ] Replacement execution must exist in a verified catalog.
- [ ] Correction supersession cannot cross factual lineages.
- [ ] Eligibility cannot be self-asserted.
- [ ] All incomplete coverage states affect eligibility correctly.
- [ ] Snapshot enrichment is manifest/cutoff verified.
- [ ] Evidence references are derived from a verified snapshot.
- [ ] Manifest referential integrity is complete.
- [ ] Requested and resolved date ranges are cryptographically/semantically bound.
- [ ] Persisted JSON rejects duplicate keys.
- [ ] Unknown-input validation rejects accessors/proxies safely.
- [ ] Parser limits actually stop work.
- [ ] Focused tests pass.
- [ ] TypeScript runs once near the end.
- [ ] Production build runs once.
- [ ] GitHub CI is recorded separately.
- [ ] Detailed remediation handoff exists.
- [ ] PR #106 remains draft and unmerged.
- [ ] GA0-B has not begun.
