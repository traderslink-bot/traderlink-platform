# TraderLink Stock Screeners progress

**November 14, 2026 ET.** The owner approved the table-first layout, a first release on `/screeners`, read-only Alpaca qualification and an isolated VPS preview. The current launch default is All covered U.S. stocks with an optional pasted ticker list. Market cap has no default bound. The Under $200M slice below is retained as a historical benchmark. Options discovery follows the separate Options workspace. [Implementation plan](stock-screeners-alpaca-plan.md)

## All covered U.S. stocks and performance

The owner approved a broad default and performance-based sizing. The new listing loader matches the two Nasdaq Trader listed securities files to active Alpaca stock assets. It uses listing flags and listed security descriptions to exclude identifiable non-stock instruments. Nasdaq's listing data supplies market-cap values where it has them. Missing cap remains visible with Any cap. The new source and no-default-cap rule are confined to Screeners. Saved screens from the previous build preserve an explicit Under $200M rule.

| Measured item | November 14 VPS result |
| --- | --- |
| Full eligible listing set | 5,845. Regular price for 5,839, regular session volume for 5,675 and SMA 200 for 5,481. Market cap for 5,294. |
| Cold preparation | 171.3 seconds and 342 market-data requests. No HTTP 429s. Two concurrent workers and starts paced at 120/minute. The atomic file was 19.7 MB. |
| Warm closed-market refresh | 1.6 seconds and zero stock market-data requests. The collector reused daily history and the unchanged session bars. |
| Query against the loaded snapshot | 100 trials alternating zero and 20 rules. Filtering, sorting and selecting the first page took 5.8 ms median and 10.4 ms p95. The one-time open, decode and validation of a new file took 147 ms. Browser and auth overhead are separate. |

The controlled repeat compared 18 baseline, 77 during and 12 post-collection samples for each installed loopback gateway read. The market was closed. The repeated run collected all 5,845 symbols in 173.2 seconds with 342 market-data requests and no HTTP 429s. Cached chart reads used a fixed history window. Uncached chart reads varied the end timestamp to bypass the gateway history cache. Scanner quotes used two symbols. Every probe returned HTTP 200 with its expected data.

| Installed gateway path | p95 before | p95 during | p95 after |
| --- | ---: | ---: | ---: |
| Scanner quotes | 4.2 ms | 3.0 ms | 2.7 ms |
| Cached chart history | 29.5 ms | 32.0 ms | 29.0 ms |
| Uncached chart history | 101.5 ms | 91.5 ms | 81.3 ms |

Uncached chart history had one 531 ms maximum during collection. These samples support the wide default at the tested pace. They do not establish live opening or peak traffic capacity. Staging still needs to measure live scanner signal lag, chart streaming, incremental screener refresh, and quote coverage. The shared app preview switched to Coaching during benchmarking and its scanner API samples were excluded. No other feature preview was interrupted.

The new private preview fixture has 5,845 synthetic listings spanning millions, billions and trillions, plus names with missing cap. Six focused tests, focused TypeScript and targeted lint passed. The updated components were exercised in Chromium with the full-size fixture and a simulated API response. The checks covered Any cap, Under $5M, a custom $375M to $2.5B range, invalid bounds, ticker scope and mobile layout.

After Coaching released the shared lane, the owner authorized the switch. The standard launcher started the isolated admin-watchlist preview on `127.0.0.1:3010` with workers disabled. The preview database passed an SQLite quick check. Desktop and mobile Chromium verified the actual page and screener API. The uncapped run evaluated the 5,845-listing scope and returned 5,844 matches, the custom $375M to $2.5B range returned 648, and Under $5M returned 649. Reversed bounds disabled Apply range. Clearing the filter restored the original results. Portrait and landscape fit without page overflow.

The owner requested phone access through Tailscale. [Screeners phone preview](https://traderlink-live-preview.tail41b7ab.ts.net:10443/screeners) serves the same isolated app. Tailscale Serve reports port 10443 as tailnet only. The owner-scoped loopback bridge runs as `traderlink-screeners-phone-bridge.service` and forwards the Screeners page, its API, Help and supporting assets. Mobile Chromium at 390 px opened the HTTPS URL and ran both the default and custom market-cap range against the preview API. Cross-origin requests returned 403 and unrelated page paths returned 404. Existing Tailscale routes were preserved.

The owner then requested a real market snapshot on the private phone preview. The existing one-shot collector uses the owner Alpaca connection outside the app and writes only a validated snapshot to the isolated preview data directory. The owner preview reads that file when present. The preview loads labeled examples when the file is absent and returns a market data error if it exists but is invalid or expired. The collector runs separately with no recurring job, and the preview service keeps its workers disabled. Prices and volume come from Alpaca SIP. Market cap comes from the listing data. The session and timestamp are visible beside the results.

The one-shot run collected 5,845 covered stocks in 171.4 seconds with zero Alpaca throttles. Mobile Chromium exercised the actual phone URL and confirmed the API returned Alpaca SIP from the Friday, November 13 regular close at 4 p.m. ET. The uncapped run returned 5,839 prices and the custom $375M to $2.5B range returned 1,356 matches. The snapshot has mode 0600. The active preview process had no Alpaca credentials or gateway configuration. Focused TypeScript, lint and six screener tests passed.

The owner asked how to build a custom screen. New screen is now a visible action beside the Screen picker and opens the blank filter builder. The Add filter menu groups metrics by category. The Help guide shows where to start and how to save. Mobile Chromium on the phone URL switched from a built-in preset, started a blank screen, added Price at least $25 and Volume at least 250,000, and returned 1,363 matches from the Alpaca SIP snapshot. Saving and reopening restored both rules. The preview was checked at 320 and 390 px portrait and 844 px landscape. The QA screen was removed after verification. Targeted lint passed.

## Visible filters, saved screens and sharing

The owner confirmed that filters should be available as standard page controls. Add filter, Market cap and Exchange now stay visible on TraderLink presets, new screens and saved screens. Selecting a metric or tapping a rule chip opens the condition and value controls beneath the filter bar. New screen starts from All covered U.S. stocks. Save screen creates a private entry under My screens when starting from a blank screen or a TraderLink preset.

Chromium on the Tailscale HTTPS preview confirmed visible filters while switching from a preset to a blank screen and reopening a saved screen. Price at least $25 plus Volume at least 250,000 returned 1,363 matches across the 5,845-listing Alpaca SIP snapshot. The filters fit at 320 and 390 px portrait, 844 px landscape and 1,440 px desktop. The temporary test screen was removed. Targeted lint, TypeScript and all six focused tests passed.

The owner approved [sharing and the community gallery](stock-screeners-alpaca-plan.md#sharing-inside-traderlink) after the filter preview. Share creates an opt-in member link to a fixed version of a saved screen. Owners can list it in Community presets, remove the listing, replace the version with a new link, or turn sharing off. Recipients can preview, run or save an editable copy. Screens using My tickers are private. The share catalog stores each published configuration in the Screeners data directory.

The private phone preview passed direct link and gallery navigation, listing and unlisting, clipboard copy, a real Alpaca SIP run with 1,363 matches, saving a copy, replacing the shared version and revocation. The copy kept the original rules after the link was revoked. The preview test used the isolated development identity and removed its temporary screens. Focused tests exercised separate account ownership, configuration isolation, hosted sign-in return routing, stale publication, source deletion, cross-origin protection, and gallery pagination. Targeted lint, TypeScript and all 12 tests passed.

The next release checkpoint is a paced market-hours refresh with scanner signal and chart responsiveness measured at the open, plus premarket and after-hours snapshot freshness and recovery checks. Coordinator staging needs the refresh and retention configuration, an approved member market-data display arrangement, separate signed-in account browser checks, and backup and restore verification for the share catalog and private screen files.

## Relative volume and recent press releases

Both filters are in Add filter, sortable columns, Why it matched, saved screens and shared configurations. Unusual volume starts at 2× with at least 100,000 session shares. Recent press releases starts at 24 hours. The user can edit those criteria. The press-release lookup uses the original publication time, applies the user's news entitlement and visibility delay, and links to the qualifying press release. A run with restricted news evidence requires a refresh if the member's news access becomes more restrictive. A measured synthetic SQLite lookup with 105,210 articles used the existing ticker/publication index and returned evidence for 5,845 listings in 19 ms.

The real owner-only Alpaca test read 1,696 market-data requests in 848.5 seconds with zero throttles. At Friday's completed regular session it produced 4,694 usable relative-volume values out of 5,845 listings. The premarket and after-hours snapshots contained 2,645 and 4,349 relative-volume values respectively. That is a cold preparation measurement. Screen runs use the prepared data, and the warm collector cache keeps a stable historical range through each trading date. A first collection should warm outside regular trading before testing the market-open refresh interval. This weekend capture did not measure live scanner or chart lag.

The previous private preview process exited due to an out-of-memory kill. The same isolated lane was restored with its existing data and workers disabled. The validated real Alpaca snapshot was replaced atomically and the prior snapshot was retained for recovery. The first browser attempt found a transient source-manifest mismatch in the shared checkout. The source returned to the existing 126-migration prefix and the preview database passed its quick check with no changes.

Chromium on the private HTTPS phone preview verified the table, filter search, ratio and hour units, match details and saved-screen reopening at 320 and 390 px portrait, 844 px landscape and 1,440 px desktop. The Unusual volume preset matched 205 stocks and a custom at least 3× screen matched 137. The isolated press-release store was readable and produced zero 24-hour matches. A separate SQLite fixture verified positive release selection, exclusions and visibility delays. Nineteen focused tests, TypeScript and targeted lint passed. The two-account staging review can verify member-visible press releases with the staged news source.

## Opening range and VWAP

Add filter now includes the high, low, width and price position for the first 5, 15, 30 and 60 minutes of the regular session. It also includes estimated session VWAP, price position, percentage distance and the last completed five-minute cross. Direction filters use named choices and appear in sortable columns and Why it matched. Six starter presets cover the two 15-minute range directions, both VWAP positions and the two latest-bar crosses. The collector derives the new metrics from its existing paginated five-minute reads. A screen run reads prepared metrics. The private preview uses regular and extended-session VWAP values with separate session anchors.

The owner-only Friday snapshot was enriched with fully paginated historical SIP bars in 83.4 seconds over 166 Alpaca market-data requests, with zero throttles or rejected symbols. Alpaca's calendar confirmed the stored market windows. For regular trading, 5,267 of 5,845 listings had a usable 15-minute price position, 5,675 had VWAP and 4,729 had the two bars to evaluate a latest-bar cross. Premarket and after-hours had VWAP for 3,182 and 5,193 listings respectively. The verified snapshot was swapped atomically, with the previous file retained. A field-by-field comparison preserved the earlier results and relative-volume values.

Chromium on the private phone preview verified Above 15m opening range with 1,188 matches, Above session VWAP with 3,200, and latest-bar reclaim and rejection with 253 and 449 respectively. A custom screen combining Inside 30m range and Below VWAP matched 814 and reopened with both criteria. Premarket correctly reported that a regular session was needed for the opening range. The Unusual volume preset still matched 205. The editor fit at 320 and 390 px portrait, 844 px landscape and 1,440 px desktop. The temporary saved screen was removed. Twenty-five focused tests, TypeScript and targeted lint passed.

## Two-account staging check

The owner requested a Railway staging check and authorized fake staging accounts. The initial shared staging build lacked Screeners and its data. After Coaching completed its final retest, the owner approved Screeners-only access for the two fake accounts and the Coordinator staged the integrated build. Source `2639cd7daf215c5f609b76312312bad997ca30f3` is running in Railway deployment `6c4bb4b4-bd62-4898-9ddd-99bca2ce6836`. Staging health returned HTTP 200. The integrated build preserved the verified Coaching source and data.

A separate integration check used two fake Platform accounts in a disposable local database and exercised the hosted session authorization path. The author saved and shared a combined 15-minute opening-range and VWAP screen. The recipient opened the link and ran it, saved a separate copy, and ran the copy after the author revoked the link. The recipient could not manage the author's share, and the author could not read the recipient's pinned run. The market snapshot used deterministic synthetic bars. The six focused Screeners suites passed all 26 tests.

The hosted browser check passed using two separate synthetic sign-ins and a four-stock fixture. The author saved and shared a screen requiring price above the 15-minute opening range and above session VWAP. Both accounts found the same single expected match. The recipient opened the link in a separate browser context, verified both values in Why it matched, and saved an independent copy. After revocation the link showed the unavailable state and the recipient reran the copy successfully. Neither account could see the other's private saved screen. Both were denied Watchlist Admin. The test selected Reject optional when the consent banner appeared and removed its temporary screens. A separate signed-in read confirmed that no temporary screens remained under either account.

## Full feature QA

**November 14, 2026 ET.** The browser baseline used the existing Screeners-only staging accounts and four-stock fixture on deployment `6c4bb4b4-bd62-4898-9ddd-99bca2ce6836`. It exercised the default universe, opening-range and VWAP explanations, custom cap input, ticker validation and empty results, all three views, news and chart entry, saved-screen management, and two-account gallery publication, copying and revocation. Signed-out API access and Watchlist Admin were denied. The test removed its temporary screens and verified both accounts afterward.

- Reopening and confirming a market-cap shortcut preserves the existing comparison. Editing the bounds applies a new custom range.
- Sorting a result table preserves the sort selected for an unapplied screen. Saving an unchanged query keeps results current. Running a single-bound rule clears the pending status after switching from a range.
- Recent News uses member access and visibility delay for publication and ingestion, with a rolling 48-hour publication window that includes weekends. A preset report includes the shared link on the host where the member opened it.
- The staged image contains the Help guide but omitted `app/(dashboard)/help/tools/stock-screeners/page.tsx`, so the Help destination returned 404. The current source rendered the Help article and its return link. Include the route module with the guide in the next staged Screeners build.

All 27 focused tests, focused TypeScript and targeted lint passed. The isolated Chromium retest used the updated workspace and query code with the prepared 5,845-listing Alpaca snapshot and simulated browser API responses. It verified stable 50-row paging, market-cap counts against the source rows, draft and results sort, rule editing, columns, viewport widths of 320, 390, 844 and 1440 pixels, retry and expired-result states, Help, and the preset report link. The retest used prepared market data and fixtures for chart/news entry and error states. Live market-hours collection and chart data were outside this run. The fixes are local and the staging deployment still contains the baseline.

## Second Screeners QA run

**November 14, 2026 ET.** The prepared 5,845-listing Alpaca snapshot passed an independent match comparison for all 22 presets, validation of all 64 metric definitions, and exchange scope checks across the four captured sessions. All 27 focused tests, targeted ESLint and focused TypeScript passed.

- Enter now submits the named-screen dialog. A rejected save keeps the name and filters in place and shows the error in the dialog. If another tab deleted the original, the member can save those edits as a new screen with a new ID.
- Changing result pages returns the scrollable results to the top. The isolated Chromium retest passed paging, cap boundaries, draft sorting, keyboard focus restoration, touch controls, expired runs and rate-limit recovery using the prepared snapshot and simulated browser API responses.
- The two-account staging browser rechecked opening range and VWAP, saving, gallery publication, replacing the shared version, revocation, and privacy for personal ticker lists. It removed the temporary saved screens. A separate staged API check rejected a stale write following deletion with HTTP 409.

Railway staging still ran deployment `6c4bb4b4-bd62-4898-9ddd-99bca2ce6836`. Its Help route returned 404, and the local Help article and return link passed again. The new fixes were verified in the isolated source run. Live chart data and market-hours collection remain outside this checkpoint.

## Third Screeners QA run

**November 14, 2026 ET.** A version-one saved screen with the original 20-rule limit retained its default selection and implicit Under $200M rule after opening, writing and reopening. The independent query check confirmed that unknown market caps remain in the default universe, sort last in both directions and require data to pass a cap filter.

- Numeric inputs now respect each filter’s unit. Spread accepts values such as `50 bps`. Percentage input is invalid in a basis-point spread, price or market-cap field.
- Results distinguish a selection with zero covered stocks, a selection with insufficient data to evaluate its stocks, and a run with evaluated stocks and zero matches.

All 28 focused tests, scoped TypeScript and targeted lint passed. The isolated Chromium rerun used the prepared 5,845-listing Alpaca snapshot and simulated browser API responses. It covered both corrections, the earlier save and paging fixes, and sticky ticker position, horizontal scroll and drawer focus restoration at 320 pixels. Both staging QA identities retained Screeners access and were denied Watchlist Admin. Signed-out Screeners API access returned 404. The existing Railway staging build still returned 404 for Help, while the local Help article and return link passed. Live chart data and market-hours collection remain outside this checkpoint.

## Fourth Screeners QA run

**November 14, 2026 ET.** An independent calculation matched all 72 combinations of price, market cap, VWAP and exchange on the prepared 5,845-listing Alpaca snapshot across four sessions.

- If a replacement snapshot is corrupt or missing, an already loaded, validated snapshot can still serve screens from the same data directory within its existing age limit. Results keep the original timestamp and identify the data as the last available snapshot. A valid new generation clears the warning.
- An open Why it matched dialog retains the selected row’s original rules, session and timestamp when another run finishes.
- Choosing a press release age sort when those ages have yet to load keeps the existing results visible until the trader explicitly runs the screen.
- A paging connection failure retains the current results and can be retried. Only an expired run displays the expiration message.

All 29 focused tests, scoped TypeScript and targeted lint passed. The market reader test used a disposable directory and verified corrupt and missing files, recovery, the age cutoff and directory isolation. Chromium exercised the latest workspace against the prepared snapshot with simulated browser API responses, including all four corrections, the previous save and paging fixes, and the narrow mobile table. Railway baseline deployment `6c4bb4b4-bd62-4898-9ddd-99bca2ce6836` returned 200 for health and passed access checks for the two QA accounts and signed-out requests. It returned 404 for Help. The local Help article and return link passed. A separate staging deployment was in progress at close. This fix batch was verified locally. Live chart data and market-hours collection remain outside this checkpoint.

## Fifth Screeners QA run

**November 14, 2026 ET.** The previous snapshot fallback, pinned match explanation, explicit press release sort and paging retry all passed the regression run. The browser used the prepared 5,845-listing Alpaca snapshot with simulated API responses and interrupted connections.

- A save that committed before the response dropped can be recovered from the account’s saved screens. Retrying the same open save dialog preserves the screen ID, including when the recovery read also fails.
- Sharing reconciles with the stored member link and listing status after a response is interrupted or a share has already changed. Chromium verified publishing, gallery listing and revocation with dropped responses.
- A failed relative-volume history fetch marks the affected sessions partial. A history response with rejected bars supplies no baseline for the affected symbols and is fetched again on the next collection. The fixture verified recovery to the expected 3× relative volume.

All 30 focused tests, scoped TypeScript and targeted lint passed. Railway deployment `be2abd8d-e174-43f8-a45f-c8bbce54c947` returned 200 for health and Screeners API access for the two approved accounts. Signed-out API access and Watchlist Admin were denied. The staged Help route returned 404. Help and the new fixes passed locally. Live chart data and market-hours collection remain outside this checkpoint.

## Sixth Screeners QA run

**November 14, 2026 ET.** Retested interrupted save retries, share publication, gallery listing, revocation and relative-volume recovery. The expanded two-symbol history fixture verified that a valid ticker keeps its relative volume when another ticker’s bars are rejected. Corrected history recovered both tickers and was reused on the following collection.

- A save confirmation now checks the screen affected by the action or the requested default. An unrelated save or default change from another tab no longer hides a successful save whose response dropped. The browser case verified the other tab’s default was preserved, the saved screen appeared once, and confirming it caused no extra write.
- Sharing an unchanged screen can be retried in the dialog after another tab edits a different screen. The dialog refreshes the saved revision when the intended screen still matches. Publication stayed blocked when another tab switched the intended screen to a private ticker list.

All 30 focused tests, scoped TypeScript and targeted lint passed. The isolated Chromium retest used the prepared 5,845-listing Alpaca snapshot and simulated concurrent changes and connection failures. The staged baseline `be2abd8d-e174-43f8-a45f-c8bbce54c947` passed health and Screeners account access checks. It still returned 404 for Help, which passed locally. These changes were verified locally.

## Seventh Screeners QA run

**November 14, 2026 ET.** Cross-tab save retry and sharing recovery passed again. A two-account test found that switching a shared source to My tickers left its earlier member link and gallery entry visible. The published definition contained no personal tickers.

- Saving a shared screen with My tickers now retires its member link and gallery entry. Restoring All covered U.S. stocks requires a new link. A previously saved recipient copy still runs independently.
- Link and gallery reads check the current saved universe even if an old catalog entry remains. Stale publish and listing requests reject private screens, and the sharing dialog removes its link and publishing controls when it learns the screen is private.
- A stale save revision leaves the existing share alone. If the catalog cannot retire a share, the privacy change returns an error and can be retried, with the saved screen still on its original universe.

All 31 focused tests, scoped TypeScript and targeted lint passed. The isolated two-account test verified link and gallery removal, a fresh link after restoring the all-stocks universe, saved-copy independence and the locked-catalog retry. Chromium verified cross-tab recovery and the stale sharing dialog. Staging deployment `be2abd8d-e174-43f8-a45f-c8bbce54c947` passed health and account access checks and still returned 404 for Help. The privacy changes and Help passed locally.

## Eighth Screeners QA run

**November 14, 2026 ET.** Chromium used separate authenticated author and recipient sessions against the current Screeners workspace, route handlers and a disposable Platform database with deterministic market data. The author published and listed a screen with opening-range and VWAP rules. The recipient saved a copy. Fresh reads of the old link stayed unavailable and Community presets stayed empty after saving My tickers and again after restoring All covered U.S. stocks. The recipient reopened the copy and matched the expected ticker with both filters before the author published again. The new link had a different ID, started unlisted and left the old link unavailable.

The revoked-link warning previously stayed visible while running the recipient’s valid copy. Selecting or successfully running an available screen now clears that warning. Opening the revoked link again shows it. The two-account browser retest and all 31 focused tests passed, along with scoped TypeScript and targeted lint. Staging `be2abd8d-e174-43f8-a45f-c8bbce54c947` passed health and account access checks and continued to return 404 for Help. The new behavior was verified locally.

## Ninth Screeners QA run

**November 14, 2026 ET.** Separate authenticated author and recipient browser sessions used the current Screeners code and a disposable Platform database. The revoked link showed its warning on every fresh open. Selecting the recipient’s copy cleared it, and the copy still matched the expected ticker with both opening-range and VWAP filters. The original link and gallery entry stayed gone after the author restored All covered U.S. stocks and published a new unlisted link.

When the copied screen was already selected as the recipient’s default, choosing the same option left the warning visible until a run completed. Selecting the same available entry now clears the warning immediately. Chromium verified pointer and keyboard selection, running the default directly, and showing the warning again when reopening the revoked link. All 31 focused tests, scoped TypeScript and targeted lint passed. Staging `be2abd8d-e174-43f8-a45f-c8bbce54c947` passed health and account access checks and continued to return 404 for Help. The fix was verified locally.

## Tenth Screeners QA run

**November 14, 2026 ET.** The author and recipient walkthrough passed in separate authenticated Chromium sessions using the current Screeners code and a disposable Platform database. The revoked link showed its warning on each fresh open. Hovering over the recipient’s default copy and pressing Escape returned focus to the Screen picker and kept the warning. Clicking the already-selected copy cleared it before a run. Space opened the picker and the arrow keys moved focus without dismissing the warning. Enter on the copy cleared the warning, and Tab and Enter ran the existing copy. Both runs matched the expected ticker with its opening-range and VWAP filters.

The old link and gallery entry stayed gone after the author restored All covered U.S. stocks and published a new unlisted link. All 31 focused tests passed, and this pass found no new defects in the tested flow. Staging `be2abd8d-e174-43f8-a45f-c8bbce54c947` passed health and account access checks and still returned 404 for Help. The browser walkthrough used the current local source.

## Eleventh Screeners QA run

**November 15, 2026 ET.** The separate author and recipient Chromium walkthrough passed again against the current code and a disposable Platform database. The revoked link still warned, pointer and keyboard selection cleared the warning, and the saved copy ran the original opening-range and VWAP rules. Restoring the author’s all-stocks screen and creating a new unlisted link kept the old link and listing unavailable.

The recipient’s first test session was revoked and subsequently denied API access. The signed-out member link sent the request to sign-in with the original Screeners destination as its return path. A newly issued session for the same synthetic recipient reopened the saved copy as the default and returned the expected match. Reopening the revoked link in that fresh session showed the warning again, and selecting the default still cleared it. All 31 focused tests passed. No new defects surfaced in the tested flow. The older staging deployment `be2abd8d-e174-43f8-a45f-c8bbce54c947` continued to pass account access and health checks and return 404 for Help.

## Twelfth Screeners QA run

**November 15, 2026 ET.** The author and recipient walkthrough passed in separate authenticated Chromium sessions using the current code and a disposable Platform database. After a fresh sign-in for the same recipient, its revoked session still returned 404 for saved screens, the gallery, pinned results, a save and a new run. The recipient’s saved copy and default persisted exactly, and the author’s separate saved screen remained accessible to its owner.

In the fresh session, the revoked link still showed an unavailable warning. Selecting the default copy cleared it immediately with both mouse and keyboard. The copy returned the expected match with its opening-range and VWAP filters. All 31 focused tests passed, and no new defects surfaced in the tested flow. Both staging test accounts retained Screeners access on the older deployment `be2abd8d-e174-43f8-a45f-c8bbce54c947`, where Help still returned 404.

## Thirteenth Screeners QA run

**November 15, 2026 ET.** The author and recipient browser walkthrough passed on the current source with a disposable Platform database. The application sign-out route expired the recipient’s session cookie and revoked that session. Its saved-screen, gallery, prior results, save and run requests stayed blocked after the recipient signed in again. The revoked member link still warned in the fresh session. Selecting the saved default removed the warning and returned the expected opening-range and VWAP match with both mouse and keyboard.

An old tab reported a market-data problem when it tried running a screen after sign-out. Runs and sorting now show session access guidance when the Screeners endpoint denies access. Chromium verified both denial messages and the fresh-session copy. All 31 focused tests, scoped TypeScript and targeted lint passed. Both staging QA accounts retained access on the older deployment `be2abd8d-e174-43f8-a45f-c8bbce54c947`, where Help still returned 404. The feedback change was verified locally.

## Fourteenth Screeners QA run

**November 15, 2026 ET.** The two-account Chromium walkthrough passed on the current Screeners code using an isolated Platform database. After the recipient signed out and signed in again, the old tab’s run and sort requests still returned HTTP 404 with `not_found`. Both actions displayed the session-access message. A deliberately expired run in the valid session returned `run_expired`, displayed the results-expired message and refreshed successfully.

Reopening the revoked link in the fresh session still showed the warning. Mouse and keyboard selection of the saved default cleared it, and the copy returned the expected opening-range and VWAP match. All 31 focused tests passed. No new defects surfaced in the tested flow. Both staging QA accounts retained access on the older deployment `be2abd8d-e174-43f8-a45f-c8bbce54c947`, where Help still returned 404.

## Fifteenth Screeners QA run

**November 15, 2026 ET.** The two-account Chromium walkthrough passed on the current Screeners code with a disposable Platform database. After fresh sign-in the old session still could not read, save, sort or run. The revoked link warned in the new session. Selecting the saved copy cleared the warning with mouse and keyboard and returned the expected opening-range and VWAP match.

A sort one second before the 30-minute cutoff used the same pinned run. One second after the cutoff the run returned `run_expired`, showed the warning and kept the existing table visible. Refresh created a new run, cleared the warning and left the saved copy and default unchanged. The old session was still blocked. All 31 focused tests passed, and no new defects surfaced. Both staging QA accounts retained access on the older deployment `be2abd8d-e174-43f8-a45f-c8bbce54c947`, where Help still returned 404.

## Sixteenth Screeners QA run

**November 15, 2026 ET.** Sorting still accepted a run at exactly 30 minutes. Run reads and cache cleanup now treat the cutoff itself as expired. The two-account Chromium retest kept the same pinned run one millisecond before expiry. At the cutoff and one millisecond after, sorting showed the expiry warning and kept the existing table visible. Refresh cleared the warning, created a new sortable run and preserved the saved copy and default.

After fresh sign-in, the old session remained blocked from reading, saving, sorting or running screens. The revoked link still warned, and selecting the saved default with mouse or keyboard cleared the warning and returned the expected opening-range and VWAP match. Chromium used an isolated Platform database and a deterministic market snapshot. All 31 focused tests, scoped TypeScript and targeted lint passed. Railway staging passed the read-only health and account access checks, and its Help route still returned 404. The cutoff fix was verified locally.

## Screeners run retention

**November 15, 2026 ET.** The owner removed the 30-minute limit on result sets. Sorting and paging use the same captured results while the run is cached. The server retains up to six runs per account and 64 per process. When an old run is evicted, the table stays visible and the warning tells the user to run the screen again. Refresh uses the latest available snapshot.

In isolated Chromium with both QA accounts, sorting and paging still worked on the original run after advancing the clock by 31 minutes and publishing a newer snapshot. For each account, the original run was available after five newer runs and evicted by the sixth. The warning appeared on the next page request, and Refresh results cleared it and loaded the newer snapshot. Both saved screens and defaults were preserved. The focused suite also verified eviction when a 65th run enters the server cache. All 32 focused tests passed. Railway staging passed read-only health and account access checks. The retention change was verified on the local source.

**Railway staging, November 15, 2026 ET.** The Coordinator staged source `e00641ccfe452938a3c8c9a783a283b8ca775cdf` in deployment `0085f0e6-9bff-4d93-a79a-02a217018cd7`. Platform health returned HTTP 200 before and after the browser check. The two existing QA accounts each ran the 64-row synthetic snapshot. At 31 minutes 3 seconds for the author and 31 minutes 1 second for the recipient, price sorting and page two used the original run and snapshot. Page two contained the 14 remaining rows for each account.

The original run for each account still paged after five newer runs. The sixth pushed it out of cache. The next click on Next showed the unavailable-results warning while the table stayed visible. Refresh results cleared the warning, created a new run and paged to the remaining 14 rows. The synthetic snapshot stayed fixed during this hosted check. Saved screens and defaults matched their starting state for both accounts.

## Owner-only production trial

**November 15, 2026 ET.** The owner requested a production trial limited to the two existing TraderLink accounts. The Help article and market-hours QA follow the owner trial. The prepared Alpaca SIP snapshot passed the production reader's validation, with prices for 5,839 of 5,845 listings in the latest completed regular session. The [production handoff](stock-screeners-owner-production-handoff.md) records the exact donor, file list, access gate and snapshot transfer for the Coordinator.

Production is live on the two-account gate. Railway reported SUCCESS, production health returned HTTP 200, and the first automatic Alpaca SIP refresh reached production at 2:02 p.m. ET. The [release record](stock-screeners-owner-production-handoff.md#verified-production-release) gives the published SHA, deployment, access checks and refresh evidence.

## Direct filtering from the Screeners page

**November 16, 2026 ET.** Screeners opens in Custom filters with All covered U.S. stocks and no preset rules unless the account has a saved default or opens a shared screen. Run screen now sits beside Add filter, Market cap and Exchange. Users can run the draft and refine it without naming it. Save screen opens the name field for a new saved screen. Stock Analysis informed the layout by offering searchable filters above results and separate access to presets and saved screens. [Stock Analysis screener](https://stockanalysis.com/stocks/screener/)

Isolated Chromium verified the existing Screeners page and API handlers with two test accounts. Mouse and keyboard runs combined a custom market-cap range with a price rule from the initial page and returned the expected match. The name field opened on Save, and cancelling preserved the result. The browser also checked saving, reopening the saved default, running a shared screen, resetting with New screen, and reaching Run on 320 and 390 px portrait and 844 px landscape. This change was verified locally.

## Grouped filters and secondary sorting

**November 16, 2026 ET.** The filter-first workspace now supports OR groups, an Exclude toggle on each rule, a multi-select exchange picker, and an optional Then by sort. Every standalone rule and at least one rule from each OR group must pass. Unknown values retain their coverage status under exclusion. The existing 21-filter limit counts standalone and grouped rules together. Existing screens load with their original filters and sort. Saving and sharing preserve the new settings.

Isolated Chromium ran a combination from the first page without naming or saving it. The check used mouse on desktop and keyboard activation on mobile. It verified OR matches, exclusions, two exchanges, sorted ties and page two, then saved and shared the same setup across two test accounts. It also checked layout at 320 px portrait and 844 px landscape. All 35 focused tests, scoped TypeScript and targeted lint passed. The update was verified locally.

## Recent volume, gap fills and premarket-high breaks

**November 16, 2026 ET.** Added Volume · last 5m, Volume · last 15m, Gap fill status, Premarket high and Premarket high break to Stock Screeners. The picker, result columns, sort and saved screens use the same catalog. Gap fills and breaks use completed regular-session bars. The collector now includes the same-date premarket for the previous regular session even when today's premarket has started.

All 38 focused tests passed, including volume cutoffs, sparse trading, up and down gap fills, and a same-date break that survives a pullback. Isolated Chromium combined the new filters on desktop and mobile without saving, checked the match details and switched to premarket to verify the session guidance. TypeScript and targeted lint passed. The existing 5,845-listing preview snapshot still reads successfully. The new fields populate after the updated collector publishes a fresh snapshot.

## Alpaca qualification

- SIP snapshots, paginated split-adjusted daily bars, minute bars, news and corporate actions returned HTTP 200. The tested market-data requests carried a 10,000/minute rate-limit header. Paper Assets returned 14,406 active U.S.-equity records with 13,224 non-OTC entries and an options-eligible attribute in the response. The calendar identified November 27 as a 1 p.m. ET close.
- A 100-symbol snapshot returned all 100 entries in 108 ms. The first 100-symbol daily-bar page had 10,000 bars for 32 symbols plus a token. The first 5-minute page had bars for 64 symbols plus a token. The collector follows every page before using the batch.
- The full Under $200M run used the scanner listing source and validated 1,744 symbols. Friday November 13 coverage was 1,027 premarket prices, 1,743 regular prices, 1,706 regular-session volume reads, 1,426 after-hours prices and 1,670 usable regular-close SMA 200 values. A weekend check has no current quote coverage. The final collector used 87 SIP requests over 45.5 seconds. The validated 5.88 MB snapshot had 1,737 exchange-matched company names and mode 0600. The disposable file was removed after validation.
- The review did not include new market-hour quote measurements. Independent member-display rights and retained-data terms are open. The live scanner cap and installed gateway were left intact.

## First preview checkpoint

- The first preview scoped the server to Under $200M or a custom subset. It used numeric AND rules, exchange and session filters. It evaluates a pinned snapshot, reports evaluated and unavailable symbols, and maintains stable sort and paging.
- The owner page has 14 presets, Table, Cards and Two rows views, configurable columns, match details, manual refresh and account-scoped saved screens with duplicate, rename, delete and default. The page links its Help guide and opens the shared chart and recent-news surfaces when their sources are available.
- The first collector used the existing scanner listing source and validators. It has read-only qualification, one-shot private output and an optional recurring mode with a shared daily-history cache, two workers, and a paced request budget. The provider credentials stay outside the Platform app. The persistent file and run APIs are separate from the existing live Scanner endpoints.
- The private VPS preview uses generated examples with workers disabled. The app and API paths are gated by authenticated access. Hosted source needs an explicit feature flag, delivery of the prepared snapshot to the app’s data directory and appropriate provider display scope. No collector schedule, credential, gateway, deployment or hosted configuration was installed in this slice.

## First preview verification and integration notes

- Owner preview uses the existing Open VPS Preview shortcut, followed by `http://127.0.0.1:3010/screeners`. The private browser can exercise the screening and saved-screen flows without provider credentials. Live chart/news output, market-hour coverage and staged collector-to-Platform delivery need separate qualification.
- Focused evidence covers Eastern sessions and early close, stale quotes, invalid filters and unknown-input coverage. Desktop browser exercised presets, pagination, sorting, drafts, views, column sets, explanation, set-default, duplicate, rename, delete and custom scope. Mobile widths of 320 and 390 pixels and 844-pixel landscape fit without page overflow. The protected mutation and unknown-run checks passed. `/screeners`, Help and `/scanners` returned HTTP 200 from the isolated loopback service.
- Repository dashboard architecture guard reported five failures in existing shared layout, shell, feature help, configured routes and gainers code. It did not name a new Screener file. Full-repository TypeScript exhausted the default Node heap in this mixed workspace. The focused TypeScript check, targeted ESLint and four screener contract tests passed.
- Integration requires the existing Scanner route split, Alpaca chart/calendar and scanner listing source from the integration checkout. Bring the feature changes over with a narrow allowlist and overlay the Screeners navigation and Help entries on the installed route split. Confirm the prepared-snapshot delivery path and no regressions in staged scanner and chart workloads, then get normal owner review before release.
