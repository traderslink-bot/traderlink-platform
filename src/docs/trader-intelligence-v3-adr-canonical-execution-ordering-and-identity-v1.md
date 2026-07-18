# ADR: Trader Intelligence v3 Canonical Execution, Ordering, and Identity v1

Date: 2026-07-18 America/Toronto
Status: Accepted for GA0-A2 implementation; gate acceptance remains pending independent review
Contract key: `ti_v3_canonical_execution_v1`

## Canonical execution boundary

A canonical execution separates factual content from validation/envelope
metadata. The public builder accepts `unknown` and returns stable structured
failures for malformed shapes and values. The SHA-256 digest covers only
canonical factual content. The
envelope carries validation state/reason codes and the digest. Database IDs,
import-batch IDs, review status, storage timestamps, UI labels, and the digest
itself are excluded.

Factual content records schema version, canonical owner and account keys,
source identity/kind/system, evidence class, broker code, source-document
digest where known, original row locator and its ordering semantics,
aggregation state, instrument resolution, raw broker symbol, stable instrument
key where resolved, security type, basis-continuity state, UTC execution
timestamp, source timezone evidence and precision, side, position-effect
evidence, short-sale evidence, positive exact quantity, exact price, currency,
signed exact charges, broker net cash where known, order/execution IDs, broker
execution/fill sequence evidence, and correction/bust evidence.

Stable owner/account keys are application canonical keys, not raw account
numbers and not database primary keys. Tests use only explicit synthetic keys.

## Provenance and evidence

Reserved source kinds are `broker_csv`, `broker_api`, `owner_manual`,
`paper_trade`, and `legacy_migration`. Evidence classes are
`broker_confirmed`, `owner_reported`, `hypothetical`, and
`migrated_unverified`.

Only broker CSV/API facts may be `broker_confirmed`. Owner-manual facts may be
owner-reported or hypothetical; paper trades are hypothetical; legacy
migrations are migrated-unverified. The contract rejects combinations that
could make owner-reported, hypothetical, or unverified data masquerade as
broker-confirmed. GA0-A2 reserves provenance only; it does not implement manual
entry or migrate legacy data.

Aggregation states are `individual_fill`, `broker_average_fill`, and
`aggregated_unknown`. An average-fill row remains one execution. No child fills
are fabricated.

Instrument states are `resolved`, `unresolved`, `ambiguous`, and `unsupported`.
Validation states are `accepted`, `quarantined`, and `rejected`, with stable
reason codes. Expected invalid facts return structured results.

## Canonical timestamp

The canonical form is UTC only:

```text
YYYY-MM-DDTHH:mm:ss.nnnnnnnnnZ
```

It uses uppercase `Z`, exactly nine fractional digits, Gregorian component
validation, no locale parser, and no system timezone. Accepted strings sort
lexically in chronological order. Source precision is recorded separately as
`date`, `minute`, `second`, `millisecond`, `microsecond`, `nanosecond`, or
`unknown`. Lower-order fields must be zero when the source did not report them.
Source timezone/offset evidence is preserved separately where available.
Padding to nine digits does not claim additional evidence.

## Two ordering concepts

Stable storage order and economically meaningful order are separate.

Storage order is a deterministic total order using canonical timestamp,
declared sequence fields, row locator, and finally canonical digest. It exists
for stable persistence and output only.

Meaningful order evaluates non-overlapping timestamp-precision intervals and
declared broker/source sequence semantics. Broker execution indices require
the same owner, account, broker, source system, and source identity, plus the
same source document unless both facts declare `source_identity_global`
scope. Fill sequence additionally requires the same order and source document.
Execution-ID ordering requires `declared` semantics, a validated explicit
ordering namespace shared by both facts, compatible declared scope, and the
same broker-adapter scope. Original row order remains limited to one preserved
source document. Lexical execution-ID order and padded timestamp precision are
not automatically meaningful.

Results are `ordered`, `tied_but_economically_equivalent`,
`ambiguous_meaningful_order`, or `conflicting_order_evidence`, with stable
reason codes and the evidence used. Overlapping precision windows without
sequence evidence remain ambiguous. Digest sorting may stabilize storage but
never upgrades economic knowledge.

## Duplicate and correction classification

The pure relationship classifier returns one of:

- `exact_duplicate_same_source`;
- `same_execution_reexported`;
- `broker_correction_or_bust`;
- `possible_duplicate_ambiguous`;
- `legitimate_repeated_fill`;
- `digest_collision_detected`;
- `manual_review_required`;
- `distinct_execution`.

It also carries the left and right canonical execution digests and returns
evidence, confidence, stable reason codes, and suppression eligibility. Only
digest-equal, byte-equal facts with proven equal source identity/document/row
location are automatically suppression-eligible. Equal economic fields do not
prove duplication.
Distinct stable execution IDs normally establish legitimate distinct fills.
The same stable broker execution ID with equal economic content in another
source document is a re-export; changed economic content is a correction or
conflict. Correction/bust references are preserved. Ambiguous cases remain
visible. GA0-A2 classifies correction state but does not apply bitemporal
corrections; that remains GA0-A3.

Before grouping or FIFO, a pair resolver verifies that both named digests are
present, recomputes the classification, verifies owner/account/instrument/
currency group scope, and applies the state only to that group. One proven
duplicate relationship suppresses one occurrence. Re-exports, possible
duplicates, manual review, correction/bust, and collisions block their
affected group; legitimate repeated and distinct fills retain both facts.
Unknown, cross-group, or forged classifications fail closed. No unscoped
relationship list is passed to every ledger.

## Digest

Canonical execution identity is:

```text
ti_v3:canonical_execution:v1:sha256:<64-lowercase-hex>
```

Canonical bytes are retained for verification at comparison boundaries. Equal
digest with unequal canonical bytes is a collision and fails closed.
The envelope returns the normalized canonical value produced by serialization,
so reserializing `envelope.content` yields exactly `envelope.canonicalBytes`.

## Compatibility

Legacy 32-bit import fingerprints remain non-authoritative diagnostic and
migration evidence. Current routes, saved data, imports, and visible numbers
are not switched to this contract in GA0-A2.

## Second-remediation clarification - 2026-07-18

Canonical execution content, nested charges/locators, validation, and the
envelope are deeply readonly and runtime-frozen. An integrity verifier
rebuilds untrusted envelopes, compares canonical bytes and digest, and returns
a protected envelope. Ordering, relationship resolution, and accounting use
protected envelopes or fail closed on integrity drift.

`row_number` is a canonical bounded nonnegative integer string
(`0` or a nonzero-leading value up to 38 digits). Arbitrary bounded adapter
keys use `record_key`. Ordering never applies `BigInt` to unchecked row or
sequence evidence. Timestamp-interval evidence is unavailable when either
source precision is `unknown`; explicitly source-scoped broker sequence may
still establish order, while digest ordering remains storage-only.

Relationship coverage is exhaustive over every unordered input pair and is
represented by an immutable opaque receipt. Exact same-source suppression
requires equal digest, equal bytes, equal validation, matching source identity
and row, and a non-null matching source-document digest. Validation
disagreement or missing document proof is conservative and never
suppression-eligible. A test-only hash injection remains isolated to focused
collision evidence; production content identity remains SHA-256 only.
