# Volume, Liquidity And Order Flow Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course: Volume, Liquidity And Order Flow

Status: complete

## Files Reviewed

- `docs/content/drafts/learn/volume.md`
- `docs/content/drafts/learn/relative-volume.md`
- `docs/content/drafts/learn/relative-volume-rvol.md`
- `docs/content/drafts/learn/volume-spike.md`
- `docs/content/drafts/learn/liquidity.md`
- `docs/content/drafts/learn/dollar-volume.md`
- `docs/content/drafts/learn/spread.md`
- `docs/content/drafts/learn/bid-and-ask.md`
- `docs/content/drafts/learn/slippage.md`
- `docs/content/drafts/learn/market-orders-vs-limit-orders.md`
- `docs/content/drafts/learn/level-2.md`
- `docs/content/drafts/learn/time-and-sales.md`
- `docs/content/drafts/learn/volume-by-price.md`
- `docs/content/drafts/learn/unusual-volume.md`

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`

## Overall Verdict

Volume, Liquidity And Order Flow is ready as the third Academy course after Chart Reading And Market Structure. The course teaches the right dependency layer: after users learn candles, levels, breakouts, breakdowns, and gaps, they learn whether the activity around those moves was clean, thin, fast, crowded, executable, or hard to trade.

The course is not just an SEO cluster. It functions as a practical execution-awareness course. It moves from volume participation into relative activity, liquidity, spread, bid/ask, slippage, order type, Level 2, time and sales, volume by price, and unusual-volume scanner context.

The course does not need a broad rewrite. The useful work during this pass was targeted:

- Confirm the 14-lesson course chain and metadata sequence.
- Confirm lesson structure, examples, checklists, visuals, FAQ, disclaimers, and non-signal language.
- Replace leftover "journal" phrasing with review or review-notes wording.
- Document restrained Trader Intelligence bridge opportunities around completed-trade review and execution review.

## Major Findings

1. The course flow is strong: basic volume, relative volume/RVOL, volume spikes, liquidity, dollar volume, spread, bid/ask, slippage, order types, Level 2, time and sales, volume by price, and unusual volume.
2. The course does a good job separating activity from trade quality. Lessons repeatedly explain that more volume does not guarantee direction, liquidity, clean fills, or continuation.
3. Execution concepts are explained in practical language. Spread, slippage, bid/ask, order types, Level 2, and tape are framed as review context, not magic prediction tools.
4. Visual support is strong. Lessons use realistic candlestick or trading-dashboard SVGs with volume bars, quote panels, order book context, bid/ask framing, fill/slippage examples, and dark TradersLink styling.
5. App bridging should be stronger here than in Chart Reading because this course maps naturally to Execution Review. Still, the bridge should remain educational and review-focused, not product advertising.
6. Do not add hard app route links yet. Use app-surface language only until the production app IA and routes are stable.

## Lesson-Level Notes

| Lesson | Quality Result | Depth | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/learn/volume/` | Pass after cleanup | Strong foundation lesson for participation, expansion, dry-up, and fading volume. | Supporting bridge to Trade Review and Analytics. | Replaced journal-prompt wording with review-prompt wording. |
| `/learn/relative-volume/` | Pass after cleanup | Strong comparison lesson showing why raw volume needs baseline context. | Supporting bridge to Trade Review, Analytics, and News/Filing Review. | Replaced journal wording in review prompts and FAQ. |
| `/learn/relative-volume-rvol/` | Pass after cleanup | Good scanner-style RVOL lesson with time-of-day and platform-context caution. | Supporting bridge to Analytics and Trade Review. | Replaced journaling wording with review wording. |
| `/learn/volume-spike/` | Pass after cleanup | Good sudden-activity lesson with follow-through, fade, and chase-risk examples. | Supporting bridge to Trade Review, Coaching, and Execution Review. | Replaced journal wording in review prompts and FAQ. |
| `/learn/liquidity/` | Pass after cleanup | Strong execution-context lesson covering clean versus thin markets. | Core bridge to Execution Review and Risk Review. | Replaced journal-prompt wording with review-prompt wording. |
| `/learn/dollar-volume/` | Pass after cleanup | Good traded-value lesson that corrects share-volume-only thinking. | Supporting bridge to Execution Review and Analytics. | Fixed review-notes grammar and review-prompt wording. |
| `/learn/spread/` | Pass after cleanup | Strong spread-as-cost lesson with hidden execution cost. | Core bridge to Execution Review and Risk Review. | Replaced journal wording with after-trade/review-notes wording. |
| `/learn/bid-and-ask/` | Pass after cleanup | Good quote mechanics lesson connecting last price to available execution. | Core bridge to Execution Review. | Replaced journal-prompt wording with review-prompt wording. |
| `/learn/slippage/` | Pass after cleanup | Strong planned-versus-actual fill lesson. | Core bridge to Execution Review and Risk Review. | Replaced journal-prompt wording with review-prompt wording. |
| `/learn/market-orders-vs-limit-orders/` | Pass after cleanup | Strong order-type tradeoff lesson with speed versus price-control framing. | Core bridge to Execution Review. | Replaced journal wording in review prompts and FAQ. |
| `/learn/level-2/` | Pass after cleanup | Good order-book lesson that warns visible depth can disappear. | Core bridge to Execution Review and Coaching. | Replaced journal-prompt wording with review-prompt wording. |
| `/learn/time-and-sales/` | Pass after cleanup | Good tape lesson focused on actual prints rather than prediction. | Core bridge to Execution Review and Analytics. | Replaced journal-prompt wording with review-prompt wording. |
| `/learn/volume-by-price/` | Pass after cleanup | Good price-zone participation lesson linking volume profile with levels. | Supporting bridge to Trade Review and Playbook Builder. | Replaced journal wording in review prompts and FAQ. |
| `/learn/unusual-volume/` | Pass after cleanup | Strong scanner-context capstone connecting abnormal activity with catalyst, liquidity, spread, and fade risk. | Supporting bridge to Trade Review, News/Filing Review, Coaching, and Analytics. | Replaced journal wording with review wording. |

## App Bridge Map

Use this map later when deciding where UI links or product cards should appear. Do not add hard app route links until the app workspace and main app page routes are stable.

| Lesson / Group | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Link Now? |
|---|---|---|---|---|---|
| Volume foundation lessons | Trade Review | Analytics | Supporting Bridge | Review whether volume expanded, faded, stayed thin, or appeared after the main move. | No. Wait for stable Trade Review or Analytics routes. |
| Relative volume and RVOL | Analytics | News/Filing Review | Supporting Bridge | Compare abnormal activity with catalyst context, float, liquidity, and trade timing. | No. Add later only if scanner/activity tags are stable. |
| Volume spike and unusual volume | Trade Review | Coaching | Supporting Bridge | Review late entries, scanner chasing, volume fade, and emotional reaction to sudden activity. | No. Use soft review language only. |
| Liquidity and dollar volume | Execution Review | Risk Review | Core Bridge | Review whether size, spread, depth, and dollar volume matched the trade plan. | No. Wait for stable execution/risk surfaces. |
| Spread and bid/ask | Execution Review | Risk Review | Core Bridge | Review entry/exit cost, quoted prices, last-price confusion, and whether the spread changed real risk. | No. Add later when execution-review route is stable. |
| Slippage | Execution Review | Risk Review | Core Bridge | Compare intended price, actual fill, spread, liquidity, speed, order type, and resulting risk change. | No. Add later when fill-review UI is stable. |
| Market orders versus limit orders | Execution Review | Trade Review | Core Bridge | Review whether order type matched urgency, liquidity, spread, size, and plan. | No. Wait for stable order-type/fill fields. |
| Level 2 | Execution Review | Coaching | Core Bridge | Review whether order-book context improved execution or created reactive noise. | No. Add later only if Level 2 screenshots/notes are supported. |
| Time and sales | Execution Review | Analytics | Core Bridge | Review whether entries/exits matched actual prints, tape speed, bid/ask interaction, and liquidity. | No. Wait for stable execution review support. |
| Volume by price | Playbook Builder | Trade Review | Supporting Bridge | Compare setup samples around high-volume zones, low-volume areas, reclaims, and rejections. | No. Add later if Playbook Builder supports setup tags. |

## App Link Recommendation

Do not add hard app links yet.

Reason:

- The course is educational and should not feel like an app tutorial.
- Route names and app IA should be stable before links are added.
- The strongest product connection is post-trade execution review, not prediction.

Good future app-link candidates after routes are stable:

- Spread, bid/ask, slippage, order type, Level 2, and time and sales: Execution Review.
- Liquidity and dollar volume: Execution Review or Risk Review.
- Volume, RVOL, volume spikes, and unusual volume: Trade Review, Analytics, or News/Filing Review.
- Volume by price: Trade Review or Playbook Builder.

Use one restrained review card per lesson or module, not repeated product mentions throughout the lesson.

## Visual Needs

No urgent SVG work is required before continuing the Pass 1 audit queue.

Current coverage:

- Volume lessons use realistic candles, volume expansion, dry-up, spike, fade, and scanner-context visuals.
- Liquidity and spread lessons use realistic dashboard panels with quote, spread, depth, and fill-cost context.
- Bid/ask, slippage, order type, Level 2, and time-and-sales lessons use trading-dashboard SVGs that show execution conditions rather than abstract shapes.
- Volume-by-price uses profile-style chart visuals tied to high-volume zones and low-volume areas.

Future optional visual:

- A course-level `volume-liquidity-order-flow-map.svg` could help the UI show the path from volume participation to execution review, but it is not urgent.

SVG standard remains:

- Realistic red/green candlesticks or realistic trading-dashboard panels.
- Volume bars, bid/ask labels, spread/depth context, and fill markers where useful.
- Dark TradersLink dashboard style with blue accent.
- Educational labels only.
- `title` and `desc` tags.
- No buy/sell language, profit claims, or guaranteed-outcome wording.

## New Lessons Needed

No urgent new lesson is needed for this course.

The existing 14-lesson sequence covers the major course concepts well:

- Participation and volume comparison.
- Liquidity and execution conditions.
- Quote mechanics, slippage, and order type.
- Level 2 and tape context.
- Volume by price and scanner-driven unusual volume.

Future optional additions could be considered during a later master sequence pass:

- `/learn/volume-vs-liquidity-vs-volatility/`
- `/learn/execution-environment-checklist/`

Do not create those now unless a later audit finds that users need a bridge lesson between activity metrics and execution risk.

## Accuracy/Source Notes

No urgent official source verification was required during this pass because the audit did not change technical order-handling claims.

Future Accuracy/Source Audit should review lessons touching:

- Market order and limit order behavior.
- Stop order behavior if expanded later.
- Level 2 limitations, hidden liquidity, routing, and displayed depth.
- Time and sales interpretation.
- Broker/platform differences in RVOL and volume calculations.

## Lesson Edits Completed

Edited:

- `docs/content/drafts/learn/volume.md`
- `docs/content/drafts/learn/relative-volume.md`
- `docs/content/drafts/learn/relative-volume-rvol.md`
- `docs/content/drafts/learn/volume-spike.md`
- `docs/content/drafts/learn/unusual-volume.md`
- `docs/content/drafts/learn/liquidity.md`
- `docs/content/drafts/learn/dollar-volume.md`
- `docs/content/drafts/learn/spread.md`
- `docs/content/drafts/learn/bid-and-ask.md`
- `docs/content/drafts/learn/slippage.md`
- `docs/content/drafts/learn/market-orders-vs-limit-orders.md`
- `docs/content/drafts/learn/level-2.md`
- `docs/content/drafts/learn/time-and-sales.md`
- `docs/content/drafts/learn/volume-by-price.md`

Edits were limited to:

- Replacing broad "journal" wording with review, after-trade notes, or review-notes wording.
- Fixing one review-notes grammar issue in the dollar-volume lesson.

No production website files were edited.

## Recommended Next Action

Continue Pass 1 lesson-level quality audits course by course.

Next course:

```text
Risk Management And Trade Planning
```

Include:

- Trading plan, trading rules, risk management, position sizing, risk/reward, stop loss, mental stop, hard stop, max loss, daily loss limit, trade management, profit protection, overnight risk, holding through news, expectancy, and risk review cross-links.
- A restrained app bridge map centered on Risk Review, Trade Review, Analytics, Coaching, and Execution Review.
- Targeted markdown edits only where lesson quality, wording, review flow, or app-bridge restraint needs cleanup.
