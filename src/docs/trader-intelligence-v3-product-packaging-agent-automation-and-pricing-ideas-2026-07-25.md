# Trader Intelligence v3 Product Packaging, Agent Automation, and Pricing Ideas

**Date:** 2026-07-25 America/Toronto  
**Status:** non-controlling product backlog and pricing hypotheses  
**Scope:** future product packaging, automation, credits, agents, and launch ideas  
**Related direction:** `src/docs/trader-intelligence-v3-post-ga0-b-query-simulation-and-candle-direction-lock-2026-07-25.md`

This document preserves owner-approved and exploratory product ideas for future reference. It does not change GA0-B4, authorize implementation, lock final prices, or replace later customer research, cost measurement, legal review, or product decisions.

---

## 1. Product packaging direction

A practical initial structure is:

1. one free non-AI plan;
2. two paid plans at launch;
3. an optional third premium paid plan later, after advanced automation and candle-dependent simulations are proven.

The current working concept is:

| Plan | Working price | Product purpose |
| --- | ---: | --- |
| Free | `$0` | Useful journal, imports, deterministic analytics, and limited simulations without AI explanation |
| Trader | approximately `$24/month` | AI questions, fuller analytics, evidence, simulations, and a limited automation allowance |
| Pro | approximately `$49/month` | More AI usage, more automated reviews, more active rules, and deeper reports |
| Elite, later | approximately `$79/month` | Heavy agent usage, advanced simulations, priority processing, and early access |

These are hypotheses, not final prices. Annual discounts, trial periods, entitlements, and exact allowances remain open decisions.

---

## 2. Core pricing principle

> Analytics and deterministic calculations are included product capabilities. Credits pay for AI interpretation and automated AI work.

Users should not feel charged merely for accessing their own trading records or running exact calculations.

### 2.1 Deterministic work

Deterministic work is performed by ordinary application code, not by a paid language-model call.

Examples:

- importing and validating trades;
- reconstructing positions and round trips;
- exact P/L, fees, expectancy, median, win rate, and profit factor;
- filters, groupings, comparisons, tables, and charts;
- deterministic trade tags;
- VWAP, EMA9, EMA20, MFE, MAE, and profit-giveback calculations;
- evidence retrieval;
- similar-trade filtering and scoring;
- historical rule simulations;
- rule-compliance calculations.

A point-and-click deterministic action can use zero AI credits.

A natural-language request may use a small model call to understand the question and explain the verified result, but the calculation itself remains deterministic.

### 2.2 AI work

AI credits may be used for:

- interpreting a natural-language question;
- selecting approved query, evidence, analytics, and simulation capabilities;
- explaining deterministic results;
- comparing several analyses;
- producing an AI-written trade, session, weekly, or monthly review;
- generating a concise journal narrative;
- discussing counterexamples and limitations;
- suggesting a historical rule candidate or follow-up analysis.

The model does not calculate financial truth from raw rows or candles.

### 2.3 Automation runs

Automation runs represent jobs started without the user explicitly asking at that moment.

Examples:

- review an imported trading day;
- auto-tag an import batch;
- generate a daily journal entry;
- generate a weekly or monthly review;
- check active rule compliance;
- detect a meaningful behavioral change;
- run a scheduled deep rule analysis.

Do not charge one automation run per execution or per trade. One completed import/session review should normally count as one job.

---

## 3. Working allowances

Possible launch allowances:

| Capability | Free | Trader | Pro |
| --- | ---: | ---: | ---: |
| AI credits | none | approximately `500/month` | approximately `2,000/month` |
| Automation runs | none | approximately `25/month` | approximately `150/month` |
| Historical simulations | approximately `5/month` | approximately `100/month` | approximately `500/month` or fair-use |
| Trading accounts | 1 | 2 | several or unlimited |
| Core deterministic analytics | included | included | included |
| Evidence-linked results | limited history | full | full |
| Automatic import review | no | optional or limited | included |
| Weekly review | no | included | included |
| Monthly review | no | included | included |
| Active rule tracking | no or one rule | limited | broader |

Exact credit values require real model-cost measurements and usage observation.

### 3.1 Possible credit weights

A simple understandable model could be:

- simple question and explanation: `1` credit;
- multi-part analysis: `3` credits;
- deep trade or session review: `5` credits;
- weekly AI report: `10` credits;
- monthly AI report: `20` credits.

The product should display cost before unusually expensive jobs.

### 3.2 Possible automation weights

- one imported-day review: `1` run;
- one automatic batch tagging/review job: `1` run;
- weekly review: `2` runs;
- monthly review: `3` runs;
- deep rule analysis: `3` runs;
- large multi-rule comparison: `3–5` runs.

These weights remain exploratory.

---

## 4. Free-plan concept

The free plan should still be genuinely useful and may include:

- CSV import and deterministic validation;
- saved trades and reconstructed round trips;
- core P/L and performance statistics;
- basic filters, tables, and charts;
- deterministic tags;
- a limited date range or history window;
- a small number of historical simulations;
- no AI explanations or automatic AI reviews.

The free plan can demonstrate the quality of the journal without creating significant model cost.

---

## 5. Agent ideas

### 5.1 Trade Auto-Tagging Agent

Initial auto-tagging should begin with exact deterministic tags rather than uncertain setup labels.

Possible tags:

- long or short;
- winner, loser, or flat;
- weekday;
- time-of-day bucket;
- stock price range;
- first, second, third, or later trade of the day;
- trade after a completed win or loss;
- repeated attempt on the same ticker;
- holding-time range;
- position size relative to the user's median;
- above or below VWAP;
- above or below EMA9 and EMA20;
- unusually high profit giveback;
- daily drawdown state;
- user-defined rule followed or violated.

Later, after setup classification is reliable, tags may include first pullback, high-of-day breakout, VWAP reclaim, failed breakout, and other setup candidates with confidence and user correction.

Deterministic tags should not normally consume AI credits. AI may help explain or organize them.

### 5.2 Import Review Agent

Runs after a trade import or completed trading session.

Possible output:

- imported trade count;
- exact net P/L and fees;
- strongest and weakest trades;
- later-trade performance;
- repeated ticker attempts;
- sizing changes after losses;
- active-rule compliance;
- data-quality limitations;
- links to supporting and counterexample trades;
- one historical simulation worth testing.

The system should avoid claiming emotional intent as fact.

### 5.3 Session Review Agent

Creates an evidence-linked review for a day or session:

- direct summary;
- two to four strongest findings;
- one strength to repeat;
- one behavior or rule to review;
- representative trades and counterexamples;
- one suggested historical rule experiment;
- concise next-session plan.

### 5.4 Weekly Review Agent

Possible sections:

- week-over-week change;
- strongest and weakest time of day;
- price-range performance;
- after-loss behavior;
- position-size consistency;
- repeated ticker attempts;
- one strength;
- one improvement priority;
- active-rule progress;
- one follow-up analysis.

### 5.5 Monthly Review Agent

Possible sections:

- monthly performance and comparison with prior periods;
- major changes in behavior or results;
- outlier dependence;
- setup and market-context breakdowns when available;
- rule-experiment outcomes;
- representative evidence;
- recommended areas for the next month.

### 5.6 Rule Monitor Agent

Users may activate rules such as:

- stop after two losses;
- maximum three trades per day;
- reduce size after a loss;
- wait ten minutes before re-entry;
- no new trades after a chosen time;
- maximum attempts per ticker;
- selected VWAP or EMA entry/exit constraints later.

After each import, the system records:

- whether the rule was applicable;
- whether it was followed;
- what trades were affected;
- historical and prospective outcomes;
- limitations and counterexamples.

The agent explains the deterministic compliance result but does not invent it.

### 5.7 Similar-Trade Review Agent

Given a selected trade:

- retrieve deterministic similar trades;
- explain why they matched;
- summarize outcomes;
- identify conditions associated with better or worse results;
- show counterexamples;
- link to exact evidence.

### 5.8 Rule Lab Agent

Helps users define, run, compare, save, and prospectively track historical rules.

It may:

- translate plain language into a validated simulation plan;
- compare selected rules;
- explain days and trades helped or harmed;
- disclose in-sample optimization;
- help select one rule for future prospective tracking.

It may not describe historical optimization as a proven future edge.

---

## 6. Automated journaling concept

Automated journaling is broader than automatic broker import. It may include:

```text
trades imported
  -> deterministic reconstruction
  -> deterministic tags
  -> market context when available
  -> active-rule checks
  -> evidence-linked findings
  -> optional AI narrative
  -> saved journal entry
```

### 6.1 Import journal entry

Created for each imported trading day or session:

- exact trade and execution counts;
- P/L and costs;
- data-quality state;
- notable deterministic tags;
- rule-compliance summary;
- supporting trade links;
- optional AI narrative.

### 6.2 User control

Users should be able to:

- turn automatic reviews on or off;
- choose daily, weekly, or monthly cadence;
- choose which rules are monitored;
- edit or delete AI-written journal text;
- distinguish deterministic facts from AI interpretation;
- inspect all evidence used.

---

## 7. Suggested launch positioning

A possible product promise:

> Import your trades, and the journal organizes, analyzes, reviews, and tests them automatically—then lets you ask follow-up questions in plain English.

Potential differentiation:

- broad natural-language questions over verified trade data;
- exact evidence links for important conclusions;
- automatic session and import reviews;
- deterministic auto-tagging;
- journal-based historical Rule Lab;
- prospective rule monitoring;
- transparent separation between calculations and AI interpretation.

---

## 8. Cost and margin assumptions

Current rough planning assumption for an early 20-user beta:

- safe AI budget: approximately `$100/month` total;
- equivalent AI allowance risk: approximately `$5/user/month` at 20 users;
- server/database/hosting estimate remains a separate future decision;
- deterministic analytics should remain much cheaper than model-generated interpretation;
- cache repeated questions and results by dataset, filter, tool, and policy version;
- use compact verified tool results rather than sending raw trade histories or candle arrays to the model.

These numbers are not final pricing authority and must be replaced by measured usage.

---

## 9. Additional feature backlog ideas

### Near-term

- onboarding checklist and data-quality health screen;
- saved questions and saved analyses;
- pinned findings;
- one-click evidence drill-down;
- shareable private report export;
- configurable daily review time;
- notification when an import review is ready;
- active-rule dashboard;
- automation history and retry state;
- user-visible AI/automation allowance meter;
- admin cost and usage dashboard.

### Later

- user corrections that improve deterministic mapping policies;
- custom rule templates;
- multi-account comparisons;
- cohort or anonymized benchmark products only after explicit privacy design;
- team or coach collaboration with user-approved evidence sharing;
- strategy/setup classification after the deferred setup work is accepted;
- full market-universe backtesting as a separate advanced product surface;
- premium report templates and exports;
- API access for advanced users.

---

## 10. Open decisions

Still undecided:

- final plan names and prices;
- exact credit and automation allowances;
- whether simulations are unlimited under fair use or separately metered;
- annual discounts;
- overage purchases and credit rollover;
- whether Trader includes automatic import review or reserves it for Pro;
- account and broker limits;
- report retention and export limits;
- premium agent lineup;
- final hosting, database, storage, and payment-provider choices;
- exact model routing and cost controls.

Future implementation plans should treat this file as a product-idea backlog, not an accepted technical specification.
