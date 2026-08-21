# Links Beta Performance Language Engine Plan

**Status:** Architecture approved. The first completed-trade performance slice
is authorized; no later scope, provider fallback, database migration, or
visible administration change is authorized by this document alone.

**Progress record:** [Links Beta Performance Language Engine Progress](links-beta-performance-language-engine-progress.md)

## 1. The single beta purpose

**Links helps a trader understand their own trading performance and patterns
through plain-language questions answered from their exact Journal data.**

This is the first purpose of **Links AI Chat**. It is deliberately narrower
than the existing whole-product AI inventory. A beta claim must say what Links
can answer today, not what a future model or screen may eventually support.

### Scope lock

This plan covers only questions about the trader's own completed Journal trades
and their recorded performance: results/analytics, timing, comparisons, and
deterministic risk or behavior evidence. No additional purpose, product area,
external-information category, setting/action workflow, or future coverage
domain may appear in this plan's implementation order, readiness dashboard, or
beta score without a new owner-approved scope change.

The beta focuses on:

- completed-trade results, P/L, outcomes, counts, ranks, and trade detail;
- period, ticker, day, session, entry/exit-time, holding, and direction
  performance;
- comparisons between supported completed-trade populations; and
- rule, setup, tag, and behavior questions only when their supporting Journal
  facts and deterministic calculations are available.

Navigation, administration, account settings, manual entry, external
information, news, signals, and trading advice are not part of this beta's
stated purpose. Existing features remain preserved; they do not inflate
performance-language coverage.

## 2. Product and authority boundary

- The Journal remains the only authority for trading facts. Links never
  calculates from prompt text, uses arbitrary SQL, or combines currencies
  without the existing coverage contract.
- The server resolves the authenticated trader, selected Journal account,
  account reporting currency, timezone, and one fixed request reference time
  before interpretation. Those are trusted request context, not model choices.
- A resolved question becomes a typed, validated request plan before any
  **factual Journal calculation** occurs. The router may perform a bounded,
  selected-account metadata lookup solely to resolve an exact existing rule,
  setup, tag, or instrument name; it cannot calculate or disclose performance
  facts at that stage.
- A handler may execute only the canonical read contract registered for that
  request-plan family. No model output can select an unregistered operation.
- Exact deterministic data produces the factual answer. A response template is
  sufficient for a simple answer; an optional model may make an already-grounded
  fact packet more conversational but may not add, change, rank, or explain a
  fact beyond its evidence.
- Links keeps its one approved personality: warm, capable, knowledgeable and
  supportive without pressure. This plan changes what it can understand, not
  who Links is.

## 3. Controlling acceptance inventory

The existing 2,985-question bank remains preserved and becomes the controlling
language-regression inventory. It is not a collection of 2,985 one-off routing
rules.

Each case will declare an expected typed plan, including every applicable
component below. The beta readiness denominator is a fixed, versioned subset
of that complete inventory containing only the first-purpose families. The
remaining cases stay visible as deferred or future-purpose regressions; they
may not be silently removed to improve a percentage, included as beta coverage,
or added to a beta readiness category.

The initial beta reporting families are:

| Family | What it proves |
| --- | --- |
| Trader analytics | Results, P/L, counts, outcomes, ranks, date scope and timing summaries |
| Risk management | Existing risk and drawdown metrics where the Journal contract supplies them |
| Trade comparison | Supported population, ticker, period, direction, and result comparisons |
| Behavior analysis | Deterministic rule, setup, tag, and recorded behavior evidence only |

Requests outside the scope lock remain in the master inventory with explicit
expected `UNSUPPORTED` results. They are absent from the beta capability score
and readiness-category display.

### 3.1 Existing work to reuse, convert, and not overclaim

The earlier language work is valuable source material. The new engine must
reuse it deliberately rather than rebuild vocabulary from scratch:

| Existing asset | Reuse in the performance language engine | What it does not prove today |
| --- | --- | --- |
| 417 canonical language records and category documents | Seed vocabulary, aliases, trader slang, date, outcome, rank, comparison, ambiguity, and policy concepts | That a phrase reaches the correct handler at runtime |
| Generated language registry and capability mapping | Source of canonical names and capability availability when constructing the new typed registry | Executable routing or factual-answer coverage |
| 2,985-question bank | Fixed regression corpus; each case gains expected plan components, final state, collision/negative status, and beta/deferred classification | A pass until it runs through the new evaluator |
| Existing date-scope parser and zero-provider routes | Candidate reusable normalization, date, scope, exact-response, evidence, and idempotency components | A sufficient general grammar; literal phrase arrays must become compositional concepts |
| 36 factual-tool contracts and current analytics/read services | The initial handler registry; the engine reuses canonical Journal calculations instead of creating a second analytics engine | That every tool is in the beta purpose or can handle every language combination |
| Saved answers, receipts, and the live failure sample | Baseline regression evidence and later record/replay material | A successful end-to-end beta run |

The migration is additive: every existing record keeps its stable identifier
and provenance, then receives an explicit executable mapping or an explicit
deferred/unsupported classification. No question is discarded merely because
it is inconvenient, and no `mapped_live` metadata is treated as a runtime pass.

## 4. Request-plan architecture

### 4.1 Resolution stages

The router has four final semantic outcomes:

- `RESOLVED`: the request is complete, validated, and has one handler.
- `AMBIGUOUS`: more than one materially different supported plan remains and
  no defined default applies. Links asks one focused question.
- `UNSUPPORTED`: the trader's request is understood but no current beta handler
  can answer it truthfully.
- `UNRESOLVED`: deterministic interpretation cannot confidently produce a plan.
  This is an internal intermediate state, not a trader-facing answer.

An `UNRESOLVED` question may be sent to Luna for a structured plan proposal.
After application validation its final outcome is still `RESOLVED`,
`AMBIGUOUS`, or `UNSUPPORTED`; the recorded `resolutionSource` is
`llm_assisted` rather than presenting LLM fallback as a permanent semantic
state.

### 4.2 Canonical typed plan

Every resolved plan contains only recognized values:

```text
plan version
resolution source: deterministic | llm_assisted | contextual_patch
account scope: server-resolved selected Journal account for beta
reporting currency: selected account's existing reporting currency
timezone: server-resolved selected-account trading timezone
reference time: immutable server timestamp used to resolve relative time
entity: completed_trade | trading_day | instrument | time_bucket | rule | setup | tag | supported comparison population
metric: registered Journal metric
operation: summary | rank | list | detail | compare
rank: direction and count when applicable
filters: outcome, direction, ticker, session, entry/exit time, holding, setup/tag/rule and other registered filters
time scope: all history | exact day/week/month/year | rolling period | explicit range
comparison dimensions: only registered, compatible dimensions
conversation patch: a bounded change to a prior validated plan, when used
handler id: one registered deterministic or registered composite handler
```

The validator rejects incompatible combinations before a handler runs. For
example, a trade row can be ranked by its factual P/L, while an instrument
aggregate has its own grouping and metric contract. A request cannot silently
mix the two.

The first beta is deliberately selected-account scoped. A question such as
`How much did I make today?` therefore means the trader's current selected
account, in its normal reporting currency, without making account selection or
foreign-exchange management a user-facing beta feature. Cross-account totals
are unavailable until a later registered contract can prove a compatible
currency/coverage aggregation. A simple account footer or answer context may
say that figures use the selected account's reporting currency; it does not
need to distract from the trading answer.

Relative time is never inferred from a browser locale or a moving test clock.
`today`, `yesterday`, `this week`, `last month`, `morning`, `after 11`, and
similar language resolve against the plan's stored timezone and reference time.
The exact same fixed reference context is included in local evaluation fixtures
and recorded provider replay so a case has the same meaning months later.

### 4.3 Compositional language pipeline

```text
current question + bounded prior validated plan
    -> server-resolved account/currency/timezone/reference context
    -> normalization and typo tolerance
    -> vocabulary/alias recognition
    -> bounded selected-account entity/name resolution when needed
    -> entity, metric, operation, filter, rank/count and temporal extraction
    -> defaults, collision checks and ambiguity rules
    -> validated typed request plan
    -> registered Journal handler
    -> exact fact packet
    -> Links response
```

The vocabulary is a machine-readable registry, not prompt prose. It maps such
language as `profit`, `gain`, `green`, `winner`, `loss`, `red`, `loser`,
`biggest`, `worst`, `runner`, `home run`, date forms, ordinary typos, and
trader shorthand to canonical concepts. Compound phrases are resolved from
their components rather than being stored as separate commands.

Words that are descriptive rather than deterministic facts—such as `solid`,
`outsized`, `heavy`, `lucky`, or `undisciplined`—do not silently create a
calculation or causal claim. Magnitude labels require a separately approved,
account-relative band policy; quality labels require existing factual evidence
such as a recorded rule result or trader annotation.

### 4.4 Defaults, collisions and ambiguity

Defined defaults make Links helpful without model guesswork:

- `How did I do today?` means a standard completed-trade period summary.
- `How did I do on NVDA?` means a standard NVDA performance summary.
- `How were my morning trades?` means a standard time-filtered performance
  summary.

Collision tests have higher precedence than generic word matching. For example:

| Trader wording | Required interpretation |
| --- | --- |
| `biggest loser` | lowest-P/L completed trade |
| `ticker I lost the most on` | lowest-P/L instrument aggregate |
| `worst day` | lowest-P/L trading-day aggregate |
| `largest drawdown` | registered drawdown metric, not a losing trade |

Entity resolution has explicit lexical precedence before a generic alias can
claim a word: an explicit `ticker`/`symbol` cue or quoted name, an exact
selected-account rule/setup/tag/instrument name in a compatible position, a
selected-account ticker-like token, a multi-word domain phrase, then a generic
single-word alias. Thus a held symbol named `GAIN` in `How did I do on GAIN?`
is an instrument, while `gain/loss` remains a metric phrase. If the evidence
does not choose one interpretation, the request is `AMBIGUOUS`; it never falls
through to the most convenient metric. The fixed collision suite includes
ticker, setup, tag, rule, and ordinary-language overlaps.

References with no reliable subject—such as `what was my biggest one?`—stay
ambiguous. Links does not make a heroic guess merely because a model can invent
one.

### 4.5 Bounded conversational context

The router retains the prior **validated request plan**, not an unlimited
transcript. A follow-up can only make a typed patch such as:

- replace time scope (`What about last month?`);
- replace/add ticker;
- add/remove outcome, session, direction, or time filters;
- change rank/count; or
- compare with one separately resolved compatible plan.

If a reference cannot be resolved from that bounded plan, Links clarifies. The
model never receives unrestricted history just to interpret a pronoun.

## 5. Handler and response contracts

The handler registry maps every allowed plan family to one canonical Journal
read or one explicitly registered **composite handler**. A composite handler
is an atomic, versioned contract for a standard useful summary (for example,
P/L, trade count, win rate, average win/loss, and coverage for one ticker). It
has an allowlisted set of canonical reads and output facts; it is not model-led
tool selection. Every handler specifies accepted components, coverage rules,
output facts, and unavailable states. It returns an immutable fact packet
containing only the values and evidence Links may state.

Numbers, currency labels, tickers, dates, time ranges, rankings, population
counts, coverage states, and unavailable reasons are rendered by application
code from the fact packet. A model-enhanced response is optional and receives
only:

```text
validated request plan + returned fact packet + one approved voice contract
```

It does not receive a large general tool inventory, arbitrary data access, or
authority to change the plan. It may add only an approved non-factual
connective sentence around the deterministic factual rendering. The response
validator ensures every exact fact maps back to the packet.

## 6. Evaluation, replay and cost control

### 6.1 Local no-provider evaluation

Every inventory case runs locally through the parser and validator. Its
expected plan is a static, versioned fixture reviewed independently of the
router/vocabulary implementation under test; evaluation never regenerates an
expected answer from the same code it is judging. Each fixture carries the
fixed request context required for its case, including selected-account scope,
reporting currency context when relevant, timezone, and reference time. The
report compares expected and actual values for:

```text
account scope | currency scope | timezone | reference time | entity | metric | operation | rank | count | filters | date scope | comparison | context patch | handler | final state
```

A case can therefore fail as `time filter wrong` or `handler incompatible`,
not merely `question failed`. Local runs make no provider request and do not
need a live account answer.

The inventory also contains deliberately novel compositions, collision cases,
negative cases, typo cases, and multi-turn plan-patch cases. Passing only the
literal sentences in the existing bank is insufficient.

### 6.2 Layered proof

1. Run the complete beta and master inventories through the local router.
2. Run handler-contract checks using canonical read services and expected fact
   shapes.
3. Run Luna only against the unresolved-language and fallback boundary set.
4. Record provider input-contract version, proposed plan, validated plan,
   result state, receipt, and response contract. Replay a compatible recording
   for UI/evidence work instead of paying again.
5. Run a small owner-authorized real Links end-to-end set using normal saved
   chat persistence and real Journal facts.

A recorded result is invalidated only when the model, system instruction,
structured-plan schema, vocabulary registry, handler contract, context format,
or response contract changes.

## 7. Owner-visible Links readiness dashboard

Owner release control requires an authenticated, privacy-safe **Links Beta
Readiness** area inside the existing Journal Administration namespace. It is a
future UI slice and requires visual owner approval before implementation.

It will show:

- the fixed beta denominator, passed cases, failed cases, deferred cases and
  the exact inventory version;
- a clear `Not ready` or `Ready for owner beta decision` state derived from
  release gates, never a hand-entered percentage;
- category rows only for Trader Analytics, Risk Management, Trade Comparison,
  and Behavior Analysis;
- resolved coverage split into deterministic, LLM-assisted and contextual
  resolution sources;
- component coverage and failure counts for account/currency scope, timezone/
  reference time, entity, metric, operation, rank/count, filters, date scope,
  comparison, context, handler, factual response, and end-to-end persistence;
- a filterable case table showing the controlled test question, expected plan,
  actual plan, each component's pass/fail state, failure reason, handler,
  resolution source, latest run, and linked safe receipt metadata;
- separate local-routing, handler-contract, recorded-provider, and live
  end-to-end run status so a green cheap test cannot masquerade as live Links
  proof; and
- a recent real-run summary with only owner-safe status, cost, model, and
  failure data. It never exposes other traders' chat content, Journal notes,
  raw statements, account identifiers, prompts, or provider payloads.

The eventual visual review will cover this dashboard before it becomes the
release-control surface. Its first screen must answer, without asking Codex:

```text
What does Links understand in the beta?
What fails, and at which component?
What was actually exercised through real Links?
Is the fixed beta gate ready for my decision?
```

## 8. Release gates

Links AI Chat is not beta-ready merely because a percentage is high. The owner
dashboard may show `Ready for owner beta decision` only when:

- every included beta case has the expected final state and matching typed-plan
  components;
- every resolved case has a compatible registered handler;
- collision, negative, typo, novel-composition and follow-up suites pass;
- handler and response evidence checks pass;
- every permitted LLM-assisted plan passes the same validator;
- the selected real Links end-to-end suite has no generic terminal answer,
  wrong scope, incorrect rank/filter, ungrounded fact, or unexplained failure;
- actual provider costs and fallback rate are visible; and
- the owner reviews the dashboard and decides whether the stated beta scope is
  honest and useful.

## 9. Implementation order after owner approval

### First implementation target

**Completed-trade performance language.**

The first working slice will make Links deterministically understand and route
questions about completed-trade P/L, gains/losses, win/loss outcome, trade
counts, best/worst and top/bottom trades, and calendar date scope. It will
produce component-level diagnostics and use the existing canonical completed
trade handlers. It will not add market data, navigation actions, generic model
tool choice, or new analytical claims.

This is the foundation for the beta purpose because every later performance
question reuses its outcome, metric, rank/count, date, and evidence contracts.

### Subsequent slices

1. Trading-day, ticker, session, entry/exit-time, holding, and direction
   aggregates plus collision proof.
2. Supported performance comparisons and bounded contextual plan patches.
3. Deterministic rule/setup/tag/behavior evidence and exact unavailable states.
4. Luna structured-plan fallback and replay proof for language that is not
   deterministically resolved.
5. The owner-visible Links Beta Readiness dashboard, followed by its visual
   approval and then small live Links batches.

No slice may claim beta coverage until it appears in the dashboard with its
component-level evidence.
