# Discord Newsletter Opt-in Plan

**Status:** Owner-authorized implementation in progress

**Progress record:** [Discord Newsletter Opt-in Progress](discord-newsletter-opt-in-progress.md)

## Outcome

When a trader creates a new TraderLink Platform account through Discord, give
them one clear, optional choice before entering the dashboard:

> Send me **The Week Ahead** — a weekly look at small-cap stocks and upcoming
> catalysts to research — plus occasional TradersLink product, education, and
> community updates.

The Week Ahead is the lead value proposition. Product, education, and
Community updates are secondary. The offer has two equally explicit choices:
**Send me The Week Ahead** subscribes; **No thanks, continue to TradersLink**
declines. Neither choice is preselected.

## Experience

1. Trader signs in through Discord as usual.
2. Discord grants the `email` scope in addition to the existing identity and
   membership scopes.
3. After a newly provisioned account receives its Platform session, the trader
   reaches `/welcome` before their requested dashboard destination.
4. The focused The Week Ahead offer presents the weekly research value before
   the dashboard, with distinct subscribe and decline actions.
5. Selecting the checkbox records newsletter consent for the email Discord
   supplied only when Discord marked that email verified. A missing or
   unverified Discord email leaves the consent off and clearly explains that
   the trader can add a contact address later.
6. Continue always reaches the original safe post-login destination; the
   Welcome page must not become an open redirect.

Existing members are never automatically subscribed. The later Account
Notifications surface remains the place to change an email preference after
account creation, but it is not the primary signup prompt.

## Data and privacy contract

- Discord remains the only beta login. This adds no password, email-login, or
  account-recovery flow.
- Requesting Discord email permission and subscribing to the newsletter are
  separate choices. An email permission alone never turns newsletter consent
  on.
- Store a verified Discord email in encrypted server-only storage with a
  one-way address hash and the current Platform email-encryption key ring.
- Store newsletter consent separately from the email address, including the
  current state and exact change timestamp. Withdrawal sets consent off; it
  does not silently re-enable on later Discord logins.
- No Journal, broker, account, trade, P/L, or Community-profile facts enter
  the newsletter record or a future mailing-list export.
- Do not persist OAuth access tokens, refresh tokens, authorization codes, or
  raw Discord responses.
- This slice captures consent only. It does not send a newsletter, add an
  audience to Resend, create a bulk-send API, or expose subscriber addresses
  in the application or Admin UI.

## Implementation boundary

1. Reserve one additive migration after the active shared migration slot. It
   creates private Platform-owned newsletter contact and consent storage.
2. Extend the bounded Discord user DTO and sign-in service for optional,
   verified Discord email without exposing it to browser code.
3. Route only newly provisioned accounts through the authenticated Welcome
   page, retaining the normalized return path.
4. Use an authenticated Server Action to save the explicit choice. The action
   derives the user from the Platform session; it accepts neither a user ID nor
   an email address from the browser.
5. Keep the existing encrypted notification-email feature separate. A future
   contact-preference consolidation may be planned only after this beta slice
   is accepted.
6. Update the progress record and the applicable Help guidance if the
   completed feature changes the user-facing account-contact explanation.

## Deferrals

- Automated newsletter delivery, scheduling, audience synchronization,
  unsubscribe links in outbound mail, bounce/complaint processing, and
  marketing analytics.
- A manual email-address fallback during signup.
- Newsletter segmentation from Journal or trading behavior.
- Any public Community-profile display of an email address or subscription
  state.

## Acceptance criteria

- A new Discord member sees exactly one optional signup consent choice before
  their safe requested destination.
- The Week Ahead is the first named benefit in that choice.
- Opting out proceeds normally and records no subscription.
- Opting in requires a verified Discord email and stores private encrypted
  contact data plus explicit consent evidence.
- An existing user is never redirected to Welcome solely because they sign in
  again.
- Every mutation is session-scoped and cross-user access fails closed.
- No OAuth secret, raw token, raw Discord payload, email address, Journal fact
  or account identifier appears in browser props, logs, error text, or public
  routes.
