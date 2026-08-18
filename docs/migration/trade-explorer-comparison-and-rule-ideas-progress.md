# Trade Explorer Comparison And Rule Ideas Progress

## Status

Active — the owner visually approved the completed Compare Trades page on
2026-08-18. It supports two to four groups and private,
immutable-versioned saved comparisons. Deterministic Rule evidence is the next
checkpoint. No Rule idea, Chat exposure, provider request, trading-fact
mutation or deployment has been accepted yet.

The owner corrected the navigation boundary: Compare Trades is directly below
Trade Explorer in the left Trades navigation, not in Analytics. Both cross-page
buttons were removed. Future AI-only analytical tools do not receive dashboard
pages merely because AI Chat needs their server-side capability.

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
- [ ] Implement deterministic Rule evidence, lifecycle and dispositions.
- [ ] Add the Rule ideas UI and obtain owner visual/product approval.
- [ ] Add bounded AI Chat reads and maintained Help/capability coverage.
- [ ] Complete final verification and narrow local commits.

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
