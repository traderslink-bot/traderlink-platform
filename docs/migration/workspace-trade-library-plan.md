# Workspace Trade Library Plan

**Status:** Owner-approved composition in implementation

**Progress record:** [Workspace Trade Library Progress](workspace-trade-library-progress.md)

## Scope

`/workspace` becomes the compact home for trade activity. The single top-level
action is **Add trade**. The page is list-first: newest trade first, one factual
trade per row, with executions revealed only when a trader asks for them.

The page must not add Import trades, My trading rules, Edit tags, or Account
settings to the Workspace action area. It must not show generic subtitle copy
beneath the Workspace title.

## Source reconciliation and allowlist

The following historical checkpoints were read as reference only and are not
ancestors of the production base `85813d8419db00a993838836ce4e181ed83f691a`:

- `431aa96ab9c81f9d2b4b126810e04f1e1626fcc4` Explorer library checkpoint.
- `30e29b8efab624997040711eb9e9155b8e6e9b9a` and
  `3f46049692ed2372705e90f1bf477a71bc3b096a` server-filter refinements.

Selective reuse is limited to the following behavior:

| Concern | Selected source / current authority | Decision |
| --- | --- | --- |
| Trade facts and account scope | Current `JournalAnalyticsFactSetRepository` and active `WorkspaceAccessScope` | Reuse only server-derived active-account facts. Browser inputs never select an account. |
| Existing execution detail | Current `/api/platform/journal/calendar/ticker-details` endpoint | Request only after a row is expanded. |
| Manual entry | Current `ManualExecutionEntry` preview/commit and PWA outbox path | Reuse without changing ledger validation or account-selection enforcement. |
| Trade review, tags and rules | Existing Trade Explorer review editor/actions | Preserve as the authority for a later saved-trade Journal tab; do not duplicate persistence. |
| Analyzer | Existing persisted Day Trade Analyzer routes | Link from the action and keep charts/candles out of Workspace. |

The following reference behavior is deliberately excluded: paired Gross/Net
columns, a Needs review filter/label, any client-selected scope, preloaded
executions/Analyzer data, and historical global navigation changes. The frozen
FX candidate `b3b59aa70bb1b260b531f8b45fa620c41d04c3af` is untouched.

## Approved composition

- Desktop uses a compact table with Date (including disclosure), Ticker, Side,
  Status, one P/L column, and accessible icon-only Review, Edit, Delete and
  Analyzer actions. Side is Long/Short. Status is Open, Closed or Closed swing.
  Gross is detail-only.
- Mobile uses compact trade summaries rather than squeezing this table.
- The hierarchy remains date scope, trading day, ticker, trade, and on-demand
  executions. Notes and rules remain in the trade/day experience.
- Add Trade is a right drawer on desktop and full sheet on mobile. It starts
  with one compact execution, makes additional executions explicit, and selects
  Day or Swing once. Trade, Journal and Analyzer tabs are available for saved
  trade detail; Journal separates preset rules from custom rules and a selected
  custom rule requires Followed or Broke.

## Delivery boundary

This slice does not change migrations, hosted configuration, Railway, account
isolation, chart/candle loading, or Journal facts outside the existing audited
manual-execution exclusion workflow. Delete remains execution-level only: the
server emits an opaque `deleteRef` only after its current-account/current-version
safe-eligibility predicate passes, and the existing mutation revalidates that
ref before appending the historical exclusion and rebuilding affected trades.
No trade-level identifier or browser-created eligibility is accepted.

The offline Workspace snapshot remains metrics/review-only. It intentionally
does not persist account settings, account-selection or offline-scope refs, or
trade-library rows. The live Trade Library therefore renders only when the
complete server-issued prop bundle is present; the offline surface must not
substitute placeholders or expose its Add/Edit/Delete actions.

## Review and acceptance

Owner review is required for the desktop table, compact mobile summary, and
drawer composition before integration or release consideration. Help is not
changed in this batch because no existing trade-entry, review, rule, or
Analyzer workflow is changed; re-evaluate Help before enabling new saved-trade
mutations.
