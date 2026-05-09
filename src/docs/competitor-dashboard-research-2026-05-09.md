# Competitor Dashboard Research For Trader Intelligence

**Date:** 2026-05-09  
**Purpose:** Research dashboard/product screenshots from trading journal
competitors and turn the useful ideas into implementation direction for Trader
Intelligence.

## Scope

Reviewed:

- StonkJournal: https://stonkjournal.com/
- TraderSync: https://tradersync.com/trading-journal/
- Tradervue: https://www.tradervue.com/
- Trademetria: https://trademetria.com/
- TradesViz: https://www.tradesviz.com/
- TradeZella: https://www.tradezella.com/trading-journal

The focus was dashboard/product screenshots and visible feature surfaces, not
landing-page style.

Local downloaded screenshots for visual inspection live under:

```text
artifacts/competitor-research/dashboard-screenshots/
```

These are research artifacts only and should not be committed unless explicitly
needed.

## Overall Verdict

Trader Intelligence is still behind visually.

The core problem is not only color. The current app does not yet present data as
a trader story. Competitor screenshots consistently use:

- visible charts above the fold,
- red/green outcome color,
- P/L calendars,
- P/L curves,
- win/loss distribution,
- trade tables with colored results,
- chart replay or execution markers,
- tag/setup performance,
- time/session breakdowns,
- customizable dashboard widgets.

Trader Intelligence currently has some structure and language improvements, but
it still looks too much like an internal dark admin surface. The next work
should make the app visually answer: what happened, what mattered, and what to
fix next.

## Competitor Notes

### StonkJournal

Most useful inspiration:

- Dark dashboard with a clear left nav.
- Top strip shows date filters and a timeline/range selector.
- KPI cards show wins, losses, open, wash, average win, average loss, and P/L.
- Trade table uses green/red win/loss status pills and green/red P/L.
- Stats page uses compact metric cards and grouped tables by tag and symbol.
- Emphasis on fast trade entry, chart with entries/exits, preferences/defaults,
  statistics, notes, tags, confidence meter, PnL calendar, quick filters, and
  privacy toggle.

What to borrow:

- A real dashboard header with date filters.
- A trade table/card list where win/loss status is instantly visible.
- Compact KPI cards with strong green/red outcome language.
- Fast entry/import workflow with defaults.
- Trade notes with tags/confidence.

What not to borrow:

- Some cards still look generic.
- It is useful and clean, but not as polished as the best modern SaaS
  dashboards.

### TraderSync

Most useful inspiration:

- Strong single-trade review feature set:
  - running P&L chart,
  - best exit indicator,
  - interactive price action charts,
  - targets and stop loss tracking,
  - trade journaling,
  - trade tagging.
- Risk management framing:
  - define trading rules,
  - track adherence,
  - keep discipline visible.
- Community/replay ideas:
  - market replay,
  - share trades with mentors,
  - monthly PnL calendar.
- Advanced features:
  - date-based reports,
  - partial gains with LIFO/FIFO/weighted average,
  - option spread detection,
  - custom break-even offsets,
  - R-multiple risk calculation,
  - playlists of existing trades,
  - preset automatic charting.

What to borrow:

- Single-trade running P/L as a core visual.
- Best-exit or “missed opportunity” view, framed carefully as review, not a
  prediction or trade call.
- Entry/exit chart replay.
- Target/stop visualization.
- Rule adherence as part of review.
- Monthly PnL calendar.

What not to borrow yet:

- Market replay and mentor sharing are later-stage features.
- Options spread support is not relevant to the current beta scope.

### Tradervue

Most useful inspiration:

- Clean light dashboard style with lots of whitespace.
- Left navigation is obvious and plain: Dashboard, Calendar, Reports, Trades,
  Journal, Notebook, New trade.
- Dashboard screenshot uses:
  - weekly calendar cards,
  - recent shared trade cards with mini charts,
  - profit factor gauge,
  - winning vs losing trade donut,
  - average winning vs losing trade bar,
  - hourly performance bars.
- Tradervue positions the dashboard as customizable and for quickly viewing past
  performance/progress.

What to borrow:

- Calendar-first dashboard module.
- Recent trades with mini sparklines.
- Semi-circular gauge for profit factor or review health.
- Donut chart for win/loss mix.
- Hourly performance bar list.
- Lighter card spacing and more whitespace.

What not to borrow:

- Do not copy the bright/light brand directly.
- Trader Intelligence can keep a dark style, but it needs Tradervue’s clarity.

### Trademetria

Most useful inspiration:

- Dashboard screenshot is direct and useful:
  - top filter/date area,
  - market ticker strip,
  - KPI cards with mini bar/line charts,
  - large P/L summary bar chart with green/red bars.
- PnL calendar screenshot uses:
  - dark theme,
  - green/red day cells,
  - weekly totals,
  - bottom summary strip for daily win rate, trades, quantity, and total P/L.
- Feature set includes discipline, pattern spotting, cutting emotional
  decisions, risk management, consistency, mistake learning, simulations,
  portfolio tracking, AI assistant, challenges, and automatic buy/sell markers
  on charts.

What to borrow:

- Top date/filter strip.
- KPI cards with mini charts inside them.
- Big red/green P/L bar chart.
- PnL calendar with weekly totals.
- Trade challenges/rules as later progress features.
- Automatic buy/sell markers on charts.

What not to borrow:

- The light dashboard is somewhat generic.
- The market ticker strip is less important for Trader Intelligence than trade
  review and behavior.

### TradesViz

Most useful inspiration:

- Very feature-rich and data-heavy.
- Custom dashboard screenshot includes:
  - left dashboard list,
  - filters/save/add widget controls,
  - trade table with colored P/L chips,
  - treemap for symbol vs P/L,
  - win/loss bar chart by symbol,
  - aggregate trades by symbol,
  - aggregate P/L and volume by sector.
- Site claims extensive analytics:
  - 70+ interactive charts,
  - 600+ widgets,
  - pivot grids,
  - 80+ statistics,
  - AI Q&A,
  - custom dashboards,
  - trading calendar,
  - trade/day planning,
  - trading goals,
  - advanced charting,
  - risk simulator.

What to borrow:

- Widgetized analytics layout, but in a simplified way.
- Treemap or “symbol contribution” chart for P/L.
- Clickable chart-to-trade drilldowns.
- Custom filters.
- Calendar and goals later.

What not to borrow:

- Do not make Trader Intelligence this complex for beginners.
- Pivot grids, 600 widgets, and “plot anything” are advanced-user tools and
  would make the current app more confusing.

### TradeZella

Most useful inspiration:

- Strongest product framing for modern trading journal UI.
- Dashboard concepts:
  - one dashboard with every metric that matters,
  - P/L,
  - win rate,
  - key metrics,
  - daily performance calendar,
  - score/health metric,
  - multiple accounts,
  - customizable widgets.
- Review details:
  - broker auto-sync,
  - TradingView charts,
  - multiple TP/SL and risk-reward tracking,
  - trade notes,
  - strategy tagging,
  - custom tags for setup/emotion/mistake,
  - running P&L,
  - MAE/MFE analysis.
- Analytics:
  - performance by setup and time of day,
  - best/worst performing tags,
  - most-used tags,
  - highest win-rate tags,
  - cross analysis,
  - multiple metrics in one view,
  - flexible bar/line visualization,
  - secondary filters.

What to borrow:

- Daily performance calendar.
- Health/score concept, but rename for Trader Intelligence as “Review Health”
  or “Process Score,” not a gimmick.
- Running P/L on trade detail.
- MAE/MFE-like review, later.
- Setup/mistake tag analytics.
- Best/worst tag reports.
- Time-of-day and setup breakdowns.

What not to borrow:

- Do not promise full broker auto-sync yet.
- Do not build everything at once.
- Do not make “AI insights” vague. Trader Intelligence should stay
  evidence-backed.

## Feature Gap Matrix

| Feature | Seen In Competitors | Trader Intelligence Status | Priority |
| --- | --- | --- | --- |
| P/L curve | TraderSync, Tradervue, TradeZella | Basic/weak visual surface | High |
| Win/loss donut | Tradervue, TradeZella-like dashboards | Missing or too weak | High |
| PnL calendar | StonkJournal, Trademetria, TraderSync, TradeZella | Missing | High |
| Red/green P/L bar chart | Trademetria, TradesViz | Needs stronger implementation | High |
| Trade table with colored result chips | StonkJournal, TradesViz | Present but not polished | High |
| Single-trade execution chart | StonkJournal, TraderSync, TradeZella, Trademetria | Needs real visual timeline/chart | High |
| Running P/L per trade | TraderSync, TradeZella | Missing | High |
| Entry/exit markers | StonkJournal, TraderSync, Trademetria, TradeZella | Not visually strong yet | High |
| Trade notes | StonkJournal, TraderSync, TradeZella | Exists partly; needs better UI | Medium |
| Tags for setup/mistake/emotion | StonkJournal, TraderSync, TradeZella | Needs end-user layer | High |
| Best/worst tag reports | TradeZella | Missing | Medium |
| Time-of-day performance | Tradervue, TradeZella | Exists but needs visual upgrade | High |
| Rule adherence/challenges | TraderSync, Trademetria | Partly exists; not visual enough | Medium |
| AI coach/assistant | TraderSync, Trademetria, TradesViz, TradeZella | Exists conceptually; needs better UI | High |
| Custom dashboards/widgets | TradesViz, TradeZella, Tradervue | Later, not first priority | Low |
| Pivot grids | TradesViz | Not needed for beginner flow | Low |
| Market replay | TraderSync, TradeZella, TradesViz | Later | Low |
| MAE/MFE | TraderSync, TradeZella | Later, useful for exits | Medium |
| Multi-account dashboards | TradeZella, StonkJournal, Trademetria | Later | Low |

## Visual Direction For Trader Intelligence

Trader Intelligence should not copy any one competitor. It should combine:

- StonkJournal’s dark, compact trade log clarity.
- Tradervue’s clean whitespace, calendar, gauges, and mini charts.
- Trademetria’s red/green bar chart and PnL calendar.
- TradeZella’s polished metric widgets, running P/L, tags, and dashboard
  framing.
- TradesViz’s powerful analytics ideas, but heavily simplified for beginners.

## Recommended Dashboard Layout

### Workspace

Purpose: product home and daily starting point.

Above the fold:

- “Review this trade next” primary panel.
- Four compact cards:
  - total P/L,
  - win rate,
  - trades reviewed,
  - biggest repeated behavior.
- Mini PnL calendar for the current month.
- Small P/L curve.

### Analytics

Purpose: performance report.

Above the fold:

- date/filter strip,
- total gross P/L,
- win rate,
- trade count,
- profit factor or expectancy,
- best trade,
- worst trade.

Primary charts:

- P/L curve,
- win/loss donut,
- daily P/L calendar,
- P/L by session bar chart,
- P/L by entry hour heatmap,
- behavior-cost chart.

Secondary:

- best/worst setup tags,
- most frequent mistakes,
- trades behind the selected chart number.

### Trade Detail

Purpose: main review workspace.

Above the fold:

- main issue or strength,
- one fix-first action,
- gross P/L,
- outcome,
- confidence,
- visual execution timeline.

Charts:

- execution timeline with buy/add/reduce/exit markers,
- running P/L line,
- position size bar,
- optional candle/level chart later.

Cards:

- what happened,
- why it mattered,
- what to write down,
- evidence,
- glossary/education,
- advanced details collapsed.

### Coach

Purpose: next-session review plan.

Above the fold:

- “Do this next.”
- “Avoid this next session.”
- “Repeat this.”
- “Review this trade.”

Charts:

- behavior-cost bar chart,
- recent trend of the main behavior,
- win/loss mix for trades tied to that behavior.

### Review Queue

Purpose: work queue.

Above the fold:

- lane counters,
- highest-priority trade,
- plain reason,
- “Open Trade Review.”

Cards:

- one trade per card,
- status,
- P/L,
- main behavior,
- why it is queued.

## Design System Changes Needed

### Add Visual Chart Components

Build:

- `PnlCurveChart`
- `WinLossDonut`
- `DailyPnlCalendar`
- `SessionPnlBars`
- `EntryHourHeatmap`
- `BehaviorCostBars`
- `ExecutionTimeline`
- `RunningTradePnl`
- `MiniSparkline`

Use SVG/CSS first. Avoid adding a heavy chart library unless needed.

### Improve Cards

Metric cards should have:

- concise title,
- large value,
- small explanatory subtext,
- optional mini chart,
- red/green/amber/cyan tone.

Cards should not hold long coaching paragraphs.

### Improve Color Use

Use:

- green: profit, strength, protected profit, completed review,
- red: loss, giveback, costly habit,
- amber: caution, missing context, needs review,
- cyan/blue: next action, selected filter, chart context.

## Data Needed To Make Localhost Look Real

Add richer sample data:

- 30 to 50 trades.
- Multiple weeks.
- Multiple symbols.
- Multiple sessions.
- Mixed wins/losses/flat.
- Repeated behaviors.
- Trades with several executions.
- Enough data for:
  - daily PnL calendar,
  - P/L curve,
  - session bars,
  - entry-hour heatmap,
  - behavior-cost chart,
  - symbol performance chart.

This is important because one or two trades makes the app look emptier than it
will feel with real usage.

## What To Build First

### Run 1: Chart Foundation + Rich Demo Data

Deliver:

- reusable chart components,
- rich sample dataset,
- `/analytics` redesigned above the fold,
- local screenshots before/after.

### Run 2: Trade Detail Visual Review

Deliver:

- real `UserFacingTradeReviewSummary` on `/trades/[tradeId]`,
- visual execution timeline,
- running trade P/L,
- glossary cards,
- advanced collapsed section.

### Run 3: Coach + Review Queue Visual Upgrade

Deliver:

- behavior-cost chart,
- trend chart,
- clearer queue cards,
- stronger next-session plan.

### Run 4: Calendar + Tags

Deliver:

- daily PnL calendar,
- mistake/setup tags,
- best/worst tag reports.

## Non-Negotiables

- No financial advice language.
- No trade-call language.
- No raw pattern IDs in beginner UI.
- No scoring traces in default UI.
- No giant dashboard before the single-trade review is clear.
- Charts must explain what they mean in plain English.
- Mobile must not overflow.

## Bottom Line

The product should move toward a visually rich trading review dashboard:

- red/green P/L,
- calendar heatmap,
- P/L curve,
- win/loss donut,
- behavior cost bars,
- execution timeline,
- clear review summary,
- one fix-first action.

The competitors prove that traders expect visual feedback. Trader Intelligence
can be more useful than a generic journal because it can connect visuals to
behavior coaching, but the UI needs to become much more visual before that value
is obvious.
