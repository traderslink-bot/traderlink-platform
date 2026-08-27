# Moomoo Import Reliability And Admin Errors Progress

**Plan:** [Moomoo Import Reliability And Admin Errors Plan](moomoo-import-reliability-and-admin-errors-plan.md)

## Current checkpoint - 2026-08-09

- [x] Audited the existing OAuth, account-link, import worker, operational
  event, Admin shell and migration-0047 contracts.
- [x] Confirmed the existing immutable operational-event table can support the
  dedicated Admin Errors read model without migration 0052.
- [x] Confirmed the current Moomoo worker commits private receipts before the
  Journal transaction, advances its cursor only after Journal commit, and
  deduplicates accepted executions by provider deal identity.
- [x] Confirmed Moomoo historical-deal `start`/`end` filters are provider
  update-time filters, so a separate execution-date floor is required.
- [x] Implemented best-effort privacy-safe failure capture across every Moomoo
  user-visible and background stage.
- [x] Added the owner-only Admin Errors page and navigation entry. It reads only
  safe operational-event fields and is ready for deliberate future error
  sources while this slice filters to Moomoo.
- [x] Added truthful user failure messages based on whether reporting
  succeeded. OAuth redirects no longer expose internal reason codes.
- [x] Disconnect stale broker-account links and preserve reactivation history.
  A fresh authorization requires account selection again; reselecting the same
  account restores the same source identity, coverage and deduplication chain.
- [x] Applied the execution-date floor before private receipt/Journal commit.
  Provider paging continues by update time, but out-of-window executions are
  not retained.
- [x] Added durable, bounded automatic incremental job scheduling. The default
  due interval is 15 minutes, is server-configurable, rechecks a bounded
  24-hour provider-update overlap and never runs before an explicit completed
  initial/history import. Hosted CRON invocation remains a deployment gate.
- [x] Repaired the rerunnable migration-0047 verifier.
- [x] Passed focused static/disposable QA.
  - migration 0047 rebuilt and verified on a disposable copy: seven tables and
    zero foreign-key failures;
  - workflow proof: Journal cursor hold, deal-ID idempotency, retry retention,
    no covered-range replay, incremental eligibility and job creation,
    execution-date floor, source-link reactivation and zero foreign-key
    failures;
  - Admin Errors proof: durable sanitized event, numeric HTTP/provider details,
    no broker values and a valid bounded Admin projection;
  - focused ESLint and whitespace checks passed;
  - full TypeScript remains red from unrelated shared work, while the filtered
    Moomoo/Admin Errors changed-file result is clean.
- [x] Passed automated desktop/mobile browser QA on the canonical local app:
  `/admin/journal/errors` and the Account connection-failure state return 200,
  contain meaningful content, show no framework overlay and produce no browser
  warning/error logs.
- [x] Completed desktop/mobile owner visual review. The owner approved the
  Admin Errors presentation on 2026-08-09.
- [x] Created the narrow local feature commit with the explicit Moomoo/Admin
  Errors allowlist: `8a71a215 feat(moomoo): harden imports and add admin
  errors`.
- [x] Added the hosted go-live checklist and a self-contained continuation
  handoff. The next task must begin with a read-only QA run before changing
  code, migration state, scheduler configuration or the local server.

## Incremental-import usability follow-on - 2026-08-16

- [x] Owner approved keeping automatic incremental imports and adding an
  optional **Import latest trades** action.
- [x] Confirmed the existing 15-minute due scheduler, durable worker and
  24-hour provider-update overlap remain the correct automatic boundary.
- [x] Added a dedicated latest-trades command that uses the last completed cutoff
  and correction overlap without requesting a historical date.
- [x] Added the Account action while preserving the separate first/older-history
  date workflow and existing process status.
- [x] Updated the related Daily Trade Tracker Help guidance.
- [x] Owner approved the interaction contract and waived a separate visual
  review; port 3010 remained closed.
- [x] Ran focused low-resource non-Vitest checks and created a narrow local
  follow-on commit.

## Coordination

- The shared database and migration manifest are current through migration
  0051. This slice does not reserve or register another migration.
- Port 3010 was used only for the approved visual checkpoint and is closed
  afterward to avoid unnecessary local resource use.
- Concurrent AI Reviews and language-inventory working-tree files are outside
  this slice and must not be staged, edited or committed.
