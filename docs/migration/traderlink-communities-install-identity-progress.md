# Communities install identity correction

Status: owner-authorized narrow implementation; staging deployment and live
acceptance pending Coordinator. Watchlist production release goes first.

## Contract

The two community server pages pass the dedicated non-secret runtime setting
`TRADERLINK_COMMUNITIES_DISCORD_CLIENT_ID` to the existing install URL renderer.
Required staging value: `1554300060483715162` (TradersLink Communities).
Missing/blank values become null; never fall back to the login application.
Keep `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and
`TRADERLINK_DISCORD_BOT_TOKEN` unchanged. No new credentials, migrations, scopes,
permissions, mappings, labels or layout changes are included.

## Verification and release boundary

- Targeted verifier covers both page boundaries with dedicated, whitespace,
  missing, empty and whitespace-only values while the old OAuth ID is present.
- Local result: ten focused cases PASS; targeted page ESLint PASS with only the
  dependency-free worktree React autodetection warning; diff whitespace check
  PASS. No broad suite, local server or production build run.
- Coordinator applies only this patch onto the refreshed staging release;
  do not merge the entire feature branch ancestry.
- Configure the dedicated variable on staging only. Verify the rendered install
  URL client_id matches the dedicated bot; preserve existing OAuth login.
- Help Center content requires no update: this repairs an existing install link,
  without changing the documented user workflow.

## Bounded live role acceptance

1. Confirm Bullrun's existing test-community role and active coaching; record
   current role IDs and platform membership verification timestamp (not the
   separate community-page timestamp). Confirm the bot identity matches above.
2. Remove only Bullrun's test-community role in the test guild, leaving every
   other role/account/channel unchanged. Allow the normal refresh cycle to run.
3. Verify membership evidence advances, coaching pauses, student and coach see
   the role-loss status/notification, and gated writes are refused. Preserve
   historical coaching records and Journal facts. UI status alone is not proof
   of a successful bot request.
4. Restore the exact role even if the test fails. Verify a later refresh restores
   permitted coaching access without duplicate records or lost history.
5. Record timestamps and pass/failure evidence. Do not open channels to members
   based solely on health, install URL, or configured delivery status.
