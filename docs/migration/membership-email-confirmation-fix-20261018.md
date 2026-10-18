# Email confirmation recovery and add-email name correction

Date: 2026-10-18. Owner authorized both fixes and browser retesting; deployment and production changes require new approval.

## Evidence

Moonmafia added verified email and linked Google. A change-email token remained unused and time-valid while owner saw generic invalid/expired. Credential did not change. Exact original failed predicate is not captured. Source used the same invalid error for missing session, wrong user, and bad token. Browser inventory includes multiple Chrome profiles, but that does not prove which profile handled the failed email link.

## Prepared local changes

- Add-email hides Name; account creation still requires it. Server takes existing authenticated account displayName when linking email, ignores client name, and retains name validation for new signup.
- Validate confirmation token, then explicitly distinguish no session from wrong account. Both return401 with recovery text; expired/used/malformed links remain rejected. Same stable-user check remains mandatory before consumption/change. No auto merge or sign-in by link.
- Recovery opens sign-in in a separate tab so the original confirmation token remains only in component memory. No new token persistence, cookie or URL-query storage. Return to original page to confirm after signing in.
- Synchronous submit guard prevents overlapping submissions and stays locked after successful redirect. Failed requests unlock for retry.
- Confirmation page sends no referrer.

Allowlist: app/login/login-form.tsx; app/login/change-email/page.tsx; app/api/auth/email/route.ts; src/modules/platform/server/authentication/platform-login-service.ts.

## Validation and limits

Source diff reviewed; git diff --check passed. No Vitest, tests, builds, installs, local preview, commit, push or deployment. Browser readback of current Moonmafia staging page confirms Google/Discord/email connected and pending email-change notice. Updated code is not deployed: successful confirmation recovery and no-name linking cannot honestly be marked browser-passed yet. Root cause of original request still unproven; prepared recovery addresses identified missing/mismatched-session failure paths rather than claiming a captured original request. Staging deployment approval is the remaining prerequisite to full post-fix browser acceptance.

## Status

Implementation prepared; Coordinator review pending; post-fix hosted/browser verification pending owner staging approval. Production untouched.

## Owner-requested duplicate-email correction

Owner verified email addition on Bullrun, then tried the same email on a different TradersLink account and received generic invalid/expired. Added email_in_use message: “This email address is already connected to another account. Use a different email address.” Authenticated link-email now checks ownership before password/reconnect/resend branches; signup transaction and reconnect transaction also reject foreign ownership explicitly. Same-account reconnect remains allowed with password proof. Public signup/reset generic responses stay unchanged. No account merging, reassignment, or ownership-check removal. Source diff whitespace check passed; no tests/build or deployment. Browser retest remains pending approval to stage the complete held batch.
