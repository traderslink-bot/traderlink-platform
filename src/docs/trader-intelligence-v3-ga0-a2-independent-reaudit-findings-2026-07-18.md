# Trader Intelligence v3 GA0-A2 independent re-audit findings

Date: 2026-07-18 America/Toronto

## 1. Purpose and authority

This file records the independent re-audit findings for Trader Intelligence v3 GA0-A2 after the first remediation round.

It is an audit artifact, not implementation authority and not an acceptance decision for any later phase. Codex must read it to understand why PR #104 remains draft and what must be corrected before another independent audit.

The implementation engineer must not treat passing tests or this document as permission to merge. Every required fix must be implemented on the existing GA0-A2 branch, tested at the appropriate level, pushed to PR #104, and returned for independent re-audit.

## 2. Immutable audited target

| Item | Value |
| --- | --- |
| Repository | `traderslink-bot/traderslink-trader-improvement-system` |
| Pull request | `#104` |
| Branch | `agent/trader-intelligence-v3-ga0-a2-exact-truth` |
| Audited head | `88db72e70538e2222ae8467c5245fa4b8eb85600` |
| Accepted GA0-A1 ancestor / GA0-A2 merge base | `4f9e440116258c9548a2d13f7ea057a9075101c6` |
| Fully tested remediation implementation head | `b92b321fab7801212c82125511e58c754e594fea` |
| Verdict | `accept with required fixes` |
| Merge state required | Draft, open, unmerged |
| Later phase state | GA0-A3 must not begin |

This file is added after the audited head, so Codex must use the audited head above when reproducing the findings and use the current PR head when implementing corrections.

## 3. Executive assessment

The branch has a strong exact-truth foundation:

- canonical exact decimal strings and reduced ratios;
- strict UTC timestamps;
- deterministic NFC/LF canonical JSON;
- duplicate-key rejection;
- domain-separated SHA-256 identities;
- broker versus owner/hypothetical provenance separation;
- scoped execution ordering;
- pair-addressed relationship results;
- exact FIFO long, short, partial-fill, reversal, fee, rebate, open-position, and multi-currency behavior;
- an independently implemented BigInt reference ledger;
- executable synthetic fixtures;
- fixed-seed property testing;
- SQLite `TEXT` compatibility;
- no route, UI, AI, chart, market-data, support/resistance, hosted-user, migration, or deployment work.

GA0-A2 is not ready to merge because several remaining defects can still double-count executions, invent opening inventory, or permit accounting to use facts that no longer match their canonical digest.

## 4. Required findings

### Finding A2-R1 — High: relationship completeness is optional

**Affected code**

- `src/lib/trader-intelligence-v3/domain/accounting/analytical-pnl.ts`, audited head lines approximately 17-23.
- `src/lib/trader-intelligence-v3/domain/execution/execution-relationship-resolution.ts`, audited head relationship discovery and application paths.
- `src/lib/trader-intelligence-v3/domain/accounting/index.ts` and `fifo-position-ledger.ts`, because the raw FIFO boundary remains publicly reachable.

**Violated requirement**

No unresolved duplicate, re-export, correction, collision, possible-duplicate, or manual-review relationship may reach authoritative P/L. Only one copy of a proven exact duplicate may be retained.

**Concrete failure path**

`reconstructAnalyticalPnl` accepts a relationship array that defaults to `[]`. The resolver can detect same-digest repetition by itself, but it cannot discover every different-digest re-export, changed stable execution, possible duplicate, or manual-review relationship unless the caller supplied that pair.

A caller can therefore pass an original execution and a re-export without a relationship record and both may enter FIFO accounting. Quantity, charges, inventory, and P/L can be counted twice.

The lower-level FIFO function can also be called directly with ordered executions, bypassing relationship resolution.

**Required remediation boundary**

- Remove the empty default relationship list.
- Require a complete, branded relationship-resolution result or an exhaustive relationship-coverage receipt before reconstruction.
- Ensure relationship discovery/coverage is complete for all relevant pairs, or fail closed.
- Make the raw FIFO implementation internal, or require an opaque relationship-resolved input that cannot be forged by ordinary callers.
- Unknown or incomplete relationship coverage must return a stable blocked state.

**Required focused regressions**

- re-export without supplied pair cannot reach P/L;
- possible duplicate without supplied pair cannot reach P/L;
- changed stable execution ID without supplied pair cannot reach P/L;
- complete relationship receipt allows legitimate repeated fills and distinct executions;
- incomplete/mismatched receipt fails closed;
- direct FIFO bypass is unavailable or rejected.

---

### Finding A2-R2 — High: starting inventory is assumed flat without evidence

**Affected code**

- `src/lib/trader-intelligence-v3/domain/accounting/fifo-position-ledger.ts`, audited head `FifoLedgerInput` and initial-side handling.
- `src/lib/trader-intelligence-v3/domain/accounting/analytical-pnl.ts`, because it supplies no starting-inventory truth.

**Violated requirement**

Unknown prior inventory must fail closed. The journal must never invent cost basis or decide that the first imported buy/sell opened a new position when it may have closed inventory that existed before the imported period.

**Concrete failure path**

The ledger has no input representing whether the dataset starts flat, contains accepted prior lots, or has unknown opening inventory.

When no lot exists, an initial `SELL` with broker position effect `unknown` is interpreted as opening a short. It may actually be closing a long established before the statement period. An initial `BUY` may similarly be covering a prior short.

This invents inventory direction and can produce false P/L.

**Required remediation boundary**

Add a versioned starting-inventory contract such as:

- `proven_flat`;
- `accepted_prior_lots`;
- `unknown`.

Rules:

- `proven_flat` may reconstruct normally;
- `accepted_prior_lots` initializes exact FIFO lots and preserves their provenance;
- `unknown` returns `prior_inventory_required` before using the first execution to infer position direction.

GA0-A3 may later derive this state from coverage manifests, but GA0-A2 must require the state now.

**Required focused regressions**

- initial unknown-effect sell with `unknown` starting inventory blocks;
- initial unknown-effect buy with `unknown` starting inventory blocks;
- proven-flat initial sell opens short;
- proven-flat initial buy opens long;
- accepted prior long lot can be closed exactly;
- accepted prior short lot can be covered exactly;
- prior-lot currency/instrument/account mismatch blocks.

---

### Finding A2-R3 — High: canonical execution envelopes remain mutable after hashing

**Affected code**

- `src/lib/trader-intelligence-v3/domain/execution/canonical-execution.ts`, canonical content/envelope interfaces and builder return.
- `src/lib/trader-intelligence-v3/domain/accounting/fifo-position-ledger.ts`, which consumes `execution.content` directly.
- ordering and relationship modules, which also trust mutable envelope fields.

**Violated requirement**

A content-addressed execution must remain consistent with its canonical bytes and digest for its entire lifetime. Downstream calculations must not use mutable facts that no longer match the evidence identity.

**Concrete failure path**

After construction, a consumer can mutate:

- `execution.content.price`;
- `execution.content.quantity`;
- nested charges or source locator;
- validation state;
- `canonicalBytes` contents.

The stored digest remains unchanged. FIFO can then calculate using a different price or quantity than the canonical digest identifies.

**Required remediation boundary**

- Make execution content, validation, charges, row locators, and envelope fields deeply readonly.
- Deep-freeze runtime objects.
- Do not expose a mutable authoritative `Uint8Array`; retain immutable internal bytes or return defensive copies.
- Add an envelope-integrity verifier that canonicalizes content and verifies bytes and SHA-256 digest.
- Ordering, relationship, and accounting boundaries must accept only a verified/branded envelope or re-verify before use.

**Required focused regressions**

- mutation attempts cannot alter canonical facts;
- nested charge and locator mutation cannot alter the envelope;
- a modified byte copy cannot modify stored authority;
- forged content/digest mismatch is rejected before ordering;
- forged content/digest mismatch is rejected before relationship resolution;
- forged content/digest mismatch is rejected before FIFO.

---

### Finding A2-R4 — Medium/High: duplicate suppression ignores validation disagreement and nullable document identity

**Affected code**

- `src/lib/trader-intelligence-v3/domain/execution/execution-relationship.ts`, exact-duplicate source-location proof.
- `src/lib/trader-intelligence-v3/domain/execution/execution-relationship-resolution.ts`, deterministic retained occurrence selection.

**Violated requirement**

Suppression is allowed only when the same authoritative execution and source location are proven. Input order must not select between materially different validation outcomes.

**Concrete failure paths**

1. Validation state is outside canonical factual bytes. Two envelopes can have identical bytes/digest/source location but one may be `accepted` and another `quarantined` or `rejected`. The classifier can mark them suppressible and the resolver may retain whichever appears first.
2. `left.sourceDocumentDigest === right.sourceDocumentDigest` is true when both are `null`. A shared adapter identity plus `row_number: 1` does not prove two records came from the same physical file when neither file has a content digest.

**Required remediation boundary**

- Require equal validation state and reason codes before exact-duplicate suppression, or define a conservative deterministic validation merge that never upgrades uncertainty.
- Retained occurrence selection must not depend on input order.
- Require a non-null equal source-document digest for row-based source-location proof unless another explicit document identity contract proves the source.
- Without document proof, classify as `possible_duplicate_ambiguous` or `manual_review_required`.

**Required focused regressions**

- accepted versus quarantined identical facts are not silently suppressible;
- accepted versus rejected identical facts are not silently suppressible;
- reversing input order produces the same blocked/retained result;
- both document digests null does not prove same source;
- non-null equal document digest plus equal row and equal validation remains suppressible.

---

### Finding A2-R5 — Medium/High: canonical serialization mishandles `__proto__`

**Affected code**

- `src/lib/trader-intelligence-v3/domain/canonical/canonical-serialization.ts`, object accumulation in both canonical-value normalization and strict raw-JSON parsing.

**Violated requirement**

Canonical serialization must be lossless for accepted canonical values. A semantic key change must change canonical bytes and digest, and object parsing must not mutate prototypes.

**Concrete failure path**

The serializer and strict parser use an ordinary `{}` plus assignment:

```ts
result[key] = value;
```

For `key === "__proto__"`, JavaScript invokes special prototype behavior. A primitive value can disappear from own entries; an object value can mutate the prototype.

Thus `{}` and `{"__proto__":"x"}` can collapse to the same canonical output/digest.

**Required remediation boundary**

Use null-prototype dictionaries plus `Object.defineProperty`, or reject special property names with a stable reason code. The implementation must remain deterministic and safe for nested objects.

**Required focused regressions**

Test both direct values and strict raw JSON for:

- `__proto__` with a string;
- `__proto__` with an object;
- `__proto__` with null;
- nested `__proto__`;
- `constructor` and `prototype` behavior as negative/security controls;
- semantic digest change for accepted special keys, or stable rejection if the policy rejects them.

---

### Finding A2-R6 — Medium: unknown timestamp precision can still create economic order

**Affected code**

- `src/lib/trader-intelligence-v3/domain/canonical/canonical-timestamp.ts`, unknown precision interval.
- `src/lib/trader-intelligence-v3/domain/execution/execution-ordering.ts`, interval ordering evidence.

**Violated requirement**

Padded or unknown precision must not be treated as stronger temporal evidence than the source provides.

**Concrete failure path**

For `unknown`, the interval has a start but no end. A known timestamp interval may still be ordered before the unknown timestamp if its end is less than or equal to the unknown start. But the source’s unknown precision and rounding/truncation behavior do not prove that padded value is a safe lower bound.

**Required remediation boundary**

When either timestamp precision is `unknown`, do not use timestamp-interval evidence for meaningful order. Explicit, source-scoped broker sequence evidence may still order the pair.

**Required focused regressions**

- known second versus unknown precision remains ambiguous without sequence;
- unknown versus unknown remains ambiguous without sequence;
- scoped broker sequence can order unknown timestamps;
- digest storage order never upgrades the ambiguity.

---

### Finding A2-R7 — Medium: `row_number` permits nonnumeric values that later throw

**Affected code**

- `src/lib/trader-intelligence-v3/domain/execution/canonical-execution.ts`, source-row locator validation.
- `src/lib/trader-intelligence-v3/domain/execution/execution-ordering.ts`, `BigInt` conversion of row numbers.

**Violated requirement**

Expected invalid external values must return stable structured reason codes. Ordering must not throw because a value accepted by the canonical builder is not numeric.

**Concrete failure path**

The builder validates every row-locator value with a general identifier check, even when `kind === "row_number"`. Ordering later passes that value to `BigInt`.

A value such as `not-a-number` can therefore build and later throw during ordering.

**Required remediation boundary**

- `row_number` must use canonical nonnegative integer syntax and a declared size bound.
- Arbitrary opaque keys remain under `record_key`.
- Ordering should fail closed with a stable state if an invariant is violated rather than leaking a raw `BigInt` exception.

**Required focused regressions**

- alpha row number rejected by builder;
- negative row number rejected;
- decimal row number rejected;
- oversized row number rejected;
- valid canonical row number orders correctly;
- record key may remain opaque and is never converted with `BigInt`.

## 5. Status of the seven original first-audit threads

| Original thread | Re-audit disposition |
| --- | --- |
| Unequal-byte suppression | Satisfied narrowly. Unequal bytes are no longer suppressible. Finding A2-R4 covers different validation/source-proof cases. |
| Pairless/globally scoped relationships | Partially satisfied. Pair addressing and group scoping are improved; Finding A2-R1 covers incomplete relationship coverage and raw-FIFO bypass. |
| Unscoped ordering evidence | Satisfied. Source/broker/document/order namespace scoping is materially improved. |
| Noncanonical content returned after hashing | Satisfied at construction time. Finding A2-R3 covers post-construction mutability and integrity. |
| Metadata-only fixture catalog | Satisfied. All 35 scenarios now have executable table-driven inputs and assertions. |
| Unbounded decimal input | Satisfied. A pre-parser raw-length bound and stable failure code exist. |
| Incomplete economic equivalence | Satisfied for current accounting-relevant v1 fields. |

Do not resolve the GitHub review threads until the new fixes are independently re-audited.

## 6. Testing cadence for remediation

The purpose of this cadence is to maintain financial correctness without rerunning the slowest suites after every edit.

### 6.1 During implementation — focused tests only

After A2-R1 and A2-R4:

- execution relationship tests;
- relationship-resolution tests;
- focused reconstruction tests involving duplicates/re-exports/corrections.

After A2-R2:

- FIFO ledger tests for starting inventory and prior lots;
- focused production/reference comparisons for accepted prior lots.

After A2-R3:

- canonical execution integrity tests;
- relationship/order/FIFO rejection of forged or mutated envelopes.

After A2-R5:

- canonical serialization and digest tests only.

After A2-R6:

- execution ordering tests only.

After A2-R7:

- canonical execution and ordering tests only.

Run TypeScript at meaningful checkpoints, not after every edit.

Do not run the complete Vitest suite, all property suites, production build, or Playwright after each finding.

### 6.2 After all executable fixes — one consolidated final verification

Run once after all runtime/test changes are complete:

1. `git diff --check`
2. `npm ci` only if package or lock files changed
3. `npx tsc --noEmit --pretty false`
4. changed-path ESLint
5. `npm run verify:ti-v3:ga0-a2`
6. `npm test`
7. `npm run verify:ti-v3:architecture`
8. `npm run verify:ti-v3:private-data`
9. `npm run verify:layer2`
10. `npm run verify:layer3`
11. `npm run build`

Run Playwright E2E only if an app route, page, local server, Next configuration, browser-facing file, or E2E configuration changes. These findings should normally remain domain/test/documentation changes, so a manual E2E rerun is not required solely for them. Automatic GitHub workflows may still run.

### 6.3 Property and differential tests

Do not rerun every existing property suite after each edit.

Add focused fixed-seed properties where useful for:

- complete relationship coverage;
- deterministic retained duplicate outcome;
- starting-inventory truth;
- immutable envelope integrity.

Run all GA0-A2 property and differential suites once in the final consolidated verification.

### 6.4 Documentation-only closeout

After the executable implementation has passed the final verification, updating this audit handoff or a last-run Markdown report does not require another complete local suite.

For a documentation-only commit run only:

- `git diff --check`;
- private-data guard;
- path/SHA/test-count/command evidence validation;
- any lightweight Markdown validation already present.

Do not repeat full Vitest, build, property, differential, or E2E solely because Markdown changed.

## 7. Required continuity updates

Codex must update:

- `src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md`;
- `src/docs/trader-intelligence-v3-ga0-a2-last-run-report-2026-07-18.md`;
- `src/docs/trader-intelligence-v3-project-log.md`;
- the active GA0-A implementation status;
- the four ADRs when contracts or policies change;
- PR #104 body/comment with exact tested head, commands, counts, warnings, and remaining limitations.

The documentation must say remediation is complete as an implementation candidate, not independently accepted.

## 8. Scope boundaries

Do not implement:

- GA0-A3 corrections, manifests, eligibility, snapshots, evidence references, or query filters;
- analytics or simulations;
- charting;
- AI/model calls or prompts;
- market data, SEC, Nasdaq, FINRA, halts, or float;
- support/resistance;
- manual entry;
- AI period reflections;
- Real Coach/Whop;
- saved-data or production database migration;
- hosted identity, public users, Vercel, or deployment.

Use synthetic data only. Keep PR #104 draft and unmerged. Stop for independent re-audit after pushing the fixes.

## 9. Acceptance checklist before re-audit

- [ ] Relationship coverage is complete and cannot be omitted.
- [ ] Raw FIFO cannot bypass relationship resolution.
- [ ] Starting inventory is explicit and unknown inventory blocks.
- [ ] Canonical execution content/bytes/digest remain immutable and verifiable.
- [ ] Validation disagreement cannot be resolved by input order.
- [ ] Missing document digest cannot prove same-source duplication.
- [ ] `__proto__` cannot collapse or mutate canonical objects.
- [ ] Unknown timestamp precision cannot establish time order by itself.
- [ ] `row_number` accepts only canonical integers and cannot crash ordering.
- [ ] Focused tests pass during implementation.
- [ ] One final consolidated verification passes after all executable changes.
- [ ] No heavy suite is repeated solely for documentation-only changes.
- [ ] PR remains draft and unmerged.
- [ ] GA0-A3 has not begun.
