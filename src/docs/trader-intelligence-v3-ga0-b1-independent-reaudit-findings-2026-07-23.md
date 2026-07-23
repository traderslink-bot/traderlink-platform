# Trader Intelligence v3 GA0-B1 Independent Re-audit Findings

**Date:** 2026-07-23 America/Toronto  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Branch:** `agent/trader-intelligence-v3-ga0-b1-read-model`  
**Draft PR:** `#133`  
**Immutable original branch base and merge base:** `153eaceecfca714a6c28848b513c412ca76b8e57`  
**Original audited executable head:** `5f74202033bf8ab10a48b8cf18ede18137e73bd1`  
**Original implementer handoff head:** `11dfaaf3118b332b37f8cd7c31957cd240718220`  
**First independent findings head:** `527a76e4c72dfe8d65675812f4be84f3358a767c`  
**Re-audited executable remediation head:** `57d999ae86852b44095d993369d25a117086d912`  
**Re-audited remediation handoff head:** `3ad263aacc9b5d1d392a9b2b0b4d03062004d320`  
**Verdict:** `accept with required fixes`

> This file is independent audit evidence. It is not implementation authority,
> does not authorize merge or deployment, and does not authorize GA0-B2.

## 1. Independent state verification

The remote branch and PR were verified independently through GitHub:

- PR #133 is open, draft, mergeable, and unmerged.
- The branch head before this findings-only commit was
  `3ad263aacc9b5d1d392a9b2b0b4d03062004d320`.
- `57d999ae86852b44095d993369d25a117086d912` is one executable remediation
  commit directly after findings head
  `527a76e4c72dfe8d65675812f4be84f3358a767c`.
- `3ad263aacc9b5d1d392a9b2b0b4d03062004d320` is exactly one documentation-only
  commit after the executable head and adds only the required remediation
  handoff.
- Current `main` observed during re-audit was
  `9a16ea0f209962f945e90ac9330c69fdb0249830`.
- The branch and current `main` remain diverged with merge base
  `153eaceecfca714a6c28848b513c412ca76b8e57`.
- All eight original independent review threads remained unresolved. Four had
  live anchors and four were outdated because their original lines changed;
  none was resolved.

## 2. What the remediation successfully corrected

The remediation substantially improves GA0-B1:

- all starting-inventory states now have deterministic content identities;
- the manifest carries owner-inclusive prior-inventory ledger identity and a
  non-null starting-inventory digest;
- the adapter checks one-to-one manifest/supplied inventory membership before
  reconstruction;
- run contexts now consume runtime objects rather than naked digest strings;
- evidence membership is derived from dataset candidate keys;
- claims derive effects from named table cells rather than free caller values;
- exact metrics enforce an explicit monetary-unit/currency rule;
- series select exact table cells and accessibility facts;
- the terminal run receipt consumes actual artifact objects;
- manifest exclusions retain mapped and source reason fields in the dataset;
- UTC civil dates are separated from New York exchange-session classification;
- New York classification requires filter-bound session evidence and rejects
  pre-2007 timestamps;
- the branch remains read-only, local-owner, synthetic-data-only, and free of
  B2, UI, chart rendering, AI, market-data, support/resistance, migration, and
  deployment work.

These strengths must remain intact during remediation.

---

# 3. Remaining required findings

## B1-REAUD-R1 — High: a self-minted analytical dataset can enter a verified run context

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/dataset/analytical-dataset.ts`
- `src/lib/trader-intelligence-v3/analytics/dataset/analytical-row.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/run-context.ts`

**Failure path**

`buildAnalyticalDatasetReceipt` remains a public structural builder. A caller can
build new analytical rows with arbitrary but syntactically valid exact P/L,
quantity, timestamps, occurrence keys, and other facts, then create a receipt
that claims the digest identities of an existing snapshot, manifest, filter,
correction result, eligibility set, policy, and evidence inventories.

`buildAnalysisRunContext` verifies the receipt's own digest and compares selected
receipt fields to the snapshot. It does not prove that the receipt was produced
by the snapshot read-model derivation or independently replay its rows.

The context comparison also omits exact agreement for at least:

- retrospective-policy digest;
- evidence namespace;
- occurrence-inventory digest;
- round-trip-inventory digest;
- adapter identity/version;
- derivation-policy identity/version.

A forged yet internally content-addressed dataset can therefore become the
financial input to tables, claims, series, and a final receipt.

**Required remediation**

Establish a verified dataset derivation authority. An acceptable design may use:

- an opaque runtime producer receipt plus a persisted derivation receipt that can
  be independently replayed; or
- a verifier that receives the exact snapshot read-model authority and rebuilds
  the dataset before admitting it to a run context.

Run-context construction must prove every dataset dependency field agrees with
its snapshot/dependencies and the accepted read-model policy. A generic
self-consistent content hash is not sufficient proof of analytical derivation.

**Required regressions**

- a rebuilt row with changed net P/L but correct digest is rejected;
- a rebuilt row with changed timestamps, quantity, occurrence keys, or sequence
  is rejected;
- a dataset with foreign policy, evidence namespace, inventory digest, adapter,
  or derivation policy is rejected;
- a persisted genuine dataset can re-enter only through the exact accepted
  derivation verification path;
- the genuine dataset remains deterministic across caller order and
  persistence-ID-only changes.

---

## B1-REAUD-R2 — High: exact tables are not bound to one currency partition

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/contracts/evidence-diagnostics.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/table-claim-series.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/run-receipt.ts`

**Failure path**

For a dataset containing both USD and CAD rows, an exact table may select USD as
its currency merely because USD exists in `currencyPartitions`. Its included and
excluded counts are then required to equal the entire multi-currency dataset,
not the USD partition.

Evidence bundles may combine candidate keys from multiple currencies because the
evidence builder does not define or verify a partition scope. Table rows only
require an evidence-bundle digest and do not prove that the bundle's candidates
belong to the table currency.

A nominal USD table can therefore carry global counts or CAD evidence while its
metric cells are USD. This is not strict currency partitioning.

**Required remediation**

Introduce an immutable analytical partition identity or selection receipt that
binds:

- currency;
- account and other declared partition scope;
- exact included row keys;
- exact excluded candidate keys;
- partition counts and limitations;
- snapshot/filter/dataset identities.

Tables, claims, series, evidence, and run receipts must consume that verified
partition. Cross-currency evidence membership must fail. A table's counts must
reconcile to its partition, not the full dataset unless the dataset has exactly
one currency and that fact is proven.

**Required regressions**

- a USD table with a CAD evidence candidate is rejected;
- a USD table with full multi-currency dataset counts is rejected;
- a mixed-currency evidence bundle is rejected;
- separate USD and CAD tables carry independent exact counts and identities;
- no financial table or receipt aggregates currencies without a future accepted
  FX policy.

---

## B1-REAUD-R3 — Medium/High: ratio claims cannot express valid direction or difference

**Affected file**

- `src/lib/trader-intelligence-v3/analytics/contracts/table-claim-series.ts`

**Failure path**

The accepted exact metric contract includes exact ratios. GA0-B2 requires
expectancy, average, median-even cases, and win-rate ratios. However, claim
`direction` is derived only for exact-decimal and integer effects. An exact ratio
is labelled `unavailable` even when its sign is exactly known.

The `difference` derivation accepts only two exact-decimal cells. It cannot
compare two exact ratios, even though the GA0-B plan requires exact expectancy
and win-rate differences.

**Required remediation**

Use accepted exact-ratio comparison and arithmetic to support:

- sign/direction of a canonical exact ratio;
- exact difference between compatible decimals and/or ratios;
- a canonical ratio result when a difference does not terminate;
- unit and currency preservation;
- zero and unavailable behavior.

Do not add B2 sample thresholds or real conclusion wording.

**Required regressions**

- positive, negative, and zero ratio effects derive the correct direction;
- two compatible ratios produce an exact reduced difference;
- decimal/ratio compatibility follows one documented exact policy;
- incompatible unit/currency/kind combinations fail closed;
- no JavaScript-number conversion enters ratio claim authority.

---

## B1-REAUD-R4 — Medium/High: an empty artifact graph can produce a completed run receipt

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/contracts/run-receipt.ts`
- `src/lib/trader-intelligence-v3/analytics/registry/tool-registry-contract.ts`

**Failure path**

`buildAnalysisRunReceipt` accepts empty tables, claims, series, and evidence with
empty informational diagnostics. If the context is eligible and the dataset has
no limitations, it returns `runStatus: completed`, even when the dataset contains
included rows and no analytical artifact was produced.

The receipt also does not enforce the registry entry's declared
`outputContracts`. A tool contract requiring a table, claim, or series may
produce none and still receive a completed receipt.

**Required remediation**

Derive the minimum and allowed artifact graph from the verified registry entry
and run status. Require all declared output contracts for a completed/limited
run. A blocked run must carry a blocking diagnostic and must follow an explicit
artifact policy. Reject empty, missing, extra, or unsupported artifact classes.

Also verify diagnostics `affectedKeys` resolve to supplied graph identities where
the diagnostic contract claims such a reference.

**Required regressions**

- an eligible nonempty dataset with an empty graph is rejected;
- missing registry-required table/claim/series is rejected;
- an undeclared artifact type is rejected;
- a blocked run without a blocking diagnostic is rejected;
- a valid complete graph satisfying registry output contracts succeeds;
- final receipt identity remains acyclic.

---

## B1-REAUD-R5 — Medium: semantic exclusion deduplication can discard the original source reason

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/adapters/snapshot-read-model.ts`
- `src/lib/trader-intelligence-v3/analytics/contracts/evidence-diagnostics.ts`

**Failure path**

Exclusions are appended in implementation order, then deduplicated by keeping the
first matching semantic identity. For example, a round trip may first be
excluded by the canonical filter and later receive a manifest exclusion mapped
to the same round-trip identity. The filter exclusion wins and the manifest
exclusion—including its original `sourceReasonCode`—is silently discarded.

The evidence-bundle contract also records only primary exclusion reason codes. It
does not retain the mapped exclusion's original source reason or mapping-policy
identity.

The implementation therefore achieves one count but can lose accepted source
truth.

**Required remediation**

Define a versioned reason-precedence and reason-aggregation policy. One semantic
candidate must have one primary outcome while retaining every non-duplicate
accepted reason, source reason, and mapping policy needed for audit and evidence.
The result must not depend on array append order.

Evidence bundles for excluded candidates must retain the exact primary reason,
all preserved source reasons, and mapping-policy identity.

**Required regressions**

- filter exclusion plus manifest exclusion retains the manifest source reason;
- open-position plus manifest/blocked evidence follows documented deterministic
  precedence;
- input permutation does not change primary or retained reasons;
- duplicate identical reasons are deduplicated without losing provenance;
- exclusion evidence reproduces the dataset reason ledger exactly.

---

## B1-REAUD-R6 — Medium/High: a verified receipt may declare a weekend regular session

**Affected files**

- `src/lib/trader-intelligence-v3/domain/query/canonical-filter.ts`
- `src/lib/trader-intelligence-v3/analytics/adapters/session-policy.ts`

**Failure path**

Session-evidence validation checks timestamp shape, local date, state, and
open/close order, but it does not reject a `regular` or `early_close` session on
Saturday or Sunday. `resolveSessionFacts` then trusts that receipt and will label
a weekend timestamp `regular` when it falls inside the supplied interval.

The calendar policy key and version are validated only as strings. The B1 adapter
does not require an accepted calendar-policy key/version. A syntactically valid
unknown calendar can therefore become exchange-session authority.

The pre-2007 guard also checks the UTC year rather than the resolved New York
local year, allowing a narrow UTC/local-year rollover edge to use the wrong
supported rule boundary.

**Required remediation**

- Reject regular/early-close evidence on Saturday or Sunday unless a future
  explicit exceptional-session policy is accepted.
- Require one allowlisted/versioned B1 New York exchange-calendar policy.
- Bind the allowed calendar policy into the B1 derivation policy and dataset
  receipt.
- Apply the supported lower date bound to the resolved local date/year, not only
  the UTC timestamp year.
- Continue failing closed for holidays, missing evidence, and mismatched receipts.

**Required regressions**

- Saturday regular evidence is rejected;
- Sunday early-close evidence is rejected;
- an unknown calendar policy key/version is rejected;
- the accepted policy succeeds for a weekday regular and early-close session;
- the UTC/local 2006/2007 rollover boundary fails closed correctly;
- UTC calendar mode remains `not_applicable`.

---

## B1-REAUD-R7 — Medium: starting-inventory untrusted re-entry is not strict or total

**Affected files**

- `src/lib/trader-intelligence-v3/domain/accounting/starting-inventory.ts`
- `src/lib/trader-intelligence-v3/analytics/adapters/snapshot-read-model.ts`

**Failure path**

`verifyStartingInventoryContract` and `buildStartingInventoryContract` read
ordinary records directly rather than using the accepted exact-record validation
boundary. Unknown root, lot, charge, locator, or ledger fields are ignored when
the contract is rebuilt. A valid contract with an extra unrecognized field can
therefore verify successfully because that field is silently dropped from its
identity.

Hostile getters or Proxy traps may throw during direct property access. The
adapter does not catch verification exceptions after the source read, so expected
malformed input can escape as a raw exception rather than a structured failure.

**Required remediation**

Use descriptor-first exact-record validation at every starting-inventory level:

- root contract;
- ledger identity;
- prior lot;
- charge;
- row locator.

Reject unknown, accessor, symbol, non-enumerable, sparse, cyclic, Proxy, and
oversized input without invoking hostile code. Safe-copy the canonical content
before hashing and return stable reason codes for all expected failures.

**Required regressions**

- unknown fields at every nested level are rejected;
- throwing and stateful getters are rejected without invocation;
- Proxy failures return structured results;
- altered descriptors/symbol/non-enumerable fields fail closed;
- valid null-prototype persisted content rebuilds to the same digest;
- adapter returns a structured unverified-authority failure rather than throwing.

---

# 4. Verification evidence

## GitHub CI independently observed

Executable remediation head `57d999ae86852b44095d993369d25a117086d912`:

- workflow: `CI`;
- run ID: `30035826136`;
- run number: `1055`;
- job: `test-and-verify`;
- job ID: `89303420935`;
- conclusion: `success`;
- successful steps included clean dependency installation, repository tests,
  GA0-A2 exact-truth verification, architecture verification, private-data
  verification, Layer 2, and Layer 3.

Documentation head `3ad263aacc9b5d1d392a9b2b0b4d03062004d320`:

- workflow: `CI`;
- run ID: `30037109190`;
- run number: `1056`;
- job: `test-and-verify`;
- job ID: `89307712573`;
- conclusion: `success`;
- the same broad steps completed successfully.

Both runs included the non-failing GitHub annotation that actions targeting
Node.js 20 were being executed on Node.js 24 because of runner deprecation.

## Independent local-command limitation

The audit runtime did not contain a mounted checkout. A new clean clone was
attempted, but the shell environment could not resolve `github.com`, and the
`gh` CLI was unavailable. Therefore no independent local command is claimed as a
pass.

In particular, this audit does **not** relabel as independent local passes:

- the starting-inventory focused cluster whose exact count was not preserved;
- the private-data Git-history unit case that timed out twice locally;
- the local `verify:ti-v3:ga0-a2` run that exited 1 without a terminal summary;
- TypeScript, ESLint, `npm ci`, or `git diff --check` from the implementer's
  environment.

Current-head CI provides independent clean-install evidence for the full tests,
exact-truth verifier, architecture guard, and private-data guard, but CI success
does not exercise the adversarial construction paths in Section 3.

# 5. Scope result

The remediation remains within GA0-B1. No executable weekday tool, daily-stop
simulation, runner, sample threshold, real conclusion policy, AI/model call,
prompt, natural-language parser, query UI, React/page/route/chart renderer,
market-candle/VWAP/setup/catalyst work, support/resistance, coaching label,
manual entry, reflection, Real Coach/Whop, Academy integration, hosted/public
user behavior, migration, deployment, GA0-B2, or later-slice work was found.

# 6. Required next action

Keep PR #133 draft, open, unmerged, and undeployed. Leave all original and new
independent review threads unresolved.

Codex must remediate B1-REAUD-R1 through B1-REAUD-R7 on the existing branch,
using focused tests during implementation and one repository-wide TypeScript run
near the final executable checkpoint. It must publish a new detailed
implementation/re-audit handoff in a documentation-only closeout commit and stop
for another independent re-audit.

GA0-B2 must not begin.
