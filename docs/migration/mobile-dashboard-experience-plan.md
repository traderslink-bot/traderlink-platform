# Mobile Dashboard Experience Plan

**Status:** Owner approved; implementation and controlled responsive browser acceptance complete, with owner visual/product approval pending on 2026-08-16
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

- Dense desktop tables remain available on desktop. On narrow phones, rows use
  identity-preserving cards or an equally clear responsive presentation so a
  ticker or trade cannot disappear when horizontally scrolling.
- Calendar uses a compact five-column mobile month summary with selected-day
  details in a drawer, and stacked cards for the mobile week view.
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

- Implement the approved mobile month and week Calendar presentations.
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
- No commit, push, merge, deployment or remote operation is authorized by this
  plan.

## 7. Help Center decision

The current Open Positions, Swing Trade Tracker and Daily Trade Tracker guides
already explain Active swing, Unplanned hold and the shared position status.
Slice 1 changes confirmation safety without changing those meanings, so no Help
guide update is required. Later slices must repeat this check for each changed
feature.
