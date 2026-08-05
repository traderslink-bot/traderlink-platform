# Cooldown After Loss Rule Progress

**Status:** Implemented locally; owner visual review and focused verification
pending.

**Controlling plan:** [Journal Review Workflow Corrections Plan](journal-review-workflow-corrections-plan.md)

## Approved behavior

- Preset title: **Cooldown after a loss**.
- Visible statement: “Wait after a completed losing trade before entering
  another Day trade.”
- The trader must choose a whole-number wait time in minutes. No duration is
  suggested, prefilled or used as a fallback.
- The Journal calculates the result from eligible completed Day trades only.
  A later entry that begins before a selected cooldown after a completed loss
  is **Broken**; otherwise it is **Followed**.
- If the needed P/L or entry/exit timing cannot be confirmed, the affected
  result is **N/A**. Open positions, Swing trades and unresolved facts do not
  receive guessed results.

## Implementation record

- [x] Added the preset to the native replacement Rules catalog.
- [x] Added server-side whole-minute validation with a one-day maximum.
- [x] Added automatic per-trade evaluation from the Journal ledger.
- [x] Kept the add-rule wait-time field empty and removed an example duration.
- [x] Recorded the owner decision in the controlling plan and migration tracker.
- [ ] Owner visual review of the Rules library, add-rule form and Day Trade
  Tracker result.
- [ ] Focused verification after owner design acceptance.

No test suite was run during this design-first pass, at the owner’s direction.
