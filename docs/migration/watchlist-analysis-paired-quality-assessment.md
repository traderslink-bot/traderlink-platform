# Watchlist paired analysis assessment — September 11

Status: bounded model-quality review completed; hosted release acceptance is
separate. This is not a guarantee of future model correctness or trade outcome.

Controlling [plan](watchlist-analysis-quality-plan.md), exact
[handoff](watchlist-full-context-analysis-handoff.md), and chronological
[progress](watchlist-full-context-analysis-progress.md).

## Evidence and method

Compared the same frozen input on Luna and Terra for all nine named Watchlist
symbols, retaining both FEIM generations separately (ten morning captures).
Also compared both models on the separately captured midday TRUG request.
Every experiment made one provider request, with no automatic retry. Private
requests, raw responses, request hashes, normalization decisions and candle
contexts remain in the runtime's untracked `data/analysis-replay` directory.

Final morning reports: `all-nine-luna-v6-final-validation.json` and
`all-nine-terra-v6-temporal-validation.json`. Midday reports:
`trug-midday-v6-luna-validation.json` and
`trug-midday-v6-terra-validation.json`. Inputs were supplemented with completed
historical candles; they are explicitly not reconstructions of unavailable
original Levels snapshots. Retained one-minute windows contain 60 bars, while
the revised live source allows 120 and supplies broader five-minute context.

Judgment considers chronology, defended bases versus local pauses, failure of
the stated scenario, breakout/reclaim relevance, lower recovery, and supported
upside coverage. Neither proximity alone, future price outcome, section count,
nor a successful validator result determines the assessment.

## Cross-symbol findings

| Capture | Candle-grounded interpretation and comparison |
| --- | --- |
| TRUG morning | Both models identify the $0.4630-$0.4819 premarket base and a lower $0.3925-$0.4007 historical reset. The observed $0.5299 high supports the main continuation boundary; Terra proposes $0.53 confirmation. Its former-$0.52-high wording exposed the temporal text-check defect, now corrected without changing its prices. |
| TNON | The supplied wider advance begins at $5.97 and reaches $9.30. Terra distinguishes the local $7.90-$8.10 cluster from the $7.141-$7.471 base and $6.147-$6.25 deeper base. Luna frames the late base as failure and places the lower base under recovery. Terra gives the requested wider runner coverage more clearly. |
| AENT | Earlier supplied five-minute bars show the $27.10 spike followed by multiple much lower closes, not just an isolated high field. Both responses identify the later $6.90-$7.70 rebound. A nearer defended $7.00-area base is relevant to that rebound, not an untouched original expansion. Neither forces a second dip. |
| SURG | The $0.2493 spike and $0.248 retest failed, followed by $0.192 and a retraced bounce. Terra places $0.1995 in bounce context and leaves dip fields empty, retaining lower recovery. Luna calls the nearby $0.1995-$0.2014 area shallow and the older $0.165-$0.168 area deep. Terra better distinguishes these regimes. |
| FTFT | Both responses identify the $2.35-$2.559 launch area. Terra pairs it with a distinct prior-session $2.09-$2.14 base and broader $2.02 failure; Luna chooses $2.252-$2.28 as the lower zone. Exact price preservation prevents rounding from destroying valid separation. |
| FEIM original | The post-gap five-minute tape supplies $80.181-$81.35 and $79.159-$79.99 acceptance areas with repeated later tests. Both survive after correcting false overlap buffers. Their closeness alone is not proof of bad selection. Neither model invents an unsupported higher price beyond $82.80. |
| FEIM refresh | Terra retains one base and the newer $82.82 continuation boundary. Luna retains both bases but loses its breakout and overview during validation. This is a real first-response limitation, not counted as equivalent complete coverage. |
| BDRX | Terra identifies the late rebound after the larger selloff, keeps $0.8377-$0.8504 and $0.8154-$0.8295 bases above its $0.807 failure. Luna's historical deep proposal conflicts with its own failure boundary and is removed. Terra supplies the more coherent joint scenario. |
| SXTC | Both identify the $2.98 spike rejection and lower bases at $2.22-$2.25 and $2.13-$2.15. Terra uses the lost $2.53 shelf as a continuation reclaim; Luna emphasizes the session high. Both supply intermediate resistance rather than making every upside observation depend on a new high. |
| PCLA | Terra describes the $15.45-to-$10.53 reversal, a rebound/reclaim path through $11.76/$12.50, and a separate lower recovery zone. It leaves dip fields empty. Luna supplies the prior-day $9.96-$10.40 dip. An adaptable template accommodates this without manufacturing symmetric sections. |
| TRUG midday | At the captured $0.622 reference, Terra retains only the $0.5552-$0.576 deeper reset and maps repeated $0.69 supply plus higher historical levels. Luna retains two bases and a nearer $0.6295 continuation pivot. Both complete at the revised output limit and retain their analysis. Terra's $0.5942 hold describes the latest rebound, while $0.548 is broader failure; these are different scenario boundaries, not a universal stop. |

## Conclusion and model recommendation

The revised method uses wider market structure instead of deriving a staircase
from the reference price. The tested outputs now cover distinct continuation,
dip/reset, failed-spike and recovery situations, including a real deep-only
response. Independent section retention and exact precision are verified.

For the initial owner-reviewed trial, recommend Terra: across these same-input
cases it more consistently distinguishes broader reset from post-failure
recovery and retains coherent overview/breakout coverage. This is a bounded
comparison, not statistical proof that Terra always outperforms Luna. Luna
remains available; no runtime model setting has been changed. Do not add a
second-call automatic model fallback. The owner can still edit or refresh.

Near-term hold and broader failure can legitimately differ. The rationale must
identify which structure is at risk; neither field promises that every trader
must exit there. Some generated phrasing remains model judgment. Keep the
owner review gate for the trial and audit actual new outputs before later
removing that gate. Do not add ticker-specific exceptions or percentage-based
zone widening to fit this sample.

## Preserved controls and release limits

- Current focused proof: 45 service, 31 context/section, 22 edit/store/preview,
  ten selected manager admission/automatic-update, and ten Platform card/preview
  tests pass. Manager providers and destination transports are mocked.
- Actual saved-response replay is distinct from these synthetic behavior tests.
  Terra retains all ten morning overviews; Luna retains ten analyses but has
  two overview omissions. Both midday responses retain analysis.
- Owner edits, saved originals, exact approval revisions and retry receipts
  remain intact. The selected manager checks cover all three sessions, normal
  OFF admission, held ON admission, replacement review and automatic OFF guards.
- No hosted build, live edited publication, Discord delivery or desktop/mobile
  CSS acceptance is claimed. These stay in the release procedure.
- The local recap draft consumes posted/high/latest price facts, not the changed
  analysis fields. No recap code/type was changed. The separately developed
  richer recap implementation is not present in this checkout and is not
  claimed tested here; integration must preserve its existing nullable fields.
- Private QA ledger total is $1.90986467 against the $5 daily authorization.
  No outstanding request or reservation remains. No more calls are needed
  merely to spend the balance.
