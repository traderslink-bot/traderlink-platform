# Login provider setup and local acceptance

This runbook supports [the login plan](platform-multi-provider-login-plan.md).
No credentials belong in Git or chat. All hosted edits and releases require the
coordinated exact source, migration, backup and one-writer release safeguards.

## Configuration

- `TRADERLINK_PLATFORM_PUBLIC_ORIGIN`: exact HTTPS application origin, without
  a path, query or fragment. It is independent of Discord configuration.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google web OAuth client. Register
  the exact `${origin}/api/auth/google/callback` URL separately for each runtime.
  Configure Google consent and test/production access before live acceptance.
- Existing `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`
  and `DISCORD_GUILD_ID` remain supported. The existing Discord callback is also
  used for explicitly connecting Discord to a signed-in member.
- `RESEND_API_KEY`, `TRADERLINK_LOGIN_EMAIL_FROM`: authorized transactional sender
  for verification, reset and password-change messages. Configure and test sender
  delivery in non-production before activation. Notifications preferences do not
  suppress authentication/recovery emails.
- `TRADERLINK_LOGIN_RATE_LIMIT_SECRET`: independent random secret, at least 32
  characters, for opaque persistent throttle keys. Missing configuration fails
  authentication mutations closed.
- Optional `TRADERLINK_LOGIN_TRUSTED_IP_HEADER`: only set to a header the verified
  deployment proxy overwrites. Without that assurance, use the shared capped
  bucket plus per-email throttles; never trust arbitrary forwarded client IPs.

Password hashes use bounded asynchronous Argon2id (19 MiB, two passes, one lane),
with at most two operations plus eight queued locally. Hashing is outside SQLite
write transactions. Test representative production latency before launch.

## Routes and behavior

`/login` supports Google, Discord and email; `?mode=signup` opens email signup.
`/login/forgot`, `/login/verify`, `/login/reset` support recovery.
`/login/change-email` verifies an address change requested from Account; it
requires recent sign-in, retains the credential identity, rotates sessions and
notifies the old and new addresses. Email tokens are
in URL fragments, stripped after the client reads them, and consumed only by
explicit POST. Verification additionally proves the originally chosen password.
Password reset does not log in automatically and revokes prior sessions.

`/account/login` lists connected methods and requires recent sign-in to change
connections. Linking proves both the current account and the new provider; no
email-based automatic merge occurs. Disconnect cannot remove the last configured,
usable method. Disconnecting the current method ends that method's sessions.
Email disconnect disables new password-reset requests and invalidates outstanding
credential tokens; old reset links stay invalid after reconnection. Reconnection
requires the retained password and recent proof of the same account.
Discord disconnect clears current role/owner facts while keeping stored records;
ordinary request scope ignores facts without an active Discord identity.
Existing app membership and Journal ownership remain independent of Discord.

## Storage and release

Candidate migration `0166_platform_multi_provider_login` / order 179 follows the
unified membership candidate 0165 / order 178. Reconcile the complete canonical
predecessor and reservation before integrating or applying it. Schema changes are
additive, apart from allowing same-owner identity reconnection through explicit
proof. The identity ownership and no-delete trigger constraints remain intact.

Local acceptance uses newly initialized disposable databases and mocked providers.
Never apply the candidate migration to an existing preview or hosted database to
make tests pass. Real-provider login, consent, verified sender delivery and
production cookies remain separate acceptance evidence. Rollback keeps enrolled
members' identities/credentials and all migration history; disabling new signup
alone must not remove their sole recovery path.

Authentication messages are queued encrypted in the same transaction as the
credential/token change. The persistent Node worker leases up to three messages
per pass, retries bounded provider failures and uses per-delivery idempotency.
No recipient/token payloads are logged. The login rate-limit master also derives
an independent purpose-bound outbox key; drain pending mail before rotating it,
or retain the previous deployment securely until its queue is handled. Failed
or expired links can be requested again through the verified recovery flows.
Discord's configured callback must be on the same app origin for host-only
connection-intent cookies to complete an explicit link.
