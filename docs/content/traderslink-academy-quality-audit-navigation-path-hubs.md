# Academy Navigation Path Hubs Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course group: Academy Navigation Path Hubs

Status: complete

## Files Reviewed

- `academy/chart-reading-path.md`
- `academy/news-and-filings-path.md`
- `academy/trade-review-path.md`
- `academy/risk-discipline-path.md`

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`
- `docs/content/learn-image-asset-manifest.md`

## Overall Verdict

The Academy Navigation Path Hubs are ready as navigation support for the Academy. They should stay outside the numbered course sequence and function as entry points, resume-learning helpers, and guided route maps for users who want a path without being locked into one.

The 4 path hubs are useful because they do not try to replace the full courses. They summarize the recommended learning order, explain why the order matters, and connect users to completed lessons:

1. Chart Reading Path organizes levels, structure, candles, patterns, volume, workflow, and review.
2. News And Filings Path organizes catalysts, press releases, SEC filings, dilution, news categories, and news-trade review.
3. Trade Review Path organizes completed-trade review, risk review, execution review, mistake patterns, practice, and Trader Intelligence review support.
4. Risk Discipline Path organizes plans, rules, sizing, stops, loss limits, trade management, discipline behaviors, and review/practice.

The hubs did not need a broad rewrite. The main issue was stale lesson links in the News And Filings Path and Risk Discipline Path where older shorthand slugs no longer matched the completed Academy lesson files. This pass corrected those links to the current completed lesson slugs.

## Major Findings

1. The hubs are correctly framed as navigation support, not a new course that users must complete.
2. The content supports non-locked learning. Each hub recommends an order while explicitly or implicitly allowing users to jump to relevant lessons.
3. All 4 hubs include the required path-hub structure: path objective, recommended course flow, common mistakes, practical checklist, Apply This In Review, Trader Intelligence bridge, FAQ, and educational disclaimer.
4. Previous/next metadata is intact across the hub chain: Chart Reading Path, News And Filings Path, Trade Review Path, Risk Discipline Path, then back to the broader Academy navigation lesson.
5. Existing SVG support is strong. All 4 path-map assets are editor-verified in the manifest, appear in the lesson body, include `title` and `desc` tags, and use educational labels without buy/sell, prediction, profit, or guaranteed-outcome language.
6. News And Filings Path had stale links for old or grouped slugs such as `/academy/news-driven-stocks/`, `/academy/atm-offering/`, `/academy/sec-filings/forms-3-4-5/`, and `/academy/fda-approval/`. This pass replaced them with completed lesson slugs.
7. Risk Discipline Path had stale links for `/academy/mental-stop/`, `/academy/hard-stop/`, `/academy/holding-losers/`, and `/academy/cutting-winners/`. This pass replaced them with completed lesson slugs.
8. No new SVGs were needed, and the image manifest did not need new asset rows.

## Hub-Level Notes

| Hub | Quality Result | Navigation Result | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/academy/chart-reading-path/` | Pass | Strong path from levels to structure, candles, patterns, volume, workflow, and review. | Supporting bridge to Trade Review, Chart Context Review, and Progress/Academy. | None. |
| `/academy/news-and-filings-path/` | Pass after cleanup | Strong path for source-first catalyst and filing education, now linking to current completed lessons. | Core bridge to News/Filing Review, Trade Review, Risk Review, and Analytics. | Fixed stale lesson links. |
| `/academy/trade-review-path/` | Pass | Strong bridge from education into completed-trade review and practice without over-promoting the app. | Core bridge to Trade Review, Execution Review, Coaching, Analytics, and Progress/Academy. | None. |
| `/academy/risk-discipline-path/` | Pass after cleanup | Strong route through planning, risk, trade management, discipline behaviors, and review/practice. | Core bridge to Risk Review, Coaching, Trade Review, and Analytics. | Fixed stale lesson links. |

## App Bridge Map

| Hub | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Needed Edit |
|---|---|---|---|---|---|
| Chart Reading Path | Progress/Academy | Trade Review / Analytics | Supporting Bridge | Use the hub to resume chart-reading lessons and later review how levels, candles, volume, and patterns appeared in completed trades. | None. |
| News And Filings Path | News/Filing Review | Trade Review / Risk Review / Analytics | Core Bridge | Use the hub to move from source review into completed-trade review around catalysts, filings, dilution, and news reactions. | Fixed stale links. |
| Trade Review Path | Trade Review | Execution Review / Coaching / Analytics / Progress/Academy | Core Bridge | Use the hub as the strongest education-to-app bridge, focused on completed trades, review evidence, mistake patterns, and practice focus. | None. |
| Risk Discipline Path | Risk Review | Coaching / Trade Review / Analytics | Core Bridge | Use the hub to connect rules, sizing, stops, limits, and behavior patterns to completed-trade review. | Fixed stale links. |

## Visual Needs

No new SVGs were created in this pass. Existing realistic path-map support is strong and already manifest-tracked.

Existing editor-verified SVGs:

- `public/images/academy/chart-reading/academy-chart-reading-path-map.svg`
- `public/images/academy/chart-reading/academy-news-filings-path-map.svg`
- `public/images/academy/chart-reading/academy-trade-review-path-map.svg`
- `public/images/academy/chart-reading/academy-risk-discipline-path-map.svg`

Future optional UI visuals or states:

- Course-card progress states for each path hub.
- Resume-learning affordance showing the next unfinished lesson.
- Completed-lesson count by path.
- Recommended next lesson card that can coexist with free navigation.
- Lightweight path filter for beginner, chart reading, news/filings, trade review, risk/discipline, and practice.

Visual requirements for future path-hub visuals:

- Keep the path maps educational and navigational, not promotional.
- Use realistic chart, filing, review, or dashboard context where useful.
- Use red and green candlesticks only when chart behavior appears.
- Use dark TradersLink dashboard styling with blue accent.
- Avoid buy/sell labels, profit claims, performance promises, prediction language, and guaranteed-outcome language.
- Include `title` and `desc` tags.
- Keep labels readable on mobile.

## New Hubs Needed

No urgent new path hub is required before the next audit phase.

Future optional path hubs could be considered after UI planning:

- `/academy/start-here-path/`
- `/academy/day-trading-path/`
- `/academy/swing-trading-path/`
- `/academy/technical-indicators-path/`
- `/academy/small-cap-dilution-path/`

Do not add these automatically during this Pass 1 cycle. The current four hubs are enough to support the first Academy UI/navigation plan.

## Accuracy/Source Notes

This pass was a lesson-level quality audit, not an official Accuracy/Source Audit. No external source verification was needed because this pass focused on navigation quality, completed lesson links, visual support, and bridge restraint.

Future Accuracy/Source Audit should still verify:

- Path hubs do not imply lessons remove trading risk or guarantee learning outcomes.
- News and filing path descriptions stay aligned with source-sensitive SEC and filing lessons.
- Product bridge language remains limited to review support and progress/navigation support until app routes and product claims are stable.
- The UI does not imply locked sequencing if the intended learner experience allows free movement across lessons.

## Lesson Edits Completed

Edited hub files:

- `academy/news-and-filings-path.md`
- `academy/risk-discipline-path.md`

Edits were limited to:

- Replacing stale or grouped News And Filings lesson links with current completed lesson slugs.
- Replacing stale Risk Discipline lesson links with current completed lesson slugs.

No production website files were edited.

## Verification Completed

- Confirmed all 4 hubs include the required path-hub sections.
- Confirmed local `/academy/.../` draft links resolve to existing markdown files, including nested SEC filing lessons.
- Confirmed previous/next metadata matches the intended path-hub chain.
- Confirmed no hard `/trader-intelligence/` or `/features/` route links remain in the reviewed path hubs.
- Confirmed no raw `[/academy/.../]` labels, encoding artifacts, buy/sell signal language, or guaranteed-profit language were introduced.
- Confirmed the four existing SVG assets include `title` and `desc` tags and support the actual hub content.
- Confirmed no new image manifest row was needed because no new SVG asset was created.

## Recommended Next Action

The course-by-course Pass 1 lesson-level quality audit cycle is complete.

Next recommended audit:

```text
Pass 2: Academy-Wide Sequence And Cross-Link Audit
```

Include:

- Full Academy course order and path-hub placement.
- Course-to-course transitions.
- Previous/next metadata across every Academy course boundary.
- Cross-listed lessons and whether their primary metadata is still correct.
- Related lesson links that should support learning flow rather than SEO filler.
- Continue-learning and resume-learning implications for the future UI.
