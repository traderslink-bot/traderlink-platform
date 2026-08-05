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
- Kept tags out of the package; they are not first-pass AI evidence.
- Added the Vercel AI SDK and direct OpenAI provider dependencies. An ignored
  local `OPENAI_API_KEY` is authorized only for controlled development testing;
  no key is committed or exposed to the browser.

## Verification

- Focused ESLint passed for the package and changed annotation files.
- `git diff --check` passed.
- The full TypeScript check was started once but exceeded the two-minute
  resource limit while the local dashboard was in use. It was stopped rather
  than retried. It remains a later checkpoint check, not a passed result.

## Next slice

Run one controlled local OpenAI fixture review through the strict structured
adapter. Then create immutable persisted review-request/input/output storage
and one trader-requested Reflection Loop action. Hosted provider selection is
deferred until deployment planning.

## In progress: local OpenAI review test

- The first controlled direct OpenAI response completed against the first
  fixture week without changing Journal data.
- It exposed a scope-label ambiguity: account-wide coverage counts appeared
  beside weekly trade counts. The input contract now names week and account
  coverage separately before the final local review run.
