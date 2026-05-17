# TradersLink Academy Quality Audit Workplan

Date created: 2026-05-17

## Purpose

This file manages the next Academy review runs so the work stays organized across sessions. The Academy has already had a master-instructor course audit and a first bridge-lesson batch. The next work should be more focused: one audit type at a time, course by course, with clear outputs.

This is a content, planning, tracker, manifest, and SVG workflow only. Do not edit production website files, routes, schemas, React components, JSX, CSS, or Next.js pages unless the user explicitly asks.

## What The User Means By App Tie-Ins

The user wants lessons to identify natural moments where the TradersLink app can help after the user learns a concept.

This means:

- Trade review tie-ins.
- Journal/review-note tie-ins.
- Coaching tie-ins.
- Analytics tie-ins.
- Risk behavior review tie-ins.
- Execution review tie-ins.
- Mistake-pattern review tie-ins.
- Playbook-building tie-ins.
- Progress/continue-learning tie-ins.

This does not mean:

- Turning lessons into product ads.
- Claiming the app predicts trades.
- Claiming the app guarantees improvement.
- Adding buy/sell signals.
- Forcing a Trader Intelligence mention into every paragraph.

Best framing:

```text
Learn the concept in the Academy.
Then use Trader Intelligence / the journal and review tools to check how that concept appeared in completed trades.
```

## App Surface Vocabulary

Use these app surfaces when identifying lesson tie-ins:

| App Surface | Use When The Lesson Teaches |
|---|---|
| Trade Review | Plan vs actual, setup quality, decision review, completed-trade notes. |
| Risk Review | Position size, stops, loss limits, risk expansion, risk/reward, expectancy. |
| Execution Review | Entry timing, fills, spread, slippage, market/limit orders, liquidity. |
| Coaching | Behavior patterns, emotional triggers, rule breaks, discipline, repeated mistakes. |
| Analytics | Win rate, expectancy, average winner/loss, setup samples, course progress trends. |
| Journal Notes | User-entered context, thesis, catalyst notes, screenshots, session notes. |
| Playbook Builder | Repeated setup evidence, disqualifiers, criteria, forward-tested rules. |
| News/Filing Review | Press releases, SEC filings, EDGAR checks, catalyst quality, dilution context. |
| Session Review | Premarket, market open, midday, power hour, after-hours, daily recap. |
| Progress/Academy | Completion, resume learning, related lessons, recommended next course. |

## Bridge Strength Levels

Use a bridge strength so lessons do not all sound the same.

| Level | Meaning | Example |
|---|---|---|
| Core Bridge | The lesson directly maps to an app workflow. | Trade Review, Execution Review, Risk Review, Mistake Pattern Review. |
| Supporting Bridge | The lesson supports later review but is not an app feature by itself. | Support levels, volume, chart patterns, SEC filings. |
| Light Bridge | Mention only briefly in the Trader Intelligence Bridge section. | Basic definitions, glossary-like lessons, broad introductions. |
| No Bridge Needed | Rare. Use only when the tie-in would feel forced. | Pure navigation notes or administrative planning. |

## Audit Passes

Do these one at a time. Do not blend all of them into a vague rewrite pass.

| Pass | Name | Purpose | Output |
|---:|---|---|---|
| 1 | Lesson-Level Quality Audit | Check depth, clarity, examples, mistakes, checklist, Apply This In Review, FAQ, disclaimer, and app bridge quality. | Course-by-course audit notes and targeted lesson edits. |
| 2 | Course Sequence Audit | Check module order, previous/next links, cross-listing, course progression, and path-hub placement. | Index updates and metadata corrections. |
| 3 | Accuracy/Source Audit | Verify factual/rule-sensitive lessons, especially SEC, halts, margin, short selling, settlement, order mechanics, and market sessions. | Source notes, corrections, and citations where appropriate. |
| 4 | Visual Gap Audit | Decide what realistic SVGs or diagrams each course needs. | Updated visual plan and image manifest tasks. |
| 5 | UI/Progress Experience Audit | Review how the Academy should feel in the product: course cards, progress, completion, resume learning, path hubs, and motivation. | UI-ready planning notes only, no production implementation. |
| 6 | App Bridge Audit | Identify app tie-ins for lessons and courses: journal, coaching, analytics, trade review, risk review, execution review, playbooks. | A lesson-to-app bridge map and targeted content edits. |

## Course Audit Queue

Recommended order for future runs:

| Order | Course / Group | Pass 1 Quality | Pass 2 Sequence | Pass 3 Accuracy | Pass 4 Visual | Pass 5 UI | Pass 6 App Bridge | Notes |
|---:|---|---|---|---|---|---|---|---|
| 1 | Trading Foundations | complete | not_started | not_started | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-trading-foundations.md`; start here because beginner clarity affects the whole Academy. |
| 2 | Chart Reading And Market Structure | complete | not_started | not_started | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-chart-reading.md`; included candlestick and chart-pattern submodules with a restrained app bridge map. |
| 3 | Volume, Liquidity And Order Flow | complete | not_started | not_started | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-volume-liquidity.md`; strong restrained bridge map to execution review, trade review, risk review, and analytics. |
| 4 | Risk Management And Trade Planning | complete | not_started | not_started | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-risk-management.md`; corrected Academy course transitions, removed premature feature links, and documented a restrained bridge map to Risk Review, Trade Review, Analytics, Coaching, and Execution Review. |
| 5 | Technical Indicators And Tools | complete | not_started | not_started | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-technical-indicators.md`; confirmed strong anti-signal language, fixed one invalid ATR related link, removed one premature app route link, and documented realistic indicator-overlay visual needs. |
| 6 | Trading Styles And Playbooks | complete | not_started | not_started | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-trading-styles.md`; confirmed strong style/playbook flow, removed stale app route links from cross-listed setup lessons, and documented restrained bridges to Playbook Builder, Trade Review, Analytics, Session Review, Coaching, Risk Review, and Execution Review. |
| 7 | Day Trading Workflow | complete | not_started | not_started | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-day-trading-workflow.md`; confirmed strong session-flow structure, fixed one invalid after-hours earnings link, and documented restrained bridges to Session Review, Trade Review, Execution Review, Risk Review, Analytics, Coaching, and News/Filing Review. |
| 8 | Swing Trading Workflow | not_started | not_started | not_started | not_started | not_started | not_started | Strong app tie-ins to journal notes and multi-session review. |
| 9 | News, Catalysts And SEC Filings | not_started | not_started | not_started | not_started | not_started | not_started | Requires official source checks for EDGAR/SEC details. |
| 10 | Small-Cap Stocks, Float And Dilution | not_started | not_started | not_started | not_started | not_started | not_started | Strong app tie-ins to news/filing review and risk context. |
| 11 | Halts And High-Volatility Events | not_started | not_started | not_started | not_started | not_started | not_started | Requires official source checks for halt/circuit-breaker rules. |
| 12 | Trading Psychology And Discipline | not_started | not_started | not_started | not_started | not_started | not_started | Strong app tie-ins to coaching and mistake-pattern review. |
| 13 | Trade Review And Improvement | not_started | not_started | not_started | not_started | not_started | not_started | Core app bridge course. |
| 14 | Practice And Improvement | not_started | not_started | not_started | not_started | not_started | not_started | Strong app tie-ins to progress, playbooks, and forward testing. |
| 15 | Academy Navigation Path Hubs | not_started | not_started | not_started | not_started | not_started | not_started | Treat as navigation support, not a numbered course. |

## Lesson-Level Quality Audit Checklist

For each lesson, check:

- Does the lesson teach enough for a real learner, not just SEO?
- Does it avoid being too short or shallow?
- Does it avoid being long for no reason?
- Is the lesson objective clear?
- Is the opening practical and not generic?
- Is there at least one realistic example?
- Are common mistakes specific and useful?
- Is the practical checklist actually usable?
- Does `Apply This In Review` connect the concept to completed-trade review?
- Is the Trader Intelligence bridge natural and review-focused?
- Are related lessons useful and not random?
- Are related glossary terms useful?
- Is the FAQ helpful?
- Is the disclaimer present?
- Does the lesson avoid buy/sell language, guaranteed outcomes, and prediction claims?
- Does the lesson need a realistic SVG or app/workflow visual?

## App Bridge Audit Checklist

For each lesson, identify:

- Primary app surface.
- Secondary app surface if useful.
- Bridge strength.
- Where the bridge belongs:
  - `Trader Intelligence Bridge`
  - `Apply This In Review`
  - `Practical Checklist`
  - related lesson link
  - future UI card
- Whether the bridge should mention:
  - completed trades
  - imported trades
  - journal/review notes
  - coaching
  - analytics
  - trade review
  - risk review
  - execution review
  - mistake patterns
  - playbooks
  - session review
- Exact wording risk:
  - Avoid prediction.
  - Avoid performance promises.
  - Avoid "the app will fix this."
  - Avoid making the education feel like an advertisement.

## App Bridge Map Template

Use this table inside each course audit output:

| Lesson | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Needed Edit |
|---|---|---|---|---|---|
| `/learn/example/` | Trade Review | Coaching | Core Bridge | Review completed trades for this behavior pattern. | Tighten Trader Intelligence Bridge wording. |

## Course Audit Output Template

Each course audit should produce:

```text
Course:
Audit pass:
Status:
Files reviewed:
Major findings:
Lesson edits needed:
New lessons needed:
Visuals needed:
App bridge opportunities:
Accuracy/source checks needed:
Index/tracker updates needed:
Recommended next action:
```

## Current Starting Point

Completed before this workplan:

- Master instructor course audit: `docs/content/traderslink-academy-master-instructor-audit.md`
- First bridge lesson batch:
  - `/learn/what-is-a-stock-and-how-does-a-trade-work/`
  - `/learn/stock-market-sessions-and-order-flow-basics/`
  - `/learn/win-rate-reward-risk-and-expectancy/`
  - `/learn/short-selling-basics/`
  - `/learn/how-to-use-edgar-source-documents/`
  - `/learn/building-a-playbook-from-reviewed-trades/`
- Academy index now represents 223 Academy-ready lessons/path hubs.

## Recommended Next Run

Continue with **Pass 1: Lesson-Level Quality Audit** for **Swing Trading Workflow**.

Reason:

- Trading Foundations Pass 1 is complete.
- Chart Reading And Market Structure Pass 1 is complete.
- Volume, Liquidity And Order Flow Pass 1 is complete.
- Risk Management And Trade Planning Pass 1 is complete.
- Technical Indicators And Tools Pass 1 is complete.
- Trading Styles And Playbooks Pass 1 is complete.
- Day Trading Workflow Pass 1 is complete.
- Swing Trading Workflow is the next course because learners should now move from same-session workflow into multi-session planning, overnight risk, catalysts, earnings, and small-cap swing context.
- This course needs careful language around multi-session holds, overnight gaps, catalyst changes, earnings/news risk, and small-cap volatility so swing lessons do not become hold recommendations.

Output should include:

- A Swing Trading Workflow lesson-level quality audit.
- Any small markdown edits needed.
- App bridge map for swing trading for beginners, swing trading risk management, swing trading support and resistance, swing trading volume, swing trading catalysts, swing trading earnings, swing trading news risk, and small-cap swing trading.
- Visual-readiness notes for multi-session examples that may need daily candles, gap markers, catalyst panels, support/resistance zones, and review cards.
- Tracker and handoff update.
- Commit.
