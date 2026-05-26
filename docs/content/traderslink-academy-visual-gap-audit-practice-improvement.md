# TradersLink Academy Visual Gap Audit: Practice And Improvement

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course: Practice And Improvement

Status: complete

## Scope

Reviewed the 9-lesson Practice And Improvement course for practice-loop, simulation, replay, screenshot, grading, drill, forward-test, and improvement-plan visual support.

Lessons reviewed:

- `academy/practice-trading.md`
- `academy/paper-trading.md`
- `academy/trade-replay-review.md`
- `academy/watchlist-review.md`
- `academy/setup-screenshot-review.md`
- `academy/trade-grading.md`
- `academy/one-rule-practice-drill.md`
- `academy/forward-testing-trading.md`
- `academy/trading-improvement-plan.md`

## Overall Verdict

Practice And Improvement is visually strong enough for initial Academy UI planning, with optional gaps.

The course already has three realistic SVGs:

- Practice trading feedback loop.
- Trade replay review timeline.
- Setup screenshot review chart.

These visuals support the course's core idea: improvement comes from focused practice, incomplete-information review, screenshots, and repeated adjustment. The course would still benefit from future scorecard and tracker visuals for grading, one-rule drills, forward testing, and improvement planning.

## Coverage Summary

| Area | Lessons Reviewed | Current Direct Visual Coverage | Result |
|---|---:|---:|---|
| Practice Foundation | 2 | 1 shared SVG | Strong. |
| Replay Practice | 1 | 1 SVG | Strong. |
| Preparation Review | 1 | 0 | Optional watchlist-review dashboard needed. |
| Visual Review | 1 | 1 SVG | Strong. |
| Process Scoring | 1 | 0 | Optional grading scorecard needed. |
| Focused Drills | 1 | 0 | Optional drill-loop visual needed. |
| Sample Building | 1 | 0 | Optional forward-test tracker needed. |
| Improvement Planning | 1 | 1 shared SVG | Adequate; future plan cycle visual optional. |

## Asset Verification

Direct scoped SVG references found in this course:

```text
3
```

Verification result:

- 5 of 9 lessons include direct `visual_assets` metadata.
- 5 of 9 lessons include in-body SVG placements.
- 3 of 3 unique scoped SVG references exist under `public/academy/images/chart-reading/`.
- 3 of 3 unique scoped SVG references are represented in `docs/content/learn-image-asset-manifest.md`.
- 3 of 3 unique scoped SVG files include embedded `title` tags.
- 3 of 3 unique scoped SVG files include embedded `desc` tags.
- No buy/sell labels, profit claims, guaranteed-outcome wording, or unsafe prediction framing were found in the scoped SVG labels.

Existing verified assets:

- `public/academy/images/chart-reading/practice-trading-feedback-loop.svg`
- `public/academy/images/chart-reading/trade-replay-review-timeline.svg`
- `public/academy/images/chart-reading/setup-screenshot-review.svg`

## Optional Future Visuals

| Priority | Proposed SVG | Related Lessons | Visual Type | Purpose | Suggested Placement |
|---:|---|---|---|---|---|
| 1 | `public/academy/images/chart-reading/watchlist-review-planned-vs-reactive.svg` | Watchlist review | review_dashboard | Show planned ticker selection versus reactive ticker chasing. | Watchlist review example. |
| 2 | `public/academy/images/chart-reading/trade-grading-process-scorecard.svg` | Trade grading | scorecard_dashboard | Show process grading across plan, risk, execution, management, and behavior. | Grading framework section. |
| 3 | `public/academy/images/chart-reading/one-rule-practice-drill-loop.svg` | One-rule practice drill | practice_loop_diagram | Show one rule, sample, review note, adjustment, and next drill. | Drill workflow section. |
| 4 | `public/academy/images/chart-reading/forward-testing-sample-tracker.svg` | Forward testing trading | sample_tracker_dashboard | Show sample count, rule consistency, market context, and review notes without proof claims. | Forward-test tracker section. |
| 5 | `public/academy/images/chart-reading/trading-improvement-plan-review-cycle.svg` | Trading improvement plan | improvement_cycle_diagram | Show evidence, priority, method, sample, review date, and adjustment cycle. | Capstone section. |

## Manifest Notes

No manifest rows were added or changed because no SVGs were created or edited in this pass.

## Result

Pass 4 is complete for Practice And Improvement.

The course is visually strong enough for initial Academy UI planning. Optional future visuals should focus on scorecards, sample trackers, and practice cycles.

