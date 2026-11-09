# Top Gainers ticker workspace — design and progress

Owner requested a desktop chart drawer that spans the screen, retains the current chart size/height, and uses the additional width for stock details, recent PR/SEC, and Generate Levels. This is an exploratory owner-review slice, not approval for automatic generation or release. Top Gainers remains the base-card scope; other scanner chart drawers retain their old dimensions.

## Implemented composition

- Top Gainers chart actions set an explicit details flag. Its drawer uses the full viewport width. On large desktops the chart keeps its previous 1180px outer track; the right panel takes the remainder. Medium desktops retain a roughly similar chart width with a minimum 320px detail panel. Chart and details have independent overflow; mobile stacks the detail area below the chart.
- Right panel presents available selected-row facts, recent scanner PR/SEC headlines and a separate Support & resistance area. Headlines expand their available summary/article inside the same panel, with loading/unavailable states. No competing article drawer is opened from this panel.
- Generate Levels calls the existing authenticated POST /api/levels with only the selected symbol. No new calculation engine, provider integration, auto-activation or scheduler. Concurrent clicks are coalesced by the pending operation; unmount aborts requests. New results must match the selected symbol. Existing map stays visible after a failed refresh.
- Rendering is based on StockLevelsMap/LiveWatchlistLevelMap and uses canonical Watchlist level price, signed-distance, nearest-row and provenance helpers. Displays support/resistance, strength/source when present, reference price/as-of time, generation time and optional Full ladder body. Existing endpoint handles quota, account ownership and saved-map behavior.
- Inspected stock-levels generator plan/progress, contracts, runtime relay, service, API, Levels page, shared Potential Path renderer and Help guide before integration. The actual generator runtime is not configured in the isolated preview.

## Isolated preview

The current production-source runtime uses authenticated development-only API branches behind the existing static-fixture flag. Mock levels use the actual output structure, including nearest/next-strong levels, support/resistance arrays and full ladder. Every displayed result includes a prominent synthetic-example label; values are visual fixtures, never calculations or provider evidence. Synthetic article details are also clearly worded as examples. Fixture data and API overlays live only in the generated preview artifact; canonical API/service files are unchanged. No production data, secrets, provider calls, notifications, migrations or hosted actions.

## Verification

- 24 client tests pass, including on-demand request identity, synthetic-result labeling and retaining the prior map after provider failure; exact-file lint passes. No full build or repository-wide TypeScript pass claimed. The assigned checkout still has an older shared chart signature than the preserved production runtime; browser verification uses the current production chart component.
- Real desktop Tailscale browser: 1536px full drawer width; after preserving the chart track, detail area measures 355px. Generate Levels renders support/resistance and the synthetic notice; a PR expands inline. Initial successful generation/close check recorded no page exceptions.
- Mobile drawer measures 390px content/scroll width at a 390px viewport. Escape closes the workspace and restores focus to its chart trigger. Momentum chart remains 1180px and has no new details panel.
- One responsive browser probe initially matched three responsive MUI drawers; scoped it to the active ticker panel for the successful geometry check. Rapid close/switch before the external TradingView widget finished loading produced two third-party null-querySelector exceptions. The shared chart implementation was not changed in this slice; do not claim this rapid-widget-teardown case clean or broaden the scope silently.
- Help guide gets a Generate from Top Gainers section describing the new workflow. The existing guide already contained unrelated working-tree differences: its checkpoint includes only the new section against the preservation baseline, preserving those earlier edits in the working tree.

Owner visual/product review remains pending. Automatic levels on running stocks, crossing the highest resistance, saved preferences, broader scanner rollout and chart replacement are deferred.

## Recent News — compact five-market-day context

Owner requested Recent News covering the last five market days, date above headline and tighter spacing. Inspection confirmed listScannerRecentPressReleases already uses recentTradingDates (current Eastern market day plus four previous market dates, excluding weekends and the recorded exchange holidays), returns saved-date-matching stored news newest first and forwards every article into scanner rows. No new provider fetch or lookback change was required; this is saved TraderLink news, not a fresh external-news crawl.

Renamed panel to Recent News, moved Eastern date/type above headline with 2px separation, reduced list gap to 6px and headline line-height to 1.3, and removed the Button's inherited minimum height. Empty copy states the five-market-day scope. Updated isolated ALFA fixtures with six sample items spanning Nov 2–6, newest first, and corresponding mock article details. Exact-file lint passes; actual desktop browser confirms six items, date before the first headline and the oldest market date visible. Existing Help description remains accurate; no guide content change needed for this compact-copy adjustment. Owner review pending, no release.

## Technicals / Recent News tabs

Owner requested two tabs in the details panel. Added Technicals (default: stock facts and levels generation) and Recent News (compact five-market-day feed), keeping ticker/company above the tabs. Accessible tab/tabpanel links use per-instance IDs. Both panels remain mounted but hidden when inactive, preserving generated levels and expanded articles; switching tabs neither fetches nor remounts the chart. Updated the Help section using only this feature’s narrow text delta. Targeted client test and lint pass. Actual desktop Tailscale browser shows six news items with the generation control hidden in News, then the same generated map on return to Technicals with only one levels request total. No deployment.

## Screeners tab — owner trial

Added a third detail tab, Screeners, with a compact screener selector: Top Gainers, Momentum, Rapid Drops / Top Losers, and High Drops. One selected card is displayed at a time using its existing table/card renderer and the root scanner read model; no second scanner fetch loop is introduced. Primary cards follow the dashboard's chosen Table/Cards/Two rows display mode. Selecting a chart from these cards changes the chart ticker while keeping the full-width workspace and Screeners selection open. The selected screener also survives ticker changes. Primary-row newspaper links switch to that ticker's Recent News panel. Market Events remains separate as a news board, not a screener.

The isolated preview now includes eight synthetic decline and high-drop rows so all selector choices can be reviewed. No provider or production changes. Help guide updated with the new selector workflow, preserving unrelated guide edits. Exact-file lint and 25 focused client tests pass, including controlled section retention across ticker changes. Real Tailscale desktop browser verified Top Gainers (20 rows), Momentum (20), Rapid Drops (8), and High Drops (8); selecting BRVO retained Screeners. Mobile details width and scroll width both measure 390px. Owner visual approval remains pending; local checkpoint only.

## Multi-select screener grid — owner trial

Replaced the single selector with labeled checkboxes, allowing any combination of the four screener cards. Top Gainers is initially checked; unchecking all shows a short selection prompt. Selected cards use a two-column desktop grid, filling each row left-to-right, and a single column on mobile. Selection remains in root state while changing tickers or tabs. Help guide updated to match.

Exact-file lint passed. Actual Tailscale browser verified all four selected simultaneously (56 chart buttons), two heading columns at x=1218/1575.5 with matching first-row y=253.8 and second-row y=763.8, all four selections retained after switching ALFA to BRVO, and the all-unchecked prompt. Mobile details width and scroll width both 390px. Preview dev server stopped responding during initial hot reload; restarted the same isolated user service, then completed the browser checks successfully. No hosted changes; owner review pending.

## Compact sidebar cards and header removal — owner trial

Removed the duplicate ticker/company heading above Technicals / Recent News / Screeners; the chart workspace header retains the ticker. Sidebar screener cards now use a scoped half-scale presentation (50% text and content scale), with a 250px viewport over 500px logical content, keeping each card scrollable and maintaining the two-column grid. This wrapper applies only to cards inside Screeners, leaving dashboard cards and detail-tab controls unchanged. Selection state remains unchanged.

Exact-file lint and 25 focused tests pass. Actual Tailscale desktop browser measured all four sidebar wrappers at 250px with 0.5 scale, matching first-row/second-row heading positions, and no duplicate ticker heading or company label. Checked selections survive ticker changes. Help guide reviewed: existing checkbox/grid workflow stays accurate; no guide update needed for this visual density trial. Owner visual approval pending; no deployment.

## Height-only correction

Owner clarified that card reduction means a shorter viewport showing fewer rows, with scrolling, rather than scaling content. Removed the 50% zoom; restored original text/control sizes while retaining 250px sidebar card height. Constrained the DashboardPanel body through its internal content wrapper so tables actually shrink and scroll instead of being clipped. Duplicate stock header remains removed. Exact-file lint passed. Browser verified original 10.88px table text and zoom=1, 250px cards, 168px table viewports with 548/857px of row content, and scrollTop successfully moving to 100. This supersedes the previous half-scale trial. Help workflow unaffected; no deployment.

## Use the available sidebar viewport — owner correction

Replaced fixed 250px card sizing with a desktop two-row grid filling the available details-panel height, so four selected screeners occupy the viewport as a two-by-two arrangement. Mobile retains single-column scrollable 300px cards. Removed the details section's left padding, reduced its remaining padding/gaps, and applied the shared screener panel/scroll structure with compact 4px card interiors instead of DashboardPanel's default 20px padding. Titles and decline tabs are 0.45rem (half the screener title size), normal weight; table text and controls retain their original scale. The main workspace cards are unaffected.

Exact-file lint passed. Browser at 1920x1080 measured two matching 458px rows, bottom edge 1076px inside the viewport, zero left padding, 7.2px/400-weight titles, original 10.88px table text, and working table scrolling. This supersedes the fixed-height and half-scale trials. Help workflow still accurately describes selection and two-column desktop layout; no content change needed. Owner visual review pending, no hosted changes.

## Title baseline and left-padding correction

Restored the original details-section left padding (16px). Corrected the title calculation to half DashboardPanel's original 1.25rem title: 0.625rem/10px, normal weight, applied consistently to sidebar screener headings and decline title tabs. Previous 0.45rem was based on the wrong title baseline. Browser verifies 10px/400 titles, 16px left padding, four cards still within the viewport, and working scrolling. Exact-file lint passed; no deployment.

## Original title size, normal weight

Owner requested restoring original title size without bold. Sidebar screener headings/title tabs now use 1.25rem (20px), weight 400. Padding, viewport grid and row content are unchanged. Exact-file lint passed. Owner visual review pending; preview updated, no deployment.

## Bold titles at 75% size

Owner requested bold titles reduced by 25% from the restored 20px baseline. Sidebar screener headings/title tabs now use 0.9375rem (15px), weight 700. Exact-file lint passed. Preview updated; no deployment.

## Inline selected ticker

Restored only the selected ticker before the detail tabs in the same horizontal row, using the scanner ticker's warning.main orange token. Company name stays omitted. Tabs can scroll horizontally on narrow widths while the ticker remains visible. Exact-file lint and both ticker-details tests passed. Preview updated; no deployment.

## Keep synthetic preview visible after hours

Owner reported fixture tables disappeared at market close. The fixture API still returned ready rows; memberScannerStatus independently hid the tables based on the browser's current Eastern hour. Removed that clock-only presentation gate in the generated preview artifact's member-status module and recorded the overlay in its runtime manifest. Canonical application market-hours logic is unchanged. No production settings, providers or workers changed. Initial hot-reload browser attempt timed out waiting for rows; a subsequent real browser check confirmed the fixture API ready/20 gainers and rendered tables after 8 p.m. Eastern. Source fixture values remain synthetic and static.

## Hide dollar volume in Table only

Owner requested removing $ × Vol only from Table view. Removed that header/cell/width slot from the compact Top Gainers table and the full desktop Table renderer. Two rows retains its dollar-volume column, Cards retains its metric, and Momentum/qualifier settings are unchanged. Applies equally to the main card and the sidebar's reused Table renderer. Updated existing column-count and mode coverage assertions; all 23 scanner client tests and exact-file lint pass. Help reviewed: existing stock-levels guide does not enumerate these table columns and needs no update. Preview updated; no deployment.

## Hide dollar volume in all Top Gainers modes

Owner extended removal to all three Top Gainers modes. Removed the remaining two-row table header/cell/width and Cards metric. Reused sidebar/full-view renderers receive the same change; Momentum details and the background dollar-volume qualification rule remain unchanged. Existing mode assertions updated; 23 scanner client tests and exact-file lint pass. Help guide does not enumerate these metrics; no update required. Preview updated, no deployment.

## Shorten Top Gainers HOD label

Owner requested removing “Below” from “Below HOD” in all three modes. Top Gainers Table, Two rows and Cards now label the existing percentage as “HOD”; the gainers expanded metric matches. Calculation and Momentum labels are unchanged. Updated the Cards label assertion. Help guide does not enumerate this label and needs no update. Preview updated; no deployment.

## Finnhub country flags — Top Gainers

Owner requested a country flag at the end of single-row Table, under the ticker in Two rows, and in Cards. Added those placements to Top Gainers (including its reused sidebar/full-view presentation). Cards places the compact flag with the ticker; unknown country shows an accessible dash. Uses the existing Watchlist country normalization and bundled flag-icons artwork, with country tooltips/accessible labels; never infers company country from NASDAQ/NYSE or a US listing.

The existing paced background Finnhub profile2 fetch now preserves matching-ticker ISO country independently of float availability in the daily scanner float-cache record. Optional countries metadata is backward compatible with existing files. Country can coexist with EODHD fallback float and is not replaced by an EODHD country guess. Existing float caches without country receive background profile enrichment, while quote scanning returns cached floats immediately. Known missing country is cached as null for that day. Live result enrichment reads cached countries after qualification; missing country/cache failure does not reject stocks, alter ranks or mark the scanner unavailable. No new request loop on the browser or synchronous provider call in the scan cycle. No real provider requests, production writes, deployment or settings changes made during implementation.

Preview fixtures contain synthetic US/CN/CA/IL/SG/GB/HK examples and a missing-country example. Actual browser verified Country as the last Table column, a flag in the first cell of Two rows' second row, and flags in Cards. Bundled artwork renders correctly. Exact-file lint and 58 focused scanner client/feed/runtime/flag-helper tests pass, including country without Finnhub float, wrong-ticker rejection, date isolation, cached no-repeat requests, qualification preservation and cache-failure tolerance. Full-repository TypeScript exceeded its default heap; narrowed backend typechecking (with explicit Node types) reports only the pre-existing premarket-pullbacks row/contract mismatch. The same focused backend check against the production-source preview passes with zero diagnostics. No full typecheck/build pass claimed. Preview initially stalled during hot reload; restarted the same isolated service and the final browser pass succeeded. Help guide updated with company-country semantics using a narrow delta; preserve unrelated Help edits. Existing shared live-feed test file was already missing two preservation-baseline cases: checkpoint retains those cases and stages only this feature's test changes. Owner visual review pending.

## Up to four charts with ticker detail tabs — owner experiment

Owner requested preserving current charts when opening another ticker, up to four, and using each ticker symbol as its detail tab instead of separate Technicals / Recent News tabs. Screeners remains alongside ticker tabs with its checkbox selection intact. Two charts sit side by side, and three/four occupy a two-by-two grid. Opening an existing symbol selects it without duplicating or remounting its chart. A fifth symbol shows a clear four-chart limit message and preserves the current four; individual close controls free slots and select an adjacent ticker when needed. Closing the workspace clears its chart set. Legacy chart-only drawers keep their single-chart behavior.

Ticker tabs use selected background, orange text/underline and matching selected-chart border; chart headers also select the associated details. Each ticker's details remain mounted separately while hidden, retaining its own map, request state and expanded news. Selected ticker snapshots provide facts even if it subsequently drops out of scanner results. Technical facts and the existing support/resistance generator share the top row; Recent News is below. No separate Details tab. Chart/detail width now divides available desktop space responsively (rather than a fixed 1180px track), leaving room for the top-row detail composition. Mobile stacks chart area and details without horizontal page overflow. No new provider, persistence or scanner fetch loop.

Verification: exact-file lint and 26 focused client/state tests pass. Integrated client regression exercises four retained chart elements, preserved Screeners selection, capacity rejection, ticker detail selection, closing a chart and filling its slot, and closing the workspace. Actual Tailscale browser verified four tiles in a 2x2 grid, the first iframe retains its DOM identity after adding other symbols, ALFA's generated map persists while BRVO remains ungenerated, and Recent News appears in the same detail panel. Closing one leaves three charts; capacity warning appears on a fifth. Details client/scroll widths both 579px at a 1536px viewport; mobile page widths both 390px. No page exceptions in this probe. Synthetic fixture symbols may be unknown to the external chart widget; fixture levels remain clearly synthetic. Help updated to final ticker-tab workflow with only this feature's delta. React checklist reviewed: stable keys, isolated component state/abort cleanup, bounded chart count, accessible tab relationships, and no extra scanner polling. No full build or repository-wide TypeScript pass claimed. Preview updated; no deployment. Owner visual review pending.

## Four-chart embed clipping correction

Owner observed the lower part of charts was cut off. Browser measurement confirmed each 457px chart body contained a 932px embed with a 640px minimum height: the shared chart's responsive xs/sm defaults survived the caller's scalar height/minHeight overrides. Updated only the workspace caller to override height and minimum height at both xs and sm, retaining the shared chart implementation and stable iframe identities. After correction, all four chart roots and iframes measure exactly their 457.48/457.5px available bodies, with iframe bottoms 1px inside the tile border. Actual screenshot confirms full widget surfaces instead of clipped content. Exact-file lint passed. Help workflow unchanged; no guide update needed. Preview updated; no deployment.

## Header close controls and compact level columns — owner trial

Owner asked for three close-control ideas that consume no space inside chart tiles. Presented (1) workspace-header ticker × controls, (2) × beside ticker detail tabs, and (3) a workspace-header close-chart menu. Implemented the owner's suggested first option for this reversible trial. Header controls select/show each ticker's details and close individual charts; the per-tile symbol/close bars are removed, leaving only the selected border around full-size embeds. The embedded TradingView toolbar remains owned by TradingView.

Resistance and Support now use two equal columns within the existing support/resistance portion of the technicals row. Removed the per-level signed distance percentages and the large synthetic-preview informational alert. Retained only the quiet “Sample” suffix in the existing generated-time metadata for mock results. Actual prices, provenance, failed-refresh retention, full ladder and on-demand generation are unchanged.

Exact-file lint and 26 focused client/state tests pass. Actual Tailscale browser verified zero tile close buttons and four header close buttons, retained first iframe identity, four chart tiles, independent ticker maps, successful header closing, and no page exceptions. Resistance/Support columns both measured 223.84px with headings at matching y=243.23; the preview banner count is zero. At desktop 1536px the detail region has no horizontal overflow; mobile page width remains 390px. Help updated with header actions and the two-column map presentation. Preview updated, no deployment; owner visual review pending.

## Shorter workspace header and wider charts

Owner requested removing the top-left ticker/chart heading, reducing the whole-workspace close button's vertical padding to roughly 5px, and widening the chart area at the details panel's expense. Removed that heading, set header vertical padding to zero and close-control padding to 5px, and changed the desktop chart/details split to 2:1 with a 380px details minimum. Existing ticker × controls remain on the TradersLink + TradingView line. Added an accessible dialog name independent of the removed visible heading. Technical-facts grid adapts to two columns when its details container is narrow, keeping values readable without altering font sizes.

Exact-file lint passed. Actual Tailscale browser measured a 35px header and 5px close padding; at 1920px the chart area is 1280px and details 640px. All four iframe/root heights exactly match their 514.5px chart bodies and remain inside their tiles. At 1536px details client/scroll widths both measure 511px. An initial probe was interrupted by hot reload while source edits were still landing; the final settled browser pass succeeded. Help workflow is unchanged and needs no update. Preview updated; no deployment; owner visual review pending.

## Inline levels action and reference metadata

Owner requested removing the top Support & resistance heading, placing Generate Levels in its position, and moving Reference/Generated metadata inline to the right with bottom alignment. Removed the heading and relocated the existing two-line metadata into the action row, right-aligned with flex-end alignment; values remain tied to the selected ticker's map. Resistance/Support subheadings remain in their two-column body. Exact-file lint and 25 focused client tests pass. Actual browser with DLTA confirms the requested $2.46 reference text, right alignment, and identical button/metadata bottom edges at y=122px; the removed heading is absent. Help workflow remains accurate and needs no update. Preview updated; no deployment.

## Generate Levels beside ticker tabs; reference-only metadata

Owner requested removing the Generated/time/Sample second line, moving a smaller Generate Levels control onto the ticker/Screeners tabs row, and retaining Reference at the top left with support/resistance. Added a header action slot; the active ticker's existing detail component renders its own 26px-high action there through a portal, retaining independent busy/map/error/abort state for all open tickers. From Screeners the action opens the selected chart's details and generates only that symbol. Other ticker panels do not render additional header controls. Removed the Generated line and Sample suffix; Reference remains a single left-aligned line above the two level columns. Mock fixture provenance remains in the level sources; no generation backend or provider behavior changes.

Exact-file lint and 25 focused client tests pass. Actual browser verified the button resides beside the tabs at 26px height, Reference is left-aligned and contains only the requested line, and Generated is absent. Header requests sent DLTA then ALFA to the existing isolated mock route; selecting DLTA again retained its independent $2.46 map. Help updated to explain the selected-ticker header action. Preview updated; no deployment; owner visual review pending.

## Top Losers card association cleanup

Owner identified the obsolete “Rapid Drops / Top Losers” checkbox association. Renamed it Top Losers in the sidebar and current Help. Removed the old rapid-view tab, rapid empty/table/accessibility labels, full-view labels and rapid tooltip wording from the assigned Top Losers component; its preserved production-source preview already used Top Losers for the visible title/full-view controls, but still carried unused rapid table branches. Both source variants now use only the losers result set, session-appropriate Top Losers title and session-comparison tooltip. Table/expanded detail code now always displays change, volume, float, spread and comparison price, ignoring any drop payload rather than letting fall time/rebound values appear under loser columns. Retained genuine underlying rapid-drop detection, shared Admin detection settings, audit facts and High Drops behavior; these do not identify Top Losers as a Rapid Drops card.

Exact-file lint and 27 focused Top Losers/scanner client tests pass. Regression injects drop context into a loser row and verifies it cannot change the card's semantics. Browser confirms checkbox choices Top Gainers/Momentum/Top Losers/High Drops, loser headers Change/Vol/Float/Spread and no Rapid reference in its full view. Help aligned; preview updated, no deployment. Historical progress records retain their former UI descriptions as history. Owner review pending.


## Alpaca Lightweight Charts owner preview

Owner approved replacing scanner workspace widgets with Lightweight Charts powered by the separate VPS Alpaca gateway. Four chart slots, real-ticker entry, five timeframes and volume are implemented and private-browser verified. Existing scanner fixture rows and qualification/audit feed remain unchanged. See [Alpaca VPS owner test](scanner-alpaca-vps-owner-test-plan.md) for source, private service configuration, validation and the remaining Railway publication boundary.


## Real symbols in static preview — 2026-11-07

Owner requested replacing synthetic symbols with live-app symbols or real members of the under-$100M universe. Read the production November 6 universe without mutation and selected 20 stocks whose collection market caps are strictly below $100M. Confirmed all 20 have Alpaca latest SIP bars in one batched read-only request. Preview mapping, in row order: NWGL, TGE, JDZG, OMH, KITT, PRZO, FCUV, EDBL, SXTC, TRUG, SNTG, ATPC, WETO, STAK, ZCMD, IVDA, MBOT, LIDR, AACG, AAME.

Updated the runtime-only scanner fixtures, synthetic levels keys/symbols and synthetic article references consistently. Exchange and collection market cap use the selected universe metadata. Other sample row figures, flags, news and example levels remain synthetic/static; this is not a copy of live rankings or an active scanner provider switch. Sample company/news wording still identifies its synthetic context. Runtime manifest records provenance. No production writes, release or canonical scanner logic changed. Browser check verifies NWGL chart entry and actual Alpaca candles. Help needs no change for fixture ticker substitution.

## Side-card Market Events — November 7, 2026 Eastern

Added Market Events to side-card screener checkboxes with shared headline/float/halt data. See [implementation, checks and next mobile proposal](scanner-side-card-market-events-progress.md). Owner review pending; covered-dashboard suspension and broader performance checks remain separate.

## Shared chart design page

Owner approved using the existing Market Charts page as the full-size design workspace for the reusable Alpaca Lightweight Chart. See [shared chart progress](shared-lightweight-chart-progress.md).
