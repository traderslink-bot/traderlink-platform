# TraderLink Platform Live Launch Readiness

## Purpose

This is the single operational checklist for making the complete TraderLink
Platform work correctly for real users. It consolidates hosting, Vercel, Neon,
SQLite, persistent storage, migrations, identity, secrets, scheduled work,
backups, monitoring, DNS and rollback. Feature plans remain authoritative for
their product behavior; this document owns the cross-feature go-live view.

Do not record secret values, private user/account identifiers, broker data or
database contents here. Record only configuration names, verified states and
privacy-safe evidence.

## Current deployment reality

| Surface | Current state | Storage/runtime | Launch meaning |
| --- | --- | --- | --- |
| Public landing and Academy | Live on Vercel | Existing Vercel/Neon-backed public services where configured | This is not the complete replacement dashboard. |
| Complete TraderLink Platform replacement | Local testing only | One Platform-owned SQLite database plus protected private evidence roots | It is not yet publicly deployed. |
| Full replacement hosting target | Not provisioned | Persistent single-node host and persistent disk; Railway is one suitable candidate, not a required brand | Required because the current Platform/Journal repositories use SQLite. |
| Full replacement on Vercel/Neon | Not implemented | Would require a deliberate Platform-wide SQLite-to-Postgres repository/migration program | Do not assume existing Neon use makes the replacement Vercel-ready. |

### Current architecture decision

For the near-term launch, use a persistent single-node host with a persistent
disk for the complete replacement. Keep the calendar and background-job
contracts host-neutral so Railway can be replaced by an equivalent provider.
Do not move the complete replacement to Vercel until its core Platform database
has an accepted Neon/Postgres adapter and equivalent transaction, isolation,
migration, backup and restore evidence.

## Launch gates

### 1. Source and release integrity

- [ ] Select the exact accepted replacement commit from clean synchronized
  `main`; no dirty checkout, unrelated local file or unreviewed feature may
  enter the release.
- [ ] Required CI/checkpoint verification passes under the repository testing
  cadence.
- [ ] Record the release commit, build identifier, target environment and
  rollback commit.
- [ ] Confirm the public landing/Academy release and complete-app release are
  intentionally routed; one must not silently replace the other.

### 2. Hosting and persistent storage

- [ ] Provision one accepted persistent single-node runtime (Railway or an
  equivalent provider) for the complete replacement.
- [ ] Attach a persistent volume at the exact configured Platform database and
  protected evidence-root paths. Container-local or ephemeral paths fail the
  gate.
- [ ] Confirm only one application writer owns the SQLite database unless a
  later architecture explicitly replaces this contract.
- [ ] Configure health checks, graceful restart behavior, storage capacity and
  a maintenance procedure that cannot start two competing writers.
- [ ] If the selected host cannot prove these properties, stop and choose a
  suitable host; do not weaken the database contract to fit the provider.

### 3. Production database and data transfer

- [ ] Create the protected production Platform database outside the source
  checkout and apply every registered migration in exact order.
- [ ] Verify schema digest, foreign keys, SQLite WAL/synchronous settings,
  integrity check and migration count before traffic.
- [ ] Preview the authorized hosted-source transfer, reconcile counts and
  identities, then execute it once under the controlling transfer plan.
- [ ] Link the initial real owner identity without exposing or inventing user,
  workspace, account or broker identifiers.
- [ ] Preserve source provenance, owner/account isolation, exact financial
  values, Data Decisions and trading-date/timezone evidence.
- [ ] Rehearse a production-format backup and independent restore before
  cutover. Record only privacy-safe size/hash/count evidence.
- [ ] Define backup frequency, retention, off-host copy, restore owner and
  recovery-time expectations.

### 4. Authentication, authorization and privacy

- [ ] Configure production Discord/OAuth identity and callback domains.
- [ ] Verify owner, workspace and account isolation with at least two isolated
  production-like identities before public traffic.
- [ ] Configure versioned account-identity and Journal privacy keys; confirm
  recovery authority can restore every required key/canonicalizer version.
- [ ] Verify local-development identity shortcuts are impossible in production.
- [ ] Confirm Admin access, audit trails, consented-source access and protected
  evidence roots use production-only authorization.

### 5. Secrets and environment configuration

- [ ] Maintain a production environment-variable inventory with presence and
  ownership only; never place values in Git or this document.
- [ ] Configure Platform database/evidence paths, identity/privacy keys,
  authentication secrets, broker connection secrets and provider credentials.
- [ ] Configure a server-only scheduler credential for protected operational
  jobs. Rotate it independently of user sessions.
- [ ] Confirm browser bundles, logs, error responses and build artifacts contain
  no secrets, raw auth subjects, emails, broker identifiers or statement data.

### 6. Background jobs and scheduling

- [ ] Start and health-check the Daily Trade Tracker analyzer worker against the
  same persistent Platform database used by the app.
- [ ] Invoke the protected AI Review market-calendar verifier on its accepted
  schedule. The job is host-neutral; it is not Vercel Cron unless the complete
  app is later moved to an accepted Vercel/Neon architecture.
- [ ] Prove current-year market-calendar coverage and either verified next-year
  coverage or an explicit fail-closed warning before review periods can cross
  the coverage boundary.
- [ ] Keep AI Review provider issuance and customer automatic generation off
  until the separate paid-feature/entitlement plan is accepted.
- [ ] For every worker, document retry/idempotency, concurrency ownership,
  health evidence, failure alert and safe restart behavior.

### 7. AI and paid-feature controls

- [ ] Complete pricing, packaging, entitlement and customer-access policy for
  AI Reviews before customer provider calls are enabled.
- [ ] Configure provider/model, verified token prices, daily/account/platform
  caps and server-only provider credentials.
- [ ] Prove requests use immutable account-scoped snapshots, retries reuse the
  same request, and saved reviews never call the provider again when reopened.
- [ ] Keep missing credentials, calendar coverage, entitlement or price data as
  explicit unavailable states; never fall back to fabricated reviews.

### 8. Network, domains and cutover

- [ ] Configure the complete-app hostname, TLS, cookie domain, OAuth callbacks
  and allowed origins for the selected host.
- [ ] Decide which routes remain on Vercel and which route to the complete app;
  document rewrites/proxying without creating duplicate user-facing apps.
- [ ] Lower DNS TTL before cutover when appropriate and record the rollback DNS
  target.
- [ ] Run authenticated desktop/mobile smoke checks for Account, Trade Tracker,
  AI Reviews, imports, Analytics, Calendar, Rules and Admin on the exact release.

### 9. Observability and incident readiness

- [ ] Centralize privacy-safe application, worker, scheduler and migration logs.
- [ ] Alert on startup/database failure, migration drift, disk pressure, backup
  failure, worker stalls, scheduler authentication failure, calendar conflict,
  provider-cap blocks and repeated request failures.
- [ ] Record an operator runbook for stop, restart, backup, restore, credential
  rotation, failed migration and provider disablement.
- [ ] Rehearse rollback without deleting production data or reverting an
  irreversible migration.

## Current known readiness state — 2026-08-08

- The complete replacement is local-only and uses SQLite for its core Platform,
  Journal, Trade Tracker and AI Review repositories.
- Vercel/Neon are part of the existing public deployment, but the complete
  replacement has not been ported to a Neon/Postgres Platform database.
- A prior full-replacement Vercel attempt correctly failed the persistent `/data`
  readiness contract and was rolled back.
- Local migrations through `0040_daily_trade_path_materializations` are
  applied. This does not mean `0039` or `0040` is applied in production.
- The verified AI Review calendar covers 2026. NYSE publishes later years, but
  Nasdaq Trader has not yet published 2027, so 2027 remains fail-closed.
- The future-year verifier and protected host-neutral trigger are implemented
  but not scheduled. A read-only official-source check confirms both parsers
  agree exactly for 2026; unauthenticated trigger access fails closed with 401.
- AI Review request creation and issuance entry points exist but provider calls,
  paid customer entitlement and hosted automatic generation remain inactive.
- Hosting provisioning, production database creation/transfer, owner linking,
  production scheduler activation, full-app DNS cutover and rollback rehearsal
  remain open.

## Evidence links

- [TraderLink Platform Replacement Plan](traderlink-platform-replacement-plan.md)
- [Migration Progress](migration-progress.md)
- [Migration Register](migration-register.md)
- [Operational and Configuration Inventory](operational-and-configuration-inventory.md)
- [Phase 6 Replacement Acceptance Plan](phase-6-replacement-acceptance-plan.md)
- [AI Reviews Plan](ai-weekly-review-plan.md)
- [Weekly and Monthly AI Review Boundary Progress](ai-weekly-monthly-review-boundary-progress.md)

## Maintenance rule

Update this file whenever a decision changes the full application's production
runtime, database, identity, secret inventory, scheduled jobs, backup/restore,
monitoring, routing, cutover or rollback. A feature plan may link here instead
of duplicating launch requirements, but it must add any new operational gate to
this checklist before the feature is called production-ready.
