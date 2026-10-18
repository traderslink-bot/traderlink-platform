# Login methods account details — October 18, 2026

Owner requested clear connected-account, configured-email and verification status
before continuing the Add email browser handoff. Source implementation complete;
not deployed or browser accepted. No credential was added or removed in this slice.

## Changes

- Login methods shows the connected provider accounts and the method used
  for this sign-in. Google, Discord and email/password have separate bordered
  sections using shared theme tokens and wrapping long addresses on mobile.
- Owner clarification: this is normal-user UI. Do not show a heading identifying
  which TradersLink account is being edited; that heading and its read-model
  field were removed. Provider account labels remain.
- Email/password shows the exact credential address, verified/not verified,
  connected/disconnected, and separately the unexpired pending email change.
  The current address remains visible until the change is confirmed.
- Google shows provider-confirmed display name and verified provider email;
  Discord shows its username and verified provider email when supplied.
  These are display facts only; stable identity ownership and authorization stay
  unchanged. No passwords, hashes, OAuth subject IDs or verification tokens are
  sent to the component.
- Existing provider connections without a saved profile explicitly say details
  will appear after the next provider sign-in. No guessed or cross-provider
  email attribution, backfill, or forced reconnect.
- A Refresh connection status button supports confirmation in another tab.
  Add email/change email refresh the server details after submission; inline
  disconnect success notices stay beside their controls.
- Owner phone acceptance: staged email-change message was received and the
  verification completed, returning to account settings. Owner found the missing
  success notice and mixed Confirm/Verify wording confusing. Added to this held
  batch: use Verify in email subject/body/button, verification page/button,
  request/pending/recovery copy. Successful email change already redirects with
  `emailChanged=1`; Login methods now renders a top success notice including the
  server-read address only when that credential is connected and verified.
  No email or token is added to the redirect URL; no sign-in behavior changed.

## Coordination and verification boundary

Coordinator reserved `0172_platform_login_identity_profiles`, execution order
185. Shared alerts owns 0171. The local manifest only has Membership predecessors;
Coordinator must preserve the full staging migration ledger during integration.
The profile table has a composite foreign key to the existing immutable provider
identity; account erasure already discovers and deletes orphan descendants using
composite foreign keys. No erasure-service change was needed.

Static source/diff review completed; `git diff --check` passed. No Vitest, build,
local server, migration or deployment run. Browser acceptance of this new UI
requires an approved staging batch. Remaining acceptance: saved provider labels,
missing historical labels, no email, awaiting verification, verified connection,
disconnected credential, pending email change, same-account confirmation,
last-method protection, inline mobile notice, desktop/mobile Light/Navy Dark.

Existing staged email fixes remain intact. Earlier browser checks confirmed
Add email has no Name field and another account's email produces the specific
already-connected error. Successful fresh Add email/confirmation remains open;
the owner paused that handoff to request this UI correction.

## Allowlist

- `app/(member)/account/login/page.tsx`
- `app/(member)/account/login/connected-methods.tsx`
- `app/login/login-form.tsx` (completion callback only, preserve prior fixes)
- `app/login/login-form.tsx` also uses verification-link wording and Verify new
  email button text; existing password and token-handling protections stay intact.
- `app/login/login-screen.tsx` (Verify heading)
- `app/login/change-email/page.tsx` (Verify metadata)
- `app/api/auth/email/route.ts` (verification terminology)
- `src/modules/platform/server/authentication/platform-login-email.ts`
  (Verify subject/body/button)
- `app/api/auth/discord/callback/route.ts`
- `src/modules/platform/contracts/platform-login-method-details.ts`
- `src/modules/platform/server/authentication/platform-login-service.ts`
  (profile write/read model only, preserve prior email fixes)
- `src/modules/platform/server/database/migrations/0172_platform_login_identity_profiles.ts`
- `src/modules/platform/server/database/platform-migration-manifest.ts`
- This progress record and its plan link.

Owner authorized completion of staging deployment and browser retest after the
remaining deployment requirement was explained. Coordinator owns the single
staging lane. Production remains excluded. Coordinator review corrections applied:
newest verification email copy; provider cards explicitly label verified provider
emails or say none is available. Integration must retain 0168–0171 before 0172.

## Staging acceptance checklist for this batch

| Browser check | Status before release |
| --- | --- |
| Configured email is visible with Verified status | Awaiting new build |
| Email-absent account says Not set up, no Name input | Existing fixture ready |
| Sole connected method cannot be disconnected | Existing fixture ready |
| Existing providers without historical profile have explicit fallback | Awaiting new build |
| Fresh provider sign-in captures correct provider label/email | Existing Discord session available |
| Verified provider email explicitly labeled, absent email explained | Awaiting new build |
| Email-change success destination displays verified address | Awaiting new build |
| Pending address remains separate from current verified email | Needs pending email-change request |
| New-address delivery and verification | Owner phone pass on preceding build |
| Fresh Add email with new password and verification | Requires owner password entry; not replaced by backend writes |
| Disconnected credential address/status, restore connected methods | After safe fixture selection |
| Inline disconnect notice and last-method guard preserved | Browser retest pending |
| Mobile/desktop, Light/Navy Dark and long-address wrapping | Browser retest pending |
| No account-being-edited heading or raw provider subjects exposed | Browser retest pending |

Chrome3 Bullrun desktop session revoked after successful phone email change,
consistent with existing session-rotation behavior. Chrome5 email-absent fixture
remains available; its separate Coaching tab/session must not be disturbed by
authentication mutations while Coaching is using it. No new credential needed
for read-only page, layout and last-method-disabled checks.
