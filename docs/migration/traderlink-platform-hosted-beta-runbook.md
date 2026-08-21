# TraderLink Platform Hosted Beta Runbook

**Status:** local deployment package, production build, standalone inspection
and disposable launch/transfer rehearsals passed in Phase 6; Docker execution
and every real Railway, source-transfer, domain and deployment operation remain
external and unchanged

**Controlling contract:** [Phase 5 Slice F6 - Public Identity And Hosted Transfer](phase-5-slice-f6-public-identity-and-hosted-transfer-plan.md)

**Current release:** [Railway Free Discord Beta Launch Plan](railway-free-discord-beta-launch-plan.md)

**Owner actions:** [owners to do list before live launch](owners-to-do-list-before-live-launch.md)

## Purpose

Launch the accepted TraderLink Platform as one long-running Next.js Node
service with one SQLite writer and one persistent volume. This runbook is the
only supported hosted-beta layout. It does not authorize a deployment.

The local light Material dashboard remains the review baseline. Discord is the
first public login provider. Email/password remains deferred.

Legacy saved trades, executions, tags, rules and notes are disposable test data
and are not transferred. New Journal facts and annotations remain bound to the
stable Platform user, workspace, selected user-defined Journal account and
stable trading-day or round-trip identity.

## Fixed runtime topology

- Provider: Railway persistent service.
- Application replicas: exactly one.
- Volume count: exactly one, attached only to this service.
- Volume mount: `/data`.
- Application database: `/data/traderlink-platform.sqlite`.
- Immutable import evidence: `/data/evidence-vault`.
- Temporary upload staging: `/data/upload-staging`.
- Application checkpoint backups: `/data/backups`.
- Health check: `/api/platform/health`.
- Production bind: Railway-supplied `PORT` on `0.0.0.0`.
- Deployment overlap: zero seconds. A volume-backed SQLite service must never
  have two active writers.
- Drain window: 30 seconds.
- Restart policy: on failure, at most ten retries.
- App sleeping: disabled for the beta.

Railway mounts volumes only at runtime and currently does not allow replicas or
overlapping deployments for a volume-backed service. Its volume is root-owned;
the service therefore uses Railway's documented `RAILWAY_RUN_UID=0` override
so SQLite and the evidence directories remain writable. Revisit that provider
constraint before changing the runtime user.

Current provider references:

- [Railway volumes](https://docs.railway.com/volumes)
- [Railway volume constraints](https://docs.railway.com/volumes/reference)
- [Railway volume backups](https://docs.railway.com/volumes/backups)
- [Railway configuration as code](https://docs.railway.com/config-as-code/reference)
- [Railway Next.js guide](https://docs.railway.com/guides/nextjs)

## Image and startup boundary

The repository-root `Dockerfile` builds a Node 24 Debian-slim image, including
the native `better-sqlite3` dependency, and copies only the Next.js standalone
runtime, public assets and static assets into the final image. `.dockerignore`
excludes databases, sidecars, private statements, evidence, environment files,
logs, test artifacts and the discarded `v4-temp-sql` experiment.

`instrumentation.ts` performs the production startup gate before the Next.js
server is ready to handle requests. Startup fails when:

- production storage is not explicitly `sqlite_single_node`;
- the Railway volume is absent or not mounted at `/data`;
- any required protected path differs from the fixed layout;
- required directories are absent or not readable/writable;
- the database is absent, partial, has pending/unknown migrations, has a schema
  digest mismatch, fails foreign keys or fails SQLite `quick_check`.

Startup never creates, migrates, repairs or adopts the database. The health
route repeats the read-only completed-schema verification and returns only:

```json
{"status":"ready","migrationCount":18,"storage":"sqlite_single_node"}
```

Any failure returns HTTP 503 with `{"status":"unavailable"}`. It never returns
paths, hashes, counts of private records, identifiers or error internals.

## Required Railway variables

Enter values only in Railway's protected variable store. Never add a `.env`
file, secret value, provider subject or connection credential to Git.

### Runtime and protected storage

- `NODE_ENV`
- `TRADERLINK_PLATFORM_STORAGE_BACKEND`
- `TRADERLINK_PLATFORM_DB_PATH`
- `TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT`
- `TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT`
- `TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT`
- `TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON`
- `RAILWAY_RUN_UID`
- `NEXT_PUBLIC_TRADERLINK_PLATFORM_AI_LAUNCH_STATE`

Railway supplies `PORT` and `RAILWAY_VOLUME_MOUNT_PATH`. The application
requires the latter to resolve to `/data`.

The 2026-08-21 free Discord beta sets the AI launch state to `coming_soon`.
Railway-hosted OpenAI, Whop and AI Review schedule variables are deliberately
absent until a later owner-approved activation. This does not disable the
separate computer-run Press Release publisher: it uses its own local OpenAI
configuration and posts completed canonical articles through the protected
News publisher endpoint.

The protected-roots JSON contains only the absolute `/data/backups` path for
this topology. The evidence vault may share the `/data` volume but must not
contain the database, upload staging or backup directory.

### Stable account/source privacy keys

- `TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON`
- `TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION`
- `TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON`
- `TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION`

Each JSON map is versioned server-only key material. The active version must be
present in its corresponding map. Rotation adds a new version; it never edits
or removes a version referenced by persisted facts.

### Discord login and entitlement

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_GUILD_ID`
- `DISCORD_REDIRECT_URI`
- `DISCORD_INVITE_URL`
- `TRADERLINK_PLATFORM_INITIAL_OWNER_DISCORD_SUBJECT`
- `TRADERSLINK_PREMIUM_DISCORD_ROLE_ID`

The initial-owner Discord subject is used only by the explicit one-time owner
link command and by the ordinary-login protection that prevents the first
public login from claiming the private seeded owner. The subject and all role
IDs remain server-side facts.

### Publisher and public-content settings

- `TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN`
- `NEWS_PUBLISH_TOKEN`
- `NEWS_PUBLIC_BASE_URL`
- `TRADERSLINK_WHOP_PRODUCT_URL`

`FINNHUB_API_KEY`, analytics IDs and similar provider keys are optional until
their dependent feature is enabled. Publisher tokens are independent service
authority; a user session never grants publisher access.

### Variables prohibited in the single-node beta runtime

Do not configure legacy or alternate storage URLs such as
`ACADEMY_DATABASE_URL`, `LIVE_WATCHLIST_DATABASE_URL`, `NEWS_DATABASE_URL`,
`AFFILIATE_REFERRAL_DATABASE_URL`, `POSTGRES_URL` or a generic `DATABASE_URL`.
Do not configure V3 database, hosting, data-mode, owner or rules paths. The
retained Neon/V3 adapters are transfer/reference code, not runtime authority.

### Maintenance-only transfer inputs

The one-time transfer command reads its four source connections only from:

- `TRADERLINK_HOSTED_TRANSFER_ACADEMY_DATABASE_URL`
- `TRADERLINK_HOSTED_TRANSFER_WATCHLIST_DATABASE_URL`
- `TRADERLINK_HOSTED_TRANSFER_NEWS_DATABASE_URL`
- `TRADERLINK_HOSTED_TRANSFER_AFFILIATE_DATABASE_URL`

Execution also requires
`TRADERLINK_PLATFORM_HOSTED_TRANSFER_AUTHORITY_PATH`, which must name the
reviewed short-lived authorization file outside the repository. These five
settings belong only in the stopped-service maintenance environment. They are
never configured on the ordinary deployed service and are removed after the
post-transfer reconciliation and backup succeed. Preview uses
`npm run transfer:hosted:preview`; execution uses
`npm run transfer:hosted:execute` and fails closed unless the authorized
preview, current target hash, fresh target backup/restore, source snapshot
digests and source backup times still match.

## Pre-launch evidence gate

Complete these steps before creating a public deployment:

1. Finish Phase 6 focused, build, browser and privacy verification from the
   exact candidate source tree.
2. Confirm ports 3000, 3010 and 3011 are not holding the database.
3. Create an online backup of the current replacement database and an
   independent restored copy. Record byte hashes, schema digest, migration
   rows, table counts, foreign-key check, quick check and integrity check.
4. Preview and explicitly execute the one-time initial-owner Discord link only
   against that exact backed-up database. Verify that the stable owner,
   workspace and Journal accounts were reused and no second owner was created.
5. Transfer only accepted hosted Academy progress, Watchlist content, News
   content and Affiliate first-touch records through the F6 preview/execute/
   reconcile tools. Preserve source stores, reject ambiguous identities and
   prove an idempotent second run.
6. Create a final post-transfer online backup and independent restore. This is
   the upload authority.
7. Confirm the application image contains no database, sidecar, evidence file,
   statement, `.env`, provider export, raw OAuth/session material or HMAC key.

## Railway provisioning gate

These are external changes and require final launch authorization:

1. Create one Railway project/environment and one persistent service from the
   approved source revision.
2. Attach one volume at `/data` and keep the service at one replica.
3. Disable app sleeping.
4. Enter the required variables by key; inspect values without printing them
   into task output or deployment logs.
5. Create `/data/evidence-vault`, `/data/upload-staging` and `/data/backups` on
   the volume with private permissions.
6. Upload the verified database as `/data/traderlink-platform.sqlite` and the
   accepted evidence-vault objects. Do not upload legacy SQLite files or test
   annotations.
7. Enable Railway volume backups on daily, weekly and monthly schedules.
8. Deploy with the repository `Dockerfile` and `railway.json` settings.
9. Require the health endpoint to pass before generating a public domain.

Do not use a Railway pre-deploy command for database preparation: the volume is
not mounted during pre-deploy. Database upload, directory preparation and any
future migration must happen through a stopped-service maintenance procedure
with a fresh verified backup.

## Hosted smoke gate

Before changing any public TraderLink link or domain:

- health returns HTTP 200 and only the safe ready payload;
- an invalid or missing database path makes startup/health fail closed;
- Discord login reuses the linked owner and creates only one hashed session;
- logout revokes that session;
- a new authorized Discord user receives one Platform user, workspace and
  default user-defined Journal account;
- switching Journal accounts changes every account-scoped read and stale forms
  cannot write into a newly selected account;
- dashboard, imports, manual executions, Data Decisions, Trade Tracker,
  Calendar, Rules and Analytics use the replacement database only;
- Academy progress follows Platform user identity;
- Watchlist Premium uses current Discord membership and its publisher token
  remains separate;
- News and Affiliate use the same SQLite store without legacy URLs;
- no response or log exposes statement contents, broker identifiers, UUIDs,
  Discord subjects, OAuth codes/tokens, session tokens, database paths or HMAC
  material.

Only after this gate may the existing public site link or DNS be moved to the
beta service.

## Backup and rollback

- Keep the local pre-launch source, final transfer backup/restore pair and all
  old hosted stores unchanged through final acceptance.
- Keep Railway scheduled volume backups enabled.
- Before every schema or bulk-data operation, stop the single application
  process, create a new online backup and prove a disposable restore.
- Never overwrite the only database copy in place. Upload or restore to a
  separate temporary name, verify it, stop the service, then perform the exact
  reviewed replacement operation.
- On failed health, login, reconciliation or privacy checks, keep the new
  deployment unavailable, restore the last verified target database and
  redeploy the last accepted source revision.
- Do not delete the old hosted stores, local replacement database, legacy
  repository or backup folders until the user accepts the complete dashboard
  and a later cleanup plan names exact deletion targets.

## Current checkpoint

Implemented locally:

- Next.js standalone output and production start command;
- Node 24 Debian-slim multi-stage Dockerfile;
- private-data-safe `.dockerignore`;
- Railway health/restart/drain configuration;
- production startup verification;
- safe database-aware health route; and
- same-volume evidence-vault and upload-staging boundary corrections;
- migration 0018 and an append-only hosted-transfer audit ledger; and
- privacy-safe preview/authorized-execute/reconciliation tooling for Academy,
  Watchlist, News and Affiliate, with all legacy Journal content excluded.

Focused TypeScript, the 146-file active replacement static guard, migration
verification, real-database readiness/integrity checks and the disposable
four-module transfer proof pass. The real database has 18 migrations and 61
domain tables plus its registry; the transfer ledger is empty because no
hosted source was touched. Docker build/start, production hosted transfer,
owner linking, secret entry, volume upload, Railway deployment and browser
verification remain later gates.
