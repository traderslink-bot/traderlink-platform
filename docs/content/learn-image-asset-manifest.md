# TradersLink Learn Image Asset Manifest

## Purpose

This manifest tracks educational SVG and image assets created for the TradersLink Learn section.

The Learn section is an educational learning journey, not just an SEO article library. Visuals should support real learning, reduce confusion, and help users follow concepts from beginner to practical review.

## Source Documents

Use this manifest with:

```text
docs/content/learn-visual-content-plan.md
docs/content/learn-editorial-upgrade-process.md
docs/content/learn-editorial-upgrade-tracker.md
docs/content/learn-learning-journey-implementation-plan.md
```

## Asset Status Values

```text
planned
created
wired_to_content
editor_verified
needs_revision
paused
```

## Visual Type Values

```text
realistic_candlestick_chart
filing_flow_diagram
risk_loop_diagram
workflow_diagram
checklist_graphic
comparison_graphic
journey_map
```

## Asset Table

| Asset File | Related Article/Slug | Learning Track | Visual Type | Purpose | Suggested Placement | Alt Text | Status | Editor Verification | Commit SHA |
|---|---|---|---|---|---|---|---|---|---|
| `public/images/learn/chart-reading/support-resistance-candlestick-diagram.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price moving between support and resistance zones with recognizable red/green candles and volume. | Intro visual after quick definition. | Candlestick chart showing price bouncing near support and rejecting near resistance. | editor_verified | Supports the article topic, uses realistic candles and volume, avoids buy/sell language, and uses support/resistance as educational zones. | `8b7d4b28f20c90adf0d3301887dbf67b17c9ca08` |
| `public/images/learn/chart-reading/support-breaks-becomes-resistance.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show how a broken support zone can later act as resistance during a retest. | Body section explaining support becoming resistance. | Candlestick chart showing broken support later acting as resistance during a retest. | editor_verified | Supports the lesson’s support/resistance role-reversal concept, avoids predictive language, and uses realistic candles. | `9594e68325fcacc512d2f772f2d69dd024c0a8eb` |
| `public/images/learn/chart-reading/resistance-breaks-becomes-support.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show how a broken resistance zone can later act as support during a pullback. | Body section explaining resistance becoming support. | Candlestick chart showing broken resistance later acting as support during a pullback. | editor_verified | Supports the lesson’s role-reversal concept, avoids guarantee language, and shows realistic price behavior around a zone. | `f0febdfd9eab7b3a5a9ce68595f1787cd7f1c9e4` |
| `public/images/learn/chart-reading/bad-support-resistance-example.svg` | `/learn/support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show the difference between cluttered exact-line drawing and cleaner support/resistance zones. | Common mistakes section. | Chart diagram comparing cluttered support and resistance lines with cleaner decision zones. | editor_verified | Supports the common mistakes section, improves user learning, and helps beginners understand why too many levels create confusion. | `003b0bbc79cafc546696b32312f6bc83e147bcf4` |
| `public/images/learn/chart-reading/support-resistance-zones-vs-lines.svg` | `/learn/how-to-draw-support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Compare exact support/resistance lines with cleaner zones that capture real candle reactions. | Step 1 section about zones, not exact lines. | Educational chart comparing exact support and resistance lines with cleaner support and resistance zones. | editor_verified | Supports the article’s zones-vs-lines teaching point, uses recognizable candles, and avoids false precision or buy/sell language. | `1bc433405e7f8ad4aaa8f4dd615f22926bcbf839` |
| `public/images/learn/chart-reading/mark-obvious-reaction-levels.svg` | `/learn/how-to-draw-support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show how to start with obvious repeated reaction areas instead of minor candle noise. | Step 2 section about obvious reactions. | Candlestick chart showing how to mark only obvious support and resistance reaction areas. | editor_verified | Supports the article’s level selection process, teaches pre-trade visibility, and avoids hindsight-based level drawing. | `8773da36c3f09bf66724314fa855e360d967345f` |
| `public/images/learn/chart-reading/near-price-actionable-levels.svg` | `/learn/how-to-draw-support-and-resistance/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show keeping the closest actionable support and resistance while leaving far-away levels for later. | Step 4 section about keeping current-plan levels. | Chart showing nearest actionable support and resistance levels around current price. | editor_verified | Supports the article’s practical workflow, reduces chart clutter, and keeps level drawing tied to the current trade plan. | `578247cbce1d0abd0245fa87c998b38533685618` |

| `public/images/learn/chart-reading/support-level-hold.svg` | `/learn/support-levels/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price testing a support zone and holding above it with volume context. | Quick Definition section after support-level sources. | Candlestick chart showing price holding above a support zone with volume context. | editor_verified | Supports the support hold section, uses realistic candles and a clear zone, includes volume context, and avoids signal or guarantee language. | `ea86c4f9` |
| `public/images/learn/chart-reading/support-level-break.svg` | `/learn/support-levels/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price breaking below a support zone with expanded volume and a later retest area. | When Support Breaks section. | Candlestick chart showing a support zone breaking with increased volume and a later retest. | editor_verified | Supports the support break section, explains changed context without predicting continuation, and avoids buy/sell language. | `ea86c4f9` |
| `public/images/learn/chart-reading/support-level-reclaim.svg` | `/learn/support-levels/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price briefly losing support, reclaiming the zone, and holding above it. | When Support Reclaims section. | Candlestick chart showing price losing support, reclaiming the zone, and holding above it. | editor_verified | Supports the reclaim section, frames reclaim as reviewable behavior rather than a guaranteed reversal, and uses mobile-readable labels. | `ea86c4f9` |
| `public/images/learn/chart-reading/resistance-level-rejection.svg` | `/learn/resistance-levels/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price testing a resistance zone and rejecting from it with volume context. | Quick Definition section after resistance-level sources. | Candlestick chart showing price rejecting from a resistance zone with volume context. | editor_verified | Supports the resistance rejection section, uses realistic red and green candles, shows a clear resistance zone, and avoids reversal guarantee language. | `688c4ac7` |
| `public/images/learn/chart-reading/resistance-level-break.svg` | `/learn/resistance-levels/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price breaking above a resistance zone and holding above it with volume context. | When Resistance Breaks section. | Candlestick chart showing price breaking above a resistance zone and holding above it. | editor_verified | Supports the resistance break section, includes volume context, and frames the break as behavior to review rather than continuation certainty. | `688c4ac7` |
| `public/images/learn/chart-reading/failed-breakout-at-resistance.svg` | `/learn/resistance-levels/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a breakout attempt above resistance that fails back below the zone. | When A Breakout Fails At Resistance section. | Candlestick chart showing a breakout attempt above resistance that fails back below the zone. | editor_verified | Supports the failed-breakout section, makes chase risk visible, and avoids buy/sell language or predictive claims. | `688c4ac7` |
| `public/images/learn/chart-reading/key-level-map-current-price.svg` | `/learn/key-levels-trading/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a clean current-price level map with nearest support, nearest resistance, and one higher timeframe level. | Quick Definition section after key-level examples. | Candlestick chart showing a clean key-level map around current price. | editor_verified | Supports the level-map lesson, uses realistic red and green candles, teaches level selection, and avoids signal or guarantee language. | `4121eaf9` |
| `public/images/learn/chart-reading/key-level-review-workflow.svg` | `/learn/key-levels-trading/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show hold, break, reject, and review behavior around a key level zone. | Step 3 section about review questions. | Educational chart workflow showing hold, break, reject, and reclaim behavior around key levels. | editor_verified | Supports the journal-review workflow, uses chart-based price behavior, and frames outcomes as review prompts instead of predictions. | `4121eaf9` |
| `public/images/learn/chart-reading/breakout-with-volume-context.svg` | `/learn/breakout-trading/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price breaking above a resistance zone with volume expanding into the move. | Quick Definition section after breakout levels. | Candlestick chart showing price breaking above resistance with volume context. | editor_verified | Supports breakout quality review, uses realistic candles and volume, and avoids signal or guaranteed-continuation language. | `bdd8664e` |
| `public/images/learn/chart-reading/failed-breakout-review.svg` | `/learn/breakout-trading/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a breakout attempt that fails back below the breakout level. | Failed Breakouts section. | Candlestick chart showing a breakout attempt that fails back below the breakout level. | editor_verified | Supports failed-breakout review, shows realistic behavior around the level, and avoids predictive language. | `bdd8664e` |
| `public/images/learn/chart-reading/extended-breakout-chase-risk.svg` | `/learn/breakout-trading/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price far above the breakout level to explain extended-entry chase risk. | Extended Breakout Chase Risk section. | Candlestick chart showing a breakout far above the level with chase-risk review labels. | editor_verified | Supports chase-risk education, keeps labels focused on review, and avoids buy/sell or profit language. | `bdd8664e` |
| `public/images/learn/chart-reading/level-breakout-retest-hold.svg` | `/learn/level-breakout/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price breaking above a level, retesting it, and holding above the zone. | Breakout Retest And Hold section. | Candlestick chart showing price breaking above a level, retesting it, and holding above the zone. | editor_verified | Supports breakout-level retest review, uses realistic candles and zones, and avoids guaranteed-continuation language. | `1377793b` |
| `public/images/learn/chart-reading/level-breakout-failed-hold.svg` | `/learn/level-breakout/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price breaking above a level and then failing back below the breakout zone. | Failed Hold After A Breakout section. | Candlestick chart showing price breaking above a level and then failing back below the breakout zone. | editor_verified | Supports failed-hold review, keeps labels focused on trader review, and avoids buy/sell or predictive language. | `1377793b` |
| `public/images/learn/chart-reading/level-reclaim-hold.svg` | `/learn/level-reclaim/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price losing a key level, reclaiming it, and holding above the zone. | Reclaim And Hold section. | Candlestick chart showing price losing a key level, reclaiming it, and holding above the zone. | editor_verified | Supports reclaim-and-hold review, uses realistic candles and zones, and avoids guaranteed-continuation language. | `57664031` |
| `public/images/learn/chart-reading/level-reclaim-failure.svg` | `/learn/level-reclaim/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price reclaiming a level briefly and then failing back below the zone. | Reclaim Failure section. | Candlestick chart showing price reclaiming a level briefly and then failing back below the zone. | editor_verified | Supports reclaim failure review, keeps labels focused on trader response, and avoids buy/sell or predictive language. | `57664031` |
| `public/images/learn/chart-reading/price-rejection-at-resistance.svg` | `/learn/price-rejection/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show price pushing into resistance and rejecting back below the zone. | Quick Definition section. | Candlestick chart showing price pushing into resistance and rejecting back below the zone. | editor_verified | Supports rejection-at-level review, uses realistic candles and zones, and avoids reversal guarantee language. | `3ff3c7c4` |
| `public/images/learn/chart-reading/rejection-wick-context.svg` | `/learn/price-rejection/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a long wick at a key level with follow-through context. | Rejection Needs Context section. | Candlestick chart showing a long wick at a key level with follow-through context. | editor_verified | Supports wick-context education, avoids treating every wick as a signal, and keeps labels focused on review. | `3ff3c7c4` |
| `public/images/learn/chart-reading/uptrend-structure-break.svg` | `/learn/break-of-structure/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show higher highs and higher lows before price breaks below the latest higher low. | Uptrend Structure Break section. | Candlestick chart showing higher highs and higher lows before price breaks below the latest higher low. | editor_verified | Supports uptrend structure-break review, uses realistic candles and swing labels, and avoids predictive language. | `d03cf796` |
| `public/images/learn/chart-reading/downtrend-structure-break.svg` | `/learn/break-of-structure/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show lower highs and lower lows before price breaks above the latest lower high. | Downtrend Structure Break section. | Candlestick chart showing lower highs and lower lows before price breaks above the latest lower high. | editor_verified | Supports downtrend structure-break review, uses realistic candles and swing labels, and avoids reversal certainty. | `d03cf796` |
| `public/images/learn/chart-reading/swing-highs-swing-lows-map.svg` | `/learn/swing-highs-and-swing-lows/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show major swing highs and swing lows on a realistic price move. | Quick Definition section. | Candlestick chart showing clear swing highs and swing lows on a realistic price move. | editor_verified | Supports swing-point identification, uses realistic candles, labels only major turns, and avoids predictive language. | `94fabc3b` |

## Editor Verification Summary

Initial support/resistance SVG batch verification:

- All four visuals support the actual support and resistance lesson.
- Chart-based visuals use recognizable red and green candlesticks.
- Volume is included where useful.
- Labels use educational language, not buy/sell signals.
- No visual claims support or resistance guarantees a bounce, rejection, breakout, or continuation.
- Each visual has a specific article placement and alt text.
- The batch is appropriate for the gold-standard support/resistance article upgrade.

How-to-draw support/resistance SVG batch verification:

- All three visuals support the actual drawing-levels lesson.
- Visuals explain zones versus exact lines, obvious reaction areas, and actionable near-price levels.
- Chart-based visuals use recognizable red and green candlesticks.
- Labels avoid buy/sell signal language and avoid guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the second Chart Reading And Market Structure upgrade.

Support levels SVG batch verification:

- All three visuals support the actual support-levels lesson.
- Visuals explain support holding, support breaking, and support reclaiming without using signal language.
- Chart-based visuals use recognizable red and green candlesticks, support zones, and volume bars.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the third Chart Reading And Market Structure upgrade.

Resistance levels SVG batch verification:

- All three visuals support the actual resistance-levels lesson.
- Visuals explain resistance rejection, resistance breaking, and failed breakouts without using signal language.
- Chart-based visuals use realistic red and green candlesticks, resistance zones, and volume bars.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the fourth Chart Reading And Market Structure upgrade.

Key levels trading SVG batch verification:

- Both visuals support the actual key-levels trading lesson.
- Visuals show realistic chart context with red and green candlesticks, zones, and current-price framing.
- Labels teach level mapping and review workflow without buy/sell language or guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the practical level-map bridge article.

Breakout trading SVG batch verification:

- All three visuals support the actual breakout trading lesson.
- Visuals show realistic breakout behavior with red and green candlesticks, resistance zones, and volume context.
- The failed-breakout and extended-breakout visuals teach risk and review without using signal language.
- Labels avoid buy/sell language, profit claims, and guaranteed-continuation claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the breakout trading upgrade.

Level breakout SVG batch verification:

- Both visuals support the actual level-breakout lesson.
- Visuals show realistic post-break behavior with red and green candlesticks, breakout zones, retests, and failed holds.
- Labels teach review of hold/failure after the break without buy/sell language or guaranteed-continuation claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the level breakout upgrade.

Level reclaim SVG batch verification:

- Both visuals support the actual level reclaim lesson.
- Visuals show realistic lost-level, reclaim-and-hold, and reclaim-failure behavior with red and green candlesticks.
- Labels teach review of reclaimed levels without buy/sell language or guaranteed-continuation claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the level reclaim upgrade.

Price rejection SVG batch verification:

- Both visuals support the actual price rejection lesson.
- Visuals show realistic rejection behavior with red and green candlesticks, key-level zones, wick behavior, and follow-through context.
- Labels teach review of rejection without buy/sell language or guaranteed-reversal claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the price rejection upgrade.

Break of structure SVG batch verification:

- Both visuals support the actual break-of-structure lesson.
- Visuals show realistic swing structure with red and green candlesticks, higher-high/higher-low and lower-high/lower-low context.
- Labels teach review of structure changes without buy/sell language or guaranteed-reversal claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the break-of-structure upgrade.

Swing highs and swing lows SVG verification:

- The visual supports the actual swing highs and swing lows lesson.
- It uses realistic red and green candlesticks and labels major swing turns without cluttering every candle.
- Labels teach structure identification without buy/sell language or predictive claims.
- The visual is wired to the article section where it adds learning value.
- The asset is appropriate for the swing-point foundation article.

## Next Asset Batch Candidates

After the first eleven Chart Reading articles, the next high-value SVG batch should likely support one of these:

1. Higher Highs And Higher Lows article: uptrend structure, extension risk, higher-low failure.
2. Breakdown article: clean breakdown, failed breakdown/reclaim, breakdown with volume context.
3. SEC filings hub: filing map, shelf-to-offering flow, dilution risk flow.
4. Risk discipline path: FOMO loop, revenge trading loop, overtrading spiral.
5. Trade review path: trade timeline, planned vs actual risk, execution review timeline.
