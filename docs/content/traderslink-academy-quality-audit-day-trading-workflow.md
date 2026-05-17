# Day Trading Workflow Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course: Day Trading Workflow

Status: complete

## Files Reviewed

- `docs/content/drafts/learn/day-trading-workflow.md`
- `docs/content/drafts/learn/premarket-trading.md`
- `docs/content/drafts/learn/day-trading-watchlist.md`
- `docs/content/drafts/learn/market-open-trading.md`
- `docs/content/drafts/learn/opening-range.md`
- `docs/content/drafts/learn/midday-trading.md`
- `docs/content/drafts/learn/power-hour-trading.md`
- `docs/content/drafts/learn/after-hours-trading.md`
- `docs/content/drafts/learn/day-trading-session-review.md`

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`

## Overall Verdict

Day Trading Workflow is ready as the next Academy course after Trading Styles And Playbooks. The course works because it teaches the trading day as an operating process instead of a set of time-of-day signals.

The course has a strong instructor flow:

1. Open with the full session workflow.
2. Move into premarket preparation and watchlist filtering.
3. Teach the market open and opening range as high-volatility review segments.
4. Teach midday and power hour as discipline and reassessment segments.
5. Teach after-hours as headline, liquidity, spread, and overnight-risk context.
6. Finish with a session review lesson that turns the whole workflow into feedback.

The course does not need a broad rewrite. The useful work during this pass was targeted:

- Confirm the 9-lesson workflow chain and previous/next metadata.
- Confirm lesson structure, examples, checklists, review prompts, FAQ, disclaimers, and anti-guarantee language.
- Confirm time-of-day lessons avoid becoming signal lessons.
- Fix one invalid after-hours related-link target from `/learn/earnings-reports/` to `/learn/earnings-news/`.
- Document restrained Trader Intelligence bridge opportunities around Session Review, Trade Review, Execution Review, Risk Review, Analytics, Coaching, and News/Filing Review.

## Major Findings

1. The course flow is strong. It gives users a full intraday operating map from preparation through review.
2. The lessons avoid time-of-day signal framing. Premarket, the open, opening range, midday, power hour, and after-hours are taught as reviewable contexts, not automatic opportunities.
3. The visual support is already useful. Existing SVGs support the session map, premarket workflow, opening range, midday/power-hour context, and after-hours liquidity context.
4. Watchlist and session review lessons are important bridges. They prevent the course from becoming chart-only and keep the learner focused on selection, process, risk, and feedback.
5. App bridging is natural but should stay restrained. These lessons map strongly to Session Review, Trade Review, Execution Review, Risk Review, Analytics, Coaching, and News/Filing Review.
6. A later UI pass should decide how cross-listed support lessons appear in the course UI, especially Day Trading, Day Trading For Beginners, VWAP, VWAP Reclaim, Premarket High/Low, HOD/LOD, RVOL, Liquidity, Spread, Slippage, Overtrading, and Max Loss.
7. One invalid related link was corrected. After-Hours Trading now points to the local Academy lesson `/learn/earnings-news/`.

## Lesson-Level Notes

| Lesson | Quality Result | Depth | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/learn/day-trading-workflow/` | Pass | Strong course opener with full session map and process framing. | Core bridge to Session Review and Trade Review. | No edit needed. |
| `/learn/premarket-trading/` | Pass | Strong preparation lesson with catalyst, PMH/PML, spread, liquidity, and open-transition risk. | Core bridge to Session Review and News/Filing Review. | No edit needed. |
| `/learn/day-trading-watchlist/` | Pass | Strong selection/filter lesson that reduces scanner noise and reactive additions. | Core bridge to Session Review and Trade Review. | No edit needed. |
| `/learn/market-open-trading/` | Pass | Strong market-open lesson with volatility, spread, premarket-level interaction, and failed move review. | Core bridge to Execution Review and Session Review. | No edit needed. |
| `/learn/opening-range/` | Pass | Strong opening-range lesson that avoids mechanical break language. | Core bridge to Trade Review and Execution Review. | No edit needed. |
| `/learn/midday-trading/` | Pass | Strong filtering lesson around low-volume chop, boredom, and forced trades. | Core bridge to Coaching and Session Review. | No edit needed. |
| `/learn/power-hour-trading/` | Pass | Strong final-hour reassessment lesson with emotional and close-planning context. | Core bridge to Session Review and Coaching. | No edit needed. |
| `/learn/after-hours-trading/` | Pass after cleanup | Strong extended-hours lesson with headline/source, spread, liquidity, and overnight-risk context. | Core bridge to News/Filing Review and Risk Review. | Fixed invalid earnings link. |
| `/learn/day-trading-session-review/` | Pass | Strong capstone that turns the workflow into process review. | Core bridge to Session Review, Trade Review, and Analytics. | No edit needed. |

## App Bridge Map

| Lesson | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Needed Edit |
|---|---|---|---|---|---|
| `/learn/day-trading-workflow/` | Session Review | Trade Review | Core Bridge | Review completed trades by session segment, setup type, risk, execution, and behavior. | None. |
| `/learn/premarket-trading/` | Session Review | News/Filing Review | Core Bridge | Review whether premarket trades came from catalyst/source prep or excitement. | None. |
| `/learn/day-trading-watchlist/` | Session Review | Trade Review | Core Bridge | Review planned watchlist trades versus reactive additions. | None. |
| `/learn/market-open-trading/` | Execution Review | Session Review | Core Bridge | Review open trades by timing, premarket levels, spread, slippage, and pressure behavior. | None. |
| `/learn/opening-range/` | Trade Review | Execution Review | Core Bridge | Review opening-range entries by time window, range width, hold/failure, and risk distance. | None. |
| `/learn/midday-trading/` | Coaching | Session Review | Core Bridge | Review boredom trades, low-volume chop, repeated entries, and giveback patterns. | None. |
| `/learn/power-hour-trading/` | Session Review | Coaching | Core Bridge | Review final-hour trades by volume return, close plan, frustration, and forced decisions. | None. |
| `/learn/after-hours-trading/` | News/Filing Review | Risk Review | Core Bridge | Review headline/source quality, spread, liquidity, and overnight exposure after the close. | Fixed invalid related lesson link. |
| `/learn/day-trading-session-review/` | Session Review | Analytics | Core Bridge | Review session segments, repeated mistakes, strengths, and next-session adjustments. | None. |

## Visual Needs

No new SVGs were created in this pass. The existing visuals are useful and realistic:

- `public/images/learn/chart-reading/day-trading-session-map.svg`
- `public/images/learn/chart-reading/premarket-session-workflow.svg`
- `public/images/learn/chart-reading/market-open-opening-range.svg`
- `public/images/learn/chart-reading/midday-power-hour-context.svg`
- `public/images/learn/chart-reading/after-hours-liquidity-context.svg`

Future optional SVGs:

- `day-trading-watchlist-filter-panel.svg`
- `day-trading-session-review-dashboard.svg`

Visual requirements for any future workflow visuals:

- Use realistic red and green candlesticks.
- Use dark TradersLink dashboard styling with blue accent.
- Show time-of-day context, volume, spread/liquidity, or review panels where useful.
- Avoid buy/sell labels and profit claims.
- Avoid implying a session segment predicts the next move.
- Include `title` and `desc` tags.
- Keep labels readable on mobile.

## New Lessons Needed

No urgent new lesson is needed for this course.

Future optional additions could be considered during a later UI or visual pass:

- `/learn/day-trading-routine-checklist/`
- `/learn/how-to-review-your-watchlist-after-the-session/`

Do not create those now unless a later audit finds users need more granular bridges between workflow, watchlist quality, and session review.

## Accuracy/Source Notes

No official source verification was required during this pass because the audit did not change market-session rules or broker-specific claims.

Future Accuracy/Source Audit should review lessons touching:

- Exact premarket and after-hours session times if those are later added.
- Broker-specific extended-hours order handling if added later.
- Pattern day trader, margin, or account restriction claims if added later.
- Exchange or official session definitions if the course becomes more rule-specific.

## Lesson Edits Completed

Edited Day Trading Workflow files:

- `docs/content/drafts/learn/after-hours-trading.md`

Edits were limited to:

- Fixing an invalid related lesson link from `/learn/earnings-reports/` to `/learn/earnings-news/`.

No production website files were edited.

## Recommended Next Action

Continue Pass 1 lesson-level quality audits course by course.

Next course:

```text
Swing Trading Workflow
```

Include:

- Swing trading for beginners, swing trading risk management, swing trading support and resistance, swing trading volume, swing trading catalysts, swing trading earnings, swing trading news risk, and small-cap swing trading.
- A restrained app bridge map centered on Trade Review, Risk Review, Journal Notes, News/Filing Review, Analytics, Coaching, and Playbook Builder.
- Targeted markdown edits only where lesson quality, wording, flow, visual need, or app-bridge restraint needs cleanup.
