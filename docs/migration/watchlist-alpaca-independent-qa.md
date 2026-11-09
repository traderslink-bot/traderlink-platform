# Watchlist Alpaca independent QA

## November 9 — Potential Path session-high reference

Owner reported that CKX's only resistance kept following its latest HOD. This
slice identifies a mapped intraday/session-high row matching the saved HOD as
"High of day / session reference", including the nearest-level heading and full
ladder. A short notice explains that a new high alone does not establish
resistance and that a retest's reaction matters. Independently mapped daily/4h
resistance is not relabelled; prices and level selection are not changed. The
notice and prices remain concealed under the existing levels access restriction.
Help now documents the HOD distinction, paired automatic price-discovery guard,
durable daily usage cap and review-control loading behavior.

Two focused Vitest files passed, nine tests including card markup, ladder,
historical-level preservation and premium concealment. No production build was
started. Full TypeScript initially exhausted Node's default 2 GiB heap; a bounded
4 GiB rerun completed with eight diagnostics in unchanged scanner test files
(foundation, scroll-styles, live-feed, runtime and snapshot-pacing). Two new card
fixture diagnostics were corrected by supplying its required source field.
Focused TypeScript over the changed card/helper/Help/tests and their imports
passed, as did targeted ESLint. The focused command uses the existing tsconfig
options and Next's global declarations; no config or dependency was changed.
Full-repository TypeScript is not claimed green. Paired Runtime evidence is in docs/watchlist-alpaca-status-qa.md in the
assigned runtime worktree. No live analyses/data/settings or posts were changed.
This is a local source correction, not a deployed or owner-accepted visual claim.

## November 9 follow-up corrections (supersedes old-trade display rule below)

Owner clarified that Not live means the feed is not connected, not that a halted
or thinly traded stock has an old last trade. Runtime now observes actual Alpaca
transport health from existing polls. Platform hides Not live when that feed is
live; when off, actual last-trade time remains unchanged and visible. Individual
quote freshness still controls fixed overnight reference replacement independently
of the note. Potential Path respects both facts. No extra provider requests.
Help updated to match. Fake disconnected/halted/expired/BOATS tests and real
manager tests remain distinct from live halt observation after release.

Owner also requested removing the embedded TradingView chart from ticker detail.
Removed its mount, widget script loader, responsive effects and unused symbol
mapping; no change to other detail cards, access controls or providers. No new
layout, chart replacement or scanner edits. Existing Help contains no TradingView
instructions requiring deletion. A regression prohibits reintroducing its mount
or external embedding script. Sixteen focused Platform tests pass. Component
browser checks pass at 1440/390px with actual row/CSS and synthetic healthy-feed
old trades, no misleading Not live, no overflow and preserved keyboard access;
not authenticated full-page E2E. Focused lint has no errors; one pre-existing
unused helper warning remains. Focused strict TypeScript passed across 1,936
transitive source files. Source-only changes, not yet deployed.

SMX history correction is separately committed in Runtime. Real replay of its
original failure cutoff now supplies 173 five-minute, 127 daily and 247 four-hour
bars through the actual manager; both outgoing formats capture them without any
OpenAI call. See paired Runtime docs/watchlist-alpaca-status-qa.md. This corrects
the missed downstream legacy EODHD loader, not the previously verified raw Alpaca
loader. Existing live analyses and notifications were not changed.

## Scope and source

Audit the owner's deployed Alpaca Watchlist, AI candle packet, price status and
indicators. Correct the requested live-price wording and remove the main list's
Price Time column. Do not generate analyses, publish, send notifications, change
provider settings, restart services or deploy during this work.

The active scanner successor confirmed no overlapping Watchlist edits. Its
scanner, screener, gateway, shared provider and unfinished chart work stay out
of scope. Coordinator assigned clean Platform and Runtime worktrees, preserving
all mixed checkouts. Platform base ffb309d4717f0de72959d65f3acac9201a455b07;
Runtime base 849b6d991de45fa596d90e3a031ae5e6f45c2aaf. Local commits are allowed;
release remains Coordinator-owned. No dependency, schema or provider changes.

## Independent deployed observations

Read-only Railway metadata confirms Platform b805245a-5acc-45ea-a72f-bc62b8f489b4
SUCCESS from main ffb309d4, and staging-named live Watchlist runtime
eaa89124-201c-4614-b188-b6d8ec3dbc0c SUCCESS. Platform's selected provider is Alpaca.
Runtime status is authenticated with existing credentials held only in process
memory; no credentials, private URLs or account identifiers are retained here.

* Runtime status: HTTP 200, startup ready, three active tickers. Overall market
  data status was offline and provider health was closed even while an actual
  accepted price was 573 milliseconds old. This is a reproducible status defect,
  not evidence of missing live prices.
* The deployed AI candle bridge returned HTTP 200 ready, provider alpaca and 31
  NWGL one-minute bars for November 6, 09:30–10:30 Eastern. All timestamps were
  ordered, unique, in range and in milliseconds; OHLCV values were valid.
* Direct configured gateway history for NWGL returned SIP, split adjustment and
  complete coverage: 741 five-minute, 263 fifteen-minute, 20 four-hour and four
  daily bars over the requested November 2–6 sample. This proves those actual
  history paths, not every symbol or minute of a thinly traded session.
* Actual runtime prices and source times were returned for PARA, TGE and NXXT.
  NXXT's price was from an older session while the other two updated overnight.
  The overall feed status must not imply every ticker has a fresh last trade.

## Consolidated findings and correction batch

1. Runtime status mapper omitted Alpaca, falling through to disconnected IBKR
   even when the selected Alpaca feed received prices. Add Alpaca to the existing
   non-IBKR health mapping; preserve startup, error and legacy-provider behavior.
2. Manager health and per-ticker restart readiness forced closed for all hours
   outside 04:00–20:00. Add a provider-aware overnight capability callback and
   explicit Eastern Sunday–Thursday evening/Monday–Friday morning window. Keep
   the existing two-minute actual trade freshness requirement. Selection alone
   never implies live, and stale/waiting/weekend states remain distinct.
3. Member UI claimed a fixed 15-second delay and Not live based only on the
   incorrect global status. Remove the fixed-delay claim. Fresh timestamped
   prices in a live feed have no stale warning. Old individual ticker prices
   still show Not live with the actual market-data time, not publication time.
4. Remove the separate Price Time field on desktop/mobile. Keep the time in the
   not-live price note when needed; align the remaining mobile price/Added row.
5. Help now explains live-price status and that indicators do not calculate an
   overnight session merely because the price updates overnight.
6. A retained one-time overnight reference pinned Potential Path's price and
   level distances until premarket. Release it when the selected overnight feed
   supplies a genuinely newer, fresh trade, and reject a late reference lookup
   that races with such a trade. Legacy day-session release behavior stays intact.
7. Preserve BOATS' actual initial trade timestamp as optional observedAt through
   both reference normalizers. Older saved references remain valid without one.
   The fixed-reference fallback can now display its real quote time; checkedAt
   is never substituted. Potential Path also honors a confirmed fresh live
   price while an older reference is still present.

## AI packet parity

The migration does not change any src/lib/ai source files between the prior
timestamp-repair revision 127edddf and the deployed 849b6d99 runtime. Both analysis
formats retain the same context pipeline: current/last completed session 1m,
completed 5m aggregation, preceding completed-session 5m, daily history, 4h
history, dated prior regular close, level output and cutoff. The bridge keeps
seconds at the MarketDataRequest boundary and milliseconds in Runtime candles.
Alpaca identity is explicitly accepted and reported; strict Moomoo mismatches
remain rejected. No news, research or trader-note input path was changed by
this provider delta. This is source/contract parity, not identical candle values
between vendors or a claim that a newly generated model response was tested.

The existing exact-parent verifier independently passed 56 assertions for
source identity, actual manager context, completed aggregation and strict
mismatch/error guards. It uses fixture responses, not a new OpenAI request.
An additional actual-service regression captures the outgoing request body with
a fake transport for both simple and detailed formats, using identical
synthetic OHLCV under Moomoo and Alpaca identities. Both retain nonempty 1m, 5m,
daily and 4h candle groups with identical evidence and a research context. The
test passes without obtaining a model response or touching saved analyses.

An existing saved analysis generated before the cutover is not retroactively
an Alpaca analysis. A fresh post-cutover full recorded request has not yet been
inspected; no live generation was requested to manufacture one.
The bounded runtime SSH diagnostics probe failed, so no full saved post-cutover
request is represented as having been read. Runtime audit GET was available;
its latest TGE events were preflight skips, not evidence of a new model request.

## Indicator and overnight limitations

Indicators select Alpaca alone and keep split-adjusted provider identity and
activation isolation. The adapter does not require a connected Moomoo account.
Their session normalizer and refresh service intentionally stop at 20:00 and
resume at 04:00, using the last completed session while closed. Current history
requests specify SIP, not BOATS. Keep this honest: overnight price updates are
not overnight EMA/RSI/ATR/volume/VWAP updates.

Read-only inspection of the deployed indicator audit confirmed successful
Alpaca calculation publication for PARA and TGE across 1m/5m/15m/daily, followed
by session_closed records overnight. Data-through times stayed at the last
completed session. The 1m coverage recorded 216 missing minutes for PARA and
808 for TGE; those counts do not distinguish missing provider data from no
trades. This explains why the strict VWAP coverage check can remain unavailable.
No forced refresh or audit write was performed by this inspection.

Potential follow-ups, not silently implemented:

* The indicator adapter drops Alpaca's per-bar VWAP, and the current VWAP engine
  uses typical price times volume. Session VWAP also requires every minute or
  explicit no-trade evidence; missing intervals on thin stocks can leave it
  unavailable. Use real feed-specific trade/bar coverage before changing this.
* Live regular-hours prices reuse the shared SIP WebSocket cache through a
  five-second gateway poll. Overnight currently polls BOATS latest trades per
  ticker; it is not yet a BOATS WebSocket consumer. Avoid describing all paths
  as unlimited socket delivery. Consider shared BOATS streaming separately with
  the gateway owner, without adding a second conflicting provider connection.
* Indicator HTTP history reuses coalescing and bounded request concurrency, but
  Alpaca correctly bypasses Moomoo-only admission and cooldown. Its 15-second
  transport deadline is shorter than the gateway's historical pagination budget;
  audit cold history loads before independently tuning that deadline.
* Native Alpaca 4h/daily aggregation and split adjustment may differ from prior
  vendor candles. Preserve source labels and test anchor/session comparisons
  before changing levels or model prompting.

Alpaca documents distinct SIP and BOATS feeds, and overnight history limitations:
[overnight feeds](https://docs.alpaca.markets/us/docs/245-trading-for-trading-api),
[historical bars](https://docs.alpaca.markets/us/reference/stockbars),
[stock WebSockets](https://docs.alpaca.markets/us/v1.1/docs/real-time-stock-pricing-data).

## Verification status

Initial independent offline discovery passed 21 tests across five provider,
route and indicator engine files; 56 AI-provenance assertions; 84 indicator
refresh assertions; and 24 audit persistence assertions. Isolated synthetic
data only. Initial systemd launch lacked Node in its inherited PATH and never
ran tests; the explicit-PATH retry passed. All exact units ended and the matching
feature resource lock was released. No other preview was touched.

Correction tests before the final metadata batch: ten runtime tests (including
actual manager health/restart rows and both outgoing AI formats) and 31 Platform
tests pass. The metadata batch additionally passed six targeted component and
overnight-adapter tests. Full Runtime TypeScript passes; focused
Platform TypeScript covers 1,940 source files with zero diagnostics. Its first
harness omitted generated next-env.d.ts in the clean source worktree; using
Next's actual installed ambient declarations resolves CSS-module typing without
adding a fake source declaration or suppressing diagnostics.

The actual extracted Watchlist row and price-status components, real CSS and
synthetic data pass browser checks at 1,440 and 390 pixels: four fields, no
separate Price Time field, no fixed-delay claim, no stale warning on fresh
prices, a dated warning on an old price, keyboard focus and premium-ticker
concealment. Mobile Price and Added share a row, and neither viewport overflows.
Screenshots /tmp/watchlist-alpaca-price-ui-96bYlS were inspected. This uses a stub
for Next Link and decorative badges, not a full authenticated app browser test.

Source edits are not live changes. Hosted acceptance and release authorization
remain separate from these local checks.

## Final correction verification

The final metadata-inclusive batch passes **35 Platform tests in eight files**
and **11 Runtime tests in four files**. Full Runtime TypeScript passes. Focused
Platform TypeScript covers 1,942 files with zero diagnostics, using the installed
Next ambient declarations. Exact changed-file lint has zero errors and one
pre-existing unused-helper warning in the large Watchlist client. Initial lint
found a test-harness variable named module; it was renamed without changing the
rendered component. No diagnostics were suppressed.

Both reference-contract implementations are byte-identical, including optional
actual BOATS observedAt and backward compatibility. Existing unknown trade times
are not repaired by inventing one. The source batch adds no market-data requests,
provider/subscription changes, generation limits, approval restrictions or
notifications. Help was updated with status and overnight indicator semantics.

Release integration should include the paired Runtime correction before the
Platform presentation correction so the health publisher can supply truthful
Alpaca status. No schema migration is needed. Scanner/gateway/shared-chart
sources remain untouched. A complete authenticated browser session on the
deployed corrected release remains a hosted acceptance check; component browser
fixtures and read-only live provider probes do not substitute for it.
