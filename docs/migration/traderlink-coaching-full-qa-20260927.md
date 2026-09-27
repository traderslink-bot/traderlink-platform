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

## Results — whole-feature acceptance is not passed

Browser QA used the authenticated staging coach and six explicitly synthetic trades.
Source inspection covered the full inventory above. This is not a claim that every
role, lifecycle transition, permission combination or external integration was
executed end-to-end. Those boundaries are recorded below rather than counted as passes.

### Fix verification

- Source fix `1a50c2d2f78cd431d054d6c1d96679c031754378`: 42 palette/theme/state
  contrast calculations pass, minimum 4.51:1. Live browser measured all13 cards in
  light/dark selected/unselected states: title and badge minimum 4.82:1, descriptions
  minimum 9.66:1. Targeted selected-hover checks on final deployment measured
  Rules/light4.51:1 and Strategy/dark6.26:1. Original Light appearance restored.
- Follow-up `6ca0519aac23289791b827a206d0d04d6cad3432`: saved-plan item/student
  counts, preview capacity, delivery days, follow-up days and minutes also use
  singular wording for one. Bounded execution of all13 offer summaries at counts
  one and two: 26 checks passed. The initial temporary verification harness failed
  because its Node module filename was unset; correcting the harness produced the
  passing result without changing application logic.
- Final live preview verified `1 student`, `1 session`, `Due within 1 day`,
  `1 minute`, `1 day of follow-up`; saved synthetic plan shows `1 coaching item`
  and `1 student`. Two/many wording is covered by bounded formatter checks and
  existing saved-plan listings.
- `git diff --check` passed. No local production build or broad test suite.
- React checklist: no changed hooks, effects, data fetching, server actions, storage,
  permissions or list keys. Only palette/text rendering changed.
- Help Center `traderslink-app-guides.ts`, Coaching and Journal privacy, inspected:
  these display corrections require no guide change. Broader feature documentation
  must not claim the missing capabilities below are complete.

### Browser-confirmed results

| Inventory area | Evidence and limit |
| --- | --- |
| 1. Setup | All13 offer cards open their distinct editors; all13 Added states and preview entries render. Quote required changes preview; Custom coaching defaults to flexible and allows an optional schedule. No existing profile or plan was submitted/changed. Saved-plan editing is missing (F2). |
| 2. Enrollment | Source audit only: activation/capacity checks exist, but finalized agreement and work generation missing (F1). No fake enrollment acceptance claimed. |
| 3. Coaching Work | Upcoming list loads, no-match search sets matching counts to zero, clearing restores results; week/month/custom views render. QA due date saved for Sep28 14:00 UTC; five-day list/counts include both reviews, one-day includes only Sep27, two-day includes both; Due latest reverses their order. Custom input entry did not stick through browser automation, so custom-date filtering remains unverified rather than passed. Timezone-edge tests remain outstanding. |
| 4. Students | List and individual workspace load existing synthetic relationship and plan, Journal, tasks, messages, review/history controls. Existing saved review preserved. Message exchange not sent. |
| 5. Review setup | Switched only QA draft to Performance, Sep18–25, with Rules/Journal/Next steps. Saved setup loads six synthetic trades, USD net30, three winners/three losers, partial coverage, No recorded rule results and actual synthetic notes. Rules/Journal feedback and Next focus save separately. Full tool completeness is not accepted; see F4. |
| 6. Trade review workflow | New isolated draft: select all six, add to queue, inline NVDA feedback save, automatic advance to AMD, Saved1/To review5, reload, reopen/edit/resave NVDA, remove META from queue and confirm return to Find. Final state Saved1/To review4/Find1. |
| 7. Journal tools | META Details drawer loads executions, notes and synthetic-data label. Analytics drawer displays only shared/closed/open counts (F4). Chart drawer opens, but candle accuracy/provider delivery not established. |
| 8. Final review | Overall summary/private note persist. Final preview includes edited NVDA feedback and summary, excludes coach-private note, marks four unfinished trades Not ready, disables Send. No delivery performed. |
| 9. Sessions | Coach session form and source audited; required organization controls missing (F5). No session scheduled or completed. |
| 10. Teaching | Live page loads Create and empty listing; lesson/class/assignment, link/schedule/audience controls present. Source confirms saved coach cards omit link/schedule and editing controls (F5). Nothing published. |
| 11. Student | Source renderer reviewed for delivered-only content and private-note omission. Coach-only account receives expected404 at community student route, consistent with explicit student-relationship guard. Synthetic student has no OAuth identity: actual student sign-in, image exchange, read confirmation and follow-up not verified. |
| 12. Access | Source checks relationship, coach capability, required-role presence and account grant; review drafts/private notes are filtered from student snapshots. Revocation, role removal/restoration and cross-user access were not exercised against live identities. No blanket security pass. |
| 13. UI | 390px mobile review uses cards with inline editor and no observed horizontal overflow. Desktop uses aligned table/inline row. Mobile checkboxes lack accessible names (F7). No console errors captured in inspected QA draft. Two final-preview Return link clicks did not navigate; direct route loaded. Recheck after update, not yet a confirmed route defect. |

### Open findings

**F1 — High: plan-to-work workflow is incomplete.** Plan items store quantity,
frequency, coverage and due offsets, but `setRelationshipStatus` only activates
the relationship/service toggles. No finalized per-student agreement or recurring
work-generation path was found in the inspected Communities runtime. Coaches must
currently create reviews/tasks themselves. This falls short of the agreed plan.
Evidence: `traderlink-community-platform-repository.ts:205` and plan/item writes.

**F2 — High: saved plans cannot be edited from Coach Setup.** The list offers
Pause/Publish and Archive, no Edit. A draft receives Pause rather than a direct
Publish action. Evidence: `coach-setup-page.tsx`, Coaching plans section.

**F3 — High: advertised question/follow-up limits are not enforced.** Plan values
are stored, but `sendCoachingMessage` checks only active relationship, role and the
student-messaging boolean. `replyToReview` checks delivery/state and messaging,
not the plan question allowance or follow-up expiration. No counter/reset flow
was found. Evidence: repository234 and coaching-program-service116.

**F4 — High: coach analysis tools are materially narrower than the offered scope.**
The live Analytics drawer contains only three trade counts. The focus editor adds
basic performance/rule summaries, but no complete coach-scoped Analytics Reports,
Trade Explorer or Trade Analyzer workflow was found. Selecting these resources
in a plan does not itself integrate those tools into the review workspace.

**F5 — Medium: sessions and teaching remain partial.** Sessions have title,
agenda, time and a single completion note, not duration, meeting link or separate
private/shared notes. Teaching has basic content/link/audience creation, but coach
listing omits saved link/time and edit/reuse/progress controls. Live/recorded lesson
organization and assignment deadlines remain incomplete. Evidence:
`coaching-program-pages.tsx:16-18`, program-service117-120.

**F6 — Medium: role-change lifecycle is only partially implemented.** Access-paused
labels and role-based write/read rejection exist. Proactive coach/student role-loss
notifications and auto-archive execution were not found in inspected runtime;
`auto_archive_after_days` appears as configuration/storage. Real Discord refresh,
removal and restore remain unverified, not claimed broken solely from absence of a
live test.

**F7 — Medium: mobile selection checkboxes have no accessible names.** Desktop
checkboxes identify ticker/date/action; mobile card checkboxes are unnamed in the
accessibility tree. Evidence: persistent review workspace, 390px browser snapshot.

**F8 — Medium: student workspace chooses only the first active relationship.**
`StudentCoachingWorkspace` uses `.find(...)` and has no relationship selector.
Multiple active coaches/plans in the same community would not all be reachable
from that workspace. Source-confirmed; multi-coach live scenario not seeded.

### Data and release boundaries

- Existing review `aa1785a7-9b20-44cf-b2df-7cd2bb5c250f` was not edited.
- Only new QA draft `69865ebd-fc79-4daa-9d28-e99d405ba752` was created, titled
  `QA20260927 - isolated workflow draft`, under existing synthetic relationship.
  One saved edited trade review, four queued trades, one removed selection,
  overall summary and coach-private note remain as reproducible QA evidence.
  QA draft now uses Performance Sep18–25 with Rules/Journal/Next steps, saved
  focus feedback and next-focus reminder, due Sep28 14:00 UTC.
- No delivery, Discord post, student identity, permission grant, reset, deletion,
  production mutation, plan publication or external meeting was performed.
- Student-authenticated delivery/read/follow-up, image upload/download isolation,
  real role refresh, notification delivery, capacity races, large data pagination,
  all timezone edges and full chart provider results remain unverified.
- Coordinator owns hosted release verification. First candidate `ad5cfe78d5526abbb3016e10322b60ec3c89b5b7`
  is live via deployment `f1a59488-0795-46f3-af5b-173e388596ce`, SUCCESS. Coordinator
  verified exact140, original volume, public ready and two preserved reviews.
  It incorporates current production wording and excludes held navigation.
  Final follow-up `5f2f2ca6ba5c5b8cae8d854a7193aa48e294d87f` is live via
  `890e7262-c094-485b-8807-32a773740588`, SUCCESS. Coordinator verified exact140
  registry, original READY volume, normal configuration, public ready and both
  review records at16:23UTC. Final browser checks above were run on this release.

## Checkpoint disposition

Presentation-fix slice complete and staging-verified. Whole-inventory QA review
complete within the evidence boundaries above; **feature acceptance failed** due
to F1–F8 and the unverified end-to-end scenarios. Do not mark the overall coaching
implementation complete. No new feature redesign was silently bundled into fixes.
