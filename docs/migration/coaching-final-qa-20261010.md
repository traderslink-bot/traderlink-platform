# Coaching final QA continuation — October 10

Status: in progress; staging and full inventory acceptance remain open.

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
