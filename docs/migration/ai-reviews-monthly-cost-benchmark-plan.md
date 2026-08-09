# AI Reviews Monthly Cost Benchmark Plan

## Status

Owner-authorized on 2026-08-09. This plan measures a low-use month, a clearly
labelled planning midpoint and a high-end stress month with `gpt-5.6-luna`.
Progress is recorded in
[AI Reviews Monthly Cost Benchmark Progress](ai-reviews-monthly-cost-benchmark-progress.md),
and final measurements are recorded in the
[AI Reviews Monthly Cost Benchmark Report](ai-reviews-monthly-cost-benchmark-report.md).

## Decision this benchmark must support

Estimate per-subscriber monthly OpenAI cost and select Admin abuse/budget limits
without turning the promised weekly and monthly reviews into customer quotas.
The report must preserve raw token counts so costs can be recalculated whenever
OpenAI prices change.

## Production payload corrections required first

1. Add compact, immutable trade-analysis evidence to each reviewed trade:
   derived 1-minute execution context, derived 5-minute execution context,
   green-to-red path facts and post-exit path facts. Do not send raw candles.
2. Add named rule outcomes for every reviewed rule. Existing aggregate counts
   remain exact summaries but are not enough to identify repeated rules.
3. Preserve rule/tag/analyzer unavailability explicitly. Never invent an
   analyzer result or infer a missing rule outcome.
4. Keep exact-month statistics sourced only from raw month facts. Weekly review
   outputs may be monthly narrative context but cannot contribute statistics.
5. Keep current immutable snapshots readable. The new evidence is additive and
   optional for older snapshots; no database migration is expected.

## Benchmark month and calls

Use the August 2026 U.S.-equities calendar. Generate four sequential weekly
reviews for August 3-7, 10-14, 17-21 and 24-28, then one exact calendar-month
review for August 1-31. The exact month also contains Monday, August 31, so its
raw facts cover 21 open sessions. Weeks two through four include the immediately
prior weekly AI Review as continuity context. The monthly request includes the
four weekly narratives as non-statistical context plus all exact-month raw facts.

Run the same five calls for three synthetic profiles:

- **Low-use:** two trading days per week, two trades on each active day, no
  trader-authored notes/tags/rule outcomes, compact analyzer evidence present.
- **Planning midpoint:** five trades on every open session, four complete daily
  note sections, one trade note per trade, five tags and five named rule
  outcomes per trade, compact analyzer evidence present.
- **High-end stress:** twenty trades on every open session, all four daily note
  sections at 700 characters, every trade note at 500 characters, 5-10 tags and
  ten named rule outcomes per trade, plus full compact analyzer evidence.

The midpoint is a pricing assumption, not a claim about observed customer usage.
The high-end month contains 420 trades; each weekly call contains 100 trades.

## Note-limit decision

Benchmark the current effective client limits: 700 characters for each of four
daily-note sections and 500 characters for each trade note. Report their token
and cost contribution separately. After measurement, recommend explicit limits
and visible counters; never silently truncate saved trader text. No Tracker UI
change belongs in this benchmark slice.

## Measurement contract

For every call record:

- profile, review kind and exact period;
- trade/day/reflection/tag/rule/analyzer counts;
- serialized provider-package characters and UTF-8 bytes;
- input, cached-input, cache-write, output, reasoning and total tokens when
  returned by the provider;
- request cost at the official price observed on the run date;
- generated-output safety result and output usefulness review;
- combined four-week-plus-month cost for the profile.

Also report the 4-week monthly value, a 5-week-month extrapolation and a prudent
per-user budget recommendation. A test failure or rejected output still counts
toward cost when usage is returned.

## Safety and scope

- Synthetic facts only; never modify the configured Journal database.
- Local artifacts only; no customer review persistence.
- No provider, scheduler, Whop, deployment or port-3010 activation.
- Keep Tracker/analyzer source files read-only; integration changes belong only
  to AI Review contracts, input/runtime/provider packaging and benchmark tools.
- Do not run Vitest or broad suites. Use focused lint, TypeScript/static checks,
  local payload verification and the explicitly approved provider calls.

## QA findings incorporated before implementation

1. Four weekly reviews plus a monthly review are five calls, not four.
2. A realistic high-end exact month can contain an extra open session outside
   the four reviewed Monday-Friday cohorts; August 31 is included in monthly raw
   facts rather than discarded.
3. Copying trades is acceptable for token-cost stress, but every synthetic trade
   receives a stable distinct evidence key so deduplication cannot collapse it.
4. Raw one-minute candles would dominate tokens and are not the review product.
   Send deterministic derived analyzer facts used by the Tracker instead.
5. Existing rule counts cannot support rule-specific feedback. Named outcomes
   must be included before claiming rules were tested.
6. Current UI clipping and server limits disagree. The benchmark measures the
   UI-effective limits; a later approved UI slice must disclose/enforce them.
7. Current OpenAI pricing must be fetched and timestamped at execution because
   it has already changed since the earlier acceptance runs.
8. If a request exceeds OpenAI's long-context pricing threshold, report the
   provider's actual usage/cost treatment rather than applying the normal rate.
9. Do not resend analyzer detail or reflection prose in the monthly call when
   the same dated evidence was already represented by an issued weekly review.
   Monthly raw trade/P&L/tag/rule facts remain exact; uncovered month dates keep
   raw analyzer/reflection evidence.

## Completion boundary

Completed on 2026-08-09. The production AI Review payload contains the approved
compact analyzer and named-rule facts, all three five-call Luna profiles have
recorded usage artifacts, and the durable report contains low/midpoint/high and
five-week cost recommendations with an explicit note-limit recommendation.
