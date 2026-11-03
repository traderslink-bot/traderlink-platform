# Scanner momentum detection audit — 2026-11-03

## Decision

Keep all six detection methods for the next live calibration period, but do not
treat them as equivalent signals. Building Volume is the best broad early-volume
detector in this evidence. Price Burst is the strongest immediate-move detector
and the clearest reversal-risk signal. Developing Activity is useful as an early
watch state only when the application follows whether activity strengthens or
expires. One-minute and five-minute momentum provide confirmation and context;
they should not be presented as equally early discoveries.

No threshold is statistically proven by this audit. The retained evidence covers
only parts of two trading dates, uses several owner-edited configurations, and
contains provider coverage gaps. The next version should collect the new signal,
cooling and removal fields live before thresholds are changed from these replay
results alone.

## Evidence and cutoff

- Cutoff: 2026-11-03 19:32:36.995 UTC (2:32:36 PM Eastern).
- Coverage: 6,546 scanner cycles, 4,809,710 ticker observations and 1,235
  distinct symbols.
- Session observations: 1,054,805 premarket, 2,243,402 regular-hours and
  1,511,503 after-hours.
- Replay population after the configured Momentum filters: 76–139 distinct
  eligible tickers per method, depending on the method.
- Reference set: 916 episodes where an eligible ticker first reached an
  observed five-minute gain of at least 5% in a continuous qualifying period.
- Every retained cycle was labelled partial. The dominant recorded issue was
  `stale_or_invalid_provider_time`; other gaps included missing session prices,
  unverified session timestamps and unavailable batches/passes.
- Five-minute outcomes require an observation within 15 seconds of the
  five-minute endpoint and no observation gap longer than 20 seconds. Episodes
  that fail either coverage rule are censored rather than counted as successes
  or failures.

This is a chronological replay of saved production observations through the
candidate detection logic. The early detection methods and 30-second cooling
state were not deployed at the cutoff. The replay measures how those methods
would have reacted; it is not evidence that users saw those rows live.

The one- and five-minute thresholds changed during the evidence window:

- 2.5% / 5% during the initial Nov. 2 regular-hours period;
- briefly 0.5% / 0.5%;
- then 1% / 1% for after-hours, Nov. 3 premarket and most Nov. 3 regular hours.

The shared card filters also differed by session. Results for the rolling
methods therefore describe the saved real configuration history, not a single
fixed-threshold experiment.

## How each method was evaluated

Each method reports independent trigger episodes rather than counting every
active refresh as another detection. A ticker can contribute multiple episodes
if a signal ends and later restarts. For every card-eligible episode the replay
measured:

- trigger time, session, price and activity at detection;
- interval shares, interval dollar volume, episode totals and rate multiple;
- maximum favorable movement and maximum drawdown during the next five minutes;
- observed return near 30 seconds, 60 seconds and five minutes;
- whether the episode subsequently reached +1%, +3% or +5%;
- overlap with the other five methods;
- whether it appeared before a reference five-minute move and its lead time;
- missing future coverage, which was censored;
- representative strong, weak and missed cases for timeline review.

These are observations after a scanner signal. They are not simulated entries,
tradable returns or estimates of profit. Spread, slippage, halts and execution
are not incorporated into the outcome percentages.

## Overall comparison

| Method | Eligible episodes | Complete 5m outcomes | Reference moves captured | Median lead | Median max rise | Reached +5% | Fell at least 2% | Median 5m end |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volume Ignition | 3,922 | 2,644 | 72.5% | 70s | 0.76% | 5.7% | 23.3% | 0.00% |
| Building Volume | 5,979 | 4,375 | 87.2% | 49s | 0.98% | 8.0% | 26.4% | 0.00% |
| Price Burst | 1,160 | 952 | 94.2% | 30s | 2.44% | 29.2% | 64.4% | -0.71% |
| Developing Activity | 1,073 | 815 | 46.4% | 129s | 0.74% | 7.6% | 29.9% | -0.38% |
| One-minute Momentum | 3,244 | 2,606 | 99.0% | 40s | 0.94% | 12.6% | 40.4% | -0.45% |
| Five-minute Momentum | 3,011 | 2,370 | 92.9% | 69s | 0.61% | 7.6% | 27.9% | -0.27% |

“Median lead” is the median time from the start of the most recent qualifying
signal episode to reference-move confirmation. Negative lead values are shown
as positive seconds early in the table. The reference episodes are a calibration
device and can include more than one move from the same ticker.

## 1. Volume Ignition

**What it detects.** A sudden interval volume rate at least five times the
recent baseline after the accumulated episode satisfies at least two of the
share, dollar-volume and float-turnover dimensions.

**Observed behavior.** It generated 3,922 eligible episodes across 137 tickers.
The typical detection interval was 9.9 seconds with 10,657 shares, $6,705 in
interval dollar volume and an 11.36x rate multiple. It captured 72.5% of the
reference moves with a median 70-second lead. Within five minutes, 42.1% reached
+1%, 13.0% reached +3%, 5.7% reached +5%, and 23.3% fell at least 2%.

**Session result.** After-hours had the strongest continuation rate: 10.8%
reached +5%, compared with 7.5% premarket and 4.3% regular hours. After-hours
and premarket also had more downside than regular hours.

**Reviewed cases.** INLF at 9:11:10 AM Eastern gained as much as 36.7% in the
next five minutes. CRIS at 12:07:38 PM gained 26.2%. The opposite extreme was
CHSN at 2:11:19 PM: the combined ignition/burst/developing/rolling signal fired
at $2.895 and price fell about 29.9% by five minutes.

**Recommendation.** Keep it as the earliest high-priority volume alert. Do not
rank it as a quality candidate by itself. Rank higher when Building Volume or
positive price behavior confirms it, and allow the 30-second cooling rule to
remove an ignition that does not renew.

## 2. Building Volume

**What it detects.** Repeated elevated volume observations, normally at least
two times baseline, whose accumulated episode satisfies the multi-dimensional
activity requirement.

**Observed behavior.** It produced 5,979 eligible episodes across 124 tickers.
The median detection contained 9,308 interval shares, $5,563 in interval dollar
volume, a 4.43x rate multiple, 131,848 accumulated episode shares and $81,992
episode dollar volume. It captured 87.2% of reference moves with a 49-second
median lead. It reached +1% in 49.4% of complete episodes, +3% in 17.4%, and
+5% in 8.0%; 26.4% fell at least 2%.

**Session result.** After-hours was strongest: median maximum rise 1.30%, 25.9%
reached +3%, and 14.8% reached +5%. It also carried a 29.4% rate of 2% downside.
Regular hours had the lowest downside of the three sessions.

**Reviewed cases.** PARA at 9:26:35 AM Eastern is the clearest success. Building
Volume fired around $3.5813 before price reached $5.15 within five minutes, a
43.8% maximum rise. It also identified PARA’s 11:49 AM renewed move and the
large opening sequence. Weak cases included CRE, ATHE, and later PARA signals
that occurred during sharp reversals.

**Recommendation.** Keep it as the primary early-development detector and give
it more ranking value than a single Volume Ignition. Retain session-specific
thresholds. Do not interpret continued building volume as bullish when price is
falling sharply; direction and giveback need to affect the score.

## 3. Price Burst

**What it detects.** A price increase of at least 1.5% inside an actual interval
of at most 30 seconds, with meaningful accompanying activity.

**Observed behavior.** It was selective: 1,160 eligible episodes across 76
tickers. It captured 94.2% of reference moves with a median 30-second lead. Its
median maximum rise was the largest at 2.44%; 65.5% reached +1%, 44.5% reached
+3%, and 29.2% reached +5%.

It also had the largest reversal risk. Some 64.4% fell at least 2% during the
same five-minute window, and the median five-minute ending return was -0.71%.
After-hours had both the best +5% rate (31.4%) and the worst 2% downside rate
(72.3%).

**Reviewed cases.** RDAC at 6:01:35 AM Eastern rose as much as 49.6% and ended
the five-minute window about 45.6% higher. PARA at 9:29:06 AM rose 39.9%.
CHSN, GMEX and CNSY demonstrate the opposing behavior: a burst can identify the
top of an exhaustion spike immediately before a severe reversal.

**Recommendation.** Keep it, but treat it as **rapid movement**, not automatic
bullish quality. It should strongly increase attention while also adding an
extension/reversal risk flag. A second price hold or renewed activity should be
required before it receives the highest candidate ranking.

### Price Burst stable-cohort recheck

The owner challenged the original downside result, so Price Burst received a
second stricter replay. A complete outcome now requires an observation within
15 seconds of the five-minute endpoint and no observation gap longer than 20
seconds. This reduced the complete cohort from 1,102 to 952 episodes.

- 613 of 952 episodes (64.39%) fell at least 2% below the trigger price.
- 339 episodes (35.61%) stayed above -2% for the observed five-minute window.
- Those 339 episodes came from 55 tickers and include repeated bursts during
  the same ticker move.
- Their median maximum rise was 4.61%, median maximum drawdown was -0.76%, and
  median five-minute ending return was +2.12%.

Highest observed rise among the 339 raw stable episodes:

| Maximum rise | Episodes | Share of stable episodes |
| --- | ---: | ---: |
| No observed rise | 32 | 9.4% |
| More than 0% but under 1% | 29 | 8.6% |
| 1% to under 3% | 61 | 18.0% |
| 3% to under 5% | 61 | 18.0% |
| 5% to under 10% | 75 | 22.1% |
| 10% or more | 81 | 23.9% |

Repeated Price Burst triggers from one ticker within five minutes are not
independent opportunities. Combining those repeats produced 366 distinct burst
sequences. Of those, 159 (43.44%) stayed above -2%:

| Maximum rise | Distinct stable sequences | Share of stable sequences |
| --- | ---: | ---: |
| No observed rise | 27 | 17.0% |
| More than 0% but under 1% | 25 | 15.7% |
| 1% to under 3% | 43 | 27.0% |
| 3% to under 5% | 26 | 16.4% |
| 5% to under 10% | 25 | 15.7% |
| 10% or more | 13 | 8.2% |

Thus 107 of 159 stable distinct sequences reached at least +1%, 64 reached at
least +3%, 38 reached at least +5%, and 13 reached at least +10%. Across all
366 distinct Price Burst sequences, the stable +5% group represents 10.4% and
the stable +10% group represents 3.6%.

The first-trigger measurements suggest where to investigate next. Stable
sequences that rose less than 1% had median episode dollar volume of about
$19.7K and an 11.45x rate multiple. The 5–10% group had about $1.29M episode
dollar volume and a 2.92x multiple; the 10%+ group had about $684K and a 2.61x
multiple. The larger continuations were also generally closer to the current
day high. This short sample suggests that sustained absolute dollar activity is
more informative than an enormous multiple against a tiny baseline. Float,
spread and one-minute gain did not separate the first-trigger groups cleanly.

This is promising but not yet an actionable selection rule. “Stayed above
-2%” and “eventually reached +5%” are known only after the five-minute window.
The next audit should test episode dollar volume, distance from HOD, continued
volume after the first burst and immediate price hold on later holdout sessions.
The complete lists are available as
[all 339 stable trigger episodes](scanner-price-burst-stable-episodes-20261103.csv)
and [159 de-duplicated stable sequences](scanner-price-burst-stable-sequences-20261103.csv).
Detection timestamps in both files are Eastern time. Each row includes the
trigger price, highest subsequent rise, deepest observed drawdown, 30-second,
60-second and five-minute returns, and the available activity, float, market
cap, spread, RVOL and HOD context.

## 4. Developing Activity

**What it detects.** An episode with sufficient accumulated activity, at least
0.5% price progress from its start, and either at least two-times baseline rate
or stronger absolute activity.

**Observed behavior.** It produced 1,073 eligible episodes across 94 tickers.
It captured only 46.4% of reference moves, but when it captured one it was the
earliest method: median lead was 129 seconds. The trade-off is weak standalone
continuation. Median maximum rise was 0.74%, median five-minute ending return
was -0.38%, 7.6% reached +5%, and 29.9% fell at least 2%.

Premarket was weakest in this short sample: only 5.4% reached +5%, with a median
five-minute ending return of -0.59%. After-hours had more large continuations
but also more downside.

**Reviewed cases.** PARA at 11:49:43 AM Eastern gained 27.4% at maximum and
ended 22.8% higher. CRIS at 12:16:46 PM gained 20.9%. CHSN, CNSY and BIVI show
why detection alone cannot establish quality: each satisfied developing
activity shortly before a major drop.

**Recommendation.** Keep it as a state that the scanner follows. The approved
30-second cooling behavior fits this evidence: show it while activity is live,
briefly mark it cooling when the signal disappears, reactivate it on renewed
activity, and remove it when no boost arrives. Rank it higher only after its
price, volume rate or episode intensity strengthens. Do not extend its display
for a fixed multi-minute period.

## 5. One-minute Momentum

**What it detects.** Price change over the observed rolling 60-second window at
or above the saved admin threshold.

**Observed behavior.** It generated 3,244 eligible episodes across 135 tickers
and captured 99.0% of reference moves with a median 40-second lead. About 49.1%
reached +1%, 23.0% reached +3%, and 12.6% reached +5%; 40.4% fell at least 2%.
The median five-minute ending return was -0.45%.

The 99% capture rate must be interpreted with the threshold history. Much of
the evidence used a 1% trigger, and a brief period used 0.5%; this is not a
result for the original 2.5% default alone.

**Reviewed cases.** PARA’s 9:28–9:29 AM sequence was a strong confirmation and
was followed by a roughly 40% five-minute move. CHSN, GMEX and CNSY demonstrate
that the rolling window remains positive after a spike has already begun to
reverse.

**Recommendation.** Keep it as the main short-window confirmation and ranking
input. It has broad coverage but is too late and reversal-prone to be the sole
early detector. Audit fixed thresholds separately before deciding whether 1%
or 2.5% should be the normal default.

## 6. Five-minute Momentum

**What it detects.** Price change over the observed rolling five-minute window
at or above the saved admin threshold.

**Observed behavior.** It generated 3,011 eligible episodes across 139 tickers.
It captured 92.9% of reference moves with a median 69-second lead, reflecting
the 1% threshold used for most of the later evidence rather than requiring a
full 5% move. About 40.3% reached a further +1%, 16.2% reached +3%, and 7.6%
reached +5%; 27.9% fell at least 2%. Median five-minute ending return was
-0.27%.

**Reviewed cases.** It confirmed PARA’s 9:28–9:29 AM and 11:49 AM moves. It also
remained active in CHSN, CNSY and BIVI after the prior five-minute gain no longer
described the immediate direction.

**Recommendation.** Keep it as sustained-context confirmation, not as an early
discovery method. Rank it below fresh Volume Ignition, Building Volume or Price
Burst when its most recent interval has turned negative. Displaying both 1min
and 5min change remains useful because their disagreement identifies slowing or
reversing momentum.

## Overlap findings

The methods are not six independent votes. The most common active states were
Five-minute Momentum alone, One-minute plus Five-minute Momentum, One-minute
Momentum alone, and Developing Activity alone. Volume Ignition frequently
overlapped Building Volume. Strong moves often activated four or five methods
together, but the worst reversals did too.

Consequently, a raw count such as “five signals active” should not determine
rank by itself. The useful distinctions are:

1. **freshness:** which signal started most recently;
2. **sequence:** ignition → building → price response → rolling confirmation;
3. **direction:** whether price is still advancing or giving back the move;
4. **persistence:** whether activity renews before the 30-second cooling expiry;
5. **risk:** spread, immediate extension and reversal after a burst.

## Changes recommended before deployment

1. Keep the six methods and the 30-second conditional cooling implementation.
2. Prioritize active rows over cooling rows, as implemented locally.
3. Use signal sequence and current direction in ranking; do not score the raw
   number of active signals as independent evidence.
4. Add an exhaustion/giveback penalty when a large Price Burst is followed by
   a negative current interval or rapid loss from the episode high.
5. Treat Building Volume as the primary early-development signal and Volume
   Ignition as the earliest attention signal.
6. Treat Developing Activity as a followed state. Require renewed activity for
   it to survive cooling or improve rank.
7. Keep 1min and 5min Momentum as confirmation/context. Run a future fixed-rule
   comparison because this audit combines several saved thresholds.
8. Persist method state, episode start, cooling entry, reactivation, removal
   reason and post-detection outcomes in the live audit. The candidate already
   records active/cooling timestamps; outcome review remains an audit analysis.
9. Investigate the persistent partial-cycle/provider-time issues separately.
   They did not erase all observations, but they reduce confidence. Depending
   on the method, 18–33% of eligible episodes lacked the strict continuous
   five-minute coverage required for an outcome.

## QA corrections made during this audit

Two replay-report defects were found and corrected before this report:

- Persistent signals initially used their most recent active observation as
  lead time. The final report uses the start of the signal episode.
- A later observation after a coverage gap could initially be mistaken for a
  five-minute outcome. The final report requires a valid endpoint within 15
  seconds of the five-minute boundary, rejects any episode with an observation
  gap longer than 20 seconds and censors missing outcomes.

Manual timeline review then confirmed representative strong and weak cases,
including PARA, RDAC, INLF, CRIS, CHSN, CNSY and MERC. The machine-readable
result accompanies this report for reproducibility.
