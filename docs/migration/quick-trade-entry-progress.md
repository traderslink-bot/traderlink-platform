# Quick Trade Entry Progress

**Status:** Implementation in progress; visual review pending

**Started:** 2026-08-05

**Controlling plan:**
[Day Trade Tracker And Swing Trade Tracker Plan](day-and-swing-trade-tracker-plan.md)

## Scope

- Add `/quick-trade-entry` under the Trades navigation group, immediately after
  Swing Trade Tracker.
- Reuse the canonical manual-execution preview and commit workflow; do not add
  a separate manual-entry database, table or save path.
- Accept past execution dates without the Daily Tracker's one-day boundary or
  its recent-entry boundary. Future execution times remain invalid.
- Keep this page execution-only: no notes, tags, rules, daily-review state or
  Swing journal controls.
- Link directly to Daily Trade Tracker from the entry guidance.
- Move Trading Rules into Trades directly after Quick Trade Entry.
- Replace the dashboard-header Add trade action with the primary Import Trades
  action.

## Implementation record

- [x] Added the neutral `quick` manual-entry context to the shared Journal
  preview/commit contract.
- [x] Preserved the same account-scoped ledger, duplicate handling,
  reconstruction and Data Decisions behavior as the existing tracker forms.
- [x] Added `/quick-trade-entry` using the real Manual Execution Entry form.
- [x] Added the navigation and header-action changes.
- [x] Renamed the Analytics navigation label to Results by Ticker.
- [ ] Perform the owner visual review after a resource-safe local dashboard
  restart.
- [ ] Run focused verification at the next technical checkpoint.

## Boundaries

- No V3 dependency or separate manual-entry storage is introduced.
- No existing Daily Tracker or Swing Tracker workflow is removed.
- No database migration is needed: Quick Trade Entry uses the existing manual
  execution and trade-style persistence contracts, with truthful visible import
  provenance and a neutral initial trade style.
- This record does not authorize a push, deployment or production change.


## 2026-10-15 — account timezone correction

The UTC-account PC report exposed hardcoded Eastern guidance and New York-only
confirmation formatting. The existing account-timezone parsing/storage contract
is retained; guidance now names that timezone and confirmation includes dates
and offsets. Shared Session/Swing callers and Help Center guides are aligned.
See [correction and verification evidence](coaching-ui-timezone-qa-20261015.md).
No stored executions or hosted records changed; release remains separate.


### Staging release verified

Owner-authorized staging commit a9c119625 is deployed successfully. Full build,
TypeScript, all281 pages and five timezone regressions pass in Actions38811430667.
Health200 and exact160-entry migration ledger match. No execution timestamps or
hosted records were changed. See the [release record](coaching-ui-timezone-qa-20261015.md)
and [PC retest prompt](coaching-ui-timezone-staging-retest-pc-20261015.md).


### Signed-in PC timezone acceptance received

PASS: existing UTC QA account14:00/14:01 and existing America/New_York Primary
Journal10:00/10:01 on Oct15,2026 show full dates, correct timezone names and
GMT+0/GMT-4 offsets for the same instant. All QATZCHECK previews and forms were
cancelled; Confirm trades never clicked. No hosted execution changed. Winter
and cross-date browser extensions are owner-deferred, not reproduced defects;
their local preview/storage regressions remain passed. No further test/code or
deployment work requested. See the [reconciled QA record](coaching-ui-timezone-qa-20261015.md).
