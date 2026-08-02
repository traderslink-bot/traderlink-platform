# Phase 6 - Replacement Acceptance Plan

**Status:** Local execution accepted on 2026-08-02; external launch gates remain
**Scope:** local integrated acceptance and external-launch rehearsal only
**Progress:** [Phase 6 Replacement Acceptance Progress](phase-6-replacement-acceptance-progress.md)
**Report:** [Phase 6 Replacement Acceptance Report](phase-6-replacement-acceptance-report.md)

## Outcome

Prove that the complete TraderLink Platform replacement works as one coherent
product without ordinary V3 runtime authority, silent data loss, private-data
leakage or ambiguous ownership. Phase 6 verifies the exact candidate already
implemented in `traderlink-platform`; it is not a redesign phase and does not
authorize production transfer, deployment, DNS changes, Git push or legacy
retirement.

The owner-approved light Material dashboard remains the visual baseline.
Dashboard financial displays use at most two decimal places while persisted
broker/source values remain lossless. Legacy executions, saved trades, tags,
rules and notes are rejected test data and are not recovery inputs. New
annotations must still persist under the correct Platform user, selected
user-defined Journal account, stable trading day and stable round trip.

## Controlling target inventory

The complete [Product Inventory](product-inventory.md),
[Route Ownership](route-ownership.md), [Migration Register](migration-register.md),
[Module Contracts](module-contracts.md), [Acceptance Inventory](acceptance-inventory.md)
and [Hosted Beta Runbook](traderlink-platform-hosted-beta-runbook.md) control
this gate. A passing subset cannot hide a failing or omitted listed surface.

### All 24 dashboard routes

`/workspace`, `/calendar`, `/trade-tracker`,
`/trade-tracker/[sessionDate]`, `/trades`, `/trades/roundtrips`,
`/trades/ticker`, `/trades/open`, `/trades/candle-review`,
`/trades/day-sessions`, `/trades/day-session/[sessionDate]`, `/analytics`,
`/analytics/performance`, `/analytics/results`, `/analytics/timing`,
`/analytics/execution`, `/analytics/lab`,
`/analytics/lab/trade-candle-analysis`, `/charts`, `/reflection-loop`,
`/rules`, `/imports`, `/manual-entry` and `/data-decisions`.

### All 20 Platform and peer-module routes

`/`, `/account`, `/platform-readiness`, `/academy`, `/academy/[...slug]`,
`/academy/courses/[courseId]`, `/academy/paths/[pathId]`, `/news`,
`/news/[ticker]`, `/news/[ticker]/[slug]`, `/news/free/[ticker]/[slug]`,
`/watchlist`, `/watchlist/[symbol]`, `/watchlist/archive`,
`/watchlist/archive/[archiveId]`, `/watchlist/how-it-works`,
`/filtered-news-momentum-scanner-access`, `/small-cap-stocks/week-ahead`,
`/small-cap-stocks/week-ahead/[slug]` and
`/smokeys-12-week-market-structure-plan`.

### Legacy compatibility and HTTP boundaries

- All 52 preserved `/intelligence` pages must match the exact F5 disposition:
  44 canonical redirects, two compatibility redirects, five operations-only
  redirects and one owner-rejected test surface. No destination returns to
  `/intelligence` or enters the V3 layout.
- All 61 inventoried Route Handlers and the Analytics Lab Server Action retain
  their exact preserve/replace/compatibility/operations disposition. Active
  product handlers use Platform/Journal/Journal Analytics/Academy/Watchlist/
  News/Affiliate/Level Analysis/Coach services, never V3 ownership.
- The dashboard shell, navigation, account selector, account page and
  readiness page remain inside the approved shared Material layout.

### Data and module boundaries

- Platform: stable users/workspaces/memberships, user-defined Journal accounts,
  guarded loopback identity, hashed public sessions, exact Discord identity and
  current bounded membership.
- Journal: broker-neutral import/mapping/support packages, immutable source
  evidence, canonical broker/manual executions, Data Decisions, deterministic
  zero-to-zero round trips, Trade Tracker, Calendar, Rules, tags and notes.
- Journal Analytics: all 210 registered capabilities, exact coverage, saved
  views, supported dashboard pages and no sample/guessed/V3 fallback.
- Level Analysis/Candle Review: immutable normalized market facts, provider
  deliveries, account-scoped round-trip links and explicit unavailable states.
- Academy, Watchlist, News and Affiliate: named migrations, stable Platform
  identity, one physical SQLite store in the accepted hosted beta, and exact
  authorized transfer/reconciliation contracts.
- Coach/Review: published factual inputs plus explicitly trader-authored
  annotations; no invented trader motive.

The current local database target is 18 applied migrations, 61 domain tables
plus `platform_schema_migrations`, schema digest
`7306385ce32329abe73a41fc3ec630c28dc4df7efaaad975b55f8f719dcdf4be`,
331 ready closed round trips, zero automatically legitimate-open round trips
and two contained Data Decisions. Public sessions, Discord memberships and
hosted-transfer events remain empty until their explicit external operations.

## Verification order

### Gate 0 - Immutable starting evidence

1. Record branch/HEAD/status and prove ports 3000, 3010 and 3011 are free.
2. Record available memory and largest processes without stopping the Codex
   application itself.
3. Read-only verify the real database, its migration/schema/count/integrity
   state, main-file SHA-256 and WAL size. Stop if it differs from the accepted
   F6 checkpoint.
4. Confirm no private statement, database, sidecar, evidence artifact, OAuth
   subject/token, session token or HMAC material is tracked or added to the
   image/package inputs.

### Gate 1 - Static architecture and contracts

Run sequentially:

1. formatting/whitespace and local-document-link checks;
2. migration-file/schema-manifest verification;
3. active replacement/V3-free file-boundary verification;
4. Academy registry/slug preservation;
5. configuration, route-disposition, hosted readiness and privacy guards; and
6. dependency-scoped then full TypeScript and ESLint.

Every failure is corrected at its owning module. Do not weaken or delete a
guard merely to make it pass.

### Gate 2 - Focused behavior regression

Run Vitest with one worker and file parallelism disabled. Use sequential module
batches so Windows memory can recover between processes:

1. Platform database, ownership, account selection, sessions, Discord/public
   identity, readiness, backup and hosted transfer.
2. Journal accounts, imports/mapping/support packages, manual executions, Data
   Decisions, rebuilds, product reads and annotations.
3. Journal Analytics registry/read models/saved views, Candle Review, Level
   Analysis and Coach/Reflection.
4. Academy, Watchlist, News, Affiliate and legacy-route disposition.
5. Remaining repository regression and architecture suites.

No test may write the real database. Database-writing tests use unique
disposable private-data directories and delete nothing outside their own exact
targets. A pre-application `uv_os_get_passwd ... ENOMEM` may use the accepted
command-local Node fallback. Product failures are not retried away.

### Gate 3 - Build and packaged runtime

1. Run the protected Academy registry check and full production build.
2. Inspect the standalone and Docker build contexts for excluded private data.
3. Rehearse the standalone server against a disposable verified database and
   production-like `/data` directory contract.
4. Rehearse missing-volume, wrong-path, pending-migration and schema-drift
   failures; each must stop safely with no private error output.
5. If Docker is available, build and run the exact image at one replica and
   prove the health contract. If Docker is unavailable, record that external
   environment gate honestly; do not claim it passed.

### Gate 4 - Integrated browser and API acceptance

Start one protected replacement server from the exact repository/branch on a
declared port. Use the real replacement database read-only for factual page
checks; use disposable copies for mutations.

Verify:

- all concrete canonical routes above return the expected content/redirect,
  no framework overlay, no console/page error and no failed private request;
- all 52 legacy routes follow their typed F5 disposition;
- Workspace, Trades, Analytics, Calendar, Trade Tracker, Rules, Imports and
  Data Decisions show correct factual/coverage states and at-most-two-decimal
  display values;
- switching between two disposable user-defined Journal accounts changes all
  account-scoped reads, and a stale tab cannot write into the newly selected
  account;
- one disposable mapped import, one manual Day/Swing execution batch, one
  contained Data Decision and one annotation flow persist and rebuild exactly;
- daily notes/rule reviews attach to the chosen trading day; trade tags/notes
  attach to the stable round trip and survive deterministic reconstruction;
- guarded local review requires no Discord login, while production-profile
  requests cannot use the local assertion;
- Academy progress follows Platform user, Watchlist Premium follows current
  Discord membership, publisher endpoints remain separate, and News/Affiliate
  never become Journal-account scoped; and
- responses, logs, HTML and client bundles expose no database path, private
  statement content, broker identifier, internal UUID, OAuth/session token,
  Discord subject or HMAC material.

The server is stopped after this gate unless the owner is actively reviewing.

### Gate 5 - Recovery and launch rehearsal

1. With no writer and zero WAL, create a final online backup and independent
   restore of the real candidate database. Prove exact registry, schema digest,
   table counts, integrity and recovery-authority evidence.
2. Run a read-only hosted-source preview only when the four source credentials
   and fresh source backups are available. Missing credentials remain an
   external gate, not a fabricated pass.
3. Rehearse but do not execute the initial-owner link, hosted transfer, Railway
   upload/deploy or DNS steps. Validate the authority-file and rollback
   contracts using disposable data.
4. Produce one privacy-safe final acceptance report separating locally passed,
   externally pending and owner-visual items.

## Resource policy

- Run only one Node/test/build process at a time.
- Vitest always uses one worker and disabled file parallelism.
- Check available memory between batches. Stop the owned TraderLink server and
  disposable helpers when not needed; never stop the active Codex application.
- Do not repeat a completed expensive check unless code in its scope changed.
- If memory exhaustion occurs before project code loads, record it separately,
  free owned resources and resume once. Repeated product-process exhaustion is
  a real gate to diagnose, not a reason to omit the check.

## Stop conditions

Stop the affected gate if branch/HEAD or overlapping working files change,
the real database/hash/count/schema changes unexpectedly, the WAL is non-empty
before backup/hash authority, a test touches real/private data unexpectedly,
owner/account scope is browser-selectable or ambiguous, valid unrelated facts
disappear because of one contained decision, a private value reaches output,
or the hosted topology would create more than one SQLite writer.

## Acceptance and exclusions

Phase 6 local acceptance requires Gates 0-5 to pass or to be explicitly marked
as external-only with evidence that the local contract is ready. It does not
authorize:

- real initial-owner Discord linking;
- production Academy/Watchlist/News/Affiliate transfer;
- Railway project/billing/volume/secret/domain creation;
- Git stage, commit, push, PR or merge;
- production deployment or DNS cutover; or
- deletion of either repository, legacy database, old hosted store or backup.

Those actions occur only through the Hosted Beta Runbook after the local
candidate is accepted. Phase 7 legacy retirement remains a later explicit
owner decision.
