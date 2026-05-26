# TradersLink Academy Visual Gap Audit: Day Trading Workflow

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course: Day Trading Workflow

Status: complete

## Scope

Reviewed the 9-lesson Day Trading Workflow course for realistic session visual support, SVG file health, manifest tracking, label safety, and readiness for future Academy UI planning.

Lessons reviewed:

- `academy/day-trading-workflow.md`
- `academy/premarket-trading.md`
- `academy/day-trading-watchlist.md`
- `academy/market-open-trading.md`
- `academy/opening-range.md`
- `academy/midday-trading.md`
- `academy/power-hour-trading.md`
- `academy/after-hours-trading.md`
- `academy/day-trading-session-review.md`

Related files reviewed:

- `docs/content/traderslink-academy-quality-audit-day-trading-workflow.md`
- `docs/content/traderslink-academy-accuracy-source-audit-day-trading-workflow.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-image-asset-manifest.md`
- `public/academy/images/chart-reading/`

## Overall Verdict

Day Trading Workflow is visually strong and close to UI-ready from a lesson-visual standpoint.

The course already has a realistic five-SVG batch that supports the most important session concepts:

- Full day/session map.
- Premarket preparation.
- Market open and opening range.
- Midday and power hour.
- After-hours liquidity and headline context.

The visuals use realistic red and green candlesticks, volume bars, session dividers, reference zones, dark TradersLink dashboard styling, and review-focused labels. They support the course's core editorial position: a day trading workflow is a process for preparation, observation, execution discipline, and review, not a set of time-of-day signals.

No new SVGs are required before initial Academy UI planning. Two optional visuals would make the course more complete later: one watchlist-filter dashboard and one session-review dashboard.

## Coverage Summary

| Area | Lessons Reviewed | Current Direct Visual Coverage | Result |
|---|---:|---:|---|
| Session Framework | 1 | 1 | Strong coverage with full-session workflow map. |
| Preparation | 2 | 1 | Premarket is visually supported; watchlist filtering has no direct visual. |
| Market Open | 2 | 1 shared SVG | Strong coverage for market open and opening range. |
| Midday And Late Session | 2 | 1 shared SVG | Strong coverage for midday filtering and power hour reassessment. |
| Extended Hours | 1 | 1 | Strong coverage for after-hours liquidity/headline risk. |
| Review | 1 | 0 | Session-review lesson would benefit from a dashboard-style review visual. |

## Asset Verification

Direct scoped SVG references found in this course:

```text
5
```

Verification result:

- 7 of 9 lessons include direct `visual_assets` metadata.
- 7 of 9 lessons include in-body SVG placements.
- 5 of 5 unique scoped SVG references exist under `public/academy/images/chart-reading/`.
- 5 of 5 unique scoped SVG references are represented in `docs/content/learn-image-asset-manifest.md`.
- 5 of 5 unique scoped SVG files include embedded `title` tags.
- 5 of 5 unique scoped SVG files include embedded `desc` tags.
- No buy/sell signal labels, profit claims, guaranteed-outcome wording, or prediction framing were found in the scoped SVG labels.

Existing verified assets:

- `public/academy/images/chart-reading/day-trading-session-map.svg`
- `public/academy/images/chart-reading/premarket-session-workflow.svg`
- `public/academy/images/chart-reading/market-open-opening-range.svg`
- `public/academy/images/chart-reading/midday-power-hour-context.svg`
- `public/academy/images/chart-reading/after-hours-liquidity-context.svg`

## Lesson-Level Visual Recommendations

| Lesson | Current Visual Coverage | Pass 4 Recommendation |
|---|---:|---|
| `/academy/day-trading-workflow/` | 1 | Keep `day-trading-session-map.svg`; it is a strong course-opening visual. |
| `/academy/premarket-trading/` | 1 | Keep `premarket-session-workflow.svg`; it supports catalyst, PMH/PML, volume, spread, and open-transition risk. |
| `/academy/day-trading-watchlist/` | 0 | Add optional future `day-trading-watchlist-filter-panel.svg`; useful but not blocking. |
| `/academy/market-open-trading/` | 1 | Keep `market-open-opening-range.svg`; it supports open volatility and failed-extension review. |
| `/academy/opening-range/` | 1 | Reuse `market-open-opening-range.svg`; no separate opening-range asset required. |
| `/academy/midday-trading/` | 1 | Keep `midday-power-hour-context.svg`; it supports midday range and fading-volume behavior. |
| `/academy/power-hour-trading/` | 1 | Reuse `midday-power-hour-context.svg`; no separate power-hour asset required. |
| `/academy/after-hours-trading/` | 1 | Keep `after-hours-liquidity-context.svg`; it supports headline, spread, liquidity, and overnight-risk context. |
| `/academy/day-trading-session-review/` | 0 | Add optional future `day-trading-session-review-dashboard.svg`; useful for capstone review and app bridge clarity. |

## Optional Future Visuals

These visuals would improve polish, but they are not blockers because the current five-SVG batch already covers the main session flow.

| Priority | Proposed SVG | Related Lessons | Visual Type | Purpose | Suggested Placement |
|---:|---|---|---|---|---|
| 1 | `public/academy/images/chart-reading/day-trading-watchlist-filter-panel.svg` | `/academy/day-trading-watchlist/` | review_dashboard | Show a watchlist filter panel with catalyst, RVOL, liquidity, spread, nearby levels, and "planned vs reactive" labels. | Watchlist filtering example section. |
| 2 | `public/academy/images/chart-reading/day-trading-session-review-dashboard.svg` | `/academy/day-trading-session-review/` | session_review_dashboard | Show session segments, planned trades, reactive trades, execution notes, risk notes, behavior tags, and next-session adjustment. | Session review capstone intro or review checklist section. |

## Reuse Decisions

| Existing Asset | Reuse Decision | Reason |
|---|---|---|
| `day-trading-session-map.svg` | Keep | Best course opener; shows the full day as a workflow. |
| `premarket-session-workflow.svg` | Keep | Best premarket visual; shows preparation and extended-hours context. |
| `market-open-opening-range.svg` | Keep and reuse | Strong enough for both Market Open Trading and Opening Range. |
| `midday-power-hour-context.svg` | Keep and reuse | Strong enough for both Midday Trading and Power Hour Trading. |
| `after-hours-liquidity-context.svg` | Keep | Strong after-hours visual with headline, spread, liquidity, and overnight-risk context. |
| Premarket high/low, HOD/LOD, liquidity, spread, slippage visuals | Cross-link support only | These belong to supporting courses and should be linked where useful, not duplicated inside this course. |

## Visual Standards For Optional Additions

Any future Day Trading Workflow visuals should follow these standards:

- Dark TradersLink dashboard look with blue accent.
- Realistic red and green candlesticks where chart behavior matters.
- Volume bars and session dividers where time-of-day context matters.
- Watchlist, filter, or review panels where process is the lesson.
- Labels should describe context and review questions, not entry commands.
- No buy/sell signal language.
- No profit claims.
- No guaranteed-outcome language.
- No implication that a session segment predicts the next move.
- Include embedded `title` and `desc` tags.
- Keep labels readable on mobile.

## Manifest Notes

No manifest rows were added or changed because no SVGs were created or edited in this pass.

When optional Day Trading Workflow visuals are created, add manifest rows with:

- Asset file path.
- Related Academy lesson(s).
- Learning track: `Day Trading Workflow`.
- Visual type.
- Purpose.
- Suggested placement.
- Alt text.
- Status: `editor_verified` only after confirming the visual supports the final lesson text.
- Commit SHA.

## App Bridge Notes

The visual layer should support the existing restrained bridge map:

- Session Review for premarket, market open, midday, power hour, after-hours, and daily recap tagging.
- Trade Review for planned versus reactive trades from watchlist and session context.
- Execution Review for market-open, opening-range, spread, slippage, order type, and fill-quality review.
- Risk Review for after-hours, overnight, power-hour, and changing-session risk.
- News/Filing Review for catalyst and filing verification in premarket and after-hours contexts.
- Coaching for boredom trades, open pressure, late-day forcing, and reactive additions.
- Analytics for comparing outcomes and behavior across session segments.

The visuals should teach process review, not product features or prediction.

## Result

Pass 4 is complete for Day Trading Workflow.

The course is visually strong enough for initial Academy UI planning. Optional future visuals should focus on watchlist filtering and session review dashboards.

## Recommended Next Action

Next recommended audit:

```text
Pass 4: Visual Gap Audit for Swing Trading Workflow
```
