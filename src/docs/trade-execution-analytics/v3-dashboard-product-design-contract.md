# Trader Intelligence v3 Dashboard Product Design Contract

## Status

Approved by the owner on 2026-07-28 for Trade Execution Analytics Dashboard
Operationalization Milestone 4.

This contract controls the information architecture, visual system, page
responsibilities, governed analytics boundary, and legacy-component migration
rules for the v3 dashboard. Read it with
`v3-dashboard-operationalization-plan.md` and `implementation-progress.md`.

## Product direction

Trader Intelligence v3 is a professional execution journal and analytics
workspace. It is not a Coach-led review queue, and it does not require a trader
to review trades before their history is useful.

The primary product areas are:

- `/workspace`: a useful daily starting point;
- `/trades`: discovery and inspection of actual trading activity;
- `/analytics`: governed aggregate analysis and drill-down;
- Reflection Loop: retained as a navigation destination for later evaluation;
- Import Trades and Manual Entry: durable data-entry destinations.

Coach, Progress, behavioural coaching claims, chart findings,
support/resistance claims, market/candle evidence, forced review workflows, and
random trade recommendations are outside this milestone.

## Visual and interaction baseline

The dashboard uses a clean, light, Google Material-style design. The current
light Material experience is the visual baseline, but existing v1/v2
components are not entitled to retain their layout or styling.

The migration rule is:

1. reuse trustworthy data logic and governed contracts;
2. reuse a visual component only when it already matches the v3 system;
3. otherwise redesign the component before it appears in v3;
4. never preserve a weak visual treatment merely because it already exists.

The shared application frame must provide:

- the existing TradersLink website logo;
- a sidebar flush with the far-left desktop edge;
- an expanded logo/navigation state and a compact icon-rail state;
- a temporary mobile navigation drawer;
- full-width, fluid desktop content without centered dashboard margins;
- a compact app bar for breadcrumb/title, context controls, and page actions;
- no menu-item descriptions;
- no oversized card whose main purpose is to repeat the current page name;
- consistent Material typography, spacing, colors, borders, tables, charts,
  forms, drawers, menus, empty states, and focus states.

Light mode is the default. Dashboard pages begin with useful content instead of
introductory hero cards.

## Locked navigation

- Workspace
- Trades
  - Round Trips
  - Day Sessions
  - Trades by Ticker
  - Open Positions
- Analytics
  - Overview
  - Performance
  - Results
  - Timing
  - Execution
  - Analytics Lab
- Reflection Loop
- Data
  - Import Trades
  - Manual Entry

Routes remain familiar and product-facing: `/workspace`, `/trades`, and
`/analytics`. The new product must not introduce an `/intelligence/...` prefix
into visible v3 navigation. Temporary legacy routes may redirect to a new owner
route during migration.

## Workspace contract

`/workspace` is a compact daily trading hub, not a directory that merely splits
Trades from Analytics.

Its first useful layout contains:

- compact account/date context controls;
- compact performance statistics;
- realized and unrealized P/L separated when each has authority;
- a governed performance chart;
- a quick Manual Entry launcher that opens the complete required form;
- a trading calendar/day-session surface below the performance area;
- direct navigation to Import Trades.

The workspace does not feature import verification as a primary card. An
incomplete imported statement may leave a position open or unresolved, but
that state belongs on the affected position/import detail. It is never a
required review task and automatically clears when later authoritative
executions resolve the position.

The first release supplies a strong default layout. A later Milestone 4 pass
may add show/hide/reorder customization and allow a saved Analytics Lab view to
be pinned to the workspace.

## Trades contract

### Round Trips

`/trades/roundtrips` is the professional trade ledger and the default Trades
destination. It owns advanced filters, sorting, customizable columns, grouping,
pagination, saved filter views, and links to individual trades.

### Day Sessions

`/trades/day-sessions` owns both calendar and list views. They are two views of
one feature, not separate repeated destinations. The existing calendar route
may redirect to Day Sessions with the calendar view selected.

The landing page supports date, daily P/L, ticker, session, and trade-count
filters plus winning/losing/flat-day selection and saved views.

A day-session detail owns:

- daily execution and P/L facts;
- premarket, regular-session, and after-hours breakdowns;
- one optional note describing the day;
- one card for every ticker traded that day;
- links to all related round trips.

### Trades by Ticker

`/trades/ticker` is the only cross-date product destination organized primarily
by ticker. It replaces the visible "Ticker Stories" language.

It supports ticker, date, profitability, side, session, holding duration,
position size, execution-count, and open/completed filters when those facts
have authority.

`/trades/ticker/[symbol]` is reused rather than duplicated:

- without a date filter, it shows that ticker's authorized trading history;
- with a date filter, it shows all activity for that ticker on that day.

A day-session ticker card routes into this same page with its day filter
applied. The ticker-day presentation includes every execution, all round trips,
position progression, session facts, P/L and fees, a ticker-day note, replay,
and links to the parent day session and individual trades.

### Individual trade

Every round trip links to a redesigned individual-trade page with factual trade
summary, execution timeline, scale/partial-exit progression, governed P/L and
fees, duration, session, replay, notes, user-defined tags, and links back to its
ticker-day and day-session contexts.

There is no mandatory write-review flow and no repeated ticker-story or
chart-evidence card.

### Open Positions

`/trades/open` shows all unclosed positions. A position held overnight is not
automatically classified as a swing trade. Import uncertainty is a compact
detail on the affected position and clears when later authority resolves it.

## Analytics contract

Analytics pages aggregate governed execution facts. They do not reproduce the
round-trip ledger.

- `/analytics`: curated overview;
- `/analytics/performance`: cumulative and period P/L, daily/weekly/monthly
  performance, realized drawdown and period comparison;
- `/analytics/results`: outcome distribution, winners/losers, expectancy,
  profit factor, streaks, concentration, and holding outcomes;
- `/analytics/timing`: entry/exit time, weekday, market-session, and
  session-transition analysis;
- `/analytics/execution`: fills, execution counts, fees, size/notional,
  duration, sequence, and repeat-attempt facts supported by current authority;
- `/analytics/lab`: configurable governed analysis builder.

Ticker is a filter/grouping in Analytics, not a second ticker product page.
Clicking a ticker result opens `/trades/ticker` with the same scope. Clicking
any other aggregate opens the existing Round Trips ledger with the exact
supporting filters.

## Analytics Lab contract

Analytics Lab is a primary product differentiator. It is a guided query
builder, not an unrestricted expression editor and not another raw-trade table.

### Screen structure

1. Saved-view toolbar with New, Save, Save As, Duplicate, Reset, date scope,
   conditional account scope, and Run Analysis.
2. Builder for template, metric, primary breakdown, optional secondary
   breakdown, comparison, filters, and visualization.
3. Results canvas with chart/table views, sample size, applied scope,
   availability, and limitations.
4. Exact drill-down into Round Trips or Trades by Ticker while preserving the
   Lab state.

### Guided templates

- performance over time;
- market-session performance;
- long versus short;
- time-of-day and weekday performance;
- ticker performance and ticker by month;
- holding time versus results;
- position size versus results;
- fee impact;
- repeat attempts;
- performance after wins or losses;
- custom analysis.

### Builder policy

User-facing metrics are grouped into Profitability, Outcomes, Activity,
Consistency, Timing, Position Sizing, and Costs. Internal metric keys and
limitation codes are translated into plain trader language.

The first release exposes at most two grouping dimensions even though the
engine can govern three. Controls are derived from the engine metric registry:
invalid metric/filter/grouping combinations are disabled with a short
explanation instead of being submitted.

Every analysis has a table. Visualizations are restricted to compatible shapes:
ordered time series may use line charts, categories may use bars, two
dimensions may use heatmaps, governed continuous measures may use
distributions, and aggregate queries may use KPI summaries.

### Comparisons

Supported comparison choices include previous equal period, previous month,
previous year, a custom date range, or compatible saved filter sets.

The deterministic "What Changed" surface may show frequency, mix, and
average-result effects from the v3 period-attribution packet. It describes a
mathematical reconciliation, never a causal reason for changed performance.

### Saved views

A saved view stores its versioned query definition: metrics, groupings, filters,
comparison, visualization, sorting, and whether its dates are fixed or rolling.
It reruns against current authorized data when opened. Later, a saved view may
be pinned to Workspace.

### Lab guardrails

- browser code configures queries and formats packets; it never calculates
  financial analytics;
- open positions and unrealized P/L are excluded without mark-to-market
  authority;
- optional fee, quantity, notional, broker, source, or ticker controls become
  available only with required authority;
- currencies are never silently combined or converted;
- bounded results are visibly bounded rather than presented as complete;
- sample size accompanies every result;
- small samples remain factual but do not generate confident conclusions;
- tags, strategies, emotions, mistakes, chart context, MAE/MFE, slippage,
  optimal exits, and market conditions remain unavailable until governed
  authorities exist.

## Professional dashboard requirements

All v3 dashboard surfaces must provide:

- persistent URL-based filters where safe and practical;
- versioned saved views;
- exact click-through from aggregates to supporting trades;
- fast calendar/list switching;
- table column selection, sorting, grouping, and pagination;
- responsive full-width layouts;
- accessible keyboard navigation, labels, focus states, contrast, and chart
  alternatives;
- meaningful loading skeletons;
- distinct empty, unavailable, limited, incomplete, and zero-result states;
- no invented financial values, hidden limitations, mandatory reviews, or
  user-facing engine/debug language.

## Implementation sequence

1. Install the shared Material design foundation and build the new full-width
   application shell, logo placement, compact app bar, and collapsible
   navigation.
2. Build the first packet-only Workspace overview/performance/calendar layout
   with an honest unavailable state.
3. Establish the locked root routes and redirects without duplicating legacy
   page concepts.
4. Rebuild Round Trips, Day Sessions, ticker views, open positions, and
   individual-trade pages against their governed data owners.
5. Build the curated Analytics pages.
6. Build Analytics Lab with registry-derived compatibility, saved views,
   comparisons, and exact drill-down.
7. Add workspace customization only after the default layout and packet
   integration have passed owner visual acceptance.

## Acceptance boundary

Milestone 4 is not complete because static cards render. Completion requires:

- every financial display to trace to a v3 dashboard packet;
- no legacy SQLite or synthetic-fixture fallback in runtime pages;
- owner/account/currency/date authority to remain server derived;
- unavailable and limitation states to remain honest;
- route and visual duplication to be removed;
- desktop and mobile accessibility checks;
- owner acceptance of the rendered light Material design.
