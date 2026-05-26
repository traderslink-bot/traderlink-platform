# TradersLink Academy Visual Gap Audit: Halts And High-Volatility Events

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course: Halts And High-Volatility Events

Status: complete

## Scope

Reviewed the 7-lesson Halts And High-Volatility Events course for halt, resume, circuit-breaker, spread, low-float volatility, and volatile-trade review visual support.

Lessons reviewed:

- `academy/trading-halts.md`
- `academy/volatility-halts.md`
- `academy/halt-resume.md`
- `academy/market-wide-circuit-breakers.md`
- `academy/fast-spread-risk.md`
- `academy/low-float-volatility.md`
- `academy/high-volatility-trade-review.md`

## Overall Verdict

Halts And High-Volatility Events is visually strong enough for initial Academy UI planning.

The course already has a focused three-SVG set that appears in every lesson body:

- Halt timeline with realistic candles, paused period, resume, and volume.
- Halt resume spread/depth risk dashboard.
- Market-wide circuit breaker context diagram.

The visuals correctly teach interruption risk, execution instability, spread/depth risk, and market-wide reference levels. They do not frame halts or volatility as buy/sell signals.

## Coverage Summary

| Area | Lessons Reviewed | Current Direct Visual Coverage | Result |
|---|---:|---:|---|
| Halt Foundation | 2 | 1 shared SVG | Strong. |
| Resume And Execution Risk | 2 | 1 shared SVG | Strong. |
| Market-Wide Events | 1 | 1 SVG | Strong. |
| Low-Float Volatility | 1 | 1 shared SVG | Adequate; future dashboard optional. |
| High-Volatility Review | 1 | 1 shared SVG | Adequate; future capstone dashboard optional. |

## Asset Verification

Direct scoped SVG references found in this course:

```text
3
```

Verification result:

- 7 of 7 lessons include direct `visual_assets` metadata.
- 7 of 7 lessons include in-body SVG placements.
- 3 of 3 unique scoped SVG references exist under `public/academy/images/chart-reading/`.
- 3 of 3 unique scoped SVG references are represented in `docs/content/learn-image-asset-manifest.md`.
- 3 of 3 unique scoped SVG files include embedded `title` tags.
- 3 of 3 unique scoped SVG files include embedded `desc` tags.
- No buy/sell labels, profit claims, guaranteed-outcome wording, or unsafe prediction framing were found. The circuit-breaker visual explicitly says the index path is educational, not prediction.

Existing verified assets:

- `public/academy/images/chart-reading/trading-halt-timeline.svg`
- `public/academy/images/chart-reading/halt-resume-spread-risk.svg`
- `public/academy/images/chart-reading/market-wide-circuit-breaker-context.svg`

## Lesson-Level Visual Recommendations

| Lesson | Current Visual Coverage | Pass 4 Recommendation |
|---|---:|---|
| `/academy/trading-halts/` | 1 | Keep halt timeline visual. |
| `/academy/volatility-halts/` | 1 | Reuse halt timeline visual; no new asset required. |
| `/academy/halt-resume/` | 1 | Keep halt resume spread-risk visual. |
| `/academy/market-wide-circuit-breakers/` | 1 | Keep market-wide circuit-breaker context visual. |
| `/academy/fast-spread-risk/` | 1 | Reuse halt resume spread-risk visual. |
| `/academy/low-float-volatility/` | 1 | Reuse halt timeline visual; optional future low-float dashboard can add specificity. |
| `/academy/high-volatility-trade-review/` | 1 | Reuse halt resume spread-risk visual; optional future review dashboard can strengthen the capstone. |

## Optional Future Visuals

| Priority | Proposed SVG | Related Lessons | Visual Type | Purpose | Suggested Placement |
|---:|---|---|---|---|---|
| 1 | `public/academy/images/chart-reading/low-float-halt-risk-dashboard.svg` | Low-float volatility, volatility halts | risk_review_dashboard | Combine float, volume, spread, halt risk, and liquidity review in one panel. | Low-float volatility checklist. |
| 2 | `public/academy/images/chart-reading/high-volatility-trade-review-dashboard.svg` | High-volatility trade review | trade_review_dashboard | Show halt risk, spread, slippage, size, liquidity, execution, and behavior tags. | Capstone intro. |
| 3 | `public/academy/images/chart-reading/halt-resume-first-candle-risk.svg` | Halt resume | realistic_candlestick_chart | Isolate the first resume candle and quote instability. | Resume behavior section. |
| 4 | `public/academy/images/chart-reading/volatility-halt-luld-band-context.svg` | Volatility halts | realistic_candlestick_chart | Show LULD-style band context without exact rule overreach. | Volatility halt context. |

## Manifest Notes

No manifest rows were added or changed because no SVGs were created or edited in this pass.

## Result

Pass 4 is complete for Halts And High-Volatility Events.

The course is visually strong enough for initial Academy UI planning. Optional future visuals should focus on low-float halt risk and high-volatility trade-review dashboards.

