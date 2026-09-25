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
- **Raw HTML hashes were pending at the initial checkpoint.** The later fixture
  integrity checkpoint below records exactly which supplied bodies were verified.
  Rendered/extracted
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

## First approval cohort: independent primary expectations

Reviewed September 25, 2026. The source owner assigned the first twenty approval
rows, with FBGL retained by that owner; the nineteen cases below are this
reviewer's allocation. Benchmark ratios are discovery values, not authority.
These are document-level expectations, not a claim that every later filing was
acquired or that parser/lifecycle tests passed. Final trading dates and selected
ratios remain unknown where the cited document does not establish them.

### HKPD - fixed ratio, exchange date not yet supplied

Benchmark: 20. [6-K signed September 23](https://www.sec.gov/Archives/edgar/data/2007702/000121390026102385/ea0306235-6k_cellyan.htm)
reports shareholder approval on September 21 for a 1-for-20 Class A/B
consolidation. September 9 is the record date, not approval. Effectiveness is
on the date Nasdaq confirms without objection; no actual trading date is given.
The separate conditional articles amendment does not undo the shareholder vote.
The [September 9 proposal](https://www.sec.gov/Archives/edgar/data/2007702/000121390026098532/ea030497601ex99-1.htm)
cannot independently establish that later shareholder approval already occurred.
Keep the earlier December 2025 range authorization separate from this final ratio.

### NXGL - revised authorization, cover warrants not an exclusion

Benchmark: 2 to 20. [8-K signed September 23](https://www.sec.gov/Archives/edgar/data/1468929/000149315226043955/form8-k.htm)
reports September 23 shareholder approval for a board-selected ratio from 2 to
20 within one year. Final ratio and trading date are not supplied. The vote
table supports approval; NXGLW appearing in the securities cover is not a
reason to discard the common-stock action. Earlier 2-to-10 proposals must not
overwrite these later approved terms. No independent claim about the outcome
of the earlier proposal is made here.

### IPW - new authority following prior completed actions

Benchmark: 2 to 250. [8-K signed September 22](https://www.sec.gov/Archives/edgar/data/1830072/000168316826007276/ipower_8k.htm)
reports September 21 approval for one or more reverse splits up to 1-for-250,
at board discretion. This document does not supply a lower bound of 2, an
expiry, a final selected ratio, or a trading date. August 3 is the record date.
The [May 22 filing](https://www.sec.gov/Archives/edgar/data/1830072/000168316826004228/ipower_8k.htm)
describes a prior 1-for-8 action under December 2025 authority, while the
[August issuer announcement](https://ipower.gcs-web.com/news-releases/news-release-details/ipower-inc-announces-1-9-reverse-stock-split)
describes an August 7 1-for-9 action. Neither completed action consumes this
new September authorization. Test source-order independence and repeated issuer
actions rather than merging all IPW observations into one lifecycle.

### SKYQ - two sequential authorizations, benchmark range is wrong

Benchmark: 2 to 250. [8-K signed September 22](https://www.sec.gov/Archives/edgar/data/1812447/000109690626001404/skyq-20260918_8k.htm)
reports September 18 approval of two sequential authorizations, each from 2 to
25. The first is exercisable on or before the two-year anniversary; the second
on or after the first action and before that anniversary. Do not invent a
2-to-250 range or call the product 625 an announced final ratio. Neither action
has a final ratio or trading date in this document. The voting rule is majority
of votes cast, not outstanding shares: the word "not" must not invert approval.
A proposal-number typo in the result paragraph requires contextual reading.
The earlier March 1-for-8 action is separate history, not fulfillment of these
new September authorizations.

### ZCMD - calendar-derived legal date versus trading date

Benchmark: 2. [6-K signed September 21](https://www.sec.gov/Archives/edgar/data/1785566/000121390026101807/ea0305890-6k_zhongchao.htm)
reports September 18 approval of two old Class A/B shares into one new share.
The resolution takes effect on the tenth calendar day following passage:
September 28 is a derived legal date, not an independently stated exchange
trading date. Preserve the derivation and date kind; this source does not say
when adjusted trading starts. The capital cancellation and subdivision in the
next proposal neither cancel the split nor define another reverse ratio.
Earlier 1-for-8 and wider authorities must not replace this new 1-for-2 action.
The adjournment proposal was not presented because the other votes passed;
that is not a split postponement.

### PFSA - approval established by final voting results

Benchmark: 2 to 12. [8-K signed September 18](https://www.sec.gov/Archives/edgar/data/1859807/000121390026101568/ea0306040-8k_profusa.htm)
reports September 18 final voting results for one or more 2-to-12 splits,
aggregate no greater than 12, during the next two years. The text introduces
what shareholders were asked to approve; the final table supplies 262,920 for,
17,360 against and 7,610 abstentions. Do not require a literal "was approved"
sentence while ignoring the actual result table. The
[definitive proxy](https://www.sec.gov/Archives/edgar/data/1859807/000121390026095087/ea0302274-02.htm)
specifies September 18, 2028 as the deadline. Final ratio and trading date are
not given. Permission to adjourn is not an actual postponement.

### SNGX - authorization not a final selected split

Benchmark: 2 to 20. [September 17 meeting 8-K](https://www.sec.gov/Archives/edgar/data/812796/000110465926109329/sngx-20260917x8k.htm)
reports approval of Proposal 2, from 2 to 20, at board discretion within one
year. The vote table records 8,068,017 for, 2,273,350 against and 269,278
abstentions. No final selected ratio or trading date is supplied. Other
proposal/election counts must not be interpreted as split terms.

### SBFM - maximum ratio and mailing-dependent consent effectiveness

Benchmark: 20. [8-K signed September 16](https://www.sec.gov/Archives/edgar/data/1402328/000168316826007193/sunshine_8k.htm)
reports majority-holder written consent on September 15 authorizing a board
selection up to 1-for-20, if any. Twenty is a maximum, not a final selected
ratio. Consent effectiveness depends on twenty days after the definitive
information statement is mailed; neither signature nor filing date proves
the mailing date. Keep that condition, not an invented October date. The
June 1 1-for-10 action mentioned in older filings is separate history.
No adjusted trading date is established by this source.

### NXL - individual versus aggregate ratios; mixed proposal outcomes

Benchmark: 2 to 250. [8-K signed August 11](https://www.sec.gov/Archives/edgar/data/1527352/000182912626008621/nexalintec_8k.htm)
reports August 11 approval of Item 3 for one or more splits, each 2 to 100,
aggregate no more than 250. A single 2-to-250 range loses a material distinction.
July 6 is the record date. Items 4 and 5 were not approved; their negative
outcomes do not negate Item 3. Final ratio, trading date, and expiry are not
established in this filing. Preserve the separately approved action when
parsing mixed outcomes in one document.

### BFRI - older approval located; current state not yet reconciled

Benchmark: unknown ratio. [8-K signed September 19, 2025](https://www.sec.gov/Archives/edgar/data/1858685/000149315225014281/form8-k.htm)
establishes approval at the September 16, 2025 special meeting but does not
state a numerical ratio. It references the August 5, 2025 definitive proxy.
The [July preliminary proxy](https://www.sec.gov/Archives/edgar/data/1858685/000164117225021034/formpre14a.htm)
contains a one-year limit and inconsistent draft numerical ranges; it is not
adequate evidence for a definitive ratio or current authority. The definitive
primary document and later lifecycle remain a follow-up acquisition gap.
Do not assume this year-old approval is still actionable in September 2026,
or relabel FDA approvals as stock-split approvals. This row is **partially
verified**, not accepted as a current active warning.

### BGM - approval benchmark superseded by final announcement

Benchmark: unknown ratio. [6-K signed September 24](https://www.sec.gov/Archives/edgar/data/1779578/000110465926110425/tm2626068d1_6k.htm)
announces 30 old shares into 1 new share with Class A adjusted trading expected
at the October 1 open. Shareholder approval is September 5 and board approval
August 11; September 21 share-count context is neither. The announcement
covers Class A/B and preferred shares without turning their adjustments into
separate common-stock actions. Record the reference-list discrepancy: this
source is no longer merely an unknown-ratio authorization. Older up-to-50
authority does not override the selected 30.

### ARBE - dollar objective is not a numerical ratio

Benchmark: unknown ratio. [6-K signed September 10](https://www.sec.gov/Archives/edgar/data/1861841/000121390026098845/ea0305108-6k_arbe.htm)
reports the September 9 meeting after September 2 was adjourned for lack of
quorum. Shareholders approved a board-selected reverse split intended to
produce approximately a $3 share price, executable before the 2027 annual
meeting. Three dollars is not a 1-for-3 ratio. No final trading date or numeric
ratio is given. The earlier meeting adjournment is not postponement of an
announced split; the actual approval date is September 9.

### INVZ - compliance deadline is not split date or authorization expiry

Benchmark: 5 to 20. [6-K signed September 16](https://www.sec.gov/Archives/edgar/data/1835654/000117891326004529/zk2636125.htm)
reports September 16 approval from 5 to 20, final selection reserved to the
board. Neither a final trading date nor expiry is supplied. The
[September 23 compliance announcement](https://www.sec.gov/Archives/edgar/data/1835654/000117891326004565/zk2636142.htm)
references the same approval while naming March 22, 2027 as the Nasdaq
compliance deadline. Do not turn that deadline into a scheduled split or
authority expiry. Director term years are unrelated as well.

### RKDA - preserve the explicit outside deadline

Benchmark: 2 to 10. [8-K signed September 15](https://www.sec.gov/Archives/edgar/data/1469443/000119312526391780/rkda-20260910.htm)
reports September 10 approval of Proposal IV for a board-selected 2-to-10
split before June 30, 2027. There is no final ratio or trading date. The
expired 2025 equity-plan discussion in another item must not expire this
separate authorization. Signature date is not the shareholder meeting date.

### YDKG - fixed ratio despite the word range

Benchmark: 10. [6-K signed September 15](https://www.sec.gov/Archives/edgar/data/1413745/000121390026100145/ea0305544-6k_yueda.htm)
reports September 13 shareholder approval of a 1-for-10 Class A/B
consolidation. The source calls the ratio a range despite specifying a single
value; do not fabricate endpoints. Effectiveness awaits the Nasdaq-confirmed
date and no actual adjusted trading date is supplied. Conditional adoption of
new articles does not mean the shareholder vote itself remains outstanding.
The old November 2025 1-for-100 action is separate history.

### CHOW - immediate legal consolidation without a trading announcement

Benchmark: 10. [6-K signed September 15](https://www.sec.gov/Archives/edgar/data/2041829/000149315226042772/form6-k.htm)
reports all six proposals approved September 14 at 10 AM Hong Kong time.
Proposal 1 approves 10 old shares into 1 with immediate legal effect. Preserve
that legal fact, but do not invent an exchange trading date. Separate
dual-class creation, redesignation and capital increase are conditional on
that split; those conditions do not turn Proposal 1 back into a pending vote.
Large authorized-share figures and ten-vote Class B terms are not other split
ratios. Meeting-local date and any ET normalization must be distinguishable.

### FXHO - approved conditional authority, not a fixed 100 split

Benchmark: 10 to 100. [6-K signed September 14](https://www.sec.gov/Archives/edgar/data/1789299/000149315226042573/form6-k.htm)
reports September 10 approval of Proposal 4, one or more Class A
consolidations in the range 1-for-10 to 1-for-100, conditional on a price below
$1 for at least five continuous trading days and the other approved capital
actions. Final ratio, date and expiry are not stated. Preserve the condition;
do not claim it was fulfilled. Large subdivision ratios elsewhere in the
filing are forward capital changes, not extra reverse splits. The former WTO
ticker and June split belong to earlier history, not this new approval.

### ZNB - historical ratification and a new second split in one filing

Benchmark: 8. [6-K signed September 14](https://www.sec.gov/Archives/edgar/data/1747661/000121390026099698/ea0304940-6k_zeta.htm)
reports a September 10 Beijing meeting, also explicitly September 9 at 10 PM
ET. Resolution 1 ratifies the historical 1-for-8 effective July 27; Resolution
6 approves a **new second 1-for-8** subject to the capital restructuring and
Nasdaq notification condition. No new market effective date is fixed. The
new resolution lapses if its condition is unfulfilled by the first meeting
anniversary. Do not attach July 27 to the second action, discard it as a
duplicate ratio, or suppress the whole document because it includes history.
Capital cancellation is not cancellation of the split. Preserve the meeting
timezone when normalizing approval dates.

### TOPP - aggregate cap and a deadline not derived from meeting date

Benchmark: 2 to 900. [8-K signed September 11](https://www.sec.gov/Archives/edgar/data/1960847/000121390026099323/ea0305018-8k_toppoint.htm)
reports September 8 approval of one or more 2-to-900 splits, aggregate no more
than 900. The express deadline is August 24, 2029; do not recompute it as
three years after the actual September meeting. A final selected ratio and
adjusted trading date are absent. Authorized-share changes and reincorporation
are distinct resolutions, not additional split actions.

## Supplied fixture integrity checkpoint

The reviewer independently inspected the source owner's manifests and
`filing-corpus.test.ts` in the release checkout. A bounded read-only Node check
decompressed every body from both manifests, recomputed SHA-256, checked exact
byte length, and checked the hash-derived filename. All **17** matched. This
does not establish live acquisition completeness, passing parser behavior, or
an immutable implementation baseline; the source owner explicitly reports its
grammar corrections are still uncommitted.

- `upcoming-expectations.json`: 9 cases; manifest SHA-256
  `70f680d254af3526305db3589387d68f5a16cd1cd8929c7135a90382ad20981f`.
- `control-expectations.json`: 8 cases; manifest SHA-256
  `2c3de632d13d7e3157636f835668da1b6b4600ad818d8ee4212b7b4f511901ec`.
- Upcoming set: GCDT, GMEX, IMMP, MTNB, DLXY, BTLN, CTNT, KITT, RPGL.
- Control set: APUS, VRME, MYPS, CDT, FBGL, AUUD, MGN, PCLA.
- APUS fixture hash is
  `92c0d1ee8623a091c22c82618690b0861bb81e18d3fc719268df96a3ad91dcf9`,
  distinct from the earlier coordinator-reported hosted cached-body hash above.
  These are distinct captures; no byte identity is claimed.
- Test source verifies raw-body hash and byte length before parsing, then
  verifies event fields and the Watchlist status read model. This is not yet a
  mounted-browser refresh or persisted multi-document lifecycle test.
- The nineteen new approval cases above still need complete raw fixtures,
  hashes and executable results attached by the source owner. BFRI also needs
  definitive-source/later-history reconciliation before current-state acceptance.

The review remains open. Releasing an APUS-only correction or treating reference
inventory size as passing coverage would not satisfy the owner's instruction.

## Duplicate-looking approval rows: primary follow-up

The undated reference rows do not identify their underlying authorization.
Primary filings nevertheless establish distinct annual authorities for both
issuers, so ticker plus ratio alone is not a safe event identity. The exact
mapping from each reference ordinal to a filing remains unproven.

### KTTA: same range, different annual authorizations

The [September 3, 2025 result](https://www.sec.gov/Archives/edgar/data/1841330/000121390025084062/ea0255742-8k_pasithea.htm)
approves Proposal 4, a board-selected 2-to-20 split before the meeting's first
anniversary. The [September 9, 2026 result](https://www.sec.gov/Archives/edgar/data/1841330/000121390026098405/ea0304934-8k_pasithea.htm)
approves Proposal 3 with the same range but a new first-anniversary deadline.
Both are signed on their meeting dates. Neither states a selected ratio or
trading date. At the September 25, 2026 QA date, the older authority's stated
window has ended; the newer authority's window has not. This does not establish
whether another source reports its subsequent exercise or withdrawal.

The approval results sit in paragraphs after each proposal description. The
changed proposal numbering is not a change of issuer or proof of duplication.
Require separate identities, relative-expiry handling, and newer-authority
preservation. Do not collapse the two benchmark rows merely because both show
2 to 20 and the same float.

### TNXP: same aggregate range, changed duration

The [May 8, 2025 result](https://www.sec.gov/Archives/edgar/data/1430306/000199937125005717/tnxp-8k_050825.htm)
approves one or more reverse splits with aggregate range 2 to 250 within one
year of May 8, 2025. The [May 7, 2026 result](https://www.sec.gov/Archives/edgar/data/1430306/000199937126010226/tnxp-8k_050726.htm)
approves the same aggregate range within **two years** of May 7, 2026. These are
distinct dated approvals, not two identical facts. Both filings reserve final
ratios, number and timing to a later board announcement.

At the QA date, the 2025 authority's stated window has ended while the 2026
window has not. March 19 record dates and incentive-plan approval in the same
documents must not replace split approval dates or durations. The source's
aggregate terminology must remain explicit, not become a fixed 1-for-250
action. Require lifecycle tests in either ingestion order, not only isolated
single-document parsing. Raw fixtures and parser outcomes for these four
additional primary documents remain pending with the source owner.

## Complete historical reference capture and approval-fixture review

The reviewer-owned [historical inventory](reverse-split-reference-history.md)
now preserves all 2,285 reference rows 252 through 2536, including all five
displayed source columns and original row ordinals. Its canonical LF row text
is 86,087 bytes with SHA-256
`4051aeee012608bab7ea73f1f2e0bf327449522c9414e5a1d47292233df1f455`.
Together with the source owner's 251-row approval/upcoming inventory this
completes the durable reference census, not parser or lifecycle acceptance.
Eleven historical reference rows have ratios below one; those entries must
not automatically become reverse-split facts merely because of this table's
heading. Original source values remain unaltered.

Independently decompressed all 19 approval-corpus fixtures and confirmed each
raw body byte count and SHA-256 against the captured fixture metadata. Read all
19 expected objects and the full-body test harness. This integrity check does
not validate publication metadata or mean those expectations pass the parser.
The lead reports at least one required-fact failure for each baseline case;
the detailed baseline result artifact remains requested for independent review.

### SNGX publication metadata correction

The [SEC filing index](https://www.sec.gov/Archives/edgar/data/812796/000110465926109329/0001104659-26-109329-index.htm)
was independently read in Chrome. It shows filing date **September 21, 2026**,
accepted **16:30:41** that day, and period of report **September 17, 2026**.
At review, fixture `d039127e037a62983770a1378c0f11c799f04b25fd893e2974750b48e5a00f5f.json`
still used September 17 as `source.publishedDate`. The source owner was asked
to correct only that publication metadata; the raw body/hash must remain
unchanged. Shareholder approval remains September 17, with the stated one-year
authority measured from that approval, not from filing publication.

### Additional action-binding regression requested

The lead's first uncommitted correction used a new numeric scope whenever text
said new/second/separate reverse stock split. Repeated references to the same
new action must not create fresh scopes and evade its clearance condition:

```html
<p>The new reverse stock split remains subject to Nasdaq clearance.</p>
<p>The Company will effect a 1-for-10 reverse stock split.</p>
<p>The new reverse stock split will begin trading on a split-adjusted basis on October 7, 2026.</p>
```

At a September 25 publication date, the first and third paragraphs describe
the same conditional action. The final paragraph cannot become unconditional
merely because it repeats the word new. This source-visible counterexample was
sent to the lead for an executable paired regression alongside the separate
historical/current-action control. This is not an independently executed test
or a review of the next immutable correction, which is still pending.

## Original nineteen-case baseline recovered

### Additional filing-index metadata checked

Independently read these SEC index pages in Chrome on September 25, 2026:

| Ticker | Filing date | SEC accepted timestamp | Period of report | Index |
| --- | --- | --- | --- | --- |
| NXGL | 2026-09-23 | 2026-09-23 17:20:29 | 2026-09-23 | [SEC](https://www.sec.gov/Archives/edgar/data/1468929/000149315226043955/0001493152-26-043955-index.htm) |
| PFSA | 2026-09-21 | 2026-09-18 20:23:31 | 2026-09-18 | [SEC](https://www.sec.gov/Archives/edgar/data/1859807/000121390026101568/0001213900-26-101568-index.htm) |
| ARBE | 2026-09-10 | 2026-09-10 17:00:01 | 2026-09-10 | [SEC](https://www.sec.gov/Archives/edgar/data/1861841/000121390026098845/0001213900-26-098845-index.htm) |
| RKDA | 2026-09-15 | 2026-09-15 15:01:55 | 2026-09-10 | [SEC](https://www.sec.gov/Archives/edgar/data/1469443/000119312526391780/0001193125-26-391780-index.htm) |

The ingestion contract in `sources.ts` sets SEC `publishedDate` from
`data.file_date`. PFSA therefore uses September 21 for that field even though
SEC accepted the filing on September 18 in the evening. Its approval remains
September 18. Do not overwrite the separate source/event facts to force equality.
NXL and ZNB index pages returned the SEC maintenance/unavailable screen in this
independent browser check as well as failing for the lead. Their index metadata
remains explicitly pending; the successfully captured full filing bodies and
their hashes are a separate verified result.

### Preserved original test evidence

The source owner's original completed test output was recovered read-only from
its local task transcript, without rerunning tests or reconstructing results.
Completion timestamp: 2026-09-25T20:08:02.135Z; exit code: 1.
The run used one Vitest worker, no file parallelism, Node max-old-space-size 512,
and only `approval-corpus.test.ts`. The working source at that instant was not
an immutable reviewed checkpoint; do not attribute this run to a later commit.

Exact aggregated-output SHA-256:
`3c707a90ddfb1a7c7f31a38e3d94fdd3a2412ba314328a691c4c6e013a252a81`.

Independent result review: nine cases emitted an approval record but missed
required fields or final terms (HKPD, IPW, BFRI, BGM, RKDA, YDKG, FXHO, ZNB,
TOPP). Ten cases returned no event. The mechanically preserved output below is authoritative
for those categories; a failed case is not automatically a wholly absent record.

<details>
<summary>Original complete test output, not a current-run result</summary>

```text

 RUN  v4.1.4 C:/Users/jerac/.codex/worktrees/release-workspace-boundary-4e22

xxxxxxxxxxxxxxxxxxx

⎯⎯⎯⎯⎯⎯ Failed Tests 19 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'HKPD-approval'
AssertionError: parsed:approved: expected { ticker: 'HKPD', …(9) } to match object { ticker: 'HKPD', …(6) }
(9 matching properties omitted from actual)

- Expected
+ Received

  {
-   "approvalDate": "2026-09-21",
+   "approvalDate": null,
    "approvalExpiresDate": null,
-   "authorizedRatio": "1-for-20",
+   "authorizedRatio": null,
    "effectiveDate": null,
    "ratio": null,
    "status": "approved",
    "ticker": "HKPD",
  }

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'NXGL-approval'
AssertionError: deferred:conflicting_terms: expected null to match object { ticker: 'NXGL', …(6) }

- Expected:
{
  "approvalDate": "2026-09-23",
  "approvalExpiresDate": "2027-09-23",
  "authorizedRatio": "1-for-2 to 1-for-20",
  "effectiveDate": null,
  "ratio": null,
  "status": "approved",
  "ticker": "NXGL",
}

+ Received:
null

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'IPW-approval'
AssertionError: parsed:approved: expected { ticker: 'IPW', company: 'IPW', …(8) } to match object { ticker: 'IPW', …(6) }
(9 matching properties omitted from actual)

- Expected
+ Received

@@ -1,7 +1,7 @@
  {
-   "approvalDate": "2026-09-21",
+   "approvalDate": null,
    "approvalExpiresDate": null,
    "authorizedRatio": "Up to 1-for-250",
    "effectiveDate": null,
    "ratio": null,
    "status": "approved",

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'SKYQ-approval'
AssertionError: deferred:unresolved_split_terms: expected null to match object { ticker: 'SKYQ', …(6) }

- Expected:
{
  "approvalDate": "2026-09-18",
  "approvalExpiresDate": "2028-09-18",
  "authorizedRatio": "Two sequential authorizations: each 1-for-2 to 1-for-25",
  "effectiveDate": null,
  "ratio": null,
  "status": "approved",
  "ticker": "SKYQ",
}

+ Received:
null

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'ZCMD-approval'
AssertionError: deferred:unresolved_split_terms: expected null to match object { ticker: 'ZCMD', …(6) }

- Expected:
{
  "approvalDate": "2026-09-18",
  "approvalExpiresDate": null,
  "authorizedRatio": "1-for-2",
  "effectiveDate": null,
  "ratio": null,
  "status": "approved",
  "ticker": "ZCMD",
}

+ Received:
null

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'PFSA-approval'
AssertionError: deferred:unresolved_split_terms: expected null to match object { ticker: 'PFSA', …(6) }

- Expected:
{
  "approvalDate": "2026-09-18",
  "approvalExpiresDate": "2028-09-18",
  "authorizedRatio": "1-for-2 to 1-for-12; aggregate up to 1-for-12",
  "effectiveDate": null,
  "ratio": null,
  "status": "approved",
  "ticker": "PFSA",
}

+ Received:
null

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'SNGX-approval'
AssertionError: deferred:unresolved_split_terms: expected null to match object { ticker: 'SNGX', …(6) }

- Expected:
{
  "approvalDate": "2026-09-17",
  "approvalExpiresDate": "2027-09-17",
  "authorizedRatio": "1-for-2 to 1-for-20",
  "effectiveDate": null,
  "ratio": null,
  "status": "approved",
  "ticker": "SNGX",
}

+ Received:
null

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'SBFM-approval'
AssertionError: deferred:unresolved_split_terms: expected null to match object { ticker: 'SBFM', …(6) }

- Expected:
{
  "approvalDate": "2026-09-15",
  "approvalExpiresDate": null,
  "authorizedRatio": "Up to 1-for-20",
  "effectiveDate": null,
  "ratio": null,
  "status": "approved",
  "ticker": "SBFM",
}

+ Received:
null

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'NXL-approval'
AssertionError: deferred:unresolved_split_terms: expected null to match object { ticker: 'NXL', …(6) }

- Expected:
{
  "approvalDate": "2026-08-11",
  "approvalExpiresDate": null,
  "authorizedRatio": "1-for-2 to 1-for-100; aggregate up to 1-for-250",
  "effectiveDate": null,
  "ratio": null,
  "status": "approved",
  "ticker": "NXL",
}

+ Received:
null

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'BFRI-approval'
AssertionError: parsed:approved: expected { ticker: 'BFRI', …(9) } to match object { ticker: 'BFRI', …(6) }
(9 matching properties omitted from actual)

- Expected
+ Received

@@ -1,7 +1,7 @@
  {
-   "approvalDate": "2025-09-16",
+   "approvalDate": null,
    "approvalExpiresDate": null,
    "authorizedRatio": null,
    "effectiveDate": null,
    "ratio": null,
    "status": "approved",

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'BGM-approval'
AssertionError: parsed:approved: expected { ticker: 'BGM', company: 'BGM', …(8) } to match object { ticker: 'BGM', …(6) }
(9 matching properties omitted from actual)

- Expected
+ Received

  {
    "approvalDate": "2026-09-05",
    "approvalExpiresDate": null,
    "authorizedRatio": null,
-   "effectiveDate": "2026-10-01",
-   "ratio": 30,
-   "status": "confirmed",
+   "effectiveDate": null,
+   "ratio": null,
+   "status": "approved",
    "ticker": "BGM",
  }

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'ARBE-approval'
AssertionError: deferred:unresolved_split_terms: expected null to match object { ticker: 'ARBE', …(6) }

- Expected:
{
  "approvalDate": "2026-09-09",
  "approvalExpiresDate": null,
  "authorizedRatio": null,
  "effectiveDate": null,
  "ratio": null,
  "status": "approved",
  "ticker": "ARBE",
}

+ Received:
null

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'INVZ-approval'
AssertionError: deferred:unresolved_split_terms: expected null to match object { ticker: 'INVZ', …(6) }

- Expected:
{
  "approvalDate": "2026-09-16",
  "approvalExpiresDate": null,
  "authorizedRatio": "1-for-5 to 1-for-20",
  "effectiveDate": null,
  "ratio": null,
  "status": "approved",
  "ticker": "INVZ",
}

+ Received:
null

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'RKDA-approval'
AssertionError: parsed:approved: expected { ticker: 'RKDA', …(9) } to match object { ticker: 'RKDA', …(6) }
(9 matching properties omitted from actual)

- Expected
+ Received

@@ -1,8 +1,8 @@
  {
-   "approvalDate": "2026-09-10",
-   "approvalExpiresDate": "2027-06-29",
+   "approvalDate": null,
+   "approvalExpiresDate": null,
    "authorizedRatio": "1-for-2 to 1-for-10",
    "effectiveDate": null,
    "ratio": null,
    "status": "approved",
    "ticker": "RKDA",

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'YDKG-approval'
AssertionError: parsed:approved: expected { ticker: 'YDKG', …(9) } to match object { ticker: 'YDKG', …(6) }
(9 matching properties omitted from actual)

- Expected
+ Received

  {
-   "approvalDate": "2026-09-13",
+   "approvalDate": null,
    "approvalExpiresDate": null,
-   "authorizedRatio": "1-for-10",
+   "authorizedRatio": null,
    "effectiveDate": null,
    "ratio": null,
    "status": "approved",
    "ticker": "YDKG",
  }

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'CHOW-approval'
AssertionError: deferred:unresolved_split_terms: expected null to match object { ticker: 'CHOW', …(6) }

- Expected:
{
  "approvalDate": "2026-09-14",
  "approvalExpiresDate": null,
  "authorizedRatio": "1-for-10",
  "effectiveDate": null,
  "ratio": null,
  "status": "approved",
  "ticker": "CHOW",
}

+ Received:
null

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'FXHO-approval'
AssertionError: parsed:approved: expected { ticker: 'FXHO', …(9) } to match object { ticker: 'FXHO', …(6) }
(9 matching properties omitted from actual)

- Expected
+ Received

  {
-   "approvalDate": "2026-09-10",
+   "approvalDate": null,
    "approvalExpiresDate": null,
-   "authorizedRatio": "1-for-10 to 1-for-100",
+   "authorizedRatio": null,
    "effectiveDate": null,
    "ratio": null,
    "status": "approved",
    "ticker": "FXHO",
  }

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'ZNB-approval'
AssertionError: parsed:approved: expected { ticker: 'ZNB', company: 'ZNB', …(8) } to match object { ticker: 'ZNB', …(6) }
(9 matching properties omitted from actual)

- Expected
+ Received

  {
-   "approvalDate": "2026-09-10",
-   "approvalExpiresDate": "2027-09-10",
-   "authorizedRatio": "1-for-8",
+   "approvalDate": null,
+   "approvalExpiresDate": null,
+   "authorizedRatio": null,
    "effectiveDate": null,
    "ratio": null,
    "status": "approved",
    "ticker": "ZNB",
  }

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/19]⎯

 FAIL  src/modules/news/server/reverse-splits/approval-corpus.test.ts > independent full approval filing bodies > 'TOPP-approval'
AssertionError: parsed:approved: expected { ticker: 'TOPP', …(9) } to match object { ticker: 'TOPP', …(6) }
(9 matching properties omitted from actual)

- Expected
+ Received

  {
-   "approvalDate": "2026-09-08",
-   "approvalExpiresDate": "2029-08-24",
-   "authorizedRatio": "1-for-2 to 1-for-900; aggregate up to 1-for-900",
+   "approvalDate": null,
+   "approvalExpiresDate": null,
+   "authorizedRatio": "1-for-2 to 1-for-900",
    "effectiveDate": null,
    "ratio": null,
    "status": "approved",
    "ticker": "TOPP",
  }

 ❯ src/modules/news/server/reverse-splits/approval-corpus.test.ts:19:64
     17|     expect(createHash("sha256").update(bytes).digest("hex")).toBe(fixt…
     18|     const result = parseReverseSplit(fixture.source, bytes.toString("u…
     19|     expect(result.event, `${result.outcome}:${result.reason}`).toMatch…
       |                                                                ^
     20|   });
     21| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[19/19]⎯


 Test Files  1 failed (1)
      Tests  19 failed (19)
   Start at  16:08:01
   Duration  755ms (transform 181ms, setup 0ms, import 236ms, tests 113ms, environment 0ms)

```

</details>
