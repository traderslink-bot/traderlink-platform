# ADR: Trader Intelligence v3 Canonical Serialization and Digest v1

Date: 2026-07-18 America/Toronto
Status: Accepted for GA0-A2 implementation; gate acceptance remains pending independent review
Canonicalization key: `ti_v3_canonical_json_v1`

## Decision

Content-addressed v3 facts use deterministic canonical JSON encoded as UTF-8
and SHA-256. Content, serialized bytes, digest, and envelope metadata remain
separate. A digest never includes itself.

## Canonical value policy

Canonical values are null, booleans, strings, arrays, and plain objects.
JavaScript numbers, bigint values, dates, class instances, symbols, functions,
and undefined are rejected. Financial values are validated canonical strings.
Explicit null is serialized; omitted optional fields are omitted by the domain
builder before canonical validation. Undefined is never an omission shortcut.

Strings and object keys are normalized to Unicode NFC. CRLF and bare CR inside
strings normalize to LF. Canonically normalized duplicate keys are rejected.
Object keys sort by Unicode code point, independent of insertion order. JSON
string escaping is deterministic. Arrays preserve declared semantic order.
When a domain collection is order-insensitive, its domain builder explicitly
sorts it before serialization; the generic serializer never guesses.

The Unicode code-point comparator is an explicit shared implementation.
Locale-sensitive comparison such as `localeCompare` is prohibited in
canonical identity, execution, ordering, and accounting authorities and is
enforced by the architecture guard.

Enum values are lowercase contract literals. Canonical decimals follow
`ti_v3_exact_decimal_v1`. Canonical execution timestamps follow the fixed UTC
contract in the execution ADR.

## Strict raw JSON

When raw JSON is accepted, a strict recursive parser detects duplicate object
keys before ordinary parsing could discard them. It rejects trailing content,
invalid escape sequences, invalid Unicode surrogate pairs, undefined-like
syntax, and every numeric token. Expected failures return stable reason codes
without echoing private source values.

## Bytes and platform stability

Canonical output contains no formatting whitespace. The string is encoded with
UTF-8. String line endings are LF-normalized before escaping, so Windows and
Linux produce identical bytes. Golden vectors cover Unicode normalization,
astral key ordering, insertion-order independence, explicit array order, and
CRLF/LF equivalence.

## Domain-separated identity

V1 uses lowercase SHA-256 hexadecimal and validates this identifier shape:

```text
ti_v3:<domain>:v1:sha256:<64-lowercase-hex>
```

Initial domains are `canonical_content`, `canonical_execution`, and
`canonical_source_document`. Domain names and schema versions are explicit and
machine-validated. Production hashing always uses Node's built-in
`node:crypto` SHA-256.

An injectable hash function exists only in the testing boundary to simulate a
collision. Production identity construction has no hash injection. Digest
equality is always checked against canonical bytes when two records are
compared. Equal digest plus unequal bytes returns
`digest_collision_detected`, is never suppression-eligible, and fails closed.

## Identity exclusions

Canonical execution identity excludes database IDs, import-batch primary keys,
random IDs, generated UUIDs, storage creation/update timestamps, mutable review
status, display labels, localized strings, UI state, model request IDs, and the
digest itself. Domain builders decide factual inclusion; the serializer does
not infer it.

Persistence row IDs cannot affect content identity. A factual source or
economic field change must affect the canonical bytes and digest.

## Testing

Tests include strict duplicate-key rejection, Unicode NFC, Unicode code-point
key order, CRLF/LF stability, null/omitted/undefined behavior, non-finite and
all-number rejection, golden byte/digest vectors, object insertion-order
properties, semantic array-order properties, explicit semantic sorting,
persistence-ID independence, semantic-change sensitivity, production
SHA-256 validation, and an injected collision simulation.

## Second-remediation clarification - 2026-07-18

Canonical object construction uses null-prototype dictionaries and explicit
own-property definition. This applies both to direct canonical values and the
strict raw-JSON parser, so `__proto__`, `constructor`, and `prototype` are
preserved as ordinary semantic keys and cannot mutate an object prototype.
Normalized canonical arrays and objects are recursively frozen. Serialized
UTF-8 bytes and content-identity bytes are exposed only as defensive copies;
mutation of a returned `Uint8Array` cannot change authoritative bytes or a
later digest/integrity decision.
