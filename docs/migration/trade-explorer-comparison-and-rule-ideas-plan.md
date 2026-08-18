# Trade Explorer Comparison And Rule Ideas Plan

## Status

Owner approved on 2026-08-18. The two-to-four-group Compare Trades page and
saved-study workflow are implemented and visually approved. Deterministic Rule
ideas are the active next checkpoint; bounded AI Chat reads follow only after
their saved factual evidence exists.

**Progress record:** [Trade Explorer Comparison And Rule Ideas Progress](trade-explorer-comparison-and-rule-ideas-progress.md)

## Outcome

TraderLink will let a trader compare named groups of their own confirmed
completed trades and review deterministic Rule ideas supported by their own
selected-account history. The Journal Analytics engine and Rules engine remain
the calculators. AI Chat may read accepted outputs, but it never calculates a
financial result, creates recommendation evidence, or changes a rule without
the existing explicit confirmation.

## Trade Explorer comparison contract

- Comparison lives on the separate `/analytics/trade-explorer/compare` route.
  The existing `/analytics/trade-explorer` remains the default Explore and
  completed-trade Review workspace. Compare Trades appears directly below
  Trade Explorer in the left Trades navigation; neither page carries a
  cross-page button.
- A study contains two to four named groups. Each group owns a complete,
  independently validated Trade Explorer query.
- Every group is evaluated server-side through the canonical Journal Analytics
  service. The browser never calculates P/L, rates, ratios, averages, coverage,
  or population membership.
- The first checkpoint supports two unsaved groups and the existing factual
  filters: closing dates, ticker, direction, Result, Day/multi-day, entry
  weekday/time, holding time, entered quantity, maximum position and entry
  value. Saved tags and saved rule results follow through their authoritative
  annotation records; they are not inferred from text.
- All groups use one money basis and reporting-currency contract. Incompatible
  currency or timezone partitions stay separate. Missing Net P/L remains
  unavailable and may offer factual Gross P/L; it is never relabelled.
- The scorecard reports completed trades, selected P/L, win rate, average P/L,
  profit factor, expectancy, average return and average holding time where the
  canonical registry supports them. A signed difference is shown against the
  first group only when exact value kinds, units, money basis, currency,
  timezone and formula versions are compatible.
- No group is labelled best or recommended. Each result retains exact coverage,
  limitations, fact revision and the bounded supporting completed-trade rows.
- Comparison evidence links back to the existing Trade Explorer Review. The
  comparison page does not duplicate or replace note, tag or rule editing.
- Saved studies are private to the selected Journal account and store versioned
  validated group definitions, not arbitrary browser JSON.
- Counterfactual P/L, predictions, causation, market-data claims and strategy
  advice are outside this feature.

## Deterministic Rule ideas contract

The complete candidate target is: cooldown after a loss; cooldown before
re-entering the same ticker; maximum ticker attempts per day; maximum completed
trades per day; stop after a selected total number of losing trades; stop after
consecutive losses; stop after a daily realized loss; stop a ticker after
losing attempts; stop after realized profit giveback; stop after a daily
realized gain; no new trades after a selected time; and entry-price-range
evidence, which remains exploration-only until its range contract is approved.

- Shared eligibility requires at least three active trading days, 20 eligible
  completed Day trades and 50 accepted executions.
- Candidate-specific trigger and affected-trade gates remain those in
  [Preset Rule Recommendations Plan](preset-rule-recommendations-plan.md).
- An issued idea must underperform its comparison population, remain supported
  after removing the single worst affected trade, occur across at least three
  days and keep every ticker at or below half of affected evidence.
- Missing fees, timestamps, chronology or unresolved dependent facts make only
  the affected calculation unavailable. Nothing is guessed or silently
  excluded.
- At most one new idea is issued in 28 days. `Not for me` suppresses the same
  preset for at least 90 days. `Save for later` keeps the existing record
  without repeated alerts.
- Each card shows the exact preset and setting, observation, trigger days,
  affected trades, affected and comparison results, concentration/outlier
  checks, coverage and the historical-not-predictive limitation.
- `Add rule` enters the existing exact preview and confirmation flow. Evidence,
  Chat or an AI Review can never activate a rule autonomously.

## Delivery checkpoints

1. Prove two unsaved comparison groups through a deterministic server contract
   and an operational reconciliation verifier.
2. Add the first Compare UI on `/analytics/trade-explorer/compare` and obtain
   owner visual/product approval without changing the existing Review workspace.
3. Expand to four groups and private saved-study lifecycle.
4. Implement deterministic candidate snapshots, issuance and disposition.
5. Add the Rules `Rule ideas` UI and obtain owner visual/product approval.
6. Expose saved studies and saved recommendation evidence through bounded AI
   Chat reads; update Help and the capability matrix.
7. Complete targeted static, operational, browser and account-isolation checks,
   then create narrow local commits without staging concurrent work.

## Safety and ownership

All reads derive the selected account from the server scope. Saved definitions,
evidence and dispositions include workspace/account ownership and stale-state
protection. Raw statement rows, broker identifiers, credentials, private
identity, model judgment and direct Journal writes never enter either feature.
An AI Chat analytical capability does not require a visible dashboard feature.
Future server-side tables, statistics or comparison tools remain AI-only unless
the owner separately approves them as useful trader-facing product surfaces.
