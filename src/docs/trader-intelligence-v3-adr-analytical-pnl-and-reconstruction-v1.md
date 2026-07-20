# ADR: Trader Intelligence v3 Analytical P/L and Reconstruction v1

Date: 2026-07-18 America/Toronto
Status: Accepted; GA0-A2 independently accepted and merged through PR #104 at `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a`
Policy key: `ti_v3_fifo_analytical_pnl_v1`

## Purpose and authority

This policy produces analytical journal P/L for retrospective education and
self-improvement. It is not tax P/L, broker P/L authority, a cash-ledger
authority, portfolio advice, or a current buy/sell/hold instruction.
Broker-reported values remain reconciliation evidence.

## Ledger boundaries

FIFO policy v1 keeps ledgers separate by canonical owner, canonical account,
canonical instrument, and currency. Currencies are never combined and no FX
conversion is implicit. Accepted execution quantity is positive; side controls
inventory direction. Long inventory is positive internally and short inventory
is negative.

Only accepted, relationship-resolved, collision-free canonical executions in
an accepted meaningful ordering state may enter the ledger. Pair-addressed
relationship resolution occurs before ledger grouping and can suppress only
a byte-proven duplicate occurrence. The ledger fails closed for order
ambiguity that can affect inventory/P&L, unresolved or unsupported instrument
identity, missing or changing ledger currency, unresolved correction/bust,
digest collision, unsupported security type, unresolved corporate-action or
symbol continuity, prior inventory, or exact arithmetic overflow.

## FIFO realization

Long sale gross realization is:

```text
(exit price - FIFO lot price) × matched quantity
```

Short cover gross realization is:

```text
(FIFO lot price - cover price) × matched quantity
```

The engine consumes existing FIFO lots to zero before opening a remainder in
the opposite direction. A reversal preserves the one broker execution
identity and emits deterministic close/open ledger effects tied to that
identity; it does not fabricate child broker executions.

Open inventory preserves exact remaining FIFO lots and quantity. It has no
unrealized P/L without a separately accepted market price and is not labeled a
closed trade.

If a broker-declared closing execution needs inventory absent from the dataset,
the ledger returns `prior_inventory_required`, invents no basis, and blocks the
affected realized result. Unresolved corporate-action basis or symbol
continuity also blocks reconstruction rather than silently adjusting history.

Broker average-fill records remain one aggregated execution and may be used as
reported. They are never expanded into invented fills.

## Charges and rebates

Charges are signed exact values in execution currency. A positive charge is a
cost and reduces net analytical P/L. A negative charge is a valid rebate/credit
and increases it. Charges are recognized once at execution time. Entry charges
are not proportionally allocated across later exits.

When one reversal execution both closes and opens inventory, its full charge is
recognized in the round trip that is active at execution time. The remainder
opens the next round trip without duplicating or proportionally splitting the
charge. This deterministic policy conserves the source charge and requires no
division.

Ledger net analytical P/L is cumulative gross realized P/L minus cumulative
signed charges. A flat-to-flat round trip uses the executions/effects in that
round trip under the same rule.

## Independent cash-flow invariant

Each buy quantity contributes negative price-times-quantity cash flow; each
sell contributes positive price-times-quantity cash flow; every signed charge
is subtracted once. Reversal execution notional is split exactly between its
close and open quantities while retaining one source identity.

Whenever inventory returns flat, the independently accumulated signed cash
flow must equal FIFO gross realized P/L minus signed charges. A mismatch fails
verification. The authoritative realized FIFO engine itself requires no
division.

## Exact averages

Weighted average entry and exit are reduced exact ratios of aggregate exact
notional to aggregate exact quantity. They are not rounded decimal authority.
Display conversion is deferred.

## Result contract

Structured results include policy version, ledger key, ending exact signed
quantity, open FIFO lots, gross realized P/L by currency, signed charges by
currency, net analytical P/L by currency, completed flat-to-flat round trips,
per-execution matched quantities, reversal effects, blocked states,
limitations, and input execution digests. No
cross-currency total is returned.

## Independent reference

Tests include a separate coefficient-and-scale BigInt/rational FIFO
implementation. It imports no `decimal.js`, production exact helper, or
production FIFO matcher. Production and reference code share only input/output
type declarations, stable enum values, and synthetic fixture documents.
Differential tests compare ending quantity, open lots with source identity,
matched quantity per execution, gross P/L, charges, net P/L, signed cash flow,
reversal effects, weighted entry/exit ratios, completed round trips, and
blocked-state codes. They expose diagnostic state on disagreement.

## Deferred boundary

GA0-A3 owns append-only bitemporal correction application, lifecycle review
separation, manifests, eligibility, snapshots, stable evidence, filters,
backup/restore, and migration policy. GA0-A2 adds no database repository,
route, current-data migration, analytics, chart, AI, market-data, or deployment
behavior.

## Second-remediation clarification - 2026-07-18

Reconstruction accepts an opaque exhaustive relationship-resolution result,
not raw executions plus an optional relationship list. Raw FIFO also requires
that receipt and verifies that its ordered group exactly matches retained
resolved executions. Unknown, incomplete, or forged coverage fails closed.

Each ledger also requires a versioned starting-inventory contract with state
`proven_flat`, `accepted_prior_lots`, or `unknown`. Missing or `unknown`
starting inventory returns `prior_inventory_required` before the first
execution side can imply long or short inventory. Accepted prior lots require
exact quantity/price, matching owner/account/instrument/currency, non-null
source-document identity, source identity, original row locator, and canonical
execution digest. FIFO consumes those lots without inventing executions and
preserves their provenance. The independent BigInt reference implements the
same prior-lot policy independently and differential tests cover prior long
and prior short closure. No persistence, migration, or A3 correction behavior
is added.
