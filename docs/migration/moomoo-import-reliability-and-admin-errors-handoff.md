# Moomoo Import Reliability And Admin Errors Handoff

**Date:** 2026-08-09

**Canonical repository:** `C:\Users\jerac\Documents\TraderLink\traderlink-platform`

**Expected branch:** `codex/traderlink-platform-replacement`
**Completed source checkpoint:** `8a71a215 feat(moomoo): harden imports and add admin errors`

## What is complete

- The Account connection/import experience has privacy-safe process status.
  Users never see raw Moomoo data, internal error codes, tokens or stack
  traces. They are told that details reached TradersLink administration only
  when the durable diagnostic event was actually saved.
- OAuth, callback/state, disconnect, authorized-account discovery/linking,
  import start/status, scheduler and worker failures map through one
  privacy-safe operational-event boundary.
- `/admin/journal/errors` is an owner-only Moomoo error-history view. It shows
  only safe source, operation, failure category, numeric HTTP/provider details
  and time. It is intentionally ready for reviewed future sources, but this
  slice does not display other site-wide errors.
- Disconnect preserves Journal facts, coverage and deal-ID dedupe history;
  fresh authorization requires explicit account selection again; selecting the
  same account reactivates its prior source identity.
- The first-execution date is enforced against returned execution timestamps,
  not merely Moomoo's update-time request filter.
- Initial/history import is explicit. After it completes, a durable bounded
  incremental job can be scheduled at a configurable default 15-minute
  cadence with a 24-hour provider-update overlap.

## Verification and owner acceptance

- Focused ESLint, changed-file TypeScript filtering and whitespace checks
  passed.
- Disposable migration-0047, import-workflow and Admin-error verifiers passed
  with zero foreign-key failures. They do not call Moomoo or mutate the local
  development database.
- Desktop and mobile browser checks passed for `/admin/journal/errors` and the
  Account failure state. The owner approved the Admin Errors presentation.
- Full repository TypeScript was not used as acceptance because unrelated
  concurrent work already made it fail; filtered errors for this slice were
  clean.
- Port 3010 is closed. Do not start it merely to resume; first complete the
  requested read-only QA and coordinate if another task owns the server.

## Remaining work

The implementation is not a claim of live `trade:read` success. Invited beta
testing must prove real Moomoo trading-account/fill behavior, correction and
update behavior, high-fill/multi-year pagination recovery, and calibrate the
final automatic import cadence. If large history is not dependable, the
approved fallback is a disclosed recent direct-import window plus statement
imports for older history.

The current invitee contract is important: a free Moomoo account can provide
chart replay and analyzer candle data without opening a cash or margin trading
account. Automatic execution import applies only when Moomoo returns an
authorized trading account with the required execution-read access. Statement
import remains available to everyone.

## Hosted go-live requirements

Read the full checklist in the reliability plan before any hosted release. In
short: register an exact HTTPS production callback, provision independent
production OAuth/encryption secrets, migrate a backed-up durable hosted
database to the current manifest, configure one protected scheduler, verify
owner/auth boundaries, conduct a consented invited-beta smoke test and keep
direct imports limited until their live provider behavior is proven.

No local Moomoo credentials, OAuth state, broker identifiers, source receipts
or payload values are part of this handoff.

## Concurrency and safety

- The database and migration manifest were current through 0051 when this
  slice finished. Do not reserve or register a migration without first checking
  the current manifest and coordinating with active work.
- Preserve concurrent Trade Tracker, AI Reviews, language-inventory,
  `.agents`, `.local-logs`, local fallback helper, and historical-Kline-provider
  working-tree files. They are not part of `8a71a215`.
- Do not push, deploy, activate scheduler/provider access, apply a migration,
  or start/stop port 3010 without separate owner authorization.

## Required first action for the next task

Begin with a read-only QA run. Read `AGENTS.md`, this handoff, the Moomoo
Direct Connection plan/progress and reliability plan/progress. Then confirm
the canonical checkout, branch, HEAD, dirty-file ownership, port state and
migration manifest/database count without starting a server. Re-run the three
focused disposable/static verifiers one at a time, with no provider calls.
Classify every finding as a local beta blocker, hosted-launch gate, deliberately
inactive configuration or unrelated concurrent work before changing anything.
