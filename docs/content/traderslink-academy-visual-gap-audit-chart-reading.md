# TradersLink Academy Visual Gap Audit: Chart Reading And Market Structure

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course group: Chart Reading And Market Structure

Included submodules:

- Candlestick Patterns In Context
- Chart Patterns In Context

Status: complete

## Files Reviewed

Core Chart Reading lessons:

- `academy/support-and-resistance.md`
- `academy/how-to-draw-support-and-resistance.md`
- `academy/support-levels.md`
- `academy/resistance-levels.md`
- `academy/key-levels-trading.md`
- `academy/breakout-trading.md`
- `academy/breakdown-trading.md`
- `academy/level-breakout.md`
- `academy/level-reclaim.md`
- `academy/price-rejection.md`
- `academy/break-of-structure.md`
- `academy/swing-highs-and-swing-lows.md`
- `academy/higher-highs-higher-lows.md`
- `academy/lower-highs-lower-lows.md`
- `academy/pivot-levels.md`
- `academy/previous-day-high-low.md`
- `academy/premarket-high-low.md`
- `academy/high-of-day.md`
- `academy/low-of-day.md`
- `academy/new-high-of-day.md`
- `academy/compression.md`
- `academy/consolidation.md`
- `academy/gap-fill-trading.md`

Supporting submodules reviewed:

- `academy/candlestick-patterns.md`
- `academy/candlestick-patterns/*.md`
- `academy/chart-patterns.md`
- `academy/chart-patterns/*.md`

Related audit and planning files:

- `docs/content/traderslink-academy-quality-audit-chart-reading.md`
- `docs/content/traderslink-academy-accuracy-source-audit-chart-reading.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-academy-visual-ui-readiness-review.md`
- `docs/content/learn-image-asset-manifest.md`

## Overall Verdict

Chart Reading And Market Structure is visually ready for the initial Academy UI.

This course has the strongest existing visual coverage in the Academy. The visuals are realistic, chart-native, and instructionally useful rather than decorative. They use red and green candlesticks, support/resistance zones, volume bars where useful, dark TradersLink dashboard styling, and educational labels that avoid buy/sell instructions and outcome promises.

No new SVG files are required from this Pass 4 audit.

## Coverage Summary

| Area | Lessons Reviewed | Visual Coverage | Result |
|---|---:|---|---|
| Core Chart Reading | 23 | 23 of 23 lessons have `visual_assets` and matching in-body images. | Pass |
| Candlestick Patterns In Context | 14 | 14 of 14 lessons have `visual_assets` and matching in-body images. | Pass |
| Chart Patterns In Context | 14 | 13 of 14 lessons have direct `visual_assets`; VWAP Reclaim is a cross-listed Technical Indicators lesson and can wait for the Technical Indicators visual pass. | Pass with deferral |

Scoped asset verification:

- 69 unique SVG references were found across the reviewed lesson files.
- All 69 referenced SVG files exist under `public/academy/images/chart-reading/`.
- All 69 referenced SVG files are represented in `docs/content/learn-image-asset-manifest.md`.
- All 69 referenced SVG files include `title` and `desc` tags.
- No scoped asset used buy/sell signal labels or profit-claim labels.
- Several scoped SVGs include anti-guarantee text such as "not guaranteed," which is appropriate and should stay.

## Lesson-Level Visual Decisions

| Lesson / Group | Current Visual Result | Pass 4 Decision |
|---|---|---|
| Support/resistance foundation | Strong multi-asset visual support for zones, role reversal, and bad level drawing. | No new SVG needed. |
| Level drawing and key levels | Strong visuals for zones versus lines, obvious reaction levels, actionable nearby levels, and key-level maps. | No new SVG needed. |
| Support and resistance level lessons | Strong hold, break, reclaim, rejection, break, and failed-breakout visuals. | No new SVG needed. |
| Breakouts, breakdowns, reclaims, rejection | Strong visuals for quality break, failure, reclaim, rejection, and chase-risk contexts. | No new SVG needed. |
| Structure lessons | Strong visuals for break of structure, swing highs/lows, higher highs/lows, lower highs/lows, and failed/reclaimed structure. | No new SVG needed. |
| Intraday reference levels | Strong visuals for PDH/PDL, PMH/PML, HOD, LOD, NHOD, failed breakouts, and chase risk. | No new SVG needed. |
| Compression, consolidation, gap fill | Strong visuals for tightening ranges, failed breaks, range maps, gap zones, and failed gap-fill context. | No new SVG needed. |
| Candlestick Patterns In Context | Strong coverage across candle anatomy, wicks, doji, engulfing, hammer, inside/outside bars, tails, volume, and red/green transitions. | No new SVG needed. |
| Chart Patterns In Context | Strong coverage across pattern map, bull flag, ascending triangle, base/rectangle, channel/wedge, double top, inverse head and shoulders, failed breakout, and parabolic move. | No new SVG needed. |
| VWAP Reclaim | No direct visual in the cross-listed chart-pattern lesson. | Defer to Technical Indicators visual pass, where VWAP/VWAP reclaim visuals belong naturally. |

## Manifest And Asset Notes

No image manifest rows were added or changed in this pass because no assets were created or updated.

The existing manifest already tracks the scoped Chart Reading, Candlestick Patterns, and Chart Patterns assets with:

- Asset file path.
- Related article.
- Learning track.
- Visual type.
- Purpose.
- Suggested placement.
- Alt text.
- `editor_verified` status.
- Commit SHA.

The manifest is adequate for the current lesson set.

## Remaining Visual Gap

The only meaningful future Chart Reading visual gap is tied to a future lesson that does not exist yet:

```text
/academy/multiple-timeframe-chart-reading/
```

Recommended future asset if that lesson is created:

```text
public/academy/images/chart-reading/multiple-timeframe-chart-reading.svg
```

Suggested purpose:

Show higher-timeframe support/resistance and intraday structure in one clean, mobile-readable dashboard view. The visual should teach how to compare context without cluttering the chart or treating higher-timeframe levels as guarantees.

Do not create this asset until the lesson exists.

## Reuse Guidance For UI

The future Academy UI should use the existing lesson-level visuals directly from `visual_assets` where available.

Useful UI rules:

- Do not force a new visual into every card if the lesson already has several in-body SVGs.
- For course cards, use one representative chart visual or the existing Chart Reading Path map.
- For lesson pages, keep the existing first visual near the opening context.
- For lessons with multiple visuals, allow the page template to render them in lesson order rather than pulling them into decorative cards.
- Keep chart images large enough for mobile readers to see labels and candles.

## Visual Requirements Confirmed

Existing scoped assets align with the Academy visual standard:

- Realistic red and green candlesticks.
- Support/resistance zones rather than random curved lines.
- Volume bars where useful.
- Dark TradersLink dashboard look with blue accent.
- Educational labels.
- `title` and `desc` tags.
- No buy/sell signal language.
- No profit claims.
- No guaranteed-outcome claims.

## Editor Verification

Pass 4 audit result: passed.

The course is visual-ready for the initial Academy UI. Future asset work should focus on other visually thin courses before adding more Chart Reading diagrams.

No production website files were changed.

## Recommended Next Action

Next recommended audit:

```text
Pass 4: Visual Gap Audit for Volume, Liquidity And Order Flow
```

Reason:

- Chart Reading And Market Structure, Candlestick Patterns In Context, and Chart Patterns In Context already have strong visual coverage.
- Volume, Liquidity And Order Flow is the next course in Academy order.
- That course also has many realistic execution/market-mechanics visuals, but it should still receive a formal Pass 4 audit to verify manifest coverage, mobile readability, and whether any execution concepts need additional support.
