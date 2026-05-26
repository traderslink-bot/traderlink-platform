# TradersLink Academy Accuracy/Source Audit: Practice And Improvement

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Status: complete

## Scope

Reviewed the 9-lesson Practice And Improvement course:

- `academy/practice-trading.md`
- `academy/paper-trading.md`
- `academy/trade-replay-review.md`
- `academy/watchlist-review.md`
- `academy/setup-screenshot-review.md`
- `academy/trade-grading.md`
- `academy/one-rule-practice-drill.md`
- `academy/forward-testing-trading.md`
- `academy/trading-improvement-plan.md`

## Sources Used Internally

These sources were used to verify accuracy. Source details belong in this internal audit layer; user-facing lessons should stay clean unless an official document, exchange system, filing type, or rule is itself the lesson topic.

| Source | Used For |
|---|---|
| CFTC, Commodity Trading Systems Sold on the Internet | Hypothetical/simulated trading limitations, simulated fills, hidden costs, slippage, liquidity, and no profit-guarantee framing. |
| Investor.gov, Investor Bulletin: Performance Claims | Past performance, back-testing, projections, targets, and performance-guarantee guardrails. |
| SEC, Tips for Online Investing: Trading in Fast-Moving Markets | Fast-market execution delays, market/limit order tradeoffs, online execution assumptions, and live-trading risk context. |
| SEC Investor Bulletin, Trading Basics | Order-type behavior, market-order price risk, limit-order no-fill risk, and fast-moving market caveats. |
| Investor.gov, Types of Orders | Market, limit, and stop-order tradeoffs for fill assumptions in simulated and live review. |
| CFA Institute, Behavioral Biases of Individuals | Hindsight bias, overconfidence, loss aversion, and behavior-bias framing for replay, screenshots, grading, and practice review. |
| Local Trader Intelligence product docs | Product-truthfulness boundaries around completed-trade review, practice/progress framing, behavior patterns, confidence limits, no prediction, no signal claims, and no guaranteed improvement. |

## Overall Verdict

Practice And Improvement is accurate, well guardrailed, and ready to remain the course after Trade Review And Improvement.

The course already avoids the main source-sensitive risks:

- It does not claim practice, paper trading, replay, forward testing, grading, drills, or Trader Intelligence can guarantee future live trading results.
- It treats simulated and replayed decisions as practice evidence, not actual live trading performance.
- It distinguishes process quality from profit and loss.
- It teaches sample-building without overreacting to one outcome.
- It keeps app bridge language focused on completed-trade review, practice focus, progress, and repeated behavior patterns.

The useful edits were narrow: clarify that practice environments should be labeled, simulated fills may not represent live fills, replay can become hindsight if the outcome is known, grades are not forecasts, drills are sample evidence rather than permanent fixes, forward-test samples should not mix environments without noting it, and improvement plans should define better process rather than promise better outcomes.

## Targeted Edits Completed

| Lesson | Edit |
|---|---|
| `/academy/practice-trading/` | Added a guardrail that practice records should label whether results came from paper trading, replay, observation, or live trading; tightened the disclaimer around live-condition limits and no guaranteed results. |
| `/academy/paper-trading/` | Added simulated-fill review language for realistic, delayed, partial, or assumed fills; tightened the disclaimer so simulated trades are not treated as actual trading performance. |
| `/academy/trade-replay-review/` | Added a hindsight guardrail to record whether the trader already knew the ticker, session, or final outcome. |
| `/academy/trade-grading/` | Added language that grades are review labels, not forecasts of the next trade. |
| `/academy/one-rule-practice-drill/` | Added sample-evidence language so a clean drill result is not treated as proof that behavior is permanently fixed. |
| `/academy/forward-testing-trading/` | Added sample-environment language so live, simulated, replay-based, and observation-only examples are not treated as equal without noting the difference. |
| `/academy/trading-improvement-plan/` | Added a guardrail that an improvement plan should define better process, not promise better market outcomes. |

No visible source labels or citations were added to user-facing lesson content.

## Source-Sensitive Findings

### Practice Trading

The course opener is accurate. It frames practice as focused review and skill work, not a live-performance guarantee. The added environment-label guardrail helps separate paper, replay, observation, and live examples before drawing conclusions.

### Paper Trading

Paper Trading was the most source-sensitive lesson. CFTC hypothetical/simulated trading guidance, SEC fast-market guidance, and order-type materials support the lesson's existing warning that simulated fills, slippage, liquidity, emotion, and account consequences may differ from live trading. The new edit makes fill assumptions explicit.

### Trade Replay Review

Trade Replay Review is accurate and already strong on hindsight bias. CFA behavioral-finance material supports the added note that replay should record whether the trader already knew the ticker, session, or final outcome.

### Watchlist Review

Watchlist Review is accurate. It treats preparation as a decision-quality filter, not prediction. It also avoids implying that a watchlist is good only because a stock moved.

No correction was required.

### Setup Screenshot Review

Setup Screenshot Review is accurate. It teaches screenshots as decision evidence and correctly warns that after-the-fact screenshots can reinforce hindsight bias.

No correction was required.

### Trade Grading

Trade Grading is accurate. It separates process quality from outcome and avoids treating grades as guarantees. The added sentence clarifies that grades are review labels, not forecasts.

### One-Rule Practice Drill

One-Rule Practice Drill is accurate and non-shaming. The added sample-evidence guardrail helps avoid overclaiming that one clean drill proves a behavior is fixed.

### Forward Testing

Forward Testing is accurate. Investor.gov performance-claim guidance supports the lesson's cautious treatment of samples, backtesting, future results, and changing market conditions. The added edit helps keep mixed live/simulated/replay samples from being overinterpreted.

### Trading Improvement Plan

Trading Improvement Plan is accurate. It turns review into specific practice without promising outcome improvement. The added sentence keeps the plan process-focused.

## App Bridge Check

The app bridge language remains restrained and review-focused.

Best future app surfaces:

- Progress/Academy for practice focus, lesson completion, next practice loop, and review habits.
- Trade Review for completed practice/live trade evidence and plan-versus-actual comparison.
- Risk Review for simulated versus live risk assumptions, size realism, and stop/fill caveats.
- Execution Review for simulated fills, spread, slippage, and live order behavior.
- Coaching for one-rule drills, repeated behavior, and next focus.
- Analytics for sample-based review, process grades, and behavior trends.
- Journal Notes for replay decisions, screenshots, watchlist reasons, and improvement-plan notes.
- Playbook Builder for forward-tested samples, setup criteria, disqualifiers, and rule refinements.

No hard app route links were added during this pass.

## Deferred Items

These do not block the course:

- A future Pass 4 visual/UI review should decide whether the optional watchlist, grade, drill, forward-test, and improvement-plan visuals are needed before implementation.
- Product bridge wording should be revisited before production launch if app route names, progress tracking, practice tracking, persistence, or analytics claims materially change.
- Optional future lessons remain candidates only if the UI needs deeper practice branches: `/academy/backtesting-vs-forward-testing/`, `/academy/trading-practice-schedule/`, `/academy/how-to-build-a-trade-sample/`, `/academy/process-scorecard-for-traders/`, and `/academy/reviewing-practice-vs-live-trades/`.

## Recommended Next Action

Next recommended audit:

```text
Pass 3: Accuracy/Source Audit for Academy Navigation Path Hubs
```

Reason: Practice And Improvement has now passed Pass 3. Academy Navigation Path Hubs is the final remaining Pass 3 item in the current workplan queue. The pass should verify that path hubs are framed as optional navigation support, not locked course requirements, investment advice, product promises, or duplicate full lessons.
