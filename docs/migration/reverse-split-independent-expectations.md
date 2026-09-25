# Reverse Splits independent source expectations

Status: primary-source research checkpoint, 2026-09-25. **Not release acceptance.**

The owner requires thorough upcoming and historical testing before any further
Reverse Splits release or hosted reprocessing. The source owner maintains the
controlling `docs/migration/reverse-split-source-acceptance.md` in the release
checkout. This separate reviewer-owned report avoids concurrent edits to that
matrix. Coordinator owns integration, release, and any hosted application.

## Evidence boundaries

- These expectations were independently read from the primary pages through web
  retrieval or the existing authorized Chrome QA tab. Search aggregators were
  used only to discover primary links, never as factual authority.
- **Raw HTML hashes are pending for every source below.** Rendered/extracted
  text verification is not a downloaded raw-body hash. The source owner must
  capture the actual full fixture body and hash before a parser result can be
  associated with it. Do not substitute a hash of this report or a snippet.
- Parser pass, downstream pass, acquisition coverage, and primary expectation
  verification are separate states. All new cases below have verified primary
  expectations; their parser and downstream fixture results remain pending here.
- Independent rendered-DOM census at approximately 19:36 UTC confirmed 2,536
  benchmark rows: 242 Vote Approved, 9 Upcoming, and 2,285 Complete, across 1,484
  distinct ticker strings. These are not passed tests or proof of full market
  coverage. Lead's saved raw inventory remains to be reconciled byte-for-byte.
- All dates below are in 2026 unless explicitly marked otherwise. A published
  future trading date is not proof that trading subsequently commenced.

## Independently verified benchmark census

The anonymous rendered table contained 2,537 `tr` elements including its header;
counts above used actual DOM rows, not a potentially truncated locator response.
All visible button labels were inspected; none was a pagination control. This
describes the accessible continuous table, not any unexposed paid inventory.
Historical dates span November 29, 2019 through September 24, 2026.

All nine upcoming rows matched the lead's capture: GCDT October 7 ratio 6;
GMEX September 28 ratio 9; IMMP September 28 ratio 20; MTNB September 28 ratio 15;
DLXY September 28 ratio 5; BTLN September 28 ratio 8; CTNT September 28 ratio 150;
KITT September 25 ratio 6; RPGL September 25 ratio 15. The RPGL reference value
remains a disagreement with primary evidence, not an accepted expectation.

There are 2,534 unique composite keys `(ticker, displayed date, ratio, status)`
among the 2,536 rows. Exact one-based data-row positions:

- KTTA rows 21 and 151: blank date, range 2 to 20, Vote Approved, same float 87.33.
- TNXP rows 80 and 196: blank date, range 2 to 250, Vote Approved, floats 14.21
  and 13.41 respectively.

Do not silently discard either pair or infer whether these represent distinct
authorizations: no authorization date is supplied in these table rows. Preserve
row ordinals and resolve identity against source evidence. Multiple rows for a
ticker are otherwise expected when an issuer has more than one action.

## Assigned upcoming cases

| Case | Primary source and publication context | Independently expected facts | Important distinctions |
| --- | --- | --- | --- |
| GCDT | [6-K signed Sep 23](https://www.sec.gov/Archives/edgar/data/1926293/000149315226043831/form6-k.htm) and its [Exhibit 99.1](https://www.sec.gov/Archives/edgar/data/1926293/000149315226043831/ex99-1.htm) | 1-for-6; shareholder approval Aug 10; legal effectiveness Oct 7 at 12:01 AM ET; expected split-adjusted NYSE American trading Oct 7 at the open. | The 6-K cover only names effectiveness; the exhibit supplies trading and approval facts. Trading wording is qualified by applicable exchange procedures. Preserve that qualification and explicitly test its interpretation; do not equate it automatically with an unapproved shareholder proposal or ignore it. Par value 0.001 to 0.006 is not a separate action. |
| GMEX | [SEC Exhibit 99.1, announcement Sep 23](https://www.sec.gov/Archives/edgar/data/1928581/000149315226043932/ex99-1.htm) | 1-for-9; expected Nasdaq post-consolidation trading Sep 28; board approval Sep 2. | Explicitly no shareholder vote or approval required. Shareholder approval date stays absent. Class A/B/C consolidation and separate par-value reduction do not create multiple split ratios. Recognition must cover share consolidation and post-consolidation wording. |
| RPGL | [Nasdaq ECA2026-674, Sep 23](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-674), corroborated by [issuer announcement distributed on Nasdaq](https://www.nasdaq.com/press-release/republic-power-group-limited-announces-1-16-reverse-share-split-2026-09-23) | **1-for-16**, exchange effective Sep 25. | Lead's captured benchmark says 15; primary notice says sixteen and 1-16. Record a reference discrepancy, not a parser requirement of 15. Par value 0.50 to 8 is consistent context, not a second split. Notice supplies no shareholder approval date. |
| KITT | [8-K signed Sep 23](https://www.sec.gov/Archives/edgar/data/1849820/000184982026000142/kitt-20260923.htm) | 1-for-6; shareholder authorization May 27; legal effective Sep 24 at 8:01 PM ET; split-adjusted trading Sep 25 at market open. | Authorized numerical range is not stated in this document. Do not invent one. KITTW warrants in the cover table and adjustment discussion must not exclude the KITT common-stock event or create another event. Repeated same terms in Items 5.03 and 8.01 agree. |
| IMMP | [SEC Exhibit 99.1, announcement Sep 21](https://www.sec.gov/Archives/edgar/data/1506184/000119312526397189/d79097dex991.htm) | ADS exchange 20 old for 1 new, effective at Nasdaq trading commencement Sep 28. No shareholder approval required. | ADS-to-ordinary ratio changes from 1:10 to 1:200; the tradable ADS reverse ratio is **20**, not 10 or 200. ASX ordinary shares are unchanged. Date appears day-first. Sep 25 books closure, Sep 29 compliance counting, Sep 30 cash payments, and Oct 26 compliance deadline are not first split-adjusted trading dates. ADS cancellation transactions are not cancellation of the action. |

## Additional upcoming primary controls

| Case | Source | Expected facts and interpretation |
| --- | --- | --- |
| DLXY | [SEC Exhibit 99.1, announcement Sep 18](https://www.sec.gov/Archives/edgar/data/2025218/000121390026101140/ea030594701ex99-1.htm) | Class A Nasdaq post-split trading Sep 28, ratio 1-for-5. Shareholder authorization Feb 23, board final selection Aug 12. The authorized range is mentioned without numbers. Written one-for-five and separate Class A/B references must resolve to one ratio; share counts and par values are not additional ratios. |
| ONMD | [Nasdaq ECA2026-688, Sep 25](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-688) | Class A common stock 1-for-10; exchange effective Sep 29. No shareholder approval date supplied. |
| TRUG | [Nasdaq ECA2026-684, Sep 25](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-684) | Class A common stock 1-for-10; exchange effective Sep 29. No shareholder approval date supplied. |
| AGRZ | [Nasdaq ECA2026-682, Sep 25](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-682) | Class A ordinary shares 1-for-20; exchange effective Sep 29. No shareholder approval date supplied. |

The three Nasdaq notices above were read directly in Chrome after the web
retrieval tool reported them inaccessible. A tool retrieval failure is not
evidence that a primary source does not exist or that production cannot fetch it.

## Historical and negative controls

### MGN: postponement, revised ratio, unrelated date

[Nasdaq ECA2026-635](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-635)
has a Sep 3 header and updated content. It says the previously announced 1-for-40
action was postponed at the company's request. The revised ratio is 1-for-30,
with a new effective date to be announced. A Sep 9 CUSIP reversion is expressly
on an unadjusted basis.

Expected: preserve postponement; no current scheduled split warning from the
withdrawn timetable. Do not use Sep 9 as the split date, combine 40 and 30 as
simultaneously applicable final ratios, or lose the terminal state merely
because historical and revised ratios occur together. A postponed shareholder
meeting is a different fact and must not automatically cancel a split.

### PCLA: defined trading date and ADS cancellation language

[SEC 6-K signed Jan 20](https://www.sec.gov/Archives/edgar/data/2018462/000149315226002859/form6-k.htm)
reports shareholder resolution Dec 29, **2025**, a 1-for-30 reverse share split,
and Jan 26 as the defined Effective Date. The ADS trading paragraph explicitly
uses that defined date. ADS-to-common-share representation remains one-to-one;
30 existing ADSs are exchanged for one new ADS.

Expected: ratio 30 and Jan 26 announced trading date; historical as of Sep 25,
not a current Watchlist warning. The phrase about existing ADSs being cancelled
describes their exchange, not cancellation of the corporate action. The
authorized-share discussion's 30-for-1 phrasing must not reverse the economic
direction or corrupt the ADS ratio. Later operational completion still requires
its own evidence; merely passing the announced date is not proof of resumption.

### PED: delayed 10-Q and old unexpired authorization

[SEC 10-Q signed Aug 13](https://www.sec.gov/Archives/edgar/data/1141197/000165495426007591/ped_10q.htm)
explicitly reports post-split NYSE American trading began Mar 13 and a completed
1-for-20 split. The shareholder written consent was Oct 29, **2025**, authorizing
10-to-20 until before Oct 30, 2026. Board final selection occurred Feb 27 and the
certificate was filed Mar 10.

Expected: historical ratio 20 and trading date Mar 13. A separate note discusses
Feb 27 effectiveness of the consent/approval; it is not the trading date.
Repeated historical authorization does not become a new active warning simply
because its original outside deadline has not passed. Preferred conversions,
options, and retrospective financial-statement adjustments are not additional
common-stock split actions. August publication must not replace March event time.

## APUS exact live consumer reproduction

At 2026-09-25T19:22:35.534Z the authenticated endpoint
`/api/live-watchlist/reverse-splits?tickers=APUS` returned a fresh APUS row with
`status: Announced`, `watchlistLabel: Reverse split announced`, ratio 10,
and null trading/approval dates. It linked the
[Sep 23 filing](https://www.sec.gov/Archives/edgar/data/1894525/000121390026102321/ea0306326-8k_apimeds.htm).
Both the General Watchlist chip and ticker-detail Reverse Split card reproduced
the same warning. Coordinator verified the underlying cached body hash as
`9f89cbab1c87957906068f1a24d95d535820c5f410ef79a12305fe403402bf3a`;
this is coordinator-supplied raw evidence, not a hash independently recomputed here.

That filing describes the completed July 24 event. This is not a stale browser
chip. The API projection lacks the historical trading date. At immutable source
baseline `680a71c8d244c17fca90b6a26b646e68ada366f0`, date patterns recognize
begin/commence/start but not began. The consumer cannot recover a date the source
interpretation omitted.

Read path: source observations -> `resolveSplitEvents` -> dashboard row ->
`watchlistSplitStatus` -> authenticated no-store API ->
`useWatchlistReverseSplits` -> list chip / detail card. The hook replaces its
map after successful responses, refreshes every 60 seconds while visible and on
visibility return, uses a 10-second request timeout, and clears on failures.
It does not infer split state from Watchlist AI text or price changes.

### Consumer acceptance requirements

1. After correct versioned source application, the old APUS action is absent
   from the active-warning API; mounted list/detail consumers remove its chip
   and card on normal refresh without a user hard reload.
2. July 24 history and original source provenance remain available.
3. A superseded March expected date does not displace the actual July event.
4. A genuinely distinct later authorization or future split remains visible;
   do not hardcode APUS or hide all unknown-date announcements.
5. Cancellation, postponement, expired authority and past-date boundaries are
   covered, including multiple actions for one issuer and late reporting.
6. Account access stays private to the approved reviewers; API failures do not
   produce invented status. No new notification, opt-in, or publication side effect.

## Checkpoint and remaining work

- Independent primary expectations: recorded above; not executable test results.
- Known APUS, VRME, BTLN, CTNT, MTNB, MYPS, CDT, FBGL and AUUD full-source
  fixtures and the complete benchmark inventory remain with the source owner.
- Full raw fixture hashes, actual parser results, integrated lifecycle results,
  and acquisition coverage must be attached separately by the lead.
- RPGL reference-ratio discrepancy must remain explicit in the shared matrix.
- GCDT's exchange-procedure qualification and FBGL's explicit clearance condition
  require separate semantic cases; a blanket keyword rejection is not acceptance.
- No local heavy tests, source edits, hosted writes, notifications, or release
  actions were performed for this independent research checkpoint.
- A narrow APUS code patch alone is insufficient for the owner's broader release
  gate. No release or full-coverage conclusion is made by this report.
