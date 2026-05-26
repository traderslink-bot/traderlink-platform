# Academy-Wide Sequence And Cross-Link Audit

Date: 2026-05-17

Audit pass: Pass 2 - Course Sequence And Cross-Link Audit

Scope: All Academy-ready lessons and path hubs

Status: complete

## Files Reviewed

This pass mapped all local Academy markdown files with:

```text
content_type: "academy_lesson"
content_type: "academy_path_hub"
```

Total mapped files:

```text
223 Academy markdown files
```

Mapped course groups:

- Academy Navigation
- Candlestick Patterns In Context
- Chart Patterns In Context
- Chart Reading And Market Structure
- Day Trading Workflow
- Halts And High-Volatility Events
- News, Catalysts And SEC Filings
- Practice And Improvement
- Risk Management And Trade Planning
- Small-Cap Stocks, Float And Dilution
- Swing Trading Workflow
- Technical Indicators And Tools
- Trade Review And Improvement
- Trading Foundations
- Trading Psychology And Discipline
- Trading Styles And Playbooks
- Volume, Liquidity And Order Flow

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`

## Overall Verdict

The Academy-wide sequence is structurally ready for the next planning phase. The course-by-course lesson content is complete enough to support a future UI with course cards, lesson progress, continue-learning, and optional path hubs.

The most important Pass 2 finding is that TradersLink Academy should not be treated as one strict linear chain. The markdown files contain two valid navigation models:

1. **Primary course sequences**: lessons inside the same course, ordered by `academy_order`, with previous/next metadata.
2. **Cross-listed learning bridges**: lessons that connect courses, support secondary paths, or act as capstones for a related topic.

That means the future UI should not assume every `recommended_next` and every target `recommended_previous` must be perfectly reciprocal. Some non-reciprocal links are intentional because a lesson is cross-listed or because a path hub points users back into a broader Academy navigation flow.

This pass did not require broad resequencing. It did require stale-link cleanup in several lessons where older shorthand URLs no longer matched the completed Academy lesson slugs.

## Major Findings

1. All 223 Academy markdown files were mapped successfully.
2. All `recommended_previous` and `recommended_next` targets resolve to local Academy markdown files.
3. All in-body `/academy/.../` links inside mapped Academy lessons now resolve to local markdown files.
4. Several stale links were found and corrected in Chart Patterns, Trading Styles, Swing Trading Workflow, and Trading Psychology.
5. The remaining non-reciprocal previous/next findings are cross-listed or navigation exceptions, not missing files.
6. Path hubs are correctly treated as navigation support, not a numbered course.
7. Academy-wide UI should support free movement, continue-learning, and next recommended lessons without enforcing every bridge as a locked sequence.
8. No production website files were edited.

## Targeted Link Fixes Completed

| File | Issue | Fix |
|---|---|---|
| `academy/chart-patterns/channel-pattern.md` | Linked to missing `/academy/trend-lines/`. | Replaced with `/academy/swing-highs-and-swing-lows/`. |
| `academy/multi-day-runner.md` | Linked to missing `/academy/float/` and `/academy/short-squeeze/`. | Replaced with `/academy/stock-float/` and `/academy/low-float-stocks/`. |
| `academy/swing-trading-catalysts.md` | Linked to missing `/academy/news-driven-stocks/`. | Replaced with `/academy/how-to-review-news-trades/`. |
| `academy/swing-trading-news-risk.md` | Linked to missing `/academy/news-driven-stocks/`. | Replaced with `/academy/stock-catalysts/`. |
| `academy/swing-trading-small-caps.md` | Linked to missing `/academy/penny-stock-dilution-risk/`. | Replaced with `/academy/dilution-risk/`. |
| `academy/averaging-down.md` | Pointed directly to `/academy/trade-risk-review/` even though the Trade Review course opener uses Averaging Down as its previous lesson. | Changed next lesson to `/academy/trade-review-and-improvement/`. |

## Course-To-Course Transition Notes

The main Academy course order remains:

1. Trading Foundations
2. Chart Reading And Market Structure
3. Volume, Liquidity And Order Flow
4. Risk Management And Trade Planning
5. Technical Indicators And Tools
6. Trading Styles And Playbooks
7. Day Trading Workflow
8. Swing Trading Workflow
9. News, Catalysts And SEC Filings
10. Small-Cap Stocks, Float And Dilution
11. Halts And High-Volatility Events
12. Trading Psychology And Discipline
13. Trade Review And Improvement
14. Practice And Improvement

Important UI interpretation:

- This course order should drive Academy homepage and course-card ordering.
- Lesson-level previous/next links should drive local lesson navigation.
- Cross-listed lessons should not be forced to have a single reciprocal previous/next path.
- Path hubs should be available as optional navigation helpers, not locked requirements.

## Documented Cross-List And Navigation Exceptions

The following non-reciprocal previous/next relationships should be treated as intentional or acceptable until the production UI defines a formal cross-listing model:

| Source | Target | Why It Is Acceptable |
|---|---|---|
| `/academy/atr/` -> `/academy/volume-by-price/` | Volume By Price is primary to Volume, Liquidity And Order Flow but cross-listed as an indicator-adjacent volume tool. |
| `/academy/chart-patterns/parabolic-move/` -> `/academy/chart-patterns/vwap-reclaim/` | VWAP Reclaim is primary to Technical Indicators And Tools but also caps Chart Patterns In Context. |
| `/academy/pullbacks-and-dip-buy-setups/` -> `/academy/breakout-trading/` | Breakout Trading is primary to Chart Reading but cross-listed into Trading Styles And Playbooks as a setup type. |
| `/academy/multi-day-runner/` -> `/academy/chasing-stocks/` | Chasing Stocks is primary to Trading Psychology but caps Trading Styles as a late-entry risk warning. |
| `/academy/building-a-playbook-from-reviewed-trades/` -> `/academy/how-to-review-news-trades/` | News-trade review is primary to News, Catalysts And SEC Filings but also supports the Trade Review path. |
| `/academy/day-trading-vs-swing-trading/` -> `/academy/trading-plan/` | Trading Foundations points into risk planning as a beginner next step, while Trading Plan also follows Volume in the main risk course sequence. |
| `/academy/going-concern/` -> `/academy/trading-plan/` | Small-cap dilution context links back into risk planning; this is a learning bridge, not a required reciprocal chain. |
| `/academy/high-volatility-trade-review/` -> `/academy/chart-reading-path/` | The halt course capstone points back to a broader chart-reading path hub after event-risk review. |
| `/academy/risk-discipline-path/` -> `/academy/how-to-use-traderslink-academy/` | The final path hub sends users back to Academy navigation, while the Academy navigation lesson belongs to Trading Foundations. |

## Related Lesson Link Quality Notes

Related links are generally useful and learning-oriented. They mostly connect:

- Course neighbors.
- Cross-listed foundation lessons.
- Review/practice lessons.
- Risk and execution lessons.
- Source-sensitive filing or catalyst lessons.

Future related-link cleanup should focus on quality rather than quantity:

- Avoid using related links only for SEO.
- Prefer links that answer the learner's next practical question.
- Keep cross-listed links useful but do not overload every lesson with every adjacent course.
- Use path hubs sparingly as route maps, not as substitutes for specific lesson links.

## Future UI Implications

The Academy UI should use separate navigation concepts:

- **Course order** for homepage cards and course landing pages.
- **Lesson order** for next/previous inside a course.
- **Path hubs** for optional guided routes.
- **Cross-listed lessons** for secondary placement.
- **Continue-learning** for the user's actual last unfinished lesson.
- **Recommended next** for the editorially suggested next step.

Important implementation note:

Do not build a UI that assumes the Academy is one single linked list. The content model is closer to a course catalog with guided paths, cross-listed lessons, and progress-aware recommendations.

## Accuracy/Source Notes

This pass was a sequence and cross-link audit, not an official Accuracy/Source Audit. No external source verification was performed.

The next audit phase should prioritize factual and rule-sensitive lessons, especially:

- SEC filings and EDGAR workflows.
- Halt and circuit-breaker rules.
- Short selling and borrow risk.
- Order mechanics, spread, slippage, and execution.
- Market sessions and after-hours mechanics.
- FDA, clinical trial, biotech, and regulatory catalyst lessons.

## Verification Completed

- Rebuilt a metadata map of 223 Academy markdown files.
- Confirmed every Academy `recommended_previous` target resolves locally.
- Confirmed every Academy `recommended_next` target resolves locally.
- Confirmed every in-body `/academy/.../` link in mapped Academy files resolves locally.
- Rechecked non-reciprocal previous/next relationships and documented cross-list exceptions.
- Confirmed the edited files contain no hard `/trader-intelligence/` or `/features/` route links.
- Confirmed the edited files contain no raw `[/academy/.../]` labels, encoding artifacts, buy/sell signal language, or guaranteed-profit language.

## Recommended Next Action

Continue with the next audit phase:

```text
Pass 3: Accuracy/Source Audit for News, Catalysts And SEC Filings
```

Reason:

News, Catalysts And SEC Filings is the highest source-sensitive Academy course. It includes SEC filings, EDGAR workflows, press releases, earnings, FDA and clinical-trial news, contracts, partnerships, mergers, filings, offering context, and news-trade review. This pass should verify factual details and official-source references before the Academy moves toward production UI planning.
