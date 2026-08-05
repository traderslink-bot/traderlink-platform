# AI Weekly Review Progress

## Status

Active. The product contract is in [AI Weekly Review Plan](ai-weekly-review-plan.md).

## Completed: factual input package

- Added `traderlink_coach_weekly_ai_input_v1` as the server-side weekly input
  contract.
- Added a read-only input service and runtime over the replacement Coach,
  Journal Analytics, annotations and daily-review services.
- Added an account-scoped daily-focus revision reader so every saved Current
  Focuses revision within the review week is available to the future prompt.
- Corrected the weekly package to include holding duration when it can be
  derived from the Journal's exact open/close timestamps. Execution count,
  realized gross P/L and trading session remain explicitly unavailable because
  the current Coach read contract does not expose those Journal facts.
- Current Focuses now includes the value in effect at the start of the week and
  only dated revisions actually recorded during the week. Carried-forward text
  is marked with its effective week-start date and is not repeated as invented
  daily edits.
- Added trader-selected trade tags as contextual input. Tags are never treated
  as proof or a diagnosis.
- Added the Vercel AI SDK and direct OpenAI provider dependencies. An ignored
  local `OPENAI_API_KEY` is authorized only for controlled development testing;
  no key is committed or exposed to the browser.

## Verification

- Focused ESLint passed for the package and changed annotation files.
- `git diff --check` passed.
- The full TypeScript check was started once but exceeded the two-minute
  resource limit while the local dashboard was in use. It was stopped rather
  than retried. It remains a later checkpoint check, not a passed result.

## Completed: storage foundation and schedule

- Migration `0025_coach_weekly_reviews` creates immutable review request and
  issued-review records plus one Friday delivery-time setting per Journal
  account. It was applied to the local development database only after a
  successful online backup and `quick_check` verification.
- AI Reviews replaces the retired Reflection Loop navigation entry. The old
  route now redirects to AI Reviews so saved links remain useful.
- The AI Reviews page points traders to Account for their selected weekend
  delivery day and Eastern time. It contains no invented review while no issued
  review exists.

## In progress: private provider and cost controls

- Migration `0027_coach_ai_generation_cost_tracking` adds one protected
  provider/model configuration and immutable per-review cost receipts.
- Journal Administration now has an AI Reviews settings area. It reports only
  whether a server credential is available, never the credential itself, and
  lets the owner record the selected model's verified input/output token prices.
- Prices are captured with each issued review so later price changes never
  rewrite history. When no verified price is saved, the receipt retains token
  counts and leaves cost unavailable.

## Completed: saved weekly review reading

- AI Reviews now reads only the selected account's immutable issued weekly
  reviews through the account-scoped repository. The saved list is newest
  first, and its empty state appears only when that account has no issued
  weekly review.
- Each saved weekly review has an addressable detail page that presents the
  trader-facing weekly summary, improvement, friction, focus follow-through,
  next-focus and applicable incomplete-record sections. It never reads or
  displays provider, model, token, cost, request or other operational data.
- Monthly reviews remain an honest not-yet-issued section until a scoped
  monthly read contract and delivery work are implemented.

## Next slice

Add the automatic weekend runner and scoped monthly review delivery/read
contract. Calendar-month reviews use the same delivery time, retain their
first-use date, and issue a first partial month only after seven calendar days
and three reviewed trading days. The runner must issue only one review for an
unchanged period and must skip a no-trade period.

## Planned input addition: selected trade tags

The weekly package will include the trader-selected tags already shown beside
each completed trade. They give useful setup and execution context, but remain
context rather than proof. Conflicting tags on one trade must be presented as a
conflict, never silently resolved by the review.

## In progress: local OpenAI review test

- The first controlled direct OpenAI response completed against the first
  fixture week without changing Journal data.
- It exposed a scope-label ambiguity: account-wide coverage counts appeared
  beside weekly trade counts. The input contract now names week and account
  coverage separately before the final local review run.

## Deferred dependency: prior issued-review context

The weekly input package does not yet include the immediately preceding issued
review. The current replacement has no account-scoped issued-review read
contract or read service; the existing migration and schedule/storage pieces do
not provide a safe immutable account-scoped read. Adding that dependency would
require work in the issuance/storage boundary outside this correction's
allowlist, so prior-review context remains deferred rather than guessed or
loaded from another account.
