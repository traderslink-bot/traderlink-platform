# Currency Preference And Reporting Plan

**Status:** Dashboard-wide implementation and local technical/browser QA complete;
final owner visual acceptance remains available

**Owner decision:** U.S. equity executions are recorded in USD. Each Platform
user chooses a reporting currency in Account Settings without changing Journal
account settings, executions, charges, source evidence, or derived Journal
facts.

## Outcome

Add one Platform-owned `reportingCurrency` preference with these choices:
USD, CAD, AUD, BRL, CNY, EUR, HKD, INR, IDR, JPY, MYR, MXN, NZD, NOK,
PEN, PLN, SGD, ZAR, KRW, SEK, CHF, TWD, THB, TRY and GBP.

Every normal dashboard analytics and review surface presents money in the
selected reporting currency while the Journal amount and its recorded currency
remain the factual source values. The Bank of Canada daily indicative rate is
the first reporting source. A conversion is an analytic display fact, never a
broker execution, settlement, correction, or manual-entry value.

## Fixed rules

1. The Journal ledger and each amount's recorded currency remain immutable and
   authoritative for this scope.
2. The preference belongs to the stable Platform user, not a Journal account;
   changing it affects presentation only.
3. For a closed-trade result, use the Bank of Canada rate dated on the trade's
   close date. For an as-of dashboard value, use the effective daily rate for
   that reporting date.
4. Cache each fetched daily provider observation with the provider, series,
   source date, retrieval time and exact decimal rate. Do not fetch from the
   browser or make a live quote part of a stored Journal fact.
5. Bank of Canada rates are indicative daily averages. Converted values must
   be presented as reporting values and never described as broker execution or
   settlement values.
6. If the selected currency or date has no supported rate, show a truthful
   unavailable explanation. Do not infer, substitute zero, or present an
   unconverted source amount as if it were the selected reporting currency.
7. USD requires no provider request or conversion.
8. Normal dashboard money uses the selected currency's symbol, never an ISO
   code prefix or suffix such as `USD 1.67` or `1.67 USD`. Ordinary captions
   and descriptions do not repeat the selected currency. ISO currency codes
   remain visible only where the user is choosing a currency or where currency
   identity is itself required evidence, such as a currency mismatch in Data
   Decisions. This is presentation-only and never rewrites Journal facts.
9. Workspace, Calendar, Analytics, Trade Explorer, Trade Analyzer, Trading Rule
   results, Daily Trade Tracker, Swing Trade Tracker, Open Positions and Candle
   Review all consume the same server-derived preference. A page-level query
   cannot silently override the user's preference.
10. Editable manual executions, statement previews, import mapping and Data
    Decisions continue to show and save original broker/source amounts. Those
    are factual input and correction surfaces, not reporting views. Where
    ordinary review UI and an editor share a row, the review value is converted
    while the editor receives the untouched source value.
11. Stored AI Review text remains immutable evidence of what was issued. New
    server-derived dashboard context uses the active reporting preference;
    already-issued text is not numerically rewritten after a preference change.

## Implementation slice

1. Add a versioned Platform migration for the user preference and cached
   currency observations. Update the migration manifest and schema inventory.
   Migration 0035 expands the strict currency constraints without changing a
   user's selected preference or any cached observation.
2. Publish a private, owner-scoped preference read/write service with strict
   ISO-currency allowlisting. Account Settings uses this service through the
   existing request-security and Platform-scope boundary.
3. Add a server-only Bank of Canada Valet adapter. It derives USD-to-target
   rates through CAD and uses exact-decimal arithmetic; no secret, API key or
   client-side provider call is used.
4. Add a server-side reporting fact-set adapter before normalization and
   aggregation. Convert each closed round trip using its close-date rate and
   every open/as-of value using its reporting date, including price, fees,
   notional, P/L and analyzer price-path facts.
5. Route every normal dashboard read through the selected reporting context,
   remove page-level currency overrides, refresh the dashboard immediately
   after saving a preference, and retain source values for editors and evidence.
6. Show a safe dashboard recovery state when an exact required rate is
   unavailable; never leave the user with a mislabeled source value.

## Explicitly out of scope

- Rewriting USD Journal facts, broker balances, statements or source evidence.
- Treating the indicative rate as the broker's executed FX rate.
- Intraday FX, account-currency changes, or a paid FX provider.
- Rewriting already-issued AI Review prose after the fact.
- Production deployment, hosted database changes, or a provider key.

## Acceptance evidence

- A USD preference renders dollar-symbol values without a provider call or a
  repeated ISO currency code.
- Each non-USD supported preference renders the selected currency's symbol and
  a rate-dated reporting value when daily coverage exists.
- Unsupported or missing-rate dates remain visibly unavailable and preserve
  the source facts without presenting them as selected-currency values.
- A preference update is scoped to the current Platform user and survives a
  fresh Account-page read.
- Owner visual review approves representative desktop and mobile dashboard,
  chart, table, drawer and editor presentations.
