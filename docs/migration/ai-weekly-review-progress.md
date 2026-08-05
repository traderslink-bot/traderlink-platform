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
- Added the Vercel AI SDK dependency. No gateway credential is configured and
  no provider call, generated review, review table or database migration exists
  yet.

## Verification

- Focused ESLint passed for the package and changed annotation files.
- `git diff --check` passed.
- The full TypeScript check was started once but exceeded the two-minute
  resource limit while the local dashboard was in use. It was stopped rather
  than retried. It remains a later checkpoint check, not a passed result.

## Next slice

Create immutable persisted review-request/input/output storage, then add the
strict prompt/provider adapter and one trader-requested Reflection Loop action.
The adapter must remain unavailable until `AI_GATEWAY_API_KEY` is configured.
