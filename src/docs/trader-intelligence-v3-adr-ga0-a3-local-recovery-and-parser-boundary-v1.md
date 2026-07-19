# ADR: GA0-A3 Local Recovery and Parser Boundary v1

Date: 2026-07-18
Status: implementation candidate; independent acceptance required
Branch: `agent/trader-intelligence-v3-ga0-a3-manifests`

## Decision

Local SQLite backup uses the `better-sqlite3` backup API rather than copying the
main database file. This captures a SQLite-consistent image when WAL mode is
active. Backup and restore require explicit absolute source and destination
paths, reject same-path and unsafe overwrite operations, and reject repository
and operating-system temporary paths for real owner data. Synthetic tests may
use an explicit temporary-path exception.

Restore writes to a new isolated destination, runs `PRAGMA integrity_check`,
and compares representative canonical execution, dataset-manifest,
analysis-snapshot, and exact-reconstruction digests. The restore-test record is
content addressed and contains no database path, account identifier, or raw
execution value.

The current database is not encrypted by this implementation. Real owner
backups must be stored on owner-controlled encrypted storage, such as an
encrypted volume or encrypted backup destination. No claim of database-level
or backup-file encryption is permitted.

CSV hardening remains a narrow ingress contract. It rejects duplicate raw and
normalized headers, mapping collisions, unclosed quotes, inconsistent
execution-row widths, unsupported encodings, controls, oversized cells,
ambiguous delimiters, and conflicting duplicate execution IDs. Sectioned
broker reports retain preambles and non-execution sections; fail-closed width
checks apply to the execution section that can affect canonical truth.

## Consequences

The legacy parser remains non-authoritative and still uses legacy numeric
representations after ingress. This decision fixes severe ambiguity and silent
header overwrite paths only; it does not create a broker API, parser rewrite,
production migration, encryption implementation, background backup job, or
hosted recovery service.
