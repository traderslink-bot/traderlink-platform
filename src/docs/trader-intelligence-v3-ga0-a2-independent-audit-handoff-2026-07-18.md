# Trader Intelligence v3 GA0-A2 independent-audit handoff

## Remediation addendum — 2026-07-18

This addendum is the current handoff for the independent re-audit. Sections
1–30 below are preserved as the historical handoff for the originally audited
head; their disclosed findings, old counts, old golden execution digests, and
eight-suite property inventory are superseded by this addendum. They must not
be read as claims about the remediated head.

### Immutable target separation

| Target | Commit | Verification authority |
| --- | --- | --- |
| Originally audited head | `542992b6a7c54ce871c31bc2831126c850fea04c` | Independent audit that required A–J remediation |
| Remediation implementation head | `b92b321fab7801212c82125511e58c754e594fea` | Complete local executable verification matrix listed below |
| Documentation-only handoff head | Commit containing this addendum; resolve with `git log -1 --format=%H -- src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md` and match PR #104 HEAD | Lightweight diff/private-data/evidence/Markdown checks only |

No runtime, test, dependency, package-lock, build configuration, CI
configuration, route, browser-facing file, E2E configuration, or generated
contract changes after the implementation-head test run. The documentation
commit changes only `plan.md` and files below `src/docs/`.

### Audit finding remediation matrix

| Finding | Implementation | Primary tests | Result | Deferred boundary |
| --- | --- | --- | --- | --- |
| A. Byte-proven duplicate suppression | `domain/execution/execution-relationship.ts` | `ga0-a2-execution-relationship.test.ts` | Digest, bytes, and same-source location are all mandatory; every omitted factual field has adversarial coverage | A3 correction application remains deferred |
| B. Pair-addressable relationship resolution | `domain/execution/execution-relationship-resolution.ts`, `domain/accounting/analytical-pnl.ts` | `ga0-a2-execution-relationship-resolution.test.ts`, property seed `2026071812` | Named input membership, recomputation, group scope, one-occurrence suppression, isolated blocking, and forged/unknown failure pass | A3 resolves re-export/correction lifecycle; A2 blocks it |
| C. Ordering-signal scope | `domain/execution/canonical-execution.ts`, `execution-ordering.ts` | `ga0-a2-execution-ordering.test.ts` | Broker/document/global index scope, order fill scope, execution-ID namespace, row-document scope, restart and cross-import cases pass | Broker-specific adapters remain future work |
| D. Economic equivalence | `domain/execution/execution-ordering.ts` | `ga0-a2-execution-ordering.test.ts` | Every accounting, validation, charge, position-effect, correction, security, instrument, and basis field is compared | No implicit commutativity claim outside explicit v1 fields |
| E. Returned canonical content | `domain/execution/canonical-execution.ts` | `ga0-a2-canonical-execution.test.ts` | NFC content is returned from the canonical value and reserializes byte-for-byte; control-bearing identifiers fail structurally | Broader A3 schema evolution deferred |
| F. 35 executable fixtures | `testing/fixtures/ga0-a2-executable-fixtures.ts` | `ga0-a2-synthetic-fixtures.test.ts` | 35 table-driven synthetic cases execute builder/order/classifier/reconstruction and hard-coded expectations | Real owner/broker data prohibited |
| G. Raw decimal bound | `domain/exact/exact-decimal.ts` | `ga0-a2-exact-decimal.test.ts`, seeds `2026071814`–`2026071815` | 256-character pre-parser cap and stable no-value reason code pass | Display rounding remains outside authority |
| H. Total unknown execution input | `domain/execution/canonical-execution.ts` | `ga0-a2-canonical-execution.test.ts` | Malformed arrays, nested objects, locators, enums, sequence and ordering fields return structured failures without throws | General A3 runtime validation not started |
| I. Deterministic comparator and PostgreSQL correction | `domain/canonical/canonical-serialization.ts`, execution charge builder, architecture guard, exact-decimal ADR | canonical/architecture/decimal tests | Explicit Unicode code-point comparison is shared; locale comparison is guarded; future target is `NUMERIC(72,24)` plus significant-digit constraints | No PostgreSQL migration in A2 |
| J. Reference and properties | `testing/reference/fifo-reference-ledger.ts`, accounting result/match contracts | `ga0-a2-fifo-differential.test.ts`, `ga0-a2-property-based.test.ts` | Lots, per-execution matches, totals, cash flow, reversals, exact ratios, round trips, block codes, and 15 fixed suites pass | Reference still shares only declared input/output types and fixture documents |

### Exact property seeds and counts

Each suite uses BigInt coefficient/scale generation, `numRuns: 1000`, a fixed
seed, and `verbose: 2`: `2026071801` flat long, `2026071802` flat short,
`2026071803` partial fills, `2026071804` long-to-short reversal,
`2026071805` duplicate classification, `2026071806` canonical property order,
`2026071807` digest semantics, `2026071808` ambiguous ordering,
`2026071809` short-to-long reversal, `2026071810` prior inventory,
`2026071811` currency isolation, `2026071812` relationship resolution,
`2026071813` blocked states, `2026071814` price/quantity scale boundaries, and
`2026071815` 48-digit precision boundaries. Total: 15,000 generated cases.

### Complete implementation-head command record

All commands below ran at exact head
`b92b321fab7801212c82125511e58c754e594fea`:

| Command | Exact result |
| --- | --- |
| `git diff --check origin/main...HEAD` | Exit 0 |
| `npm ci` | Not repeated because no dependency or lock file changed from the already tested audited branch |
| `npx tsc --noEmit --pretty false` | Exit 0, no output |
| changed-path `npx eslint` over the 25 remediation TypeScript paths | Exit 0, zero errors and zero warnings |
| `npm run verify:ti-v3:ga0-a2` | Exit 0; 14 files, 231 tests; architecture 371/42/82; private data 23,693 total, 23,590 final tree, 103 PR-history blobs |
| `npm test` | Exit 0; 177 files, 1,731 tests; only isolated-test-repository Git line-ending/branch messages |
| `npm run verify:ti-v3:architecture` | Exit 0; 371 files, 42 API routes, 82 classified routes |
| `npm run verify:ti-v3:private-data` | Exit 0; 23,693/23,590/103 records |
| `npm run verify:layer2` | Exit 0; detected 13, expected 13 |
| `npm run verify:layer3` | Exit 0; canonical regression `PASS` |
| `npm run build` | Exit 0; Academy registry passed; Next compiled and generated 127 pages; 19 known Academy notices and five pre-existing broad tracing warnings |
| `npm run test:e2e:level-analysis` | Intentionally not rerun: no app route, server, Next, browser-facing, E2E configuration, or generated browser contract changed |

Focused cadence evidence before the final cycle: A/B 33 tests; C/D plus
architecture 96 tests in the last focused checkpoint; E/H 30 tests; F 38
tests; G 20 tests; FIFO/differential 27 tests; J 15 property tests representing
15,000 runs. The consolidated verifier/full suite above are the authoritative
implementation-head totals.

### Documentation-head checks

After the documentation-only commit, the implementer ran only:

1. `git diff --check origin/main...HEAD`;
2. `npm run verify:ti-v3:private-data`;
3. focused evidence validation for every path, SHA, command, count, and seed in
   this addendum;
4. the repository's available lightweight Markdown/documentation checks.

The exact documentation commit SHA, check results, and current GitHub Actions
runs are pinned in the final remediation comment on draft PR #104. Full local
Vitest, property, differential, TypeScript, build, and Playwright commands were
not duplicated after the documentation-only commit.

### Re-audit stop condition

GA0-A2 remains unaccepted. PR #104 remains draft and must not be merged. No
GA0-A3, analytics, chart, AI, market data, support/resistance, manual entry,
reflection, Real Coach/Whop, migration, hosted-user, deployment, or production
work is included. The exact next action is independent re-audit of the current
PR head against this addendum and the complete `origin/main...HEAD` diff.

## 1. Document purpose

This is the implementation engineer's evidence-oriented handoff for independent audit of Trader Intelligence v3 GA0-A2. It is not proof that the implementation is correct, it is not architecture authority, and it is not an acceptance decision. The independent auditor must verify every claim against the complete `origin/main...HEAD` diff, Git history, runtime source, tests, local command results, and current-head GitHub Actions evidence.

The handoff deliberately identifies possible defects and test gaps even where the existing suite passes. GA0-A3 must not begin, and PR #104 must not be merged, unless and until an independent auditor accepts GA0-A2.

## 2. Repository and immutable audit target

| Item | Value |
| --- | --- |
| Repository | `traderslink-bot/traderslink-trader-improvement-system` |
| Local worktree | `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v3-ga0-a2-exact-truth` |
| Branch | `agent/trader-intelligence-v3-ga0-a2-exact-truth` |
| Pull request | Draft PR #104, `https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/104` |
| PR state when this document was authored | Open, draft, reported mergeable/clean; not merged |
| Immutable implementation head before this handoff | `d7b94fd3e9ba817acce5925f2eb869d453a2ce41` |
| Final handoff head | The commit containing this tracked file. Resolve immutably with `git log -1 --format=%H -- src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md`; the exact published SHA and final-head CI runs are pinned in the implementer handoff comment on PR #104. A commit cannot truthfully embed its own SHA because changing this field changes that SHA. |
| `origin/main` | `4f9e440116258c9548a2d13f7ea057a9075101c6` |
| Merge base | `4f9e440116258c9548a2d13f7ea057a9075101c6` |
| Ahead/behind before handoff commit | `0 6` from `git rev-list --left-right --count origin/main...HEAD` (main-only commits first, branch-only commits second) |
| Expected ahead/behind after handoff commit | `0 7`; auditor must verify rather than infer |
| Branch creation baseline | Latest `origin/main`, `4f9e440116258c9548a2d13f7ea057a9075101c6` |
| Handoff authored | `2026-07-18 12:04:31 -04:00`, America/Toronto |
| Node | `v24.11.0` |
| npm | `11.6.1` |
| Operating system | Windows 11 Home 64-bit, version/build `10.0.26200` / `26200` |
| Did `origin/main` advance during implementation? | No. It remained at the branch baseline. |
| New main overlap with GA0-A2 paths | None, because main did not advance. |
| Worktree clean before handoff creation | Yes; `git status --short` returned no entries. |

Publication evidence is necessarily split: this file fixes the exact implementation target and audit map; the final commit SHA and CI facts that exist only after this file is committed are recorded in the current-head PR comment. The auditor must compare the PR head to the commit containing this file and reject any mismatch.

## 3. Intended GA0-A2 scope

The branch is intended to establish the non-UI exact-truth domain layer: validated canonical decimal strings and wrappers; reduced exact ratios; canonical timestamps and serialization; domain-separated SHA-256 identities; a canonical execution contract; separate deterministic storage and meaningful economic ordering; duplicate, re-export, correction, ambiguity, and collision classification; FIFO inventory and analytical journal P/L; exact fee/rebate recognition; open-position preservation; prior-inventory, correction, currency, instrument, and basis blocking; reversals; an independent BigInt reference ledger; differential and fixed-seed property tests; synthetic fixture metadata; SQLite `TEXT` compatibility; architecture/private-data guards; and continuity/ADR documentation.

This is a factual-domain slice. It adds no route, page, repository, migration, hosted mode, live integration, or user-visible financial output.

## 4. Explicitly excluded scope

The following findings come from inspecting every changed path and the diff, not from a directory-level assumption.

| Excluded category | Diff finding |
| --- | --- |
| GA0-A3 corrections or bitemporal persistence | Confirmed absent. A2 types preserve `correctionState` and `correctionReference`, and the classifier reports correction/bust evidence, but no correction application or persistence was added. |
| Dataset manifests | Confirmed absent. |
| Coverage manifests | Confirmed absent. |
| Analysis eligibility | Confirmed absent. Validation/block states are A2 reconstruction inputs, not the A3 eligibility system. |
| Stable evidence references | Confirmed absent. Source-document digests and row locators are execution facts, not the later evidence-reference system. |
| Analytics tools | Confirmed absent. |
| Weekday analysis | Confirmed absent. |
| Stop-after-loss simulations | Confirmed absent. |
| Date-query UI | Confirmed absent. |
| Charts or chart-ready APIs | Confirmed absent. |
| AI calls | Confirmed absent; architecture guards also reject AI dependencies in the A2 domain. |
| AI prompts | Confirmed absent. |
| Market data | Confirmed absent. |
| SEC integration | Confirmed absent. |
| Halt data | Confirmed absent. |
| Float data | Confirmed absent. |
| Support/resistance changes | Confirmed absent. |
| Setup classification | Confirmed absent. |
| Manual-entry implementation | Confirmed absent. `owner_manual` is only a reserved `sourceKind` so future owner-reported data cannot masquerade as broker evidence. |
| AI period-reflection implementation | Confirmed absent. |
| Real Coach/Whop implementation | Confirmed absent. |
| User-data migration | Confirmed absent. `legacy_migration` is provenance vocabulary only. |
| Real-owner database schema migration | Confirmed absent. The only database activity is an isolated in-memory SQLite `TEXT` test in `ga0-a2-sqlite-text-round-trip.test.ts`. |
| Hosted identity | Confirmed absent. |
| Public users | Confirmed absent. |
| Vercel or production deployment | Confirmed absent. CI wiring changes only add a test step to `.github/workflows/ci.yml`; no deployment workflow or command was introduced or invoked. |

## 5. Complete commit chronology

The six implementation commits below are the complete `origin/main..d7b94fd3e9ba817acce5925f2eb869d453a2ce41` history. The seventh commit is the documentation-only commit containing this handoff; its exact SHA is externally recorded on PR #104 because a tracked file cannot embed the SHA of the commit that contains itself.

| Commit SHA | Subject | Purpose | Files changed | Verification performed after commit |
| --- | --- | --- | ---: | --- |
| `c2b14bf88669f2f1f9c8b86b8f5e0d92e76c07f8` | Establish GA0-A2 exact-truth decisions | Continuity correction and four binding ADRs | 10 | Documentation review and `git diff --check`; final consolidated verification later ran on `d7b94fd3`. |
| `c87602befc3d95d9b3a20f516a444d1277d8028d` | Implement exact values and canonical identity | Dependencies, exact values/ratios, timestamp, serializer, digest, focused tests | 20 | Local exact/canonical checkpoint: 4 files, 36 tests passed; final consolidated verification later ran on `d7b94fd3`. |
| `0efb3f9e387d3002be4806d1df13e24444cbbbbc` | Define canonical execution truth and ordering | Execution contract, ordering, relationship classifier, collision test hash | 11 | Local execution checkpoint: 3 files, 20 tests passed; final consolidated verification later ran on `d7b94fd3`. |
| `5493be011bf58dd58c3cd87a9710cc1fbcca8b16` | Implement exact FIFO analytical P and L | Production ledger, reconstruction, independent BigInt/rational reference, differential tests | 12 | Local accounting checkpoint: 2 files, 17 tests passed after correcting one erroneous test expectation from `24.5` to the exact FIFO value `21.5`; final consolidated verification later ran on `d7b94fd3`. |
| `12e8d227f6722303d8f6febe0c51f07b1287ef49` | Add GA0-A2 fixtures properties and guards | Fixture catalog, SQLite/property tests, architecture rules, CI and legacy naming | 12 | Local checkpoints: fixtures/SQLite/guard 3 files, 36 tests; property 1 file, 8 tests; integrated 13 files, 117 tests. |
| `d7b94fd3e9ba817acce5925f2eb869d453a2ce41` | Record GA0-A2 verification and audit handoff | Final implementation fixes, continuity records, verification evidence | 8 | Full required verification matrix recorded in section 18; implementation-head GitHub CI run `29650742796` and E2E run `29650742790` succeeded. |
| Commit containing this file; resolve with `git log -1 --format=%H -- src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md` | Add GA0-A2 independent audit handoff | Add this audit map and disclose risks/deviations | 1 | Documentation-head checks only: diff check, private-data guard, evidence-reference validation, and any available lightweight Markdown validation. Exact results/current-head GitHub runs are pinned in the final PR comment; see sections 19-20. |

## 6. Complete changed-file inventory

Each final changed path appears once. `A` means added and `M` means modified. The last row is this handoff; the other 60 paths are from `origin/main...d7b94fd3`.

| Path | Change type | GA0-A2 requirement | Runtime/test/docs | Authority | Auditor focus |
| --- | --- | --- | --- | --- | --- |
| `.github/workflows/ci.yml` | M | Focused verification in CI | CI | Supporting | Step runs A2 verifier without deployment. |
| `package-lock.json` | M | Pinned dependencies | Config | Supporting | Only intended lock changes: decimal.js runtime, fast-check/pure-rand dev. |
| `package.json` | M | Dependencies and verifier script | Config | Supporting | Exact script coverage and dependency placement. |
| `plan.md` | M | Continuity | Docs | Governing | A1 accepted; A2 current gate; no false A2 acceptance. |
| `src/docs/codex-project-log.md` | M | Resume continuity | Docs | Supporting | Current branch, verification, next audit action. |
| `src/docs/trader-intelligence-v3-adr-analytical-pnl-and-reconstruction-v1.md` | A | Accounting policy | ADR | Governing | FIFO, charges, blocking, non-tax boundary. |
| `src/docs/trader-intelligence-v3-adr-canonical-execution-ordering-and-identity-v1.md` | A | Execution/order/identity policy | ADR | Governing | Digest inclusions and ambiguity semantics. |
| `src/docs/trader-intelligence-v3-adr-canonical-serialization-and-digest-v1.md` | A | Canonical bytes/digest policy | ADR | Governing | JSON grammar, normalization, hash envelope. |
| `src/docs/trader-intelligence-v3-adr-exact-decimal-v1.md` | A | Exact arithmetic policy | ADR | Governing | Bounds, no rounding, persistence representation. |
| `src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md` | M | System boundary | Docs | Supporting | New layer remains disconnected from routes/current data. |
| `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md` | M | A2 status | Docs | Governing | Implementation versus acceptance wording and deferred A3. |
| `src/docs/trader-intelligence-v3-legacy-hazard-register-2026-07-17.md` | M | Legacy boundary | Docs | Supporting | Legacy fingerprints explicitly non-authoritative. |
| `src/docs/trader-intelligence-v3-project-log.md` | M | Project continuity/evidence | Docs | Highest decision authority | Seeds, commands, limitations, current gate. |
| `src/lib/execution-sources/import-fingerprints.ts` | M | Legacy compatibility | Runtime legacy | Supporting | Type rename only; legacy behavior unchanged and non-authoritative. |
| `src/lib/trader-intelligence-v3/__tests__/architecture-boundary-guard.test.ts` | M | Architecture/number guards | Test | Supporting | AST/regex coverage and bypasses. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-execution.test.ts` | A | Execution validation/digest | Test | Supporting | Provenance conflicts, digest stability, field changes. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-serialization-and-digest.test.ts` | A | Serializer/digest | Test | Supporting | Golden vector, JSON duplicates, Unicode/LF/order. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-timestamp.test.ts` | A | Timestamp | Test | Supporting | UTC grammar, Gregorian validation, lexical chronology. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-exact-decimal.test.ts` | A | Decimal/wrappers | Test | Supporting | Grammar, bounds, signed zero, arithmetic. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-exact-ratio.test.ts` | A | Rational values | Test | Supporting | Reduction, comparison, explicit half-even policy. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-ordering.test.ts` | A | Two ordering concepts | Test | Supporting | Same-time, precision overlap, conflict, stable storage. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-relationship.test.ts` | A | Duplicate/correction/collision | Test | Supporting | State classification; inspect suppression proof gap. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-differential.test.ts` | A | Reference differential | Test | Supporting | Exact production/reference output fields and exclusions. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-ledger.test.ts` | A | FIFO/reconstruction | Test | Supporting | Long/short/reversal/charges/blocks/currencies. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-property-based.test.ts` | A | Fixed-seed properties | Test | Supporting | Generator breadth, seeds, run count, missing properties. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-sqlite-text-round-trip.test.ts` | A | SQLite compatibility | Test | Supporting | `TEXT`, row-ID digest independence, no real schema. |
| `src/lib/trader-intelligence-v3/__tests__/ga0-a2-synthetic-fixtures.test.ts` | A | Fixture inventory | Test | Supporting | Catalog metadata is not 35 end-to-end executed fixtures. |
| `src/lib/trader-intelligence-v3/domain/accounting/analytical-pnl.ts` | A | Ledger partitioning | Runtime | Authoritative candidate | Owner/account/instrument/currency grouping and relationship propagation. |
| `src/lib/trader-intelligence-v3/domain/accounting/fifo-position-ledger.ts` | A | FIFO/P&L | Runtime | Authoritative candidate | Exact conservation, block gates, reversal and cash-flow invariant. |
| `src/lib/trader-intelligence-v3/domain/accounting/index.ts` | A | Accounting exports | Runtime | Authoritative candidate | Export surface only. |
| `src/lib/trader-intelligence-v3/domain/accounting/reconstruction-result.ts` | A | Structured accounting output | Runtime contract | Authoritative candidate | Result/block/lot/round-trip types. |
| `src/lib/trader-intelligence-v3/domain/canonical/canonical-serialization.ts` | A | Canonical bytes | Runtime | Authoritative candidate | Parser correctness, NFC-key collisions, code-point sorting. |
| `src/lib/trader-intelligence-v3/domain/canonical/canonical-timestamp.ts` | A | Canonical time | Runtime | Authoritative candidate | UTC-only parse and precision intervals. |
| `src/lib/trader-intelligence-v3/domain/canonical/index.ts` | A | Canonical exports | Runtime | Authoritative candidate | Export surface only. |
| `src/lib/trader-intelligence-v3/domain/exact/exact-charge.ts` | A | Signed charges | Runtime | Authoritative candidate | Signed value and scale 24. |
| `src/lib/trader-intelligence-v3/domain/exact/exact-decimal.ts` | A | Decimal implementation boundary | Runtime | Authoritative candidate | Sole decimal.js import, overflow and exact operation behavior. |
| `src/lib/trader-intelligence-v3/domain/exact/exact-money.ts` | A | Money/currency | Runtime | Authoritative candidate | Mandatory ISO-like currency and scale. |
| `src/lib/trader-intelligence-v3/domain/exact/exact-percentage.ts` | A | Exact percentage wrapper | Runtime | Authoritative candidate | General-bound wrapper; no display formatting. |
| `src/lib/trader-intelligence-v3/domain/exact/exact-price.ts` | A | Price | Runtime | Authoritative candidate | Nonnegative, scale 12. |
| `src/lib/trader-intelligence-v3/domain/exact/exact-quantity.ts` | A | Quantity | Runtime | Authoritative candidate | Nonnegative general quantity and positive accepted quantity. |
| `src/lib/trader-intelligence-v3/domain/exact/exact-ratio.ts` | A | Exact rational | Runtime | Authoritative candidate | BigInt reduction, digit guard, explicit conversion only. |
| `src/lib/trader-intelligence-v3/domain/exact/index.ts` | A | Exact exports | Runtime | Authoritative candidate | Boundary/barrel exposure. |
| `src/lib/trader-intelligence-v3/domain/execution/canonical-execution.ts` | A | Execution contract | Runtime | Authoritative candidate | Runtime validation completeness and digest field coverage. |
| `src/lib/trader-intelligence-v3/domain/execution/execution-ordering.ts` | A | Storage/economic ordering | Runtime | Authoritative candidate | Evidence scopes, interval overlap, conflicts. |
| `src/lib/trader-intelligence-v3/domain/execution/execution-relationship.ts` | A | Duplicate/correction states | Runtime | Authoritative candidate | Exact duplicate suppression defect described in sections 13/25. |
| `src/lib/trader-intelligence-v3/domain/execution/index.ts` | A | Execution exports | Runtime | Authoritative candidate | Export surface only. |
| `src/lib/trader-intelligence-v3/domain/identity/content-digest.ts` | A | SHA-256 identity | Runtime | Authoritative candidate | Domain parser, lowercase hex, injected test hash boundary. |
| `src/lib/trader-intelligence-v3/domain/identity/index.ts` | A | Identity exports | Runtime | Authoritative candidate | Export surface only. |
| `src/lib/trader-intelligence-v3/domain/index.ts` | M | Domain exports | Runtime | Authoritative candidate | No route integration; public domain surface. |
| `src/lib/trader-intelligence-v3/testing/architecture-boundary-guard.ts` | M | Architecture scan | Test support | Supporting | Coverage is pattern based; known bypasses in section 23. |
| `src/lib/trader-intelligence-v3/testing/collision-test-hash.ts` | A | Collision simulation | Test support | Supporting | Fixed fake digest only; cannot enter production hash default. |
| `src/lib/trader-intelligence-v3/testing/fixtures/ga0-a2-synthetic-fixtures.ts` | A | 35 expectation records | Test support | Supporting | Metadata versus executable-case distinction. |
| `src/lib/trader-intelligence-v3/testing/fixtures/index.ts` | A | Fixture exports | Test support | Supporting | Export surface only. |
| `src/lib/trader-intelligence-v3/testing/index.ts` | M | Test exports | Test support | Supporting | Reference/fixture/builder exports. |
| `src/lib/trader-intelligence-v3/testing/reference/bigint-decimal-reference.ts` | A | Independent arithmetic | Reference | Supporting | No production arithmetic/decimal.js imports. |
| `src/lib/trader-intelligence-v3/testing/reference/fifo-reference-ledger.ts` | A | Independent FIFO | Reference | Supporting | Separately implemented matching; comparison breadth. |
| `src/lib/trader-intelligence-v3/testing/reference/index.ts` | A | Reference exports | Reference | Supporting | Export surface only. |
| `src/lib/trader-intelligence-v3/testing/reference/rational-reference.ts` | A | Independent rational | Reference | Supporting | Separate reduction/arithmetic. |
| `src/lib/trader-intelligence-v3/testing/synthetic-execution-builder.ts` | A | Synthetic execution input | Test support | Supporting | Shared input builder can mask contract errors. |
| `src/scripts/verify-trader-intelligence-v3-architecture.ts` | M | Guard reporting | Verification script | Supporting | Correct scan scopes/counts. |
| `src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md` | A | Independent-audit map | Docs | Supporting only | Verify every claim; this document is not proof or authority. |

## 7. Implementation map by requirement

| Requirement | Primary implementation | Supporting implementation | Tests | ADR/contract | Status | Known limitation |
| --- | --- | --- | --- | --- | --- | --- |
| Exact decimal parser/canonical representation | `domain/exact/exact-decimal.ts` | Wrapper modules | `ga0-a2-exact-decimal.test.ts` | Exact-decimal ADR | Implemented | Audit raw malformed runtime inputs at wrapper boundaries. |
| Signed zero | `exact-decimal.ts` | All wrappers | Exact-decimal tests | Exact-decimal ADR | Implemented | String parser only; no numeric input accepted. |
| Precision/scale limits | `exact-decimal.ts` | Quantity/price/money/charge | Exact-decimal tests | Exact-decimal ADR | Implemented | Property generators do not explore all 48/24 boundaries. |
| Exact money | `exact-money.ts` | `exact-decimal.ts` | Exact-decimal/FIFO tests | Exact-decimal/P&L ADRs | Implemented | Currency grammar is three uppercase ASCII letters, not a live ISO registry. |
| Exact quantity | `exact-quantity.ts` | `exact-decimal.ts` | Exact-decimal/FIFO tests | Exact-decimal ADR | Implemented | Accepted execution quantity has separate positive parser. |
| Exact price | `exact-price.ts` | `exact-decimal.ts` | Exact-decimal/FIFO tests | Exact-decimal ADR | Implemented | Zero price is allowed as nonnegative. |
| Exact charge | `exact-charge.ts` | Money/ledger | Decimal/FIFO tests | Exact-decimal/P&L ADRs | Implemented | Entry charges are recognized immediately, never allocated. |
| Exact ratio/division/rounding | `exact-ratio.ts` | Reference rational | Exact-ratio/FIFO tests | Exact-decimal/P&L ADRs | Implemented | Decimal conversion only policy `ti_v3_round_half_even_v1`; weighted ratios remain rational. |
| Canonical timestamp | `canonical-timestamp.ts` | Execution/order | Timestamp/order tests | Execution ADR | Implemented | Source offset is evidence text, not part of instant parsing. |
| Canonical serializer | `canonical-serialization.ts` | Digest module | Serialization tests/properties | Serialization ADR | Implemented | Domain builders must explicitly sort order-insensitive arrays. |
| Duplicate JSON keys | `parseStrictCanonicalJson` | Normalized-key detection | Serialization tests | Serialization ADR | Implemented | Auditor should fuzz escape/key-normalization parser paths. |
| Unicode and LF normalization | `canonical-serialization.ts` | UTF-8 encoder | Serialization tests | Serialization ADR | Implemented | NFC only, not broader Unicode equivalence. |
| Canonical key/array ordering | `canonical-serialization.ts` | Execution charge builder | Tests/properties | Serialization ADR | Implemented with concern | Charge sorting uses `localeCompare`; audit cross-locale determinism. |
| Digest domain separation/SHA-256/validation | `identity/content-digest.ts` | Node `crypto` | Serialization/execution tests | Serialization/execution ADRs | Implemented | Test hash injection is public API and must remain testing-only by convention/import guards. |
| Digest collision handling | `execution-relationship.ts` | `collision-test-hash.ts`, ledger block | Relationship/FIFO tests | Execution ADR | Implemented | Collision requires relationship classification to reach reconstruction. |
| Canonical execution schema/provenance | `canonical-execution.ts` | Synthetic builder | Canonical-execution tests | Execution ADR | Implemented with concerns | `executionIdOrderingSemantics` lacks runtime enum validation; malformed untyped arrays/validation objects can throw. |
| Source aggregation/instrument/account/document | `canonical-execution.ts` | Reconstruction | Execution/FIFO tests | Execution ADR | Implemented | Account key is validated opaque text; adapter derivation is deferred. |
| Economic versus storage ordering | `execution-ordering.ts` | Timestamp intervals | Ordering/property tests | Execution ADR | Implemented | Broker-index evidence scope and unknown precision need independent scrutiny. |
| Duplicate/re-export/correction/repeated fill | `execution-relationship.ts` | Ledger relationship gates | Relationship/property/FIFO tests | Execution ADR | Potential blocker | Same execution ID/economic subset/same document can be suppressible despite unequal canonical bytes. |
| FIFO long/short/partial/reversals | `fifo-position-ledger.ts` | Result contracts | FIFO/differential/property tests | P&L ADR | Implemented | Properties generate only long-to-short reversals; short-to-long is deterministic only. |
| Charges/gross/net/cash flow | `fifo-position-ledger.ts` | Exact modules/reference | FIFO/differential/property tests | P&L ADR | Implemented | Cash-flow comparison applies at flat; no unrealized P/L. |
| Open/prior inventory | `fifo-position-ledger.ts` | Result contracts | FIFO tests | P&L ADR | Implemented | Prior inventory property is deterministic, not fast-check generated. |
| Currency separation | `analytical-pnl.ts` | Ledger currency checks | FIFO tests | P&L ADR | Implemented | No fast-check currency-isolation suite. |
| Instrument/corporate-action blocking | `fifo-position-ledger.ts` | Execution states | FIFO tests | P&L ADR | Implemented | Only `common_stock` is supported. |
| Weighted average ratios | `fifo-position-ledger.ts` | `exact-ratio.ts` | FIFO/ratio tests | P&L ADR | Implemented | Differential suite does not compare every weighted-ratio/round-trip field. |
| Independent reference | `testing/reference/*` | Shared types/builder | Differential/property tests | P&L ADR | Implemented with limitation | Production ordering and canonical execution builder feed the reference tests. |
| Differential testing | `ga0-a2-fifo-differential.test.ts` | Reference ledger | Same | P&L ADR | Implemented | Compares core totals, not every diagnostic/result field. |
| Property testing | `ga0-a2-property-based.test.ts` | fast-check | Same | Active plan | Implemented with deviations | Eight 1,000-run suites; requested currency/prior properties are deterministic instead. |
| Synthetic fixtures | `testing/fixtures/ga0-a2-synthetic-fixtures.ts` | Synthetic builder | Fixture catalog and focused behavior tests | Active plan | Incomplete evidence | All 35 expectation rows exist, but the catalog test does not execute 35 complete scenarios. |
| SQLite `TEXT` round trip | `ga0-a2-sqlite-text-round-trip.test.ts` | better-sqlite3 test dependency | Same | Exact-decimal ADR | Implemented | In-memory compatibility only; no production migration. |
| No-JavaScript-number authority | Architecture guard | AST scan | Architecture test | Exact-decimal ADR | Implemented with scope limit | Scan targets exact/accounting/reference paths, not all possible future v3 files. |
| Legacy compatibility | `import-fingerprints.ts` | Architecture rules/docs | Architecture/legacy tests | Hazard register | Implemented | Legacy algorithm remains non-authoritative and unchanged. |

## 8. Architecture Decision Records

All four expected ADRs exist. Their status is `Accepted for GA0-A2 implementation; pending independent GA0-A2 acceptance` rather than proof of implementation correctness.

| Path/title | Principal decision | Rejected alternatives | Governed implementation | Enforcing tests | Unresolved/deferred owner |
| --- | --- | --- | --- | --- | --- |
| `src/docs/trader-intelligence-v3-adr-exact-decimal-v1.md` — Exact Decimal v1 | Canonical strings at boundaries; cloned decimal.js internally; 48/24 bounds; no implicit division/rounding | JS `number`, SQLite `REAL`, decimal objects across contracts, silent rounded division | `domain/exact/*`, accounting arithmetic | Exact decimal/ratio, FIFO, architecture, SQLite | Adapter/persistence schema application belongs to later phases; display policy remains outside authority. |
| `src/docs/trader-intelligence-v3-adr-canonical-serialization-and-digest-v1.md` — Canonical Serialization and Digest v1 | NFC/LF/code-point-key JSON, strict raw parser, SHA-256 domain envelopes | Ordinary `JSON.stringify` as canonical authority, locale ordering, insertion-order identity, non-cryptographic legacy hashes | `domain/canonical/*`, `domain/identity/*` | Serialization/digest, execution, properties | New domain versions require new domain/version identifiers; persistence manifests are A3+. |
| `src/docs/trader-intelligence-v3-adr-canonical-execution-ordering-and-identity-v1.md` — Canonical Execution, Ordering, and Identity v1 | Provenance-rich immutable content; separate storage/economic order; ambiguity remains explicit | DB IDs/UUIDs in identity, lexical execution ID as assumed economics, fabricated child fills, silent dedup | `domain/execution/*`, collision helper | Execution/order/relationship/properties | Broker adapter declarations, correction application, evidence refs are later work. Runtime validation and suppression concerns remain audit questions. |
| `src/docs/trader-intelligence-v3-adr-analytical-pnl-and-reconstruction-v1.md` — Analytical P/L and Reconstruction v1 | Exact FIFO analytical journal P/L; charges at execution; flat cash-flow invariant; fail-closed boundaries | Tax/cash/broker authority, implicit FX, average-cost authority, invented prior basis, fee allocation | `domain/accounting/*`, reference ledger | FIFO, differential, property, SQLite | Market-price unrealized P/L, correction application, corporate-action resolution, and migration remain later work. |

## 9. Exact decimal implementation details

- Library: `decimal.js` `10.6.0`, used through a locally cloned constructor with precision `128`, `ROUND_HALF_EVEN`, and exponent thresholds outside supported inputs. The only runtime import is `src/lib/trader-intelligence-v3/domain/exact/exact-decimal.ts`; focused tests exercise the public boundary without creating a second implementation.
- Input grammar: `^-?(?:0|[0-9]+)(?:\.[0-9]+)?$`. The parser rejects a leading plus, leading zeroes other than `0`, whitespace, commas, exponent notation, hexadecimal, malformed signs, empty strings, `NaN`, and `Infinity`.
- Output grammar: the same non-exponent decimal grammar after removal of unnecessary leading/fractional zeroes. It has no plus sign, comma, whitespace, trailing fractional zero, or trailing decimal point. Every signed zero becomes `0`.
- General maximum: 48 significant digits and 24 fractional digits. Quantity and price have maximum fractional scale 12. Money, charges, and derived P/L have scale 24. Accepted execution quantity must be greater than zero; quantity/price otherwise are nonnegative; charges and money amounts are signed.
- Overflow means an operation or accepted input cannot be represented inside the selected type's precision/scale constraints. It returns a structured failure; no value is rounded into range.
- Addition, subtraction, and multiplication use decimal.js internally and revalidate the exact canonical result. Division is not an authoritative decimal operation. `ExactRatio` uses reduced BigInt numerator/positive denominator; conversion requires the named policy `ti_v3_round_half_even_v1`.
- Display rounding is not implemented here and cannot alter authoritative values.
- Current SQLite representation is validated canonical `TEXT`, never authoritative `REAL`. The documented future PostgreSQL general target is `NUMERIC(48,24)`, with narrower validated constraints for quantity/price and validated lowercase digest text (or `bytea` only after an explicit later decision).
- Structured decimal reason codes are `ti_v3_decimal_input_not_string`, `ti_v3_decimal_empty`, `ti_v3_decimal_whitespace_forbidden`, `ti_v3_decimal_exponent_forbidden`, `ti_v3_decimal_locale_format_forbidden`, `ti_v3_decimal_non_finite_forbidden`, `ti_v3_decimal_hex_forbidden`, `ti_v3_decimal_malformed`, `ti_v3_decimal_precision_exceeded`, `ti_v3_decimal_scale_exceeded`, `ti_v3_decimal_negative_forbidden`, `ti_v3_decimal_zero_forbidden`, and `ti_v3_decimal_overflow`.

No runtime code path in `domain/exact`, `domain/accounting`, or `testing/reference` converts exact financial values to JavaScript numbers. This was checked with the AST architecture guard and a manual `rg` review for `Number`, `parseFloat`, `parseInt`, unary plus, `.toNumber`, and financial `Math.*`. The only `Number(...)` calls in the canonical/accounting dependency graph parse bounded Gregorian timestamp components in `canonical-timestamp.ts`; they do not receive a financial value. The audit should independently repeat both the AST test and source search because the present guard scope is not repository-wide.

## 10. Canonical serialization and identity details

The serializer accepts only `null`, booleans, strings, arrays of canonical values, and plain string-keyed objects of canonical values. All JavaScript numbers (including finite values), BigInt, `undefined`, functions, symbols, class instances, sparse/undefined array members, and other noncanonical values are rejected with a code and path. `null` is explicit; omission is expressed only by absence of a property.

Strings and keys are normalized to Unicode NFC, and CRLF or CR is normalized to LF before deterministic JSON escaping. Object keys are sorted by Unicode code point. Arrays preserve declared semantic order; the generic serializer never guesses set semantics. Builders must sort order-insensitive collections explicitly. Output text is UTF-8 encoded for hashing. Timestamps and decimals are not guessed from arbitrary strings: the domain builder validates/canonicalizes them before serializer input.

`parseStrictCanonicalJson` lexes raw JSON before constructing an object. It rejects all numeric tokens and duplicate keys, including keys that become duplicates after NFC/line-ending normalization. Ordinary `JSON.parse` is not allowed to discard a duplicate first.

Identity format is `ti_v3:<domain>:v<version>:sha256:<64-lowercase-hex>`, with current domains `canonical_content`, `canonical_execution`, and `canonical_source_document`. Production hashing is Node's built-in SHA-256. Canonical content, canonical UTF-8 bytes, digest, and envelope metadata are separate, and the digest never covers itself. Database IDs, random IDs, import-batch IDs, mutable UI/review state, and storage-created/updated timestamps are not execution-content fields and therefore cannot affect the execution digest. A digest match is checked against bytes by the relationship classifier; equal digest plus unequal bytes is `digest_collision_detected`.

Collision testing injects a deterministic fake hash returning 64 zeroes into the identity constructor, creates different bytes with equal test digests, and verifies fail-closed classification/ledger behavior. The default production path is still SHA-256.

Golden canonical JSON:

```json
{"a":"é","b":"line\nend","decimals":{"price":"0.125","zero":"0"}}
```

Its canonical-content SHA-256 hex is `cd057af3d1acc94fd1ba34ae5ee610495f8747aa0594fbf673a45116013684e7`.

Worked synthetic examples:

1. `{b: "x", a: "y"}` and an object inserted as `{a: "y", b: "x"}` both serialize to `{"a":"y","b":"x"}` and therefore have the same domain-separated digest.
2. A string containing decomposed `e` plus combining acute and a string containing precomposed `é` both NFC-normalize to `é`; their canonical bytes/digests match.
3. The base synthetic execution has digest `ti_v3:canonical_execution:v1:sha256:25f117a18705afcbf7d74b46e240401c5f1a0acdbd98c9a111505167d8800592`. Changing the exact price produces `ti_v3:canonical_execution:v1:sha256:6d828d487c5128a75aaa16bbeadec8719bc397f6b7b96954c16ff71ef06243ba`; changing source content produces `ti_v3:canonical_execution:v1:sha256:5611977181517a6479945d7739e5083bfe7d0ef0ca769ca858f8b0784a9a8188`.

## 11. Canonical execution contract

All rows below are members of `CanonicalExecutionContent` and are included in its digest unless explicitly marked otherwise. The `CanonicalExecutionEnvelope` adds validation and derived bytes/digest outside digested content.

| Field | Type | Required | Canonicalization | Digest | Validation | Source |
| --- | --- | --- | --- | --- | --- | --- |
| `schemaVersion` | literal `ti_v3_canonical_execution_v1` | Yes | Fixed literal | Yes | Builder-supplied | Domain policy |
| `canonicalOwnerKey` | string | Yes | Preserved lowercase slug beginning `owner_` | Yes | `[a-z0-9_-]`, max 96 | Owner namespace adapter |
| `canonicalAccountKey` | string | Yes | Stable non-account-number lowercase slug beginning `account_` | Yes | `[a-z0-9_-]`, max 96 | Broker/account adapter |
| `sourceIdentity` | string | Yes | Preserved lowercase slug beginning `source_` | Yes | `[a-z0-9_-]`, max 96 | Source adapter |
| `sourceKind` | enum | Yes | Lowercase enum | Yes | Runtime set | Source adapter |
| `evidenceClass` | enum | Yes | Lowercase enum | Yes | Runtime set and source/evidence compatibility | Source adapter |
| `sourceSystem` | string | Yes | Validated opaque name | Yes | Nonempty/bounded | Source adapter |
| `brokerCode` | string | Yes | Validated stable code | Yes | Nonempty/bounded | Broker adapter |
| `sourceDocumentDigest` | typed digest or `null` | Yes | Parsed source-document identity | Yes | Domain/version/lowercase hex | Source adapter |
| `originalSourceRowLocator` | `{kind,value,rowOrderPreserved}` | Yes | Enum, validated value, boolean | Yes | Runtime validation | Source adapter |
| `sourceAggregationState` | enum | Yes | Lowercase enum | Yes | Runtime set | Broker evidence |
| `instrumentResolutionState` | enum | Yes | Lowercase enum | Yes | Runtime set | Resolution adapter |
| `rawBrokerSymbol` | string | Yes | Preserved validated source symbol | Yes | Nonempty/bounded | Broker evidence |
| `stableInstrumentKey` | string or `null` | Yes | Lowercase slug beginning `instrument_` | Yes | Required iff resolved; null otherwise | Resolution adapter |
| `securityType` | string | Yes | Validated stable lowercase value by adapter | Yes | Nonempty/bounded; ledger supports `common_stock` | Source/resolution adapter |
| `basisContinuityState` | enum | Yes | Lowercase enum | Yes | Runtime set | Resolution evidence |
| `executedAt` | canonical UTC timestamp | Yes | Fixed 9-digit fractional seconds and `Z` | Yes | Gregorian parser | Source timestamp adapter |
| `sourceTimezoneEvidence` | string or `null` | Yes | Preserved validated evidence | Yes | Bounded/format-safe | Source evidence |
| `timestampPrecision` | enum | Yes | `date` through `nanosecond`, or `unknown` | Yes | Runtime set | Source evidence |
| `side` | `buy` or `sell` | Yes | Lowercase enum | Yes | Runtime set | Broker/source |
| `brokerPositionEffectEvidence` | enum | Yes | `open`, `close`, `open_and_close`, `unknown` | Yes | Runtime set | Broker/source |
| `shortSaleIndicator` | enum | Yes | Lowercase enum | Yes | Runtime set | Broker/source |
| `quantity` | branded canonical decimal | Yes | Positive, scale <=12 | Yes | Exact parser | Broker/source |
| `price` | branded canonical decimal | Yes | Nonnegative, scale <=12 | Yes | Exact parser | Broker/source |
| `currency` | branded currency | Yes | Three uppercase ASCII letters | Yes | Currency parser | Broker/source |
| `charges` | ordered charge array | Yes | Exact signed amount/currency; builder sorts | Yes, array order | Exact and same-currency validation | Broker/source |
| `brokerReportedNetCashAmount` | exact money or `null` | Yes | Canonical signed decimal | Yes | Exact parser | Broker evidence |
| `orderId` | string or `null` | Yes | Preserved validated identifier | Yes | Bounded safe identifier | Broker/source |
| `executionId` | string or `null` | Yes | Preserved validated identifier | Yes | Bounded safe identifier | Broker/source |
| `brokerExecutionIndex` | digit string or `null` | Yes | Leading-zero-free integer text | Yes | Sequence parser | Broker/source |
| `brokerFillSequence` | digit string or `null` | Yes | Leading-zero-free integer text | Yes | Sequence parser | Broker/source |
| `executionIdOrderingSemantics` | `declared`/`not_declared` | Yes | Lowercase enum by TypeScript | Yes | **Type-only; missing runtime set check** | Broker adapter declaration |
| `correctionState` | enum | Yes | `none`, `correction`, `bust`, `unresolved` | Yes | Runtime set | Broker evidence |
| `correctionReference` | string or `null` | Yes | Preserved validated reference | Yes | Bounded and state-consistent | Broker evidence |
| `validation` | `{state,reasonCodes}` | Envelope | Lowercase state/stable codes | No | Builder checks state | Import validation |
| `canonicalBytes` | `Uint8Array` | Derived | UTF-8 canonical content | No | Serializer result | Domain builder |
| `canonicalContentDigest` | typed digest | Derived | Execution v1 SHA-256 envelope | No (never self-covered) | Identity parser | Domain builder |

Provenance is factual content. Only `broker_csv`/`broker_api` can be `broker_confirmed`; `owner_manual` can be `owner_reported` or `hypothetical`; `paper_trade` must be `hypothetical`; `legacy_migration` must be `migrated_unverified`. Because evidence class is one exclusive enum value, owner-reported or hypothetical content cannot simultaneously be represented as broker-confirmed; an incompatible source/evidence pair returns `ti_v3_execution_evidence_source_conflict`. A broker average-fill row stays one `broker_average_fill` execution. Unresolved/ambiguous/unsupported instruments retain raw symbols but do not receive invented stable identity or FIFO authority.

## 12. Ordering policy

Canonical storage order exists to make persistence/replay stable. It compares canonical UTC timestamp, precision rank, broker execution index/fill sequence, eligible preserved source-row order, and finally canonical digest. The final digest tie-break never supplies economic evidence.

Economically meaningful order uses timestamp precision intervals plus declared evidence. Distinct nonoverlapping instants order chronologically. Overlapping intervals require compatible broker execution indices, same-order fill sequence, an execution ID only when that broker adapter explicitly declares ordering semantics, or preserved row order within the same declared source/document context. Order IDs are contextual grouping evidence only; lexical order IDs are not economic sequence. Greater displayed precision does not automatically put one source observation before another.

Results are `ordered`, `tied_but_economically_equivalent`, `ambiguous_meaningful_order`, or `conflicting_order_evidence`, with stable reasons/evidence. Ambiguous/conflicting order blocks reconstruction. Storage sorting remains deterministic in those states but does not upgrade them.

Synthetic examples:

- Same canonical timestamp, fill sequences `1` then `2` under one order: economically `ordered`.
- Same timestamp, opposing sides, distinct execution IDs, `executionIdOrderingSemantics: not_declared`: `ambiguous_meaningful_order`.
- Minute-precision `13:45` and second-precision `13:45:30` have overlapping possible intervals: ambiguous unless separate valid sequence evidence resolves them.
- Broker index says A before B while preserved source-row sequence says B before A: `conflicting_order_evidence`.
- Two ambiguous same-time fills still sort by their canonical digests for storage; the economic result remains ambiguous and FIFO is blocked.

Auditor focus: `brokerExecutionIndex` comparison can operate across records whose broker/source scopes may deserve tighter constraints, and `unknown` source precision interval behavior should be checked against the ADR. Relation-graph cycle detection reports conflict.

## 13. Duplicate and correction classification

| Enum | Definition/evidence | Suppress? | Review | P/L eligibility as implemented | Tests |
| --- | --- | ---: | --- | --- | --- |
| `exact_duplicate_same_source` | Equal canonical bytes at same source identity/document/row; **also currently returned for same broker/account/execution ID, selected equal economics, and same document even if bytes differ** | Yes | No by type | Not automatically removed by the ledger; upstream must suppress | Relationship/property |
| `same_execution_reexported` | Same stable broker execution scope and selected economic content, different source document | No | Yes before use | Ledger does not itself block this state | Relationship |
| `broker_correction_or_bust` | Changed content under stable execution scope or explicit correction/bust/reference | No | Yes | Ledger blocks as unresolved A2 correction | Relationship/FIFO |
| `possible_duplicate_ambiguous` | Similar economics without proof of identity | No | Yes | Ledger does not itself block this state | Relationship |
| `legitimate_repeated_fill` | Equal-looking economics with distinct stable execution IDs | No | No | Eligible if other gates pass | Relationship/property |
| `digest_collision_detected` | Equal digest, unequal canonical bytes | No | Mandatory/fail closed | Ledger blocks | Relationship/FIFO collision |
| `manual_review_required` | Conflicting or insufficient identity evidence not captured more narrowly | No | Yes | Ledger does not itself block this state | Relationship |
| `distinct_execution` | Evidence establishes separate content/fill | No | No | Eligible if other gates pass | Relationship/property |

The intended rule is that only byte-proven exact duplicates are suppression eligible. The implementation violates that rule in one branch: after the safe byte/same-location case, `classifyExecutionRelationship` can return `exact_duplicate_same_source` for equal selected economics and the same source document under one execution ID although other canonical factual fields differ. Because `result()` makes every `exact_duplicate_same_source` suppressible, this is a potential blocker. Existing tests do not cover that unequal-byte/same-document branch.

Relationship classifications are supplied separately to reconstruction; the ledger blocks collisions and correction/bust, but does not automatically suppress duplicates or block re-export/ambiguous/manual-review states. Passing unreviewed classified inputs directly to the ledger can therefore double count. The independent auditor must decide whether A2's stated pipeline requires a fail-closed resolution gate here.

Collision simulation supplies a test-only injected digest of 64 zeroes to different canonical bytes. Production identity defaults to Node SHA-256 and no real collision search was attempted.

## 14. Analytical P/L policy

This engine computes retrospective analytical journal P/L. It is not tax P/L, broker P/L authority, cash-ledger authority, a live signal, or FX conversion. `reconstructAnalyticalPnl` partitions by canonical owner, account, resolved instrument, and currency. Long inventory is positive; short inventory is negative. Only accepted ordered common-stock executions with resolved correction/instrument/basis states enter a ledger.

FIFO long realization is `(exit price - lot price) * matched quantity`; short realization is `(lot price - cover price) * matched quantity`. Positive signed charges reduce net P/L; negative charges/rebates increase it. Every charge is recognized at its execution time and entry charges are not allocated across later lots. Net is cumulative gross realized P/L minus cumulative signed charges. At flat, the engine separately calculates signed execution cash flow less charges and requires exact agreement.

Partial fills consume FIFO lots exactly. A reversal first closes all opposite inventory and opens the exact remainder in the new direction while keeping one source execution digest and deterministic ledger effects. Open lots remain exact and produce the limitation `ti_v3_open_inventory_remaining`; no unrealized P/L or closed-trade claim is produced. A broker-declared close without available inventory returns `ti_v3_reconstruction_prior_inventory_required` rather than inventing basis. Broker average fills remain one aggregated execution. Unresolved correction/bust, instrument identity, corporate action, symbol continuity, currency change, unsupported security, ambiguous order, digest collision, and exact overflow fail closed. USD and CAD produce separate results and no aggregate. Weighted entry/exit values are reduced exact ratios, never rounded authority.

Worked synthetic examples:

1. Partial long: buy `10` at `1`; sell `4` at `1.5`; sell `6` at `2`. Gross is `(1.5-1)*4 + (2-1)*6 = 8`, charges `0`, net `8`, ending quantity `0`.
2. Partial short: sell `12` at `2`; buy `5` at `1.5`; buy `7` at `1`. Gross is `(2-1.5)*5 + (2-1)*7 = 9.5`, charges `0`, net `9.5`, ending quantity `0`.
3. Long-to-short reversal: buy `10` at `1`; sell `15` at `2` closes `10` for gross `10` and opens short `5`; buy `5` at `1.5` closes it for `2.5`. Gross/net `12.5`, ending quantity `0`.
4. Rebate: buy `10` at `1` with commission `0.1`; sell `10` at `1.5` with rebate `-0.025`. Gross `5`; signed charges `0.075`; net `4.925`. The separate fixture with only `-0.025` in charges has net `5.025`.

Limitations: no market price/unrealized engine; no tax or broker reconciliation authority; no correction application; no prior-inventory import; no corporate-action resolver; only common stock; no FX; no current-data adapter or persistence.

## 15. Production versus reference implementation

Production arithmetic is in `domain/exact/*` using validated canonical strings plus the private cloned decimal.js constructor; production matching is in `domain/accounting/fifo-position-ledger.ts`. Reference arithmetic is a separately written BigInt coefficient/scale representation and reduced rational implementation in `testing/reference/bigint-decimal-reference.ts` and `rational-reference.ts`; reference FIFO is independently matched in `testing/reference/fifo-reference-ledger.ts`.

The reference does **not** import decimal.js, production exact-arithmetic helpers, or production FIFO helpers. It shares TypeScript execution/result vocabulary, stable enum/string values, fixture data, and the synthetic execution builder. The tests also pass the production ordering result into the reference ledger, so ordering is not independently reimplemented or differentially checked. The production canonical execution builder supplies both sides, which can mask shared input-contract defects.

Differential tests compare exact canonical ending quantity, gross realized P/L, signed charges, net P/L, and flat cash-flow total. Failure messages identify the differing field and input scenario. Deterministic and property scenarios cover flat long, flat short, partial long exits, and long-to-short reversal. Excluded from full differential equality are canonical parsing/ordering, collision/correction/prior/basis blocked paths, multi-currency orchestration, every open-lot identifier/effect, weighted-average ratios, all round-trip metadata, and short-to-long generated reversal. The production reference also lacks some production owner/account consistency checks. These are independence/coverage limitations, not proof defects by themselves.

## 16. Synthetic fixture inventory

The `Test` column is intentionally candid. Every row is asserted as fixture metadata in `ga0-a2-synthetic-fixtures.test.ts`; the indicated focused family covers related behavior. The catalog test does not instantiate and execute all 35 rows as independent end-to-end cases.

| Fixture ID | Purpose | Order state | Duplicate state | Expected inventory | Gross | Charges | Net | Block/limitation | Test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `simple_long_round_trip` | One long entry/exit | `ordered` | `distinct_execution` | `0` | `5` | `0` | `5` | None | Catalog; FIFO/differential |
| `multiple_long_entries_one_exit` | Two FIFO entries, one exit | `ordered` | `distinct_execution` | `0` | `25` | `0` | `25` | None | Catalog; FIFO |
| `one_entry_multiple_exits` | Partial long exits | `ordered` | `distinct_execution` | `0` | `7` | `0` | `7` | None | Catalog; FIFO/property |
| `multiple_entries_and_exits` | Multiple FIFO lots/exits | `ordered` | `distinct_execution` | `0` | `21.5` | `0` | `21.5` | None | Catalog; FIFO |
| `simple_short_round_trip` | One short entry/cover | `ordered` | `distinct_execution` | `0` | `5` | `0` | `5` | None | Catalog; FIFO/differential |
| `multiple_short_entries_and_covers` | Multiple short lots/covers | `ordered` | `distinct_execution` | `0` | `9.5` | `0` | `9.5` | None | Catalog; FIFO |
| `long_to_short_reversal` | Sell closes long/opens short | `ordered` | `distinct_execution` | `0` | `12.5` | `0` | `12.5` | None | Catalog; FIFO/property |
| `short_to_long_reversal` | Buy closes short/opens long | `ordered` | `distinct_execution` | `0` | `9.5` | `0` | `9.5` | None | Catalog; FIFO |
| `positive_commissions` | Positive costs reduce net | `ordered` | `distinct_execution` | `0` | `5` | `0.2` | `4.8` | None | Catalog; FIFO |
| `zero_commission` | Exact zero cost | `ordered` | `distinct_execution` | `0` | `5` | `0` | `5` | None | Catalog; FIFO |
| `negative_fee_rebate` | Negative charge increases net | `ordered` | `distinct_execution` | `0` | `5` | `-0.025` | `5.025` | None | Catalog; FIFO/property charge conservation |
| `open_long_inventory` | Preserve open long | `ordered` | `distinct_execution` | `10` | `0` | `0` | `0` | `ti_v3_open_inventory_remaining` | Catalog; FIFO |
| `open_short_inventory` | Preserve open short | `ordered` | `distinct_execution` | `-10` | `0` | `0` | `0` | `ti_v3_open_inventory_remaining` | Catalog; FIFO |
| `prior_long_inventory_missing` | Sell declared close lacks long lot | `ordered` | `distinct_execution` | — | — | — | — | `ti_v3_reconstruction_prior_inventory_required` | Catalog; FIFO |
| `prior_short_inventory_missing` | Buy declared close lacks short lot | `ordered` | `distinct_execution` | — | — | — | — | `ti_v3_reconstruction_prior_inventory_required` | Catalog; FIFO |
| `legitimate_repeated_fills` | Identical economics, distinct IDs | `tied_but_economically_equivalent` | `legitimate_repeated_fill` | `20` | `0` | `0` | `0` | `ti_v3_open_inventory_remaining` | Catalog; relationship |
| `exact_duplicate_same_source` | Identical bytes/location | `tied_but_economically_equivalent` | `exact_duplicate_same_source` | — | — | — | — | `classification_only` | Catalog; relationship/property |
| `reexported_execution` | Same broker ID, new document | `tied_but_economically_equivalent` | `same_execution_reexported` | — | — | — | — | `classification_only` | Catalog; relationship |
| `broker_correction` | Changed economics under ID | N/A | `broker_correction_or_bust` | — | — | — | — | `ti_v3_reconstruction_correction_unresolved` | Catalog; relationship/FIFO |
| `broker_bust` | Explicit bust evidence | N/A | `broker_correction_or_bust` | — | — | — | — | `ti_v3_reconstruction_correction_unresolved` | Catalog; relationship/FIFO |
| `same_timestamp_valid_sequence` | Sequence orders same time | `ordered` | `distinct_execution` | `0` | `5` | `0` | `5` | None | Catalog; ordering/FIFO |
| `same_timestamp_ambiguous_order` | Opposing fills lack sequence | `ambiguous_meaningful_order` | `distinct_execution` | — | — | — | — | `ti_v3_reconstruction_order_ambiguous` | Catalog; ordering/property/FIFO |
| `sub_dollar_price_precision` | 12-scale sub-dollar exactness | `ordered` | `distinct_execution` | `0` | `0.000001` | `0` | `0.000001` | None | Catalog; decimal/FIFO |
| `fractional_quantity` | Fractional shares | `ordered` | `distinct_execution` | `0` | `1.25` | `0` | `1.25` | None | Catalog; decimal/FIFO |
| `large_valid_notional` | Large accepted value | `ordered` | `distinct_execution` | `999999999999` | `0` | `0` | `0` | `ti_v3_open_inventory_remaining` | Catalog; decimal/FIFO |
| `precision_overflow_rejection` | Reject 49 significant digits | N/A | `manual_review_required` | — | — | — | — | `ti_v3_decimal_precision_exceeded` | Catalog; decimal |
| `scale_overflow_rejection` | Reject >12 qty/price scale | N/A | `manual_review_required` | — | — | — | — | `ti_v3_decimal_scale_exceeded` | Catalog; decimal |
| `usd_cad_separate` | No cross-currency aggregate | `ordered` | `distinct_execution` | `USD=0;CAD=0` | `USD=5;CAD=5` | `USD=0;CAD=0` | `USD=5;CAD=5` | `no_cross_currency_aggregate` | Catalog; FIFO |
| `broker_average_fill` | Preserve one aggregate | `ordered` | `distinct_execution` | `125.5` | `0` | `0` | `0` | `ti_v3_open_inventory_remaining` | Catalog; execution/FIFO |
| `unresolved_instrument` | Block unresolved identity | `ordered` | `distinct_execution` | — | — | — | — | `ti_v3_reconstruction_instrument_unresolved` | Catalog; FIFO |
| `corporate_action_basis_blocked` | Block unknown basis | `ordered` | `distinct_execution` | — | — | — | — | `ti_v3_reconstruction_corporate_action_basis_unresolved` | Catalog; FIFO |
| `symbol_change_continuity_blocked` | Block unknown continuity | `ordered` | `distinct_execution` | — | — | — | — | `ti_v3_reconstruction_symbol_continuity_unresolved` | Catalog; FIFO |
| `digest_collision_simulation` | Equal fake digest/unequal bytes | N/A | `digest_collision_detected` | — | — | — | — | `ti_v3_reconstruction_digest_collision` | Catalog; relationship/FIFO |
| `database_id_identity_independence` | Persistence ID cannot affect digest | N/A | `exact_duplicate_same_source` | — | — | — | — | `identity_only` | Catalog; serialization/SQLite |
| `source_economic_identity_change` | Source/economics alter digest | N/A | `distinct_execution` | — | — | — | — | `identity_only` | Catalog; execution/serialization |

Expected golden execution identities are the three values in section 10. Collision expects `ti_v3:canonical_execution:v1:sha256:` followed by 64 zeroes.

## 17. Property-based testing

All suites are in `src/lib/trader-intelligence-v3/__tests__/ga0-a2-property-based.test.ts`, use `verbose: 2`, fixed seeds, and `numRuns: 1000`. Financial inputs are built from BigInt coefficients, never floating point. Positive coefficients range `1..100000`, signed charge coefficients `-1000..1000`, and generated scales `0..4`.

| Suite | Seed | Runs | Generated domain | Assertions | Final result |
| --- | ---: | ---: | --- | --- | --- |
| Flat long | `2026071801` | 1,000 | Two buys/one full sell, exact coefficients/scales/charges | Zero inventory; production/reference gross/net/charges agree; cash-flow equality; charge/rebate conservation; deterministic rerun | Pass |
| Flat short | `2026071802` | 1,000 | Two sells/one full cover | Same invariants for short FIFO | Pass |
| Partial fills | `2026071803` | 1,000 | One entry/two exact partial exits | Matched quantity never exceeds source; ends flat; reference/cash-flow agreement | Pass |
| Reversals | `2026071804` | 1,000 | Long entry, larger sell, cover short remainder | Close plus open remainder conserves reversing execution; ends flat; reference/cash flow/charges agree | Pass |
| Duplicate classification | `2026071805` | 1,000 | Synthetic base and stable execution-ID variations | Exact same object suppressible; distinct stable IDs legitimate and not suppressible | Pass, but misses unequal-byte same-document suppression defect |
| Canonical property order | `2026071806` | 1,000 | Simple ASCII key/value dictionaries in different insertion order | Canonical bytes/digest equal | Pass |
| Digest semantics | `2026071807` | 1,000 | Exact execution price changes; meaningful/reversed/sorted arrays | Semantic change and array order alter digest; explicit set sorting stabilizes it; persistence metadata irrelevant in deterministic companion test | Pass |
| Ambiguous ordering | `2026071808` | 1,000 | Same-time opposing executions with no declared order | Economic state remains ambiguous after deterministic digest storage sort | Pass |

The final isolated run passed 1 file/8 tests in 47.45 seconds of Vitest-reported duration (23.47 seconds test time; 57.3 seconds wall time). No semantic generated counterexample survived into the final implementation. During development, the suites initially hit Vitest's default five-second test timeout; the timeout was raised to 120 seconds without reducing run counts or changing seeds. Shrinking therefore was not exercised for a reported semantic counterexample. No seed changed.

Requested property areas not present as standalone fast-check suites are currency isolation and prior-inventory blocking; these are covered only by deterministic FIFO tests. Short-to-long reversal is deterministic only. The generators do not explore scales 5-24, 48-digit boundaries, overflow, multiple currencies, prior inventory, correction/collision, or corporate-action states. The persistence-ID property is deterministic rather than generated. These are deviations/gaps for audit.

## 18. Test inventory and exact results

The results below are the final comprehensive run on implementation head `d7b94fd3e9ba817acce5925f2eb869d453a2ce41`, immediately before this documentation-only handoff was created. They must not be mistaken for post-handoff-commit results; those are separately recorded under section 19 and in the PR comment.

| Command | Exit | Files | Tests | Passed | Failed | Skipped | Duration | Notes/warnings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `git diff --check origin/main...HEAD` | 0 | 60 changed | — | — | 0 | 0 | 2.1s wall | No whitespace errors. |
| `npm ci` | 0 | — | — | — | 0 | 0 | about 10m wall | Added 605, audited 613; 209 funding notices; 5 vulnerabilities (2 low, 1 moderate, 2 high); deprecated `prebuild-install` warning. No unrelated upgrade. |
| `npx tsc --noEmit --pretty false` | 0 | Project | — | — | 0 | 0 | 53.4s wall | No output. |
| Changed-path `npx eslint` over all 47 changed TS/JS paths | 0 | 47 | — | — | 0 | 0 | 65.1s wall | Zero warnings. Exact path list is recoverable from diff; no TSX changed. |
| `npm run verify:ti-v3:ga0-a2` | 0 | 13 test files plus 2 guards | 117 focused | 117 | 0 | 0 | 261.2s wall; Vitest 111.90s | Architecture and private-data guards also passed. Embedded private scan then reported 23,651 records: 23,586 final tree, 65 history blobs. |
| Exact focused `npx vitest run` over 13 A2/architecture files `--reporter=dot` | 0 | 13 | 117 | 117 | 0 | 0 | 135s wall; Vitest 120.76s | Exact file command in section 27. |
| `npm test` | 0 | 176 | 1,617 | 1,617 | 0 | 0 | 960.7s wall; Vitest 953.97s | Temporary Git fixture printed expected CRLF conversion and `Switched to branch 'feature'` warnings. |
| `npm run verify:ti-v3:architecture` | 0 | 369 scanned code, 42 route, 82 V2 | Guard assertions | All | 0 | 0 | Included in recorded matrix | No violations. Pattern/scope limitations in section 23. |
| `npm run verify:ti-v3:private-data` | 0 | 23,659 records | Guard assertions | All | 0 | 0 | 44.6s wall | 23,586 final-tree records and 73 PR-history blobs; no findings. |
| `npm run verify:layer2` | 0 | — | 13 canonical patterns | 13 | 0 | 0 | 9.3s wall | Pass. |
| `npm run verify:layer3` | 0 | — | Verification contract | All | 0 | 0 | 10.2s wall | PASS. |
| `npm run build` | 0 | Next application | 127 pages | All | 0 | 0 | 472.6s wall | Next 16.2.6; compile about 5m; TS about 2.4m. Warnings: 19 unregistered Markdown docs and 5 Turbopack file-trace warnings. Academy registry summary: 15 courses, 105 modules, 326 rows, 210 required, 264 slugs, 4 hubs, 15 bridges, 15 overrides. |
| `npm run test:e2e:level-analysis` | 0 | 1 Playwright spec | 1 | 1 | 0 | 0 | 326.5s wall; test 19s/run 56.8s | Builds locally first; same build warnings. Synthetic/local only. |
| `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-sqlite-text-round-trip.test.ts --reporter=dot` | 0 | 1 | 2 | 2 | 0 | 0 | 34.5s wall; Vitest 25.32s | In-memory SQLite only. |
| `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-differential.test.ts --reporter=dot` | 0 | 1 | 4 | 4 | 0 | 0 | 34.1s wall; Vitest 25.05s | Production/reference core totals agree for covered cases. |
| `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-property-based.test.ts --reporter=dot` | 0 | 1 | 8 | 8 | 0 | 0 | 57.3s wall; Vitest 47.45s | 8 fixed seeds x 1,000 runs. |
| Architecture-number/A1 command in section 27 | 0 | 7 | 141 | 141 | 0 | 0 | 37.4s wall; Vitest 29.28s | Includes no-number AST guard and current GA0-A1 containment regression tests; temporary Git warnings only. |
| Affected legacy import/reconstruction command in section 27 | 0 | 3 | 42 | 42 | 0 | 0 | 22.7s wall; Vitest 14.17s | Legacy behavior retained; fingerprints only renamed by type. |

Failed/adjusted development attempts that are not final failures: the first specialized Vitest command used a nonexistent nested `__tests__/ga0-a2/...` path and exited 1 with no files, then exact real paths passed; `npm ci` was slow enough to exceed an early invocation timeout, then completed; property suites initially exceeded Vitest's five-second per-test timeout, then passed with 120 seconds and unchanged seeds/runs; one FIFO expected value was corrected from erroneous `24.5` to exact `21.5`; the first `gh pr create` body invocation had a local quoting/SyntaxError before any PR state was created, then the draft PR was created from a patched body file. The first handoff evidence-validator pass also used a single-line literal count check and failed on a deliberate Markdown line wrap in the project log; the corrected validator normalizes whitespace and validates the same count without changing implementation evidence.

## 19. Final-head verification chronology

1. Implementation content head: `d7b94fd3e9ba817acce5925f2eb869d453a2ce41`; all section 18 commands ran there.
2. Handoff creation: this documentation-only file was added without modifying runtime, tests, config, or governing ADRs.
3. Handoff commit/final branch head: the commit returned by `git log -1 --format=%H -- src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md`. Its exact SHA is pinned in the final implementer comment on PR #104.
4. The owner explicitly corrected the closeout protocol for a documentation-only handoff. After that commit, the implementer runs only `git diff --check origin/main...HEAD`, `npm run verify:ti-v3:private-data`, a focused read-only validator for every referenced path/SHA/count/command, and any lightweight Markdown/documentation validation already available. TypeScript, Vitest, property/differential suites, build, and E2E are not locally rerun solely for this Markdown change.
5. The exact post-commit documentation-head exit codes, counts, and warnings cannot be embedded in the commit before those executions occur. They are current-head evidence in the final PR comment. The auditor must not infer them from section 18 and must treat a missing/nonpassing comment record as a failed handoff condition.
6. The branch is then pushed, and current-head GitHub checks are awaited. Any later change to this file would create a new head and require repeating the chronology.

This split is an explicit Git self-reference limitation. Section 18 is executable-implementation evidence for `d7b94fd3`; the later commit changes documentation only. It is not a claim that earlier commands were rerun on the documentation head.

## 20. GitHub Actions evidence

Implementation-head evidence already available for `d7b94fd3e9ba817acce5925f2eb869d453a2ce41`:

| Workflow | Workflow run ID / number | Conclusion | Head | Failed/skipped jobs | Link |
| --- | --- | --- | --- | --- | --- |
| `CI` | `29650742796` / `948` | Success | `d7b94fd3e9ba817acce5925f2eb869d453a2ce41` | No failed jobs; all required steps succeeded | `https://github.com/traderslink-bot/traderslink-trader-improvement-system/actions/runs/29650742796` |
| `Level Analysis Trade Detail Facts` | `29650742790` / `28` | Success | `d7b94fd3e9ba817acce5925f2eb869d453a2ce41` | No failed jobs; failure-artifact upload skipped because the job succeeded | `https://github.com/traderslink-bot/traderslink-trader-improvement-system/actions/runs/29650742790` |

The final handoff-head workflow names, IDs, run numbers, conclusions, exact tested SHA, skipped jobs, and links are pinned in the latest implementer handoff comment on PR #104 after the branch is pushed and checks finish. This file must not be used to claim current-head CI success without cross-checking that comment and GitHub. No deployment workflow was triggered.

## 21. Dependency changes

| Package | Version | Kind | Purpose | Imported where | Security/license note |
| --- | --- | --- | --- | --- | --- |
| `decimal.js` | `10.6.0` exact pin | Runtime | Internal exact decimal arithmetic | Only `domain/exact/exact-decimal.ts` | MIT; already existed transitively as dev, lock entry loses `dev` marker when made direct runtime. |
| `fast-check` | `4.9.0` exact pin | Dev | Fixed-seed property testing | Only `ga0-a2-property-based.test.ts` | MIT; requires Node >=12.17. |
| `pure-rand` | `8.4.2` transitive lock resolution | Dev transitive | fast-check PRNG | Not directly imported | MIT. |

`package.json` adds the two direct packages and `verify:ti-v3:ga0-a2`. `package-lock.json` records those resolutions/integrities and the `pure-rand` transitive package; no other direct dependency was added. Final `npm ci` audit reported 5 existing findings: 2 low, 1 moderate, and 2 high. No unrelated security upgrade was attempted in this slice.

## 22. Data and privacy verification

The final implementation-head command `npm run verify:ti-v3:private-data` passed after scanning 23,659 records: 23,586 final-tree records and 73 blobs from branch history. The post-handoff-commit scan is separately recorded in the PR comment. No finding or new exemption/fixture manifest was introduced.

All A2 executions, keys, symbols, documents, IDs, hashes, and SQLite rows are deliberately synthetic. No real broker CSV, real account identifier, owner-tied symbol/trade value, private source hash, private SQLite database, WAL/SHM, generated trace, screenshot, secret, API key, token, cookie, or raw financial log was added. The SQLite test creates an isolated in-memory database. The auditor should rerun both tree and history modes and inspect the entire branch history independently.

## 23. Architecture guard verification

| Prohibition | Present enforcement | Known bypass possibilities |
| --- | --- | --- |
| Direct `decimal.js` imports outside approved module/tests | AST/import scan and focused assertion | The direct-decimal rule is scoped to v3 core paths; a new legacy/app import could escape it. Test string fixtures must be distinguished from real imports. |
| `Number`, `parseFloat`, financial `parseInt`, unary plus, `.toNumber`, financial `Math.*` in exact/accounting/reference | AST scan plus source assertions | Scope is exact/accounting/reference, not every possible future authoritative v3 module; aliases/wrappers could evade name matching. Timestamp component `Number` is allowed outside financial scope. |
| v3 exact/accounting authority imported from routes | Route import/name scan | Heuristic identifies selected authoritative function names beginning `calculate`, `compute`, `aggregate`, `reconstruct`, or `derive`; inline calls or differently named wrappers could bypass it. |
| V2 import of GA0-A2 internals | V2 dependency scan for `trader-intelligence-v3/domain` | Import through the v3 root/barrel or a local adapter could evade the exact path fragment. Transitive use is not a call-graph proof. |
| Database/ORM dependencies in exact domain | Import-specifier pattern scan | Aliases, transitive wrappers, computed dynamic imports, or unrecognized package names could bypass. SQLite exists only in the test file. |
| AI/model dependencies | Import-specifier pattern scan | Semantic calls through an unrecognized local wrapper could bypass. |
| Market-data/SEC/halt/float dependencies | Import-specifier pattern scan | Same pattern/transitive limitation. |
| Support/resistance dependencies | Import-specifier/path pattern scan | Barrel/transitive aliases could bypass. |
| Next.js dependencies in domain/contracts | Import scan | Indirect framework coupling through a local module could bypass. |
| Authoritative logic in routes | Route source heuristic | Not a semantic/call-graph analysis; alternate names/inlining can evade it. |

The recorded architecture run scanned 369 code files, 42 route files, and 82 V2 files with no current violation. The auditor should treat the guard as regression friction, not a proof of architectural purity.

## 24. Deviations from the approved plan

| Plan requirement | Implemented as written | Deviation | Reason | Risk | Auditor decision needed |
| --- | --- | --- | --- | --- | --- |
| Only proven exact duplicates suppressible | No | A stable execution ID plus selected equal economics and same source document can return suppressible `exact_duplicate_same_source` despite unequal canonical bytes | Classifier branch uses `economicContentEqual`, not complete bytes | High: a material repeated/corrected fact could be hidden | Potential blocker; require proof/fix decision |
| All 35 fixtures carry expectations and pass exact scenarios | Partly | 35 expectation records exist, but catalog test checks metadata/golden identities rather than executing each complete row | Targeted behavior tests were used instead of a table-driven scenario runner | Medium/high: catalog expectations may be unproved or drift | Decide whether A2 requires executable fixture-per-row coverage |
| 1,000 generated currency-isolation and prior-inventory properties | No | These behaviors are deterministic tests only | Property suite prioritized arithmetic/identity/order | Medium test gap | Decide whether mandatory wording requires added generators |
| 1,000 reversal sequences for both directions | Partly | Generated reversal is long-to-short; short-to-long is deterministic | One generated shape implemented | Medium edge-case gap | Decide whether property symmetry is required |
| Reference independently verifies accepted policy | Partly | Reference has independent arithmetic/matching but receives production-built executions and production ordering result | Input/output types and builder/order were treated as shared contracts | Medium common-mode risk | Assess whether independence is sufficient |
| Differential comparison of exact canonical outputs | Partly | Core totals compare; weighted ratios, lot/effect metadata, blocks, multi-currency orchestration, and ordering are not fully differential | Core financial totals were selected | Medium diagnostic/coverage risk | Decide required comparison breadth |
| Canonical array sorting deterministic by code point | Concern | Execution charge sort uses JavaScript `localeCompare` over ASCII-constrained fields rather than the serializer's explicit comparator | Convenience implementation | Low/medium cross-platform risk; likely stable for allowed ASCII but not contractually proven | Verify on Windows/Linux and decide fix |
| Expected invalid input returns structured result | Partly | Typed ordinary bad values return codes, but malformed untyped `charges`/`validation` shapes can cause property access/iteration errors; ordering-semantics enum lacks runtime validation | Builder assumes TypeScript draft shape | Medium boundary-hardening risk | Decide whether public builder must be total for unknown runtime input |
| Architecture rule forbids decimal.js imports outside approved module | Partly | Guard currently applies its direct-decimal prohibition within v3 core, not every application/legacy path | Scanner classification scope | Medium future-bypass risk | Decide whether guard must be repository-wide |
| Every required property explicitly present | Partly | Persistence-ID behavior is deterministic; matched-quantity property is a partial-long shape; no generated prior inventory/currency | Coverage distributed across deterministic and property tests | Medium | Review requirement interpretation |
| Handoff records its own final SHA/CI in tracked content | Technically impossible | Exact handoff-commit SHA and post-commit CI are recorded in the PR comment and resolved from Git | Git commit hash depends on file content; CI runs after push | Low if PR comment/head are verified; high if evidence is detached | Auditor must pin PR head and commit containing file before audit |
| SQLite compatibility without migration | Yes | None | — | None identified | Verify test uses `TEXT` and no real file |
| Decimal bounds, ratio/division, fee timing, FIFO, no FX | Yes | None identified | — | Audit still required | Independently verify source and vectors |
| Stay inside GA0-A2 | Yes by diff inspection | Reserved source/correction/basis vocabulary exists, but no later-phase behavior | Future-safe factual contract is part of A2 | Low | Confirm vocabulary is not hidden A3 implementation |

## 25. Known defects, limitations, warnings, and open questions

| Classification | Issue | Consequence / question |
| --- | --- | --- |
| Potential blocker | Unequal canonical bytes can be classified as suppressible exact duplicate in the same-document/stable-execution-ID branch. | Violates the stated byte-proof suppression invariant; could suppress a changed factual field. |
| Potential blocker | The 35-item fixture inventory is mainly expectation metadata, not 35 table-driven executable fixtures. | The fixture list can claim expected P/L/block values that no direct test computes. |
| Auditor decision required | Reconstruction blocks collision/correction but does not itself suppress exact duplicates or block re-export, possible-duplicate, or manual-review states. | An unresolved relationship set can reach FIFO and double count unless an upstream consumer enforces a missing gate. |
| Auditor decision required | `executionIdOrderingSemantics` is type-checked but not runtime-enum validated; malformed untyped arrays/validation shapes may throw. | Ordinary adapter input is external in future phases; decide total-validation contract now. |
| Auditor decision required | Charge canonical sorting uses `localeCompare`, not the serializer's code-point comparator. | Verify cross-platform output for permitted values and contract compliance. |
| Auditor decision required | Broker execution index/order evidence scopes and `unknown` precision interval behavior may be broader than intended. | Incorrect economic order could change FIFO realization. |
| Auditor decision required | Reference receives production ordering and builder outputs and compares only core totals. | Common-mode defects or metadata mismatches may be missed. |
| Auditor decision required | Architecture guards are AST/regex heuristics with the bypasses in section 23. | Tests passing is not semantic non-reachability proof. |
| Accepted GA0-A2 limitation | No legacy adapter, current-route consumer, production repository, saved-data migration, schema migration, or user-visible output. | Authority remains isolated until separately accepted integration work. |
| Accepted GA0-A2 limitation | No unrealized P/L, tax P/L, broker/cash authority, FX, corporate-action resolver, or security type beyond common stock. | Engine fails closed or preserves open lots. |
| Accepted GA0-A2 limitation | Property generators use scales 0-4 and modest coefficients; currency/prior states are deterministic only. | Boundary/state exploration is narrower than possible domain bounds. |
| Deferred GA0-A3 | Bitemporal correction application/persistence, manifests, eligibility, snapshots, evidence references, query/filter boundary, backup/restore. | Must not be implemented in this PR. |
| Later public-track work | Hosted identity/persistence, public users, production deployment, privacy/deletion/export operating model. | Outside local private-owner alpha. |
| Repository warning | `npm audit` reports 5 findings: 2 low, 1 moderate, 2 high. | Existing risk; no unrelated upgrade in A2. |
| Repository warning | Build reports 19 unregistered Markdown notices and 5 Turbopack broad-trace warnings. | Existing/non-A2 build warnings; build still succeeds. |
| Evidence limitation | Exact final handoff SHA and post-commit/CI results cannot be self-embedded. | Auditor must use Git plus final PR comment and ensure both identify the same head. |
| Open question | Should relationship resolution be a required pure A2 pipeline stage before `reconstructAnalyticalPnl` rather than a caller convention? | This determines whether duplicates/ambiguities can reach authority. |

## 26. High-risk independent-audit questions

The independent auditor should answer each question with source/test evidence:

- Does any authoritative financial calculation, including a helper outside current scan scope, use JavaScript `number`?
- Are 48/24 general and 12-scale price/quantity bounds applied consistently to inputs and arithmetic outputs, including signed zero and overflow?
- Can division, weighted averages, or display conversion silently round?
- Is canonical JSON deterministic across Windows/Linux, Unicode edge cases, LF variants, escaping, and normalized-key collisions?
- Can duplicate raw JSON keys bypass the custom parser through escapes or normalization?
- Does timestamp parsing or interval comparison ever depend on locale/system timezone?
- Can a persistence/import ID, random ID, storage timestamp, validation/review state, or digest itself alter content identity?
- Does the digest omit any material factual execution field, or include mutable envelope metadata?
- Is lexical execution-ID sorting ever treated as economics without adapter-declared semantics?
- Can ambiguous/conflicting fills or unresolved relationship states reach FIFO P/L?
- Can repeated identical legitimate fills be wrongly suppressed, especially the unequal-byte same-document branch?
- Are correction/bust detection and stable-ID scopes too permissive or too weak?
- Are positive charge and negative rebate signs correct at execution and at flat cash-flow comparison?
- Do both reversal directions conserve close quantity plus open remainder and preserve one source execution identity?
- Do FIFO net P/L and independent signed cash flow agree at every flat boundary?
- Is prior inventory ever invented under open/close/unknown position-effect evidence?
- Can currencies combine within a ledger/result or appear as a cross-currency total?
- Can unresolved/ambiguous instruments, corporate-action basis, or symbol continuity reach P/L?
- Do production/reference engines share too much through builder, ordering, types, or fixtures?
- Do property generators meaningfully explore bounds, negative rebates, partials, both reversal directions, currency, and blocked states?
- Are all 35 fixture expectations independently computed, or merely asserted as metadata?
- Can architecture rules be bypassed through barrels, aliases, dynamic imports, wrappers, alternate function names, or files outside scan scope?
- Are every test/fixture/key/symbol/digest and database row synthetic?
- Did any GA0-A3, analytics, chart, AI, support/resistance, market-data, prototype-port, migration, hosted, or deployment work enter any commit?

## 27. Exact independent-audit commands

Run from a clean checkout/worktree of the final PR head. Do not substitute `main`, use wildcards for focused tests, or use another owner's dirty worktree.

```powershell
git fetch origin --prune
git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git merge-base origin/main HEAD
git rev-list --left-right --count origin/main...HEAD
git log --oneline origin/main..HEAD
git diff --name-status origin/main...HEAD
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD

npm ci
npx tsc --noEmit --pretty false
npm run verify:ti-v3:ga0-a2
npm test
npm run verify:ti-v3:architecture
npm run verify:ti-v3:private-data
npm run verify:layer2
npm run verify:layer3
npm run build
npm run test:e2e:level-analysis
```

Focused exact commands:

```powershell
# 2026-07-18 12:04 America/Toronto — Exact decimals, wrappers, and ratios.
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-exact-decimal.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-exact-ratio.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Canonical timestamp, serialization, raw JSON, and digest.
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-timestamp.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-serialization-and-digest.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Canonical execution.
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-execution.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Economic and storage ordering.
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-ordering.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Duplicate, re-export, correction, repeated-fill, and collision classification.
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-relationship.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Production accounting behavior.
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-ledger.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Independent-reference differential.
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-differential.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Eight fixed-seed property suites.
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-property-based.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — SQLite exact TEXT round trip.
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-sqlite-text-round-trip.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Fixture inventory.
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a2-synthetic-fixtures.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Full 13-file A2 focused replay.
npx vitest run src/lib/trader-intelligence-v3/__tests__/architecture-boundary-guard.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-execution.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-serialization-and-digest.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-timestamp.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-exact-decimal.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-exact-ratio.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-ordering.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-relationship.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-differential.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-fifo-ledger.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-property-based.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-sqlite-text-round-trip.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-synthetic-fixtures.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Architecture-number authority plus GA0-A1 containment.
npx vitest run src/lib/trader-intelligence-v3/__tests__/architecture-boundary-guard.test.ts src/lib/trader-intelligence-v3/__tests__/deployment-and-owner-authorization.test.ts src/lib/trader-intelligence-v3/__tests__/local-persistence-path.test.ts src/lib/trader-intelligence-v3/__tests__/local-request-boundary.test.ts src/lib/trader-intelligence-v3/__tests__/owner-route-boundary.test.ts src/lib/trader-intelligence-v3/__tests__/private-data-guard.test.ts src/lib/trader-intelligence-v3/__tests__/route-containment.test.ts --reporter=dot

# 2026-07-18 12:04 America/Toronto — Affected legacy import and reconstruction regression.
npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-session-time.test.ts src/lib/trader-analytics/__tests__/end-user-workflow-productization.test.ts --reporter=dot
```

For adversarial audit, also add targeted tests for unequal canonical bytes under the same stable execution ID/source document, normalized/escaped duplicate JSON keys, malformed `unknown` drafts, cross-locale charge sorting, and relationship states passed unsuppressed to reconstruction. Do not fix them during the initial audit.

## 28. Auditor access instructions

- Local implementation worktree: `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v3-ga0-a2-exact-truth`.
- GitHub: `https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/104`.
- Branch: `agent/trader-intelligence-v3-ga0-a2-exact-truth`.
- Exact implementation content before handoff: `d7b94fd3e9ba817acce5925f2eb869d453a2ce41`.
- Exact final audit head: the PR #104 head that contains this file; verify with `git log -1 --format=%H -- src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md` and match it to the final implementer PR comment/current check-suite head.
- Handoff: `src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md`.
- Existing clean checkout: `gh pr checkout 104`. If that would alter a dirty/current worktree, create a separate linked worktree from the fetched remote branch instead.

Do not reset, clean, restore, stash, pop, delete, or overwrite the owner's other worktrees. In particular, do not touch or apply the mixed V2 stash/worktree containing manual entry, AI reflections, Real Coach/Whop prototypes, or private SQLite artifacts. The audit needs only the final PR branch and synthetic test data.

## 29. Required audit output

The independent auditor should return:

1. An executive verdict: `accept`, `accept with required fixes`, or `reject`.
2. Findings ordered by severity.
3. For every finding: exact file and line, violated contract, concrete failure path, reproducible evidence, and minimal remediation.
4. Exact-decimal assessment.
5. Serialization/digest assessment.
6. Canonical execution/provenance assessment.
7. Ordering/ambiguity assessment.
8. Duplicate/correction assessment.
9. FIFO/analytical-P&L assessment.
10. Production/reference independence assessment.
11. Property-test quality assessment.
12. Privacy/architecture-guard assessment.
13. Test gaps and any misleading tests or metadata-only fixtures.
14. Confirmation whether every branch commit stayed inside GA0-A2.
15. Residual/deferred risks, with A3 versus later-public-track ownership.
16. Exact commands run, exit codes, test counts, warnings, and current-head CI evidence.

The audit report must distinguish a proven defect from a missing test, an accepted A2 limitation, and deferred A3 work. It must not implement fixes during the initial audit.

## 30. Ready-to-paste independent-auditor prompt

```text
Act as the independent financial-domain, software-architecture, and QA auditor for Trader Intelligence v3 GA0-A2.

Repository: traderslink-bot/traderslink-trader-improvement-system
Base: origin/main at 4f9e440116258c9548a2d13f7ea057a9075101c6
Branch: agent/trader-intelligence-v3-ga0-a2-exact-truth
Immutable implementation content before the documentation handoff: d7b94fd3e9ba817acce5925f2eb869d453a2ce41
Exact final audit head: the PR #104 head containing the handoff file. Before auditing, run `git log -1 --format=%H -- src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md`, match that SHA to `git rev-parse HEAD`, PR #104, the final implementer PR comment, and every current GitHub check. Stop if they differ.
Draft PR: https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/104
Handoff: src/docs/trader-intelligence-v3-ga0-a2-independent-audit-handoff-2026-07-18.md

The handoff is implementer-supplied evidence, not proof or authority. Do not trust its claims without verification. Inspect the entire `origin/main...HEAD` commit history and diff. Read every changed runtime and test file.

Read authority in this order:
1. AGENTS.md
2. plan.md
3. src/docs/trader-intelligence-v3-project-log.md
4. src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md
5. src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md
6. all four GA0-A2 ADRs
7. src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md
8. src/docs/trader-intelligence-v3-legacy-hazard-register-2026-07-17.md

Audit exact decimals/ratios, timestamp/serialization/digest determinism, canonical execution and provenance, storage versus economic ordering, duplicates/re-exports/corrections/collisions, exact FIFO long/short/partial/reversal accounting, charge/rebate conservation, open/prior inventory, currency/basis/instrument blocks, production/reference independence, fixtures, fixed-seed properties, SQLite TEXT compatibility, privacy, legacy isolation, and architecture guards. Pay special attention to the handoff's disclosed unequal-byte duplicate-suppression branch, metadata-only fixture catalog, relationship states reaching reconstruction, runtime validation gaps, localeCompare sorting, reference shared inputs/order, property-generator gaps, and guard bypasses.

Rerun the exact commands in handoff section 27 and add adversarial tests where needed. Use synthetic data only. Do not use live models, external financial/market data, SEC/Nasdaq/FINRA, Whop/payment, Discord, Vercel, production databases, or other production services.

During the initial audit, do not implement fixes. Do not merge the PR. Do not deploy. Do not begin GA0-A3. Do not reset/clean other worktrees or apply the mixed V2 stash.

Return: (1) accept / accept with required fixes / reject; (2) severity-ordered findings; (3) for every finding exact file/line, violated contract, failure path, reproducible evidence, and minimal remediation; (4) separate assessments for decimals, serialization/digest, execution/provenance, ordering, duplicate/correction, FIFO/P&L, reference independence, properties, privacy/guards; (5) misleading tests/gaps; (6) GA0-A2 scope confirmation; (7) deferred risks; and (8) exact commands/results/current-head CI evidence.
```
