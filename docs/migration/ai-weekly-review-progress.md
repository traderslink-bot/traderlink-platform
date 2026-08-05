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
- The AI Reviews page saves the trader's selected Friday delivery time in
  Eastern time. It contains no invented review while no issued review exists.

## Next slice

Add the account-scoped issued-review service, the automatic Friday runner, and
the saved review list/detail view. The runner must issue only one review for an
unchanged completed week and must skip a no-trade week.

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
