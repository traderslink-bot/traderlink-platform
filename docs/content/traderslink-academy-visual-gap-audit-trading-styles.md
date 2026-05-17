# TradersLink Academy Visual Gap Audit: Trading Styles And Playbooks

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course: Trading Styles And Playbooks

Status: complete

## Scope

Reviewed the 15-lesson Trading Styles And Playbooks course for realistic visual support, cross-listed SVG reuse, style/playbook visual gaps, manifest tracking, and readiness for future Academy UI planning.

Lessons reviewed:

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

Related files reviewed:

- `docs/content/traderslink-academy-quality-audit-trading-styles.md`
- `docs/content/traderslink-academy-accuracy-source-audit-trading-styles.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-image-asset-manifest.md`
- `public/academy/images/chart-reading/`

## Overall Verdict

Trading Styles And Playbooks is content-ready, but it is only partially visually ready.

The cross-listed Chart Reading setup lessons already have strong realistic chart visuals for breakouts, breakdowns, reclaims, and gap fills. Those visuals should be reused because they already show red/green candlesticks, levels, volume, failed outcomes, extended-entry risk, and non-signal educational labels.

The native Trading Styles lessons still need a targeted visual batch. The missing visuals are not decorative; they should help users compare styles, spot style drift, understand execution-sensitive styles, and separate planned playbooks from reactive behavior.

No new SVGs were created during this audit pass. The output of this pass is a concrete visual gap plan for a later Trading Styles SVG batch.

## Coverage Summary

| Area | Lessons Reviewed | Current Direct Visual Coverage | Result |
|---|---:|---:|---|
| Style Selector | 6 | 0 | Needs a style-selector/playbook visual batch covering style comparison, day versus swing drift, scalping execution, short risk, and momentum versus chasing. |
| Native Setup Types | 5 | 0 | Needs visuals for pullbacks/dip buys, news fade, sell-the-news, and multi-day runner context. |
| Cross-Listed Chart Setups | 4 | 10 | Strong existing coverage for breakout, breakdown, reclaim, and gap fill. |
| Psychology Cross-List | 1 | 0 | Chasing Stocks has no direct visual, but can share the future momentum-versus-chasing visual. |

## Asset Verification

Direct scoped SVG references found in this course:

```text
10
```

Verification result:

- 4 of 15 lessons include direct `visual_assets` metadata.
- 4 of 15 lessons include in-body SVG placements.
- 10 of 10 scoped SVG references exist under `public/academy/images/chart-reading/`.
- 10 of 10 scoped SVG references are represented in `docs/content/learn-image-asset-manifest.md`.
- 10 of 10 scoped SVG files include embedded `title` tags.
- 10 of 10 scoped SVG files include embedded `desc` tags.
- No missing files or broken manifest rows were found.
- Existing anti-guarantee labels such as "not a guaranteed continuation" and "not a guaranteed target" are appropriate.

Existing verified assets:

- `public/academy/images/chart-reading/breakout-with-volume-context.svg`
- `public/academy/images/chart-reading/failed-breakout-review.svg`
- `public/academy/images/chart-reading/extended-breakout-chase-risk.svg`
- `public/academy/images/chart-reading/breakdown-with-volume-context.svg`
- `public/academy/images/chart-reading/failed-breakdown-reclaim-review.svg`
- `public/academy/images/chart-reading/extended-breakdown-chase-risk.svg`
- `public/academy/images/chart-reading/level-reclaim-hold.svg`
- `public/academy/images/chart-reading/level-reclaim-failure.svg`
- `public/academy/images/chart-reading/gap-fill-zone-map.svg`
- `public/academy/images/chart-reading/failed-gap-fill-hold-review.svg`

## Priority Visual Batch

These are the highest-value visuals to create before this course is considered visually ready for production UI.

| Priority | Proposed SVG | Related Lessons | Visual Type | Purpose | Suggested Placement |
|---:|---|---|---|---|---|
| 1 | `public/academy/images/chart-reading/trading-style-selector-flow.svg` | `/academy/trading-styles/`, `/academy/day-trading/`, `/academy/swing-trading/` | review_workflow_map | Show style categories as review/playbook buckets: timeframe, risk, execution, catalyst exposure, and review questions. | Trading Styles opener. |
| 2 | `public/academy/images/chart-reading/day-vs-swing-style-drift-review.svg` | `/academy/day-trading/`, `/academy/swing-trading/` | comparison_review_dashboard | Show a failed intraday idea being renamed as a swing hold versus a planned swing trade with separate risk. | Day Trading or Swing Trading style-drift section. |
| 3 | `public/academy/images/chart-reading/scalping-spread-slippage-review.svg` | `/academy/scalping-stocks/` | realistic_trading_dashboard | Show tight versus wide spread, fast candles, order type, fill quality, and trade count review. | Scalping execution-risk section. |
| 4 | `public/academy/images/chart-reading/short-selling-risk-stack.svg` | `/academy/short-selling-basics/` | risk_context_dashboard | Show borrow/locate, price rising against a short, squeeze risk, halt risk, and forced-risk review without short-signal language. | Short Selling risk context section. |
| 5 | `public/academy/images/chart-reading/momentum-vs-chasing-context.svg` | `/academy/momentum-trading/`, `/academy/chasing-stocks/` | realistic_candlestick_chart | Compare planned momentum near structure with late extended chase behavior. | Momentum lesson and Chasing capstone. |
| 6 | `public/academy/images/chart-reading/pullback-controlled-vs-failed-dip.svg` | `/academy/pullbacks-and-dip-buy-setups/` | realistic_candlestick_chart | Show controlled pullback to context versus disorderly failed dip/averaging-down risk. | Pullbacks and dip-buy examples section. |
| 7 | `public/academy/images/chart-reading/news-fade-reaction-review.svg` | `/academy/news-fade/`, `/academy/sell-the-news/` | catalyst_reaction_dashboard | Show catalyst headline/source, initial reaction, volume fade, spread/liquidity context, and failed-fade caution. | News Fade lesson; also reusable for Sell The News. |
| 8 | `public/academy/images/chart-reading/multi-day-runner-continuation-vs-exhaustion.svg` | `/academy/multi-day-runner/` | multi_session_candlestick_chart | Show multi-session continuation context, increasing attention, exhaustion risk, volume changes, and chase-risk review. | Multi-Day Runner context section. |

## Optional Future Visuals

These are useful but lower priority than the visual batch above.

| Proposed SVG | Related Lessons | Reason To Defer |
|---|---|---|
| `public/academy/images/chart-reading/playbook-builder-setup-sample-grid.svg` | `/academy/trading-styles/`, future Playbook Builder UI | Better suited to a later UI/App Bridge pass once product route and component language are stable. |
| `public/academy/images/chart-reading/setup-qualification-checklist.svg` | Future `/academy/setup-qualification-checklist/` | The lesson does not exist yet; create only if a future sequence audit adds it. |
| `public/academy/images/chart-reading/style-drift-in-trading.svg` | Future `/academy/style-drift-in-trading/` | Could become its own lesson later, but current day/swing style-drift visual should cover the immediate need. |

## Reuse Decisions

| Existing Asset | Reuse Decision | Reason |
|---|---|---|
| Breakout SVG set | Keep and reuse | These visuals already support breakout quality, failed breakouts, and extended chase risk. |
| Breakdown SVG set | Keep and reuse | These visuals already support breakdown quality, failed breakdowns, and extension risk. |
| Level reclaim SVG set | Keep and reuse | These visuals already support reclaim hold/failure review without prediction. |
| Gap fill SVG set | Keep and reuse | These visuals already support gap zone and failed gap-fill context. |
| Volume-spike chase visual | Reference only | It can inspire momentum/chasing visuals, but it is canonical to the Volume course. |
| Swing-trading workflow visuals | Reference only | They support the dedicated Swing Workflow course, but this style course needs a concise style-drift comparison. |
| Day-trading workflow visuals | Reference only | They support the dedicated Day Trading Workflow course, but this course needs style-level comparison rather than session workflow. |

## Lesson-Level Visual Recommendations

| Lesson | Current Visual Coverage | Pass 4 Recommendation |
|---|---:|---|
| `/academy/trading-styles/` | 0 | Add `trading-style-selector-flow.svg` as the course-opening visual. |
| `/academy/day-trading/` | 0 | Use `day-vs-swing-style-drift-review.svg`; do not duplicate the full Day Trading Workflow course map. |
| `/academy/swing-trading/` | 0 | Use `day-vs-swing-style-drift-review.svg`; focus on planned swing risk versus renamed failed day trade. |
| `/academy/scalping-stocks/` | 0 | Add `scalping-spread-slippage-review.svg`; this lesson needs execution-condition visuals. |
| `/academy/short-selling-basics/` | 0 | Add `short-selling-risk-stack.svg`; show mechanics/risk, not short setup instruction. |
| `/academy/momentum-trading/` | 0 | Add `momentum-vs-chasing-context.svg`; this is central to the lesson. |
| `/academy/pullbacks-and-dip-buy-setups/` | 0 | Add `pullback-controlled-vs-failed-dip.svg`; show controlled context versus failed dip risk. |
| `/academy/breakout-trading/` | 3 | Keep existing breakout SVG set. No new visual needed. |
| `/academy/breakdown-trading/` | 3 | Keep existing breakdown SVG set. No new visual needed. |
| `/academy/level-reclaim/` | 2 | Keep existing reclaim SVG set. No new visual needed. |
| `/academy/gap-fill-trading/` | 2 | Keep existing gap-fill SVG set. No new visual needed. |
| `/academy/news-fade/` | 0 | Add `news-fade-reaction-review.svg`; show source/catalyst, reaction, volume fade, and failed-fade caution. |
| `/academy/sell-the-news/` | 0 | Reuse `news-fade-reaction-review.svg`; frame as reaction review, not a command. |
| `/academy/multi-day-runner/` | 0 | Add `multi-day-runner-continuation-vs-exhaustion.svg`; show multi-session attention and exhaustion risk. |
| `/academy/chasing-stocks/` | 0 | Reuse `momentum-vs-chasing-context.svg`; this is the capstone behavior visual. |

## Visual Standards For The Style Batch

All future Trading Styles visuals should follow these standards:

- Dark TradersLink dashboard look with blue accent.
- Realistic red and green candlesticks where price behavior matters.
- Volume bars where participation or fade matters.
- Spread/slippage panels where execution-sensitive styles are taught.
- Catalyst/source panels where news reactions are taught.
- Labels should describe context and review questions, not entry commands.
- No buy/sell signal language.
- No profit claims.
- No guaranteed-outcome language.
- No implication that any style or setup predicts the next move.
- Include embedded `title` and `desc` tags.
- Keep labels readable on mobile.

Avoid these labels:

```text
Best style
Buy breakout
Sell breakdown
Fade here
Guaranteed continuation
Profit target
Easy setup
```

Prefer these labels:

```text
style category
execution sensitivity
style drift review
planned momentum
late chase risk
controlled pullback
failed dip review
catalyst reaction review
continuation context
exhaustion risk
```

## Manifest Notes

No manifest rows were added or changed because no SVGs were created or edited in this pass.

When the Trading Styles visual batch is created, add manifest rows with:

- Asset file path.
- Related Academy lesson(s).
- Learning track: `Trading Styles And Playbooks`.
- Visual type.
- Purpose.
- Suggested placement.
- Alt text.
- Status: `editor_verified` only after confirming the visual supports the final lesson text.
- Commit SHA.

## App Bridge Notes

The visual layer should support the existing restrained bridge map:

- Playbook Builder for style/setup labels, valid/invalid examples, and setup qualification.
- Trade Review for completed trades by style, setup, timeframe, and plan adherence.
- Analytics for repeated outcomes by style and setup category.
- Session Review for day-trading timing and style drift.
- Execution Review for scalping, spread, slippage, order type, fill quality, breakout/reclaim entries, and chase entries.
- Risk Review for short selling, swing holds, overnight/news exposure, multi-day runner volatility, and failed setup response.
- Coaching for chasing, FOMO, style drift, and reactive entries.

The visuals should teach classification and completed-trade review, not product features or prediction.

## Result

Pass 4 is complete for Trading Styles And Playbooks.

The course is partially visually ready because the cross-listed Chart Reading setup lessons are well supported, but the native style/playbook lessons need an eight-SVG visual batch before the course should be considered fully UI-ready.

## Recommended Next Action

Next recommended audit:

```text
Pass 4: Visual Gap Audit for Day Trading Workflow
```
