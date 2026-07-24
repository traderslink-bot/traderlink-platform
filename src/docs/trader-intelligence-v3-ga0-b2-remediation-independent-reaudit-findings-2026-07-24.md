# Trader Intelligence v3 GA0-B2 Remediation Independent Re-audit Findings

**Date:** 2026-07-24 America/Toronto  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Branch:** `agent/trader-intelligence-v3-ga0-b2-weekday-proof`  
**Draft PR:** `#150`  
**Accepted GA0-B1 merge and immutable B2 merge base:** `7d8d8e03826e4b877b22e9a2a68d381bb42e585d`  
**Original independent findings head:** `d44f3a8a5a4cbd0f3607a56b2d94bfab0a572f9e`  
**Audited remediation executable head:** `07a6827f7b3396aef361d73aac6dceb44f1d4ea8`  
**Audited remediation documentation head:** `0c40eb5abee2e1f77492e929b65a52b6cccb04db`  
**Verdict:** `accept with required fixes`

> This is independent re-audit evidence. It does not authorize merge, deployment,
> review-thread resolution, GA0-B3, or any later slice. The implementation handoff,
> implementer test output, and passing CI were treated as evidence rather than proof.

---

## 1. Independently verified state

- PR #150 was open, draft, mergeable, and unmerged during this re-audit.
- Current `main` remained the accepted B1 merge
  `7d8d8e03826e4b877b22e9a2a68d381bb42e585d`.
- The remediation is one executable commit followed by one documentation-only
  commit.
- All six original audit threads remained unresolved.
- Executable CI run `30069784565`, job `89408059973`, passed.
- Documentation CI run `30070018945`, job `89408750215`, passed.
- Both jobs completed clean checkout, dependency installation, repository tests,
  GA0-A2 exact truth, architecture, private-data, Layer 2, and Layer 3.
- No UI, AI/model, chart renderer, market-data, support/resistance, migration,
  deployment, GA0-B3, or later-slice work entered.

## 2. Independent execution limitation

The audit runtime could not resolve `github.com`, so a clean checkout failed before
checkout or dependency installation. No independent local TypeScript, ESLint,
Vitest, or verifier command is represented as passed.

The audit used immutable GitHub source/diff inspection, adversarial public-contract
analysis, review-state inspection, and executable/documentation-head CI evidence.

---

## 3. Finding disposition

| Finding | Re-audit result |
| --- | --- |
| B2-AUD-R1 semantic replay | satisfied |
| B2-AUD-R2 completion-order after-loss | satisfied |
| B2-AUD-R3 limitation projection | satisfied mechanically; one policy contradiction remains under R4 |
| B2-AUD-R4 final-evidence claim eligibility | partially satisfied; required fixes remain |
| B2-AUD-R5 required decompositions | satisfied |
| B2-AUD-R6 graph budgets | satisfied |

### R1 — Satisfied

The persisted execution now carries a content-addressed execution authority. Re-entry
strictly validates the complete graph, rehydrates the exact B1 derivation from the
read-only source, rebuilds the partition, reruns the weekday tool, canonical-compares
the full supplied and replayed graphs, and returns only the replayed result.

### R2 — Satisfied

After-loss classification now selects only trades with `finalExitAt` strictly before
the current row's `firstEntryAt`, within owner/account/currency/session scope. It uses
the latest completed timestamp and emits an explicit unavailable state when simultaneous
completions disagree on the loss/non-loss state.

### R3 — Satisfied mechanically

The full B2 limitation set is now computed before tables and series are built. Tables,
source-derived series, diagnostics, claims, and the final receipt carry the projected
limitation set. Sample, outlier, directional, after-loss ambiguity, optional-fact
coverage, and exclusion classifications are represented.

### R5 — Satisfied

The implementation now derives deterministic UTC/New York local entry clocks, 30-minute
entry buckets, exact average/median entry minute, exact notional and quantity averages,
medians, availability and exact-value distributions, and target absolute-P/L activity
share.

### R6 — Satisfied

Foundation and canonical validation now bound raw property-key length at 4,096 code
units and charge raw key text against aggregate limits before normalization. Focused
tests cover exact boundary, over-boundary, aggregate-key attacks, and accepted 30-row
and 64-row graphs.

---

# 4. Remaining required fixes

## B2-REAUD-R1 — High/Medium: generic manifest exclusions fail open for claim promotion

**Affected file:**

- `src/lib/trader-intelligence-v3/analytics/tools/weekday/weekday-policy.ts`

The B2 exclusion policy classifies the generic primary reason
`ti_v3_analytics_manifest_excluded` as `intentional_filter`, and every
`intentional_filter` reason is non-claim-blocking.

The accepted B1 manifest contract permits arbitrary stable exclusion reason codes.
The read model maps only known open/lifecycle, correction, coverage, and
reconstruction source reasons to specific analytical classes. Every other manifest
source reason becomes the generic `manifest_excluded` primary reason.

Therefore a new, unknown, evidence-related, coverage-related, or authority-related
manifest reason can become claim-neutral merely because its source string was not
recognized by the B1 substring mapper. `mixed_currency` is also listed as
claim-neutral despite the absence of an FX policy.

### Required remediation

1. Do not decide claim eligibility from the primary reason alone.
2. Evaluate the complete exclusion reason ledger:
   - primary reason;
   - secondary reasons;
   - source reasons;
   - reason authorities;
   - mapping policy key/version.
3. Only explicitly allowlisted canonical-filter or lifecycle exclusions may be
   claim-neutral.
4. Generic/unknown manifest exclusions must fail closed as claim-blocking.
5. Mixed-currency exclusions must be claim-blocking unless a narrowly documented
   exact partition policy proves they cannot affect the claim population.
6. Add exact tests for known neutral filter/lifecycle reasons, unknown manifest
   reasons, evidence/coverage manifest reasons, mixed currency, and input-order
   invariance.

## B2-REAUD-R2 — Medium: claim presence contradicts the formal limited-run contract

**Affected files:**

- `src/lib/trader-intelligence-v3/analytics/tools/weekday/weekday-analysis.ts`
- `src/docs/trader-intelligence-v3-adr-ga0-b2-weekday-deterministic-proof-v1.md`
- focused tests and downstream contract wording

The remediation deliberately marks optional notional/quantity coverage and selected
intentional exclusions as artifact-visible but non-claim-blocking. Those codes enter
every table and series and therefore make the final run receipt `limited`. The claim
gate checks only `claimBlockingLimitationCodes.size === 0`, so a tentative claim may
still be emitted on a formally `limited` run.

The controlling ADR still states that limited or ineligible runs omit claims. Future
UI and AI consumers cannot safely infer whether `runStatus: limited` permits a claim,
because the implementation and decision record disagree.

### Required remediation

Choose one explicit content-addressed policy and apply it consistently:

1. **Strict policy:** every `limited` run omits claims; or
2. **Qualified-claim policy:** distinguish informational-only limitations from a
   claim-limited run in the authoritative status/claim contract, update the ADR,
   registry/output semantics, receipt rules, and consumer invariants, and require
   every emitted claim to carry the informational limitations.

Do not leave a generic `limited` status with ambiguous claim semantics.

Add tests for:

- partial notional coverage on otherwise claim-eligible data;
- partial quantity coverage;
- a neutral canonical-filter exclusion;
- an open-lifecycle exclusion;
- claim presence/absence, claim limitation codes, and exact final status under the
  chosen policy;
- persisted replay of each state.

---

## 5. Residual note, not a blocker by itself

The new execution authority uses the literal alias `weekday_analysis` while the
registered tool key is `analyze_performance_by_weekday`. The authority is also bound
to the registry entry digest and run-context digest, so the replay path still binds
the canonical tool indirectly. The next fix should remove the parallel alias or
explicitly define it as a schema key, ensuring the authority records the exact
registered tool key/version directly.

---

## 6. Required next state

- Keep PR #150 draft and unmerged.
- Leave every independent-review thread unresolved.
- Do not deploy.
- Do not begin GA0-B3.
- Remediate only the two focused findings above, preserve the accepted R1/R2/R3/R5/R6
  behavior, publish a detailed implementation/re-audit handoff, and stop for another
  independent re-audit.
