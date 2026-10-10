# Coaching final QA continuation — October 10

Status: in progress; staging and full inventory acceptance remain open.

Controlling inventory: `traderlink-coaching-complete-qa-20261001.md` in the canonical repository.

## Confirmed corrections

- Scheduled trade review displayed Custom in the live work list although the workspace was Trade review. Use the existing shared review label resolver.
- Previous-focus selection used edit timestamps. A pre-created draft could miss the most recent delivered focus, and edits to old reviews could reorder reminders. Select the latest non-cancelled delivered focus for the same student; a delivered review only looks before its own delivery.
- No new UI, permissions, migration, payment or Journal writer behavior.

## Verification

- Targeted regression script covers pre-created drafts, source order, delivery chronology, same-student isolation, blank/cancelled/draft exclusions and labels.
- React checklist: no new hooks, fetching, mutable shared state, component nesting or interaction changes; helper filters into a new array before sorting.
- Help: existing workflow unchanged; no new public help text required for corrected label/reminder behavior.
- Live retest and remaining review variants, comparisons, uploads and full final audit pending.
