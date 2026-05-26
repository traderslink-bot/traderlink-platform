# Halts And High-Volatility Events Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course: Halts And High-Volatility Events

Status: complete

## Files Reviewed

- `academy/trading-halts.md`
- `academy/volatility-halts.md`
- `academy/halt-resume.md`
- `academy/market-wide-circuit-breakers.md`
- `academy/fast-spread-risk.md`
- `academy/low-float-volatility.md`
- `academy/high-volatility-trade-review.md`

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`

## Overall Verdict

Halts And High-Volatility Events is ready as an Academy course after Small-Cap Stocks, Float And Dilution. The course works because it turns a dangerous, often-hyped topic into practical risk education: interruption risk, resume uncertainty, broad-market stress, spread widening, low-float volatility, and completed-trade review.

The 7-lesson sequence is tight:

1. Start with trading halt basics.
2. Explain volatility halts as single-stock market-structure events.
3. Teach halt resume as an execution and liquidity problem.
4. Separate market-wide circuit breakers from single-stock halts.
5. Teach fast spread risk as the execution layer.
6. Connect low-float volatility to halt and liquidity risk.
7. Finish with high-volatility trade review.

The course does not need a broad rewrite. It needed small visual/body alignment fixes and one stale path-hub sentence cleanup.

## Major Findings

1. The course flow is strong. It starts with event mechanics and ends with review behavior, which matches the Academy goal.
2. The course avoids signal framing. Halts, resumes, circuit breakers, fast spreads, and low-float volatility are consistently taught as risk context, not buy/sell instructions.
3. All 7 lessons include the required Academy structure: lesson objective, common mistakes, practical checklist, Apply This In Review, Trader Intelligence bridge, FAQ, and educational disclaimer.
4. Previous/next metadata is intact from `/academy/trading-improvement-plan/` into `/academy/trading-halts/` and from `/academy/high-volatility-trade-review/` into `/academy/chart-reading-path/`.
5. Existing visual support is strong and realistic. Three SVGs are reused across the course and include title/desc tags, realistic candle context, volume or spread/depth context, dark dashboard styling, and educational labels.
6. Four lessons had `visual_assets` metadata but no visible image in the markdown body. This pass inserted the relevant existing SVG into those lesson bodies.
7. The capstone lesson still said the chart-reading path hub might be added later. This pass updated the wording because `/academy/chart-reading-path/` now exists.
8. Source-sensitive rule details remain the main later risk. The course already includes official-source reminders, and later Pass 3 should verify halt, LULD, circuit-breaker, and exchange procedure claims.

## Lesson-Level Notes

| Lesson | Quality Result | Depth | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/academy/trading-halts/` | Pass | Strong opener covering halt types, interruption risk, official source checks, spread, liquidity, and no-direction assumptions. | Core bridge to Risk Review, Trade Review, and Execution Review. | No direct edit needed. |
| `/academy/volatility-halts/` | Pass after cleanup | Strong single-stock volatility halt lesson with low-float and fast-candle context. | Core bridge to Risk Review, Execution Review, and Trade Review. | Added the existing halt timeline SVG to the lesson body. |
| `/academy/halt-resume/` | Pass | Strong resume-risk lesson focused on spread, depth, first-candle instability, and slippage. | Core bridge to Execution Review and Trade Review. | No direct edit needed. |
| `/academy/market-wide-circuit-breakers/` | Pass | Strong market-wide stress lesson that separates broad-market circuit breakers from single-stock halts. | Supporting bridge to Risk Review, Session Review, and Trade Review. | No direct edit needed. |
| `/academy/fast-spread-risk/` | Pass after cleanup | Strong execution lesson connecting spread, slippage, quote conditions, order type, and realistic fill risk. | Core bridge to Execution Review and Analytics. | Added the existing halt-resume spread-risk SVG to the lesson body. |
| `/academy/low-float-volatility/` | Pass after cleanup | Strong small-cap volatility lesson connecting float, volume, spread, halts, liquidity, and dilution context. | Core bridge to Risk Review, Trade Review, and News/Filing Review. | Added the existing halt timeline SVG to the lesson body. |
| `/academy/high-volatility-trade-review/` | Pass after cleanup | Strong course capstone that teaches condition-first review, outcome/process separation, tagging, sizing, and behavior patterns. | Core bridge to Trade Review, Execution Review, Risk Review, and Analytics. | Added the existing halt-resume spread-risk SVG and cleaned stale path-hub wording. |

## App Bridge Map

| Lesson / Module | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Needed Edit |
|---|---|---|---|---|---|
| Trading halt foundation | Risk Review | Trade Review / Execution Review | Core Bridge | Review whether the trader accounted for interruption risk, delayed exits, spread changes, and official halt context. | None. |
| Volatility halts | Risk Review | Execution Review / Trade Review | Core Bridge | Review fast-candle conditions, low-float context, spread, size, resume uncertainty, and whether the trader treated the halt as a signal. | Added visible SVG. |
| Halt resume | Execution Review | Trade Review / Risk Review | Core Bridge | Review spread, depth, first-candle reaction, slippage, and whether the original plan still applied after resume. | None. |
| Market-wide circuit breakers | Session Review | Risk Review / Trade Review | Supporting Bridge | Review whether broad-market stress changed liquidity, volatility, emotional pressure, and risk decisions across the session. | None. |
| Fast spread risk | Execution Review | Analytics / Trade Review | Core Bridge | Review whether fills were realistic, whether spread/slippage damaged execution, and whether size matched liquidity. | Added visible SVG. |
| Low-float volatility | Risk Review | News/Filing Review / Trade Review | Core Bridge | Review float, volume, catalyst quality, dilution context, halt risk, spread, and whether small-cap conditions repeatedly weaken decisions. | Added visible SVG. |
| High-volatility trade review | Trade Review | Execution Review / Risk Review / Analytics | Core Bridge | Tag volatile trades and review whether fast markets create repeated size, execution, risk, or emotional errors. | Added visible SVG and cleaned stale path-hub wording. |

## Visual Needs

No new SVGs were created in this pass. Existing realistic visual support is strong and now appears directly in every lesson body.

Existing visual assets:

- `public/academy/images/chart-reading/trading-halt-timeline.svg`
- `public/academy/images/chart-reading/halt-resume-spread-risk.svg`
- `public/academy/images/chart-reading/market-wide-circuit-breaker-context.svg`

Visual verification:

- SVG files include `title` and `desc` tags.
- Visuals use realistic red and green candle context where relevant.
- Visuals use dark trading-dashboard styling with blue accent.
- Visuals avoid buy/sell labels, profit claims, and guaranteed-outcome language.
- Lesson body images now align with `visual_assets` metadata across all 7 lessons.

Future optional SVGs:

- `volatility-halt-luld-band-context.svg`
- `halt-resume-first-candle-risk.svg`
- `low-float-halt-risk-dashboard.svg`
- `high-volatility-trade-review-dashboard.svg`

Do not create those now unless the later Visual Gap Audit finds the current three-SVG set is too repetitive for the final UI.

## New Lessons Needed

No urgent new lesson is required for this course.

Future optional additions could be considered during a later sequence or source audit:

- `/academy/luld-bands/`
- `/academy/halt-codes/`
- `/academy/order-imbalance-halts/`
- `/academy/news-pending-halts/`
- `/academy/sec-trading-suspensions/`

These should not be added automatically during Pass 1. They may be useful if the UI needs a deeper market-structure branch or if the Accuracy/Source Audit decides the course should separate exchange halt mechanics from SEC trading suspensions.

## Accuracy/Source Notes

This pass was a lesson-level quality audit, not the full official Accuracy/Source Audit. Because halt and circuit-breaker rules are source-sensitive, a light official-source spot check was completed for the current market-wide circuit breaker level framing.

Spot check:

- NYSE Trading Information currently describes market-wide circuit breaker thresholds as 7%, 13%, and 20% declines in the S&P 500 Index from the prior day's close.
- FINRA investor education describes the same 7%, 13%, and 20% market-wide circuit breaker thresholds.
- Investor.gov describes cross-market trading halt thresholds at Level 1, Level 2, and Level 3: 7%, 13%, and 20%.

Future Accuracy/Source Audit should verify:

- Current NYSE, Nasdaq, FINRA, SEC, and Investor.gov descriptions of market-wide circuit breakers.
- Current LULD mechanics, bands, timing, and affected securities.
- Exchange halt codes, news-pending halts, order-imbalance halts, and resume procedures.
- SEC trading suspension wording and duration basics.
- Any lesson language that mentions exact thresholds, procedures, timing, or official halt categories.

Source-sensitive lessons should avoid exact rule, timing, or procedure claims unless the later source audit verifies them against official sources.

## Lesson Edits Completed

Edited course files:

- `academy/volatility-halts.md`
- `academy/fast-spread-risk.md`
- `academy/low-float-volatility.md`
- `academy/high-volatility-trade-review.md`

Edits were limited to:

- Adding existing realistic SVGs into lesson bodies where the visual was already declared in `visual_assets`.
- Updating the capstone lesson's stale chart-reading path-hub wording now that `/academy/chart-reading-path/` exists.

No production website files were edited.

## Verification Completed

- Confirmed all 7 lessons include the required Academy sections.
- Confirmed previous/next metadata matches the intended course chain.
- Confirmed no missing local `/academy/.../` draft links were introduced by this pass.
- Confirmed no hard `/trader-intelligence/` or `/features/` route links remain in the Halts course files.
- Confirmed no raw `[/academy/.../]` labels remain in the Halts course files.
- Confirmed the three existing SVG files include title and desc tags.
- Confirmed the course retains no buy/sell instruction framing, profit claims, or guaranteed-outcome claims.

## Recommended Next Action

Continue Pass 1 lesson-level quality audits course by course.

Next course:

```text
Trading Psychology And Discipline
```

Include:

- Trading discipline, FOMO, chasing stocks, revenge trading, overtrading, holding losers, cutting winners, and averaging down.
- A restrained app bridge map centered on Coaching, Trade Review, Risk Review, Analytics, and mistake-pattern review.
- Careful language that avoids shame, blame, medicalized claims, or promises that the app will fix behavior.
- Targeted markdown edits only where lesson quality, wording, flow, visual need, source-risk labeling, or app-bridge restraint needs cleanup.

## Sources Used For Light Rule Spot Check

- [NYSE Trading Information](https://www.nyse.com/markets/nyse/trading-info)
- [FINRA Guardrails For Market Volatility](https://www.finra.org/investors/insights/guardrails-market-volatility)
- [Investor.gov Stock Market Circuit Breakers](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/measures)
