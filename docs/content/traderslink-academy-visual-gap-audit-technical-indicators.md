# TradersLink Academy Visual Gap Audit: Technical Indicators And Tools

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course: Technical Indicators And Tools

Status: complete

## Scope

Reviewed the 12-lesson Technical Indicators And Tools course for realistic visual support, indicator-overlay gaps, existing SVG file health, manifest tracking, and readiness for future Academy UI planning.

Lessons reviewed:

- `academy/trading-indicators.md`
- `academy/why-indicators-lag.md`
- `academy/indicator-overload.md`
- `academy/moving-averages.md`
- `academy/vwap.md`
- `academy/anchored-vwap.md`
- `academy/rsi.md`
- `academy/macd.md`
- `academy/bollinger-bands.md`
- `academy/atr.md`
- `academy/volume-by-price.md`
- `academy/chart-patterns/vwap-reclaim.md`

Related files reviewed:

- `docs/content/traderslink-academy-quality-audit-technical-indicators.md`
- `docs/content/traderslink-academy-accuracy-source-audit-technical-indicators.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-image-asset-manifest.md`
- `public/academy/images/chart-reading/`

## Overall Verdict

Technical Indicators And Tools is content-ready, but it is not yet visually ready for a polished Academy UI experience.

This course depends heavily on visual understanding. Indicators are easiest to teach when learners can see the line, overlay, band, oscillator, or volatility reference sitting on top of realistic price action. Right now, the only direct visuals in the course come from the cross-listed Volume By Price lesson. The core indicator lessons have no direct SVG support.

The course should receive a targeted indicator-overlay SVG batch before UI-ready status. These visuals should keep the current editorial stance: indicators are measurement and review tools, not signal machines.

No new SVGs were created during this audit pass. The output of this pass is a concrete visual gap plan for a later Technical Indicators SVG batch.

## Coverage Summary

| Area | Lessons Reviewed | Current Direct Visual Coverage | Result |
|---|---:|---:|---|
| Indicator Foundation | 3 | 0 | Needs visuals for lag and overload because these are central beginner misunderstandings. |
| Trend Tools | 3 | 0 | Needs moving average, VWAP, and anchored VWAP overlays on realistic candlestick charts. |
| Momentum Tools | 2 | 0 | Needs RSI/MACD context visuals that avoid overbought/oversold or cross-as-command framing. |
| Volatility Tools | 2 | 0 | Needs Bollinger Band and ATR visuals showing volatility context, not direction prediction. |
| Volume Tools | 1 | 2 | Existing Volume By Price visuals are strong and manifest-tracked. |
| Setup Tool Context | 1 | 0 | VWAP Reclaim needs a dedicated chart visual because it is cross-listed into chart patterns and indicator tools. |

## Asset Verification

Direct scoped SVG references found in this course:

```text
2
```

Verification result:

- 1 of 12 lessons includes direct `visual_assets` metadata.
- 1 of 12 lessons includes in-body SVG placements.
- 2 of 2 scoped SVG references exist under `public/academy/images/chart-reading/`.
- 2 of 2 scoped SVG references are represented in `docs/content/learn-image-asset-manifest.md`.
- 2 of 2 scoped SVG files include embedded `title` tags.
- 2 of 2 scoped SVG files include embedded `desc` tags.
- No missing files or broken manifest rows were found.

Existing verified assets:

- `public/academy/images/chart-reading/volume-by-price-profile-zones.svg`
- `public/academy/images/chart-reading/volume-by-price-low-volume-area-review.svg`

## Priority Visual Batch

These are the highest-value visuals to create before this course is considered visually ready for production UI.

| Priority | Proposed SVG | Related Lessons | Visual Type | Purpose | Suggested Placement |
|---:|---|---|---|---|---|
| 1 | `public/academy/images/chart-reading/indicator-lag-after-price-move.svg` | `/academy/why-indicators-lag/`, `/academy/trading-indicators/` | realistic_candlestick_dashboard | Show price moving first and an indicator confirming later, with late-confirmation review labels. | Indicators Lag Price intro or confirmation-versus-prediction section. |
| 2 | `public/academy/images/chart-reading/indicator-overload-cluttered-vs-clean-chart.svg` | `/academy/indicator-overload/`, `/academy/trading-indicators/` | comparison_chart_dashboard | Compare a cluttered chart with multiple overlapping tools against a simpler reviewable chart. | Indicator Overload opening example. |
| 3 | `public/academy/images/chart-reading/moving-average-trend-vs-chop.svg` | `/academy/moving-averages/` | realistic_candlestick_chart | Show moving averages helping trend context in one panel and creating noise in chop in another. | Moving average trend/chop section. |
| 4 | `public/academy/images/chart-reading/vwap-hold-loss-reclaim-review.svg` | `/academy/vwap/`, `/academy/chart-patterns/vwap-reclaim/` | realistic_intraday_chart | Show price interacting with VWAP, including hold, loss, reclaim, and failed reclaim as review context. | VWAP lesson and VWAP Reclaim lesson. |
| 5 | `public/academy/images/chart-reading/anchored-vwap-event-anchor.svg` | `/academy/anchored-vwap/` | realistic_candlestick_chart | Show an event candle anchor and the anchored VWAP line, with anchor-choice and hindsight-bias labels. | Anchored VWAP anchor-choice section. |
| 6 | `public/academy/images/chart-reading/rsi-macd-momentum-context.svg` | `/academy/rsi/`, `/academy/macd/` | oscillator_context_dashboard | Show RSI and MACD as momentum context panels below price, without directional command labels. | Momentum tools overview or individual lesson examples. |
| 7 | `public/academy/images/chart-reading/bollinger-atr-volatility-context.svg` | `/academy/bollinger-bands/`, `/academy/atr/` | volatility_context_dashboard | Show bands expanding/contracting and ATR rising/falling as volatility context, not direction prediction. | Volatility tools section. |

## Optional Future Visuals

These may be useful later, but they should come after the priority batch.

| Proposed SVG | Related Lessons | Reason To Defer |
|---|---|---|
| `public/academy/images/chart-reading/indicator-settings-timeframe-comparison.svg` | Future `/academy/indicator-settings-and-timeframes/` | This lesson does not exist yet. Create only if a later course sequence pass adds it. |
| `public/academy/images/chart-reading/indicator-with-price-levels-review.svg` | Future `/academy/using-indicators-with-price-levels/` | Useful bridge concept, but not necessary until that lesson exists. |
| `public/academy/images/chart-reading/indicator-backtest-vs-live-review.svg` | Future `/academy/indicator-backtesting-vs-live-review/` | Better suited to a later evidence/practice module. |

## Lesson-Level Visual Recommendations

| Lesson | Current Visual Coverage | Pass 4 Recommendation |
|---|---:|---|
| `/academy/trading-indicators/` | 0 | Use `indicator-lag-after-price-move.svg` or a future course map to introduce indicators as context tools. |
| `/academy/why-indicators-lag/` | 0 | Add `indicator-lag-after-price-move.svg`; this is the highest-value foundation visual. |
| `/academy/indicator-overload/` | 0 | Add `indicator-overload-cluttered-vs-clean-chart.svg`; this lesson needs visual contrast. |
| `/academy/moving-averages/` | 0 | Add `moving-average-trend-vs-chop.svg`; show both trend help and chop risk. |
| `/academy/vwap/` | 0 | Add or reuse `vwap-hold-loss-reclaim-review.svg`; show VWAP as reference context, not support certainty. |
| `/academy/anchored-vwap/` | 0 | Add `anchored-vwap-event-anchor.svg`; include event anchor and anchor-bias caution. |
| `/academy/rsi/` | 0 | Use `rsi-macd-momentum-context.svg`; avoid buy/sell language around overbought or oversold. |
| `/academy/macd/` | 0 | Use `rsi-macd-momentum-context.svg`; show lag and histogram/cross context without command labels. |
| `/academy/bollinger-bands/` | 0 | Use `bollinger-atr-volatility-context.svg`; show volatility expansion/contraction and band-touch caution. |
| `/academy/atr/` | 0 | Use `bollinger-atr-volatility-context.svg`; show ATR as range/volatility context, not direction. |
| `/academy/volume-by-price/` | 2 | Keep existing visuals. They are strong, manifest-tracked, and already support the cross-listed lesson. |
| `/academy/chart-patterns/vwap-reclaim/` | 0 | Add `vwap-hold-loss-reclaim-review.svg`; this is also needed for Chart Patterns cross-listing. |

## Reuse Decisions

| Existing Asset | Reuse Decision | Reason |
|---|---|---|
| `public/academy/images/chart-reading/volume-by-price-profile-zones.svg` | Keep | It supports the cross-listed Volume By Price lesson and should remain canonical to the Volume course while usable in Technical Indicators. |
| `public/academy/images/chart-reading/volume-by-price-low-volume-area-review.svg` | Keep | It teaches low-volume area review without prediction language. |
| Existing chart-pattern SVGs | Do not reuse for indicator lessons | They teach pattern behavior, not indicator calculations or overlay interpretation. |
| Existing VWAP-like chart pattern visuals | Do not assume sufficient | VWAP Reclaim still needs a dedicated VWAP reference-line visual. |

## Visual Standards For The Indicator Batch

All future Technical Indicators visuals should follow these standards:

- Dark TradersLink dashboard look with blue accent.
- Realistic red and green candlesticks.
- Actual indicator overlays or lower-panel indicators where relevant.
- Volume bars where useful, especially for VWAP and volume-by-price context.
- Mobile-readable labels.
- Educational labels only.
- No buy/sell signal language.
- No profit claims.
- No guaranteed-outcome language.
- No implication that an indicator predicts the next move.
- Include embedded `title` and `desc` tags.

Avoid these labels:

```text
Buy here
Sell here
Signal confirmed
Guaranteed trend
Profit target
Perfect entry
```

Prefer these labels:

```text
late confirmation
trend context
chop risk
VWAP reference
failed reclaim review
momentum context
volatility expansion
range pressure
```

## Manifest Notes

No manifest rows were added or changed because no SVGs were created or edited in this pass.

When the Technical Indicators visual batch is created, add manifest rows with:

- Asset file path.
- Related Academy lesson(s).
- Learning track: `Technical Indicators And Tools`.
- Visual type.
- Purpose.
- Suggested placement.
- Alt text.
- Status: `editor_verified` only after confirming the visual supports the final lesson text.
- Commit SHA.

## App Bridge Notes

The visual layer should support the existing restrained bridge map:

- Trade Review for whether an indicator added useful context or distracted from the plan.
- Analytics for repeated indicator-related outcomes across completed trades.
- Execution Review for VWAP, late confirmation, spread, slippage, and entry timing.
- Risk Review for ATR, volatility, size, stop distance, and overextension.
- Coaching for indicator overload, cherry-picking, chasing, and false confidence.
- Playbook Builder for documenting which indicators belong in a specific setup review.

The visuals should teach review context, not product features or prediction.

## Result

Pass 4 is complete for Technical Indicators And Tools.

The course is not visually ready yet because 11 of 12 lessons have no direct indicator visuals. The next content-only asset step for this course is a targeted seven-SVG indicator visual batch.

## Recommended Next Action

Next recommended audit:

```text
Pass 4: Visual Gap Audit for Trading Styles And Playbooks
```
