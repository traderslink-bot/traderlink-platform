# Trader Intelligence v3 Product Packaging, Agents, Simulation Bot, and Pricing Ideas

**Date:** 2026-07-25 America/Toronto  
**Status:** non-controlling product backlog and pricing hypotheses  
**Scope:** future product packaging, AI credits, agents, simulation usage, and launch ideas  
**Related direction:** `src/docs/trader-intelligence-v3-post-ga0-b-query-simulation-and-candle-direction-lock-2026-07-25.md`

This document preserves owner-approved and exploratory product ideas for future reference. It does not change GA0-B4, authorize implementation, lock final prices, or replace later customer research, measured costs, legal review, or product decisions.

---

## 1. Product packaging direction

A practical initial structure is:

1. one free non-AI plan;
2. two paid plans at launch;
3. an optional third premium paid plan later, after advanced AI and candle-dependent simulations are proven.

Working concept:

| Plan | Working price | Product purpose |
| --- | ---: | --- |
| Free | `$0` | Useful journal, imports, deterministic analytics, and limited simulations without AI explanation |
| Trader | approximately `$24/month` | AI analytics questions, Coach access, Simulation Bot access, evidence, and moderate usage allowances |
| Pro | approximately `$49/month` | More AI usage, more simulation capacity, deeper Coach reviews, more active rules, and richer reports |
| Elite, later | approximately `$79/month` | Heavy agent and Simulation Bot usage, advanced simulations, priority processing, and early access |

These are hypotheses, not final prices. Annual discounts, trials, account limits, entitlements, overages, and exact allowances remain open decisions.

---

## 2. Core pricing principle

> Analytics and deterministic calculations are included product capabilities. Credits pay for AI interpretation, planning, and generated coaching.

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
- similar-trade matching;
- historical rule simulations and backtests over the user's own trades;
- rule-compliance calculations.

A point-and-click deterministic action can use zero AI credits.

A natural-language request may use a small model call to understand the question and explain the verified result, but the calculation itself remains deterministic.

### 2.2 AI work

AI credits may be used for:

- interpreting a natural-language question;
- creating a validated query or simulation plan;
- selecting approved analytics, evidence, and simulation capabilities;
- explaining deterministic results;
- comparing several analyses or simulations;
- producing an AI-written Coach review;
- discussing counterexamples and limitations;
- suggesting a historical rule candidate or follow-up analysis.

The model does not calculate financial truth from raw rows or candles.

### 2.3 Simulation usage

Simulation Bot usage should be understandable and separate from ordinary analytics.

Possible policies:

- limited monthly simulations by plan;
- unlimited simple simulations under fair use;
- metered advanced target sweeps, multi-rule searches, or candle-heavy simulations;
- AI credits charged only for natural-language planning and explanation, not for the deterministic simulation calculation itself.

The exact model remains open until real compute and usage data are measured.

---

## 3. Working allowances

Possible launch allowances:

| Capability | Free | Trader | Pro |
| --- | ---: | ---: | ---: |
| AI credits | none | approximately `500/month` | approximately `2,000/month` |
| Historical simulations | approximately `5/month` | approximately `100/month` | approximately `500/month` or fair-use |
| Trading accounts | 1 | 2 | several or unlimited |
| Core deterministic analytics | included | included | included |
| Evidence-linked results | limited history | full | full |
| Analytics Agent | no | included | included with higher allowance |
| Coach Agent | no | periodic/on-demand | deeper and more frequent |
| Simulation Bot | limited point-and-click | full standard library | advanced and higher-volume |
| Active rule tracking | no or one rule | limited | broader |

Exact values require real model-cost and compute measurements.

### 3.1 Possible AI credit weights

- simple question and explanation: `1` credit;
- multi-part analytics request: `3` credits;
- deep Coach review: `5` credits;
- weekly Coach review: `10` credits;
- monthly Coach review: `20` credits;
- complex Simulation Bot comparison or optimization explanation: `3–10` credits depending on scope.

The product should display expected cost before unusually expensive jobs.

---

## 4. Free-plan concept

The free plan should remain genuinely useful and may include:

- CSV import and deterministic validation;
- saved trades and reconstructed round trips;
- core P/L and performance statistics;
- basic filters, tables, and charts;
- deterministic tags;
- limited history or date range;
- a small number of point-and-click historical simulations;
- no AI explanations, Coach reviews, or natural-language Simulation Bot planning.

The free plan demonstrates the quality of the journal without creating meaningful model cost.

---

## 5. Simplified agent lineup

The product should avoid creating many small named agents. The preferred lineup is three clear experiences that share the same deterministic engines and evidence service.

### 5.1 Analytics Agent

Purpose:

> Answer the user's questions about their trading data in plain language.

Possible user questions:

- What times of day am I least profitable?
- How do I trade after a loss?
- Show my results in stocks under $5.
- Do my fourth and later trades perform worse?
- Compare this month with last month.
- Find trades similar to this losing trade.
- Do I perform better above or below VWAP?
- How do trades above EMA9 and EMA20 perform?

The Analytics Agent:

1. interprets the question;
2. creates a validated query plan;
3. calls the generic deterministic trade-query engine;
4. retrieves exact supporting and counterexample trades;
5. explains the verified result;
6. discloses sample size, outlier sensitivity, and limitations.

It must not receive unrestricted SQL or calculate financial truth itself.

### 5.2 Coach Agent

Purpose:

> Proactively identify what deserves the trader's attention, rank it, and help turn evidence into an improvement plan.

The Coach Agent may run after an import, on demand, weekly, or monthly.

Possible responsibilities:

- identify the largest performance leak;
- identify the strongest repeatable condition;
- detect whether an issue is improving or worsening;
- rank findings by historical impact, confidence, recurrence, actionability, and user relevance;
- show supporting trades and counterexamples;
- recommend one historical rule worth testing;
- provide a concise next-session focus;
- track user feedback on whether a finding was useful.

Initial execution-only Coach detectors may include:

- weak weekday;
- weak time window;
- fourth-and-later trades underperform;
- trades after losses underperform;
- size increases after losses;
- repeat ticker attempts underperform;
- excessive daily trade count;
- weak price range;
- holding losers longer than winners;
- long versus short imbalance;
- position size outside the user's profitable range;
- concentration in one ticker or one outlier;
- strongest current edge.

Later market-context detectors may include:

- entries too far above or below VWAP;
- performance above versus below VWAP;
- EMA9/EMA20 context;
- excessive MAE;
- excessive MFE giveback;
- early winner exits;
- stopped-trade recovery;
- profit-target or stop-rule opportunities.

The Coach Agent should normally present only the few most useful findings, not every technically true observation.

### 5.3 Simulation Bot

Purpose:

> Let users describe historical trading rules in plain language, run deterministic simulations and backtests, compare results, and save promising rules for prospective tracking.

The user should not need to know internal tool names or construct exact parameters manually.

Example requests:

- What if I stopped after three trades each day?
- What if I stopped after losing $500?
- What if I waited ten minutes after a loss?
- What if I sold half at 10% and moved the rest to break-even?
- Which fixed profit target would have made March profitable?
- Compare one full exit at 10% with three partial exits.
- What if I reduced size by 50% after a loss?
- What if I avoided entries more than 8% above VWAP?
- What if I exited when price lost EMA9?

The Simulation Bot:

1. converts the request into a validated, versioned rule plan;
2. clearly states assumptions before expensive or ambiguous runs;
3. calls the deterministic counterfactual simulation engine;
4. compares actual versus simulated results;
5. shows trades and days helped or harmed;
6. shows profitable trades removed and losing trades avoided;
7. discloses exclusions, missing market data, slippage assumptions, and ambiguity;
8. warns when a target sweep or rule search is in-sample optimization;
9. lets the user save one rule for prospective tracking.

#### Execution-only Simulation Bot capabilities

- stop after N losses;
- daily dollar or percentage drawdown limit;
- stop after giving back part of peak realized daily profit;
- maximum trades per day;
- skip fourth-and-later trades;
- wait after a loss;
- limit repeat attempts;
- time-of-day cutoff;
- fixed or normalized position size;
- reduce size after losses or drawdown;
- include/exclude weekdays, price ranges, directions, or trade sequences.

#### Candle-dependent Simulation Bot capabilities

- full or partial exits at percentage targets;
- multiple profit targets;
- fixed R-multiple exits when risk authority exists;
- break-even after target;
- fixed, trailing, and MFE-based stops;
- maximum holding time;
- time-stop while underwater;
- VWAP, EMA9, or EMA20 exits;
- MFE giveback exits;
- entry-distance filters from VWAP or session highs;
- bounded target sweeps and multi-rule comparisons.

#### Simulation integrity requirements

Every candle-dependent result must disclose and version:

- bar resolution;
- target/stop intrabar ordering;
- same-bar ambiguity policy;
- gap-through behavior;
- commissions and fees;
- slippage;
- liquidity assumptions;
- partial-fill policy;
- missing coverage;
- halt handling where authoritative data exists;
- excluded trades and quality state.

Historical optimization must never be described as a proven future edge. A saved rule should be tracked prospectively before the product calls it validated for the user.

---

## 6. Shared deterministic foundation

The three experiences should share one underlying architecture:

```text
verified trade database
  -> generic query engine
  -> evidence and similar-trade service
  -> counterfactual simulation engine
  -> Analytics Agent / Coach Agent / Simulation Bot
```

Named analytics and simulation tools remain governed presets or specialized semantic modules behind these experiences. Users should not need to know or request internal tool names.

---

## 7. Product positioning

Possible product promise:

> Ask questions when you want answers, let the Coach show you what deserves attention, and use the Simulation Bot to test what you should do differently.

Potential differentiation:

- natural-language questions over verified trade data;
- exact evidence links for important conclusions;
- a proactive Coach that ranks only the most useful findings;
- a Simulation Bot for historical rule testing and prospective tracking;
- deterministic calculations separated from AI explanation;
- journal-based simulations tied to the user's actual entries and trades;
- replay-safe market context for VWAP, EMA9, EMA20, MFE, MAE, and exit simulations.

---

## 8. Cost and margin assumptions

Current rough planning assumption for an early 20-user beta:

- safe AI budget: approximately `$100/month` total;
- equivalent AI allowance risk: approximately `$5/user/month` at 20 users;
- server, database, hosting, and market-data costs remain separate decisions;
- deterministic analytics and simulations should remain much cheaper than model-generated interpretation;
- cache repeated questions and results by dataset, filter, tool, and policy version;
- send compact verified results to the model instead of raw trade histories or candle arrays.

These numbers are not final pricing authority and must be replaced by measured usage.

---

## 9. Additional feature backlog ideas

### Near-term

- onboarding checklist and data-quality health screen;
- saved questions and saved analyses;
- pinned Coach findings;
- one-click evidence drill-down;
- configurable Coach review cadence;
- active-rule dashboard;
- saved Simulation Bot scenarios;
- side-by-side simulation comparisons;
- prospective rule tracking;
- user-visible AI and simulation allowance meter;
- admin cost and usage dashboard;
- private report export.

### Later

- user corrections that improve deterministic mapping policies;
- custom rule templates;
- multi-account comparisons;
- team or coach collaboration with user-approved evidence sharing;
- setup classification after deferred setup work is accepted;
- full market-universe backtesting as a separate advanced product surface;
- premium report templates and exports;
- API access for advanced users;
- anonymized benchmarks only after explicit privacy design.

---

## 10. Explicit simplification decision

The product does not currently need separate named agents for:

- journaling;
- import review;
- session review;
- weekly review;
- monthly review;
- tagging;
- rule monitoring;
- similar-trade review.

Those remain workflows, scheduled jobs, deterministic services, or views inside the Analytics Agent, Coach Agent, and Simulation Bot.

The preferred public lineup is:

1. **Analytics Agent** — answers questions;
2. **Coach Agent** — proactively finds priorities;
3. **Simulation Bot** — runs and explains historical simulations and backtests.

---

## 11. Open decisions

Still undecided:

- final plan names and prices;
- exact AI and simulation allowances;
- whether simple simulations are unlimited under fair use;
- which advanced simulations require higher tiers;
- annual discounts;
- overage purchases and credit rollover;
- account and broker limits;
- report retention and export limits;
- whether Coach reviews are on demand, scheduled, or both by plan;
- final hosting, database, storage, market-data, and payment-provider choices;
- exact model routing and cost controls;
- final public names for Analytics Agent, Coach Agent, and Simulation Bot.

Future implementation plans should treat this file as a product-idea backlog, not an accepted technical specification.