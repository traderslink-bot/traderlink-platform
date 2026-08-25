# Discord Newsletter Opt-in Progress

**Status:** Owner-authorized implementation in progress

**Controlling plan:** [Discord Newsletter Opt-in Plan](discord-newsletter-opt-in-plan.md)

## Approved product decision

- [x] Discord remains the sole beta login.
- [x] Ask on the first Platform account visit immediately after Discord login,
      rather than treating Account Notifications as the main signup prompt.
- [x] The unchecked opt-in is led by **The Week Ahead**, described as a weekly
      small-cap and upcoming-catalyst research email; product, education and
      Community updates are secondary.
- [x] The email scope and the newsletter checkbox are separate consent
      decisions.
- [x] This slice captures opt-in only. It does not send bulk email or connect
      an audience provider.

## Implementation checklist

- [x] Reserve and register additive Platform migration `0088`.
- [x] Add encrypted verified-Discord contact and consent repositories.
- [x] Add Discord `email` scope and bounded optional email facts.
- [x] Route newly provisioned accounts—and existing accounts that authorize a
      verified Discord email but have not made a choice—to the protected
      Welcome screen once.
- [x] Add session-scoped Welcome consent action and safe continuation.
- [ ] Add the existing-member preference path after the concurrent Account
      profile and notifications work is reconciled.
- [x] Review Help guidance. The existing Email Notifications guide describes
      Account Notifications only; this first-account consent does not change
      that surface, so no guide update is required in this slice.
- [x] Run targeted ESLint with zero diagnostics. No Vitest, broad local suite,
      migration, local development server, or email send was run. Railway's
      staging build completed successfully.

## Current coordination boundary

The shared working tree already contains in-progress Community Profile and
remote notification-email changes, including modifications to the Account
Profile page, Discord callback, sign-in service and migration manifest. This
slice preserves those changes and keeps its additions isolated until the shared
migration and Account-settings work can be reconciled deliberately.

## Staging review boundary

The isolated staging preview commit is `4e994185d109cc9e5ed6e843c6b8d9a18270d4ee`.
The actual protected `/welcome` route remains unavailable for review because
the staging service is missing its Discord configuration. `/welcome-preview`
is a staging-only visual review route: it has no account, email, or consent
side effect and returns 404 outside staging.

Applying migration `0088`, connecting an email audience, sending The Week
Ahead, and publishing to production remain separate owner-authorized actions.
