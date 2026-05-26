# TradersLink Academy Accuracy/Source Audit: Swing Trading Workflow

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Status: complete

## Scope

Reviewed the 8-lesson Swing Trading Workflow course:

- `academy/swing-trading-for-beginners.md`
- `academy/swing-trading-risk-management.md`
- `academy/swing-trading-support-resistance.md`
- `academy/swing-trading-volume.md`
- `academy/swing-trading-catalysts.md`
- `academy/swing-trading-earnings.md`
- `academy/swing-trading-news-risk.md`
- `academy/swing-trading-small-caps.md`

## Sources Used Internally

These sources were used to verify accuracy. Source details belong in this internal audit layer; user-facing lessons should stay clean unless an official document or system is the lesson topic.

| Source | Used For |
|---|---|
| SEC, After-Hours Trading: Understanding the Risks | Overnight and extended-hours risk: lower liquidity, wider spreads, volatility, uncertain prices, news impact, and partial/no execution risk. |
| FINRA, Extended-Hours Trading: Know the Risks | Extended-hours pricing, lower liquidity, wider spreads, volatility, next-open caveats, and broker/platform risk disclosure context. |
| Investor.gov, Understanding Margin Accounts | Margin-call risk, broker liquidation risk, amplified losses, and account-type caution for multi-session holds. |
| Investor.gov, Types of Orders | Stop order, market order, limit order, and execution-price/no-fill caveats relevant to swing risk plans. |
| SEC, Search Filings | EDGAR filing access for company filings, catalyst checks, offering/dilution review, and source verification. |
| SEC, Microcap Stock: A Guide for Investors | Microcap/small-cap risk, public-information gaps, promotion/fraud risk, liquidity risk, and issuer-quality review. |
| Investor.gov, Microcap Stock Basics: Risk | Microcap liquidity, fraud/manipulation, price/volume manipulation, and public-information caution. |
| FINRA, Low-Priced Stocks Can Spell Big Problems | Low-priced/microcap promotion, limited public information, fraud, liquidity, and social-media caution. |

## Overall Verdict

Swing Trading Workflow is accurate and source-aligned. The course teaches swing trading as a multi-session planning and review process, not as a slower or easier version of day trading.

The course already avoids the major source-sensitive problems:

- It does not claim swing trading is safer than day trading.
- It does not claim overnight holding gives a trader more certainty.
- It does not imply support, resistance, volume, catalysts, earnings, or news guarantee continuation.
- It treats earnings and news as event-risk decisions rather than opportunities to predict.
- It frames small-cap swing trading as higher-context risk review around float, filings, dilution, liquidity, gaps, and halts.
- It keeps app bridge language focused on completed-trade review.

The useful edits were narrow and user-facing in plain language, not citation labels.

## Targeted Edits Completed

| Lesson | Edit |
|---|---|
| `/academy/swing-trading-volume/` | Replaced curly quote encoding with ASCII quotes in the opening volume-review question. |
| `/academy/swing-trading-earnings/` | Added plain lesson wording that earnings dates, release times, and conference call schedules can change and should be verified from current company or market-calendar information before the risk is treated as planned. |

No broad rewrite was needed.

## Source-Sensitive Findings

### Swing Trading For Beginners

The beginner lesson is accurate. It correctly teaches swing trading as a planned multi-session workflow and warns against renaming a failed day trade as a swing trade after the fact. It includes overnight, event, catalyst, filing, level, size, and review context without giving trade instructions.

No correction was required.

### Swing Trading Risk Management

The risk lesson is accurate. SEC and FINRA extended-hours materials support the lesson's gap, overnight, lower-liquidity, wider-spread, volatility, and news-risk framing. Investor.gov margin materials support the account-risk caution that multi-session holds and margin can create risk beyond the initial chart plan.

No correction was required.

### Swing Trading Support And Resistance

The support/resistance lesson is accurate. It treats levels as planning and review zones, not exact prices or guaranteed bounce/rejection areas. The level language is consistent with the already-audited Chart Reading approach.

No correction was required.

### Swing Trading Volume

The volume lesson is accurate. It treats volume as participation context and avoids using volume as a standalone signal. It correctly distinguishes one-day attention from multi-session follow-through and includes liquidity/spread review.

A small quote-encoding cleanup was completed.

### Swing Trading Catalysts

The catalyst lesson is accurate. It treats catalysts as reasons to review market reaction, not guarantees. SEC filing access supports the lesson's source-first framing around filings, and prior News/Catalyst audit work supports the lesson's distinction between headline, actual detail, volume reaction, and follow-through.

No correction was required.

### Swing Trading Earnings

The earnings lesson is accurate. It separates pre-earnings, through-earnings, and post-earnings plans and warns that earnings can create gaps that ignore normal chart planning. The lesson already avoids saying good earnings must lead to price increases.

A small plain-language guardrail was added to remind learners that event timing can change and should be verified before a trader treats earnings risk as planned.

### Swing Trading News Risk

The news-risk lesson is accurate. SEC and FINRA extended-hours materials support its warning that news can affect prices when liquidity and spread conditions are different. SEC filing access supports its source-document review language.

No correction was required.

### Small Cap Swing Trading

The small-cap swing lesson is accurate and appropriately cautious. SEC, Investor.gov, and FINRA microcap/low-priced-stock materials support the lesson's caution around public-information quality, liquidity, promotion, fraud/manipulation risk, float, dilution, filings, and volatility.

No correction was required.

## App Bridge Check

The app bridge language remains restrained and review-focused.

Best future app surfaces:

- Trade Review for thesis, entry timing, hold decisions, adds/reductions, and exit review.
- Risk Review for gap risk, position sizing, invalidation, event risk, and thesis changes.
- News/Filing Review for catalysts, SEC filings, earnings, offerings, and surprise news.
- Analytics for comparing swing outcomes by catalyst type, volume context, liquidity, and hold duration.
- Coaching for style drift, moving invalidation, hope holds, and thesis changes after entry.
- Playbook Builder for repeatable swing criteria, disqualifiers, and post-trade evidence.

No hard app route links were added during this pass.

## Deferred Items

These are useful later, but they do not block the course:

- A dedicated earnings-calendar/event-verification lesson if the future UI includes event-date reminders.
- A future small-cap swing visual showing float, dilution, spread, and gap-risk review in one dashboard.
- A future source refresh if account/margin or extended-hours broker behavior becomes more specific in the user-facing lessons.

## Recommended Next Action

Next recommended audit:

```text
Pass 3: Accuracy/Source Audit for Chart Reading And Market Structure
```

Reason: Chart Reading And Market Structure is still marked `not_started` for Pass 3, and it contains foundational support/resistance, key level, breakout, breakdown, reclaim, HOD/LOD, premarket high/low, previous-day levels, trend-structure, and market-structure lessons. The next source pass should verify anti-guarantee language, chart-reference definitions, time-of-day references, and consistency with the newer `/academy/...` URL structure.
