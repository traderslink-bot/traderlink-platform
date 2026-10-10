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
deployment/retest remains pending.
Retest disabled Send, stale-page denial without page failure, unchanged message
count/history, and restored Send. Do not call the entire feature complete.
