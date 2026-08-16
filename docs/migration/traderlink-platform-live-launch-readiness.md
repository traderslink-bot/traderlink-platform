# TradersLink Platform Live Launch Readiness

## Purpose

This is the single operational checklist for making the complete TradersLink
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
| Complete TradersLink Platform replacement | Local testing only | One Platform-owned SQLite database plus protected private evidence roots | It is not yet publicly deployed. |
| Full replacement hosting target | Not provisioned | Railway persistent single-node service and persistent disk | Required because the current Platform/Journal repositories use SQLite. |
| Full replacement on Vercel/Neon | Not implemented | Would require a deliberate Platform-wide SQLite-to-Postgres repository/migration program | Do not assume existing Neon use makes the replacement Vercel-ready. |

### Current architecture decision

For the near-term launch, use one Railway persistent single-node service with a
persistent disk for the complete replacement. Keep the calendar and background-job
contracts host-neutral so Railway can later be replaced by an equivalent provider.
Do not move the complete replacement to Vercel until its core Platform database
has an accepted Neon/Postgres adapter and equivalent transaction, isolation,
migration, backup and restore evidence.

## Launch gates

### 0. Railway account and controlled operator access

- [ ] The owner creates the Railway account and a dedicated TradersLink workspace;
  the owner remains an Admin and billing owner. Enable MFA or a passkey and save
  recovery codes outside the repository.
- [ ] Connect only the published `traderslink-bot/traderlink-platform` GitHub
  repository when Railway asks for a source. Do not connect the preserved legacy
  repository as the replacement service source.
- [ ] Do not share a Railway password, recovery code, workspace API token or a
  broadly scoped account token with Codex or in chat. At the approved provisioning
  session, the owner authenticates the local Railway CLI through its browser/device
  flow; that local session is enough for Codex to inspect and operate the one
  selected project under the owner's active supervision.
- [ ] After the project exists, use a project-scoped `RAILWAY_TOKEN` only for a
  narrowly approved automated deployment or maintenance procedure, store it only
  in Railway/GitHub protected secrets, and rotate/revoke it when that procedure
  ends. Do not create an account/workspace-scoped `RAILWAY_API_TOKEN` for ordinary
  Platform operation.
- [ ] Do not create a Railway project, attach a volume, enter secrets, upload a
  database, generate a public domain or deploy merely by completing this account
  setup. Those remain the later explicit launch operations below.

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

- [ ] Provision one accepted Railway persistent single-node runtime for the
  complete replacement. Use an equivalent provider only if Railway cannot meet
  the same accepted storage, single-writer and recovery contract.
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
- [ ] Publish the owner-approved Privacy Policy and Terms and Conditions, and
  confirm `privacy@traderslink.pro` can receive privacy questions, complaints
  and access requests before the links are released.
- [ ] Verify regional Google Analytics consent on the production edge: required
  and unknown regions load no Google tag before acceptance, rejected visits
  send no Google Analytics data, and other regions retain normal Analytics.
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
- [ ] Invoke the protected AI Review generation coordinator after each relevant
  market seal and on a bounded retry cadence. Confirm Admin records successful,
  paused and failed runs without storing user identity or review content.
- [ ] Prove current-year market-calendar coverage and either verified next-year
  coverage or an explicit fail-closed warning before review periods can cross
  the coverage boundary.
- [x] Implement the fail-closed AI Review paid-feature entitlement contract.
  Keep provider issuance and customer automatic generation off until Whop,
  OpenAI and scheduler launch configuration is supplied and deliberately enabled.
- [ ] For every worker, document retry/idempotency, concurrency ownership,
  health evidence, failure alert and safe restart behavior.

### 7. AI and paid-feature controls

- [x] Complete the initial Whop packaging, entitlement and customer-access
  contract for AI Reviews. Whop owns price/trial/renewal truth; TradersLink owns
  only privacy-safe access projection and generation enforcement.
- [ ] Configure provider/model, all four verified token prices, cadence burst
  caps, the USD 2.00 per-subscriber Whop paid-cycle safeguard, a non-blocking
  trailing-30-day warning, an optional separate emergency global stop and
  server-only provider credentials. AI Chat remains outside this allowance.
- [ ] Prove requests use immutable account-scoped snapshots, retries reuse the
  same request, and saved reviews never call the provider again when reopened.
- [ ] Keep missing credentials, calendar coverage, entitlement or price data as
  explicit unavailable states; never fall back to fabricated reviews.

### 8. Network, domains and cutover

- [ ] Configure the complete-app hostname, TLS, cookie domain, OAuth callbacks
  and allowed origins for the selected host.
- [ ] Put a trusted geo-aware proxy in front of Railway and enable
  `CF-IPCountry` plus `CF-Region-Code` origin headers; Railway does not provide
  country/province headers and the consent resolver intentionally treats
  missing location as requiring a choice.
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

## Current known readiness state — 2026-08-16

- The complete replacement is local-only and uses SQLite for its core Platform,
  Journal, Trade Tracker and AI Review repositories.
- Vercel/Neon are part of the existing public deployment, but the complete
  replacement has not been ported to a Neon/Postgres Platform database.
- A prior full-replacement Vercel attempt correctly failed the persistent `/data`
  readiness contract and was rolled back.
- The source manifest and controlled local database are current through 59
  applied migrations, ending at `0059_daily_trade_pattern_occurrences`.
  This includes the accepted AI Review and AI Chat accounting foundations plus
  immutable analyzed-trade pattern occurrences. None of these local migration
  states implies production application.
- The verified baseline AI Review calendar covers 2026. Next-year coverage is
  accepted only after the stored two-source verifier confirms Nasdaq and NYSE
  agree; otherwise it remains visibly fail-closed and retries on schedule.
- The future-year verifier and protected host-neutral trigger are implemented
  but not scheduled. A read-only official-source check confirms both parsers
  agree exactly for 2026; unauthenticated trigger access fails closed with 401.
- The v2 AI Review coordinator, immutable pending/retry path, per-user Whop
  entitlement enforcement, signed webhook/OAuth foundation, Admin health and
  Account controls are implemented. Luna and four-rate pricing are configured
  locally; the USD 2.00 per-subscriber paid-cycle safeguard is stored,
  customer generation remains disabled pending hosted launch. A daily cap alone
  does not guarantee a monthly business budget, so the non-blocking warning and
  optional explicit emergency stop remain visible Admin safeguards. Real Whop
  configuration, customer activation and hosted automatic generation remain
  inactive. The disposable end-to-end issuance/reopen proof and Whop API
  reconciliation migration/application passed locally.
- Railway was selected for the first hosted replacement runtime, but its account,
  workspace, project, volume, secrets and domain are intentionally not yet
  provisioned. The owner must first complete the controlled account setup in
  Launch Gate 0; no credential should be pasted into chat or committed locally.
- Production database creation/transfer, owner linking, production scheduler
  activation, full-app DNS cutover and rollback rehearsal remain open.

## Evidence links

- [TradersLink Platform Replacement Plan](traderlink-platform-replacement-plan.md)
- [Migration Progress](migration-progress.md)
- [Migration Register](migration-register.md)
- [Operational and Configuration Inventory](operational-and-configuration-inventory.md)
- [Phase 6 Replacement Acceptance Plan](phase-6-replacement-acceptance-plan.md)
- [AI Reviews Plan](ai-weekly-review-plan.md)
- [AI Reviews Provider Acceptance and Whop Access Plan](ai-reviews-provider-and-whop-access-plan.md)
- [Weekly and Monthly AI Review Boundary Progress](ai-weekly-monthly-review-boundary-progress.md)
- [AI Reviews Beta Handoff](ai-reviews-beta-handoff.md)

## Maintenance rule

Update this file whenever a decision changes the full application's production
runtime, database, identity, secret inventory, scheduled jobs, backup/restore,
monitoring, routing, cutover or rollback. A feature plan may link here instead
of duplicating launch requirements, but it must add any new operational gate to
this checklist before the feature is called production-ready.
