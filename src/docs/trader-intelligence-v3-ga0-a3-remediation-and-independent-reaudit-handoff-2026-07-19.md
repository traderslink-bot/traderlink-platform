# Trader Intelligence v3 GA0-A3 Remediation and Independent Re-audit Handoff

Date: 2026-07-19 America/Toronto  
Repository: `traderslink-bot/traderslink-trader-improvement-system`  
Branch: `agent/trader-intelligence-v3-ga0-a3-manifests`  
Draft PR: [#106](https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/106)

## 1. Purpose and evidence warning

This document records implementer-supplied evidence for the independent
re-audit of the GA0-A3 findings A3-R1 through A3-R10. It is not proof that the
implementation is correct, it is not independent acceptance, and it does not
authorize merge, deployment, GA0-B, analytics, charts, AI, or public hosting.

The binding defect descriptions and remediation boundaries remain:

`src/docs/trader-intelligence-v3-ga0-a3-independent-audit-findings-2026-07-19.md`

The auditor should verify this document against the code, tests, commit graph,
PR threads, and CI rather than relying on implementer claims.

## 2. Repository state and exact heads

- Accepted GA0-A2 base and current merge base:
  `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a`.
- Originally audited executable head:
  `50d1d9c11883bf6777a0bf9929aef35ebdf2d7d6`.
- Originally audited documentation head:
  `865ff5d5dc2cfbe396474b349811e7bd7151916a`.
- Audit-findings head:
  `67665ed3098e8fd93d49b5ad2d22aecf12d52a68`.
- Tested remediation executable head:
  `883d62ea009102037626207a96cad31f482ceb4a`.
- Exact later documentation-reconciliation head:
  `df0fa4b7515a61ab36e15f23cd448812bb3065d4`.
- At this file's creation, PR #106 was open, draft, and blocked from merge with
  head `df0fa4b7515a61ab36e15f23cd448812bb3065d4`.
- This handoff is committed after the documentation-reconciliation head. Its
  own commit SHA cannot be embedded in its own content without making a false
  self-referential hash claim. The exact final audit-delivery/current PR head is
  therefore recorded in the PR comment and final implementer response.

No reset, clean, restore, stash, stash pop, alternate branch, main-branch work,
PR #104 modification, merge, deployment, or V2 prototype-stash operation was
performed.

## 3. Complete branch chronology after the accepted base

1. `b8b24fab13fa586138d02ede818a60e544ae3095` — Record GA0-A2 acceptance and start GA0-A3.
2. `f390646b1d60f45594490b7db66f10fbf5ce1430` — Add GA0-A3 temporal and lifecycle contracts.
3. `bbef921fd3e9da0b82b60ff6007f8825ce5c84a4` — Add content-addressed manifests snapshots and filters.
4. `50d1d9c11883bf6777a0bf9929aef35ebdf2d7d6` — Harden CSV truth and add WAL-safe recovery.
5. `f7293486442cf024e8615bf63d06e882cdcbfb62` — Document GA0-A3 audit handoff.
6. `865ff5d5dc2cfbe396474b349811e7bd7151916a` — Finalize GA0-A3 auditor delivery record.
7. `67665ed3098e8fd93d49b5ad2d22aecf12d52a68` — Add GA0-A3 independent audit findings.
8. `62126f981f33fb217805569badc3846427738cfc` — Remediate GA0-A3 authority findings.
9. `8ce7ac3e007e42020c0941197b1ae5297985bc98` — Fix eligibility policy typing.
10. `0a4dd8889fd5da656e3a343e1becda7cac57b124` — Clean GA0-A3 verification warnings.
11. `883d62ea009102037626207a96cad31f482ceb4a` — Preserve verified dependency identities.
12. `df0fa4b7515a61ab36e15f23cd448812bb3065d4` — Document GA0-A3 remediation status.
13. The final handoff-only commit follows item 12 and is identified in PR #106.

## 4. Complete remediation changed-file inventory

Executable and test files changed after the audit-findings head:

- `src/lib/execution-sources/csv/broker-execution-csv-import.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-a3/backup-parser.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-a3/filter-validation.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-a3/temporal-lifecycle.test.ts`
- `src/lib/trader-intelligence-v3/domain/eligibility/capability-eligibility.ts`
- `src/lib/trader-intelligence-v3/domain/evidence/evidence-reference.ts`
- `src/lib/trader-intelligence-v3/domain/foundation/payload-envelope.ts`
- `src/lib/trader-intelligence-v3/domain/foundation/runtime-validation.ts`
- `src/lib/trader-intelligence-v3/domain/identity/content-digest.ts`
- `src/lib/trader-intelligence-v3/domain/manifest/dataset-manifest.ts`
- `src/lib/trader-intelligence-v3/domain/query/canonical-filter.ts`
- `src/lib/trader-intelligence-v3/domain/snapshot/analysis-snapshot.ts`
- `src/lib/trader-intelligence-v3/domain/temporal/correction-record.ts`
- `src/lib/trader-intelligence-v3/domain/temporal/retrospective-policy.ts`
- `src/lib/trader-intelligence-v3/ingestion/parser-hardening.ts`

Documentation files changed after the audit-findings head:

- `plan.md`
- `src/docs/trader-intelligence-v3-project-log.md`
- `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
- `src/docs/trader-intelligence-v3-adr-ga0-a3-temporal-manifest-snapshot-authority-v1.md`
- `src/docs/trader-intelligence-v3-adr-ga0-a3-local-recovery-and-parser-boundary-v1.md`
- `src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md`
- `src/docs/trader-intelligence-v3-legacy-hazard-register-2026-07-17.md`
- `src/docs/trader-intelligence-v3-ga0-a3-remediation-and-independent-reaudit-handoff-2026-07-19.md`

No package, lock, route, page, React, Next configuration, workflow, database,
WAL, SHM, export, generated artifact, or deployment file changed.

## 5. A3-R1 through A3-R10 implementation map

| Finding | Implementation files | Focused test files | Implementer result | Remaining limitation |
|---|---|---|---|---|
| A3-R1 replacement existence | `correction-record.ts`, `content-digest.ts` | `temporal-lifecycle.test.ts` | Base-active digests and the verified available execution catalog are separate. Every target and replacement must resolve exactly once; unverified, absent, and duplicate catalog authority blocks replay. The result binds base, catalog digest, available facts, applied/excluded corrections, final active facts, and its own digest. | No persistence adapter for catalogs exists in GA0-A3. |
| A3-R2 lineage isolation | `correction-record.ts` | `temporal-lifecycle.test.ts` | Roots must target base-active facts. A child must target its parent's current replacement, one child may follow a parent, root branching/duplicate keys/cycles/cross-target chains/post-deletion children block, and child correction time must follow parent time. | Lineage v1 deliberately uses root/current-replacement continuity rather than a separately persisted lineage UUID. |
| A3-R3 calculated eligibility | `capability-eligibility.ts`, `retrospective-policy.ts`, `dataset-manifest.ts`, `analysis-snapshot.ts` | `manifest-eligibility-snapshot.test.ts` | The only authoritative set comes from the calculator using a verified manifest, verified retrospective policy, verified correction result, analysis cutoff, coverage, and required evidence. Exactly one result is required for all ten capabilities. Partial and multiple-account partial coverage are incomplete. Snapshots reject cloned/self-declared sets. | The contracts do not implement any capability's analytics or AI behavior. |
| A3-R4 enrichment verification | `analysis-snapshot.ts` | `manifest-eligibility-snapshot.test.ts` | A canonical empty-enrichment object is built from a verified manifest and analysis cutoff, content-addressed, runtime-branded, and required by snapshot construction. Arbitrary or cloned digests/objects fail. | Non-empty market enrichment remains intentionally unimplemented. |
| A3-R5 snapshot-derived evidence | `analysis-snapshot.ts`, `evidence-reference.ts` | `manifest-eligibility-snapshot.test.ts` | Evidence is built only from a verified snapshot. It inherits manifest, snapshot, filter, analysis cutoff, policy set, correction result, and namespace. Execution, occurrence, correction, round-trip, policy, and filter subjects must be present in the snapshot inventory. Foreign/cloned references fail. | A future exact reconstruction producer must supply round-trip semantic keys when creating a snapshot; GA0-A3 creates no analytics. |
| A3-R6 manifest referential integrity | `dataset-manifest.ts`, `correction-record.ts` | `manifest-eligibility-snapshot.test.ts` | Hashing requires unique sources, policy identities/versions/digests, executions, ledgers, exclusions, and ranges; open executions are a subset of accepted active executions; ledgers match account/instrument/currency scope; selected corrections and cutoff come from the verified applied correction result; nonempty facts require source/currency coverage; false complete coverage and foreign overlap sources fail. | Legacy persisted manifests are not migrated; only newly built verified v3 manifests have this authority. |
| A3-R7 requested/resolved range receipt | `canonical-filter.ts`, `content-digest.ts` | `filter-validation.test.ts`, `manifest-eligibility-snapshot.test.ts` | An injected resolver and fixed clock produce a branded, content-addressed receipt binding request dates, bases, timezone, boundaries, relative anchor, resolved UTC range, calendar policy/version, and session evidence. Filters accept only the verified receipt; altered/cloned requested dates fail. | GA0-A3 defines the resolver boundary, not an exchange-calendar provider or query UI. |
| A3-R8 strict persisted JSON | `payload-envelope.ts`, accepted canonical strict parser | `filter-validation.test.ts`, `ga0-a2-canonical-serialization-and-digest.test.ts` | Size is rejected before parse. The accepted strict parser rejects raw, nested, and NFC-normalized duplicate keys, then the envelope and digests are validated. Ordinary `JSON.parse` is no longer authoritative. | No production persistence schema or migration is added. |
| A3-R9 hostile unknown input | `runtime-validation.ts`, `payload-envelope.ts` | `filter-validation.test.ts`, `ga0-a2-canonical-serialization-and-digest.test.ts` | The shared boundary catches array/prototype/own-key/descriptor/proxy failures; inspects descriptors before values; rejects accessors, symbols, non-enumerables, cycles, sparse/invalid arrays, key normalization collisions, and excess depth/nodes/keys/strings; returns safe null-prototype root records while preserving already-verified child authority identity. No source values are logged. | This is a domain validation boundary, not general enterprise input-security infrastructure. |
| A3-R10 parser work limits | `parser-hardening.ts`, `broker-execution-csv-import.ts` | `backup-parser.test.ts`, `broker-execution-csv-import.test.ts` | Oversized strings/bytes return before delimiter detection and row parsing; UTF-8 byte length is counted without a complete encoded allocation; cell accumulation stops at its limit; the production importer preflights rejected input before full-content fingerprinting/parsing; fail-closed issue codes and sectioned IBKR compatibility remain. | The preserved legacy importer still uses legacy numeric/time semantics after the preflight and remains non-authoritative. |

## 6. Correction replay contract

`applyCorrectionSet` now receives four explicit authorities:

1. `baseActiveExecutionDigests`: the facts active before applicable corrections;
2. `availableExecutionCatalog`: verified canonical execution envelopes that may
   be targeted or activated;
3. append-only verified correction records;
4. the explicit correction cutoff.

The catalog is uniqueness-checked and content-addressed independently of
persistence IDs and input order. Base-active facts must be a unique catalog
subset. A replacement is never activated unless its correction is within the
cutoff and its verified execution exists exactly once in the catalog.

Lineage v1 treats a non-superseding correction as the root. The root must target
a base-active execution. A superseding child must name the parent correction
and target the parent's current replacement. One parent cannot have multiple
children, two roots cannot claim the same target, time must move forward, and a
bust/delete cannot be followed. Cross-target chains, branching, cycles,
missing/duplicate targets, missing replacements, post-deletion changes, and
contradictory time block the result. Future corrections remain recorded as
excluded and do not alter an earlier replay.

The result is runtime-branded and content-addresses its cutoff, base-active set,
catalog identity and contents, applied/excluded correction versions, final
active set, status, and reason codes. Correction application remains separate
from relationship classification.

## 7. Eligibility authority

The eligibility calculator requires:

- a runtime-verified manifest;
- a runtime-verified retrospective/open-position policy;
- a runtime-verified correction result;
- one analysis cutoff;
- required evidence references.

The policy cutoff, correction cutoff, manifest cutoff, active accepted facts,
and selected correction digests must agree. The set contains exactly one
deterministically ordered result for:

- exact reconstruction;
- closed-trade analytics;
- execution review;
- behavioral analytics;
- simulations;
- coaching;
- AI explanation;
- visual evidence;
- export;
- market enrichment.

`partial_account_period`, `multiple_accounts_partial`, gaps, unknown coverage,
incomplete prior inventory, unresolved corrections, blocked correction replay,
and non-exact reconstruction are capability-scoped inputs. Open positions limit
closed-trade/coaching authority while execution review and export remain
independent. The public verifier accepts only calculator-branded results, and a
snapshot requires that exact object and exact dependencies.

## 8. Empty enrichment contract

`createEmptyEnrichmentSet` requires a verified manifest and canonical analysis
cutoff. It hashes a versioned empty item set together with that manifest and
cutoff and brands the returned object. Snapshot construction accepts only this
verified empty object with exact manifest/cutoff agreement. A syntactically
valid foreign digest or cloned lookalike is rejected. This is the only
enrichment state authorized before a real enrichment phase.

## 9. Evidence dependency validation

The verified snapshot carries an evidence-subject inventory for accepted
executions, selected corrections, policies, its canonical filter, and supplied
reconstructed round-trip semantic keys. Evidence construction takes the
verified snapshot object rather than caller-declared manifest/snapshot fields.
It verifies subject membership and binds:

- manifest and snapshot digest;
- filter digest;
- policy-set digest;
- correction-result digest;
- analysis cutoff;
- evidence namespace.

Correction evidence must name a selected correction, policy evidence must name
a snapshot policy, filter evidence must name the snapshot filter, and execution
or round-trip evidence must name an inventory subject. Raw broker rows, account
numbers, filesystem paths, arbitrary persistence IDs, and foreign dependencies
remain forbidden.

## 10. Manifest referential-integrity rules

Before hashing, the manifest builder verifies the applied correction result and
enforces:

- unique source-document identities;
- unique policy key/version pairs and policy digests;
- unique accepted execution digests;
- unique prior-inventory/open-position ledger keys;
- unique exclusion evidence identities;
- open-position execution subset membership;
- exact equality between accepted facts and the correction result's active set;
- correction digests/cutoff/result digest derived from that correction result;
- account/instrument/currency ledger scope;
- source and currency coverage for nonempty accepted facts;
- overlap source membership;
- unique statement, gap, and overlap range identities;
- incompatibility between `complete_account_period` and gap, overlap, partial,
  multiple-partial, unknown, incomplete-inventory, or unresolved-correction
  states;
- non-exact reconstruction for unresolved overlaps.

Only a runtime-branded manifest is accepted by downstream eligibility/snapshot
authority. Equivalent persistence IDs do not enter manifest identity.

## 11. Date-resolution receipt and filter binding

The injected `RelativeDateResolver` boundary receives the full date-resolution
request and fixed canonical clock. Its result is validated and converted into
a runtime-branded, content-addressed receipt containing:

- requested start/end dates;
- date, time, and calendar basis;
- timezone;
- boundary inclusivity/exclusivity;
- relative range and anchor when applicable;
- fixed clock;
- resolved absolute UTC range;
- calendar policy key/version;
- session, holiday, or early-close evidence for trading-session requests.

Explicit requests must echo their requested dates exactly. Relative requests
cannot masquerade as explicit requests. UTC basis requires UTC timezone. The
resolved end and fixed clock cannot exceed the analysis cutoff. Canonical query
filters take the verified receipt object, not independent display and execution
ranges, so a caller cannot substitute a structurally similar range.

## 12. Strict persisted JSON

`parsePersistedJson` first rejects input over 1,000,000 code units, then uses the
accepted `parseStrictCanonicalJson` parser. That parser rejects raw duplicate
keys, nested duplicates, NFC-normalized collisions, invalid JSON, excessive
depth/nodes/keys/strings, and trailing data before the validated payload
envelope and its content-addressed digests are checked.

## 13. Accessor and proxy safety

`validateExactRecord` and `validateArray` route unknown values through a bounded
descriptor inspection. Reflection operations are wrapped. Property descriptors
are checked before values are copied. Getters and setters are rejected without
invocation; symbol and non-enumerable properties are forbidden; prototype,
own-key, descriptor, revoked-proxy, cycle, sparse-array, normalized-key
collision, depth, node, key, and aggregate string failures return stable codes
without values in errors or logs.

The returned root record has a null prototype and immutable data properties.
Already verified child authority objects retain identity after their whole
graph has passed descriptor inspection, which is required for opaque WeakSet
brands. The initial consolidated run caught and corrected an earlier version
that copied away those brands.

## 14. Parser termination and resource limits

The hardening boundary checks oversized `Uint8Array` length before decode. For
strings it rejects a code-unit lower bound immediately and otherwise counts
UTF-8 bytes incrementally without allocating a complete `TextEncoder` result.
On over-limit input it returns only `ti_v3_parser_payload_oversized`, with null
delimiter, before delimiter detection or row parsing.

The strict row parser checks cell length before appending and returns at the
first over-limit character. The existing importer performs this preflight once,
uses a bounded synthetic rejection fingerprint for an oversized rejected input,
and does not invoke its legacy row parser. Existing sectioned IBKR tests remain
part of the focused verifier.

## 15. Exact local commands and results

### Focused implementation checkpoints

- `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/temporal-lifecycle.test.ts --reporter=dot`
  - Passed: 1 file, 6 tests.
- `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts --reporter=dot`
  - Final focused result before later integration: 1 file, 5 tests passed.
- `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/filter-validation.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts --reporter=verbose`
  - Passed: 2 files, 8 tests at that checkpoint.
- `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/filter-validation.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-serialization-and-digest.test.ts --reporter=dot`
  - Passed: 2 files, 28 tests.
- `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/backup-parser.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts --reporter=dot`
  - Passed: 2 files, 44 tests.
- Integration-fix check:
  `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a3/filter-validation.test.ts --reporter=dot`
  - Passed: 2 files, 10 tests.

### Final executable checkpoint at `883d62ea009102037626207a96cad31f482ceb4a`

- `git diff --check`
  - Passed with no output.
- `npx tsc --noEmit --pretty false`
  - Final result: exit 0, no diagnostics, 59.8 seconds.
- ESLint over all 16 changed executable/test paths
  - Final result: exit 0, no errors or warnings, 58.8 seconds.
- `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3 src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-serialization-and-digest.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts --reporter=dot`
  - Final result: 6 files passed, 83 tests passed, 65.8 seconds command time.
- `npm run verify:ti-v3:architecture`
  - Passed: `ok: true`, 396 architecture files, 42 API routes, 82 classified
    Trader Intelligence routes.
- `npm run verify:ti-v3:private-data`
  - Passed: `ok: true`, 23,706 records, 23,628 final-tree records, 78 PR-history blobs.
- `npm run build`
  - Run exactly once after executable fixes.
  - Passed in 540.8 seconds. Academy registry validation passed; Next.js 16.2.6
    compiled; TypeScript completed; 127/127 static pages generated.
  - The build reported pre-existing broad file-tracing warnings and 19 Academy
    Markdown registry omissions. No warning points to a changed GA0-A3 path.

`package.json` and `package-lock.json` did not change, so `npm ci` was not run.

## 16. Intermediate failures and corrections

These commands are not described as passes:

1. The first `npx tsc --noEmit --pretty false` was interrupted by the 120-second
   command timeout after 123.8 seconds and emitted no diagnostics.
2. The longer TypeScript retry exited 1 with two diagnostics: the validated
   open-position policy was inferred as `string` rather than the eligibility
   contract union. Commit `8ce7ac3e007e42020c0941197b1ae5297985bc98`
   narrowed the already validated type. Later TypeScript runs passed.
3. The first changed-path ESLint run exited 0 with zero errors and seven unused
   warnings. Commit `0a4dd8889fd5da656e3a343e1becda7cac57b124`
   removed them. The final lint run had no warnings.
4. The first consolidated verifier passed 80/83 and failed three manifest tests.
   Descriptor-safe root copying had copied away the WeakSet identity of the
   verified correction result. Commit
   `883d62ea009102037626207a96cad31f482ceb4a` preserves child authority identity
   after whole-graph descriptor inspection. The focused 10-test check and final
   83-test verifier then passed.
5. Earlier focused eligibility/snapshot development runs failed while the new
   correction-result digest domain and authority fixtures were being connected.
   The digest parser and synthetic verified dependency chain were corrected;
   final focused and consolidated results above supersede those failures.

## 17. GitHub CI state

At handoff creation:

- Remediation documentation head:
  `df0fa4b7515a61ab36e15f23cd448812bb3065d4`.
- CI run ID: `29669615041`.
- URL:
  `https://github.com/traderslink-bot/traderslink-trader-improvement-system/actions/runs/29669615041`.
- State: `in_progress`; conclusion not yet available.
- The prior audit-findings head `67665ed3098e8fd93d49b5ad2d22aecf12d52a68`
  had inherited successful CI run `29667964899`; that is historical and does
  not prove the remediation head.
- Pushing the final handoff commit may create a later CI run. Its exact state is
  recorded in the PR comment/final response. The implementer did not wait
  indefinitely and does not claim an in-progress run passed.

GitHub CI, not local execution, is responsible for the full repository suite,
Layer 2, and Layer 3 on this remediation. Their conclusions must be checked by
the independent auditor at the exact PR head.

## 18. Commands deliberately not run

- `npm test` / the full repository Vitest suite: deliberately left to GitHub CI
  because focused failures did not identify a broad regression risk.
- Layer 2 and Layer 3 local verifiers: deliberately left to GitHub CI.
- Playwright: not run because no browser-facing code changed.
- `npm ci`: not run because package and lock files did not change.
- A second production build: not run; the required build ran exactly once.
- Deployment, Vercel, database migration, production migration, broker API,
  market provider, or model command: not run and not authorized.

No command inherited from an older head is reported as a remediation pass.

## 19. Known limitations and deferred work

- GA0-A3 remains an unaccepted candidate until independent re-audit.
- Authority contracts remain isolated from routes, pages, legacy repositories,
  saved owner data, and visible product surfaces.
- The only enrichment set is verified empty; there is no market enrichment.
- The date resolver is a contract boundary; there is no exchange-calendar
  provider, natural-language parser, analytics DSL, SQL surface, or query UI.
- Round-trip evidence requires future exact reconstruction output; GA0-A3 does
  not calculate round trips for analytics.
- WAL-safe backup files are not encrypted by this implementation. Real owner
  backups require owner-controlled external encrypted storage.
- The legacy CSV importer remains non-authoritative after the new fail-closed
  preflight and retains legacy numeric/time behavior.
- No background refresh, scheduled invalidation, production persistence schema,
  migration, public identity, entitlement, or hosted recovery service exists.
- Legacy `mark-closed` remains unrewired; the v3 contract makes the intended
  annotation-only boundary explicit for a later adapter phase.

## 20. Scope confirmation

This remediation added no:

- analytics, weekday analytics, simulations, coaching, reports, or mistake detection;
- chart, visual rendering, dashboard, or query UI;
- AI/model call, prompt, embedding, vector, natural-language parsing, or AI route;
- support/resistance, setup classification, market enrichment, or broker API;
- manual trade entry, period reflection, Real Coach, Whop, or entitlement;
- public account, hosted mode, production security expansion, migration, or deployment.

PR #106 remains draft and unmerged. GA0-B has not begun. No deployment occurred.

## 21. Independent re-audit instructions

Run from a clean checkout or isolated worktree:

```powershell
git fetch origin --prune
git checkout agent/trader-intelligence-v3-ga0-a3-manifests
git pull --ff-only origin agent/trader-intelligence-v3-ga0-a3-manifests
git branch --show-current
git status --short
git merge-base e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a HEAD
git log --oneline e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a..HEAD
git diff --stat 67665ed3098e8fd93d49b5ad2d22aecf12d52a68...HEAD
git diff 67665ed3098e8fd93d49b5ad2d22aecf12d52a68...HEAD
gh pr view 106 --json number,url,isDraft,state,headRefName,headRefOid,mergeStateStatus
gh run list --branch agent/trader-intelligence-v3-ga0-a3-manifests --limit 10
```

Read completely in the mandatory controlling order, then read the audit
findings and this handoff. Review every unresolved PR #106 thread without
resolving it. For each A3-R1 through A3-R10, trace the original failure path,
runtime brand/dependency chain, negative test, and at least one adversarial
variant not supplied by the implementer.

Recommended focused verification:

```powershell
git diff --check
npx tsc --noEmit --pretty false
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3 src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-serialization-and-digest.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts --reporter=dot
npm run verify:ti-v3:architecture
npm run verify:ti-v3:private-data
```

Do not infer acceptance from green tests. Specifically attempt:

- missing, duplicated, reordered, cloned, and unverified execution catalogs;
- cross-target, branch, cycle, post-delete, and cutoff lineages;
- structurally valid self-declared all-eligible sets and mixed dependencies;
- foreign enrichment/evidence/manifest/filter/snapshot subjects;
- duplicate manifest identities, subset violations, scope mismatches, and false
  complete coverage;
- request/receipt/filter range substitution around DST, holiday, and early close;
- duplicate JSON keys at multiple depths and Unicode normalization collisions;
- accessor, symbol, non-enumerable, cyclic, sparse, oversized, and hostile Proxy inputs;
- oversized CSV payload/cell work and sectioned IBKR regression behavior.

Confirm CI at the final PR head, distinguish local from GitHub results, keep the
PR draft/unmerged, and return an independent verdict. Do not deploy or begin
GA0-B.

## 22. Ready-to-paste prompt for the independent auditor

```text
You are the independent re-auditor for Trader Intelligence v3 GA0-A3 in
traderslink-bot/traderslink-trader-improvement-system.

Audit the existing draft PR #106 on branch
agent/trader-intelligence-v3-ga0-a3-manifests. Do not create another branch,
modify code, resolve review threads, mark the PR ready, merge, deploy, or begin
GA0-B.

The accepted base is e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a. The original
audit-findings head is 67665ed3098e8fd93d49b5ad2d22aecf12d52a68. The tested
remediation executable head claimed by the implementer is
883d62ea009102037626207a96cad31f482ceb4a.

Read AGENTS.md and all controlling documents in their mandatory order. Then
read these two files completely:

1. src/docs/trader-intelligence-v3-ga0-a3-independent-audit-findings-2026-07-19.md
2. src/docs/trader-intelligence-v3-ga0-a3-remediation-and-independent-reaudit-handoff-2026-07-19.md

The second file is implementer-supplied evidence, not proof. Independently
verify every A3-R1 through A3-R10 claim against the full diff from the findings
head, all unresolved PR #106 threads, runtime authority boundaries, adversarial
failure paths, focused tests, and GitHub CI at the exact final PR head. Pay
special attention to replacement catalog existence, cross-target lineage,
self-declared eligibility, forged enrichment, foreign evidence, manifest
referential integrity, requested/resolved date substitution, strict duplicate
JSON keys, getter/proxy safety, and parser early termination.

Distinguish commands you ran from implementer results and inherited CI. Return
an evidence-backed independent verdict with required fixes if any. Keep PR #106
draft, unmerged, and undeployed. Do not begin GA0-B.
```
