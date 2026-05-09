# UPDATE – TRADE ANALYSIS ENGINE CONTRACT ALIGNMENT

## IMPORTANT CORRECTION

The trade-analysis-engine must strictly follow the system architecture contracts.

---

## UPDATED PIPELINE RULES

### 1. Layer 1 Output

Call:

* create-raw-trade-timeline
* build-trade-timeline
* build-trade-state-series

Final result must be:

```ts
RawTradeTimelineBuildResult
```

This is the ONLY Layer 1 output passed forward.

---

### 2. PatternInput Bridge (MANDATORY)

Call:

```ts
patternInput = buildPatternInput(rawTradeTimeline)
```

Rules:

* Pattern detection MUST use PatternInput
* No direct access to raw timeline inside pattern detection
* No recomputing signals inside Layer 2

---

### 3. Pattern Detection

Call:

```ts
detectedPatterns = detectPatterns(patternInput)
```

---

### 4. Pattern Normalization

Call:

```ts
normalizedPatterns = normalizeDetectedPatterns(detectedPatterns)
```

---

## UPDATED RETURN SHAPE

The engine must return:

```ts
{
  rawTradeTimeline: RawTradeTimelineBuildResult,
  patternInput,
  detectedPatterns,
  normalizedPatterns
}
```

---

## STRICT RULES

DO NOT return:

* internal timeline fragments
* partial state objects
* derived signal fragments outside rawTradeTimeline

DO NOT allow:

* Layer 2 to access rawTradeTimeline directly
* Layer 3 to access PatternInput or raw timeline

---

## PURPOSE

This ensures:

* strict layer separation
* clean architecture enforcement
* future AI/tool compatibility
* prevention of layer leakage

---

This correction overrides any previous instruction that exposed internal Layer 1 structures.

---

## Current Downstream Boundary Reminder

As of `2026-04-14`, the engine contract above is still the correct Layer 1-3
boundary.

Important:

- `src/lib/trade-analysis-engine.ts` still stops at:
  - `rawTradeTimeline`
  - `patternInput`
  - `detectedPatterns`
  - `normalizedPatterns`
- scoring, behavior analysis, coaching, and trader-level multi-trade
  aggregation now exist downstream, but they are not part of the
  trade-analysis-engine return contract yet

Current downstream consumers built after this engine contract:

- `src/lib/pattern-scoring/`
- `src/lib/behavior-analysis/`
- `src/lib/coaching/`
- `src/lib/trader-behavior/`

---

## App-Facing Entry Point

As of `2026-05-02`, app-facing callers should prefer:

```ts
runTradeAnalysis(...)
```

from:

```text
src/lib/trade-analysis/run-trade-analysis.ts
```

That facade defaults support/resistance to the shared `levels-system` path:

```text
runTradeAnalysis(...)
  -> analyzeTradeWithLevelsSystem(...)
  -> levels-system-phase1/support-resistance-engine
```

The older synchronous `analyzeTrade(...)` path still exists for compatibility
and migration tests, but new app code should not call it directly when
support/resistance context matters.

Runtime provider/session configuration should be passed through:

```text
src/lib/support-resistance/levels-system-runtime-options.ts
```

This repo should pass symbol/session/as-of/provider preferences to
`levels-system`. It should not add new candle-fetching or chart-structure
logic locally.

The shared path may include:

```text
rawTradeTimeline.experimentalMarketStructure
```

This is observational only. It exists for test/debug comparison while the shared
market-structure read is calibrated. It is intentionally not mapped into
PatternInput yet, so it must not affect Layer 2 pattern detection, Layer 3
normalization, scoring, coaching, grading, or final user-facing conclusions.

## Shared Trade-Window Candle Path

As of `2026-05-02`, this app can also start from execution metadata instead of
caller-supplied candles:

```ts
runTradeAnalysisFromLevelsSystemCandles(...)
```

from:

```text
src/lib/trade-analysis/run-trade-analysis.ts
```

That path calls:

```text
levels-system-phase1/support-resistance-engine
  -> buildTradeAnalysisCandleContext(...)
```

and receives:

- pre-trade candles
- during-trade candles
- post-trade candles
- support/resistance context
- VWAP / EMA context
- experimental market structure
- fetch diagnostics

This is the preferred future shape when the app only has a symbol, session date,
as-of timestamp, and executions. Provider choice stays in `levels-system`; this
app only maps the returned candle package into its existing raw timeline shape.

### User Trade Request Boundary

User-entered or UI/API trade requests should pass through:

```text
src/lib/trade-analysis/request/trade-analysis-request-contract.ts
```

That boundary validates and normalizes:

- symbol
- long / short direction
- session date and session bucket
- execution timestamps, sides, shares, prices, ordering, and directional
  sequence
- provider choice and as-of timestamp
- trade-window options

It returns a `ValidatedTradeAnalysisRequest` that can be mapped into
`runTradeAnalysisFromLevelsSystemCandles(...)`. It does not fetch candles, build
support/resistance, compute indicators, or read market structure. Those remain
owned by `levels-system`.

Analysis output intended for UI/API/debug consumers should use:

```text
src/lib/trade-analysis/summary/build-trade-analysis-summary.ts
```

That summary contract exposes stable counts and debug fields without requiring
callers to depend on deep Layer 1, Layer 2, or Layer 3 internals.

Provider and shared-engine failures are classified in:

```text
src/lib/trade-analysis/failures/classify-trade-analysis-failure.ts
```

Current categories include invalid requests, unsupported providers, auth
failures, rate limits, invalid symbols, missing candles, insufficient
trade-window candles, future-candle guard failures, shared-engine failures, and
unknown failures.

### Batch / API Boundary

Batch request processing lives in:

```text
src/lib/trade-analysis/batch/run-trade-analysis-batch.ts
```

That runner accepts unknown user/API request objects, validates each request
through the public request contract, optionally runs the shared candle path, and
returns:

```text
batch_trade_analysis_v1
```

The batch contract includes per-request validation issues, classified failures,
stable summaries, support/resistance counts, market-structure observation
counts, and pattern-count aggregates. It is the shared loop used by the CLI
debug dashboard and the app API route.

The debug API route is:

```text
POST /api/trade-analysis/debug
GET  /api/trade-analysis/debug
```

`POST` accepts one request, `{ request }`, `{ trade }`, `{ requests }`,
`{ trades }`, or an array. Set `validateOnly: true` on the request body to
shape-check input without provider/shared-engine candle work. The route returns
the same `batch_trade_analysis_v1` contract.

The internal debug page is:

```text
/debug/trade-analysis
```

It is a local operator surface for the same request and API contract.

### Local Debug Dashboard

Use this command when you want a local single-request debug report:

```text
npm run debug:trade-analysis
npm run debug:trade-analysis -- --validate-only
npm run debug:trade-analysis -- path/to/request.json --validate-only
npm run debug:trade-analysis -- path/to/request.json --out-dir artifacts/trade-analysis-debug
```

With no path, the command uses the deterministic stub fixture. With a path, the
JSON may be one request, `{ request }`, `{ trade }`, `{ requests }`,
`{ trades }`, or an array. The output includes validation issues, classified
failures, stable analysis summary, support/resistance counts,
market-structure-debug status, pattern counts, and engine messages.

Stable request examples live in:

```text
src/docs/trade-analysis-request-fixtures/
```

Compare two saved debug dashboard runs with:

```text
npm run compare:trade-debug -- left-dashboard.json right-dashboard.json
npm run compare:trade-debug -- left-dashboard.json right-dashboard.json --json
```

The comparison contract highlights total deltas and item-level changes in
status, failure code, support/resistance counts, market structure, pattern
counts, and top anchor pattern.

### Experimental Market-Structure Audit

Use this command to calibrate the shared market-structure read across saved
trades:

```text
npm run audit:market-structure
npm run audit:market-structure -- path/to/saved-trade.json
npm run audit:market-structure -- path/to/saved-trades.json --validate-only
npm run audit:market-structure -- path/to/saved-trades.json --json
npm run audit:market-structure -- path/to/saved-trades.json --out-dir artifacts/market-structure-calibration
npm run calibrate:market-structure -- path/to/saved-trades.json
```

The script accepts:

- one full `TradeAnalysisEngineArgs` object with candles
- one execution-only trade request with `symbol`, `tradeDirection`,
  `executions`, and `sessionContext`
- an array of either shape
- `{ trade: ... }`
- `{ trades: [...] }`

If candles are omitted, the audit uses `buildTradeAnalysisCandleContext(...)` to
fetch the trade-window candles from `levels-system` first.

Use
`src/docs/market-structure-calibration/sample-execution-only-trades.json` as the
shape template for saved trades that no longer carry candle arrays. Replace its
placeholder symbol, date, and executions before running a real provider-backed
calibration batch. Use `--validate-only` first when you only want to confirm the
JSON shape and audit mode without calling `levels-system` for candles.

Use `--out-dir` or `npm run calibrate:market-structure` when running real saved
trades. That writes:

```text
market-structure-audit.json
market-structure-calibration-evaluation.json
market-structure-promotion-readiness.json
market-structure-calibration-report.md
```

under `/artifacts`, which is gitignored.

The audit is intentionally debug-only. It summarizes shared
`experimentalMarketStructure`, level counts, detected and normalized pattern IDs,
engine messages, PASS / REVIEW / BLOCKER calibration gates, a machine-readable
recommendation action, and whether the experimental field leaked into
PatternInput. It keeps true provider / engine warning and error messages
separate from harmless fetch info so real calibration runs are easier to review
before any scoring or user-facing behavior changes are made.

Promotion readiness is evaluated in:

```text
src/lib/support-resistance/market-structure-audit/evaluate-market-structure-promotion-readiness.ts
```

That gate keeps `experimentalMarketStructure` limited to debug output, batch
calibration, and possible future limited internal review. It explicitly
prohibits use in pattern detection, normalization, grading, scoring, coaching,
and final user-facing conclusions unless a future deliberate promotion changes
the contract.
