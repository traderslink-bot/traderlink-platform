# Trend & Momentum analyzed-trade count display

Owner authorized implementation and Coordinator production handoff, 2026-09-13.
Scope: indicator displays use analyzed trades, not the full journal population.
No recalculation, provider request, financial change, schema or Swing work.

- Shared display projection retains analyzed trades with missing/older indicators;
  positive saved-execution evidence supports older offline snapshots.
- Page count/direction and table denominators use that analyzed population.
  Removed redundant standalone full-history caption and exclusion paragraph.
- Day overview and related indicator comparison copy explicitly say analyzed.
- Help updated; existing theme tokens and shared online/offline renderers retained.
- Regression fixture covers 509 journal trades / two analyzed results, missing
  indicators, legacy offline metadata, both directions and 1m/5m rendering.
- Focused checkpoint: six files / 39 tests passed (one worker, 512MB cap);
  all changed TS/TSX lint clean and whitespace checks pass. Covers shared rendered
  online/offline 1m/5m, Light/Navy count styling, cohorts and during-trade studies.
- The first checkpoint exposed legacy analyzed-only snapshots without records;
  preserve their explicit aggregate analysis evidence. Corrected and reran all
  six files successfully. Entry & Exit shared caller also receives the analyzed
  denominator. No provider/financial calculation was changed.
- Full dependency-graph TypeScript attempt exceeded the 512MB cap; do not claim
  local semantic typecheck passed. Coordinator build/typecheck is required before
  production. No local server or production build started.
- Implementation complete; hosted visual acceptance/release evidence pending.
  Coordinator owns production lane; exclude prior Swing planning commits when
  reconciling this one allowlisted commit. Verify two-analyzed account page counts,
  subset counts, direction/date selection and absence of journal-total deficit
  copy; updated UI must preserve valid missing-indicator categories.
