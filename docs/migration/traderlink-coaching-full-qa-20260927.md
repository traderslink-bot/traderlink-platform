# Coaching feature QA — 2026-09-27

Owner authorized fixing the two known presentation findings, followed immediately
by QA of the entire coaching feature. Production and existing saved student work
remain unchanged. Coordinator owns staging release and any test-data operations.

## Fix checkpoint

- Stronger light/dark text shades and non-stacked status backgrounds preserve
  seven review colours while correcting contrast. Verify rendered states after deployment.
- Singular/plural labels for trades, trading days, reviews, check-ins, sessions,
  lessons, questions and custom items. No change to stored counts or plan semantics.
- No local full build or broad tests; remote build and bounded checks only.

## Complete coaching inventory and evidence boundary

Each area below requires evidence or an explicit unverified boundary; a page load
alone is not lifecycle acceptance. Latest owner-approved offer builder supersedes
older offer-access setup prose; do not restore Journal-grant controls to plan creation.

1. Coach profile; service offers; all13 service editors; custom freedom; price,
   quote, currency, billing, capacity, Discord role, draft/publish/pause/archive.
2. Enrollment requests; plan comparison and finalized student agreement;
   quantities, frequency, coverage, deadlines and generated work.
3. Coaching Work: upcoming day count, custom range, week/month, search/filter/sort,
   outstanding/overdue/due-soon and per-plan counts, student-specific next action.
4. Students: list, individual workspace, plan details, tasks, history, notes,
   messaging and private image attachments.
5. Review setup: trade/day/performance/strategy/custom, optional focus sections,
   period comparisons, rules/notes/tags context and prior focus.
6. Find/To review/Saved: search/date/sort/page, student/coach selection, selection
   removal, inline per-trade feedback, save-and-advance, edit and refresh persistence.
7. Trade Details, executions, chart, Journal drawers, analytics/report/explorer/
   analyzer availability, permission-scoped factual reads, no Journal mutation.
8. Review completion: optional overall feedback, student actions, images, private
   notes, progress, full final review, delivery/read/follow-up/due/completed/cancelled.
9. Sessions: time, duration, external link, student agenda, private/public notes,
   attendance/completion/history. No native live-video expectation.
10. Teaching: live/recorded lessons, resources/assignments, external links, audience,
    reusable lessons, due dates, attendance and student progress.
11. Student normal-dashboard placement: own agreement/work/reviews/messages/media,
    student trade requests/read confirmation/follow-up; drafts/private notes excluded.
12. Isolation and entitlement: coach/student/community boundaries, sharing/revocation,
    role pause/restore, preserved history, no inferred payment or unauthorized data.
13. Cross-cutting: responsive desktop/mobile, Light/Navy Dark, contrast, keyboard,
    labels/errors/empty states, navigation/routes and console errors.

## Results

In progress. Existing synthetic student has no sign-in identity. Preserve its saved
review; no invented student-login or delivery proof. New disposable test records
must be explicitly scoped with Coordinator before creating them on staging.
