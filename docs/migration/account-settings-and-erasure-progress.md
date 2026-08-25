# Account Settings And Erasure Progress

**Status:** Implementation complete; owner-approved

**Controlling plan:** [Account Settings And Erasure Plan](account-settings-and-erasure-plan.md)

## Owner-confirmed decisions

- [x] Account Settings needs broader, professional coverage rather than one
  indefinitely growing page.
- [x] Use clear Settings sections with stable routes instead of a wide tab-only
  layout.
- [x] A trader may permanently delete one Trade Tracker account without
  touching another account.
- [x] A trader may permanently delete their whole TraderLink account.
- [x] Keep Discord identity management external to TraderLink until a second
  verified sign-in method makes unlinking safe.
- [x] Do not add unproven generic chart preferences for the external Market
  Charts embed.

## Current work

- [x] Reorganize existing Account controls into the approved Settings hub.
- [x] Update the affected AI Review and Discord notification Help guidance.
- [x] Owner visually approved the Settings hub on 2026-08-10.
- [x] Add account-empty handling after a Trade Tracker account deletion.
- [x] Implement the guarded database and source-vault erasure command.
- [x] Add Privacy controls after the command passes disposable isolation proof.
- [ ] Record backup-retention/purge operations before hosted deletion claims.
- [x] Complete focused lint and whitespace verification for the Settings hub.
- [x] Owner visually approved the Privacy controls and completed focused
  verification for the destructive Privacy slice on 2026-08-10.
- [x] Add the Security route, quick Account menu, current-device sign-out,
  individual active-session controls and confirmed sign-out everywhere; keep
  the related Help guide aligned.

## Guardrails

- No production account, account data, private evidence or backup is being
  deleted by this implementation work.
- No deletion control will be presented as functional until its server-side
  erase path is proven against a disposable database.
- Existing unrelated working-tree changes remain out of this feature slice.

## Disposable proof — 2026-08-10

- `src/scripts/verify-platform-account-erasure.ts` initializes a fresh,
  synthetic-only database in a temporary directory. It does not open, copy or
  modify the configured development database.
- The proof confirms a forced private-vault purge failure rolls back the
  database and restores every immutable delete guard.
- It then confirms selected-account deletion removes the selected account,
  its account-only source identity, notification receipt/history, private
  primary evidence and support-source object while preserving a sibling
  account and a second user's account.
- It confirms full deletion removes the sole owner's remaining account,
  workspace and Platform user while preserving the unrelated synthetic user,
  workspace and account. `PRAGMA foreign_key_check` remains empty and the
  original delete-guard count is restored after both operations.
- Focused ESLint passes for the erasure service, route, Privacy UI, empty
  account state and disposable verifier. The proof command passed on
  2026-08-10 with `{ "status": "passed", "fixture": "disposable_synthetic_only" }`.
