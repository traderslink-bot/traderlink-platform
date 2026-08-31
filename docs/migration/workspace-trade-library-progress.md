# Workspace Trade Library Progress

**Status:** In progress — source reconciliation recorded; visible composition is being rebuilt on the production-base Workspace lane.

**Controlling plan:** [Workspace Trade Library Plan](workspace-trade-library-plan.md)

## 2026-08-31 — Owner completion batch in progress

- Removed the visible Workspace heading, Expectancy card, Profit factor card,
  and PWA card. Added the existing Analytics Overview best/worst metrics as
  label-only Largest win and Largest loss cards and retained the install action
  at the top right.
- Added Today, This week, This month, and All time as server-authoritative page
  periods for both overview metrics and the bounded trade query.
- Replaced row disclosure with the approved non-expanding desktop/mobile list
  and added factual Buy QTY, current Position, first execution Entry, flat
  execution Exit, Entry value, and fee-independent Gain/Loss facts.
- Embedded the authoritative Trade Explorer Journal editor inside the retained
  Trade/Journal/Analyzer drawer and suppressed its nested header and saved
  status line in Workspace only.
- Replaced per-execution edit dialogs with compact inline execution rows using
  the existing opaque edit/delete routes and expected-account enforcement.
- Added migration 0101 for exact derived Workspace sort facts. Position, Buy
  QTY, Entry, Exit, Entry value, and Gain/Loss ordering use exact text sort keys;
  no Journal fact or financial value is rewritten.
- Added the More filters drawer and moved the additional filters/sorts there.
  No migration, server, broad test, push, staging, or deployment has run.

## 2026-08-31 — Local top-action and control-row cleanup

- Moved the existing `Add trade` button to the top Workspace control area,
  preserving its handler, styling, and account-scoped drawer behavior. The
  Trades section no longer renders a duplicate action.
- Structurally removed the legacy table control row and the parent
  `nth-of-type` CSS hiding workaround. Existing period controls and the More
  filters drawer remain intact, including Group by: None, Day, and Ticker.
- This is local-only preparation for owner visual review. No staging, push,
  deployment, migration, or data action was taken.

## 2026-08-31 — Correction batch investigation

- The Add trade drawer's initial Date uses locale output that can be invalid
  for a native date field; the replacement will use an ISO date built from
  timezone-aware parts. Client validation will identify missing visible field
  labels without changing server validation.
- Source review shows the generic saved-trade review message is a non-ready
  preview/commit response, not a known successful commit response. The server
  code is currently suppressed in Workspace, so staging evidence is required
  to identify a particular rejection; a retained idempotency key avoids an
  ambiguous retry creating a new submission.
- Tooltip implementation is paused pending owner copy approval. No staging,
  migration execution, server, broad test, push, or deployment occurred.
- Sanitized staging evidence confirms the reported one-execution attempt ended
  at preview with HTTP 400 and never sent a commit request. Workspace now keeps
  that pre-commit distinction: it uses ISO date parts for the native Date
  field, names missing visible fields, and maps safe preview outcomes without
  exposing internal codes or treating the failed attempt as saved.

## 2026-08-31 — Hold and exact Workspace values in progress

- Added the derived-only 0102 Hold duration schema contract and manifest entry.
  Closed rows derive elapsed seconds from their existing opened/closed UTC facts;
  open rows retain no duration fact and render `N/A` in the desktop table.
- Workspace now carries Hold through the account/query/revision-bound cursor
  sort path. Entry value is derived as the exact sum of canonical buy quantity
  multiplied by price, rather than using the earlier normalized entry basis.
- Entry and Exit table prices use the existing money formatter, QTY replaces
  Buy QTY, and five overview cards use one desktop row. Tooltip copy remains
  intentionally excluded pending approval.
- Clear filter is one URL-backed reset action and appears only while a table
  filter, sort, group, or date constraint is active; it does not create a
  separate client filter state.
- Add Trade and saved Trade/Journal/Analyzer content now use the shared
  Workspace drawer shell. Only the active drawer is mounted; Add and saved
  content preserve their existing account refs and opaque edit/delete authority.

## Local verification boundary

- `git diff --check` passes. Focused source inspection confirms the desktop
  table remains hidden below `md`, mobile retains compact cards, and tooltip
  copy was not added. TypeScript, build, server, migration, browser, and
  staging checks remain intentionally deferred by the owner’s low-resource and
  owner-review boundaries.

## 2026-08-31 — Follow-up entry validation diagnosis

- Workspace now normalizes a leading decimal only for Price and Fee at the
  client input boundary (`.06` to `0.06`); Shares remains unchanged and server
  canonical validation still owns stored precision.
- The coarse historical-entry preview rejection now identifies Date only in
  Workspace. A true historical manual-entry authorization path remains a
  server contract decision: the existing Day/Swing preview policy rejects older
  dates before commit, so no client-only change can preserve the requested
  actual historical timestamp without broadening an authoritative contract.

## 2026-08-30 — Staged composition rejected; correction batch active

- Audited the staged Workspace source against the superseding owner inventory.
  It currently uses a button/chevron Date disclosure, broad desktop columns,
  Side/Status chips, a disabled list-level Delete, full-history fact-set rows,
  missing operational controls, and locally written saved-trade Journal and
  Analyzer placeholder messaging. Each is recorded as rejected in the plan.
- The metric/PWA composition remains, but metric captions need removal and the
  selected-period Best/Worst facts need insertion directly beneath it.
- Source audit found the current fact-set reader eager. The existing Analytics
  table cursor validates the query digest, fact revision, order, and row cursor,
  but its current implementation orders an already materialized population.
  This correction therefore uses the existing server-scoped query and cursor
  authority while keeping browser filters limited to its validated input shape;
  it does not accept any browser-supplied account or trade identifier.
- No test suite, dependency installation, server, browser automation, migration,
  configuration, push, or deployment has run in this batch.

## 2026-08-30 — Compact Calendar review checkpoint

- Current Calendar is not embedded in Workspace. The dedicated `/calendar`
  route owns its account-scoped data via `calendar-data.ts`, which delegates to
  the Journal dashboard read model and preserves its filters and day detail
  authority.
- The current month renderer in `calendar-client.tsx` is presentation-only but
  uses oversized 230px desktop cells and a horizontally scrolling 248px mobile
  layout. The review candidate replaces only that renderer with a shorter
  seven-day month grid retaining day-level P/L and trade-count cues.
- Candidate implementation allowlist after owner visual approval:
  `app/(dashboard)/calendar/calendar-client.tsx`, this plan, and this progress
  record. No calendar data, route, filter, offline, account, or service file is
  a candidate.

## 2026-08-30 — Swing Tracker navigation visibility

- Removed only the `Swing Trade Tracker` item from the dashboard Trade Tracker
  navigation group. The retained `/trade-tracker/swings` route title and Help
  mapping, its page/source, Journal contracts, and offline model are untouched.

## 2026-08-30 — Source correction checkpoint

- Rebuilt the Workspace list presentation as a compact constrained table with
  direct row disclosure, action-only icon controls, visible operational
  controls, compact mobile summaries, and a drawer-specific execution form
  that reuses the established manual-trade submission boundary.
- The Calendar month presentation is now a compact seven-day grid in the
  retained Calendar route; its account-scoped data, route, filters, and day
  detail ownership remain unchanged.
- The retained seven-day week view uses the same day facts and selection flow,
  with cells reduced from 480px to 260px and reduced padding; no controls or
  data behavior changed.
- The existing fact-set service still materializes all eligible facts before
  its current table cursor is built. That contract cannot honestly satisfy the
  required storage-bounded continuation guarantee and remains a separate server
  contract gap; this checkpoint does not represent client-side Load more as a
  replacement for it.

## 2026-08-30 — Server-bounded projection contract in progress

- Coordinator authorized the local-only migration-backed replacement for the
  eager fact-set table. Migration `0100_journal_workspace_trade_library_projection`
  introduces a current-version derived projection and per-account projection
  revision. It stores canonical exact financial values plus a deterministic
  text sort key, so P/L ordering does not cast Journal decimals to SQLite
  floating point.
- The Workspace reader obtains its account only from `WorkspaceAccessScope`.
  It queries the indexed projection with a fixed 25-row page, a validated
  opaque continuation cursor, and canonical ticker/status/date/sort/group/
  dashboard-period query state. The cursor carries its projection revision,
  query digest, ordering key, and round-trip tie breaker; a changed account,
  query, or projection revision is rejected rather than reused.
- Existing Journal rebuilds refresh the derived projection only after their
  current-version writes have completed, in the same account transaction. No
  migration or backfill was run in this worktree. A release requires a
  Coordinator-owned, derived-data backfill for accounts not otherwise rebuilt
  after the new schema is applied; it must not rewrite Journal facts. Until
  then, the Workspace reader returns only its explicit empty unavailable state;
  it never falls back to a full-history read or writes facts during a normal
  page request.
- The client calls the server reader for initial filters and continuations.
  It no longer slices a browser-resident historical trade array. Displayed
  delete actions use the plain label `Delete execution` and remain absent when
  no server-issued opaque deletion ref exists.

## 2026-08-30 — Staging-only migration helper prepared

- Added a separate helper-only Dockerfile and direct executable wrapper for the
  existing `runHostedPlatformMigrationMaintenance` contract. It is not the
  normal application image, does not expose an app port, and changes neither
  normal startup nor Railway configuration.
- The wrapper fails when the contract reports no protected maintenance request
  and prints only an applied/already-applied status, count, and migration id.
  The underlying contract still requires the exact manifest-tail migration id,
  reviewed confirmation, protected database path, account-identity recovery
  configuration, exact predecessor, and a backup-root boundary before it can
  take any write action.
- Required hosted procedure: Coordinator creates a temporary helper service
  against the isolated staging volume, supplies the protected variables without
  printing values, runs it once while no app process uses that volume, records
  the receipt plus app health, then removes the helper. No helper service,
  migration, backfill, push, staging, or deployment was performed here.

## 2026-08-30 — Reconciliation complete

- Confirmed this worktree is clean on `codex/workspace-trade-library-85813d84`
  at production base `85813d8419db00a993838836ce4e181ed83f691a`.
- Confirmed the Explorer library and filter checkpoints are reference-only,
  non-ancestor history. No merge or cherry-pick is permitted.
- Selected only the existing server-side active-account fact contract, lazy
  execution-detail endpoint, and manual-entry submission boundary. Paired P/L,
  Needs review wording, and preloaded detail from the reference are excluded.
- No database, migration, hosted configuration, server process, staging, or
  Railway action occurred.

## Current implementation target

- [x] Replace the welcome/action-card Workspace body with the approved compact
      trade library while retaining factual metric cards and Demo protections.
- [x] Add the responsive Add trade drawer using the existing manual-entry
      submission boundary and an initial single execution row.
- [x] Present a desktop table and purpose-built mobile trade summaries with
      on-demand execution disclosure.
- [x] Record light static verification and submit a narrow local commit for
      coordinated owner staging review.

## Light verification

- `git diff --check` and equivalent whitespace checks for the newly added
  files pass.
- Source review confirms the list uses only the active server-derived account,
  requests executions after expansion, has no visible `Needs review` state,
  and exposes only one list P/L column.
- Targeted ESLint was intentionally not substituted with a dependency install:
  this worktree has no `node_modules`, and `npx eslint` attempted a registry
  download which the low-resource, no-install boundary blocks.

## 2026-08-31 — Staging type-narrowing repair

- Railway staging build `051c1aca-6723-4be2-919f-d12c39836dbf` stopped before
  deployment because TypeScript did not retain the existing unknown-to-string
  validation of `expectedRoundTripVersionId` across the annotation transaction
  callback.
- The current-version save path now captures that input in a local constant,
  validates its type and canonical UUID shape before entering the transaction,
  and passes only the narrowed string to the same account-scoped
  `roundTripCurrentVersionMatches` check. Open/closed Review behavior,
  account scope, and stale-version conflict behavior are unchanged.
- No server, tests, install, build, migration, staging, deployment, data
  action, push, or release action ran for this local repair.

## 2026-08-31 — Shared drawer and post-save target correction

- Owner approved one shared Workspace Trade/Journal/Analyzer drawer. Unsaved
  entry remains Trade-only: Journal and Analyzer are visible but disabled, with
  no draft storage or unavailable-state copy.
- The Workspace commit path returns only existing opaque affected-trade refs.
  When one current affected target exists, it also returns one bounded
  server-rendered Workspace row resolved under the same authenticated account
  and current round-trip version. The browser does not choose a trade from list
  order. Zero or multiple targets refresh and close instead.
- A multiple-target outcome additionally shows the owner-approved Workspace
  message and existing `Open Day Trade Tracker` link only; it does not alter
  the single-target drawer path or add a draft workflow.
- No server, tests, install, build, migration, staging, deployment, data
  action, push, or release action ran for this local correction.

## Outstanding boundaries

- Saved-trade Journal/Analyzer editing remains guarded follow-up work. Delete
  is available only for an execution whose current server-issued opaque ref
  passes the audited manual-only predicate; it is never a trade-level action.
- No owner review, integration, or production approval has occurred.

## 2026-08-30 — Offline staging compile repair

- Railway staging identified the Offline Workspace caller as the only TypeScript
  blocker after the live Trade Library became a required Workspace composition.
- The saved offline model contains only verified metrics/review content. The
  Workspace dashboard now accepts that metrics-only caller without fabricating
  account currency/timezone, opaque account or offline refs, or trade rows; it
  renders the Trade Library only for the complete live server-issued bundle.

## 2026-08-30 — Safe execution deletion follow-up

- Restored the audited `c224bccb` deletion contract selectively, without
  merging that non-ancestor checkpoint: the repository predicate permits only
  accepted active `manual_entry` executions in the selected account and rejects
  Demo, provider-backed, provenance-identified, reconciled, stale, protected,
  or cross-account executions.
- The edit service emits `deleteRef` only when that predicate passes and
  re-resolves the same opaque ref against the current account and version at
  delete time. The route retains mutation-header, request-scope, and expected
  account-selection checks before using the established exclusion/rebuild path.
- Workspace forwards only server-issued eligible refs to the saved-trade drawer.
  It does not construct an execution id or ref; non-eligible executions render
  no Delete control and the compact list remains non-mutating.

## 2026-08-30 — Owner compact-list refinement

- Applied the owner’s exact compact-list inventory to the existing Workspace
  client composition: rows use a fixed 46px collapsed target, show entry/exit
  prices alongside their dates/times and execution count, label factual State
  as plain text, and retain red/green P/L and dark accessible action icons.
- Added the visible active-filter count and Return to newest action while
  retaining existing server-owned filters, grouping, dashboard-period control,
  opaque continuation cursor, and Load more behavior.
- Day/Swing remains the saved submission classification but no longer changes
  execution timezone or the shared Eastern Time workflow. No server contract,
  migration, account scope, deletion predicate, data, staging, or release
  behavior changed.

## 2026-08-30 — Drawer execution-form visual correction

- Replaced the cramped one-line execution controls with a compact outlined
  execution block. Each entry has a numbered heading, visible Remove action
  once there is more than one entry, and a calm two-row content-sized field
  grid. Entry values, add/remove behavior, Eastern Time guidance, validation,
  manual submission, and account scope remain unchanged.

## 2026-08-31 — Superseded owner drawer simplification

- This interim simplification was superseded by the approved historical-entry
  correction below. Workspace now presents one required Day Trade or Swing
  classification that is retained through the dedicated signed Workspace
  preview/commit path without changing the shared Eastern Time workflow.

## 2026-08-31 — Empty Workspace state correction

- Split the absent-projection response into an empty-account state and an
  unavailable-existing-trades state with one account-scoped `EXISTS` check on
  current Journal executions. Empty isolated staging and new accounts now say
  **No trades recorded yet**; the reader does not imply a preparation or
  backfill job is running. Accounts with current execution facts but no derived
  projection keep a separate honest unavailable message. No facts are read into
  the page, materialized, changed, or backfilled by this check.

## 2026-08-30 — Workspace Journal navigation correction

- Added an optional Trade Explorer review-editor presentation flag so the
  Workspace Journal drawer hides inherited Previous/Next and page-position
  controls and tag-selection count for its single selected trade. Trade Explorer
  retains its normal multi-trade navigation; review data, notes, tags, rules,
  and save behavior are unchanged.

## 2026-08-31 — Active owner correction batch

- The Workspace top-right actions are exactly `+ Trade`, `+ Rules`, and `+ Tags`
  in that order. `+ Rules` retains `/rules`; `+ Tags` and the Journal use the
  same account-scoped Trade Explorer tag-creation action through one reusable
  right drawer.
- The primary navigation now says `Add/Edit Trade` and opens this same shared
  Workspace drawer in place over an authenticated dashboard page. The legacy
  `/quick-trade-entry` route is only a compatibility redirect; it no longer
  owns a separate form or drawer. Saved-trade editing remains available only
  from existing authorized Workspace rows and their opaque server refs.
- Removed the remaining Add/Saved drawer wrappers. Workspace now has one
  `Drawer` component and one state path: `+ Trade` provides entry mode, while
  Review, Edit, and Analyzer provide a saved trade with the selected tab.
  Source verification is complete; visual staging verification remains pending.
- Review now passes a closed trade's projection exit-local date to the existing
  review reader and does not offer Review for an open projection. The reader
  continues to load current account-scoped review revisions before a save, so
  stale-version protection remains active rather than being suppressed.
- The rejected `quick` workaround was replaced before review. Add Trade uses a
  dedicated Workspace preview/status/commit route that accepts only the
  `workspace` tracker plus a validated `day_trade` or `swing` style. That style
  is included in the HMAC-signed preview and commit recomputation. The generic
  manual-trade routes reject Workspace requests. Expected-account binding,
  account timezone equality, future-date/time rejection, idempotency, ledger
  reconciliation, and current account isolation remain in the server path; the
  UI no longer sends a hard-coded timezone or a historical override.
- The entry card explicitly selects Day Trade or Swing. A new entry persists
  the selected canonical `day_trade` or `swing` classification through the
  signed server path; an execution added to a saved trade starts with that
  trade's existing classification.
- Price and Fee normalize a leading decimal such as `.06` to `0.06` at the
  Workspace field and at the narrow manual-entry/manual-correction parser.
  Quantity is unchanged; no rounding or stored-decimal canonicalization was
  weakened.
- The existing install action moved from Workspace to the bottom left sidebar.
  The obsolete `TradersLink v1` footer was removed; no navigation route or PWA
  installation flow changed.
- Saved Trade now reuses the shared compact execution form for **Add execution**
  inside its Trade tab. It locks the selected ticker and currency, retains an
  existing Swing classification when present, and submits only through the
  signed Workspace preview/commit/reconciliation path. It never attaches a
  record directly to a round trip; after save it closes and refreshes the
  server-authoritative Workspace facts.
- Before opening or confirming any Workspace Delete control, Workspace re-reads
  the active server account-selection ref. A changed, absent, or unreadable
  selection closes stale detail/dialog state and refreshes the page without a
  DELETE request. The route now reports account-selection conflict as 409 and
  missing account access as 401; the same account/version/eligible-manual
  predicate remains unchanged.
- Overview cards now render P/L, Win rate, Largest win, Largest loss, and
  Trades in that exact responsive order.
- No test suite, server, dependency installation, migration, data mutation,
  staging, deployment, commit, or push has run in this active local batch.

## 2026-08-31 — Current local review candidate

- Railway’s held build exposed a type-only compatibility gap: the shared
  manual-entry caller can carry the new `workspace` tracker while its legacy
  card accepts only Day, Swing, or Quick display modes. The caller maps the
  otherwise-unreachable Workspace value to the existing Day display mode;
  Workspace continues to use its dedicated drawer and signed preview/commit
  routes. No Workflow, Journal fact, or authority behavior changes.

- The latest owner direction sets the Workspace top-right controls, in order,
  to `+ Trade`, `+ Rules`, and `+ Tags`. `+ Trade` opens the shared Workspace
  drawer, `+ Rules` keeps the established Rules route, and `+ Tags` uses the
  existing account-scoped tag authority.
- The desktop list is a neutral-date, 44–48px trade row with Date, Ticker,
  Side, plain-text Status, Shares, POS, Entry, Exit, Entry value, Hold,
  Gain/Loss, and accessible dark actions. Entry/Exit are two-decimal prices
  only; no execution count or date/time tooltip is shown. Rows remain
  non-interactive; only their explicit actions open a saved-trade drawer.
- The saved-trade Delete confirmation now consumes the route’s existing safe
  error code instead of discarding it behind a generic failure. It maps known
  account, stale-eligibility, conflict, request, and storage-validation
  categories to recovery guidance without displaying raw codes or identifiers.
  There is no date chevron. Mobile remains a compact non-table summary without
  horizontal scrolling.
- Open trades now retain the same Review action and Journal tab as closed
  trades. The server recognizes an open Journal target only when the selected
  account’s current round trip is factually legitimate-open with a null close;
  it derives the Journal date from the recorded opening time and rejects a
  changed current version inside the annotation write transaction. This does
  not infer a close, change the Open status, or create a separate persistence
  path; closed-trade close-date validation remains in place.
- The saved-trade surface has only Trade, Journal, and Analyzer tabs. Its
  embedded Journal editor hides inherited trade navigation and page-position
  indicators while retaining the established notes, tags, custom rules, and
  automatic rule-result authority for the selected trade.
- Workspace now keeps selected top-period dates separate from optional More
  filters dates. More filters counts only ticker, state, explicit From/To,
  sort, and grouping. Both Clear filters controls retain the selected period,
  while period selection clears an explicit custom date override. The server
  query and client pagination continue to bind the same effective date range.
- The filter drawer exposes ticker search, state, date range, sort, grouping,
  active count, Clear filters, and Return to newest. The top Workspace period
  controls remain the only period control.
  The list remains newest-first server pagination with Load more.
- `git diff --check` passed. Source checks confirmed the requested labels,
  no row-click disclosure, the explicit Day Trade/Swing selector, the
  saved-trade Journal navigation suppression, and conditional opaque-ref
  deletion flow.
  No server, test, install, build, migration, staging, deployment, commit, or
  push ran. Runtime and owner visual review remain outstanding.
