# Trader Intelligence v3 GA0-A2 post-second-remediation independent re-audit findings

Date: 2026-07-18 America/Toronto

## 1. Purpose

This file records the independent GA0-A2 re-audit performed after the second remediation round on PR #104.

The verdict is:

```text
accept with required fixes
```

This document exists so the implementation engineer can read one stable repository artifact containing:

- the immutable implementation that was audited;
- the remaining defects;
- why each defect matters to financial truth;
- the permitted remediation boundary;
- focused regression requirements;
- the reduced testing cadence requested by the owner.

This file is an audit artifact. It is not permission to merge, not an architecture replacement, and not authorization to begin GA0-A3.

## 2. Immutable audited target

| Item | Value |
| --- | --- |
| Repository | `traderslink-bot/traderslink-trader-improvement-system` |
| Pull request | `#104` |
| Branch | `agent/trader-intelligence-v3-ga0-a2-exact-truth` |
| Audited PR head | `5a7cd1d50d229ce4ea90b4f9e3802f25a6fd492d` |
| Fully tested executable ancestor | `9721a2707d936987f3b0e116226dd20de400cf58` |
| Accepted GA0-A1 ancestor / GA0-A2 merge base | `4f9e440116258c9548a2d13f7ea057a9075101c6` |
| Verdict | `accept with required fixes` |
| Required PR state | Draft, open, unmerged |
| Later-phase state | GA0-A3 must remain blocked |

The audited head contained one documentation-only commit after the fully tested executable ancestor. No executable file changed between `9721a270...` and `5a7cd1d...`.

This audit file is committed after the audited head. Codex must reproduce findings against `5a7cd1d...` and implement fixes on the current PR branch head.

## 3. What the second remediation fixed successfully

The following earlier findings are materially corrected:

- relationship records are pair-addressed and grouped;
- starting inventory is explicit rather than silently assumed;
- canonical execution facts are frozen and integrity-checked at key boundaries;
- duplicate suppression requires equal bytes, validation, document identity, and row evidence;
- canonical dictionaries use null prototypes and preserve `__proto__` safely;
- unknown timestamp precision no longer contributes timestamp interval order;
- `row_number` is a bounded canonical integer;
- all 35 required synthetic scenarios are executable;
- exact decimal raw input has a pre-parser length bound;
- economic-equivalence comparison includes current v1 accounting-relevant fields.

These corrections remain part of the accepted remediation direction. Do not remove or weaken them while addressing the remaining findings.

## 4. Remaining required findings

### A2-R8 — High: FIFO trusts a forgeable ordering object

**Affected files**

- `src/lib/trader-intelligence-v3/domain/accounting/fifo-position-ledger.ts`
- `src/lib/trader-intelligence-v3/domain/execution/execution-ordering.ts`
- `src/lib/trader-intelligence-v3/domain/accounting/analytical-pnl.ts`
- `src/lib/trader-intelligence-v3/domain/accounting/index.ts`

**Violated requirement**

Authoritative FIFO must consume only:

- verified canonical executions;
- complete relationship resolution;
- an authentic meaningful-order result computed from those exact retained executions.

A caller must not be able to hand-construct a structurally valid object that changes economic order or omits executions.

**Concrete failure path**

`FifoLedgerInput.ordering` is a public structural `CanonicalExecutionOrderingResult`. Relationship and starting-inventory contracts have runtime opacity, but ordering does not.

The ledger validates only the digest multiset in `storageOrderedExecutions`, then calculates from the separate `economicallyOrderedExecutions` array.

A caller can therefore retain the valid storage array while supplying an economic array that:

- reverses two FIFO entry lots;
- omits an execution;
- duplicates an execution;
- substitutes a different envelope;
- is empty.

For two entry lots at different prices followed by a partial exit, reversing the economic array changes realized FIFO P/L while the storage-digest check still passes.

An empty economic array can return a completed empty result despite retained executions.

**Required remediation boundary**

Choose one of these safe designs:

1. remove ordering from the public FIFO input and recompute it internally from the relationship resolver's retained group; or
2. create an immutable opaque ordering receipt with a private runtime brand/WeakSet registration and verify both storage and economic arrays against the exact verified execution occurrence set.

Additional requirements:

- raw FIFO must not accept a hand-constructed ordering object;
- every economic execution must pass envelope integrity verification;
- storage and economic arrays must contain the same occurrence multiset;
- economic ordering must be the actual result produced by the ordering engine;
- empty economic order with retained executions must fail closed;
- the authoritative raw FIFO function should be internal or require an opaque accounting-ready input.

**Focused regression requirements**

- forged reversed economic array is rejected;
- forged empty economic array is rejected;
- forged omitted execution is rejected;
- forged duplicated execution is rejected;
- forged substituted execution is rejected;
- modified envelope in economic array is rejected;
- genuine opaque order succeeds;
- order recomputation produces the same result independent of caller array order.

---

### A2-R9 — High: an explicit correction contaminates unrelated execution pairs

**Affected files**

- `src/lib/trader-intelligence-v3/domain/execution/execution-relationship.ts`
- `src/lib/trader-intelligence-v3/domain/execution/execution-relationship-resolution.ts`
- `src/lib/trader-intelligence-v3/domain/accounting/analytical-pnl.ts`

**Violated requirement**

A correction or bust must block only the affected execution/ledger group. It must not create a relationship with every unrelated execution in the dataset.

**Concrete failure path**

The relationship classifier returns `broker_correction_or_bust` when either side has a correction state/reference before proving that the pair shares:

- stable broker execution identity;
- a matching correction/bust reference;
- broker/account/source identity;
- another explicit correction link.

The resolver compares every relevant pair. A correction record for instrument A can therefore classify against an unrelated ordinary execution for instrument B. When group identities differ, the resolver records group mismatch and blocks both groups.

One correction can consequently block unrelated tickers or currencies.

**Required remediation boundary**

Separate two concepts:

1. intrinsic unresolved correction state on one execution, which blocks only that execution's own ledger group;
2. pair relationship evidence connecting an original and correction/bust record.

A pair may be classified as `broker_correction_or_bust` only when explicit identity/reference evidence links the two records.

Unrelated records must remain distinct and unaffected.

**Focused regression requirements**

- correction in instrument A does not block instrument B;
- correction in USD does not block unrelated CAD ledger;
- correction reference links original and replacement in the same group;
- unresolvable correction state blocks only its own group;
- correction with unrelated stable execution ID does not create cross-group relationship;
- bust reference behavior follows the same scoping rule.

---

### A2-R10 — High: accepted prior inventory remains under-specified for exact FIFO authority

**Affected files**

- `src/lib/trader-intelligence-v3/domain/accounting/starting-inventory.ts`
- `src/lib/trader-intelligence-v3/domain/accounting/fifo-position-ledger.ts`
- `src/lib/trader-intelligence-v3/domain/accounting/analytical-pnl.ts`
- `src/lib/trader-intelligence-v3/testing/reference/fifo-reference-ledger.ts`
- affected ADR and tests

**Violated requirement**

Accepted prior inventory must be exact, nonduplicative, ordered for FIFO, complete enough to calculate the claimed net P/L, and disjoint from current-period executions.

Open starting inventory must remain visible even when there are no current executions.

**Concrete failure paths**

#### A. Caller-controlled prior-lot order

Prior lots contain no acquisition timestamp, FIFO ordinal, or other canonical sequence evidence. FIFO consumes the array in caller order.

Example:

```text
Lot A: 10 at 1
Lot B: 10 at 2
Current sale: 10 at 3
```

`[A, B]` realizes 20; `[B, A]` realizes 10. Both arrays currently satisfy the contract.

#### B. Duplicate prior lots

The builder does not reject duplicate lot IDs or duplicate source execution digests. The same lot can be supplied twice and double opening inventory.

#### C. Prior/current overlap

A prior lot's source execution digest may also appear among current executions. That execution can seed inventory and be processed again.

#### D. Prior entry fees and adjusted basis are unspecified

Prior lots carry price but no signed entry charges and no explicit declaration that the supplied price is fee-adjusted basis. A closed trade can therefore report net analytical P/L that omits known prior entry commission.

#### E. Starting-only open inventory disappears

Group enumeration is driven by current executions/relationship blocks. Accepted prior inventory with no current executions may produce no ledger. Raw FIFO can also return before loading prior lots when the economic execution array is empty.

#### F. As-of boundary is absent

The contract does not state the timestamp/cutoff at which prior inventory is valid relative to current execution inputs.

**Required remediation boundary**

Add a versioned accepted-prior-inventory contract that includes:

- a canonical as-of timestamp/cutoff;
- canonical FIFO ordering evidence for each lot, such as acquisition timestamp plus tie-break evidence or a validated `fifoOrdinal`;
- unique lot ID;
- unique source execution identity/digest;
- disjointness from the current execution occurrence set;
- exact quantity and price/basis;
- explicit prior signed charges or a declared fee-adjusted-basis policy;
- a coverage/limitation state when prior entry charges are unavailable;
- exact owner/account/instrument/currency matching.

Rules:

- ambiguous prior-lot FIFO order fails closed;
- duplicate lots fail closed;
- overlap with current executions fails closed;
- incomplete prior charge coverage must not be presented as complete net analytical P/L;
- starting-only accepted open inventory returns a ledger with exact open lots and quantity;
- the independent reference implementation must enforce the same policy independently.

**Focused regression requirements**

- reversing prior-lot input array cannot change result;
- canonical FIFO ordinal/order determines partial-exit P/L;
- duplicate lot ID rejected;
- duplicate source execution digest rejected;
- current/prior execution overlap rejected;
- prior charge included in net analytical P/L;
- missing prior charge coverage returns limitation/blocked state according to ADR;
- starting-only long inventory appears;
- starting-only short inventory appears;
- as-of violation blocks;
- prior lot owner/account/instrument/currency mismatch blocks.

---

### A2-R11 — Medium/High: exhaustive relationship coverage is materialized quadratically

**Affected files**

- `src/lib/trader-intelligence-v3/domain/execution/execution-relationship-resolution.ts`
- relationship-coverage property tests
- audit/report documentation

**Violated requirement**

Initial large CSV imports must be processable without quadratic memory amplification. Logical completeness must be proved without storing every unrelated pair.

**Concrete failure path**

The current implementation classifies and stores one full receipt for every unordered pair:

```text
n * (n - 1) / 2
```

Examples:

- 5,000 executions -> 12,497,500 pair receipts;
- 10,000 executions -> 49,995,000 pair receipts;
- 30,000 executions -> 449,985,000 pair receipts.

Each receipt carries indexes, classification, reason arrays, evidence arrays, and frozen objects. This can exhaust memory or make an initial import impractically slow.

The existing property test covers only very small execution counts and does not establish realistic scale behavior.

**Required remediation boundary**

Preserve exhaustive logical coverage with indexed candidate families rather than all-pair materialization.

Candidate indexes may include:

- canonical digest plus source location;
- broker/account/stable execution ID;
- correction/bust reference;
- source identity/document/row locator;
- broker execution index namespace;
- conservative economic fingerprint when stable IDs are absent.

Create a compact opaque completeness receipt that records:

- input execution occurrence set/digest;
- index versions and partitions evaluated;
- candidate pairs explicitly classified;
- deterministic proof that noncandidate partitions are distinct under the declared policy;
- block/retain/suppress decisions.

Do not weaken correctness merely to improve performance. When an index cannot prove nonrelationship, fail closed or classify the required candidate set.

**Focused regression and scale requirements**

- existing relationship cases retain identical decisions;
- no duplicate/re-export/correction candidate is missed;
- compact receipt is deterministic under input permutation;
- realistic synthetic scale test, at least 10,000 ordinary distinct executions, completes within an explicit time and memory budget agreed in the test/ADR;
- candidate-heavy adversarial dataset remains bounded or fails with a stable resource-limit code;
- no millions-of-pairs receipt array is materialized.

This test may be a targeted performance/scale test rather than part of every small focused edit loop.

---

### A2-R12 — Medium: canonical serialization is not total for accessors, cycles, or excessive depth

**Affected files**

- `src/lib/trader-intelligence-v3/domain/canonical/canonical-serialization.ts`
- canonical serialization/digest tests
- canonicalization ADR

**Violated requirement**

The public `unknown` canonicalization boundary must return structured stable failures for invalid inputs. It must not invoke arbitrary getters, produce time-dependent identity, overflow the stack, or consume unbounded resources.

**Concrete failure paths**

#### A. Throwing getter

`Object.entries(input)` invokes enumerable getters. A getter can throw, causing a raw exception to escape instead of `ExactResult` failure.

#### B. Stateful getter

A getter can return different values on consecutive reads, making digest output timing-dependent.

#### C. Cyclic input

A self-reference recurses until stack overflow because no active-object/cycle tracking exists.

#### D. Excessive depth/node count

There is no maximum depth, node count, key count, or aggregate canonical input size.

#### E. Hidden object state

The treatment of accessors, symbol keys, and nonenumerable own properties is not explicitly validated at the boundary.

**Required remediation boundary**

- inspect own property descriptors before reading values;
- reject getter/setter accessors with a stable code;
- define and enforce the policy for symbol and nonenumerable properties;
- use active/visited object tracking to reject cycles;
- enforce explicit maximum depth;
- enforce maximum node/key count;
- enforce aggregate string/byte size bounds;
- return stable structured reason codes without echoing sensitive values;
- preserve current NFC/LF/key-order/dangerous-key behavior.

**Focused regression requirements**

- throwing getter returns stable failure, not raw throw;
- stateful getter rejected without invocation;
- self-cycle rejected;
- mutual cycle rejected;
- depth limit boundary passes/fails deterministically;
- node/key count boundary passes/fails deterministically;
- aggregate byte/string bound passes/fails deterministically;
- symbol/nonenumerable policy is directly tested;
- existing `__proto__`, duplicate-key, Unicode, line-ending, and digest golden vectors continue to pass.

## 5. Required testing cadence

The owner explicitly requested that Codex avoid rerunning slow suites after every edit. Follow this schedule.

### 5.1 Focused development tests

After A2-R8:

- execution-ordering focused tests;
- FIFO tests for opaque ordering and forged arrays;
- relationship-resolution/accounting integration tests.

After A2-R9:

- execution-relationship tests;
- relationship-resolution tests;
- analytical P/L tests proving unrelated groups remain unaffected.

After A2-R10:

- starting-inventory tests;
- FIFO prior-lot tests;
- production/reference differential tests for prior inventory;
- focused fixed-seed prior-inventory property tests.

After A2-R11:

- relationship-resolution correctness tests;
- one targeted scale/performance test;
- do not run the full repository suite merely to tune the index.

After A2-R12:

- canonical serialization/digest tests only.

Run TypeScript at meaningful integration checkpoints, not after every small edit.

Do not run the full Vitest suite, all property suites, build, or Playwright after each finding.

### 5.2 One consolidated executable verification

After all runtime and test changes are complete, run once:

1. `git diff --check`
2. `npm ci` only if `package.json` or `package-lock.json` changed
3. `npx tsc --noEmit --pretty false`
4. changed-path ESLint
5. `npm run verify:ti-v3:ga0-a2`
6. `npm test`
7. `npm run verify:ti-v3:architecture`
8. `npm run verify:ti-v3:private-data`
9. `npm run verify:layer2`
10. `npm run verify:layer3`
11. `npm run build`

Run Playwright manually only if the remediation changes an app route, page, local server, Next configuration, browser-facing code, or E2E configuration. These findings should remain domain/test/documentation work, so Playwright is normally unnecessary locally. Automatic GitHub workflows may still run.

### 5.3 Property, differential, and scale tests

During implementation, run only the property/differential files directly affected by the current change.

At the final consolidated verification, run the complete GA0-A2 property and differential suites once.

The new 10,000-execution scale test may be run separately and reported with:

- machine/runtime environment;
- elapsed time;
- peak-memory measurement when practical;
- threshold;
- result.

Do not add an unreliable microbenchmark with an unrealistically tight timing threshold to ordinary CI. Use a deterministic structural assertion against pair materialization and a generous regression budget.

### 5.4 Documentation-only closeout

After the executable implementation passes the consolidated verification, a later documentation-only handoff/report commit does not require another full local suite.

Run only:

- `git diff --check`;
- private-data guard;
- SHA/path/test-count/command evidence validation;
- any lightweight Markdown validation already present.

Do not repeat full Vitest, build, property, differential, scale, or E2E solely because Markdown changed.

## 6. Scope restrictions

Do not implement:

- GA0-A3 bitemporal correction application;
- manifests, eligibility, snapshots, stable evidence references, query filters, or backup/restore;
- analytics or simulations;
- tables or charts;
- AI, prompts, embeddings, or natural-language parsing;
- market data, SEC, Nasdaq, FINRA, halts, float, or catalysts;
- support/resistance;
- manual entry;
- AI period reflections;
- Real Coach/Whop;
- saved-data or production schema migration;
- hosted identity, public users, Vercel, or deployment.

Use synthetic data only.

Do not weaken or remove prior accepted GA0-A2 safeguards.

## 7. Documentation updates required after implementation

Update accurately:

- `src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md`;
- `src/docs/trader-intelligence-v3-ga0-a2-last-run-report-2026-07-18.md`;
- `src/docs/trader-intelligence-v3-project-log.md`;
- active GA0-A implementation status;
- affected GA0-A2 ADRs;
- PR #104 body and a remediation mapping comment.

Record:

- executable tested head;
- documentation-only head if any;
- exact commands and counts;
- new property seeds;
- scale-test environment/result;
- warnings;
- remaining limitations;
- confirmation that no later-phase or deployment work occurred.

The status must remain implementation candidate pending independent re-audit. Do not claim GA0-A2 accepted.

## 8. Git and PR rules

- Work on the existing branch `agent/trader-intelligence-v3-ga0-a2-exact-truth`.
- Do not create another branch unless the branch is missing or corrupted, in which case stop and report.
- Do not work on main.
- Do not merge PR #104.
- Keep PR #104 draft.
- Do not resolve existing independent-audit threads.
- Do not begin GA0-A3.
- Do not deploy.
- Do not touch unrelated owner worktrees or stashes.
- Do not apply the mixed V2 stash.

After the fixes and tests:

- commit intentionally;
- push the same branch;
- update PR #104;
- add a mapping table for A2-R8 through A2-R12;
- stop for independent re-audit.

## 9. Acceptance checklist for the next re-audit

- [ ] FIFO cannot accept a forged ordering object.
- [ ] Storage and economic arrays cannot diverge.
- [ ] Correction state blocks only its own group unless pair evidence links records.
- [ ] Prior lots have canonical FIFO sequence and as-of evidence.
- [ ] Prior lots are unique and disjoint from current executions.
- [ ] Prior charges or adjusted-basis semantics are explicit.
- [ ] Starting-only inventory produces an open ledger.
- [ ] Relationship completeness is not represented by O(n²) stored receipts.
- [ ] A realistic 10,000-execution scale test passes its declared budget.
- [ ] Canonical serialization rejects accessors and cycles with stable codes.
- [ ] Canonical serialization has explicit depth/node/size bounds.
- [ ] Focused tests were used during implementation.
- [ ] One consolidated final executable verification passed.
- [ ] Heavy tests were not repeated solely for documentation-only changes.
- [ ] PR #104 remains draft and unmerged.
- [ ] GA0-A3 has not begun.
