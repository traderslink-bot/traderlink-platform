# Multi-provider login acceptance audit

Status: local implementation checkpoints preserved; full acceptance incomplete.
Latest evidence: [current progress](platform-multi-provider-login-progress.md) and
[owner-requested QA](platform-multi-provider-login-qa-2026-10-14.md).
Scope: [approved login plan](platform-multi-provider-login-plan.md). This is an
implementation candidate in the isolated membership review worktree, not main
or a published application. No owner data or existing database was migrated.

| Requirement | Current evidence | Acceptance status |
| --- | --- | --- |
| Google, Discord, email sign-in | Provider services, email/Google routes and preserved Discord callback; real disposable Google/email request-scope test proves plan-backed admission without Discord, separate Journal accounts and unpaid billing-only access | Implemented and focused verified; full browser pending |
| Stable provider subjects and user ownership | Shared provisioning; immutable identity constraints; conflict/reconnect service tests | Focused proof passes |
| No automatic email merge | Verified-email collision tests; explicit account-bound link intent | Focused proof passes |
| Explicit account-bound linking | Active session with no five-minute age gate; single-use user/session/provider-bound intent; expired-session and conflict tests | Focused proof passes; browser pending |
| Journal, plans and usage preservation | Real disposable migrated SQLite test compares owned accounts, entitlement rows, effective access, usage anchors and recorded levels usage across link/unlink/reconnect | Focused proof passes |
| Verified signup, resend and email addition | Pending credentials; password proof at verification; atomic mail enqueue and pending-registration recovery tests | Focused proof passes; delivery/browser pending |
| Password reset and email change | Single-use tokens; expiration; no reset auto-login; previous-session revocation and retained credential identity tests | Focused proof passes; browser pending |
| Argon2id and bounded work | Native library tests; unique salts, parameters, event-loop ticks, ten queued jobs and overload recovery | Focused proof passes; production capacity unproven |
| Google OIDC protections | Signed synthetic issuer tests for state, nonce, PKCE, issuer/audience/expiry/signature and replay | Synthetic proof plus owner-confirmed real Google app entry |
| CSRF, bounded input, safe redirects | HTTP helper tests and request-scope tests; source-reviewed route boundaries | Focused proof; full route/browser acceptance pending |
| Unlink and retained ownership | Last-method prevention; same-owner reconnect; session revocation; Discord fact removal | Focused proof passes; browser pending |
| Administrator boundary | Runtime authorization unchanged; one existing test still expects timeout removed deliberately in commit 4980d577e | Existing stale test unresolved; do not restore timeout within this slice |
| Encrypted reliable mail | Atomic enqueue rollback, leases/retries, expiration, payload clearing and delivery-ID substitution tests | Focused proof passes; real sender pending |
| Session cookie behavior | Existing session service, cookie helper and server-side validation retained; provider session regression tests | Focused proof; live HTTPS/browser pending |
| UI, errors and accessible controls | Six React DOM tests for token handling, incomplete links, password mismatch and disconnect safeguards; shared theme tokens | Component proof only; desktop/mobile Light/Navy Dark and keyboard visual acceptance pending |
| Ordinary app and Academy entry | Generic /login links, stable Academy slugs, existing registry validation | Source/registry proof; integrated browser pending |
| Help and setup documentation | Login Help Center guide, provider setup/runbook and progress tracker | Implemented |
| Current-source production build | Earlier preliminary snapshot built; current artifact has no BUILD_ID | Not accepted; owner explicitly forbids builds |
| Real Google/Discord/email acceptance | Owner confirmed Google entered the app and Resend delivery arrived; real email verification/reset acceptance remains open. Owner confirmed real Discord linking to the existing Google account and server membership on 2026-10-15; configured preview credentials were exercised | Google app-entry and test-mail delivery accepted; Discord connection accepted by owner; full email acceptance pending |
| Publication and migration rollout | No push, deploy or existing-data migration performed | Separate authorized release; not attempted |

## Performance evidence

Synthetic Codespaces measurement after the password queue test: one hash 98 ms,
one verification 86 ms, ten queued hashes 380 ms, 101 event-loop timer ticks
and maximum observed timer gap 15 ms. These values describe this run only; they
do not establish hosted throughput, memory headroom or production acceptance.
Ordinary session resolution uses local storage; Google/Discord token validation
belongs to explicit OAuth callbacks rather than ordinary page requests.

## Remaining completion gates

The no-build instruction remains active. The owner subsequently authorized the
registered functional development preview; earlier statements that no preview
exists are historical. Chromium has verified email session entry, logout,
Workspace admission, Discord notices and desktop/mobile layout. These checks
do not substitute for real Discord consent/linking or email verification/reset
acceptance. Google app entry and transactional test delivery were owner confirmed.
Discord preview credentials are configured and real linking is owner-confirmed.
Real email verification and password-reset acceptance remain open. No secrets belong in chat
or Git. The no-plan Workspace heading now uses the shared live palette directly; its
latest visual verification is recorded with the preview checkpoint.

Before integration, reconcile the migration reservation and exact canonical
predecessor, preserve unrelated work, and use an explicit file allowlist. Before
any existing-data migration or publication, satisfy the established backup,
complete migration ledger, one-writer and coordinated release requirements.
Owner UI approval and real payment acceptance are not implied by local tests.

## Latest checkpoint — 2026-10-15

Owner confirmed the server-status notice is visible. The complete email HTTP
handler test passes signup/verification, sign-in, reset, session revocation and
logout using real hashing, migrated disposable storage and encrypted queued
messages. External delivery is mocked; this does not claim owner mailbox
verification/reset acceptance. Its outdated /plans redirect expectation was
corrected to the owner-requested /workspace destination. Prior code and provider
acceptance remain scoped as above; no build or deployment was run.

The first restriction entrypoint audit is in
[Trade Analyzer restriction audit](trade-analyzer-membership-restriction-audit.md).

2026-10-15 owner confirmation: email submission and receipt of the verification
mail now work. New branded HTML is offline-render/browser verified and applies
to future deliveries; owner review of the revised delivery and real verification/
reset completion remain open. Ordinary login-method changes no longer require
a sign-in within five minutes, per owner direction. See current progress.

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
