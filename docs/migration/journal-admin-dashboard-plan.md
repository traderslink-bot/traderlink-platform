# TraderLink Journal Administration Dashboard Plan

**Status:** Owner approved; technical Admin 1-6 plus full TypeScript/lint/build/static and live browser acceptance pass in the active unstaged package. Owner visual/product review and production activation remain pending.

**Date:** 2026-08-02

**QA checkpoint:** 2026-08-02. The implementation contract was corrected for
authentication freshness, request security, upload idempotency and recovery,
statement-layout identity, consented-source retention, privacy hardening and
metric reconciliation.

**Canonical application:** `C:\Users\jerac\Documents\TraderLink\traderlink-platform`

**Implementation tracker:** [Journal Administration Dashboard Progress](journal-admin-dashboard-progress.md)

**User administration extension:** [Journal Administration User Health Plan](journal-admin-user-health-plan.md) and its [progress tracker](journal-admin-user-health-progress.md). Its implementation is complete and release coordination is pending for truthful user-state labels, user import/broker support evidence, Academy-to-Journal journey visibility and guarded account controls.

**Latest implementation checkpoint:** 2026-08-03. The private shell and all
planned pages/read APIs are present. Format lifecycle/merge, privacy-safe
developer packages and consent-gated source downloads use same-origin,
permission, rate-limit, idempotency, expected-revision and audit boundaries.
The code-owned supported-format registry intentionally remains empty until an
exact adapter, fixture and signature set is implemented and verified.

**Planned route root:** `/admin/journal`

**Controlling replacement plan:** [TraderLink Platform Replacement Plan](traderlink-platform-replacement-plan.md)

**Identity dependency:** [Phase 5 Slice F6 Public Identity and Hosted Transfer Plan](phase-5-slice-f6-public-identity-and-hosted-transfer-plan.md)

**Journal evidence boundary:** [Import Integrity and Data Decisions Contract](import-integrity-and-data-decisions-contract.md)

**Related tracker contract:** [Day Trade Tracker And Swing Trade Tracker Plan](day-and-swing-trade-tracker-plan.md)

## 1. Outcome

Build a private owner administration area that explains what is happening in
the TraderLink Journal across users, user-created Journal accounts, broker
statement imports, statement-format learning, Data Decisions and platform
operations.

The dashboard is an operational and support surface. It is not a trader
performance leaderboard, a second Journal, a way for an administrator to
silently edit user facts, or a replacement for infrastructure monitoring.

The first release must answer these questions without opening logs or the
database manually:

1. How many real users registered, signed in and activated their Journal?
2. How many user-defined Journal accounts exist, and how many users created
   more than one?
3. Which statement imports succeeded, succeeded with contained decisions,
   need mapping, were duplicates, were rejected, or failed technically?
4. Which new statement structures have been observed, which users mapped
   successfully, and which formats are ready to be coded and verified?
5. Which Data Decision categories are accumulating or indicate an importer
   defect while leaving the factual choice with the trader?
6. Is the database, import pipeline, backup/restore evidence and hosted runtime
   healthy?
7. Which sensitive administrative records were viewed or downloaded, by whom,
   when and why?

## 2. Fixed product decisions

These decisions control implementation unless the owner later changes them:

- The feature name is **Journal Administration**.
- Its canonical route namespace is `/admin/journal`; APIs use
  `/api/admin/journal/**`.
- It uses the approved light Material visual language but has its own clearly
  labeled private administration navigation.
- The separate computer-run Watchlist admin mentioned by the owner remains a
  separate system. This plan does not inspect, replace, link, start, stop or
  modify that admin or its automation.
- The preserved `/intelligence/admin` V3 QA console, historical
  `/workspace/admin` references and existing `/api/admin/level-analysis/**`
  operations are not the Journal admin. They are not reused as its authority.
- Production users, including the owner, authenticate through the Platform's
  Discord login and hashed Platform session.
- The owner is the only Journal administrator. Production authorization requires
  the exact Discord-linked Platform user, current `guild_owner` evidence for the
  configured TradersLink Discord server and the one active server-side
  `journal_owner_admin` grant.
- No condition grants access by itself. Discord login, Discord server ownership,
  Premium roles and ordinary workspace roles are insufficient without the full
  owner-admin match.
- Email/password is not added for Journal Administration. It would introduce a
  second password, reset, rate-limit and MFA security system for one person even
  though the Platform already has Discord identity and revocable sessions.
- Guarded loopback development may use the existing development owner for local
  review. Production must reject that development identity and require the
  Discord-linked current server owner plus the singleton active operator grant.
- A Journal account is a user-created organizational trading scope. It is not a
  broker account. Many broker identities and statement formats may feed one
  Journal account.
- Broker-imported and manual executions remain in the same Journal ledger, but
  manual execution entry is not counted as a broker-statement import.
- The trader remains the authority for statement facts and Data Decisions.
  Journal administrators diagnose patterns and maintain supported formats; they
  do not resolve user decisions or silently change executions.
- Privacy-safe statement structure is captured for every structurally readable
  upload. Raw statement access for importer development requires an explicit,
  purpose-bound user consent or an owner-owned test statement.
- Raw upload bytes are not retained for importer development by default. A
  failed or uncommitted upload is retained only in the private support-source
  vault after explicit consent; otherwise its staged bytes are deleted after
  the request completes.
- An existing mapping-support package is input to the administrative evidence
  pipeline, not proof that its contents are safe for durable cross-user
  storage. It must pass the hardened header/label sanitizer and privacy scan
  defined in this plan first.
- A successful user mapping may be reused inside that user's selected Journal
  account. It is evidence for a global format candidate, not automatic authority
  to map statements belonging to other users.
- A statement format becomes globally supported only after code, fixtures and
  verification identify the exact runtime adapter/template version.
- Adding support never silently rewrites an existing import. Affected users are
  offered a safe reprocess flow with preserved evidence and normal Data Decision
  protections.

## 3. Existing foundation and gaps

### Existing foundation to reuse

- Platform users, workspaces, owner/admin/member memberships, Discord identities,
  hashed sessions and current Discord membership evidence.
- Multiple user-defined Journal accounts with opaque browser selection refs and
  server-derived account access.
- Immutable Journal import batches/events, source rows/issues, execution
  provenance, round trips and Data Decisions.
- Import states `preview`, `blocked`, `accepted`,
  `accepted_with_decisions` and `superseded` for persisted Journal batches.
- Account-scoped exact generic mapping reuse from an accepted import's
  `mapping_contract_json`.
- Uploader-facing `journal_statement_mapping_support_v1` inspection packages
  containing structure, headings, shape counts and suggested mappings without
  raw rows, statement values, original filenames or source paths. QA confirmed
  that V1 still contains a source hash, byte size and data-dependent counts, so
  it is internal migration input rather than accepted cross-user/admin evidence.
- The broker-neutral mapper, IBKR verified adapter, source evidence vault,
  replacement database health/readiness and online backup tooling.

### Gaps this plan closes

- Failed and mapping-required upload attempts are not a complete durable admin
  queue when no Journal import batch is committed.
- Mapping support packages are returned to the uploader but are not a durable,
  cross-user, privacy-safe owner review library.
- The current V1 browser DTO exposes more source correlation/count metadata than
  the mapper UI needs and uses the source hash as preview confirmation. It must
  be replaced by a hardened V2 DTO plus opaque preview confirmation reference.
- No global candidate lifecycle distinguishes observed, mapped, in-development,
  validated and runtime-supported statement formats.
- No Platform-global singleton owner grant currently exists independently from
  workspace administration, Discord membership and Watchlist entitlement.
- No complete append-only audit records sensitive owner-admin access and exports.
- User, import, decision and operational facts have no unified private admin read
  models or accepted metric definitions.

## 4. Naming and route boundary

### Page routes

| Route | Purpose |
| --- | --- |
| `/admin/journal` | Overview, alerts and priority queues |
| `/admin/journal/users` | User and Journal-account operations |
| `/admin/journal/users/[userRef]` | Privacy-safe user support detail |
| `/admin/journal/imports` | All broker-statement upload attempts and committed imports |
| `/admin/journal/imports/[importRef]` | One new tracked attempt or historical committed import, evidence summary and available timeline |
| `/admin/journal/statement-formats` | Cross-user format candidate library and development queue |
| `/admin/journal/statement-formats/[formatRef]` | Candidate evidence, mappings, package exports and lifecycle |
| `/admin/journal/data-decisions` | Aggregate unresolved/resolved issue operations |
| `/admin/journal/system` | Database, jobs, backups, storage and runtime readiness |
| `/admin/journal/audit` | Sensitive admin-access and action ledger |

`userRef`, `importRef` and `formatRef` are opaque, domain-separated server
references. An `importRef` resolves server-side to exactly one tracked attempt
or one pre-instrumentation committed batch without revealing which identifier
is underneath. Internal UUIDs, Discord subjects, broker account identifiers and
source-file hashes never appear in URLs.

### Explicit route exclusions

- `/intelligence/admin` remains a preserved V3/internal QA route until its
  existing retirement disposition is executed. It is not linked as Journal
  Administration.
- `/workspace/admin` historical references remain operations-only compatibility
  evidence and are not revived.
- `/api/admin/level-analysis/**` remains Level Analysis operations.
- The computer-run Watchlist admin remains outside this application's Journal
  route tree and navigation.

If a future cross-product admin landing page is approved, `/admin` may become a
module selector. The Journal module remains `/admin/journal`, and Watchlist must
remain visibly separate.

In production, a `Journal Administration` entry may appear in the normal
account/user menu only after a server-confirmed Journal admin scope. It is not a
static trader-sidebar link and is never shown merely because the user has a
Discord/Premium/workspace role. Direct navigation remains protected by the same
server boundary.

## 5. Authentication and authorization

### Authentication

Production follows the existing Platform flow:

1. Discord OAuth resolves or provisions the stable Platform user.
2. The server issues a hashed, revocable Platform session.
3. The request resolver confirms the active user/session.
4. The request resolver verifies current `guild_owner` membership evidence for
   the configured TradersLink Discord server.
5. The Journal admin authorization service checks that the same exact user owns
   the one active `journal_owner_admin` grant.

For Journal Administration, `current` means the configured-server membership
was verified with Discord no more than five minutes before authorization. When
stored evidence is older, the admin flow refreshes it through the server-side
Discord verification path or sends the operator through Discord
reauthentication. Discord unavailability or stale evidence fails closed; a
previously observed `guild_owner` value is never treated as permanent. The same
five-minute freshness window is required again before a consented-source
download or an offline authority change takes effect.

No raw Discord subject or role list is accepted from the browser. The public
callback may never create an operator grant.

Guarded local review uses a separate `development_journal_owner_admin` scope
derived only when the accepted development-owner flag, development environment,
loopback request host and loopback server binding all agree. It does not insert
or emulate a production `platform_operator_grants` row, fails on a remote host
or production environment, and is recorded under the development owner in the
local audit ledger. This permits login-free local review without weakening the
production three-part authorization rule.

### Single owner authority

The first Journal Administration release has one role and one active holder:

| Role | Intended access |
| --- | --- |
| `journal_owner_admin` | Full private Journal administration and audited consented-source export for the exact owner |

The database permits only one active `journal_owner_admin` grant for the fixed
`journal_administration` authority key. Creating, changing, recovering or
revoking it is an explicit offline privileged preview/execute command and an
immutable audit event, never an admin-page button or OAuth callback. Execute
requires a fresh database backup, the exact expected current authority state,
the preview receipt digest and a typed confirmation value. A bootstrap with no
prior operator is recorded as a `bootstrap_console` actor rather than inventing
a Platform user.
Adding staff/support roles later requires a separately reviewed schema and
permission plan; unused roles are not pre-authorized now.

### Authorization rules

- `platform_workspace_memberships.role = 'admin'` is scoped to one user's
  workspace and does not grant Platform-global administration.
- Watchlist Premium entitlement does not grant Journal administration.
- Current TradersLink Discord `guild_owner` evidence is required but cannot
  grant access without the exact singleton Platform operator grant.
- An active operator grant cannot grant access when current guild-owner evidence
  is missing, stale, for another Discord server or belongs to another user.
- Every page, route, server action and export calls the same fail-closed
  `requireJournalAdminScope` boundary.
- Unauthenticated access returns through the normal Discord login flow.
  Authenticated users who fail owner-admin authorization receive a generic
  denied/not-found response that does not disclose private admin content.
- Read permission and export permission are separate checks.
- Sensitive drill-down and raw-source export require a reason code recorded in
  the audit event.
- Revoked, expired, disabled or development-only identities fail in production.
- All admin responses use private/no-store cache headers.
- Every mutation and download enforces same-origin and CSRF protections. State
  mutations also require an idempotency key and the expected current revision.
- Admin authentication and sensitive endpoints are rate-limited. Repeated
  denied requests are recorded through bounded, privacy-safe security events so
  an attacker cannot create an unbounded audit-log write stream.
- Network-based throttling uses a rotating keyed address digest plus session/
  operator scope. Raw IP addresses and rate-limit key material are not stored in
  admin tables, DTOs or audit details.

If the owner loses the Discord account or transfers server ownership, recovery
uses an offline server-console preview/execute command after database backup and
exact identity review. It relinks/replaces the singleton grant and records audit
events; it does not create a second public email/password login.

## 6. Privacy and data-authority rules

The default admin experience shows counts, safe labels and operational states,
not users' trading performance.

Never expose in overview tables, URLs, logs, telemetry or developer packages:

- raw Discord subjects, emails or authentication tokens;
- internal user/workspace/account/import/execution/decision UUIDs;
- broker account identifiers or HMAC/fingerprint material;
- original statement filenames or local/private storage paths;
- statement cell values, execution prices, quantities, P/L or note text;
- raw statement rows or raw provider payloads.

User detail may show the user's public display name, account display labels and
operational counts. Trade values and user-authored notes remain absent unless a
future audited support case explicitly requires a separately planned view.

Every sensitive access produces an append-only audit event. A sensitive read is
audited before its data is returned. An administrative mutation and its audit
event commit atomically; if the audit write fails, the mutation fails. Denied
and failed outcomes are also recorded without private request content. Admin
audit details use allowlisted structured fields; free-form text that could
collect private data is not accepted in the first release.

### Privacy-safe structure hardening

Before any mapping-support package is persisted in the cross-user candidate
library or exported:

- table/header labels are length-bounded, Unicode/control-normalized and passed
  through a strict allowlist;
- emails, account-like tokens, URLs, dates, numeric values, identifiers,
  high-entropy strings and values with insufficient header confidence are
  rejected or replaced with `Column N`;
- labels beginning with spreadsheet formula prefixes (`=`, `+`, `-`, `@`) or
  containing tab/CR control separators are replaced before CSV generation;
- only allowlisted normalized structure and shape classifications are stored;
- cross-user candidate evidence drops the source-file hash/size, total/data row
  counts and per-column empty/non-empty counts present in the uploader-facing
  support package; observation and mapping counts are computed from separate
  authorized database rows rather than copied from one user's statement;
- broker labels are sanitized user-supplied hints, never identity or grouping
  authority; and
- the completed package is scanned for identifiers, statement values,
  filenames, paths and other private material before persistence and again
  before export.

If any table/header label cannot pass the hardened boundary, the attempt keeps
an ungrouped `privacy_review_required` observation with placeholders. It does
not receive a global statement-layout signature, join another user's candidate,
reuse a global mapping or produce a developer package. Account-scoped manual
mapping may still proceed for the trader. A later reviewed sanitizer/adapter
change or active raw-source consent can establish a safe new observation; the
unsafe label itself is never stored in the candidate library.

Failure of this hardening step permits only the minimal placeholder/status
observation described above; it prevents candidate structure/package
persistence and export but does not discard the trader's normal mapper flow or
valid Journal facts.

Implementation splits the current V1 shape into two contracts:

- a server-only inspection record may retain source hash, byte size and exact
  reconciliation counts under the attempt/evidence authority; and
- `journal_statement_mapping_support_v2` is the only browser, durable candidate
  and developer-package structure contract. It contains the sanitized labels,
  table signatures, stable structural profile and mapping suggestions required
  by the mapper, but no source hash/size or data-dependent row/column counts.

Preview confirmation uses a short-lived, signed opaque ref bound server-side to
the authenticated user/workspace/account, attempt, source hash, mapping version
and a 15-minute expiry. The commit still receives the statement bytes again and
verifies them server-side; expiry requires a new preview and the raw source hash
is no longer returned to the browser. The ref is consumed by the first unique
commit; an exact network retry is answered from the scoped idempotency result
rather than performing a second import.

## 7. Information architecture

### Shared admin shell

The shell contains:

- `Journal Administration` title and `Private owner access` label;
- Overview, Users, Imports, Statement Formats, Data Decisions, System and Audit;
- current environment label: Local, Preview or Production;
- current operator role;
- current UTC data-as-of timestamp;
- visible critical alert count; and
- a direct return link to the normal Journal dashboard.

It does not show or change the end user's selected Journal account. Admin
queries span authorized operational scope intentionally and label that scope.
Counts render as integers; rates and measured durations use at most two decimal
places. No trader price, quantity or P/L value is introduced on an admin page.

### Overview page

Top cards:

- registered production users;
- new users in 24 hours, 7 days and 30 days;
- signed-in users in 24 hours, 7 days and 30 days;
- Journal-activated users;
- active Journal accounts;
- users with more than one active Journal account;
- committed imports;
- imports committed with Data Decisions;
- mapping-required attempts;
- system-failed attempts;
- new format candidates awaiting review;
- ungrouped privacy-review-required format observations; and
- unresolved Data Decisions.

Charts and queues:

- 30-day user registrations and Journal activation;
- 30-day import outcomes, stacked by exact state;
- import recognition and commit rates;
- oldest mapping-required attempts;
- statement formats ready for development;
- recurring Data Decision issue codes;
- system failures requiring action; and
- latest backup/restore/runtime status.

### Users page

Columns:

- safe user reference and display name;
- status and created time;
- authentication provider label, never provider subject;
- last successful authentication and last Journal activity;
- active/archived Journal-account counts;
- statement-import count and last import outcome;
- manual-execution count;
- Day/Swing style-plan and swing-note activity;
- analytics-ready round-trip presence;
- unresolved Data Decision count; and
- seven-day/thirty-day Journal activity flags.

Filters:

- active/disabled;
- new/activated/not activated;
- signed in during date range;
- has/does not have successful import;
- has unresolved Data Decisions;
- one/multiple Journal accounts; and
- authentication provider.

The first release is read-only. Session revocation, user suspension, deletion
requests and impersonation require a separate mutation checkpoint. Silent
impersonation is never permitted.

### User detail page

Show:

- safe identity/profile summary;
- login/session counts and last authentication;
- each user-created Journal account, label, state, timezone and base currency;
- per-account import/manual-execution/decision/round-trip counts;
- recent import outcomes;
- unresolved decision categories;
- rules/tags/notes usage counts without content; and
- privacy/export/deletion request state when those policies exist.

Do not aggregate across accounts in a way that looks like one trading account.
Do not show broker identifiers as Journal-account labels.

### Imports page

Columns:

- opaque import reference, coverage kind and submitted/completed times when
  authoritative;
- safe user and Journal-account labels;
- user-supplied broker label;
- detected format/candidate state;
- mapping origin: verified adapter, saved exact account template or manual map;
- adapter/parser/mapping versions;
- current attempt state;
- preserved, mapped, unsupported and decision counts;
- linked committed import state when present;
- processing duration;
- safe failure category; and
- developer-package/consented-source availability.

Filters:

- time range, broker label, format candidate, mapping origin and adapter;
- committed, committed with decisions, duplicate, awaiting mapping, rejected,
  expired or system failed;
- user/Journal account;
- has unresolved decisions;
- privacy-safe package available; and
- consented source available.

### Import detail page

Show the complete append-only state timeline, safe structure summary, mapping
origin, parser versions, count reconciliation, issue categories, linked Data
Decisions, candidate format and reprocess eligibility. It does not display raw
statement values.

### Statement Formats page

Columns:

- opaque format reference;
- canonical and observed broker labels;
- file kind, encoding, delimiter and table kind;
- privacy-safe statement-layout signature label;
- first/last observed timestamps;
- total observations and distinct-user count;
- successful manual mapping count;
- conflicting mapping count;
- currently deployed adapter/template version;
- lifecycle state; and
- recommended next action.

Candidate lifecycle:

1. `observed`
2. `mapping_available`
3. `ready_for_development`
4. `in_development`
5. `validating`
6. `supported`

Terminal alternatives are `duplicate` and `rejected`. Every transition is
append-only, role-authorized and audited. `supported` is allowed only when the
deployed code registry reports the same statement-layout signature,
constituent table signatures, adapter/template version and fixture digest.
The stored lifecycle history is not runtime authority by itself. If a deployed
registry entry is missing or changes after a candidate reached `supported`, the
effective state is `support_drift`: matching fails closed, an alert is raised
and history is preserved until a reviewed deployment/reconciliation restores
support.

Ungrouped `privacy_review_required` observations appear in a separate queue and
do not receive a candidate reference or distinct-user aggregation until a safe
layout signature exists.

The page also inventories every deployed supported-format registry entry even
when no post-instrumentation user observation exists. Registry-only rows are
clearly labeled `deployed_unobserved` and do not create a synthetic candidate or
user observation. When signatures match, the runtime entry and candidate are
joined in the read model rather than displayed twice.

### Statement format detail page

Show:

- sanitized headers/table labels and shape evidence;
- suggested and user-confirmed mapping variants with observation counts;
- disagreements between successful mappings;
- parsing/failure categories;
- ungrouped privacy-review-required observation counts;
- affected attempt counts and reprocess eligibility;
- runtime adapter/template match status;
- candidate lifecycle timeline;
- privacy-safe developer-package download; and
- separately gated consented-source availability.

An administrator may classify, merge duplicate candidates, reject an unsafe
candidate or advance development state. The UI cannot create executable parser
code or promote a mapping directly into global runtime authority.

### Data Decisions page

Show operational aggregates and links, not trader decision controls:

- unresolved/resolved counts by issue code, target kind, broker/format and age;
- affected users, Journal accounts, imports and round-trip chains as counts;
- oldest unresolved items;
- analytics surfaces limited by pending facts;
- resolution action distribution;
- repeated format-specific issue patterns; and
- decision/rebuild failures.

The administrator can identify an importer defect and link to the privacy-safe
import evidence. Only the trader can correct, exclude, merge, confirm coverage
or classify an open position.

### System page

Show:

- application version/commit and environment;
- schema migration count/digest and drift result;
- database integrity/foreign-key/quick-check receipt timestamps;
- database size, WAL size and storage utilization;
- processing queue depth, user-waiting attempt counts, oldest machine-processing
  attempt and duration percentiles;
- last successful backup and independent restore verification;
- Discord configuration/readiness without secrets;
- provider and background-operation status;
- startup/health-check history; and
- unresolved operational failures.

Expensive integrity checks run through maintenance commands and record safe
receipts. Ordinary admin page loads do not repeatedly run full database checks.

### Audit page

Show immutable events for:

- operator login/access denial;
- user/import sensitive drill-down;
- privacy-safe developer-package export;
- consented raw-source export;
- candidate lifecycle change or merge;
- offline owner grant/recovery/revoke;
- future session revoke/user suspend; and
- operational configuration or reprocess action.

The audit view never prints token values, raw IDs, source paths or downloaded
content.

## 8. Exact metric definitions

| Metric | Definition |
| --- | --- |
| Registered production user | Distinct `platform_users.user_id` that has ever had a `platform_auth_identities` row whose `auth_provider = 'discord'`; current revoked/disabled state is reported separately, legacy provider fields on `platform_users` are not authority, and development-only users are excluded |
| New user | Registered production user whose first Discord identity `created_at_utc` falls in the selected UTC range; a development-only user is counted only if/when a production Discord identity is linked |
| Signed-in user | Distinct registered production user with a Discord `platform_auth_sessions.last_seen_at_utc` in the selected range; this is historical successful session activity, even if later revoked, and is not page engagement |
| Journal-activated user | Distinct user with at least one accepted broker execution or accepted manual execution in any owned Journal account |
| Active Journal account | `journal_accounts.status = 'active'`; never inferred from broker identities |
| Multiple-account user | User owning at least two active user-created Journal accounts |
| Committed import | Accepted broker-statement import batch with zero pending decisions, whether or not it predates attempt instrumentation |
| Committed with decisions | Broker-statement import batch in `accepted_with_decisions`; valid unrelated facts remain usable, whether or not it predates attempt instrumentation |
| Mapping required | Structurally readable upload awaiting a user-confirmed mapping and not yet committed |
| Format recognition rate | Safely inspected attempts matched by a verified adapter or exact saved account template divided by safely inspected attempts that produced a statement-layout signature; unsafe/pre-inspection rejections and infrastructure failures before structure extraction are excluded |
| Import commit rate | Among attempts durably admitted on/after the recorded instrumentation start only: `committed + committed_with_decisions` divided by `committed + committed_with_decisions + rejected + system_failed`; historical batches, duplicates, explicit cancellations, expiry and active/resumable attempts are displayed separately and excluded |
| System failure rate | Among attempts durably admitted on/after the recorded instrumentation start only: `system_failed` divided by the same terminal-outcome denominator used by import commit rate; user/data issues are not relabeled as system failures |
| Analytics-ready user | Distinct registered production user owning a Journal account with at least one `ready_closed` Journal round trip |
| Unresolved Data Decision | Current decision state requiring trader action; open positions confirmed as legitimate are not unresolved |
| New format candidate | Unique privacy-safe statement-layout signature not matched by the deployed supported-format registry |

Every dashboard total includes the time range, timezone basis and data-as-of
timestamp. Empty populations display zero; unavailable metrics display an
explanation, never an invented zero.

Migration 0020 creates the coverage registry, and the fully instrumented import
runtime records the exact attempt-instrumentation activation timestamp. It does
not invent attempts or state-transition events for existing import batches.
Pre-instrumentation batches remain visible as `historical_committed_import`
records with only their authoritative batch/evidence timeline and an explicit
`attempt telemetry unavailable` coverage label. Attempt outcome/rate cards use
only post-instrumentation attempts; total committed-import cards may include all
authoritative committed batches and display the historical/post-instrumentation
breakdown.

The Imports list is the disjoint union of all tracked attempts and committed
Journal import batches for which no attempt link exists. A linked batch appears
only through its attempt row. This prevents a newly committed import from being
counted or listed twice.

The migration does not reopen or rescan historical raw statements to populate
format candidates. A historical source contributes a new format observation
only through the trader's normal re-preview flow, active support consent, or the
separate owner-owned test-statement boundary.

`Last Journal activity` is the greatest authoritative timestamp from import
attempt/events, accepted manual-execution provenance, Data Decision events,
annotation lifecycle/revision events, trade-style-plan events and swing-note
revisions visible to that user. Page views are not Journal activity.
Operational metric buckets use UTC; a browser-local rendering may be shown only
when it remains explicitly labeled and never changes the UTC aggregation
boundary.

## 9. Import-attempt lifecycle

Authentication, same-origin/CSRF, size, type and basic safety checks occur before
an upload is admitted. The admin import queue begins only when the server commits
both an import-attempt row and its immutable `received` event. That point is a
**durably admitted upload**, and only durably admitted uploads enter attempt
metrics. A rejection before durable admission is an allowlisted security or
operational event, not an import attempt and not part of import-rate
denominators.

Active states:

- `received`
- `inspecting`
- `awaiting_mapping`
- `preview_ready`
- `committing`

Terminal states:

- `committed`
- `committed_with_decisions`
- `duplicate`
- `rejected`
- `system_failed`
- `user_cancelled`
- `expired`

Rules:

- Every transition appends an event and updates the validated current-state
  projection in one transaction using the expected current revision.
- The browser supplies a random attempt idempotency reference for each selected
  file, scoped server-side to the authenticated user, workspace and Journal
  account. Network retries reuse it. Source-file SHA-256 is computed server-side
  for reconciliation and is never returned in an admin URL or DTO.
- A committed attempt links to the immutable Journal import batch/event.
- An `awaiting_mapping` or `preview_ready` user-waiting attempt remains resumable
  for seven days. Without active support-source consent, the trader must reselect
  the same file; its server-side hash must match before saved mapping/preview
  state resumes. After seven days an untouched attempt becomes `expired` and a
  later upload starts a new attempt.
- Resume begins from the user's normal Import History with the existing opaque
  `importRef`. A fresh upload that matches an active attempt in the same scope
  may offer that resume path but never silently attaches to it or exposes a
  match across another user/workspace/account.
- `system_failed` means application/infrastructure failure, not a bad row or
  unsupported statement.
- An unsafe file is `rejected` with an allowlisted reason.
- Exact duplicate remains visible but does not count as a failed import.
- `user_cancelled` is recorded only by an explicit authenticated cancellation
  action before commit. Closing a browser is not treated as cancellation;
  abandoned resumable attempts expire.
- Journal import finalization and the attempt terminal state/event commit in one
  database transaction. Startup recovery reconciles an orphaned `committing`
  attempt from its idempotency and committed-batch link; it never guesses or
  creates a second import.
- No state stores raw exception stacks for admin display. Internal logs use a
  request correlation ref without private identifiers.
- Manual Trade Tracker executions do not create broker import attempts.

## 10. Statement-format learning workflow

Every structurally readable durably admitted upload produces a privacy-safe
observation, including successful known formats and successful manual mappings.
Two different identities are retained:

- a **table structural signature**, the existing deterministic signature for
  one sanitized table/section; and
- a **statement-layout signature**, a deterministic digest of support-package
  version, file kind, encoding/delimiter, the canonical source-order sequence of
  every constituent table descriptor/signature (including repeated tables) and
  the privacy-safe record-shape profile.

The global candidate library is keyed by exact statement-layout signature.
Observations retain their constituent table signatures. This prevents a
multi-section statement from incorrectly becoming one global candidate per
table while preserving exact table evidence for adapter development.

The statement-layout digest input is the deterministic JSON array
`[packageVersion,fileKind,normalizedEncoding,delimiterOrNull,tables,recordShape]`.
`tables` is the source-order array of `[ordinal,tableKind,tableSignature]` and
retains duplicate occurrences. `recordShape` contains only the sorted unique
record field counts from the hardened support-package contract. It explicitly
excludes total/data row counts, empty/non-empty counts, length buckets and
observed value-shape distributions so two months of the same statement layout
do not become different candidates merely because the trades differ.
`JSON.stringify` output receives one LF, is encoded as UTF-8 and hashed to
lowercase SHA-256. Object-key order, broker label and raw values never
participate.

1. Validate file type/size and stage it privately.
2. Create the import attempt and immutable `received` event.
3. Produce the server-only inspection record and hardened
   `journal_statement_mapping_support_v2` structure DTO; keep source hash/size
   and data-dependent counts server-side.
4. Compare the exact statement-layout signature and constituent table
   signatures to:
   - deployed verified adapters/templates;
   - the selected Journal account's exact accepted mapping history; and
   - the global candidate library for administrative evidence only.
5. If no safe user mapping exists, return the mapper and record
   `awaiting_mapping`.
6. When the trader maps successfully, store the account-scoped mapping through
   normal import authority and record a privacy-safe format observation.
7. Group observations by exact statement layout. Broker name is a sanitized
   user label, not grouping authority. There is no fuzzy match.
8. Detect conflicting mapping contracts for the same structure. Conflict blocks
   global promotion and becomes a visible review item.
9. Let the authorized owner-admin download the privacy-safe development package.
10. Implement a code-owned adapter/template and synthetic or consented fixture.
11. Run focused parser, mapping, reconstruction and privacy checks.
12. Deploy a versioned supported-format registry entry. One adapter family and
   version may declare one or more exact supported statement-layout signatures.
13. Reconcile the deployed layout signature, constituent table signatures,
   adapter/template version and fixture digest before the candidate can become
   `supported`.
14. Notify affected users that support is available and offer a normal preview
   and confirmation flow. Never silently reprocess.

Merging two candidates creates an immutable alias from the duplicate candidate
to the retained candidate after an expected-revision check. It never deletes or
rewrites either candidate's observations, consent history or audit evidence.

## 11. Developer package and raw-source boundary

### Default privacy-safe developer package

Download name uses only an opaque candidate ref. The generated bundle contains:

- `manifest.json`: package version, candidate ref, safe broker-label summary,
  observation counts, parser versions and failure categories;
- `structure.json`: encoding, delimiter, table kind, sanitized table/header
  labels, field counts and privacy-safe column-shape evidence;
- `candidate-mappings.json`: suggested and user-confirmed field mappings with
  counts and conflict markers;
- `fixture-skeleton.csv`: exact sanitized headings with typed placeholders, not
  user values; and
- `README.md`: expected adapter work, known uncertainties and acceptance tests.

It excludes raw rows/values, original filename/path, source-file hash, broker
account identity, Platform/Journal UUIDs, Discord/email data and user-authored
notes. Generation and download are audited.

Bundle entry names are the fixed allowlist above; no uploaded or user-supplied
name becomes an archive path. Entry count and uncompressed/compressed byte size
are capped, path traversal is rejected, and all responses use an opaque
candidate-ref filename plus `nosniff`, private/no-store and attachment headers.

### Consented raw source

Raw statement download is a separate action and never bundled by default.

- Consent is off by default. The user explicitly opts in to purpose
  `importer_development` during upload or later from normal Import History, and
  may revoke it there without contacting the administrator. Later opt-in for a
  failed/uncommitted attempt whose bytes were not retained requires the user to
  reselect the exact file and pass the server-side hash match before it can be
  placed in the support-source vault.
- Consent is bound to one source/attempt, records grant/revoke/expiry events and
  never changes Journal evidence-retention obligations. The default consent
  expires after 90 days; a shorter policy may be configured, never a hidden
  indefinite grant.
- Revocation/expiry prevents future server access; it cannot recall a file the
  administrator already downloaded. The consent UI states this plainly and the
  user's Import History records completed download count/latest time.
- A source already committed as immutable Journal evidence remains in the
  Journal evidence vault under normal Journal retention. Revocation or expiry
  blocks future importer-development access but does not delete evidence needed
  for the trader's Journal.
- A consented failed or uncommitted upload is stored separately in a private
  Journal support-source vault using a random object key. It is not represented
  as committed Journal evidence. Revocation or expiry queues and verifies its
  purge and records a privacy-safe purge receipt.
- The support-source vault has its own required server configuration root,
  `TRADERLINK_PLATFORM_JOURNAL_SUPPORT_SOURCE_ROOT`, outside Git and outside the
  immutable evidence-vault namespace, with the same or stricter private-volume
  permissions. It is excluded from normal database and immutable-evidence backup
  sets so a consent expiry can remove all durable support copies; loss of a
  support object is reported as unavailable and never blocks the trader's
  Journal.
- Support objects are never exposed through a static/public file route or a
  bearer storage URL; the authorized server reads and streams the exact object
  only after consent and audit checks.
- Without active consent, staged bytes for a failed or uncommitted upload are
  deleted after the request completes. Privacy-safe structure/mapping evidence
  may remain after it passes the hardening boundary.
- A consented support object is hash-verified, written to a private temporary
  key, flushed and atomically promoted before its metadata/consent event becomes
  visible. A failed metadata transaction deletes the unreferenced object; a
  startup orphan sweep removes unreferenced objects older than the configured
  grace period. Revocation/expiry first makes the object inaccessible, then
  deletes and verifies it before recording `purged`; deletion failure remains a
  visible retrying `purge_failed` alert, never an active download permission.
- No source appears in the repository, public object storage, logs, telemetry,
  screenshots or support packages.
- Download is POST-only and requires `journal_owner_admin`, current Discord
  evidence/reauthentication within five minutes, same-origin/CSRF validation, a
  reason code and an audit event written before streaming begins. Denied,
  failed and completed outcomes are recorded.
- The response uses private/no-store headers and a sanitized opaque download
  name. Any server-side temporary artifact is removed and verified after the
  operation. A browser-downloaded copy is outside the server's deletion control,
  is treated as sensitive, must remain outside Git/synced folders and is deleted
  by the operator after a synthetic/redacted fixture is derived.
- Owner-owned local test statements may be used under the owner's existing
  authorization without pretending that customer consent exists.

The ordinary Journal APIs expose purpose and expiry clearly and provide
authenticated grant/revoke actions using an opaque import reference. Import
History also shows the current consent state, expiry, purge state and the count/
most recent timestamp of completed administrator downloads, without exposing
operator internals or storage identifiers.

## 12. Database plan

No admin database is created. New tables use the accepted Platform database and
retain logical module ownership.

### Migration 0019: Platform administration

`0019_platform_administration.ts` adds:

1. `platform_operator_grants`
   - stable grant ID, Platform user and fixed
     `authority_key = 'journal_administration'`;
   - fixed `journal_owner_admin` role, active/revoked state, grant/recovery/
     revoke actor and timestamps;
   - no physical delete and no revoked-to-active mutation;
   - one active Journal owner-admin grant globally, enforced by a unique
     partial index on the fixed active authority key.
2. `platform_admin_audit_events`
   - immutable event ID, actor kind, optional actor user, role, action, target
     kind, opaque target digest, outcome, allowlisted reason code, request
     correlation ref and UTC;
   - `bootstrap_console` supports the first offline grant without inventing an
     authenticated actor; its preview/execute receipt digest is retained;
   - allowlisted privacy-safe details JSON only;
   - append-only, no update/delete.
3. `platform_operational_events`
   - immutable backup, restore, integrity, startup, deployment and background
     operation receipts;
   - state/outcome, safe counts/digests/timestamps and no secret/path values.

### Migration 0020: Journal import operations and format learning

`0020_journal_import_operations.ts` adds:

1. `journal_import_instrumentation_epochs`
   - coverage epoch with immutable activation timestamp/application version and
     an optional one-time close timestamp/reason; no reopen or physical delete;
   - the first epoch is activated only when every public statement-upload path
     is using attempt instrumentation; until then attempt rates are unavailable.
2. `journal_import_attempts`
   - current state/revision projection, actor/workspace/account, request
     idempotency ref, server-only source hash, optional committed import batch,
     safe broker label, allowlisted file kind/byte size, versions, counts,
     failure code and timestamps; original filenames and client paths are never
     stored;
   - the idempotency ref is unique inside the authenticated owner/workspace/
     account scope and cannot be used to probe another scope.
3. `journal_import_attempt_events`
   - immutable attempt state transitions and privacy-safe reconciliation counts.
4. `journal_statement_format_candidates`
   - global exact statement-layout signature, canonical safe label, current
     lifecycle/revision/version correspondence and aggregate timestamps.
5. `journal_statement_format_candidate_events`
   - append-only lifecycle, merge/reject/deployment-reconciliation events.
6. `journal_statement_format_candidate_aliases`
   - immutable duplicate-to-retained candidate relationship with expected
     revision and audit correlation; observations are never moved or deleted.
7. `journal_statement_format_observations`
   - one inspected-statement observation, statement-layout signature,
     constituent table signatures, sanitized structure package, safe mapping
     contract and outcome;
   - exactly one authorized source relationship: a new attempt or a trader-
     re-previewed historical batch, plus an optional candidate link. An
     owner-owned test statement submitted to the Journal follows the same
     attempt relationship.
8. `journal_statement_support_objects`
   - private support-vault metadata for consented failed/uncommitted sources:
     opaque random object key, byte/hash evidence, expiry, purge state and
     privacy-safe purge receipt; no repository path or raw bytes in SQLite.
9. `journal_statement_support_consents`
   - current purpose-bound grant/revoke/expiry projection for exactly one
     committed-evidence source or one support object.
10. `journal_statement_support_consent_events`
   - immutable consent history and actor/time/purpose; no raw source data.

All user/workspace/account/import relationships use composite foreign keys where
applicable. UTC, UUID, JSON, token and state checks follow the accepted migration
contract. Unexpected tables, schema digest drift or checksum mismatch fail
closed. Every table receives indexes for the exact admin time/state/user/
candidate queries; no speculative broad indexes are added.

Attempt/import finalization and sensitive admin mutation/audit pairs share the
same database transaction. Append-only event and audit tables have database
guards against update/delete. No administrative DTO exposes source hashes,
support-vault object keys or storage paths.

No summary/materialized analytics table is added initially. Read models query
the authoritative indexed facts. Add daily rollups only if measured production
latency proves them necessary.

## 13. Server contracts and planned source layout

### Platform administration

Planned modules:

- `src/modules/platform/server/administration/platform-operator-repository.ts`
- `src/modules/platform/server/administration/platform-admin-authorization.ts`
- `src/modules/platform/server/administration/platform-admin-audit-repository.ts`
- `src/modules/platform/server/administration/platform-operational-event-repository.ts`
- `src/modules/platform/contracts/journal-admin-scope.ts`
- `src/scripts/manage-traderlink-journal-admin-operator.ts`

### Journal administration

Planned modules:

- `src/modules/journal/server/administration/journal-admin-overview-service.ts`
- `src/modules/journal/server/administration/journal-admin-user-service.ts`
- `src/modules/journal/server/administration/journal-admin-import-service.ts`
- `src/modules/journal/server/administration/journal-admin-decision-service.ts`
- `src/modules/journal/server/administration/journal-statement-format-repository.ts`
- `src/modules/journal/server/administration/journal-statement-format-service.ts`
- `src/modules/journal/server/administration/journal-developer-package-service.ts`
- `src/modules/journal/server/administration/journal-support-consent-service.ts`
- `src/modules/journal/server/administration/journal-support-source-vault.ts`
- `src/modules/journal/server/administration/journal-import-attempt-recovery.ts`
- `src/modules/journal/contracts/journal-administration-contracts.ts`
- `src/scripts/verify-traderlink-platform-journal-admin-files.ts`

The operator script has `preview` and `execute` modes for `grant`, `recover` and
`revoke`. Execute consumes the matching preview receipt and cannot infer a
target identity. The verifier is static/focused and does not create the real
operator grant, retain a source file or mutate the protected database.

The admin services consume Platform and Journal repositories; they do not query
V3, legacy databases or repository-local trade stores.

### APIs

Read APIs:

- `GET /api/admin/journal/overview`
- `GET /api/admin/journal/users`
- `GET /api/admin/journal/imports`
- `GET /api/admin/journal/statement-formats`
- `GET /api/admin/journal/statement-formats/[formatRef]`
- `GET /api/admin/journal/data-decisions`
- `GET /api/admin/journal/system`
- `GET /api/admin/journal/audit`

Initial mutations:

- `POST /api/admin/journal/users/[userRef]/detail-access`
- `POST /api/admin/journal/imports/[importRef]/detail-access`
- `POST /api/admin/journal/statement-formats/[formatRef]/transition`
- `POST /api/admin/journal/statement-formats/[formatRef]/merge`
- `POST /api/admin/journal/statement-formats/[formatRef]/developer-package`
- `POST /api/admin/journal/imports/[importRef]/consented-source-download`

Ordinary authenticated Journal consent actions:

- `POST /api/platform/journal/imports/[importRef]/support-consent`
- `DELETE /api/platform/journal/imports/[importRef]/support-consent`

These two routes remain user/workspace/account scoped through the normal
Journal authorization boundary. They cannot grant access to another user's
source and do not require Journal Administration access.

User/import detail access is POST rather than a reason-bearing GET. It requires
the allowlisted reason code, CSRF protection and pre-disclosure audit, and the
reason never appears in a URL, referrer or cache key. Overview/list responses
remain privacy-safe and do not include the gated detail payload.

No initial API resolves user Data Decisions, changes executions, impersonates a
user, automatically reprocesses imports or grants itself admin access.

All lists use bounded cursor pagination, stable ordering, validated filters and
aggregate totals with declared coverage. Error responses expose allowlisted
admin codes, never internal stacks or identifiers.

Every admin mutation includes an idempotency key and `expectedRevision` where a
current projection can change. A stale revision returns a safe conflict and does
not append a successful lifecycle event. Same-origin, CSRF, authorization,
freshness and rate-limit checks run before mutation. A consented-source download
is POST-only, does not place a token or reason in its URL and never redirects to
an unaudited storage URL.

## 14. Alerts and operational thresholds

Initial alerts are informational except schema/integrity/security failures:

- **Critical:** schema checksum/digest mismatch, failed foreign-key/integrity
  receipt, missing production database/volume, unauthorized admin attempt or
  failed backup with no valid recent backup, or a stored `supported` candidate
  whose deployed registry/fixture evidence no longer matches.
- **High:** an attempt remains in `received`, `inspecting` or `committing` longer
  than 15 minutes, system-failure rate is at least 5% with at least five terminal
  attempts in the same denominator defined in Section 8 during one hour, stale
  Discord-owner evidence blocks the real operator, or a deployed format
  produces a new repeated system failure. User-waiting `awaiting_mapping` and
  `preview_ready` states use their documented expiry/reminder rules instead of
  the machine-processing threshold.
- **Review:** unknown format seen in at least three attempts or two distinct
  users, any successful manual mapping for an unknown format, conflicting
  mappings for one statement-layout signature, or a format ready for
  development.
- **Maintenance:** no successful backup within 24 hours, no independent restore
  verification within 7 days, WAL/storage threshold exceeded, or expired
  operational receipt.

Thresholds live in one server configuration contract and display beside the
alert. They are not hidden magic numbers in UI components.

## 15. Notifications and reprocessing

After a format becomes runtime-supported:

- affected attempts receive a safe `support_available` association/event;
- the user sees a notification on the Imports page after normal authentication;
- the user selects the intended Journal account, previews the statement again
  and confirms any source-identity relationship;
- existing immutable evidence remains and a new import event/supersession links
  the result;
- unresolved facts still enter Data Decisions; and
- administrator activity is audited.

Email is not required. Discord notification is a later opt-in product decision;
Discord authentication does not imply permission to send direct messages.

## 16. Implementation phases

### Admin 0: Plan acceptance

- Perfect and owner-accept this document.
- Reverify repository, database, Discord identity boundary and existing admin
  route inventory.
- Create a progress tracker linked here and from the master plan.
- No code or migration begins before acceptance.

### Admin 1: Operator authority and audit foundation

- Implement migration 0019, operator grant preview/execute/revoke commands and
  fail-closed local/production authorization.
- Implement the five-minute Discord-owner freshness rule, same-origin/CSRF and
  rate-limit boundary before exposing an admin page or mutation.
- Add append-only audit and operational event repositories.
- Prove only the exact Discord-linked current server owner plus the singleton
  grant can enter; guild ownership or grant alone, Premium role and workspace
  admin all fail.
- Do not create the real production operator grant until the exact Discord owner
  link is accepted during go-live preparation.

### Admin 2: Import-attempt and statement-format evidence

- Back up and restore-verify the protected database.
- Implement migration 0020 and repositories.
- Harden and privacy-scan the existing mapping-support package before it becomes
  durable cross-user administrative evidence.
- Replace the V1 browser package/source-hash confirmation with the hardened V2
  DTO and short-lived opaque preview confirmation ref; retain V1 only as a
  temporary internal migration input until all callers are removed.
- Implement ordinary user grant/revoke consent controls, the separate private
  support-source vault and expiry/purge receipts.
- Instrument upload preview/commit paths with durable admission, scoped request
  idempotency and transactional commit/recovery so every outcome closes or
  remains in the documented seven-day resumable state.
- Activate the first instrumentation epoch only after every public
  statement-upload path is covered; preserve older committed batches with an
  explicit historical-coverage label instead of synthetic attempt rows.
- Persist privacy-safe observations after both failed detection and successful
  user mapping.
- Keep account-scoped saved templates unchanged and isolated.

### Admin 3: Read models and APIs

- Implement exact metric definitions, bounded queries and opaque references.
- Build Users, Imports, Format Candidates, Data Decisions, System and Audit
  services without UI.
- Verify counts independently against authoritative tables.

### Admin 4: Shell, Overview and Users

- Build the light Material Journal Administration shell and Overview/Users
  pages.
- Keep admin navigation distinct from the trader dashboard and Watchlist admin.
- Obtain one coherent visual review after the integrated shell/pages are useful;
  small technical batches need not repeatedly stop for empty scaffolding.

### Admin 5: Imports, Statement Formats and Data Decisions

- Build import timeline/filtering, candidate lifecycle, developer-package
  generation, consent-gated source download and decision aggregates.
- Prove no administrator path can change trader facts.
- Conduct the next owner visual review with realistic privacy-safe states.

### Admin 6: System and Audit

- Add operational receipt ingestion/read models, health alerts and audit page.
- Confirm ordinary page loads do not perform expensive integrity work or expose
  paths/secrets.

### Admin 7: Production Discord owner activation

- Link the owner's exact Discord identity through the accepted initial-owner
  command.
- Create the initial `journal_owner_admin` grant through an explicit privileged
  command, never OAuth callback behavior.
- Prove unauthenticated, ordinary member, Premium member, workspace admin,
  revoked-session and disabled-user requests all fail.
- Preserve guarded loopback review without enabling it in production.

### Admin 8: Acceptance and launch preparation

- Run focused tests during each slice with one worker under resource pressure.
- Run broad TypeScript/lint/regression/build/browser/privacy/recovery checks once
  at the integrated admin acceptance checkpoint.
- Rehearse backup/restore and rollback before the real migrations or deployment.
- Record exact evidence and update the master plan/progress/register.
- Publishing, deployment, DNS and production data changes remain separately
  controlled external actions.

## 17. Verification contract

### Authorization

- Exact owner Discord identity plus current configured-server `guild_owner`
  evidence plus the singleton active grant succeeds.
- Discord login without grant fails.
- Guild-owner evidence without the grant, a grant without current guild-owner
  evidence, Premium role, workspace owner/admin and forged refs fail.
- Development owner works only through the distinct guarded loopback scope,
  creates no production operator grant and fails for production or remote-host
  requests.
- Revoked grant/session and disabled user fail immediately.
- Membership evidence older than five minutes, Discord refresh failure and
  transferred guild ownership fail closed; a successful refresh restores only
  the still-authorized exact owner.
- Cross-origin, missing/invalid CSRF, replayed mutation, stale revision and
  rate-limited requests fail without changing state.

### Cross-user and cross-account isolation

- Admin aggregates span the intended operational population only after global
  grant authorization.
- Ordinary user routes remain scoped to their workspace/selected account.
- A user-created Journal account never becomes a broker-account boundary.
- User mappings remain account-scoped until code-reviewed global support.
- Opaque refs cannot cross target kinds or be forged.

### Imports and formats

- Every durably admitted upload gets exactly one attempt and valid event
  history; pre-admission safety/authentication rejection is not counted as an
  attempt.
- Existing committed batches appear with explicit pre-instrumentation coverage;
  no synthetic attempt or failure history is created, and rate denominators do
  not mix historical success-only evidence with fully observed attempts.
- Every terminal outcome has exact counts/reason and no hanging `committing` row.
- Success, success-with-decisions, mapping, duplicate, rejection and system
  failure remain distinct.
- Successful manual mappings create observations even when the import commits.
- Same structure/mapping groups; changed structure or conflicting mapping does
  not silently reuse.
- Candidate `supported` fails without exact deployed registry/fixture evidence.
- Registry rollback/removal turns effective support into visible
  `support_drift`; it does not silently keep matching or erase lifecycle history.
- A second run is idempotent and does not duplicate observations/events.
- Network retry, browser abandonment, explicit cancellation, seven-day expiry,
  exact-file reselection and process interruption during `committing` all
  reconcile without duplicate imports or guessed state.
- Multi-table statements create one exact statement-layout candidate while
  retaining all constituent table signatures.

### Privacy

- DTO, rendered HTML, logs, errors, URLs, audit details and default packages
  contain no raw identifiers, values, filenames, paths, tokens or UUIDs.
- Browser mapping DTOs and preview confirmations contain no source-file hash,
  byte size or data-dependent statement counts; an opaque ref cannot be replayed
  by another user/workspace/account or after expiry.
- Ambiguous/private-looking headings become `Column N`; persisted and exported
  developer packages pass the hardened package privacy scan.
- Raw-source download fails without active purpose-bound consent and role.
- Consent defaults off, expires, can be revoked by the source owner and purges a
  failed/uncommitted support object while preserving required committed Journal
  evidence.
- Download, lifecycle transition and sensitive drill-down create audit events
  before disclosure or atomically with mutation; audit failure fails the action.
- No private artifact enters Git or the standalone build.

### Metrics

- Every card reconciles independently to source tables for identical time/scope.
- Development/test identities are excluded from production user totals.
- Manual executions do not inflate broker import totals.
- Accepted-with-decisions remains a successful evidence import but is visibly
  distinct from fully ready facts.
- Empty and unavailable states are accurate and explained.

### Operations

- Migration manifest/checksum/schema digest, foreign keys, quick/integrity
  checks and backup/restore pass.
- Dashboard requests are bounded and indexed; target response budgets are
  documented after measurement, not guessed.
- Storage/volume and provider health return an explicit unavailable state when
  the operating system or provider cannot supply them; they never become a
  fabricated zero/healthy result.
- Ports, processes, database hash/size/WAL and private evidence remain controlled
  throughout verification.

## 18. Stop conditions

Stop the affected implementation or operation if:

- the Watchlist admin or another computer-run process would be modified;
- `/intelligence/admin`, `/workspace/admin` or Level Analysis admin authority is
  accidentally reused;
- Discord membership or a workspace role can grant global administration;
- stale Discord membership can authorize access or sensitive download;
- a mutation/download can bypass same-origin, CSRF, freshness, rate-limit,
  idempotency, expected-revision or audit requirements;
- an admin response or package exposes raw IDs, statement values, filenames,
  paths, tokens, broker identities or user-authored content;
- a user mapping could become globally authoritative without code/fixture proof;
- an administrator could resolve Data Decisions or mutate executions silently;
- a source download lacks active consent or an owner-owned test-data boundary;
- unconsented failed/uncommitted source bytes survive request completion, or a
  revoked/expired support object cannot be proven purged;
- a cross-user package has not passed the hardened structure privacy scan;
- import attempt and committed-batch counts cannot reconcile;
- database schema/hash/WAL, repository state, ports or processes drift
  unexpectedly; or
- real migrations, Discord owner linking, deployment or source transfer would
  exceed the accepted checkpoint.

## 19. Acceptance checklist

- [x] Owner accepts this plan and route/naming boundary.
- [x] Watchlist admin is recorded as separate and untouched.
- [x] Legacy V3/operations admin routes are not Journal admin dependencies.
- [ ] The owner's exact Discord-linked Platform user plus current TradersLink
      server ownership plus the one active operator grant is the only successful
      production authorization path.
- [x] Discord membership freshness, reauthentication, same-origin/CSRF,
      idempotency, revision and rate-limit rules pass their failure cases.
- [x] Overview definitions reconcile exactly.
- [x] Historical committed imports remain visible without fabricated attempt
      events, and attempt rates declare their instrumentation coverage start.
- [x] Users and multiple Journal accounts display without broker-account
      confusion.
- [x] All import outcomes are durable, distinct and filterable.
- [x] Network retries, abandoned mapping attempts and interrupted commits do not
      duplicate or strand an import.
- [x] Failed/unknown and successfully mapped structures enter the candidate
      library.
- [x] Multi-section statements group by exact statement layout while retaining
      constituent table signatures.
- [x] Privacy-safe developer package is sufficient for importer coding.
- [x] Cross-user packages pass the hardened label/privacy scan.
- [x] Hardened V2 mapping/preview browser contracts expose no source hash or
      data-dependent statement counts and cannot cross authorization scope.
- [ ] Raw source requires active expiring/revocable consent, fresh owner role and
      pre-disclosure audit; uncommitted support sources purge on revoke/expiry.
- [x] Global format support requires deployed code/fixture evidence.
- [x] Deployed formats remain visible without synthetic observations, and a
      matching runtime entry/candidate is not listed twice.
- [x] No automatic import rewrite or admin resolution of trader facts exists.
- [x] Data Decision aggregates identify systemic issues without exposing values.
- [x] System/backup/restore health is current and privacy-safe.
- [x] Sensitive access and mutations are append-only audited.
- [ ] Focused and final checkpoint verification pass under the resource-aware
      cadence.
- [x] No V3, legacy database, Watchlist admin or test-data authority is revived.

## 20. Explicitly deferred

- Watchlist administration or its computer-run process.
- Consolidating all product admin tools under a common `/admin` landing page.
- Email/password authentication.
- Billing/subscription administration.
- Administrator impersonation.
- Editing, deleting or resolving users' executions, trades or Data Decisions.
- Cross-user P/L leaderboards or trading-performance surveillance.
- Page-view analytics beyond exact Journal operational/adoption facts.
- Automatic Discord direct messages.
- Automatic global promotion of user mappings.
- Automatic reprocessing after a new format release.
- Physical legacy cleanup, Git publication, deployment or DNS changes.
