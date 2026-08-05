# Currency Preference And Reporting Plan

**Status:** Owner-authorized implementation; visual review accepted

**Owner decision:** U.S. equity executions are recorded in USD. Each Platform
user chooses a reporting currency in Account Settings without changing Journal
account settings, executions, charges, source evidence, or derived Journal
facts.

## Outcome

Add one Platform-owned `reportingCurrency` preference with these choices:
USD, CAD, AUD, EUR, HKD, SGD and MYR.

The Workspace dashboard shows USD Journal amounts as the factual value and, if
the preference is not USD, a reporting equivalent in the selected currency.
The Bank of Canada daily indicative rate is the first reporting source. A
conversion is an analytic display fact, never a broker execution, settlement,
or correction.

## Fixed rules

1. The USD Journal ledger remains immutable and authoritative for this scope.
2. The preference belongs to the stable Platform user, not a Journal account;
   changing it affects presentation only.
3. For a closed-trade result, use the Bank of Canada rate dated on the trade's
   close date. For an as-of dashboard value, use the effective daily rate for
   that reporting date.
4. Cache each fetched daily provider observation with the provider, series,
   source date, retrieval time and exact decimal rate. Do not fetch from the
   browser or make a live quote part of a stored Journal fact.
5. Bank of Canada rates are indicative daily averages. Visible copy must say
   "reporting equivalent" and keep the original USD amount visible.
6. If the selected currency or date has no supported rate, show the USD amount
   and a truthful unavailable explanation. Do not infer, substitute zero, or
   silently omit the amount.
7. USD requires no provider request or conversion.

## Implementation slice

1. Add a versioned Platform migration for the user preference and cached
   currency observations. Update the migration manifest and schema inventory.
2. Publish a private, owner-scoped preference read/write service with strict
   ISO-currency allowlisting. Account Settings uses this service through the
   existing request-security and Platform-scope boundary.
3. Add a server-only Bank of Canada Valet adapter. It derives USD-to-target
   rates through CAD and uses exact-decimal arithmetic; no secret, API key or
   client-side provider call is used.
4. Add a Workspace reporting display adapter. It keeps source USD values and
   presents a labelled selected-currency equivalent with rate coverage.
5. Update the Account page and Workspace dashboard in the approved light
   Material shell. Obtain owner visual approval before accepting the UI slice.

## Explicitly out of scope

- Rewriting USD Journal facts, broker balances, statements or source evidence.
- Treating the indicative rate as the broker's executed FX rate.
- Replacing all Analytics page values in this first dashboard checkpoint.
- Intraday FX, account-currency changes, or a paid FX provider.
- Production deployment, hosted database changes, or a provider key.

## Acceptance evidence

- A USD preference renders original USD-only values without a provider call.
- Each non-USD supported preference renders a USD original plus a rate-dated
  reporting equivalent when daily coverage exists.
- Unsupported or missing-rate dates remain visibly unavailable and preserve the
  USD original.
- A preference update is scoped to the current Platform user and survives a
  fresh Account-page read.
- Owner visual review approves the Account Settings and Workspace presentation.
