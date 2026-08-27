# Moomoo Import Reliability And Admin Errors Plan

**Status:** Owner approved for implementation on 2026-08-09. This plan is a
bounded correction slice over the existing Moomoo connection and execution
import. Live `trade:read` proof remains deferred to invited beta users.

**Progress:** [Moomoo Import Reliability And Admin Errors Progress](moomoo-import-reliability-and-admin-errors-progress.md)

**Continuation handoff:** [Moomoo Import Reliability And Admin Errors Handoff](moomoo-import-reliability-and-admin-errors-handoff.md)

## Approved incremental-import usability follow-on - 2026-08-16

The owner approved a hybrid import experience for the invited beta:

1. The first history import remains an explicit user action with the trader's
   first-execution date.
2. Automatic incremental imports remain the normal ongoing behavior after that
   first import completes. The existing server-configurable 15-minute due
   interval and protected worker boundary remain unchanged.
3. Every completed linked account also offers **Import latest trades** for an
   immediate user-requested check. It reuses the account's completed import
   boundary and the same bounded 24-hour provider-update overlap as an automatic
   incremental job; it does not ask for another historical start date.
4. **Import older trades** remains a separate dated action. The two actions
   must not be combined or described as statement importing.
5. The Account page explains that automatic checks continue without keeping
   the page open and that the manual latest-trades action is optional.
6. No new table, migration, OAuth permission, provider payload, heartbeat or
   hosted scheduler activation is required for this follow-on.
7. The Daily Trade Tracker Help guide is updated with the same distinction.

The owner approved the interaction contract and explicitly waived a separate
visual-review gate for this small Account-page follow-on. Port 3010 remains
closed.

## Outcome

Make the existing Moomoo OAuth and execution-import path dependable enough for
an invited hosted beta, and give the owner one professional Admin Errors page
for privacy-safe failure review. The page is designed to accept other
TraderLink error sources later, but this slice records and displays only errors
from the Moomoo connection, account-link and execution-import work.

## User experience contract

1. Expected connection and import failures return plain trader-facing copy.
   Internal codes, provider payloads, account identifiers, tokens and stack
   traces never appear in the user account.
2. When a failure was successfully recorded for administration, the user is
   told: "The details were automatically sent to TradersLink administration,
   and we are working on it." The application does not make that claim if the
   diagnostic record itself could not be saved.
3. OAuth start, invalid callback state, token exchange/save, disconnect,
   authorized-account discovery/linking, import start/status, scheduling and
   worker failures use the same reporting boundary.
4. A reconnect never silently resumes a broker-account link that was not
   re-confirmed under the current authorization. Existing Journal executions,
   completed coverage and deduplication identities remain preserved.
5. The user-entered first-execution date is an execution-date floor. Moomoo's
   historical-deal `start` and `end` parameters remain update-time filters, but
   no returned fill with an execution time before the trader's chosen date is
   committed or stored as a private fill receipt.
6. Initial and older-history imports remain explicit user actions. After a
   successful initial import, the durable worker may create bounded
   incremental catch-up jobs without the user keeping the Account page open.
   The cadence is configurable and conservative; it is not presented as
   realtime execution delivery.

## Admin Errors page

- Route: `/admin/journal/errors` inside the existing owner-only Journal
  Administration shell.
- The page is a Server Component backed by the existing immutable
  `platform_operational_events` records; no new migration is required.
- It shows recent failure totals, affected sources, the latest occurrence and
  a bounded newest-first table with source, operation, safe failure, available
  HTTP/provider numeric details and time.
- The page reads only sanitized fields already accepted by the operational
  event contract. It never reads encrypted source receipts or identity tables.
- Current source scope is Moomoo. The read model is generic enough to add
  future site-wide sources deliberately without changing the page layout.
- The System page remains the platform-health summary; Errors is the dedicated
  triage history.

## Reliability corrections

### Durable failure capture

- Add a failure-reporting service that maps known Moomoo stages and platform
  errors to safe outcome codes and non-negative integer details.
- Recording is best-effort and cannot replace the original response with a
  second reporting error.
- Structured server logs contain only the safe code, stage, anonymous event
  reference and numeric provider/HTTP details.

### Automatic incremental jobs

- Each protected worker invocation first considers active linked accounts with
  a completed initial/history job and no active job.
- A due link receives one `incremental_sync` job ending at the invocation
  cutoff. A bounded overlap rechecks recent provider updates; Journal deal-ID
  identity keeps replay idempotent.
- Never create automatic history for a link that has not completed a user-
  requested initial import.
- Local development uses the existing launcher worker. Hosted execution uses
  the protected CRON route; deployment activation remains an explicit hosted
  configuration checkpoint.

### Reconnect and disconnect

- Disconnect changes active Moomoo broker-account links to `disconnected`
  while preserving coverage, receipts and Journal facts.
- Fresh authorized-account selection reactivates the same source identity and
  therefore reuses its prior coverage and deduplication history.
- Worker claims remain limited to active links and an active connection.

### OAuth scope binding and market-data loss

- OAuth start stores a short-lived, state-digest-only pending attempt bound to the initiating authenticated user, workspace and session. Callback must consume that exact attempt in the same transaction that saves a newly authorized connection; a session or scope mismatch fails without persisting credentials.
- The Account Trading connected state requires an active `quote:read` connection. A missing market-data scope uses the existing reconnect flow, not a new status card.
- Only a previously active connection that loses `quote:read` or cannot refresh into usable market-data access receives the existing connection-ID-deduplicated reconnect notification. An intentionally revoked connection and a never-connected account do not receive it.
- Pending attempts are non-secret metadata: ten-minute expiry and bounded cleanup after twenty-four hours. The additive pending-attempt table may remain after rollback without changing or removing a broker connection.

### Verification repair

- Make the migration-0047 disposable verifier rerunnable when the local
  development database already contains 0047 by rebuilding only the copied
  Moomoo fixture schema before applying the exact migration statements.
- No verifier may call Moomoo, mutate the development database or expose
  private connection facts.

## Verification gates

1. Focused lint and TypeScript filtering report no errors in changed files.
2. The disposable Moomoo workflow proves cursor hold-until-Journal-commit,
   deal-ID idempotency, retry preservation, coverage behavior and zero foreign
   key failures.
3. The foundation verifier succeeds against the current post-0047 database.
4. A focused static proof covers OAuth/reporting stages, user-copy truthfulness,
   execution-date filtering, disconnect/reactivation and incremental job
   eligibility without a live provider call.
5. Desktop and mobile owner review covers the new Admin Errors page and the
   Account failure presentation before the slice is accepted.
6. The final local commit stages only this slice. No AI Reviews, language
   inventory, private local configuration, provider credentials, push or
   deployment is included.

## Deferred live-beta proof

- Real authorized trading-account and historical-deal responses.
- Moomoo correction/update behavior and the final hosted incremental cadence.
- Representative multi-year/high-fill pagination and provider limits.
- Any fallback limit that would route older history through statements.

## Hosted go-live checklist

This is a release gate, not permission to activate production services from a
local development task. Complete it deliberately after the hosted dashboard,
identity boundary and persistent database are ready.

1. Register the exact hosted HTTPS callback URL with Moomoo:
   `https://<host>/api/connections/moomoo/callback`. Keep the local
   `127.0.0.1` callback as a distinct development configuration. Do not reuse
   a local client identifier for a public production callback unless Moomoo
   explicitly permits that configuration.
2. Set production-only Moomoo credential configuration in the host's secret
   store: OAuth client identifier, active encryption-key version and the
   versioned AES key set. Generate production keys independently; never copy
   local values into source, logs or client bundles. Retain an operational key
   rotation/recovery procedure before changing the active version.
3. Bring the hosted database to the exact approved manifest version using the
   normal backup, migration and restore-rehearsal process. Confirm the Moomoo
   foundation migrations (0033, 0034 and 0047) and every intervening manifest
   migration are applied. Do not point production at the local development
   SQLite database.
4. Confirm durable hosted storage and backups for encrypted connection records,
   private fill receipts, jobs, ranges, coverage and operational events. A
   transient server filesystem is not an acceptable production store.
5. Configure the protected Moomoo worker invocation with a unique secret and
   one authoritative scheduler. Start with the documented conservative
   15-minute interval only after an invited-beta calibration decision; do not
   run multiple scheduler instances or publicly expose the worker route.
6. Verify production authentication/owner authorization before exposing the
   Account connection card or `/admin/journal/errors`. The Admin Errors route
   remains owner-only, and ordinary users never see diagnostic records.
7. Run a production-safe smoke test with an invited account: OAuth start,
   callback, encrypted save, disconnect, reconnect, quote candle access,
   failed-operation reporting and Admin Errors visibility. Use an account with
   trade access only when the tester has explicitly agreed to the beta.
8. Before enabling historical execution import broadly, prove with invited
   trading accounts: account selection, `trade:read` eligibility, exact fill
   fields/timestamp units, 90-day range paging, high-fill recovery, provider
   corrections, deduplication, retry behavior, first-execution-date exclusion
   and the final incremental cadence.
9. Keep statement import available. If direct multi-year Moomoo history is not
   reliably proven at representative volume, disclose a fixed direct-import
   history limit and route older history through statements with duplicate
   reconciliation.
10. During beta, review `/admin/journal/errors` and safe host logs daily. Add
    a new error source to the Admin page only through a reviewed privacy-safe
    event mapping; never copy raw broker data into generic site-wide errors.
