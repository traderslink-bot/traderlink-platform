# ADR: Trader Intelligence v3 Exact Decimal v1

Date: 2026-07-18 America/Toronto
Status: Accepted for GA0-A2 implementation; gate acceptance remains pending independent review
Decision key: `ti_v3_exact_decimal_v1`

## Context and boundary

Trader Intelligence v3 needs one authoritative representation for quantity,
price, money, charges, percentages, and derived analytical P/L. JavaScript
binary floating point is not authoritative. Domain and persistence contracts
therefore carry validated canonical decimal strings. Decimal objects never
cross those boundaries.

`decimal.js` 10.6.0 is the production arithmetic implementation. It is mature,
supports arbitrary-precision decimal arithmetic, exposes explicit rounding,
and can be isolated behind the v3 exact domain wrappers. Direct imports are
permitted only in `domain/exact/exact-decimal.ts` and focused implementation
tests. Application, execution, accounting, route, and persistence code imports
the wrappers rather than the library.

## Canonical decimal grammar

Accepted lexical input matches:

```text
-?(0|[0-9]+)(\.[0-9]+)?
```

Input may contain redundant leading integer zeroes or trailing fractional
zeroes because the parser canonicalizes them before returning a domain value.
Canonical output:

- contains no exponent, leading plus sign, comma, or whitespace;
- contains no unnecessary leading integer zeroes;
- contains no trailing fractional zeroes or trailing decimal point;
- uses a leading zero for a fractional magnitude below one;
- represents positive zero and every signed zero as exactly `0`.

The parser rejects empty input, whitespace, embedded whitespace, malformed
signs, exponent notation, hexadecimal, locale formatting, `NaN`, infinities,
overflow, excessive significant precision, and excessive scale. Ordinary
invalid input returns a structured result with a stable `ti_v3_*` reason code;
raw `decimal.js` parser errors do not escape.

Raw input is limited to 256 characters before regular-expression work or
`decimal.js` construction. This bound applies before redundant leading or
trailing zeroes can be canonicalized and returns
`ti_v3_decimal_raw_length_exceeded` without logging the rejected value.

## Bounds

All accepted canonical decimals have at most 48 significant digits and at most
24 fractional digits. Leading fractional zeroes do not count as significant
digits but do count toward scale.

Type-specific rules:

| Type | Sign | Maximum scale | Additional rule |
|---|---|---:|---|
| execution quantity | non-negative | 12 | an accepted execution quantity is greater than zero |
| execution price | non-negative | 12 | zero is syntactically valid; execution validation may quarantine it |
| money and analytical P/L | signed | 24 | a validated three-letter uppercase currency is mandatory |
| execution charge | signed | 24 | positive is a cost; negative is a rebate or credit |
| percentage | signed | 24 | it is a ratio-times-100 value, not an implicit fraction |

An operation whose exact result exceeds the output type's 48-digit or scale
bound fails with a structured overflow/scale result. It is never rounded into
range.

## Arithmetic

The implementation clones `Decimal` with internal precision 128,
`ROUND_HALF_EVEN`, and exponent output disabled throughout supported ranges.
The clone is not exported.

Addition, subtraction, and multiplication calculate the exact result for
accepted operands and then validate the declared output type. There is no
intermediate or implicit rounding. The authoritative FIFO P/L engine uses only
addition, subtraction, comparison, and price-times-quantity multiplication.

Division does not return an implicitly rounded decimal. It returns an exact,
reduced BigInt numerator/denominator ratio. Conversion of a ratio to decimal
requires an explicit versioned rounding policy. The v1 supported policy is
`ti_v3_round_half_even_v1`, with a caller-declared scale inside the target
type's bound. Display rounding is outside authoritative calculation and is not
part of GA0-A2.

## Exact ratio

`ti_v3_exact_ratio_v1` stores BigInt numerator and denominator internally.
Denominators are positive, greatest-common-divisor reduction is mandatory, and
zero is `0/1`. Canonical serialization is a numerator string and denominator
string. Comparisons use cross multiplication. There is no implicit conversion
to JavaScript `number`. Numerator and denominator inputs are bounded to 256
digits before reduction to prevent unbounded resource use.

Weighted average entry, weighted average exit, and future proportional values
are exact ratios. A rounded average is never financial authority.

## Prohibited conversions

Authoritative financial code must not use `Number(...)`, `parseFloat(...)`,
`parseInt(...)`, unary plus, `Decimal.toNumber()`, or `Math.round`,
`Math.floor`, or `Math.ceil` on financial values. Architecture checks enforce
this in v3 exact/accounting modules. Tests generate financial values from
BigInt coefficients and explicit integer scales, never from floating-point
financial values.

## Persistence

Current SQLite compatibility stores canonical quantity, price, money, charge,
P/L, and digest values as `TEXT`. An isolated in-memory test proves byte-for-byte
round-trip and verifies SQLite `typeof(...) = 'text'`. GA0-A2 does not migrate
or rewrite the owner database and prohibits authoritative `REAL` columns.

The future PostgreSQL target is `NUMERIC(72,24)` for general exact values. The
72-digit storage precision accommodates the full accepted combination of up
to 48 integer digits and up to 24 fractional digits; application and database
constraints must still enforce the domain's maximum 48 significant digits and
the narrower price/quantity scale limits. `NUMERIC(48,24)` is rejected because
it cannot store a valid 48-digit integer. Canonical digests use validated
lowercase text in v1; a future bytea adapter may be added only with an explicit
reversible representation.

## Serialization

Only validated canonical decimal strings enter canonical content. The generic
canonical serializer rejects JavaScript numbers. Decimal objects are invalid
canonical values. Signed zero has already been normalized before hashing.

## Testing

Required evidence includes grammar and stable reason-code tests, signed-zero
normalization, boundary/overflow/scale vectors, exact arithmetic vectors,
ratio reduction/comparison/rounding tests, SQLite TEXT round-trip, independent
BigInt differential FIFO tests, fixed-seed fast-check suites, and an
architecture scan for forbidden imports and number conversions.

## Consequences

The approach is intentionally stricter than legacy V2. Legacy JavaScript-number
fields and 32-bit fingerprints remain non-authoritative and unchanged. No
current page, API, saved trade, or migration consumes this new authority in
GA0-A2.

## Second-remediation clarification - 2026-07-18

The versioned starting-inventory contract uses the same exact quantity, price,
currency, and digest types as canonical executions. Accepted prior lots cannot
introduce an alternate numeric representation or arithmetic path: quantities
and prices are canonical strings, production arithmetic remains behind the
approved exact-decimal boundary, and the independent reference continues to
use its own BigInt coefficient/scale implementation. No bound, grammar,
rounding, SQLite, or future PostgreSQL decision in this ADR changed.
