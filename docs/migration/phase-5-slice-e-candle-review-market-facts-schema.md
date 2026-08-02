# Phase 5 Slice E Candle Review and Market Facts Schema

**Status:** Complete under delegated technical authority
**Migration:** `0009_level_analysis_candle_review`
**Module namespace:** `journal`
**Execution order:** 9

## Outcome

Candle Review becomes an explicit, account-scoped evidence workflow for one
analytics-ready closed stock round trip. The browser supplies only the stable
round-trip key and opaque expected Journal-account selection. The server
derives the symbol, entry/exit timestamps, direction, weighted prices, current
round-trip version and provider request bounds.

Every source allocation quantity and execution price remains lossless. A
weighted average can be a non-terminating decimal, so the derived review-bound
entry and exit prices use the same explicit analytics convention already used
by TraderLink price read models: four decimal places, half-up, with trailing
zeroes removed. This deterministic derived value is not presented as a raw
broker fact.

No request runs during page load, import, manual entry, reconstruction or
ordinary dashboard navigation. Pressing the review action authorizes only the
derived symbol, interval, bounded start/end time and extended-hours policy to
the configured market-data provider. No user/workspace/Journal-account/broker
identity, statement, execution identity, position fact, Data Decision, note,
tag, rule or P/L value is sent.

## Version 1 coverage

- Eligible target: active `ready_closed` stock round trip with a current closed
  version, complete priced allocations and canonical entry/exit timestamps.
- Primary interval: one minute.
- Primary window: 30 minutes before entry through 60 minutes after exit.
- Maximum bounded provider range: seven days. Longer trades return the explicit
  `unsupported_review_interval` state; the system does not pretend one-minute
  coverage exists or choose a swing interval without a separately reviewed
  contract.
- Session policy: include regular and extended-hours candles. This corrects the
  old `includePrePost=false` behavior that could hide factual price activity for
  premarket or after-hours trades.
- Optional context: unadjusted daily quote candles for the 180 calendar days
  ending at exit. Failure of daily context leaves ADR unavailable but does not
  invalidate accepted primary candles.
- Historical one-minute provider retention can make old trades unavailable.
  That is recorded as provider coverage, not a Journal data error.

## Provider normalization

Provider `yahoo_chart` is the first allowlisted adapter. It accepts only stock
symbols matching the strict local allowlist and bounded integer UTC epoch
seconds. The adapter records:

- provider and adapter version;
- request/retrieval UTC timestamps;
- interval and requested UTC bounds;
- `include_extended_hours` policy;
- timestamp semantics `provider_epoch_seconds_utc`;
- provider exchange timezone name and offset when supplied;
- adjustment policy `provider_quote_unadjusted_v1`;
- outcome and exact failure reason;
- normalized candle count, actual coverage bounds and normalized digest.

Normalized candles are sorted by unique UTC timestamp. Each candle preserves
canonical decimal strings for open/high/low/close/volume. Invalid, duplicate,
out-of-order, nonfinite, negative-volume or impossible OHLC facts fail the
entire accepted set. Raw provider JSON, response headers and cookies are not
stored.

## Migration tables

### `level_analysis_market_data_requests`

One immutable completed provider attempt bound to the selected Journal account,
stable round trip and exact round-trip version. It stores the request policy,
provider metadata, outcome, failure reason, coverage/count/digest and optional
normalized set identity. Accepted outcomes require one set; failed outcomes
must not claim a set or candle coverage.

### `level_analysis_normalized_candle_sets`

One immutable normalized set for an accepted provider request. It repeats the
privacy-safe provider/symbol/interval/policy facts required to verify the set,
stores coverage bounds, candle count and canonical set digest, and points back
to its completed request.

### `level_analysis_normalized_candles`

Immutable exact candles keyed by set and UTC epoch second. OHLC values are
positive canonical decimals; volume is a nonnegative canonical decimal. The
set/count/digest proof prevents partial or silently reordered adoption.

### `journal_round_trip_candle_reviews`

The current account-scoped review identity for one stable round trip and
analysis contract. It stores current version, lifecycle, optimistic revision,
server-derived creator and UTC timestamps. Rebuilds do not detach the review
because the parent uses stable round-trip identity; each review version still
records the exact round-trip version it analyzed.

### `journal_round_trip_candle_review_versions`

Immutable review attempts. A version records status (`ready`, `no_coverage`,
`provider_unavailable` or `unsupported`), primary and optional daily request
identity, analysis/observation/indicator JSON and independent digests,
deterministic four-decimal half-up weighted entry/exit price strings,
timestamps, direction, displayed symbol,
refresh boundary and authored/requested-by evidence. Only factual observations
are accepted; no trade grade, recommendation or inferred trader intent is
stored.

All five tables have exact composite workspace/account foreign keys. Version
tables and provider facts reject update/delete. The review parent rejects
delete and advances only through an exact expected revision in one immediate
transaction.

## Read and command behavior

1. Page load resolves the stable target and reads the current saved review; it
   performs no provider request.
2. An explicit action rechecks selected account and target eligibility.
3. A nonexpired 60-second refresh boundary reuses the current review without a
   provider call or write.
4. Provider work runs without holding a SQLite transaction.
5. Before persistence, the server rechecks that the selected account and exact
   round-trip version are unchanged. A mismatch discards the fetched result and
   returns a conflict.
6. Provider request rows, normalized sets/candles and one review version commit
   together or all roll back.
7. The browser receives chart candles plus display facts only after reading the
   account-scoped stored version. It never receives provider raw payloads or
   internal account identities.
8. The production chart uses installed `lightweight-charts` 5.2.0, v5
   `addSeries(CandlestickSeries, options)`, `UTCTimestamp` seconds and
   `createSeriesMarkers`. It removes the chart on React cleanup and never loads
   a public standalone script.
9. Visible trading numbers use at most two decimal places. Lossless source
   execution decimals remain unchanged; the documented weighted-price
   derivation is persisted at four decimal places, half-up.

## Verification and real-write gate

Before applying migration 0009 to the real database:

1. confirm ports 3000/3010/3011 are off and the WAL is zero;
2. create and restore-verify a fresh eight-migration backup;
3. apply the migration to a disposable restored copy and record its immutable
   checksum and post-schema digest;
4. prove strict target/account/version isolation, no-load provider behavior,
   minimal outbound request construction, extended-hours policy, bounds,
   provider failures, exact normalization/digest, rollback and immutable
   storage with an injected provider fixture—never the private statement's
   symbols;
5. verify disposable backup/restore; and
6. only then apply the empty schema to the real database and rerun all read-only
   Journal/Analytics reconciliation.

No existing V3 candle-review JSON, Level Analysis SQLite record or raw Yahoo
payload is copied.
