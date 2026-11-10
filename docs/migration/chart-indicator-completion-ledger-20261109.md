# Indicator completion and QA ledger — November 9, 2026

## Owner controlling scope

Research official TradingView behavior first, audit actual code, correct calculation/settings/display/persistence, and verify EVERY offered timeframe. Work strictly one indicator at a time: VWAP, EMA, SMA, RSI, MACD, Bollinger Bands. Do not move to the next while required behavior/settings are unresolved. After the full implementation sequence, conduct THREE complete QA passes for EACH indicator across its full applicable timeframe/settings matrix. Partial/blocked attempts and static checks are not complete passes. Consolidate findings, fix coherent batches between passes, preserve source and saved user preferences. No deployment requested. Relay checkpoints to `01a183a6-998f-7281-a03c-8a43e9156693`, host `local`.

Actual selector/catalog inventory: 1m / 5m / 15m / 1h / 4h / 1D; VWAP / EMA / SMA / RSI / MACD / Bollinger.

## Sequence status

| Indicator | Reference/audit | Implementation | All-timeframe checkpoint | Final QA 1 | Final QA 2 | Final QA 3 |
| --- | --- | --- | --- | --- | --- | --- |
| VWAP | Official documentation read; gaps recorded | IN PROGRESS, first | Pending full settings/visibility matrix | NOT RUN | NOT RUN | NOT RUN |
| EMA | Initial references/gaps recorded | Earlier shared draft preserved, NOT COMPLETE; sequence not started | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| SMA | Initial references/gaps recorded | Earlier shared draft preserved, NOT COMPLETE; sequence not started | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| RSI | Initial references/gaps recorded | Earlier shared draft preserved, NOT COMPLETE; sequence not started | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| MACD | Initial references/gaps recorded | Earlier shared draft preserved, NOT COMPLETE; sequence not started | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Bollinger Bands | Initial references/gaps recorded | Earlier shared draft preserved, NOT COMPLETE; sequence not started | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

## Pre-sequence draft evidence (not completion or full QA passes)

Before strict one-by-one instruction arrived, shared optional fields/editor/calculation draft was started across the six. Backward-compatible preference parsing, numeric/source/smoothing tests: 13 focused cases passed; lint and selected source/test types passed at that checkpoint. Other-indicator work is not being advanced until VWAP is complete.

First shared renderer browser attempt successfully edited/saved multiple indicators but ended at an obsolete harness assertion expecting exactly 3 total series after adding multiple studies. FAILED harness run, not browser PASS. Keep finding until repaired/replaced for applicable checkpoint.

First dedicated VWAP browser attempt checked default weighted value and source edit/hide, then failed reopening Style controls because the editor intentionally reopens on Inputs. Corrected the test navigation (explicit Style selection). This partial attempt is NOT a full QA pass.

## VWAP reference and findings

Reference: https://www.tradingview.com/support/solutions/43000502018-volume-weighted-average-price-vwap/
Session/chart reference: https://www.tradingview.com/pine-script-docs/concepts/sessions/
Chart extended-hours reference: https://www.tradingview.com/support/solutions/43000502023-i-want-to-access-extended-hours-data/

- Plain `VWAP` label and no ET/reset notice corrected in draft. Chart timezone controls remain independent.
- Default source HLC3, cumulative HLC3*volume / cumulative volume. The selected chart sessions determine available bars; a supported US regular-only session starts with its first regular bar, extended session includes premarket through postmarket. Default current implementation groups same-day US bars without changing existing session behavior merely for labeling.
- Focused hand-calculated fixtures cover weighted vs unweighted values, zero-volume bars, regular/extended selection and pre-/post-DST offsets.
- Full required settings parity remains unresolved: anchors, configurable bands/fills, offset, independent calculation timeframe/close behavior, per-timeframe visibility and daily hide option. Do not call default-line arithmetic equivalent to complete TradingView indicator behavior.
- Event anchors need actual earnings/dividend/split facts; no imaginary events or date reset substitution.
- Early-close historical regular-session filtering currently uses fixed boundaries in the chart session utility; correct market-session alignment cannot be inferred from the label. Needs verified historical calendar/session metadata; this is an accuracy finding, not a made-up VWAP option.
- TradingView band calculation must have a verified reference fixture/formula; do not guess from a generic sample variance.

## Full-pass evidence requirements

For each indicator and each of 3 final passes, record exact immutable source, test matrix and all 6 timeframe results, inputs/default values/boundaries, expected-vs-actual numeric comparisons with independent references, plot/style/visibility, sessions/DST/early close where relevant, retained account settings/reopen/symbol changes, mobile/desktop controls and errors, source/data coverage and clean teardown. Inventory intentional reference hide/unsupported behavior explicitly. Only a complete runnable matrix can be marked PASS. Resource collisions, unavailable reference/provider facts or skipped cases make a run BLOCKED/PARTIAL, never PASS.

Pending: finalize VWAP implementation and full checkpoint first, then advance sequence. No tests on real accounts/providers, no release or new gateway/schema changes authorized by this ledger.

VWAP default-line actual renderer/editor checkpoint passed all 6 timeframes: 1m=22.5, 5m/15m/1h/4h=155/6, 1D=30 for the hand-computed fixture. Source edit High=25.5, visibility, persisted mobile reopening and width containment passed. This is a PARTIAL settings matrix, not indicator completion or any final QA pass. Both earlier failed browser attempts remain recorded above.

### VWAP calendar/session checkpoint (still incomplete)

- Official Alpaca paper calendar endpoint read-only entitlement confirmed HTTP200 for November27/30: early13:00 and normal16:00, no account/order requests or service changes. This does not establish broader trading-account mode.
- Source-only calendar metadata added to intraday history/bar responses, preserving existing auth and private VPS keys. Bounded/coalesced per-year cache, max2 pending,24hTTL,32year cap; invalid/incomplete calendars return unavailable, no fake sessions. Calendar metadata unavailable withholds VWAP and shows a truthful status rather than manufacturing values.
- Corrected regular-only 1h/4h bucket alignment to09:30 acrossDST. Extended mode remains existing04:00 grid. Verified historical early close excludes post-close bars from regular-mode VWAP. Otherindicator implementations remain unadvanced drafts.
-30 focused cases across4files passed; exactchanged-source lint and selectedindicator/calendar source+tests types passed. ActualVWAP renderer/editor passed all6frame default numeric checks plus Source, plotvisibility, mobilepersistence and optionalHideon1D. These remain PARTIAL settings checks, zero finalQApasses credited.
- Newly discovered REQUIRED warm-up gap: initialchart10sessions insufficientforlongVWAPanchors. Must fetch fullanchor/prefix before plottingthose; calendar grouping alone is not completion. Bandsreferencefixture/formula, fills, offsets, calculationtimeframe/close behavior, eventanchors/data and fullmatrix remain pending. StayonVWAP.

### VWAP full-anchor warm-up draft

Added source-only authenticated /api/charts/vwap-seed -> VPS /vwap-seed path. Prefix calculator reads complete split-adjusted history in bounded chunks, verifies calendar facts, aggregates to the selected session-aligned timeframe and accumulates all supported sources before the first displayed candle. Same source history is reusable for source/style edits. Max2 pending jobs,512 cached prefixes,5minTTL,90s work deadline; processor yields every512 points. No partial prefixes are published. Historical seed basis date must match the chart; history cache keys now separate adjustment dates and reject a date rollover mid-load. Existing Watchlist response fields remain compatible/additive.

Source-only client waits for complete seed before VWAP, keeps price candles independent, and rejects stale/mismatched seed identity. Corrected intraday page starts to market-date midnight so older pages cannot cut the first higher-timeframe candle in half. Focused prefix tests passed3/3 including earlier-hidden-history value20 vs erroneous viewport-only30, coalescing/cache, incomplete/calendar/date rejection and validated request identity. Full renderer/route/gateway source checks with the new path remain pending. Still not complete and no final QA pass credited.

### Asymmetric source regression checkpoint — November 10

Added an independent unequal-volume, asymmetric-OHLC fixture: default HLC3 VWAP=16 versus close-only=50/3. All seven currently supported source means are independently asserted. Six focused VWAP tests passed; this is not a complete settings/timeframe pass. Official TradingView-authored Rolling VWAP and Chart VWAP references located: https://www.tradingview.com/script/ZU2UUu9T-Rolling-VWAP/ and https://www.tradingview.com/script/QE4dq4ZM-Chart-VWAP/. These do not by themselves prove the built-in Session VWAP band calculation. Bands, offset and calculation-timeframe behavior remain unfinished; no deployment.

### Offset / multi-timeframe projection checkpoint — November 9 owner timezone

Official reference: TradingView declaration statements (`timeframe`, `timeframe_gaps`) and VWAP Inputs. Wait-for-close defaults true; higher-frame historical results are confirmed only at their closing chart slot, unconfirmed current values can develop with waiting disabled. Same/lower calculation timeframe does not inherit higher-frame gaps.

Added an isolated projection contract and39 passing focused cases: all36 offered chart/calculation timeframe combinations plus explicit close/no-lookahead/developing-value expectations, early-close boundary and positive/negative/zero offset over a supplied time axis. Projection requires actual interval-close facts; offset operates on chart positions including zero-volume slots, never guessed epoch increments. This helper is NOT wired into the renderer and is NOT evidence of complete UI behavior.

Concrete remaining integration dependency: renderer history/seed input is chart-timeframe-bound, and its bar listener currently discards the other daily/intraday channel. Daily provider bars cannot be replaced by synthesized intraday daily bars. Need independent calculation-context history, seed identity, verified close timestamps, live daily/intraday reconciliation, cancellation/pagination/rollover and verified future axis positions before exposing controls. Off-axis offsets are clipped by the pure helper; complete future plotting remains pending future-session axis coverage. Do not claim either feature complete or advance beyond VWAP. All18 final QA passes remain NOT RUN. No deployment.

### Calculation history and intraday close facts checkpoint

Continued implementation after acknowledging that the data-context integration dependency is internal work, not an external blocker. Added a per-chart abortable history context: shared minute data across intraday calculation frames, separate authoritative daily provider bars, paged coverage to the requested boundary, same-context request coalescing, live-over-bootstrap correction precedence, adjustment-basis rollover rejection, malformed/cyclic pagination rejection, bounded80k bars/64pages/20s per request, explicit reconnect invalidation preventing stale in-flight admission. Six focused context tests passed.

Added verified intraday interval-end helper: regular09:30 anchors, actual13:00/16:00 closes, clipped premarket/postmarket ends and missing-calendar rejection. Four focused interval tests passed, including before/afterDST. Together with39 projection tests these remain49 focused helper cases, NOT renderer integration or any final QA pass.

Daily mapping still needs verified daily confirmation semantics and historical calendar coverage. Alpaca's official Market Data FAQ explicitly distinguishes daily/minute price eligibility and includes extended-hours trades in daily volume even when daily prices are not updated (T condition); preserve provider daily bars rather than synthesize them. https://docs.alpaca.markets/us/v1.1/docs/market-data-faq . No new settings exposed yet; next work remains renderer data-context/seed/stream wiring and future offset axis. No deployment, other indicators unadvanced, final0/18.

### Persistent owner goal and additional chart issues

Owner explicitly requested a persistent Codex goal; created and ACTIVE November9 owner timezone. Complete six indicators in order plus18 final complete QA passes, no deployment. Continue through partial checkpoints.

Owner-reported issues added to the controlling discovery inventory:
1. Live production1m candles become much shorter on addingVWAP. Inspect deployed source/read-only behavior or reproduce exact deployed behavior; capture price range and plotted values before/after, trace the cause, correct only a verified defect in development while preserving validVWAP and usable scaling. Do not assume autoscale.
2. Main chart bottom time/date and crosshair-following time label must match the Scanners chart. Inspect actual component paths and reuse shared implementation where appropriate; verify both surfaces and mobile.

Both are unfinished; no completion evidence yet. Goal creation does not change0/18 final QA or release authority.

### Shared-renderer calculation/offset integration checkpoint

Immutable263b263ed6da192c035e2c47b504a7c16ea15518 passed the actual native lightweight-charts browser matrix:36 chart/calculation combinations with waittrue/false (72 settings combinations), signedoffset2/-1/0 on all6 chart frames, persisted values, independent hand-calculated VWAP means15/580÷39/700÷39/20 and dailySSE update reaching minute-chartVWAP. Selected immutable typegraph30roots/1468files passed with0diagnostics. Failed default-value/persistence assertion, browser nativefetch receiver invocation, and one-point daily negative-offset fixture are recorded as partial failed attempts; corrected app invocation and fixtures, then reran full integration matrix. No final QA pass credited.

Still required beforeVWAP completion: full bands/fills reference and implementation, event anchors/source completeness, live forming/close-boundary browser cases, historical paging/rollover/cancellation/performance at realistic depth. In particular current alternate minute context targets the earliest loaded daily candle; the default10year daily history exceeds the80k minute limit. Must switch minute-context demand to the visible/panned daily window and qualify limits/performance instead of silently claiming all-history support from small fixtures. Future calendar-year coverage and maximum offsets need full cases.

### Measured candle compression / scale control

Reproduced using last known deployedcaeee3bde2392a7b5a34a9b75659b921c9b095d1 renderer and exact indicator logic, synthetic390minute facts, desktop1200/mobile390, actual main workspace and same scanner chart component. Non-chart DashboardPrimaryAction is isolated in the harness to avoid importing unrelated server shell; chart code and native engine are unchanged. Before/after OHLC identical, price pane height identical. Main desktop range3.95–4.05 expands to1.0198675497–4.05 to include the valid VWAP; candle high-low pixels311.2→10.2702. VWAP independently37/13=2.846153846. Main mobile285.3→9.4154; scanner same behavior. Thus this reproduction is normal shared-scale fitting, not erroneousVWAP arithmetic or lost pane height. Latest production SHA reconfirmation remains requested through relay.

Official TradingView confirms this behavior and standard Scale price chart only control: https://www.tradingview.com/support/solutions/43000762934-my-chart-looks-compressed/ and https://www.tradingview.com/support/solutions/43000748166-how-to-configure-your-supercharts/ . Added optional savedscalePriceOnly setting, legacyunset retainsfalse. For pane0 overlay studies only, exclude their range from autoscale when enabled; keep their calculation/coordinates unchanged. Actual working-source browser check passes main/scanner desktop/mobile: original range and candle height restored, VWAP value unchanged, preference saved. This is source/development evidence, no live deploy or claim owner enabled the setting.

### Main / scanner date and crosshair evidence

Both current and deployed main workspace import the SAME AlpacaLightweightChart used by scanner drawer; no separate chart implementation to copy. Working-source native renderer main/scanner at1200/390 verified stickydateNov9, crosshair time changing1:40PM→3:20PM, corresponding pointer/time movement, native bottom-axis pixels changing, labelVisibletrue. Screenshot reviewed at /tmp/traderlink-chart-crosshair-main-390.png: moving black bottom label unobstructed. This verifies matching shared source; live-session discrepancy is not yet reproduced or claimed fixed. No separate caption implementation added.

Help Center review: no existing public Market Charts guide was found in help-content-registry; updated existing unpublished docs/migration/shared-chart-help-draft.md for the standard scale option and draftVWAP controls.69 focused cases in6files passed after the source batch; final18pass count remains0.

### Qualified scale/source checkpoint and next work

6e4ad80470f2eb91a3b894512b673a6698187abe: immutable32root/1470file typegraph0diagnostics; actual native main/scanner scaling option and moving bottom crosshair checks all4 desktop/mobile configurations PASS. Four authenticated preference-route tests PASS including persistedVWAP calculation timeframe/offset/wait settings and price-only scaling, cross-account isolation, CSRF/owner gate/revision/oversize rejection. Existing69focused source cases remainPASS. No production updates.

Anonymous official TradingView Rolling VWAP Source code tab was accessible. Observed public published-source response /pine-facade/get/PUB%3B043320bb572a4bb08853f40189c57586/6 HTTP200. TradingView-authored source explicitly uses weighted source second moment: variance=max(sum(volume*source²)/sum(volume)−VWAP²,0), sqrt for bands. This verifies THEIR rolling-window formula; do not pretend it alone numerically qualifies native anchoredVWAP. Source URL https://www.tradingview.com/script/ZU2UUu9T-Rolling-VWAP/ .

A bounded anonymous native-chart indicator-add probe now establishes the actual reference restriction: clicking the built-inVWAP returns an account-required overlay (Join for free). No login, signup, bypass or account changes attempted. Native source/numeric comparison remains pending authoritative evidence; continue independent VWAP work rather than calling the implementation dependency externally blocked.

Resume next: visible-window demand for alternate minute context on deep daily history; realistic depth/realtime performance; live forming/close transitions; bounded calendar future-year coverage; implement bands/seed second moments with the verified weighted formula while keeping native numeric parity and remaining required features explicitly unfinished. Keep strictVWAP-first order and0/18 final QA. Persistent goal remainsACTIVE.

### Visible-window history and measured calculation performance

Implemented visible-axis demand (one neighbouring chart slot for continuity), per-window historical endpoints, and switching-window cancellation. A historical viewport starts at its own end date; it does not scan forward from today. Loader accepts a bounded150k raw-minute window (separate from the80k displayed-chart cap), enough for normal100-session extended hours;4 renderer context caches/32 failure records stay bounded. Basis-date keys isolate pending work across adjustment rollover. Old requests are actively aborted, invalidated responses cannot rejoin, and cancelled windows do not acquire a failure cooldown. Future offset slots are generated only when a plotted point actually needs positions beyond the existing axis, so an old viewport does not request irrelevant present-day future sessions.

Profile of the same96000-minute synthetic source stages: before session filter267.6ms/VWAP113.5ms/intervals1227.4ms,total1608.5ms. Verified numeric calendar interval lookup and per-date anchor reuse reduce to12.1/16.9/28.9ms,total57.9ms, unchanged96000 values and finalVWAP10. This isolates CPU stages, not provider/network or full multi-chart frame performance. Removed duplicate VWAP calculation in renderer.

76 focused cases/7files PASS after the batch, including cancellation,100-session depth, requested-window scope, DST, closed dates and refreshed close facts. Working-source browser with2500 daily bars and minuteVWAP PASS: initial101 plotted daily samples,8 bounded history requests,~1095ms synthetic first load; panning to an older period103 samples with7 requests starting at that period; returning to latest retains corrected15:59 minute and shows10.0013888889 in~99ms. Initial test incorrectly expected a19:59 minute to change a daily sample taken at regular close; corrected the fixture to15:59, without changing the regular-close projection. Wider native daily/extended calculation-context reference parity remains part of the pending full matrix.

Still VWAP-first and0/18 final QA. Need immutable source/type/browser qualification of this batch, full six-by-six regression after integration, live forming/close-boundary cases, future year coverage and remaining bands/event/source settings. No deployment.

### Immutable visible-window qualification and HLCC4 source

8c22863341b86063ce07f17c04530fa644a8cf6e passed immutable34root/1472file typegraph with0diagnostics, the2500-day native history-window browser workflow (~1146ms initial synthetic load,~109ms return with correction), and the complete36 chart/calculation combinations with waittrue/false, signed offsets on6 frames and dailySSE-to-minuteVWAP update. These are integration checks, not final catalog QA passes.

Official TradingView input-source reference explicitly listsHLCC4 among usual sources: https://www.tradingview.com/pine-script-reference/v5/ and PineCoders https://www.tradingview.com/script/wb5e69eL-Input-Source/ . Added HLCC4=(H+L+2C)/4, UI selection, prefix accumulation and backward-compatible seed access. Legacy seeds without that field derive its weighted sum as0.75*HLC3sum+0.25*Closesum, avoiding unnecessary protocol breakage. Independent asymmetric unequal-volume fixture expects97/6. New/legacy prefix fixtures both expect119/6.11 focused VWAP/prefix cases and selected working-source types passed. External-indicator plot sources remain unimplemented and cannot be described as complete source parity.

Official VWAP Style screenshot inspected from its support article: https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/43582921383/original/Ha7Sm4O0i4a0mow4gs58sVs5c0XW3V14Jw.png?1758897930 . It confirms independent Upper/Lower Band#1 and Bands Fill#1 controls, Precision Default, Labels on price scale and Values in status line. The latter output controls are additional concrete gaps to implement before claiming completeVWAP. Pine's documented green hex is#4CAF50; do not invent other unverified defaults.

Next: bands/weighted-moment prefix and fill rendering plus output controls, live forming/close-boundary cases, future-year offset coverage, native event-anchor/source parity. Keep strictVWAP-first order; goalACTIVE; final0/18; no deployment.

### VWAP bands and fills implementation checkpoint

Implemented weighted population deviation with stable weighted central moments (mathematically equivalent to the TradingView-authored weighted second-moment formula). It preserves small spreads around large split-adjusted prices rather than cancelling two large squared numbers. Full-anchor prefix returns independent moments for all8 price sources, with Kahan sums and finite-data guards. Zero-volume bars cannot create deviation; anchors reset all accumulators. Complete prefix moments are copied, not mutated. Missing legacy variance history withholds only unknown deviation bands and flags it; percentage bands and valid mainVWAP remain available. Seed validation now rejects contradictory zero-volume sums and inconsistent/invalid moment metadata.

Added three independent multiplier/enabled pairs, standard-deviation/percentage modes, independent per-line style and per-band fill visibility/color/opacity, saved configuration and reset-to-defaults. Legacy no-band setups keep their shape; newly addedVWAP starts withHLC3/Session/offset0/waittrue/first1×band enabled, other2×/3×disabled. Official TradingView RollingVWAP source confirms green fills at95transparency (5opacity); official nativeStyle screenshot confirms first green pair and independentfill control. Native defaults for other disabled-band colors remain subject to final reference review.

Native fill is a lightweight-charts pane primitive using native time/price coordinates; no synthetic candles or separate chart system. It draws only the visible polygon and is independent of main-line visibility. Each indicator computes/project its plots once per renderer update, then shares them among line/fill series.

43 focused cases/7files and selected working-source types PASS. Actual working-source browser PASS: all6frame weighted upper/lower values (1m22.5±sqrt475/2, 5m/15m/1h/4h155/6±sqrt4075/6, 1D30±0); native canvas pixel checks verify saved red80% fill, hiding fill independently and retaining it with mainline hidden; percentage mode and custom2.5×/3× multipliers; livebar replacement updates main and both bands together to30±sqrt280; reset and mobile390 persisted reopening; no JS errors/overflow. These are partial indicator checkpoints, not final QA passes.

Still required beforeVWAP completion: immutable slice qualification, Precision/Labels on price scale/Values in status line controls; forming/close-boundary cases, future-year calendars, event anchors/external-source behavior and full reference inventory. Other indicators remain unadvanced, goalACTIVE, final0/18. No deployment.

### Sparse positions, quiet slots and variance recovery checkpoint

Native working-source browser checks passed on desktop1200/mobile390: a single daily candle with+2/+3 VWAP offset now measures exactly2/3 native logical positions. Time-only whitespace supplies intermediate positions without adding OHLCV; removing VWAP removes those positions. Old immutable9d reproduced1-position compression. Corrected verifier observes public setData inputs because native data() intentionally omits whitespace.

Same-frame VWAP and bands hold their last computed value through carried zero-volume slots within the same anchor; no extra volume or new anchor value is invented. Lower-timeframe developing projection now compares its current point against current time rather than the opening timestamp of a daily chart bar. A regression first failed20expected/10actual and passes after correction. Actual native forming-boundary matrix remains pending.

Missing legacy seed variance retries after30seconds with bounded attempts while preserving valid mainVWAP, and recovers bands when complete moments arrive. Native six-frame band/fill checks, independent visibility, recovery without retry loop, live replacement, reset/mobile persistence passed. A prior clock harness failure was corrected by installing clock before navigation. No final catalog QA pass claimed:0/18, VWAP incomplete, no deployment.

Immutable checkpoint4643761dad37336c00c97bf21c55b1e8620f815e qualified with38selected roots/1476source-declaration files and0TypeScript diagnostics. TradingView official declaration reference confirms output precision0–16 and default inheritance from main series: https://www.tradingview.com/pine-script-docs/language/declaration-statements/ . Precision/price labels/status values remain next implementation batch, not complete.

### Standard VWAP output controls

Added optional saved output settings: Precision(Default or0–16), Labels on price scale, Values in status line. NewVWAP defaults both label/value controls on, matching the inspected nativeStyle reference. Existing saved indicators without output retain their appearance. Default inherits the main candle price format; explicit precision changes display only, never calculation. Native custom price formatter uses matching minMove; legend values read the actual plotted arrays by binary search at the crosshair time, including offset positions, or latest when pointer leaves. Live revisions update hovered values without requiring pointer movement. No per-tick React state/render or full series.data copy is introduced; format updates are cached by precision. Legend fits inside the existing pane without consuming chart height and uses native price-axis width.

Preference parsing rejects invalid output types/precision, copies values losslessly, and preserves legacy unset shape. Nine focused preference tests and selected-source types passed before the final live-hover/browser retest. Help draft updated; no public Help registry publication. Final results to follow; no final QA pass claimed.

Immutable69988208857af946dbe9c9664a45dac40a965132:38root/1476file typegraph0diagnostics; native browser output precision0/4/16, independent labels/status toggles, cursor-specific values, stationary-cursor live correction, persisted reload, all6band frames/fills and mobile390 allPASS. Screenshots reviewed: compact on-pane legend, native scale labels, no extra chart-height row; modal transition was allowed to finish before capturing final images.

Native forming/close-boundary verifier passed both working and immutable699882 source for1m→5m,5m→15m,15m→1h,1h→4h,4h→1D. Waittrue withheld current higher-frame values until actual verified close; waitfalse showed50/3(developing higher intraday HLC3) or20(provider daily HLC3); togglingwaittrue withheld again. Advancing clock across each close published confirmed values. Dailychart→minuteVWAP updated immediately to10.625(15closed minutes at10 plus active20) with eitherwaitsetting. Prior daily confirmation5 remained unchanged beforeclose. No future bars supplied in minute history, no synthetic providerDaily OHLCV. New harness initially failed from its misnamed parameter and premature window.__charts access; both harness errors corrected before source comparison. These are partialVWAP checks, not final catalog passes:0/18. Remaining calendar/event/source inventory and full native reference qualification still preventVWAP completion.

### Calendar-backed forward offsets across year-end

Confirmed official Alpaca calendar coverage is documented1970–2029: https://docs.alpaca.markets/us/reference/legacycalendar . Added read-only authenticated chart calendar-year endpoint through existing VPS gateway; credentials remain VPS-only. It requests one year only when a positive offset cannot be satisfied from known sessions, coalesces pending year requests, shares verified facts across existing chart contexts, bounds lookahead to3years, and throttles unavailable-year retries. No new chart, fakeOHLCV, provider switch, service restart or hosted effects. The calendar-only provider keeps existing24h/32year/max2pending limits. Unauthorized/malformed requests never reach the gateway; responses must match requested full year and pass existing session validation/minimum coverage, and return only normalized public session fields withprivate,no-store.

Ten focused calendar/provider/route cases and selected-source TypeScript checksPASS. Working native single-daily-candle year-end checkPASS on1200/390: Dec31+2 positions→Jan5, +3→Jan6, correctly skipping supplied Jan1holiday/weekend; one2027calendar request per page, unchanged1candle/close40, time-only whitespace removed withVWAP. The initial browser attempt failed because the fixture parser used realhostNovember time against simulatedDecember; passing its explicit fixtureclock corrected that harness mismatch. Max500offset and immutable qualification pending. Final catalogQA remains0/18; VWAP not complete.

Immutable6d5d8fca2a977adb635c9ef3786cb00ba0565d0c qualifies with42root/1480file typegraph0diagnostics and native year-end offsets2/3/500 on1200/390. Max500 measures exactly500native positions spanning701calendar days in the synthetic calendar, with only2027/2028 fetched and unchanged1actual candle/close40. Temporary index candidate excludes parkedhalt/journal changes from gateway/client/renderer.

Next research confirms Alpaca corporate-actions endpoint supports split/dividend types but its documented type inventory has no Earnings: https://docs.alpaca.markets/us/reference/corporateactions-1 . It sorts filters byprocess_date rather than event/ex_date, paginates, and warns of ingestion delays. Do not mislabel processing dates as anchor dates or infer exact earnings releases from headlines. Remaining event-anchor/source dependency work is still required; no new unavailable/inert UI options added at this checkpoint.

### Split/dividend event anchors

Implemented read-only corporate-actions facts using official Alpaca schema (forward/reverse stock splits; cash/stock dividends), ex_date rather than process_date. Full pagination with repeated-token/conflicting-id/symbol/date/rate checks, no partial publication,32page/30sec bounds, max2pending/128cache/5min TTL, basis-day isolation and cloned reader results. Future ex-dates cannot reset a current chart. Complete-empty facts differ from denied/incomplete facts. Earnings is not offered inertly; owner metadata-source question is pending.

Seed history now resolves the latest actual event before visible history, loads its complete prefix, and includes validated event dates for later resets. No-event-before-visible means no silent viewport start; future supplied events can begin a line when reached. No facts/noevent lines do not become Session. Native calendar anchors remain backward compatible. Event facts remain server-side until normalized dates are returned with the authenticated seed; raw CUSIPs/provider details/credentials do not reach chart preferences or source logs.

Selected-source types and37focused cases/5files PASS. Actual working-source native browser PASS for Splits(30) andDividends(40), all6frames on1200/390, persisted reopening, no line before first split. Read-only provider qualification using owner-test credentials in process memory: AAPLHTTP200 and expected public split ex_date2020-08-31; actual class validates1split and43dividend dates (basis2026-11-09), latest eligible dividend2026-08-10. No account/order request, service startup or deployment. Added provider bounds/rollover checks still need final run; immutable qualification pending. Final0/18, VWAP still incomplete.

Immutableb0a95cd8f131bbd1de9fdd354f5cc68845401fcb:45root/1483file typegraph0diagnostics;17focused provider/prefix/event integration casesPASS; native event anchors all6frames on1200/390 with persistencePASS.

A follow-up native regression reproduced stale event facts in the old client seed cache: after301seconds and a bar update, the open daily chart retained30 although a newly supplied ex-date required40; reload recovered40. Added5min client seed refresh with pending coalescing and existing30sec failure cooldown. Valid known values remain while replacement loads. Working browser now refreshes exactly once and updates30→40 on both1200/390 without reload. Current selected types and8prefix/integration casesPASS. Added zero-width-prefix validation: start==before cannot claim positive preceding volume. Immutable refresh qualification still pending. Earnings-source owner question remains pending; external plot-source linking and reference inventory remain unfinished. No deployment/finalQA pass.

Immutable923cdd8e22fbd8cc9167c0c08bea5234473aedd0:45root/1483file typegraph0diagnostics; event refresh/native all6frames1200/390PASS; existing band/fill/output/cursor/live/missing-variance recovery matrixPASS. Final catalogQA remains0/18.

### Shared date-axis and viewport correction

Actual desktop screenshot reproduced pinned date painting over the native moving crosshair caption at the left edge; canvas-only assertions had missed the DOM overlay. Shared renderer now temporarily hides only pinned dates whose bounds intersect the native caption area, using actual formatter/font and public native scale coordinates, then restores them on pointer leave/tracking exit. No duplicate chart or replacement native crosshair.

Also restored exact logical viewport when candle-axis first/last/count and session selections are unchanged. The previous time-only restore clamped right padding394→389. Source now preserves150→394 while indicator settings change; changed candle axes/sessions still use time-based fallback. This also removed an unstable narrow-scanner price-only restoration case. Price-only scaling still returns unchanged candle heights/ranges while leaving computedVWAP37/13 unchanged.

Working selected types and actual native main/scanner1200/390 mouse checksPASS, including datehide/restore, moving bottom caption, unchanged price-pane heights/candles, exact logical padding, saved price-only scaling. True mobile emulation390/DPR2 with long-press/drag and next-tap exitPASS in both main/scanner; final screenshots visually reviewed, native caption fully readable at left. Earlier harness attempts exposed fractional CSS mouse-coordinate truncation and mobile edge-gesture interference: use integer CSS coordinates/native coordinateToTime for mouse expectations, start touch away from screen edge and drag toward it. Touch allows at most1minute native bar snapping at this dense zoom, and still asserts distinct moved timestamps/caption pixels/date visibility. These were harness issues, not invented application fixes.

Immutable viewport/caption qualification pending. Help review: this corrects existing interaction, no new public guide instruction or Help publication required. Earnings metadata-source decision remains pending; continue independent external-source/reference work afterward. No deployment.

Immutableecba11a006255212182b5620464ba16b50d102ec:45root/1483file typegraph0diagnostics; actual native main/scanner1200mouse and390/DPR2mobile touch long-press/drag/exitPASS, including caption overlap prevention, retained150→394logical viewport and saved price-only scaling. All36chart/calculation combinations withwaittrue/false, signed exact offsets onall6frames and authoritative dailySSE→minuteVWAP alsoPASS after viewport change. Still partial implementation qualification, not final catalogQA:0/18.

Two owner questions are pending: using existingFinnhub for earnings dates (Alpaca does not document an earnings-calendar feed), and whether indicator-on-indicator Source linking belongs now or after the six standalone indicators. Source linking is confirmed native functionality by https://www.tradingview.com/support/solutions/43000474048-how-to-apply-an-indicator-or-strategy-to-another-indicator/ and https://www.tradingview.com/pine-script-docs/faq/indicators/ . It requires actual plot dependencies/full-prefix calculation, not substitutingOHLC. Do not silently claim it implemented or narrow the full goal. Independent remainingVWAP reference/control checks may continue while decisions are pending. Keep strictVWAP-first order and no deployment.

### Native VWAP source and final default-conformance batch

Recovered explicitly public nativeSTD;VWAP48.0 source (scriptAccess=open_no_auth) and verified pinned version/hash, without an authenticated account or bypass. See docs/migration/chart-indicator-native-reference-manifest-20261110.json, linked from the settings review. This removes the prior native source/default inventory evidence gap; anonymous UI gating is not the same as source unavailability. Manifest also records public metadata/hashes for the other5native scripts, without advancing their implementation or storing third-party source.

Corrected default second/third band line/fill colors to nativeolive#808000/teal#089981; firstgreen unchanged; explicit saved overrides preserved. Multiplier inputs now match native nonnegative finite values with0.5step and no arbitrary100ceiling. Values250 calculate normally; arithmetic overflow with1e308 withholds only the affected band's outputs/fill, preserves mainVWAP/other bands, explains numeric range and recovers on correction. Added no-volume VWAP message while price candles remain usable; recovery clears it.

Fill ordering follows the dedicated TradingView visual-group specification: nativeVWAP does not enable explicit_plot_zorder, so fills belong above background/grid and below plots. The Colors examples contain contradictory prose; the dedicated Overview z-index rule governs this script. Pane primitive now usesnormal instead ofbottom. An intermediate series-based layering experiment was discarded before checkpoint; final source has no extra fill-owner series. Initial1px line-pixel assertion underestimated anti-aliasing/coordinate rounding; final3×7pixel neighborhood distinguishes actual blue line above red80%fill from fill covering it.

13focused band cases and selected-source typesPASS. Working actual native browserPASS all6 weighted-band frames, output/cursor/persistence/mobile, red80%fill independent visibility, correctline-layer pixels, nativepalette, multiplier250, overflow containment/recovery, legacy variance recovery, live replacement, zero-volume message/unchanged price candles and recovery. These are partial implementation checks, not final catalog QA passes:0/18. Immutable batch qualification pending. Earnings metadata and external-source scope questions remain pending; do not advance other indicators or mark the full goal complete. No deployment.

Immutable7d3acea2b581527ff1b86412dcabd2658d3e09ef qualified:45root/1483file TypeScript graph0diagnostics; actual native browser expanded bands/output/overflow/zero-volume suitePASS. New immutable-source theme/visibility verifier alsoPASS:24light/dark numeric frame cases (2themes×6frames×2widths),72single-enabled-frame visibility cases (6allowed×6displayed×2widths), saved all-frame visibility/theme/timeframe reopening and no overflow/JS errors. Dark/light native chart screenshots reviewed for readability; toolbar ripple animations in immediate captures are transient harness timing, not changed chart selection. Source runtime unchanged during this added inventory. Final catalogQA0/18; these remain partial completion evidence while earnings/external-link decisions are pending.


### External-source lifecycle evidence — 2026-11-10

Verified English official TradingView Overview lines272–273: hidden calculated plots/hidden indicators can remain external Source inputs; upstream changes propagate; deleting the upstream indicator removes its dependent script. This resolves the source-removal behavior question and prohibits a silent OHLC fallback. Settings review records implementation implications and remaining unverified multi-timeframe/offset sampling semantics. No dependency code or earnings connection added. Owner asked what these features mean and received explanations; deferral has been recommended but not accepted. Preserve full scope, VWAP-first sequence, final QA0/18 and no deployment. Previous goal turn yielded explanatory research but no implementation; this turn adds authoritative lifecycle evidence rather than repeating an implementation plan.


### Exact rational VWAP numerical reference — 2026-11-10

Added independent BigInt oracle for all8OHLC sources×all6chart frames, both standard-deviation and percentage modes, all3enabled band multipliers and every populated prefix across16varying-OHLC/volume bars. Oracle uses exact source numerators over12 and exact weighted squared sums, independent of production source helper/Kahan/moment functions. Includes initial zero-volume and later zero-volume bars; checks omitted leading output and retained weighted values.48casesPASS (96mode/source/frame combinations); runtime391ms. Production calculation file matches immutable draft SHA25604175729c7488af9a115ed9d4830cbb10b763c528a5e3822c0d1e84d73d323ce. No runtime modification or broader standalone/native numerical claim. This strengthens calculation evidence only: earnings/linking remain unresolved, other5studies unadvanced, finalQA0/18, no deployment.


### Owner scope correction and standard calculation batch — 2026-11-10

Owner clarified that TradingView was a familiarity reference, not a requirement to reproduce every specialist feature. Priority is ordinary working EMA/SMA with selectable multiple lengths, RSI, MACD, Bollinger and VWAP, with practical settings and saved setup. Do not hold completion behind indicator-on-indicator linking or event-anchored Earnings VWAP. Those are outside this standard-indicator completion pass. Finnhub earnings may be used if the existing tier supports it, but is not a prerequisite or a reason to prolong this pass. No source-link graph was added. Earlier strict reference-inventory requirements are superseded to this extent; keep the full six standard indicators and requested final verification.

Rechecked public native EMA38/SMA41/RSI47/MACD43/BB35 source input/calculation facts. Corrected EMA to first-observed source initialization (RMA remains SMA-seeded). Corrected native RSI zero-loss branch to100, including flat source, rather than invented50. Existing editable lengths and multiple independent EMA/SMA instances already persist; no forced preset set added. New closed-form step-response EMA fixtures cover1/9/20/50/200/233, current-bar revisions and repeatability across all6frames; independent SMA window checks, hand-computed Wilder RSI/MACD/BB cases all6frames. Four focused files85testsPASS; runtime817ms. VWAP exact rational checks remain passing. This is calculation qualification, not full browser/persistence QA or any of18finalpasses. Chart display/history/compact settings still need complete qualification. No deployment.


### Standard editor/native chart qualification — 2026-11-10

Immutable b64cb8c4c5d48a91a8d9b5bef9faddd7e7297830 passes48root/1486file TypeScript qualification with0diagnostics. Initial check found14BigInt-literal target errors in the new test oracle only; replacing literals with BigInt constructors retained exact arithmetic without changing project target. Oracle48cases rerunPASS.

New verify-chart-standard-indicators.cjs bundles actual immutable shared chart/editor and native lightweight-charts, with isolated HTTP/EventSource fixtures. Passed desktop1200/mobile390: add EMA9/20/50/200 and SMA20/50 together; native1m series lengths260/260/260/260/241/211; independently selected lengths retained onall6frames; hide/show removes/restores only selectedstudy; invalidzero rejected; custom233added/removed; reload andsymbolTEST→NEXT→TESTretain setup. AddedRSI6with80/20levels,MACD5/13/4,BB10/1.5; nativeplots present throughall6frames andpopulatedon1m/1D; customsettings survive reload/symbolchanges; remove restores other6studies. Viewport containment andzeroJSerrors passbothwidths. Sparse higher-frame fixtures legitimately contain too few bars for some SMA/RSI/BB outputs; numeric all-frame fixtures separately cover their mature values.

Harness corrections before passing: wait for actual EMA data after chart reconstruction; hidden top-level studies are removed series, not invisible existingseries; guard charts before initial render afterreload. These were harness mismatches, no chart fixes added. Existing source controls/persistence work for practical owner scope. These are implementation qualification, not complete supported-setting/fullworkflow finalpasses: finalQA0/18. Still audit remaining offered controls and full native rendering, then execute18applicable finalpasses. No provider effects, preview/service updates or deployment.


### Practical-settings audit correction batch — 2026-11-10

WMA/VWMA optional smoothing/basis used nested full-window scans: O(history×period), potentially1.4biterations at150k/10k. Replaced them with rolling sums/weighted sums in O(history), preserving coefficient/zero-volume semantics. Independent direct-window reference over7periods forbothweightedtypes and150kbar/10kperiod qualification added;3focused files39casesPASS.

Actual editor regression reproduced on immutableb64: withtwoEMA9studies, typeinvalid0inone then selecttheother, its field incorrectlyshows0instead ofsaved9. Native savedcalculations unaffected. Inputs nowremount byselectedindicatorid, so invaliddraft/errors cannot leakacrossstudyselection. Expandednative browserverifier asserts thiscase; immutablebatch qualificationpending. No new optionalfeature, no preview/hosted/provider effects.

Immutable89e5a74fe246d931e85613ad0078940d4ce331dc qualified:48root/1486fileTypeScript0diagnostics; expanded actualnative standard-controls matrixPASSboth1200/390, including same-period invaliddraftselection correction, all6frames/customsettings/reload/symbolchange/remove. RuntimeweightedMAcheckpassed39focusedcases including150kbar/10kperiod. FinalQA0/18; no deployment.


### Band calculation cost and full price-source matrix — 2026-11-10

ExistingBB andSMA+BBsmoothing rescanned/allocatedeachwindow. Replaced populationdeviation withanO(history)/O(period)two-stackmomentqueue. Stableaggregateaddition/mergeavoids subtractingnearlyequalsquaredprices; everyinputtransfersatmostonce. BothstandardBB andexistingoptional smoothingreuseit; no newsettings. IndependentBigIntvariancewindows7periods atprices1e8, oldjump→flatwindowzero and150kbar/10kperiod casesPASS. Fourfocusedfiles48casesPASS beforeexpandedsourcequalification.

Added independent finite-expandedEMA/RMA-basedRSI, directSMAwindow andMACD/BB references onnontrivialOHLC. All8pricesources×all6frames checkall5nonVWAPstandardstudies, includingthreeMACDoutputs andthreeBBoutputs. Newsource48cases +deviation9 +oscillators18=75PASS. VWAP'sseparateexactrationalmatrixretained. Immutable/nativeUIqualificationpending. No finalQApassclaim, no deployment.

Immutable889c7f0beb36712b3f4a202f16e74903311c12c8 qualified:51selectedroots/1489source-declarationfiles0TypeScriptdiagnostics. Actualnative standard-controls fullcurrentmatrixPASSdesktop1200/mobile390 afterbandoptimization, includingcustomsettings/all6frames/data/reload/symbolchanges/draftisolation/remove. No finalQApassclaimed.


### Remaining offered-control audit — 2026-11-10

Added126independent smoothing cases: EMA/SMA/RSI ×7offered smoothing choices ×6frames. Reference uses finite weighted expansions anddirect windows; verifies unchangedprimaryplot, smoothingwarm-up/timealignment,volumeweighting,independentSMA+BBpopulationbands andNone. All126PASS. Expanded actualnative browser verifies selecting every offered smoothingtype,editablelength5/deviation1.5,thenNone; mainEMA color#123456/3px/dashed savedandreloaded. Both1200/390PASS includingpreviousfullstandardcontrols/reload/symbol/draftisolation matrix. No runtime/UIfeaturechange inthisslice.

Practicalownerclarification controls/calculations nowhaveimplementation qualification; nextstage is3complete applicableQApasses foreachsixstandardindicators, retainingthefullcurrentlyofferedVWAPcontrolinventory andsharedcompression/date-axischecks. FinalQAcount remains0/18until thosepassinventoriescomplete; no production/preview update.


### Final QA inventory 1 — complete with findings

The full first inventory on c0da72694352817d83ce37beb360fd6c291f0b49 finished all12cases. Types and all10native-browser inventories PASS; unit suite414PASS/3FAIL. The failures are obsolete expectedEMAseed,flatRSI50 anddelayedMACDcounts in chart-preferences.test.ts; independentreferences supportcurrentruntime. No runtimecorrectionneeded. Onecoherenttest-correctionbatch updates theseexpectations andadds explicitactualnativecurrent-candle event assertions forallstandardplots. Fullfollow-upinventories pending. See chart-indicator-final-qa-20261110.md and adjacentJSON. This is completedQAwithfindings, not a green18-passclaim. No deployment.


### Final standard-indicator checkpoint — November 10

The owner-clarified six-indicator implementation and requested three complete QA inventories per indicator are technically complete. All 18 indicator passes were executed: the first inventory found three obsolete test expectations (EMA seed, flat RSI and MACD warm-up), corrected in one batch; inventories 2 and 3 passed all 12 cases each, including 417 tests per inventory. The final source is 7b9cbb5cdbc0a18ae51048bb3d892f2cbf68e9ed. Focused lint passed with zero warnings; immutable TypeScript has 52 roots/1,490 files and zero diagnostics.

See chart-indicator-final-qa-20261110.md and JSON for per-indicator outcomes, immutable source, file allowlist, case results and limits. Earlier NOT RUN/unfinished rows are historical and superseded for this owner-clarified scope. Specialist external-source linking and Earnings anchoring are not part of this pass. Owner visual acceptance, integration and release remain separate. No hosted or preview change. Preserve parked and unrelated source.


### Additional owner-requested QA — November 9 Eastern

A fresh complete inventory on fc4ab49b4f01e7d152b229d8bc4be44423f63742 passed all 12 cases, all 417 tests and immutable TypeScript with zero diagnostics. Each of VWAP, EMA, SMA, RSI, MACD and Bollinger Bands passed its applicable six-timeframe, settings/calculation, persistence and native desktop/mobile checks. Shared scaling/date/crosshair checks passed. No implementation fixes or hosted/preview changes. See chart-indicator-additional-qa-20261109.md and the preserved JSON receipt.
