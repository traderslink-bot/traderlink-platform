# Trader Intelligence v3 GA0-A3 Final Remediation and Independent Re-audit Handoff

Date: 2026-07-19 America/Toronto  
Repository: `traderslink-bot/traderslink-trader-improvement-system`  
Branch: `agent/trader-intelligence-v3-ga0-a3-manifests`  
Draft PR: [#106](https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/106)

## 1. Purpose and evidence warning

This is implementer-supplied evidence for an independent re-audit of the final
focused GA0-A3 remediation findings F1 through F9. It is not proof, an
independent verdict, permission to merge, or authorization to begin GA0-B.
The auditor must verify every claim against code, tests, commit history, the
unresolved PR #106 threads, and CI at the exact current PR head.

PR #106 must remain draft, open, unmerged, and undeployed. Review threads were
intentionally left unresolved.

## 2. Exact repository and head state

- Accepted GA0-A2 base: `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a`.
- Current merge base: `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a`.
- Prior tested remediation executable head:
  `883d62ea009102037626207a96cad31f482ceb4a`.
- Prior remediation documentation/current head at startup:
  `3c229134088bed39d0e60ab9fb75f72c3a066bd5`.
- New tested executable head:
  `f909d584bbbc2bf4aa4c33875a34324c01a753a1`.
- Documentation-only head: the commit containing this file. A commit cannot
  truthfully contain its own SHA without changing that SHA, so the exact
  documentation-only/current PR head is recorded in the PR comment and final
  implementer response after this file is committed.

The only commits after the prior tested executable head and before this work
were Markdown-only. No reset, clean, restore, stash, pop, alternate branch,
main-branch work, PR #104 change, review-thread resolution, merge, migration,
deployment, or GA0-B work occurred.

## 3. Final-remediation commit chronology

1. `883d62ea009102037626207a96cad31f482ceb4a` - prior tested executable head.
2. `df0fa4b7515a61ab36e15f23cd448812bb3065d4` - prior remediation status documentation.
3. `3c229134088bed39d0e60ab9fb75f72c3a066bd5` - prior remediation re-audit handoff.
4. `f909d584bbbc2bf4aa4c33875a34324c01a753a1` - complete GA0-A3 final authority remediation; this is the newly tested executable head.
5. The later Markdown-only commit containing this handoff is identified in PR #106 and the final implementer response.

## 4. Exact changed-file inventory

Executable and focused-test files changed from `3c229134...` through the tested
executable head:

- `src/lib/trader-intelligence-v3/__tests__/ga0-a3/backup-parser.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-a3/filter-validation.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-a3/temporal-lifecycle.test.ts`
- `src/lib/trader-intelligence-v3/domain/accounting/analytical-pnl.ts`
- `src/lib/trader-intelligence-v3/domain/eligibility/capability-eligibility.ts`
- `src/lib/trader-intelligence-v3/domain/evidence/evidence-inventory.ts`
- `src/lib/trader-intelligence-v3/domain/evidence/evidence-reference.ts`
- `src/lib/trader-intelligence-v3/domain/evidence/index.ts`
- `src/lib/trader-intelligence-v3/domain/foundation/runtime-validation.ts`
- `src/lib/trader-intelligence-v3/domain/identity/content-digest.ts`
- `src/lib/trader-intelligence-v3/domain/manifest/dataset-manifest.ts`
- `src/lib/trader-intelligence-v3/domain/query/canonical-filter.ts`
- `src/lib/trader-intelligence-v3/domain/snapshot/analysis-snapshot.ts`
- `src/lib/trader-intelligence-v3/domain/temporal/correction-record.ts`
- `src/lib/trader-intelligence-v3/domain/temporal/retrospective-policy.ts`
- `src/lib/trader-intelligence-v3/ingestion/parser-hardening.ts`

Documentation-only closeout file:

- `src/docs/trader-intelligence-v3-ga0-a3-final-remediation-and-independent-reaudit-handoff-2026-07-19.md`

No package, lock, workflow, route, page, React, Next configuration, database,
WAL, SHM, export, generated artifact, or deployment file changed.

## 5. F1 through F9 implementation map

| Finding | Implementation files | Focused tests | Result | Remaining limitation |
| --- | --- | --- | --- | --- |
| F1 accepted and compatible correction catalog | `correction-record.ts`, `content-digest.ts` | `temporal-lifecycle.test.ts` | Catalog v1 admits only runtime-verified executions with `validation.state === accepted`. Catalog identity includes accepted authority state, validation reasons, catalog policy version, and lineage-compatibility version. Replace actions require exact owner, account, broker, source system, stable instrument, currency, security type, and basis-continuity equality. | V1 deliberately authorizes no instrument, symbol, currency, broker, owner, account, security-type, or basis transition. A future transition requires a separate evidence contract and policy version. |
| F2 `supersededAt` lineage reconciliation | `correction-record.ts` | `temporal-lifecycle.test.ts` | A parent with one child must have `supersededAt` exactly equal to the child `correctedAt`; a terminal correction must have null `supersededAt`. The full lineage is validated independently of the replay cutoff, while only corrections at or before the cutoff change the active set. | The equality policy is intentionally strict v1 and does not infer supersession from another timestamp. |
| F3 content-addressed authoritative retrospective policy | `retrospective-policy.ts`, `capability-eligibility.ts`, `dataset-manifest.ts`, `analysis-snapshot.ts`, `content-digest.ts` | `manifest-eligibility-snapshot.test.ts` | Policy content receives a `retrospective_policy` digest. The exact key/version/digest must be in the manifest. Eligibility identity binds the policy digest and snapshot identity binds the authoritative eligibility-set digest and exact retrospective-policy digest. Pending correction, execution-review-only, incomplete coverage, and coaching-prohibited states affect capabilities independently. | These are eligibility contracts only; no analytics, coaching, AI, simulation, or live guidance is implemented. |
| F4 snapshot deep immutability and integrity | `analysis-snapshot.ts` | `manifest-eligibility-snapshot.test.ts` | Snapshot content is rebuilt from canonical normalized content, including the full canonical filter, policy references, evidence collections, and inventory identities. All nested objects and arrays are frozen. Verification rehashes branded objects and rehashes untrusted persisted content before dependency reconstruction. | Persisted snapshot storage is not implemented in GA0-A3. |
| F5 producer-derived evidence subjects | `analytical-pnl.ts`, `evidence-inventory.ts`, `analysis-snapshot.ts`, `evidence-reference.ts` | `manifest-eligibility-snapshot.test.ts`, adjacent GA0-A2 relationship tests | Execution occurrence inventories derive only from a verified relationship-resolution producer. Round-trip inventories derive only from a runtime-branded exact analytical reconstruction result. Snapshot construction checks inventory execution scope against accepted manifest facts. Evidence uses exact occurrence/round-trip membership, never a prefix or caller-supplied arbitrary string. | A snapshot may carry null inventories, which authorizes no occurrence or round-trip evidence. Actual analytics remain deferred. |
| F6 strict date-resolution receipt | `canonical-filter.ts` | `filter-validation.test.ts`, `manifest-eligibility-snapshot.test.ts` | Resolver output and every session item use exact-field validation. Session date/state/open/close/closure reason, time order, requested date bounds, resolved UTC bounds, timezone-local date, duplicate dates, and deterministic sorting are enforced. Receipt and filter content are canonical deep-frozen copies. | GA0-A3 still defines only the resolver contract; no exchange-calendar provider or query UI exists. |
| F7 source-period and overlap canonicalization | `dataset-manifest.ts` | `manifest-eligibility-snapshot.test.ts` | Per-source periods are sorted and duplicate-rejected. Every source period must exactly appear in manifest coverage. Gaps and overlaps must fit coverage periods. Overlap membership is deduplicated before cardinality, requires two distinct known sources, and the overlap must fit each source period. Gap/overlap contradictions fail. | V1 requires exact source-to-manifest period representation rather than a more permissive interval-union proof. |
| F8 explicit authority-aware safe validation | `runtime-validation.ts` and authority call sites in manifest/filter/snapshot/evidence | `filter-validation.test.ts`, all adjacent GA0-A3 tests | Ordinary nested values are descriptor-inspected and copied into frozen safe null-prototype objects. Proxy values are rejected before traps run. Only explicitly named authority fields may retain identity, and only after their expected runtime brand verifier succeeds. Accessors, symbols, non-enumerables, cycles, sparse arrays, prototype failures, and bounds remain fail-closed. | This is a bounded domain boundary, not general-purpose enterprise input security. |
| F9 escaped quote-pair cell bound | `parser-hardening.ts` | `backup-parser.test.ts`, broker CSV compatibility tests | Capacity is checked before appending every escaped quote pair. Exactly 100,000 decoded quote characters are accepted; the next append returns `ti_v3_parser_oversized_cell` immediately. Normal quoted CSV and sectioned IBKR compatibility remain green. | The legacy parser after preflight remains non-authoritative and is not broadly rewritten. |

## 6. Correction catalog and compatibility policy

`ti_v3_correction_catalog_policy_v1` authorizes only canonical execution
envelopes that pass integrity verification and have accepted validation state.
The catalog digest commits to:

- each canonical execution digest;
- validation state and validation reason codes;
- catalog policy version;
- correction-lineage compatibility policy version.

`ti_v3_correction_lineage_compatibility_v1` requires exact equality of:

- canonical owner;
- canonical account;
- broker code;
- source system;
- stable instrument key;
- currency;
- security type;
- basis-continuity state.

An unknown, duplicated, rejected, quarantined, or incompatible target or
replacement fails closed. V1 contains no implicit transition policy. This
prevents an available digest from changing unrelated factual scope.

## 7. Supersession policy and cutoff replay

The selected deterministic v1 rule is:

```text
parent.temporal.supersededAt === child.temporal.correctedAt
```

A parent with a child and missing/different supersession evidence blocks. A
terminal record that claims supersession blocks. Parent correction time must
precede child correction time. Full lineage structure, branch/cycle/deletion,
compatibility, and supersession evidence are validated independent of input
order. For an as-of cutoff before child correction/supersession, the parent's
replacement remains active. At or after the child time, the child result is
active. Future corrections remain recorded as excluded.

## 8. Retrospective policy and eligibility authority

The policy digest covers state, analysis/correction cutoffs, open-position
policy, included/excluded lifecycle states, version, and the permanent false
live-directional-guidance flag. Same version with different content produces a
different digest. The eligibility calculator requires exact manifest
membership for `ti_v3_retrospective_policy:v1:<digest>`.

Capability behavior added or made explicit:

- `closed_historical_trade` and `same_day_closed_trade` use the ordinary
  coverage/correction/reconstruction rules.
- `open_position_execution_review_only` permits independent execution review
  when evidence allows, while blocking closed-trade analytics, simulations,
  and coaching; live directional guidance remains false.
- `pending_correction` blocks reconstruction-dependent capabilities, limits
  execution review, leaves export independent, and does not globally block
  unrelated evidence capabilities.
- `incomplete_coverage` uses the same conservative rules as manifest gaps,
  prior-inventory incompleteness, unknown coverage, partial account periods,
  and multiple-account partial coverage.
- `ineligible_for_coaching` always blocks coaching even when other
  capabilities remain eligible.

Every supported capability still appears exactly once in deterministic order.

## 9. Snapshot immutability and identity

Snapshot content binds:

- exact manifest and correction cutoff/result;
- exact policy set and retrospective-policy digest;
- authoritative eligibility-set digest;
- verified empty enrichment-set digest;
- intent/rule and analysis cutoffs;
- filter digest and full canonical filter/range content;
- evidence namespace;
- accepted execution, occurrence, correction, policy, and round-trip
  inventories and their producer-derived inventory digests.

Canonical serialization supplies deeply frozen nested records and arrays; the
snapshot does not retain mutable caller arrays. Verification re-computes the
snapshot digest even for a runtime-branded object. For untrusted persisted
input, it first hashes the supplied content itself, then rebuilds from exact
verified dependencies and compares the result. A shallow clone without the
runtime/dependency verification path is not accepted.

## 10. Producer-derived evidence inventories

The occurrence inventory can be built only from a
`CompleteExecutionRelationshipResolution` carrying the accepted opaque runtime
brand. It records exact occurrence keys and input execution digests.

`reconstructAnalyticalPnl` now protects and runtime-brands its completed or
blocked result. The round-trip inventory accepts only that producer result and
derives its keys from actual `flatToFlatRoundTrips`. Snapshot construction
requires inventory input execution digests to be within the manifest's active
accepted set. Evidence references inherit the immutable snapshot inventory and
require exact key membership. Invented suffixes, nonexistent ordinals, and
invented round-trip keys fail.

## 11. Date-session receipt rules

Each `TradingSessionEvidence` item has exactly:

- `sessionDate`;
- `state` (`regular`, `holiday`, or `early_close`);
- `openAt`;
- `closeAt`;
- `closureReasonCode`.

Regular sessions require open/close timestamps and no closure reason. Holidays
require null open/close timestamps and a stable closure reason. Early closes
require open/close timestamps and a stable reason. Open must precede close;
both must be inside the resolved range and resolve to `sessionDate` in the
declared timezone. Session dates must be inside the requested dates, unique,
and canonical-sorted. Calendar-day receipts carry no trading-session evidence.
Canonical identity is independent of resolver object identity or input order.

Focused tests cover fixed clocks, New York DST offset behavior, a holiday,
early close, extra fields, close-before-open, outside-range dates, duplicates,
and post-construction mutation attempts.

## 12. Manifest statement-period and overlap rules

Source periods are canonical-sorted by full range identity and duplicates are
rejected. Source-document ordering includes document digest, kind, deletion
state, and canonical periods. Every source period must exactly occur in the
manifest-level statement-period set. Known gaps must be contained in a
manifest period. Each overlap must:

- name at least two distinct source-document identities;
- name only sources in the manifest;
- fit within a declared period for every named source;
- not contradict a known gap.

Input permutation preserves the digest. Duplicate periods, absent global
periods, a repeated single source masquerading as two sources, and
gap/overlap contradictions fail closed.

## 13. Runtime Proxy-safe copying

The ordinary `validateExactRecord` path no longer preserves arbitrary root
children. It returns frozen safe copies constructed from inspected data
descriptors. Proxy objects are identified and rejected before proxy traps are
invoked. Getter/setter, descriptor, own-key, prototype, symbol,
non-enumerable, cycle, normalized-key collision, depth, node, key, string, and
aggregate limits keep their stable structured failures without source values.

`validateExactRecordWithAuthorities` is a separate explicit path. A caller
must name each field and provide the expected runtime-brand predicate. The
whole value is inspected first; only a successfully branded field retains its
opaque object identity. Manifest correction results, filter receipts, snapshot
dependencies, and evidence snapshots use that path. Arbitrary persisted,
adapter, tool, resolver, or payload children do not.

## 14. Parser escaped-quote bound

The strict CSV row parser checks the decoded cell capacity before appending an
escaped `""` pair, matching the existing check before ordinary character
appends. At policy limit, 100,000 decoded characters are accepted. Attempting
the 100,001st append returns immediately with:

```text
ti_v3_parser_oversized_cell
```

The focused parser test uses synthetic input with 3, 100,000, and 100,001
escaped quote pairs. Existing sectioned broker fixtures remain in the adjacent
compatibility suite.

## 15. Focused implementation checkpoints

Commands run locally during implementation:

1. `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/temporal-lifecycle.test.ts --reporter=dot`
   - Passed: 1 file, 8 tests.
2. `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts --reporter=dot`
   - F3 checkpoint passed: 1 file, 6 tests.
3. `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a2-execution-relationship-resolution.test.ts --reporter=dot`
   - Adjacent GA0-A2 relationship file passed; the GA0-A3 file had one failed persisted-snapshot integrity assertion. The verifier was corrected as recorded below.
4. `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts --reporter=dot`
   - Corrected F4/F5 checkpoint passed: 1 file, 6 tests.
5. `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/filter-validation.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a3/manifest-eligibility-snapshot.test.ts --reporter=dot`
   - Passed: 2 files, 13 tests.
6. `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/filter-validation.test.ts src/lib/trader-intelligence-v3/__tests__/ga0-a3/backup-parser.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts --reporter=dot`
   - Parser and broker files passed. One filter assertion expected the superseded generic code `ti_v3_filter_unverified`; the explicit authority-aware boundary returned `ti_v3_validation_input_invalid` as designed.
7. `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/filter-validation.test.ts --reporter=dot`
   - Corrected F8 checkpoint passed: 1 file, 6 tests.

No focused command that failed is described as passed.

## 16. Final executable checkpoint

The exact tested executable head is:

```text
f909d584bbbc2bf4aa4c33875a34324c01a753a1
```

Local results:

- `git diff --check`
  - Passed with no output before the checkpoint and again before the executable commit.
- `npx tsc --noEmit --pretty false`
  - Initial run exited 1 after 190.7 seconds with seven test-fixture diagnostics because the synthetic `sourceA` variable retained the production `CanonicalSourceDocumentDigest | null` type.
  - The fixture was narrowed to its known non-null synthetic value.
  - Final retry passed with exit 0, no diagnostics, in 54.6 seconds.
- Changed-path ESLint over all 17 executable/test files
  - Passed with exit 0 and no output in 58 seconds.
- `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3 src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-serialization-and-digest.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts --reporter=dot`
  - Passed: 6 files, 89 tests, command duration 67.4 seconds.
- `npm run verify:ti-v3:architecture`
  - Passed: `ok: true`, 397 architecture files, 42 API routes, 82 classified Trader Intelligence routes.
- `npm run verify:ti-v3:private-data`
  - Passed: `ok: true`, 23,716 records, 23,630 final-tree records, 86 PR-history blobs.
- `npm run build`
  - Run exactly once.
  - Passed in 114.7 seconds. Academy registry validation passed; Next.js 16.2.6 compiled; build-time TypeScript completed; 127/127 static pages generated.
  - The build reported the inherited 19 Academy Markdown registry omissions and five broad file-tracing warnings. None points to a changed GA0-A3 path.

`package.json` and `package-lock.json` did not change, so `npm ci` was not run.

## 17. Intermediate failures and corrections

1. The first F4/F5 two-file checkpoint passed all adjacent GA0-A2 relationship
   tests but failed one GA0-A3 assertion: untrusted snapshot verification
   rebuilt trusted dependencies yet did not first hash altered fields supplied
   in the persisted clone. The verifier now rehashes supplied content before
   dependency reconstruction. The focused retry and final 89-test verifier
   passed.
2. The first F8/F9 three-file checkpoint passed parser and broker tests but one
   filter assertion expected the old `ti_v3_filter_unverified` result for a
   cloned receipt. The explicit authority-aware path correctly emits
   `ti_v3_validation_input_invalid`. The regression expectation was updated;
   the affected file and final verifier passed.
3. The first near-final TypeScript run exited 1 with seven identical nullable
   synthetic source-document diagnostics. The fixture is guaranteed to carry
   a source-document digest and was explicitly narrowed. The final TypeScript
   retry passed without diagnostics.

No production/domain safeguard was weakened to make a test pass.

## 18. GitHub CI state

At handoff content creation, the new executable and documentation commits had
not yet been pushed, so no CI run existed for `f909d584...`.

The immediately inherited current PR head at startup was
`3c229134088bed39d0e60ab9fb75f72c3a066bd5`. Its GitHub CI run was:

- Run ID: `29669777650`
- Head SHA: `3c229134088bed39d0e60ab9fb75f72c3a066bd5`
- Conclusion: `success`
- URL: `https://github.com/traderslink-bot/traderslink-trader-improvement-system/actions/runs/29669777650`

That historical success does not prove this remediation. After push, the exact
new-head CI run ID, SHA, status, and conclusion are recorded in the PR comment
and final implementer response. The implementer does not wait indefinitely or
claim an in-progress run passed. GitHub CI, not local execution, owns the full
repository test suite, GA0-A2 verifier, Layer 2, and Layer 3 for the new head.

## 19. Commands deliberately not run

- Full local `npm test`: deliberately left to GitHub CI because no focused
  failure demonstrated a broad regression risk.
- Local GA0-A2 verifier: deliberately left to GitHub CI.
- Local Layer 2 and Layer 3: deliberately left to GitHub CI.
- Playwright: not run because no browser-facing code changed.
- `npm ci`: not run because package and lock files did not change.
- A second build: not run; the required build ran exactly once.
- Vercel, deployment, database migration, production migration, broker API,
  market provider, model, or AI command: not run and not authorized.

## 20. Known limitations and deferred work

- GA0-A3 remains unaccepted pending independent re-audit.
- Contracts remain isolated from routes, pages, saved owner data, and visible
  product surfaces.
- Correction compatibility v1 allows no factual scope transitions; a future
  transition needs separately accepted evidence and a policy version.
- Only the verified empty enrichment set exists.
- The date resolver is a contract boundary, not an exchange-calendar provider.
- Occurrence and round-trip evidence is authorized only when a verified
  producer inventory is supplied; null inventory authorizes none.
- No query UI, natural-language parsing, SQL/analytics DSL, analytics,
  simulations, coaching, visual rendering, chart, export implementation,
  enrichment, or AI explanation is present.
- WAL-safe backup encryption remains external owner-controlled storage.
- The preserved legacy CSV importer remains non-authoritative after preflight.
- No persistence migration, background refresh, scheduled invalidation,
  public identity, entitlement, hosted recovery, or deployment exists.

## 21. Scope confirmation

This final remediation added no GA0-B analytics, weekday analytics,
simulations, coaching, reports, charts, visual rendering, AI/model calls,
prompts, embeddings, natural-language parsing, query UI, support/resistance,
setup classification, market enrichment, manual entry, AI reflections, Real
Coach, Whop, public/hosted users, production migrations, or deployment.

PR #106 remains draft and unmerged. No deployment occurred. GA0-B has not
begun. PR #104 was not modified. Independent review threads remain unresolved.

## 22. Independent re-audit commands

Run from a clean checkout or isolated worktree:

```powershell
git fetch origin --prune
git checkout agent/trader-intelligence-v3-ga0-a3-manifests
git pull --ff-only origin agent/trader-intelligence-v3-ga0-a3-manifests
git branch --show-current
git status --short
git merge-base e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a HEAD
git log --oneline 3c229134088bed39d0e60ab9fb75f72c3a066bd5..HEAD
git diff --stat 3c229134088bed39d0e60ab9fb75f72c3a066bd5...HEAD
git diff 3c229134088bed39d0e60ab9fb75f72c3a066bd5...HEAD
gh pr view 106 --repo traderslink-bot/traderslink-trader-improvement-system --json number,url,isDraft,state,headRefName,headRefOid,mergeStateStatus
gh run list --repo traderslink-bot/traderslink-trader-improvement-system --branch agent/trader-intelligence-v3-ga0-a3-manifests --limit 10
git diff --check
npx tsc --noEmit --pretty false
npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3 src/lib/trader-intelligence-v3/__tests__/ga0-a2-canonical-serialization-and-digest.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts --reporter=dot
npm run verify:ti-v3:architecture
npm run verify:ti-v3:private-data
```

Read the controlling documents in the required order. Then read the latest
independent review, every unresolved PR #106 thread, the original audit file,
the prior remediation handoff, and this file. Independently trace each F1-F9
failure path and try adversarial variants beyond the implementer tests.

## 23. Ready-to-paste independent re-auditor prompt

```text
You are the independent re-auditor for the final focused Trader Intelligence
v3 GA0-A3 remediation in
traderslink-bot/traderslink-trader-improvement-system.

Audit the existing draft PR #106 on branch
agent/trader-intelligence-v3-ga0-a3-manifests. Do not modify code, create a new
branch, resolve review threads, mark the PR ready, merge, deploy, modify PR
#104, or begin GA0-B.

The accepted GA0-A2 base is
e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a. The prior tested remediation
executable head is 883d62ea009102037626207a96cad31f482ceb4a. The prior PR head
before this final remediation is 3c229134088bed39d0e60ab9fb75f72c3a066bd5.
The implementer claims the new tested executable head is
f909d584bbbc2bf4aa4c33875a34324c01a753a1. Confirm the exact current PR head
and CI state yourself.

Read AGENTS.md and all controlling documents in the mandated order. Read the
latest independent PR review and every unresolved inline thread. Then read:

1. src/docs/trader-intelligence-v3-ga0-a3-independent-audit-findings-2026-07-19.md
2. src/docs/trader-intelligence-v3-ga0-a3-remediation-and-independent-reaudit-handoff-2026-07-19.md
3. src/docs/trader-intelligence-v3-ga0-a3-final-remediation-and-independent-reaudit-handoff-2026-07-19.md

The handoffs are implementer-supplied evidence, not proof. Independently audit
F1 through F9 against code, tests, the full diff from 3c229134..., and CI at
the exact current PR head. Specifically attempt rejected/quarantined and
owner/account/broker/instrument/currency/security/basis-incompatible
replacements; missing/false/late supersession evidence around cutoffs; same
policy version with different content and policies absent from the manifest;
pending-correction, execution-review-only, and coaching-prohibited eligibility;
nested snapshot mutation and forged persisted clones; invented occurrence
ordinals/suffixes and round-trip keys; malformed/extra/duplicate/out-of-range
sessions around DST, holiday, and early close; source-period permutations,
duplicates, absent global periods, repeated overlap sources, and contradictory
gaps; stateful proxies/accessors in ordinary and authority-aware payloads; and
100,000 versus 100,001 escaped CSV quote pairs.

Distinguish commands you run from implementer results and inherited CI. Return
an evidence-backed independent verdict and any required fixes. Keep PR #106
draft, unmerged, and undeployed. Do not begin GA0-B.
```
