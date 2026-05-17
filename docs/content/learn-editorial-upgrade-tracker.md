# TradersLink Learn Editorial Upgrade Tracker

## Purpose

This tracker is used to manage the full Learn editorial upgrade workflow from start to finish.

The Learn section is now treated as an educational learning journey, not just SEO content. This tracker helps ChatGPT and Codex track which content has been reviewed, what needs upgrading, where visuals are needed, where new gap articles are needed, and what has passed editor verification.

## Source Workflow

Use this tracker with:

```text
docs/content/learn-editorial-upgrade-process.md
docs/content/learn-learning-journey-implementation-plan.md
docs/content/learn-visual-content-plan.md
docs/content/learn-image-asset-manifest.md
```

## Status Values

```text
not_started
pre_review_done
needs_light_upgrade
needs_full_upgrade
gap_article_needed
visuals_needed
in_progress
needs_editor_verification
complete
paused
```

## Upgrade Decision Values

```text
no_change_needed
light_upgrade
full_upgrade
gap_article_needed
visual_only_upgrade
metadata_only_upgrade
```

## Content Levels

```text
Foundation
Practical
Advanced
Review
```

## Current Overall Status

| Area | Status | Notes |
|---|---|---|
| Learning journey implementation plan | complete | Created `docs/content/learn-learning-journey-implementation-plan.md`. |
| Visual content plan | complete | Created `docs/content/learn-visual-content-plan.md`. |
| Editorial upgrade process | complete | Created `docs/content/learn-editorial-upgrade-process.md`. |
| Editorial upgrade tracker | in_progress | This file tracks the editorial upgrade system. |
| Image asset manifest | complete | Created `docs/content/learn-image-asset-manifest.md` during the first SVG batch and updated after the second SVG batch. |
| Gold standard article upgrade | complete | `/learn/support-and-resistance/` was upgraded as the first model article. |
| Chart Reading article upgrade 2 | complete | `/learn/how-to-draw-support-and-resistance/` upgraded using the gold-standard model. |
| Chart Reading article upgrade 3 | complete | `/learn/support-levels/` upgraded as the third Chart Reading article with support hold, break, and reclaim visuals. |
| Chart Reading article upgrade 4 | complete | `/learn/resistance-levels/` upgraded as the fourth Chart Reading article with resistance rejection, break, and failed-breakout visuals. |
| Chart Reading article upgrade 5 | complete | `/learn/key-levels-trading/` upgraded as the practical level-map bridge article with two realistic chart visuals. |
| Chart Reading article upgrade 6 | complete | `/learn/breakout-trading/` upgraded with breakout quality, failed breakout, and chase-risk visuals. |
| Chart Reading article upgrade 7 | complete | `/learn/level-breakout/` upgraded with breakout retest/hold and failed-hold visuals. |
| Chart Reading article upgrade 8 | complete | `/learn/level-reclaim/` upgraded with reclaim-and-hold and reclaim-failure visuals. |
| Chart Reading article upgrade 9 | complete | `/learn/price-rejection/` upgraded with rejection-at-resistance and wick-context visuals. |
| Chart Reading article upgrade 10 | complete | `/learn/break-of-structure/` upgraded with uptrend and downtrend structure-break visuals. |
| Learn hub website build | not_started | Codex should not build until explicitly requested. |

## Track Upgrade Order

| Order | Learning Track | Status | Priority | Notes |
|---:|---|---|---:|---|
| 1 | Start Here For New Traders | not_started | 1 | Foundation path for new users. |
| 2 | Chart Reading And Market Structure | in_progress | 1 | Support/resistance, level drawing, support/resistance levels, key levels, breakout trading, level breakout, level reclaim, price rejection, and break of structure articles complete. Continue with swing highs/lows, trend structure, breakdown, fakeout, and intraday level concepts. |
| 3 | News, Catalysts, Filings, And Dilution | not_started | 1 | High-value TradersLink differentiator. |
| 4 | Risk, Discipline, And Psychology | not_started | 1 | Important coaching/retention path. |
| 5 | Execution And Trade Review | not_started | 1 | Strongest Trader Intelligence bridge. |
| 6 | Volume, Liquidity, And Order Flow | not_started | 2 | Important for day traders and scalpers. |
| 7 | Day Trading Workflow | not_started | 2 | Practical user workflow path. |
| 8 | Practice And Improvement | not_started | 2 | Helps users train before increasing risk. |
| 9 | Candlestick Patterns In Context | not_started | 3 | Needs visuals and context warnings. |
| 10 | Trading Styles | not_started | 3 | Useful selector path. |
| 11 | Halts And High-Volatility Events | not_started | 3 | Risk education path. |
| 12 | Small-Cap, Float, And Short Squeeze Context | not_started | 2 | Should stay educational and non-hype. |

## Completed Model Article

Completed first model article:

```text
/learn/support-and-resistance/
```

This is now the model for future Learn article upgrades.

Alternative future gold-standard article:

```text
/learn/sec-filings/
```

## Article Upgrade Tracker Table

| Article/Slug | Draft Path | Primary Track | Secondary Tracks | Level | Status | Upgrade Decision | Visuals Needed | Gap Article? | Priority | Editor Notes | Last Commit |
|---|---|---|---|---|---|---|---|---|---:|---|---|
| /learn/support-and-resistance/ | docs/content/drafts/learn/support-and-resistance.md | Chart Reading And Market Structure | Start Here For New Traders, Execution And Trade Review | Foundation | complete | full_upgrade | 4 realistic SVG chart diagrams created and wired to content | No | 1 | Gold-standard article complete. Added learning path note, visual assets, realistic examples, support/resistance role reversal sections, bad-level example, checklist, journal review prompts, Trader Intelligence bridge, related terms, and editor-safe language. | `7c46572524af559e42a53a34531272bd3154dd6f` |
| /learn/how-to-draw-support-and-resistance/ | docs/content/drafts/learn/how-to-draw-support-and-resistance.md | Chart Reading And Market Structure | Start Here For New Traders | Practical | complete | full_upgrade | 3 realistic SVG chart diagrams created and wired to content | No | 1 | Upgraded as second Chart Reading article. Added learning path metadata, previous/next metadata, zones-vs-lines visual, obvious reaction visual, actionable near-price levels visual, step-by-step process, checklist, journal review prompts, Trader Intelligence bridge, and editor-safe language. | `26daa98458b746ca447a59f593ee5eda6380cffe` |
| /learn/support-levels/ | docs/content/drafts/learn/support-levels.md | Chart Reading And Market Structure | Start Here For New Traders, Execution And Trade Review | Practical | complete | full_upgrade | 3 realistic SVG chart diagrams created and wired to content | No | 1 | Completed third Chart Reading article upgrade. Added learning path metadata, previous/next metadata, support hold visual, support break visual, support reclaim visual, realistic examples, common mistakes, checklist, journal review prompts, Trader Intelligence bridge, related lessons, related glossary terms, FAQ, and editor-safe language. | `ea86c4f9` |
| /learn/resistance-levels/ | docs/content/drafts/learn/resistance-levels.md | Chart Reading And Market Structure | Start Here For New Traders, Execution And Trade Review | Practical | complete | full_upgrade | 3 realistic SVG chart diagrams created and wired to content | No | 1 | Completed fourth Chart Reading article upgrade. Added learning path metadata, previous/next metadata, resistance rejection visual, resistance break visual, failed breakout visual, realistic examples, common mistakes, checklist, journal review prompts, Trader Intelligence bridge, related lessons, related glossary terms, FAQ, and editor-safe language. | `688c4ac7` |
| /learn/key-levels-trading/ | docs/content/drafts/learn/key-levels-trading.md | Chart Reading And Market Structure | Start Here For New Traders, Execution And Trade Review | Practical | complete | full_upgrade | 2 realistic SVG chart diagrams created and wired to content | No | 1 | Completed practical level-map bridge article. Added learning path metadata, previous/next metadata, current-price level-map visual, key-level review workflow visual, realistic examples, common mistakes, checklist, journal review prompts, Trader Intelligence bridge, related lessons, related glossary terms, FAQ, and editor-safe language. | `4121eaf9` |
| /learn/breakout-trading/ | docs/content/drafts/learn/breakout-trading.md | Chart Reading And Market Structure | Volume Liquidity And Order Flow, Execution And Trade Review | Practical | complete | full_upgrade | 3 realistic SVG chart diagrams created and wired to content | No | 1 | Completed breakout trading upgrade. Added learning path metadata, previous/next metadata, breakout-with-volume visual, failed-breakout visual, extended chase-risk visual, realistic examples, common mistakes, checklist, journal review prompts, Trader Intelligence bridge, related terms, FAQ, and editor-safe language. | `bdd8664e` |
| /learn/level-breakout/ | docs/content/drafts/learn/level-breakout.md | Chart Reading And Market Structure | Volume Liquidity And Order Flow, Execution And Trade Review | Practical | complete | full_upgrade | 2 realistic SVG chart diagrams created and wired to content | No | 1 | Completed level breakout upgrade. Added learning path metadata, previous/next metadata, breakout retest/hold visual, failed-hold visual, realistic examples, common mistakes, checklist, journal review prompts, Trader Intelligence bridge, related terms, FAQ, and editor-safe language. | `1377793b` |
| /learn/level-reclaim/ | docs/content/drafts/learn/level-reclaim.md | Chart Reading And Market Structure | Execution And Trade Review | Practical | complete | full_upgrade | 2 realistic SVG chart diagrams created and wired to content | No | 1 | Completed level reclaim upgrade. Added learning path metadata, previous/next metadata, reclaim-and-hold visual, reclaim-failure visual, realistic examples, common mistakes, checklist, journal review prompts, Trader Intelligence bridge, related terms, FAQ, and editor-safe language. | `57664031` |
| /learn/price-rejection/ | docs/content/drafts/learn/price-rejection.md | Chart Reading And Market Structure | Candlestick Patterns In Context, Execution And Trade Review | Practical | complete | full_upgrade | 2 realistic SVG chart diagrams created and wired to content | No | 1 | Completed price rejection upgrade. Added learning path metadata, previous/next metadata, rejection-at-resistance visual, wick-context visual, realistic examples, common mistakes, checklist, journal review prompts, Trader Intelligence bridge, related terms, FAQ, and editor-safe language. | `3ff3c7c4` |
| /learn/break-of-structure/ | docs/content/drafts/learn/break-of-structure.md | Chart Reading And Market Structure | Execution And Trade Review | Advanced | complete | full_upgrade | 2 realistic SVG chart diagrams created and wired to content | No | 1 | Completed break of structure upgrade. Added learning path metadata, previous/next metadata, uptrend structure-break visual, downtrend structure-break visual, realistic examples, common mistakes, checklist, journal review prompts, Trader Intelligence bridge, related terms, FAQ, and editor-safe language. | `d03cf796` |
| /learn/swing-highs-and-swing-lows/ | docs/content/drafts/learn/swing-highs-and-swing-lows.md | Chart Reading And Market Structure | Start Here For New Traders | Foundation | not_started | full_upgrade | 1 to 2 realistic SVG chart diagrams | No | 1 | Should teach swing point identification as the foundation for higher highs/lows, lower highs/lows, and break of structure. |  |
| /learn/sec-filings/ | docs/content/drafts/learn/sec-filings.md | News, Catalysts, Filings, And Dilution | Small-Cap, Float, And Short Squeeze Context | Foundation | not_started | full_upgrade | 2 to 3 filing flow diagrams | No | 1 | Alternative gold-standard article. Needs beginner path, filing map, risk warnings, and links to dilution/offering concepts. |  |
| /learn/start-here/ | docs/content/drafts/learn/start-here.md | Start Here For New Traders | All Tracks | Foundation | not_started | gap_article_needed | 1 journey map SVG | Yes | 1 | Gap article likely needed to introduce the learning system and guide new users. |  |
| /learn/how-to-use-traderslink-learn/ | docs/content/drafts/learn/how-to-use-traderslink-learn.md | Start Here For New Traders | All Tracks | Foundation | not_started | gap_article_needed | 1 navigation diagram | Yes | 1 | Gap article likely needed to teach users how to move through learning paths. |  |
| /learn/chart-reading-path/ | docs/content/drafts/learn/chart-reading-path.md | Chart Reading And Market Structure | Candlestick Patterns In Context, Volume Liquidity And Order Flow | Foundation | not_started | gap_article_needed | 1 path diagram | Yes | 2 | Track hub article for chart reading learning path. |  |
| /learn/news-and-filings-path/ | docs/content/drafts/learn/news-and-filings-path.md | News, Catalysts, Filings, And Dilution | Small-Cap, Float, And Short Squeeze Context | Foundation | not_started | gap_article_needed | 1 filing/catalyst path diagram | Yes | 1 | High-value small-cap education hub. |  |
| /learn/trade-review-path/ | docs/content/drafts/learn/trade-review-path.md | Execution And Trade Review | Practice And Improvement | Foundation | not_started | gap_article_needed | 1 review workflow SVG | Yes | 1 | Important product education bridge. |  |
| /learn/risk-discipline-path/ | docs/content/drafts/learn/risk-discipline-path.md | Risk, Discipline, And Psychology | Start Here For New Traders | Foundation | not_started | gap_article_needed | 1 psychology/risk loop SVG | Yes | 1 | Coaching-style risk and behavior path. |  |
| /learn/practice-and-improvement-path/ | docs/content/drafts/learn/practice-and-improvement-path.md | Practice And Improvement | Execution And Trade Review | Foundation | not_started | gap_article_needed | 1 practice ladder SVG | Yes | 2 | Useful for safer learning. |  |

## Visual Asset Tracker Table

Canonical image tracking now lives in:

```text
docs/content/learn-image-asset-manifest.md
```

Summary of completed Chart Reading SVG batches:

| Asset File | Related Article/Slug | Learning Track | Visual Type | Purpose | Suggested Placement | Alt Text | Status | Editor Verification | Commit SHA |
|---|---|---|---|---|---|---|---|---|---|
| public/images/learn/chart-reading/support-resistance-candlestick-diagram.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show price moving between support and resistance zones. | Intro visual | Candlestick chart showing price bouncing near support and rejecting near resistance. | editor_verified | Supports the article topic, uses realistic candles and volume, avoids buy/sell language, and treats levels as educational zones. | `8b7d4b28f20c90adf0d3301887dbf67b17c9ca08` |
| public/images/learn/chart-reading/support-breaks-becomes-resistance.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show support breaking and later acting as resistance. | Body section | Candlestick chart showing broken support later acting as resistance. | editor_verified | Supports role-reversal concept, uses realistic candles, and avoids predictive language. | `9594e68325fcacc512d2f772f2d69dd024c0a8eb` |
| public/images/learn/chart-reading/resistance-breaks-becomes-support.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show resistance breaking and later acting as support. | Body section | Candlestick chart showing broken resistance later acting as support. | editor_verified | Supports role-reversal concept, uses realistic candles, and avoids guarantee language. | `f0febdfd9eab7b3a5a9ce68595f1787cd7f1c9e4` |
| public/images/learn/chart-reading/bad-support-resistance-example.svg | /learn/support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show common bad level drawing mistakes. | Common mistakes section | Chart diagram showing support and resistance levels drawn too randomly or too precisely. | editor_verified | Supports the common mistakes section and helps users understand chart clutter. | `003b0bbc79cafc546696b32312f6bc83e147bcf4` |
| public/images/learn/chart-reading/support-resistance-zones-vs-lines.svg | /learn/how-to-draw-support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Compare exact lines with cleaner zones. | Step 1: zones, not exact lines. | Educational chart comparing exact support and resistance lines with cleaner support and resistance zones. | editor_verified | Supports zones-vs-lines teaching point and avoids false precision. | `1bc433405e7f8ad4aaa8f4dd615f22926bcbf839` |
| public/images/learn/chart-reading/mark-obvious-reaction-levels.svg | /learn/how-to-draw-support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show obvious repeated reaction areas. | Step 2: obvious reactions. | Candlestick chart showing how to mark only obvious support and resistance reaction areas. | editor_verified | Supports level selection process and teaches pre-trade visibility. | `8773da36c3f09bf66724314fa855e360d967345f` |
| public/images/learn/chart-reading/near-price-actionable-levels.svg | /learn/how-to-draw-support-and-resistance/ | Chart Reading And Market Structure | realistic candlestick chart | Show keeping closest actionable levels. | Step 4: current-plan levels. | Chart showing nearest actionable support and resistance levels around current price. | editor_verified | Supports practical workflow and reduces chart clutter. | `578247cbce1d0abd0245fa87c998b38533685618` |
| public/images/learn/chart-reading/support-level-hold.svg | /learn/support-levels/ | Chart Reading And Market Structure | realistic candlestick chart | Show support holding as reviewable context. | Quick Definition section. | Candlestick chart showing price holding above a support zone with volume context. | editor_verified | Supports the support hold section and avoids guarantee language. | `ea86c4f9` |
| public/images/learn/chart-reading/support-level-break.svg | /learn/support-levels/ | Chart Reading And Market Structure | realistic candlestick chart | Show support breaking and later retesting. | When Support Breaks section. | Candlestick chart showing a support zone breaking with increased volume and a later retest. | editor_verified | Supports the support break section and frames the break as context to review. | `ea86c4f9` |
| public/images/learn/chart-reading/support-level-reclaim.svg | /learn/support-levels/ | Chart Reading And Market Structure | realistic candlestick chart | Show support briefly failing, reclaiming, and holding above the zone. | When Support Reclaims section. | Candlestick chart showing price losing support, reclaiming the zone, and holding above it. | editor_verified | Supports the reclaim section and avoids reversal guarantee language. | `ea86c4f9` |
| public/images/learn/chart-reading/resistance-level-rejection.svg | /learn/resistance-levels/ | Chart Reading And Market Structure | realistic candlestick chart | Show resistance rejecting as reviewable context. | Quick Definition section. | Candlestick chart showing price rejecting from a resistance zone with volume context. | editor_verified | Supports the resistance rejection section and avoids reversal guarantee language. | `688c4ac7` |
| public/images/learn/chart-reading/resistance-level-break.svg | /learn/resistance-levels/ | Chart Reading And Market Structure | realistic candlestick chart | Show resistance breaking and holding above the zone. | When Resistance Breaks section. | Candlestick chart showing price breaking above a resistance zone and holding above it. | editor_verified | Supports the resistance break section and frames the break as context to review. | `688c4ac7` |
| public/images/learn/chart-reading/failed-breakout-at-resistance.svg | /learn/resistance-levels/ | Chart Reading And Market Structure | realistic candlestick chart | Show a breakout attempt above resistance failing back below the zone. | Failed breakout section. | Candlestick chart showing a breakout attempt above resistance that fails back below the zone. | editor_verified | Supports chase-risk and failed-breakout review without predictive claims. | `688c4ac7` |
| public/images/learn/chart-reading/key-level-map-current-price.svg | /learn/key-levels-trading/ | Chart Reading And Market Structure | realistic candlestick chart | Show a clean current-price level map. | Quick Definition section. | Candlestick chart showing a clean key-level map around current price. | editor_verified | Supports practical level selection and avoids signal language. | `4121eaf9` |
| public/images/learn/chart-reading/key-level-review-workflow.svg | /learn/key-levels-trading/ | Chart Reading And Market Structure | realistic candlestick chart | Show hold, break, reject, and review behavior around a key level. | Step 3: review questions. | Educational chart workflow showing hold, break, reject, and reclaim behavior around key levels. | editor_verified | Supports journal review workflow and avoids predictive claims. | `4121eaf9` |
| public/images/learn/chart-reading/breakout-with-volume-context.svg | /learn/breakout-trading/ | Chart Reading And Market Structure | realistic candlestick chart | Show breakout quality with volume context. | Quick Definition section. | Candlestick chart showing price breaking above resistance with volume context. | editor_verified | Supports breakout-quality review and avoids continuation certainty. | `bdd8664e` |
| public/images/learn/chart-reading/failed-breakout-review.svg | /learn/breakout-trading/ | Chart Reading And Market Structure | realistic candlestick chart | Show breakout failure below the breakout level. | Failed Breakouts section. | Candlestick chart showing a breakout attempt that fails back below the breakout level. | editor_verified | Supports failed-breakout review and avoids predictive claims. | `bdd8664e` |
| public/images/learn/chart-reading/extended-breakout-chase-risk.svg | /learn/breakout-trading/ | Chart Reading And Market Structure | realistic candlestick chart | Show extended distance from the breakout level as chase-risk context. | Extended Breakout Chase Risk section. | Candlestick chart showing a breakout far above the level with chase-risk review labels. | editor_verified | Supports chase-risk review without buy/sell language. | `bdd8664e` |
| public/images/learn/chart-reading/level-breakout-retest-hold.svg | /learn/level-breakout/ | Chart Reading And Market Structure | realistic candlestick chart | Show breakout retest and hold above the level. | Breakout Retest And Hold section. | Candlestick chart showing price breaking above a level, retesting it, and holding above the zone. | editor_verified | Supports retest/hold review and avoids continuation certainty. | `1377793b` |
| public/images/learn/chart-reading/level-breakout-failed-hold.svg | /learn/level-breakout/ | Chart Reading And Market Structure | realistic candlestick chart | Show breakout failed hold below the level. | Failed Hold After A Breakout section. | Candlestick chart showing price breaking above a level and then failing back below the breakout zone. | editor_verified | Supports failed-hold review and avoids predictive claims. | `1377793b` |
| public/images/learn/chart-reading/level-reclaim-hold.svg | /learn/level-reclaim/ | Chart Reading And Market Structure | realistic candlestick chart | Show lost level reclaimed and held. | Reclaim And Hold section. | Candlestick chart showing price losing a key level, reclaiming it, and holding above the zone. | editor_verified | Supports reclaim-and-hold review and avoids continuation certainty. | `57664031` |
| public/images/learn/chart-reading/level-reclaim-failure.svg | /learn/level-reclaim/ | Chart Reading And Market Structure | realistic candlestick chart | Show reclaim failure below the level. | Reclaim Failure section. | Candlestick chart showing price reclaiming a level briefly and then failing back below the zone. | editor_verified | Supports reclaim failure review and avoids predictive claims. | `57664031` |
| public/images/learn/chart-reading/price-rejection-at-resistance.svg | /learn/price-rejection/ | Chart Reading And Market Structure | realistic candlestick chart | Show price rejection at resistance. | Quick Definition section. | Candlestick chart showing price pushing into resistance and rejecting back below the zone. | editor_verified | Supports rejection-at-level review and avoids reversal certainty. | `3ff3c7c4` |
| public/images/learn/chart-reading/rejection-wick-context.svg | /learn/price-rejection/ | Chart Reading And Market Structure | realistic candlestick chart | Show long wick rejection with follow-through context. | Rejection Needs Context section. | Candlestick chart showing a long wick at a key level with follow-through context. | editor_verified | Supports wick-context education without treating every wick as a signal. | `3ff3c7c4` |
| public/images/learn/chart-reading/uptrend-structure-break.svg | /learn/break-of-structure/ | Chart Reading And Market Structure | realistic candlestick chart | Show uptrend structure breaking below the latest higher low. | Uptrend Structure Break section. | Candlestick chart showing higher highs and higher lows before price breaks below the latest higher low. | editor_verified | Supports uptrend structure-break review and avoids predictive claims. | `d03cf796` |
| public/images/learn/chart-reading/downtrend-structure-break.svg | /learn/break-of-structure/ | Chart Reading And Market Structure | realistic candlestick chart | Show downtrend structure breaking above the latest lower high. | Downtrend Structure Break section. | Candlestick chart showing lower highs and lower lows before price breaks above the latest lower high. | editor_verified | Supports downtrend structure-break review and avoids reversal certainty. | `d03cf796` |

## Gap Article Tracker

| Proposed Article | Reason For Gap | Learning Track | Priority | Status | Notes | Commit SHA |
|---|---|---|---:|---|---|---|
| /learn/start-here/ | Users need a clear first step before entering topic-specific paths. | Start Here For New Traders | 1 | not_started | Should introduce the whole learning journey. |  |
| /learn/how-to-use-traderslink-learn/ | Users need guidance on how to use paths, glossary, and Trader Intelligence bridges. | Start Here For New Traders | 1 | not_started | Could be combined with Start Here or separate. |  |
| /learn/chart-reading-path/ | Chart reading needs a hub that orders support/resistance, breakouts, fakeouts, and candles. | Chart Reading And Market Structure | 2 | not_started | Track hub article. |  |
| /learn/news-and-filings-path/ | News and filings need a guided path because the topic can overwhelm users. | News, Catalysts, Filings, And Dilution | 1 | not_started | High-value small-cap education hub. |  |
| /learn/trade-review-path/ | Trade review needs a hub to bridge education to Trader Intelligence. | Execution And Trade Review | 1 | not_started | Important product education bridge. |  |
| /learn/risk-discipline-path/ | Risk and psychology concepts need a coaching-style path. | Risk, Discipline, And Psychology | 1 | not_started | Good user retention path. |  |
| /learn/practice-and-improvement-path/ | Practice concepts need a sequence from paper trading to forward testing. | Practice And Improvement | 2 | not_started | Useful for safer learning. |  |

## Editor Verification Log

| Date | Article/Asset | Work Completed | Editor Verification Result | Commit SHA |
|---|---|---|---|---|
| 2026-05-17 | Tracker initialization | Created the editorial upgrade tracker. | Pending first content upgrade. |  |
| 2026-05-17 | /learn/support-and-resistance/ | Completed gold-standard Learn article upgrade and created four supporting realistic SVG assets. | Passed. The article teaches the concept clearly, follows the Chart Reading learning path, includes realistic examples and relevant SVGs, avoids buy/sell signals and guarantee language, includes common mistakes, review questions, checklist, and a soft Trader Intelligence bridge. | `7c46572524af559e42a53a34531272bd3154dd6f` |
| 2026-05-17 | /learn/how-to-draw-support-and-resistance/ | Completed second Chart Reading article upgrade and created three supporting realistic SVG assets. | Passed. The article now teaches a practical level-drawing workflow, adds zones-vs-lines coaching, obvious reaction selection, actionable level filtering, journal review prompts, and a soft Trader Intelligence bridge. Visuals support the exact lesson and avoid predictive or signal language. | `26daa98458b746ca447a59f593ee5eda6380cffe` |
| 2026-05-17 | /learn/support-levels/ | Completed third Chart Reading article upgrade and created three supporting realistic SVG assets. | Passed. The article teaches support as a reviewable zone, includes support hold, break, and reclaim examples, avoids buy/sell signals and guaranteed-outcome language, includes common mistakes, checklist, journal review prompts, and a soft Trader Intelligence bridge. Visuals support the exact lesson and avoid predictive language. | `ea86c4f9` |
| 2026-05-17 | /learn/resistance-levels/ | Completed fourth Chart Reading article upgrade and created three supporting realistic SVG assets. | Passed. The article teaches resistance as a reviewable zone, includes resistance rejection, break, and failed-breakout examples, avoids buy/sell signals and guaranteed-outcome language, includes common mistakes, checklist, journal review prompts, and a soft Trader Intelligence bridge. Visuals support the exact lesson and avoid predictive language. | `688c4ac7` |
| 2026-05-17 | /learn/key-levels-trading/ | Completed practical level-map bridge article upgrade and created two supporting realistic SVG assets. | Passed. The article teaches how to choose current-plan key levels, includes realistic level-map examples, avoids buy/sell signals and guaranteed-outcome language, includes common mistakes, checklist, journal review prompts, and a soft Trader Intelligence bridge. Visuals support the exact lesson and avoid predictive language. | `4121eaf9` |
| 2026-05-17 | /learn/breakout-trading/ | Completed breakout trading article upgrade and created three supporting realistic SVG assets. | Passed. The article teaches breakout quality, failed breakout behavior, and chase risk without treating breakouts as signals. It includes realistic examples, common mistakes, checklist, journal review prompts, and a soft Trader Intelligence bridge. Visuals use realistic candlesticks and volume context. | `bdd8664e` |
| 2026-05-17 | /learn/level-breakout/ | Completed level breakout article upgrade and created two supporting realistic SVG assets. | Passed. The article focuses on what happens after a level breaks, including retests, holds, and failed holds. It avoids buy/sell signals and guaranteed-outcome language, includes practical review prompts, and uses realistic candlestick visuals. | `1377793b` |
| 2026-05-17 | /learn/level-reclaim/ | Completed level reclaim article upgrade and created two supporting realistic SVG assets. | Passed. The article teaches lost-level, reclaim-and-hold, and reclaim-failure behavior without treating reclaims as safe or predictive. It includes practical review prompts, common mistakes, checklist, and a soft Trader Intelligence bridge. | `57664031` |
| 2026-05-17 | /learn/price-rejection/ | Completed price rejection article upgrade and created two supporting realistic SVG assets. | Passed. The article ties rejection to meaningful levels, teaches wick context and follow-through, avoids buy/sell signals and guaranteed-reversal language, and includes journal review prompts plus a soft Trader Intelligence bridge. | `3ff3c7c4` |
| 2026-05-17 | /learn/break-of-structure/ | Completed break of structure article upgrade and created two supporting realistic SVG assets. | Passed. The article teaches ordinary swing-structure shifts, avoids certainty and mystical pattern language, includes practical review prompts and a soft Trader Intelligence bridge, and uses realistic candlestick structure visuals. | `d03cf796` |

## Next Recommended Action

Continue the Chart Reading And Market Structure track:

1. Fetch `/learn/swing-highs-and-swing-lows/` draft.
2. Perform pre-editor review.
3. Upgrade it using the completed break-of-structure article as the model.
4. Create 1 to 2 realistic SVGs focused on clean swing high and swing low identification.
5. Run editor verification.
6. Update this tracker.
7. Update the handoff.

## Important Reminder

This tracker is for educational learning journey work.

Do not treat this as only SEO production.

The purpose is to help an end user move through a clean learning flow from start to finish without being overwhelmed.
