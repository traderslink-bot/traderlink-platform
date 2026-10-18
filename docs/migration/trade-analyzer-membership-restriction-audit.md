# Trade Analyzer membership restriction entrypoints

Source audit, 2026-10-15. No enforcement changes or live data access in this slice.
Preserve the distinct Trade Analyzer generation and Trade Analyzer Analysis
products and the owner-requested discoverable restricted previews.

| Surface | Current boundary | Required follow-up |
| --- | --- | --- |
| Eight /analytics/trade-analyzer/day pages | Shared TradeAnalysisPage calls requireMembershipPageScope(analytics.access) | Check trade_analyzer.analysis before protected reads; provide isolated preview rather than redirecting away |
| Analyzed trades, candle-pattern occurrences and replay APIs | analytics.access request policy | Align with the Analysis product; deny before result loading |
| Single-trade saved result API | Journal OR Analytics; shared tracker/review consumer | Trace tracker versus Analysis consumers before changing; preserve permitted Journal facts |
| Single-trade generation request | Mutation protection, signed account scope, logical analyzer selection | Verify effective trade_analyzer.analyses reservation before enqueue/provider work |
| Allowance API and shared allowance repository | Membership generation allowance when enforcement is enabled; beta fallback otherwise | Distinguish denied, exhausted, unlimited and enforcement-off states |
| Local daily worker bridge | Development-launcher assertion only | Keep private; trace worker acquisition/recheck before any charge |
| Execution mismatch confirmation | journal.access | Preserve factual Journal correction independently of paid generation |

## Allowance composition

Bundle checkout already composes plan/add-on finite allowances by addition,
retains unlimited and requires matching reset windows for overlapping metered
features. It stores an aggregate plan with original usage anchors. Independent
grants intentionally take the maximum. The maximum inside
readGenerationAllowance is therefore not evidence of broken add-on addition.
Preserve this contract and test the actual bundle path, not only independent
grants, when checking paid generation.

## First implementation boundary

Introduce the Analysis-specific server policy consistently across shared page
and read API entrypoints, with synthetic preview data that cannot expose saved
member results, call providers, create Journal facts or consume allowances.
Verify base-only, add-on-enabled, no-access, expired and owner cases. Trace the
shared single-trade reader before restricting it. Keep the approved dashboard
frame, themes and plan cards. Generation enforcement is a separate metered
boundary; do not silently treat Analysis access as permission to generate.

This audit does not claim complete feature enforcement or permission to publish,
migrate existing databases or modify hosted configuration.

2026-10-15 implementation checkpoint: shared Analysis page plus the three
Analysis-specific read APIs now use trade_analyzer.analysis. Denied pages
render the isolated fictional demo before data reads; default enforcement is
on with explicit stored policy overrides respected. See the
[membership restrictions progress](membership-feature-restrictions-progress.md)
for verification, legacy template-check failures and remaining generation,
offline and signed-member acceptance boundaries.


Generation checkpoint, 2026-10-15: default enforcement enabled for
trade_analyzer.analyses in the local candidate, preserving explicit off/shadow.
Existing selection reservation and first-acquisition recheck are covered with
SQL admission/accounting tests; actual composed checkout balances are tested
with synthetic provider events. No provider was contacted. Missing versus
exhausted access has distinct copy. See restriction progress for evidence and
remaining signed-browser/provider acceptance.


## Expanded member entrypoint audit — 2026-10-15

Owner specifically requested all entrypoints, plus a small upgrade popup when a
restricted member clicks the Workspace Analyzer icon. Active consumers traced:

| Entry | UI treatment | Server path |
| --- | --- | --- |
| Session Tracker/manual/quick entry review | Analyze remains discoverable; excluded checkbox disabled and nearby upgrade link; shared balance | journal/manual-trades/preview and commit -> logicalTradeAnalyzer.select |
| Workspace Add Trade review | Same shared pre-save review, plus per-trade upgrade link in saved-trade analysis selection | journal/workspace-trades/preview and commit -> logicalTradeAnalyzer.select; later batch requests use trade/request |
| Workspace trade-table Analyzer icon | Fresh allowance check on click; excluded/empty fresh-generation allowance opens compact max-xs dialog and plan link; lookup failures show retry guidance | allowance GET; admitted members open shared panel |
| Trades detail drawer Analyzer tab, including Workspace detail views | Shared Analyzer panel always loads allowance with saved result and shows correct upgrade/balance; indicator-history refresh shares the notice | trade GET and trade/request POST with optional refreshIndicators |
| Existing Session Tracker/Analysis chart readers | Read-only saved-result/chart consumers; generation controls are the entry-review controls above | shared trade GET, or Analysis-specific read APIs |
| Execution correction/edit refresh | Remains a factual Journal operation and uses existing controlled retry/selection flow | refreshAfterJournalRebuild -> select -> reservation/acquisition |
| Daily worker launcher bridge | Launcher-only dev assertion, not a member entrypoint; preview rejects it | daily-trade-analyzer/run; acquisition recheck before provider |

All fresh member generation paths converge on the same reservation gate and
first-acquisition recheck. Saved-result retention, cached-data reuse and supported
retries remain intentional existing behavior. Analysis product gating stays
separate from generation. Legacy V3/debug and owner Watchlist/Levels tools are
not alternate active Journal Analyzer generation paths. No new legacy dependency.

The compact icon dialog avoids loading a result or issuing generation while
denied. Quota and saved-result requests in the shared panel run in parallel.
Pending polling is invalidated when the panel closes/unmounts. No new dependency
or background permission poll added. Help guidance updated with the entrypoints.


Follow-up browser checkpoint, 2026-10-15: Add Trade excluded review controls
passed at390/1440 with fixture-only saves. Session Tracker excluded, exhausted
and unlimited review controls passed with actual signed allowance reads and
fixture previews; Journal Save trades stays available. Corrected Add Trade's
stale allowance on a denied batch request; a simulated last-use race now updates
balance0 and displays the upgrade CTA immediately. No new provider call or
actual browser save is claimed. See restriction progress for evidence tiers.
