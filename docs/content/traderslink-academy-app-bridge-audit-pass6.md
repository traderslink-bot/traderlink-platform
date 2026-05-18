# TradersLink Academy Pass 6 App Bridge Audit

Date: 2026-05-18

Audit pass: Pass 6 - Restrained App Bridge Review

Scope: all current Academy course groups and Academy Navigation Path Hubs

Status: complete

## Purpose

This audit reviews how the Academy should connect to Trader Intelligence and related future app surfaces without turning educational lessons into product ads.

The Academy's main purpose remains user education. App bridges should help learners understand how to review completed decisions, trades, sessions, screenshots, news reactions, risk choices, and practice loops. They should not promise predictions, guaranteed improvement, trade signals, or automated discipline.

This pass did not edit lesson files, routes, schemas, React components, JSX, CSS, or production website files.

## Global Bridge Rules

Use these rules across the Academy:

- Keep bridges short and review-focused.
- Mention the app only where the lesson naturally connects to completed-trade review, risk review, execution review, coaching, analytics, progress, or playbook building.
- Do not add hard app route links until product routes, feature names, and claims are stable.
- Do not imply the app predicts trades, identifies guaranteed setups, prevents losses, diagnoses psychology, guarantees improvement, or replaces the learner's responsibility.
- Do not place a product card on every lesson card.
- Prefer module-level or course-level bridge cards where a group of lessons shares the same review workflow.
- Keep lesson-body bridge copy inside the existing `Trader Intelligence Bridge` or `Apply This In Review` sections.
- Store app bridge metadata separately from lesson prose later if the production UI needs cards, links, or feature-specific CTAs.

## Approved App Surface Vocabulary

Use this restrained vocabulary until production routes are stable:

| App Surface | Use When | Avoid |
|---|---|---|
| Progress / Academy | Lesson completion, resume learning, practice progression. | Claims that completion means readiness to trade. |
| Trade Review | Reviewing completed trades, chart context, catalyst context, decision quality. | Predictions for future trades. |
| Risk Review | Position size, stop behavior, risk limits, overnight/news exposure, loss expansion. | Claims that risk tools prevent losses. |
| Execution Review | Spread, slippage, order type, liquidity, fills, Level 2, time and sales. | Claims that the app guarantees better fills. |
| Session Review | Day-trading preparation, session segments, premarket/open/midday/after-hours review. | Intraday alerts or real-time signals. |
| News / Filing Review | Press releases, EDGAR documents, SEC filings, catalysts, offerings, dilution context. | Claims that filings predict direction. |
| Coaching | Repeated behavior patterns, rule drift, overtrading, chasing, practice focus. | Clinical or diagnostic psychology language. |
| Analytics | Patterns across samples, setup categories, execution conditions, repeated tags. | Claims that historical patterns guarantee future results. |
| Journal / Review Notes | User-entered context, screenshots, thesis notes, post-trade observations. | Making every lesson feel like journaling. |
| Playbook Builder | Turning reviewed samples into setup criteria, disqualifiers, and rules. | Claims that a playbook is a proven edge. |

## Bridge Strength Standards

| Bridge Strength | Definition | UI Treatment |
|---|---|---|
| Core Bridge | The course directly maps to a review workflow. | One course-level bridge card plus restrained lesson-level bridge notes. |
| Supporting Bridge | The course supports later review but is not an app workflow by itself. | Course-level note or a few module-level cards. |
| Light Bridge | Mention only briefly when useful. | Keep inside lesson bridge copy; avoid separate cards. |
| No Bridge Needed | The bridge would feel forced. | Do not add app copy. |

## Course-Level Bridge Audit

| Order | Course / Group | Primary Surfaces | Bridge Strength | Recommended Placement | Hard Links Now? | Pass 6 Decision |
|---:|---|---|---|---|---|---|
| 1 | Trading Foundations | Progress / Academy, Trade Review, Risk Review, Session Review | Supporting | One gentle course-level note plus existing lesson bridges. | No | Passed. Use the app as a future review companion, not as part of beginner onboarding pressure. |
| 2 | Chart Reading And Market Structure | Trade Review, Playbook Builder, Execution Review, Session Review | Supporting | Module-level cards for levels, breakouts, structure, intraday references, candles, and patterns. | No | Passed. Bridge only after concepts are learned; no chart-prediction framing. |
| 3 | Volume, Liquidity And Order Flow | Execution Review, Risk Review, Trade Review, Analytics | Core | Strongest bridge near Quotes And Execution and Order Flow Tools. | No | Passed. Execution review is natural, but still use completed-trade wording only. |
| 4 | Risk Management And Trade Planning | Risk Review, Trade Review, Execution Review, Analytics, Coaching | Core | Course-level bridge plus module-level cards for sizing, stops, limits, and event risk. | No | Passed. No claims that app tools prevent losses or enforce discipline. |
| 5 | Technical Indicators And Tools | Trade Review, Analytics, Playbook Builder | Supporting | One module-level note for indicator review and overload. | No | Passed. Indicators remain measurement tools, not app-driven signals. |
| 6 | Trading Styles And Playbooks | Playbook Builder, Trade Review, Risk Review, Analytics | Core | Course-level playbook bridge plus setup/module bridge cards. | No | Passed. Styles and setups are review categories, not promised edges. |
| 7 | Day Trading Workflow | Session Review, Execution Review, Trade Review, Risk Review | Core | Course-level session-review bridge plus capstone bridge. | No | Passed. Do not imply the app decides what to trade during the day. |
| 8 | Swing Trading Workflow | Trade Review, Risk Review, News / Filing Review, Journal / Review Notes | Supporting | Module-level bridge for thesis, event risk, and multi-session review. | No | Passed. Keep focus on thesis and hold-decision review. |
| 9 | News, Catalysts And SEC Filings | News / Filing Review, Trade Review, Risk Review, Analytics | Core | Course-level source-review bridge plus filing/news module cards. | No | Passed. No claims that filings, headlines, or catalysts predict direction. |
| 10 | Small-Cap Stocks, Float And Dilution | News / Filing Review, Risk Review, Trade Review, Analytics | Core | Module-level bridge for float, dilution, offerings, securities, and risk context. | No | Passed. No dilution/offering prediction claims. |
| 11 | Halts And High-Volatility Events | Risk Review, Execution Review, Trade Review, Session Review | Core | Course-level risk-event review bridge plus capstone bridge. | No | Passed. Treat halts and volatility as risk context, not opportunity alerts. |
| 12 | Trading Psychology And Discipline | Coaching, Trade Review, Risk Review, Analytics | Core | Course-level behavior-review bridge plus careful module cards. | No | Passed. Non-shaming, non-clinical, no guaranteed behavior change. |
| 13 | Trade Review And Improvement | Trade Review, Risk Review, Execution Review, Coaching, Analytics, Playbook Builder | Core | Strongest Academy-app bridge; course-level and lesson-level bridge allowed. | No | Passed. Still education-first and completed-trade only. |
| 14 | Practice And Improvement | Progress / Academy, Coaching, Trade Review, Playbook Builder | Core | Course-level practice-loop bridge plus capstone bridge. | No | Passed. No claim that practice or forward testing proves future results. |
| 15 | Academy Navigation Path Hubs | Progress / Academy, Trade Review, Risk Review, News / Filing Review | Light to Supporting | Homepage/path panel context only. | No | Passed. Hubs guide learning routes and should not feel like app funnels. |

## Lesson And Module Placement Notes

### Trading Foundations

Use light bridges:

- Progress / Academy for course completion and resume learning.
- Session Review for market sessions and order-flow basics.
- Trade Review for basic trade mechanics.
- Risk Review for the cross-listed risk basics.

Avoid product cards on the first lesson. New users should not feel they must use the app before they understand trading basics.

### Chart Reading And Market Structure

Use supporting bridges:

- Trade Review for support, resistance, key levels, gaps, structure, and completed chart behavior.
- Playbook Builder for repeated level or pattern contexts.
- Execution Review for breakouts, breakdowns, reclaims, failed breaks, and chase risk.
- Session Review for HOD/LOD, PMH/PML, PDH/PDL, and intraday references.

Candlestick and chart-pattern libraries should use lighter bridge copy than the core path. They are context libraries, not app workflows.

### Volume, Liquidity And Order Flow

Use core bridges:

- Execution Review for spread, bid/ask, slippage, order type, Level 2, and time and sales.
- Risk Review for liquidity, dollar volume, spread, size mismatch, and slippage-expanded risk.
- Analytics for comparing results by liquidity, RVOL, order type, and spread.

This course can support one strong future module card around intended price, actual fill, order type, spread, and slippage.

### Risk Management And Trade Planning

Use core bridges:

- Risk Review for sizing, stop location, max loss, daily loss limit, and event risk.
- Trade Review for planned versus actual risk.
- Execution Review for stop-fill caveats and slippage.
- Coaching for repeated rule drift.

Do not describe the app as enforcing discipline or preventing loss.

### Technical Indicators And Tools

Use supporting bridges:

- Trade Review for whether indicators were used in context.
- Analytics for repeated indicator use and late confirmations.
- Playbook Builder for indicator-disqualifier notes.

Do not add any app copy that sounds like indicator alerts, signal engines, or predictive model outputs.

### Trading Styles And Playbooks

Use core bridges:

- Playbook Builder for setup criteria, disqualifiers, review samples, and rule changes.
- Trade Review for completed examples by style.
- Analytics for sample comparison by setup category.
- Risk Review for style drift, sizing mismatch, and chasing.

Keep style copy flexible. Users can browse styles without declaring one permanent identity.

### Day Trading Workflow

Use core bridges:

- Session Review for preparation, watchlist, open, midday, power hour, after-hours, and session wrap.
- Execution Review for open/after-hours spread, slippage, and order type.
- Trade Review for completed intraday decisions.
- Risk Review for max loss and rule adherence.

The bridge belongs strongest in the session-review capstone, not every time-of-day lesson.

### Swing Trading Workflow

Use supporting bridges:

- Trade Review for multi-session thesis review.
- Risk Review for overnight exposure, gap risk, and sizing.
- News / Filing Review for catalysts, earnings, and surprise news.
- Journal / Review Notes for thesis changes and daily hold decisions.

Do not imply the app monitors positions or predicts overnight events unless that feature exists later.

### News, Catalysts And SEC Filings

Use core bridges:

- News / Filing Review for EDGAR, press releases, SEC filing details, offerings, and news quality.
- Trade Review for completed catalyst trades.
- Risk Review for dilution, offering, halt, gap, and liquidity context.
- Analytics for repeated catalyst category review.

Hard links should wait because filing-review route names and app capabilities need to be stable before production claims.

### Small-Cap Stocks, Float And Dilution

Use core bridges:

- News / Filing Review for float, filings, offerings, warrants, shelf registrations, cash runway, and going concern.
- Risk Review for low float, dilution, spread, halt, and position risk.
- Trade Review for completed small-cap trades.
- Analytics for repeated float/dilution context tags.

Avoid claims that the app can forecast offerings, dilution events, reverse splits, or price reactions.

### Halts And High-Volatility Events

Use core bridges:

- Risk Review for halt risk, size, spread, slippage, and event exposure.
- Execution Review for resume instability, fills, depth, and fast-spread conditions.
- Trade Review for completed volatile trades.
- Session Review for event timing and market-wide stress.

Bridge copy must avoid making halts feel exciting or tradeable by default.

### Trading Psychology And Discipline

Use core bridges carefully:

- Coaching for repeated behavior patterns.
- Trade Review for examples of FOMO, chasing, revenge trading, overtrading, cutting winners, holding losers, and averaging down.
- Risk Review for position-size and stop-drift behavior.
- Analytics for recurring mistake tags.

Do not use clinical language. Do not imply the app diagnoses or fixes the trader.

### Trade Review And Improvement

Use core bridges:

- Trade Review for review foundation and planned-vs-actual review.
- Risk Review for risk review.
- Execution Review for fill quality and order decisions.
- Coaching for repeated mistake patterns.
- Analytics for behavior/setup samples.
- Playbook Builder for reviewed-trade criteria and disqualifiers.

This is the one course where stronger product bridge copy can fit, but the language must remain completed-trade review only.

### Practice And Improvement

Use core bridges:

- Progress / Academy for learning and practice progression.
- Coaching for choosing a practice focus.
- Trade Review for replay and screenshot review.
- Playbook Builder for forward-tested samples.
- Analytics for sample tracking if supported later.

Do not imply paper trading, replay, drills, or forward testing prove live-readiness.

### Academy Navigation Path Hubs

Use light to supporting bridges:

- Progress / Academy for resume-learning and path progress.
- Trade Review, Risk Review, and News / Filing Review only where the path naturally points there.

The hubs should help users choose learning routes. They should not become product funnels.

## Product Route Link Decision

Do not add hard app links yet.

Reason:

- Future app IA and route names may change.
- Product claims need to match implemented app capabilities.
- The Academy should feel education-first.
- Hard links can be added later from a UI data layer once the destinations are real and stable.

Future production UI can introduce route-aware bridge cards after this checklist is satisfied:

- Route exists and is stable.
- Feature exists and matches the copy.
- The bridge is useful at course or module level, not repeated everywhere.
- Copy says review, compare, tag, note, or analyze; not predict, guarantee, alert, or fix.

## Recommended Future Bridge Card Pattern

Use this format later in UI planning:

```text
Review connection
After you complete trades related to this concept, use review notes and trade review tools to compare what you planned with what actually happened.
```

Optional surface label:

```text
Useful later in: Trade Review
```

Do not use:

```text
Open the app to find the next setup.
Let Trader Intelligence tell you what to trade.
Use this tool to avoid losing trades.
```

## Result

Pass 6 App Bridge Audit is complete for all current Academy course groups and Academy Navigation Path Hubs.

No lesson content edits are required from this pass. The current bridge layer is directionally correct, but production UI should keep app links disabled until route names, feature names, product claims, and app surfaces are stable.

## Recommended Next Action

Next recommended run:

```text
Academy production content model planning: course membership, cross-listed lesson navigation, progress tracking, and route-safe app bridge data.
```
