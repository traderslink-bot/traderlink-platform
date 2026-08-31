# Workspace Trade Library Plan

**Status:** Owner-approved composition in implementation

**Progress records:** [Workspace Trade Library Progress](workspace-trade-library-progress.md), [Shared Drawer Correction Progress](workspace-trade-library-shared-drawer-progress.md), and [Journal Copy Correction Progress](workspace-trade-library-journal-copy-progress.md)

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
  with one compact execution, makes additional executions explicit, and uses a
  Day Trade or Swing classification. Trade, Journal and Analyzer tabs are available for saved
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
- The Add drawer must have one Eastern-time note and one compact execution-row
  workflow—not separate Day/Swing views.
- Replace the locally invented saved-trade Journal/Analyzer messaging with the
  authoritative Trade Explorer editor/drawer content and its existing save
  path. Keep Analyzer lazy and retain opaque manual edit/delete refs.

## 2026-08-30 owner visual refinement — controlling inventory

The following refinement replaces any ambiguous earlier visual wording. Desktop
collapsed rows are 44–48px high, keep Date neutral (with no chevron), and
reveal executions when the trader clicks the row once. They show Date, Ticker,
Side, plain-text State, Shares, entry/exit dates, times and prices, execution
count, colored P/L, and dark accessible Review, Edit, Delete execution, and
Analyzer icons. Delete is absent—not disabled—unless an execution has the
current server-issued opaque deletion ref.

The list has visible ticker search, state and date-range filters, sorting,
grouping, active-filter count, Clear filters, Return to newest, and Follow
dashboard period controls. It keeps server-owned newest-first pagination and
Load more. Best/Worst summaries remain compact; the PWA card remains small;
mobile remains a compact summary with no horizontal table scrolling.

The drawer uses one ticker and one Day Trade or Swing classification. That
classification does not change the shared Eastern Time workflow. The drawer begins with exactly one content-sized execution row
and explicit Add execution/Remove controls. It
retains the Eastern Time and Trade Analyzer timing guidance, opens directly to
Trade/Journal/Analyzer tabs, and reuses the Trade Explorer review editor and
text without a redundant Journal card or review subtitle.

Workspace opens the Journal editor for one selected trade only. Its inherited
Previous/Next controls and page-position label are hidden there; Trade Explorer
retains its own navigation controls unchanged. The Workspace version also hides
the inherited tag-selection count; the tag selection limit still applies.

The execution form is a compact outlined execution block, not a compressed
single horizontal strip. Each block has its numbered execution heading, a
visible Remove action after a second execution exists, and two short rows of
content-sized fields: Date, Time, Buy/Sell, Shares, Price, and Fee.

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
without a projection revision is distinguished by a bounded current-execution
existence check: an empty new account says **No trades recorded yet**; an
account with current execution facts says its existing trades are not available
in Workspace yet. Neither state claims that a process is running. It must not
fall back to materializing full history, silently infer financial values, or
rewrite any Journal fact during an ordinary Workspace read.

## Staging-only migration maintenance boundary

The normal application image, `Dockerfile`, `railway.json`, runtime startup,
and health process remain unchanged. The separate
`Dockerfile.migration-maintenance` is an intentionally one-shot helper image
for a Coordinator-created staging-only Railway service attached to the isolated
staging volume. Its direct wrapper invokes only the existing protected hosted
migration-maintenance contract.

The helper fails closed unless the service is supplied the exact manifest-tail
migration id `0100_journal_workspace_trade_library_projection`, the reviewed
confirmation text, a valid staging database path, the required account-identity
recovery variables, and an absolute backup root strictly below the database
directory. The existing contract performs exact predecessor validation and
backup/restore verification before it can apply one migration. Its receipt
contains only status, count, and migration id—never paths, keys, or other
secret values.

The Coordinator alone creates this helper service against the isolated staging
volume, runs it once while no app process uses that volume, records its receipt
and subsequent health result, then removes the helper. This source slice does
not create a service, run the helper, migrate, backfill, push, or deploy.

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

## 2026-08-31 owner-controlled Workspace completion

- The page has no visible `Workspace` heading.
- Overview cards are P/L, Win rate, Largest win, Largest loss, and Trades. They
  have labels and values only. Expectancy and Profit factor are not shown.
- Today, This week, This month, and All time filter the overview and trade list
  together; All time is the default.
- More filters opens a right drawer containing ticker, factual state, date,
  grouping, reset, and server-backed sort controls. The visible table control
  row is removed.
- Desktop columns are Date, Ticker, Side, Status, Buy QTY, Position, Entry,
  Exit, Entry value, Gain/Loss, and Actions. Rows do not expand.
- Sorts are Newest, Oldest, Position, Buy QTY, Entry, Exit, Entry value,
  Gain/Loss high, and Gain/Loss low. Every sort is storage-bounded and uses an
  account/query/revision-bound cursor with exact decimal sort keys.
- The PWA card is removed. Its existing install action belongs at the bottom of
  the left navigation, and the obsolete `TradersLink v1` sidebar footer is not
  shown.
- One 880px desktop drawer (full-width mobile) owns Trade, Journal, and
  Analyzer tabs. Journal is embedded in that drawer and does not open the
  inherited Trade Explorer drawer. Workspace suppresses the inherited saved
  status line.
- `+ Trade` opens the shared Workspace drawer in Trade-entry mode. The drawer
  starts with one execution, one ticker, and one Day Trade or Swing
  classification. Edit shows authorized execution rows in the same compact
  Date, Time, Buy/Sell, Shares, Price, Fee layout. Delete remains conditional
  on the existing opaque server-issued authority.

## 2026-08-31 active owner correction allowlist

- The `Trade records` sidebar group is removed. Open Positions remains on its
  existing route inside the `Trades` sidebar group. Import Trades and Data
  Decisions are removed from the sidebar without changing their routes or
  authorities. Workspace top-right actions are exactly `+ Trade`, `Imports`,
  `+ Rules`, and `+ Tags`; Account General includes the existing Data Decisions
  route as an action.
- The Workspace top-right actions are exactly `+ Trade`, `Imports`, `+ Rules`,
  and `+ Tags` in that order. Imports retains the established `/imports` route;
  `+ Rules` retains `/rules`. `+ Tags` uses the existing Trade Explorer tag
  authority in one reusable drawer; it does not add a tag endpoint or a
  parallel tag writer.
- Each plus-prefixed action renders exactly one text plus sign at the same label
  font size. `+ Trade` remains the blue contained action; Imports, `+ Rules`,
  and `+ Tags` remain compact secondary outlined actions.
- The primary left navigation label is `Add/Edit Trade`. It opens the same
  shared Workspace drawer over an authenticated dashboard page without route
  navigation. `/quick-trade-entry` is retained only as a compatibility redirect
  to that action; saved-trade editing still begins only from an authorized
  Workspace row and its server-issued opaque refs.
- The Workspace client has one 880px desktop/full-width-mobile `Drawer`
  instance. `+ Trade` enters its new-trade mode; Review, Edit, and Analyzer
  enter its saved-trade tabs. No `AddTradeDrawer` component remains.
- A Workspace review target is built only for a closed projection and uses its
  authoritative exit-local date, not the list activity date. The existing
  account-scoped review reader remains responsible for loading current note,
  tag, and rule revisions before every save.
- Historical Workspace entries use dedicated authenticated
  `/api/platform/journal/workspace-trades` preview, status, and commit routes.
  They accept only the `workspace` tracker with a validated signed
  classification. The entry card explicitly selects Day Trade (`day_trade`) or
  Swing (`swing`); an added execution begins from the saved trade's existing
  classification. The generic manual-trade routes reject that tracker. The
  Workspace UI supplies only the server-issued account timezone and no
  browser-controlled historical override.
- Leading decimals normalize only for Price and Fee, both in the Workspace UI
  and in their manual-entry/manual-correction server parsers. Shares retain the
  existing whole-or-leading-zero validation; canonical storage precision and
  all account/version checks remain unchanged.
- This active local correction allowlist is: `app/dashboard-shell.tsx`,
  `app/dashboard-navigation.ts`,
  `app/pwa/install-traderslink-pwa-card.tsx`,
  `app/(dashboard)/quick-trade-entry/page.tsx`,
  `app/(dashboard)/workspace/workspace-dashboard.tsx`,
  `app/(dashboard)/workspace/workspace-trade-drawer-events.ts`,
  `app/(dashboard)/workspace/workspace-more-filters-drawer.tsx`,
  `app/(dashboard)/workspace/page.tsx`,
  `app/(dashboard)/workspace/workspace-trade-library-actions.ts`,
  `app/(dashboard)/workspace/workspace-trade-library.ts`,
  `app/(dashboard)/workspace/workspace-trade-library-client.tsx`,
  `app/(dashboard)/trade-tracker/manual-execution-entry.tsx`,
  `app/(dashboard)/analytics/trade-explorer/trade-review-editor.tsx`,
  `app/(dashboard)/analytics/trade-explorer/trade-tag-creation-drawer.tsx`,
  `app/api/platform/journal/manual-executions/[executionRef]/route.ts`,
  `app/api/platform/journal/manual-trades/preview/route.ts`,
  `app/api/platform/journal/manual-trades/commit/route.ts`,
  `app/api/platform/journal/manual-trades/status/route.ts`,
  `app/api/platform/journal/workspace-trades/preview/route.ts`,
  `app/api/platform/journal/workspace-trades/commit/route.ts`,
  `app/api/platform/journal/workspace-trades/status/route.ts`,
  `src/modules/platform/client/pwa/manual-trade-outbox.ts`,
  `src/modules/journal/contracts/journal-manual-trade-capture-contracts.ts`,
  `src/modules/journal/server/manual-trades/journal-manual-trade-preview-authority.ts`,
  `src/modules/journal/server/manual-trades/journal-manual-trade-preview-service.ts`,
  `src/modules/journal/server/manual-trades/journal-manual-trade-command-service.ts`,
  `src/modules/journal/server/manual-trades/journal-manual-trade-input.ts`,
  `src/modules/journal/server/manual-trades/journal-manual-execution-edit-service.ts`,
  and this plan/progress record. No migration, configuration, data, staging,
  or production file is included.

## 2026-08-31 local owner-review refinements

- The top-right Workspace actions are exactly `+ Trade`, `+ Rules`, and `+ Tags`
  in that order. `+ Trade` opens the account-scoped entry drawer through the
  shared handler; it is removed from the Trades/table section, so there is no
  duplicate entry control or alternate entry path.
- The owner-approved desktop table inventory is Date, Ticker, Side, Status,
  Shares, POS, Entry, Exit, Entry value, Hold, Gain/Loss, and Actions. Shares
  is total bought, POS is remaining shares, Entry is first-buy price, Exit is
  the flattening sell price, Entry value is total buy value, and Hold is
  opening-to-flat duration (N/A while open). Entry/Exit render price-only
  dollars to two decimals; no execution-count column or date/time tooltip is
  present. A row remains non-interactive; only its explicit actions open a
  saved-trade surface or mutation flow.
- Delete keeps the existing server-provided privacy-safe error code in the
  route response and maps account, stale-eligibility, conflict, request, and
  storage-validation categories to distinct trader-facing recovery guidance.
  It does not display internal codes, identifiers, or predicates.
- Review is available for both current open and closed Workspace trades. A
  null close date requests only the authoritative current legitimate-open
  round trip; its Journal date derives from the recorded opening timestamp in
  the selected account timezone. Save carries the read current-version ID and
  validates it again inside the account-scoped annotation transaction. No
  exit date is invented, no trade is marked closed or reviewed, and notes,
  tags, and rule results remain attached to the active stable round trip.
  Closed review continues to require and validate its actual close date.
- Follow dashboard period is not a Workspace control. The existing top period
  controls remain the only period control for the page and trade list.
- Today, This week, This month, and All time are the selected page period, not
  drawer filters. Their server-derived dates remain separate from explicit
  From/To dates in the URL and never populate or increment More filters.
  Clear filters removes only ticker, state, custom dates, sort, and grouping;
  it retains the chosen period. Both the initial server query and later
  pagination bind the effective period/custom range into their query revision.
- The table-section filter control row and the parent CSS structural hiding
  workaround are removed in source. Period controls and More filters remain at
  the top of Workspace. More filters retains Group by with its existing None,
  Day, and Ticker options.
- This remains an uncommitted local owner-review preparation change. It is not
  staging, production, or Railway authorization.

## 2026-08-31 correction batch — active

- Workspace money display will retain canonical precision while rendering dollar
  amounts to two decimal places. The table Entry and Exit prices must use the
  same money formatter as P/L and Entry value.
- Hold is a derived closed-trade duration from the current projection's opened
  and closed UTC facts. Open rows retain the established unavailable mark. Its
  cursor sort needs a new derived-only migration, a deterministic tie-breaker,
  and the existing account/query/revision binding.
- Exact tooltip text is deferred for owner approval. No new hover copy may be
  added before the label-to-tooltip inventory is accepted.
