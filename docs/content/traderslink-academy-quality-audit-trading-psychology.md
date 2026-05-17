# Trading Psychology And Discipline Lesson-Level Quality Audit

Date: 2026-05-17

Audit pass: Pass 1 - Lesson-Level Quality Audit

Course: Trading Psychology And Discipline

Status: complete

## Files Reviewed

- `docs/content/drafts/learn/trading-discipline.md`
- `docs/content/drafts/learn/fomo-trading.md`
- `docs/content/drafts/learn/chasing-stocks.md`
- `docs/content/drafts/learn/revenge-trading.md`
- `docs/content/drafts/learn/overtrading.md`
- `docs/content/drafts/learn/holding-losers-too-long.md`
- `docs/content/drafts/learn/cutting-winners-too-early.md`
- `docs/content/drafts/learn/averaging-down.md`

Related planning files:

- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-editorial-upgrade-tracker.md`

## Overall Verdict

Trading Psychology And Discipline is ready as an Academy course after Halts And High-Volatility Events. The course is practical, non-shaming, and structured around reviewable behaviors instead of vague motivation. It teaches behavior patterns that traders can identify after completed trades: rule breaks, FOMO, chasing, revenge trading, overtrading, holding losers, cutting winners, and averaging down.

The course succeeds because it does not treat psychology as personality judgment. It frames each behavior as a pattern that can be tagged, reviewed, and reduced through clearer rules, smaller size, limits, and post-trade evidence.

The course did not need a broad rewrite. It needed targeted cleanup around old generic CTA metadata and a few stripped price examples that made realistic examples less readable.

## Major Findings

1. The course flow is strong. It starts with broad discipline, moves into impulse patterns, then finishes with trade-management behaviors.
2. The course avoids shame framing. Lessons consistently describe behavior patterns without calling the trader weak, broken, lazy, or incapable.
3. The course avoids medicalized language. It does not diagnose users or treat trading behavior as therapy.
4. All 8 lessons include the required Academy structure: lesson objective, common mistakes, practical checklist, Apply This In Review, Trader Intelligence bridge, FAQ, and educational disclaimer.
5. Previous/next metadata is intact from `/learn/holding-through-news/` into `/learn/trading-discipline/` and from `/learn/averaging-down/` into `/learn/trade-risk-review/`.
6. The old metadata CTAs used several slightly product-heavy "If you want..." variants. This pass normalized them into restrained completed-trade review language.
7. Several realistic examples had stripped prices such as `.00`, `.80`, and `.20 per share`. This pass restored readable numeric examples.
8. The course has no dedicated visuals today. That is acceptable for Pass 1, but a later Visual Gap Audit should consider behavior-loop and mistake-pattern review visuals before UI implementation.

## Lesson-Level Notes

| Lesson | Quality Result | Depth | App Bridge Result | Edit Needed |
|---|---|---|---|---|
| `/learn/trading-discipline/` | Pass after cleanup | Strong course opener that defines discipline as rule adherence, reviewability, and process consistency rather than willpower. | Core bridge to Coaching, Trade Review, Risk Review, and Analytics. | Normalized metadata CTA. |
| `/learn/fomo-trading/` | Pass after cleanup | Strong lesson separating planned momentum from urgency-driven entries. | Core bridge to Trade Review, Coaching, and mistake-pattern review. | Normalized metadata CTA and restored readable price examples. |
| `/learn/chasing-stocks/` | Pass after cleanup | Strong late-entry lesson with risk distance, extension, spread, and nearby-level context. | Core bridge to Trade Review, Execution Review, and Analytics. | Normalized metadata CTA and restored readable price examples. |
| `/learn/revenge-trading/` | Pass after cleanup | Strong non-shaming lesson on trades taken after frustration, losses, or missed moves. | Core bridge to Coaching, Risk Review, and Trade Review. | Normalized metadata CTA. |
| `/learn/overtrading/` | Pass after cleanup | Strong session-behavior lesson that defines overtrading by quality and reason, not only count. | Core bridge to Analytics, Coaching, Session Review, and Trade Review. | Normalized metadata CTA. |
| `/learn/holding-losers-too-long/` | Pass after cleanup | Strong trade-management lesson that separates planned losses from unplanned risk expansion. | Core bridge to Risk Review, Trade Review, and Coaching. | Normalized metadata CTA and restored readable price examples. |
| `/learn/cutting-winners-too-early/` | Pass after cleanup | Strong early-exit lesson that separates planned profit protection from fear-based exiting. | Core bridge to Trade Review, Risk Review, and Analytics. | Normalized metadata CTA and restored readable price examples. |
| `/learn/averaging-down/` | Pass after cleanup | Strong risk-expansion lesson separating planned scaling from emotional adding. | Core bridge to Risk Review, Trade Review, and mistake-pattern review. | Normalized metadata CTA and restored readable price examples. |

## App Bridge Map

| Lesson / Module | Primary App Surface | Secondary App Surface | Bridge Strength | Natural Tie-In | Needed Edit |
|---|---|---|---|---|---|
| Trading discipline | Coaching | Trade Review / Risk Review / Analytics | Core Bridge | Review whether completed trades followed rules, respected risk, and stayed repeatable even when profitable. | Normalized CTA. |
| FOMO trading | Trade Review | Coaching / mistake-pattern review | Core Bridge | Review late entries, scanner/chat/social triggers, urgency, distance from risk, and whether the setup still matched the plan. | Normalized CTA and fixed examples. |
| Chasing stocks | Trade Review | Execution Review / Analytics | Core Bridge | Review entry timing, distance from clean levels, spread/slippage, extension, and repeated chase tags. | Normalized CTA and fixed examples. |
| Revenge trading | Coaching | Risk Review / Trade Review | Core Bridge | Review trades after losses, quick re-entries, size increases, daily-loss-limit breaks, and frustration triggers. | Normalized CTA. |
| Overtrading | Analytics | Coaching / Session Review / Trade Review | Core Bridge | Review trade count, setup quality, session timing, repeated tickers, and quality drop after wins or losses. | Normalized CTA. |
| Holding losers too long | Risk Review | Trade Review / Coaching | Core Bridge | Review planned versus actual loss, stop movement, invalidation, averaging down, timeframe drift, and exit delay. | Normalized CTA and fixed examples. |
| Cutting winners too early | Trade Review | Risk Review / Analytics | Core Bridge | Review planned versus actual exits, target adherence, fear-based exits, scaling, and winner/loser management imbalance. | Normalized CTA and fixed examples. |
| Averaging down | Risk Review | Trade Review / mistake-pattern review | Core Bridge | Review whether adds were planned, whether thesis remained valid, and whether total risk expanded beyond the plan. | Normalized CTA and fixed examples. |

## Visual Needs

No new SVGs were created in this pass. The course currently has no dedicated realistic SVG support, which is acceptable for lesson quality but should be reviewed before UI implementation.

Future optional SVGs:

- `trading-discipline-rule-break-loop.svg`
- `fomo-late-entry-review.svg`
- `revenge-trading-sequence-review.svg`
- `overtrading-session-quality-drop.svg`
- `holding-losers-risk-expansion.svg`
- `cutting-winners-planned-vs-actual-exit.svg`
- `averaging-down-risk-stack.svg`

Visual requirements for any future Psychology visuals:

- Use realistic trading-dashboard context where charts are shown.
- Use red and green candlesticks only when chart behavior matters.
- Prefer review timelines, behavior tags, risk expansion bars, session markers, and planned-versus-actual comparisons over abstract emotion graphics.
- Use dark TradersLink dashboard styling with blue accent.
- Avoid shame labels, medicalized labels, buy/sell labels, profit claims, and guaranteed-outcome language.
- Include `title` and `desc` tags.
- Keep labels readable on mobile.

## New Lessons Needed

No urgent new lesson is required for this course before the next Pass 1 audit.

Future optional additions could be considered during a later sequence or visual audit:

- `/learn/rule-break-review/`
- `/learn/trading-after-a-loss/`
- `/learn/emotional-trade-tags/`
- `/learn/session-reset-rules/`
- `/learn/confidence-after-losses/`

Do not add these automatically during Pass 1. They may be useful if the UI needs a deeper behavior-review branch or if later app bridge planning needs more direct support for coaching and mistake-pattern workflows.

## Accuracy/Source Notes

This pass was a lesson-level quality audit, not an official Accuracy/Source Audit. No external source verification was needed because this course is primarily behavioral and process-based.

Future Accuracy/Source Audit should still verify:

- No medical, diagnostic, therapeutic, or mental-health claims are introduced.
- No promise is made that any tool, lesson, or review process will fix trader behavior.
- No behavioral lesson suggests a trade direction, performance outcome, or guaranteed improvement.
- Risk-management claims remain tied to planning and review rather than investment advice.

## Lesson Edits Completed

Edited course files:

- `docs/content/drafts/learn/trading-discipline.md`
- `docs/content/drafts/learn/fomo-trading.md`
- `docs/content/drafts/learn/chasing-stocks.md`
- `docs/content/drafts/learn/revenge-trading.md`
- `docs/content/drafts/learn/overtrading.md`
- `docs/content/drafts/learn/holding-losers-too-long.md`
- `docs/content/drafts/learn/cutting-winners-too-early.md`
- `docs/content/drafts/learn/averaging-down.md`

Edits were limited to:

- Normalizing old generic metadata CTAs into restrained completed-trade review language.
- Restoring readable numeric price examples where stripped prices made examples look broken.

No production website files were edited.

## Verification Completed

- Confirmed all 8 lessons include the required Academy sections.
- Confirmed previous/next metadata matches the intended course chain.
- Confirmed no missing local `/learn/.../` draft links were introduced by this pass.
- Confirmed no hard `/trader-intelligence/` or `/features/` route links remain in the Psychology course files.
- Confirmed no raw `[/learn/.../]` labels remain in the Psychology course files.
- Confirmed no broad journal wording, encoding artifacts, medicalized claims, or shame wording were introduced.
- Confirmed the course keeps app bridge language review-focused and does not promise prediction, performance, or behavior fixes.

## Recommended Next Action

Continue Pass 1 lesson-level quality audits course by course.

Next recommended audit:

```text
Pass 1: Lesson-Level Quality Audit for Trade Review And Improvement
```

Include:

- Trade Review And Improvement course opener, trade risk review, planned-vs-actual review, execution review, mistake pattern review, swing trade journal, and Trader Intelligence trade review bridge.
- A restrained app bridge map centered on Trade Review, Risk Review, Execution Review, Coaching, Analytics, Journal Notes, and Progress/Academy.
- Careful language that makes this the strongest natural app bridge course without turning lessons into product ads.
- Targeted markdown edits only where lesson quality, wording, flow, visual need, source-risk labeling, or app-bridge restraint needs cleanup.
