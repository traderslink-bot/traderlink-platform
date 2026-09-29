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

## Dedicated bot activation and browser recheck — September 29

- Owner created and invited the separate TradersLink Communities bot. Coordinator
  applied only the staging bot-token variable and confirmed deployment
  `49b238e0-6d6c-4bd6-a9c8-a679b63db949` successful with one running instance;
  health HTTP 200, ready, sqlite_single_node, schema143. No production change.
- Runtime confirms role refresh configured. Last explicit pre/post-invite-boundary
  log at 01:41:03 UTC reports refreshed 0 / unavailable 1. Subsequent absence of
  errors is not positive success evidence: clean refreshes are not always logged.
  Positive member-refresh proof and real role removal/restoration remain pending.
- Read-only live browser recheck: Bullrun remains active; accepted agreement,
  completed review, messages and history remain present. Student messaging and
  Journal sharing remain off; no permission changes performed.
- Workload singular label verified live as `1 student`.
- Synthetic review retains Find trades, To review (3), Saved (2), progress and
  feedback. Selecting AAPL opens its inline trade-specific editor before the next
  trade. Saved reviews retain View or edit controls. No review content was changed
  or delivered during this recheck.
- Members page verification timestamp is community membership evidence, not
  platform_discord_memberships.last_verified_at_utc used by the bot refresher;
  do not use that UI timestamp to infer refresh success or failure.

### Remaining coverage

## September 29 resumed QA — coaching entry point

- Coordinator reconfirmed staging source278d2b837, deployment49b238e0 SUCCESS,
  one RUNNING instance and volume READY. No new runtime diagnostic is available.
- Reproduced `/communities/coaching` redirecting the signed-in TradersLink coach
  without a student relationship to `/communities/test-community/coaching`, which
  correctly rejects non-students. The prior action-helper correction did not fix
  this entry-point selection. It is incorrect to describe the community-specific
  student path itself as nonexistent; the catch-all serves authorized students.
- Corrected index routing locally: own student relationship -> student workspace;
  offer/student-management capability -> coach workspace; view/manage-all -> coach
  directory; no matching access -> Communities. Destination guards unchanged.
- Eight isolated route cases PASS. No hosted data mutation or full local build.
- No coaching Help Center article was found in the current feature tree; this
  correction restores existing navigation and introduces no new user-facing copy.
- Available Chrome profile identifies as TradersLink, not Bullrun. Requested the
  prior Bullrun profile be reopened; genuine remaining student-side tests cannot
  be claimed from the coach session.
- Bot role refresh remains unproven; do not equate conditional-log silence or the
  separate community verification timestamp with a successful platform refresh.
- Owner reopened Bullrun's Chrome profile. Genuine student workspace and prior
  delivered review/lesson/history verified; private coach history absent.
- Enabled Bullrun's Student messaging and Student trade-review requests through
  the coach UI. Both persisted checked and their student controls appeared after
  reload. Journal access remains off. These two service toggles are currently on.
- Zero-question allowance renders zero remaining and disables student Send.
  Nonzero allowance consumption/renewal and image handling remain unverified live.
- Submitted one synthetic `QA20260929 — Student review request`, no trade selection
  or payment. Coach reload confirms new review3e15fd01-f871-4318-bf78-b026e9b20b7f
  as Not started with Open review workspace. Did not resubmit after browser timeout.
- Chrome control then repeatedly returned Debugger unattached or timed out;
  requested reconnection. Do not classify browser-control failure as product failure.
- Entry-point targeted ESLint passed with environment-only React autodetection
  warning. Local checkpointb60166b0f handed to Coordinator for staging integration;
  remote deployment and post-release navigation verification still pending.

## September 29 browser reconnection checkpoint

- Owner reconnected the Chrome extension; Bullrun student browser access recovered.
- Student-requested review opens in the coach workspace and remains Not started
  on opening. Empty final review correctly disables Send review to Bullrun.
- Full Analysis tools drawer exposes no data with Bullrun Journal sharing off;
  it reports analysis unavailable and disables selection/addition. Positive
  populated analysis coverage remains pending synthetic account and sharing.
- Presentation finding: Student Journal > Analytics is a separate count-only
  drawer, while Analysis tools contains the full reports/Explorer/Analyzer.
  Do not mistake the count-only drawer for missing full analytics implementation.
- Coordinator reports navigation correction integrated with production-mirror
  candidate; database compatibility gate still pending. Not claimed deployed.
- Requested action-time authorization for synthetic chart upload and a synthetic
  Bullrun Journal shared with the TradersLink test coach on staging only.

Remaining: images, scheduled agreement/maintenance, nonzero student-question
allowance, populated shared Journal, live Discord role removal/restoration, and
post-release navigation checks. Bullrun has no Journal account. Messaging and
review-request service toggles are on; the accepted agreement has zero question
allowance. Prior lesson receipt/progress and responsive checks passed; repeat
only where the refreshed release changes the relevant behavior.

## September 29 authorized synthetic-data setup

- Owner explicitly approved synthetic chart upload and synthetic Bullrun Journal
  creation/sharing. Created `QA Coaching Synthetic 20260929` using Account settings;
  it is active. Existing Primary Journal preserved (earlier assumption that no
  Journal account existed was incorrect; no selector on coaching was not proof).
- Add Trade route redirected to Workspace; Session Tracker showed This page could
  not load. Reported exact routes to Coordinator. No direct database seeding used.
- Generated local labelled synthetic PNG (640x360), uploaded once from coach,
  sent once, verified Bullrun receipt and loaded natural dimensions 640x360.
- Student reverse upload stopped at browser extension requirement Allow access
  to file URLs. No student upload submitted; no application failure inferred.
- Shared active synthetic account with Account analytics scope. Student shows
  Account analytics grant and Revoke; coach reload shows Journal access On and
  empty account counts. No real Journal data shared. Grant remains active.
- Populated Journal/analytics and student-to-coach images remain unverified.
