# Trade Candle Analyzer Experiment Plan

**Status:** Design fixture in progress; live Yahoo connection not started  
**Branch:** `codex/trade-candle-analyzer-experiment`  
**Progress:** [trade-candle-analyzer-experiment-progress.md](./trade-candle-analyzer-experiment-progress.md)

## Goal

Add an isolated Trader Intelligence experiment that overlays a completed trade
on Yahoo candle data and gives concise, evidence-gated feedback for:

1. profit giveback while the position was open;
2. exit timing after the final exit; and
3. entry timing before and immediately after the first entry.

The experiment is a post-trade review aid, not a source of P/L, a broker-fill
reconstruction, a trade recommendation, or a replacement for V3 execution
authority.

## Product surface

- Route: `/analytics/lab/trade-candle-analysis` under the existing V3 dashboard
  shell.
- Entry point: a clearly labelled Experiment card in Analytics Lab; no change to
  the normal Trade Tracker or Round Trips review flow in this first slice.
- Review layout: one full-width candlestick replay with entry, exit, peak, the
  primary 30-minute window, and the available 60-minute context; three compact
  evidence panels underneath.
- Data source labels: `Broker executions` for the governed trade timestamps and
  prices, `Yahoo candles (experimental)` for the market replay, and the candle
  interval/window used for every finding.

## Evidence contract

The experiment is deliberately conservative about when it speaks:

- It only analyzes a completed, one-symbol round trip with first-entry and
  final-exit timestamps, a direction, and usable prices.
- It asks Yahoo for a bounded candle range around the trade, including up to 60
  minutes after exit, normalizes only complete OHLC bars, and records the
  primary 30-minute coverage separately from later context.
- If a requested review window is incomplete, has missing/invalid candles, or
  cannot be aligned confidently to the trade timestamps, the related analyzer
  returns `No feedback` with a plain-language reason.
- No browser calculation may replace or alter V3 P/L, execution prices, or
  quantity. Candle-derived observations remain separate, read-only experimental
  context.
- No raw Yahoo response is persisted in the first experiment slice.

## Analyzer definitions

### Profit giveback

For a long trade, compare the highest observed high while the trade was open
with the final exit price. For a short trade, compare the lowest observed low
with the final exit price. Report the observed peak, the retained move, and the
amount left from the observed peak only when the held-position candle coverage
is complete enough.

### Exit timing

Request up to 60 minutes of candles after the final exit when Yahoo supports
that coverage. Treat the first complete 30 minutes as the primary review window
because it is close to the trader's decision. The 30-to-60-minute portion is
shown as secondary context, not allowed to override the primary finding.

For a long exit, compare exit price with the highest observed high after exit;
for a short exit, compare exit price with the lowest observed low. The feedback
uses concrete price-path language rather than a hard percentage threshold.

Example: a long exit at `$1.34` followed by an observed high above that price
in the complete primary window can say `Price continued higher after exit` and
show the observed high and time reached. If the longer context continues in the
same direction, it adds `Continuation persisted through 60 minutes`. Repeated
observations can later be summarized across trades as an exit-continuation
pattern. A missing or incomplete primary window produces `No feedback`, even if
some later candles exist.

### Entry timing

Use the same 30-minute primary and up-to-60-minute contextual windows around
the first entry. For a long entry, compare the fill with the pre-entry range,
the lowest observed low after entry, and the first favorable continuation;
invert the comparisons for a short. It can identify an observed chase,
pullback, or immediate continuation only when both primary windows are
complete. It must not imply that a different entry was certainly achievable.

## Technical design

- Use TradingView Lightweight Charts, the Apache-2.0 open-source library, as a
  client-only chart island. Do not use the proprietary Advanced Charts or
  Trading Platform libraries.
- Add a server-only Yahoo candle adapter and owner-protected route/action. It
  validates a supported symbol and fixed bounded range, uses `no-store`, and
  returns a small typed candle packet without exposing provider internals.
- Build one pure, typed analyzer module that accepts broker-trade facts plus a
  normalized candle packet and produces the three feedback states. This keeps
  chart rendering separate from evidence judgement.
- Start with a clearly labelled design fixture (`review=design`) for UI review.
  After fixture approval, connect governed read-only trades and live Yahoo
  candles.
- Do not add this experimental candle feed to configured V3 dashboard analytics
  or the existing level-analysis authority.

## Chart, indicator, and candle-detection references

- [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts)
  is the canonical chart API and integration reference. Follow its current v5
  conventions, client-only lifecycle, and required attribution when the chart
  is visible.
- [lightweight-charts-indicators](https://github.com/deepentropy/lightweight-charts-indicators/tree/main)
  is a research reference for reusable indicator calculations and chart
  presentation. Before adopting any calculation, verify its formula, licence,
  compatibility with the installed chart version, and behaviour on incomplete
  candle windows.
- Future indicator and candle-pattern detection work belongs in a separate,
  optional observation layer. It may annotate a completed replay with such
  things as trend, momentum, volatility, or observed candle structures, but it
  must never manufacture coverage, replace broker-execution facts, or present
  a trading signal or recommendation.
- The first evidence-engine slice remains price-path based. Indicators and
  candle detections are deliberately deferred until the three core analyzers
  have complete-window/no-feedback behaviour and the fixture design is
  approved.

## Delivery checkpoints

1. **Design review:** Build the isolated fixture-backed route and chart layout;
   request owner visual approval before live Yahoo integration.
2. **Evidence engine:** Add typed candle normalization, coverage checks, and the
   three deterministic analyzers using focused fixtures.
3. **Optional observation layer:** Evaluate selected indicator and
   candle-detection candidates against complete normalized candles. Add only
   explainable, non-predictive annotations that pass formula and licence
   review; preserve `No feedback` whenever their required lookback is absent.
4. **Read-only connection:** Connect selected governed completed round trips to
   the server-only Yahoo adapter; preserve no-feedback states.
5. **Acceptance:** Run targeted checks only at the completed slice boundary,
   then present the isolated route for review. Do not merge or deploy without
   explicit approval.

## Explicit non-goals

- Real-time quotes, orders, trading from the chart, drawing tools,
  predictions, alerts, automated coaching, or production data persistence.
- Indicators or candle-pattern annotations in the first evidence-engine slice;
  they require the optional observation-layer checkpoint above.
- Exact intrabar fill claims, because Yahoo OHLC candles only establish observed
  range movement at their available granularity.
- Feedback where the requisite candle window does not exist.
