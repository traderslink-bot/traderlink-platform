# Coaching final QA continuation — October 10

Status: in progress; staging and full inventory acceptance remain open.

## Fresh new-user audit on production-parity staging

Coordinator confirmed source2029377, deployment54f772fb-09ee-487e-9d08-74f0cd4dd461,
schema154 ready and preservation of current production Academy/private Watchlist.
The owner requested a fresh setup-to-delivery audit, not a last-fix smoke pass.
No further coaching deployment is authorized by this record; coordinator is holding
the next batch until the complete audit handoff. No production release authorized.

### Local corrections awaiting integrated staging retest

- Re-entering the already-connected pilot server's onboarding crashed. Return its
  established community for the same verified owner without recreating settings,
  roles, channels or operator grants. Closed pilot restriction remains intact.
- Overview advertised Alerts/Watchlists destinations to members without access.
  Render those links only under their existing capability checks.
- Team exposed internal capability names. Complete the existing label map.
- Coach availability used obsolete global capacity. Directory/profile now use
  per-plan active counts, omit unpublished offers, disable full/self enrollment,
  and link existing enrollments to My coaching/View request.
- A new plan silently selected the first mapped Discord role (an alerts role).
  Start empty, require explicit selection to publish, show known role names and
  preserve an existing saved role even if mappings later change.
- Student-requested review focus read mutable plan items. A new regression proved
  accepted execution focus incorrectly became risk after a plan edit. Read accepted
  agreement items first; legacy arrangements without an agreement retain fallback.
- Discord-only official watchlists hid their own edit-page link. Restore the link
  for author/authorized manager only; member access is unchanged.
- Coach student cards offered Reply on drafts/completed/cancelled reviews despite
  server rejection. Show replies only after delivery in Delivered, Viewed or
  Follow-up states; disable paused access and require a nonempty body. Capitalize
  status labels. Focused component regression passes.
- Student review read/action/follow-up dates used the browser default timezone.
  Live read receipt changed dates after hydration and React418 was logged. Specify
  en-US/UTC with a visible UTC suffix, matching coaching timestamps. Component
  regression renders identically under UTC and America/Toronto. Hosted error-free
  retest remains required; do not call the local fix a verified hosted resolution.
- Coaching Work metric cards used grow columns for every plan, clipping desktop
  labels and overflowing mobile. Use two/three/four responsive columns and scoped
  wrapping labels without changing the shared dashboard card. Component check
  covers grid sizing plus days/custom dates/status/search/sort/count behavior.
- Alert list had no links to existing detail/edit pages. Add Open for tracked
  alerts and author/manager Discord-only alerts; focused access-link checks pass.

### Fresh live results, not inferred from fixture tests

- Onboarding failure reproduced; existing server preserved. Settings unchanged-save
  persisted. Team/role/channel setup inspected without altering permissions.
- New unpublished plan saved/reopened with two weekly complete trading days,
  three-day deadline, capacity3, USD0 and unscheduled custom coaching.
- Student message persisted/received, allowance2 to1. Existing student and coach
  images decoded640x360 for both accounts after schema154 integration.
- New student AAPL request626a058e progressed from student selection to inline
  saved feedback, To review0/Saved1, shared notes/executions drawer, overall and
  previous-focus notes, final preview, Delivered, and student-confirmed Viewed.
  Coach-private canary absent from final preview and student rendering.
- Follow-up receipt confirmed after reconnect, coach reply received by Bullrun,
  follow-up due date saved, then Completed persisted on both sides with conversation
  intact. No duplicate student reply submitted.
- New task dueOctober11 appeared for both parties; number-of-days1 excluded it,
  number-of-days2 included it with matching counts. Completed by coach, removed
  from student Upcoming, and retained in coach task history.
- Fresh session: Oct12 15:00UTC,30minutes, synthetic external meeting link and agenda
  reached Bullrun. Completed shared notes moved into student history, no private
  canary disclosed, coach completion persisted after reload.
- Selected-student reuse draft published as Resource assignment to Bullrun only,
  dueOct13 16:00UTC. Student received it and marked complete; coach shows1of1
  completed. Original assignment remains unchanged.
- Student390px dark-mode viewport has no horizontal overflow; agreement and teaching
  cards visually inspected. Override reset. Coach teaching console had no captured
  errors; student console exposed the date hydration bug above.
- Work desktop1440 table/search/month placement inspected. Mobile390 exposed metric
  overflow above. Browser custom-date entry did not stick; not counted as live pass.
  Exact range filtering passes the isolated component check only. Overrides reset.
- Tracked official watchlist edit added MSFT beside AAPL and persisted; a subsequent
  removal restored AAPL only, verified from the list. Original notes/title unchanged.
  No new Discord post was sent. Composer uses author symbols/notes, not admin AI.
- Teaching student-complete versus coach-published status remains separately
  controlled, as previously recorded; not automatically marked a defect.

### Checkpoint checks

- Ten bounded component/route/navigation/context scripts pass, including new
  onboarding, capacity/link and explicit-role regressions.
- In-memory remediation, community20-capability/28-table isolation/grants and
  four-mode Discord delivery scripts pass. These are not fresh hosted deliveries.
- Targeted lint of12 changed/new source files: zero errors; six pre-existing
  unused legacy-component warnings remain. React memo dependency issue found in
  this pass was corrected and lint rerun. No local production build performed.
- Existing help workflow remains accurate for these bug fixes; no new guide copy.
- Additional reply/date/work-filter regressions and expanded alert-link regression
  pass. Eight-file targeted lint: zero errors, the same six existing legacy unused
  component warnings. Hosted fixes and final console/responsive retest still open.

### Readiness / product gaps still requiring explicit disposition

- NOT ready for public multi-server onboarding: action hardcodes pilot guild,
  test roles/channels and pilot-owner operator bootstrap. Do not merely remove
  the gate; production onboarding needs isolated per-server setup and no automatic
  platform-operator grant for arbitrary server owners.
- Ad-hoc student review requests have no automatic deadline. Coach can assign
  one; recurrence-generated reviews have agreed due dates. Define how an extra
  student request consumes an agreed review before inventing quota/deadline rules.
- Archived official watchlists have no visible recovery list. Discord-only edits
  do not rewrite old Discord posts. Record as product lifecycle gaps, not tested
  features. Community watchlists do not force owner-admin AI analysis.
- Final hosted retests, remaining fresh UI inventory and responsive/console pass
  remain open. Chrome recovery tried stale-tab refresh, documented troubleshooting,
  current-profile discovery and fresh tab; fresh coach tab briefly worked then
  detached again. Code QA continued; owner notified to reconnect profiles.

Controlling inventory: `traderlink-coaching-complete-qa-20261001.md` in the canonical repository.

## Confirmed corrections

- Scheduled trade review displayed Custom in the live work list although the workspace was Trade review. Use the existing shared review label resolver.
- Previous-focus selection used edit timestamps. A pre-created draft could miss the most recent delivered focus, and edits to old reviews could reorder reminders. Select the latest non-cancelled delivered focus for the same student; a delivered review only looks before its own delivery.
- No new UI, permissions, migration, payment or Journal writer behavior.
- Live custom-review exercise exposed blank stale focus editors after clearing and deselecting a section. Only selected sections or sections with written feedback remain editable; preserves written content while excluding invalid blank fields from the next save.

## Verification

- Targeted regression script covers pre-created drafts, source order, delivery chronology, same-student isolation, blank/cancelled/draft exclusions and labels.
- React checklist: no new hooks, fetching, mutable shared state, component nesting or interaction changes; helper filters into a new array before sorting.
- Help: existing workflow unchanged; no new public help text required for corrected label/reminder behavior.
- Live retest and remaining review variants, comparisons, uploads and full final audit pending.

## Additional live evidence

- Synthetic performance period September 23–25: 3 closed trades, net 30, 2 winners/1 loser; preceding September 20–22: 2 closed trades, net 10. Trading-day September 25 shows only NVDA journal notes. Strategy execution/risk feedback saved and survived reload, then restored to blank. Custom type with both dates empty saved and survived reload.
- Student Bullrun uploaded the approved synthetic chart through Chrome; new attachment 2749c217-31a3-4cce-98d1-04b92f5979b7 appeared for both parties, and coach image decoded at 640x360. Previous coach attachment remains intact.
- In-memory coaching remediation, community isolation/capabilities/grants, and four-mode Discord delivery verifiers pass again on October 10.

## Correction-build acceptance

- Staging17dfd695: custom Bullrun review a69f9cce saved with no trades/dates, delivered,
  acknowledged Viewed; private canary absent from student and final preview.
- Pre-created draft682f38d5 shows the new delivered next-focus reminder.
- Cleared/deselected Execution/Risk editors absent; remaining feedback saves.
  Synthetic draft69865 restored to Performance September18–25 and original focus,
  with two saved/three queued trade reviews and original notes preserved.
- Selected-student reuse saved to a new unpublished one-student draft, original
  assignment unchanged. Student image receipt confirmed on both sides.
- Final focused rerun passes remediation, community, delivery, navigation, reminder
  and reader-context scripts. Reader-context script uses mocked annotation
  collaborators and is not described as hosted day-note evidence.
- Canonical complete QA report now reconciles all thirteen inventory areas and
  distinguishes live/fixture evidence and deferred activity presentation.
- Production-parity staging reconciliation and final integrated smoke remain open;
  coordinator owns the release. No production coaching publication authorized.

## Final-audit attachment response correction

- Anonymous GET of the approved synthetic attachment returned empty HTTP500 twice.
  Authorization prevented image disclosure, but expected denials were unhandled.
- Route now maps known access/session/missing/invalid-input failures to an empty,
  private no-store404. All identity/community/relationship/image guards remain;
  unexpected storage/runtime errors still propagate. No UI or guide copy change.
- Focused route regression covers denied cases, no DB image read after failed
  identity, absent community, authorized bytes and unexpected error propagation.
  Coordinator integration and fresh anonymous/authenticated retest required.
- Follow-up reproduced a Response-header TypeError for Unicode chart filenames.
  Content-Disposition now uses an ASCII fallback plus UTF-8 filename encoding;
  regression checks Unicode/emoji/quotes with unchanged authorized image bytes.
