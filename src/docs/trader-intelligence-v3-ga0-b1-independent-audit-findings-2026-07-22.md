# Trader Intelligence v3 GA0-B1 Independent Audit Findings

**Date:** 2026-07-22 America/Toronto  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Branch:** `agent/trader-intelligence-v3-ga0-b1-read-model`  
**Draft PR:** #133  
**Immutable branch base and tested-head merge base:** `153eaceecfca714a6c28848b513c412ca76b8e57`  
**Audited executable head:** `5f74202033bf8ab10a48b8cf18ede18137e73bd1`  
**Audited documentation head:** `11dfaaf3118b332b37f8cd7c31957cd240718220`  
**Verdict:** `accept with required fixes`

> This file is independent audit evidence. It is not implementation authority,
> permission to merge, authorization to deploy, or permission to begin GA0-B2.
> PR #133 must remain draft and unmerged until all findings are independently
> re-audited and accepted.

---

## 1. Audited repository state

The audited branch structure was independently confirmed:

1. `153eaceecfca714a6c28848b513c412ca76b8e57` — immutable branch base and merge base;
2. `c8a669e5123410fa0c16c455da9c233092c07a31` — primary executable implementation;
3. `5f74202033bf8ab10a48b8cf18ede18137e73bd1` — executable type-boundary correction and tested executable head;
4. `11dfaaf3118b332b37f8cd7c31957cd240718220` — one documentation-only commit directly after the tested executable head, adding only the required implementation/audit handoff.

At the time of audit:

- PR #133 was open, draft, mergeable, and unmerged;
- the PR base branch was `main`;
- current `main` had advanced by one unrelated commit after the immutable merge base;
- the branch was three commits ahead and one commit behind current `main`;
- GitHub's current-head merge-ref CI still passed against the advanced base;
- no existing review thread, review submission, or PR conversation comment existed;
- no deployment or GA0-B2 work was present.

The complete B1 diff contained 28 files. Every changed runtime, contract, adapter,
dataset, registry, identity-domain, architecture-guard, synthetic-authority, test,
ADR, index, and handoff file was inspected.

---

## 2. What passed independent review

The implementation correctly establishes several important B1 foundations:

- the production-shaped current-data bridge is read-only and truthfully unavailable without a complete exact provider;
- accepted executions, correction replay, relationship resolution, reconstruction, snapshot dependencies, and evidence inventories are substantially rebuilt rather than blindly trusted;
- legacy saved JavaScript-number values, persistence IDs, direct SQLite access, migration, and guessed missing exact facts do not become v3 authority;
- analytical rows copy exact reconstruction P/L, charges, quantity, direction, and supporting execution evidence;
- closed flat-to-flat round trips are the only included financial rows;
- open, blocked, missing-evidence, ineligible, filtered, and ordering-ambiguous candidates are visible;
- caller catalog order and source labels do not control the dataset digest;
- currency partitions are explicit and no FX aggregation is implemented;
- exact values are content-addressed and unit-bearing;
- series points select exact cells from a verified table and keep that table as the accessible alternative;
- canonical builders reject unknown fields and many unsafe input shapes;
- content-addressed artifacts are acyclic and do not reference the final run-receipt digest;
- the registry is contract-only and exposes no runner;
- no weekday tool, daily-stop tool, conclusion threshold, model call, UI, chart rendering, market data, support/resistance, migration, hosted-user behavior, Academy change, deployment, or GA0-B2 work entered the branch.

These strengths must remain intact during remediation.

---

# 3. Required findings

## B1-AUD-R1 — High: starting inventory is not bound to the accepted manifest

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/adapters/snapshot-read-model.ts`
- `src/lib/trader-intelligence-v3/domain/accounting/starting-inventory.ts`
- `src/lib/trader-intelligence-v3/domain/manifest/dataset-manifest.ts`
- adjacent A2/A3 and B1 tests/ADRs

**Problem**

The read-model verifier confirms each supplied starting-inventory object has the
runtime brand, then reruns reconstruction using those supplied objects. It checks
that the rebuilt reconstruction equals the separately supplied reconstruction,
but it never proves the starting-inventory set matches
`manifest.content.priorInventory`.

The accepted manifest commits to ledger key, prior-inventory state, and a contract
digest for accepted prior lots. Starting inventory can change FIFO basis and P/L,
so it is part of snapshot truth rather than an independent adapter option.

**Adversarial path**

A manifest/snapshot can declare a ledger `proven_flat`, while the authority bundle
supplies a separately verified `accepted_prior_lots` starting inventory for the
same ledger and a matching reconstruction built from that different inventory.
The current verifier reruns and matches the supplied reconstruction. The
reconstruction's current execution digest set still matches the snapshot because
prior lots are not part of `inputExecutionDigests`. The same manifest and snapshot
can therefore produce different round trips or P/L.

**Required remediation**

- Establish a deterministic semantic identity for every starting-inventory contract, including `proven_flat`, `accepted_prior_lots`, and `unknown`.
- Bind the exact identity into the dataset manifest, or implement an equally strong one-to-one manifest-to-contract proof.
- Require exactly one supplied starting-inventory contract for every relevant manifest prior-inventory ledger and no extras.
- Verify exact ledger key, owner, account, instrument, currency, state, coverage, as-of time, prior lots, charges, and contract identity.
- Require accepted-prior-lot contract digests to match the manifest.
- Fail closed on missing, extra, duplicate, same-ledger/different-content, state, as-of, or digest mismatch before reconstruction.
- Rebuild any affected manifest/snapshot authority under the accepted versioned policy; do not patch a digest after construction.

**Focused regressions**

- manifest `proven_flat` plus supplied prior lots is rejected;
- manifest prior lots plus supplied `proven_flat` is rejected;
- same ledger/state with changed as-of or lot basis is rejected;
- missing and extra inventory contracts are rejected;
- exact matching contracts succeed;
- persistence ID and caller order changes preserve identity;
- exact P/L cannot change under an unchanged verified manifest/snapshot.

---

## B1-AUD-R2 — High: run contexts can mix unrelated valid-looking digests

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/contracts/run-context.ts`
- proof-contract tests and artifact-identity ADR

**Problem**

`buildAnalysisRunContext` accepts four syntactically valid digest strings and a
caller-declared eligibility state. It does not receive or verify the actual
snapshot, filter, analytical dataset receipt, normalized argument authority, or
registry entry.

A content-addressed run context can therefore combine:

- snapshot A;
- filter B;
- analytical dataset C;
- arbitrary argument digest D;
- caller-declared `eligible`.

Rehashing that mixed content proves only that the mixed claim was hashed, not that
its dependencies agree.

**Required remediation**

- Build a run context from actual verified dependencies, not naked digest strings.
- Require a verified analysis snapshot with dependencies, verified canonical filter, verified analytical dataset receipt, verified normalized-arguments authority, and verified contract-only/executable registry entry as appropriate.
- Prove the dataset receipt's snapshot and filter identities exactly match the supplied snapshot/filter.
- Derive eligibility from the exact snapshot eligibility result for the registry capability; do not accept it as a free caller field.
- Bind tool and policy versions to the verified registry entry.
- Preserve the acyclic graph: verified inputs -> run context -> artifacts -> final receipt.

**Focused regressions**

- mixed snapshot/filter rejected;
- foreign dataset rejected;
- dataset whose snapshot/filter differs rejected;
- forged eligibility state rejected;
- foreign argument authority rejected;
- registry/tool/version/capability mismatch rejected;
- exact matching dependencies produce a deterministic run context.

---

## B1-AUD-R3 — High: evidence bundles can invent evidence membership

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/contracts/evidence-diagnostics.ts`
- dataset/evidence contracts and proof tests

**Problem**

The evidence-bundle builder checks only the syntax and bounds of
`roundTripKeys` and `occurrenceKeys`. It does not receive a verified dataset
receipt, snapshot evidence inventories, or included/excluded candidate catalog.

The focused fixture currently proves this weakness by successfully creating a
verified evidence bundle with arbitrary strings such as `round_trip:one` and
`occurrence:one` that do not resolve to a B1 dataset.

**Required remediation**

- Build evidence bundles from a verified run context plus its verified dataset and snapshot evidence inventories.
- Require exact round-trip and occurrence membership.
- Prove each occurrence belongs to the referenced round trip where required.
- Require `included` evidence to resolve to included analytical rows and `excluded` evidence to resolve to exact excluded candidates/reasons.
- Reject invented keys, keys from another dataset/snapshot, mixed included/excluded membership, and evidence that is not reachable through accepted A3 inventories.
- Preserve persistence-ID independence.

**Focused regressions**

- invented occurrence key rejected;
- invented round-trip key rejected;
- evidence from another snapshot/dataset rejected;
- included bundle referencing an excluded candidate rejected;
- excluded bundle with wrong reason/membership rejected;
- valid row and valid exclusion evidence accepted;
- identical canonical reimport preserves evidence identity.

---

## B1-AUD-R4 — High: a validated claim can assert an effect absent from its table

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/contracts/table-claim-series.ts`
- proof-contract tests and artifact-contract ADR

**Problem**

The claim builder verifies the table and checks only that
`exactEffect.metricKey` equals the claim's declared `metricKey`. It does not prove
that the metric exists in the table, that the exact effect equals a table cell or
summary value, or that a documented deterministic comparison derived the effect.

A caller can create a valid table containing `net_pnl = 4.5`, then supply another
verified exact metric with the same key and value `999`, and receive a
content-addressed `validated_claim`.

**Required remediation**

- Add explicit source-row/source-column or deterministic comparison-derivation references to the claim contract.
- Require the exact effect's digest, unit, currency, and value to resolve to the verified table or an explicit verified derivation from named table cells.
- Reconcile target/comparison sample sizes with the referenced rows/evidence.
- Require direction and unavailable state to agree with the exact effect.
- Keep real wording thresholds and conclusions deferred to B2/B3; B1 fixtures must still prove structural truth.

**Focused regressions**

- same metric key with a foreign value rejected;
- foreign unit/currency rejected;
- metric absent from the table rejected;
- invalid sample counts rejected;
- direction inconsistent with exact effect rejected;
- exact table-cell or verified comparison derivation accepted.

---

## B1-AUD-R5 — High/Medium: table and series scope metadata can contradict their exact values

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/contracts/table-claim-series.ts`
- exact-metric and proof-contract tests

**Problem**

A currency-specific table permits a metric with `currency: null` because it
rejects only a non-null different currency. A series has the same loophole.

The series builder also accepts caller-declared timezone, date basis, denominator
policy, included/excluded counts, accessibility facts, and limitations without
requiring agreement with the source table or run dataset. Thus exact cells may be
selected while their analytical scope is mislabeled or limitations are dropped.

**Required remediation**

- Define and enforce unit-to-currency rules. Money and money-per-trade values in a currency partition must carry the exact matching currency; count/enum/date/duration values must follow an explicit null-currency policy.
- Require series currency, timezone, date basis, denominator policy, counts, eligibility/coverage state, and limitation set to agree with the verified source table and run context, or define a documented conservative transformation that cannot drop limitations.
- Require accessibility summary facts to resolve to table metrics or verified deterministic summaries.
- Prevent a mixed-currency or unlabeled money metric from entering a currency table/series.

**Focused regressions**

- USD money table cell with null currency rejected;
- USD table with CAD series rejected;
- table/series timezone or date-basis mismatch rejected;
- count or denominator mismatch rejected;
- dropped limitation rejected;
- invented accessibility fact rejected;
- exact consistent table and series accepted.

---

## B1-AUD-R6 — High/Medium: final run receipts accept naked artifact digests and caller counts

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/contracts/run-context.ts`
- all proof-artifact builders/verifiers and tests

**Problem**

`buildAnalysisRunReceipt` validates only the syntax of table, claim, series,
evidence, and diagnostics digests. It does not receive the actual verified
artifacts, prove they share its run context, reconcile their graph, or derive
included/excluded counts, limitations, and status.

`verifyAnalysisRunReceipt` can compare against an externally supplied digest list,
but the public builder has already produced a content-addressed receipt from
unproven references. A caller can therefore create a `completed` receipt naming
unrelated valid-looking artifacts and arbitrary counts.

**Required remediation**

- Build the final receipt from actual verified tables, claims, series, evidence bundles, diagnostics, and run context.
- Verify every artifact belongs to the same run context and dependency set.
- Verify claims and series reference supplied verified tables/evidence.
- Derive artifact digests from objects rather than accepting free arrays.
- Derive or reconcile included/excluded counts, limitations, and run status from the dataset and artifacts.
- Reject missing, extra, duplicate, foreign, or internally inconsistent artifacts.

**Focused regressions**

- foreign artifact digest rejected;
- artifact from another run context rejected;
- receipt count mismatch rejected;
- `completed` with limitations or blocked artifact rejected;
- missing diagnostics/evidence rejected where required;
- exact internally consistent graph produces one deterministic receipt.

---

## B1-AUD-R7 — Medium: manifest exclusions lose their primary reason identity

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/adapters/snapshot-read-model.ts`
- `src/lib/trader-intelligence-v3/analytics/dataset/analytical-dataset.ts`
- dataset tests and read-model ADR

**Problem**

Every manifest exclusion is converted to the primary reason
`ti_v3_analytics_open_or_incomplete_lifecycle`, regardless of the manifest's
actual stable reason code. The original reason is retained only as a limitation.
This makes exclusion counts claim an open-lifecycle reason for unrelated manifest
exclusions and weakens the required candidate/reason accounting.

The candidate union also needs an explicit semantic deduplication proof when one
underlying excluded fact is represented by manifest, open-position, or
reconstruction-block evidence.

**Required remediation**

- Define a versioned mapping from accepted manifest exclusion reasons to analytical exclusion reasons without relabeling unrelated exclusions as open lifecycle.
- Preserve the original reason as primary when it is already an accepted stable analytical reason, or use a specific manifest-exclusion reason plus the source reason.
- Define semantic candidate identity across round-trip, inventory, open-position, manifest-exclusion, and reconstruction-block sources.
- Prove every semantic candidate has exactly one final included/excluded outcome and primary-reason counts sum exactly.

**Focused regressions**

- non-lifecycle manifest exclusion is not counted as open lifecycle;
- original stable reason remains inspectable and countable;
- overlapping evidence sources do not double count one semantic candidate;
- distinct candidates sharing evidence remain distinct under documented policy;
- all primary reason counts reconcile to excluded count.

---

## B1-AUD-R8 — High/Medium: New York session classification is not an exchange-session truth contract

**Affected files**

- `src/lib/trader-intelligence-v3/analytics/adapters/session-policy.ts`
- `src/lib/trader-intelligence-v3/__tests__/ga0-b1/analytical-dataset.test.ts`
- session/read-model ADR

**Problem**

The policy classifies sessions only by civil clock time. It does not consult
verified session evidence for weekends, exchange holidays, or early closes. The
focused fixture explicitly labels a Saturday execution as `regular`.

The DST calculation also applies the post-2007 U.S. transition rule to every
canonical year. Historical executions before 2007 can therefore receive the
wrong UTC offset, local date, weekday, and session.

These values will become direct grouping authority for B2, so the issue cannot be
left as presentation metadata.

**Required remediation**

- Separate civil date/weekday conversion from exchange-session classification.
- Use a versioned qualified exchange-calendar/session receipt already bound to the canonical filter, or fail closed when exchange-session evidence is unavailable.
- Do not label weekends or holidays as regular/premarket/after-hours.
- Represent early close and closed/holiday states explicitly or exclude them with stable reasons under the B1 row contract.
- Implement historically correct versioned New York offset rules for the supported date range, or declare and enforce a supported lower date boundary and return unavailable outside it.
- Ensure UTC calendar-day mode does not silently claim exchange-session semantics.

**Focused regressions**

- Saturday and Sunday are not regular sessions;
- known exchange holiday is closed/excluded;
- early-close date respects the verified close;
- 2006 and 2007 DST boundary cases are correct or explicitly unsupported;
- overnight local-date rollover remains correct;
- session/date values remain deterministic and snapshot/filter bound.

---

# 4. Verification evidence

## 4.1 Implementer-supplied local evidence

The handoff reports, at executable head
`5f74202033bf8ab10a48b8cf18ede18137e73bd1`:

- focused B1 dataset tests: 9 passed;
- focused B1 proof-contract tests: 12 passed;
- architecture-boundary unit tests: 41 passed;
- consolidated affected suite: 10 files, 203 tests passed;
- repository-wide TypeScript: exit 0;
- changed-path ESLint: exit 0;
- architecture verifier: exit 0;
- private-data verifier: exit 0;
- `git diff --check`: exit 0.

Those results are implementer evidence, not independently rerun local evidence.

## 4.2 Independently verified GitHub CI

Executable-head CI:

- commit: `5f74202033bf8ab10a48b8cf18ede18137e73bd1`;
- workflow run: `29890629263`;
- job: `88830202020` (`test-and-verify`);
- conclusion: success.

Audited documentation-head CI:

- commit: `11dfaaf3118b332b37f8cd7c31957cd240718220`;
- workflow run: `29890979609`;
- job: `88831209427` (`test-and-verify`);
- conclusion: success.

The current-head job used a clean GitHub-hosted checkout and dependency-install
step and passed the full repository tests, GA0-A2 exact-truth verifier,
architecture verifier, private-data verifier, Layer 2, and Layer 3.

Current-head CI tested GitHub's PR merge ref against the then-current advanced
`main`, not merely the historical branch tip in isolation.

## 4.3 Independent local-command limitation

The auditor runtime had no mounted repository checkout and could not resolve
`github.com` from its shell environment. A direct independent clone/clean-install
command therefore failed before repository access. No local command from that
environment is reported as passed.

This limitation does not make the static findings speculative: each listed
failure path follows directly from a public builder accepting unbound authority
that is not subsequently cross-verified. Passing current tests and CI do not
exercise those adversarial constructions.

---

# 5. Scope assessment

Scope compliance passed. The branch contains no:

- AI/model call or prompt;
- natural-language parser;
- UI, route, React component, or chart renderer;
- weekday analytics implementation;
- daily-stop simulation implementation;
- executable tool runner;
- sample/conclusion threshold policy;
- market-data integration;
- VWAP, setup, catalyst, support/resistance, or coaching logic;
- database migration or direct database adapter;
- hosted/public-user or Academy behavior;
- deployment;
- GA0-B2 work.

The production-shaped bridge remains deliberately unavailable without a complete
exact v3 provider. That limitation is honest and acceptable for B1.

---

# 6. Required remediation process

Remediate on the existing branch and PR #133. Do not create a parallel B1 PR.

During implementation:

- run only focused tests for the authority currently being fixed;
- do not run repository-wide TypeScript after each module;
- run repository-wide TypeScript once near the final executable checkpoint;
- do not run local full `npm test` unless a focused failure proves a concrete broad-regression need;
- do not run Playwright because B1 has no browser-facing code;
- do not repeatedly run the production build;
- run `npm ci` only if package or lock files change;
- let GitHub CI run the broad repository suite and Layer 2/3;
- never report an interrupted, timed-out, inherited, pending, or unrun command as passed.

After all executable remediation, run one final consolidated checkpoint:

1. `git diff --check`;
2. one repository-wide TypeScript run;
3. changed-path ESLint;
4. complete GA0-B1 suites;
5. affected adjacent GA0-A2/A3 suites;
6. exact-truth verifier;
7. architecture verifier;
8. private-data verifier;
9. build only if build-facing configuration or browser code changes.

The final substantive action must be to create:

`src/docs/trader-intelligence-v3-ga0-b1-remediation-and-independent-reaudit-handoff-2026-07-22.md`

The handoff must distinguish the tested executable head from the later
documentation-only head and include a complete ready-to-paste independent
re-auditor prompt.

Do not resolve audit threads, mark PR #133 ready, merge, deploy, or begin GA0-B2.

---

# 7. Completion checklist

- [ ] Starting inventory is exactly bound to manifest/snapshot truth.
- [ ] Run context is built from verified matching dependencies, not free digests.
- [ ] Evidence bundles resolve exact dataset and snapshot membership.
- [ ] Claim effects resolve to exact table values or verified derivations.
- [ ] Table/series currency and scope metadata are consistent.
- [ ] Final receipts are built from verified artifact objects and reconciled counts.
- [ ] Manifest exclusions preserve accurate primary reasons and candidate accounting.
- [ ] Session classification handles weekends, holidays, early closes, and supported historical DST truthfully.
- [ ] Focused adversarial regressions pass.
- [ ] One final TypeScript checkpoint passes.
- [ ] Current-head GitHub CI passes.
- [ ] Detailed remediation/re-audit handoff is committed.
- [ ] PR #133 remains draft and unmerged pending independent re-audit.
- [ ] GA0-B2 has not begun.
- [ ] No deployment occurred.
