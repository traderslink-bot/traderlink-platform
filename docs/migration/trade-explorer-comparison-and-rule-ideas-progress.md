# Trade Explorer Comparison And Rule Ideas Progress

## Status

Complete locally — the owner visually approved the completed Compare Trades page, Rule
idea workflow and related Help structure on 2026-08-18. The deterministic
Rule-idea detector, immutable evidence storage, issuance/disposition safeguards,
Rules-page card and explicit no-result state are implemented. No Rule idea is
silently issued on page load, no rule is activated without the existing visible
confirmation, and no Chat exposure, provider request, trading-fact mutation or
deployment has been accepted.

The owner corrected the navigation boundary: Compare Trades is directly below
Trade Explorer in the left Trades navigation, not in Analytics. Both cross-page
buttons were removed. Future AI-only analytical tools do not receive dashboard
pages merely because AI Chat needs their server-side capability.

## Follow-on: Rule ideas review order and cycling

The 2026-08-23 follow-on is tracked in
[Rule ideas review order and cycling](rule-ideas-review-order-and-cycling-progress.md).
It keeps the 28-day unsolicited/check cadence and 90-day same-preset
suppression, while letting the trader explicitly move through other supported
ideas after dismissing the current one. The order is evidence breadth, not a
claim that one idea is universally best.

## Concurrency boundary

The existing uncommitted Trade Explorer Net/Gross explanation, Review copy,
Rules presentation and progress edits belong to concurrent dashboard review
work. They are preserved. This slice will audit overlaps before every edit and
stage only its explicit files at a verified checkpoint.

## Checkpoints

- [x] Owner approved the comparison workflow, complete Rule candidate target,
  visible cards, evidence calibration and confirmation boundary.
- [x] Owner approved a separate `/analytics/trade-explorer/compare` route. The
  current Trade Explorer remains the default Explore and Review workspace.
- [x] Implement and reconcile the two-group comparison server contract.
- [x] Add the first Compare UI and obtain owner visual/product approval.
- [x] Expand to four groups and saved studies.
- [x] Implement deterministic Rule evidence, lifecycle and dispositions.
- [x] Add the Rule ideas UI and obtain owner visual/product approval.
- [x] Add and visually approve maintained Rule ideas, Trade Explorer and Compare
  Trades Help coverage.
- [x] Add bounded AI Chat reads and capability coverage.
- [x] Complete the current UI/Help verification and narrow local commits.

## Verification record

No test runner is authorized by the repository instructions. The first
checkpoint passed targeted ESLint and the full TypeScript check. Its dedicated
read-only verifier reconciled two groups, eight metric pairs and all 331
supporting trades against one protected account while confirming the database
hash was unchanged. The warmed local route returned HTTP 200 with the expected
Compare trades content. Automated visual inspection remains unclaimed because
the desktop browser connection rejected its own trusted plugin path; owner
visual review on the running controlled dashboard is the remaining checkpoint.

Checkpoint 2 added migration `0060_trade_explorer_comparison_studies` only
after an exact 59-migration backup and restore verification passed. The live
database advanced to 60 migrations. A disposable operational verifier proved
account isolation, stale-update rejection, three immutable lifecycle versions
and zero active records after retirement. Full TypeScript and focused ESLint
passed before the final visual checkpoint; the live comparison route returned
HTTP 200 with the saved-comparison and two-to-four-group copy. The desktop
browser connection continues to reject its own trusted plugin path, so no
automated visual claim is recorded.

The owner visually approved the revised page on 2026-08-18 after Compare
Trades moved directly below Trade Explorer in the Trades navigation and both
cross-page buttons were removed. The final operational comparison verifier
reconciled four groups, 24 compatible metric pairs and all 331 supporting
completed trades while confirming that the protected database was unchanged.
Focused ESLint and live HTTP checks passed; no test runner was used.

## Deterministic Rule evidence checkpoint

- Migration `0061_journal_rule_ideas` adds one account-scoped current record
  and immutable evidence versions. A verified 60-migration backup and restored
  copy were created before the local database advanced to migration 61.
- Candidate evidence reuses the existing preset evaluator. Shared eligibility
  requires three active days, 20 completed Day trades and 50 accepted
  executions. Each issued candidate must also pass its family-specific trigger
  and affected-trade minimums, underperform in total and per-trade average,
  remain negative without its single worst trade, span at least three days and
  keep its largest ticker share at or below one half.
- One new idea may be issued within 28 days. `Not for me` suppresses the same
  preset for 90 days. `Save for later` retains the same record. Every
  disposition uses stale-state and account checks.
- The real-account read-only verifier found five eligible candidates over
  1,521 affected/comparison evidence rows and confirmed the protected database
  hash did not change. An isolated database copy verified four immutable
  lifecycle versions, reissue timing, suppression, retention and stale-change
  rejection. Identifiers stayed redacted.
- The Rules page now has a Rule ideas card. An empty account shows **Check my
  trades**; checking explicitly issues at most one factual idea. **Add rule**
  opens the existing preset editor and its explicit **Activate rule**
  confirmation. Page load, evidence, Save for later and Not for me cannot
  activate a rule.
- The live search starts with the latest 14 calendar days, extends one trading
  date at a time until the shared 3-day/20-trade/50-execution gates are met, and
  then adds 14 available trading dates per pass only when no candidate qualifies.
  It stops at the first qualifying window or after all available account history.
  The shared runtime/verifier path still found five candidates and 1,521 evidence
  rows while leaving the protected database unchanged.
- A completed check with no qualifying candidate now says that no Rule idea met
  every evidence check and that nothing changed. The action becomes **Check
  again** instead of silently returning to the initial prompt.
- Help now uses the visible **Analytics** group and **Analytics Overview** page
  names instead of the internal `Core Analytics` label. A separate **Trade
  Explorer** Help collection owns **Use Trade Explorer** and **Compare Trades**.
  Trading Rules Help documents the Rule idea window, evidence safeguards,
  active-preset exclusion, Save for later, Not for me and confirmation boundary.
- Focused ESLint and whitespace checks passed. The Rule-idea operational verifier
  passed, and the Trade Explorer Help overview, Compare Trades article, Rule ideas
  article and Analytics Help overview each returned HTTP 200 from the canonical
  no-worker port 3010 server. The owner visually approved the result.
- Local commits `e748c956` (**complete rule idea workflow**) and `07ab8799`
  (**separate trade explorer help**) preserve the accepted UI/Help slice. Compare
  Trades remains preserved separately at `e388d083`, and deterministic evidence
  remains preserved at `21339d33`.

## Bounded AI Chat reads checkpoint

- Factual tool contract v3 adds `list_saved_trade_comparisons` and
  `list_rule_ideas`. Both derive the account from the server-owned Chat scope,
  accept at most 10 rows and are read-only.
- Saved comparison results contain validated group names and allowlisted factual
  filters. Study IDs, digests and account-selection references are excluded.
- Saved Rule-idea results contain the exact deterministic configuration,
  disposition, period, eligibility counts, affected/comparison results,
  outlier/concentration checks and historical limitation. Idea IDs, evidence
  digests, fact revisions and supporting round-trip UUIDs are excluded.
- Runtime capabilities v4, provider tool schemas, factual-tool registry,
  dispatcher, evidence links and AI Chat Help match the new reads. The system
  instruction explicitly forbids claiming that Chat created, recalculated,
  saved, dismissed or acted on this evidence.
- The read-only operational verifier returned the one real saved Rule idea. The
  account currently has zero saved comparisons, so a disposable database copy
  proved one non-empty two-group result. Cross-account access was rejected,
  protected identifiers were absent, the private database hash stayed unchanged
  and no provider request was made.
- Focused ESLint and the full TypeScript check pass. Local commit `aad3ef50`
  (**expose saved analysis to AI chat**) preserves this checkpoint.
