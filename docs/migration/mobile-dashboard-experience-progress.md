# Mobile Dashboard Experience Progress

**Status:** Implementation and four-viewport QA complete; owner visual approval pending
**Plan:** [Mobile Dashboard Experience Plan](mobile-dashboard-experience-plan.md)
**Started:** 2026-08-16

## Current boundary

The owner approved the system-wide removal of duplicated route titles from the
shared top header, then rejected the earlier responsive pass's blanket removal
of contained horizontal scrolling. Mobile acceptance is reopened. Every dense
dashboard surface must now prove either an information-complete record card or
a readable contained sideways-scrolling table with an obvious cue. No push,
deployment or hosted mutation is authorized.

## Concurrency note

Session `01a00ab5-56fc-76d0-9d6b-4e33cf6938b8` completed Trade Explorer and
released its file boundary. Its completed analytics behavior plus the integrated
responsive presentation are preserved in local commit `4ca2a5ac`. The boundary
included:

- `app/(dashboard)/analytics/trade-explorer/actions.ts`;
- `app/(dashboard)/analytics/trade-explorer/trade-explorer-client.tsx`;
- `app/(dashboard)/analytics/trade-explorer/trade-explorer-service.ts`;
- related Journal Analytics query/service/table files; and
- `docs/migration/trade-explorer-platform-plan.md` and
  `docs/migration/trade-explorer-platform-progress.md`.

Session `01a00bea-b754-7193-92ac-e3ae7a4a54a8` completed fresh Daily Trade
Tracker QA and released its boundary. Its empty-day save correction,
unsaved-work protection and responsive refinements are preserved in local
commit `33144610`. The scalable Trade Analyzer evidence drilldown and migration
0059 are preserved separately in local commit `0544e42f`.

## Slice 1 checklist

- [x] Owner approved the mobile audit and duplicate-title direction.
- [x] Required Next.js layout/client-component guidance reviewed from the
  installed framework documentation.
- [x] Relevant Open Positions, Swing Tracker and Daily Tracker Help guides
  reviewed; no Slice 1 guide change is required.
- [x] Existing dirty shared-shell changes audited and reserved for preservation.
- [x] Restore the audit-affected position to Active swing through the supported
  UI correction flow.
- [x] Remove duplicated route titles from the shared header.
- [x] Improve shared mobile toolbar touch targets and safe-area behavior.
- [x] Add a confirmation before Mark failed swing saves a status change.
- [x] Capture desktop and mobile browser evidence.
- [ ] Receive owner visual approval for Slice 1.

## Evidence log

### 2026-08-16 - pre-implementation

- Canonical repository confirmed as
  `C:\Users\jerac\Documents\TraderLink\traderlink-platform` on
  `codex/traderlink-platform-replacement`.
- Port 3010 was free before starting Slice 1.
- Existing concurrent changes in `app/dashboard-shell.tsx` remove the Data
  Decisions navigation badge. The mobile patch must preserve that work.
- Trade Explorer source and plan files became dirty after the owner identified
  the concurrent session, confirming the reserved ownership boundary.

### 2026-08-16 - Slice 1 implementation evidence

- The audit-affected position was restored through the existing account-scoped
  Open Positions UI. Open Positions and Swing Trade Tracker both show two
  Active swings after the corrective revision.
- The shared header no longer renders the generic `Trade Tracker` caption or a
  route-level heading. On Trade Explorer, browser inspection found zero `h1`
  elements in the header and exactly one `h1` in the main page body.
- Desktop and 390 x 844 rendering keep the complete body title and header
  utilities without horizontal page overflow. At 320 x 568, the menu and
  notification controls measure 44 x 44 pixels, the account selector is 44
  pixels high, and body width remains within the viewport.
- `Mark failed swing` now opens a plain-language confirmation at both 390 and
  320 pixels. The compact layout stacks full-width actions, explains that the
  shared status becomes Unplanned hold, and states that saved executions do not
  change.
- Choosing `Keep as active swing` closed the dialog without a Journal mutation;
  the page continued to show two active swings.
- A fresh desktop browser load of Trade Explorer reported no console errors.
- No Vitest, automated test suite, typecheck, lint, production build, commit,
  push or deployment was run during this owner-approval slice.

### 2026-08-16 - owner-requested Slice 1 refinements

- [x] Replace the Rules page heading with the single title `Trading Rules`.
- [x] Remove the visible `TRADING PLAN`, `Rules you chose to follow`, and
  `Start with a few rules that matter to you.` copy.
- [x] Keep the revised Rules header within the 320-pixel viewport by placing
  Help beside the title and stacking its three actions into full-width mobile
  buttons.
- [x] Add `Trading Calendar` as the Calendar body heading and align its route
  metadata.
- [x] Replace the AI Chat sidebar icon with the outlined SmartToy icon.
- [x] Add a labeled `AI` action to the shared top header. The control uses the
  same deep blue as primary dashboard buttons, a white outlined robot on a blue
  tile, and opens the existing closable AI Chat drawer.
- [x] Keep the new header controls within the planned 320-pixel width. The final
  owner-directed header contains Menu, AI Chat and Notifications only; Import
  Trades is a standalone left-navigation link and account selection lives on
  Account -> Trading.
- [x] Recheck the Trading Rules, Calendar and AI Chat Help guides; the changes
  affect labels and navigation access only, so no guide content change is
  required.
- [x] Capture clean desktop, 390 x 844 and 320 x 568 browser evidence.
- [ ] Receive owner visual approval for the revised Slice 1.

The first browser attempt was temporarily blocked by the concurrent Trade
Explorer session while its client still referenced an in-progress ordering
module move. That compile error is outside this mobile file boundary and must
not be repaired or absorbed here. The owning session restored the shared
checkout, and this mobile acceptance pass resumed without changing or absorbing
its files.

### 2026-08-16 - refinement acceptance evidence

- Clean desktop loads show zero header headings and one main heading on each
  revised route: `Trading Rules` on `/rules` and `Trading Calendar` on
  `/calendar`.
- The removed Rules copy does not occur in the rendered page, and the clean
  desktop browser loads reported no console errors.
- At 390 x 844 and 320 x 568, the shared header and document remain within the
  viewport. At 320 pixels, the final AI control is 56 x 44 pixels; Menu and
  Notifications are each 44 x 44 pixels.
- At 320 pixels, the Rules actions stack into full-width buttons and the page
  remains within the viewport.
- Activating the top-header AI control on `/calendar` preserves the Calendar
  URL and opens the existing AI Chat drawer across the full 320-pixel viewport.
- Browser inspection used the existing controlled no-worker review server on
  port 3010. No automated test suite, typecheck, lint, build, commit, push or
  deployment was run.

### 2026-08-16 - owner visual follow-up

- Tightened the top-header AI control to a 56-pixel width with reduced internal
  spacing while preserving its 44-pixel touch height and blue/white SmartToy
  treatment.
- Kept `Trading Calendar` as the single Calendar body `h1` and gave it an
  explicit desktop-visible text color, display mode, weight and line height so
  it remains visually distinct from the Calendar controls below it.

### 2026-08-16 - shared navigation, Help and Ticker follow-up

- [x] Remove Import Trades and the active-account selector from the shared top
  header.
- [x] Make Import Trades a visible standalone left-navigation link rather than
  a child of the Data section.
- [x] Move active Trade Tracker account selection to Account -> Trading and
  stop loading account options in every dashboard layout request.
- [x] Replace page-local question-mark links with one route-aware Help icon at
  the top right of each dashboard page. Calendar links to `/help/calendar`,
  Analytics Overview links to its overview/date-range guide, and Ticker links
  to its ticker guide.
- [x] Rename the Results navigation label, body title and metadata to `Ticker`
  while retaining `/analytics/results` as the compatible route.
- [x] Add a top-right Rows per page selector with 10, 25, 50 and 100 options;
  render only the selected page and provide previous/next pagination.
- [x] Update Core Analytics Help for the Ticker name and pagination controls.
- [x] Complete desktop and 320 x 568 browser review with no console errors or
  horizontal document/header overflow.
- [ ] Receive owner visual approval for this follow-up.

Browser evidence used the live 135-ticker account population. The Ticker table
rendered 25 rows by default with `1-25 of 135`, changed to 10 visible rows with
`1-10 of 135`, and advanced to `11-20 of 135`. At 320 pixels, Calendar and
Ticker each stayed within the viewport, and the shared header rendered only
Menu, the 56 x 44 AI control and the 44 x 44 Notifications control. No
automated test suite, typecheck, lint, build, commit, push or deployment was
run.

### 2026-08-16 - Candle Patterns grouping follow-up

- [x] Confirm that each existing Candle Patterns row is an aggregate keyed by
  pattern, timeframe, execution side and location rather than one trade.
- [x] Group every timeframe, execution-side and location result under one
  visible candle-pattern card without blending its win-rate, return, result or
  distinct-trade calculations.
- [x] Rank unique pattern names by total saved occurrences so repeated
  timeframes no longer appear as separate bars.
- [x] Replace the Most observed patterns description with `The ten most
  frequently observed candle patterns.`
- [x] Align the Candle Patterns Help guide with the grouped card and ranking
  semantics.
- [x] Complete desktop, 390 x 844 and 320 x 568 browser review. The document
  remained within each mobile viewport while the detailed tables scroll only
  inside their pattern cards, and the page reported no console errors.
- [ ] Receive owner visual approval for the Candle Patterns grouping.

No automated test suite, typecheck, lint, build, commit, push or deployment was
run during this owner-approval slice.

### 2026-08-16 - dense data and chart follow-up

- [x] Replace the Open Positions phone table with position cards while
  preserving the complete desktop table and trader-authored status.
- [x] Replace the Execution Analytics eleven-column phone table with cards,
  add a complete phone Sort control, and use bounded 10/25/50/100 pagination.
- [x] Start Timing charts with phone-readable horizontal bars and stack their
  measure and chart-style controls at narrow widths.
- [x] Render Trade Analyzer comparison breakdowns, MFE/MAE evidence, Candle
  Pattern groups, Green-to-Red supporting trades and Analyzed Trades as
  identity-preserving mobile cards while retaining the desktop tables.
- [x] Make Green-to-Red and MFE/MAE evidence links open the exact Daily Trade
  Tracker trade rather than only its date.
- [x] Add a Market Charts body title, dynamic mobile-height behavior, explicit
  loading/failure states and a retry action.
- [x] Align Open Positions, Core Analytics and Trade Analyzer Help copy with
  the responsive presentations and exact Tracker links.
- [x] Integrate Trade Explorer's complete filter set into a phone drawer and
  replace both grouped-result and individual-trade phone tables with readable
  cards, including expandable execution details and bounded, touch-sized
  pagination. Grouped views no longer mount an unbounded ticker/day list.
- [x] Complete desktop, 390 x 844, 320 x 568 and landscape browser review for
  this follow-up.
- [ ] Receive owner visual approval for Slice 3.

Source review and `git diff --check` pass for the completed Slice 3 files. No
automated test suite, typecheck, lint, build, server restart, migration,
commit, push or deployment was run.

### 2026-08-16 - Calendar, import and complete-route source sweep

- [x] Replace the phone month grid with compact five-column day summaries and
  the phone week grid with stacked day cards while keeping both full desktop
  Calendar views.
- [x] Stack Calendar date filters on phones and keep detailed day review in the
  existing mobile drawer.
- [x] Replace Import Trades mapping-issue and import-history phone tables with
  cards while preserving their desktop tables.
- [x] Replace Data Decisions statement rows and execution-evidence phone tables
  with readable cards, including long issue text and the expanded decision
  editor.
- [x] Make the Daily Trade Tracker tag picker and Account deletion confirmation use
  full-width stacked actions on phones.
- [x] Give Workspace a single body page title, one-column phone metrics and a
  non-crowded recent-calendar header.
- [x] Give Quick Trade Entry, Notifications and the empty Daily Trade Tracker
  state their missing body-owned page titles after the shared header title was
  removed.
- [x] Make the Notifications menu viewport-bounded, wrap long update text and
  keep its bell and dismiss actions at least 44 pixels square.
- [x] Add 44-pixel AI Chat header controls, a phone-right-aligned send action
  and bottom safe-area padding for the composer.
- [x] Confirm the redirected Analytics Lab and unmounted legacy Import Repair
  surfaces are not active dashboard destinations; preserve their reference
  files instead of changing dead UI.
- [x] Align Data Decisions and Notifications Help with their phone
  presentations.
- [x] Complete the controlled desktop, 390 x 844, 320 x 568 and 844 x 390
  browser review after the concurrent Trade Explorer load subsides.
- [ ] Receive owner visual approval for the complete-route source sweep.

The Trade Explorer owning session released its files without an early commit,
allowing the responsive presentation to be integrated without changing its
query, result, cursor or execution-detail contracts. All newly changed source
and Help files pass targeted `git diff --check`. Per the active owner-approval
and low-resource boundary, no automated test suite, typecheck, lint or build was
run by the mobile slice. Narrow local commits were created only after the owner
released both concurrent boundaries; no push or deployment was run.

Final controlled acceptance covered 56 live browser checks across 31 unique
active routes, plus the full Trade Explorer filter, grouped-result, trade-card
and execution-detail interactions. Representative desktop pages, every active
route at 390 pixels, the densest pages at 320 pixels and the principal dense
pages at 844 x 390 remained inside their viewports with one body-owned `h1`,
one route-aware top-right Help link where applicable, no duplicate IDs and no
runtime errors. The shared 320-pixel header fits Menu, the 56 x 44 AI control
and the 44 x 44 Notifications control. Trade Explorer keeps its desktop tables,
uses mobile cards, opens a full-height filter drawer, expands exact executions
and pages grouped results without mounting an unbounded ticker/day list.

The Candle Pattern occurrence explorer also passed desktop, 390-pixel,
320-pixel and landscape checks. Its saved chart loads lazily in a desktop
drawer or full-screen mobile dialog, all visible mobile controls are at least
44 pixels high, and its exact Daily Trade Tracker deep link was verified
without navigating into the tracker. Daily and Swing Trade Tracker routes were
deliberately excluded from this route sweep while chat
`01a00bea-b754-7193-92ac-e3ae7a4a54a8` was active because those pages may
autosave in-progress drafts. After release, that chat completed its own fresh
desktop and 390-pixel browser acceptance and cleaned its QA data. Owner visual
approval remains the next gate.

### 2026-08-16 - owner-directed mobile readability correction

- [x] Re-run the integrated dashboard in controlled no-worker review mode at
  desktop, 390 x 844 and 320 x 568 before changing accepted UI.
- [x] Confirm the compact Calendar month grid keeps all five weekdays visible
  only by reducing day cells to 48-63 pixels and meaningful facts to 9-10
  pixels.
- [x] Owner rejected shrinking or removing useful information merely to avoid
  contained horizontal scrolling.
- [x] Replace the compact month grid with a contained snap-scrolling grid that
  shows one readable day card at narrow phone widths, keeps weekday headings
  aligned, and preserves day P/L, trade count, win rate and ticker results.
- [x] Correct the clipped 320-pixel Calendar period navigation and restore
  comfortable touch targets.
- [x] Re-audit other condensed responsive surfaces and retain or restore
  contained horizontal scrolling wherever it provides a more readable and
  complete experience than the current presentation.
- [x] Recheck desktop, 390 x 844, 320 x 568 and 844 x 390, update Calendar Help,
  and request owner visual approval.

Browser acceptance evidence:

- The Calendar month view shows one complete 232-pixel day at 320 pixels and
  one complete 302-pixel day at 390 pixels, with a visible slice of the next
  day, a plain swipe instruction and snap scrolling. Populated cards preserve
  exact day P/L, trade count, win rate and up to four ticker results.
- Calendar month/year selectors remain legible at 320 pixels, both period
  arrows are 44 x 44 pixels and remain inside the viewport. Landscape presents
  several 220-pixel day cards when space genuinely supports them; desktop
  continues to use the complete five-column grid.
- Calendar day details still open as a full-width phone drawer, ticker rows
  remain reachable, and the drawer introduces no page-level horizontal scroll.
- The closed and open AI Chat drawer no longer expands the document beyond the
  phone viewport. Its open width exactly matched 320 pixels during acceptance.
- Monthly P/L, Timing and Execution chart scrollers now explain that the chart
  can be swiped and use an arrow cue without an old-style visible scrollbar.
  The Daily Trade Tracker week strip uses the same discoverable treatment.
- Daily Trade Tracker date navigation fits one row at 390 pixels and uses an
  intentional two-row layout at 320 pixels. Chart timeframe controls are 40 x
  44 pixels with 12-pixel labels; chart zoom controls are 44 x 44 pixels; the
  Candle patterns control is 44 pixels high.
- Swing execution Edit actions and other reviewed compact controls now expose
  44-pixel phone targets. The Notifications menu's View all notifications link
  is also 44 pixels high.
- Candle Pattern View occurrences now opens a 320-pixel full-width mobile
  drawer and a 760-pixel desktop right drawer instead of inserting the browser
  far below the selected pattern. Closing it restores the pattern-list scroll
  position. Opening an individual replay retains the existing full-screen
  mobile chart and desktop replay drawer.
- Desktop, 390 x 844, 320 x 568 and 844 x 390 checks all retained zero
  page-level horizontal movement while the intended internal scrollers
  remained operable.

### 2026-08-16 - dense-view acceptance reopened

- [x] Confirm from commit `21051fb9` that the earlier mobile pass hid the
  horizontally scrollable Execution Analytics table and substituted cards.
- [x] Replace the prior blanket card rule in the controlling plan with an
  information-design rule: comparison tables scroll inside their panel;
  record cards are allowed only when every desktop field remains present.
- [x] Inventory every desktop table column and its current phone
  representation across Analytics, Trade Analyzer, Trade Explorer, Journal,
  Help and all remaining dashboard routes.
- [x] Restore every comparison-heavy phone table with readable column widths,
  a visible swipe instruction and arrow, contained overscroll and no page-level
  overflow.
- [x] Correct any record card that omits or compresses a meaningful field.
- [x] Re-run the complete active-route browser review at desktop, 390 x 844,
  320 x 568 and 844 x 390 before requesting owner approval.

The corrected dense-surface inventory now uses these presentations:

- Ticker keeps all seven columns in a 760-pixel contained table with a pinned
  Ticker column, mobile Sort control and bounded pagination.
- Execution keeps all eleven trade columns in a 1,280-pixel contained table
  with a pinned Ticker column, mobile Sort control and bounded pagination.
- Day Trade Analysis comparison rows, Green-to-Red supporting trades, MFE/MAE
  comparison and measured executions keep their complete comparison tables at
  readable widths from 760 to 1,520 pixels.
- Candle Pattern group breakdowns and the paginated occurrence browser keep
  their complete tables; the selected replay remains a full-screen phone
  dialog and is loaded only when requested.
- Analyzed Trades, Trade Explorer grouped results, Trade Explorer individual
  trades, Analytics Lab and Help comparison blocks use the same contained
  table contract. Trade Explorer keeps the full mobile filter drawer and
  bounded result pages.
- Open Positions, Import mapping issues/history and Data Decisions evidence
  retain cards on phones only because source comparison confirmed every
  meaningful desktop field is present and row-to-row column comparison is not
  their primary task. Import field mapping and Data Decisions repair grids
  remain contained tables.
- Calendar shows one complete day at narrow phone widths with a visible part of
  the next day plus the swipe cue. Month cards retain P/L, trade count, win
  rate and available ticker results. The phone week remains a readable card
  list.

Every retained horizontal table, chart, Calendar strip and Daily Trade Tracker
week strip now shows a plain scroll instruction with a directional arrow before
the scrollable content. Native scrollbars remain visually quiet. The shared
table region is keyboard focusable, contains horizontal overscroll and can pin
the first comparison column without moving the whole document.

### Corrected route evidence

- Live 320-pixel browser evidence verified Ticker and Execution have no
  document overflow, show the 13.5-pixel swipe cue, preserve their complete
  760/1,280-pixel tables and physically scroll inside the panel. Ticker reached
  its maximum horizontal offset while its pinned first column remained aligned
  to the panel edge.
- The controlled no-worker server returned complete `200` responses for every
  active top-level dashboard destination: Workspace; Daily and Swing Trade
  Tracker; Quick Trade Entry; Calendar; Trading Rules and Rule Results; Open
  Positions; Analytics Overview, Ticker, Timing, Execution, Day Trade Analysis,
  MFE & MAE, Green-to-Red, Candle Patterns, Analyzed Trades and Trade Explorer;
  Imports; Data Decisions; Notifications; Market Charts; AI Chat; AI Reviews;
  Help; Account and all Account subsections. The dated Daily Trade Tracker and
  preserved redirect routes also rendered successfully.
- Entry & Exit was not retried after the in-app browser navigation safety layer
  blocked that exact URL following the first review server's low-memory crash.
  Its responsive tables are rendered by the same corrected shared Day Trade
  Analysis client that passed lint and rendered successfully through the other
  Analyzer routes.
- The first full four-viewport rerun was interrupted when its controlled review
  process reached its memory limit and the in-app browser retained the failed
  navigation. No alternate browser was used to bypass that safeguard. The fresh
  worker-free acceptance below supersedes that temporary boundary.

### 2026-08-16 - final four-viewport and drawer acceptance

- [x] Replaced the failed review process with a fresh worker-free server after
  verifying and stopping only the stale port-3010 process tree.
- [x] Rechecked the active dashboard inventory at 390 x 844 and 320 x 568,
  including Workspace, trackers, Calendar, Rules, Open Positions, Imports,
  Data Decisions, all Core Analytics and Trade Analyzer destinations, Trade
  Explorer, AI, Charts, Help, Notifications, Account subsections and supported
  redirect routes. No active page introduced document-level horizontal
  movement.
- [x] Physically scrolled Calendar and Ticker at 320 pixels. Calendar moved to
  later complete day cards while retaining P/L, trade count, win rate and
  tickers. Ticker moved 320 pixels while its pinned ticker cell remained
  aligned with the panel edge.
- [x] Made shared table cues reflect actual overflow. A fitting 760-pixel
  Ticker table has no misleading landscape cue; the 1,280-pixel Execution table
  keeps `Scroll sideways to see all columns` in landscape and desktop because
  it still scrolls inside its panel.
- [x] Rechecked representative desktop and 844 x 390 layouts after the clean
  restart. Calendar, Ticker and Execution retain one body title and no page
  overflow, and the shared overflow rule covers every corrected dense table.
- [x] Audited every active drawer implementation for an explicit exit. AI Chat,
  Trade Explorer filters, AI Review coverage, Candle Pattern occurrences and
  replay already had visible Close actions. Added 44-pixel labeled Close
  controls to mobile navigation, Calendar filters and saved views, and verified
  Calendar day details closes through a visible 44-pixel action.

Owner visual approval remains the only product-acceptance gate. No push or
deployment was performed.

### 2026-08-16 - second mobile usability follow-up

The owner requested another phone-first QA pass and approved the resulting
recommendations. This follow-up treats fitting inside the document viewport as
only a safety baseline: information must remain readable, organized and usable.

- [x] Replace the 7,000-pixel-plus Trading Rules phone page with compact saved
  rule summaries, on-demand rule details and a separately collapsible custom
  rule section.
- [x] Move the 12-card preset library into a searchable full-screen phone
  browser with an explicit 44-pixel Close action. Desktop keeps the visible
  preset library.
- [x] Increase Help collection expand controls, child guide rows, the mobile
  Browse help control and in-guide anchor chips to at least 44 pixels.
- [x] Increase Help comparison-table headings to a readable 14 pixels while
  retaining full column widths, the pinned first column and the swipe cue.
- [x] Put Ticker first and pin it in the Analyzed Trades, Candle Pattern
  occurrences and Trade Explorer individual-trades tables so row identity
  stays visible during a horizontal swipe.
- [x] Complete fresh 320 x 568, 390 x 844 and 844 x 390 browser acceptance for
  Rules, Help and the three corrected long-table surfaces.
- [x] Create the narrow local checkpoint commit after the focused source and
  browser gates pass.

The Trading Rules changes do not alter rule meaning, lifecycle, effective
dates, automatic checks or Journal mutations. The Help guide content remains
factually aligned because this follow-up changes navigation target sizes and
presentation only; no workflow instruction changed.

Fresh browser evidence confirmed:

- Trading Rules has no document-level horizontal movement at 320, 390 or 844
  pixels. Its default phone height fell from more than 7,000 pixels to 2,495
  pixels at 320 and 2,306 pixels at 390 while every saved rule still shows its
  status, name, category, scope and configured value before expansion.
- Every saved-rule disclosure, custom-rule disclosure and preset-browser Close
  action is 44 pixels high or square. The preset browser fills the phone and
  uses two readable columns in 844 x 390 landscape. Desktop continues to show
  the inline preset library, expanded saved-rule details and both custom rules.
- The first live 320-pixel pass exposed a server/client breakpoint mismatch in
  the new Rules conditional. The responsive initialization was corrected and a
  fresh load no longer reports the hydration error.
- Help renders its Browse control and guide anchors at 44 pixels, visible Help
  collection expand controls at 44 x 44 and comparison-table headings at 14
  pixels. The 520-pixel comparison table physically scrolled to its 241-pixel
  maximum while its first cell stayed aligned with the 12.8-pixel panel edge.
- Analyzed Trades physically scrolled 500 pixels inside its 1,040-pixel table,
  Trade Explorer scrolled 600 pixels inside its 1,260-pixel table and Candle
  occurrences scrolled 500 pixels inside its 1,060-pixel table. In each case,
  the first Ticker cell stayed aligned with the table panel while the document
  width remained unchanged. Trade Explorer's expanded 11-column execution row
  remains a normal full-width detail row instead of becoming sticky.
