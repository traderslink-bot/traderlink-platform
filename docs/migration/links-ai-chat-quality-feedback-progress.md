# Links AI Chat quality feedback progress

## Current checkpoint — 2026-08-20

- [x] Owner approved private quality capture for every failed/unavailable Links
  answer and a small **Not helpful** action below each completed Links answer.
- [x] Owner clarified that every quality case must carry surrounding
  conversation context, not only the selected bubble.
- [x] Locked the bounded snapshot: trigger exchange plus up to six messages on
  either side when available, capped at thirteen ordered messages.
- [ ] Add migration and scoped immutable quality-case persistence.
- [ ] Add automatic capture, owner notification and trader flag route.
- [ ] Add the Links action and owner-only quality queue.
- [ ] Run focused low-resource verification and owner review.

## Notes

- `Not helpful` is the approved concise trader-facing label.
- Automatic failure capture must include the triggering question and the
  immediately available preceding context; later messages cannot be invented.
- Existing private conversation text remains private. The owner queue is not a
  general workspace-admin surface.
