# Watchlist Indicators Production QA — 2026-09-12

Status: **F1/F2 corrections deployed and closed-market retest passed.** The initial failed run below remains historical evidence. Full-feature market-open and external chart-reference checks remain open.

## Post-correction production retest

- Local fix: `f64bc1c22956228e1233d1273f1a71f03c80238b`. Published by Coordinator on `main`: `f97ab1ceecf30c411d605f1dd5ed3af31246dead`, parent `7aa9c2ca0bbaa32822bafe520dabfa6277294e51`.
- Railway deployment `48e17688-049d-40c9-a9df-db7cd783ad1d` SUCCESS; Coordinator verified one RUNNING writer, correct volume and 119 unchanged migrations. Independent production health returned 200, ready, sqlite_single_node, migrationCount 119. Supporting runtime unchanged.
- All-nine test started approximately 3:02 PM ET, using the same owner-authorized website-only method. Separate private postfix backup preserves the earlier test backup. Acceptance helper filters audit records to this run's start; old records are not counted as new success.

| Ticker | 1m | 5m | 15m | Daily | Numerical checks |
| --- | --- | --- | --- | --- | --- |
| TRUG | Moomoo | Moomoo | Yahoo | Yahoo | 17 passed |
| TNON | Moomoo | Moomoo | Yahoo | Yahoo | 17 passed |
| AENT | Moomoo | Moomoo | Moomoo, delayed recovery | Yahoo | 17 passed |
| FTFT | Moomoo | Moomoo | Moomoo | Yahoo | 17 passed |
| FEIM | Moomoo | Moomoo | Moomoo | Yahoo | 17 passed |
| BDRX | Moomoo | Moomoo | Moomoo | Yahoo | 17 passed |
| SURG | Moomoo | Moomoo | Yahoo | Yahoo | 17 passed |
| SXTC | Moomoo | Moomoo | Yahoo | Yahoo | 17 passed |
| PCLA | Moomoo | Moomoo | Yahoo | Yahoo | 17 passed |

- **36/36 available frames; 153 numerical comparisons passed** against retained actual inputs (EMA9/20, RSI14, ATR14 plus each ticker's HLC3-volume VWAP). Persisted valid pre-deployment calculations were restored where applicable, not misreported as a cold rebuild. Intraday ends Friday 8 PM ET; Daily ends Friday 4 PM ET.
- **F1 hosted proof:** TRUG/TNON/SURG/SXTC/PCLA Yahoo 15m fallback each excluded exactly one terminal quote and retained 510/504/533/472/394 actual candles respectively. Strict malformed-row regression checks also remain passing.
- **F2 hosted proof:** AENT's initial 15m recheck returned Moomoo provider_error/Yahoo pagination_unconfirmed and retained its valid earlier 15m result. At 3:05 PM ET the normal scheduled cycle retried only that frame successfully with Moomoo; 1m/5m/Daily each recorded `cached_closed_frame`. Eight other tickers recorded `session_closed`. This is actual deployed recovery, not a forced provider outage or fabricated fixture. The further ten-minute retry/exhaustion branch is covered by focused deterministic tests, not forced on production.
- Final arithmetic audit checkpoint: 36 records, 70 distinct transport requests (69 initial, exactly one recovery), 10 published, 10 cache_hit, 16 session_closed. Later scheduled no-fetch decisions may add metadata without provider requests.
- Member pages for all nine show populated cards; all four TRUG tabs switch outputs and timestamps, saved timeframe selection persists across ticker navigation. Provider identities remain admin-only. Mobile 390px has no document overflow; indicator tabs and summaries visible. Viewport restored afterward. One full-page screenshot timed out; normal viewport screenshot succeeded, no app failure inferred.
- Admin has the unified nine-section navigation, directly reachable Daily Recaps, expanded Yahoo fallback evidence and retained calculation export. Older refreshes correctly pages to older records with counts scoped to the displayed page; it does not append indefinitely. This clarifies the earlier run's pagination wording.
- Anonymous audit and actual calculation export returned concealed 404/private-no-store; anonymous member indicator endpoint returned 401/private-no-store.
- Add/Activate is enabled and activation counters are zero. Nine existing review statuses and generation controls remain intact. No normal edit/save/approve/Discord operation performed. A browser-tool iframe-targeting limitation prevented a new preview-interaction verification; do not claim the preview was re-tested successfully.
- **Cleanup passed:** all nine restored inactive with original card objects and `firstPostedAt` asserted against the private baseline. Public browser shows 0 active. Review-before-publishing remains checked; automatic AI updates remains unchecked; today's AI spend remains $0.0000. Seven drafts ready, TRUG previous-version fallback and SURG held failure unchanged. No runtime settings or Discord calls, no AI requests, no original owner-tab navigation.
- Remaining nonblocking observations: existing weekend VWAP wording and limited Moomoo vendor-error diagnostics, existing ticker-bottom notice work outside this correction. Market-open new-candle/capacity behaviour, independent external chart-reference parity and a new normal two-destination approval test are not established by this run.

## Historical initial run and local correction checkpoint

Before deployment, owner-authorized F1/F2 corrections passed focused regression checks (90 history, 84 refresh/recovery, 24 audit, 25 refresh-route and 14 member-route assertions plus strict types). The original failed QA record below remains as before-fix evidence; its outstanding F1/F2 items are superseded by the successful post-correction retest above.

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
