# Coaching paused-message correction

## Approved scope — 2026-10-01

Owner approved disabling coach Send while role access is paused, handling a
stale-page submission with "Coaching access is paused.", and restoring Send
when access returns. No production release or redesign is included.

## Live staging evidence before correction

- Bullrun accepted the zero-dollar custom test agreement requiring test-community.
- Removing only that Discord role triggered automatic pause notices on both sides.
- Student messaging/review requests were disabled and coach Journal reads stopped.
- Restoring the exact role triggered automatic restoration on both sides.
- Messages, chart image, completed lesson, completed and pending reviews, shared
  history and coach-private separation survived the cycle.
- Coach Send remained enabled during pause. A synthetic submission reached the
  generic page error, but was absent from student messages after restoration.

## Implementation

- A small coach message form derives disabled state from role pause and pending submission.
- A server action adapter returns the approved inline message only for the typed
  coaching_access_paused denial. Existing authorization and message writes remain unchanged.
- Other failures and framework navigation exceptions are rethrown.
- The form resets action feedback when relationship access state changes.
- Help inventory checked: no dedicated community-coaching Help Center guide found;
  this correction does not change the service/access contract.

## Acceptance

Source implementation complete. Targeted ESLint passed on all three changed
code files using the canonical dependency installation through stdin (the owned
worktree has no node_modules). TypeScript transpile syntax checks passed on the
same files; this is not a full typecheck. git diff --check passed. No local build,
test suite, server, migration or configuration change was run. Staging
deployment and bounded coach-side retest are complete.

## Staging acceptance — 2026-10-01

- Coordinator deployed staging commit `9d5d1be839e624377c960b7d0a64f725ac0879ad`
  in Railway deployment `3c70cd64-335b-4b86-bd2a-8a0cd282ea6e` (SUCCESS).
  Hosted compile/typecheck passed; health HTTP 200, ready, schema 146.
- Removed only Bullrun's test-community role. Normal bot refresh paused access.
- Fresh coach page disabled Send and displayed the approved inline message.
- A coach page opened before the pause submitted a synthetic draft: the page
  stayed usable, displayed the inline pause message, and disabled Send.
- Restored the exact Discord role. Normal bot refresh restored access. Both
  coach pages enabled Send; the inline pause message cleared.
- The rejected draft was absent. Both original messages, chart attachment,
  pending/completed reviews, task and coaching history remained. Shared AAPL
  data returned. Bullrun was left with the original test role restored.
- Student-side pause/restoration passed before this narrow correction. Bullrun's
  browser was unavailable for a second student-side run after deployment;
  do not represent that earlier result as a fresh student-side retest.
- No production change. This completes the bounded correction, not acceptance
  of the entire Communities/Coaching feature.
