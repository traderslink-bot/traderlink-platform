# Coaching live QA — 2026-09-28

Status: in progress. Continues the complete 13-area inventory in
[the remediation QA report](traderlink-coaching-remediation-qa-20260927.md).
Do not treat service fixtures as authenticated browser evidence.

## Environment and boundaries

- Coordinator confirms staging source4492726214c2715bd480102160d32c320cebd4ec,
  deployment0ada8ce4-12c0-4b51-bdfa-482100d2e478 SUCCESS/RUNNING.
- Genuine TradersLink coach and Bullrun student sessions; test-community only.
- No production mutation, payment, Journal grant or Discord role change.
- Coordinator reconfirmed coaching bot credential absent. Live automatic role
  removal/restoration remains blocked; do not invent configuration or copy secrets.

## Results

- Disposable remediation verifier PASS: unsigned/student-only acceptance, five
  generated occurrences, idempotence, month-end, unscheduled coaching, plan edits,
  revision conflicts, frozen terms, question renewal, follow-up expiry, draft and
  session privacy, lesson edit/reuse, role pause/restore, archive preservation and
  foreign keys. In-memory only; no local build or dependency installation.
- Actual zero-dollar TEST plan agreement: coach proposal received by Bullrun,
  student accepted, coach sees acceptance notification and both show Accepted/
  No schedule. No transaction or checkout. This does not prove hosted recurrence.
- Coach task QA20260928 — Check student progress persists with Sep29 17:00UTC
  deadline and appears in Bullrun Upcoming.
- Coach message reaches Bullrun. Subsequent coach redirect fails404 at
  /communities/test-community/coaching. Confirmed source defect below.
- Shared history reaches Bullrun. Separate PRIVATE QA20260928 coach history is
  saved on coach page and absent from refreshed student DOM.
- Existing review lifecycle remains verified in the progress record: delivery,
  student read acknowledgement, follow-up deadline/message and completion.

## Confirmed correction: obsolete coaching action return paths

Several actions still build /communities/{slug}/coaching although the actual
student dashboard is /communities/coaching. Update the shared URL/invalidation
helper for that destination. Message submission instead refreshes both relevant
pages without navigating away from the submitting coach or student workspace.
Authorization, storage and content are unchanged.

- Focused action navigation verifier PASS: canonical student destination, coach
  context retained, both views invalidated, authorization error still propagates.
- Targeted action lint PASS (environment warning: React autodetection unavailable
  in dependency-free worktree). Hosted correction and browser recheck pending.
- Help Center wording need not change: this restores existing advertised flows,
  without adding features or changing visible controls.

## Still being exercised

Lesson receipt/progress, images, scheduled agreement/maintenance, student questions,
shared Journal, remaining negative access and desktop/mobile checks. Bullrun has
no Journal account and messaging/review requests remain disabled. Permission
changes require their own explicit action boundary; do not bypass them.
