# Links AI Chat Question Bank Progress

## Status

The owner directed a live-Luna, batch-based recovery after ordinary trader
questions repeatedly failed through the normal Links AI Chat path. The feature
is excluded from the first live release while this work is underway.

## Checklist

- [x] Capture the production-blocking runtime evidence: 17 failed local Luna
  attempts, principally `TRADERLINK_COACH_UNGROUNDED_EXACT_FACT` and
  `TRADERLINK_COACH_UNKNOWN_CLAIM_PATH`.
- [x] Define the owner-directed recovery contract: a careful 800-case minimum
  question bank and 30-question normal-Links batches.
- [x] Create the checked-in 2,985-case question-bank manifest and a normal
  saved-Links batch runner. The runner records the saved answer, tool evidence,
  model receipt and mechanical result; its canonical semantic comparator is
  still in progress.
- [x] Repair claim/result-path grounding for normal Luna answers in source.
  Focused type and lint checks pass; the live proof remains pending the first
  allowed Luna batch.
- [x] Repair calendar interpretation for named days, named months, named years,
  ISO dates, US numeric dates, this/last month, this/last year, this/last week,
  today, yesterday and rolling-day periods.
- [x] Remove the incorrect 62-day ceiling from all-history rule summaries.
  The deterministic rule-results tool now accepts an omitted date pair for all
  available history, while explicit ranges remain bounded at 1,500 days.
- [ ] Complete the canonical semantic comparator for the first 30 trading
  questions: correct scope, sort, outcome filter, rank and required fields.
- [ ] Implement the remaining first-batch gaps exposed by the live run.
- [ ] Run the first paid Luna batch through saved Links AI Chat and publish its
  receipt-backed pass/fail record.
- [ ] Continue family-by-family until the whole bank passes, then hand the
  owner the remaining unscripted acceptance boundary.

## Hard rules

- No batch advances on a generic failure, wrong scope, wrong result, wrong
  ranking or misleading unavailable answer.
- Source-only tests do not count as a batch pass.
- Each paid question must be saved and attributable to its normal Links AI
  Chat attempt and receipt.
- New user-reported failures are added to the bank before any completion claim.
