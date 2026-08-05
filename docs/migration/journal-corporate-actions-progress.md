# Journal Corporate Actions and Share Adjustments Progress

**Status:** Planned; implementation has not started.

**Plan:** [Journal Corporate Actions and Share Adjustments Plan](journal-corporate-actions-plan.md)

## Recorded boundary

- Stock splits and reverse splits are future Journal corporate-action facts, not
  executions or ordinary Tracker entries.
- A confirmed action adjusts derived open-lot quantity and per-share basis while
  preserving the original execution evidence and total basis.
- The system must never infer a split from a price/quantity pattern alone.
- Unconfirmed actions affect neither round-trip results nor Analytics. Only the
  dependent chain is contained in Data Decisions; unrelated activity remains
  visible.
- Manual executions can cross a confirmed action using their actual dates/times.
  An intentional manual share-adjustment record is separate from manual trade
  capture.
- The initial scope includes forward/reverse common-stock splits and broker
  cash-in-lieu settlements. Other corporate actions require later explicit
  contracts.

## Next-run start point

1. Read the linked plan completely.
2. Reconfirm the replacement repository, current branch, current database
   boundary and any concurrent unstaged work before editing.
3. Finalize the schema/contract checkpoint before implementation. Do not reuse
   V3 corporate-action behavior or introduce numeric inference.
4. Keep all existing real statement evidence and unrelated accepted Journal
   results intact.

## Completion checklist

- [ ] Contract and migration checkpoint complete.
- [ ] Broker-neutral mapper/action evidence complete.
- [ ] Data Decisions confirmation flow complete.
- [ ] Deterministic reconstruction and eligibility complete.
- [ ] Focused verification and owner visual review complete.
