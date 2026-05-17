# Trading Foundations Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course: Trading Foundations

Status: complete

## Files Reviewed

- `academy/start-here.md`
- `academy/how-to-use-traderslink-academy.md`
- `academy/what-is-a-stock-and-how-does-a-trade-work.md`
- `academy/stock-market-sessions-and-order-flow-basics.md`
- `academy/day-trading-for-beginners.md`
- `academy/day-trading-vs-swing-trading.md`
- `academy/trading-plan.md`
- `academy/trading-rules.md`
- `academy/risk-management.md`
- `academy/position-sizing.md`
- `academy/stop-loss.md`
- `academy/trade-risk-review.md`

## Overall Verdict

Trading Foundations is ready as the first Academy course. The course now has a much better beginner ramp because it no longer jumps straight from Academy navigation into day trading. The added market-mechanics lessons explain stocks, trade matching, sessions, order flow, bid/ask, spread, liquidity, and review context before the user reaches day trading.

The course does not need a broad rewrite. The useful next work is visual support and eventual UI route-link decisions once the app routes are stable.

## Major Findings

1. The course flow is strong: onboarding, Academy navigation, market mechanics, sessions, day-trading basics, timeframe choice, plan, rules, risk, sizing, stops, and risk review.
2. App bridging is present but not overdone. Most lessons use a short review-focused Trader Intelligence bridge instead of product-heavy language.
3. Direct links to app workspace pages should wait until the app's production IA and route names are stable. For now, lesson copy should identify app surfaces such as Trade Review, Risk Review, Execution Review, Coaching, Analytics, Journal Notes, Session Review, and Progress without forcing hard app links.
4. Cross-listed Risk and Trade Review lessons are good enough for the Foundations path, but future production UI should make the cross-list context clear so a beginner does not feel confused by primary-course metadata.
5. Two quality issues were fixed during this audit:
   - `day-trading-vs-swing-trading.md` had stripped price examples.
   - `trade-risk-review.md` had stripped price and loss examples.
6. Several related lesson labels were cleaned up from literal URL labels to readable lesson names.

## Lesson-Level Notes

| Lesson | Quality Result | Depth | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/academy/start-here/` | Pass | Right length for onboarding. | Light bridge to Progress/Academy and Trade Review. | No edit needed. |
| `/academy/how-to-use-traderslink-academy/` | Pass | Strong navigation guidance. | Light bridge to Progress/Academy and Trade Review. | No edit needed. |
| `/academy/what-is-a-stock-and-how-does-a-trade-work/` | Pass | Strong beginner mechanics bridge. | Supporting bridge to Execution Review and Trade Review. | No edit needed. |
| `/academy/stock-market-sessions-and-order-flow-basics/` | Pass | Strong session and order-flow primer. | Supporting bridge to Session Review and Execution Review. | No edit needed. |
| `/academy/day-trading-for-beginners/` | Pass | Good beginner orientation without hype. | Core bridge to Trade Review, Execution Review, Risk Review, and Coaching. | No edit needed. |
| `/academy/day-trading-vs-swing-trading/` | Pass after cleanup | Good timeframe comparison. | Supporting bridge to Trade Review and Journal Notes. | Fixed stripped price example. |
| `/academy/trading-plan/` | Pass with future polish note | Good plan overview. Some wording is generic because it serves the Risk course too. | Core bridge to Trade Review and Journal Notes. | Fixed related lesson label. |
| `/academy/trading-rules/` | Pass with future polish note | Good rule clarity lesson. Some wording is generic because it serves the Risk course too. | Core bridge to Coaching, Trade Review, and Risk Review. | Fixed related lesson label. |
| `/academy/risk-management/` | Pass | Strong early risk foundation. | Core bridge to Risk Review and Coaching. | Fixed related lesson label. |
| `/academy/position-sizing/` | Pass | Strong beginner risk-sizing lesson. | Core bridge to Risk Review and Analytics. | Fixed related lesson label. |
| `/academy/stop-loss/` | Pass | Strong invalidation and stop-risk lesson. | Core bridge to Risk Review and Execution Review. | Fixed related lesson label. |
| `/academy/trade-risk-review/` | Pass after cleanup | Strong capstone review lesson for this course. | Core bridge to Risk Review and Trade Review. | Fixed stripped example. |

## App Bridge Map

Use this map later when deciding where UI links or product cards should appear. Do not add hard app route links until the app workspace and main app page routes are stable.

| Lesson | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Link Now? |
|---|---|---|---|---|---|
| `/academy/start-here/` | Progress/Academy | Trade Review | Light Bridge | Resume learning, see completed lessons, and later connect lessons to completed trades. | No. Wait for stable Academy/progress routes. |
| `/academy/how-to-use-traderslink-academy/` | Progress/Academy | Journal Notes | Light Bridge | Use progress and related lessons to return after review exposes a gap. | No. Wait for stable Academy/progress routes. |
| `/academy/what-is-a-stock-and-how-does-a-trade-work/` | Execution Review | Trade Review | Supporting Bridge | Review fills, bid/ask, spread, order type, and whether execution matched expectation. | No. Add later when execution-review route is stable. |
| `/academy/stock-market-sessions-and-order-flow-basics/` | Session Review | Execution Review | Supporting Bridge | Review whether mistakes cluster around open, midday, close, premarket, or after-hours. | No. Add later when session-review route is stable. |
| `/academy/day-trading-for-beginners/` | Trade Review | Coaching | Core Bridge | Review beginner mistakes such as chasing, undefined risk, overtrading, and reactive entries. | No. Mention app surface only until workspace route is final. |
| `/academy/day-trading-vs-swing-trading/` | Trade Review | Journal Notes | Supporting Bridge | Review whether the trade matched its intended timeframe or drifted from day trade to swing trade. | No. Add later if trade detail supports timeframe tags. |
| `/academy/trading-plan/` | Trade Review | Journal Notes | Core Bridge | Compare written plan against actual trade behavior. | No. Add later when plan/journal surfaces are stable. |
| `/academy/trading-rules/` | Coaching | Trade Review | Core Bridge | Review rule-following and repeated rule breaks without shame framing. | No. Add later when coaching/rule surfaces are stable. |
| `/academy/risk-management/` | Risk Review | Coaching | Core Bridge | Review planned risk, risk expansion, daily limits, and emotional risk changes. | No. Add later when risk-review route is stable. |
| `/academy/position-sizing/` | Risk Review | Analytics | Core Bridge | Compare size, risk distance, max open risk, and repeated sizing errors. | No. Add later when analytics/risk route is stable. |
| `/academy/stop-loss/` | Risk Review | Execution Review | Core Bridge | Review planned stop, actual exit, slippage, stop movement, and invalidation. | No. Add later when risk/execution route is stable. |
| `/academy/trade-risk-review/` | Risk Review | Trade Review | Core Bridge | Natural app fit: compare planned risk with actual risk after completed trades. | No. Add later when stable route targets exist. |

## App Link Recommendation

Do not add hard app links yet.

Reason:

- The user is still actively shaping the app and Academy.
- Hard links should point to stable, production-ready routes.
- Adding links too early can create stale app paths and product-heavy lessons.

Near-term content should keep using soft app-surface language:

```text
Use review tools later to compare the lesson against completed trades.
```

Later, once routes are stable, add links sparingly:

- Foundation/navigation lessons: main Academy progress or workspace page.
- Plan/rules/risk lessons: Risk Review or Trade Review.
- Execution/session lessons: Execution Review or Session Review.
- Behavior lessons: Coaching.
- Sample/playbook lessons: Analytics or Playbook Builder.

## Visual Needs

Trading Foundations would benefit from one course-level visual later:

- `trading-foundations-learning-map.svg`

Suggested visual:

- Dark TradersLink dashboard style.
- Simple course flow from Academy start to market mechanics, day/swing choice, plan, rules, risk, sizing, stops, and risk review.
- No buy/sell language.
- No profit or guarantee framing.
- Mobile-readable labels.

The two market-mechanics lessons could also use realistic dashboard visuals later, but they are not urgent:

- Trade matching / bid-ask / last price diagram.
- Session timeline with liquidity/spread context.

## Accuracy/Source Notes

No urgent source verification was needed for this pass beyond general common trading concepts. Future Accuracy/Source Audit should verify any exact claims about:

- Market session hours.
- Order routing mechanics.
- Stop order behavior.
- Margin, settlement, and broker-specific constraints if added later.

## Lesson Edits Completed

Edited:

- `academy/day-trading-vs-swing-trading.md`
- `academy/trade-risk-review.md`
- `academy/trading-plan.md`
- `academy/trading-rules.md`
- `academy/risk-management.md`
- `academy/position-sizing.md`
- `academy/stop-loss.md`

Edits were limited to:

- Restoring realistic price/loss examples.
- Cleaning related lesson labels.

No production website files were edited.

## Recommended Next Action

Continue Pass 1 lesson-level quality audits course by course.

Next course:

```text
Chart Reading And Market Structure
```

Include:

- Chart Reading core lessons.
- Candlestick Patterns In Context.
- Chart Patterns In Context.
- App bridge map that stays light and review-focused.
- Visual needs only where a real learning gap exists.
