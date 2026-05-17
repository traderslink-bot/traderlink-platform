# TradersLink Academy Accuracy/Source Audit: Day Trading Workflow

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Status: complete

## Scope

Reviewed the 9-lesson Day Trading Workflow course:

- `docs/content/drafts/learn/day-trading-workflow.md`
- `docs/content/drafts/learn/premarket-trading.md`
- `docs/content/drafts/learn/day-trading-watchlist.md`
- `docs/content/drafts/learn/market-open-trading.md`
- `docs/content/drafts/learn/opening-range.md`
- `docs/content/drafts/learn/midday-trading.md`
- `docs/content/drafts/learn/power-hour-trading.md`
- `docs/content/drafts/learn/after-hours-trading.md`
- `docs/content/drafts/learn/day-trading-session-review.md`

## Sources Used Internally

These sources were used to verify accuracy. They should stay in this internal audit layer unless a future lesson is specifically about an official rule, filing system, exchange session, or order type.

| Source | Used For |
|---|---|
| FINRA, Day Trading | Day-trading definition, margin-account framing, risk disclosure context, broker-specific rule/counting caution. |
| FINRA Regulatory Notice 26-10 | Current 2026 intraday margin-rule transition and reason to avoid hard-coded PDT/account-rule claims. |
| SEC, After-Hours Trading: Understanding the Risks | Extended-hours risk: lower liquidity, wider spreads, price volatility, news impact, uncertain prices, and broker/platform variation. |
| FINRA, Extended-Hours Trading: Know the Risks | Premarket, after-hours, and overnight risk; typical extended-hours timing; liquidity, volatility, NBBO, and next-open caveats. |
| Investor.gov, Types of Orders | Market order execution-price caveat, limit order no-fill risk, and stop-order behavior. |
| Investor.gov, Executing an Order | Fast-market execution delay, broker routing, quote-versus-fill differences, and execution-quality context. |
| NYSE, Trading Information | Core, early, and late session timing for NYSE Group equity markets. |
| Nasdaq, Global Trading Hours FAQ | Current Nasdaq pre-market, regular market, post-market, and planned extended-session timing context. |

## Overall Verdict

Day Trading Workflow is accurate and source-aligned. The course teaches the intraday session as a workflow of preparation, observation, risk control, execution review, and session review. It does not treat premarket, the open, the opening range, midday, power hour, or after-hours as automatic opportunities.

The course already avoids the major source-sensitive problems:

- It does not hard-code account-rule or PDT requirements inside the workflow lessons.
- It does not claim premarket or after-hours movement predicts regular-session movement.
- It does not claim the opening range, first candle, midday range, or power hour creates a signal.
- It keeps spread, liquidity, slippage, and execution risk central.
- It treats watchlists as preparation tools rather than trade instructions.
- It treats session review as completed-trade review, not future prediction.
- It keeps Trader Intelligence bridge wording restrained and review-focused.

The only lesson edits needed were small plain-language guardrails around broker/venue variability in extended-hours access, order types, routing, and symbol availability. No visible citation labels or source-check paragraphs were added to user-facing lesson content.

## Targeted Edits Completed

| Lesson | Edit |
|---|---|
| `/learn/premarket-trading/` | Added plain lesson wording that exact premarket access, order types, routing, and symbols can vary by broker and venue, and that premarket should be treated as lower-liquidity preparation unless account and execution constraints are clear. |
| `/learn/after-hours-trading/` | Added plain lesson wording that exact after-hours access, order types, routing, and symbols can vary by broker and venue, and that after-hours prices are context rather than a promise of the next regular-session open. |

No broad rewrite was needed.

## Source-Sensitive Findings

### Day Trading Workflow Overview

The course opener is accurate. It frames a workflow as a repeatable session process and explicitly says the workflow does not predict the market. The lesson does not make account-rule claims or session-timing claims that require user-facing citations.

No correction was required.

### Premarket Trading

The premarket lesson is accurate and conservative. FINRA extended-hours materials support the lesson's lower-liquidity, wider-spread, volatility, and regular-open-change risk framing. NYSE and Nasdaq materials support that pre-market access exists, but session availability can vary by exchange, venue, broker, and symbol.

A small plain-language guardrail was added to prevent learners from assuming every broker, route, order type, or symbol behaves the same before the regular session.

### Day Trading Watchlist

The watchlist lesson is accurate. It treats a watchlist as a focused preparation tool and keeps catalyst, volume, liquidity, spread, levels, and risk context separate from actual trade decisions. This aligns with the broader source findings from prior SEC/FINRA/Investor.gov audits around liquidity, order execution, and fast-market risk.

No correction was required.

### Market Open Trading

The market-open lesson is accurate. SEC, FINRA, NYSE, and Nasdaq sources support the regular-session open as a distinct market segment. Investor.gov execution materials support the lesson's emphasis on fast price changes, quote-versus-fill differences, spread, slippage, and rushed execution risk.

The lesson correctly avoids saying the first candle should be traded or that high volume makes the open safe.

### Opening Range

The opening-range lesson is accurate as a chart-context lesson. It defines the opening range as an early regular-session high/low reference area and repeatedly avoids mechanical breakout or breakdown language. The source-sensitive point is not the exact opening-range window, because that is a trader-defined review convention rather than an official market rule.

No correction was required.

### Midday Trading

The midday lesson is accurate. It teaches midday as a filtering phase that can have lower urgency, fading volume, boredom risk, and weaker participation, while still acknowledging that good trades can occur when volume, levels, risk, and setup quality are clear.

No source correction was required because the lesson does not make official timing or rule claims.

### Power Hour Trading

The power-hour lesson is accurate. It defines power hour as the final hour of the regular session, but avoids promising that late-session volume or high-of-day/low-of-day tests create continuation. The lesson is especially strong on emotional risk, close-planning risk, and review of forced late trades.

No correction was required.

### After-Hours Trading

The after-hours lesson is accurate and source-aligned. SEC and FINRA materials support the lesson's lower-liquidity, wider-spread, headline/news, price-volatility, and next-regular-session caveats. FINRA also notes that extended-hours prices do not determine the next day's opening prices and that pricing dynamics can differ when regular trading resumes.

A small plain-language guardrail was added to prevent learners from assuming every broker, route, order type, or symbol behaves the same after the close.

### Day Trading Session Review

The session-review capstone is accurate. It turns the workflow into preparation, timing, risk, execution, and behavior review. It does not claim review guarantees improvement or predicts future trades. It also keeps app bridge language focused on completed sessions and repeated behavior patterns.

No correction was required.

## Current-Date Notes

As of 2026-05-17, FINRA Regulatory Notice 26-10 has announced new intraday margin standards effective June 4, 2026, with phase-in through October 20, 2027. The Day Trading Workflow course wisely avoids hard-coded PDT or account-rule details. Future account-rule lessons should re-check current FINRA and broker materials before publication.

Nasdaq and NYSE extended-hours schedules are also an active area of market-structure change. Future production UI should avoid hard-coding broad "all stocks trade from X to Y" wording unless exchange, broker, venue, symbol eligibility, and implementation timing are verified at that time.

## App Bridge Check

The app bridge language remains restrained and review-focused.

Best future app surfaces:

- Session Review for premarket, open, midday, power hour, after-hours, and daily recap tagging.
- Trade Review for planned versus reactive trades from watchlist and session context.
- Execution Review for market-open, opening-range, spread, slippage, order type, and fill-quality review.
- Risk Review for after-hours, overnight, power-hour, and changing-session risk.
- News/Filing Review for catalyst and filing verification in premarket and after-hours contexts.
- Coaching for boredom trades, open pressure, late-day forcing, and reactive additions.
- Analytics for comparing outcomes and behavior across session segments.

No hard app route links were added during this pass.

## Deferred Items

These are useful later, but they do not block the course:

- A dedicated day-trading account-rules lesson after the 2026 FINRA intraday margin transition is implemented and broker practices are clearer.
- A future UI note that session labels should be configurable or caveated if the app displays exact premarket/after-hours availability.
- Optional visuals for watchlist filtering and day-trading session review dashboards during the visual gap pass.

## Recommended Next Action

Next recommended audit:

```text
Pass 3: Accuracy/Source Audit for Swing Trading Workflow
```

Reason: that course includes multi-session holding, overnight risk, swing support/resistance, swing volume, catalysts, earnings, news risk, and small-cap swing-trading context. The next pass should verify gap/overnight risk, extended-hours and news language, catalyst/source framing, liquidity/spread risk, small-cap supply risk, and avoid any implication that multi-session setups guarantee continuation.
