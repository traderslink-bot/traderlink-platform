# TradersLink Academy Visual Gap Audit: Volume, Liquidity And Order Flow

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course: Volume, Liquidity And Order Flow

Status: complete

## Scope

Reviewed the 14-lesson Volume, Liquidity And Order Flow course for realistic visual coverage, SVG file health, manifest tracking, mobile readability, and educational label safety.

Lessons reviewed:

- `academy/volume.md`
- `academy/relative-volume.md`
- `academy/relative-volume-rvol.md`
- `academy/volume-spike.md`
- `academy/liquidity.md`
- `academy/dollar-volume.md`
- `academy/spread.md`
- `academy/bid-and-ask.md`
- `academy/slippage.md`
- `academy/market-orders-vs-limit-orders.md`
- `academy/level-2.md`
- `academy/time-and-sales.md`
- `academy/volume-by-price.md`
- `academy/unusual-volume.md`

Related files reviewed:

- `docs/content/traderslink-academy-quality-audit-volume-liquidity.md`
- `docs/content/traderslink-academy-accuracy-source-audit-volume-liquidity.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-image-asset-manifest.md`
- `public/academy/images/chart-reading/`

## Overall Verdict

Volume, Liquidity And Order Flow is visually ready for initial Academy UI planning.

The course has strong realistic visual support because it uses candlestick charts, volume bars, quote panels, spread examples, fill/slippage examples, Level 2-style depth, time-and-sales prints, and volume-by-price profiles. The visuals support the actual lesson flow: participation first, then liquidity, quote mechanics, execution tradeoffs, order-flow tools, volume-at-price context, and unusual-volume review.

No new SVGs are required before the course moves into future UI implementation planning.

One existing SVG was cleaned up:

- `public/academy/images/chart-reading/bid-ask-order-interaction-review.svg`

The cleanup replaced order-side labels that used `buy` and `sell` wording with neutral ask-side and bid-side execution-mechanics wording. This keeps the visual aligned with the Academy standard: educational quote mechanics, no trade directives, no signal language, no profit claims, and no guaranteed-outcome framing.

## Coverage Summary

| Area | Lessons Reviewed | Visual Coverage | Result |
|---|---:|---:|---|
| Volume Foundation | 4 | 9 referenced SVG placements | Strong coverage. Volume expansion, dry-up, fading participation, relative volume, RVOL, scanner context, spike follow-through, and chase risk are visually supported. |
| Liquidity Foundation | 3 | 6 referenced SVG placements | Strong coverage. Liquidity quality, dollar volume, spread, depth, and hidden execution cost are visually supported. |
| Quotes And Execution | 3 | 6 referenced SVG placements | Strong coverage after one label cleanup. Bid/ask, slippage, market/limit tradeoffs, and no-fill context are visually supported. |
| Order Flow Tools | 2 | 4 referenced SVG placements | Strong coverage. Level 2 depth, disappearing displayed depth, prints near bid/ask, and tape-speed fade are visually supported. |
| Volume At Price And Scanner Context | 2 | 4 referenced SVG placements | Strong coverage. Volume-by-price zones, low-volume areas, normal versus unusual volume, catalyst fade, and scanner context are visually supported. |

## Asset Verification

Scoped SVG references checked:

```text
29
```

Verification result:

- 14 of 14 lessons include `visual_assets` metadata.
- 14 of 14 lessons place their referenced SVGs in lesson body content.
- 29 of 29 unique scoped SVG references exist under `public/academy/images/chart-reading/`.
- 29 of 29 unique scoped SVG references are represented in `docs/content/learn-image-asset-manifest.md`.
- 29 of 29 unique scoped SVG files include embedded `title` tags.
- 29 of 29 unique scoped SVG files include embedded `desc` tags.
- Visual labels were checked for buy/sell signal framing, profit claims, and guaranteed-outcome framing.
- Remaining `guarantee` wording is anti-guarantee educational wording only, such as explaining that depth or follow-through is not guaranteed.

## Lesson-Level Visual Recommendations

| Lesson | Existing Visuals | Pass 4 Recommendation |
|---|---|---|
| `/academy/volume/` | `volume-expansion-at-level.svg`, `volume-dry-up-before-move.svg`, `volume-fade-after-spike.svg` | Keep. Strong foundation visuals showing participation changes without implying direction certainty. |
| `/academy/relative-volume/` | `relative-volume-normal-vs-unusual.svg`, `relative-volume-news-fade-review.svg` | Keep. Strong comparison and news-fade review support. |
| `/academy/relative-volume-rvol/` | `rvol-time-of-day-comparison.svg`, `rvol-scanner-context-review.svg` | Keep. Supports time-of-day and scanner-context caution. |
| `/academy/volume-spike/` | `volume-spike-follow-through-vs-fade.svg`, `volume-spike-chase-risk.svg` | Keep. The anti-guarantee wording is appropriate because it explicitly teaches uncertainty. |
| `/academy/liquidity/` | `liquidity-clean-vs-thin-market.svg`, `liquidity-spread-depth-review.svg` | Keep. Strong execution-context visuals. |
| `/academy/dollar-volume/` | `dollar-volume-share-vs-value-comparison.svg`, `dollar-volume-low-price-liquidity-review.svg` | Keep. Good share-volume versus traded-value comparison. |
| `/academy/spread/` | `spread-tight-vs-wide-market.svg`, `spread-hidden-execution-cost.svg` | Keep. Strong visual explanation of spread as cost/risk context. |
| `/academy/bid-and-ask/` | `bid-ask-quote-mechanics.svg`, `bid-ask-order-interaction-review.svg` | Keep after label cleanup. Quote mechanics now avoid direct buy/sell label phrasing. |
| `/academy/slippage/` | `slippage-expected-vs-actual-fill.svg`, `slippage-fast-move-liquidity-review.svg` | Keep. Strong planned-versus-actual fill support. |
| `/academy/market-orders-vs-limit-orders/` | `market-vs-limit-order-tradeoff.svg`, `limit-order-no-fill-review.svg` | Keep. Strong speed-versus-price-control and no-fill tradeoff support. |
| `/academy/level-2/` | `level-2-order-book-depth.svg`, `level-2-depth-can-disappear.svg` | Keep. Strong visible-depth limitation support; anti-guarantee wording is educational. |
| `/academy/time-and-sales/` | `time-and-sales-prints-near-bid-ask.svg`, `time-and-sales-speed-fade-review.svg` | Keep. Strong tape-print and speed/fade support. |
| `/academy/volume-by-price/` | `volume-by-price-profile-zones.svg`, `volume-by-price-low-volume-area-review.svg` | Keep. Strong high-volume and low-volume price-zone support. |
| `/academy/unusual-volume/` | `unusual-volume-normal-vs-today.svg`, `unusual-volume-catalyst-fade-review.svg` | Keep. Strong scanner/catalyst/fade support. |

## New SVG Decisions

No new required SVGs were created in this pass.

Optional future course-level visual:

- `public/academy/images/chart-reading/volume-liquidity-order-flow-map.svg`

Purpose if created later:

- Show the course path from volume participation to liquidity, spread, slippage, order type, Level 2, time and sales, and execution review.
- This should be a course-page or module-intro visual, not an individual lesson requirement.

Reason deferred:

- The lesson-level visual coverage is already strong.
- The optional map is more useful for future UI/course-page design than for the markdown lesson content itself.

## Manifest Notes

No new manifest rows were needed because no new assets were created.

The existing manifest row for `public/academy/images/chart-reading/bid-ask-order-interaction-review.svg` should be stamped with this audit commit because the SVG label wording was updated for stricter educational neutrality.

## App Bridge Notes

The visual layer should reinforce the same restrained app bridge used in the course:

- Execution Review for spread, bid/ask, slippage, order type, Level 2, and time and sales.
- Risk Review for liquidity, slippage-expanded risk, and spread impact.
- Trade Review and Analytics for volume, RVOL, volume spikes, unusual volume, and volume fade.

Do not turn these visuals into app ads. Future UI cards can say the concept is useful to review after completed trades, but the visuals themselves should stay focused on market mechanics.

## Result

Pass 4 is complete for Volume, Liquidity And Order Flow.

The course is visually ready for initial Academy UI planning, with no required new SVGs and one existing bid/ask visual cleaned up for safer educational language.

## Recommended Next Action

Next recommended audit:

```text
Pass 4: Visual Gap Audit for Risk Management And Trade Planning
```
