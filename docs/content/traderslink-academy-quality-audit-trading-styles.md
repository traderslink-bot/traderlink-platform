# Trading Styles And Playbooks Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course: Trading Styles And Playbooks

Status: complete

## Files Reviewed

- `academy/trading-styles.md`
- `academy/day-trading.md`
- `academy/swing-trading.md`
- `academy/scalping-stocks.md`
- `academy/short-selling-basics.md`
- `academy/momentum-trading.md`
- `academy/pullbacks-and-dip-buy-setups.md`
- `academy/breakout-trading.md`
- `academy/breakdown-trading.md`
- `academy/level-reclaim.md`
- `academy/gap-fill-trading.md`
- `academy/news-fade.md`
- `academy/sell-the-news.md`
- `academy/multi-day-runner.md`
- `academy/chasing-stocks.md`

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`

## Overall Verdict

Trading Styles And Playbooks is ready as the next Academy course after Technical Indicators And Tools. The course does what this part of the Academy needs to do: it turns prior lessons on charts, volume, risk, and indicators into style and setup categories without promising that any style is an edge by itself.

The course has a good instructor flow:

1. Define styles as review categories, not identities.
2. Compare day trading, swing trading, scalping, and short selling as different risk/execution environments.
3. Move into momentum, pullbacks, breakouts, breakdowns, reclaims, and gap fills as setup contexts.
4. Teach news fade and sell-the-news as reaction concepts, not commands.
5. Finish with multi-day runner context and chasing risk so the learner leaves the course thinking about discipline and review.

The course does not need a broad rewrite. The useful work during this pass was targeted:

- Confirm the 15-lesson course chain and cross-listed lesson coverage.
- Confirm lesson structure, examples, checklists, review prompts, FAQ, disclaimers, and anti-guarantee language.
- Remove premature hard `/features/...` product-route links from four cross-listed setup lessons.
- Document restrained Trader Intelligence bridge opportunities around Playbook Builder, Trade Review, Analytics, Session Review, Coaching, Risk Review, and Execution Review.

## Major Findings

1. The course flow is strong. It introduces style selection before teaching setup categories, which keeps users from jumping straight into pattern labels without risk and review context.
2. The native Trading Styles lessons are already well aligned with the Academy standard. They include objectives, realistic examples, common mistakes, practical checklists, Apply This In Review, Trader Intelligence Bridge, FAQ, and disclaimers.
3. Short Selling Basics belongs in this course. It is not a short-signal lesson; it teaches risk, borrow/locate context, squeeze risk, and why short pressure affects market behavior.
4. Cross-listed Chart Reading lessons are useful here, but their canonical metadata still belongs to Chart Reading And Market Structure. A later sequence/UI pass should decide how cross-listed lesson progress and previous/next links should appear in the product.
5. Chasing Stocks is a good capstone even though it is canonically in Trading Psychology And Discipline. It closes the course by making users review late entries after studying momentum, breakouts, reclaims, news reactions, and runners.
6. Visual support is mixed. Cross-listed Chart Reading lessons already have strong realistic SVGs. Native style lessons need a later visual pass for playbook selection, style drift, momentum versus chasing, pullback quality, news reaction review, and multi-day runner context.
7. App bridging is useful but should stay restrained. These lessons naturally connect to Playbook Builder, Trade Review, Analytics, Session Review, Coaching, Risk Review, and Execution Review after trades are complete.
8. Hard app route links should still wait. Old `/features/...` links were removed from cross-listed setup lessons until app routes and IA are stable.

## Lesson-Level Notes

| Lesson | Quality Result | Depth | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/academy/trading-styles/` | Pass | Strong course opener that frames styles as playbooks and review categories. | Core bridge to Playbook Builder and Trade Review. | No edit needed. |
| `/academy/day-trading/` | Pass | Good intraday style lesson with planning, time-of-day, execution, and risk context. | Core bridge to Session Review and Execution Review. | No edit needed. |
| `/academy/swing-trading/` | Pass | Strong multi-session style lesson with overnight/news risk and style-drift warnings. | Core bridge to Trade Review and Risk Review. | No edit needed. |
| `/academy/scalping-stocks/` | Pass | Strong execution-sensitive lesson covering spread, slippage, liquidity, and trade count. | Core bridge to Execution Review and Coaching. | No edit needed. |
| `/academy/short-selling-basics/` | Pass | Good bridge lesson for borrow, locate, squeeze, halt, and short-risk context. | Supporting bridge to Risk Review and Trade Review. | No edit needed. |
| `/academy/momentum-trading/` | Pass | Strong participation-context lesson that separates planned momentum from chasing. | Core bridge to Playbook Builder and Trade Review. | No edit needed. |
| `/academy/pullbacks-and-dip-buy-setups/` | Pass | Strong controlled-versus-disorderly pullback lesson with averaging-down warnings. | Core bridge to Trade Review and Coaching. | No edit needed. |
| `/academy/breakout-trading/` | Pass after cleanup | Strong cross-listed setup lesson with realistic visuals and chase-risk review. | Supporting bridge to Trade Review and Playbook Builder. | Removed premature `/features/...` link. |
| `/academy/breakdown-trading/` | Pass after cleanup | Strong cross-listed downside setup lesson with failed-breakdown and chase-risk context. | Supporting bridge to Trade Review and Risk Review. | Removed premature `/features/...` link. |
| `/academy/level-reclaim/` | Pass after cleanup | Strong cross-listed reclaim lesson with hold/fail visuals and review prompts. | Supporting bridge to Trade Review and Execution Review. | Removed premature `/features/...` link. |
| `/academy/gap-fill-trading/` | Pass after cleanup | Strong cross-listed gap lesson with catalyst, gap-area, failed-fill, and risk context. | Supporting bridge to Trade Review and News/Filing Review. | Removed premature `/features/...` link. |
| `/academy/news-fade/` | Pass | Strong reaction-review lesson that avoids assuming all news spikes fade. | Core bridge to News/Filing Review and Trade Review. | No edit needed. |
| `/academy/sell-the-news/` | Pass | Good expected-news reaction lesson that treats the phrase as a concept, not a command. | Supporting bridge to News/Filing Review and Trade Review. | No edit needed. |
| `/academy/multi-day-runner/` | Pass | Strong advanced context lesson with attention, float, supply, exhaustion, and chase risk. | Core bridge to Trade Review, Risk Review, and Analytics. | No edit needed. |
| `/academy/chasing-stocks/` | Pass | Strong capstone risk lesson for late entries, FOMO, spread, slippage, and review tags. | Core bridge to Coaching, Execution Review, and Trade Review. | No edit needed. |

## App Bridge Map

| Lesson | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Needed Edit |
|---|---|---|---|---|---|
| `/academy/trading-styles/` | Playbook Builder | Trade Review | Core Bridge | Tag completed trades by style, setup, timeframe, and repeated mistake pattern. | None. |
| `/academy/day-trading/` | Session Review | Execution Review | Core Bridge | Review intraday trades by time of day, setup, spread, slippage, and stop rule. | None. |
| `/academy/swing-trading/` | Trade Review | Risk Review | Core Bridge | Review thesis, hold decisions, overnight risk, adds, reductions, and style drift. | None. |
| `/academy/scalping-stocks/` | Execution Review | Coaching | Core Bridge | Review fill quality, spread, slippage, trade count, and rapid re-entry behavior. | None. |
| `/academy/short-selling-basics/` | Risk Review | Trade Review | Supporting Bridge | Review borrow constraints, invalidation, squeeze risk, halt risk, and short-bias behavior. | None. |
| `/academy/momentum-trading/` | Playbook Builder | Trade Review | Core Bridge | Review whether momentum entries were structured or late chases. | None. |
| `/academy/pullbacks-and-dip-buy-setups/` | Trade Review | Coaching | Core Bridge | Review controlled pullbacks versus failed dips, averaging down, and invalidation respect. | None. |
| `/academy/breakout-trading/` | Trade Review | Playbook Builder | Supporting Bridge | Review breakout quality, chase entries, failed breakouts, and volume context. | Removed stale app route link. |
| `/academy/breakdown-trading/` | Trade Review | Risk Review | Supporting Bridge | Review support breaks, failed breakdowns, extension, and risk response. | Removed stale app route link. |
| `/academy/level-reclaim/` | Trade Review | Execution Review | Supporting Bridge | Review reclaim quality, hold/failure behavior, and chase entries around reclaimed zones. | Removed stale app route link. |
| `/academy/gap-fill-trading/` | Trade Review | News/Filing Review | Supporting Bridge | Review gap area behavior, catalyst context, failed fills, and trade management around gaps. | Removed stale app route link. |
| `/academy/news-fade/` | News/Filing Review | Trade Review | Core Bridge | Review catalyst detail, filing context, volume fade, and fade-bias mistakes. | None. |
| `/academy/sell-the-news/` | News/Filing Review | Trade Review | Supporting Bridge | Review expectations versus actual details, pre-news run-up, and reaction quality. | None. |
| `/academy/multi-day-runner/` | Trade Review | Analytics | Core Bridge | Review catalyst persistence, volume across sessions, extension, exhaustion, and chase behavior. | None. |
| `/academy/chasing-stocks/` | Coaching | Execution Review | Core Bridge | Review repeated late entries, distance from planned levels, FOMO triggers, spread, and slippage. | None. |

## Visual Needs

No new SVGs were created in this pass.

Cross-listed Chart Reading lessons already have strong realistic chart visuals. The native style lessons would benefit from a later visual batch focused on playbook and context comparison rather than single-signal diagrams.

Recommended future SVGs:

- `trading-style-selector-flow.svg`
- `day-vs-swing-style-drift-review.svg`
- `scalping-spread-slippage-review.svg`
- `momentum-vs-chasing-context.svg`
- `pullback-controlled-vs-failed-dip.svg`
- `news-fade-reaction-review.svg`
- `multi-day-runner-continuation-vs-exhaustion.svg`

Visual requirements for this course:

- Use realistic red and green candlesticks.
- Use dark TradersLink dashboard styling with blue accent.
- Show style/playbook context with levels, volume, spread, or catalyst panels where useful.
- Avoid buy/sell labels and profit claims.
- Avoid implying a style or setup predicts the next move.
- Include `title` and `desc` tags.
- Keep labels readable on mobile.

## New Lessons Needed

No urgent new lesson is needed for this course.

Future optional additions could be considered during a later sequence or UI pass:

- `/academy/how-to-choose-a-trading-style/`
- `/academy/style-drift-in-trading/`
- `/academy/setup-qualification-checklist/`

Do not create those now unless a later audit finds users need more granular bridges between style selection, playbook creation, and review.

## Accuracy/Source Notes

No official source verification was required during this pass because the audit did not change rule-sensitive claims.

Future Accuracy/Source Audit should review lessons touching:

- Short selling borrow, locate, forced closeout, hard-to-borrow, and squeeze-risk details.
- Pattern day trader, margin, or account-restriction claims if any are later added to day-trading style lessons.
- Broker/platform-specific execution or order-type claims if any are later added to scalping lessons.

## Lesson Edits Completed

Edited cross-listed setup files:

- `academy/breakout-trading.md`
- `academy/breakdown-trading.md`
- `academy/level-reclaim.md`
- `academy/gap-fill-trading.md`

Edits were limited to:

- Removing premature hard `/features/...` links from lesson metadata and related product education sections.

No production website files were edited.

## Recommended Next Action

Continue Pass 1 lesson-level quality audits course by course.

Next course:

```text
Day Trading Workflow
```

Include:

- Day trading workflow, premarket trading, day-trading watchlist, market open trading, opening range, midday trading, power hour trading, after-hours trading, and trading session review.
- A restrained app bridge map centered on Session Review, Trade Review, Execution Review, Risk Review, Analytics, Coaching, and News/Filing Review.
- Targeted markdown edits only where lesson quality, wording, flow, visual need, or app-bridge restraint needs cleanup.
