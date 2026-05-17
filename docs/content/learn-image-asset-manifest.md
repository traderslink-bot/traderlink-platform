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
| `public/images/learn/chart-reading/candlestick-anatomy-context.svg` | `/learn/candlestick-patterns/` | Candlestick Patterns In Context | realistic_candlestick_chart | Show candle body, upper wick, lower wick, support, resistance, and volume context in one realistic chart view. | Intro visual after opening context. | Educational candlestick chart showing candle anatomy, wick, body, support, resistance, and volume context. | editor_verified | Supports the candlestick-patterns course opener, uses realistic red/green candles and volume bars, and teaches candle anatomy without trade-instruction language. | `60d86346` |
| `public/images/learn/chart-reading/long-wick-rejection-context.svg` | `/learn/candlestick-patterns/long-wick-candle/`, `/learn/candlestick-patterns/pin-bar/`, `/learn/candlestick-patterns/topping-tail/` | Candlestick Patterns In Context | realistic_candlestick_chart | Show upper-wick and lower-wick rejection around support/resistance zones with volume context. | Intro visual after opening context in wick-based lessons. | Candlestick chart showing long upper and lower wick rejection around support and resistance with volume context. | editor_verified | Supports long-wick, pin-bar, and topping-tail lessons, uses realistic candles, support/resistance zones, volume bars, and labels focused on review rather than signals. | `60d86346` |
| `public/images/learn/chart-reading/doji-at-key-level.svg` | `/learn/candlestick-patterns/doji/`, `/learn/candlestick-patterns/spinning-top/` | Candlestick Patterns In Context | realistic_candlestick_chart | Show a doji/small-body hesitation candle near a key level with volume and follow-through context. | Intro visual after opening context in indecision-candle lessons. | Candlestick chart showing a doji candle near resistance with volume and follow-through context. | editor_verified | Supports doji and spinning-top lessons, makes hesitation-at-level context visible, and avoids reversal or continuation certainty. | `60d86346` |
| `public/images/learn/chart-reading/engulfing-candle-context.svg` | `/learn/candlestick-patterns/engulfing-candle/` | Candlestick Patterns In Context | realistic_candlestick_chart | Show green and red engulfing candle pairs near support/resistance zones with volume context. | Intro visual after opening context. | Candlestick chart showing bullish and bearish engulfing candles near support and resistance with volume context. | editor_verified | Supports the engulfing-candle lesson, shows shift-of-control context with realistic candles and volume, and avoids guaranteed reversal language. | `60d86346` |
| `public/images/learn/chart-reading/hammer-support-context.svg` | `/learn/candlestick-patterns/hammer/`, `/learn/candlestick-patterns/bottoming-tail/` | Candlestick Patterns In Context | realistic_candlestick_chart | Show a hammer-style lower wick near support with volume and follow-through context. | Intro visual after opening context in lower-wick lessons. | Candlestick chart showing a hammer candle near support with volume and follow-through context. | editor_verified | Supports hammer and bottoming-tail lessons, shows lower-wick recovery near support without implying a guaranteed reversal. | `60d86346` |
| `public/images/learn/chart-reading/inside-outside-bar-context.svg` | `/learn/candlestick-patterns/inside-bar/`, `/learn/candlestick-patterns/outside-bar/` | Candlestick Patterns In Context | realistic_candlestick_chart | Compare inside-bar compression with outside-bar range expansion using realistic candles and volume bars. | Intro visual after opening context in range-pattern lessons. | Candlestick chart showing inside bar compression and outside bar range expansion with volume context. | editor_verified | Supports inside-bar and outside-bar lessons, explains compression and range expansion with realistic candles while keeping labels educational. | `60d86346` |
| `public/images/learn/chart-reading/candle-volume-confirmation-context.svg` | `/learn/candlestick-patterns/candle-volume-confirmation/` | Candlestick Patterns In Context | realistic_candlestick_chart | Show candle reactions with expanding and fading volume to teach participation context. | Intro visual after opening context. | Candlestick chart comparing candle reactions with expanding and fading volume context. | editor_verified | Supports the candle-volume-confirmation lesson, links candle shape and volume bars without treating high volume as proof of direction. | `60d86346` |
| `public/images/learn/chart-reading/red-green-transition-context.svg` | `/learn/candlestick-patterns/red-to-green-move/`, `/learn/candlestick-patterns/green-to-red-move/` | Candlestick Patterns In Context | realistic_candlestick_chart | Show red-to-green and green-to-red intraday reference transitions around prior close and VWAP with volume context. | Intro visual after opening context in intraday transition lessons. | Candlestick chart showing red-to-green and green-to-red intraday transitions with VWAP and volume context. | editor_verified | Supports red-to-green and green-to-red lessons, uses realistic intraday reference lines and volume, and frames transitions as review context. | `60d86346` |
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
| `public/images/learn/chart-reading/higher-highs-higher-lows-uptrend.svg` | `/learn/higher-highs-higher-lows/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show rising swing highs and higher pullbacks in a clean uptrend structure. | Quick Definition section. | Candlestick chart showing higher highs and higher lows forming a rising market structure. | editor_verified | Supports uptrend-structure identification, uses realistic red and green candles, support zones, volume context, and avoids signal language. | `fece7bfe` |
| `public/images/learn/chart-reading/higher-low-failure-review.svg` | `/learn/higher-highs-higher-lows/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show an uptrend losing the latest higher-low zone and shifting into review context. | When A Higher Low Fails section. | Candlestick chart showing an uptrend losing the latest higher low and shifting into a review area. | editor_verified | Supports higher-low failure review, uses realistic candles, highlights the relevant zone, includes volume context, and avoids predictive claims. | `fece7bfe` |
| `public/images/learn/chart-reading/lower-highs-lower-lows-downtrend.svg` | `/learn/lower-highs-lower-lows/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show weak bounces and lower lows in a clean downtrend structure. | Quick Definition section. | Candlestick chart showing lower highs and lower lows forming a weakening market structure. | editor_verified | Supports downtrend-structure identification, uses realistic red and green candles, lower-high zones, volume context, and avoids signal language. | `65a5747d` |
| `public/images/learn/chart-reading/lower-high-reclaim-review.svg` | `/learn/lower-highs-lower-lows/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a downtrend reclaiming a meaningful lower-high zone and shifting into review context. | When A Lower High Is Reclaimed section. | Candlestick chart showing a downtrend reclaiming a meaningful lower high and shifting into review context. | editor_verified | Supports lower-high reclaim review, uses realistic candles, highlights the relevant zone, includes volume context, and avoids reversal guarantee language. | `65a5747d` |
| `public/images/learn/chart-reading/pivot-level-reaction-map.svg` | `/learn/pivot-levels/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show repeated reactions around a clear pivot zone. | Quick Definition section. | Candlestick chart showing price reacting around a clear pivot level zone. | editor_verified | Supports pivot-zone identification, uses realistic red and green candles, volume context, and avoids signal language. | `8c7efffa` |
| `public/images/learn/chart-reading/pivot-failed-reclaim-review.svg` | `/learn/pivot-levels/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a failed reclaim and rejection around a pivot zone as review context. | Failed Reclaim Or Rejection At A Pivot section. | Candlestick chart showing a failed reclaim and rejection around a pivot level zone. | editor_verified | Supports failed-reclaim review, uses realistic candles, highlights the pivot zone, includes volume context, and avoids predictive claims. | `8c7efffa` |
| `public/images/learn/chart-reading/previous-day-high-low-map.svg` | `/learn/previous-day-high-low/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show previous day high and previous day low mapped across prior and current sessions. | Quick Definition section. | Candlestick chart showing previous day high and previous day low mapped as objective reference levels. | editor_verified | Supports PDH/PDL map education, uses realistic red and green candles, two-session context, volume bars, and avoids signal language. | `0f638881` |
| `public/images/learn/chart-reading/previous-day-high-failed-breakout.svg` | `/learn/previous-day-high-low/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a break above previous day high failing back below the level as review context. | Failed Breakout At Previous Day High section. | Candlestick chart showing price breaking above previous day high and failing back below the level. | editor_verified | Supports failed-PDH-breakout review, uses realistic candles, highlights the PDH zone, includes volume context, and avoids reversal guarantee language. | `0f638881` |
| `public/images/learn/chart-reading/premarket-high-low-range-map.svg` | `/learn/premarket-high-low/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show premarket high and premarket low mapped before the regular session open. | Quick Definition section. | Candlestick chart showing premarket high and premarket low mapped before the regular session open. | editor_verified | Supports PMH/PML range-map education, uses realistic red and green candles, premarket/open context, volume bars, and avoids signal language. | `a1450f3c` |
| `public/images/learn/chart-reading/premarket-high-failed-breakout.svg` | `/learn/premarket-high-low/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a break above premarket high failing back below after the open as review context. | Failed Breakout At Premarket High section. | Candlestick chart showing price breaking above premarket high and failing back below after the open. | editor_verified | Supports failed-PMH-breakout review, uses realistic candles, highlights the PMH zone, includes volume context, and avoids reversal guarantee language. | `a1450f3c` |
| `public/images/learn/chart-reading/high-of-day-level-map.svg` | `/learn/high-of-day/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show high of day as an intraday reference level with PMH and PDH context. | Quick Definition section. | Candlestick chart showing high of day as an intraday reference level with nearby PMH and PDH context. | editor_verified | Supports HOD reference-level education, uses realistic candles, nearby context levels, volume bars, and avoids signal language. | `b31325b3` |
| `public/images/learn/chart-reading/high-of-day-failed-breakout.svg` | `/learn/high-of-day/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a break above high of day failing back below the level as review context. | Failed HOD Breakout section. | Candlestick chart showing price breaking above high of day and failing back below the level. | editor_verified | Supports failed-HOD-breakout review, uses realistic candles, highlights the HOD zone, includes volume context, and avoids reversal guarantee language. | `b31325b3` |
| `public/images/learn/chart-reading/low-of-day-level-map.svg` | `/learn/low-of-day/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show low of day as an intraday reference level with PML and PDL context. | Quick Definition section. | Candlestick chart showing low of day as an intraday reference level with nearby PML and PDL context. | editor_verified | Supports LOD reference-level education, uses realistic candles, nearby context levels, volume bars, and avoids signal language. | `b31325b3` |
| `public/images/learn/chart-reading/low-of-day-failed-breakdown.svg` | `/learn/low-of-day/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a break below low of day reclaiming back above the level as review context. | Failed LOD Breakdown section. | Candlestick chart showing price breaking below low of day and reclaiming back above the level. | editor_verified | Supports failed-LOD-breakdown review, uses realistic candles, highlights the LOD zone, includes volume context, and avoids reversal guarantee language. | `b31325b3` |
| `public/images/learn/chart-reading/new-high-of-day-hold-vs-fail.svg` | `/learn/new-high-of-day/` | Chart Reading And Market Structure | realistic_candlestick_chart | Compare a new high of day that holds with one that fails back below the old high. | Quick Definition section. | Candlestick chart comparing a new high of day that holds with one that fails back below the old high. | editor_verified | Supports NHOD hold-versus-fail review, uses realistic candles, highlights the old HOD zone, includes volume context, and avoids signal language. | `30cd3b05` |
| `public/images/learn/chart-reading/new-high-of-day-chase-risk.svg` | `/learn/new-high-of-day/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show repeated new high of day pushes becoming extended far from support. | Chase Risk After Repeated New Highs section. | Candlestick chart showing repeated new high of day pushes getting farther from support and creating chase-risk review context. | editor_verified | Supports NHOD chase-risk review, uses realistic candles, support context, volume bars, and avoids predictive claims. | `30cd3b05` |
| `public/images/learn/chart-reading/breakdown-with-volume-context.svg` | `/learn/breakdown-trading/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show support breaking with lower-high pressure and volume context. | Quick Definition section. | Candlestick chart showing price breaking below support with volume context. | editor_verified | Supports breakdown-quality review, uses realistic candles, support zones, volume bars, and avoids signal language. | `bbca46b8` |
| `public/images/learn/chart-reading/failed-breakdown-reclaim-review.svg` | `/learn/breakdown-trading/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a breakdown below support quickly reclaiming the broken level. | Failed Breakdowns section. | Candlestick chart showing a breakdown below support that quickly reclaims the level. | editor_verified | Supports failed-breakdown reclaim review, uses realistic candles, highlights the support zone, and avoids reversal guarantee language. | `bbca46b8` |
| `public/images/learn/chart-reading/extended-breakdown-chase-risk.svg` | `/learn/breakdown-trading/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a breakdown entry far below support as chase-risk review context. | Extended Breakdown Chase Risk section. | Candlestick chart showing a breakdown far below support with chase-risk review labels. | editor_verified | Supports breakdown chase-risk review, uses realistic candles, support context, volume bars, and avoids predictive claims. | `bbca46b8` |
| `public/images/learn/chart-reading/compression-tightening-range.svg` | `/learn/compression/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show tightening range behavior with contracting volume near a key level. | Quick Definition section. | Candlestick chart showing price compression with tightening candles and contracting volume near a key level. | editor_verified | Supports compression education, uses realistic candles, trendline/range context, volume bars, and avoids prediction language. | `085019d2` |
| `public/images/learn/chart-reading/compression-failed-break-review.svg` | `/learn/compression/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a compression break attempt failing back inside the range. | Failed Compression Break section. | Candlestick chart showing a compression breakout attempt that fails back inside the range. | editor_verified | Supports failed-compression-break review, uses realistic candles, range context, volume bars, and avoids signal language. | `085019d2` |
| `public/images/learn/chart-reading/consolidation-range-map.svg` | `/learn/consolidation/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a clear consolidation range with support, resistance, and volume context. | Quick Definition section. | Candlestick chart showing a consolidation range with support, resistance, and volume context. | editor_verified | Supports consolidation range education, uses realistic candles, support/resistance range levels, volume bars, and avoids prediction language. | `085019d2` |
| `public/images/learn/chart-reading/consolidation-failed-range-break.svg` | `/learn/consolidation/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show a consolidation break attempt failing back inside the range. | Failed Range Break section. | Candlestick chart showing a consolidation breakout attempt that fails back inside the range. | editor_verified | Supports failed-range-break review, uses realistic candles, range context, volume bars, and avoids signal language. | `085019d2` |
| `public/images/learn/chart-reading/gap-fill-zone-map.svg` | `/learn/gap-fill-trading/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show gap zone between prior close/current open and price moving into the gap. | Quick Definition section. | Candlestick chart showing a gap zone between prior close and current open with price moving into the gap area. | editor_verified | Supports gap-fill zone education, uses realistic candles, gap top/bottom/midpoint context, volume bars, and avoids prediction language. | `efd6d0ba` |
| `public/images/learn/chart-reading/failed-gap-fill-hold-review.svg` | `/learn/gap-fill-trading/` | Chart Reading And Market Structure | realistic_candlestick_chart | Show partial fill/fail/hold above midpoint as review context. | Failed Gap Fill Or Gap Hold section. | Candlestick chart showing price entering a gap area but failing to continue filling the gap and holding above the gap midpoint. | editor_verified | Supports failed gap fill review, uses realistic candles, gap context, volume bars, and avoids guarantee language. | `efd6d0ba` |
| `public/images/learn/chart-reading/volume-expansion-at-level.svg` | `/learn/volume/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Show volume expanding as price tests a clear resistance zone. | Quick Definition section. | Candlestick chart showing volume expansion as price tests a key level. | editor_verified | Supports volume expansion education, uses realistic candles, level context, volume bars, and avoids signal language. | `72a62c5a` |
| `public/images/learn/chart-reading/volume-dry-up-before-move.svg` | `/learn/volume/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Show candles tightening while volume contracts near a decision area. | Low Volume And Dry-Up section. | Candlestick chart showing volume drying up while price tightens near a resistance zone. | editor_verified | Supports volume dry-up education, uses realistic candles, contraction context, volume bars, and avoids prediction language. | `72a62c5a` |
| `public/images/learn/chart-reading/volume-fade-after-spike.svg` | `/learn/volume/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Show participation fading after an early spike. | Volume Fade After A Spike section. | Candlestick chart showing volume fading after an early spike while price stops making clean progress. | editor_verified | Supports volume fade review, uses realistic candles, volume bars, and avoids reversal guarantee language. | `72a62c5a` |
| `public/images/learn/chart-reading/relative-volume-normal-vs-unusual.svg` | `/learn/relative-volume/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Compare normal activity with unusual relative volume. | Quick Definition section. | Candlestick chart comparing normal volume with unusual relative volume. | editor_verified | Supports relative-volume comparison education, uses realistic candles and volume bars, and avoids signal language. | `f191d165` |
| `public/images/learn/chart-reading/relative-volume-news-fade-review.svg` | `/learn/relative-volume/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Show high relative volume after news followed by fading participation. | High Relative Volume With News section. | Candlestick chart showing high relative volume after news followed by fading participation. | editor_verified | Supports relative-volume context review, uses realistic candles, catalyst context, volume bars, and avoids prediction language. | `f191d165` |
| `public/images/learn/chart-reading/rvol-time-of-day-comparison.svg` | `/learn/relative-volume-rvol/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Show today's volume compared with a normal time-of-day baseline. | Quick Definition section. | Candlestick chart showing current volume compared with a normal time-of-day baseline. | editor_verified | Supports RVOL time-of-day comparison education, uses realistic candles and volume bars, and avoids signal language. | `f714877e` |
| `public/images/learn/chart-reading/rvol-scanner-context-review.svg` | `/learn/relative-volume-rvol/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Show a scanner-style RVOL context panel beside chart and volume review. | RVOL On A Scanner section. | Candlestick chart with a scanner-style context panel showing high RVOL, catalyst, spread, and volume fade review. | editor_verified | Supports RVOL scanner review, uses realistic candles, volume bars, and avoids prediction language. | `f714877e` |
| `public/images/learn/chart-reading/volume-spike-follow-through-vs-fade.svg` | `/learn/volume-spike/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Compare a spike that follows through with a spike that fades. | Quick Definition section. | Candlestick chart comparing a volume spike that follows through with one that fades after the first burst. | editor_verified | Supports volume-spike follow-through/fade review, uses realistic candles and volume bars, and avoids guarantee language. | `b74f09f9` |
| `public/images/learn/chart-reading/volume-spike-chase-risk.svg` | `/learn/volume-spike/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Show chase risk after entering far from nearby structure after a spike. | Chase Risk After The First Spike section. | Candlestick chart showing chase risk after a late entry far above the first volume spike and nearest support. | editor_verified | Supports volume-spike chase-risk review, uses realistic candles, support context, volume bars, and avoids signal language. | `b74f09f9` |
| `public/images/learn/chart-reading/liquidity-clean-vs-thin-market.svg` | `/learn/liquidity/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Compare clean liquidity with thin liquidity using candles, spread, depth, and volume context. | Quick Definition section. | Trading dashboard comparison showing clean liquidity versus thin liquidity with candles, spread, and depth context. | editor_verified | Supports liquidity education, uses realistic candles, volume bars, spread/depth context, and avoids guarantee language. | `debb3ce8` |
| `public/images/learn/chart-reading/liquidity-spread-depth-review.svg` | `/learn/liquidity/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show bid-ask spread and depth as execution review context beside a chart. | Reading Spread And Depth section. | Trading dashboard showing bid ask spread and market depth as liquidity review context. | editor_verified | Supports spread/depth liquidity review, uses realistic candles, volume bars, quote context, and avoids signal language. | `debb3ce8` |
| `public/images/learn/chart-reading/dollar-volume-share-vs-value-comparison.svg` | `/learn/dollar-volume/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Compare high share volume with higher dollar volume across differently priced stocks. | Quick Definition section. | Trading dashboard comparison showing high share volume versus higher dollar volume. | editor_verified | Supports dollar-volume comparison education, uses realistic dashboard context, and avoids signal language. | `30d417ee` |
| `public/images/learn/chart-reading/dollar-volume-low-price-liquidity-review.svg` | `/learn/dollar-volume/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show low-priced stock share volume, dollar volume, spread, and depth review context. | Dollar Volume And Liquidity Are Related But Different section. | Trading dashboard showing low-priced stock dollar volume with spread and depth review context. | editor_verified | Supports low-priced stock liquidity review, uses realistic candles, volume bars, quote context, and avoids guarantee language. | `30d417ee` |
| `public/images/learn/chart-reading/spread-tight-vs-wide-market.svg` | `/learn/spread/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Compare tight and wide bid-ask spreads with volume context. | Quick Definition section. | Trading dashboard comparing a tight spread with a wide spread. | editor_verified | Supports spread education, uses realistic quote and volume context, and avoids signal language. | `255f7a89` |
| `public/images/learn/chart-reading/spread-hidden-execution-cost.svg` | `/learn/spread/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show hidden execution cost when entering across a wide spread. | Hidden Execution Cost section. | Trading dashboard showing hidden execution cost when entering across a wide spread. | editor_verified | Supports spread execution-cost review, uses realistic chart/quote context, and avoids guarantee language. | `255f7a89` |
| `public/images/learn/chart-reading/bid-ask-quote-mechanics.svg` | `/learn/bid-and-ask/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show bid, ask, spread, last price, depth, candles, and volume. | Quick Definition section. | Trading dashboard showing bid, ask, spread, last price, and nearby quote depth. | editor_verified | Supports bid/ask mechanics education, uses realistic quote/chart context, and avoids signal language. | `5dd2af67` |
| `public/images/learn/chart-reading/bid-ask-order-interaction-review.svg` | `/learn/bid-and-ask/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show how immediate orders interact with bid and ask quote sides. | How Orders Interact With Bid And Ask section. | Trading dashboard showing how immediate orders interact with bid and ask quotes. | editor_verified | Supports quote/order interaction review, uses realistic dashboard context, and avoids directive order advice. | `5dd2af67` |
| `public/images/learn/chart-reading/slippage-expected-vs-actual-fill.svg` | `/learn/slippage/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show expected price versus actual fill price. | Quick Definition section. | Trading dashboard showing expected price versus actual fill price. | editor_verified | Supports slippage definition education, uses realistic chart/fill context, and avoids signal language. | `13a86228` |
| `public/images/learn/chart-reading/slippage-fast-move-liquidity-review.svg` | `/learn/slippage/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show slippage during a fast candle with thin liquidity and widening spread. | Slippage During Fast Moves section. | Trading dashboard showing slippage during a fast candle with thin liquidity and a widening spread. | editor_verified | Supports fast-move slippage review, uses realistic candles, volume, spread/liquidity context, and avoids guarantee language. | `13a86228` |
| `public/images/learn/chart-reading/market-vs-limit-order-tradeoff.svg` | `/learn/market-orders-vs-limit-orders/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Compare market-order speed with limit-order price control. | Quick Definition section. | Trading dashboard comparing market order speed with limit order price control. | editor_verified | Supports order-type tradeoff education, uses realistic bid/ask context, and avoids universal order recommendations. | `8ac5648f` |
| `public/images/learn/chart-reading/limit-order-no-fill-review.svg` | `/learn/market-orders-vs-limit-orders/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show a limit order that does not fill as price moves away. | Limit Orders section. | Trading dashboard showing a limit order that does not fill as price moves away. | editor_verified | Supports no-fill review, uses realistic chart/order context, and avoids signal language. | `8ac5648f` |
| `public/images/learn/chart-reading/level-2-order-book-depth.svg` | `/learn/level-2/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show Level 2 order book depth with stacked bids and asks beside price candles. | Quick Definition section. | Trading dashboard showing a Level 2 order book with stacked bid and ask depth beside price candles. | editor_verified | Supports Level 2 depth education, uses realistic chart/order-book context, and avoids prediction language. | `8a9fc350` |
| `public/images/learn/chart-reading/level-2-depth-can-disappear.svg` | `/learn/level-2/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show visible bid depth disappearing during a fast move. | Visible Depth Can Disappear section. | Trading dashboard showing visible bid depth disappearing during a fast move. | editor_verified | Supports Level 2 limitation review, uses realistic depth/candle context, and avoids guarantee language. | `8a9fc350` |
| `public/images/learn/chart-reading/time-and-sales-prints-near-bid-ask.svg` | `/learn/time-and-sales/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show time and sales prints near bid and ask quotes beside candles. | Quick Definition section. | Trading dashboard showing time and sales prints near bid and ask quotes beside candles. | editor_verified | Supports time-and-sales print education, uses realistic tape/chart context, and avoids prediction language. | `58ea3ca3` |
| `public/images/learn/chart-reading/time-and-sales-speed-fade-review.svg` | `/learn/time-and-sales/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show tape speed increasing during a volume burst and fading afterward. | Tape Speed And Fade section. | Trading dashboard showing tape speed increasing during a volume burst and fading afterward. | editor_verified | Supports tape-speed review, uses realistic prints, candles, volume context, and avoids guarantee language. | `58ea3ca3` |
| `public/images/learn/chart-reading/volume-by-price-profile-zones.svg` | `/learn/volume-by-price/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Show horizontal volume-by-price profile with high-volume zones beside candles. | Quick Definition section. | Candlestick chart with a volume-by-price profile showing high-volume price zones. | editor_verified | Supports volume-by-price profile education, uses realistic candles and horizontal volume profile, and avoids prediction language. | `5a5bfc59` |
| `public/images/learn/chart-reading/volume-by-price-low-volume-area-review.svg` | `/learn/volume-by-price/` | Volume Liquidity And Order Flow | realistic_candlestick_chart | Show price moving through a low-volume area and stalling near a high-volume zone. | Low-Volume Areas section. | Candlestick chart with volume-by-price profile showing price moving through a low-volume area and stalling near a high-volume zone. | editor_verified | Supports low-volume-area review, uses realistic candles/profile context, and avoids guarantee language. | `5a5bfc59` |
| `public/images/learn/chart-reading/unusual-volume-normal-vs-today.svg` | `/learn/unusual-volume/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Compare normal volume with today's unusual activity and scanner context. | Quick Definition section. | Trading dashboard showing normal volume versus today's unusual volume burst with scanner context. | editor_verified | Supports unusual-volume baseline comparison, uses realistic candles and volume bars, and avoids signal language. | `80c78592` |
| `public/images/learn/chart-reading/unusual-volume-catalyst-fade-review.svg` | `/learn/unusual-volume/` | Volume Liquidity And Order Flow | realistic_trading_dashboard | Show a catalyst volume burst that fails to hold while volume fades and spread widens. | Follow-Through Versus Fade section. | Trading dashboard showing unusual volume after a catalyst, followed by failed hold, fading volume, and spread review. | editor_verified | Supports catalyst/fade/liquidity review, uses realistic candles and bid/ask context, and avoids guarantee language. | `80c78592` |
| `public/images/learn/chart-reading/stock-catalyst-quality-review.svg` | `/learn/stock-catalysts/` | News Catalysts Filings And Dilution | realistic_trading_dashboard | Show catalyst detail checks beside a realistic price and volume reaction. | Quick Definition section. | Trading dashboard showing a catalyst-quality review panel beside a realistic candlestick reaction. | editor_verified | Supports catalyst-quality review, uses realistic candles and volume bars, and avoids signal language. | `63dff225` |
| `public/images/learn/chart-reading/stock-catalyst-headline-vs-reaction.svg` | `/learn/stock-catalysts/` | News Catalysts Filings And Dilution | realistic_trading_dashboard | Compare a catalyst headline with price reaction, volume fade, and filing-review notes. | Headline Versus Market Reaction section. | Trading dashboard comparing a catalyst headline with the chart reaction, volume burst, and later fade review. | editor_verified | Supports headline-versus-reaction review, uses realistic candles and review labels, and avoids guarantee language. | `63dff225` |
| `public/images/learn/chart-reading/press-release-anatomy-review.svg` | `/learn/press-releases/` | News Catalysts Filings And Dilution | realistic_trading_dashboard | Show press-release anatomy with headline, timestamp, source, key details, risk language, and filing check. | Quick Definition section. | Dark dashboard showing a press release anatomy review with headline, timestamp, source, key details, risk language, and filing check. | editor_verified | Supports press-release anatomy review, uses realistic dashboard/chart context, and avoids signal language. | `a089acc5` |
| `public/images/learn/chart-reading/press-release-reaction-review.svg` | `/learn/press-releases/` | News Catalysts Filings And Dilution | realistic_trading_dashboard | Show first reaction, volume burst, fade review, and journal notes after a press release. | Chart Reaction Still Matters section. | Dark trading dashboard showing a press release headline, red and green candlesticks, volume burst, and fade review notes. | editor_verified | Supports press-release reaction review, uses realistic candles and volume bars, and avoids guarantee language. | `a089acc5` |
| `public/images/learn/chart-reading/press-release-reading-workflow.svg` | `/learn/how-to-read-stock-press-releases/` | News Catalysts Filings And Dilution | realistic_trading_dashboard | Show workflow from headline to source, catalyst type, details, filing check, chart reaction, and journal notes. | Quick Definition section. | Dark dashboard showing a step-by-step press-release reading workflow from headline to filing check to chart reaction. | editor_verified | Supports the press-release reading workflow and avoids signal language. | `31f3f02c` |
| `public/images/learn/chart-reading/press-release-specific-vs-vague.svg` | `/learn/how-to-read-stock-press-releases/` | News Catalysts Filings And Dilution | realistic_trading_dashboard | Compare specific release details with vague language beside chart reaction context. | Step 3 section. | Dark dashboard comparing specific press-release details with vague language beside a realistic chart reaction. | editor_verified | Supports specific-versus-vague detail review and avoids guarantee language. | `31f3f02c` |
| `public/images/learn/chart-reading/sec-filing-map-for-traders.svg` | `/learn/sec-filings/` | News Catalysts Filings And Dilution | realistic_dashboard_diagram | Show common SEC filing categories traders review. | Quick Definition section. | Dark dashboard showing a filing map for traders with current reports, registration statements, offering documents, ownership filings, and financial reports. | editor_verified | Supports SEC filing category education and avoids signal language. | `4616c671` |
| `public/images/learn/chart-reading/sec-filing-8k-event-review.svg` | `/learn/sec-filings/` | News Catalysts Filings And Dilution | realistic_trading_dashboard | Show Form 8-K current-event review beside chart and volume context. | Form 8-K section. | Dark trading dashboard showing a Form 8-K current-event filing beside a realistic chart reaction and review notes. | editor_verified | Supports 8-K event review, uses realistic candles and volume bars, and avoids prediction language. | `4616c671` |
| `public/images/learn/chart-reading/sec-filing-shelf-to-offering-flow.svg` | `/learn/sec-filings/` | News Catalysts Filings And Dilution | realistic_dashboard_diagram | Show shelf registration to offering flow with dilution review context. | Shelf Registration To Offering Flow section. | Dark dashboard showing a shelf registration to offering flow with S-3, effective shelf, 424B5 terms, 8-K details, and dilution review. | editor_verified | Supports shelf/offering flow education and avoids guarantee language. | `4616c671` |

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

Higher highs and higher lows SVG verification:

- Both visuals support the actual higher-highs/higher-lows lesson.
- The uptrend structure visual shows realistic rising candles, higher-low zones, and volume context.
- The higher-low failure visual shows the latest higher-low area failing as review context, not as a prediction.
- Labels avoid buy/sell language, profit claims, and guaranteed-continuation claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the higher-high/higher-low structure article.

Lower highs and lower lows SVG verification:

- Both visuals support the actual lower-highs/lower-lows lesson.
- The downtrend structure visual shows realistic weak bounces, lower-high zones, lower lows, and volume context.
- The lower-high reclaim visual shows a meaningful lower-high area being reclaimed as review context, not as a reversal guarantee.
- Labels avoid buy/sell language, profit claims, and guaranteed-continuation claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the lower-high/lower-low structure article.

Pivot levels SVG verification:

- Both visuals support the actual pivot-levels lesson.
- The pivot reaction map shows realistic repeated reactions around one clear zone instead of random lines.
- The failed reclaim visual shows a pivot losing, retesting, and rejecting as review context, not as a prediction.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the pivot-levels article.

Previous day high/low SVG verification:

- Both visuals support the actual previous-day high/low lesson.
- The PDH/PDL map shows a prior session and current session with objective reference zones.
- The failed PDH breakout visual shows price breaking above the previous day high and failing back below it as review context, not as a reversal guarantee.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the previous-day high/low article.

Premarket high/low SVG verification:

- Both visuals support the actual premarket high/low lesson.
- The PMH/PML map shows a premarket range and regular-session reaction with clear reference zones.
- The failed PMH breakout visual shows price breaking above premarket high and failing back below it as review context, not as a reversal guarantee.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.
- The batch is appropriate for the premarket high/low article.

High of day and low of day SVG verification:

- All four visuals support the actual HOD/LOD lessons.
- The HOD level map shows high of day with PMH, PDH, volume, and extension context.
- The failed HOD breakout visual shows price failing back below HOD as review context, not as a reversal guarantee.
- The LOD level map shows low of day with PML, PDL, volume, and lower-high context.
- The failed LOD breakdown visual shows price reclaiming LOD as review context, not as a reversal guarantee.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

New high of day SVG verification:

- Both visuals support the actual new-high-of-day lesson.
- The hold-versus-fail visual shows the old HOD zone and two plausible outcomes without implying certainty.
- The chase-risk visual shows repeated NHOD pushes becoming extended from support.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Breakdown trading SVG verification:

- All three visuals support the actual breakdown-trading gap lesson.
- The breakdown-with-volume visual shows lower-high pressure into a clear support zone and expanded volume.
- The failed-breakdown visual shows support breaking and reclaiming as review context, not as a reversal guarantee.
- The extended-breakdown visual shows late-entry distance from the broken level as chase-risk context.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Compression and consolidation SVG verification:

- All four visuals support the actual compression and consolidation lessons.
- Compression visuals show tightening price action, contracting volume, and a failed break back inside the range.
- Consolidation visuals show clear range support/resistance and failed range-break review.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Gap fill trading SVG verification:

- Both visuals support the actual gap-fill lesson.
- The gap-zone map shows prior close/current open, gap top/bottom, midpoint, and a realistic move into the gap.
- The failed gap fill visual shows a partial fill stalling/holding as review context, not as a guarantee.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Volume SVG verification:

- All three visuals support the actual volume foundation lesson.
- The expansion visual shows participation increasing at a visible level with realistic candles and volume bars.
- The dry-up visual shows tightening price action and contracting volume without implying a future move is guaranteed.
- The fade-after-spike visual shows participation dropping after the loudest candle as review context, not as reversal certainty.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Relative volume SVG verification:

- Both visuals support the actual relative-volume lesson.
- The comparison visual shows normal activity versus unusual relative volume with realistic candles and volume bars.
- The news-fade visual shows high relative volume after news followed by fading participation as review context, not as a prediction.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

RVOL SVG verification:

- Both visuals support the actual RVOL scanner-metric lesson.
- The time-of-day comparison visual shows today's activity against a normal baseline, with realistic candles and volume bars.
- The scanner-context visual shows RVOL alongside catalyst, spread, and fade review so the number is not treated as a signal.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Volume spike SVG verification:

- Both visuals support the actual volume-spike lesson.
- The follow-through-versus-fade visual compares two realistic outcomes without implying either outcome is guaranteed.
- The chase-risk visual shows price far from nearby structure after the first spike and fading volume as review context.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Liquidity SVG verification:

- Both visuals support the actual liquidity lesson.
- The clean-versus-thin visual compares realistic candles, volume, spread, and depth so liquidity is tied to execution, not abstract theory.
- The spread/depth review visual shows a quote panel beside a chart to teach why last price is not the same as clean execution.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Dollar volume SVG verification:

- Both visuals support the actual dollar-volume lesson.
- The share-versus-value comparison visual shows why high share volume can still mean lower traded value.
- The low-priced-stock liquidity visual connects dollar volume with spread, depth, candles, and volume bars.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Spread SVG verification:

- Both visuals support the actual spread lesson.
- The tight-versus-wide visual compares realistic bid/ask quotes and volume context.
- The hidden execution cost visual shows how a fill at the ask can change planned risk before price moves.
- Labels avoid buy/sell language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Bid and ask SVG verification:

- Both visuals support the actual bid-and-ask lesson.
- The quote-mechanics visual shows bid, ask, spread, last price, depth, candles, and volume in one realistic dashboard.
- The order-interaction visual explains how immediate order context interacts with bid and ask without giving trade instructions.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Slippage SVG verification:

- Both visuals support the actual slippage lesson.
- The expected-versus-actual fill visual shows the gap between planned price and real fill price.
- The fast-move liquidity visual connects slippage with thin liquidity, widening spread, and volume-spike context.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Market orders versus limit orders SVG verification:

- Both visuals support the actual order-type lesson.
- The tradeoff visual compares speed and price control using bid/ask context without recommending one order type universally.
- The no-fill visual shows how price can move away from a limit order and create review questions.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Level 2 SVG verification:

- Both visuals support the actual Level 2 lesson.
- The order-book-depth visual shows stacked bid and ask levels beside realistic candles and volume context.
- The depth-can-disappear visual shows visible depth shrinking during a fast move as review context, not prediction.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Time and sales SVG verification:

- Both visuals support the actual time-and-sales lesson.
- The prints-near-bid/ask visual shows actual tape prints beside a realistic quote and candle context.
- The tape-speed visual shows print pace increasing and fading as review context, not prediction.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Volume by price SVG verification:

- Both visuals support the actual volume-by-price lesson.
- The profile-zones visual shows horizontal volume-by-price bars beside realistic candles.
- The low-volume-area visual shows price moving through a low-volume area and stalling near a higher-volume zone as review context.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Unusual volume SVG verification:

- Both visuals support the actual unusual-volume lesson.
- The normal-versus-today visual compares baseline activity with an abnormal-volume session and scanner context.
- The catalyst-fade visual shows a realistic volume burst, failed hold, fading volume, and spread review.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Stock catalysts SVG verification:

- Both visuals support the actual stock-catalysts lesson.
- The catalyst-quality visual shows detail checks, filing review, dilution review, and a realistic chart reaction.
- The headline-versus-reaction visual shows a catalyst headline, volume burst, fade review, and filing/liquidity notes.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

Press releases SVG verification:

- Both visuals support the actual press-releases lesson.
- The anatomy visual shows headline, timestamp, source, key details, risk language, filing check, and chart context.
- The reaction visual shows first reaction, fade review, volume bars, spread/liquidity journal prompts, and review-not-prediction language.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

How to read stock press releases SVG verification:

- Both visuals support the actual step-by-step press-release reading lesson.
- The workflow visual shows source/time, catalyst type, specific details, filing check, chart reaction, and journal notes.
- The specific-versus-vague visual compares reviewable details with vague language while keeping chart reaction context visible.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

SEC filings SVG verification:

- All three visuals support the actual SEC filings hub.
- The filing-map visual explains common filing categories without implying direction.
- The 8-K event visual uses realistic red and green candles with volume bars and review labels.
- The shelf-to-offering flow visual explains S-3/S-1, effective shelf, 424B5, 8-K, and dilution review without claiming immediate dilution.
- Labels avoid buy/sell signal language, profit claims, and guaranteed-outcome claims.
- The visuals are wired to article sections where they add learning value.

## Next Asset Batch Candidates

After the completed Chart Reading and Volume Liquidity batches, the next high-value SVG batch should likely support one of these:

1. Form 8-K: current-event filing workflow, item/detail review, and financing/risk language.
2. Form S-1, Form S-3, and Form 424B5: registration-to-offering path.
3. Dilution-risk path: offering language, shelf registrations, warrants, and convertible securities.
4. Risk discipline path: FOMO loop, revenge trading loop, overtrading spiral.
5. Trade review path: trade timeline, planned vs actual risk, execution review timeline.
