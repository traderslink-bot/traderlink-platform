# TradersLink Academy Accuracy/Source Audit: Trading Psychology And Discipline

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Status: complete

## Scope

Reviewed the 8-lesson Trading Psychology And Discipline course:

- `academy/trading-discipline.md`
- `academy/fomo-trading.md`
- `academy/chasing-stocks.md`
- `academy/revenge-trading.md`
- `academy/overtrading.md`
- `academy/holding-losers-too-long.md`
- `academy/cutting-winners-too-early.md`
- `academy/averaging-down.md`

## Sources Used Internally

These sources were used to verify accuracy. Source details belong in this internal audit layer; user-facing lessons should stay clean unless an official document, exchange system, filing type, or rule is itself the lesson topic.

| Source | Used For |
|---|---|
| Investor.gov, Thinking About Day Trading? Know the Risks | Active-trading risk framing, short-term trading uncertainty, and caution against implying that discipline or review removes risk. |
| FINRA, Day Trading | Day-trading risk context, frequent trading risk, and the importance of risk controls and account/rule context. |
| FINRA, Excessive Trading | Frequent-trading cost and activity-risk context, including the need to consider commissions, fees, and whether trading frequency fits the trader's plan and account. |
| Investor.gov, Types of Orders | Stop order and stop-limit order caveats, including execution-price and no-fill risks. |
| SEC Investor Bulletin, Stop Orders | Stop order behavior, fast-market caveats, and the risk that stop execution may differ from the expected stop price. |
| CFA Institute, Behavioral Finance references | Behavioral-finance concepts such as loss aversion, overconfidence, and disposition-effect style tendencies, used only to check general behavior framing and not as visible lesson citations. |

## Overall Verdict

Trading Psychology And Discipline is accurate, non-clinical, non-shaming, and ready to remain the bridge from risk/planning education into trade-review education.

The course already avoids the main source-sensitive risks:

- It does not treat trader behavior as a diagnosis, therapy topic, or personality flaw.
- It does not promise that discipline, rules, checklists, app review, or coaching language will fix behavior.
- It does not suggest buy or sell signals.
- It does not claim that avoiding FOMO, chasing, revenge trading, overtrading, holding losers, cutting winners, or averaging down guarantees better results.
- It keeps Trader Intelligence bridge language focused on completed-trade review rather than prediction or performance improvement promises.

The only useful edits were small guardrails around absolute wording, transaction costs, stop/exit execution caveats, hindsight review, total exposure, and self-judgment language.

## Targeted Edits Completed

| Lesson | Edit |
|---|---|
| `/academy/trading-discipline/` | Added non-judgmental review language and tightened the disclaimer so discipline does not imply guaranteed better decisions or results. |
| `/academy/revenge-trading/` | Replaced an absolute "every active trader" statement with "many active traders" and added a behavior-label clarification so revenge trading is not framed as medical or personality language. |
| `/academy/overtrading/` | Expanded cost language from spread/slippage to commissions, fees, spread cost, and slippage, and added a note that frequent trading makes account/risk rules more important. |
| `/academy/holding-losers-too-long/` | Added an execution caveat that stop and exit plans can reduce decision drift but cannot guarantee exact fills in fast, illiquid, halted, or gapping markets. |
| `/academy/cutting-winners-too-early/` | Added hindsight-bias guardrail language so missed moves are reviewed against the plan and information available at the time. |
| `/academy/averaging-down/` | Added total exposure, liquidity, and exitability checks to the planned-versus-emotional averaging-down distinction. |

No visible source labels or citations were added to user-facing lesson content.

## Source-Sensitive Findings

### Discipline And Rule Adherence

The trading-discipline lesson is accurate as process education. It defines discipline as following a reviewable plan, not as willpower or moral strength. The added wording makes the lesson safer by clarifying that review should not become self-diagnosis or character judgment.

No broader rewrite was required.

### FOMO And Chasing

The FOMO and chasing lessons are accurate. They separate planned momentum or breakout context from urgency-driven entries. This is consistent with behavioral-finance concepts around attention, emotion, overconfidence, and decision pressure, while staying practical and non-clinical.

No correction was required.

### Revenge Trading

The revenge-trading lesson is accurate and appropriately non-shaming. It describes a common post-loss behavior pattern without medicalizing it. The useful source-sensitive edit was replacing absolute language and clarifying that the phrase is a review label, not a medical or personality label.

### Overtrading

The overtrading lesson is accurate. FINRA and Investor.gov risk materials support the lesson's frequent-trading caution, especially around costs, risk controls, and the danger of activity that is not matched to a plan. The lesson now explicitly includes commissions, fees, spread cost, and slippage.

No performance or outcome promise was found.

### Holding Losers Too Long

The holding-losers lesson is accurate. It correctly separates a planned losing trade from an unplanned risk expansion. Investor.gov and SEC stop-order materials support the added caveat that planned stops or exits do not guarantee exact execution in fast, thin, halted, or gapping conditions.

### Cutting Winners Too Early

The cutting-winners lesson is accurate. It correctly separates planned profit protection from fear-based early exits. The added hindsight guardrail is important because trade review should compare the actual exit with the plan and information available at the time, not with the full future chart.

### Averaging Down

The averaging-down lesson is accurate. It treats averaging down as a risk decision, not a price-improvement trick. The added wording makes the source-sensitive risk clearer by asking whether total exposure, liquidity, and exitability still fit the plan after the add.

## App Bridge Check

The app bridge language remains restrained and review-focused.

Best future app surfaces:

- Trade Review for completed-trade evidence around entries, exits, reasons, plan adherence, and repeated mistake tags.
- Risk Review for size, stop movement, invalidation, daily loss limits, averaging down, and loss expansion.
- Execution Review for chasing, spread, slippage, late entries, quick re-entries, and order/exit mismatch.
- Session Review for overtrading, revenge sequences, quality drop after wins/losses, and time-of-day behavior.
- Analytics for repeated behavior patterns across completed trades and sessions.
- Coaching for post-trade interpretation of rule breaks, FOMO, revenge trading, and management decisions.
- Playbook Builder for separating planned setups from emotional variations of the same ticker or pattern.

No hard app route links were added during this pass.

## Deferred Items

These do not block the course:

- A future visual/UI-readiness pass should decide whether this course needs behavior-loop visuals or whether review UI screenshots are more useful.
- Possible future lesson additions remain optional: `/academy/rule-break-review/`, `/academy/trading-after-a-loss/`, `/academy/emotional-trade-tags/`, `/academy/session-reset-rules/`, and `/academy/confidence-after-losses/`.
- A future app-bridge pass can map exact UI entry points after the Trader Intelligence routes and product language are stable.

## Recommended Next Action

Next recommended audit:

```text
Pass 3: Accuracy/Source Audit for Trade Review And Improvement
```

Reason: Trading Psychology And Discipline has now passed Pass 3. Trade Review And Improvement is the next source-sensitive course because it is the strongest natural bridge between Academy lessons and the app. It should verify review-process language, planned-versus-actual claims, execution review, mistake-pattern review, app bridge restraint, and any wording that could imply guaranteed improvement.
