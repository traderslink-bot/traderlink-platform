# TradersLink Academy Content Registry Draft

Date: 2026-05-18

Status: draft planning artifact

Scope: Academy course registry, module registry, lesson membership rules, cross-listed navigation, progress behavior, path hubs, visual readiness flags, and route-safe app bridge candidates.

This is not a production implementation file.

Do not import this document into the website, generate routes from it, treat it as a schema, or create React/Next.js implementation from it unless the user explicitly asks for production website work.

## Purpose

The existing Academy course index now represents 223 Academy-ready lessons and path hubs. The next planning need is a registry-style view that shows how those lessons should behave inside the future `/academy` product experience.

This draft converts the course index into a content planning registry. It should help future implementation answer:

- Which courses exist.
- Which modules belong to each course.
- Which lessons display inside each course.
- Which lessons are canonical versus cross-listed.
- How completion should be counted.
- How previous/next navigation should work when a lesson appears in more than one course.
- Which path hubs are navigation support rather than numbered courses.
- Where app bridge metadata can exist later without hardcoding unstable app routes.

## Registry Boundary

This registry draft may be used to plan a future machine-readable registry.

It should not create or edit:

- JSX.
- HTML.
- CSS.
- React components.
- Next.js pages.
- Production routes.
- Production schemas.
- Production website files.
- Database tables.

Canonical educational lesson markdown stays in:

```text
academy/
academy/candlestick-patterns/
academy/chart-patterns/
academy/sec-filings/
```

Public Academy URLs should remain:

```text
/academy/...
```

Public Academy images should remain:

```text
public/academy/images/...
```

## Registry Source Rules

| Rule | Registry Decision |
|---|---|
| Canonical lesson identity | Use the public lesson slug, such as `/academy/support-and-resistance/`. |
| Canonical lesson body | Markdown file under `academy/`. |
| Canonical course ownership | One primary course or submodule owns each lesson. |
| Cross-listed display | A lesson may appear in another course through membership rows, without duplicating markdown. |
| Completion key | Store completion by lesson slug, not by course placement. |
| Course progress | Derived from required membership rows for that course. |
| Path hub progress | Derived from the underlying lesson/course steps. |
| Previous/next navigation | Use course/path context when a learner enters through a cross-listed placement. |
| App bridge data | Route-safe metadata only, with hard links disabled until app routes and claims are stable. |

## Course Registry Draft

Use this as the first registry-level list of Academy courses and path hubs. Course order should follow the homepage learning flow, not the older creation order in the historical index.

| course_id | course_title | type | order | displayed_count | progress_model | display_model | visual_status | app_bridge_strength | recommended_next |
|---|---|---:|---:|---:|---|---|---|---|---|
| `trading-foundations` | Trading Foundations | course | 1 | 12 | completed required lessons / 12 | beginner course with cross-listed risk/review lessons | launch-polish visuals recommended | light | `chart-reading-market-structure` |
| `chart-reading-market-structure` | Chart Reading And Market Structure | course | 2 | 23 core + 28 library | core progress plus separate library progress | parent course with candlestick and chart-pattern submodules | ready | supporting | `volume-liquidity-order-flow` |
| `volume-liquidity-order-flow` | Volume, Liquidity And Order Flow | course | 3 | 14 | completed required lessons / 14 | compact execution-awareness course | ready | core | `risk-management-trade-planning` |
| `risk-management-trade-planning` | Risk Management And Trade Planning | course | 4 | 14 | completed required lessons / 14 | risk-control course | six-SVG launch-polish batch recommended | core | `technical-indicators-tools` |
| `technical-indicators-tools` | Technical Indicators And Tools | course | 5 | 12 | completed required lessons / 12 | tool-context course | seven-SVG launch-polish batch recommended | supporting | `trading-styles-playbooks` |
| `trading-styles-playbooks` | Trading Styles And Playbooks | course | 6 | 15 | completed required lessons / 15 | style and setup category course with cross-listed chart lessons | eight-SVG launch-polish batch recommended | core | `day-trading-workflow` |
| `day-trading-workflow` | Day Trading Workflow | course | 7 | 9 | completed required lessons / 9 | session timeline | ready | core | `swing-trading-workflow` |
| `swing-trading-workflow` | Swing Trading Workflow | course | 8 | 8 | completed required lessons / 8 | multi-session workflow | ready | supporting | `news-catalysts-sec-filings` |
| `news-catalysts-sec-filings` | News, Catalysts And SEC Filings | course | 9 | 37 | module progress plus overall progress | large hierarchical course | eight-SVG launch-polish batch recommended | core | `small-cap-float-dilution` |
| `small-cap-float-dilution` | Small-Cap Stocks, Float And Dilution | course | 10 | 28 | module progress plus overall progress | supply, dilution, and financing risk course | eight-SVG launch-polish batch recommended | core | `halts-high-volatility` |
| `halts-high-volatility` | Halts And High-Volatility Events | course | 11 | 7 | completed required lessons / 7 | compact event-risk course | ready | core | `trading-psychology-discipline` |
| `trading-psychology-discipline` | Trading Psychology And Discipline | course | 12 | 8 | completed required lessons / 8 | behavior-review course | seven-SVG launch-polish batch recommended | core | `trade-review-improvement` |
| `trade-review-improvement` | Trade Review And Improvement | course | 13 | 9 | completed required lessons / 9 | review hub and product bridge course | seven-SVG launch-polish batch recommended | core | `practice-improvement` |
| `practice-improvement` | Practice And Improvement | course | 14 | 9 | completed required lessons / 9 | practice loop course | ready | core | null |
| `academy-navigation-path-hubs` | Academy Navigation Path Hubs | path_hub_group | unnumbered | 4 | aggregate path step completion | optional guided routes | ready | light | null |

## Module Registry Draft

These module IDs are draft-friendly stable IDs. Future production data may rename display titles, but IDs should remain simple and lowercase.

| course_id | module_id | module_title | module_type | display_behavior | progress_enabled |
|---|---|---|---|---|---|
| `trading-foundations` | `start-here` | Start Here | standard | expanded | true |
| `trading-foundations` | `market-mechanics` | Market Mechanics | standard | expanded | true |
| `trading-foundations` | `market-basics` | Market Basics | standard | expanded | true |
| `trading-foundations` | `process-basics` | Process Basics | standard | expanded | true |
| `trading-foundations` | `risk-basics` | Risk Basics | standard | expanded | true |
| `trading-foundations` | `review-basics` | Review Basics | standard | expanded | true |
| `chart-reading-market-structure` | `core-levels` | Core Levels | standard | expanded | true |
| `chart-reading-market-structure` | `breaks-and-reclaims` | Breaks And Reclaims | standard | expanded | true |
| `chart-reading-market-structure` | `reaction-and-structure` | Reaction And Structure | standard | expanded | true |
| `chart-reading-market-structure` | `swing-structure` | Swing Structure | standard | expanded | true |
| `chart-reading-market-structure` | `intraday-reference-levels` | Intraday Reference Levels | standard | expanded | true |
| `chart-reading-market-structure` | `ranges-and-compression` | Ranges And Compression | standard | expanded | true |
| `chart-reading-market-structure` | `gaps` | Gaps | standard | expanded | true |
| `chart-reading-market-structure` | `candlestick-patterns-context` | Candlestick Patterns In Context | library | collapsed | separate |
| `chart-reading-market-structure` | `chart-patterns-context` | Chart Patterns In Context | library | collapsed | separate |
| `volume-liquidity-order-flow` | `volume-foundation` | Volume Foundation | standard | expanded | true |
| `volume-liquidity-order-flow` | `liquidity-foundation` | Liquidity Foundation | standard | expanded | true |
| `volume-liquidity-order-flow` | `quotes-and-execution` | Quotes And Execution | standard | expanded | true |
| `volume-liquidity-order-flow` | `order-flow-tools` | Order Flow Tools | standard | expanded | true |
| `volume-liquidity-order-flow` | `volume-at-price` | Volume At Price | standard | expanded | true |
| `volume-liquidity-order-flow` | `scanner-context` | Scanner Context | standard | expanded | true |
| `risk-management-trade-planning` | `planning` | Planning | standard | expanded | true |
| `risk-management-trade-planning` | `risk-basics` | Risk Basics | standard | expanded | true |
| `risk-management-trade-planning` | `account-protection` | Account Protection | standard | expanded | true |
| `risk-management-trade-planning` | `trade-management` | Trade Management | standard | expanded | true |
| `risk-management-trade-planning` | `event-risk` | Event Risk | standard | expanded | true |
| `technical-indicators-tools` | `indicator-foundation` | Indicator Foundation | standard | expanded | true |
| `technical-indicators-tools` | `trend-tools` | Trend Tools | standard | expanded | true |
| `technical-indicators-tools` | `momentum-tools` | Momentum Tools | standard | expanded | true |
| `technical-indicators-tools` | `volatility-tools` | Volatility Tools | standard | expanded | true |
| `technical-indicators-tools` | `volume-tools` | Volume Tools | standard | expanded | true |
| `technical-indicators-tools` | `setup-tool-context` | Setup Tool Context | standard | expanded | true |
| `trading-styles-playbooks` | `style-selector` | Style Selector | standard | expanded | true |
| `trading-styles-playbooks` | `setup-types` | Setup Types | standard | expanded | true |
| `trading-styles-playbooks` | `multi-day-context` | Multi-Day Context | standard | expanded | true |
| `trading-styles-playbooks` | `risk-context` | Risk Context | standard | expanded | true |
| `day-trading-workflow` | `session-framework` | Session Framework | standard | timeline | true |
| `day-trading-workflow` | `preparation` | Preparation | standard | timeline | true |
| `day-trading-workflow` | `market-open` | Market Open | standard | timeline | true |
| `day-trading-workflow` | `midday-filtering` | Midday Filtering | standard | timeline | true |
| `day-trading-workflow` | `late-session` | Late Session | standard | timeline | true |
| `day-trading-workflow` | `extended-hours` | Extended Hours | standard | timeline | true |
| `day-trading-workflow` | `review` | Review | capstone | timeline | true |
| `swing-trading-workflow` | `swing-trading-foundation` | Swing Trading Foundation | standard | expanded | true |
| `swing-trading-workflow` | `risk-and-invalidation` | Risk And Invalidation | standard | expanded | true |
| `swing-trading-workflow` | `levels-and-chart-planning` | Levels And Chart Planning | standard | expanded | true |
| `swing-trading-workflow` | `participation-and-follow-through` | Participation And Follow-Through | standard | expanded | true |
| `swing-trading-workflow` | `catalyst-context` | Catalyst Context | standard | expanded | true |
| `swing-trading-workflow` | `event-risk` | Event Risk | standard | expanded | true |
| `swing-trading-workflow` | `small-cap-swing-context` | Small-Cap Swing Context | capstone | expanded | true |
| `news-catalysts-sec-filings` | `catalyst-foundation` | Catalyst Foundation | standard | expanded | true |
| `news-catalysts-sec-filings` | `press-releases` | Press Releases | standard | expanded | true |
| `news-catalysts-sec-filings` | `sec-filing-foundation` | SEC Filing Foundation | standard | expanded | true |
| `news-catalysts-sec-filings` | `company-reports` | Company Reports | library | accordion | true |
| `news-catalysts-sec-filings` | `registration-statements` | Registration Statements | library | accordion | true |
| `news-catalysts-sec-filings` | `transaction-registration` | Transaction Registration | library | accordion | true |
| `news-catalysts-sec-filings` | `prospectus-supplements` | Prospectus Supplements | library | accordion | true |
| `news-catalysts-sec-filings` | `registration-effectiveness` | Registration Effectiveness | library | accordion | true |
| `news-catalysts-sec-filings` | `insider-ownership` | Insider Ownership | library | accordion | true |
| `news-catalysts-sec-filings` | `beneficial-ownership` | Beneficial Ownership | library | accordion | true |
| `news-catalysts-sec-filings` | `proxy-statements` | Proxy Statements | library | accordion | true |
| `news-catalysts-sec-filings` | `late-filing-notices` | Late Filing Notices | library | accordion | true |
| `news-catalysts-sec-filings` | `exchange-and-listing-events` | Exchange And Listing Events | library | accordion | true |
| `news-catalysts-sec-filings` | `news-categories` | News Categories | standard | expanded | true |
| `news-catalysts-sec-filings` | `news-review` | News Review | capstone | expanded | true |
| `small-cap-float-dilution` | `small-cap-foundation` | Small-Cap Foundation | standard | expanded | true |
| `small-cap-float-dilution` | `float-foundation` | Float Foundation | standard | expanded | true |
| `small-cap-float-dilution` | `share-structure` | Share Structure | standard | expanded | true |
| `small-cap-float-dilution` | `valuation-context` | Valuation Context | standard | expanded | true |
| `small-cap-float-dilution` | `dilution-foundation` | Dilution Foundation | standard | expanded | true |
| `small-cap-float-dilution` | `offerings` | Offerings | library | accordion | true |
| `small-cap-float-dilution` | `securities` | Securities | library | accordion | true |
| `small-cap-float-dilution` | `corporate-actions` | Corporate Actions | standard | expanded | true |
| `small-cap-float-dilution` | `risk-context` | Risk Context | capstone | expanded | true |
| `halts-high-volatility` | `halt-foundation` | Halt Foundation | standard | expanded | true |
| `halts-high-volatility` | `single-stock-halts` | Single-Stock Halts | standard | expanded | true |
| `halts-high-volatility` | `market-wide-events` | Market-Wide Events | standard | expanded | true |
| `halts-high-volatility` | `execution-risk` | Execution Risk | standard | expanded | true |
| `halts-high-volatility` | `small-cap-volatility` | Small-Cap Volatility | standard | expanded | true |
| `halts-high-volatility` | `event-review` | Event Review | capstone | expanded | true |
| `trading-psychology-discipline` | `discipline-foundation` | Discipline Foundation | standard | expanded | true |
| `trading-psychology-discipline` | `impulse-patterns` | Impulse Patterns | standard | expanded | true |
| `trading-psychology-discipline` | `trade-management-errors` | Trade Management Errors | standard | expanded | true |
| `trading-psychology-discipline` | `position-behavior` | Position Behavior | standard | expanded | true |
| `trade-review-improvement` | `review-foundation` | Review Foundation | standard | expanded | true |
| `trade-review-improvement` | `review-process` | Review Process | standard | expanded | true |
| `trade-review-improvement` | `specialized-review` | Specialized Review | standard | expanded | true |
| `trade-review-improvement` | `product-bridge` | Product Bridge | capstone | expanded | true |
| `practice-improvement` | `practice-foundation` | Practice Foundation | standard | expanded | true |
| `practice-improvement` | `simulation-basics` | Simulation Basics | standard | expanded | true |
| `practice-improvement` | `replay-practice` | Replay Practice | standard | expanded | true |
| `practice-improvement` | `preparation-review` | Preparation Review | standard | expanded | true |
| `practice-improvement` | `visual-review` | Visual Review | standard | expanded | true |
| `practice-improvement` | `process-scoring` | Process Scoring | standard | expanded | true |
| `practice-improvement` | `focused-drills` | Focused Drills | standard | expanded | true |
| `practice-improvement` | `sample-building` | Sample Building | standard | expanded | true |
| `practice-improvement` | `improvement-planning` | Improvement Planning | capstone | expanded | true |
| `academy-navigation-path-hubs` | `academy-path-hubs` | Academy Path Hubs | path_steps | map | true |

## Lesson Membership Registry Draft

This table lists displayed required lesson membership for the main courses and path hubs. It is intentionally markdown, not machine-readable production data.

Default values unless noted:

- `required_for_core_completion`: true.
- `counts_toward_course_progress`: true.
- `hard_app_links_enabled`: false.
- `completion_key`: lesson slug.

### Trading Foundations

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `start-here` | `/academy/start-here/` | canonical | `trading-foundations` | required |
| 2 | `start-here` | `/academy/how-to-use-traderslink-academy/` | canonical | `trading-foundations` | required |
| 3 | `market-mechanics` | `/academy/what-is-a-stock-and-how-does-a-trade-work/` | canonical | `trading-foundations` | required |
| 4 | `market-mechanics` | `/academy/stock-market-sessions-and-order-flow-basics/` | canonical | `trading-foundations` | required |
| 5 | `market-basics` | `/academy/day-trading-for-beginners/` | canonical | `trading-foundations` | required |
| 6 | `market-basics` | `/academy/day-trading-vs-swing-trading/` | canonical | `trading-foundations` | required |
| 7 | `process-basics` | `/academy/trading-plan/` | cross_listed | `risk-management-trade-planning` | required |
| 8 | `process-basics` | `/academy/trading-rules/` | cross_listed | `risk-management-trade-planning` | required |
| 9 | `risk-basics` | `/academy/risk-management/` | cross_listed | `risk-management-trade-planning` | required |
| 10 | `risk-basics` | `/academy/position-sizing/` | cross_listed | `risk-management-trade-planning` | required |
| 11 | `risk-basics` | `/academy/stop-loss/` | cross_listed | `risk-management-trade-planning` | required |
| 12 | `review-basics` | `/academy/trade-risk-review/` | cross_listed | `trade-review-improvement` | required |

### Chart Reading And Market Structure

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `core-levels` | `/academy/support-and-resistance/` | canonical | `chart-reading-market-structure` | required |
| 2 | `core-levels` | `/academy/how-to-draw-support-and-resistance/` | canonical | `chart-reading-market-structure` | required |
| 3 | `core-levels` | `/academy/support-levels/` | canonical | `chart-reading-market-structure` | required |
| 4 | `core-levels` | `/academy/resistance-levels/` | canonical | `chart-reading-market-structure` | required |
| 5 | `core-levels` | `/academy/key-levels-trading/` | canonical | `chart-reading-market-structure` | required |
| 6 | `breaks-and-reclaims` | `/academy/breakout-trading/` | canonical | `chart-reading-market-structure` | required |
| 7 | `breaks-and-reclaims` | `/academy/breakdown-trading/` | canonical | `chart-reading-market-structure` | required |
| 8 | `breaks-and-reclaims` | `/academy/level-breakout/` | canonical | `chart-reading-market-structure` | required |
| 9 | `breaks-and-reclaims` | `/academy/level-reclaim/` | canonical | `chart-reading-market-structure` | required |
| 10 | `reaction-and-structure` | `/academy/price-rejection/` | canonical | `chart-reading-market-structure` | required |
| 11 | `reaction-and-structure` | `/academy/break-of-structure/` | canonical | `chart-reading-market-structure` | required |
| 12 | `swing-structure` | `/academy/swing-highs-and-swing-lows/` | canonical | `chart-reading-market-structure` | required |
| 13 | `swing-structure` | `/academy/higher-highs-higher-lows/` | canonical | `chart-reading-market-structure` | required |
| 14 | `swing-structure` | `/academy/lower-highs-lower-lows/` | canonical | `chart-reading-market-structure` | required |
| 15 | `intraday-reference-levels` | `/academy/pivot-levels/` | canonical | `chart-reading-market-structure` | required |
| 16 | `intraday-reference-levels` | `/academy/previous-day-high-low/` | canonical | `chart-reading-market-structure` | required |
| 17 | `intraday-reference-levels` | `/academy/premarket-high-low/` | canonical | `chart-reading-market-structure` | required |
| 18 | `intraday-reference-levels` | `/academy/high-of-day/` | canonical | `chart-reading-market-structure` | required |
| 19 | `intraday-reference-levels` | `/academy/low-of-day/` | canonical | `chart-reading-market-structure` | required |
| 20 | `intraday-reference-levels` | `/academy/new-high-of-day/` | canonical | `chart-reading-market-structure` | required |
| 21 | `ranges-and-compression` | `/academy/compression/` | canonical | `chart-reading-market-structure` | required |
| 22 | `ranges-and-compression` | `/academy/consolidation/` | canonical | `chart-reading-market-structure` | required |
| 23 | `gaps` | `/academy/gap-fill-trading/` | canonical | `chart-reading-market-structure` | required |

### Candlestick Patterns In Context

These lessons should appear as a library submodule inside Chart Reading. They should have separate progress from the 23-lesson core Chart Reading course.

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `candlestick-patterns-context` | `/academy/candlestick-patterns/` | submodule | `chart-reading-market-structure` | library |
| 2 | `candlestick-patterns-context` | `/academy/candlestick-patterns/long-wick-candle/` | submodule | `chart-reading-market-structure` | library |
| 3 | `candlestick-patterns-context` | `/academy/candlestick-patterns/doji/` | submodule | `chart-reading-market-structure` | library |
| 4 | `candlestick-patterns-context` | `/academy/candlestick-patterns/engulfing-candle/` | submodule | `chart-reading-market-structure` | library |
| 5 | `candlestick-patterns-context` | `/academy/candlestick-patterns/hammer/` | submodule | `chart-reading-market-structure` | library |
| 6 | `candlestick-patterns-context` | `/academy/candlestick-patterns/inside-bar/` | submodule | `chart-reading-market-structure` | library |
| 7 | `candlestick-patterns-context` | `/academy/candlestick-patterns/outside-bar/` | submodule | `chart-reading-market-structure` | library |
| 8 | `candlestick-patterns-context` | `/academy/candlestick-patterns/pin-bar/` | submodule | `chart-reading-market-structure` | library |
| 9 | `candlestick-patterns-context` | `/academy/candlestick-patterns/bottoming-tail/` | submodule | `chart-reading-market-structure` | library |
| 10 | `candlestick-patterns-context` | `/academy/candlestick-patterns/topping-tail/` | submodule | `chart-reading-market-structure` | library |
| 11 | `candlestick-patterns-context` | `/academy/candlestick-patterns/spinning-top/` | submodule | `chart-reading-market-structure` | library |
| 12 | `candlestick-patterns-context` | `/academy/candlestick-patterns/candle-volume-confirmation/` | submodule | `chart-reading-market-structure` | library |
| 13 | `candlestick-patterns-context` | `/academy/candlestick-patterns/red-to-green-move/` | submodule | `chart-reading-market-structure` | library |
| 14 | `candlestick-patterns-context` | `/academy/candlestick-patterns/green-to-red-move/` | submodule | `chart-reading-market-structure` | library |

### Chart Patterns In Context

These lessons should appear as a library submodule inside Chart Reading. VWAP Reclaim is cross-listed from Technical Indicators And Tools.

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `chart-patterns-context` | `/academy/chart-patterns/` | submodule | `chart-reading-market-structure` | library |
| 2 | `chart-patterns-context` | `/academy/chart-patterns/bull-flag/` | submodule | `chart-reading-market-structure` | library |
| 3 | `chart-patterns-context` | `/academy/chart-patterns/ascending-triangle/` | submodule | `chart-reading-market-structure` | library |
| 4 | `chart-patterns-context` | `/academy/chart-patterns/base-breakout/` | submodule | `chart-reading-market-structure` | library |
| 5 | `chart-patterns-context` | `/academy/chart-patterns/rectangle-pattern/` | submodule | `chart-reading-market-structure` | library |
| 6 | `chart-patterns-context` | `/academy/chart-patterns/channel-pattern/` | submodule | `chart-reading-market-structure` | library |
| 7 | `chart-patterns-context` | `/academy/chart-patterns/wedge-pattern/` | submodule | `chart-reading-market-structure` | library |
| 8 | `chart-patterns-context` | `/academy/chart-patterns/rising-wedge/` | submodule | `chart-reading-market-structure` | library |
| 9 | `chart-patterns-context` | `/academy/chart-patterns/falling-wedge/` | submodule | `chart-reading-market-structure` | library |
| 10 | `chart-patterns-context` | `/academy/chart-patterns/double-top/` | submodule | `chart-reading-market-structure` | library |
| 11 | `chart-patterns-context` | `/academy/chart-patterns/inverse-head-and-shoulders/` | submodule | `chart-reading-market-structure` | library |
| 12 | `chart-patterns-context` | `/academy/chart-patterns/failed-breakout-pattern/` | submodule | `chart-reading-market-structure` | library |
| 13 | `chart-patterns-context` | `/academy/chart-patterns/parabolic-move/` | submodule | `chart-reading-market-structure` | library |
| 14 | `chart-patterns-context` | `/academy/chart-patterns/vwap-reclaim/` | cross_listed | `technical-indicators-tools` | library |

### Volume, Liquidity And Order Flow

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `volume-foundation` | `/academy/volume/` | canonical | `volume-liquidity-order-flow` | required |
| 2 | `volume-foundation` | `/academy/relative-volume/` | canonical | `volume-liquidity-order-flow` | required |
| 3 | `volume-foundation` | `/academy/relative-volume-rvol/` | canonical | `volume-liquidity-order-flow` | required |
| 4 | `volume-foundation` | `/academy/volume-spike/` | canonical | `volume-liquidity-order-flow` | required |
| 5 | `liquidity-foundation` | `/academy/liquidity/` | canonical | `volume-liquidity-order-flow` | required |
| 6 | `liquidity-foundation` | `/academy/dollar-volume/` | canonical | `volume-liquidity-order-flow` | required |
| 7 | `liquidity-foundation` | `/academy/spread/` | canonical | `volume-liquidity-order-flow` | required |
| 8 | `quotes-and-execution` | `/academy/bid-and-ask/` | canonical | `volume-liquidity-order-flow` | required |
| 9 | `quotes-and-execution` | `/academy/slippage/` | canonical | `volume-liquidity-order-flow` | required |
| 10 | `quotes-and-execution` | `/academy/market-orders-vs-limit-orders/` | canonical | `volume-liquidity-order-flow` | required |
| 11 | `order-flow-tools` | `/academy/level-2/` | canonical | `volume-liquidity-order-flow` | required |
| 12 | `order-flow-tools` | `/academy/time-and-sales/` | canonical | `volume-liquidity-order-flow` | required |
| 13 | `volume-at-price` | `/academy/volume-by-price/` | canonical | `volume-liquidity-order-flow` | required |
| 14 | `scanner-context` | `/academy/unusual-volume/` | canonical | `volume-liquidity-order-flow` | required |

### Risk Management And Trade Planning

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `planning` | `/academy/trading-plan/` | canonical | `risk-management-trade-planning` | required |
| 2 | `planning` | `/academy/trading-rules/` | canonical | `risk-management-trade-planning` | required |
| 3 | `risk-basics` | `/academy/risk-management/` | canonical | `risk-management-trade-planning` | required |
| 4 | `risk-basics` | `/academy/position-sizing/` | canonical | `risk-management-trade-planning` | required |
| 5 | `risk-basics` | `/academy/risk-reward-ratio/` | canonical | `risk-management-trade-planning` | required |
| 6 | `risk-basics` | `/academy/win-rate-reward-risk-and-expectancy/` | canonical | `risk-management-trade-planning` | required |
| 7 | `risk-basics` | `/academy/stop-loss/` | canonical | `risk-management-trade-planning` | required |
| 8 | `risk-basics` | `/academy/mental-stop-vs-hard-stop/` | canonical | `risk-management-trade-planning` | required |
| 9 | `account-protection` | `/academy/max-loss/` | canonical | `risk-management-trade-planning` | required |
| 10 | `account-protection` | `/academy/daily-loss-limit/` | canonical | `risk-management-trade-planning` | required |
| 11 | `trade-management` | `/academy/trade-management/` | canonical | `risk-management-trade-planning` | required |
| 12 | `trade-management` | `/academy/profit-protection/` | canonical | `risk-management-trade-planning` | required |
| 13 | `event-risk` | `/academy/overnight-risk/` | canonical | `risk-management-trade-planning` | required |
| 14 | `event-risk` | `/academy/holding-through-news/` | canonical | `risk-management-trade-planning` | required |

### Technical Indicators And Tools

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `indicator-foundation` | `/academy/trading-indicators/` | canonical | `technical-indicators-tools` | required |
| 2 | `indicator-foundation` | `/academy/why-indicators-lag/` | canonical | `technical-indicators-tools` | required |
| 3 | `indicator-foundation` | `/academy/indicator-overload/` | canonical | `technical-indicators-tools` | required |
| 4 | `trend-tools` | `/academy/moving-averages/` | canonical | `technical-indicators-tools` | required |
| 5 | `trend-tools` | `/academy/vwap/` | canonical | `technical-indicators-tools` | required |
| 6 | `trend-tools` | `/academy/anchored-vwap/` | canonical | `technical-indicators-tools` | required |
| 7 | `momentum-tools` | `/academy/rsi/` | canonical | `technical-indicators-tools` | required |
| 8 | `momentum-tools` | `/academy/macd/` | canonical | `technical-indicators-tools` | required |
| 9 | `volatility-tools` | `/academy/bollinger-bands/` | canonical | `technical-indicators-tools` | required |
| 10 | `volatility-tools` | `/academy/atr/` | canonical | `technical-indicators-tools` | required |
| 11 | `volume-tools` | `/academy/volume-by-price/` | cross_listed | `volume-liquidity-order-flow` | required |
| 12 | `setup-tool-context` | `/academy/chart-patterns/vwap-reclaim/` | canonical | `technical-indicators-tools` | required |

### Trading Styles And Playbooks

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `style-selector` | `/academy/trading-styles/` | canonical | `trading-styles-playbooks` | required |
| 2 | `style-selector` | `/academy/day-trading/` | canonical | `trading-styles-playbooks` | required |
| 3 | `style-selector` | `/academy/swing-trading/` | canonical | `trading-styles-playbooks` | required |
| 4 | `style-selector` | `/academy/scalping-stocks/` | canonical | `trading-styles-playbooks` | required |
| 5 | `style-selector` | `/academy/short-selling-basics/` | canonical | `trading-styles-playbooks` | required |
| 6 | `style-selector` | `/academy/momentum-trading/` | canonical | `trading-styles-playbooks` | required |
| 7 | `setup-types` | `/academy/pullbacks-and-dip-buy-setups/` | canonical | `trading-styles-playbooks` | required |
| 8 | `setup-types` | `/academy/breakout-trading/` | cross_listed | `chart-reading-market-structure` | required |
| 9 | `setup-types` | `/academy/breakdown-trading/` | cross_listed | `chart-reading-market-structure` | required |
| 10 | `setup-types` | `/academy/level-reclaim/` | cross_listed | `chart-reading-market-structure` | required |
| 11 | `setup-types` | `/academy/gap-fill-trading/` | cross_listed | `chart-reading-market-structure` | required |
| 12 | `setup-types` | `/academy/news-fade/` | canonical | `trading-styles-playbooks` | required |
| 13 | `setup-types` | `/academy/sell-the-news/` | canonical | `trading-styles-playbooks` | required |
| 14 | `multi-day-context` | `/academy/multi-day-runner/` | canonical | `trading-styles-playbooks` | required |
| 15 | `risk-context` | `/academy/chasing-stocks/` | cross_listed | `trading-psychology-discipline` | required |

### Day Trading Workflow

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `session-framework` | `/academy/day-trading-workflow/` | canonical | `day-trading-workflow` | required |
| 2 | `preparation` | `/academy/premarket-trading/` | canonical | `day-trading-workflow` | required |
| 3 | `preparation` | `/academy/day-trading-watchlist/` | canonical | `day-trading-workflow` | required |
| 4 | `market-open` | `/academy/market-open-trading/` | canonical | `day-trading-workflow` | required |
| 5 | `market-open` | `/academy/opening-range/` | canonical | `day-trading-workflow` | required |
| 6 | `midday-filtering` | `/academy/midday-trading/` | canonical | `day-trading-workflow` | required |
| 7 | `late-session` | `/academy/power-hour-trading/` | canonical | `day-trading-workflow` | required |
| 8 | `extended-hours` | `/academy/after-hours-trading/` | canonical | `day-trading-workflow` | required |
| 9 | `review` | `/academy/day-trading-session-review/` | canonical | `day-trading-workflow` | required |

### Swing Trading Workflow

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `swing-trading-foundation` | `/academy/swing-trading-for-beginners/` | canonical | `swing-trading-workflow` | required |
| 2 | `risk-and-invalidation` | `/academy/swing-trading-risk-management/` | canonical | `swing-trading-workflow` | required |
| 3 | `levels-and-chart-planning` | `/academy/swing-trading-support-resistance/` | canonical | `swing-trading-workflow` | required |
| 4 | `participation-and-follow-through` | `/academy/swing-trading-volume/` | canonical | `swing-trading-workflow` | required |
| 5 | `catalyst-context` | `/academy/swing-trading-catalysts/` | canonical | `swing-trading-workflow` | required |
| 6 | `event-risk` | `/academy/swing-trading-earnings/` | canonical | `swing-trading-workflow` | required |
| 7 | `event-risk` | `/academy/swing-trading-news-risk/` | canonical | `swing-trading-workflow` | required |
| 8 | `small-cap-swing-context` | `/academy/swing-trading-small-caps/` | canonical | `swing-trading-workflow` | required |

### News, Catalysts And SEC Filings

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `catalyst-foundation` | `/academy/stock-catalysts/` | canonical | `news-catalysts-sec-filings` | required |
| 2 | `press-releases` | `/academy/press-releases/` | canonical | `news-catalysts-sec-filings` | required |
| 3 | `press-releases` | `/academy/how-to-read-stock-press-releases/` | canonical | `news-catalysts-sec-filings` | required |
| 4 | `sec-filing-foundation` | `/academy/sec-filings/` | canonical | `news-catalysts-sec-filings` | required |
| 5 | `sec-filing-foundation` | `/academy/how-to-use-edgar-source-documents/` | canonical | `news-catalysts-sec-filings` | required |
| 6 | `sec-filing-foundation` | `/academy/sec-filings/form-8-k/` | canonical | `news-catalysts-sec-filings` | required |
| 7 | `company-reports` | `/academy/sec-filings/form-10-k/` | canonical | `news-catalysts-sec-filings` | required |
| 8 | `company-reports` | `/academy/sec-filings/form-10-q/` | canonical | `news-catalysts-sec-filings` | required |
| 9 | `company-reports` | `/academy/sec-filings/form-20-f/` | canonical | `news-catalysts-sec-filings` | required |
| 10 | `company-reports` | `/academy/sec-filings/form-6-k/` | canonical | `news-catalysts-sec-filings` | required |
| 11 | `registration-statements` | `/academy/sec-filings/form-s-1/` | canonical | `news-catalysts-sec-filings` | required |
| 12 | `registration-statements` | `/academy/sec-filings/form-s-3/` | canonical | `news-catalysts-sec-filings` | required |
| 13 | `registration-statements` | `/academy/sec-filings/form-f-1/` | canonical | `news-catalysts-sec-filings` | required |
| 14 | `registration-statements` | `/academy/sec-filings/form-f-3/` | canonical | `news-catalysts-sec-filings` | required |
| 15 | `transaction-registration` | `/academy/sec-filings/form-s-4/` | canonical | `news-catalysts-sec-filings` | required |
| 16 | `transaction-registration` | `/academy/sec-filings/form-s-8/` | canonical | `news-catalysts-sec-filings` | required |
| 17 | `prospectus-supplements` | `/academy/sec-filings/form-424b5/` | canonical | `news-catalysts-sec-filings` | required |
| 18 | `prospectus-supplements` | `/academy/sec-filings/form-424b3/` | canonical | `news-catalysts-sec-filings` | required |
| 19 | `prospectus-supplements` | `/academy/sec-filings/form-424b4/` | canonical | `news-catalysts-sec-filings` | required |
| 20 | `registration-effectiveness` | `/academy/sec-filings/effect-notice/` | canonical | `news-catalysts-sec-filings` | required |
| 21 | `insider-ownership` | `/academy/sec-filings/form-3/` | canonical | `news-catalysts-sec-filings` | required |
| 22 | `insider-ownership` | `/academy/sec-filings/form-4/` | canonical | `news-catalysts-sec-filings` | required |
| 23 | `insider-ownership` | `/academy/sec-filings/form-5/` | canonical | `news-catalysts-sec-filings` | required |
| 24 | `beneficial-ownership` | `/academy/sec-filings/schedule-13d/` | canonical | `news-catalysts-sec-filings` | required |
| 25 | `beneficial-ownership` | `/academy/sec-filings/schedule-13g/` | canonical | `news-catalysts-sec-filings` | required |
| 26 | `proxy-statements` | `/academy/sec-filings/form-def-14a/` | canonical | `news-catalysts-sec-filings` | required |
| 27 | `proxy-statements` | `/academy/sec-filings/form-pre-14a/` | canonical | `news-catalysts-sec-filings` | required |
| 28 | `late-filing-notices` | `/academy/sec-filings/nt-10-k/` | canonical | `news-catalysts-sec-filings` | required |
| 29 | `late-filing-notices` | `/academy/sec-filings/nt-10-q/` | canonical | `news-catalysts-sec-filings` | required |
| 30 | `exchange-and-listing-events` | `/academy/sec-filings/form-25/` | canonical | `news-catalysts-sec-filings` | required |
| 31 | `news-categories` | `/academy/earnings-news/` | canonical | `news-catalysts-sec-filings` | required |
| 32 | `news-categories` | `/academy/fda-news-stocks/` | canonical | `news-catalysts-sec-filings` | required |
| 33 | `news-categories` | `/academy/clinical-trial-news/` | canonical | `news-catalysts-sec-filings` | required |
| 34 | `news-categories` | `/academy/contract-news-stocks/` | canonical | `news-catalysts-sec-filings` | required |
| 35 | `news-categories` | `/academy/partnership-news-stocks/` | canonical | `news-catalysts-sec-filings` | required |
| 36 | `news-categories` | `/academy/merger-news-stocks/` | canonical | `news-catalysts-sec-filings` | required |
| 37 | `news-review` | `/academy/how-to-review-news-trades/` | cross_listed | `trade-review-improvement` | required |

### Small-Cap Stocks, Float And Dilution

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `small-cap-foundation` | `/academy/small-cap-stocks/` | canonical | `small-cap-float-dilution` | required |
| 2 | `small-cap-foundation` | `/academy/penny-stocks/` | canonical | `small-cap-float-dilution` | required |
| 3 | `float-foundation` | `/academy/stock-float/` | canonical | `small-cap-float-dilution` | required |
| 4 | `float-foundation` | `/academy/low-float-stocks/` | canonical | `small-cap-float-dilution` | required |
| 5 | `float-foundation` | `/academy/float-rotation/` | canonical | `small-cap-float-dilution` | required |
| 6 | `share-structure` | `/academy/float-vs-shares-outstanding/` | canonical | `small-cap-float-dilution` | required |
| 7 | `share-structure` | `/academy/fully-diluted-shares/` | canonical | `small-cap-float-dilution` | required |
| 8 | `valuation-context` | `/academy/market-cap-vs-fully-diluted-market-cap/` | canonical | `small-cap-float-dilution` | required |
| 9 | `dilution-foundation` | `/academy/dilution/` | canonical | `small-cap-float-dilution` | required |
| 10 | `dilution-foundation` | `/academy/dilution-risk/` | canonical | `small-cap-float-dilution` | required |
| 11 | `dilution-foundation` | `/academy/how-to-spot-dilution-risk/` | canonical | `small-cap-float-dilution` | required |
| 12 | `offerings` | `/academy/stock-offerings/` | canonical | `small-cap-float-dilution` | required |
| 13 | `offerings` | `/academy/public-offering/` | canonical | `small-cap-float-dilution` | required |
| 14 | `offerings` | `/academy/registered-direct-offering/` | canonical | `small-cap-float-dilution` | required |
| 15 | `offerings` | `/academy/private-placement/` | canonical | `small-cap-float-dilution` | required |
| 16 | `offerings` | `/academy/at-the-market-offering/` | canonical | `small-cap-float-dilution` | required |
| 17 | `offerings` | `/academy/shelf-registration/` | canonical | `small-cap-float-dilution` | required |
| 18 | `offerings` | `/academy/shelf-registration-vs-offering/` | canonical | `small-cap-float-dilution` | required |
| 19 | `securities` | `/academy/warrants/` | canonical | `small-cap-float-dilution` | required |
| 20 | `securities` | `/academy/warrants-vs-options/` | canonical | `small-cap-float-dilution` | required |
| 21 | `securities` | `/academy/pre-funded-warrants/` | canonical | `small-cap-float-dilution` | required |
| 22 | `securities` | `/academy/convertible-notes/` | canonical | `small-cap-float-dilution` | required |
| 23 | `securities` | `/academy/preferred-stock/` | canonical | `small-cap-float-dilution` | required |
| 24 | `corporate-actions` | `/academy/reverse-split/` | canonical | `small-cap-float-dilution` | required |
| 25 | `corporate-actions` | `/academy/reverse-split-vs-dilution/` | canonical | `small-cap-float-dilution` | required |
| 26 | `corporate-actions` | `/academy/forward-split/` | canonical | `small-cap-float-dilution` | required |
| 27 | `risk-context` | `/academy/cash-runway/` | canonical | `small-cap-float-dilution` | required |
| 28 | `risk-context` | `/academy/going-concern/` | canonical | `small-cap-float-dilution` | required |

### Halts And High-Volatility Events

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `halt-foundation` | `/academy/trading-halts/` | canonical | `halts-high-volatility` | required |
| 2 | `single-stock-halts` | `/academy/volatility-halts/` | canonical | `halts-high-volatility` | required |
| 3 | `single-stock-halts` | `/academy/halt-resume/` | canonical | `halts-high-volatility` | required |
| 4 | `market-wide-events` | `/academy/market-wide-circuit-breakers/` | canonical | `halts-high-volatility` | required |
| 5 | `execution-risk` | `/academy/fast-spread-risk/` | canonical | `halts-high-volatility` | required |
| 6 | `small-cap-volatility` | `/academy/low-float-volatility/` | canonical | `halts-high-volatility` | required |
| 7 | `event-review` | `/academy/high-volatility-trade-review/` | canonical | `halts-high-volatility` | required |

### Trading Psychology And Discipline

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `discipline-foundation` | `/academy/trading-discipline/` | canonical | `trading-psychology-discipline` | required |
| 2 | `impulse-patterns` | `/academy/fomo-trading/` | canonical | `trading-psychology-discipline` | required |
| 3 | `impulse-patterns` | `/academy/chasing-stocks/` | canonical | `trading-psychology-discipline` | required |
| 4 | `impulse-patterns` | `/academy/revenge-trading/` | canonical | `trading-psychology-discipline` | required |
| 5 | `impulse-patterns` | `/academy/overtrading/` | canonical | `trading-psychology-discipline` | required |
| 6 | `trade-management-errors` | `/academy/holding-losers-too-long/` | canonical | `trading-psychology-discipline` | required |
| 7 | `trade-management-errors` | `/academy/cutting-winners-too-early/` | canonical | `trading-psychology-discipline` | required |
| 8 | `position-behavior` | `/academy/averaging-down/` | canonical | `trading-psychology-discipline` | required |

### Trade Review And Improvement

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `review-foundation` | `/academy/trade-review-and-improvement/` | canonical | `trade-review-improvement` | required |
| 2 | `review-foundation` | `/academy/trade-risk-review/` | canonical | `trade-review-improvement` | required |
| 3 | `review-process` | `/academy/planned-vs-actual-trade-review/` | canonical | `trade-review-improvement` | required |
| 4 | `review-process` | `/academy/execution-review/` | canonical | `trade-review-improvement` | required |
| 5 | `review-process` | `/academy/mistake-pattern-review/` | canonical | `trade-review-improvement` | required |
| 6 | `review-process` | `/academy/building-a-playbook-from-reviewed-trades/` | canonical | `trade-review-improvement` | required |
| 7 | `specialized-review` | `/academy/how-to-review-news-trades/` | canonical | `trade-review-improvement` | required |
| 8 | `specialized-review` | `/academy/swing-trade-journal/` | canonical | `trade-review-improvement` | required |
| 9 | `product-bridge` | `/academy/trader-intelligence-trade-review/` | canonical | `trade-review-improvement` | required |

### Practice And Improvement

| order | module_id | lesson_slug | membership_type | canonical_course_id | completion |
|---:|---|---|---|---|---|
| 1 | `practice-foundation` | `/academy/practice-trading/` | canonical | `practice-improvement` | required |
| 2 | `simulation-basics` | `/academy/paper-trading/` | canonical | `practice-improvement` | required |
| 3 | `replay-practice` | `/academy/trade-replay-review/` | canonical | `practice-improvement` | required |
| 4 | `preparation-review` | `/academy/watchlist-review/` | canonical | `practice-improvement` | required |
| 5 | `visual-review` | `/academy/setup-screenshot-review/` | canonical | `practice-improvement` | required |
| 6 | `process-scoring` | `/academy/trade-grading/` | canonical | `practice-improvement` | required |
| 7 | `focused-drills` | `/academy/one-rule-practice-drill/` | canonical | `practice-improvement` | required |
| 8 | `sample-building` | `/academy/forward-testing-trading/` | canonical | `practice-improvement` | required |
| 9 | `improvement-planning` | `/academy/trading-improvement-plan/` | canonical | `practice-improvement` | required |

## Known Cross-Listed Support Registry Draft

Support lessons are useful links or related course rails. They should not automatically count toward the destination course unless the future course membership layer explicitly marks them required.

| display_context | support_lesson_slugs | completion_behavior |
|---|---|---|
| Trading Foundations | `/academy/trading-plan/`, `/academy/trading-rules/`, `/academy/risk-management/`, `/academy/position-sizing/`, `/academy/stop-loss/`, `/academy/trade-risk-review/` | These are required displayed cross-listed lessons in Foundations. Completion counts by slug and also appears in their canonical courses. |
| Day Trading Workflow | `/academy/day-trading/`, `/academy/day-trading-for-beginners/`, `/academy/vwap/`, `/academy/chart-patterns/vwap-reclaim/`, `/academy/premarket-high-low/`, `/academy/high-of-day/`, `/academy/low-of-day/`, `/academy/relative-volume-rvol/`, `/academy/liquidity/`, `/academy/spread/`, `/academy/slippage/`, `/academy/overtrading/`, `/academy/max-loss/` | Supporting rail only unless future UI promotes a lesson into the required sequence. |
| Swing Trading Workflow | `/academy/swing-trading/`, `/academy/day-trading-vs-swing-trading/`, `/academy/support-and-resistance/`, `/academy/overnight-risk/`, `/academy/position-sizing/`, `/academy/stock-catalysts/`, `/academy/sec-filings/`, `/academy/small-cap-stocks/`, `/academy/trading-halts/`, `/academy/swing-trade-journal/` | Supporting rail only unless future UI promotes a lesson into the required sequence. |
| Halts And High-Volatility Events | `/academy/low-float-stocks/`, `/academy/float-rotation/`, `/academy/volume-spike/`, `/academy/spread/`, `/academy/slippage/`, `/academy/liquidity/`, `/academy/level-2/`, `/academy/risk-management/`, `/academy/trade-risk-review/`, `/academy/execution-review/` | Supporting rail only unless future UI promotes a lesson into the required sequence. |
| Practice And Improvement | `/academy/trade-review-and-improvement/`, `/academy/trade-risk-review/`, `/academy/planned-vs-actual-trade-review/`, `/academy/execution-review/`, `/academy/mistake-pattern-review/`, `/academy/trading-rules/`, `/academy/trading-discipline/`, `/academy/overtrading/`, `/academy/trader-intelligence-trade-review/` | Supporting rail only unless future UI promotes a lesson into the required sequence. |
| Academy Navigation Path Hubs | `/academy/how-to-use-traderslink-academy/`, `/academy/support-and-resistance/`, `/academy/stock-catalysts/`, `/academy/sec-filings/`, `/academy/trade-review-and-improvement/`, `/academy/risk-management/`, `/academy/trading-discipline/`, `/academy/practice-trading/` | Used for path discovery and path steps. Do not duplicate completion. |

## Path Hub Registry Draft

Path hubs are optional guided routes. They should not be numbered courses and should not lock learners into a strict order.

| path_id | path_slug | path_title | type | step_count | progress_model | recommended_for |
|---|---|---|---|---:|---|---|
| `chart-reading-path` | `/academy/chart-reading-path/` | Chart Reading Path | path_hub | 1 hub now, future steps from chart/volume/review lessons | aggregate lesson or course completion | Learners who want a focused route through chart reading before workflows. |
| `news-and-filings-path` | `/academy/news-and-filings-path/` | News And Filings Path | path_hub | 1 hub now, future steps from news, filings, dilution, and review lessons | aggregate lesson or course completion | Learners who want to understand event-driven movement and filings. |
| `trade-review-path` | `/academy/trade-review-path/` | Trade Review Path | path_hub | 1 hub now, future steps from review, execution, risk, psychology, and practice lessons | aggregate lesson or course completion | Learners who want to turn completed trades into structured improvement notes. |
| `risk-discipline-path` | `/academy/risk-discipline-path/` | Risk Discipline Path | path_hub | 1 hub now, future steps from risk, psychology, and practice lessons | aggregate lesson or course completion | Learners who need a guided route through risk limits, rules, discipline, and review. |

Future path-step membership can point to:

- A course.
- A module.
- A lesson.
- A submodule/library.
- A review checkpoint.

## Progress Registry Draft

Progress should be derived from lesson slug completion and course membership rows.

Recommended future conceptual records:

```yaml
lesson_completion:
  user_id: string
  lesson_slug: string
  completed_at: datetime
  completed_from_context:
    type: course | path_hub | direct
    id: string | null
```

```yaml
course_progress:
  user_id: string
  course_id: string
  completed_required_lessons: derived
  total_required_lessons: derived
  percent_complete: derived
  next_required_lesson_slug: derived
```

```yaml
path_progress:
  user_id: string
  path_id: string
  completed_steps: derived
  total_steps: derived
  percent_complete: derived
  next_step_id: derived
```

Important progress rules:

- A cross-listed lesson completion counts once by slug.
- Completion can display in every course where that slug appears.
- Optional support rails should not inflate required course completion.
- Candlestick and chart-pattern libraries should not make the core Chart Reading course feel incomplete.
- Large courses should show module progress as well as overall progress.
- Path hubs should aggregate underlying lesson/course progress without creating duplicate completion records.

## Context Navigation Registry Draft

Canonical previous/next can stay in lesson frontmatter for direct lesson browsing.

Future membership rows should provide context navigation:

```yaml
lesson_slug: "/academy/breakout-trading/"
canonical_course_id: "chart-reading-market-structure"
display_course_id: "trading-styles-playbooks"
recommended_previous_in_context: "/academy/pullbacks-and-dip-buy-setups/"
recommended_next_in_context: "/academy/breakdown-trading/"
```

Navigation rules:

- Direct lesson visit: use canonical previous/next.
- Course visit: use course membership previous/next.
- Cross-listed lesson visit: use active course context if present.
- Path hub visit: use path step context.
- Library visit: use library/submodule context.

## Route-Safe App Bridge Registry Draft

Do not add hard app route links yet.

Future bridge metadata should look like this conceptually:

```yaml
app_bridge:
  enabled: true
  bridge_strength: core
  primary_surface: "Trade Review"
  secondary_surfaces:
    - "Risk Review"
  placement: "module_card"
  route_key: null
  hard_link_enabled: false
  copy_variant: "completed_trade_review"
```

Course-level bridge candidates:

| course_id | bridge_strength | primary_surface | secondary_surfaces | recommended_placement | hard_links |
|---|---|---|---|---|---|
| `trading-foundations` | light | Progress/Academy | Journal Notes | course note | disabled |
| `chart-reading-market-structure` | supporting | Trade Review | Journal Notes, Playbook Builder | occasional module card | disabled |
| `volume-liquidity-order-flow` | core | Execution Review | Trade Review, Analytics | module card | disabled |
| `risk-management-trade-planning` | core | Risk Review | Trade Review, Analytics | module card | disabled |
| `technical-indicators-tools` | supporting | Trade Review | Journal Notes | course note | disabled |
| `trading-styles-playbooks` | core | Playbook Builder | Trade Review, Analytics | module card | disabled |
| `day-trading-workflow` | core | Session Review | Execution Review, Risk Review | module card | disabled |
| `swing-trading-workflow` | supporting | Trade Review | Journal Notes, Risk Review | course note | disabled |
| `news-catalysts-sec-filings` | core | News/Filing Review | Trade Review, Journal Notes | module card | disabled |
| `small-cap-float-dilution` | core | News/Filing Review | Risk Review, Trade Review | module card | disabled |
| `halts-high-volatility` | core | Execution Review | Risk Review, Trade Review | module card | disabled |
| `trading-psychology-discipline` | core | Coaching | Trade Review, Journal Notes | module card | disabled |
| `trade-review-improvement` | core | Trade Review | Risk Review, Execution Review, Coaching, Analytics | capstone | disabled |
| `practice-improvement` | core | Progress/Academy | Trade Review, Analytics, Playbook Builder | capstone | disabled |
| `academy-navigation-path-hubs` | light | Progress/Academy | Trade Review | path hub note | disabled |

Bridge copy must avoid:

- Prediction.
- Buy/sell signals.
- Profit claims.
- Loss-prevention promises.
- Claims that Trader Intelligence guarantees improvement.
- Claims that the app diagnoses psychology.
- Turning lessons into product ads.

## Visual Registry Draft

This registry should not reference planned assets as production-ready until files exist.

Visual planning status:

| course_id | current_status | future_visual_need |
|---|---|---|
| `trading-foundations` | under-supported but UI-planning ready | Four beginner SVGs planned as launch polish. |
| `chart-reading-market-structure` | ready | Existing scoped chart/candle/pattern SVGs verified. |
| `volume-liquidity-order-flow` | ready | Existing execution and volume visuals verified. |
| `risk-management-trade-planning` | launch-polish needed | Six-SVG risk visual batch recommended. |
| `technical-indicators-tools` | launch-polish needed | Seven-SVG indicator visual batch recommended. |
| `trading-styles-playbooks` | launch-polish needed | Eight-SVG style/playbook visual batch recommended. |
| `day-trading-workflow` | ready | Optional watchlist/session-review visuals later. |
| `swing-trading-workflow` | ready | Optional hold-decision/thesis-change/small-cap swing dashboard visuals later. |
| `news-catalysts-sec-filings` | launch-polish needed | Eight-SVG filing/news visual batch recommended. |
| `small-cap-float-dilution` | launch-polish needed | Eight-SVG supply/dilution visual batch recommended. |
| `halts-high-volatility` | ready | Existing halt/event-risk visuals verified. |
| `trading-psychology-discipline` | launch-polish needed | Seven-SVG behavior-loop visual batch recommended. |
| `trade-review-improvement` | launch-polish needed | Seven-SVG review-dashboard visual batch recommended. |
| `practice-improvement` | ready | Existing practice-loop visuals verified. |
| `academy-navigation-path-hubs` | ready | Existing path-map SVGs verified. |

## Registry QA Checklist

Before converting this draft into production data, verify:

- Every listed lesson slug resolves to a local markdown file.
- Every course ID is stable.
- Every module ID is unique within its course.
- Every displayed lesson has exactly one canonical owner.
- Cross-listed lessons do not duplicate markdown.
- Completion is stored by lesson slug only.
- Optional support rails do not count toward required course progress unless explicitly promoted.
- Context-specific previous/next can resolve for every required course sequence.
- Path hub steps aggregate underlying progress rather than creating duplicate completion.
- Hard app links remain disabled until routes, feature names, and claims are stable.
- Visuals referenced in production exist, are readable, include title/desc tags, and use educational labels.
- User-facing lessons do not expose source-audit citations by default.
- No course or lesson uses buy/sell, guarantee, prediction, or profit-claim framing.

## Recommended Next Action

Next recommended run:

```text
Create a machine-readable Academy registry planning draft only if requested, still without production website implementation.
```

Recommended decision before implementation:

- Decide whether the production registry should live as author-editable JSON/YAML under `academy/_data/`, TypeScript under `src/content/academy/`, or a CMS model.
- Inspect current Next.js documentation under `node_modules/next/dist/docs/` before production website work, per repo instructions.
- Keep hard app links disabled until product route keys and feature claims are confirmed.
