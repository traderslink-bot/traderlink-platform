# TradersLink Academy UI Readiness Review: Risk Management And Trade Planning

Date: 2026-05-18

Audit pass: Pass 5 - UI Readiness Review

Course: Risk Management And Trade Planning

Status: complete

## Scope

Reviewed the 14-lesson Risk Management And Trade Planning course for future `/academy` UI planning. This pass did not implement routes, schemas, React components, JSX, CSS, or production website files.

Core lessons reviewed: trading plan, trading rules, risk management, position sizing, risk/reward, expectancy, stop loss, mental stop versus hard stop, max loss, daily loss limit, trade management, profit protection, overnight risk, and holding through news.

Planning references reviewed:

- `docs/content/traderslink-academy-course-index.md`
- `docs/content/traderslink-academy-quality-audit-risk-management.md`
- `docs/content/traderslink-academy-accuracy-source-audit-risk-management.md`
- `docs/content/traderslink-academy-visual-gap-audit-risk-management.md`
- `docs/content/traderslink-academy-quality-audit-workplan.md`

## Overall Verdict

Risk Management And Trade Planning is ready for UI planning, but it should not be treated as visually launch-polished yet.

The course has the right instructional flow: plan, rules, risk, sizing, expectancy, stops, account limits, trade management, event risk, and news/overnight exposure. The UI challenge is tone. Risk lessons should feel like a control system, not punishment, shame, or a promise that losses can be eliminated.

## UI Readiness Decision

| Area | Result | Notes |
|---|---|---|
| Course sequence | Ready | The 14-lesson sequence is coherent and should stay together. |
| Lesson metadata | Ready | Lessons have Academy metadata and a clear canonical course. |
| Progress tracking | Ready | Use `completed lessons / 14`. |
| Visual readiness | Planning ready, launch polish needed | Pass 4 identified a priority six-SVG risk visual batch. |
| App bridge | Ready with restraint | Risk Review, Trade Review, Execution Review, Analytics, and Coaching are natural surfaces later. |
| Production implementation | Not started | This pass is planning only. |

## Recommended UI Model

Present the course as a practical risk-control path:

| Section | Lessons | UI Note |
|---|---|---|
| Planning | Trading Plan, Trading Rules | Start with decisions made before the trade. |
| Risk Basics | Risk Management, Position Sizing, Risk/Reward, Expectancy, Stop Loss, Mental Stop Vs Hard Stop | Keep examples practical and avoid certainty language. |
| Account Protection | Max Loss, Daily Loss Limit | Treat as guardrails, not failure labels. |
| Trade Management | Trade Management, Profit Protection | Show decisions during and after a trade. |
| Event Risk | Overnight Risk, Holding Through News | Connect risk to gaps, catalysts, filings, and changing conditions. |

## Visual Readiness

Pass 4 identified these priority visuals before a polished production launch:

- `risk-management-course-map.svg`
- `position-sizing-risk-distance.svg`
- `risk-reward-expectancy-matrix.svg`
- `stop-loss-planned-vs-actual-fill.svg`
- `daily-loss-limit-shutdown-flow.svg`
- `overnight-news-risk-map.svg`

These missing visuals do not block UI planning. They should block calling the course visually polished for launch.

## App Bridge Placement

Use one restrained course-level bridge and keep lesson bridges review-focused:

- Risk Review for sizing, stops, max loss, and daily loss limit.
- Trade Review for planned versus actual risk.
- Execution Review for stop fills, slippage, spread, and order behavior.
- Analytics for repeated risk patterns.
- Coaching for rule drift and repeated account-protection breaks.

Do not imply the app prevents losses, enforces rules automatically, or guarantees discipline.

## Blocking Issues

UI planning blocker: none.

Production polish blocker: create or defer the priority six-SVG risk visual batch with an explicit launch decision.

## Result

Pass 5 UI Readiness Review is complete for Risk Management And Trade Planning.

The course is ready for UI planning as a 14-lesson risk-control path. Production launch should either include the priority risk visuals or intentionally accept a text-first version.

## Recommended Next Action

Next recommended audit:

```text
Pass 5: UI Readiness Review for Technical Indicators And Tools
```
