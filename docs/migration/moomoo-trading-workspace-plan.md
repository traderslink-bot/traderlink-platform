# Broker-connected Trading Workspace

**Status** · Local candidate verified November 24, 2026 Eastern in `codex/moomoo-trading-workspace-20261124` on published base `756a2e045`. **Connected Workspace** and `/trading-workspace/broker` are the review label and route.

## Two pages with the same workspace

- The current Trading Workspace stays at `/trading-workspace` with its current data flow, access and behavior. The standalone Scanner continues to run the full-universe scans and own the preset and saved-scan catalogue.
- The broker-connected workspace gets its own page and navigation entry. Both pages render the same Trading Workspace components and use the same layout, cards, saved-scan selection, Market Events, company details, charts, indicators, drawers and controls. A change to a shared component reaches both pages.
- The new page selects a Moomoo live market-data adapter. The current page keeps its existing adapter as the default. Keep provider selection at the workspace's data boundary so individual cards and charts can use the same presentation and calculation code.

## Owner review and release options

The current Workspace starts in its existing two-account review mode. The new page starts off and can be enabled for those same two accounts. You can preview both before choosing which data mode to offer to all signed-in TraderLink users.

| Owner's rollout choice | What members can open |
| --- | --- |
| Current providers | The existing Trading Workspace using TraderLink's current providers. |
| Moomoo | The broker-connected Workspace. Members use their own Moomoo connection or are directed to the existing connection flow in User Settings. |
| Both | Both workspace pages, with their respective data sources. |

Give the owner independent admin audience controls for both pages so the rollout choice can be made or changed without a code change or redeploy. When a page is outside the member rollout, it can stay available to the two review accounts. The broker page can also be turned off entirely. Enforce the selected audience on the server before opening feeds or serving chart data, and use the same access decision for navigation. Resolve the data source from the authorized route. Close active streams when access to their page is withdrawn.

## Existing code to carry forward

- The November 24 Scanner fix candidate `756a2e045` shows `/trading-workspace` as a thin access-checked entry point to `LiveScreenersClient`. Extract or reuse a shared workspace entry at the current integration baseline and preserve the existing page's server-side access check and default data source. Keep the broker page independent of Watchlist admission and billing.
- **User Settings → Trading** (`/account/trading`) already provides the Moomoo connection flow and a server-side connection repository. Reuse the current user's saved connection and verify active `quote:read` access, including after token refresh. Keep refresh and credential handling in the existing connection service. [Moomoo Direct Connection Plan](moomoo-direct-connection-plan.md)
- In `756a2e045`, the existing Moomoo chart history bridge and WebSocket resolve a shared Watchlist credential. Reuse compatible candle parsing, session logic and chart rendering. The new mode needs account-scoped quote, history, indicator seed and streaming inputs. Key its stream and caches by TraderLink account and active connection, as well as symbol and applicable session, timeframe and adjustment. On disconnect, reconnection to a different broker account or loss of access, stop serving data from the old connection.

## Where the data comes from

The Moomoo page still uses TraderLink's shared Scanner, news, halt, and company services. Switching pages selects the source for member-facing live market data. Each shared service keeps its normal source, subject to the display rights for the fields sent to members.

| Workspace content | Broker-connected page |
| --- | --- |
| Scanner card matches, ordering and detection time | Keep the existing server-side Scanner and its current Alpaca inputs. Use the same ordered ticker matches for the same scan and snapshot. Send permitted ticker symbols, ordering, and match labels or timestamps. Publish recorded trigger prices, levels and candles only where their source allows that display. Keep private preset values and saved filters subject to the same access rules. The user's Moomoo connection fetches market data for the resulting symbols. |
| Live price and gains | Use Moomoo quotes and the previous close or other reference required by the existing formula on the same price and split basis. Keep the Scanner's match time and the Moomoo reading's timestamp separate. Live values can differ from the other page because the feeds update at different times or see different trades. |
| Bid, ask and spread | Use the best bid and ask returned by Moomoo's order-book feed where needed and authorized. Compute spread from those two sides. A last trade cannot substitute for either side. |
| Volume and indicators | Carry premarket volume into Day Vol through regular trading and keep after-hours volume on its own basis, using the same approved session definitions. Check how Moomoo reports each session's cumulative volume before summing. RVOL, VWAP and candle-based signals shown as live readings use covered Moomoo inputs and the existing formulas, including comparable historical inputs where required. Preserve sparse but covered trade history. Show unavailable when inputs or coverage are unknown. |
| Charts | Use the shared renderer with the connected user's Moomoo live candles and authorized history. Keep a subscription while its chart is open even if the ticker leaves the scan. Preserve timeframe, sessions, split adjustment and drawer reopening. Use the shared aggregation of covered Moomoo minute bars when Moomoo's native intervals or session boundaries differ. Merge REST history and WebSocket updates on the same time and split basis, and handle completed-bar corrections and reconnect catch-up. Keep the original trigger evidence source identifiable when it differs from the Moomoo chart. |
| Press releases and news | Reuse the current TraderLink ingestion and Market Events service, including its headline and article drawer behavior. This feed is independent of the user's broker connection. |
| Halts and resumptions | Reuse the shared halt service. In the reviewed candidate it can use official Nasdaq and NYSE halt feeds or Alpaca SIP trading-status events with official schedules. Apply the permissions for the configured source before showing its events to members. The exchange halt feeds have their own terms. [Nasdaq halt feed](https://beta.nasdaqtrader.com/Trader.aspx?id=TradeHaltRSS) · [Alpaca stock stream](https://docs.alpaca.markets/us/v1.1/docs/real-time-stock-pricing-data) |
| Trading calendar, listing metadata and corporate actions | Reuse eligible non-price data already consumed from Alpaca, such as trading days and early closes, symbol and exchange information, and split events. Use the calendar for session math and split metadata to verify the price basis. Apply any split factor once and preserve the Moomoo candle adjustment basis. [Alpaca calendar](https://docs.alpaca.markets/us/v1.1/reference/getcalendar-1) · [Alpaca assets](https://docs.alpaca.markets/us/reference/get-v2-assets-symbol_or_asset_id) · [Alpaca corporate actions](https://docs.alpaca.markets/us/reference/corporateactions-1) |
| Company profile, filings and float | Reuse the shared Company Details service. The reviewed code uses the Finnhub profile and metrics gateway and SEC EDGAR for filings and reported financials. Scanner already uses Finnhub for listing and float enrichment where those values are available. Preserve any active Yahoo company profile input. Yahoo appears in preview samples in the reviewed drawer code, so verify its production role before assigning specific live fields to it. |
| Company Details price-based stats | The shared drawer also requests Alpaca technical data in the reviewed source. Route price-based fields rendered in the Moomoo page, including bid/ask, Day Vol, session levels, VWAP, RVOL and the 52-week range, through the Moomoo adapter or an explicitly permitted historical source as appropriate. Keep the company facts visible when the broker connection is unavailable. |

If a Moomoo reading is unavailable, delayed or stale, show the appropriate state and timestamp for that reading. Avoid silently filling it from the existing workspace's live feed. Older history from a shared licensed archive can be considered separately from this live-data mode.

Record the source and member-display permission for each shared field before opening access broadly. API access, a calculation, or a cached value alone does not establish the right to display the underlying feed or a substitute. Use Moomoo for member-facing live prices, trades, bid/ask, volume and live candles. Use the rights applicable to TraderLink's agreements for optional Alpaca or other shared data and Scanner evidence. Keep the private two-account review and the later member rollout as separate access states. [Alpaca redistribution guidance](https://alpaca.markets/support/redistribute-alpaca-api)

## Connection and live updates

1. Use the existing settings action when a user needs to connect or reconnect. Keep OAuth credentials server-side. Board and chart requests must use the same account and connection scope that was authorized for the page.
2. Default card market data to Moomoo's OAuth-authenticated quote WebSocket. In that mode, share subscriptions across cards and update them as the combined card list changes. Open charts use live WebSocket updates in either card mode. Reuse subscriptions across that member's active tabs where practical. [Moomoo WebSocket authentication](https://open.moomoo.com/api/quote/push/auth) · [Moomoo subscription API](https://open.moomoo.com/api/quote/push/subscribe)
3. The existing Scanner determines when a new match enters or leaves a card. On reconnect, use bounded backoff, refresh authorization as needed and restore the current subscriptions. Recover missing quote or chart data with bounded Moomoo REST reads through the existing request budget where configured. Release unused subscriptions when cards, charts or the workspace close. Keep working subscriptions active if a new symbol or data type is unavailable.
4. Count actual subscription keys for card quotes, order books and open chart candles. Moomoo accounts for these by user across connections, and a candle key includes the period and adjustment. Batch changes and test any quota response without repeatedly retrying it. Use the real subscription footprint and observed limits from review. [Moomoo WebSocket rates and quotas](https://open.moomoo.com/api/quote/push/rate-limit)
5. Treat one to two seconds as a target for **Live** mode. Record Scanner snapshot age, time from receipt of a new match to its first usable Moomoo quote, and time from receipt of a Moomoo update to card or chart paint. For timed card refresh, record the selected interval and the actual time to display. Track provider timestamps and receipt timestamps to account for feed delay and quiet symbols separately. Report median and 95th-percentile times for a busy session, including both accounts active and one account opening multiple views.

### Trading Workspace Admin

Place these controls on the owner-only **Trading Workspace Admin** page at `/admin/trading-workspace`, alongside Scanner Admin under Trading Tools. Use the same page for the rollout audience controls. Members manage their own Moomoo connection in User Settings.

| Owner setting | Default and behavior |
| --- | --- |
| **Moomoo card data source** | **WebSocket** by default. Select **REST polling** to use the retained snapshot batching for card market data. Switch back at any time. |
| **Card refresh** | **Live** by default. Publish when new data arrives from the selected transport, or choose a custom interval in seconds to recalculate and publish changed card readings together using the latest received values. |
| **REST symbols per batch** | **400** by default for the retained snapshot code. Allow smaller batches and validate against the supported endpoint limit. |
| **REST time between batch starts** | **1.5 seconds** by default. The next batch starts after both the spacing and the prior response allow it. |
| **REST wait after each pass** | **5 seconds** by default. Start this wait when the last batch finishes. |

Show the REST timing inputs when REST is selected and retain their values when switching back to WebSocket. Save and apply changes without a redeploy. Keep charts live and the current Trading Workspace on its existing schedule. Scanner match membership, Market Events and connection status continue on their own update paths.

### Retained Moomoo REST polling

The earlier Moomoo Scanner path remains in `src/modules/scanner/live/server/runtime.ts` and `live-feed.ts`. It sends HTTP snapshot requests in batches of up to 400 symbols, spaces batch starts 1.5 seconds apart by default, and waits five seconds after a finished pass before starting the next one. The related Screeners timing fixture records 6.75 seconds between the start of two passes with two batches and 250 ms replies. The full-universe cadence depends on the number of batches, response time, configured spacing and shared request budget. The fixture does not establish the historical production timing. [Existing provider-switching plan](stock-screeners-provider-switching.md)

Reuse the retained batching and pacing logic in the new page's REST mode. Build one list of tickers across that member's active cards, and use the member's credential and existing request-budget controls. The budget can defer requests beyond the configured times to respect provider limits. On a mode change, cancel or drain the previous card feed and ignore late results from it. Keep active chart subscriptions running. Record request starts per minute and quote age for the chosen pacing.

## Review and acceptance

- On one integrated candidate, compare both pages for the same scan revision and snapshot with a preset and a saved scan. Verify ordered matches, settings, layouts, card and chart actions, and Market Events. Exercise the current workspace with the toggle off and with Moomoo disconnected. Run the comparison with Watchlist off and without a paid-plan requirement.
- Verify shared headlines, permitted halt events, company profile and filings are usable independently of the Moomoo connection. Check the Moomoo page's card, chart, Company Details and evidence responses for their intended data source, including when a Moomoo quote or candle is missing. Confirm the split basis and session calendar agree across those views.
- Exercise the owner-only admin controls with Watchlist off. Switch WebSocket → REST → WebSocket while the workspace is open and verify the active transport, saved REST values, custom batch size and both timing inputs. Check budget deferral, slow replies, late packets after a switch and whether each member's cards share a single polling pass. Exercise Live → 3 seconds → another interval → Live. Verify the preference persists and charts continue streaming throughout, with the current Workspace and retained Scanner keeping their existing cadence.
- Check the two review accounts, an unlisted signed-in account and a signed-out session in the initial review state and each of the three rollout choices. Verify navigation, direct page and API access, and closure of active streams on access withdrawal. For the Moomoo options, check both connected and unconnected users. Test account isolation for quotes, chart history and streams, including a shared symbol opened simultaneously with two Moomoo connections. Cover missing permission, expired connection, OAuth refresh, reconnect and disconnect.
- During active trading, use fast-moving nano- and micro-cap names across premarket, regular and post-market. Verify price, spread, volume across the opening and closing bells, and RVOL where history is sufficient. Check thin trading, a missing quote, a split-adjusted history seam, and chart catch-up after a disconnect. Confirm a ticker on two cards uses one subscription per required data type and an open chart keeps updating when its ticker leaves a card. Record entitlement gaps by field and session for each test account. [Moomoo push data fields and permissions](https://open.moomoo.com/api/quote/push/data-format)
- Verify desktop and phone layouts, including chart, news and details drawers and chart reopening. Capture startup, scroll and update responsiveness while data arrives. Run deterministic access and data checks before live account acceptance. Update the Trading Workspace and connection Help Center guidance when the new page is ready for its intended audience.

Scanner owns match delivery. Trading Workspace owns the shared page and cards. Charts owns the shared chart integration. The Release Coordinator handles source integration and release after owner approval.

## Implementation checkpoint

- The existing Trading Workspace and Connected Workspace render the shared layout. The connected board uses the current Scanner for built-in and saved-scan matches and subscribes to Moomoo quotes for active cards. Shared news, halts and company facts retain their existing sources. Broker access alone opens the workspace's shared company facts and chart settings. Live market reads use the connected account's authorization.
- Trading Workspace Admin includes separate audiences and the card transport, publishing interval and REST pacing controls. Connected Workspace starts off. Chart streams stay live when the card transport or publishing interval changes.
- Company technicals and compact card indicators use the connected member's Moomoo candles. Original Scanner trigger prices and generated Levels maps are withheld in the connected page. The existing Levels service generates its maps from its own market inputs. Broker-based map generation needs a compatible Levels input before it can appear on this page.
- The focused suite passed 156 tests across 19 files. It covered rollout and owner settings, account isolation, compact indicators, same-time RVOL, transport changes, saved scans, chart and company reads, and the route inventory. Scoped TypeScript passed on all 77 changed TypeScript modules. ESLint matched the published dashboard shell's three existing errors and two warnings and reported no other findings. The checks used the linked VPS dependencies.
- The chart browser fixture verified source separation, a simulated card setting switch while a chart stream stayed open, and clearing the chart on disconnect. Two-account live Moomoo review, measurements across session changes, and desktop and phone review remain open.

## QA of candidate `42b2c341a`

| Area | Finding from source and provider contract review |
| --- | --- |
| Default card feed | The original WebSocket client only waited for pushes. Quiet or halted tickers could have no starting quote. A later quote without a premarket block discarded the known premarket volume. A clean REST response containing zero usable rows could report Ready. |
| Subscription recovery | A disconnected WebSocket did not request same-session catch-up. A queued REST request could wait for the shared budget after its transport had already been aborted. A waiting lower-priority request could also block the existing Scanner queue. |
| Chart session and authorization | The quote stream used 16:00 and 20:00 on every market day. It ignored provider rejection of a WebSocket credential refresh. |
| Owner rollout | In legacy standard mode, saving Review accounts could keep the original Workspace open to legacy configured subjects outside the review roster. |
| Company Details | The 52-week stats path used returned daily bars without requiring complete coverage, current split basis, and the selected adjustment. |
| Live and product acceptance | Active-market entitlement, provider timestamps and counters, latency, application browser parity, and physical-phone results need runtime evidence. The broker Levels input remains an open feature dependency. |

### QA retest

- The correction batch passed 200 tests in 22 files. The targeted card transport retest separately checked that a fallback snapshot can show a known quote without hiding a rejected WebSocket subscription. The checks used synthetic sessions, broker responses and disposable storage.
- Verified same-session WebSocket quote seeding and reconnect catch-up, retained premarket totals, shared request-budget priority and cancellation, early-close and holiday chart behavior, reconnect on failed credential refresh, explicit review-account rollback, access withdrawal during a read, and rejection of incomplete or wrong-basis Company Details history.
- Chromium exercised the actual admin form and shared chart with fixture endpoints at 390×844, 844×390 and 1440×900. Both saves sent the expected values, switching back retained the REST fields, no horizontal overflow was found, and the connected chart retained its stream during the controls test and cleared on disconnect. The original-source portrait control also passed. This was a component fixture, with server route and socket results covered separately.
- Scoped TypeScript passed for the 79 changed TypeScript modules. ESLint reported only the published dashboard shell's existing three errors and two warnings. The initial QA run exposed two fixture setup faults, a real reconnect timer treated as fake and an unset private budget-ledger warmup. The corrected fixtures passed.
- Application-level private review still needs the live session against both review accounts, the actual desktop and phone workflow, and measured Moomoo latency, quota and coverage. Generated Levels remain unavailable through the connected route until its market input is supported by Levels.

### Concurrent chart backend

- The connected user's first live ticker takes the slot. Other tabs on that ticker share its WebSocket and can use the alternate native frame for studies. A different ticker waits for the active viewers to close. A verified reconnect retires the old generation, and reader cancellation, revoked access and closing the last viewer release their stream resources.
- History retains bounded coverage for each account, authorization generation, symbol, native timeframe, adjustment and basis date. Overlapping requests wait for overlapping work and fetch only the uncovered ranges. Verified sparse windows stay sparse. The live minute tail and current Eastern daily candle are fetched fresh. The cache holds raw values and checks current corporate actions before returning adjusted candles.
- HTTP 429 and Moomoo business code `-11` enter the existing REST cooldown. A valid provider Retry-After reaches the private browser request. The WebSocket keeps its own lifecycle.
- Focused verification passed 31 tests across six suites. Scoped TypeScript and ESLint also passed. The tests use independent synthetic connections and controlled provider responses. The signed-in private live check uses the owner's one Moomoo connection from the connected TraderLink login, with the other login open concurrently to verify it receives no account's candles or stream by fallback. Independent live-positive coverage for that second login would require its own Moomoo connection.
