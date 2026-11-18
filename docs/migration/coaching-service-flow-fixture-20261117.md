# Coaching service-flow fixture checkpoint — November 17, 2026

Assigned parent: `46f1c57356b37e7aeb990f47d13fddc07794e54a`.
Scope: test fixture only; runtime, schema, migrations and product behavior unchanged.

The combined 203-entry schema was rebuilt in memory for every case. An instrumented baseline measured 4507 ms in schema initialization alone and 4533 ms for the simplest case. An unmodified lifecycle case reproduced the default 5000 ms timeout at 5129 ms. The baseline reproduction was stopped after establishing the issue; the Coordinator holds the complete failing combined regression log.

The fixture now builds the full manifest once in `beforeAll`, checks SQLite quick-check and foreign-key integrity, serializes the pristine schema, and opens an independent writable in-memory database from that buffer for every case. Each case enables and checks foreign keys and verifies the exact migration-seeded user population, preventing previous test users from leaking between cases. Migration-owned system users are retained. Every per-case database is closed by the existing cleanup. No timeout was raised and all original 31 behavior assertions/cases remain intact.

Validation: all 31 cases passed in 8.88 seconds total (6.54 seconds test/hook time), including scheduled/request deadlines, early submission, trade and trading-day replacement, touched-trade draft locks, request limits, consent, grant revocation and retained history. Focused ESLint and `git diff --check` passed. Command: `npx vitest run src/modules/communities/contracts/coaching-service-flow.test.ts --maxWorkers=1 --no-file-parallelism --reporter=verbose`.

No UI or Help content changed. Browser/staging acceptance remains separate and pending the Coordinator’s exact isolated staging handoff. No hosted data or Discord effects occurred. The pre-existing untracked `node_modules-test-cache/` remains untouched.
