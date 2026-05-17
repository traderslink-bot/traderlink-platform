# Practice And Improvement Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course: Practice And Improvement

Status: complete

## Files Reviewed

- `academy/practice-trading.md`
- `academy/paper-trading.md`
- `academy/trade-replay-review.md`
- `academy/watchlist-review.md`
- `academy/setup-screenshot-review.md`
- `academy/trade-grading.md`
- `academy/one-rule-practice-drill.md`
- `academy/forward-testing-trading.md`
- `academy/trading-improvement-plan.md`

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`
- `docs/content/learn-image-asset-manifest.md`

## Overall Verdict

Practice And Improvement is ready as an Academy course after Trade Review And Improvement. The course successfully turns trade review into deliberate skill work without claiming that practice, paper trading, replay, or forward testing can guarantee future live trading results.

The 9-lesson course flow is strong:

1. Start with practice trading as a feedback loop.
2. Explain paper trading as useful simulation with real limitations.
3. Use replay review to reduce hindsight bias.
4. Review watchlists as preparation quality, not prediction.
5. Use setup screenshots to preserve context.
6. Grade trades by process instead of outcome.
7. Practice one rule at a time.
8. Build a forward-test sample without rushing conclusions.
9. Turn the evidence into an improvement plan.

The course did not need a broad rewrite. The main issue was visual/body alignment: two lessons declared the already verified practice-loop SVG in frontmatter but did not show it in the lesson body. This pass inserted the existing editor-verified visual into those lessons.

## Major Findings

1. The course flow is coherent and learner-friendly. It moves from general practice concepts into specific review methods, then finishes with sample-building and improvement planning.
2. The course avoids performance-promise language. Practice, paper trading, replay, and forward testing are consistently framed as process evidence rather than proof of future live results.
3. All 9 lessons include the required Academy structure: lesson objective, common mistakes, practical checklist, Apply This In Review, Trader Intelligence bridge, FAQ, and educational disclaimer.
4. Previous/next metadata is intact from `/academy/day-trading-session-review/` into `/academy/practice-trading/` and from `/academy/trading-improvement-plan/` into `/academy/trading-halts/`.
5. Existing SVG support is realistic and useful. The practice-loop, replay timeline, and setup-screenshot visuals use dark dashboard styling, realistic red and green candles, volume bars, review zones, hidden-future replay framing, educational labels, and `title`/`desc` tags.
6. `paper-trading.md` and `trading-improvement-plan.md` had `visual_assets` metadata but no visible in-body image. This pass added the already verified practice-loop SVG to both lesson bodies.
7. The course bridges naturally to Progress/Academy, Trade Review, Playbook Builder, Coaching, Analytics, Journal Notes, and Forward Testing without hard app route links.
8. No new SVGs were needed in this pass, and the image manifest did not need a new asset row.

## Lesson-Level Notes

| Lesson | Quality Result | Depth | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/academy/practice-trading/` | Pass | Strong opener that defines practice as focus, simulation, review, adjustment, and repetition. | Core bridge to Progress/Academy, Trade Review, and Analytics. | None. |
| `/academy/paper-trading/` | Pass after cleanup | Strong simulation lesson that teaches usefulness and limits without treating paper results as proof. | Core bridge to Trade Review and Risk Review. | Added the existing practice-loop SVG to the lesson body. |
| `/academy/trade-replay-review/` | Pass | Strong replay lesson focused on incomplete information, pause points, hindsight-bias reduction, and process review. | Core bridge to Trade Review, Replay Review, and Coaching. | None. |
| `/academy/watchlist-review/` | Pass | Strong preparation-review lesson separating useful watchlists from reactive ticker selection. | Core bridge to Session Review, Trade Review, and Analytics. | None. |
| `/academy/setup-screenshot-review/` | Pass | Strong visual-review lesson teaching before/during/after screenshots as evidence, not pretty chart collection. | Core bridge to Trade Review, Journal Notes, and Coaching. | None. |
| `/academy/trade-grading/` | Pass | Strong process-scoring lesson that separates green/red outcome from plan, risk, execution, and behavior quality. | Core bridge to Trade Review, Analytics, and Coaching. | None. |
| `/academy/one-rule-practice-drill/` | Pass | Strong focused-drill lesson that makes improvement observable and non-shaming. | Core bridge to Coaching, Progress/Academy, and mistake-pattern review. | None. |
| `/academy/forward-testing-trading/` | Pass | Strong sample-building lesson that teaches forward testing as evidence, not certainty. | Core bridge to Forward Testing, Playbook Builder, and Analytics. | None. |
| `/academy/trading-improvement-plan/` | Pass after cleanup | Strong capstone connecting review evidence, practice methods, rule changes, sample size, and review dates. | Core bridge to Progress/Academy, Trade Review, Coaching, and Analytics. | Added the existing practice-loop SVG to the lesson body. |

## App Bridge Map

| Lesson / Module | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Needed Edit |
|---|---|---|---|---|---|
| Practice trading | Progress/Academy | Trade Review / Analytics | Core Bridge | Track practice focus, completed review notes, repeated behavior patterns, and next practice loop. | None. |
| Paper trading | Trade Review | Risk Review / Execution Review | Core Bridge | Review simulated trades by plan, risk, size, fills, liquidity assumptions, and process behavior. | Added visible SVG. |
| Trade replay review | Trade Review | Coaching / Replay Review | Core Bridge | Reconstruct decision points with only the information available before the next candle. | None. |
| Watchlist review | Session Review | Trade Review / Analytics | Core Bridge | Compare planned watchlist names with reactive additions and review catalyst, spread, volume, and level filters. | None. |
| Setup screenshot review | Trade Review | Journal Notes / Coaching | Core Bridge | Attach visual evidence to decisions so context, levels, timing, and repeated patterns can be reviewed. | None. |
| Trade grading | Analytics | Trade Review / Coaching | Core Bridge | Track process grades across setup quality, risk, execution, management, and behavior. | None. |
| One-rule practice drill | Coaching | Progress/Academy / mistake-pattern review | Core Bridge | Track one observable rule across a sample and review when it held or broke. | None. |
| Forward testing | Forward Testing | Playbook Builder / Analytics | Core Bridge | Define a sample before drawing conclusions and review setup behavior across current conditions. | None. |
| Trading improvement plan | Progress/Academy | Trade Review / Coaching / Analytics | Core Bridge | Convert repeated review evidence into one priority, one practice method, one sample, and a review date. | Added visible SVG. |

## Visual Needs

No new SVGs were created in this pass. Existing realistic visual support is strong and now appears directly in every lesson that declares a visual asset.

Existing editor-verified SVGs:

- `public/images/learn/chart-reading/practice-trading-feedback-loop.svg`
- `public/images/learn/chart-reading/trade-replay-review-timeline.svg`
- `public/images/learn/chart-reading/setup-screenshot-review.svg`

Future optional SVGs:

- `watchlist-review-planned-vs-reactive.svg`
- `trade-grading-process-scorecard.svg`
- `one-rule-practice-drill-loop.svg`
- `forward-testing-sample-tracker.svg`
- `trading-improvement-plan-review-cycle.svg`

Visual requirements for any future Practice visuals:

- Use realistic trading-dashboard, chart-review, or scorecard context.
- Use red and green candlesticks when chart behavior appears.
- Prefer feedback loops, replay timelines, screenshot evidence, process scorecards, drill trackers, and sample trackers over abstract motivation graphics.
- Use dark TradersLink dashboard styling with blue accent.
- Avoid buy/sell labels, profit claims, performance promises, prediction language, and guaranteed-outcome language.
- Include `title` and `desc` tags.
- Keep labels readable on mobile.

## New Lessons Needed

No urgent new lesson is required before the next Pass 1 audit.

Future optional additions could be considered during a later sequence or UI-readiness pass:

- `/academy/backtesting-vs-forward-testing/`
- `/academy/trading-practice-schedule/`
- `/academy/how-to-build-a-trade-sample/`
- `/academy/process-scorecard-for-traders/`
- `/academy/reviewing-practice-vs-live-trades/`

Do not add these automatically during this Pass 1 cycle. They may be useful if the UI needs a deeper practice branch or if later app planning needs more direct support for scorecards, sample tracking, and practice-vs-live comparison.

## Accuracy/Source Notes

This pass was a lesson-level quality audit, not an official Accuracy/Source Audit. No external source verification was needed because this course is primarily process-based.

Future Accuracy/Source Audit should still verify:

- No lesson implies that practice, paper trading, replay, forward testing, or Trader Intelligence can guarantee future results.
- No lesson treats simulated fills as equivalent to live fills.
- No lesson suggests a trade direction, investment action, or buy/sell signal.
- Product claims remain aligned with the actual app implementation before hard app route links are added.

## Lesson Edits Completed

Edited course files:

- `academy/paper-trading.md`
- `academy/trading-improvement-plan.md`

Edits were limited to:

- Adding the existing editor-verified `practice-trading-feedback-loop.svg` to the lesson body where the same asset was already declared in frontmatter.

No production website files were edited.

## Verification Completed

- Confirmed all 9 lessons include the required Academy sections.
- Confirmed previous/next metadata matches the intended Practice And Improvement course chain.
- Confirmed local `/academy/.../` draft links resolve to existing markdown files.
- Confirmed no hard `/trader-intelligence/` or `/features/` route links remain in the reviewed Practice files.
- Confirmed no raw `[/academy/.../]` labels, encoding artifacts, buy/sell signal language, or guaranteed-profit language were introduced.
- Confirmed the three existing SVG assets include `title` and `desc` tags and support the actual lesson content.
- Confirmed no new image manifest row was needed because no new SVG asset was created.

## Recommended Next Action

Continue Pass 1 lesson-level quality audits course by course.

Next recommended audit:

```text
Pass 1: Lesson-Level Quality Audit for Academy Navigation Path Hubs
```

Include:

- Chart Reading Path, News And Filings Path, Trade Review Path, and Risk Discipline Path.
- A navigation-quality review that checks whether each hub helps learners choose the right course path without duplicating full course lessons.
- A restrained app bridge map centered on Progress/Academy, resume-learning, Trade Review, Risk Review, News/Filing Review, Coaching, and Analytics.
- Visual-readiness review for path-map SVGs, course cards, progress states, next-lesson affordances, and non-locked learning navigation.
