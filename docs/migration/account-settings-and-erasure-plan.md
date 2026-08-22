# Account Settings And Erasure Plan

**Status:** Owner-authorized implementation plan

**Owner decision:** Account Settings must give a trader clear control of their
own settings and a normal, discreet way to permanently delete either one Trade
Tracker account or their whole TraderLink account. Deleting one Trade Tracker
account never deletes or changes another Trade Tracker account.

## Outcome

Replace the long, single-column Account page with a Settings hub and clear,
deep-linkable sections:

1. **Preferences**: reporting currency and dashboard/Discord delivery choices.
2. **Trading**: Trade Tracker accounts and broker connections.
3. **AI & plan**: AI Review delivery choices and subscription status.
4. **Profile & access**: privacy-safe identity status and public-login status.
5. **Privacy**: low-emphasis Trade Tracker account deletion and full
   TraderLink account deletion.

Each section remains one normal dashboard route so browser navigation, page
refreshes and small screens work without hiding a form in a wide tab strip.
The Settings hub may provide compact in-page navigation, but every section
must also have a stable URL.

## Session management extension — 2026-08-22

Account adds a stable **Security** route and a quick Account menu in the
dashboard header. The menu provides Account settings, Security and Log out;
the Security route provides one-device sign-out and an explicit confirmation
before sign-out everywhere. These operations revoke the stored Platform
session records server-side and clear the browser cookies. They never unlink
Discord, alter a Journal account or delete TraderLink data.

The production Journal Administration gate distinguishes a missing session
from an authenticated-but-not-authorized account. Only a missing session starts
Discord sign-in; an authorization failure shows a clear owner-access screen
with an intentional log-out-and-refresh path rather than creating a redirect
loop.

## Coverage decisions

- Keep the existing reporting-currency, notification, AI Review, subscription,
  broker and Trade Tracker account controls. Their ownership and data scopes do
  not change.
- Do not make the Discord identity disconnectable inside TraderLink. Discord
  owns the login identity; disconnecting the only public sign-in method would
  strand the user. A future multiple-login identity contract may add safe
  unlinking only after another verified sign-in method exists.
- Do not add general chart-default preferences in this slice. The general
  Market Charts page embeds TradingView rather than a TraderLink-owned chart
  engine, so a saved TraderLink preference would not reliably control the
  chart. Candle Review settings remain trade-context facts, not personal chart
  defaults.
- A workspace default timezone remains a creation default, not an edit that
  silently rewrites existing account trading dates. An account timezone/base
  currency correction requires its own fact-preserving contract.

## Erasure contract

### Delete a Trade Tracker account

The action is available only to an authorized owner for the selected account.
It requires an explicit account-scoped confirmation and shows the account name
and the kinds of data that will be erased. On success it:

1. cancels or blocks active imports for that account and revokes its stored
   broker links;
2. erases the account's source evidence, executions, reconciliation decisions,
   positions, round trips, annotations, reviews, saved analytics and market
   analysis records; and
3. erases associated account-scoped AI records and private source-vault files,
   then selects another allowed active account (or leaves the trader at the
   account-creation state when none remain).

The operation is transactional wherever the data is in the Platform database,
scoped by both workspace and account, and never accepts an account identifier
or owner scope from the browser. It must not delete platform-wide market,
calendar, pricing or other users' records.

### Delete a TraderLink account

The action is separate and more difficult to reach. It requires the typed
phrase `DELETE MY TRADERLINK ACCOUNT`, a final confirmation dialog and, after
public Discord login launches, a recent authenticated session. It erases all
Trade Tracker accounts owned by that Platform user, their Platform preferences,
sessions, identities, memberships, integrations, Academy progress, referral
facts and other user-scoped data. It also revokes the local TraderLink session.

Discord itself is not deleted: it is an external identity provider. TradersLink
removes its local connection to that identity and the user can manage Discord
authorization in Discord separately.

The initial implementation supports a user who is the sole active member of
their workspace. A future shared-workspace contract must transfer ownership or
close the workspace before a member's full erasure; it must never remove other
people's data by implication.

## Technical safeguards

- Existing Journal and Coach rows deliberately reject ordinary deletion. The
  server-owned erasure command temporarily lifts those guards only inside one
  immediate SQLite transaction, restores every original guard before commit,
  and runs a foreign-key check before it can succeed. Ordinary application
  writes never receive this capability.
- Use a server-owned one-time erasure command, a fixed deletion order, an
  immediate database transaction and explicit source-vault cleanup. The browser
  only supplies an opaque account-selection reference and the required
  confirmation phrase.
- A completed account-only deletion cannot be replayed against a newly created
  account because the browser submits an opaque selection that the server
  resolves against the current authorized account before deletion.
- Do not display source identifiers, login subjects, evidence contents or
  deletion internals in the UI or response.
- An active operational database is erased immediately. Private disaster
  recovery backups require a documented expiry/purge policy before the product
  promises that data has disappeared from every backup copy; the UI must state
  this honestly until that policy is implemented.

## Implementation sequence

1. Build the sectioned Settings hub while preserving current route behavior.
2. Add the account/profile empty state required after an account-only erase.
3. Design, migrate and prove the scoped erasure authorization and deletion
   order on a disposable database. Verify account isolation, trigger/FK
   integrity, session revocation and source-vault cleanup without touching the
   accepted local Journal database.
4. Add the Privacy UI only after the command is proven; no deceptive or
   non-functional delete control is shipped.
5. Add backup-retention language and an operational purge procedure before any
   hosted deletion claim.

## Acceptance evidence

- Each pre-existing account setting appears exactly once in a clear Settings
  section and its existing server-authorized save path still works.
- A user can navigate directly to every section and use it on a narrow phone.
- A deletion attempt with an invalid confirmation, stale selection or
  unauthorized scope changes nothing.
- A disposable two-account proof deletes only the selected account and keeps
  the other account's facts and selections usable.
- A disposable full-account proof removes the user's local access and all
  user-scoped records while preserving unrelated users' and platform-wide data.
- Owner visual review accepts the Settings hub and Privacy language before
  either deletion control is accepted.

## Owner acceptance record

- The owner visually approved the Privacy UI and its account-only/full-account
  deletion language on 2026-08-10. The Settings hub was approved earlier that
  day.
