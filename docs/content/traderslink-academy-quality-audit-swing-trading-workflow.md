# Swing Trading Workflow Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course: Swing Trading Workflow

Status: complete

## Files Reviewed

- `academy/swing-trading-for-beginners.md`
- `academy/swing-trading-risk-management.md`
- `academy/swing-trading-support-resistance.md`
- `academy/swing-trading-volume.md`
- `academy/swing-trading-catalysts.md`
- `academy/swing-trading-earnings.md`
- `academy/swing-trading-news-risk.md`
- `academy/swing-trading-small-caps.md`

Adjacent transition files reviewed and lightly edited:

- `academy/day-trading-session-review.md`
- `academy/stock-catalysts.md`

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`

## Overall Verdict

Swing Trading Workflow is ready as the next Academy course after Day Trading Workflow. The course works because it teaches swing trading as a multi-session planning and review process, not as a slower or easier version of day trading.

The instructor flow is strong:

1. Open with the beginner multi-session workflow.
2. Teach risk management before setup details.
3. Add higher-timeframe support and resistance planning.
4. Add volume and liquidity participation review.
5. Add catalyst quality and source context.
6. Teach earnings as a distinct event-risk decision.
7. Teach news risk as known versus surprise risk.
8. Finish with small-cap swing context where float, filings, liquidity, and financing risk matter more.

The course does not need a broad rewrite. The useful work during this pass was targeted:

- Confirm the 8-lesson workflow chain and previous/next metadata.
- Confirm lesson structure, examples, mistakes, checklists, Apply This In Review sections, FAQ, disclaimers, and anti-guarantee language.
- Confirm swing lessons do not become hold recommendations or catalyst predictions.
- Correct the course transition from Day Trading Session Review into Swing Trading For Beginners.
- Correct the transition from Small Cap Swing Trading into Stock Catalysts.
- Clean quote encoding in the beginner swing lesson.
- Document restrained Trader Intelligence bridge opportunities around Trade Review, Risk Review, Journal Notes, News/Filing Review, Analytics, Coaching, and Playbook Builder.

## Major Findings

1. The course flow is strong. It teaches swing trading as a process of thesis, levels, risk, overnight exposure, catalyst review, and post-trade feedback.
2. The lessons avoid treating swing trading as an easier day-trading fallback. The beginner lesson explicitly separates planned swing trades from failed day trades renamed after the fact.
3. Anti-guarantee language is strong. The lessons avoid claiming support, volume, catalysts, earnings, or news create guaranteed moves.
4. The existing SVG support is useful. The multi-session plan, gap-risk context, and catalyst timeline visuals already show realistic daily candles, zones, volume, and review labels.
5. Adjacent course transitions needed cleanup. Day Trading Session Review now hands off to Swing Trading For Beginners, and Small Cap Swing Trading now hands off to Stock Catalysts.
6. App bridging is natural but should stay restrained. Swing lessons map best to completed-trade review, risk review, catalyst/source notes, hold-decision review, and playbook refinement.
7. A later UI pass should decide how support lessons appear in the Swing course UI, especially Swing Trading, Day Trading Versus Swing Trading, Overnight Risk, Position Sizing, Stock Catalysts, SEC Filings, Small Cap Stocks, Trading Halts, and Swing Trade Journal.

## Lesson-Level Notes

| Lesson | Quality Result | Depth | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/academy/swing-trading-for-beginners/` | Pass after cleanup | Strong opener that explains swing trading as multi-session planning and separates planned swing trades from failed day trades. | Core bridge to Trade Review and Playbook Builder. | Fixed previous course transition and cleaned quote encoding. |
| `/academy/swing-trading-risk-management/` | Pass | Strong risk-first lesson with invalidation, overnight gaps, sizing, and open-trade risk changes. | Core bridge to Risk Review and Trade Review. | No edit needed. |
| `/academy/swing-trading-support-resistance/` | Pass | Strong level-planning lesson using higher-timeframe zones, reaction review, and failed-level context. | Supporting bridge to Trade Review and Risk Review. | No edit needed. |
| `/academy/swing-trading-volume/` | Pass | Strong volume lesson that treats participation as context, not a signal. | Supporting bridge to Analytics and Trade Review. | No edit needed. |
| `/academy/swing-trading-catalysts/` | Pass | Strong catalyst-quality lesson that connects source detail, chart reaction, filings, and volume follow-through. | Core bridge to News/Filing Review and Trade Review. | No edit needed. |
| `/academy/swing-trading-earnings/` | Pass | Strong event-risk lesson that separates before, through, and after-earnings plans. | Core bridge to News/Filing Review and Risk Review. | No edit needed. |
| `/academy/swing-trading-news-risk/` | Pass | Strong lesson on known versus surprise news, thesis changes, liquidity, and review. | Core bridge to News/Filing Review and Risk Review. | No edit needed. |
| `/academy/swing-trading-small-caps/` | Pass after cleanup | Strong capstone connecting small-cap swing risk to catalyst quality, float, filings, liquidity, dilution, halts, and gaps. | Core bridge to News/Filing Review, Risk Review, and Analytics. | Fixed next course transition to Stock Catalysts. |

## App Bridge Map

| Lesson | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Needed Edit |
|---|---|---|---|---|---|
| `/academy/swing-trading-for-beginners/` | Trade Review | Playbook Builder | Core Bridge | Review completed swing trades by thesis, level plan, overnight exposure, hold decisions, and whether the trade began as a real swing plan. | Fixed previous transition and quote encoding. |
| `/academy/swing-trading-risk-management/` | Risk Review | Trade Review | Core Bridge | Review whether position size, invalidation, gap risk, event risk, and open-trade adjustments matched the original plan. | None. |
| `/academy/swing-trading-support-resistance/` | Trade Review | Risk Review | Supporting Bridge | Review whether higher-timeframe zones were respected, adjusted, or ignored during the hold. | None. |
| `/academy/swing-trading-volume/` | Analytics | Trade Review | Supporting Bridge | Compare swing outcomes by participation quality, volume fade, pullback volume, and liquidity context. | None. |
| `/academy/swing-trading-catalysts/` | News/Filing Review | Trade Review | Core Bridge | Review source quality, headline detail, filing context, follow-through volume, and whether the catalyst thesis stayed intact. | None. |
| `/academy/swing-trading-earnings/` | News/Filing Review | Risk Review | Core Bridge | Review whether the trader planned before, through, or after earnings and understood event gap risk. | None. |
| `/academy/swing-trading-news-risk/` | News/Filing Review | Risk Review | Core Bridge | Review known versus surprise news, thesis changes, overnight risk, and reaction quality after the trade is complete. | None. |
| `/academy/swing-trading-small-caps/` | News/Filing Review | Risk Review / Analytics | Core Bridge | Review small-cap swings by float, liquidity, filings, dilution risk, halt/gap exposure, and repeated behavior patterns. | Fixed next transition to Stock Catalysts. |

## Visual Needs

No new SVGs were created in this pass. The existing visuals are useful and realistic:

- `public/images/learn/chart-reading/swing-trading-multi-session-plan.svg`
- `public/images/learn/chart-reading/swing-trading-risk-gap-context.svg`
- `public/images/learn/chart-reading/swing-trading-catalyst-timeline.svg`

Future optional SVGs:

- `swing-trade-hold-decision-review.svg`
- `swing-trading-thesis-change-review.svg`
- `small-cap-swing-risk-dashboard.svg`

Visual requirements for any future Swing Workflow visuals:

- Use realistic red and green daily candlesticks.
- Show support/resistance or invalidation zones instead of random curved lines.
- Include volume bars, catalyst markers, overnight gap context, or review panels where useful.
- Use dark TradersLink dashboard styling with blue accent.
- Avoid buy/sell labels, profit claims, and guaranteed-outcome language.
- Include `title` and `desc` tags.
- Keep labels readable on mobile.

## New Lessons Needed

No urgent new lesson is needed for this course.

Future optional additions could be considered during a later sequence or UI pass:

- `/academy/swing-trade-hold-decision-review/`
- `/academy/swing-trading-style-drift/`
- `/academy/swing-trading-event-checklist/`

Do not create those now unless a later audit finds the UI journey needs more granular bridges between swing planning, open-trade review, and post-trade improvement.

## Accuracy/Source Notes

No official source verification was required during this pass because the audit did not change SEC rules, exchange rules, halt rules, broker-specific order handling, or earnings-calendar claims.

Future Accuracy/Source Audit should review lessons touching:

- Earnings timing and event-risk claims if the lessons become more specific.
- SEC filing references, offering language, dilution context, or EDGAR workflow claims.
- Trading halt, volatility pause, and low-float risk language if expanded.
- Broker-specific overnight, margin, short-selling, or extended-hours behavior if added later.

## Lesson Edits Completed

Edited Swing Workflow and adjacent transition files:

- `academy/day-trading-session-review.md`
- `academy/swing-trading-for-beginners.md`
- `academy/swing-trading-small-caps.md`
- `academy/stock-catalysts.md`

Edits were limited to:

- Updating Day Trading Session Review to hand off to Swing Trading For Beginners.
- Updating Swing Trading For Beginners to follow Day Trading Session Review.
- Cleaning quote encoding in Swing Trading For Beginners.
- Updating Small Cap Swing Trading to hand off to Stock Catalysts.
- Updating Stock Catalysts to follow Small Cap Swing Trading.

No production website files were edited.

## Recommended Next Action

Continue Pass 1 lesson-level quality audits course by course.

Next course:

```text
News, Catalysts And SEC Filings
```

Include:

- Stock catalysts, press releases, how to read press releases, SEC filings, how to use EDGAR source documents, SEC filing lesson modules, and news-category lessons.
- A restrained app bridge map centered on News/Filing Review, Trade Review, Risk Review, Analytics, Journal Notes, and Playbook Builder.
- Careful source/accuracy notes for official SEC and EDGAR references.
- Targeted markdown edits only where lesson quality, wording, flow, visual need, or app-bridge restraint needs cleanup.
