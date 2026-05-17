# Technical Indicators And Tools Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course: Technical Indicators And Tools

Status: complete

## Files Reviewed

- `docs/content/drafts/learn/trading-indicators.md`
- `docs/content/drafts/learn/why-indicators-lag.md`
- `docs/content/drafts/learn/indicator-overload.md`
- `docs/content/drafts/learn/moving-averages.md`
- `docs/content/drafts/learn/vwap.md`
- `docs/content/drafts/learn/anchored-vwap.md`
- `docs/content/drafts/learn/rsi.md`
- `docs/content/drafts/learn/macd.md`
- `docs/content/drafts/learn/bollinger-bands.md`
- `docs/content/drafts/learn/atr.md`
- `docs/content/drafts/learn/volume-by-price.md`
- `docs/content/drafts/learn/chart-patterns/vwap-reclaim.md`

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`

## Overall Verdict

Technical Indicators And Tools is ready as the next Academy course after Risk Management And Trade Planning. The course has the right educational posture: indicators are taught as measurement, context, and review tools, not as automatic trading systems.

The strongest part of the course is its repeated anti-signal framing. The lessons consistently remind users that indicators can lag, mislead, conflict, or create false confidence when separated from price, volume, levels, liquidity, and risk.

The useful work during this pass was targeted:

- Confirm the 12-lesson indicator path and cross-listed context.
- Confirm lesson structure, examples, checklists, review prompts, FAQ, disclaimers, and anti-guarantee language.
- Remove a premature hard `/features/...` link from the cross-listed Volume By Price lesson.
- Fix an invalid ATR related-link target from `/learn/stop-loss-placement/` to `/learn/stop-loss/`.
- Document restrained Trader Intelligence bridge opportunities around completed-trade review, analytics, execution review, risk review, and playbook building.

## Major Findings

1. The course flow is strong. It starts with what indicators are, why they lag, and how overload happens before teaching individual tools.
2. The order is educationally sound. Trend tools come before momentum tools, volatility tools, volume-at-price context, and VWAP reclaim.
3. The course avoids dangerous signal language. It repeatedly explains that indicator touches, crosses, reclaims, overbought readings, oversold readings, and volatility expansion are not commands.
4. The cross-listed Volume By Price lesson is useful inside Technical Indicators, but its canonical metadata still belongs to the Volume, Liquidity And Order Flow course. A later sequence/UI pass should decide whether the product needs course-specific previous/next overrides for cross-listed lessons.
5. Visual support is the biggest gap. The course needs realistic indicator overlays on candlestick charts so users can see lag, clutter, VWAP behavior, RSI/MACD context, and volatility tools without receiving buy/sell instructions.
6. App bridging is useful but should stay restrained. These lessons naturally connect to Trade Review, Analytics, Execution Review, Risk Review, and Playbook Builder after trades are complete.
7. Hard app route links should still wait. A stale `/features/trade-review/` link was removed from the cross-listed Volume By Price metadata until app routes and IA are stable.

## Lesson-Level Notes

| Lesson | Quality Result | Depth | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/learn/trading-indicators/` | Pass | Strong course opener that defines indicators as context tools. | Supporting bridge to Trade Review and Analytics. | No edit needed. |
| `/learn/why-indicators-lag/` | Pass | Strong explanation of confirmation versus prediction and late-entry risk. | Core bridge to Trade Review and Execution Review. | No edit needed. |
| `/learn/indicator-overload/` | Pass | Strong process lesson on clutter, duplicate inputs, and cherry-picking. | Core bridge to Coaching and Trade Review. | No edit needed. |
| `/learn/moving-averages/` | Pass | Good trend-context lesson with lag and chop cautions. | Supporting bridge to Trade Review and Analytics. | No edit needed. |
| `/learn/vwap/` | Pass | Strong intraday average-price lesson with execution and reclaim context. | Core bridge to Execution Review and Trade Review. | No edit needed. |
| `/learn/anchored-vwap/` | Pass | Good advanced lesson on event anchors and anchor bias. | Supporting bridge to Trade Review and News/Filing Review. | No edit needed. |
| `/learn/rsi/` | Pass | Strong momentum lesson that avoids overbought/oversold command language. | Supporting bridge to Trade Review and Coaching. | No edit needed. |
| `/learn/macd/` | Pass | Good lag-aware momentum lesson with clean histogram and cross framing. | Supporting bridge to Trade Review and Analytics. | No edit needed. |
| `/learn/bollinger-bands/` | Pass | Strong volatility-context lesson with squeeze and band-touch cautions. | Supporting bridge to Trade Review and Risk Review. | No edit needed. |
| `/learn/atr/` | Pass after cleanup | Strong range and risk-distance lesson. | Core bridge to Risk Review and Execution Review. | Fixed invalid stop-loss related link. |
| `/learn/volume-by-price/` | Pass after cleanup | Strong cross-listed volume-at-price lesson with realistic visuals. | Supporting bridge to Trade Review and Execution Review. | Removed premature `/features/...` link. |
| `/learn/chart-patterns/vwap-reclaim/` | Pass | Strong setup-context lesson with failed-reclaim and chase-risk framing. | Core bridge to Trade Review and Execution Review. | No edit needed. |

## App Bridge Map

| Lesson | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Needed Edit |
|---|---|---|---|---|---|
| `/learn/trading-indicators/` | Trade Review | Analytics | Supporting Bridge | Review whether an indicator added context or distracted from the plan. | None. |
| `/learn/why-indicators-lag/` | Trade Review | Execution Review | Core Bridge | Review whether delayed confirmation caused a late entry or improved patience. | None. |
| `/learn/indicator-overload/` | Coaching | Trade Review | Core Bridge | Review repeated mistakes caused by clutter, conflicting tools, or cherry-picking. | None. |
| `/learn/moving-averages/` | Trade Review | Analytics | Supporting Bridge | Compare trend-context decisions against late entries and choppy conditions. | None. |
| `/learn/vwap/` | Execution Review | Trade Review | Core Bridge | Review entry timing, VWAP holds/losses, slippage, spread, and failed context. | None. |
| `/learn/anchored-vwap/` | Trade Review | News/Filing Review | Supporting Bridge | Review whether an event anchor was meaningful or chosen after the fact. | None. |
| `/learn/rsi/` | Trade Review | Coaching | Supporting Bridge | Review early exits, countertrend attempts, and overbought/oversold misuse. | None. |
| `/learn/macd/` | Trade Review | Analytics | Supporting Bridge | Review whether MACD clarified momentum or confirmed after price was extended. | None. |
| `/learn/bollinger-bands/` | Trade Review | Risk Review | Supporting Bridge | Review chase behavior after volatility expansion or early fades at band touches. | None. |
| `/learn/atr/` | Risk Review | Execution Review | Core Bridge | Review volatility-adjusted size, stop distance, spread, slippage, and range pressure. | Fixed related-link target. |
| `/learn/volume-by-price/` | Trade Review | Execution Review | Supporting Bridge | Review entries into crowded zones, low-volume areas, and execution quality around levels. | Removed stale app route link. |
| `/learn/chart-patterns/vwap-reclaim/` | Trade Review | Execution Review | Core Bridge | Review reclaim quality, failed reclaims, chase entries, and whether VWAP actually held. | None. |

## Visual Needs

No new SVGs were created in this pass. The course should receive a later visual batch because indicators are easier to understand when users can see realistic overlays on real chart structure.

Recommended future SVGs:

- `indicator-lag-after-price-move.svg`
- `indicator-overload-cluttered-vs-clean-chart.svg`
- `moving-average-trend-vs-chop.svg`
- `vwap-hold-loss-reclaim-review.svg`
- `anchored-vwap-event-anchor.svg`
- `rsi-macd-momentum-context.svg`
- `bollinger-atr-volatility-context.svg`

Visual requirements for this course:

- Use realistic red and green candlesticks.
- Use dark TradersLink dashboard styling with blue accent.
- Show actual indicator overlays where relevant.
- Include volume bars where useful.
- Avoid buy/sell labels and profit claims.
- Avoid implying an indicator predicts the next move.
- Include `title` and `desc` tags.
- Keep labels readable on mobile.

## New Lessons Needed

No urgent new lesson is needed for this course.

Future optional additions could be considered during a later sequence or visual/UI pass:

- `/learn/indicator-settings-and-timeframes/`
- `/learn/using-indicators-with-price-levels/`
- `/learn/indicator-backtesting-vs-live-review/`

Do not create those now unless a later audit finds users need more granular bridges between indicator configuration, level context, and real trade review.

## Accuracy/Source Notes

No official source verification was required during this pass because the audit did not change exchange rules, broker mechanics, SEC content, halt rules, or regulatory claims.

Future Accuracy/Source Audit should review any expanded lesson claims around:

- VWAP calculation variants if exact formulas are added.
- Indicator default settings if platform-specific settings are referenced.
- Order/execution claims around VWAP if broker-specific execution features are added.
- Any claims about benchmark execution or institutional VWAP use.

## Lesson Edits Completed

Edited Technical Indicators course or cross-listed files:

- `docs/content/drafts/learn/atr.md`
- `docs/content/drafts/learn/volume-by-price.md`

Edits were limited to:

- Fixing an invalid related lesson link in ATR.
- Removing a premature hard `/features/...` app route from Volume By Price.

No production website files were edited.

## Recommended Next Action

Continue Pass 1 lesson-level quality audits course by course.

Next course:

```text
Trading Styles And Playbooks
```

Include:

- Trading styles overview, day trading, swing trading, scalping, momentum trading, pullbacks and dip-buy context, news fade, sell-the-news, multi-day runner context, and cross-listed breakout, breakdown, reclaim, gap-fill, and chasing lessons.
- A restrained app bridge map centered on Playbook Builder, Trade Review, Analytics, Session Review, Coaching, and Risk Review.
- Targeted markdown edits only where lesson quality, wording, flow, visual need, or app-bridge restraint needs cleanup.
