# TradersLink Academy Accuracy/Source Audit: Chart Reading And Market Structure

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Status: complete

## Scope

Reviewed the Chart Reading And Market Structure course, including the core chart-reading path and the two supporting submodules:

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

Supporting submodules:

- `academy/candlestick-patterns.md`
- `academy/candlestick-patterns/*.md`
- `academy/chart-patterns.md`
- `academy/chart-patterns/*.md`

## Sources Used Internally

These sources were used to verify accuracy. Source details belong in this internal audit layer; user-facing lessons should stay clean unless an official document, exchange session, or system is the lesson topic.

| Source | Used For |
|---|---|
| StockCharts ChartSchool, Support & Resistance | Support, resistance, zones, breaks, role reversal, trading ranges, and non-exact technical-analysis framing. |
| StockCharts ChartSchool, Chart Patterns | Chart-pattern framing as supply/demand and visual structure rather than guaranteed prediction. |
| StockCharts ChartSchool, gaps/chart analysis references | Gap-area language, gap-fill caution, and chart-reference terminology. |
| SEC, After-Hours Trading: Understanding the Risks | Extended-hours liquidity, wider spreads, volatility, execution uncertainty, and news-impact risk. |
| NYSE, Holidays & Trading Hours | Core trading session timing, early/late sessions, and exchange-session definitions. |
| Nasdaq, US & Nordic Stock Market Schedule | Regular Nasdaq hours, pre-market/after-hours windows, broker variability, and extended-hours risk language. |

## Overall Verdict

Chart Reading And Market Structure is accurate, well-guardrailed, and ready to remain the second major Academy course after Trading Foundations.

The course already avoids the major accuracy risks:

- It does not teach support, resistance, breakouts, breakdowns, reclaims, candles, or patterns as buy/sell signals.
- It repeatedly says levels can hold, fail, break, reclaim, fake out, or remain noisy.
- It treats chart patterns and candlestick patterns as context inside levels, volume, liquidity, timeframe, and risk.
- It uses zones rather than penny-perfect certainty for support/resistance.
- It keeps app bridge language focused on completed-trade review, not prediction.
- It now uses `/academy/...` public URLs and `/academy/images/...` visual asset URLs.

The only useful edits were narrow source-sensitive guardrails around session settings, extended-hours data, scanner behavior, and gap definition.

## Targeted Edits Completed

| Lesson | Edit |
|---|---|
| `/academy/premarket-high-low/` | Added plain wording that PMH/PML should be defined from the broker, venue, and chart-platform session feed the trader actually uses, and that thin prints are not the same as repeated-volume levels. |
| `/academy/previous-day-high-low/` | Added chart-setting and regular-session-versus-extended-hours consistency wording so PDH/PDL review does not mix definitions after the trade. |
| `/academy/high-of-day/` | Added regular-session versus extended-hours scanner/chart-setting wording for HOD alerts. |
| `/academy/low-of-day/` | Added regular-session versus extended-hours scanner/chart-setting wording for LOD alerts. |
| `/academy/new-high-of-day/` | Added scanner/session-rule wording so NHOD alerts are reviewed against the correct data set. |
| `/academy/gap-fill-trading/` | Tightened the gap definition so it covers gaps from the prior closing area, including but not limited to gaps outside the prior session's full range. |

No visible source labels or citations were added to user-facing lesson content.

## Source-Sensitive Findings

### Support, Resistance, And Key Levels

The support/resistance lesson set is accurate. The lessons correctly teach levels as zones, not exact guaranteed lines, and they describe role reversal as possible context rather than a certainty. This matches reputable technical-analysis guidance that support/resistance can break, that zones can be more useful than exact prices, and that prior support can later become resistance or vice versa.

No correction was required beyond the already-completed asset path relocation.

### Breakouts, Breakdowns, Reclaims, And Rejection

The break-and-reaction lessons are accurate. They consistently treat breakouts, breakdowns, reclaims, and rejection as behavior to review with volume, liquidity, spread, level quality, nearby resistance/support, and defined risk. The lessons avoid claiming that a breakout must continue or that a rejection must reverse.

No correction was required.

### Swing Structure

The swing-high, swing-low, higher-high/higher-low, lower-high/lower-low, and break-of-structure lessons are accurate. They frame structure as evidence of what has happened so far, not proof of what happens next. The lessons also distinguish meaningful structure change from small wicks or noisy probes.

No correction was required.

### Intraday Reference Levels

The intraday reference lessons were accurate in concept, but they benefited from more precise session-setting language. NYSE and Nasdaq materials support the regular-session timing and extended-hours distinctions, while SEC and Nasdaq risk language supports caution around lower liquidity, wider spreads, volatility, and broker/platform variability.

Completed edits clarified that PDH/PDL, PMH/PML, HOD/LOD, and NHOD can depend on chart, scanner, broker, venue, and session settings.

### Compression, Consolidation, And Gap Fills

Compression and consolidation are accurate and appropriately cautious. They describe tightening ranges and sideways trade as context that can break higher, break lower, fake out, or remain choppy.

Gap Fill Trading was accurate in spirit, but the quick definition was slightly too narrow because gaps can be reviewed from the prior close/open relationship even when the open is not outside the entire prior range. The definition was tightened.

### Candlestick Patterns In Context

The candlestick submodule is accurate. It avoids the common error of treating individual candles as automatic signals. Candle lessons consistently return to location, level, volume, spread, liquidity, timeframe, and follow-through.

No correction was required.

### Chart Patterns In Context

The chart-pattern submodule is accurate. It teaches patterns as reviewable price structures rather than guaranteed setups. The lessons include failure conditions, late-entry risk, false breaks, volume context, and invalidation review.

No correction was required.

## App Bridge Check

The app bridge language remains restrained and review-focused.

Best future app surfaces:

- Trade Review for completed-trade evidence around levels, candles, and patterns.
- Execution Review for chasing, spread, slippage, late entries, and failed holds.
- Risk Review for invalidation, extension, and risk placement around structure.
- Session Review for PDH/PDL, PMH/PML, HOD/LOD, NHOD, open, and time-of-day behavior.
- Playbook Builder for repeated level/pattern samples and disqualifiers.
- Analytics for comparing outcomes by structure quality, extension, and context tags.
- Coaching for repeated emotional reactions to alerts, breakouts, and fakeouts.

No hard app route links were added during this pass.

## Deferred Items

These do not block the course:

- Create `/academy/multiple-timeframe-chart-reading/` in a later gap-lesson run.
- Consider a future visual for multiple-timeframe chart reading if that lesson is created.
- Run a future visual/UI-readiness pass after production IA decisions are stable.

## Recommended Next Action

Next recommended audit:

```text
Pass 3: Accuracy/Source Audit for Trading Psychology And Discipline
```

Reason: Chart Reading And Market Structure has now passed Pass 3. Trading Psychology And Discipline is the next useful source-sensitive course because it should verify non-clinical behavior language, discipline framing, emotional-trading terminology, non-shaming coaching tone, and app bridge restraint before production UI planning.
