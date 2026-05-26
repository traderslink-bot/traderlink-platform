# Risk Management And Trade Planning Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course: Risk Management And Trade Planning

Status: complete

## Files Reviewed

- `academy/trading-plan.md`
- `academy/trading-rules.md`
- `academy/risk-management.md`
- `academy/position-sizing.md`
- `academy/risk-reward-ratio.md`
- `academy/win-rate-reward-risk-and-expectancy.md`
- `academy/stop-loss.md`
- `academy/mental-stop-vs-hard-stop.md`
- `academy/max-loss.md`
- `academy/daily-loss-limit.md`
- `academy/trade-management.md`
- `academy/profit-protection.md`
- `academy/overnight-risk.md`
- `academy/holding-through-news.md`

Adjacent transition files reviewed and lightly edited:

- `academy/unusual-volume.md`
- `academy/trading-indicators.md`

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`

## Overall Verdict

Risk Management And Trade Planning is ready as the fourth Academy course after Volume, Liquidity And Order Flow. It is one of the most important courses in the Academy because it turns the previous chart, volume, and execution lessons into rules for controlled decision-making.

The course teaches a strong progression: planning, rules, risk basics, sizing, reward/risk, expectancy, stops, mental versus hard stops, max loss, daily loss limits, trade management, profit protection, overnight risk, and holding through news.

The course does not need a broad rewrite. The useful work during this pass was targeted:

- Confirm the 14-lesson course chain and metadata sequence.
- Confirm lesson structure, examples, checklists, review prompts, FAQ, disclaimers, and anti-guarantee language.
- Fix course-transition metadata now that Risk Management sits earlier in the Academy path.
- Remove hard `/features/...` product-route links from Risk lessons until app IA and routes are stable.
- Document restrained Trader Intelligence bridge opportunities around completed-trade risk review.

## Major Findings

1. The course flow is strong. It starts with process and rules, then moves into risk math, stop logic, account protection, management decisions, and event risk.
2. The expectancy bridge lesson improves the course. It keeps users from treating win rate or reward/risk alone as enough evidence.
3. The lessons avoid dangerous guarantee language. Stops, max loss, daily loss limits, risk/reward, and profit protection are presented as planning/review tools, not protection from all losses.
4. The course has no urgent content-depth gap. The current lessons are complete enough for the Academy standard.
5. Visual support is lighter than Chart Reading or Volume/Liquidity. That is acceptable for this pass, but the course should receive a later visual pass for risk math, sizing, stop behavior, max loss, and trade-management diagrams.
6. App bridging is natural here, but it should stay review-focused. This course should connect to Risk Review, Trade Review, Analytics, Coaching, and Execution Review after trades are complete.
7. Hard app route links should still wait. Several old `/features/...` links were removed from lesson metadata and related-link lists to avoid stale or premature product paths.

## Lesson-Level Notes

| Lesson | Quality Result | Depth | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/academy/trading-plan/` | Pass after cleanup | Strong course opener for process, rules, risk, and review. | Core bridge to Trade Review and Risk Review. | Updated previous lesson metadata and intro from old course order to `/academy/unusual-volume/`. |
| `/academy/trading-rules/` | Pass after cleanup | Good rule clarity and behavior-constraint lesson. | Core bridge to Coaching and Trade Review. | Removed premature `/features/...` link. |
| `/academy/risk-management/` | Pass after cleanup | Strong risk foundation lesson. | Core bridge to Risk Review and Coaching. | Removed premature `/features/...` link. |
| `/academy/position-sizing/` | Pass after cleanup | Strong sizing lesson tied to stop distance, liquidity, and max loss. | Core bridge to Risk Review and Analytics. | Removed premature `/features/...` link. |
| `/academy/risk-reward-ratio/` | Pass after cleanup | Good planned-risk lesson that avoids ratio-as-guarantee framing. | Core bridge to Risk Review and Trade Review. | Removed premature `/features/...` link. |
| `/academy/win-rate-reward-risk-and-expectancy/` | Pass | Strong bridge lesson for sample review and expectancy. | Core bridge to Analytics and Risk Review. | No edit needed. |
| `/academy/stop-loss/` | Pass | Good invalidation and exit-risk lesson with slippage/gap caution. | Core bridge to Risk Review and Execution Review. | No edit needed. |
| `/academy/mental-stop-vs-hard-stop/` | Pass after cleanup | Strong comparison of discipline risk versus order/fill risk. | Core bridge to Risk Review, Execution Review, and Coaching. | Removed premature `/features/...` link. |
| `/academy/max-loss/` | Pass | Good account-protection lesson. | Core bridge to Risk Review and Coaching. | No edit needed. |
| `/academy/daily-loss-limit/` | Pass | Good stop-trading and revenge-risk lesson. | Core bridge to Risk Review and Coaching. | No edit needed. |
| `/academy/trade-management/` | Pass after cleanup | Good post-entry decision process lesson. | Core bridge to Trade Review and Risk Review. | Removed premature `/features/...` link. |
| `/academy/profit-protection/` | Pass after cleanup | Good open-profit risk and giveback lesson. | Supporting bridge to Trade Review and Coaching. | Removed premature `/features/...` link. |
| `/academy/overnight-risk/` | Pass | Good event/gap-risk lesson. | Core bridge to Risk Review and Journal Notes. | No edit needed. |
| `/academy/holding-through-news/` | Pass after cleanup | Good catalyst-risk lesson with planned-decision framing. | Core bridge to Risk Review and News/Filing Review. | Updated next lesson metadata and intro to lead into Technical Indicators. |

## Adjacent Transition Notes

Two adjacent lessons were lightly edited because the Academy course order changed:

| Lesson | Edit | Why |
|---|---|---|
| `/academy/unusual-volume/` | `recommended_next` now points to `/academy/trading-plan/`; intro now says it leads into Trading Plan. | Volume/Liquidity is now followed by Risk Management, not News/Catalysts. |
| `/academy/trading-indicators/` | `recommended_previous` now points to `/academy/holding-through-news/`; intro now says it follows Holding Through News. | Technical Indicators now follows Risk Management in the Academy path. |

## App Bridge Map

Use this map later when deciding where UI links or product cards should appear. Do not add hard app route links until the app workspace and main app page routes are stable.

| Lesson / Group | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Link Now? |
|---|---|---|---|---|---|
| Trading plan and trading rules | Trade Review | Coaching | Core Bridge | Compare planned process and rules against completed trades and repeated rule breaks. | No. Wait for stable Trade Review/Coaching routes. |
| Risk management and position sizing | Risk Review | Analytics | Core Bridge | Review planned risk, actual risk, size, stop distance, liquidity, and whether risk expanded. | No. Wait for stable Risk Review route. |
| Risk/reward and expectancy | Analytics | Risk Review | Core Bridge | Group completed trades by setup, reward/risk, win rate, average winner, average loser, and expectancy. | No. Add later if analytics supports setup samples. |
| Stop-loss lessons | Risk Review | Execution Review | Core Bridge | Review invalidation, planned stop, actual exit, slippage, gap risk, and stop movement. | No. Wait for stable fill/risk fields. |
| Max loss and daily loss limits | Risk Review | Coaching | Core Bridge | Review whether account-protection rules were followed and what behavior appeared near the limit. | No. Keep product bridge soft for now. |
| Trade management and profit protection | Trade Review | Coaching | Core Bridge | Review post-entry decisions, partial exits, stop movement, giveback, and plan changes. | No. Add later when trade-management review UI is stable. |
| Overnight risk and holding through news | Risk Review | News/Filing Review | Core Bridge | Review planned exposure, event risk, catalyst dependence, liquidity, and gap outcomes. | No. Add later when news/filing review surface is stable. |

## App Link Recommendation

Do not add hard app links yet.

Reason:

- Risk lessons are core education and should not feel like product documentation.
- The strongest app bridge is after completed trades are imported or reviewed.
- App routes and product IA are still being shaped.
- Old `/features/...` links were removed in this pass to avoid premature or stale route references.

Good future app-link candidates after routes are stable:

- Planning and rules: Trade Review or Coaching.
- Sizing, stops, max loss, daily loss limits: Risk Review.
- Expectancy and sample analysis: Analytics.
- Stop fills and slippage: Execution Review.
- Holding through news: News/Filing Review plus Risk Review.

Use one restrained review card per lesson or module, not repeated product mentions throughout the lesson.

## Visual Needs

No SVGs were created during this pass, but this course should receive a future visual batch.

Highest-value future visuals:

- `risk-management-course-map.svg`: planning, rules, sizing, stops, limits, management, event risk.
- `position-sizing-risk-distance.svg`: account risk, stop distance, share size, and liquidity caution.
- `risk-reward-expectancy-sample.svg`: win rate, average winner, average loser, and expectancy as sample review.
- `stop-loss-fill-risk.svg`: planned stop versus actual fill in fast/thin/gap conditions.
- `daily-loss-limit-shutdown-flow.svg`: loss limit, trigger, stop-trading rule, and after-session review.
- `overnight-news-risk-map.svg`: known catalyst, gap risk, size, liquidity, and review after outcome.

Visual standard:

- Dark TradersLink dashboard style.
- Realistic chart or review-dashboard panels where useful.
- Simple math examples where needed.
- No profit promises, buy/sell instructions, or guarantee language.
- `title` and `desc` tags.
- Mobile-readable labels.

## New Lessons Needed

No urgent new lesson is needed for this course.

The existing 14-lesson sequence covers the major risk-management learning path well:

- Process and rules.
- Risk math.
- Stops and execution risk.
- Account-protection limits.
- Trade management.
- Event and overnight risk.

Future optional additions could be considered during a later sequence or visual/UI pass:

- `/academy/risk-before-entry-checklist/`
- `/academy/when-to-reduce-position-size/`
- `/academy/position-sizing-for-volatile-stocks/`

Do not create those now unless a later audit finds users need more granular bridges between sizing, volatility, and execution risk.

## Accuracy/Source Notes

No official source verification was required during this pass because the audit did not change technical broker/order-rule claims.

Future Accuracy/Source Audit should review lessons touching:

- Stop order behavior.
- Margin and account risk if expanded.
- Overnight risk, after-hours liquidity, and gap behavior if exact session mechanics are added.
- Broker/platform-specific order handling if added later.

## Lesson Edits Completed

Edited Risk course files:

- `academy/trading-plan.md`
- `academy/trading-rules.md`
- `academy/risk-management.md`
- `academy/position-sizing.md`
- `academy/risk-reward-ratio.md`
- `academy/mental-stop-vs-hard-stop.md`
- `academy/trade-management.md`
- `academy/profit-protection.md`
- `academy/holding-through-news.md`

Edited adjacent transition files:

- `academy/unusual-volume.md`
- `academy/trading-indicators.md`

Edits were limited to:

- Correcting Academy previous/next course-transition metadata and visible intro text.
- Removing premature hard `/features/...` links from Risk lessons.

No production website files were edited.

## Recommended Next Action

Continue Pass 1 lesson-level quality audits course by course.

Next course:

```text
Technical Indicators And Tools
```

Include:

- Trading indicators, indicator lag, indicator overload, moving averages, VWAP, anchored VWAP, RSI, MACD, Bollinger Bands, ATR, VWAP reclaim, and cross-listed Volume By Price.
- A restrained app bridge map centered on Trade Review, Analytics, Execution Review, and Playbook Builder.
- Targeted markdown edits only where lesson quality, wording, review flow, visual need, or app-bridge restraint needs cleanup.
