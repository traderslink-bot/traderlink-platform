# Multi-provider login QA — October 14, 2026

Result: focused automated verification passes for the changed login flows after
two fixes. Overall browser/live acceptance is incomplete. No builds, hosted
configuration edits, production-data reads/mutations, migrations of existing
databases, pushes or deployments were performed.

Story: a member chooses Google, Discord or email, proves that method, receives
a stable Platform session and accesses their own plan-backed Journal; linking,
recovery and disconnecting must preserve ownership and commercial usage.

Candidate: /workspaces/traderlink-membership-qa, branch
codex/membership-unified-editor-local-qa-recovery-20261013. Starting HEAD
6ed53e30a; the QA fixes are a subsequent narrow local checkpoint. Unrelated
canonical checkout and the running Coaching preview were left untouched.

## Findings and fixes

1. Discord reauthentication could reuse the current session. Account's “Sign in
   again” did not request consent, so the existing Discord route could shortcut
   back to Account without refreshing the session needed for sensitive changes.
   Account now requests explicit reauthentication; the common login screen
   passes prompt=consent to Discord for that path. Component and actual
   authorization-start handler tests pass with an existing app identity.
2. Disconnected email retained password-reset authority. A regression test
   reproduced issuance of a reset token after disconnect. Recovery could modify
   the retained password and revoke other sessions even though email sign-in
   stayed disconnected. New requests and reset consumption now require an
   active email identity for a verified credential. Disconnect also consumes
   outstanding credential tokens. Regression proves the other session survives
   and old reset links remain invalid after reconnect. Pending unverified signup
   recovery and active-email password reset still pass.

Help Center and provider runbook now explain disconnected-email recovery and
retained-password reconnection. No UI redesign was required.

## Evidence

| Boundary | Evidence | Result |
| --- | --- | --- |
| Core service/provider/session/account access | 15-file run: 47 passing, one failing unchanged admin assertion | Partial suite pass; known baseline failure retained |
| Actual email HTTP handlers | Signup, pre-verification denial, verification/replay, login with safe redirect, HttpOnly/Secure/Lax cookie, sole-method disconnect denial, encrypted reset queue, reset/replay and prior-session revocation; real Argon2 and disposable migrated SQLite; worker/network disabled | Pass |
| Final changed flows | Four-file run after fixes: 13 tests passed (all login-service, email-route, Discord reauthentication, React form checks) | Pass |
| Ownership/allowances | Same Journal account, entitlement, effective allowance, usage anchor and recorded usage across provider linking/reconnect | Pass in core service regression |
| Provider-independent access | Google/email signed members admitted through Journal-only plan, billing allowed before entitlement, dashboard denied before entitlement, separate workspaces/accounts | Pass |
| OIDC proof | Signed synthetic provider; nonce/state/PKCE, issuer/audience/expiry/signature/replay and transaction-expiry negatives | Pass in core suite |
| Mail | Encryption, lease/retry/expiration/clearing and delivery-ID ciphertext substitution | Pass in core suite |
| UI | Six React DOM checks including Strict Mode token reading, missing-link explanation, mismatch rejection, sole-method safeguard, Discord benefit confirmation and reauthentication link | Pass; not visual browser acceptance |
| TypeScript | Final stable source-root check: 302 roots including ambient declarations, zero diagnostics | Pass |
| Lint | Full login commit allowlist initially; targeted changed/new sources after fixes | Pass |
| Academy | Registry validator passes; 26 expected unregistered draft/archive markdown warnings | Pass with existing warnings |
| Complete browser flow | No complete BUILD_ID in the candidate artifact directories; no matching running candidate preview. The observed running Next server belongs to a separate Coaching worktree | Not run |
| Live providers and delivery | Provider/sender credentials absent from checked local configuration; hosted settings not inferred | Not run |
| Current production build | Explicit owner no-build instruction retained | Not run |

## Existing failure

platform-admin-authorization.test.ts:128 still expects rejection after five
minutes. Commit 4980d577ef5721a4e93dea3dbb3da2e379dff9c9 deliberately removed
that timeout. Runtime administration and this older test were not changed by
the login QA slice. This is not counted as a passing test and the suite is not
described as wholly green.

## Remaining acceptance

A current runnable candidate is needed for full browser signup/login/logout,
linking/recovery, mobile, Light/Navy Dark, keyboard and live HTTPS cookie checks.
No build or dev compilation was started to work around the owner's instruction.
Google/Discord OAuth and a verified transactional sender also need secure
non-production configuration for real acceptance; secrets must not go in chat
or Git. Payment and production rollout remain separate authorized work.

Private synthetic logs: login-qa-owner-request-tests.log,
login-qa-route-tests.log, login-qa-reauth-tests.log,
login-qa-disconnect-before.log (expected red regression),
login-qa-fixes-tests.log, login-qa-recovery-final-types.log and
login-qa-academy-registry.log under /workspaces/private-data. No private log
payloads or credentials are included in this report.


## Second owner-requested QA pass

Starting checkpoint: 83a907a0a. This pass changed tests and QA records only.
No new application defect was found in the exercised paths.

Seven focused files passed all 31 tests. Rechecked both prior fixes, the full
email handler flow, linking/recovery ownership, signed Google proof, encrypted
mail handling and UI controls. Added explicit assertions for single-session
logout versus logout-all, cross-site logout rejection, cookie clearing and
retention of another independent session until logout-all.

Added Google cases proving false, missing and string-valued email_verified
claims are not treated as verified mailbox ownership. Added transport checks
for verification/reset/email-change paths, tokens remaining in URL fragments,
stable per-delivery retry identity, missing sender configuration with zero
provider calls, and provider failures surfacing to the retry layer. All provider
calls in these tests are synthetic; no actual mail or OAuth requests occurred.

Final focused TypeScript: 303 roots, zero diagnostics. The first check caught
missing NODE_ENV in the new mail test's typed environment fixture; corrected
the fixture and reran its four tests successfully. Targeted lint and diff
whitespace checks passed. No production source change was needed. Help Center
guidance was reviewed and needs no further update for test-only additions.

The older admin timeout test was not rerun in this focused second pass; its
previous failure remains tracked above. This does not establish a wholly green
application suite. Full browser/mobile/theme/live HTTPS and real-provider
acceptance remain unverified. The no-build instruction was respected.

Synthetic logs: login-qa-second-pass-tests.log,
login-qa-second-pass-types.log (initial fixture diagnostics) and
login-qa-second-pass-types-final.log under /workspaces/private-data.
