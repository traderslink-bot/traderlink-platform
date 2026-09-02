# Trade Analyzer and Workspace Entry Follow-up Plan

## Purpose

Resolve the owner-reported Trade Analyzer, Workspace manual-entry, and
notification workflow gaps without changing Journal facts, trade grouping, or
market-data interpretation.

Progress is tracked in
[trade-analyzer-and-workspace-entry-follow-up-progress.md](./trade-analyzer-and-workspace-entry-follow-up-progress.md).

## Owner-approved scope

1. **Analyzer correction flow**
   - Keep a trade visibly open after an execution correction reloads its
     Analyzer state.
   - State the remaining correction count and make the next correction
     unmistakably available.
   - Make fullscreen recalculate the Analyzer chart's visible scale so the
     larger surface meaningfully enlarges the chart.

2. **Workspace Add Trade and Edit Trade**
   - Add a concise Trade Tracker helper link beneath Add Trade guidance.
   - Before committing a multi-row Add Trade submission, show the
     server-derived number of closed trades and whether a position remains
     open. The trader can cancel or explicitly save the grouped result.
   - Widen date and time fields in Add Trade, inline edit, and Edit Trade so
     native controls show their complete values.
   - Replace the ambiguous second edit-save action with a confirmation label
     and a clear Cancel action.
   - Style the existing post-save Trade Tracker link as an actual primary
     link rather than success-alert text.

3. **Analyzer outcomes and notifications**
   - Create a trader-scoped notification for terminal Analyzer
     market-data-unavailable outcomes, while preserving the owner alert.
   - Refresh the Trade Tracker only while it has pending Analyzer work, only
     while the document is visible, and never as an always-on poll.
   - Make a destination notification selected from the compact bell menu mark
     read, close the menu, and navigate reliably.

4. **Tracker copy**
   - Confirm the existing empty-Tracker helper line uses readable theme text
     in both empty page states; correct the exact rendered surface if source
     evidence shows a mismatch.
   - Make the dashboard page-loader text white in Navy Dark appearance while
     retaining its existing Light appearance.

## Data and safety boundaries

- Multi-trade grouping is always derived by the existing server preview. The
  browser must not invent grouping from only the newly typed rows, because
  existing positions can affect the result.
- A terminal market-data failure must not be described as an execution-time
  error. The trader-facing notification can direct the trader to review their
  records, but must keep the cause honest.
- Green-to-red classification is unchanged in this slice. It requires the
  exact SGLD session/candle evidence before any classification correction.
- No migration, broker/provider action, release, or production action belongs
  to this implementation slice.

## Verification

- Inspect the server preview-to-confirm path, scoped notification source keys,
  pending-only refresh cleanup, compact notification navigation callback, and
  date/time layouts in both theme modes.
- Run only focused static checks during implementation. Defer browser review
  and broader checks until the owner is ready to review this complete slice.
