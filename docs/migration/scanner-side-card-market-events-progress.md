# Side-card Market Events — implementation checkpoint

Owner direction relayed from PC chat on November 7, 2026 Eastern: retain the side card as the chart workspace; add Market Events beside the selectable screeners without duplicate refreshes. Next feature is mobile side-card design, reviewed before implementation. No hosted release requested in this slice.

Added unchecked-by-default Market Events checkbox alongside Top Gainers, Momentum, Top Losers and High Drops. Reuses the existing Market Events card and chart/news actions in the existing two-column desktop grid. Five selected cards allow a third row rather than clipping the fifth. Closing the selector removes its side-card view; dashboard card remains available.

Lifted article/date/cap/float/exchange/channel-cache data into one useMarketEventsData hook in LiveScreenersClient. Both card instances consume that object. One 30-second headline refresh loop; compact-article enrichment runs once. Active halts reuse scanner model; no second halt polling loop. Per-card article drawer/scroll state remains independent. Added abort cleanup for shared feed requests. Scanner polling itself remains shared and unchanged. This slice does not yet implement pausing covered dashboard rendering or a browser/server load-capacity gate.

Applied coherent overlay to the owner's existing private preview artifact at production-ebe8f054e, preserving its prior UI and fixture overlays; assigned source has newer layout work and was not copied wholesale into the preview. No Railway/provider/production configuration changes.

Verification: edited TSX exact-file ESLint PASS. Targeted TypeScript reports only three errors in untouched High Drops dependencies (premarket-pullbacks-card two nullable inputs; premarket-pullbacks missing expanded reference fields), not a clean overall TypeScript result. Focused desktop browser: opened real NWGL chart, selected Screeners and Market Events, card visible, zero additional summary-news requests on selection, chart retained; unchecking removed side-card event heading. Existing real chart history/stream both HTTP200. No load test or broad build run. React review: one parent hook, stable card/chart keys, checkbox labels preserved, shared cleanup and independent presentation state; retain approved MUI system.

Help review: Stock Levels scanner-workspace guide lists the same selectable cards, so added Market Events to that list. Owner visual acceptance pending.

## Proposed next mobile design — not implemented

Keep the existing dashboard as trade-idea entry point. Side card opens full-screen on phones, with a compact header containing Back/Close and selected ticker. Below it, horizontally scrollable open-ticker chips with close actions and Add chart. Use Chart, Details and Screeners tabs for the main content area. Chart shows one selected chart at a time on narrow phones, retaining up to four open ticker slots; desktop retains its existing grid. Details shows the selected stock and levels/news; Screeners shows selected scanner/Market Events cards in one scrollable column. Preserve tab, ticker and scroll state when switching. This needs owner approval, particularly showing one selected chart rather than the existing mobile multi-chart grid and whether chart history/streams should remain active for hidden ticker slots.

## Approved mobile chart behavior — November 7 Eastern

Owner clarified: mobile must show one chart switched by the existing ticker-symbol details tabs; existing close-chart buttons stay in place. Implemented only this approved behavior, retaining desktop grids and the existing surrounding mobile details/screener layout. Below the existing md breakpoint, mount only the selected ticker chart. Selecting another ticker removes the old chart component, aborts its outstanding history request and closes its EventSource through existing cleanup; its ticker slot/details state remains. Returning to a ticker remounts its chart (currently resets its timeframe to 1m). Desktop keeps all open charts mounted. No new Chart/Details/Screeners top-level mobile tab redesign is implied or implemented. All source data and key boundaries unchanged.

Focused mobile/desktop browser PASS: mobile one mounted chart with two open tickers, ticker detail tab selects matching chart, both existing close buttons present; resizing to desktop shows both charts, returning to mobile shows one, closing selected ticker selects remaining chart, closing workspace removes all chart components. History/stream HTTP200 observed. Exact-file lint PASS. Initial attempt was blocked by the existing analytics consent overlay; final run dismissed consent before opening the drawer. No changes to cookie UI, production or hosted settings.

## Separate Open and Add chart controls — November 7 Eastern

Owner requested retaining the existing chart icon as a replacement action and adding a second additive chart icon beside it. Implemented shared ScannerChartLaunchControls for Top Gainers/Momentum tables, two-row/card layouts, Top Losers, High Drops and Market Events news/halt rows. Accessible labels are Open SYMBOL chart only and Add SYMBOL chart; tooltips explain replacement versus addition. Existing expansion plus remains separate. Reserved action-column widths increased only to fit the extra icon. No broad table/font redesign.

Replacement opens the chosen ticker and details alone, even at the four-chart limit, clearing the old limit notice. Add preserves open tickers and existing duplicate selection/four-chart behavior. Header Add chart remains additive. Both actions select the ticker details. Mobile mounts only the selected chart; desktop retains the grid. Close controls unchanged. Shared data feeds and provider boundaries unchanged; no Railway release.

Verification: two reducer contract tests PASS, edited five TSX exact-file lint PASS. Targeted type check has the same three pre-existing High Drops calculation/nullability errors (shifted lines after control extraction); no new errors reported. Focused browser PASS: additive icon retains two charts; existing chart icon replaces both with NWGL; header add stops at four with visible limit notice; mobile remains one selected chart and all four close controls remain. Actual chart history HTTP200 observed. Help updated to distinguish both actions. Owner visual review pending. Local checkpoint stages only this slice from its preservation parent, not newer mixed dashboard layout work.

## View-specific chart launch controls

Owner clarified Add chart belongs only to side-card screeners. Shared launch controls now default to Open only; an explicit side-card context enables Add. Dashboard and full-dashboard screener cards keep their original action spacing, with extra control width reserved only in the side-card context. Different view presentation is independent while scanner result data and polling remain shared. Desktop/mobile chart behavior and close controls unchanged. Focused browser PASS: dashboard additive icon count zero; drawer Add preserves two charts, Open replaces, limit four and mobile selected chart/close controls retained. Exact-file lint PASS. Targeted type check still reports only the same three existing High Drops errors; no clean overall type-check claim. Help aligned; preview only, no Railway release.

## Mobile outer workspace scrolling fix

Owner reported only the top of one screener reachable below the chart. Root cause in layout: mobile chart/details used a constrained grid with an overflow-hidden details region and flexing panels, clipping the growing screener list. Mobile now uses block flow inside one bounded outer vertical scroller; the chart stays first at 55dvh, details/tabs and selected cards grow naturally below. Desktop retains its grid, panel scrolls and hidden outer overflow. Header/close controls stay in their existing position with no flex shrink. Table containers explicitly allow vertical overscroll chaining so a swipe at their edge can move the workspace; independent inner table scrolling remains.

Focused touch-enabled Chromium at390x844 PASS: all five cards mounted; outer777px viewport/2107px content; actual CDP touch swipe from a table at its lower boundary moved outer scrollTop450 to675. At outer bottom, complete last Market Events card visible at y540 through840 (height300). Background page scroll stayed0. Resizing desktop verified display:grid and overflowY:hidden. Chart history and stream HTTP200. Exact-file lint PASS. No broad load test/build or hosted change. Help updated with mobile scroll behavior. Existing preview overlay updated in place; owner phone review pending.

## Scanners page URL split

The continuous workspace now belongs at /scanners; /screeners is a separately guarded Coming soon page for future snapshot tools. Side-card fixes remain intact. See [route split and verification](scanners-screeners-route-split-progress.md). Owner review pending; no production release.

## Alpaca detector and provider selector development checkpoint

Owner approved a bounded event-driven Alpaca trial and keeping Moomoo code off behind an owner selector. Scanner controls now expose the connection choice; isolated stream/timing/switch/security/display checks pass. Preview remains worker-disabled and production unchanged. See [implementation, exact scope and verification](alpaca-event-scanner-progress.md), including remaining audit/storage and concurrent-user rollout gates.

## November 11, 2026 — Alpaca halt lifecycle

With `TRADERLINK_MARKET_HALT_SOURCE=alpaca` on the VPS gateway and Platform, the scanner reads current halts from the gateway's SIP status subscription. Nasdaq records only supply scheduled quote and trade times for the matching ticker and halt start. The existing Market Events reason categories are retained. The same active halt list supplies the pause icon to scanner cards.

Trading resumption clears the pause. Two eligible, time-ordered trades after the pause began also clear it when the execution price changes. This inference lives in the gateway process. A subsequent halt starts a new lifecycle. Quote-only reopening and posted resume times leave the pause active.

The local QA uses simulated SMX and OMH events and an isolated checkout of the release parent. The new gateway code must be present before selecting Alpaca. Production was left untouched.
