# Phase 5 Slice E Level Analysis Deliveries and Links Schema

**Status:** Technically complete; migrations 0010/0011, replacement services and compatibility APIs passed the focused gate

**Scope:** Phase 5 Slice E4 only

## Outcome

Level Analysis keeps its useful strict delivery, snapshot, quarantine,
trade-link, coverage and facts-only contracts without inheriting the legacy V3
database or authentication boundary.

Level Analysis owns provider delivery evidence and normalized symbol facts.
Journal owns the selected-account relationship between one stable round trip
version and one accepted delivery version. Neither a broker statement nor a
broker/source-account identity chooses that relationship.

Legacy delivery fixtures, links and saved trades are development evidence only.
They are not copied. All E4 tables start empty.

## Corrections to the legacy boundary

The preserved implementation remains reference code, not the replacement
runtime, because it currently:

1. opens the legacy Trader Intelligence database and creates tables at runtime;
2. uses the V3 owner-route wrapper;
3. permits request content to supply workspace, account and user identifiers;
4. permits request content to choose the packaged-provider allowlist;
5. uses a broker-style saved-trade identifier instead of the replacement stable
   round-trip identity; and
6. stores mutable current records without a separate immutable link history.

E4 removes all six behaviors. The existing validation and facts-only contracts
may be reused only where they have no V3 database/authentication dependency.

## Module and migration ownership

The Platform migration runner continues to own physical database lifecycle.
The accepted migration namespace type is extended with `level_analysis`.

E4 uses two consecutive immutable migrations so logical table ownership stays
clear:

1. `0010_level_analysis_deliveries`, owned by `level_analysis`; and
2. `0011_journal_level_analysis_links`, owned by `journal`.

The split is deliberate. It avoids placing Journal links in a Level Analysis
migration or placing provider evidence in a Journal migration. Migration 0011
depends on the accepted delivery tables from 0010.

## Migration 0010: Level Analysis delivery evidence

### `level_analysis_deliveries`

One immutable row represents one validated or quarantined submitted payload.
Required fields include:

- delivery ID derived from validation state and the canonical payload digest;
- delivery persistence contract version;
- canonical `sha256:` raw-payload digest;
- source system, source kind and source schema version;
- bounded optional source commit/artifact evidence;
- provider and generated/retrieved timestamps when supplied;
- reviewed symbol count and accepted/quarantined validation state;
- compact summary, safety, limitations, quarantine reasons and audit JSON;
- canonical raw payload JSON and complete validated record JSON; and
- independent SHA-256 digests for every persisted JSON document.

The raw payload is retained because the accepted strict delivery contract
requires audit and deterministic replay. It is server-only and is never exposed
by ordinary delivery, symbol, trade-link or trade-detail responses.

`raw_payload_sha256` is unique. Re-ingesting the exact same payload is an
idempotent read of the existing row; it never changes timestamps or evidence.
Accepted and quarantined rows are immutable. No update or delete is allowed.

### `level_analysis_delivery_symbol_facts`

One immutable row represents one accepted symbol summary within one delivery.
Required fields include:

- delivery ID, normalized symbol, provider and as-of timestamp;
- the strict symbol-summary contract version inherited through its delivery;
- summary JSON and its SHA-256 digest; and
- creation timestamp inherited from the immutable delivery.

Only accepted deliveries may have symbol facts. A quarantined delivery has
zero symbol rows. The key `(delivery_id, normalized_symbol)` is unique. Provider,
symbol, as-of and fifteen-minute context-only requirements are revalidated at
the repository boundary before insertion.

## Migration 0011: Journal round-trip links

### `journal_round_trip_level_analysis_links`

This is the selected-account current pointer for one stable round trip. It
contains workspace, account, round-trip ID, current immutable link-version ID,
revision, lifecycle state, creator and timestamps. There is at most one active
Level Analysis relationship for a stable round trip. The row may advance only
through the Journal command service transaction; it is never deleted.

### `journal_round_trip_level_analysis_link_versions`

Each immutable version records:

- workspace, account, stable round-trip ID and the exact round-trip version ID
  that was evaluated;
- accepted delivery ID, normalized symbol, provider, raw-payload digest and
  source kind;
- delivery/symbol as-of evidence;
- match policy, match result, linked symbol summary, limitations and safety
  JSON plus independent SHA-256 digests;
- link source (`manual_review`, `resolver` or `import_batch_hint`);
- author, version number and creation timestamp; and
- a complete compatibility record JSON plus digest.

The version references both the account-scoped Journal round-trip version and
the global accepted delivery. Rebuilding Journal round trips does not rewrite
history. If the stable round trip advances, a future resolve-and-link command
must evaluate the new current round-trip version and append a new link version.

## Delivery ingestion contract

The validate and ingest endpoints accept one JSON payload envelope with a
maximum UTF-8 size of 2 MiB. Content-Length above the bound fails before body
parsing; the measured body length is checked again after reading.

The request cannot supply an allowlist, owner/workspace/account identity,
created timestamp or database location. The server:

1. derives the local Platform request boundary;
2. reads `TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS` as a comma-separated,
   lowercase, deduplicated allowlist;
3. rejects ingestion as unavailable when that setting is absent or invalid;
4. assigns its own UTC receipt time;
5. runs the existing strict schema/package validation;
6. canonicalizes and hashes the raw payload;
7. validates the complete persistence record; and
8. persists delivery plus symbol rows in one immediate transaction.

The compatibility route never accepts a request-provided provider allowlist.
The provider value inside the package must be on the server allowlist. The word
provider here identifies Level Analysis evidence; it does not bind a Journal
account to one broker. Journal accounts remain user-defined containers that may
receive executions from multiple brokers.

Validation does not write. Ingestion stores accepted packages and quarantined
packages so failures remain inspectable; quarantined packages never publish
symbol facts. Duplicate payloads return the original immutable delivery and a
duplicate indicator.

## Stable-round-trip resolution contract

Browser link requests contain only:

- a canonical stable `roundTripId`;
- the opaque expected Journal-account selection reference;
- a provider from the server allowlist; and
- an optional explicit delivery ID for deliberate manual selection.

Workspace, account, user, symbol, trade end time and round-trip version are
always derived on the server. The command requires the selected account, an
active stable round trip, current state `ready_closed`, a close timestamp and a
stock symbol. It then:

1. reads the current round-trip version and normalized symbol;
2. resolves the requested accepted delivery or the newest accepted symbol fact
   at or before the trade close time;
3. rejects future-as-of facts, quarantined deliveries, disallowed providers,
   symbol mismatch and packaged 15-minute facts not marked context-only;
4. re-reads the current round-trip version inside the write transaction;
5. returns a conflict without writing if that version changed;
6. appends one immutable link version and advances the current link pointer; or
7. returns the existing current version as an idempotent duplicate when every
   authoritative input is unchanged.

No match returns `not_found`, `blocked`, `limited` or `unavailable` with exact
reason codes. It never creates a guessed link and never changes Journal
executions, round trips, decisions, broker P/L, tags, rules or notes.

## Compatibility routes

The preserved route paths remain available while their internals move to the
replacement modules:

- `POST /api/level-analysis/deliveries/validate` validates without writing;
- `POST /api/level-analysis/deliveries` ingests one bounded delivery;
- `GET /api/level-analysis/deliveries/latest` returns compact accepted evidence;
- `GET /api/level-analysis/deliveries/latest/symbols/[symbol]` returns one
  accepted strict symbol summary;
- `POST /api/level-analysis/trade-links/resolve` resolves without writing;
- `POST /api/level-analysis/trade-links` appends an accepted Journal link;
- `GET /api/trades/[tradeId]/level-analysis` returns the current link; and
- `GET /api/trades/[tradeId]/level-analysis/facts` returns the facts-only trade
  detail view.

For compatibility, `[tradeId]` is the replacement stable round-trip UUID. All
private routes derive the local Platform scope. Trade-specific reads and writes
also enforce the active Journal account. Mutations require the opaque expected
selection reference so stale tabs fail with a conflict.

Raw-delivery and raw-link admin routes remain disabled unless a separate local
debug flag is explicitly enabled. Even then, they require the local Platform
boundary and never participate in ordinary dashboard rendering.

## Verification and write order

Before changing the real database:

1. extend the migration namespace and static manifest;
2. implement the two migrations, repositories and service boundaries;
3. prove bounded parsing, server-only provider configuration, strict
   acceptance/quarantine, immutable digest checks and idempotency;
4. prove account isolation, server-derived trade facts, stale-selection and
   stale-round-trip-version rejection;
5. prove facts-only responses contain no raw payload or prohibited coaching/P&L
   language;
6. run focused TypeScript, lint and one-worker tests only;
7. create and restore-verify a real pre-migration online backup;
8. apply 0010 and 0011 to a disposable copy and verify all old counts/digests;
9. create and restore-verify the disposable post-migration database; and
10. only then apply 0010 and 0011 to the real replacement database and confirm
    all four new tables are empty.

No fixture delivery, legacy link, saved trade, tag, rule, note, V3 row, provider
request or statement data is copied during E4. Port 3010 stays off until the
later integrated visual checkpoint. Broad suites, the production build,
browser/E2E, Git staging, commit, push and deployment remain deferred.

## Stop conditions

Stop the affected write if the active account cannot be derived, the stable
round trip does not resolve exactly, the provider configuration is absent or
invalid, the body exceeds its bound, a digest or strict contract fails, a
delivery is quarantined, the round-trip version changes during the command, a
schema/count/hash gate differs unexpectedly, or another task begins overlapping
writes.

## Completed implementation evidence

The accepted contract is implemented without copying a legacy delivery,
fixture, link, saved trade, tag, rule or note. Migration
`0010_level_analysis_deliveries` has checksum
`88e1f5cc1e180c1ed0774358d2efb4cf0e8565779cdd5c9790d9b6ef2cba6e52`;
migration `0011_journal_level_analysis_links` has checksum
`b8cc72242ebd7544ec29ca11ca0946a5eb16e9301652f4cc0cdab174b54473af`.
The resulting authoritative schema digest is
`c359134536e2583277efdb13199587e8b65084d4f73ed74fdb1a4d97b97d8bd4`.

Before the real write, the nine-migration database was backed up online at
`C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\backups\phase-5-slice-e4-20260802T125304Z\development-pre-level-analysis.sqlite`
and independently restored beneath the matching `restore-verification`
directory. The backup and restore are byte-identical with SHA-256
`659b152a57a54ba6eb3a882a348d04d450668a39591febe5ec4ab7fb419885b3`.
The disposable 11-migration result and its post-migration backup/restore also
passed exact registry, count, schema, geometry, recovery-authority and
integrity checks; that backup/restore pair has SHA-256
`af41e9cf9f5a86e0bce11df88ccc0ef646ec3bb02356edb87c7b3c25b35a55a1`.

The real replacement database now has 11 migration rows, 48 domain tables and
49 total application tables. It is 11,087,872 bytes with main-file SHA-256
`7c81fabba5fa4eac106cd7c4238011ac49ea8170f197bb9ad5408ac9fbdb00d0`.
All four E4 tables remain empty, every one of the 44 earlier domain-table
counts is unchanged, and foreign keys, `quick_check` and `integrity_check`
pass. The complete Phase 5 read models still reconcile 331 ready-closed round
trips, zero legitimate-open round trips and two contained Data Decisions.
Analytics Lab still exposes 210 capabilities: 181 available or conditional
and 29 explicitly unavailable.

Focused TypeScript, lint, the 78-file active V3-free verifier, six focused
files/30 one-worker tests, disposable migration/restore proof, real Level
Analysis reconciliation and the independent read-model/Analytics Lab proofs
pass. No provider delivery was ingested, no private symbol was sent to a
provider, ports 3000/3010/3011 remain off, and no commit, push or deployment
occurred.
