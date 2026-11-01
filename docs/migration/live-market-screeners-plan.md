# Live market screeners

Owner implementation direction: Top Gainers and Momentum share one daily
Nasdaq/NYSE universe and one Moomoo snapshot feed, initially targeting a full
pass every five seconds. The PC Playwright collector runs at 03:00 Eastern on
market days. Its first verified list contained 1,251 stocks, not a fixed quota.

## Product contract

- Momentum has a focused upper area above its full qualifying list. Focus is a
  separate qualification, not a setup detector, and an empty area is valid.
  Top Gainers is only its ranked list and has no focused upper area.
- Top Gainers ranks session gain. Momentum seeks new price/volume activity, including
  stocks flat or red on the day. Session-high proximity is not mandatory.
- Candidate quality and invalidation take priority over display stability.
  Confirmation and replacement hysteresis only limit inconsequential swapping;
  an invalid or stale candidate leaves immediately.
- Setup detection is explicitly deferred. Do not port the three Watchlist
  setups under test, add rebound labels, or claim validated entry signals.
- Float is required. Unknown float cannot qualify. Float is not outstanding
  shares. A maximum float has not been selected by the owner.
- Market cap is editable in admin. The collection ceiling is $100M; do not
  suggest filtering above the actual acquired universe. Daily qualifiers stay
  in the universe for that trading date even if cap rises later.
- News, press releases and SEC filings come from existing News storage, with
  timestamps and links in both lists and focus. Missing coverage is not 'no news'.
- Screeners admin belongs only to the configured stable owner identity, not
  the display name Traderlink. Its navigation link belongs under Stock tools,
  immediately after Watchlist Admin. Controls appear above the same user view;
  regular users have no filter/admin controls.
- Owner-selected display defaults: 20 Top Gainers and 20 Momentum, adjustable
  in admin up to the actual supported universe size. Focus remains a proposed
  default of 3, independently editable up to the supported universe size. The
  owner explicitly requires customizing both the main-list count and focused
  count for each screener, along with filters and qualification controls.
  Never fill lists or focus cards with nonqualifying candidates.

## Foundation and subsequent integration

The initial foundation allocation was pure new source only under
`src/modules/scanner/live/`. It must not import stale app wiring, start workers,
call providers, write runtime files or create routes. It defines validation,
daily union/idempotency, session boundaries, snapshot coverage, rolling activity,
focus rules, settings validation and budget admission. Numeric activity defaults
are proposed starting points, not owner-approved or statistically validated.

The next allocation adds ingestion/storage source as documented below. Further
exact-source integration must connect it and add admin configuration, the shared provider transport,
one background scan loop, Finnhub-first float enrichment, News reads and owner-reviewed
Light/Navy Dark responsive UI. The destination
`/api/scanner/universe/import` is now implemented in local source, NOT deployed
or activated.

Every outgoing Moomoo request, including OAuth, retries and history pages, must
be accounted in a shared rolling 60-second budget at the actual outbound hop.
Scanner priority cannot undo requests already sent. Reserve demand explicitly,
bound waiters, respect 429 cooldown, and retain admission history across restart.
The existing Indicators/setup limiter alone is not full coverage. Integration
must audit all call sites and other processes on the same outbound IP.

The source integration uses `TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED=true` as an
explicit hosted opt-in. Existing consumers retain their injected test fetchers;
their default Moomoo transport enters the shared queue only when this flag is on.
The live scanner additionally requires `TRADERLINK_LIVE_SCREENERS_ENABLED=true`
and refuses to start without the shared budget flag. Neither flag is configured
or activated by this source work. The persisted budget ledger lives next to the
validated Platform database path and contains dispatch times/priorities only.

Float enrichment uses Finnhub Company Profile 2 `floatingShare` as the primary
fact. Finnhub reports that field in millions of shares, so conversion to shares
uses exact decimal arithmetic. A missing, zero, invalid or ticker-mismatched
Finnhub result falls back to EODHD's delayed US quote `sharesFloat`. The EODHD
parser accepts the verified symbol-keyed `data` response as well as documented
row arrays, while duplicate rows remain ambiguous and do not qualify. Neither
provider's outstanding-share field may substitute for float.
in bounded 100-symbol application batches, with a dated persistent cache. A
missing symbol or missing/nonpositive `sharesFloat` stays unknown; outstanding
shares are never substituted. The API token remains server-only. Float calls do
not supply live prices and are outside the Moomoo same-IP request budget.

The collected CSV remains authoritative for the scanner's market-cap membership
and editable market-cap filters. Its exact `market_cap` value is retained as
`marketCapAtCollection` for the trading day. The existing
Watchlist/EODHD contract already uses `sharesFloat`, so the scanner reuses that
provider fact through its own dated bounded cache.

Runtime settings are a revisioned JSON record under the same private
`scanner-live-v1` directory as the dated universe. Missing settings mean the
feature is disabled. Owner GET/POST uses the existing stable Watchlist-admin
identity and same-origin mutation header; display name is never authority.
The first production test is restricted to the configured Traderlink owner
profile. Ordinary members cannot read the current scanner model or open either
scanner route during this test. A later owner-approved activation may restore
authenticated member reads; members can never alter scanner settings.
The runtime reads News only for symbols actually present in a displayed list or
focus card, never for the full universe on every five-second pass.

Keep provider time distinct from receive time; reject old-date/invalid/duplicate
rows, report missing requested symbols and never reuse a previous day's universe
silently. Missing session fields are unavailable. Select pre/regular/post fields
explicitly; after-hours gain is against the day's regular close. The exact
regular volume counter inclusion still needs live qualification. RVOL from
time-of-day history is distinct from volume acceleration and provider volume_ratio.

## Acceptance

Source-only static checks precede a frozen allowlist/hash handoff. Focused tests
and broader checks require the assignment's scheduled acceptance gate. Synthetic
tests must cover incomplete imports, duplicates, day retention, timestamps,
session resets, counter resets, warm-up, focus invalidation and shared-budget
priority/cooldown/restart. UI integration requires a Help guide and owner visual
review. No live activation or release is selected by foundation work.

On mobile, both the Momentum upper area and the main scanner lists use compact
tables with labelled columns. Top Gainers keeps ticker, price, day gain,
cumulative volume, float and a clickable PR/SEC link visible. Momentum keeps
ticker, price, rolling one- and five-minute price change, rolling one-minute
volume and float visible; its clickable PR/SEC link sits with the ticker.
Top Gainers expands to today's high with distance, session low, RVOL when
available and standard `Turnover %`, displayed as a percentage such as `140%`. Momentum
expands to day gain, session volume, rolling five-minute volume, one- and
five-minute volume-spike ratios, RVOL when available, today's high with distance,
session low, Turnover % and spread. Market cap remains an admin
filter and is not member display data. Metrics with no value are omitted.
Generic qualification phrases and the company name are omitted from the expanded
mobile row. News and filing links open the corresponding TraderLink article and
are not repeated in the expanded area. Desktop retains its focus cards and full results table. On
mobile the table reaches the card's left, right and bottom
edges, and ticker symbols reuse the PR Scanner's theme-aware `warning.main`
color.

The member page does not show the Live market activity card. Its scanner tabs
sit directly above one active-scanner card. `Top Gainers` contains only its
ranked list. The `Momentum` title spans an unlabeled attached upper area and the
full list; a defined divider separates those Momentum sections without a card
gap. Coverage, update and result-count labels remain available on the
owner-admin version.

Momentum qualification continues to enforce the configured volume,
dollar-volume, float and spread gates. Its ordering is not a pure one-minute
price sort: a bounded 100-point score weights recent price movement at 40,
volume acceleration at 25, Moomoo RVOL at 15 when available, recent one-minute
dollar volume at 15 and spread quality at 5. Premarket omits RVOL without
penalizing one candidate relative to another in that session. The Momentum
upper area uses the same score after its stricter acceleration, dollar-volume and
confirmation gates.

Compact rows briefly flash green after an observed price increase and red after
a decrease. Initial loads and unchanged prices do not flash; the effect clears
after 900 milliseconds and is disabled for reduced-motion users.

Top Gainers remains a daily-performance ranking led by session gain from the
previous regular-session close. Momentum remains a separate emerging-activity
ranking led by recent price movement, volume acceleration, relative activity
when available, recent dollar volume and spread quality. Both may display
shared decision context such as float, current-day high distance and News, but
their ordering logic must not be made identical. Every displayed live metric
uses its latest valid provider observation; a missing or delayed value must not
be presented as newly updated. The scanner derives an exact rolling five-minute
share total from its timestamped five-second cumulative-volume observations. It
also compares that window with the immediately preceding, non-overlapping
five-minute window for `5m Vol Spike`. Both remain unavailable during the
ten-minute warm-up, a data gap, a counter reset, or missing volume; neither is
estimated from one-minute candles.

Momentum also displays rolling `1m Vol` separately from `1m %`. The former is
the cumulative-share difference across the latest exact 60-second boundary;
the latter is price change across that boundary. Both rolling windows advance
on each five-second scan. Missing exact boundaries remain unavailable rather
than being normalized into an estimated total.

See [progress](live-market-screeners-progress.md).

## Collector import contract (source implemented, not deployed)

`POST https://app.traderslink.pro/api/scanner/universe/import`, JSON content type,
`Authorization: Bearer <dedicated collector token>`. The token is configured
separately as `TRADERLINK_SCANNER_UNIVERSE_IMPORT_TOKEN`; no real token has been
created or installed. It authorizes only ingestion, not dashboard or admin access.
The client must retain local collection files and normalize metadata to this
request; do not assume its existing raw metadata already uses these field names.

```json
{
  "tradingDate": "2026-11-02",
  "csv": "symbol,exchange,market_cap\nAAA,NASDAQ,10000000\n",
  "metadata": {
    "completeness_status": "complete",
    "source_url": "https://stockanalysis.com/stocks/screener/",
    "collection_started_at_utc": "2026-11-02T08:00:00Z",
    "collection_finished_at_utc": "2026-11-02T08:01:00Z",
    "displayed_total": 1,
    "extracted_unique_count": 1,
    "applied_filters": {
      "exchanges": ["NASDAQ", "NYSE"],
      "market_cap_max": 100000000
    }
  }
}
```

The example uses synthetic data. `tradingDate` must be the current Eastern
collection/trading date, on a verified open trading day. The source market-cap
snapshot may describe the preceding close; this does not change the collection
date. A complete day's list is needed before 04:00 Eastern; arrival at 03:00 is
fine. No filename, local path or remote persistence path is client-controlled.
The request is capped at 768,000 bytes, CSV at 512,000 bytes / 4,000 rows, and
body reading at 10 seconds. Unknown/duplicate symbols, unsupported exchanges,
missing/nonpositive caps, caps above $100M, partial counts or stale/future/wrong
dates are rejected before storage. Exactly $100M is included.

Success is 201 `scanner_universe_imported`, or 200
`scanner_universe_already_imported` on a normalized identical daily list. Both
return tradingDate, uploadCount, retainedCount, idempotent and sourceHash.
Reordering identical rows does not create a new universe. A later complete list
adds new daily qualifiers without removing earlier ones; same-day venue changes
and backwards collection times conflict. RetainedCount can exceed uploadCount.

Failures: 401 unauthorized; 400 invalid CSV/metadata/counts; 408 slow body;
413 too large; 415 unsupported content type; 409 wrong date/closed market or
conflicting update; 503 missing server token, unavailable calendar or storage.
All responses are private/no-store. Errors never contain tokens, raw errors or
private filesystem paths. No automatic retry policy is activated by this source.

Server storage is under `scanner-live-v1/` next to the validated Platform SQLite
location on persistent storage. It does not open, initialize or migrate SQLite.
Each date has an atomic canonical JSON union and exclusive immutable per-dataset
evidence. Files are mode 0600, the new directory 0700. No token or arbitrary
client upload configuration is persisted. One hosted process/writer is required;
in-process instances serialize by root, and restart reads the dated canonical
file. Missing dates remain missing; no previous-day fallback is implied.

This contract is implemented only in local source pending isolated filesystem
acceptance, current-source integration/build, release approval and dedicated
secret provisioning. The PC collector must leave uploads disabled until those
are explicitly qualified. This endpoint is not evidence that any scanner is live.
