# Account Settings And Erasure Progress

**Status:** Planning complete; implementation in progress

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
- [ ] Add account-empty handling after a Trade Tracker account deletion.
- [ ] Implement the guarded database and source-vault erasure command.
- [ ] Add Privacy controls after the command passes disposable isolation proof.
- [ ] Record backup-retention/purge operations before hosted deletion claims.
- [x] Complete focused lint and whitespace verification for the Settings hub.
- [ ] Obtain owner visual approval and complete focused verification for the
  destructive Privacy slice.

## Guardrails

- No production account, account data, private evidence or backup is being
  deleted by this implementation work.
- No deletion control will be presented as functional until its server-side
  erase path is proven against a disposable database.
- Existing unrelated working-tree changes remain out of this feature slice.
