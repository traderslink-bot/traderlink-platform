# Phase 5 Slice F2 Academy Identity And Progress Plan

**Status:** Technically complete for local replacement. F6 public Platform identity and hosted-transfer tooling are implemented; actual production progress transfer remains pending.

**Scope:** Academy identity, lesson-progress ownership and compatibility only

## Outcome

Preserve the public Academy and every protected lesson-progress key while
moving local replacement behavior onto stable Platform user identity. Discord
is the first public authentication provider, but it is an identity attached to
a Platform user rather than the permanent user primary key. Academy progress
belongs to that Platform user across all workspaces and Journal accounts.

No production Academy row, session, credential or database setting changes in
this slice. Public Discord activation and exact production-data transfer remain
the F6 pre-go-live boundary.

## Verified source inventory

- Active routes are `/academy`, `/academy/courses/[courseId]`,
  `/academy/paths/[pathId]`, `/academy/[...slug]` and
  `POST|DELETE /api/academy/lessons/complete`.
- The registry contains 15 courses, 105 modules, 326 membership rows, 260
  unique membership lesson slugs, 210 required membership rows, four path hubs
  and 15 app-bridge rows.
- `academy/_data/progress-slug-baseline.json` protects 107 launch lesson
  slugs. `progress-slug-aliases.json` currently contains zero aliases.
- The Academy source tree contains 283 Markdown lesson/content files. Only
  registry members accepted for launch contribute to protected progress.
- Production progress uses `ACADEMY_DATABASE_URL`, then `DATABASE_URL`, and is
  documented as hosted data. The replacement checkout contains neither secret
  nor local environment files.
- The preserved local mixed SQLite database has valid Academy tables but zero
  Academy users, sessions and lesson completions. It is not a migration source.
- The current hosted schema keys users, sessions and completions directly by
  `discord_user_id`. The current non-production fallback can use
  `TRADER_INTELLIGENCE_DB_PATH` or a repository-local database; both fallbacks
  are rejected for the replacement.
- Academy sessions are also consumed by Watchlist, News article learning links,
  Week Ahead content, scanner access and `/api/me`. Those consumers must use a
  Platform-owned authentication contract before the legacy Academy session
  implementation can retire.

## Identity contract

1. `platform_users.user_id` remains the stable internal user identity.
2. A new Platform-owned authentication-identity table maps an exact
   `(auth_provider, auth_subject)` to one Platform user. It supports multiple
   providers for a user without changing the stable user ID.
3. Migration backfills the current guarded `development_local` identity for
   the existing development owner; it does not invent a Discord mapping.
4. Discord subjects are matched exactly and never by username, global display
   name, email, guild display name or row order.
5. A Discord identity cannot belong to two Platform users, and one user cannot
   have two active identities for the same provider.
6. Public login sessions are Platform-owned. The current Academy cookie and
   hosted session rows remain compatibility inputs until F6 and are not copied
   during local implementation.
7. The initial production owner Discord binding requires an explicit guarded
   confirmation. First-login-wins ownership is forbidden.
8. Authentication responses and migration evidence redact provider subjects,
   session tokens, role IDs and personal profile fields.

## Academy progress contract

1. Academy completion state is keyed by `platform_user_id` and canonical
   `lesson_slug`; it is not workspace-, Journal-account- or broker-scoped.
2. Completion changes retain an immutable event record so accidental toggles
   are auditable and current state can be reconstructed.
3. Every mutation canonicalizes the slug through the accepted alias registry
   and rejects a slug that is not a launch-ready Academy lesson.
4. Removing or renaming any of the 107 protected slugs requires preserving the
   old baseline entry and adding a non-chained alias before deployment.
5. Local loopback review derives the guarded development Platform user and can
   save progress without Discord. It never fabricates a public session.
6. Public Academy reading remains available without login. Only completion
   persistence requires a resolved Platform user.
7. Production import is append/reconcile, not reset. It requires a read-only
   source inventory, backup/restore evidence, exact Discord-to-Platform mapping,
   per-user/per-slug counts and idempotent rerun proof.
8. Unknown Discord users become explicit unmapped migration records or new
   Platform users under the approved import procedure; they are never attached
   to an existing user by display-name similarity.

## Storage and schema boundary

Two ordered replacement migrations are planned:

1. `0012_platform_authentication_identities`
   - Platform-owned external authentication identities;
   - Platform-owned revocable hashed session tokens;
   - exact uniqueness and active-status indexes; and
   - deterministic backfill of the current Platform user's existing primary
     authentication identity.
2. `0013_academy_progress`
   - Academy-owned current lesson completions;
   - immutable completion/uncompletion events; and
   - user, slug and chronology indexes.

Both migrations start with zero Discord identities, zero public sessions, zero
Academy completions and zero Academy events. The development-local identity
backfill is the only expected row created by schema application.

The local replacement database remains SQLite under the accepted external
private-data root. Existing hosted Academy storage remains authoritative for
production until the Phase 6 deployment-storage decision and transfer proof.
No code may imply that a local SQLite file is durable on Vercel.

## Runtime transfer

1. Add Platform identity/session repositories with privacy-safe contracts.
2. Add an Academy progress repository and service over stable Platform user ID.
3. Add one Academy access resolver:
   - guarded loopback requests resolve the development owner;
   - public production requests remain on the preserved Discord compatibility
     path until F6 completes exact identity linking.
4. Change Academy pages and lesson-completion API to use that resolver/service,
   not `discord_user_id` directly.
5. Keep the compatibility session API used by Watchlist and site navigation
   until F3/F6 replace those consumers; do not silently change Premium access.
6. Add static verification that the active replacement Academy path has no V3,
   Journal-named database fallback or repository-local database fallback.

## Verification gate

1. Registry facts and the 107 protected slugs reconcile unchanged.
2. Migration-file verification covers manifest order, checksums and managed
   tables.
3. Focused repository/service cases cover identity uniqueness, provider
   isolation, stable-user progress, alias canonicalization, invalid lessons,
   idempotent completion, uncompletion events and cross-user isolation.
4. Route cases cover public reading, guarded loopback progress, unauthenticated
   mutation rejection and privacy-safe responses.
5. Dependency-scoped TypeScript, targeted lint and static replacement checks
   pass during implementation. Focused Vitest execution follows the current
   policy boundary and remains Phase 6 work if the approval layer refuses it.
6. Disposable initialization, backup/restore and real migration are completed
   before the runtime depends on migrations 0012-0013.
7. The real database proves unchanged Journal/Analytics/Level Analysis counts,
   one backfilled development identity, and empty Academy progress/events.
8. Port 3010 remains off until the combined visual checkpoint.

## Stop conditions

Stop the affected work if a production database must be written to discover
its contents, a Discord subject cannot be matched exactly, an owner binding
could be claimed by first login, a protected Academy slug would disappear, a
local SQLite file would be presented as Vercel-durable storage, another writer
overlaps the same files, or current database/process/Git evidence changes
outside this slice.

## Phase boundary

F2 prepares and verifies the replacement local identity/progress foundation.
It does not activate Discord, query or modify production Academy storage,
change Premium Watchlist access, stage, commit, push, deploy or start the local
review server. Public identity activation and production progress transfer are
F6 work after exact storage/identity evidence exists.

## Technical completion checkpoint

Migrations `0012_platform_authentication_identities` and
`0013_academy_progress` are applied to the real replacement database. The
first provides multi-provider stable-user identity plus hashed revocable
sessions and deterministically backfilled the one existing
`development_local` identity. The second provides user-level canonical lesson
completion state plus immutable completion/uncompletion events. It is not
workspace-, Journal-account- or broker-scoped.

The real database now has 13 migrations, 52 domain tables and 53 total
application tables. Its schema digest is
`050f62f2ec6d86419897dc2202df7b3ad6a5e0155c94994a8fb8da0577d389db`;
its main file is 11,157,504 bytes with SHA-256
`858aec8c7ad77d86911889c5627934142c825809831c22ce4acc733b5d6ea913`.
The migration checksums are
`f933c39e9341d34d1697a6375034a6d5bf4efb19a9c911e556a1ecdb209927f3`
and
`5d36e7a28e9830d647db2ce9eac131b29ab1dde8a0b15b63813ac939321cfbb5`.

The current replacement counts are one Platform user, one backfilled active
authentication identity, zero public sessions, zero Academy completions and
zero Academy events. The accepted Journal boundary remains 1,072 executions,
333 round trips and two Data Decisions. No Discord identity or production
Academy row was copied.

The pre-write source was 11,087,872 bytes with SHA-256
`7c81fabba5fa4eac106cd7c4238011ac49ea8170f197bb9ad5408ac9fbdb00d0`.
Its online backup and independent restore are byte-identical at SHA-256
`337f8b03970d46d98cb6e8182637c618bdf8901f177e00f2f463cd023e43acf3`
under `phase-5-f2-20260802T135327Z`. The post-migration online backup and
restore are byte-identical at SHA-256
`04511ecfc0b17af3586a46f31442b664bf4f7910e6809cc624f12d139be315fa`
under `phase-5-f2-20260802T135525Z`.

Academy home, course and lesson pages now resolve guarded local Platform
identity and read replacement progress without Discord. The completion route
uses the same stable user locally. Production remains on the preserved hosted
Discord compatibility path until F6; no production configuration or row was
queried or changed. The registry validator passes with 15 courses, 105
modules, 326 memberships, 264 registered lesson/path slugs, four path hubs,
107 protected progress slugs and zero aliases.

Dependency-scoped TypeScript, targeted lint, static migration verification,
disposable 13-migration initialization/integrity proof, the 93-file active
replacement verifier, real redacted reconciliation, and both backup/restore
checks pass. Two focused files with five repository/service cases are written;
their Vitest execution remains policy-deferred to Phase 6. Port 3010 stayed
off. No stage, commit, push or deployment occurred.
