# Railway Staging Volume Initializer Plan

**Status:** Coordinator-approved local implementation; no hosted action is authorized

**Progress record:** [Railway Staging Volume Initializer Progress](railway-staging-volume-initializer-progress.md)

## Scope

Provide one operator-only container image that creates the already-authorized,
entirely empty Workspace staging volume layout. It reuses the existing explicit
empty-database initializer and is not part of ordinary application startup.

The normal `Dockerfile`, `railway.json`, application startup gate, migrations,
schema, authentication, and product surface are out of scope. The normal
application must continue to refuse an absent, empty, unmanaged, partial, or
migrating database.

## Exact source boundary

The initializer is prepared only from
`b007cc5fb8ea82acd1fe8b10fdd02760b87a5a31` on
`codex/workspace-trade-library-85813d84`. It does not copy, read, upload, or
mount a production database, production volume, provider export, or other data
source. The existing `.dockerignore` excludes database files, private data,
evidence, environment files, logs, and statement exports from the image build
context.

## Image contract

`Dockerfile.railway-staging-volume-initializer`:

1. Uses the existing package lock and `tsx` dependency; it adds no package or
   initializer source.
2. Requires `TRADERLINK_PLATFORM_DB_PATH` to be exactly
   `/data/traderlink-platform.sqlite`.
3. Refuses to run if that database or any `-wal`, `-shm`, or `-journal` sidecar
   already exists.
4. Requires Railway's supplied `RAILWAY_VOLUME_MOUNT_PATH` to be exactly
   `/data` and rejects any pre-existing entry on that mounted volume.
5. Sets private default permissions and creates only `/data/evidence-vault`,
   `/data/upload-staging`, and `/data/backups` before invoking
   `src/scripts/initialize-traderlink-platform-database.ts --initialize-empty`.
6. Exits after that command. Railway must not restart it after success or
   failure.

The existing initializer remains the only process that can create the SQLite
file and apply the current migration manifest. The shell guard does not accept
an alternate target path and prevents reuse of an already-created database.

## Required one-time Railway setup

This is a Coordinator-operated staging procedure, not configuration-as-code or
a deployment instruction:

1. Create a separate initializer service in the already-authorized Workspace
   staging environment from the exact source boundary above. Configure its
   Dockerfile path as `Dockerfile.railway-staging-volume-initializer` and leave
   its startup command unset so the image command is used.
2. Attach a newly created, confirmed-empty staging-only Railway volume at
   `/data`, with no production volume, database, data source, or live app
   mount attached or copied. Keep the service at one replica and ensure the
   regular app is not attached to this volume while the initializer runs.
3. Set only the initializer's required database path to
   `TRADERLINK_PLATFORM_DB_PATH=/data/traderlink-platform.sqlite`; Railway must
   supply `RAILWAY_VOLUME_MOUNT_PATH=/data`. Retain `RAILWAY_RUN_UID=0` only
   when Railway requires it for its root-owned volume; do not add ordinary-app
   credentials, OAuth settings, transfer inputs, or any production secret.
4. Set the service restart policy to never restart (or zero retries), run it
   exactly once, and retain only a success/failure exit result without copying
   database contents or sensitive logs into task records.
5. After a successful exit, disable or remove this initializer service before
   any separately authorized regular-app attachment. The regular app must then
   use its unchanged Dockerfile and readiness gate; no `railway.json` change
   is permitted for this operation.

Any pre-existing SQLite path or sidecar is a stop condition, not a reason to
retry, delete, overwrite, or adopt data. Any later volume attach, application
deploy, secret entry, health check, migration action, or staging review remains
outside this plan.
