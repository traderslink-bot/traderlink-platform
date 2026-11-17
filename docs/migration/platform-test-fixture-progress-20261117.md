# Current-schema test fixture repair — November 17, 2026

Assigned test-only parent: `9eaad45268a6c9b877971f65aa8fd6fcf56220ca`. Runtime source, SQL, schemas, native dependencies and business policy remain unchanged by this batch. Coordinator owns runtime compatibility repairs and staging/publication.

The complete explicit test usage inventory is [platform-test-fixture-inventory-20261117.json](platform-test-fixture-inventory-20261117.json). It classifies all 80 test files mentioning the runner or manifest: 58 ordinary full-schema fixture consumers, five deliberate historical prefixes, 15 migration/upgrade or separately qualified cached fixtures, and two metadata/already-cached consumers. Partial schemas, signed erasure fixtures and actual migration SQL are not replaced by a full-schema mock.

## Consolidated discovery and correction

The Coordinator's bounded full-suite discovery was interrupted at 30 minutes, with 18 completed failing files / 144 reported failed cases; it was never a full pass. Full migration setup costs around six seconds, exceeding ordinary five-second test budgets before behavior checks can finish.

Global setup now executes the actual canonical full migration runner once, verifies completed schema, and provides an in-memory serialized pristine database. Its source descriptor vector, SQLite version, serialized-byte hash and schema digest are bound to the current manifest. No snapshot/cache file or hosted database is used. Process lifetime owns the bytes, so normal exit, failure and cancellation retain no filesystem cache to clean. Each test gets an independent `Buffer.from`/SQLite copy. Disk fixtures exclusively create private temporary files and continue through the normal path, WAL, synchronous and foreign-key initializer checks. Existing files, hosted paths and symlinked parents are refused. Requested fixture-time registry metadata is normalized only in ordinary clones at the original setup statement position; signed/profile/migration-fidelity fixtures retain their original runners.

All original assertion expressions were byte-for-expression unchanged in the initial 58-file conversion. The first full consumer retest reported 50 files passing, eight failing with 20 non-timeout failures, and an OOM in the new helper test's large Buffer deep matcher. That matcher now compares SHA-256 digests. The 20 failures exposed the legitimate canonical migration-0205 reserved principal rather than fixture timing:

- Thirteen count-related cases now retain their original expected created-person counts while asserting the entire actual reserved seed tuple remains unchanged and has no auth/workspace links. Every other row counts, including an unknown erasure principal. No baseline data is deleted, broadly filtered or silently granted access.
- Six development-owner bootstrap cases and one admin-list case remain unchanged as real runtime compatibility checks. Coordinator assigned these to Core; they are not waived by this test batch.
- The real migration registry test now explicitly expects exactly the canonical reserved seed with its full seven-field tuple and no auth/workspace links. All original expectations for every other managed table remain unchanged. Coordinator explicitly approved this truthful contract correction.

An independent actual-SQL probe ran the unchanged Platform and Journal migration suites with a temporary diagnostic 20-second budget: 20 of 21 cases passed including all seven helper checks; the single remaining failure was the reserved seed's population expectation. Actual full-SQL cases measured 5438–7117 ms. Fourteen named cases that execute the full canonical migration path now have documented 15-second budgets; negative SQL rollback, duplicate-ID and small-prefix cases keep the normal default. No global timeout, skip, migration mock, SQL/checksum/schema rewrite or test exclusion is added.

## Verification checkpoint

The original incomplete consumer run and helper recovery are discovery evidence, not final acceptance. The corrected coherent qualification passed all 11 selected files / 51 cases in 116.49 seconds, using normal five-second defaults and only the 14 explicitly named real-SQL budgets. It covered all nine helper guards, the six counter-adapted fixture files and four faithful migration files without a CLI timeout override. The JSON records exact inventories, assertion vectors, adaptations, measured case budgets and logs. Focused ESLint and diff checks passed. Unexcluded full-project TypeScript (`npx tsc --noEmit --incremental false --pretty false`, 4 GiB V8) passed with zero diagnostics; its owned QA locks were released. Full coherent retest awaits Core's runtime repair; normal defaults must be used in that retest rather than the diagnostic CLI override. The overall repository-wide suite and browser/staging acceptance remain separate Coordinator checkpoints.

All heavy QA acquires the shared exclusive owner record and common flock, checks current resources, and releases only the owning inode/child process group. No preview was started, no hosted account created and no Discord write/send occurred.

No UI or Help content changed; no corresponding guide update is required.
