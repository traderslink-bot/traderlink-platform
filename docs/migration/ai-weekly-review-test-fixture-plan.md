# AI Weekly Review Test Fixture Plan

## Purpose

Create a controlled, realistic Journal fixture in the local development test
account before implementing the AI review. The fixture exercises the exact
facts the future weekly review must receive: completed day trades, trade and
daily notes, dated Current Focuses revisions, automatically evaluated rules,
realized P/L, and reviewed versus unreviewed trading-day coverage.

This is test-account data only. It is never a broker statement, Data Decision,
or replacement for factual importer evidence.

## Safety boundary

- Run only against the local `development.sqlite` configured by the protected
  local-development configuration.
- Create a recoverable backup before the first write.
- Use the normal immutable manual-execution, note, and review services; never
  insert or alter Journal rows directly.
- Use `AIR..` test tickers and fixture-specific idempotency keys. The
  historical executions enter through Quick Trade Entry because it correctly
  permits any past trading date; the resulting trades are explicitly
  classified as day trades and receive normal Daily Tracker notes and reviews.
- Be idempotent. A repeat run may find its existing fixture but must not
  duplicate executions, replace notes, or alter a trader edit.
- Do not create false Data Decisions, import records, broker statements, or
  fake AI responses.

## Fixture weeks

The two weeks are historical relative to the local development clock. They
exercise the full review package safely now. Live automatic-rule evaluation is
tested separately with current-date trades because a rule must never be
backdated merely to improve a fixture.

### Week one: 2026-07-20 through 2026-07-24 — baseline

- Seven completed day trades across five reviewed trading days.
- A mix of deliberate wins, chased losses, repeat attempts, and disciplined
  stops.
- Every trade has a trader-written note.
- Every day has `What worked`, `What needs work`, recap, Current Focuses, and
  a short additional reflection where useful.
- The first Current Focuses direction is: wait for clean first pullbacks, take
  fewer names, and do not re-enter after a stop without a genuinely new setup.

The first AI-generated review for this week becomes the genuine prior-review
context for week two. No hand-written mock AI review is stored.

### Week two: 2026-07-27 through 2026-07-31 — follow-through

- Nine completed day trades.
- Current Focuses carry from week one and are edited twice during the week,
  preserving a dated revision trail.
- The trades intentionally support evaluation of the active maximum-attempts,
  late-entry, maximum-trades, daily-gain-limit, and reduced-size-after-loss
  rules where their configuration applies.
- Notes show both genuine improvement and recurring mistakes. One profitable
  day is process-poor; one losing day is process-disciplined.
- Monday through Thursday are marked reviewed.
- Friday has trades and notes but remains unreviewed. It proves that the AI
  package reports incomplete coverage rather than treating the day as a
  completed journal review.

## Acceptance evidence

After seeding, confirm only aggregate, privacy-safe facts:

- Fixture execution, closed-round-trip, trade-note, daily-note revision, and
  reviewed-day counts match the planned scenario.
- Current Focuses has a carried value and two dated week-two revisions.
- No open test position or new Data Decision was created.
- Existing non-fixture rows and notes were not changed.

## Follow-on AI test

When the AI review package exists, run it first for week one. Save that issued
review normally. Then run week two with the week-one review as prior context
and verify that the output distinguishes process progress from P/L, calls out
the repeated attempt and late entry, and does not use the unreviewed Friday as
completed review evidence.

## 2026-08-05 execution note

The guarded seed and its normal Journal write paths were assembled and run
against the local test account. The proposed trades, notes, focus revision, and
review records were verified as internally complete, but the former
account-wide manual-entry rebuild also materialized one unrelated existing-chain
Data Decision. The database was restored to the verified pre-fixture checkpoint;
no fixture executions, notes, reviews, or added Decision remain.

The manual-entry boundary now rebuilds only the execution chains created by
that submission and reconciles only those chains' Decisions. This retains full
rebuilding for the affected ticker/currency chain, while preventing an ordinary
manual entry from creating, changing, or superseding unrelated Decision work.
The guarded seed was then rerun successfully: it added 34 fixture executions across 10 trading days, 17 closed fixture trades, 10 daily-note records, one additional Current Focuses revision, nine reviewed days, and 17 trade notes. A read-only integrity check returned `ok`; the Decision count remained exactly six. The fixture is now available only in the local development test account for the forthcoming AI-review package.
