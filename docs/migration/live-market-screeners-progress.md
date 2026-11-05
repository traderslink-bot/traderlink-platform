# Live market screeners progress

See [plan](live-market-screeners-plan.md).

## 2026-11-02 audit, replay and calibration foundation

The owner authorized the first three stages of the internal Scanner Audit
system. The source implementation and verification record are maintained in
[Live Market Scanner Audit System Progress](live-market-scanner-audit-system-progress.md),
with the controlling design in
[Live Market Scanner Audit, Replay and Calibration Plan](live-market-scanner-audit-system-plan.md).
The audit hooks preserve member-facing ranking behavior and place durable writes
outside the awaited five-second scan path.

## Current slice

Owner resumed implementation after deferring setup detection. Coordinator granted
only new pure foundation source under `src/modules/scanner/live/` and these two
documents in the existing mixed News checkout. Branch/HEAD/index and all prior
work remain unchanged. Existing application compatibility is not established.

## Foundation checkpoint 1

Authored ten new TypeScript files: contracts, universe CSV/metadata validation,
daily union/idempotency, settings validation and revision conflicts, externally
verified calendar-day/session selection, snapshot normalization/batching,
rolling activity, focus/list evaluation, a pure rolling-budget state machine,
and the focused synthetic acceptance suite.

Key behavior: inclusive $100M collection ceiling, exact complete counts,
same-day union without removing earlier members, no silent venue changes,
explicit active-session fields, missing/duplicate/stale provider-row handling,
mandatory fresh positive float, current cap separate from collected cap,
flat/red daily momentum permitted, six-minute warm-up for the one-minute versus
preceding-five-minute volume rate, and immediate focus invalidation. Repeated
unchanged provider timestamps never confirm new activity. Quality gates take
priority over replacement hysteresis. No setup labels are implemented.

Proposed settings start disabled. Maximum float is unset because the owner
requires float but has not selected a maximum. Numeric activity/liquidity values
are explicitly provisional admin-editable starting values, not owner acceptance
or validated trading thresholds. Owner subsequently selected 20 stocks in BOTH
main lists, freely adjustable in admin within the 4,000-symbol supported universe
bound; focus remains a separate proposed default of 3. Source/test expectations
and this plan were updated as one owner-directed correction before test execution.

Owner further confirmed focused-stock counts must also be customizable. The
separate control already existed; its arbitrary 10-stock ceiling was removed.
Both main/focus counts now allow 1..4,000 (the supported universe bound), with
defaults 20/20 for lists and 3 for each focus card. Counts are independent.

The budget domain accounts actual dispatch reservations in a rolling window,
90/min headroom ceiling, scanner demand reservation (48/min for 1,251 stocks),
500ms minimum spacing, global 429 backoff, clock/restart history holds and
shared-priority deferral. It is not a wired global limiter. Single-writer atomic
history persistence and audit of every real transport call remain required.

Checks passed: static transpile of foundation modules; scoped strict TypeScript
checking of all ten source/test files (zero diagnostics); scoped ESLint (zero
errors/warnings). The first type pass found one narrowing issue; it was corrected
before the clean pass. No app-wide compatibility, runtime or UI pass is claimed.

The named frozen 20/20 checkpoint test gate passed: one file, 30 synthetic tests,
572ms suite duration, one fork under systemd user scope MemoryMax 768MiB / CPU100%,
Node heap 256MiB / timeout60s, no inherited app setup/plugins/global hooks. An
initial infrastructure-only invocation stopped before Vitest because /usr/bin/node
does not exist; the corrected PATH invocation ran the sole suite successfully.
The resource slot was released immediately. The later owner-directed focus-count
ceiling change was preserved at local checkpoint
`8507b840d07695a5185093906fbf3c0d99a89508` after the earlier local checkpoints
`6bee35694cb4c852bbc3f16ca1cbb7ba8f8739e9` and
`1c937031ec9c3b4fc0fa9d872ce1b2a034854a94`; Coordinator owns those preservation
refs. The mixed checkout branch/HEAD/index remain unchanged.

Revised focused acceptance now PASSES on that exact checkpoint: all twelve current
file hashes matched the preserved commit before execution; one file / 30 tests
passed, 580ms suite duration / 25ms tests. Same explicit isolated config and
systemd user resource bounds, no inherited app setup/plugins/global hooks or real
provider/DB/app/browser/build effects. No source edits during the run. The newly
granted resource slot was released immediately through Coordinator to Coaching.
This pass covers the configurable focused count as well as both 20-stock defaults.
The terminal-proof-only progress update was separately preserved at
`2fe58211eaab38363e365361d1cdfdfd520b33af`.
The complete
checkpoint allowlist is the ten files under `src/modules/scanner/live/` plus
this progress record and the linked plan; exact hashes go to Coordinator.

## Ingestion/storage source checkpoint 2

Coordinator allocated four new paths: universe-store.ts, universe-import-handler.ts,
universe-import.test.ts under live/server and the thin import route. Existing
dependency paths were matched to current main; no existing/shared file changed.
Source now implements the documented dedicated-token JSON import contract,
authentication before body/storage work, bounded payload/deadline, current Eastern
date and official-calendar checks, atomic fsync/rename persistence, immutable
projected evidence, idempotency, same-day union, fail-closed corrupt/symlinked data
and serialization across store instances in the single hosted process.

Strict scoped TypeScript (14 roots including new route/tests) and ESLint passed.
New filesystem tests were not run during implementation. At the frozen
`5313ae872c41cada9ee75a786fe4bb008a8dd97c` checkpoint, all sixteen source/document
paths matched the preserved packet byte-for-byte before the separately cleared
synthetic gate. The named scanner-ingestion-offline-vitest-20261101-v1.mjs gate
PASSED: foundation 30 plus ingestion 12, 42 tests across two files, 878ms total,
terminal exit 0. One serial fork ran in a systemd user scope with MemoryMax
768MiB, CPU100%, Node heap256MiB and timeout60s; no inherited application hooks.
Only synthetic temporary filesystem fixtures were used. The resource slot was
released immediately through Coordinator. No source changed during the run.
No actual import token, uploaded list, database file or runtime folder was used.
Proxy was inspected read-only and matches current main; no middleware change is
needed for this route's independent machine-token authentication.

Still required: current-source app integration,
actual PC-upload contract adaptation, runtime persistence/factory wiring for the
authored daily float enrichment, one background scan loop registration, results/admin
APIs, admin/user UI/navigation, News reads, Help guide, focused/runtime/browser
acceptance and owner visual review. No UI, real API call, runtime filesystem
write, worker, deployment or live upload exists from this slice. The new API
route exists only as unactivated local source. Existing mixed
News/research, branch/HEAD and index are untouched. Scanner feature is incomplete.

## Shared transport/live-feed source checkpoint 3

The pure Moomoo admission domain is now platform-owned, with the original
scanner import retained as a compatibility re-export. An opt-in single-process
shared dispatcher serializes actual outbound starts, persists its ledger before
dispatch, keeps the 90-per-minute headroom, reserves scanner demand, bounds queue
waits and applies provider-wide 429 cooldown. Eight existing consumer files now
route only their default fetch through it while preserving injected test fetchers,
provider contracts and existing Indicators admission behavior. With the flag
off, existing runtime behavior remains unchanged.

New source also provides dated Finnhub-first float enrichment with EODHD
`sharesFloat` fallback and an injected
live-feed coordinator. The coordinator uses only today's exact universe, verified
calendar sessions, 400-symbol snapshot batches, required fresh float, explicit
snapshot qualification flags and honest missing/partial coverage. It prevents
overlapping scans and schedules no backlog. Its authored five-second scheduler
requires both feature and shared-budget flags; no configured runtime dependency
factory or worker registration is active yet. Snapshot session-counter and
after-hours baseline semantics remain fail-closed pending real live qualification.

Targeted ESLint, scoped strict TypeScript including transitive imports, and diff
whitespace checks pass for this source batch. The frozen cumulative 29-path
checkpoint at `e0442357df93e8ba460adc342d447154e4b0e3f4` matched byte-for-byte before
the named isolated gate. Foundation 30, ingestion 12, and live-feed/transport 8
all PASS: 50 tests across three files, terminal exit 0, 1.28s total / 333ms tests.
The gate used one serial fork with MemoryMax 768MiB, CPU100%, Node heap256MiB and
timeout60s. It used only synthetic temporary files and injected fetchers; the
resource slot was released immediately. No source changed during execution.
No real provider/token/configuration, runtime filesystem, worker, database,
preview, build, browser or hosted effect occurred. The prior 42-test result
applies only to frozen checkpoint 2, not this new transport/feed source.

## Backend/runtime source checkpoint 4

Four new source paths add atomic revisioned settings/dated float-cache storage,
the configured runtime dependency assembly, authenticated member results, and
owner-only settings GET/POST. Settings keep Top Gainers and Momentum list/focus
counts independent. The admin route reuses the stable Watchlist-admin identity,
requires the existing same-origin mutation proof, bounds request bodies and
returns revision conflicts without overwriting newer settings.

The live feed now obtains all snapshot batches inside one server-only Moomoo
credential callback and queries existing News storage only for the final visible
list/focus symbols. The hosted worker contains only the opt-in start call. Both
the live-screeners and shared-budget flags must be true before it constructs the
runtime or schedules a scan. Provider timestamp/counter/after-hours semantics
remain explicitly unqualified and fail closed.

Targeted ESLint, scoped strict TypeScript for the six backend/API roots and
transitive imports, worker-file transpilation, and diff whitespace checks PASS.
The frozen cumulative 34-path checkpoint at
`4caf5d527cb230d8daef0292e58567e72093c9b0` matched byte-for-byte before the
updated isolated gate. Foundation 30, ingestion 12, and revised live-feed,
transport and settings 12 all PASS: 54 tests across three files, terminal exit
0, 1.50s total / 390ms tests. The same one-fork MemoryMax768MiB, CPU100%, Node
heap256MiB and timeout60s isolation was used. The slot was released immediately.
No actual
database/session/token/provider/settings/cache, startup, preview, build, browser,
configuration or hosted effect occurred. UI/navigation and live qualification
remain incomplete.

The two API routes are now thin adapters over an injected HTTP boundary. Nine
synthetic HTTP cases cover authorization before reads, private/no-store member
results, suppressed private errors, owner settings, mutation proof before owner
or storage work, bounded/malformed bodies, independent customized list/focus
counts and revision conflicts. Targeted ESLint, scoped strict TypeScript and
diff whitespace checks PASS. The frozen cumulative 36-path checkpoint at
`ba29a984ced7ef35ca24dc9eb6038118289b6118` matched before the named gate.
Foundation 30, ingestion 12, feed/transport/settings 12 and backend HTTP 9 all
PASS: 63 tests across four files, terminal exit 0, 1.61s total / 423ms tests.
The isolated resource slot was released immediately; no real authentication,
session, database, runtime, provider, browser, build or configuration was used.

## UI source checkpoint 5

The owner explicitly waived the separate layout-approval round and directed the
existing proposed layout to continue. New member and owner-admin dashboard pages
use the shared Material dashboard shell. Live Screeners keeps the legacy Scanner,
adds Top Gainers/Momentum tabs, coverage/session status, a focus panel that may be
empty, desktop table and compact mobile cards, and existing News/SEC links.
Screeners Admin renders the same results with controls above for enablement,
independent list/focus counts, session filters and focus qualification settings.
The admin route reuses stable Watchlist-admin access. Navigation places Live
Screeners after Scanner and Screeners Admin immediately after Watchlist Admin.
The Help Center now explains list/focus meaning, required market-cap/float facts
and News coverage limits.

Visible UI source is authored but not yet statically checked, tested, built or
browser-reviewed in this checkpoint. No preview, worker, provider, configuration,
upload, deployment or live-data activation occurred.

## Pre-QA correction batch

Before the first complete QA run, float enrichment was corrected to use Finnhub
Company Profile 2 `floatingShare` as the primary fact, converting its millions
unit with exact decimal arithmetic. Zero, invalid, missing or ticker-mismatched
Finnhub results use EODHD `sharesFloat` as fallback. The fallback now accepts the
verified symbol-keyed `data` response and rejects duplicate ambiguous rows.
Outstanding shares are never used.

Scanner News and SEC reads now use the Platform's read-only database helper.
Missing scalar values display `N/A`; floats display in millions or thousands,
such as `50M` and `760K`. Synthetic coverage was added for exact Finnhub unit
conversion, fallback behavior and ambiguous provider data. This correction batch
has not yet been counted as QA Run 1 and has no provider, database, preview,
browser, configuration, worker, upload or deployment effect.

Targeted ESLint, per-file TypeScript transpilation and whitespace checks pass
for the six-path correction batch. The scoped strict TypeScript check reached
the fixed 256 MiB Node heap limit and is recorded as blocked; it was not retried
or given a larger cap. The complete corrected QA gate remains pending.

Corrected QA Run 1 verified all 42 frozen paths, then ran 66 scanner tests. It
passed 65 and found one float fallback defect: Decimal classified positive zero
as positive, allowing a zero Finnhub float to block EODHD fallback. The parser
now rejects zero explicitly for both providers. The dashboard-template command
also exposed four existing shared-template baseline mismatches unrelated to the
scanner source. Scoped ESLint passed with three pre-existing shell warnings;
Help assertions and diff checks passed. A post-fix scanner run remains pending.

The focused post-fix recheck passed all 66 scanner tests across the four
foundation, universe-import, live-feed and backend-HTTP files. The frozen
42-path source matched the preserved checkpoint before execution. The transient
service exited successfully and released its shared lock with no remaining
processes. Post-stop systemd output did not retain the requested memory, CPU and
runtime property values, so functional test results are accepted as evidence
while resource-limit enforcement remains unproven by that reading. Browser and
live-provider qualification remain pending.

## Owner mobile-density revision

The owner reviewed the private phone preview, found the stock cards too tall
for rapid scanning, and then selected a true rows-and-columns table. Source now
uses compact expandable mobile tables in both the Focus stocks panel and the
main Top Gainers/Momentum list. Collapsed rows show
ticker, price, session gain, volume, float and a concise News/PR/SEC marker;
tap-to-expand reveals company, rolling movement, dollar volume, market cap,
spread, qualification reasons and article/filing links. Desktop presentation is
unchanged. Static checks and an exact single preview refresh remain pending;
this source update is not owner visual acceptance.

The next owner review removed the mobile table's horizontal and bottom card
insets, increased the compact table type slightly, and matched ticker symbols to
the existing Workspace PR Scanner `warning.main` color. This resolves to
`#8A4F00` in Light mode and `#FFC76B` in Navy Dark mode.

The owner then simplified the member page by removing the Live market activity
card and the count labels from both result-card headers. The Top Gainers /
Momentum tabs remain directly above Focus stocks. The admin page retains its
operational status and count labels.

The next mobile revision makes the expanded row use its space more effectively:
larger metrics appear first, null metrics and empty-news copy are omitted, and
the company name plus qualification reasons share a spaced footer. Press-release
and SEC links are no longer repeated in the expanded area because their markers
already appear in the collapsed row.

Owner review then removed that footer entirely: the company name and generic
qualification phrases did not add decision value. The expanded row now reports
the calculated volume-acceleration multiple numerically alongside the existing
one-minute, five-minute, dollar-volume, market-cap and spread values.

The expanded-row metric labels now use the same theme-aware `warning.main`
yellow as ticker symbols, while their numeric values retain the primary text
color for contrast.

The scanner now retains Moomoo snapshot `volume_ratio` and the applicable
premarket, regular and after-hours high fields without adding provider calls.
Expanded rows display regular/after-hours `RVOL` and `Below HOD`, calculated as
current price divided by the highest available price reached so far minus one.
Premarket RVOL is omitted because Moomoo defines volume ratio from the regular
market open. The Tools Help guide documents both values.

All 66 focused scanner tests, scoped ESLint and whitespace checks pass for this
addition. The repository-wide TypeScript check reached its bounded 1 GiB Node
heap and is recorded as blocked rather than retried with a larger allocation.

The separate Focus stocks card has been replaced by an attached upper area
inside the active Top Gainers or Momentum card. The active scanner title sits
above both sections, and a two-pixel divider separates the upper area from the full
list without a card gap. The compact expandable rows and previously accepted
yellow labels and metrics are retained.

Momentum now ranks qualified rows with a bounded composite of price movement,
volume acceleration, Moomoo RVOL, recent dollar volume and spread quality.
The upper area uses the same score after its stricter gates. A synthetic case proves
that sustained liquid activity outranks a larger isolated price move; the
focused scanner suite now passes 67 tests.

The owner removed the visible `Signals` label so the active scanner name is the
only title. Compact rows now provide a 900-millisecond green/red background
flash for observed price increases/decreases, with no initial-load flash and a
reduced-motion opt-out.

The owner clarified that the attached upper area belongs only to Momentum.
Top Gainers now renders its ranked list directly below its title, without the
upper area or divider. Momentum retains the unlabeled upper area, divider and
main qualifying list under its single title.

The expanded metric labels now set the ticker-matched `warning.main` color
inside their direct `sx` style rather than relying on Typography's separate
color prop. This makes the owner-requested yellow label treatment explicit at
the same style layer as the label typography. The owner also confirmed the
display distinction: Top Gainers emphasizes daily performance while Momentum
emphasizes emerging price and volume activity; shared context does not imply
shared ranking logic. The owner clarified that Momentum needs rolling
five-minute volume refreshed on each five-second scan and a comparison with the
immediately preceding five-minute window. The activity book now retains enough
timestamped cumulative-volume history to calculate both exact values, while
gaps, resets, missing counters and warm-up remain unavailable rather than
estimated.

The owner further separated price and volume movement: Momentum now displays
rolling `1m Vol` beside `1m %`, `5m Vol` and `5m %`. One- and five-minute
volume use exact cumulative-counter differences at their window boundaries;
the scanner no longer normalizes a shorter or longer observed interval into an
estimated rolling share total.

The approved mobile information layout now differs by scanner. Top Gainers'
main row shows ticker, price, day gain, session volume, float and a clickable
PR/SEC link. Momentum's main row shows ticker, price, rolling one- and
five-minute price change, rolling one-minute volume and float, with its PR/SEC
link attached to the ticker. Expanded rows use a roomier two-column reading
layout. They retain today's high and session low, label float turnover with the
standard turnover percentage, displayed under the compact `Turnover` label, and omit market cap from member output. Momentum adds day
gain, total and rolling five-minute volume, one- and five-minute volume-spike
ratios, RVOL and spread. Scanner news links now always open the corresponding
TraderLink article page, including articles whose full source text was not
available during ingestion.

The owner retained the application's standard table treatment but requested
denser collapsed rows. Mobile header and result cells now use reduced vertical
padding and tighter header line height so more qualifying stocks fit on screen.
Expanded rows keep their roomier reading layout because they are opened only for
a quick detailed review.

The owner also removed company names from the desktop results table. Ticker is
the table's stock identifier, which avoids a second text line and keeps desktop
rows aligned with the denser scanner presentation.

Desktop now uses separate tables for each scanner. Top Gainers emphasizes
Gain%, total volume, `$ × Vol`, float, Turnover, RVOL, Below HOD and News.
Momentum keeps Gain%, rolling `1min`/`5min` price change, rolling one- and
five-minute volume, one- and five-minute spike ratios, float, spread and News
visible. Its desktop rows expand to show `$ × Vol`, RVOL, HOD price and Below HOD,
session low and Turnover. The prior shared table is removed. Press-release and SEC links use the compact `PR` and `SEC` labels under
the common `News` heading. Market cap remains an admin filter rather than a
member-table column, and the desktop table uses tighter padding and type so the
decision fields fit cleanly.

Desktop tables omit the separate numeric ranking column. Their existing sort
order already communicates rank, while the removed column gives the trading
metrics more horizontal room.

The compact desktop Momentum headers use `1min ↑` and `5min ↑` for the two
volume-spike ratios. The arrow saves width while the neighboring rolling-volume
columns preserve the metric's volume context.

For the next owner visual comparison, desktop tables size to their column
content and stay left-aligned instead of distributing columns across the full
card width. Horizontal cell padding is reduced again; overflow remains
scrollable on narrower desktop viewports rather than compressing values.

The next desktop comparison replaces the single active-scanner card with two
equal dashboard columns: Top Gainers on the left and Momentum on the right.
Each table fills its half-width card with fixed, evenly distributed columns and
smaller desktop-only table type where required. Mobile retains the tabs and one
scanner card at a time. Momentum keeps its attached upper section within its
own card.

Within the half-width desktop Momentum card, the three upper selections now use
compact highlighted rows instead of large multi-line cards. Each row retains the
ticker emphasis, price, rolling 1min change and 1min volume while giving most of
the vertical space back to the qualifying Momentum table. Mobile keeps its
existing compact expandable table treatment.

Owner review then deferred the separate Momentum selections until live ranking can
be evaluated. Momentum now renders as one continuous scanner list on desktop and
mobile; focused selection data and admin configuration remain available for a
later design without occupying member-facing screen space.

Both scanner tables now open the app's existing TradingView advanced chart in a
wide right-side drawer. The drawer occupies the full viewport on mobile and most
of the viewport on desktop. A green candlestick icon beside each ticker opens the
chart, while the ticker and remaining row area retain the normal scanner expansion
behavior.

The News column now renders `PR`, `SEC` and `News` as compact text links without
chip backgrounds, preserving direct article access while returning horizontal room
to the scanner metrics.

On desktop, the candlestick action now occupies a narrow first column aligned to
the left edge of each scanner card. Ticker and metric columns shift right across
the available width, with deliberate separation between the chart action and the
ticker. Mobile retains the compact inline chart control.

The screeners route suppresses the page-level Help control while its guide remains
under review. The empty desktop status wrapper was also removed so the two cards
begin directly below the dashboard navigation.

The scanner surface now uses a smaller normal text-color title in each card and reduces the
route's top inset so the two desktop cards sit closer to the bottom edge of the top
navigation. Mobile receives the same compact title treatment with a smaller inset
reduction.

The member screen now includes a full-width Latest Press Releases card below both
scanner tables. It reads the existing membership-scoped News Scanner API and shows
30 articles as three fixed desktop columns of ten. Newest-first source order flows
down column one, then column two, then column three, so each new article pushes the
oldest visible item off the board. Mobile uses one newest-first list. Selecting a
headline loads the existing full article drawer and preserves read receipts.
Each compact row contains only ticker, stored market-cap display text and a
single-line article title; overflow titles use an ellipsis so all ten rows remain
aligned within each column.

Later owner review renamed this card `PR Scanner` and changed each article to a
two-line row: a larger ticker spans both lines on the left, while `Mkt Cap` and
`Float` sit above the ellipsized headline. The mobile list no longer draws its
own bordered card inside the outer dashboard card, giving article content the
full available inner width. Desktop retains three separate bordered columns.

The mobile scanner tables now reserve their final column for News links. A
dedicated first column holds the neutral details control and the next column
holds the ticker. The candlestick chart action moved into the expanded section
so it cannot displace the ticker. Desktop retains its dedicated chart-action
column.

Owner review accepted the current layout as the production-test baseline. The
first hosted test is restricted to the configured Traderlink owner profile:
ordinary members do not receive the Screeners navigation item, page or live-data
API. The PR Scanner now requests Float from the scanner's authoritative dated
Float cache for the article tickers instead of deriving coverage from the 20
currently displayed scanner rows. Unknown cached Float remains `N/A`; outstanding
shares are never substituted.

The accepted mobile table uses a dedicated first column with a neutral, enlarged
`+`/`−` details control. The chart action remains in the expanded section as a
large `View Chart` control anchored at the bottom right with reserved metric
space. Table headers receive additional bottom spacing on mobile and desktop.

Desktop Momentum now also uses a dedicated first column for a compact yellow
`+`/`−` details control, followed by a separate green chart-action column. The
controls retain independent tap targets while leaving the final News column
inside the half-width table.

The shared TradingView wrapper now waits until the responsive toolbar mode is
known and defers external script insertion until after the React effect settles.
This prevents a discarded development script from losing its parent and throwing
when the mobile scanner chart drawer opens or closes; the chart behavior and
provider remain unchanged.

## 2026-11-04 continuity audit correction

A current-main code audit verified the shared Moomoo request budget, session-aware previous-regular-close gain baseline, exact rolling activity windows, four early-momentum event types, 30-second signal cooling, whole-screen empty-response continuity, float/news enrichment, and member/admin access boundaries. The member presentation had one remaining continuity gap: a single failed browser/API poll retained the prior model internally but immediately replaced populated tables with the generic unavailable notice. The status helper now keeps a populated model visible for the same 30-second transient-failure grace and reports a sustained outage after that boundary. Focused continuity, feed, event, retention, and member-status verification passes 51 tests. The broader scanner run passed 248 tests; four runtime tests and one route suite could not load in this older assigned checkout because it lacks unrelated current-main Platform migrations/routes, so clean-current-main integration verification remains a release checkpoint.

## 2026-11-04 detection-engine audit

The qualification, scoring, ranking, retention and removal paths were audited against 4,809,710 stored observations from 6,546 cycles across November 2-3. The sample is useful for defect discovery but not final threshold calibration: all cycles were partial and only two trading dates are represented. Top Gainers correctly ranks the previous-regular-close day comparison, with a separate after-hours comparison. Rolling activity uses real receipt-time observations and bounded anchors. Momentum has distinct ignition, building-volume, price-burst, developing-activity, one-minute and five-minute signals, followed by 30-second cooling. Rapid Drops, Top Losers and Premarket High Pullbacks retain their separate observed-price contracts.

One structural contradiction was corrected. Strong early events were calculated before 30 seconds but then remained blocked by ordinary cumulative session volume and dollar-volume floors (300,000 shares and $500,000 in regular-hours defaults). `volume_ignition`, `building_volume` and `developing_activity` now use their existing adaptive liquidity proof—two of episode shares, episode dollar volume and float turnover—to replace only those two cumulative floors. Price, market cap, float, spread and every other filter still apply. A price burst alone cannot bypass the floors. Audit rejection reasons now use the same effective rule as qualification. Four focused suites pass 61 tests, including new positive and negative engine cases.

No outcome-based trading claim is made. The two-day data also shows that directionless volume and trailing price windows can keep a candidate active during a reversal. For completed five-minute outcomes, price-burst episodes had a 2.44% median maximum rise but a -3.15% median maximum drawdown; 278 of 952 reached +5% and 613 of 952 fell at least 2%. A configurable short-interval bearish-invalidation rule should be evaluated over additional complete trading days before selection; no arbitrary cutoff was added in this slice.
# Momentum liquidity qualification control — 2026-11-05

- Production audit evidence showed regular-session momentum averaging 20.3 qualifying stocks and peaking at 31 after strong early signals began bypassing cumulative liquidity floors.
- Early volume signals remain detected and audited, but cumulative volume and dollar-volume floors are enforced by default again.
- Scanner admin now has a per-session switch to allow early signals to bypass those two cumulative liquidity floors when the owner deliberately enables it.
- Focused scanner verification passed: 3 files and 77 tests.

## Halt instrument filtering — 2026-11-05

- Halt-feed normalization excludes issue names containing the whole-word ETF/ETFs or ETN/ETNs labels from both Nasdaq and NYSE source rows. Company halts and volatility reason codes remain eligible.
- Focused halt-feed verification passed: 1 file and 6 tests.

## Repeated-halt resumption isolation — 2026-11-05

- Verified production stored OMH's 11:05 halt separately but accepted impossible 09:31/09:42 resumption times from an earlier halt.
- Source normalization now rejects same-day resumption times earlier than the halt. Persistence retains learned valid times across blank refreshes while clearing impossible earlier values, and dashboard projection suppresses previously stored invalid times immediately.
- Focused halt verification passed: 3 files and 11 tests.

## Halt universe and market-cap eligibility — 2026-11-05

- Official halt rows now qualify only when the ticker exists in the current or latest retained combined scanner universe for that date and its collection-time market cap is at or below $200 million.
- The check uses the durable local universe and an in-memory lookup; it adds no provider request. BATS and NYSE Arca products absent from the Nasdaq/NYSE stock universe are excluded naturally.
- Halt-focused verification passed; the broader scanner runtime test remains blocked by unrelated missing Journal migration modules in the mixed workspace.

## Warrant-suffix universe exclusion — 2026-11-05

- Five-character symbols ending in W are excluded at both Nasdaq collection and combined-universe import boundaries. Durable universe reads also remove previously stored matching symbols immediately.
- The exclusion therefore applies to scanner snapshot requests, every scanner list and halt-universe eligibility without waiting for the next trading day's collection.
- Focused universe verification passed: 4 files and 62 tests.

## 2026-11-05 compact secondary scanner tables

- Halt Alerts now uses the shared chart launcher as its first column and opens
  the existing scanner chart drawer for the selected ticker.
- Its quote-time header is shortened to `Quote`, and the table fits the card
  width without forcing horizontal scrolling.
- Rapid Drops retains enough width for its additional measurements, while Top
  Losers and Premarket High Pullbacks use tighter column widths suited to their
  smaller field sets.

## 2026-11-05 visible-width expanded scanner details

- Expanded scanner details are constrained to the visible card viewport while
  the collapsed data row retains horizontal scrolling for additional columns.
- Momentum desktop details use a compact three-column grid within the card.
- Rapid Drops, Top Losers and Premarket High Pullbacks now use the same yellow,
  uppercase expanded-data labels as the primary scanner cards.

## 2026-11-05 pullback change column

- Premarket High Pullbacks now displays a compact `Change` column using the
  same session-aware basis as Top Losers: yesterday's regular close during
  premarket and regular hours, then today's regular close after hours.

## 2026-11-05 pullback volume correction

- The main Premarket High Pullbacks `Volume` column now displays the current
  snapshot's total session volume, matching the other scanner tables.
- Premarket-only volume remains available in the expanded details.

## 2026-11-05 compact price precision

- Rapid Drops, Top Losers and Premarket High Pullbacks now display sub-dollar
  prices with three decimals (for example, `$0.330`) and prices at or above one
  dollar with two decimals.

## 2026-11-05 halt card title

- The screener card title is shortened from `Halt Alerts` to `Halts`.

## 2026-11-05 provider request market-cap boundary

- The stored merged universe may contain stocks through $500M for configurable
  future use, but each live Moomoo pass now filters it before budget reservation,
  float lookup and batching.
- The request ceiling is the larger of the active session's Top Gainers and
  Momentum maximum-market-cap settings, so every configured scanner remains
  covered without requesting stocks that no active scanner can qualify.
- With the current $100M settings, the Nov. 5 universe falls from 2,352 symbols
  in six batches to 1,402 symbols in four batches.

## 2026-11-05 five-minute momentum qualification

- The ordinary rolling five-minute route now requires both a 3% price increase
  and at least 2x rolling volume versus the preceding five-minute window.
- A price move without matching volume expansion no longer creates the
  `five_minute_momentum` signal. Faster volume-ignition, building-volume and
  price-burst detection remain separate and unchanged.
- The existing scanner-admin controls remain authoritative, with new
  configurations starting at 3% and 2x.
- Focused verification passed: 2 files and 48 tests.
