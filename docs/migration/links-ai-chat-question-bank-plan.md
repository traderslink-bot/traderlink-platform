# Links AI Chat Question Bank and Live-Batch Recovery Plan

## Purpose

Rebuild Links AI Chat around demonstrated answers to real trader questions.
This is not a tool-inventory exercise. A question counts only when the normal
Links AI Chat request path returns a useful, factually supported answer or a
specific, useful unavailable result.

The trader's observed failures are the first evidence in the bank, not the
whole bank. The complete bank must be substantially broader than one person's
ad-hoc test list and must be continuously exercised through the configured
low-cost Luna route while the feature remains outside the first live release.

## Non-negotiable outcome

For every evaluated question, Links AI Chat must do exactly one of these:

1. Answer the trader's question directly from the scoped canonical Journal
   data, with the requested date/rank/filter/count applied.
2. Complete the requested supported action as one useful operation or present
   one exact actionable confirmation.
3. Explain the precise data limitation in trader language when required facts
   genuinely do not exist.

The generic terminal message **Links couldn't finish that answer** is a test
failure for every known question family. It is not an acceptable unavailable
or unsupported result.

## Question-bank design

The bank is a checked-in, versioned TypeScript manifest. Each case records:

- stable ID and trading-intelligence family;
- ordinary trader wording, including natural variations, shorthand and typos;
- follow-up context when required;
- required date, account, ranking, result-filter, ticker or trade scope;
- expected deterministic data contract and required factual fields;
- whether the normal request must invoke Luna or may validly take an exact
  deterministic route;
- expected answer class: direct fact, ranked list, supported action, or exact
  unavailable result;
- actual saved Links message, generation state, selected tool evidence, model,
  token count, cost and pass/fail reason after a live batch.

Expected values are computed by the canonical Journal/read service. An LLM
cannot write or approve expected answers.

### Required bank coverage

The first complete bank contains at least 800 concrete cases, generated from
reviewed templates and then kept as explicit records. It covers:

| Family | Minimum cases | Examples |
| --- | ---: | --- |
| P/L, counts, outcomes, winners, losers and rankings | 170 | best trade, worst three losses, win rate, profit by ticker |
| Day, week, month, year and rolling-date interpretation | 140 | March 2026, April 15 2026, this year, last 30 days |
| Timing, weekday, session, entry/exit and holding analysis | 100 | strongest session, weakest weekday, most profitable entry time |
| Rules, tags, setups, notes and loss associations | 130 | most-broken rule, rule-break loss totals, setup/tag performance |
| Trade detail, trade lists, filters, sorting and follow-ups | 100 | show losses, then worst three, compare the next one |
| Daily/Swing Tracker, open positions and executions | 60 | open positions, swing notes, current trading-day details |
| Trade Analyzer, Candle Review and saved-review coverage | 45 | worst green-to-red, analyzer availability, saved review follow-up |
| Natural-language variation, shorthand, spelling and multi-turn context | 55 | suugest, exploer, what about March, those three |

The bank adds explicit unavailable/empty-data assertions for every relevant
family. These must state the missing data and remain useful; they may not
degrade into a generic failure.

## Runtime recovery work

### 1. Repair the actual agent path

- Correct the claim-catalog/result-path mismatch that currently rejects
  tool-backed Luna answers as ungrounded.
- Preserve exact answer validation, but validate against the actual selected
  deterministic evidence rather than rejecting normal answers for an internal
  reference mismatch.
- Make terminal failure copy distinguish provider trouble, a usage limit and
  a meaningful unavailable result.

### 2. Make language records executable

- Add an intent binding for every live language record: target data/action
  family, parameter extraction contract and answer class.
- Parse natural dates, periods, ranks, counts, outcome filters, tickers,
  sessions and direct follow-ups centrally.
- A record without an executable binding is not described as live.

### 3. Add missing trader-analysis queries

The first additions are not app-navigation conveniences. They are the queries
needed for ordinary performance questions:

- ranked completed-trade lists with date/result/filter/order control;
- rule-break frequency and associated P/L/loss aggregates with supporting
  trade evidence;
- date-scoped ticker, time, weekday and session rankings;
- complete period summaries that combine exact results with saved Journal
  context when available.

### 4. Keep actions useful but secondary

- A normal request such as marking all notifications read must be a single
  useful bulk operation, not an instruction to find one record manually.
- It remains behind the trading-intelligence recovery work and cannot consume
  a factual-analysis batch.

## Batch protocol

1. Select one coherent family of at most 30 cases.
2. Repair or implement the underlying query and answer contract before paid
   testing.
3. Run those cases through normal Links AI Chat with the configured Luna model
   and saved Chat persistence. Exact deterministic fast-path responses are
   still recorded as normal Links outcomes, never treated as a source-only
   shortcut.
4. Compare each saved answer to canonical expected evidence. Record state,
   tool trace identity, cost and any failure.
5. A batch with one generic failure, wrong scope, wrong rank, unsupported
   claim or useless unavailable answer does not advance. Repair it and rerun
   the batch.
6. Commit only a coherent repaired family plus its expanded bank and verifier.

The routine live-batch target is 30 questions. At the currently measured Luna
costs, each batch is expected to remain well inside the enabled local daily
spend cap; the exact receipt total, not an estimate, determines whether work
continues that day.

## Acceptance gates

- No capability language is published from source inventory alone.
- Every `mapped_live` language record eventually has executable coverage or is
  removed from the live classification.
- The complete question bank runs through the real saved Links AI Chat flow in
  bounded Luna batches, with account scope and exact expected values checked.
- The owner receives the batch report: pass count, failures, exact family,
  actual model receipts and remaining bank size.
- The owner then conducts broad unscripted testing. Any surfaced failure joins
  the question bank before another completion claim.

## Release boundary

Links AI Chat and AI Reviews remain excluded from the first live launch until
this recovery passes. Work on this plan changes no production enablement,
deployment, entitlement or launch configuration.
