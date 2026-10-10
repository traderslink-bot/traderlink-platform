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
