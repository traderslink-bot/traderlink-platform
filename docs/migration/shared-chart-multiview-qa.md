# Shared chart multiview QA — November 10, 2026

Owner approved implementation and a private preview after QA. No production deployment authorized. One consolidated verification inventory; record actual outcomes below. Synthetic scanner fixtures remain clearly isolated; charts use the previously authorized owner-only read-only gateway connection, subject to preview qualification. Do not claim live ticks tested from a synthetic response.

## Inventory

- Model: one ticker/1–4 timeframes; 2 tickers/2+1 and 2+2; 3 and 4 distinct tickers; independent timeframe selection; duplicate ticker/timeframe and fifth-chart prevention; stable panel identities; close-one versus close-ticker behavior.
- Main page: menu count selection, add/edit/remove ticker, timeframe selections, Cancel unchanged, Apply coherent, selected-chart symbol replacement, switching to existing ticker, save/reload/navigation persistence.
- Scanner drawer: existing chart/plus behavior, add same ticker selects existing, capacity includes timeframe siblings, normal ticker open/reset behavior, header ticker close, one-details-tab per ticker, selected-panel/details association, closing last panel/group, scanner tables/scroll unaffected.
- Rendering: desktop single/2/3/4 grids, mixed tall/split sides, autoSize/canvas fit without clipping, compact control wrapping, indicator settings/lines preserved, independent zoom/history loading, no horizontal overflow; phone ticker selection and vertical chart stack.
- Data: one shared SSE per ticker/daily mode, shared simultaneous history fetch, aborting one subscriber leaves others working, cleanup after last chart, fresh prices and independent timeframe aggregation, clear data/load/error/retry states.
- Persistence/access: main versus scanner separation, account ownership, request mutation/origin gate, body size/strict schema, stale revision refusal, no localStorage fallback, reload failure/cancel behavior, no production writes.
- Accessibility: labelled controls, keyboard operation/focus return, selected states, dialog scrolling, mobile targets, no unexpected frame removal.
- Verification: focused meaningful unit/route/transport tests, targeted types/lint, React checklist, dashboard template guard, real private browser workflows including desktop and phone, actual market candle delivery. Broader unrelated mixed-workspace errors remain recorded separately rather than absorbed.

## Consolidated findings

Implementation checkpoint: targeted types reported three pre-existing errors in the mixed checkout's unrelated premarket-pullback implementation/contracts. No multiview source diagnostics in that check. Final immutable feature/preview source must be checked without absorbing those concurrent changes. QA not complete; browser and route checks pending.

Focused batch: multiview model/store, route access and shared transport tests pass (9 new tests); existing chart preference coverage also passes. ESLint reports no product errors; two unused mock argument warnings corrected. Dashboard-template guard was run and reports four existing shell/navigation/layout assertions outside the edited feature files; no dashboard page/frame/navigation changes are part of this feature. Preserve those failures rather than alter the global shell during chart work. Final source-projected type check and browser QA pending.

## First full browser discovery

Main page: 12 workflow checks passed (real OMH/SMX historical bars, four timeframes, close sibling, Cancel, mixed 2+1, independent timeframe, 2+2, capacity/duplicate prevention, reload persistence, canvas fit, phone grouping, shared SSE). Actual Alpaca responses contained 3,546 OMH and 3,021 SMX bars with current adjustment basis. No uncaught browser errors. Scanner discovery blocked because the legacy private fixture overlay returned JSON for the newly streaming scanner request; three dependent drawer cases were blocked and the exact own discovery process stopped. This is an isolated fixture-adapter issue, not a production scanner change.

Consolidated corrections: update only preview fixture adapter to emit the existing scanner event contract; improve dark ticker label contrast and main chart available-height measurement; distinguish saved versus currently open ticker when enforcing scanner four-panel capacity; add abort/remount transport regression. One coordinated preview update after the correction batch, then full applicable browser retest.

Owner styling correction: use the existing orange warning.main ticker color for the top-left ticker label in dark chart mode. Verify this with the other corrected visual cases before owner review.

## Correction-batch verification

Source checkpoint 7186aaee4062a81405c857dbf7fb92c0e404b62b. Four focused suites / 19 tests pass, including abort/remount, owner/workspace isolation, revision conflicts and shared transport cleanup. Projected feature source TypeScript: seven roots, 1,931 files, zero diagnostics. Targeted lint: zero errors or warnings. React review covered stable keys, effect cleanup, independent controls, serialized persistence and shared request lifetimes; existing Material components retained.

Full browser correction retest: 17/17 pass, zero uncaught errors. Actual Alpaca responses returned OMH 3,548, SMX 3,029 and NWGL 5,752 bars. Verified main one/four-timeframe layouts, mixed 2+1/2+2, duplicate/capacity prevention, Cancel, reload, viewport/canvas fit, phone stacking, maximum one simultaneous SSE per identical URL, scanner chart actions, sibling timeframe close and one detail tab per ticker. Inspected desktop and scanner screenshots: orange dark ticker labels and unclipped canvases. Private static scanner adapter now supplies the stream subscription contract; synthetic table/news/levels remain isolated, while candles use the authorized read-only connection. Preview dev server needed one restart after a stalled hot compile; no hosted/gateway change.

Supplementary QA discovered test-harness issues: the unhandled existing cookie-choice dialog intercepted Apply and made an unscoped dialog assertion fail; resolve consent first and scope the assertion to Multiview. The orange theme token resolves to rgb(255,199,107), so the first orange assertion's arbitrary blue-channel threshold was corrected. The VPS ordinary resolver does not supply this private Tailscale hostname's MagicDNS answer; HTTPS with the existing Tailscale address resolved explicitly returns 200 with valid TLS. No app, bridge, DNS or network setting changed for these harness corrections.

Supplementary corrected-harness batch: 8/8 pass — Escape/focus return, three/four distinct ticker geometry, existing-symbol selection, exact orange theme, real private Tailscale HTTPS/browser and phone width/selection, zero uncaught errors. Total browser checks 25 pass. Tailscale browser used the existing private interface address as a resolver override only; certificate validation stayed enabled. Preview ready for owner review, not production approval. Development startup/build compilation is slower than a compiled release; no production build or deployment is represented by this preview.

## Mobile Tabs/Stack choice — November 10

Owner approved an account-saved mobile layout choice. Existing layouts default to Tabs; Stack renders all ticker/timeframe groups vertically, with four total panels. Model parsing accepts the optional bounded value while preserving existing version-1 layouts. Ticker reconciliation, chart removal, main default state and scanner opening preserve the preference.

Verification: four focused suites / 20 tests pass, including backward-compatible layout reads and real isolated store persistence of Stack. Projected source TypeScript zero diagnostics; targeted lint clean. Ten mobile browser workflow checks pass: default Tabs, Cancel, mixed four-panel Stack, no overlap/horizontal overflow, last chart reachable, layout reload, switch back to ticker tabs without losing configuration, desktop grid preserved, scanner Stack and independent scanner/main settings, zero uncaught errors. Browser layout API responses/writes were intercepted within the QA context to avoid changing the owner's current preview settings; real persistence is covered by isolated store/API tests. An initial navigation hit the dev server's stalled hot compile; its own preview service was restarted. A later initial request raced startup. A cookie banner after reload intercepted the test harness Apply click; the harness now handles consent before opening settings. No production service changed.

Four-panel performance probe used OMH 1m/5m plus SMX/NWGL 1m, with actual historical data and live events. Exactly three shared stream connections, one per ticker; 94 events including 20 price updates in the observation. JavaScript heap 116 MiB, median scroll frame 16.6ms / 95th percentile 17.2ms, approximately 0.66s browser task time during the observation. All three symbols returned positive real history; zero page errors. This is Chromium at a phone-sized viewport on the VPS, not a physical-device benchmark. Inspected loaded phone screenshot: legible stacked charts, complete price/volume sections, vertical scroll. Owner phone review remains the visual/performance acceptance gate.

Help draft updated for Mobile layout. No page shell or public Help registry change, no production deploy.

## Independent landscape layouts and short-height correction

Owner approved independent portrait/landscape preferences. New optional landscapeLayout validates Tabs/Stack/Grid, reads old version-1 layouts, and survives store persistence and ticker edits. Grid flattens the existing stable chart groups into two columns on compact landscape screens, without copying renderers or restarting provider connections for layout changes. The main workspace no longer imposes a 360px height below a short viewport. Landscape chart rows follow measured available chart height, with vertical scroll for additional rows. ResizeObserver cleanup preserves the existing autoSize path.

Four focused suites / 21 tests pass; projected TypeScript seven roots / 1,931 files / zero diagnostics; targeted lint clean. Ten browser cases pass: portrait single-column Stack, landscape preference saved from portrait, mixed four-panel two-column/two-row Grid, viewport/container/canvas fit and lower-row reachability, full-height landscape Stack, ticker Tabs, repeated portrait/landscape rotation including 932x430 wider phones, reload, unchanged desktop grid and scanner drawer Grid. Tests use isolated browser layout responses/writes to preserve owner settings; price/candle requests remain real. Existing stored layouts and real isolated store persistence are tested separately. No uncaught errors. Preview-only server restarted once before QA to avoid accumulated development hot-compile memory pressure. No hosted/gateway change.

Phone layout visual review and production release remain owner-controlled. Help draft updated for the two settings.

## Compact main-chart mobile controls and Focus trial

Owner approved trial implemented only for the private main chart workspace. Normal mobile dashboard header and workspace toolbar each use 44px; each shared chart's compact toolbar is one 44px row. Search moves into a dialog. Current timeframe opens direct selection; options exposes Timeframe, Indicators, Appearance, existing Multiview and close actions. Crosshair details overlay rather than permanently reserving an empty line in compact mode. Focus uses the same mounted shared charts with a viewport-filling workspace and small exit/navigation controls; Escape restores normal view. Existing dashboard navigation is reused, with no shell source copy/change. Chart-scoped header styles disappear on other pages and desktop.

Discovery corrections: inherited Stack sibling margin displaced the fixed chart workspace by 20px; compact workspace explicitly clears it. Opening Multiview now closes its parent options menu while retaining the child dialog. Focus controls moved to lower right because the development preview badge intercepted lower-left taps. Initial header-size assertion ran before scoped styles settled; browser test now waits for actual computed header height.

Final checks: four suites / 21 tests pass; projected TypeScript seven roots / 1,933 files / zero diagnostics; targeted lint clean. Eleven real browser workflows pass: compact row/header dimensions, search, direct timeframe and duplicate-frame disabling, Indicator options, Multiview open/cancel, Focus enter/exit/full viewport, existing navigation drawer from Focus, landscape grid/canvas fit, Escape/layout preservation, desktop restoration and other-page/scanner control restoration. Zero uncaught errors. Layout persistence writes/responses intercepted only in QA browser to preserve owner settings; chart candles remain actual provider data. Inspected normal/focus landscape screenshots: readable complete price/volume sections with visibly increased candle height. Private preview only; physical phone/owner visual acceptance remains pending. Help draft aligned.

## Two-row mobile main-chart controls

Owner approved combining the dashboard and workspace bars, and merging ticker tabs into the first selected chart toolbar. Compact page now starts at viewport top with one 44px navigation/search/layout/focus/options row. Existing dashboard header is visually hidden only while this main chart component is compact; its navigation, notifications, account and Help handlers remain reused through page controls. Portalled menus/drawers remain available. In Tabs mode, the first chart receives a horizontally scrollable ticker identity strip; later timeframe charts retain their own label. Stack/Grid keep independent chart identity. No shared shell or scanner source modification.

Verification: targeted TypeScript seven roots / 1,933 files / zero diagnostics, targeted lint clean, four regression suites / 21 tests pass. Sixteen browser workflows pass: exactly two rows above the first chart, integrated ticker switching, dashboard navigation, Notifications, Account, Help relay, search, direct timeframe/duplicate prevention, Indicators and chart settings menu, Multiview, Focus enter/exit/navigation, landscape grid/canvas fit, Escape/layout preservation, desktop restoration and other-page/scanner restoration. Zero uncaught errors. Isolated browser layout responses/writes preserve the owner's settings; candle data remains real. Loaded landscape screenshot inspected: complete price/volume panels and a single page bar above chart controls. Additional portrait/narrow-width visual check passes at 320px, bringing browser checks to seventeen. Screenshot review caught a theme specificity override on the selected ticker; the selected tab and underline now explicitly use the orange ticker theme, with a focused rendered-color retest. Existing help draft updated. No production push/deploy. Physical phone owner review pending.

## Mobile menu icon refinement

Owner approved replacing the top page ellipsis with PersonRounded (the normal dashboard account icon) and the per-chart ellipsis with the existing SettingsOutlined gear. Menus, labels, layout and 44px buttons unchanged. Targeted lint passes; focused real mobile browser check confirms the two rendered SVG icons, 44x44 dimensions, Account/Notifications/Help menu and Indicators/Appearance options. No owner preference writes, no broad regression rerun for this icon-only slice, no production deployment.

## Per-open-chart zoom/pan memory

Owner approved browser persistence until explicit chart close. New bounded chart-view memory stores only coordinates, anchor/span, price-scale state and adjustment-date metadata, scoped to authenticated preference owner/workspace/panel/ticker/timeframe/session. At most 24 small snapshots per workspace; no candle arrays, hidden canvases, streams or background timers are stored. Gesture writes debounce to 250ms; unmount/pagehide flushes current coordinates. Normal browser navigation/reload persists through localStorage; unavailable storage falls back to document memory. Layout close/replace prunes before unmount, and late cleanup cannot resurrect closed snapshots. Scanner header close clears drawer views; individual header removals now prune their corresponding layout state.

Restoration uses precise logical coordinates when the axis is unchanged, a timestamp/fraction anchor when history changes, or preserved live-follow width/offset after new bars. Manual price scaling is restored only when adjustment date, auto-scale preference and log mode remain compatible; older basis candle memory is not reused. Missing earlier view history uses the existing abortable bounded calculation-history loader. Current history pagination cursor is initialized even when a coordinate-only snapshot is present, preserving later historical pan requests. Preferences owner is exposed through state rather than reading a ref in render.

Final checks: six focused suites / 36 tests pass (new storage/range/isolation/close tests plus existing layout, route, shared transport, preferences and calculation history); projected TypeScript seven roots / 1,933 files / zero diagnostics; targeted lint clean. Eight real-data browser cases pass: actual wheel zoom, switch away/back and restored zoom, independent timeframe, actual price-axis drag/manual-scale restoration, leaving/returning to charts, full reload, closing one timeframe while retaining its sibling, closing a ticker and deleting remaining snapshots. Width/price checks read snapshots produced by the actual chart API after each return, so a reset-to-default would fail. Hidden tabs contain only the selected ticker's panels. Another sixteen full mobile-toolbar/navigation/focus/desktop/scanner regression workflows pass; zero uncaught errors. Browser layout requests are intercepted with the real isolated preview owner key to avoid modifying owner layout settings. Local browser storage is isolated to the QA context.

First wheel test expected more than a 10% change from one wheel event; Lightweight Charts caps a wheel step, so the harness now sends four real events before checking restoration. No production changes or provider configuration changes. Help draft updated. Private preview ready for owner phone review.


## Default candle density QA — 2026-11-10

Focused density and view-memory suites: 2 files / 8 tests pass. Seven-root projected typecheck: 1,934 files / zero diagnostics. Touched-file ESLint passes. Real Alpaca chart browser checks pass for all six intervals at 390px and 1440px viewports (12 cases). Fresh phone logical spans: 36.7 / 33 / 33 / 30 / 30 / 27.5 slots; desktop: 118.7 / 106.8 / 106.8 / 97.1 / 97.1 / 89 slots. Inspected phone and desktop 1m screenshots: candle bodies/wicks legible. No owner layout writes. New defaults apply only without a saved view. Owner visual tuning pending; private preview only.

Saved-view browser regression: all 8 cases pass (wheel zoom, ticker tabs, independent timeframe, manual price axis, page return, reload and explicit-close cleanup).


Restored-preview trial: mobile ticker tabs now sit in a dedicated row above charts. Existing Multiview choices, candle density and scanner controls unchanged. Scoped lint and mobile browser row-placement check passed, plus eight zoom, navigation, reload and close regression cases. Test layout writes intercepted.


Restored preview trial: up to four ticker views plus one independent Multi-chart view, with navigation above the charts. Kept restored candle renderer byte-for-byte. Lint and projected types passed; 320px real-data browser verified two ticker views with four timeframes each, active-view-only rendering, mixed ticker/timeframe combinations, reload, and landscape Grid. Browser writes intercepted; private preview only.


Search/add/single-chart control trial: restored the Layout icon on the initial plain chart, moved plus directly after Search, and made plus retain the initial ticker when adding a second. Lint, projected types and 320px browser QA passed for initial four-timeframe expansion, Search replacement, adjacent plus adding an independent tab, Multi-chart independence, reload, and desktop placement. Candle renderer unchanged; browser layout writes intercepted.


Single-ticker row visibility: lint and 320px browser QA passed for initial plain chart, expanded single-ticker view, adding a second ticker, retaining the row with saved Multi-chart, hiding it after Multi-chart close, and reload. Plus and Layout stay available throughout. Browser layout writes intercepted.


Removed main-chart Tabs/Scroll selection. Selected views always display all configured charts, including views previously saved with Tabs. Landscape offers 1 column or 2 columns per view. Lint and projected types passed. 320px real-data browser QA passed for four ticker buttons, independent four-chart ticker views, mixed Multi-chart, legacy Tabs visibility, 1/2 landscape columns, reload persistence, portrait rotation and desktop four-chart cap. Browser writes intercepted; private preview only. Scanner behavior and candle renderer unchanged.


Renamed the main-chart control and dialog to Multiview and the mixed view to Multi-ticker. Scoped lint and 320px browser QA passed: all five labels fit, configured charts and independent views survive reload, landscape columns still work. Scanner label unchanged; private preview only.


Removed chart-count shortcuts and count from main-chart Multiview only. The existing scanner controls remain. Lint and 320px browser QA passed for adding timeframes to the cap, removing a ticker and adding a replacement timeframe in Multi-ticker, independent saved views, and landscape columns.


Removed the three-dot view menu. A separate accessible close button sits inside the active tab visual slot, with no nested buttons. Multiview provides a fallback close for a hidden single-ticker row and conditional earlier-view navigation. Lint, projected types and 320px browser QA passed for all close-button positions, independent ticker/Multi-ticker closure, return to plain chart, and opening and closing older saved views. No owner writes; private preview only.


Added Open Multi-ticker in Multiview for a single ticker and removed the Multi-ticker close button. Lint, projected types and 320px browser QA passed for hidden initial row, creation with selected timeframe, preservation of the original ticker, independent edits and reload, ticker close availability, and creating Multi-ticker after adding a second ticker. Browser writes intercepted; private preview only.


Open Multi-ticker now starts an unsaved setup with the selected chart and a blank second ticker. Apply opens the view; Cancel makes no changes. Lint, projected types and mobile browser QA passed for the initial fields, required symbol, Cancel, Apply, replacing a symbol, separate ticker view, reload and the existing second-ticker entry path. Browser writes intercepted; private preview only.


Distinguished saved Multi-ticker from opening setup. Both entry points use an unsaved draft, Apply confirms it, and Cancel leaves no saved view. Legacy one-chart auto-created entries load as normal ticker views without dropping chart settings. Saved Multi-ticker stays visible with one ticker and remains selectable in Multiview. Lint, projected types, 320px browser flows and actual preview legacy-read checks passed. Browser writes intercepted.


Main charts now use automatic two-column landscape for multiple charts, one full-width chart otherwise, and one column in portrait. Removed the main chart column picker; scanner remains unchanged. Lint, projected types and mobile browser rotation/reload checks passed, including a previously saved one-column preference. Private preview only.


Main chart toolbar Multiview opens on the active view and edits all open ticker views and Multi-ticker in one dialog. Apply saves the drafts together with independent four-chart limits. Scoped lint, projected types and 320px browser QA passed for chart tab navigation, atomic save, validation, cancel, persistence and setup from one ticker. Browser preference writes intercepted.


Restored the close button for the active Multi-ticker tab. Mobile browser QA at 320px confirmed the button fits, closing returns to the previous ticker, and reopening from Multiview preserves the saved layout. Scoped lint passed. Browser writes intercepted.


Mobile landscape places chart tabs inside the toolbar with horizontal swipe overflow. Scoped lint and browser QA passed for portrait/landscape rotation, narrow overflow, Multi-ticker setup and close, and preserved selection. Browser writes intercepted.


Candle geometry and Multiview QA reproduced a desktop 2+1+1 layout with 62-pixel price panes for the two charts sharing a ticker. Mixed four-chart grids now give those charts equal space, measuring 199 pixels per price pane in the same browser viewport. Verified 50 browser geometry cases using preview Alpaca candles, default price autoscale and the volume pane. Coverage includes all six timeframes, desktop single and mixed grids, mobile portrait and landscape, and scanner-drawer views. Desktop and mobile Multiview interaction checks passed, including single-save edits, validation, reload, tab limits, rotation, closing and reopening. Scoped lint, projected type check and 43 focused tests passed. Browser preference writes intercepted. An initial scanner attempt hit an unresponsive preview and passed after the private preview restart.


Grouped indicator settings by type without changing the saved preference contract. EMA/SMA lines keep independent settings. Added documented TraderLink presets and standard defaults for all six studies. Mobile browser QA confirmed existing EMA rows and styles survive, independent colors appear on the chart canvas, new lines and preset changes persist, and all six add defaults pass validation. Scoped lint, projected types and 116 focused indicator tests passed. Browser writes intercepted.


Added named personal indicator presets to account chart preferences. Mobile browser QA verified saving custom EMA lengths and colors, duplicate-name feedback, switching to a TraderLink preset, reload, restoring the personal preset and deleting it while retaining the active indicator. Browser writes intercepted. Scoped lint, projected types and 14 preference/store/route tests passed, including owner isolation.


Desktop chart controls now use the shared dashboard header, and the private chart page uses the scanner page inset. Browser QA verified header controls, active Multiview section, inline tabs, Multi-ticker close, matching 8px padding, and mobile rotation. Projected types passed. The dashboard template guard had the same four existing failures when rerun against baseline source. Scoped lint reported only the two existing shell hook warnings.


Removed the duplicate per-chart Multiview link from desktop charts. Scoped lint and browser QA passed for the top-nav editor, four-chart grid, individual close buttons and mobile rotation.


Removed the mobile per-chart Multiview item and moved individual chart close actions to the right edge of the main chart toolbars. Scoped lint, projected types, and browser QA passed for the mobile gear menu, top-nav Multiview, mobile and desktop close placement, close behavior, and reduced toolbar heights.


Final private-preview QA on the desktop, mobile portrait and mobile landscape layouts passed. Browser checks opened and used top-nav Multiview, verified no duplicate mobile chart-gear entry, measured and clicked the right-aligned chart close button, and confirmed that saving a named EMA setup, loading a TraderLink preset, reloading and restoring the personal preset preserve the original line settings. Browser preference writes intercepted. The 27 focused preference, storage, route and layout tests passed.


Removed the four-ticker tab cap while retaining the existing saved-workspace bounds and independent four-chart cap per view. Settings open the shared Multiview editor on the selected view. Browser QA passed for adding fifth and sixth ticker tabs, portrait overflow, desktop and compact chart Settings entry, active-ticker inclusion in Multi-ticker, and reload. Focused lint, projected types and 14 tests passed. Browser writes intercepted.


Moved the chart-level Multiview entry to a separate grid icon next to Settings. Browser QA passed on desktop, portrait, and landscape for opening the active-view editor, Settings contents, placement before the close button, and persisted layouts. Scoped lint passed.


Separated the new-chart timeframe preference from live chart interval selection. Browser QA passed for preserving open intervals, using the new default in Search, plus and new Multi-ticker rows, changing an individual interval independently and showing one TradingView credit outside the charts. Scoped lint and projected types passed.


Grid QA checked TradingView's native scale-mark behavior and fixed blank 4h ticks, suppressed intraday boundary labels, and duplicate dates at UTC midnight. The first intraday date stays pinned. Browser canvas QA passed 45 cases across all six intervals, desktop full and compact, mobile portrait and landscape, scanner drawer, zoom/pan and grid visibility. Scoped lint, projected types and 24 focused tests passed.
