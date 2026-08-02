# Phase 6 - Replacement Acceptance Progress

**Status:** Local acceptance complete on 2026-08-02. Hosted source transfer,
Discord owner linking, Docker image execution, Git publication, Railway
deployment and DNS remain explicit external operations; none was fabricated or
executed.
**Plan:** [Phase 6 Replacement Acceptance Plan](phase-6-replacement-acceptance-plan.md)

## Starting boundary

- Repository: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
- Branch: `codex/traderlink-platform-replacement`
- Starting HEAD: `84e9ef2289ed3070ce6a3b046cccfe5f4a99e2b4`
- Ports 3000, 3010 and 3011: no listener at Phase 6 entry
- Real database: 18 migrations, 61 domain tables plus registry, schema digest
  `7306385ce32329abe73a41fc3ec630c28dc4df7efaaad975b55f8f719dcdf4be`,
  size 11,304,960 bytes and main-file SHA-256
  `bcbd40986840e1afb6cd169ea6a26f0ffbb8db9a8b367bc5acd971a7b4430664`
- Public sessions, Discord memberships and hosted-transfer events: zero
- Git staging, push, deployment and production mutation: none
- Available physical memory at entry: approximately 1,449 MB; all Node work is
  therefore sequential and Vitest is restricted to one worker.

## Gate record

| Gate | State | Evidence |
| --- | --- | --- |
| 0. Immutable starting evidence | Complete | Ports are free; real database read-only verification passed with unchanged accepted size/hash/schema/counts/integrity; tracked/private-data and package-input boundaries pass |
| 1. Static architecture and contracts | Complete | Academy registry, full TypeScript, ESLint, all 18 migration files, 146-file active replacement guard, hosted readiness, documentation links and whitespace pass |
| 2. Focused behavior regression | Complete | Changed/new, untouched-module, shared, Trader Analytics and legacy-compatibility suites passed sequentially with one worker; intentional environment-only skips are recorded below |
| 3. Build and packaged runtime | Locally complete | Final Next.js 16.2.6 production build compiled, type-checked and generated all 126 pages; standalone privacy/size inspection passed. Docker is not installed and remains an external image-run gate |
| 4. Integrated browser and API | Complete | Core routes, all 52 legacy dispositions, two-account isolation, exact manual/import/Data Decisions behavior, visible two-decimal formatting and privacy checks passed on a disposable database; port 3010 is off and the disposable environment was removed |
| 5. Recovery and launch rehearsal | Locally complete | Final real-database online backup and independent restore passed; disposable owner-link and four-module hosted-transfer/rollback contracts passed. Real hosted preview is externally pending because 0/4 source credentials and no reviewed fresh source backups are available |

## Preserved data decision

Legacy trades, executions, tags, rules and notes are disposable test data and
are not migration inputs. New Journal annotation behavior remains mandatory:
records must be owned by the correct Platform user and selected user-defined
Journal account and must retain their stable trading-day or round-trip target
through rebuilds.

## Changes and failures

- The Phase 5 readiness verifier still contained literal 17-migration/60-domain
  expectations after migration 0018. It now derives expected migration and
  table counts from the authoritative manifest. The corrected verifier passes
  against the real database.
- An initial direct database-verifier call omitted its required explicit
  profile and safely failed with `TRADERLINK_VERIFIER_ARGUMENT_INVALID`; the
  corrected `--verify-current` invocation passed. No database changed.
- The private Journal automation file initially reported six five-second test
  timeouts. Its synchronous full-database fixtures continued to completion, so
  the file was rerun alone with a three-minute per-test allowance. All eight
  import, exact-reimport, rollback, corruption, privacy and retained-authority
  cases passed in 272.57 seconds. Normal suites retain the default timeout.
- A Coach route suite could not initialize because its Vitest factory referred
  to non-hoisted mocks. The test now uses `vi.hoisted`; both route checks pass.
- The Affiliate test fixture inserted incomplete rows into the strict
  `platform_users` schema. The disposable fixture now supplies required test
  identity, display, status and UTC fields; its persistence/isolation check
  passes.
- Changed/new behavior verification covered 42 files, 206 passed tests and one
  intentional environment-dependent skip. Platform, Journal, Analytics, Level
  Analysis, Coach, Academy, Watchlist, News and Affiliate batches are green
  with one worker and file parallelism disabled.
- Untouched module/script regression covered 20 files and 155 tests. The shared
  regression groups passed 49 files/378 tests and 73 files/754 tests. Trader
  Analytics passed 41 files/299 tests. The preserved V3 compatibility suites
  passed 28 files/447 tests and 39 nested files/360 tests, with four intentional
  environment-dependent skips.
- A frozen Next.js redirect array caused the build to mutate immutable state.
  The configuration now returns mutable copies. The final production build
  compiled without Turbopack warnings, completed TypeScript, and generated all
  126 pages. The Academy registry also passed; its expected informational
  warning identifies 19 non-Academy archive/draft Markdown files.
- Final TypeScript and ESLint passed. ESLint retains the existing 18 warnings
  and reports zero errors. The 146-file active-replacement/V3-free guard, all
  18 migration files and all 52 legacy route dispositions pass.
- Docker is not installed on this computer, so the Docker image build/run is
  accurately retained as an external gate. The standalone package was inspected
  at approximately 67.18 MB/4,023 files and contains no database, sidecar,
  private statement, environment file, raw log or local fallback helper.

## Integrated product corrections

- The two user-defined Journal accounts were exercised independently. Account
  selection is opaque and stale-safe. A Journal account is not a broker
  account: one selected account may contain statements and executions from
  multiple brokers, while source-account identities remain provenance beneath
  that account. Manual and broker executions enter the same canonical ledger.
- Manual swing entry exposed a strictness gap: a trader could declare swing
  intent but could not confirm the exact still-open position. The contained
  `closing_position_unconfirmed` decision now accepts only an exact current,
  open or closing position fact for the matching account/instrument/currency.
  Swing intent alone never certifies a financial fact.
- Repeated manual submissions on one trading day created duplicate coverage
  questions. One exact day/timezone coverage confirmation now resolves every
  pending manual-coverage decision for that selected account and day, while
  leaving other accounts and dates untouched.
- A broker-neutral mapping loop was proved with a synthetic unknown CSV:
  mapping-required response, privacy-safe support package, successful manual
  mapping, saved exact-template reuse, and changed-structure re-review all
  behaved correctly. The package excludes raw rows/values, original filename
  and source path. IBKR remains the first verified adapter, not the product
  identity or fallback label.
- The private IBKR statement was reimported only into a disposable database.
  It returned `already_imported`, created zero executions and preserved the
  existing facts. The real database and original statement were not changed.
- Workspace Calendar now reads the same account-scoped Journal calendar model
  as Calendar and links completed days to their Trade Tracker session. The
  former hard-coded unavailable card is gone.
- Browser/API checks passed for the primary dashboard routes and a second
  account. The second account's synthetic swing, trade tag, trade note, daily
  note and rule were visible only in that account. The exact four-decimal
  position remained lossless internally and was not rendered with more than
  two decimal places. No console errors occurred.
- Privacy scanning found no raw broker identifier, local user path,
  `private-data` path, SQLite path, access-denied message or unhandled server
  failure in the checked route responses or server logs.
- Data Decisions closeout now carries opaque import-batch associations in its
  account-scoped read model. Import history links directly to the matching
  filtered queue, each decision previews exact evidence counts/affected chain
  and downstream surfaces without guessing post-save P/L, and pending/resolved
  records link to affected trades, trading day and analytics. Two focused files
  passed 34/34 tests with one worker; TypeScript, targeted lint, the final
  126-page production rebuild and a live read-only route/browser check passed
  with zero console errors and no displayed opaque import identifier.

## Final recovery and preserved state

- Final checkpoint timestamp: `phase-6-final-20260802T204523Z`.
- Source main file: 11,304,960 bytes, SHA-256
  `bcbd40986840e1afb6cd169ea6a26f0ffbb8db9a8b367bc5acd971a7b4430664`.
- Online backup:
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\backups\phase-6-final-20260802T204523Z\development-final.sqlite`.
- Independent restore:
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\restore-verification\phase-6-final-20260802T204523Z\development-restored.sqlite`.
- Backup and restored file are byte-identical at 11,304,960 bytes and SHA-256
  `f4226cc97734c20cf24d76ec7b2d45df063851fc4dfa8d0762cc69d57674eea2`.
  Registry, 18 migrations, schema digest, all 62 table counts, page geometry,
  foreign keys, quick/integrity checks and recovery-key authority match.
- The source main-file hash and size remained unchanged after backup and every
  disposable rehearsal; its WAL is zero bytes. Port 3010 is off. The Phase 6
  browser database, evidence copy, staging roots, server logs and hosted-
  transfer rehearsal directory were removed after verification.
- Disposable public-identity rehearsal proved ordinary login cannot claim the
  owner, the linked Discord identity reuses the one owner/workspace/account,
  raw session tokens are not stored, and revoked sessions fail closed.
- Disposable hosted-transfer rehearsal reconciled all four modules, recorded
  eight transfer events and produced an idempotent empty second preview.
- Zero of the four real hosted-source credentials are configured, and reviewed
  fresh source backups are unavailable. No real source preview, Discord link,
  transfer, Railway operation, DNS change, Git stage/commit/push or deployment
  occurred.

## Acceptance boundary

The local replacement candidate satisfies Phase 6. The user has already
approved the light Material dashboard design and deferred further visual
review until the application is more complete. External launch operations
remain controlled by the hosted beta runbook. Phase 7 may document legacy
retirement readiness, but no repository, database, backup or preserved source
may be deleted without the user's explicit approval.
