# Analyzer Tooltip Source Inventory

Plan: [Trend & Momentum](trade-analyzer-trend-momentum-plan.md).
Source checkpoint: `b4dea5cb1` relative to `f97ab1cee`.

This index covers all 19 changed TSX files. Source remains authoritative for
exact wording, including dynamic Gross/Net, timeframe and direction variants.
It is not a claim that every explanation is correct or browser-accepted.

## Component and page inventory

All paths below are relative to the repository root.

| Source | Review target |
| --- | --- |
| `app/(dashboard)/analytics/analyzed-trades-index.tsx` | Analyzed-trades card and mapped table headings; saved-trade count, date, direction, P/L and inclusion explanation. |
| `app/(dashboard)/analytics/analyzer-disclosure-section.tsx` | Shared independent heading toggle and help button; receives exact title/help from caller. |
| `app/(dashboard)/analytics/candle-pattern-occurrence-explorer.tsx` | Occurrence versus saved-trade counts, evidence details and supporting navigation. |
| `app/(dashboard)/analytics/trade-analysis-client.tsx` | Existing page cards, ColumnHeading calls, mapped headings, conditional explainColumns, and financial comparison definitions. Includes Room After Entry, Day and scenario surfaces. |
| `app/(dashboard)/analytics/trade-analysis-page.tsx` | Page composition: confirm which client sections and Help definitions are selected. |
| `app/(dashboard)/analytics/trade-analyzer/day/trend-momentum/page.tsx` | Route wrapper; explanations belong to rendered client components. |
| `app/(dashboard)/analytics/trend-momentum-analysis.tsx` | Seven section explanations; execution, during-trade, horizon, closure and occurrence table headings. |
| `app/(dashboard)/analytics/trend-momentum-band-comparison.tsx` | Axis selection, spacing/freshness labels and delegated outcome columns. |
| `app/(dashboard)/analytics/trend-momentum-conditions.tsx` | Eight condition controls, ten comparison columns and supporting-trades component. |
| `app/(dashboard)/analytics/trend-momentum-execution-comparison.tsx` | Entry/exit execution and timeframe selection; delegated band/outcome explanations. |
| `app/(dashboard)/analytics/trend-momentum-landmark-comparison.tsx` | Coverage explanation and pre-point versus later-outcome distinction; delegated outcome columns. |
| `app/(dashboard)/analytics/trend-momentum-movement-filters.tsx` | Room/pattern indicator-filter population and timeframe explanations. |
| `app/(dashboard)/analytics/trend-momentum-outcome-table.tsx` | Ten shared outcome columns, including observation/execution and Gross/Net variants. |
| `app/(dashboard)/analytics/trend-momentum-supporting-trades.tsx` | Supporting card, five headings, expanded indicator values and exact execution context. |
| `app/(dashboard)/trade-tracker/[sessionDate]/daily-trade-analyzer-chart.tsx` | Chart legend, timeframe, indicator visibility, units and unavailable series. |
| `app/(dashboard)/trade-tracker/[sessionDate]/day-session-view.tsx` | Individual analysis composition and unavailable-state wording. |
| `app/(dashboard)/trade-tracker/trade-indicator-context.tsx` | Trend & Momentum, EMA9/20, RSI and Session VWAP explanations; selected execution and timeframe. |
| `app/(dashboard)/trade-tracker/written-trade-analysis.tsx` | Written-analysis composition and indicator context placement. |
| `app/pwa/offline-analytics-route-surface.tsx` | Offline composition; retain saved view selections and delegated explanations without live calls. |

## Exact wording locations and dynamic branches

- `trend-momentum-analysis.tsx`: Section `title`/`help` attributes contain the
  seven exact explanations. Heading attributes and inline `[label, help]`
  arrays contain execution/during/closure/occurrence wording. `basisLabel`
  changes Gross/Net labels. Loss and reclaim have different explanatory text.
- `trend-momentum-outcome-table.tsx`: `columns` contains all ten templates.
  `observations` changes the first/third column explanations; `basisLabel`
  changes four P/L labels and the return label plus relevant text.
- `trend-momentum-conditions.tsx`: `fields` contains eight control explanations;
  `columns` contains ten comparison explanations. These groups are exclusive,
  unlike descriptive execution groups where one trade may appear more than once.
- `trend-momentum-supporting-trades.tsx`: `headers` contains five explanations;
  `details` contains the expanded values/explanations. Repeated whole-trade P/L
  must not be summed across execution rows.
- `trade-indicator-context.tsx`: the shared section help and three `title(...)`
  calls contain exact card explanations. Availability text has independent EMA,
  RSI and VWAP branches; a partial card is not a failed whole analysis.
- `trade-analysis-client.tsx`: inspect all `ColumnHeading`, `titleHelp`,
  `AnalyzerHelpTooltip`, mapped heading arrays and `explainColumns` call sites.
  Do not infer coverage merely because this shared helper supports tooltips.

## Verified evidence

- Combined default view: rendered static markup has explanation controls on
  every table heading (more than 50 headings); seven separate section toggles
  have labelled regions and no nested buttons.
- Individual 1m and 5m cards: no nested buttons; partial availability remains.
- Eight reporting/presentation tests, five changed-root TypeScript checks and
  targeted lint passed at the source checkpoint.

## Open acceptance items

- This index is not yet the complete per-card/per-column rendered-copy matrix.
  Resolve dynamic fields, all conditional headings and financial population
  definitions before marking that requirement complete.
- Review short/long, Gross/Net, 1m/5m, loss/reclaim, complete/incomplete history,
  empty/partial/saved contexts, supporting details and offline selections.
- Verify keyboard, persistent tap help, readable desktop/mobile Light/Navy Dark,
  and no unintended sorting, expansion or navigation in an actual browser.
- Preserve existing Help definitions unless a confirmed behavior change requires
  an update. Do not change financial calculations to match explanatory copy.

No provider data, private trade facts or credentials were read for this index.
