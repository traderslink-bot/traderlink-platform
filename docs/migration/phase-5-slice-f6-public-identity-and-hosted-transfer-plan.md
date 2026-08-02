# Phase 5 Slice F6 - Public Identity And Hosted Transfer

**Status:** local implementation and Phase 6 rehearsals accepted; external provisioning remains deferred to the final launch gate

**Scope:** final Phase 5 slice plus the hosted-runtime prerequisites that Phase 6 must rehearse

**Parent plans:** [Phase 5 Remaining Modules](phase-5-slice-f-remaining-modules-plan.md) and [Platform Replacement Plan](traderlink-platform-replacement-plan.md)

**Operational runbook:** [Hosted Beta Runbook](traderlink-platform-hosted-beta-runbook.md)

## Outcome

Connect Discord-first public login to the same stable Platform users,
workspaces and user-defined Journal accounts already used by the replacement
dashboard. Prepare one deployable beta runtime and exact transfer tools for
existing hosted Academy, Watchlist, News and Affiliate records without
rewriting Journal ownership, copying sessions or guessing identities.

Legacy saved trades, trade tags, trading rules, daily/trade notes and other
Journal annotations are explicitly excluded from transfer because the owner
confirmed they are disposable test data. The replacement annotation tables
remain authoritative for all new writes: every future tag, rule and note must
stay bound to its Platform user, workspace, selected user-defined Journal
account and stable round-trip or trading-day identity.

Local loopback review remains login-free. Email/password remains an optional
future identity provider and is not required for beta.

## Hosted beta architecture decision

The beta target is one long-running Node.js/Next.js service on Railway with one
persistent encrypted volume and exactly one application replica. The accepted
SQLite database and evidence vault live on that volume outside the application
image. Vercel remains the existing public-site host until the final verified
DNS/link cutover.

This is the narrowest safe route to beta because the accepted 59-table Journal
uses synchronous SQLite transactions throughout. Vercel's ephemeral serverless
filesystem cannot own those writes, while an immediate PostgreSQL port would
rewrite nearly every accepted Journal service and reopen Phases 2-5.

The provider decision is supported by Railway's current first-party contracts:

- persistent volumes expose an absolute mount path to one service;
- volume backups explicitly cover SQLite and can be scheduled daily, weekly
  and monthly;
- services with a volume cannot use multiple replicas, matching the required
  single SQLite writer; and
- Railway supports Docker-based Next.js services and health checks.

References: [Railway volumes](https://docs.railway.com/volumes),
[volume backups](https://docs.railway.com/volumes/backups),
[volume constraints](https://docs.railway.com/volumes/reference), and
[Next.js deployment](https://docs.railway.com/guides/nextjs).

### Hosted paths and process boundary

- Volume mount: `/data`.
- Database: `/data/traderlink-platform.sqlite` through the required
  `TRADERLINK_PLATFORM_DB_PATH`.
- Evidence vault: `/data/evidence-vault`.
- Application-created online backups: `/data/backups`.
- One process and one replica; horizontal replicas are forbidden while SQLite
  is authoritative.
- Production server binds the provider-supplied port on `0.0.0.0`.
- Serverless sleep is disabled for the beta because authenticated dashboard
  review and the Watchlist stream require predictable process continuity.
- Ordinary startup verifies the database and refuses an absent, partial,
  mismatched or repository/image-local file. It never initializes, repairs or
  adopts a schema automatically.

Railway project creation, billing, volume creation, secret entry, DNS and the
first deployment are external state changes. They occur only after local Phase
6 verification and explicit launch authorization.

## One Platform identity/session boundary

The current Academy-specific Discord session is compatibility source code, not
the future identity authority. F6 uses:

- `platform_users` as the stable person/application user;
- `platform_auth_identities` as provider-to-user mapping;
- `platform_auth_sessions` as hashed server-side sessions;
- `platform_workspace_memberships` for workspace authorization;
- server-derived `WorkspaceAccessScope` and selected-account narrowing for
  every private dashboard page and command; and
- a new versioned Discord membership/entitlement projection owned by Platform.

No route accepts user ID, workspace ID, account ID, role or entitlement from
request content. No raw access/refresh token, OAuth code, session token,
Discord response JSON or HMAC material is persisted.

### Session cookie

- New cookie: `tl_platform_session`.
- Raw 256-bit random token exists only in the HttpOnly cookie; storage contains
  only its SHA-256.
- `Secure` in production, `SameSite=Lax`, path `/`, 30-day maximum age.
- Production domain is `.traderslink.pro`; host-only legacy cookies are also
  cleared.
- Session lookup rejects expired, revoked, identity-revoked or disabled-user
  rows and never returns provider subject to a client.
- Logout revokes the Platform session before clearing both new and legacy
  session cookies.
- Existing Academy session rows/tokens are not copied. Existing users sign in
  once through Discord after cutover.

### OAuth request boundary

- Keep the existing Discord authorization-code flow, CSRF state, strict
  same-origin relative `returnTo`, one silent-to-consent retry, guild membership
  requirement and Premium role refresh behavior.
- Rename/generalize only Academy-owned cookie and service names needed by the
  Platform boundary; preserve public route URLs.
- Callback exchanges the code server-side, validates guild membership, then
  passes a bounded normalized Discord identity/membership DTO to Platform.
- Error output is privacy-safe and never prints an OAuth code, token, Discord
  subject, raw user/member payload, database URL or session token.

## Existing and new user rules

### Existing mapped user

If an active `discord` identity already maps to one Platform user, login updates
the bounded Discord membership projection, marks the identity authenticated,
creates a new hashed Platform session and loads that user's existing
workspace/account access. It never creates a second user or moves Journal data.

### New public user

If no active Discord identity exists, one transaction creates:

1. one active Platform user using the bounded Discord display name;
2. one active workspace owned by that user;
3. one active default user-defined Journal account named `Primary Journal`;
4. one active Discord identity linked to that same user; and
5. the current Discord membership projection.

The Journal account is not a broker account. The user may later create more
Journal accounts and may import statements from multiple brokers into any one
account.

### Initial migrated owner

The seeded development owner holds the accepted private Journal facts. Public
login must never claim that user merely because it is the first login.

Before activation, the transfer preview must find exactly one legacy Discord
guild-owner candidate or receive one exact configured owner Discord subject.
An explicit one-time command links that subject to the seeded Platform user
only when all of these remain true:

- one active seeded development owner/workspace exists;
- the Discord identity is not already linked;
- the seeded user has no active Discord identity;
- the expected local database hash/migration boundary matches;
- a fresh online backup and restore proof passed; and
- the command's preview digest is explicitly supplied to execution.

Ambiguous, missing or conflicting evidence stops. The callback itself never
performs initial-owner adoption.

## Migration 0017 - Discord membership projection

F6 adds no new identity table. Migration `0017_platform_discord_memberships`
adds one Platform-owned current projection keyed to Platform user and Discord
guild:

- `user_id` and `guild_id`;
- `username`, optional global display name and optional avatar hash;
- canonical sorted role-ID JSON;
- `guild_owner` boolean;
- optional joined timestamp;
- first/last verified timestamps; and
- immutable provider subject correspondence through the existing active
  `platform_auth_identities` row.

Discord IDs and role IDs remain server-side provider facts. Public DTOs expose
only display name, authentication state and named access decisions. Watchlist
Premium access checks the configured role against this current projection or
guild-owner status; it is not stored on a Journal account.

## Unified current-request authorization

Add one Platform request resolver used by the dashboard, Academy, Watchlist,
Affiliate and `/api/me`:

- guarded loopback development: existing development owner and optional
  Journal-account selection cookie;
- production/hosted: Platform session cookie, active user/identity/session,
  active workspace membership and optional account-selection cookie; and
- all other contexts: fail closed.

Every active dashboard page/API replaces `requireDevelopmentDashboard*` with
this unified resolver. The development implementation remains an internal arm
of the resolver; no public request can set its assertion header or enable flag.

Academy completion is keyed to Platform user and canonical slug. Watchlist
access uses Platform identity plus Discord membership. Affiliate first touch is
keyed to Platform user. The selected Journal account affects none of those
three module relationships.

## Hosted source transfer

The existing hosted databases remain read-only compatibility sources until the
cutover. F6 creates one preview/execute/reconcile toolset. It reads connection
URLs from environment variables and never prints them.

No legacy Journal trade, execution, tag, rule or note transfer is part of this
toolset. Accepted replacement Journal facts already in the Platform database
remain untouched.

### Academy

- Back up/export `academy_users` and `academy_lesson_completions` before any
  transfer.
- Do not copy Academy sessions or raw Discord JSON.
- Map each Discord subject to exactly one Platform identity.
- Create new Platform user/workspace/default-account ownership for non-owner
  users during the controlled transfer, not through guessed display names.
- Copy only canonical/aliased protected completion slugs and exact completion
  timestamps into Academy-owned Platform tables.
- Unknown or retired slugs stop or enter an explicit rejected-row report; they
  are never silently dropped.

### Watchlist

- Copy global symbols, health and immutable archives into the Watchlist-owned
  replacement tables with exact revisions/timestamps and payload digests.
- Watchlist data is shared content, not copied per user or Journal account.

### News

- Merge current hosted articles into News current/version tables by exact
  article identity, revision and content digest.
- Conflicting same-revision content stops; identical rows are idempotent.

### Affiliate

- Map a legacy Discord referral only through an exact active Discord Platform
  identity.
- Preserve first touch; later events cannot replace it.
- Missing/ambiguous identities remain in a pending report and are not guessed.

### Transfer mechanics

1. Source inventory and privacy-safe counts/digests.
2. Provider-supported source backup/export evidence.
3. Target SQLite online backup plus disposable restore.
4. Read-only transfer preview with exact row/mapping/conflict counts and digest.
5. Explicit execution using that digest under one target transaction per
   module, with append-only transfer events.
6. Exact rerun proves idempotency.
7. Independent source-versus-target reconciliation.
8. Old hosted stores stay intact through rollback and final acceptance.

No dual writes are introduced.

## Production module storage cutover

For the single-node hosted runtime, Platform, Journal, Journal Analytics,
Academy, Watchlist, News and Affiliate all use the one protected SQLite file
through their named module repositories. The existing Neon implementations are
retained only as read-only transfer adapters until final retirement.

Production mode must not automatically choose Neon merely because
`NODE_ENV=production`; it follows an explicit
`TRADERLINK_PLATFORM_STORAGE_BACKEND=sqlite_single_node` contract. Unknown or
serverless hosting modes fail closed. Module-specific publisher tokens remain
required.

## Deployment package

F6 prepares but does not externally deploy:

- a Node 24 Debian-slim multi-stage Dockerfile compatible with
  `better-sqlite3`;
- Next.js standalone output;
- production `start` command and a database-aware health route;
- a required environment-key manifest with secrets represented only by key;
- single-replica/volume/health/restart configuration documentation;
- explicit hosted-volume preparation and verification commands;
- graceful shutdown/drain expectations; and
- backup/restore and rollback runbooks.

The application image contains no SQLite file, evidence, statement, `.env`,
secret, HMAC key, OAuth subject or production export.

## F6 implementation order

1. Implement migration 0017, Platform session repository/service and bounded
   Discord membership repository.
2. Implement new-user provisioning and explicit initial-owner link preview/
   execute commands with disposable proofs.
3. Implement unified local/public scope resolution and convert active private
   pages/APIs.
4. Convert Discord login/callback/logout and `/api/me` to Platform sessions;
   preserve local login-free review.
5. Convert Academy, Watchlist and Affiliate production compatibility adapters
   to Platform identity/membership.
6. Implement hosted-source inventory, preview, transfer and reconciliation
   tooling without executing against production until credentials/backups are
   available.
7. Add Docker/health/start/storage-mode/backup runbooks and a disposable hosted
   runtime rehearsal.
8. Enter Phase 6 integrated test/build/browser/deployment rehearsal.

## Current implementation checkpoint

Steps 1-6 are implemented locally. The real replacement database has migration
0018 applied, with 18 migrations, 61 domain tables plus the registry and empty
Discord membership, session and hosted-transfer-event tables. The unified
request boundary uses guarded login-free local access and hashed Platform
sessions plus current Discord membership in production. Academy, Watchlist and
Affiliate now resolve the same Platform identity, and all active module stores
require the explicit single-node SQLite backend in production.

The [Hosted Beta Runbook](traderlink-platform-hosted-beta-runbook.md) now owns
the exact Docker, standalone Next.js, `/data` volume, startup verification,
health, required-key, backup and rollback procedure. The hosted-source tooling
previews and reconciles Academy, Watchlist, News and Affiliate facts, records
append-only transfer events, and explicitly excludes every legacy Journal
trade, execution, tag, rule and note. A fresh disposable four-module proof
executed and reconciled eight synthetic source rows, then produced an
idempotent zero-write second preview. No Railway resource or secret was created
and no production source transfer or deployment occurred. The Docker/runtime
rehearsal and Step 8 remain Phase 6 gates.

## Focused acceptance gate

- Existing Discord identity reuses the same Platform user/workspace/accounts.
- New Discord identity atomically gets exactly one user/workspace/default
  Journal account and is retry-safe.
- Initial owner mapping cannot occur in an ordinary callback and fails closed
  for every ambiguity/conflict.
- Only session hashes are stored; expired/revoked/disabled states fail.
- Local loopback access still works without Discord and public production
  access cannot use the local assertion.
- Academy/Watchlist/Affiliate resolve the same stable Platform user.
- Premium access uses current bounded Discord membership, not legacy Academy
  session storage.
- Hosted transfer previews are privacy-safe, exact, idempotent and
  independently reconcilable.
- Docker/runtime package contains no private data and refuses missing volume
  state.
- Focused TypeScript/lint/static/disposable/read-only verification passes.
  Vitest files are retained for the Phase 6 test boundary under the active
  repository rule.

## Stop conditions

Stop the affected operation if an identity mapping is ambiguous, the initial
owner cannot be proven exactly, a production source backup is unavailable, a
protected Academy slug is unknown, same-version content differs, a hosted
target contains unexpected data, a transfer would copy sessions/raw tokens,
the deployment would start more than one SQLite writer, the persistent volume
is missing, or repository/private/process/Git state changes unexpectedly.

## External launch gate

Railway account/project/billing, volume provisioning, secret entry, source
export, private database upload, DNS/custom-domain changes, production
deployment and old-store retirement are external or destructive state changes.
They are not implied by local implementation. After Phase 6 proves the package,
the user receives one concise launch checklist and is asked only for the
minimum account/billing/DNS authorization that Codex cannot supply itself.
