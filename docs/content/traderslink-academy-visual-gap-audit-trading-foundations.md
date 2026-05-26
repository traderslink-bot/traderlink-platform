# TradersLink Academy Visual Gap Audit: Start Here For New Traders

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course group: Start Here For New Traders / Trading Foundations

Status: complete

## Files Reviewed

Primary Trading Foundations lessons:

- `academy/start-here.md`
- `academy/how-to-use-traderslink-academy.md`
- `academy/what-is-a-stock-and-how-does-a-trade-work.md`
- `academy/stock-market-sessions-and-order-flow-basics.md`
- `academy/day-trading-for-beginners.md`
- `academy/day-trading-vs-swing-trading.md`

Cross-listed beginner bridge lessons reviewed for this pass:

- `academy/trading-plan.md`
- `academy/trading-rules.md`
- `academy/risk-management.md`
- `academy/position-sizing.md`
- `academy/stop-loss.md`
- `academy/trade-risk-review.md`

Related audit references:

- `docs/content/traderslink-academy-quality-audit-trading-foundations.md`
- `docs/content/traderslink-academy-accuracy-source-audit-trading-foundations.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-image-asset-manifest.md`

## Overall Verdict

Trading Foundations is content-ready and accuracy-checked, but it is under-supported visually for a first-course experience.

The course currently has no in-body SVG support in its primary beginner lessons. That is acceptable for markdown readiness, but the future `/academy` UI would feel stronger if the first course had a small set of realistic, beginner-friendly visuals that explain structure, trade mechanics, sessions, and risk review.

This pass did not create new SVG files. It defines the visual batch that should be created next when the work moves from audit into visual production.

## Visual Strategy

Trading Foundations should not become decoration-heavy. The goal is to help beginners understand the map before they reach complex chart reading, filings, indicators, and setups.

Use visuals for concepts that are easier to understand at a glance:

- The Academy course journey.
- How bid, ask, spread, order type, and last price relate.
- How premarket, open, midday, close, and after-hours can differ.
- How day trading and swing trading differ by timeframe and risk.
- How planned risk becomes actual risk in review.

Avoid visuals that imply:

- A signal to buy or sell.
- A guaranteed setup.
- A profit path.
- A locked learning path.
- That Trader Intelligence predicts future trades.

## Recommended Visual Batch

Create these assets in a later visual-production run:

| Priority | Proposed Asset Path | Related Lesson(s) | Visual Type | Purpose | Suggested Placement | Alt Text | Status |
|---:|---|---|---|---|---|---|---|
| 1 | `public/academy/images/chart-reading/trading-foundations-learning-map.svg` | `/academy/start-here/`, `/academy/how-to-use-traderslink-academy/` | academy_path_map | Show the beginner journey from Academy start to market mechanics, day/swing choice, planning, risk, and review. | After the opening context in `start-here.md`; optionally reused in `how-to-use-traderslink-academy.md`. | Dark TradersLink Academy map showing the Trading Foundations learning path from start, market mechanics, sessions, day versus swing, plan, risk, and review. | planned |
| 2 | `public/academy/images/chart-reading/stock-trade-mechanics-bid-ask.svg` | `/academy/what-is-a-stock-and-how-does-a-trade-work/` | realistic_trading_dashboard | Show bid, ask, spread, last price, market order, limit order, and fill review in one beginner-friendly diagram. | After `Quick Definition` or before `Bid, Ask, And Last Price`. | Dark trading dashboard showing bid, ask, spread, last price, order type, and fill review for a beginner stock trade. | planned |
| 3 | `public/academy/images/chart-reading/market-sessions-liquidity-timeline.svg` | `/academy/stock-market-sessions-and-order-flow-basics/` | session_timeline_with_chart | Show premarket, regular open, midday, close, and after-hours with realistic candlesticks, volume, and spread/liquidity notes. | After `Quick Definition` or before `Why Session Context Matters`. | Dark dashboard timeline showing premarket, open, midday, close, and after-hours with candles, volume, and liquidity context. | planned |
| 4 | `public/academy/images/chart-reading/day-vs-swing-timeframe-risk.svg` | `/academy/day-trading-vs-swing-trading/`, `/academy/day-trading-for-beginners/` | comparison_diagram | Compare same-session day trades with multi-session swing trades using realistic candles, session boundaries, and risk-review labels. | In `day-trading-vs-swing-trading.md` after `Quick Definition`; optional supporting visual in beginner day trading. | Dark comparison chart showing same-session day trading and multi-session swing trading with timeframe and risk-review labels. | planned |
| 5 | `public/academy/images/chart-reading/beginner-risk-review-loop.svg` | `/academy/risk-management/`, `/academy/position-sizing/`, `/academy/stop-loss/`, `/academy/trade-risk-review/` | workflow_diagram | Show plan risk, size, invalidation, stop/exit, actual risk, and review loop without implying risk can be removed. | Best created during the Risk Management Pass 4 visual run; can be cross-linked from Trading Foundations if useful. | Dark dashboard workflow showing beginner risk planning, position sizing, stop area, actual risk, and post-trade review loop. | defer_to_risk_pass |

## Lesson-Level Visual Decisions

| Lesson | Current Visual Coverage | Visual Need | Decision |
|---|---|---|---|
| `/academy/start-here/` | No SVG. | Needs one Academy/course-path map because this is the first user-facing Academy lesson. | Create `trading-foundations-learning-map.svg` later. |
| `/academy/how-to-use-traderslink-academy/` | No SVG. | Could reuse the course-path map; avoid a second near-duplicate navigation visual. | Reuse `trading-foundations-learning-map.svg` if the UI needs a visual here. |
| `/academy/what-is-a-stock-and-how-does-a-trade-work/` | No SVG. | Needs a concrete bid/ask/order/fill diagram. | Create `stock-trade-mechanics-bid-ask.svg` later. |
| `/academy/stock-market-sessions-and-order-flow-basics/` | No SVG. | Needs a session timeline with liquidity/spread/volume context. | Create `market-sessions-liquidity-timeline.svg` later. |
| `/academy/day-trading-for-beginners/` | No SVG. | Can use existing `day-trading-session-map.svg` later, but the lesson may not need a unique visual if the next lesson gets the timeframe comparison. | Optional reuse; no new unique asset required now. |
| `/academy/day-trading-vs-swing-trading/` | No SVG. | Needs a clear day-versus-swing comparison visual. | Create `day-vs-swing-timeframe-risk.svg` later. |
| `/academy/trading-plan/` | No SVG. | A plan template visual would help, but this belongs more naturally in the Risk Management Pass 4 run. | Defer to Risk Management visual pass. |
| `/academy/trading-rules/` | No SVG. | Could use a rule-review checklist visual, but not urgent for Start Here. | Defer. |
| `/academy/risk-management/` | No SVG. | Needs risk loop support, but this should be handled in the dedicated Risk Management visual pass. | Defer to Risk Management visual pass. |
| `/academy/position-sizing/` | No SVG. | Strong candidate for a formula/position-size visual later. | Defer to Risk Management visual pass. |
| `/academy/stop-loss/` | No SVG. | Strong candidate for stop-area and slippage visual later. | Defer to Risk Management visual pass. |
| `/academy/trade-risk-review/` | No SVG. | Strong candidate for planned-versus-actual risk review visual later. | Defer to Trade Review or Risk Management visual pass. |

## Existing Assets That May Be Reused

These existing assets may support the future UI but should not be forced into the lessons automatically:

- `public/academy/images/chart-reading/day-trading-session-map.svg`
- `public/academy/images/chart-reading/premarket-session-workflow.svg`
- `public/academy/images/chart-reading/market-open-opening-range.svg`
- `public/academy/images/chart-reading/after-hours-liquidity-context.svg`
- `public/academy/images/chart-reading/bid-ask-quote-mechanics.svg`
- `public/academy/images/chart-reading/bid-ask-order-interaction-review.svg`
- `public/academy/images/chart-reading/market-vs-limit-order-tradeoff.svg`
- `public/academy/images/chart-reading/slippage-expected-vs-actual-fill.svg`

Reuse note:

Existing bid/ask and order-type visuals may be more advanced because they were created for the Volume, Liquidity And Order Flow course. The beginner stock-trade mechanics lesson would benefit from a simpler combined visual rather than dropping several advanced visuals into the first course.

## Visual Requirements For Future SVGs

- Use TradersLink dark dashboard styling with blue accent.
- Use realistic red and green candlesticks when chart behavior appears.
- Use visible bid/ask, spread, volume, session, or risk-review context where relevant.
- Keep labels short and mobile-readable.
- Include `title` and `desc` tags in every SVG.
- Avoid buy/sell labels.
- Avoid profit claims.
- Avoid guaranteed-outcome language.
- Avoid implying the Academy path is locked.
- Avoid implying Trader Intelligence predicts future trades.

## Image Manifest Decision

No new image manifest rows were added during this audit because no new SVG files were created.

When the visual batch is produced, add each new asset to `docs/content/learn-image-asset-manifest.md` with:

- Asset file path.
- Related article.
- Learning track.
- Visual type.
- Purpose.
- Suggested placement.
- Alt text.
- Status.
- Editor verification.
- Commit SHA.

## Editor Verification

Pass 4 audit result: passed.

The course should not be marked fully visual-complete yet because priority SVGs are still planned. It can be marked Pass 4 audited and ready for a future visual-production batch.

No production website files were changed.

## Recommended Next Action

Next recommended audit:

```text
Pass 4: Visual Gap Audit for Chart Reading And Market Structure
```

Reason:

- Start Here For New Traders Pass 4 is now complete as an audit.
- Chart Reading And Market Structure is the next course in the Academy order.
- Chart Reading already has strong visual coverage in many lessons, so its Pass 4 audit should focus on identifying remaining visual gaps, duplicate coverage, manifest accuracy, and whether existing chart SVGs still support the final lesson content.
