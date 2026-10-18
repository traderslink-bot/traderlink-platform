# Watchlist Trade Setup Detection Third Plan QA

Date: 2026-10-17

Plan: [Revision 3](watchlist-trade-setup-detection-plan.md)

Progress: [Setup detection progress](watchlist-trade-setup-detection-progress.md)

Previous reviews: [First QA](watchlist-trade-setup-detection-qa-2026-10-17.md), [Second QA](watchlist-trade-setup-detection-qa-round2-2026-10-17.md).

## Result

The revised plan reuses existing compatible Moomoo data before additional acquisition, has one Watchlist feed owner, and accounts for combined same-IP WebAPI traffic. All seven setup definitions and all eight earlier specification corrections remain intact. No unresolved blocking document contradictions were found after the corrections below. This is a plan/source consistency review, not an executed detector, provider-capacity or delivery test.

The owner confirms a free Moomoo account using OpenAPI with OAuth, not OpenD. The plan does not introduce second-by-second polling, assume a paid tier or use old OpenD quotas. The 750 ms minimum between request starts is a transport safeguard, not an instruction to send requests at that frequency. Ordinary work is spread across its due interval and reuses existing updates first.

Reviewed plan SHA-256: `b03bbcc13ae9135d95aed1cebfb9f25e04ff7d00f84770c5f1c78580e32de3bd`.

Preserved first-QA SHA-256: `edc013e1af128f601ac607ce6ffb0c5002ef015031ba7014b4aed4639e4f59ff`.

Preserved second-QA SHA-256: `424d4e7e1de77d5fde7d297a67e0ea51851954c6b6128add191f59c7ac51ab18`.

## Source and documentation evidence

- Existing local runtime `manual-watchlist-runtime-manager.ts` selects a 120-second poll when the Platform indicator loader is present. `platform-watchlist-indicator-loader.ts` calls the authorized refresh relay and accepts the shared 5m result.
- Platform `indicator-refresh-service.ts` independently enforces the 120-second whole-refresh cache. `indicator-refresh-runtime.ts` reuses pending operations but exposes shared raw candles for 5m only. New shared 1m access must be implemented, not assumed.
- `indicator-history-provider.ts` builds actual WebAPI history URLs with date ranges and filters accepted rows afterward. A two-minute local correction window is not proof the network returned only two candles. Exact-URL in-flight deduplication exists; durable reusable coverage and superset joining still need implementation.
- `indicator-request-coordinator.ts` admits two concurrent transports within that instance, records attempts and rate-limit backoff, but does not establish a same-IP rolling cap across Analyzer, AI, quotes and other callers.
- `moomoo-connection-access-service.ts` reuses unexpired access tokens. The inspected class does not itself define a concurrent refresh lock, so the plan now calls for reconciling wrappers before adding a minimal shared refresh lock where absent.
- [Current WebAPI rate-limit documentation](https://open.moomoo.com/api/overview/rate-limit) states 100 requests/minute from the same IP. The [OAuth/API host guide](https://open.moomoo.com/api/overview/getting-started) and [history endpoint](https://open.moomoo.com/api/quote/basic-data/history-kline) match the inspected HTTP transport. These pages do not establish this free account's effective per-endpoint allowance or a mandatory half-second interval. Checked on 2026-10-17; no authenticated API request was made.

These are working-tree and public documentation findings, not verification of deployed code, outbound IP topology, live connection quality or current production request counts. Worktree HEAD remains `e718689bfef3bcbd2c966567e913dfd0638437db`; unrelated dirty/untracked work is preserved.

## Corrections checked

| Concern | Controlling correction | Review result |
| --- | --- | --- |
| Seven detectors duplicating requests | All seven read the same accepted evidence; no detector/browser owns provider transport | Coherent at specification level |
| Existing Indicators plus new feed | One acquisition owner; old runtime trigger joins demand; due Indicators reuse faster compatible results | No parallel old/new fetching required |
| Different logical windows, same HTTP page | Normalize actual endpoint/query/body/cursor and authorized scope; retain accepted coverage and slice locally | Avoids duplicate date-page calls without falsely reusing a stale current page |
| Cache coverage hides gaps or leaks scope | Use actual interval/gap/freshness records, immutable slices and separate authorization/publication checks | First/last timestamps alone cannot prove coverage |
| Wrong provider quota | Current HTTP OAuth connection only; general 100/minute IP ceiling distinguished from unknown free-account/endpoint behavior | No OpenD quota or pagination exemption applied |
| Half-second pacing | `60 / 0.5 = 120` starts/minute; conservative 750 ms spacing plus 80 starts/rolling minute | Arithmetic coherent; defaults are not measured account limits |
| Multiple features/accounts/processes | Same-egress ledger, disjoint transport-ID count sets, separate credential/cache scope, minimal transport hooks and explicit unknown callers | No double-counting a shared request or false claim of a global limit from a Watchlist-only coordinator |
| Retry/authentication/cancellation gaps | Count actual pages, retries, token refresh and timed-out starts; queue outside HTTP timeout; detach only the canceled consumer | No detector retry multiplier or duplicate refresh after relay timeout |
| Shared cooldown/restart | Ambiguous HTTP 429 cools down the egress group; preserve ledger/cooldown; no idle/restart burst | No fresh allowance from a new token, process or ticker |
| Existing owner work or stale alerts | Existing foreground work takes priority; new setup work yields; retain true candle/receipt times | No new publication restriction or stale catch-up notifications |

Follow-up corrections during this review made five boundaries explicit: sparse cache coverage cannot be inferred from endpoints alone; a shared relay timeout does not own every consumer's transport; an authentication refresh cannot wait while holding its own data-call slot; an ambiguous HTTP 429 is not only a ticker/token cooldown; clock/restart changes cannot reset the rate ledger. These changes are in the plan, not application code.

## All seven setup review

| Setup | Reuse and timing checked | Result |
| --- | --- | --- |
| VWAP Reclaim and Hold | Same accepted minute history, independent regular/day coverage, contemporaneous anchor, real reclaim then later hold | Retained; shared cache cannot fill unknown gaps or create an extra volume request |
| EMA9 Pullback and Bounce | Reused completed 5m EMA9/seed and 1m test/response; start/end as-known values | Retained; no per-EMA polling or future 5m value projected backward |
| EMA20 Pullback and Bounce | Same 5m source as EMA9, independent EMA20 sequence and constituent state | Retained; a second calculation does not require a second candle request |
| Higher Low Reversal | Shared chronological 1m swings plus available 5m context | Retained; cache receipt and historical pivot availability stay separate |
| Premarket High Breakout and Retest | Reused accepted premarket range/verified field, frozen anchor and later regular-session retest | Retained; no extra quote call or invented complete high required |
| Bull Flag or Momentum Consolidation Breakout | Shared 1m and coherent native/derived 5m windows, exact prior-fit trigger, real elapsed time | Both frame variants retained; queued late evidence cannot become a current trigger |
| Falling Wedge or Descending Pullback Breakout | Same windows and causal pivots, bounded fits, prior coefficients and independent volume | Both frame variants retained; geometry adds calculations rather than provider requests |

Price/volume independence, failure/expiry, stable grouping, two-event notification defaults, private/Premium access, all seven families and per-family/variant real holdout requirements are unchanged.

## Desk scenarios

The following are specification walkthroughs, not executed tests:

1. Indicators and seven enabled detectors need the same current minute. One compatible cache hit or one in-flight HTTP page supplies them; the transport ledger counts zero or one respectively, not eight.
2. Two callers ask for different millisecond slices that serialize to the same current-day URL. One accepted page supplies both slices. The following newly completed minute can legitimately require another request with the same URL.
3. Accepted data spans a missing interval. The cache reports the gap; it does not fabricate no-trade bars or make an incomplete minute aggregate a full native-equivalent 5m candle.
4. A relay times out while a shared request is queued/running. That caller detaches; other remaining demand keeps the same job, and a repeated caller rejoins instead of starting another transport.
5. Setup demand and a foreground Analyzer request share egress. Foreground work wins the next available slot; setup history yields. One account/token does not get a second IP allowance.
6. The rolling ledger contains 80 recent actual starts. A new call waits until both the conservative rolling boundary and start spacing permit it. A retry, failed send or OAuth refresh is not free; a cache hit is.
7. One ticker receives an HTTP 429 with no verified narrower scope. The same egress cooldown also prevents other setup tickers from immediately retrying through another feature coordinator.
8. A process restarts or wall clock moves. Restored recent starts/cooldown prevent a burst; absent state does not become a claimed empty budget. A delayed input outside alert freshness remains audit/history.
9. Setup Detection is disabled while Indicators remain enabled. Only setup demand is removed. Hiding both removes both consumers; neither detector count nor member page views create requests.
10. A 20-ticker, one-page minute feed would contribute about 20 requests/minute, with about four more on average if native 5m is additionally required every five minutes. Other feature traffic, auth, pages, retries and actual byte volume must still be added; this is not a production capacity result or an incremental-load claim.

## Verification boundary

Completed: revised full-plan consistency review, all-seven dependency/lifecycle re-review, current local source inspection, public documentation check, arithmetic/edge walkthroughs, Markdown link checks, whitespace checks and prior-QA hash preservation.

Remaining implementation acceptance: actual shared cache/admission code, trace of same-egress callers, observed free-account responses/headers, measured combined traffic and latency, saved-data scheduling checks, chronological detector replay, real held-out chart review, approved UI and optional private delivery. The owner is not being asked to perform technical data checks.

No application test suite, Vitest, local server/build, Moomoo/API or paid AI call, live analysis change, post, service restart, commit, push or deployment occurred. Only the plan, progress record and this new QA report were edited for this revision.
