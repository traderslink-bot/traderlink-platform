# TradersLink Academy UI Readiness Review: Trading Foundations

Date: 2026-05-18

Audit pass: Pass 5 - UI Readiness Review

Course: Trading Foundations

Status: complete

## Scope

Reviewed Trading Foundations for future `/academy` UI planning. This pass did not implement routes, schemas, React components, JSX, CSS, or production website files.

Primary course lessons reviewed:

- `academy/start-here.md`
- `academy/how-to-use-traderslink-academy.md`
- `academy/what-is-a-stock-and-how-does-a-trade-work.md`
- `academy/stock-market-sessions-and-order-flow-basics.md`
- `academy/day-trading-for-beginners.md`
- `academy/day-trading-vs-swing-trading.md`

Cross-listed course lessons reviewed:

- `academy/trading-plan.md`
- `academy/trading-rules.md`
- `academy/risk-management.md`
- `academy/position-sizing.md`
- `academy/stop-loss.md`
- `academy/trade-risk-review.md`

Planning references reviewed:

- `docs/content/traderslink-academy-course-index.md`
- `docs/content/traderslink-academy-quality-audit-trading-foundations.md`
- `docs/content/traderslink-academy-accuracy-source-audit-trading-foundations.md`
- `docs/content/traderslink-academy-visual-gap-audit-trading-foundations.md`
- `docs/content/traderslink-academy-sequence-cross-link-audit.md`
- `docs/content/learn-academy-visual-ui-readiness-review.md`
- `docs/content/traderslink-academy-quality-audit-workplan.md`

## Overall Verdict

Trading Foundations is ready for UI planning, but not for production implementation without a final content-model decision for cross-listed lessons.

The course has the right beginner sequence:

1. Academy onboarding.
2. How to use the Academy.
3. Basic stock/trade mechanics.
4. Market sessions and order-flow basics.
5. Beginner day-trading orientation.
6. Day trading versus swing trading.
7. Trading plan.
8. Trading rules.
9. Risk management.
10. Position sizing.
11. Stop loss.
12. Trade risk review.

The first six lessons have direct Trading Foundations metadata. The last six are intentionally cross-listed from Risk Management And Trade Planning and Trade Review And Improvement. That is the right editorial decision, but the UI must support course-specific placement without rewriting each lesson's canonical metadata.

## UI Readiness Decision

| Area | Result | Notes |
|---|---|---|
| Course sequence | Ready with content-model caveat | The 12-lesson sequence is clear in the course index. Cross-listed lessons need course-specific placement overrides. |
| Lesson metadata | Mostly ready | Primary lessons have direct course/module/order metadata. Cross-listed lessons keep canonical metadata in their owning courses. |
| Previous/next behavior | Needs UI decision | Primary lesson frontmatter supports early sequence navigation. Cross-listed lessons use canonical previous/next, so a Foundations course page needs its own in-course next/previous map. |
| Course page grouping | Ready | Recommended modules: Start Here, Market Mechanics, Market Basics, Process Basics, Risk Basics, Review Basics. |
| Lesson cards | Ready with derived fields | Cards can use title, slug, module, level, canonical/cross-listed label, completion state, and optional visual status. |
| Progress tracking | Ready with shared lesson completion | Completion should be stored by lesson slug and count toward every course/path where that lesson appears. |
| Visual readiness | UI-planning ready, not visual-complete | Pass 4 planned four beginner visuals. Missing visuals should not block UI planning, but at least a course-map visual would improve first-viewport polish before launch. |
| App bridge | Ready with restraint | Use surface labels such as Progress/Academy, Trade Review, Risk Review, Execution Review, Session Review, Coaching, and Analytics. Avoid hard app route links until routes are stable. |
| Production implementation | Not started | This pass is planning only. |

## Course Page Requirements

The Trading Foundations course page should include:

- Course title: `Trading Foundations`.
- Course description: beginner foundation before charts, scanners, filings, indicators, setups, and advanced workflows.
- Audience: new traders and users who need market mechanics, planning, risk, and review before advanced lessons.
- Course outcome: understand what trading is, why planning matters, what risk means, and why review is part of improvement.
- Module grouping:
  - Start Here.
  - Market Mechanics.
  - Market Basics.
  - Process Basics.
  - Risk Basics.
  - Review Basics.
- Lesson count: 12 displayed lessons.
- Cross-listed indicator on lessons 7-12.
- Progress count based on completed displayed lessons.
- Continue-learning card based on first incomplete displayed lesson.
- Recommended next course after completion: Chart Reading And Market Structure.

## Lesson Card Requirements

Each lesson card should be able to show:

- Lesson title.
- Slug.
- Module label.
- Academy level.
- Display order within the course.
- Completion state.
- Estimated depth or reading level if the UI later adds it.
- Visual availability:
  - `none`.
  - `planned`.
  - `existing`.
- Canonical course if cross-listed.
- Suggested next lesson inside the displayed course.

For Trading Foundations, the displayed order should come from the course index or a future course-membership layer, not only from each lesson's frontmatter.

## Cross-Listed Lesson Behavior

This is the main UI planning requirement.

The following lessons are part of the Trading Foundations displayed course path, but their canonical metadata belongs to another course:

| Display Order | Lesson | Canonical Course | UI Requirement |
|---:|---|---|---|
| 7 | `/academy/trading-plan/` | Risk Management And Trade Planning | Show inside Foundations as a cross-listed process-basics lesson. |
| 8 | `/academy/trading-rules/` | Risk Management And Trade Planning | Show inside Foundations as a cross-listed process-basics lesson. |
| 9 | `/academy/risk-management/` | Risk Management And Trade Planning | Show inside Foundations as a cross-listed risk-basics lesson. |
| 10 | `/academy/position-sizing/` | Risk Management And Trade Planning | Show inside Foundations as a cross-listed risk-basics lesson. |
| 11 | `/academy/stop-loss/` | Risk Management And Trade Planning | Show inside Foundations as a cross-listed risk-basics lesson. |
| 12 | `/academy/trade-risk-review/` | Trade Review And Improvement | Show inside Foundations as a cross-listed review-basics lesson. |

Recommended behavior:

- Keep canonical lesson ownership unchanged.
- Let a lesson appear in multiple course/path contexts.
- Store completion by lesson slug, not by course placement.
- Count completed cross-listed lessons toward each course where they appear.
- Show a small "Also in Risk Management" or "Also in Trade Review" label where useful.
- Use displayed-course navigation when the learner is inside the Foundations course page.
- Use canonical recommended previous/next only when the learner enters from the canonical course context.

## Progress And Completion Expectations

Trading Foundations completion should feel encouraging, not gamified into false competence.

Recommended progress behavior:

- A lesson is complete when the user explicitly marks it complete.
- Course progress is `completed displayed lessons / 12`.
- Cross-listed lessons count once per user account but can contribute to multiple course progress totals.
- Completion should unlock a suggested next lesson/card, but not lock or hide other lessons.
- Completion should avoid statements like "You are ready to trade."
- Completion copy should say what the learner should understand next, not promise skill or profit.

Suggested course-completion message:

```text
Trading Foundations complete. Next, continue into Chart Reading And Market Structure to learn how traders read levels, structure, candles, patterns, and volume in context.
```

## Visual Readiness Notes

Pass 4 identified four priority beginner visuals:

- `public/academy/images/chart-reading/trading-foundations-learning-map.svg`
- `public/academy/images/chart-reading/stock-trade-mechanics-bid-ask.svg`
- `public/academy/images/chart-reading/market-sessions-liquidity-timeline.svg`
- `public/academy/images/chart-reading/day-vs-swing-timeframe-risk.svg`

UI planning can begin before these SVGs exist, but production polish would be stronger if at least the course-map visual is created before launch.

Recommended visual handling:

- Do not reference planned SVG paths in production until files exist and are manifest-verified.
- If a lesson has no visual, render a text-first lesson layout with no broken placeholder.
- Use existing visuals only when the lesson declares `visual_assets` or the manifest explicitly supports reuse.
- Keep the first-course page restrained: one strong course map is better than decorative panels.

## App Bridge Placement

The app bridge should stay light in the UI:

- Course page: optional small note that later review tools can help connect lessons to completed trades.
- Lesson pages: keep existing Trader Intelligence Bridge sections in content.
- Progress UI: can mention completed-lesson progress and review habits.
- No hard app route links until product routes and copy are stable.
- Do not imply the app predicts trades, grades trader worth, or guarantees improvement.

Natural surfaces for future UI cards:

| Lesson Area | Future App Surface | Bridge Strength |
|---|---|---|
| Start Here / How To Use | Progress/Academy | Light |
| Trade mechanics | Execution Review / Trade Review | Supporting |
| Sessions/order flow | Session Review / Execution Review | Supporting |
| Day-trading basics | Trade Review / Coaching | Core |
| Plan/rules | Trade Review / Coaching | Core |
| Risk/sizing/stops | Risk Review / Analytics / Execution Review | Core |
| Trade risk review | Risk Review / Trade Review | Core |

## Route And Schema Planning Notes

No production route or schema changes were made.

Future implementation should decide:

- Whether course membership lives in markdown frontmatter, a course index file, generated content registry, or CMS-like data layer.
- How to represent cross-listed lesson placements without duplicating lesson files.
- Whether `recommended_previous` and `recommended_next` should be canonical lesson navigation only, with course-specific navigation generated separately.
- Whether course pages should use `academy_course` from frontmatter or a separate course syllabus model.
- How progress is persisted and whether anonymous users get local progress before account login.

Minimum UI data needed for this course:

```text
course_id
course_title
course_slug
course_order
module_title
display_order
lesson_slug
lesson_title
canonical_course
is_cross_listed
academy_level
completion_enabled
visual_status
recommended_next_display_lesson
```

## Blocking Issues

No content-quality, accuracy, or production-safety blocker was found.

UI planning blocker:

- A course-specific membership/navigation model is needed before production implementation because cross-listed lesson frontmatter does not contain Trading Foundations display order.

Visual polish blocker:

- None for UI planning.
- Create the Trading Foundations course-map SVG before production launch if the first-course experience needs a stronger first impression.

## Result

Pass 5 UI Readiness Review is complete for Trading Foundations.

The course is ready for UI planning. Production implementation should wait until the course membership/cross-listing model is decided.

## Recommended Next Action

Next recommended audit:

```text
Pass 5: UI Readiness Review for Chart Reading And Market Structure
```
