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
| Trade facts and account scope | Current `JournalAnalyticsFactSetRepository`, `WorkspaceAccessScope`, and the Workspace current-version projection | Reuse only server-derived active-account facts. Browser inputs never select an account. |
| Existing execution detail | Current `/api/platform/journal/calendar/ticker-details` endpoint | Request only after a row is expanded. |
| Manual entry | Current `ManualExecutionEntry` preview/commit and PWA outbox path | Reuse without changing ledger validation or account-selection enforcement. |
| Trade review, tags and rules | Existing Trade Explorer review editor/actions | Preserve as the authority for a later saved-trade Journal tab; do not duplicate persistence. |
| Analyzer | Existing persisted Day Trade Analyzer routes | Link from the action and keep charts/candles out of Workspace. |

The following reference behavior is deliberately excluded: paired Gross/Net
columns, a Needs review filter/label, any client-selected scope, preloaded
executions/Analyzer data, and historical global navigation changes. The frozen
FX candidate `b3b59aa70bb1b260b531f8b45fa620c41d04c3af` is untouched.

The exact correction-batch allowlist is limited to the Workspace table/client/
server action/read model, the existing Workspace dashboard and metric-card
presentation, the Calendar presentation, the one Journal current-version
projection migration plus its manifest/rebuild materializer, and this plan/
progress record. It does not include account contracts, execution mutation
routes, provider imports, calendar reads, hosted configuration, or any data.

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

## 2026-08-30 correction inventory — controlling for this implementation batch

The staged composition is rejected. The following current implementation
elements must be removed or corrected together before another review checkpoint:

- Date is currently a button with a disclosure chevron; replace it with neutral
  text and make the entire non-action trade row the single execution disclosure
  target. Do not add a second expansion control.
- The desktop grid is too loose and omits Shares and entry/exit facts. Replace
  it with constrained, content-sized Date, Ticker, Side, factual State, Shares,
  entry/exit plus execution count, P/L, and sticky action columns.
- Current Status/Side chips and disabled Delete are rejected. Render factual
  text; show the Delete action only for a row that actually contains a
  server-issued eligible execution ref.
- Restore visible ticker, state, date, sort, group, active-filter, reset, and
  dashboard-period controls. Newest-first is the default.
- Replace the full-history Workspace fact-set list with a bounded,
  server-authoritative table continuation. The migration-backed projection
  stores exact derived P/L and an exact-text sort key, never SQLite float
  casts. The opaque cursor remains bound to the server-resolved account,
  projection revision, canonical query digest, sort key, and round-trip tie
  breaker; every continuation retains filters, sort, grouping, and period
  choice and rejects stale or mismatched state.
- Keep all five metric cards and the compact PWA card, but remove redundant
  metric captions. Add compact selected-period Best trade/Worst trade facts
  immediately below the metrics.
- The Add drawer must have one shared Day/Swing classification selector, one
  Eastern-time note, and one compact execution-row workflow—not separate views.
- Replace the locally invented saved-trade Journal/Analyzer messaging with the
  authoritative Trade Explorer editor/drawer content and its existing save
  path. Keep Analyzer lazy and retain opaque manual edit/delete refs.

## Calendar review boundary

The Workspace request does not authorize a new Calendar data reader or a
Calendar copy. The dedicated `/calendar` route owns the current account-scoped
month data through `calendar-data.ts` and `JournalDashboardReadModelService`.
Workspace uses only the existing lazy per-trade execution detail route; it does
not currently embed Calendar. Any approved compact month presentation is
therefore a presentation-only candidate in `app/(dashboard)/calendar/calendar-client.tsx`.
It must retain that route, its month selection, day-level trade/P/L cues and
mobile selection flow, without changing `calendar-data.ts`, the read-model
service, or account/filter ownership.

## Navigation visibility boundary

Swing Trade Tracker is retained as a direct route and all of its source, data,
offline, route-title, and Help mappings remain intact. Its only dashboard
navigation-group item is removed, so this is visibility-only and creates no
redirect, deletion, or data change.

## Delivery boundary

This slice adds one local-only derived-projection migration; it does not run a
migration, alter existing account facts, change hosted configuration, or take
Railway action. The projection is regenerated from current Journal facts during
the existing account rebuild transaction and needs a separately coordinated
derived-data backfill for accounts not rebuilt after migration. Delete remains
execution-level only: the
server emits an opaque `deleteRef` only after its current-account/current-version
safe-eligibility predicate passes, and the existing mutation revalidates that
ref before appending the historical exclusion and rebuilding affected trades.
No trade-level identifier or browser-created eligibility is accepted.

Until that Coordinator-owned, derived-data-only backfill completes, an account
without a projection revision renders an empty unavailable list state. It must
not fall back to materializing full history, silently infer financial values, or
rewrite any Journal fact during an ordinary Workspace read.

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
