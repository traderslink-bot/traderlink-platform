# TradersLink Academy Quality Audit Workplan

Date created: 2026-05-17

## Purpose

This file manages the next Academy review runs so the work stays organized across sessions. The Academy has already had a master-instructor course audit and a first bridge-lesson batch. The next work should be more focused: one audit type at a time, course by course, with clear outputs.

This is a content, planning, tracker, manifest, and SVG workflow only. Do not edit production website files, routes, schemas, React components, JSX, CSS, or Next.js pages unless the user explicitly asks.

## Source Location And Public URL

Academy markdown source now lives under the repository root `academy/` folder, not under `docs/content/drafts/learn/`.

Academy public page slugs should use `/academy/...`, so the future website experience and search-engine URLs live under `traderslink.pro/academy/...` instead of `traderslink.pro/learn/...`.

Academy visual assets now live under `/academy/images/...` and `public/academy/images/...`. Those are media asset locations, not Academy page URLs.

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
| 1 | Trading Foundations | complete | complete | complete | complete | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-trading-foundations.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-trading-foundations.md` with official SEC, Investor.gov, FINRA, and Regulation SHO source verification plus targeted plain-language accuracy guardrail edits; Pass 4 completed in `docs/content/traderslink-academy-visual-gap-audit-trading-foundations.md` with 4 priority beginner SVGs planned and risk/review visuals deferred to their dedicated course passes. |
| 2 | Chart Reading And Market Structure | complete | complete | complete | complete | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-chart-reading.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-chart-reading.md` with reputable charting references plus official SEC, NYSE, and Nasdaq source checks for session/extended-hours language; Pass 4 completed in `docs/content/traderslink-academy-visual-gap-audit-chart-reading.md` with 69 scoped SVGs verified and no required new assets. |
| 3 | Volume, Liquidity And Order Flow | complete | complete | complete | complete | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-volume-liquidity.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-volume-liquidity.md` with official SEC, Investor.gov, FINRA, Nasdaq, and NYSE source verification plus targeted plain-language accuracy guardrail edits; Pass 4 completed in `docs/content/traderslink-academy-visual-gap-audit-volume-liquidity.md` with 29 scoped SVGs verified, no required new assets, and one bid/ask label cleanup. |
| 4 | Risk Management And Trade Planning | complete | complete | complete | complete | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-risk-management.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-risk-management.md` with official SEC, Investor.gov, and FINRA source verification plus targeted plain-language accuracy guardrail edits; Pass 4 completed in `docs/content/traderslink-academy-visual-gap-audit-risk-management.md` and identified a six-SVG priority risk visual batch before UI-ready status. |
| 5 | Technical Indicators And Tools | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-technical-indicators.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-technical-indicators.md` with reputable technical-analysis/charting-source verification plus targeted plain-language accuracy guardrail edits. |
| 6 | Trading Styles And Playbooks | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-trading-styles.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-trading-styles.md` with official SEC, Investor.gov, FINRA, and current FINRA 2026 intraday margin-transition source verification plus targeted plain-language accuracy guardrail edits. |
| 7 | Day Trading Workflow | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-day-trading-workflow.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-day-trading-workflow.md` with official SEC, Investor.gov, FINRA, NYSE, and Nasdaq source verification plus targeted plain-language accuracy guardrails for premarket and after-hours broker/venue variability. |
| 8 | Swing Trading Workflow | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-swing-trading-workflow.md`; Pass 2 fixed stale swing workflow related links; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-swing-trading-workflow.md` with official SEC, Investor.gov, and FINRA source verification plus targeted plain-language accuracy guardrails for earnings event timing. |
| 9 | News, Catalysts And SEC Filings | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-news-catalysts-sec-filings.md`; Pass 2 completed; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-news-catalysts-sec-filings.md` with official SEC, Investor.gov, and FDA source verification plus targeted plain-language accuracy guardrail edits. |
| 10 | Small-Cap Stocks, Float And Dilution | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-small-cap-float-dilution.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-small-cap-float-dilution.md` with official SEC, Investor.gov, PCAOB, and FASB source verification plus targeted plain-language accuracy guardrail edits. |
| 11 | Halts And High-Volatility Events | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-halts-high-volatility.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-halts-high-volatility.md` with official SEC, Investor.gov, FINRA, NYSE, Nasdaq, LULD, and Cboe source verification plus targeted plain-language accuracy guardrail edits. |
| 12 | Trading Psychology And Discipline | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-trading-psychology.md`; Pass 2 corrected the Averaging Down transition into the Trade Review course opener; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-trading-psychology.md` with reputable investor-risk, order-type, and behavioral-finance source verification plus targeted plain-language guardrail edits. |
| 13 | Trade Review And Improvement | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-trade-review-improvement.md`; Pass 2 documented the news-review cross-list exception; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-trade-review-improvement.md` with official/reputable order, execution, active-trading-risk, behavioral-finance, and local product-truthfulness source checks plus targeted plain-language guardrail edits. |
| 14 | Practice And Improvement | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-practice-improvement.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-practice-improvement.md` with official/reputable simulated-performance, performance-claim, order/execution, behavioral-finance, and local product-truthfulness source checks plus targeted plain-language guardrail edits. |
| 15 | Academy Navigation Path Hubs | complete | complete | complete | not_started | not_started | not_started | Pass 1 completed in `docs/content/traderslink-academy-quality-audit-navigation-path-hubs.md`; Pass 2 confirmed path hubs are optional navigation support, not a locked course sequence; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-navigation-path-hubs.md` with internal source checks for optional navigation, consistent path framing, risk disclaimers, and product-truthfulness restraint. |

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
| `/academy/example/` | Trade Review | Coaching | Core Bridge | Review completed trades for this behavior pattern. | Tighten Trader Intelligence Bridge wording. |

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

## Source Verification Policy

Pass 3 audits should use official or reputable sources to verify factual accuracy, rule-sensitive language, filing mechanics, market-structure details, and risk framing. The citations and source notes belong in the internal audit files.

User-facing Academy lessons should not expose citations, source-check labels, or compliance-style source paragraphs by default. Lessons should use clean educational wording and only name official systems or documents when they are part of the topic itself, such as EDGAR, Form 8-K, LULD, or a specific filing type.

## Current Starting Point

Completed before this workplan:

- Master instructor course audit: `docs/content/traderslink-academy-master-instructor-audit.md`
- First bridge lesson batch:
  - `/academy/what-is-a-stock-and-how-does-a-trade-work/`
  - `/academy/stock-market-sessions-and-order-flow-basics/`
  - `/academy/win-rate-reward-risk-and-expectancy/`
  - `/academy/short-selling-basics/`
  - `/academy/how-to-use-edgar-source-documents/`
  - `/academy/building-a-playbook-from-reviewed-trades/`
- Academy index now represents 223 Academy-ready lessons/path hubs.

## Recommended Next Run

Continue with **Pass 4: Visual Gap Audit** for **Technical Indicators And Tools**.

Reason:

- The course-by-course Pass 1 lesson-level quality audit cycle is complete.
- Pass 2 Academy-Wide Sequence And Cross-Link Audit is complete.
- Pass 3 Accuracy/Source Audit is complete for all current Academy course groups and Academy Navigation Path Hubs.
- Start Here For New Traders Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-trading-foundations.md`.
- Chart Reading And Market Structure Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-chart-reading.md`.
- Volume, Liquidity And Order Flow Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-volume-liquidity.md`.
- Risk Management And Trade Planning Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-risk-management.md`.
- Technical Indicators And Tools is the next course in the Academy order.
- Technical indicator lessons need a formal Pass 4 audit to verify indicator-overlay visuals, identify missing indicator diagrams, and confirm any existing SVGs avoid signal-language framing.

Output should include:

- A Technical Indicators And Tools visual gap audit.
- Course-level visual coverage notes across trading indicators, indicator lag, indicator overload, moving averages, VWAP, anchored VWAP, RSI, MACD, Bollinger Bands, ATR, volume by price, and VWAP reclaim lessons.
- Lesson-by-lesson visual recommendations.
- Realistic SVG opportunities, reuse decisions, duplicate-coverage notes, and defer/no-visual decisions.
- Image manifest task notes only where assets are created or updated.
- Tracker and handoff update.
- Commit.
