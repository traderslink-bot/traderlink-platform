# Stock Levels Generator Progress

**Status:** November 20 source/configuration and real-market audits recorded;
owner-authorised Generator reference-price correction verified locally; not deployed.
Historical implementation/release records below remain preservation evidence.
**Controlling plan:** [Stock Levels Generator Plan](stock-levels-generator-plan.md)
**Approved route:** `/levels`

**Related owner administration:** [Stock Levels Admin Activity Progress](stock-levels-admin-activity-progress.md)

## Current VPS checkpoint - 2026-11-20 (Eastern)

- Assigned Platform workspace:
  `/home/traderlink/projects/levels-generator-20261120`, branch
  `codex/levels-generator-20261120`, source base
  `71202f8f052ea26f2a54fdb3816f525b135aa4d0`.
- Assigned supporting Runtime workspace:
  `/home/traderlink/projects/levels-generator-runtime-20261120`, branch
  `codex/levels-generator-runtime-20261120`, source base
  `af117845afed3272e7a3fe982148183f1c15e56e`.
- Both were verified clean during setup. Historical PC checkpoints below
  remain preservation records, not the current workspace/release status.
- Recorded the owner's micro/nano-cap focus and meaningful, uncluttered level
  selection requirements in the controlling plan. Quality takes priority over
  candidate count; consolidate redundant areas, retain useful wider coverage,
  and keep Full ladder selective.
- The source assessment identified live scoring-mode qualification and measured
  level-quality comparison as the next review steps. No scoring change or live
  configuration verification is claimed.
- Recorded the proposed baseline, representative-data, consolidated discovery,
  bounded correction, regression/comparison and visual-review sequence in the
  plan. Discovery findings, available candle data and held-out results remain
  to be established; the sequence does not report completed implementation.
- The initial documentation checkpoint changed only this progress record and
  the plan. Git commits, integration and releases remain with the assigned
  Coordinator. The later read-only audit results are recorded below.

## Read-only audit findings ledger - 2026-11-20 (Eastern)

The owner authorised the audit, requires an explanation of any concrete
proposed feature change before editing, and explicitly rejects changes made
only for their own sake. The owner also requires removal of temporary audit
data/outputs after they are no longer needed. These rules are recorded in the
plan. No feature-code or configuration change had been made at this discovery
checkpoint. The subsequent authorised correction is recorded below.

| Item | Evidence and status | Disposition |
| --- | --- | --- |
| Serving Runtime checkpoint | Read-only Railway deployment metadata still reports `5bd17add-567d-4d9e-95ac-263a0b2ef5ec` as `SUCCESS`. The source handoff binds it to Runtime `af117845`; deployment metadata itself exposes no commit SHA. | Keep the assigned source; do not substitute older Runtime main. |
| Scoring path | Both `LEVEL_RUNTIME_MODE` and `LEVEL_RUNTIME_COMPARE_ACTIVE_PATH` are absent from current service variables. Source resolves missing values to `old`; repository startup invokes the Runtime directly without a mode assignment, and live service config has no start-command override. | Source/config evidence points to the existing path. Do not enable the newer path merely because it exists. This is derived configuration evidence, not a process-exposed mode diagnostic. |
| Active provider profile | Authenticated read-only `GET /api/runtime/market-data-profile` returned HTTP 200: profile `alpaca`, all historical/live/same-day roles `alpaca`, `persisted=true`, `changing=false`. Older plan references to EODHD do not describe this current profile. | Record the distinction; no provider change is proposed. Keep the Generator's daily/4h input boundary. |
| Main-map clutter protections | Existing ranker prefers stronger spaced zones and suppresses weaker nearby bands. Shared Potential Path presentation clusters nearby levels, removes cross-side duplicates and bounds the main display to eight levels per side. | Preserve these controls. Their existence does not establish current market quality, but no absence of clutter protection is demonstrated. |
| Full ladder population | Existing engine retains non-weak daily/4h structure before the tactical bucket limits; the shared renderer derives both the main map and Full ladder from that inventory. | Compare the two displayed inventories separately on real candles. Broader inventory alone is not proof of a clutter defect. |
| Volume treatment | Existing-path candidate generation uses volume for low-price demand shelves. The newer structural-volume scoring path is not established as the active path by current configuration. | No blanket increase in volume weighting is justified from source alone. |
| Focused scorer verification | All 10 existing `src/tests/level-scorer.test.ts` cases passed under Node's TypeScript transform with an in-memory relative-module resolver. These cover weak evidence, meaningful higher-timeframe reactions and caps for heavily reused soft structure. No dependency installation, emitted build or source edit was needed. | Mechanical checks pass; they do not establish real-market level quality. |
| Broader mode-suite availability | `src/tests/level-runtime-mode.test.ts` could not start because the new Runtime workspace has no dependencies and `@stoqey/ib` is unavailable. No test assertions ran in that suite. | Infrastructure-unavailable result, not a demonstrated product regression. Do not report the suite as passed. |
| Representative data | No `data/`, `artifacts/` or `.validation-cache/` exists in the assigned Runtime workspace. Its two tracked JSON fixtures provide notification/AI-read evidence, not a suitable historical-candle dataset; no tracked market-cap classification dataset is present. | Real-candle/held-out comparison remains pending. Do not substitute synthetic test success or assume low price establishes micro/nano-cap classification. |
| Historical QA applicability | The older quality-detection script supplies daily/4h plus 5m context through the shared support/resistance adapter. Today's Generator excludes 5m input. | Historical reports are useful groundwork and do not by themselves validate today's exact Generator path. |

Initial source-only recommendation was to preserve feature behavior until
real-market evidence was available. The subsequent owner-directed batch below
now establishes an expanded Full ladder density concern; no feature edit has
been made and no broad scoring/provider change is justified.

The owner explicitly authorised asking the Release Coordinator to identify an
approved offline historical-candle dataset. That bounded request was sent to
`01a1f682-e1a5-7d11-9cae-19ba56c07242`; no production-data/credential transfer,
provider fetch, feature edit or operation was requested. The Coordinator
confirmed that no approved, usable offline historical-candle dataset is
currently established for this audit. Historical records mention an IBKR
warehouse and an under-$100M backfill, but do not establish an available VPS
dataset, exact coverage or dated micro/nano-cap classification. Do not scan
unassigned/private locations or copy production data to fill this gap.

The follow-up proposal to have the Coordinator arrange a dataset was superseded
by the owner's explicit direction to select stocks below $20M and generate/test
the levels in this feature chat. Direct access was then verified through the
existing gateway; no new infrastructure or credential provision was required.
The earlier assumption that an offline dataset was necessary was too narrow.

Retention at this checkpoint: no candle downloads, temporary dataset copies or
retained test/build outputs were created. Commands used memory-only test
execution and filtered configuration reads. Only this progress record and the
controlling plan have working-tree changes. No provider/generation requests,
preview, build, migration, restart, commit or deployment was performed. The
existing Help guide was reviewed; no guide change is required for this
documentation-only audit checkpoint. That retention statement describes the
earlier source-only checkpoint; the real-data batch below supersedes it.

## Owner-directed real-market batch - 2026-11-20, approximately 10:18 Eastern

Access is verified: the current gateway returned Alpaca SIP, split-adjusted,
complete daily/4h candle payloads. Existing gateway/Runtime access tokens were
used only in process memory, never written to source, artifacts or chat. The
dedicated `POST /api/runtime/stock-levels` invokes the actual serving Generator
without creating Platform saved maps/usage receipts or Watchlist entries. No
new local server, dependency installation or deployment was needed.

Selected eight current Nasdaq-reported common-equity/ordinary-share stocks
below $20M, across four cap bands and both high and middle reported activity.
Source: `https://api.nasdaq.com/api/screener/stocks?exchange=nasdaq&download=true`.
Caps are contemporaneous screener reports, not reconstructed share counts or
claims about capitalisation throughout the historical candle window.

| Ticker | Reported market cap | Generation result | Daily / 4h bars |
| --- | ---: | --- | ---: |
| CHSN | $731,159 | Map returned | 449 / 129 |
| MNDR | $1,312,915 | Reference price unavailable | 449 / 131 |
| FNGR | $3,745,981 | Map returned | 449 / 134 |
| ADVB | $2,891,233 | Reference price unavailable | 432 / 108 |
| VIVS | $5,912,056 | Map returned | 449 / 130 |
| NWTG | $7,224,583 | Reference price unavailable | 449 / 98 |
| BAER | $18,447,250 | Map returned | 449 / 129 |
| AIFA | $18,875,729 | Reference price unavailable | 449 / 105 |

All 16 historical requests returned HTTP 200 with `feed=sip`,
`adjustment=split`, `complete=true`. Validation checked finite, coherent OHLCV,
nonnegative volume, chronological unique timestamps and requested bounds.
Collection used the configured/default Generator lookbacks (520 daily and 180
4h) and its fetch-planning windows. Four HTTP 422 results remain explicit
unavailable cases, not successful maps. A later quote probe found ADVB/AIFA
last trades roughly 30 minutes old; MNDR/NWTG had acquired fresher trades by
that later probe. Do not retrospectively claim the probe proves every exact
generation-time quote age or relax the freshness guard to force a pass.

| Returned map | Main support / resistance | Expanded ladder support / resistance |
| --- | ---: | ---: |
| CHSN | 0 / 2 | 0 / 226 |
| FNGR | 0 / 5 | 0 / 229 |
| VIVS | 8 / 7 | 63 / 131 |
| BAER | 8 / 5 | 49 / 127 |

All 35 main-map levels were finite/positive, on the correct side of the captured
reference price, and within the existing eight-per-side limit; provenance
timestamps did not exceed calculation time. The smallest adjacent main-map
spacing in this batch was about 2.05%. Main-level prices matched or were within
0.46% of observed daily/4h OHLC anchors; this is an evidence sanity check, not
proof of predictive value.

The four expanded ladders contained 825 level rows in total, including 16
adjacent pairs separated by less than 0.1%. Examples: VIVS `0.3499` / `0.3500`
(about 0.0286%) and BAER `0.3859` / `0.3862` (about 0.0777%). The existing
Platform card renders the entire ladder body in an expandable `<pre>` without
another row-selection pass. This is a concrete density/redundancy concern
against the owner's new selective-ladder requirement; high row count alone
does not establish that every distant or nearby level lacks evidence.

Candidate scope to explain before any edit: consolidate essentially equivalent
expanded-ladder price areas, retain the strongest available evidence and its
provenance, and preserve useful wider coverage. Keep the main map, canonical
scoring and provider selection unchanged unless separate evidence justifies a
change. Any implementation must preserve accepted Watchlist behavior and be
compared against the captured cases before adoption. No arbitrary new row
quota, indicator addition or broad engine-mode switch is proposed.

This batch verifies real access, live generation, candle integrity, structural
price/side checks and a concrete clutter concern. It is not a browser review,
held-out forward-performance test, or completed acceptance of a correction.

Temporary audit data and the disposable runner are under the single owned root
`/home/traderlink/projects/levels-generator-runtime-20261120/artifacts/levels-generator-audit-20261120`.
The manifest records every created file. The batch is approximately 1 MB,
below the 100 MB ceiling. Retain only while the active evidence/before-after
review needs it; delete those owned files afterward and retain this compact
findings record. No feature source, configuration, account/database state,
Watchlist membership, credentials on disk or hosted release was changed.

## Requested 13-stock and reverse-split audit - November 20, 2026 (Eastern)

The owner explicitly requested AKAN, MEDS, LABT, BNAI, ELOG, VWAV, NXAT, NIVF,
RAYA, GNLN, GDHG, CYAB and SPRC and required reverse-split-aware assessment.
All 13 exact symbols were tested through the existing dedicated Runtime
Generator and market-data gateway. All daily/4h requests returned complete
SIP split-adjusted history. Raw daily history was fetched in bounded windows
covering the same available Generator history; raw intraday samples were
fetched only for the 4h basis comparisons.

| Ticker | Generator | Main support / resistance | Expanded ladder rows | Reverse splits checked in available history |
| --- | --- | ---: | ---: | --- |
| AKAN | Map returned | 8 / 8 | 248 | 1-for-3.125 Aug 26, 2025; 1-for-5 Jan 12, 2026; 1-for-4.5 Apr 13, 2026 |
| MEDS | Map returned | 8 / 7 | 305 | 1-for-50 May 26, 2026, under former symbol WGRX |
| LABT | Map returned | 8 / 8 | 174 | 1-for-10 Jun 22, 2026 |
| BNAI | Map returned | 8 / 8 | 181 | 1-for-10 Dec 12, 2025 |
| ELOG | Reference price unavailable | — | — | Raw/adjusted factors remain 1 throughout available history; no effective event identified in that window |
| VWAV | Map returned | 0 / 1 | 225 | 1-for-20 Sep 22, 2026 |
| NXAT | Map returned | 8 / 8 | 272 | 1-for-30 Aug 3, 2026, under former symbol KWM |
| NIVF | Map returned | 0 / 2 | 399 | Ten transitions: 20, 10, 5, 5, 3, 4, 3, 3, 4 and 8 old shares per new share; Feb 11, 2025 through Oct 23, 2026 |
| RAYA | Map returned | 8 / 8 | 276 | 1-for-220 Sep 30, 2025; 1-for-10 Apr 20, 2026 |
| GNLN | Map returned | 0 / 1 | 252 | 1-for-750 on Jun 27, 2025 trading basis; 1-for-8 Apr 6, 2026 |
| GDHG | Map returned | 0 / 6 | 226 | 1-for-25 May 9, 2025; 1-for-15 Aug 28, 2025 |
| CYAB | Reference price unavailable | — | — | Factors remain 1 today. Announced 1-for-30 Nov 23, 2026 event is future, not applied to Nov 20 data |
| SPRC | Map returned | 0 / 2 | 252 | 1-for-21 Jul 3, 2025; 1-for-9 Mar 4, 2026 |

Numerical verification:

- Compared 5,206 completed daily bars across all 13 symbols: 20,824 OHLC
  checks and all corresponding volume checks matched cumulative split factors
  within provider rounding (cent/fractional-cent prices and one adjusted share).
  Current forming-day bars were excluded because independently fetched live
  observations can change. All 26 observed split transitions matched their
  expected factor within 0.1%; no missing or duplicate adjustment was found in
  these tested daily calculations.
- Independently reconstructed 17 four-hour windows from raw minute bars:
  one recent completed window for every symbol, plus before/after NIVF's
  October 12 and October 23 splits. All OHLC checks agreed within provider
  price rounding. Recent-window volume totals matched exactly for all 13;
  the additional NIVF windows differed by at most 0.078% in minute aggregation.
  This is sampled 4h verification, not a claim about every historical 4h bar.
- A preliminary same-date daily-extrema comparison found extended-session
  4h prices outside the daily envelope. That was not classified as a split
  failure: direct raw-minute reconstruction verified the selected 4h bars.
  Session/aggregation differences must not be confused with split-factor errors.
- All 107 main-map levels were finite, on the correct side of captured price,
  within the eight-per-side limit and free of future provenance timestamps.
  The minimum adjacent main spacing was approximately 2.037%.
- The eleven returned Full ladders contained 2,810 rows, with 37 adjacent
  pairs separated by less than 0.1%. This reinforces the density/redundancy
  concern, while not proving that every distant level should be removed.

Assessment boundaries:

- Repeated reverse splits legitimately produce very large historical prices
  on today's share basis. NIVF's earliest sampled pre-split day carries a
  cumulative factor of 17,280,000; that agrees with the event chain. Large
  numbers alone are not fabricated data or proof of an adjustment bug.
  Whether those remote prices deserve space in a practical ladder is a
  separate relevance/selection question.
- Split-adjusted old volumes can round down to zero despite positive original
  volume: 38 sampled NIVF bars and 27 RAYA bars did so. Do not interpret those
  zeros as proof that the original sessions had no trading, or blindly compare
  raw and adjusted volume baselines across events.
- Current-symbol corporate-event lookups are incomplete for renamed/reused
  tickers. MEDS returned only a 2023 date; the WGRX lookup returned its actual
  May 26, 2026 event. NXAT returned no dates; KWM returned Aug 3, 2026. The
  raw/adjusted candle math correctly includes both events. This is an event
  metadata/identity limitation, not a demonstrated error in the Generator's
  prices. The Generator does not consume that event-date lookup to calculate
  levels; no Analyzer/shared event-service change is part of this audit.
- CYAB's Nov 23 event is announced but not effective at this Nov 20 checkpoint.
  Its raw and adjusted histories appropriately remain equal today. Live
  post-effective behavior cannot be claimed as tested in advance. Saved maps
  are historical snapshots and must retain their captured reference/time;
  new generation must use the current provider basis rather than rescaling
  an old saved map silently.
- ELOG and CYAB did not pass the reference-price gate during this batch.
  Neither is reported as a successful map or as a split-calculation failure.
  No freshness rule was relaxed and no synthetic map was substituted.

Primary source checks (dates distinguish announcement, legal effect and first
split-adjusted trading where applicable):

- AKAN: [Aug 2025](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2025-462),
  [Jan 2026](https://www.sec.gov/Archives/edgar/data/1888014/000121390026002345/ea027218101ex99-1_akanda.htm),
  [Apr 2026](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-232).
- MEDS: [DataMeds name/symbol change and May split](https://www.sec.gov/Archives/edgar/data/2030763/000149315226038581/form10-q.htm).
- LABT: [Nasdaq June split](https://www.nasdaqtrader.com/TraderNews.aspx?id=eca2026-422).
- BNAI: [SEC effective split terms](https://www.sec.gov/Archives/edgar/data/1838163/000149315225025613/ex3-1.htm).
- VWAV: [SEC September split announcement](https://www.sec.gov/Archives/edgar/data/2038439/000173112226001258/e7956_ex99-1.htm).
- NXAT: [SEC confirmation of August split](https://www.sec.gov/Archives/edgar/data/2000756/000182912626012552/nexusadvanced_ex99-1.htm).
- NIVF: [First sampled split](https://www.sec.gov/Archives/edgar/data/1981662/000121390025008566/ea022937301ex99-1_newgenivf.htm),
  [2026 interim history](https://www.sec.gov/Archives/edgar/data/1981662/000121390026112647/ea030961701ex99-1.htm),
  [October 23 effective terms](https://www.sec.gov/Archives/edgar/data/1981662/000121390026111191/ea0309267-6k_newgenivf.htm).
  Where retrospective narrative dates conflict, the specific effective-event
  filing and observed factor transition control this audit.
- RAYA: [2025 consolidation](https://www.sec.gov/Archives/edgar/data/1825875/000118518526001594/erayak20f123125.htm),
  [2026 consolidation](https://www.sec.gov/Archives/edgar/data/1825875/000118518526001594/R33.htm).
- GNLN: [2025 trading date](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2025-330),
  [2026 announcement](https://investor.gnln.com/sec-filings/all-sec-filings/content/0001493152-26-014529/ex99-1.htm).
- GDHG: [May 2025](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2025-232),
  [August 2025](https://classic.nasdaqtrader.com/TraderNews.aspx?id=ECA2025-466).
- CYAB: [SEC November 23 effective-date filing](https://www.sec.gov/Archives/edgar/data/2032341/000121390026121855/ea0312734-8k_cyabra.htm).
- SPRC: [July 2025](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2025-344),
  [March 2026](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-126).
- Provider contract: [Alpaca split adjustments affect price and volume](https://docs.alpaca.markets/us/reference/stockbarsingle-1).

No feature changes are justified to the tested split arithmetic. Preserve the
existing main-map protections. Any proposed narrower Full ladder selection
must retain the correct split basis, useful wider anchors and provenance and
must be explained before editing. No feature code, provider configuration,
Watchlist/account records, deployment, migration or Git history was changed.
This is source/API/numerical evidence; no browser acceptance or forward
predictive-performance claim is made.

Cleanup completed after numerical verification: removed 87 owned raw-candle
download files and disposable audit runners, freeing 2,549,314 bytes. The exact
deleted paths are recorded in the owned root's `cleanup-receipt.json`; no
unrecognised file or symlink was present. No raw candle downloads or temporary
runner scripts remain. Approximately 1.27 MB of captured map DTOs and compact
selection/quote/split/numerical findings remain for the active Full ladder
before/after review. Remove that remaining temporary evidence when the review
no longer needs it; retain this project findings record. No shared dataset or
source file was deleted.

## ELOG/CYAB availability diagnosis - November 20, 2026, 11:14 Eastern

The owner challenged the two unavailable results and asked whether the prior
price fix should have prevented them. Investigation confirms:

- The active resolver accepts the Alpaca latest qualifying trade only when
  it is finite/positive, on the current New York date/session, not future-dated
  and at most 60 seconds old. It makes one Alpaca lookup and returns null if
  that observation fails admission. The Alpaca profile does not enter the
  legacy Yahoo/EODHD fallback branch.
- The observations captured immediately after the original failures were
  ELOG `2026-11-20T15:28:49.183640214Z` at $1.70 (read at
  `15:30:19.273758Z`, approximately 90 seconds old) and CYAB
  `15:29:10.588684398Z` at $0.0572 (read at `15:30:32.733072Z`, approximately
  82 seconds old). These are post-request observations, not an exact trace of
  the failed resolver's internal fetch, but both exceed the same admission
  limit shortly after the failed requests. History availability and split
  arithmetic were not the reported failure reason.
- The relevant prior fix is Runtime
  `docs/stock-levels-agrz-freshness-2026-09-09.md`, which explicitly supersedes
  the earlier 20-minute delayed-price allowance. It records the owner's
  current-price requirement and the 60-second rule. The November 7 Alpaca
  integration (`14748d4`) added the Alpaca branch while preserving that rule.
  Do not describe the older delayed-HTTP plan as the controlling policy.
- A fresh read at `2026-11-20T16:14:04.705242Z` reported an authenticated,
  connected SIP gateway. ELOG's trade at $1.7701 was approximately 11.43
  seconds old; CYAB's $0.0615 trade was approximately 21.34 seconds old.
  Their latest bid/ask observations were also available. Immediate Generator
  retests both returned HTTP 200 using those actual trade observations:
  ELOG calculated at `1795191245812` and CYAB at `1795191246353` (epoch ms).
  The original failures remain recorded; these later successes do not erase
  them or prove a patch was applied.

Conclusion: intermittent reference-price admission, not a persistent inability
to generate those symbols or an observed split-adjustment error. The earlier
fix prevented stale/delayed observations from being presented as current; it
did not guarantee a qualifying trade in every 60-second window. Source alone
does not prove that the original gateway snapshot omitted a newer eligible
trade. Do not claim a feed/cache bug without that evidence.

At this diagnosis checkpoint, the owner was asked to choose the intended behavior
for a genuinely quiet stock: preserve 60-second admission with a short,
bounded same-provider refresh/retry, or allow a same-session last trade up to
five minutes old with its true age clearly labelled. This is a material
reference-price contract choice, not a release/implementation permission
request. Neither widening the age limit nor adding provider fallbacks has been
implemented. A bounded retry can improve acquisition opportunities but cannot
guarantee a new qualifying trade when the market supplies none.

The split discussion is also clarified: mathematically correct split-adjusted
historical prices do not automatically deserve display in a useful map.
Practical relevance and nearby redundancy remain the separate Full ladder
selection concern; this diagnosis does not justify exposing every old level.

No new raw dataset or persistent test output was retained for this diagnosis.
No feature source, configuration, database state, Watchlist entry, Git history
or deployment changed. The existing compact map baselines remain for the
active selection review and retain their cleanup requirement.

## Confirmed workspace and ownership boundary

- [x] Coordinator confirmed the assigned Platform worktree is
  `C:\Users\jerac\.codex\worktrees\8fe4\traderlink-platform`, branch
  `codex/stock-levels-generator-20260826`, at production parent
  `5cf778be8f05372e6da1ab4c0e110b0278b788a3`.
- [x] Coordinator confirmed the canonical Levels runtime is
  `C:\Users\jerac\Documents\TraderLink\levels-system-post-mtf-handoff-stability`,
  branch `codex/levels-runtime-recovery-20260825`, at
  `9c51bfd7a6c981f0045813f47fa1c679f3e8d18e`.
- [x] Preserved the runtime's unrelated untracked `.git.orphaned-worktree-link-20260825`,
  `.vscode/`, and `data/` entries.
- [x] Checked the Coordinator register: no active worker owns the shared
  navigation, Help registry, Platform migration registry, reusable Potential
  Path component/CSS, or the new runtime endpoint.
- [x] Confirmed official Watchlist and Community Watchlists remain separate
  products. The existing Watchlist runtime is the sole publisher and this
  slice must not activate any Watchlist lifecycle.

## Contract and design inventory

- [x] Recorded the complete owner-approved product, API/runtime, quota,
  component/CSS, Help, migration and documentation inventory in the controlling
  plan before implementation.
- [x] Located the accepted visual baseline: `WatchlistV2PotentialPathCard` in
  `app/watchlist/live-watchlist-client.tsx` and its `watchlist-v2-*` selectors
  in `app/globals.css`. The existing card already supplies nearest levels,
  side-by-side support/resistance rows, level provenance and a closed `Full
  ladder` `<details>` control.
- [x] Confirmed the canonical runtime has EODHD daily/4h history and EODHD
  extended quote support; Moomoo is the currently selected same-day provider
  and Yahoo remains selectable. Same-day candles are supplementary context
  only; no provider selection or setting was changed.
- [x] Confirmed the canonical engine can produce output when 5-minute data is
  unavailable if daily or 4h candles remain usable. Daily/4h are the product's
  main structural context and same-day is supplementary, but this feature does
  not filter, re-rank, or otherwise change the established generator result.
- [x] Audited the original Stock Levels DTO mapping and removed its independent
  zone projection, nearest-level selection, and Full ladder formatting. The
  endpoint now uses the exact pure Watchlist snapshot-to-Potential-Path map,
  label/provenance, role-flip, ordering, nearest-level, and ladder/card
  construction; the Dashboard passes that result directly into the shared card.
- [x] Extracted the existing engine-output-to-`LevelSnapshotPayload`
  preparation boundary. The Watchlist manager passes its current state/context
  unchanged; the on-demand endpoint supplies only fresh engine output and
  factual symbol/reference-price/time, without reading or mutating Watchlist
  state, monitoring, a publisher instance, Discord, AI, session fallback, or
  prior-close state.
- [x] Applied the owner-approved generator presentation correction: `/levels`
  now uses the complete existing Potential Path outer and inner class stack,
  shows only its calculation-time price/date sentence, omits the separate
  nearest-level summary, and links its top-right question icon to the public
  Watchlist how-it-works guide. The existing Watchlist card remains unchanged
  by default.
- [x] Corrected the exact-parity boundary after staging visual review: the
  original Watchlist outer Potential Path article/topline/kicker/guide path is
  now a single shared component for Watchlist and `/levels`; `/levels` also
  uses the existing Academy-shell, container, Watchlist-page and card-grid CSS
  context without importing the public navigation. Removed the entire stale
  `How to read this map` Dashboard panel and both of its explanatory
  paragraphs; the approved on-card question-mark link is the remaining Help
  entry point.
- [x] Normalized an on-demand ticker with unavailable reference/candle data to
  the concise trader-facing result `Data is not available for this ticker right
  now, try again later.`;
  provider-specific EODHD wording is not exposed by the Dashboard.
- [x] Reused the stable configured owner Discord-subject boundary from
  Watchlist navigation for the two owner accounts: they do not read, consume,
  reject against, or create Support and Resistance quota receipts; their page
  feedback is `No request limit`. Ordinary authenticated accounts remain at
  five fresh requests per hour and fifteen per New York day.
- [x] Corrected the saved-map quota-response adapter: initial load, generation,
  regeneration and delete now share validated quota feedback, rendering the
  owner-null response exactly as `No request limit` and never interpolating
  missing quota values.
- [x] Corrected the ordinary Get Levels request shape: it omits the optional
  replacement identifier, while Regenerate alone sends its saved map's valid
  UUID to the existing replacement boundary.
- [x] `/levels` passes the explicit `Support and Resistance` header label into
  the shared card; Watchlist retains its default `Potential Path Levels`
  label. The left Stock Tools navigation label is `Levels Generator`, while
  its href, route title and Help mapping remain unchanged.
- [x] Verified private 72-hour map persistence: migration `0090` stores each
  mapped-card snapshot with its authenticated `user_id` and expiry; the
  account-scoped `/api/levels` read loads unexpired maps newest-first after
  reload/return. The newest card is open at the top; older maps are collapsed
  factual summaries and expand without a fetch, quota receipt or regeneration.
- [x] Added a clear native-details chevron to each collapsed saved-map summary;
  it rotates open while retaining the approved title, card surface,
  Regenerate/Delete controls and shared card body.
- [x] Corrected session-history presentation without changing the shared card
  body: prior-result details span the same full grid width as the current map,
  use the existing card surface/border treatment while collapsed, use the
  page-title-sized blue summary text on desktop, and add the approved first
  history gap with smaller mobile spacing and responsive text sizing.

## In progress

- [x] Add the owner-approved 72-hour private saved-map lifecycle: initial
  account-scoped load, separate Get Levels snapshots, regenerate-in-place to
  top, and delete without Watchlist coupling. Migration `0090` is registered
  only; it has not been run locally or in Railway.

- [x] Add the isolated runtime calculation endpoint, narrow DTO, syntactic
  ticker validation, EODHD reference-price requirement,
  in-flight deduplication and fifteen-minute shared cache.
- [x] Add Platform authenticated relay, persistent account quota receipt
  migration and truthful remaining/reset feedback at five fresh requests per
  hour and fifteen per New York trading day.
- [x] Refactor the exact existing card/CSS into a shared renderer, build
  `/levels`, add the Stock Tools navigation item and contextual Help mapping.
- [x] Add the dedicated Stock Levels Help guide and registry coverage.
- [x] Update route/migration ownership records at the implementation
  checkpoint.
- [x] Complete focused source/diff review and create narrow corrective commits
  in both repositories.
- [ ] Send the Coordinator the revised preview-ready handoff; Railway staging
  build and owner visual review remain external release boundaries.

## Local commit checkpoint

- Platform feature baseline: `cd8b24651758abedbdead5b2e2a960d57182d3bf`
  (`feat(stock-levels): add dashboard generator boundary`).
- Platform reuse correction: `3547a059` (`fix(stock-levels): reuse canonical
  levels surface`).
- Canonical Levels runtime: `ba2ab19` (`feat(stock-levels): expose canonical
  generator safely`).
- Runtime presentation correction: `3bf9f26` (`fix(stock-levels): share
  Watchlist presentation`).
- Platform card-data correction: `2bc30703` (`fix(stock-levels): share
  Watchlist card data`).
- No commit was pushed, and no server, test suite, build, browser automation,
  provider call, migration execution, deployment, restart, or configuration
  change was performed.

## Constraints retained

- No local server, Vitest/broad test run, provider call, migration execution,
  browser automation, build, staging, push, deployment, restart or variable
  change has been performed.
- UI approval is the first acceptance goal. No visual approval, staging result
  or production approval is claimed.

## Generator last-trade correction — 2026-11-20T16:31:12.491953+00:00

The owner delegated the price-policy choice after the daily/4h historical inputs and separate reference price were explained ("you do what works best"). The proposed change and its rejection rules were stated before feature edits. This supersedes the pending choice recorded in the diagnosis; it does not broaden scoring or provider scope.

- Generator opts into a same-New-York-date/session policy for genuine Alpaca/EODHD trades. A quiet stock no longer needs a trade in the last minute. Missing, invalid, future and prior-session prices remain rejected during active trading. The existing 96-hour closed-market allowance remains unchanged.
- The shared resolver defaults to the original 60-second rule, preserving Private Watchlist behavior. Yahoo observations may include candle closes and retain their strict age limit. No provider fallback or retry is added.
- New maps carry an optional reference-price basis so actual trade-backed maps can say Last traded price, preserving the observation timestamp separately from calculation time. Old saved maps without that provenance remain Reference price. Storage remains existing JSON; no migration is required.
- Initial four-file Runtime regression: 15/15 pass, including both recorded ELOG/CYAB age cases, source/feed checks, invalid/future/prior-session rejection, session change during generation, unchanged historical profile, in-flight coalescing and fresh price resolution on subsequent requests. Native default policy remains strict.
- Missing Runtime dependencies justified a lockfile install: 25 packages, 3 seconds. Both canonical common-heavy and exclusive QA guards were held through child completion and released afterward using owned inode checks. Host memory pressure was zero; memory available remained about 6.5 GiB. This is local source verification, not hosted acceptance.
- Platform package and lock files exactly match the Coordinator-named tooling donor; Vitest, TypeScript, React, MUI and SQLite versions match. No Platform dependencies were copied or installed. Preserved price-label comparison remains queued for Coordinator read-only confirmation before the client wording edit.
- Help Center review identified a required explanation update covering historical inputs, the separate last-trade anchor, true observation time, closed-market allowance and static snapshots. The guide is updated in this slice.

Further local type, engine/presentation and current-ticker checks remain in progress. No commit, push, preview update, deployment, hosted state write or account generation receipt is authorised or performed.

### Completed Runtime correction checks — 2026-11-20T16:36:28.238042+00:00

Full Runtime TypeScript (`tsc --noEmit -p tsconfig.json`) passes with zero diagnostics. The coherent four-file Generator/LevelEngine/runtime-mode/live-publisher suite passes 134/134, including the new Yahoo-reference label case. The earlier 15-case resolver/provider/reference-profile batch also passed. These counts overlap in Generator tests and are not a unique-test total. Engine scoring and daily/4h logic remain byte-unchanged.

The changed local Generator then generated all 13 requested tickers from real SIP trades and split-adjusted daily/4h gateway history, with Runtime mode old and the existing 520/180 lookbacks. No one-minute or five-minute history request was made. Every output preserved the exact provider price and event timestamp, was finite, had correct price-relative sides, and stayed within eight main levels per side. The pre-existing split audit remains the split-factor proof; it was not needlessly repeated.

| Ticker | Last trade | Age at read (seconds) | Main support / resistance |
| --- | ---: | ---: | ---: |
| AKAN | 4.5201 | 3.298 | 8 / 8 |
| MEDS | 1.055 | 1.593 | 8 / 6 |
| LABT | 0.2533 | 0.510 | 8 / 8 |
| BNAI | 3.28 | 5.428 | 8 / 8 |
| ELOG | 1.86 | 8.977 | 8 / 8 |
| VWAV | 0.1922 | 1.440 | 0 / 1 |
| NXAT | 0.613 | 0.055 | 8 / 6 |
| NIVF | 0.0252 | 1.090 | 0 / 2 |
| RAYA | 0.5565 | 0.465 | 8 / 8 |
| GNLN | 0.4999 | 59.543 | 0 / 4 |
| GDHG | 0.1083 | 0.928 | 0 / 8 |
| CYAB | 0.064 | 34.200 | 4 / 7 |
| SPRC | 0.1885 | 59.314 | 0 / 2 |

All current observations happened to be under 60 seconds old. This real-source run establishes integration and ticker coverage; the preserved original ELOG/CYAB observations and deterministic boundary tests establish the change for older trades. No claim of a new live >60-second case is made. No raw candles, credential material or generated map DTOs were written for this run; only temporary compact numerical results were retained pending documentation/cleanup.

Both canonical guards were held through actual child completion and then released. This is a changed-source local market-data check, not a hosted deployment or production acceptance. Main-map spacing still comes from the existing selector; some cross-side adjacent gaps are below two percent at the new prices. No new uniform two-percent spacing guarantee or broader Full ladder quality acceptance is asserted.

### Final local correction checkpoint — 2026-11-20T16:43:14.833787+00:00

Coordinator independently confirmed that both preserved PC label edits already match assigned source, including the separate observation/calculation times and priceNoteOwnLine; no additional accepted label change was known in release custody. The bounded client wording change then proceeded. Existing layout and shared Light/Navy theme styling are untouched. No page, control or navigation structure changed, and no browser visual acceptance is claimed.

Platform validation: two selected contract/membership files pass six tests, covering saved-map backward compatibility, real-trade provenance, observation time and pre-runtime allowance rejection. Strict focused TypeScript checks all four changed source/test roots and 2,173 transitive source/declaration files with zero diagnostics. Focused ESLint passes; its React auto-detector warned about absent assigned node_modules and assumed latest, while strict types used the actual lock-matched React declarations. Initial external-checker attempts exposed dependency/type resolution errors (776, then 28, then one missing Next CSS ambient declaration); the disposable checker was corrected to use canonical declaration paths and actual Next ambient types, with no product-code workaround, stub or diagnostic waiver. Full Platform build and browser preview were not run for this small contract/copy slice.

The Coordinator-named donor package and lock hashes are respectively `9f94db3b0ba3da0eef727970b56798ba29f90bfa64a5769923d2863b3cb0d1bb` and `4cefe56a3899db538c7adec0956fb7236664c78009d5c78c824a12c869357bcb`, identical to assigned source. Vitest 4.1.4, TypeScript 5.9.3, React 19.2.4, MUI 9.2.0 and SQLite package 12.9.0 matched. No donor dependency/configuration writes occurred.

Source allowlist (besides this progress record and its controlling plan):

| Workspace | File | SHA-256 |
| --- | --- | --- |
| Platform | `app/(dashboard)/levels/stock-levels-client.tsx` | `35ffa5452d1b0cff8793f2e047ab3c59bd27f13f039781773388a10249b4a0aa` |
| Platform | `src/modules/stock-levels/stock-levels-contract.ts` | `f564b967686916f37dd1bca90c8968efc7a04e847a06379279b15a9c838d6490` |
| Platform | `src/modules/stock-levels/stock-levels-contract.test.ts` | `bb44328f03fe5a3ed4e849459236c124bed6097e5181c7934b1be7bb24892969` |
| Platform | `src/modules/help/stock-levels-guides.ts` | `6014fa01a8c2db6a4fe3a42ee189ef7c9cd73abc0a20d67138337239f641787d` |
| Runtime | `src/runtime/stock-levels-reference-price.ts` | `e51c33e87ab8083441f76dd3f27d7a930cdfcac1085183b02b4a0de066bed24f` |
| Runtime | `src/runtime/stock-levels-generator.ts` | `6f6f9e4b303e6954296f7783acd2f629d825b03b1804847114ba09f0a54007e7` |
| Runtime | `src/tests/stock-levels-reference-price.test.ts` | `9bf2d558bc55436e8fbb5617e5ac8327f845966619bd299568ec0ec8b5a49fa8` |
| Runtime | `src/tests/stock-levels-generator.test.ts` | `de7e493e69522d72ed9342271b10b307e75da6f0ff42cf40f125a6e1fc3c8b86` |

Runtime reproduction after a lockfile install: `node --max-old-space-size=2048 node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`; direct `node --import tsx --test --test-concurrency=1` against the named resolver, provider, reference-price, Generator, engine, runtime-mode and publisher test files. Avoid npm test because its pretest process cleanup is unrelated to this slice. Platform units use the named two files, the lock-matched read-only donor Vitest and one worker; focused types use repository strict options, real dependencies and Next ambient declarations. All resource-bearing checks used both canonical guards through child settlement; owned guards were released.

No historical/scoring, split-adjustment, ladder selection, provider profile or Private Watchlist source was changed. No API route, quota writer, database schema or migration changed. New price-basis JSON is optional in Platform, so both old saved maps and old Runtime replies remain readable. Runtime-first or Platform-first integration is backward-compatible; the Last traded price wording appears once a new trade-backed map supplies the marker. Full ladder redundancy/relevance remains the separately measured audit finding, not an accepted correction in this batch.

Ready for Coordinator source preservation/review only. No feature-worker commit, index/ref change, push, deployment, hosted configuration, preview start/restart or account-data write occurred. The running hosted Generator remains unchanged until a separately authorised coordinated release.

### Final temporary-data cleanup — 2026-11-20T16:43:15.099604+00:00

Under the owner's retention instruction, verified every remaining audit file against the task manifest, found no unknown files or symlinks, and removed the exact owned audit root `/home/traderlink/projects/levels-generator-runtime-20261120/artifacts/levels-generator-audit-20261120`: 65 files / 1278259 bytes. This includes the remaining old map/quote/event summaries, compact comparison results, manifest/receipt and disposable runners. Earlier cleanup had already removed 87 raw downloads/runners / 2,549,314 bytes. The durable numerical findings and source vector remain in this progress record.

Also removed this task's newly installed Runtime `node_modules` after all checks completed: 3430 regular files / 90873522 bytes, plus internal dependency links/directories. This directory was absent before the task install and no other workspace dependency tree was removed. Future Runtime checks can reinstall the unchanged lockfile when needed. No raw audit candles, map output or transient test runner remains. No shared source dataset, owner data, credential, donor dependency tree or preserved source was removed.
