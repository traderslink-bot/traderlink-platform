# Candle Warehouse Basis Policy Design

Date: 2026-05-06

## Purpose

Trader Intelligence and sibling apps reuse historical candles from the shared
`levels-system` warehouse. Those candles must not be treated as generic prices.
They are prices on a provider-specific and time-specific basis.

The goal is to prevent reverse splits, split adjustments, symbol changes, and
provider refetch behavior from silently changing historical trade analysis.

## Real Cases Driving The Policy

- `VEEE`, `ISPC`, `DGNX`: broker execution prices and warehouse candle prices
  look disconnected by likely whole-number adjustment multiples. These remain
  execution/P&L-only unless raw IBKR candle basis is proven aligned.
- `MAXN`: historical imported symbol resolves through a validated provider-side
  alias to `MAXNQ` on `PINK`. This is allowed only because the alias was
  explicitly validated and diagnosed.
- `AVEX`, `ELMT`: IBKR returned too little usable daily/4h history under the
  historical no-future-leakage cutoff. These are insufficient market-context
  cases, not broad alias-discovery cases.

## Policy

### 1. Candle Basis Is Part Of The Data Contract

Each warehouse candle batch should eventually carry enough metadata to answer:

- provider
- requested symbol
- resolved symbol and provider contract id, when different
- exchange / primary exchange
- fetch timestamp
- what-to-show setting
- regular-hours versus extended-hours setting
- provider-declared adjustment mode, if available
- warehouse adjustment mode
- whether a validated alias was used
- whether basis has been validated against broker executions

### 2. `raw` Is Not Enough

A warehouse row labeled `raw` is not automatically safe for trade review.
The consumer needs a validation status, not only a label.

Recommended statuses:

- `basis_unchecked`: no execution-price comparison has been made
- `basis_aligned`: nearby candle OHLC is compatible with broker executions
- `basis_mismatch`: candle prices are too far from broker executions
- `basis_adjustment_multiple_likely`: mismatch resembles a split/reverse-split
  multiple
- `basis_insufficient_evidence`: not enough nearby candles/executions to judge

### 3. Trader Intelligence Must Not Guess Adjustments

Trader Intelligence should never divide or multiply candle prices on its own.
It should consume provider/warehouse facts and use candles only when the shared
data layer has either:

- proven the candle basis aligns with broker executions, or
- returned an explicit adjusted series with provenance and a tested conversion.

If basis is not proven, the product should degrade to execution/P&L-only review.

### 4. Do Not Rewrite Historical Candles Blindly

When a symbol reverse splits after data was stored, old warehouse files should
not be silently rewritten in place.

Preferred direction:

- keep stored batches immutable or versioned
- allow refetched batches to carry a new `sourceFetchedAt` and basis metadata
- let analysis select a batch that is compatible with the execution basis
- preserve diagnostics when a newer provider response disagrees with older
  stored prices

### 5. Alias Handling Stays Narrow

The current alias policy remains:

- keep small validated aliases such as `MAXN -> MAXNQ`
- no broad alias discovery system
- no consumer-side ticker guessing
- add a provider-side alias only when IBKR quickly validates it through the same
  contract workflow
- otherwise return market-data unavailable and let review use executions/P&L

### 6. Insufficient History Is Separate From Basis Mismatch

`AVEX` and `ELMT` showed that a provider can return some candles while still not
returning enough usable historical daily/4h context.

These should be diagnosed separately:

- `market_context_unavailable` / insufficient daily/4h history
- not `basis_mismatch`
- not alias discovery
- not a blind backfill queue

## Suggested Implementation Order

1. Keep the current consumer guard that rejects price-disconnected trade-window
   candles.
2. Extend warehouse/provider metadata so basis provenance survives storage and
   replay.
3. Add a reusable basis-validation result object near the levels-system candle
   warehouse boundary.
4. Store validation status per analysis request or per compatible candle batch.
5. Add a small corporate-action registry only after the metadata path proves
   insufficient.

## Product Copy Principles

When market data cannot be used, the app should say why in trader language:

- Price-basis mismatch:
  "Candles were unavailable for movement review because provider prices were on
  a different basis than broker executions."
- Insufficient daily/4h history:
  "Daily/4h market context was unavailable or insufficient for this symbol.
  Support/resistance conclusions are not shown."
- Validated alias/PINK path:
  "Historical market data used a validated renamed/OTC provider path."

## Non-Goals For Now

- no full corporate-action research workflow
- no automatic split adjustment inside Trader Intelligence
- no broad delisted-symbol discovery
- no silent stub fallback for real imported-trade review
