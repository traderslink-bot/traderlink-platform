# Shared chart multiview — owner review proposal

Status: owner approved implementation and QA-before-review private preview on November 10, 2026. Implementation, focused QA and private preview qualification are complete; owner visual acceptance is pending. No production deployment authorized. Scanner release is live/technically accepted.

## Owner workflow

Support one ticker across several timeframes, several tickers, and mixed arrangements. Maximum four visible charts total. Two ticker groups can be side by side, each with one or two stacked timeframe charts; one side may remain a single full-height chart. Keep the existing scanner drawer ticker-selection flow and Details/Screeners section. Use the existing shared chart everywhere, with independent panel symbol/timeframe state and common chart functionality.

## Main-page controls

Place a compact Multiview button in the existing chart control area. Its popover edits the complete arrangement, rather than forcing mutually exclusive modes that cannot express mixed layouts. Offer 1/2/3/4 chart targets and ticker-group rows, with total usage shown as 3/4. One ticker row contains a symbol input, its timeframe selections, Add timeframe and Remove ticker. Add ticker uses the same panel. Editing a ticker changes all its timeframe charts; editing a timeframe changes only that panel. New slots require an explicit ticker/timeframe choice; do not silently replace a chart or duplicate a timeframe. Reducing chart count requires selecting the chart to remove when there is ambiguity. Apply changes together when the user presses Apply; Cancel preserves the current workspace. Normal chart timeframe controls remain available for quick individual changes.

Example menu: Multiview / Charts 3 of 4 / OMH [1m] [5m] / SMX [1m] [+ timeframe] / [+ ticker] / Cancel / Apply. A fourth chart disables additional additions and offers explicit remove/replace choices rather than silently evicting an existing chart.

## Desktop layouts

Two tickers, one timeframe each: two equal columns. Adding a second timeframe to one ticker splits that column vertically; the other ticker keeps its entire height. Adding the fourth to the second ticker produces a two-by-two grid, each column belonging to one ticker. One ticker with two charts uses equal side-by-side cells; three uses two cells above one full-width lower cell; four uses a two-by-two grid. Three separate tickers use the same filled three-cell layout; four use two-by-two. For mixed groups totaling four, preserve each ticker's column and stack its timeframe charts. These defaults are proposed for review, not accepted product rules. Drag/drop, adjustable dividers, linked crosshairs and synchronized zoom are deferred until the basic interactions are reviewed.

Use the existing chart toolbar for symbol/timeframe identity and Multiview actions, without a new permanent thick header. The selected chart has the established orange outline. A chart menu removes one timeframe panel; removing a ticker in the workspace menu removes its group. A temporary maximize action may expand the active chart while preserving the saved arrangement; this remains an optional review choice.

## Scanner drawer integration

Keep current chart/open/add actions and ticker details tabs. A scanner action adds a ticker group with one timeframe using the current opening/addition semantics. Add timeframe in that chart's menu adds a sibling for that ticker, consuming another of the same four total slots. A repeated action for an already-open ticker selects it instead of duplicating the group. Ticker details remain one tab per unique symbol; selecting any of its timeframe charts selects that ticker's details. Closing one timeframe leaves the ticker tab and its other chart in place; closing its last chart removes the ticker tab. The existing header ticker close action remains a whole-group close and must be labeled accordingly. At capacity, keep the current arrangement and offer an explicit replacement choice.

Example: scanner opens OMH 1m; add SMX 1m gives two columns; OMH Add timeframe 5m gives two stacked OMH charts on the left and a full-height SMX chart on the right. Adding SMX 15m completes the four-chart arrangement. Scanner cards and details section retain their existing positions.

## Phone proposal

Preserve the current drawer's active-ticker approach rather than shrinking four charts into unreadable quarters. Show timeframe charts for the selected ticker in a vertical stack with normal vertical scrolling; switching the ticker tab shows that group. On the main page, use the same ticker selector and stack the selected group's charts. Preserve the full saved arrangement when moving between phone and desktop. This is a review proposal, not a finalized mobile requirement.

## Shared implementation boundary after layout approval

Current inspection: MarketChartWorkspace renders one AlpacaLightweightChart. Scanner drawer renders that exact shared component for up to four unique symbols. ScannerChartWorkspace currently keys and deduplicates by symbol, so same-symbol timeframe siblings require separate chart-panel IDs and ticker-group IDs, with one selected panel and one associated selected ticker. AlpacaLightweightChart currently accepts symbol/sx and owns its active timeframe; extend that shared component with controlled panel timeframe callbacks rather than building a second renderer or overloading account default timeframe. Workspace layout/ticker/timeframe selections should be persisted independently from the existing saved indicator/style preferences; exact account-persistence contract is a later implementation step after review. Existing indicator/style settings continue to apply according to their current shared preferences contract.

All panels render the same chart component; new features/fixes apply everywhere. Shared data transport should coalesce subscriptions for identical tickers and requests for identical ticker/timeframe/ranges; four panels must not imply four independent provider WebSocket connections. Each panel's scale/zoom and historical-loading cursor remain independent. Chart resizing uses its existing autoSize behavior, not clipping a full-size canvas into a small cell. Locally verified lightweight-charts 5.2.0 and installed typings for autoSize; no library API or version changes are proposed.

## Required review and eventual verification

Owner reviews the main menu, mixed three-chart layout, four-chart grouping, scanner action behavior and phone arrangement before coding. Later implementation QA covers independent timeframe changes, ticker-group changes, capacity and close behavior, saved state/navigation/sign-out persistence, no effect on another user's workspace, four-chart sizing without cropping, indicator persistence, shared live data and independent historical pagination. Review Chart Help guidance when implementing and update it for accepted multiview controls. No implementation tests or preview changes are needed for this document-only proposal.

## Owner-approved mobile layout choice

Owner approved Tabs/Stack on November 10. Add Mobile layout to Multiview settings on phones, default Tabs for existing saved layouts. Stack renders all configured ticker/timeframe charts vertically; Tabs retains selected ticker with its timeframe stack. Save per-account/per-workspace alongside layout. Keep four total panels and desktop arrangement unchanged. Reuse shared data connections. Verify mixed groups, scrolling without overlaps, switching without losing configuration, save/reload, desktop sizing, scanner drawer, and account persistence. Private preview only; owner visual acceptance remains required.

## Owner-approved landscape layouts

Owner approved independent Portrait Tabs/Stack and Landscape Tabs/Stack/Grid. Grid is two columns with remaining panels in the next scrollable row, for any ticker/timeframe combination. Preserve saved choices through rotation, existing layouts and scanner actions. Fix the main chart's 360px floor that extends below short landscape screens; size landscape rows to available chart viewport height. Compact landscape detection includes wider phones up to 1200px when height is at most 600px. Desktop grid stays unchanged. Private preview and rotation/canvas/scroll QA required before owner review.

## Owner-approved compact mobile chart trial

Owner approved compact workspace search/layout/focus controls, one-line per-chart ticker/timeframe/options, collapsed chart settings and Focus mode with retained dashboard navigation. Apply on the private main chart page only; scanner drawer keeps its current controls and desktop remains unchanged. Header height becomes 44px only while compact main chart is mounted, through scoped styles; no shared shell source changes. Search opens a dialog; chart options retain timeframe, indicators, appearance, Multiview and close. Focus covers dashboard/workspace controls with small exit/navigation actions and Escape support. Verify rotation, search, menus, saved layout, focus sizing/navigation, desktop and other-page restoration, plus canvas/data behavior before owner review. Private preview only.

## Owner-approved two-row mobile chart trial

Owner approved combining dashboard navigation and chart search/layout/focus into one mobile page row. Dashboard header is hidden only while compact main chart is mounted; its existing navigation, notifications, account and Help actions are reused through page controls/overflow. Tabs move inside the first selected chart's existing toolbar beside timeframe/options, removing the standalone ticker row and duplicate ticker identity. Tabs remain horizontally scrollable; Stack/Grid retain per-chart identity. Focus still offers chart controls and navigation/exit. Desktop and scanner drawer unchanged. Verify all relocated actions, narrow phone widths, portrait/landscape rotation, ticker switching, Focus and normal-header restoration; no hosted release.

## Owner-approved per-chart view lifetime

Remember zoom, horizontal position and price scale per account/workspace/panel/ticker/timeframe/session selection until the chart is explicitly closed. Store only bounded browser-side coordinate snapshots, not candles or hidden chart instances. Preserve across dashboard navigation/reload in the same browser. Closing/replacing panels prunes snapshots before React unmount; cleanup cannot resurrect closed state. Restore historical anchors or live-follow width/offset, and avoid stale manual price scaling after adjustment basis changes. Fetch missing older history using the existing bounded/cancellable history path. Browser storage denial falls back to document memory. Verify real zoom/tab/navigation restoration, independent frames, close cleanup, data freshness, owner isolation and no hidden rendering. Private preview only.


## Default candle density trial

Owner requested readable initial candles across all six intervals. Use shared-renderer plot-width-based defaults: 9px for 1m, 10px for 5m/15m, 11px for 1h/4h and 12px for daily, with three candle slots of right space. Wider panes show more history at the same density. Existing saved views take priority. Initial manual price scaling uses the matching visible slice. Keep sparse histories at the same spacing instead of stretching them. Private trial; owner visual tuning remains pending.
