# Mobile Dashboard Experience Plan

**Status:** Implementation and four-viewport QA complete; owner visual approval pending
**Repository:** `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
**Branch:** `codex/traderlink-platform-replacement`
**Progress record:** [Mobile Dashboard Experience Progress](mobile-dashboard-experience-progress.md)
**Visual baseline:** Approved light Material dashboard with the complete shared navigation

## 1. Outcome

Make every TraderLink Platform dashboard route comfortable and dependable on a
phone without reducing desktop capability. The work keeps one shared shell,
plain trader-facing language, exact Journal facts, and existing account
boundaries.

Each visible slice requires owner review before the next slice is accepted.
Implementation does not authorize a deployment, push, hosted configuration
change, broad test run, or mutation of unrelated Journal data.

## 2. Complete target inventory

The controlling inventory is the complete dashboard navigation and route set in
`app/dashboard-navigation.ts`, including Workspace; Calendar; Daily and Swing
Trade Tracker; Open Positions; Quick Trade Entry; Trading Rules; Trade Tags;
Data Decisions; Import Trades; Analytics Overview, Results, Execution, Timing,
Trade Analysis, Trade Explorer, Candle Patterns, Analyzed Trades and
Green-to-Red Moves; Market Charts; AI Chat; AI Reviews; Reflection; Help;
Notifications; and Account.

The mobile review and implementation cover all of the following interaction
families across that inventory:

- shared header, navigation drawer, account switcher, notification center,
  import action, AI Chat drawer and safe-area behavior;
- one visible page-title owner per screen, with the page body retaining its
  clear title and the shared top header no longer repeating route titles;
- 320-pixel portrait, representative modern-phone portrait, and phone
  landscape layouts;
- readable typography, 44-pixel-or-larger primary touch targets, sensible
  spacing, keyboard focus, zoom-safe form inputs and untruncated labels;
- tables, result lists, filters, expandable sections, date controls, tabs,
  pagination, charts, loading states, empty states, errors and retry actions;
- dialogs, drawers, menus, popovers and confirmations, including safe handling
  of position-status changes;
- sticky or fixed controls that remain reachable above browser and device safe
  areas; and
- desktop preservation at every slice.

## 3. Approved product decisions

### 3.1 Page-title ownership

The shared dashboard header is application and navigation chrome. It must not
repeat the current route name or the generic `Trade Tracker` caption. The page
body owns the single clear page title. Routes that currently rely only on the
header title must receive a body title in the slice that redesigns that page.

This shared-shell change resolves the duplicate `Trade Explorer` heading
without editing the Trade Explorer client that is concurrently being updated
by session `01a00ab5-56fc-76d0-9d6b-4e33cf6938b8`.

### 3.2 Responsive information design

- Dense desktop tables remain readable rather than being compressed to fit a
  phone. Comparison-heavy tables remain tables inside a contained horizontal
  scroller on phones. The scroller must show a plain swipe instruction and
  directional cue, preserve comfortable type and row height, expose keyboard
  focus, and keep the page itself from moving sideways.
- A record list may use phone cards only when every meaningful desktop column
  is mapped to a clearly labeled, readable card field and row-to-row column
  comparison is not the main task. No field may be silently removed to make a
  card fit. When either condition is not met, the contained table is the mobile
  presentation.
- A swipeable table or chart must be discoverable before the user interacts
  with it. The phone view shows the swipe instruction and arrow, and the
  content width leaves additional columns or items available beyond the right
  edge. Native scrollbars may remain visually quiet, but scrolling must never
  be hidden without another visible cue.
- Calendar uses a contained, horizontally scrollable mobile month grid with one
  readable information-complete day card visible at narrow phone widths. Each
  populated day preserves its P/L, trade count, win rate and available ticker
  results instead of shrinking or removing them merely to avoid sideways
  scrolling. Selected-day details remain in a full-width mobile drawer, and
  mobile week view remains a stacked card list.
- Trade Explorer's long filter set becomes a mobile filter drawer with clear,
  reachable Apply and Reset actions. The session currently owning Trade
  Explorer source will be allowed to finish before those files are integrated.
- Horizontal analytical charts become viewport-aware, with readable controls
  and no hidden critical labels.
- Market Charts receives an honest loading state and retry path while its
  external chart loads.

### 3.3 Interaction safety

`Mark failed swing` changes the trader-authored status of a position. It must
open a plain-language confirmation before saving. Cancelling leaves the
position unchanged. A successful confirmation continues to use the supported,
account-scoped Journal mutation route and preserves revision conflict handling.

The swing accidentally reclassified during the read-only audit will be restored
to `Active swing` through the existing supported UI correction flow. This is a
new corrective revision, not a database rewrite.

## 4. Implementation slices

### Slice 1 - shared shell and status safety

- Remove route-title duplication from the shared header on every dashboard
  route without editing page-local titles.
- Preserve header utilities and make the mobile toolbar, drawer controls,
  account selector and notification action comfortably reachable.
- Add mobile safe-area padding to shared fixed or sticky surfaces.
- Add confirmation to `Mark failed swing`.
- Restore the audit-affected swing through the supported UI and verify the
  displayed status.
- Review desktop and mobile browser evidence, then request owner approval.

### Slice 2 - Calendar and Trading Rules

- Implement the approved readable, horizontally scrollable mobile month grid
  and stacked mobile week Calendar presentation.
- Remove duplicate or floating Help affordances and keep one contextual Help
  entry in the correct section.
- Make Rules actions wrap cleanly at 320 pixels and keep expanded details
  readable and reachable.
- Preserve desktop Calendar and Rules capability.

### Slice 3 - dense data and analytical controls

- Add identity-preserving mobile presentations for Results, Open Positions,
  Execution, Candle Patterns, Analyzed Trades and Green-to-Red Moves.
- Integrate Trade Explorer mobile filters and result presentation after the
  concurrent Trade Explorer session completes.
- Make Timing and other analytical charts fit phone viewports with usable
  controls.
- Add Market Charts loading, failure and retry feedback.

### Slice 4 - complete mobile sweep

- Fix remaining clipped card copy, wrapping date controls and undersized
  controls across Workspace, trackers, notifications, Help and Account.
- Recheck every dashboard route, expandable region, dialog, drawer, menu,
  popover, loading state and phone orientation from the complete inventory.
- Record owner decisions and any deliberately deferred item.

### Slice 5 - owner-directed dense-view correction

- Re-audit every active dashboard route after the owner rejected blanket
  horizontal-scroll removal.
- Compare every desktop table column with its phone presentation and record
  whether the surface is a comparison table or a record list.
- Restore contained sideways-scrolling tables for Ticker, Execution Analytics
  and every Trade Analyzer breakdown where column comparison is central.
- Keep record cards only where the complete desktop row remains visible and
  readable; correct any incomplete mapping.
- Add an obvious swipe cue to every retained table, chart, calendar strip or
  other contained horizontal surface.
- Repeat desktop, 390-pixel, 320-pixel and phone-landscape acceptance across
  the complete dashboard route inventory before marking this work complete.

## 5. Verification and resource boundary

During active visual work, do not run Vitest, broad tests, full regression or a
production build. Use source inspection and one controlled no-worker review
server only when browser evidence is required. Verify each slice at desktop,
390 x 844, 320 x 568 and 844 x 390 where applicable, then stop or preserve the
exact process according to the active session boundary.

Automated checks remain a later checkpoint only if the owner explicitly asks
for final acceptance or merge readiness.

## 6. Concurrency and file ownership

- Preserve all pre-existing and concurrent working-tree changes.
- Do not edit Trade Explorer actions, service, contracts, client or its plan and
  progress records while session `01a00ab5-56fc-76d0-9d6b-4e33cf6938b8` owns
  them.
- Shared files must be re-read immediately before each patch, and patches must
  retain concurrent notification, Data Decision and shell changes.
- A narrow local commit is authorized at the completed checkpoint under the
  repository Git-hygiene rule. No push, merge, deployment or remote operation
  is authorized.

## 7. Help Center decision

The current Open Positions, Swing Trade Tracker and Daily Trade Tracker guides
already explain Active swing, Unplanned hold and the shared position status.
Slice 1 changes confirmation safety without changing those meanings, so no Help
guide update is required. Later slices must repeat this check for each changed
feature.
