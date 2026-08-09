# Moomoo Import Reliability And Admin Errors Plan

**Status:** Owner approved for implementation on 2026-08-09. This plan is a
bounded correction slice over the existing Moomoo connection and execution
import. Live `trade:read` proof remains deferred to invited beta users.

**Progress:** [Moomoo Import Reliability And Admin Errors Progress](moomoo-import-reliability-and-admin-errors-progress.md)

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
