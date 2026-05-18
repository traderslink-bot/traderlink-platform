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
| 1 | Trading Foundations | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 1 completed in `docs/content/traderslink-academy-quality-audit-trading-foundations.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-trading-foundations.md` with official SEC, Investor.gov, FINRA, and Regulation SHO source verification plus targeted plain-language accuracy guardrail edits; Pass 4 completed in `docs/content/traderslink-academy-visual-gap-audit-trading-foundations.md` with 4 priority beginner SVGs planned and risk/review visuals deferred to their dedicated course passes; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-trading-foundations.md` and found the course ready for UI planning once a course membership/cross-listing model is decided. |
| 2 | Chart Reading And Market Structure | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 1 completed in `docs/content/traderslink-academy-quality-audit-chart-reading.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-chart-reading.md` with reputable charting references plus official SEC, NYSE, and Nasdaq source checks for session/extended-hours language; Pass 4 completed in `docs/content/traderslink-academy-visual-gap-audit-chart-reading.md` with 69 scoped SVGs verified and no required new assets; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-chart-reading.md` and found the course ready for UI planning with parent-course/submodule grouping for the core path, candlestick library, and chart-pattern library. |
| 3 | Volume, Liquidity And Order Flow | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 1 completed in `docs/content/traderslink-academy-quality-audit-volume-liquidity.md`; Pass 2 completed in `docs/content/traderslink-academy-sequence-cross-link-audit.md`; Pass 3 completed in `docs/content/traderslink-academy-accuracy-source-audit-volume-liquidity.md` with official SEC, Investor.gov, FINRA, Nasdaq, and NYSE source verification plus targeted plain-language accuracy guardrail edits; Pass 4 completed in `docs/content/traderslink-academy-visual-gap-audit-volume-liquidity.md` with 29 scoped SVGs verified, no required new assets, and one bid/ask label cleanup; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-volume-liquidity.md` and found the course ready for UI planning as a compact 14-lesson execution-awareness path. |
| 4 | Risk Management And Trade Planning | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-risk-management.md`; ready for UI planning as a 14-lesson risk-control path, with the six-SVG risk visual batch still recommended before polished production launch. |
| 5 | Technical Indicators And Tools | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-technical-indicators.md`; ready for UI planning as a 12-lesson tool-context course, with the seven-SVG indicator visual batch still recommended before polished production launch. |
| 6 | Trading Styles And Playbooks | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-trading-styles.md`; ready for UI planning as a 15-lesson style/playbook course with shared completion for cross-listed Chart Reading and Psychology lessons. |
| 7 | Day Trading Workflow | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-day-trading-workflow.md`; ready for UI planning as a 9-lesson session-timeline course. |
| 8 | Swing Trading Workflow | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-swing-trading-workflow.md`; ready for UI planning as an 8-lesson multi-session workflow course. |
| 9 | News, Catalysts And SEC Filings | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-news-catalysts-sec-filings.md`; ready for UI planning as a large hierarchical 37-lesson course with filing-library/module-progress behavior. |
| 10 | Small-Cap Stocks, Float And Dilution | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-small-cap-float-dilution.md`; ready for UI planning as a grouped 28-lesson supply-and-risk course, with the priority small-cap visual batch still recommended before polished production launch. |
| 11 | Halts And High-Volatility Events | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-halts-high-volatility.md`; ready for UI planning as a compact 7-lesson risk-event course. |
| 12 | Trading Psychology And Discipline | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-trading-psychology.md`; ready for UI planning as an 8-lesson non-shaming behavior-review course, with behavior-loop visuals still recommended before polished production launch. |
| 13 | Trade Review And Improvement | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-trade-review-improvement.md`; ready for UI planning as a 9-lesson review hub and restrained Trader Intelligence bridge, with review-dashboard visuals still recommended before polished production launch. |
| 14 | Practice And Improvement | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-practice-improvement.md`; ready for UI planning as a 9-lesson practice-loop course. |
| 15 | Academy Navigation Path Hubs | complete | complete | complete | complete | complete | complete | Pass 6 completed in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`; Pass 5 completed in `docs/content/traderslink-academy-ui-readiness-navigation-path-hubs.md`; ready for UI planning as optional guided-route support, not numbered courses. |

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

Continue with **Academy registry migration checklist planning**.

Reason:

- The course-by-course Pass 1 lesson-level quality audit cycle is complete.
- Pass 2 Academy-Wide Sequence And Cross-Link Audit is complete.
- Pass 3 Accuracy/Source Audit is complete for all current Academy course groups and Academy Navigation Path Hubs.
- Start Here For New Traders Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-trading-foundations.md`.
- Chart Reading And Market Structure Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-chart-reading.md`.
- Volume, Liquidity And Order Flow Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-volume-liquidity.md`.
- Risk Management And Trade Planning Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-risk-management.md`.
- Technical Indicators And Tools Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-technical-indicators.md`.
- Trading Styles And Playbooks Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-trading-styles.md`.
- Day Trading Workflow Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-day-trading-workflow.md`.
- Swing Trading Workflow Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-swing-trading-workflow.md`.
- News, Catalysts And SEC Filings Pass 4 Visual Gap Audit is complete in `docs/content/traderslink-academy-visual-gap-audit-news-catalysts-sec-filings.md`.
- Pass 4 Visual Gap Audit is complete for all current Academy course groups and Academy Navigation Path Hubs.
- Pass 5 UI Readiness Review is complete for all current Academy course groups and Academy Navigation Path Hubs.
- Remaining visual gaps documented during Pass 4 are launch-polish items unless a future production design decision requires those visuals before launch.
- Pass 6 App Bridge Audit is complete for all current Academy course groups and Academy Navigation Path Hubs in `docs/content/traderslink-academy-app-bridge-audit-pass6.md`.
- Academy production content model planning is complete in `docs/content/traderslink-academy-production-content-model-plan.md`.
- Academy content registry draft planning is complete in `docs/content/traderslink-academy-content-registry-draft.md`.
- Academy registry implementation-format decision is complete in `docs/content/traderslink-academy-registry-format-decision.md`.
- The recommended first registry source is author-editable JSON under `academy/_data/`, not `academy/content/`, root `content/academy/`, or `src/content/academy/`.
- The next useful planning pass is a migration checklist from the markdown registry draft into future `academy/_data/*.json` files before any production website implementation.

Output should include:

- A migration checklist from the markdown registry draft to future `academy/_data/*.json` files.
- Suggested validation checks for lesson slugs, image references, membership rows, cross-listed ownership, and route-safe app bridge fields.
- A no-code implementation boundary unless the user explicitly asks for production website work.
- No production website implementation.
- Tracker and handoff update.
- Commit.
