# AI Weekly Review Plan

## Status

Approved product direction recorded on 2026-08-05. Implementation is active;
the [progress record](ai-weekly-review-progress.md) tracks completed slices.
The local two-week Journal fixture is the first controlled review input. This
supersedes the retired Reflection Loop page.

## Purpose

Give a trader a direct, honest weekly review of their own Journal work. The
review connects factual results, saved trade/day notes, Current Focuses and
automatically evaluated rules. It should identify progress, recurring process
problems, and a short direction for the following week without inventing a
strategy, motive, setup, or fact.

The review is not a trade signal, performance promise, diagnosis, or a Data
Decisions tool. It never changes Journal facts, notes, rules, tags, trade
classification, or analytics.

## Weekly boundary and request model

- A week is Monday through Sunday in the selected Journal account timezone.
- Each account receives one automatic review after the trading week closes at
  the weekly delivery time selected by the trader in Eastern time. A no-trade
  week is skipped.
- A request is keyed to the account, week and exact factual-input digest. A
  completed request for the same input returns the saved review rather than
  charging for another generation.
- A failed request may be retried deliberately. Each attempt remains visible
  in the private operational record; no error text becomes trader-facing AI
  feedback.
- An issued review is immutable. A later, explicitly requested review against
  changed facts is a new, dated review, linked to the prior one rather than
  replacing it.

## Exact AI input package

The server builds one immutable, privacy-safe package from replacement-owned
read services. It contains only the selected account and week:

1. Week identity, trading timezone, currency partition and factual coverage.
2. Completed ready-closed day trades: ticker, direction, entry/exit times,
   execution count, realized gross/net P/L, holding duration and applicable
   trading session. Open positions and unresolved chains stay out of realized
   result conclusions.
3. Per-trading-day facts: trade count, realized P/L, reviewed/not-reviewed
   status, automatically evaluated rule outcomes, and daily note fields.
4. Each completed trade's trader-authored trade note, selected trading tags and
   applicable automatic rule outcomes. The initial tags include setup and
   execution context such as First pullback, Pullback, Breakout, Reversal,
   Chased entry, Early entry, Late entry, Patient entry, Good fill, Poor fill
   and Anxious.
5. Every dated Current Focuses value that was in effect during the week,
   including immutable revisions. A focus that simply carried forward is
   represented at each relevant date without pretending the trader edited it.
6. The immediately preceding issued weekly review, if one exists, as context
   for follow-through—not as evidence that its advice was correct.
7. A concise Data Decisions/coverage notice so the review distinguishes
   confirmed results from facts still awaiting a trader decision.

Tags are trader-selected context, not proof. The review may identify a repeated
tag pattern across trades, but it must never treat a tag as a diagnosis or add
meaning that the trader did not record. If a single trade has conflicting tags,
the review names that conflict rather than deciding which tag is correct.

## Review output contract

The model must return structured, trader-facing content with these sections:

- **Weekly review:** a brief factual summary of results and coverage.
- **What improved:** only progress supported by notes, rule outcomes, current
  focuses or a comparison with the preceding review.
- **What held you back:** direct but respectful criticism, anchored to exact
  notes, rule outcomes or facts; no invented psychology.
- **Focus follow-through:** how the dated Current Focuses changed and whether
  the week's written work supports them.
- **Next week's focuses:** no more than three specific, process-oriented
  focuses. They are suggestions, never new Journal rules.
- **Incomplete record:** shown only when an unreviewed day, missing note or
  contained Data Decision limits a conclusion.

The prompt prohibits trade recommendations, price targets, diagnosing emotion,
claiming certainty, treating profit as proof of good process, treating a loss
as proof of bad process, and any mention of internal codes, providers, token
counts or database terms.

## Storage and provider boundary

- Add migration `0025_coach_weekly_reviews.ts` with immutable request/input
  snapshot and issued-review records. Store the generation ID before a provider
  request, exact input digest, period identity, prior-review reference, status,
  model identifier, usage/cost metadata, structured response and timestamps.
- The input snapshot and issued response are private owner/account records. No
  Journal source rows, raw broker file contents, private identifiers, secrets
  or Data Decision implementation details enter the prompt.
- Local development testing uses the direct OpenAI provider and an ignored
  `OPENAI_API_KEY` in the replacement checkout's `.env.local`. The key is
  never committed, logged or sent to the browser. The first direct test uses
  the account-available `gpt-5.6-sol` model. Hosted-provider configuration is
  deferred until the live deployment boundary is designed.
- Automatic delivery is the approved product behavior: one weekly review per
  account after the trader's selected Friday Eastern-time delivery time. It is
  bounded to one issued review for an unchanged completed week. A later edit
  never silently triggers another paid review.

## UI direction

AI Reviews is its own dashboard page at `/ai-reviews` with a left-navigation
item. It replaces the retired Reflection Loop page. The page lists saved reviews by week,
opens an addressable review detail view, and contains the per-account Eastern
time delivery setting. It never invents a review or claims a schedule is active
before the setting and scheduler exist.

Visible copy uses ordinary trading language. It does not explain its internal
source, generation process, provider, prompt, token count, or database state.

## Implementation order

1. Create the immutable factual weekly package and its focused server contract.
2. Add persisted review request/snapshot/issued-response storage and the
   account-isolated read/write service.
3. Implement the strict prompt and direct local-provider adapter, then issue
   one controlled fixture review before adding persistent generation storage.
4. Add saved-review storage, the Friday per-account Eastern-time schedule and the AI
   Reviews list/detail experience.
5. Use the local two-week fixture: issue week one, then issue week two with
   week one's saved review as prior context. Verify no fixture Journal fact,
   note, rule, focus revision, Decision or open-position state changes.

## Acceptance criteria

- Only selected-account, completed-week facts are sent.
- The saved input snapshot precisely reproduces what the model received.
- Reopening a saved review never calls a provider again.
- Existing reviews remain readable after later Journal edits.
- A missing provider credential produces an honest unavailable state, never a
  mock review.
- Week-two generation receives the prior issued week-one review and dated
  Current Focuses history.
- Valid unrelated Journal activity remains visible if another chain needs a
  Data Decision.

## 2026-08-05 implementation checkpoint

The first server-only input package is complete. It reads the selected account's
weekly factual Reflection Loop, trader-authored daily/trade notes, reviewed-day
state, automatic rule results and immutable Current Focuses revision trail. It
does not call a provider, create a review, alter Journal data or expose a UI.
