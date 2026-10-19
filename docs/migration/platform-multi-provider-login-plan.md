# Platform login: Google, email/password and Discord

Owner-approved Discord release/relink follow-up:
[Disconnect releases Discord for another account](discord-disconnect-release-progress-20261019.md).

Owner-approved profile-name follow-up (source only; deployment held):
[Unique editable profile names](profile-name-progress-20261018.md).

Status: proposed implementation plan following the owner direction of 2026-10-14.
This checkpoint creates the plan; it does not activate providers, run migrations,
change hosted data or deploy. Login precedes new visible feature-gating work.

## Outcome and acceptance

Members can choose Google, email/password or Discord to enter the same Platform
account. Discord is optional for ordinary app login and is connected separately
for Discord plan benefits. Existing users keep their Platform user/workspace IDs,
Journal ownership, purchases, add-ons, Academy progress and allowances.
Owner administration retains its fresh Discord ownership evidence and active
server-side administrator grant; another sign-in method does not bypass them.

## Verified source foundation

- `platform_auth_identities` and PlatformAuthenticationRepository already use
  provider plus subject, with identity conflicts rejected.
- PlatformSessionRepository and PlatformSessionService already accept provider
  identities, store session-token digests and support revocation. Existing TTL
  is 30 days; preserve it initially and test expiration and revoked sessions.
- Discord login/callback and logout/current-session/all-session routes exist.
  PlatformDiscordSignInService also provisions users/workspaces/Journal accounts,
  records Discord facts and activates demo accounts. Extract shared provisioning
  carefully; Google/email must not depend on guild facts.
- Current cookies are HttpOnly, SameSite=Lax, Secure in production and use a
  shared traderslink.pro domain. Audit cross-subdomain trust before extending
  login; any cookie-scope change requires coordinated public/dashboard testing.
- Existing notification email storage and Resend delivery code are candidates
  for reuse, not automatically verified login addresses or an auth mail pipeline.
- Historical F6 deferred email/password; this owner direction changes that scope.

## Identity and linking contract

Use stable Platform user ID for ownership and provider subject for authentication.
Google uses validated OIDC `sub`, never email as its identity key. Preserve
Discord subjects. Email credentials use a stable internal credential identity;
changing an address must not change user ownership.

No automatic account merge based on matching email. Link a provider only after
an active signed-in session for the current account and proof of the new provider, with a
single-use link intent bound to the current user/session. Reject identities
already belonging to another user. Concurrent callbacks must not create duplicate
links. On email collisions, direct the person to sign in through their existing
method and link deliberately; do not disclose private account details.

Unlinking requires an active signed-in session and must not remove the last usable
verified sign-in method. Explain effects on Discord benefits before disconnecting.
Existing separate accounts need an independently reviewed recovery process;
do not merge their Journal data or purchases in this implementation.

## Login and recovery flows

- One sign-in/sign-up experience with Google, Discord and email/password choices.
- Email signup requires verification before normal member access. Use one
  pending credential record; do not provision duplicate workspaces on retries.
- Existing OAuth members can add a password only after verified email ownership
  and an active account session. A reset request cannot attach a password
  to an arbitrary matching OAuth account.
- Password hashing: Argon2id through a maintained library, unique salts and
  parameters recorded with hashes. Benchmark at least OWASP's recommended
  minimum on the target runtime. Hash outside SQLite write transactions and
  off the synchronous request/event-loop path; bound concurrency.
- Password policy, throttles and generic error responses apply to signup,
  login, reset and verification. Avoid account enumeration and denial-of-service
  through permanent lockouts. Bound inputs and test long/multibyte passwords.
- Verification/reset tokens are random, hashed at rest, single-use, expiring
  and atomically consumed. Reset links expire after 30 minutes; verification
  links after 24 hours. GET displays a form; explicit POST consumes a token so
  email scanners cannot reset credentials. Never log passwords or link tokens.
- Successful reset does not automatically log in; revoke prior sessions and
  require normal sign-in. Password/email changes notify the verified address.
- Password recovery restores the same user, never a replacement account.

## Provider and session controls

Google authorization-code flow uses state, PKCE and nonce, exact registered
redirect origins and verified token signature/issuer/audience/expiry. Separate
login and link intents. Use a maintained OIDC implementation; do not hand-write
JWT verification. Preserve and regression-test Discord OAuth/state protections.

All credentials, authorization codes and provider secrets stay server-side.
Validate same-origin mutations, safe return paths, token replay, callback expiry,
session fixation, disabled identities/users, and login/link throttles. Rotate
sessions after sign-in and sensitive account changes. Account recovery must not
weaken administrator authorization. Keep delivery work outside database locks;
mail retries must be idempotent and secrets redacted.

## Bounded implementation sequence

1. Complete route/schema/security audit and register exact affected files.
   Check canonical integration parent with coordinator before implementation;
   current membership review worktree is an isolated candidate, not main.
2. Extract shared provisioning and explicit provider-link service; preserve
   Discord behavior and add conflict/concurrency tests using disposable data.
3. Reserve an additive migration with the migration register/coordinator for
   credential, verified-login-email, token and link-intent storage as required.
   No migration number is assumed. Verify backup/restore and the complete ledger
   before any authorized existing-database application.
4. Implement email signup/verification/login/reset with a synthetic mail sink.
5. Implement Google OAuth against mocked issuer/token endpoints; test Discord
   as the third equivalent login method and optional connected benefit account.
6. Add login and connected-account screens, shared themes, accessible mobile
   layouts, loading/error states and Help Center guide updates. Owner reviews UI.
7. Validate signed-member ownership, purchases/allowances and account linking
   across providers, then perform approved non-production provider acceptance.
8. Prepare an exact release allowlist and rollout/rollback evidence. Obtain
   explicit release approval before production activation or publication.

## Verification and performance gate

Targeted tests cover new versus existing members, provider subject collisions,
email verification, reset/replay/expiry, unlink-last-method prevention, duplicate
callbacks, CSRF, open redirects, throttles and session revocation. Verify the
same Journal accounts and effective plan/add-ons before/after linking, with no
reset of usage anchors or entitlements and no elevated owner access.

Use signed synthetic accounts for browser signup/login/logout/recovery/linking
on desktop/mobile and Light/Navy Dark. Cover unavailable providers/mail failure
and retries. Run relevant lint/TypeScript plus full build at the completed auth
checkpoint. Benchmark password latency/event-loop responsiveness under bounded
concurrency; session reads must not call Google/Discord on every ordinary page.
Real Google, Discord and email acceptance is distinct from mocked local proof.
Payment processing testing remains a separate unfinished gate.

## External setup and rollout

Owner-controlled Google OAuth project/client, consent setup, exact production
and staging callbacks, credentials and verified email sender are needed for live
acceptance. Prefer the existing email provider only after confirming authorized
sender and delivery readiness. Do not expose secrets or send real verification
emails during synthetic tests. No production login, Discord-role delivery,
payment or shared-host configuration is activated by this plan.

Rollback disables new-provider entry while retaining existing identity and
credential data; preserve working Discord entry and existing member ownership.
Do not drop tables or disconnect the sole method for users already enrolled
through a new provider. Establish a usable recovery/rollback route before launch.

## References

- [Public identity foundation](phase-5-slice-f6-public-identity-and-hosted-transfer-plan.md)
- [Feature restrictions](membership-feature-restrictions-progress.md)
- [Google OIDC subjects and claims](https://developers.google.com/identity/openid-connect/reference)
- [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP recovery](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)

Current checkpoint: local login services, routes and UI are preserved in narrow
commits. [Owner-requested QA](platform-multi-provider-login-qa-2026-10-14.md)
records two corrected issues and remaining browser/live-provider acceptance.
The owner prohibits builds; no current-source build or full browser pass is
claimed. Canonical integration and release remain separate gated operations.

Implementation tracking: [Login progress](platform-multi-provider-login-progress.md).


## Owner-directed Workspace and Discord onboarding — 2026-10-15

Ordinary Google/email/Discord sign-in lands at /workspace. Explicit return
destinations remain intact for protected pages and account linking. A new
member without Journal access sees the Workspace welcome/plan choice without
reading Journal trading facts. Other pages retain their existing admission and
feature checks; the proxy overwrites the actual request-path header rather than
trusting a caller-provided Workspace assertion.

Discord is optional for app entry and checkout. The owner confirmed members
can skip connection, use the app and connect later. Plans/add-ons gain an
optional Requires Discord presentation setting, shown before signup and carried
into combined purchases. There is no migration and old documents/revision hashes
remain unchanged when this optional setting is absent.

An unconnected Google/email member sees a dismissible community introduction.
An active plan requiring Discord produces a persistent, non-blocking reminder.
Both link to the existing account-bound connection flow. The
notice is based on active identity and effective plan versions, not stale guild
snapshots or login-provider guesses. It makes no external calls while rendering.
Connecting suppresses the notice; expired/cancelled requirements stop applying.

## Discord community onboarding correction — 2026-10-15

Account connection and joining the configured TradersLink Discord server are
separate steps. General invitations must not assume a purchased plan. Required
plans retain a nonblocking reminder until both connection and confirmed server
membership are present. Expose the existing public server invite and an explicit
Discord sign-in recheck after joining; no background provider polling. Confirmed
absence supersedes older positive membership evidence. App access remains governed
by existing membership checks, not by the onboarding notice.

Membership rechecks use the existing explicit session-bound linking intent and
Discord consent, not ordinary sign-in. A different Discord identity must fail
without creating or switching accounts. The recheck can return to Workspace;
other account-link operations retain their Account login-methods destination.

2026-10-15 callback correction: use the shared canonical Discord joined-at
normalizer when connecting an account. Functional-preview error recovery must
allow /sign-in-help and return failed account connections to Login methods for
a fresh bound intent. See the progress tracker for focused verification and
the remaining live-provider acceptance boundary.

2026-10-15 owner accepted real Discord connection. Login methods must retain
server explanation/invitation, while Workspace-bound connection must confirm
server status after authorization. Existing members open the server; people
not confirmed as joined receive the invitation and membership recheck.

2026-10-15 owner password policy: minimum eight characters for new passwords
and resets, with the existing 1,024-byte upper bound. Email field labels remain
floated to avoid typed/autofilled value overlap.

## Owner policy and confirmation email revision — 2026-10-15

The owner removed the five-minute recent-login requirement for ordinary
login-method changes. Any active Platform session can add/remove methods or
change email; expired/revoked sessions still fail and provider/email proof,
account-bound single-use intents and last-method prevention remain. The
always-visible Sign in again to make changes control is removed. Administrator
ownership authorization is a separate boundary and is unchanged.

Verification request/resend responses show the submitted address in bold using
the owner-approved confirmation sentence. Signup verification emails use the
approved TradersLink greeting, confirmation button, fallback URL, ignore notice
and signature; existing-account additions and resets adapt their wording. HTML
and text alternatives retain fragment tokens and stable delivery identity.

## One-click email verification — 2026-10-15

Owner requested ordinary email-link confirmation without a second password
entry. This supersedes the earlier verification password/session requirement.
Opening the fragment-bearing verification page submits a same-origin POST once
(client Strict Mode guarded); GET itself performs no database mutation. Email
link renderers executing JavaScript can now consume a valid verification token;
this is the tradeoff of automatic confirmation. Token remains single-use,
24-hour bounded and restricted to the issuing credential/account. Verification
works while signed out, does not sign in the browser, and never attaches an
email to the browser's unrelated account. Signup still creates one stable user;
adding email preserves the original Google/Discord user. Password reset still
requires choosing a new password. Invalid/expired verification links explain
that the newest email is required. No schema change or production build.
