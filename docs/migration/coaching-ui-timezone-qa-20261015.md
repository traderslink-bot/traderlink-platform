# Coaching update-notice and manual-timezone corrections — 2026-10-15

## Current acceptance — PC signed-in retest received; both fixes closed

The owner supplied actual signed-in Chrome observations for TradersLink (coach)
and moonmafia (student) on staging. Expected release
`a9c119625f1ecb13d81e65bd9148159a03da57ec`, deployment
`b1bd4046-cfa9-41ae-9cca-1186b9ac742a`, are supplied Codespaces release evidence;
PC did not independently verify the SHA. No new hosted check is claimed here.
This section supersedes earlier pending browser statements for these two fixes.

| Acceptance case | PC result |
| --- | --- |
| Notice-visible workspace and final preview, Light/Navy,1440x900 and390x844 | PASS: fresh client renders notice above content in normal flow. Return and Save draft center hit tests reached their controls. Save draft was NOT activated. |
| Return navigation | PASS: pointer on desktop/mobile and Enter on mobile rendered the correct workspace. |
| Overflow | PASS: content widths1425/1440 and375/390; no horizontal overflow observed. |
| Normal Update app and saved protected draft | PASS: normal update reloaded and removed notice. Saved feedback remained identical, workspace0 of1/Not ready, final0/1/Send disabled. No draft save or delivery. |
| UTC account input/preview | PASS: QA ONLY account, Oct15,2026 14:00/14:01 displayed Oct15,2026 2:00PM GMT+0 to2:01PM GMT+0 and explicit UTC account label. |
| America/New_York account input/preview | PASS: existing Primary Journal, Oct15,2026 10:00/10:01 displayed10:00AM GMT-4 to10:01AM GMT-4 and explicit America/New_York label; same instant as UTC14:00. |
| Preview-only safety | PASS: QATZCHECK confirmations AND underlying forms cancelled. Confirm trades never clicked; no hosted executions created. |

Protected draft remains review`dedebb39-c1a1-4f5f-a128-18ea5a3f4b76` on relationship
`5d7956a4-a4f2-4e65-92b7-af8feadfbf29`. PC reports protected reviews, agreements,
grants, Journal records and Bullrun untouched. Captured owner/student warning and
error logs were empty. Screenshots were displayed in the PC conversation; no
standalone screenshot files were saved. Original Navy appearance,1920x889 viewport
and moonmafia QA ONLY account were restored. Codespaces did not operate those
sessions or independently inspect the screenshots.

### Optional browser checks — deferred by owner, no further work requested

The owner explicitly declined spending further time on these minor optional
extensions. They do not block closure of the two reported UI defects. Do not
reopen passed checks or manufacture fixtures/updates to complete these rows.

- **Winter offset:** UNTESTED in staging browser. Attempted date fill left Oct15
  unchanged, so January15 was never previewed. Neither a winter pass nor a
  reproduced application defect. Disposable local preview/commit/storage tests
  already cover the winter offset.
- **Cross-date boundary:** UNTESTED in staging browser. UTC Oct15 00:30 versus
  New York Oct14 20:30 was not demonstrated there. The disposable local regression
  covers that date boundary; do not relabel it staging browser proof.
- **Nonempty offline queue across update:** UNTESTED in staging browser; Unsynced
  trades was0 and no suitable queued content was demonstrated. Actual queued
  content survived the isolated local browser update test. No real-account
  offline entry, forced worker state, storage clearing or extra deployment is
  authorized to manufacture a staging case. Any future fixture would require
  separate scope, but none is requested now.

Existing isolated storage invariance and invalid/ambiguous DST evidence remains
separate from PC browser evidence. **No new code defect was reproduced.** No
speculative fix, code change, test rerun, hosted operation or deployment follows
from this handoff.

### Separate whole-feature acceptance boundary

This closes the two-defect UI correction, not the full Coaching launch inventory.
Prior required1/1 and summary-only0/0 lifecycle passes remain passed. The broader
launch plan's remaining inventory/operational reconciliation and final owner
launch decision are outside this bounded retest; this report neither certifies
those areas nor declares previously passed areas untested again. No additional
acceptance defect is established by this handoff. Production promotion remains
separately authorized work.

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


## Owner-authorized staging release verified — 2026-10-15

Supersedes the earlier local-only/no-release statements for these two fixes.
The owner said “proceed” after the staging-deployment offer; the previously
assigned Coordinator role was retained.

- Published **a9c119625f1ecb13d81e65bd9148159a03da57ec**, exact staging parent
  **fdfca103cabe11d965d2feec55fe3d1facc8d33e**. Railway source remains `staging`.
  Production remains `main` at78bf4421b815e079a31b1135d771572a0e979a13, unchanged.
- Complete **12-file release allowlist** and recovery/preflight/final evidence:
  `/workspaces/traderslink-coordinator/preservation/coaching-ui-timezone-20261015/release.json`.
  Six runtime components, three Help guides, the timezone regression file,
  isolated browser script and QA report were released. The five other local
  progress/plan files and inherited CI-only history were excluded. All existing
  allowlisted file bases matched deployed staging before applying the fix.
- [Actions38811430667](https://github.com/traderslink-bot/traderlink-platform/actions/runs/38811430667)
  **SUCCESS**: full compilation, full TypeScript, all281 pages, five timezone
  regressions, disposable migration rehearsal and Watchlist draft checks. Tested
  commitb2cefd9823eff36fc7bed2a267b082151030f863 differs from the release only by
  its CI workflow. This closes the earlier full-build/type-check evidence gap.
- Railway **b1bd4046-cfa9-41ae-9cca-1186b9ac742a SUCCESS** on the intended source.
  Image `sha256:d70b2a8e2fa5ed0def025264752e03329dbcce021f9a3ae0c941ee5d83d91ad1`.
  One active deployment and one RUNNING instance208f98cb-84e6-4329-9a30-07f01675bf8a;
  previous deployment55bde668-caf3-4fc7-8565-69510eecabcf removed. Its existing
  schema-compatible image remains the recovery reference; no recovery needed.
- Original isolated volume retained at`/data`, one replica, zero overlap,30-second
  drain and no pending configuration. Health **HTTP200/ready/sqlite_single_node**.
  All **160 migration IDs/orders/checksums match exactly** before/after. No
  migration, reset, data repair, grant, role/channel, plan or billing change.
- Read-only deployed-client inspection finds update warning, selected-account
  timezone guidance, dated confirmation and shortOffset formatting markers.
  Signed-out Quick trade and protected final route return307 to sign-in. These
  are release/auth-boundary/code checks, not signed-in participant QA.
- [PC signed-in retest prompt](coaching-ui-timezone-staging-retest-pc-20261015.md)
  is ready. Actual notice-visible coaching workspace/final-page checks and saved
  draft persistence remain PC acceptance work. The prompt distinguishes stale
  old-tab client code from a freshly loaded corrected page, avoids manufacturing
  a service-worker state, and preserves all protected records.

Coordinator staging slot handed back after verified health/source/instance/ledger
checks. No production, public static or Watchlist Runtime release occurred.
