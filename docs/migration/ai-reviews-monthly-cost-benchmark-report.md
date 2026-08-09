# AI Reviews Monthly Cost Benchmark Report

## Outcome

The accepted GPT-5.6 Luna benchmark completed 15 reviews: four sequential
weekly reviews and one exact calendar-month review for each of three usage
profiles. All final outputs passed structured-output and TraderLink safety
checks. The durable local artifact is
`.local-logs/ai-review-monthly-cost-benchmark-2026-08-09T14-32-17.746Z.json`.

Beta QA corrected the pricing record on 2026-08-09. Current official GPT-5.6
Luna pricing is $1.00 per million ordinary input tokens, $0.10 per million
cache-read tokens, $1.25 per million cache-write tokens and $6.00 per million
output tokens. The original benchmark calculation used values one fifth of the
ordinary input, cache-read and output rates and did not capture cache-write
tokens.
Requests above 272,000 input tokens receive 2x input and 1.5x output pricing.
None of the accepted final calls crossed that threshold.

## Per-user monthly cost

Budget from the uncached values, not the lower observed test charge. Repeated
synthetic reruns caused an unusually large cache hit on each profile's first
week; real users should not be assumed to reproduce that discount.

| Profile | Month shape | Input tokens | Output tokens | Repriced recorded estimate | Uncached 4-week month | Uncached 5-week month |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Low | 16 trades, no notes/tags/rules | 50,104 | 5,837 | $0.07593250 | $0.08512600 | $0.10259350 |
| Planning | 105 trades, detailed participation | 277,997 | 6,645 | $0.26433500 | $0.31786700 | $0.38566825 |
| Heavy | 420 trades, maximum tested participation | 1,123,311 | 4,883 | $0.93614370 | $1.15260900 | $1.39966250 |

The corrected heavy five-week value is therefore about $1.40 before any
cache-write uplift. The owner selected a USD 2.00 subscriber paid-cycle safety
limit. The recorded estimate remains a lower bound until the cache-write token
correction is implemented and a fresh benchmark captures all four token classes.

## What the heavy profile contained

Each of four weekly requests contained 100 trades across five open sessions.
Every week contained:

- 100 detailed 500-character trade notes;
- four 700-character daily-note sections on each of five days;
- 730 tag applications, with 5-10 tags on every trade;
- 1,000 named completed trade-rule outcomes and 50 named daily-rule outcomes;
- 400 entry/add/partial/final analyzer events with separate 1-minute and
  5-minute context;
- green-to-red analysis, profit-opportunity evidence, entry post-event paths
  and final-exit paths for every analyzed trade.

The exact August monthly facts contained 420 trades, 3,066 tag applications,
4,200 named trade-rule outcomes and 210 named daily-rule outcomes. The monthly
call also received the four actual weekly outputs. To avoid double-sending, raw
analyzer and reflection evidence for the 400 trades already represented by
those weekly reviews was omitted. Full analyzer and reflection evidence was
included for the 20 August 31 trades that had no issued weekly review.

## Usefulness QA

The low profile produced a narrow but useful review from verified executions
and analyzer evidence. It compared repeated tickers and outcomes, separated
1-minute from 5-minute evidence and mentioned note/tag/rule absence only as a
coverage limit; it did not frame Trade Tracker participation as required.

The planning and heavy reviews correctly identified named broken rules,
repeated tags, green-to-red paths and process themes in detailed notes. They did
not treat profit as proof of good process, did not invent missing facts and did
not convert historical analyzer evidence into entry or exit instructions.

## Recommended launch limits

Use entitlements to limit review frequency to one issued review per sealed
weekly/two-week period plus one monthly review. Do not give paying users a lower
arbitrary review count.

Recommended starting safety controls:

- $2.00 hard estimated-cost ceiling per subscriber per Whop paid cycle;
- three bounded provider attempts per review, with every rejected attempt
  charged against the account and global budgets;
- 270,000 input-token ceiling per provider request so ordinary calls stay below
  Luna's long-context price threshold;
- 4,096 output-token ceiling, matching the accepted structured-output contract;
- $50 global monthly warning, $75 operator escalation and $100 initial hard
  stop while the paid launch population and real usage distribution are small;
- $10 global daily hard stop during early launch to contain a scheduler,
  webhook or intentional-abuse loop.

The global values should later scale from collected paid-plan revenue and
observed subscriber count. The subscriber limit covers every Trade Tracker
account owned by that subscriber and does not include AI Chat.

## Note-limit recommendation

Keep the accepted limits: 700 characters for each of the four daily-note sections
and 700 characters for each trade note. The 500-character benchmark produced useful reviews,
and the additional 200 characters per trade remains bounded by the subscriber limit.
Detailed reviews remained useful
even at 20 trades per day. The current Tracker client clips to those values
while the Journal service accepts longer text. A separately owner-reviewed
Tracker UI slice should add visible counters and matching server validation;
saved text must never be silently truncated.

Keep ten tags per trade and the existing 40-character tag-name limit. Rule
definitions are transmitted once per request and referenced by each outcome,
so detailed rule text is no longer repeated hundreds or thousands of times.

## Data-contract correction

Weekly reviews receive compact deterministic analyzer evidence rather than raw
candles. Exact rule-version title, statement and category are resolved inside
the account scope. Provider packaging deduplicates rule definitions and removes
internal workflow-only fields.

Monthly statistics remain sourced only from exact calendar-month facts. Weekly
narrative remains non-statistical context. Analyzer/reflection detail already
represented by a weekly review is not sent again; uncovered exact-month dates
retain raw detail. This preserves month boundaries, avoids double-counting and
keeps extreme subscriber payloads inside the provider context window.
