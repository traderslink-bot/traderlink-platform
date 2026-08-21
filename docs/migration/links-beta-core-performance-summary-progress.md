# Links Beta Core Performance Summary Progress

**Status:** In progress. Owner-authorized direct-performance checkpoint after
the completed-trade and aggregate checkpoints.

**Controlling plan:** [Links Beta Performance Language Engine Plan](links-beta-performance-language-engine-plan.md)

## Why this checkpoint exists

The owner-reported Links AI Chat failure is broad: most ordinary questions
about a trader's own results must answer from exact Journal data. The earlier
checkpoint did not cover enough of that purpose. This checkpoint addresses the
direct completed-trade summary family before moving to rules, positions,
analyzer results, comparisons, or navigation.

## Exact scope

- Expand the typed completed-trade summary plan across the existing Question
  Bank's 15 performance templates and every existing calendar/relative scope.
- Use only the canonical `summarize_closed_trades` Journal contract, selected
  account, reporting-currency context, timezone, and fixed request time.
- Support net P/L, gross profit/loss, completed-trade count, win/loss rate,
  profit factor, expectancy, average trade, average winner/loser, long/short
  performance, and winning/losing-trade counts where the canonical metric is
  available.
- Render exact, evidence-linked deterministic answers. Coverage or population
  gaps return the existing truthful unavailable answer; Links does not invent a
  number.
- Reclassify the complete 2,985-question inventory with component diagnostics.
- Execute the 30 exact Question Bank cases in Batch 2 through normal saved
  Links AI Chat persistence against local Journal data, with zero provider
  calls. Batch 2 is the first real gate, not a substitute for the remaining
  performance templates.

## Explicitly outside this checkpoint

- Rule/result analysis, rule suggestions, positions, Green-to-Red analysis,
  comparisons, per-ticker detail summaries, weekday filters, conversation
  patches, Luna fallback, readiness UI, migrations, Railway, and any visible
  Links AI Chat surface.

## Acceptance gate

- [ ] Every direct-performance Question Bank template has an independently
      expected metric, money basis, direction filter, scope, handler, and
      deterministic factual request.
- [ ] The full 2,985-case evaluator reports the direct-performance cases as
      resolved with zero wrong plans and zero silently dropped modifiers.
- [ ] The Batch 2 real saved-answer run completes all 30 cases with the
      expected handler, evidence or an approved exact no-result answer, and
      zero provider receipts.
- [ ] Source and actual saved-answer results are recorded separately before
      another family begins.
