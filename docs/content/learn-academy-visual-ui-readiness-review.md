# TradersLink Academy Visual And UI Readiness Review

## Purpose

This document completes the first Academy visual/UI-readiness review for the 217 Academy-ready lessons and path hubs tracked in:

```text
docs/content/traderslink-academy-course-index.md
```

It does not implement production UI. It does not create routes, schemas, React components, CSS, JSX, or website files.

The goal is to decide which lessons need additional realistic visual support before production website implementation, and which courses are ready to move into UI planning with existing markdown metadata and assets.

## Review Result

The Academy is **content-format ready** and **UI-planning ready**.

Current state:

```text
Academy-ready lessons/path hubs: 217
Academy format review needed: 0
Existing manifest-tracked assets: 125
Production website implementation: not started in this workflow
```

The remaining work is not more broad lesson rewriting. The highest-value next work is targeted visual support and UI mapping.

## UI Readiness Decision

All Academy-ready lessons can be represented in a guided course UI using existing markdown metadata:

- `academy_course`
- `academy_module`
- `academy_order`
- `academy_level`
- `recommended_previous`
- `recommended_next`
- `visual_assets` where available
- related lessons
- related glossary terms
- FAQ
- educational disclaimer

The UI should not require every lesson to have a unique SVG. Some lessons are better served by course-level visuals, reusable diagrams, or no visual at all.

Recommended UI behavior:

- Course pages should group lessons by `academy_module`.
- Lesson cards should show completion state, level, estimated depth, and next lesson.
- Lessons without a visual should use a course-level visual, icon, or clean text-first layout.
- Visuals should be rendered only from existing `visual_assets` or manifest-approved assets.
- Do not hardcode missing image paths.
- Do not convert planned assets into production references until the SVG exists and is editor-verified.

## Visual Readiness Criteria

A lesson needs a visual when the concept is hard to understand from text alone.

High-value visual candidates:

- Chart behavior that needs red/green candlesticks, volume, zones, or session context.
- Filing or dilution processes with multiple steps.
- Risk math, sizing, trade management, or decision loops.
- Review workflows where users need to see the order of evidence.
- Psychology loops where repeated behavior matters.
- Indicator concepts where lag, overlap, or volatility context is easier to see.

Low-value visual candidates:

- Simple definitions.
- Lessons that already reuse a relevant course-level visual.
- Lessons where a visual would be decorative.
- Lessons that would require fake platform screenshots or unrealistic account data.

## Course Coverage Summary

| Course | Lessons/Path Hubs | Current Visual Coverage | UI Readiness | Visual Decision |
|---|---:|---|---|---|
| Trading Foundations | 4 | No unique lesson SVGs | Ready for UI planning | Add 2 optional onboarding/course-flow visuals. |
| Chart Reading And Market Structure | 23 | Strong coverage across all core lessons | Ready for UI planning | No required new SVGs. |
| Candlestick Patterns In Context | 14 | Strong coverage across all lessons | Ready for UI planning | No required new SVGs. |
| Chart Patterns In Context | 14 | Strong course coverage | Ready for UI planning | No required new SVGs; VWAP Reclaim can reuse indicator visual later. |
| Volume, Liquidity And Order Flow | 14 | Strong coverage across all lessons | Ready for UI planning | No required new SVGs. |
| Technical Indicators And Tools | 11 | No dedicated indicator SVGs | Ready after visual batch | Add high-priority indicator visuals. |
| Trading Styles And Playbooks | 14 | No dedicated style/playbook SVGs, cross-listed chart lessons help | Ready after visual batch | Add style selector and setup-context visuals. |
| News, Catalysts And SEC Filings | 36 | Strong opener/press/SEC hub visuals, sparse filing-specific coverage | Ready after selective visual batch | Add filing/news process visuals, not one per filing. |
| Small-Cap Stocks, Float And Dilution | 28 | No dedicated share-structure/dilution SVGs | Ready after visual batch | Add high-priority float, dilution, offering, and securities visuals. |
| Risk Management And Trade Planning | 13 | No dedicated risk SVGs | Ready after visual batch | Add risk math and trade-management visuals. |
| Trading Psychology And Discipline | 8 | No dedicated psychology SVGs | Ready after visual batch | Add behavior-loop visuals. |
| Trade Review And Improvement | 8 | No dedicated review SVGs | Ready after visual batch | Add review workflow visuals. |
| Day Trading Workflow | 9 | Strong course visual coverage | Ready for UI planning | Optional watchlist/session-review visuals only. |
| Practice And Improvement | 9 | Strong course visual coverage | Ready for UI planning | Optional grading/forward-test visuals only. |
| Halts And High-Volatility Events | 7 | Strong course visual coverage | Ready for UI planning | No required new SVGs. |
| Swing Trading Workflow | 8 | Strong course visual coverage | Ready for UI planning | No required new SVGs. |
| Academy Navigation Path Hubs | 4 | Strong path-map coverage | Ready for UI planning | No required new SVGs. |

## Required Visual Backlog

These are the visuals that should be created before the Academy UI build if time allows. They should be realistic, educational, and non-signal-oriented.

### Batch 1: Technical Indicators And Tools

Priority: high

Reason: indicator lessons have strong content but no dedicated visual support. These concepts are easier to learn visually.

| Planned Asset | Related Lessons | Visual Type | Purpose |
|---|---|---|---|
| `indicator-lag-price-vs-signal.svg` | `/academy/why-indicators-lag/`, `/academy/trading-indicators/` | realistic_candlestick_chart | Show price turning before a lagging indicator confirms. |
| `indicator-overload-duplicate-inputs.svg` | `/academy/indicator-overload/` | realistic_trading_dashboard | Show several indicators repeating the same input and cluttering review. |
| `moving-average-trend-and-chop.svg` | `/academy/moving-averages/` | realistic_candlestick_chart | Compare smoother trend context with choppy whipsaw context. |
| `vwap-hold-loss-reclaim-review.svg` | `/academy/vwap/`, `/academy/chart-patterns/vwap-reclaim/` | realistic_candlestick_chart | Show VWAP as average-price context with hold, loss, and reclaim review labels. |
| `rsi-macd-momentum-context.svg` | `/academy/rsi/`, `/academy/macd/` | realistic_dashboard_diagram | Show momentum readings as context, not automatic reversal or continuation signals. |
| `bollinger-atr-volatility-context.svg` | `/academy/bollinger-bands/`, `/academy/atr/` | realistic_candlestick_chart | Show volatility expansion, contraction, and range context. |

### Batch 2: Risk Management And Trade Planning

Priority: high

Reason: risk concepts are core to learning and benefit from visual math/workflow support.

| Planned Asset | Related Lessons | Visual Type | Purpose |
|---|---|---|---|
| `risk-plan-before-entry.svg` | `/academy/trading-plan/`, `/academy/trading-rules/` | workflow_diagram | Show setup criteria, invalidation, size, stop, and review before a trade. |
| `position-sizing-risk-box.svg` | `/academy/position-sizing/`, `/academy/risk-management/` | risk_loop_diagram | Show account risk, trade risk, stop distance, and share size relationship. |
| `risk-reward-planned-vs-actual.svg` | `/academy/risk-reward-ratio/`, `/academy/trade-risk-review/` | realistic_candlestick_chart | Show planned risk/reward versus actual trade management. |
| `stop-loss-invalidation-context.svg` | `/academy/stop-loss/`, `/academy/mental-stop-vs-hard-stop/` | realistic_candlestick_chart | Show invalidation zone, stop behavior, gap/slippage caution, and review labels. |
| `daily-max-loss-shutdown-flow.svg` | `/academy/max-loss/`, `/academy/daily-loss-limit/` | workflow_diagram | Show per-trade loss, daily loss limit, stop-trading trigger, and review loop. |
| `trade-management-profit-protection.svg` | `/academy/trade-management/`, `/academy/profit-protection/` | realistic_candlestick_chart | Show planned management decisions, giveback review, and exit-plan context. |

### Batch 3: Small-Cap Stocks, Float And Dilution

Priority: high

Reason: this is a major TradersLink differentiator and many concepts are structural, not obvious from text.

| Planned Asset | Related Lessons | Visual Type | Purpose |
|---|---|---|---|
| `small-cap-context-dashboard.svg` | `/academy/small-cap-stocks/`, `/academy/penny-stocks/` | realistic_trading_dashboard | Show price, volume, spread, float, catalyst, and filing context together. |
| `float-vs-outstanding-share-map.svg` | `/academy/stock-float/`, `/academy/float-vs-shares-outstanding/` | comparison_graphic | Show tradable float versus total shares outstanding. |
| `low-float-volume-rotation.svg` | `/academy/low-float-stocks/`, `/academy/float-rotation/` | realistic_candlestick_chart | Show volume relative to float without implying a guaranteed move. |
| `fully-diluted-share-stack.svg` | `/academy/fully-diluted-shares/`, `/academy/market-cap-vs-fully-diluted-market-cap/` | filing_flow_diagram | Show common securities that can expand the share count. |
| `dilution-risk-filing-chain.svg` | `/academy/dilution/`, `/academy/dilution-risk/`, `/academy/how-to-spot-dilution-risk/` | filing_flow_diagram | Show cash need, shelf, offering, warrants, and future supply context. |
| `offering-types-comparison.svg` | `/academy/stock-offerings/`, `/academy/public-offering/`, `/academy/registered-direct-offering/`, `/academy/private-placement/`, `/academy/at-the-market-offering/` | comparison_graphic | Compare offering structures without labeling any as automatically bullish/bearish. |
| `warrant-convertible-preferred-stack.svg` | `/academy/warrants/`, `/academy/pre-funded-warrants/`, `/academy/convertible-notes/`, `/academy/preferred-stock/` | filing_flow_diagram | Show securities that may become common shares. |
| `split-cash-going-concern-context.svg` | `/academy/reverse-split/`, `/academy/forward-split/`, `/academy/cash-runway/`, `/academy/going-concern/` | workflow_diagram | Show corporate action and cash-risk context for review. |

### Batch 4: Trade Review, Psychology, And Practice Support

Priority: medium-high

Reason: these courses bridge naturally into Trader Intelligence and progress tracking.

| Planned Asset | Related Lessons | Visual Type | Purpose |
|---|---|---|---|
| `trade-review-evidence-stack.svg` | `/academy/trade-review-and-improvement/`, `/academy/planned-vs-actual-trade-review/` | workflow_diagram | Show plan, chart, execution, risk, management, and behavior evidence. |
| `execution-review-fill-quality.svg` | `/academy/execution-review/` | realistic_trading_dashboard | Show entry/exit timing, spread, slippage, order type, and fill review. |
| `mistake-pattern-review-loop.svg` | `/academy/mistake-pattern-review/`, `/academy/trading-mistake-patterns/` | workflow_diagram | Show repeated mistake tags leading to one focused rule change. |
| `trader-intelligence-review-bridge.svg` | `/academy/trader-intelligence-trade-review/` | workflow_diagram | Show Trader Intelligence as completed-trade review support, not prediction. |
| `discipline-behavior-loop.svg` | `/academy/trading-discipline/`, `/academy/fomo-trading/`, `/academy/revenge-trading/`, `/academy/overtrading/` | risk_loop_diagram | Show trigger, impulse, action, outcome, review, and rule adjustment. |
| `holding-cutting-averaging-review.svg` | `/academy/holding-losers-too-long/`, `/academy/cutting-winners-too-early/`, `/academy/averaging-down/` | realistic_candlestick_chart | Show trade-management behavior review without shame or signal labels. |
| `trade-grading-scorecard.svg` | `/academy/trade-grading/`, `/academy/forward-testing-trading/` | checklist_graphic | Show process grading and sample-building review. |

### Batch 5: Trading Foundations And Trading Styles

Priority: medium

Reason: these improve course navigation and beginner comprehension, but the content can ship without every lesson having a unique visual.

| Planned Asset | Related Lessons | Visual Type | Purpose |
|---|---|---|---|
| `academy-start-here-course-map.svg` | `/academy/start-here/`, `/academy/how-to-use-traderslink-academy/` | journey_map | Show courses, lessons, free navigation, progress, and continue-learning behavior. |
| `day-vs-swing-timeframe-map.svg` | `/academy/day-trading-for-beginners/`, `/academy/day-trading-vs-swing-trading/` | comparison_graphic | Compare intraday and multi-session risk/review context. |
| `trading-styles-selector-map.svg` | `/academy/trading-styles/`, `/academy/day-trading/`, `/academy/swing-trading/`, `/academy/scalping-stocks/` | workflow_diagram | Show styles as playbook/review categories, not trader identities. |
| `momentum-vs-chasing-context.svg` | `/academy/momentum-trading/`, `/academy/chasing-stocks/` | realistic_candlestick_chart | Show planned momentum context versus late chase risk. |
| `pullback-news-fade-style-context.svg` | `/academy/pullbacks-and-dip-buy-setups/`, `/academy/news-fade/`, `/academy/sell-the-news/`, `/academy/multi-day-runner/` | realistic_candlestick_chart | Show setup categories as context with failure/review labels. |

### Batch 6: Selective News And Filing Deepening

Priority: medium

Reason: News/filings already has strong opener visuals, but selective deeper visuals would improve filing education without requiring one image per form.

| Planned Asset | Related Lessons | Visual Type | Purpose |
|---|---|---|---|
| `company-report-filing-comparison.svg` | `/academy/sec-filings/form-10-k/`, `/academy/sec-filings/form-10-q/`, `/academy/sec-filings/form-20-f/`, `/academy/sec-filings/form-6-k/` | filing_flow_diagram | Compare annual, quarterly, and foreign issuer report context. |
| `registration-statement-comparison.svg` | `/academy/sec-filings/form-s-1/`, `/academy/sec-filings/form-s-3/`, `/academy/sec-filings/form-f-1/`, `/academy/sec-filings/form-f-3/` | filing_flow_diagram | Compare registration statement types and resale/shelf context. |
| `prospectus-supplement-terms-review.svg` | `/academy/sec-filings/form-424b5/`, `/academy/sec-filings/form-424b3/`, `/academy/sec-filings/form-424b4/` | filing_flow_diagram | Show prospectus supplement terms, registered securities, proceeds, and dilution context. |
| `insider-ownership-filing-map.svg` | `/academy/sec-filings/form-3/`, `/academy/sec-filings/form-4/`, `/academy/sec-filings/form-5/`, `/academy/sec-filings/schedule-13d/`, `/academy/sec-filings/schedule-13g/` | filing_flow_diagram | Show insider and beneficial ownership filing categories. |
| `proxy-late-filing-delisting-map.svg` | `/academy/sec-filings/form-def-14a/`, `/academy/sec-filings/form-pre-14a/`, `/academy/sec-filings/nt-10-k/`, `/academy/sec-filings/nt-10-q/`, `/academy/sec-filings/form-25/` | filing_flow_diagram | Show governance, late filing, and listing-status review context. |
| `news-category-quality-map.svg` | `/academy/earnings-news/`, `/academy/fda-news-stocks/`, `/academy/clinical-trial-news/`, `/academy/contract-news-stocks/`, `/academy/partnership-news-stocks/`, `/academy/merger-news-stocks/` | realistic_trading_dashboard | Compare news category detail checks and reaction review. |

## Visuals Not Required Before UI Build

These courses already have enough realistic visual support for an initial UI build:

- Chart Reading And Market Structure
- Candlestick Patterns In Context
- Chart Patterns In Context
- Volume, Liquidity And Order Flow
- Day Trading Workflow
- Practice And Improvement
- Halts And High-Volatility Events
- Swing Trading Workflow
- Academy Navigation Path Hubs

Additional visuals for these courses should be created only when a specific lesson feels visually under-explained during design QA.

## UI Build Notes For Future Codex Work

When production implementation is explicitly requested:

1. Build course pages from markdown metadata, not hardcoded arrays.
2. Respect `academy_order` inside each `academy_course`.
3. Group lessons by `academy_module`.
4. Use `recommended_previous` and `recommended_next` for lesson navigation.
5. Display progress by course and by path.
6. Let users move freely, even when a recommended order exists.
7. Use completion moments lightly: checkmarks, percent progress, next lesson card, and continue-learning state.
8. Keep glossary support secondary to course lessons.
9. Use existing `visual_assets` only when files exist.
10. Do not present any setup, pattern, filing, indicator, or review concept as a signal or guarantee.

## Final Decision

The Academy visual/UI-readiness review is complete.

The Academy does not need another broad editorial rewrite before UI planning. It needs targeted visual batches, then production implementation when explicitly requested.

Next recommended content-only action:

```text
Create Batch 1 Technical Indicators SVG assets and update the image manifest.
```
