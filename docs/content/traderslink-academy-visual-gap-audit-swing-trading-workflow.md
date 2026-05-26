# TradersLink Academy Visual Gap Audit: Swing Trading Workflow

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course: Swing Trading Workflow

Status: complete

## Scope

Reviewed the 8-lesson Swing Trading Workflow course for realistic multi-session visual support, SVG file health, manifest tracking, label safety, and readiness for future Academy UI planning.

Lessons reviewed:

- `academy/swing-trading-for-beginners.md`
- `academy/swing-trading-risk-management.md`
- `academy/swing-trading-support-resistance.md`
- `academy/swing-trading-volume.md`
- `academy/swing-trading-catalysts.md`
- `academy/swing-trading-earnings.md`
- `academy/swing-trading-news-risk.md`
- `academy/swing-trading-small-caps.md`

Related files reviewed:

- `docs/content/traderslink-academy-quality-audit-swing-trading-workflow.md`
- `docs/content/traderslink-academy-accuracy-source-audit-swing-trading-workflow.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-image-asset-manifest.md`
- `public/academy/images/chart-reading/`

## Overall Verdict

Swing Trading Workflow is visually strong enough for initial Academy UI planning.

The course already has a focused three-SVG batch that matches the lesson flow:

- Multi-session swing planning with support/resistance zones, daily candles, volume, and overnight review context.
- Gap and invalidation risk across earnings, news, and overnight exposure.
- Catalyst and volume timeline review across several sessions.

The visuals support the course's core teaching idea: swing trading is multi-session planning and review under overnight, event, liquidity, and thesis-change risk. They do not frame chart areas, catalysts, volume, or gaps as buy/sell signals or guaranteed outcomes.

No new SVGs are required before initial Academy UI planning. Optional future visuals would improve polish around hold-decision review, thesis-change review, and small-cap swing risk.

## Coverage Summary

| Area | Lessons Reviewed | Current Direct Visual Coverage | Result |
|---|---:|---:|---|
| Swing Workflow Foundation | 1 | 1 | Strong coverage with the multi-session plan visual. |
| Swing Risk | 1 | 1 | Strong gap/invalidation coverage. |
| Levels And Planning | 1 | 1 | Strong reuse of the multi-session level map. |
| Volume And Catalysts | 2 | 1 shared SVG | Strong coverage with the catalyst timeline visual. |
| Earnings And News Risk | 2 | 1 shared SVG | Strong reuse of the gap-risk visual. |
| Small-Cap Swing Context | 1 | 1 shared SVG | Adequate coverage with catalyst timeline; future small-cap risk dashboard would add precision. |

## Asset Verification

Direct scoped SVG references found in this course:

```text
3
```

Verification result:

- 8 of 8 lessons include direct `visual_assets` metadata.
- 8 of 8 lessons include in-body SVG placements.
- 3 of 3 unique scoped SVG references exist under `public/academy/images/chart-reading/`.
- 3 of 3 unique scoped SVG references are represented in `docs/content/learn-image-asset-manifest.md`.
- 3 of 3 unique scoped SVG files include embedded `title` tags.
- 3 of 3 unique scoped SVG files include embedded `desc` tags.
- No buy/sell signal labels, profit claims, guaranteed-outcome wording, or prediction framing were found in the scoped SVG labels.

Existing verified assets:

- `public/academy/images/chart-reading/swing-trading-multi-session-plan.svg`
- `public/academy/images/chart-reading/swing-trading-risk-gap-context.svg`
- `public/academy/images/chart-reading/swing-trading-catalyst-timeline.svg`

## Lesson-Level Visual Recommendations

| Lesson | Current Visual Coverage | Pass 4 Recommendation |
|---|---:|---|
| `/academy/swing-trading-for-beginners/` | 1 | Keep `swing-trading-multi-session-plan.svg`; it is the right opener for multi-session planning. |
| `/academy/swing-trading-risk-management/` | 1 | Keep `swing-trading-risk-gap-context.svg`; it clearly supports overnight gap and invalidation review. |
| `/academy/swing-trading-support-resistance/` | 1 | Reuse `swing-trading-multi-session-plan.svg`; no separate level visual is required before UI planning. |
| `/academy/swing-trading-volume/` | 1 | Keep `swing-trading-catalyst-timeline.svg`; it supports volume expansion, follow-through, and pullback review. |
| `/academy/swing-trading-catalysts/` | 1 | Reuse `swing-trading-catalyst-timeline.svg`; it matches catalyst timing and reaction review. |
| `/academy/swing-trading-earnings/` | 1 | Reuse `swing-trading-risk-gap-context.svg`; it supports earnings gap and event-risk framing. |
| `/academy/swing-trading-news-risk/` | 1 | Reuse `swing-trading-risk-gap-context.svg`; it supports known versus surprise news risk and thesis review. |
| `/academy/swing-trading-small-caps/` | 1 | Reuse `swing-trading-catalyst-timeline.svg`; add optional future `small-cap-swing-risk-dashboard.svg` for dilution, float, liquidity, and event-risk context. |

## Optional Future Visuals

These visuals would improve the course, but they are not blockers because every lesson already has realistic chart support.

| Priority | Proposed SVG | Related Lessons | Visual Type | Purpose | Suggested Placement |
|---:|---|---|---|---|---|
| 1 | `public/academy/images/chart-reading/swing-trade-hold-decision-review.svg` | `/academy/swing-trading-for-beginners/`, `/academy/swing-trading-volume/` | review_dashboard_with_chart | Show a non-signal hold/reduce/exit-review framework based on original thesis, level reaction, volume, event risk, and time in trade. | Review checklist or "Should the Plan Still Be Valid?" section. |
| 2 | `public/academy/images/chart-reading/swing-trading-thesis-change-review.svg` | `/academy/swing-trading-news-risk/`, `/academy/swing-trading-earnings/` | event_review_dashboard | Show planned thesis, new event information, gap/reaction context, and review notes without implying a direction. | News-risk or earnings thesis-change section. |
| 3 | `public/academy/images/chart-reading/small-cap-swing-risk-dashboard.svg` | `/academy/swing-trading-small-caps/` | risk_review_dashboard | Show float, dilution check, liquidity, spread, filing/news event, and overnight gap-risk review in one compact panel. | Small-cap swing risk checklist section. |

## Reuse Decisions

| Existing Asset | Reuse Decision | Reason |
|---|---|---|
| `swing-trading-multi-session-plan.svg` | Keep and reuse | Best visual for course opener and swing support/resistance planning. |
| `swing-trading-risk-gap-context.svg` | Keep and reuse | Best visual for overnight, earnings, news, and invalidation risk. |
| `swing-trading-catalyst-timeline.svg` | Keep and reuse | Best visual for catalyst timing, volume expansion, follow-through, pullback review, and small-cap context. |
| Chart Reading support/resistance and Volume course visuals | Cross-link support only | These should support related lessons through links, not duplicate the Swing course's own multi-session visual set. |

## Visual Standards For Optional Additions

Any future Swing Trading Workflow visuals should follow these standards:

- Dark TradersLink dashboard look with blue accent.
- Realistic red and green daily candlesticks where chart behavior matters.
- Support, resistance, invalidation, or event-risk zones where relevant.
- Volume bars when teaching participation, liquidity, catalyst reaction, or exhaustion.
- Review dashboards where the lesson is about process, thesis, or event reassessment.
- Labels should describe context, questions, and review points, not entry commands.
- No buy/sell signal language.
- No profit claims.
- No guaranteed-outcome language.
- No implication that a swing setup, catalyst, earnings event, or gap predicts the next move.
- Include embedded `title` and `desc` tags.
- Keep labels readable on mobile.

## Manifest Notes

No manifest rows were added or changed because no SVGs were created or edited in this pass.

When optional Swing Trading Workflow visuals are created, add manifest rows with:

- Asset file path.
- Related Academy lesson(s).
- Learning track: `Swing Trading Workflow`.
- Visual type.
- Purpose.
- Suggested placement.
- Alt text.
- Status: `editor_verified` only after confirming the visual supports the final lesson text.
- Commit SHA.

## App Bridge Notes

The visual layer should support the existing restrained bridge map:

- Trade Review for comparing planned swing thesis versus what actually changed across sessions.
- Risk Review for overnight, gap, event, sizing, and invalidation review.
- News/Filing Review for catalyst, earnings, filing, and surprise-news checks.
- Analytics for reviewing which swing conditions tend to create discipline problems.
- Coaching for holding too long, forcing a day trade into a swing, ignoring thesis changes, or reacting to overnight news.
- Journal Notes for documenting the original thesis, level map, event calendar, and post-trade lesson.

The visuals should teach review and process, not product features, alerts, prediction, or guaranteed improvement.

## Result

Pass 4 is complete for Swing Trading Workflow.

The course is visually strong enough for initial Academy UI planning. Optional future visuals should focus on hold-decision review, thesis-change review, and small-cap swing risk dashboards.

## Recommended Next Action

Next recommended audit:

```text
Pass 4: Visual Gap Audit for News, Catalysts And SEC Filings
```
