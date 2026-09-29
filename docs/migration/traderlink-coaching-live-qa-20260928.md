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
- Full communities in-memory verifier PASS:20 capabilities,28 expected tables,
  community isolation, Discord role mappings, Journal revocation, named activity,
  Tier2 idempotence and zero foreign-key violations. No hosted writes by verifier.
- New synthetic lesson published to Bullrun only, not Discord. Student received it
  and marked complete; coach count became1 of1 completed. Edited recording link
  and Sep30 17:00UTC deadline reached student while completion remained intact.
- Student direct navigation to coach workspace/student detail and Coach Setup
  returns404 without exposing coach content. Existing unrelated draft lessons
  remain absent from student view.
- My Coaching mobile390: document375/scroll375; desktop1440: document1425/
  scroll1425. Light and dark inspected; original dark restored and viewport reset.
  Captured student error log empty. Breakpoint resize required a subsequent
  settled/reloaded view before desktop containment was visually confirmed.
- Work search Bullrun yields2 tasks/lesson entries with matching plan counts;
 1day yields0,2days yields1 (Sep29 task),5days yields2. Date boundary includes
 today, as requested. Completed review excluded from active work.
- Minor workload copy finding: lesson row said `1 students`; narrow singular/plural
  correction now matches the Teaching page. Local only until next staging release.

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

## Deployed correction recheck

- Coordinator integrated current productionff6b0521 and the complete previous
  coaching staging ancestry, then852085915. Published stagingbfd913ee4522856f4be339a58f058a7a3409ae67,
  deployment561ee321-dac1-4a9e-8ed0-9b31c613577c SUCCESS/RUNNING,
  healthHTTP200/ready/sqlite_single_node/schema143. Manifest unchanged.
- Fresh deployed coach message recheck PASS: saved once, visible in coach and
  Bullrun student sessions, coach remained on its student workspace (no404).
- Task completion initially hit the old page's server action during cutover at
 06:14:12UTC. Coordinator confirmed that deployment window. Fresh reload/retry
 succeeded: coach open-task count0 and refreshed student Upcoming omits task.
 Do not classify the cutover-coincident failure as a reproduced feature defect.

## Still being exercised

Lesson receipt/progress, images, scheduled agreement/maintenance, student questions,
shared Journal, remaining negative access and desktop/mobile checks. Bullrun has
no Journal account and messaging/review requests remain disabled. Permission
changes require their own explicit action boundary; do not bypass them.
