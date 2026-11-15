# Journal on the shared chart

## Scope

The chart toolbar has a Journal button beside the existing chart controls. It opens a side drawer on desktop and a bottom sheet on mobile. Charts, Journal Workspace, Trading Workspace and the Scanner chart drawer use the same shared chart and panel. The shared chart resolves the active Journal account through its existing preferences request. It loads the full Journal panel on demand. The chart stays mounted while the panel opens or closes.

- **Log** starts a new execution or adds to or reduces an open position. A candle selection prefills the execution date and time. The trader checks the broker's actual time, price, and shares and uses the existing Journal preview and confirmation.
- **Fills** shows the session's saved executions and can mark them on the chart. Tapping a marker opens its execution or group of executions, with the canonical trade editor and trade review available.
- **Notes** pins an account-scoped chart note. A note can stand alone or be attached to a trade when first saved or later.
- **Plan** saves a snapshot of a Long or Short Position drawing with the trade and shows it alongside original execution prices for the selected session. The drawing's chart-price basis date is saved with the snapshot.
- **Review** moves through the session's trades, brings their ticker and candle range into view, and uses the existing review and day-review records. Attached notes and plans appear in the trade review.

The feature reuses Journal's execution ledger, review services, and account authorization. It requests Journal data separately from market data. The read endpoint bounds the session results and supports loading another page. Execution records retain exact prices and timestamps. Chart markers locate the execution's candle even when the displayed chart and the broker fill use different split bases. Chart notes and plan snapshots use an additive Journal migration.

## Cross-surface persistence

Drawings use the shared user-and-ticker browser store. An autosaved drawing or one saved through Save drawings is available on the same ticker in every shared chart. The chart settings for autosave and default toolbar visibility use the existing account preferences. Drawing files and display preferences are local to the browser. Execution facts, chart notes, saved position plans and reviews are persisted with the active Journal account.

Fill and note visibility and the last selected Eastern session use one account-specific browser setting across all shared charts and tabs. After closing Journal, enabled marks use a lightweight account/symbol/session query. The full execution and review lists load when the panel opens. The chart draws markers only where it has candles for the selected dates and session settings. Switching visibility leaves the candle stream subscribed. Both layers off means no background Journal request.

The dedicated Candle Review, saved-data and Trade Analyzer historical replay charts have independent renderers and data contracts. The cross-surface coverage is for the shared market chart, including its compact and drawer layouts.

## Verification and release

Sixty focused tests, TypeScript, and targeted ESLint passed. Coverage checks Eastern session dates across both clock changes, selected-account isolation, note retry and revision handling, accepted and superseded executions, exact execution values, marker placement, the shared Journal Workspace chart, drawing state, and preferences. Browser checks use isolated Journal records and recorded chart fixtures with background workers off.

On desktop, the browser saved an execution draft from a candle, recorded a partial exit against the selected open trade, pinned and attached a note, saved a drawing plan, navigated between two trades and persisted the day review. A fresh browser reopened the linked records and used a painted fill marker to open the trade editor. Journal Workspace opened the same panel with the selected account. Mobile portrait and landscape preserved candle visibility, supported touch capture and reopened the saved records. Opening and moving Journal between charts in a four-chart view sent no additional market-data requests. Those are isolated-browser observations, without a live-market load benchmark.

The cross-surface QA used an actual saved horizontal drawing and the same isolated execution, note and plan in the main chart, scanner drawer, Trading Workspace compact chart, and Journal Workspace. Browser coverage also passed manual drawing saves, portrait and landscape scanner focus, switched tabs, disabled chart overlays, review and plot marker interaction, a partial reduction, adding shares, and both directions of position drawings. A mismatched Journal account was denied. No live-market traffic benchmark was run.

The drawing branch contains this local implementation. The private review preview remains stopped. Production and Railway staging were not changed. Integrate the Journal migration after the current deployment manifest and confirm the desktop and mobile presentation in owner review before release.

## Opening the full chart and Trade Analyzer

The shared Analyzer chart is used inline in Session Tracker, in Journal Workspace and Trade Details, in Analytics trade details, and in the candle-pattern occurrence drawer. Its Open in Charts action opens the same market chart used by the Charts page in a responsive drawer. The originating trade, timeframe, and scroll position stay in place when the drawer closes. The offline saved Session Tracker keeps its saved chart view.

The full chart starts with the selected trade's execution range and surrounding market history. It reuses the chart's drawing tools, preferences, timeframe controls, market candle adjustment basis, and price history. Execution marks use recorded times and display the Analyzer's exact saved values separately from the current chart's price basis. Available pattern and rule marks use the saved analysis dates. Clicking a mark opens the analysis pane. Fit trade returns to the execution range. Paging fetches market history, without running or charging for a new analysis.

Selecting a fill associated with a completed trade in the chart's Journal opens the existing Trade Analyzer drawer. The request follows the current Journal account and the selected trade. Closing it restores the Journal fill. Requesting new analysis, when eligible, remains an explicit action. Candle Review stays parked.

Browser QA used a completed isolated Journal trade and a saved result generated by the Analyzer calculation. Both directions passed on the same page, including a painted fill marker opening its exact evidence, foreground and return focus, inline Session Tracker, Journal Workspace, Execution Analytics, the candle-pattern occurrence replay, and the chart tools on mobile portrait and landscape. The candle-pattern page emitted a development hydration warning before opening its replay. The full-chart workflow passed on that page. No live-provider or production operations were part of this check.

TypeScript and targeted ESLint passed. Twenty-seven focused tests passed. The existing Analyzer theme contract still fails against the unchanged baseline chart theme declaration.

### Independent retest

Reopened the exact saved trade from a clicked, painted Journal fill marker. The selected fill survived closing Analyzer, but the launch button lost keyboard focus. The Journal now restores focus to the initiating Open Trade Analyzer or Edit trade button after the secondary drawer closes. The browser confirmed Escape, both launch buttons, and a mismatched account rejection against the Analyzer endpoint.

Reverified both directions, inline Session Tracker, Journal Workspace, Analytics trade details, the candle-pattern occurrence drawer, and mobile portrait and landscape. A controlled history fixture exercised older and later pages, confirmed Fit trade restored the actual fill markers, and recorded zero live market stream or new Analyzer requests while browsing history. No deployment or owner-facing preview was started.

Focused checks passed 81 of 82 tests. The only failure was the unchanged Analyzer theme contract. TypeScript and targeted ESLint passed.

### Daily timeframe and recovery retest

A fresh browser pass found that daily fill and note markers used the exact event timestamp as the candle lookup key. On 1D, a visible daily candle could show with no execution markers and Fit trade could report missing coverage. Daily markers now use the actual returned candle for the event's Eastern market date. Daily focusing accepts any provider timestamp inside the intended trading date. Exact recorded timestamps and prices remain available in the marker details. Tests cover a missing weekend candle and both Eastern clock changes.

The browser passed simulated candle failure and Retry, 1m to 5m to 1D and back, painting a drawing saved from Analyzer on the regular Charts page, both directions of the handoff, account isolation, page and keyboard focus restoration, and history paging. Session Tracker, Journal Workspace, Analytics trade details, candle-pattern replay, mobile portrait and landscape were rerun.

TypeScript and focused lint passed. The focused tests passed 83 of 84, with the pre-existing Analyzer theme assertion still the only failure. No preview or deployment was opened for the owner.

### Grouped markers and pending-history retest

In a fresh browser, clicking the daily buy and sell groups in the full chart exposed all four exact executions, including repeat selection with the Analysis pane open. A grouped daily sell marker on Charts opened the selected fill's Analyzer and restored the exact fill and keyboard focus. Switching from a pending intraday request to 1D kept the daily view selected. All six timeframes showed the fill markers.

The earlier browser checks also passed again for desktop and mobile return paths, recovery from unavailable candles, drawing persistence, Analytics trade details and candle-pattern replay. The focused suite returned 83 of 84 tests, with the same pre-existing Analyzer theme failure. No application source changed.

## Weekly, monthly and yearly trade context

The full chart opened from Trade Analyzer supports 1W, 1M and 1Y. It maps fills to the matching exchange-calendar candles while keeping exact timestamps, prices and quantities in the details. The daily history request for an older trade includes the end of the trade's final calendar year, where available, so the yearly view displays the full period. Trade Analyzer's focused review remains on its existing intervals.

Private loopback QA used saved Analyzer fixtures with synthetic executions spanning Oct 30 to Nov 2 and Dec 31 to Jan 2. Both sides remained clickable and Fit trade brought both periods back into view after panning. The 1D, 1W and 1M sequence reused one daily request. The yearly checks passed on desktop and in a mobile portrait viewport. No deployment.
