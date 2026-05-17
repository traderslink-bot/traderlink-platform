# TradersLink Academy Visual Gap Audit: Risk Management And Trade Planning

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course: Risk Management And Trade Planning

Status: complete

## Scope

Reviewed the 14-lesson Risk Management And Trade Planning course for realistic visual support, missing SVG opportunities, reuse decisions, and readiness for future Academy UI planning.

Lessons reviewed:

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

Related files reviewed:

- `docs/content/traderslink-academy-quality-audit-risk-management.md`
- `docs/content/traderslink-academy-accuracy-source-audit-risk-management.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-image-asset-manifest.md`
- `public/academy/images/chart-reading/`

## Overall Verdict

Risk Management And Trade Planning is content-ready, but it is not yet visually ready for a polished Academy UI experience.

The course currently has no direct `visual_assets` metadata or in-body SVG placements across its 14 lessons. That is acceptable for text review, but risk concepts are abstract enough that learners would benefit from a small set of realistic, reusable visuals before this course is treated as UI-ready.

This course should not receive random decorative images. The right visuals are practical teaching aids:

- Risk workflow maps.
- Position-size and stop-distance diagrams.
- Planned-risk versus actual-risk examples.
- Expectancy sample review panels.
- Loss-limit shutdown flows.
- Overnight/news gap-risk maps.

No new SVGs were created during this audit pass. The output of this pass is a concrete visual gap plan for a later risk-management SVG batch.

## Coverage Summary

| Area | Lessons Reviewed | Current Direct Visual Coverage | Result |
|---|---:|---:|---|
| Planning | 2 | 0 | Needs one course/map style visual, but not a separate image for every planning lesson. |
| Risk Basics | 6 | 0 | Highest visual need. Position sizing, risk/reward, expectancy, and stop behavior need practical diagrams. |
| Account Protection | 2 | 0 | Needs a loss-limit shutdown/review flow visual. |
| Trade Management | 2 | 0 | Needs one visual showing planned management decisions versus reactive changes. |
| Event Risk | 2 | 0 | Needs one gap/news-risk visual. Existing swing gap visuals are related but too swing-specific for this core course. |

## Asset Verification

Direct scoped SVG references found in this course:

```text
0
```

Verification result:

- 0 of 14 lessons include direct `visual_assets` metadata.
- 0 of 14 lessons include in-body SVG placements.
- No missing files were found because the course has no direct visual references yet.
- No manifest rows needed correction because no risk-course visuals are currently assigned.
- Existing nearby visuals such as `swing-trading-risk-gap-context.svg` and `academy-risk-discipline-path-map.svg` can inform future design, but they should not replace dedicated risk-management visuals.

## Priority Visual Batch

These are the highest-value visuals to create before this course is considered visually ready for production UI.

| Priority | Proposed SVG | Related Lessons | Visual Type | Purpose | Suggested Placement |
|---:|---|---|---|---|---|
| 1 | `public/academy/images/chart-reading/risk-management-course-map.svg` | `/academy/trading-plan/`, `/academy/trading-rules/`, `/academy/risk-management/` | review_workflow_map | Show how plan, rules, risk per trade, stop, size, max loss, and review connect. | Course opener or Trading Plan intro. |
| 2 | `public/academy/images/chart-reading/position-sizing-risk-distance.svg` | `/academy/position-sizing/`, `/academy/risk-management/`, `/academy/stop-loss/` | realistic_risk_dashboard | Show account risk, stop distance, share size, spread/liquidity caution, and planned dollar risk. | Position Sizing calculation section. |
| 3 | `public/academy/images/chart-reading/risk-reward-expectancy-sample.svg` | `/academy/risk-reward-ratio/`, `/academy/win-rate-reward-risk-and-expectancy/` | sample_review_panel | Show win rate, average winner, average loser, reward/risk, and expectancy as completed-trade sample review, not prediction. | Expectancy sample section. |
| 4 | `public/academy/images/chart-reading/stop-loss-planned-vs-actual-fill.svg` | `/academy/stop-loss/`, `/academy/mental-stop-vs-hard-stop/` | realistic_candlestick_dashboard | Show planned stop area, fast move, possible slippage/gap fill, and review labels without implying stop certainty. | Stop behavior and execution-risk section. |
| 5 | `public/academy/images/chart-reading/daily-loss-limit-shutdown-flow.svg` | `/academy/max-loss/`, `/academy/daily-loss-limit/` | decision_flow_dashboard | Show loss-limit threshold, stop-trading rule, lockout/review step, and next-session reset. | Daily Loss Limit practical process section. |
| 6 | `public/academy/images/chart-reading/overnight-news-risk-map.svg` | `/academy/overnight-risk/`, `/academy/holding-through-news/` | realistic_candlestick_dashboard | Show close, overnight headline/event, gap beyond planned level, liquidity/spread review, and position-size caution. | Overnight/news risk intro visual. |

## Optional Future Visuals

These are useful but lower priority than the six visuals above:

| Proposed SVG | Related Lessons | Reason To Defer |
|---|---|---|
| `public/academy/images/chart-reading/trade-management-decision-tree.svg` | `/academy/trade-management/`, `/academy/profit-protection/` | Useful for post-entry management, but the course can start with the broader risk batch first. |
| `public/academy/images/chart-reading/rules-break-review-loop.svg` | `/academy/trading-rules/`, `/academy/daily-loss-limit/` | May overlap with the later Trading Psychology visual pass. |
| `public/academy/images/chart-reading/planned-risk-vs-actual-risk-review.svg` | `/academy/risk-management/`, `/academy/trade-management/`, `/academy/trade-risk-review/` | Strong candidate, but may belong in the Trade Review And Improvement visual pass. |

## Reuse Decisions

Do not rely on existing visuals as the main support for this course.

| Existing Asset | Reuse Decision | Reason |
|---|---|---|
| `public/academy/images/chart-reading/academy-risk-discipline-path-map.svg` | Course navigation support only | It is a path-hub map, not a lesson-level risk example. |
| `public/academy/images/chart-reading/swing-trading-risk-gap-context.svg` | Do not use as core Risk course visual | It is useful for swing-specific event risk, but the core risk course needs a broader version. |
| `public/academy/images/chart-reading/after-hours-liquidity-context.svg` | Do not use as core Risk course visual | It supports after-hours trading and liquidity context, not general overnight/news exposure. |
| `public/academy/images/chart-reading/slippage-fast-move-liquidity-review.svg` | Reference design style only | It can inspire stop/fill risk visuals, but it does not teach stop-loss planning directly. |

## Lesson-Level Visual Recommendations

| Lesson | Current Visual Coverage | Pass 4 Recommendation |
|---|---:|---|
| `/academy/trading-plan/` | 0 | Add `risk-management-course-map.svg` as a course-opening visual. |
| `/academy/trading-rules/` | 0 | Reuse `risk-management-course-map.svg`; optional later rules-break review loop if needed. |
| `/academy/risk-management/` | 0 | Reuse `risk-management-course-map.svg`; also support with position-sizing or planned-risk visual. |
| `/academy/position-sizing/` | 0 | Add `position-sizing-risk-distance.svg`; this is a priority visual. |
| `/academy/risk-reward-ratio/` | 0 | Use `risk-reward-expectancy-sample.svg`; avoid target/profit-promise framing. |
| `/academy/win-rate-reward-risk-and-expectancy/` | 0 | Use `risk-reward-expectancy-sample.svg`; make it sample-review based. |
| `/academy/stop-loss/` | 0 | Add `stop-loss-planned-vs-actual-fill.svg`; this should show stop execution caveats. |
| `/academy/mental-stop-vs-hard-stop/` | 0 | Reuse `stop-loss-planned-vs-actual-fill.svg`; optionally show discipline delay versus order risk in future. |
| `/academy/max-loss/` | 0 | Reuse or pair with `daily-loss-limit-shutdown-flow.svg`; focus on account-protection thresholds. |
| `/academy/daily-loss-limit/` | 0 | Add `daily-loss-limit-shutdown-flow.svg`; this is a priority visual. |
| `/academy/trade-management/` | 0 | Optional `trade-management-decision-tree.svg`; lower priority than sizing/stops/loss limits. |
| `/academy/profit-protection/` | 0 | Optional reuse of trade-management visual; avoid profit-claim language. |
| `/academy/overnight-risk/` | 0 | Add `overnight-news-risk-map.svg`; this is a priority visual. |
| `/academy/holding-through-news/` | 0 | Reuse `overnight-news-risk-map.svg`; show event exposure and review, not prediction. |

## Visual Standards For The Risk Batch

All future risk visuals should follow these standards:

- Dark TradersLink dashboard look with blue accent.
- Realistic chart, risk table, or review-dashboard panels.
- Red and green candlesticks where chart behavior matters.
- Clear support/invalidation zones where stop or gap behavior is shown.
- Simple math examples where position sizing, risk/reward, or expectancy are taught.
- Labels must be educational, not trade instructions.
- No buy/sell signal language.
- No profit claims.
- No guaranteed-outcome language.
- Include embedded `title` and `desc` tags.
- Keep labels readable on mobile.

## Manifest Notes

No manifest rows were added or changed because no SVGs were created or edited in this pass.

When the risk visual batch is created, add manifest rows with:

- Asset file path.
- Related Academy lesson(s).
- Learning track: `Risk Management And Trade Planning`.
- Visual type.
- Purpose.
- Suggested placement.
- Alt text.
- Status: `editor_verified` only after confirming the visual supports the final lesson text.
- Commit SHA.

## App Bridge Notes

The visual layer should support the existing restrained bridge map:

- Risk Review for planned versus actual risk, sizing, stop movement, max loss, daily loss limits, and event exposure.
- Trade Review for plan adherence, management decisions, and profit-protection decisions.
- Execution Review for stop fills, slippage, spread, liquidity, and order behavior.
- Analytics for reward/risk, win rate, average winner/loss, expectancy, and repeated risk patterns.
- Coaching for rule breaks, revenge risk, overtrading near loss limits, and behavior under pressure.

The visuals should not become product ads. They should teach the learner what to review after completed trades.

## Result

Pass 4 is complete for Risk Management And Trade Planning.

The course is not visually ready yet because it has no direct lesson visuals. The next content-only asset step for this course is a targeted six-SVG risk-management visual batch.

## Recommended Next Action

Next recommended audit:

```text
Pass 4: Visual Gap Audit for Technical Indicators And Tools
```
