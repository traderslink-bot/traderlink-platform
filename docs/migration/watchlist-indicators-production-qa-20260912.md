# Watchlist Indicators Production QA — 2026-09-12

Status: **Executed; acceptance not passed.** Two functional recovery findings remain. No feature fixes or additional deployment performed in this QA run.

Correction follow-up: Owner subsequently authorized fixing, deploying and retesting. F1/F2 are now corrected locally with focused regression checks (90 history, 84 refresh/recovery, 24 audit, 25 refresh-route and 14 member-route assertions plus strict types). The original QA record below remains unchanged as before-fix evidence; hosted post-fix results will be recorded separately. No claim of production correction yet.

Controlling [plan](watchlist-deterministic-indicators-plan.md) and [progress](watchlist-deterministic-indicators-progress.md).

## Deployment under test

- Coordinator reported Platform `7aa9c2ca0bbaa32822bafe520dabfa6277294e51`, parent `2a40e87b964574f1b525f3f3f1cb8fce7f24468a`, Railway deployment `5a1e780f-eede-4722-863e-b81798029a25` successful.
- Supporting runtime `5a2ba66961775a6c8a3fb6ffd93209ddcf0a1514`, deployment `f9b37082-e616-4bf2-ab23-78d09ee83d44` successful. Coordinator confirmed one writer/original persistent volumes and health. No migration added.
- Owner explicitly authorized closed-market production tests, including adding/publishing Friday tickers as needed. This thread owned the test state; Coordinator performed no concurrent mutations.

## Safe test procedure and restoration

- Initial public Watchlist had zero active tickers. Runtime contained nine active, review-held Friday entries.
- Current review approval sends both website and Discord; there is no separate Discord-off UI switch. Therefore **the normal approval/send action was not tested or invoked**. No existing draft was approved or edited.
- Used the existing authenticated website publisher API only, with actual runtime activation timestamps and last observed prices. Temporary Company Info copy explicitly identified a closed-market indicator test, not a new analysis. No invented analysis/levels or Discord thread IDs were supplied. AI cards and potential-gain display were hidden for these test entries.
- `verify-watchlist-indicator-public-acceptance.cjs` keeps a private pre-test restoration snapshot in the existing container's temporary storage; DB access is read-only and all state mutations go through the running application's normal publisher API. It contains no credentials and has a date/explicit-mode/target allowlist guard.
- After testing, all nine public test entries were deactivated. Original card objects and original `firstPostedAt` values were restored and asserted. Previously absent symbols have empty inactive records, not active test entries. The private baseline backup remains available; no historical database rows were deleted.
- Browser verified public count returned to **0**, all nine review statuses unchanged, Review before publishing on, Automatic AI updates off. No runtime settings, runtime entries, saved analyses or Discord configuration changed. Temporary viewport override reset. Owner's original browser form was not navigated or overwritten.

## All-ticker production results

| Ticker | 1m | 5m | 15m | Daily |
| --- | --- | --- | --- | --- |
| TRUG | Moomoo | Moomoo | Moomoo | Moomoo |
| TNON | Moomoo | Moomoo | Moomoo | Moomoo |
| AENT | Moomoo | Moomoo | Moomoo | Yahoo |
| FTFT | Moomoo | Moomoo | Missing | Yahoo |
| FEIM | Moomoo | Moomoo | Missing | Yahoo |
| BDRX | Moomoo | Moomoo | Missing | Yahoo |
| SURG | Moomoo | Moomoo | Missing | Yahoo |
| SXTC | Moomoo | Missing | Missing | Yahoo |
| PCLA | Moomoo | Missing | Missing | Yahoo |

- 28/36 timeframe calculations available; **3 fully populated tickers and 6 partial**. Missing frames remained blank, not fabricated.
- Available native histories: 960 one-minute bars, 768 five-minute bars, 576 fifteen-minute bars; 174 Daily bars inside verified calendar coverage. Intraday timestamps end Friday 8 PM ET; Daily ends Friday 4 PM ET.
- All nine calculation snapshots retained. Independent batch checks against the **actual saved production inputs/results** passed **121 comparisons**: EMA9/20, RSI14, ATR14 for 28 frames, plus nine HLC3-volume session VWAP comparisons. This establishes arithmetic parity, not full external chart-reference parity or market-open behaviour.
- Runtime made **67 distinct provider transport requests** during initial warm-up. At final inspection, 54 audit records contained the same 67 requests: 3 published, 6 partial, 9 cache hits, 36 session-closed decisions. Viewing multiple ticker pages and subsequent scheduled calls did not increase that provider count.
- Two additional isolated Yahoo diagnostic requests were made outside the app coordinator, specifically to explain rejected intraday responses. They are not represented as app audit requests.
- **Zero OpenAI requests and zero Discord calls from the test workflow.**

## Findings

### F1 — Yahoo rejects all historical candles because of an appended quote

Severity: functional fallback failure; correction required.

`parseYahooIndicatorPage` in `indicator-history-provider.ts` applies minute-alignment validation to every response point. Live FEIM 5m and 15m responses both returned HTTP 200, America/New_York, and usable historical candles, followed by one trailing point at timestamp `1789171120` (Friday 19:58:40 ET), OHLC all `87.2`, volume `0`. This trailing seconds-level quote fails the candle parser, causing the entire response to become `invalid_data`.

Bounded diagnostics: 483 five-minute points and 333 fifteen-minute points, each with exactly one detected invalid point. This directly explains the observed FEIM fallback failure; other failed symbols need the same post-fix matrix verification, not assumption.

Proposed correction: distinguish a provider-appended trailing quote from completed timeframe candles; exclude that quote without shifting its timestamp, manufacturing OHLC or silently accepting malformed historical candles. Preserve explicit excluded-point evidence and strict validation of the retained candle series. Add actual-response-shaped regression fixtures.

### F2 — Failed closed-market warm-up is never retried

Severity: recovery failure; correction required.

`IndicatorRefreshService.refresh()` unconditionally sets `ticker.closedBoundary` in `finally`, even when `perform()` produced a partial result. Subsequent two-minute calls record `session_closed` and cannot recover missing frames until a different session boundary/activation/process state. Live audit proves six partial tickers stayed partial across later scheduled cycles.

Proposed correction: retain successful frames and add a bounded, delayed closed-session recovery policy for missing/failed frames. Do not fetch every successful frame repeatedly or create perpetual weekend polling. Mark a completed closed boundary separately from an exhausted/failed attempt.

### Additional follow-up observations

- Moomoo returned provider errors during the simultaneous nine-ticker warm-up. The sanitized audit does not retain the vendor return code and successful HTTP-envelope status consistently, so **rate limiting is not proven**. Preserve the numeric vendor code/status and assess shared burst spacing/cooldown with bounded tests before labeling the cause.
- VWAP copy says "Live price" and "today's VWAP" on Saturday while the timestamp correctly identifies Friday. Prefer neutral "latest price" and "session VWAP" wording; no extra stale-data notice is needed.
- No changes to the Analysis template, article logic, Potential Path ATR or unrelated existing notice/layout work were made.

## Browser and access checks

- All nine member ticker routes displayed the Indicators card and the actual available cached values.
- TRUG 1m/5m/15m/Daily tabs change values appropriately; chosen 5m selection persisted across subsequent ticker navigations. Per-frame timestamps match the completed session. Provider names remain admin-only.
- Desktop and 390px mobile card and admin menu/audit layouts inspected; no horizontal document overflow (390px viewport, 375px document width). Mobile summary tiles wrap their timestamps; no hidden timeframe controls.
- Unified nine-button admin navigation present. Daily Recaps reachable directly without Usage. No recap generation/save/Discord action executed.
- Indicator Audit expands a record, shows provider/fallback/timeframe/request details, resolves retained calculation export, and paginates from 50 records to the four older records without dropping the initial outcomes.
- Anonymous audit and calculation-export endpoints return concealed 404 with private/no-store; anonymous member Indicators endpoint returns 401 with private/no-store.

## Remaining acceptance

- Correct F1/F2, verify any request-pacing/audit changes, then repeat bounded all-nine hosted recovery acceptance through the serialized Coordinator release lane.
- Normal user add/edit/approve-to-both-destinations was not re-exercised: Indicators tests intentionally avoided Discord and preserved saved review state. This QA must not be cited as a new end-to-end publication-gate test.
- Market-open new-candle updates, real sustained provider capacity and exact chart-reference parity remain separate checks. Do not mark the full feature accepted merely because the market is closed or the application health is good.
