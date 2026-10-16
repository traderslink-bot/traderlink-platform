# Coaching update-notice and manual-timezone corrections — 2026-10-15

## Scope and evidence boundary

Local candidate: `/workspaces/traderlink-coaching-ui-timezone-qa`, branch
`codex/coaching-ui-timezone-qa-20261015`, parent
`019d568e17fb2b83c350f4e82bf5090fb5ef8cfe`.
The supplied PC browser evidence concerns staging release
`fdfca103cabe11d965d2feec55fe3d1facc8d33e`; no fresh hosted version claim is made.
No deployment, hosted configuration/data operation, Discord request, migration of
existing data, or change to protected evidence was performed. Tests initialize
only disposable local SQLite databases and fresh isolated browser contexts.

The PC handoff confirms the new required-trade **1/1** and custom summary-only
**0/0** journeys passed signed-in delivery, acknowledgement, completion and
refresh persistence. Those supplied acceptance results remain passed; this UI
correction does not change the accepted-work checks or privacy controls.

## Proven causes and corrections

1. `PwaUpdateNotice` positioned its alert fixed at the bottom-right with a modal
   adjacent z-index, so its rectangle intercepted unrelated underlying controls.
   It now occupies normal document flow, with responsive width and wrapping.
   `PwaLifecycle` mounts inside the shared dashboard template before page content,
   ensuring the notice is within the main content area rather than behind the
   desktop sidebar. The lifecycle wrapper is excluded from offline page capture,
   preserving the previous exclusion of transient update/sync notices. Update
   activation, explicit user action, warnings, timeout,
   offline sync priority and retained-device-data behavior remain unchanged.
2. `/quick-trade-entry` redirects to `/workspace?tradeDrawer=add`. Its actual
   Add trade panel already sends local date/time with `sourceTimezone` equal to
   the active account timezone. The preview service rejects a mismatched source
   timezone and normalizes local time once. Commit consumes the same bound
   preview/entries and persists the canonical UTC instant plus source timezone.
   The form incorrectly said Eastern Time, and `ManualTradePostEntryReview`
   independently formatted UTC preview instants in New York without naming that
   timezone. Input guidance now names the selected account timezone; confirmation
   uses that same timezone, full dates and UTC offsets. The shared Session/Swing
   form receives the same truthful timezone prop. Parsing and saved facts are
   unchanged; market-day merge/Analyzer eligibility still uses its existing
   New York rules. Workspace table times consume existing derived local-time
   projection fields; no projection or stored timestamp is rewritten.

Account changes already remount the dashboard provider using offline scope and
account selection. The actual drawer receives the new timezone. Backend account
selection and source-timezone guards are retained.

## Verification

- `node src/scripts/coaching-ui-timezone-acceptance.cjs`: **4/4 passed** — shared
  Light/Navy themes at1440x900 and390x844, actual update-notice and Add trade drawer,
  pointer-center hit tests for draft and Return controls, pointer and Enter Return
  navigation, no horizontal overflow, accessible update button/disabled applying
  state, UTC/New York account guidance changes, dated offset-labelled confirmation.
- The browser harness intercepts all network traffic on a synthetic `.invalid`
  origin, substitutes Next router/server-action transport, and supplies synthetic
  surrounding coaching content. It does not impersonate a signed-in app session.
  Actual IndexedDB outbox code preserves a synthetic queued entry across an
  explicit SKIP_WAITING/controller-change/reload. Another tab's activation does
  not force reload. A synthetic saved local draft also survives; this is not a
  persisted real Coaching review or proof of unsaved in-memory form retention.
- Screenshots: `/tmp/coaching-ui-qa-ND8J2V/{light,dark}-{1440,390}.png`.
  Locally inspected Light mobile/Navy desktop captures. These are component
  fixtures, not full signed-in coaching-page visual acceptance.
- Targeted ESLint: **0 errors**, three existing warnings in unchanged hook/unused
  helper code in the manual-entry and workspace components.
- Strict changed-file TypeScript semantic check with actual dependency graph:
  **10 files, 0 diagnostics**. Full `tsc --noEmit --incremental false` was
  terminated with exit143 and no diagnostics; no full-repository pass is claimed.
- Focused backend regressions: **5/5 passed**, using `vitest run` on
  `journal-manual-trade-command-service.test.ts` with
  `-t "manual entry account timezone contract" --maxWorkers=1
  --no-file-parallelism --testTimeout=120000`. Fixtures exercise actual preview,
  commit and stored execution rows for October UTC14:00/New York10:00, winter,
  previous-local-date boundary, source-timezone mismatch after account switch,
  and rejected nonexistent/ambiguous DST times without execution writes.
- Unrelated baseline failure reproduced from the untouched parent test source:
  `edits a saved manual execution by appending evidence and rebuilding the trade`
  expects queuedTradeCount1 but its fixture callback returns no queued items and
  runtime reports0. The same failure occurs without these changes. Not weakened
  or repaired as part of this UI scope. The temporary baseline test copy was
  removed after execution.
- Required dashboard-template verifier: **3 passed, 4 existing failures**. Its
  failing assertions read unchanged dashboard layout, navigation destinations,
  the FeatureHelpLink comment and DashboardShell title wiring; those source
  files match the parent. The same four baseline failures were already recorded
  in the preceding Coaching checkpoint. No test or shell workaround was added.
- React best-practices review completed: timezone remains a prop, activation
  listeners/cleanup are retained, semantic button/alert behavior is preserved,
  existing shared MUI tokens handle both appearances, and no new fetch/effect or
  component-local theme was introduced.
- No production build was rerun for these presentation changes; no route,
  dependency, configuration, parser or server data contract changed.

## Changed implementation and verification files

- `app/pwa/pwa-update-notice.tsx`
- `app/dashboard-layout-frame.tsx`
- `app/(dashboard)/workspace/workspace-trade-library-client.tsx`
- `app/(dashboard)/trade-tracker/manual-trade-post-entry-review.tsx`
- `app/(dashboard)/trade-tracker/manual-execution-entry.tsx`
- `app/(dashboard)/trade-tracker/execution-entry-card.tsx`
- `src/modules/journal/server/manual-trades/journal-manual-trade-command-service.test.ts`
- `src/scripts/coaching-ui-timezone-acceptance.cjs`

Help Center review completed: Quick Trade Entry, Session Tracker manual entry and
TradersLink app update instructions updated in their existing guide files.
Related progress and acceptance records link this report.

## Remaining acceptance

Under separate staging release authorization, publish only the new fix allowlist,
excluding the inherited CI-only/test/documentation history unless explicitly
reviewed. Then PC Codex should repeat the actual signed-in workspace/final-page
matrix in both appearances/sizes with the notice visible, preserve the protected
saved draft, and confirm Return/control hit targets and existing saved content
across the intended update. Verify active-account guidance and confirmation
through a disposable authorized fixture; no new staging trades are authorized by
this correction. Actual service-worker upgrade transport and signed-in Coaching
draft persistence remain browser acceptance gaps. No deployed fix is claimed.

## Complete local commit allowlist

- `app/(dashboard)/trade-tracker/execution-entry-card.tsx`
- `app/(dashboard)/trade-tracker/manual-execution-entry.tsx`
- `app/(dashboard)/trade-tracker/manual-trade-post-entry-review.tsx`
- `app/(dashboard)/workspace/workspace-trade-library-client.tsx`
- `app/dashboard-layout-frame.tsx`
- `app/pwa/pwa-update-notice.tsx`
- `docs/migration/coaching-required-trade-acceptance-handoff-20261015.md`
- `docs/migration/coaching-ui-timezone-qa-20261015.md`
- `docs/migration/quick-trade-entry-progress.md`
- `docs/migration/traderlink-communities-coaching-launch-progress.md`
- `docs/migration/traderlink-communities-partner-platform-plan.md`
- `src/docs/codex-project-log.md`
- `src/modules/help/daily-trade-tracker-guides.ts`
- `src/modules/help/quick-trade-entry-guides.ts`
- `src/modules/help/traderslink-app-guides.ts`
- `src/modules/journal/server/manual-trades/journal-manual-trade-command-service.test.ts`
- `src/scripts/coaching-ui-timezone-acceptance.cjs`
