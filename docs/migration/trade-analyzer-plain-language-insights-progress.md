# Trade Analyzer Plain-Language Insights Progress

**Status:** Owner review in progress — 2026-08-30

**Controlling plan:** [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md)

## Outcome

Show the meaning of a trader's saved Analyzer results before the detailed
evidence. Each view starts with a factual sentence in ordinary trading language
and keeps the existing cards, comparisons and exact trade replays underneath.

## Fixed boundaries

- Use only the existing account-scoped saved Analyzer result model.
- For final-exit follow-through, use the persisted 30-minute observation only;
  never substitute a later 60-minute reconciliation or compute a new market
  value.
- Do not change calculations, data population, market-data behavior, Journal
  facts, eligibility, routes, schema or migrations.
- Describe recorded outcomes only. Do not add a prediction, score, causal claim
  or trade instruction.
- Keep the detailed evidence available, including its mobile sideways table
  treatment when a table cannot fit.
- Keep MFE and MAE searchable and fully defined in Help, while using
  plain-language labels in the main product.

## Review checklist

- [x] Add deterministic plain-language takeaways from the real saved model for
  each Analyzer landing/capability view.
- [x] Translate the user-facing MFE/MAE destination, cards and tables to
  movement in the trader's favor and against them.
- [x] Translate the Analyzer landing-card, navigation, page-title and metadata
  labels.
- [x] Align the Help Center labels and MFE/MAE explanatory table.
- [x] Add exact per-trade final-exit follow-through from the saved 30-minute
  observation, with explicit long/short, zero, negative and unavailable copy.
- [ ] Open the local real-data review on desktop and mobile for owner approval.
- [ ] Apply only owner-approved copy or layout refinements.
- [ ] Run the smallest targeted static checks, then record the review outcome;
  no Vitest or broad suite during the design cadence.
