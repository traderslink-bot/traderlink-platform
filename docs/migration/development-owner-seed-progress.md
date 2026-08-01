# Development Owner Seed Progress

**Prepared:** 2026-08-01

**Status:** Complete. Local-only implementation, focused verification, backup, preview, atomic seed, independent post-write verification, and delegated technical acceptance all passed.

**Controlling contract:** [Replacement Database Schema and Migrations - Development owner seed](replacement-database-schema-and-migrations.md#11-development-owner-seed-and-deferred-public-login)

## Purpose and boundary

Phases 3 through 5 need stable user, workspace, membership, and Journal account
UUIDs even though the public dashboard login is intentionally deferred until the
complete dashboard is preparing to go live. This checkpoint creates that internal
development ownership boundary without exposing authentication or copying trading
data.

The operation is server-only and local-only. It adds no route, UI, OAuth/session
flow, Discord handler, email/password flow, source-account identity, broker account
number, import, execution, or legacy row. It cannot run when Node or Vercel reports
a production environment.

Before execution, the accepted Phase 2 `development.sqlite` remained 94,208 bytes with SHA-256
`426DA6848F9FC8D65C20B239D9F2949133ABAB5CD745FE38014AE4035549CF1B`,
exactly two migration rows, and all five domain tables empty throughout preparation
and review.

## Prepared operation

1. `authorizeDevelopmentOwnerSeed` requires the explicit process-local flag
   `TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_OWNER_SEED=1` and rejects production.
2. `previewDevelopmentOwnerSeed` verifies the completed manifest, schema digest,
   pragmas, migration history, and all five zero-row domain tables before issuing a
   five-minute HMAC confirmation token bound to the exact proposed values.
3. The only accepted confirmation action is
   `confirm_development_owner_seed`. Changed facts, action, expiry, schema, or
   migration history invalidate the token.
4. `confirmDevelopmentOwnerSeed` repeats every precondition inside one
   `BEGIN IMMEDIATE` transaction, then creates exactly one active user, workspace,
   owner membership, and Journal account. Any failure rolls back every row.
5. The temporary internal identity is `development_local`; its subject is never
   returned in evidence. No source-account identity is created.
6. A rerun fails closed. Verification evidence contains only completion time,
   exact row counts, and schema/migration digests with all identifiers redacted.

The coordinating technical auditor may use non-sensitive development labels plus
the accepted account defaults `America/New_York` and `USD`. No personal owner fact
or login session is required.

## Public login decision

Public dashboard login and account-management UI are deferred until the whole
dashboard is preparing to go live. Discord is the first intended login provider.
Email/password remains optional future work. The unfinished recent account beta is
preserved at local commit `5305ee29a61ab44fa6238e2b4725957ad1917fe6` for
selective reconciliation, not bulk merge. Later authentication migrations must
attach public identities while preserving the stable user/workspace/account UUIDs
used by Journal facts.

## Implementation paths

- `src/modules/platform/server/bootstrap/development-owner-seed-authorization.ts`
- `src/modules/platform/server/bootstrap/development-owner-seed-confirmation.ts`
- `src/modules/platform/server/bootstrap/seed-development-owner.ts`
- `src/modules/platform/server/bootstrap/development-owner-seed-authorization.test.ts`
- `src/modules/platform/server/bootstrap/development-owner-seed-confirmation.test.ts`
- `src/modules/platform/server/bootstrap/seed-development-owner.test.ts`
- `src/modules/platform/server/identity/platform-workspace-repository.ts`
- `src/modules/platform/server/database/platform-migration-contract.ts`
- `src/scripts/verify-traderlink-platform-development-owner-seed-files.ts`
- `src/scripts/seed-traderlink-platform-development-owner.ts`

## Focused verification

Only these checks run in this preparation checkpoint:

- `git diff --check`;
- the focused development-seed static file verifier; and
- the three development-seed Vitest files with one worker and file parallelism
  disabled.

Broad lint, full-project TypeScript, full regression, build, browser/E2E, and
CI-equivalent checks remain deferred to final replacement acceptance.

### Verification result

- `git diff --check`: passed.
- Static verifier: passed with three production files and three test files.
- Focused Vitest: 3 files passed, 11 tests passed, one worker, file parallelism
  disabled.
- Real database after checks: 94,208 bytes, last-write time unchanged, SHA-256
  `426DA6848F9FC8D65C20B239D9F2949133ABAB5CD745FE38014AE4035549CF1B`.
- No public login, database row, process, server, dependency, package file, push,
  deployment, or private data changed.

## Execution and independent verification result

- Pre-write backup:
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\backups\pre-development-owner-seed-20260801T104212Z\development-empty.sqlite`;
  94,208 bytes; SHA-256
  `426DA6848F9FC8D65C20B239D9F2949133ABAB5CD745FE38014AE4035549CF1B`.
- Preview at `2026-08-01T10:49:38.775Z`: all five domain tables zero;
  expected and actual schema SHA-256
  `5a34f790164e9b8456db88a1052a9b9084bbfbeab4eae8c5eee1f49d5c7194c4`.
- Atomic completion at `2026-08-01T10:50:30.646Z`: exactly 1 active user,
  1 workspace, 1 owner membership, 1 Journal account, and 0 source-account
  identities; identifiers redacted.
- Independent verification at `2026-08-01T10:58:10.082Z`: exact relationships,
  row counts, schema digest, migration-history digest, foreign keys, and quick
  check passed.
- Post-seed main database: 94,208 bytes; SHA-256
  `2497FA605828C9392233F712062CC9FBEDDAB0F2B5E2078AB1A0146494A99C26`;
  no sidecars observed after the closed verification connection.
- No public login, Discord route, email/password flow, broker source identity,
  import, execution, private statement value, push, deployment, or production
  state was added or changed.

## Stop boundary

The coordinating technical auditor accepted the implementation and exact database
evidence. Phase 3 Journal integrity is unblocked and must create its own tracker
before implementation. No push, deployment, production login, legacy database
mutation, or legacy retirement is authorized by this completed checkpoint.
