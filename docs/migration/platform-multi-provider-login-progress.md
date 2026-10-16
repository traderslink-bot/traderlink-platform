# Multi-provider login implementation progress

Goal active, owner authorized autonomous implementation on 2026-10-14.
Plan: [Login contract](platform-multi-provider-login-plan.md).

Working checkout: `/workspaces/traderlink-membership-qa`, branch
`codex/membership-unified-editor-local-qa-recovery-20261013`.
Candidate parent at start: `248a79750e28b15de282c3e30b62f4d59c781f4e`.
Read-only canonical checkout inspection found HEAD
`a5ca8dcfb1dc5d0629dfbad1fac7fdd8755e06f0` with other dirty work. No synchronization
or unrelated changes. Coordinator records were read; integration/release lineage
still needs reconciliation. No production or live provider mutation performed.

## In-progress foundation

Extracted `provisionVerifiedPlatformIdentity` from Discord sign-in. It handles
Discord/Google/email provider subjects using existing stable Platform ownership,
requires a caller transaction, and preserves the protected initial Discord owner.
Discord still performs its existing guild fact/session/Journal/demo steps.

Focused tests: four pass across provider provisioning and Discord sign-in.
Untouched-baseline comparison proved the old Discord expected-account-ID assertion
was stale (session precedes fallback account); corrected the assertion. Default
5-second tests also time out while applying the complete disposable migration
ledger, so this verification used 30-second test timeout. Demo candle data is
unavailable in these fixtures; the existing fallback path was exercised.
Targeted ESLint and focused TypeScript passed (zero diagnostics). The full-tree
check exhausted its default heap; a 4-GiB rerun was replaced by the smaller
source check. Full integrated auth build/type validation remains pending.

## Findings for the next slice

- Ordinary request identity still rejects non-Discord sessions. Generalize only
  member login admission; retain administrator fresh ownership and grant checks.
- Identity subjects are immutable and revoked identity rows cannot reactivate.
  Plan unlink/relink semantics explicitly; never bypass existing triggers or
  accidentally transfer identity ownership. Additive reviewed migration needed.
- Active identity uniqueness permits one method per provider per member.
- Local shell has no Google, Resend or Discord credentials under checked standard
  names. This does not establish hosted configuration readiness or absence.
- Existing auth QA overlay in require-platform-request-scope.ts is unrelated to
  the implementation and must not be committed.

Next: finish type validation/checkpoint, add credential/link/token schema with
registered additive migration, implement verified email recovery and OAuth
services/routes/UI, then full signed-member/browser/build and performance gates.
Real provider acceptance remains distinct from synthetic proof.


## Services/routes/UI in progress

Auth storage candidate 0166/order179 registered after membership candidate178;
only freshly initialized test databases used. Service routes now cover signup,
verification/resend, reset, Google OIDC and explicit connected methods. Email
links use fragments; password proof is rechecked against the current hash in a
transaction. Recovery of pending signup avoids permanent unverified-email lockout.

Google uses openid-client 6.8.8 with nonce/state/PKCE and signature verification.
Seven provider/password tests pass, including invalid nonce/state/audience/expiry,
code replay, unique salts and event-loop ticks. Initial OIDC tests required Node
rather than jsdom WebCrypto; Argon2 parameter-order assertion was corrected to
compare actual parsed parameters. Core service tests previously passed three;
expanded request-scope test run is live, not yet accepted.

The ordinary resolver accepts supported provider sessions and retains Discord
fact requirements where explicitly needed. Dashboard admission recognizes active
app products because the approved editor omits a separate dashboard permission.
Product-specific gates remain independent. Generic request-scope test fixtures
now explicitly enable their intended legacy Discord-member dashboard policy;
old tests relied on an absent grant/policy and failed at that unchanged boundary.

New /login and recovery UI, /account/login controls and shared entry links are
implemented but require browser/accessibility/theme/performance acceptance.
Help Center login/recovery guidance updated in traderslink-app-guides.ts.
[Provider setup and rollout](platform-login-provider-setup.md) records required
configuration without secrets. Missing shell/.env configuration is not a claim
about hosted provider readiness. Full build and real providers are not passed.

Verification handles at this checkpoint: service tests session77861, focused
source TypeScript session46659 (zero diagnostics at its source snapshot), lint
session72163 (passed). New Google/HTTP tests and later source changes need another
focused checkpoint. No production actions; no goal completion claimed.

Latest checkpoint: expanded login-service, HTTP boundary and request-scope tests
passed (7 tests/3 files); provider/password tests passed (7 tests/2 files).
Browser and completed-auth full build remain pending.

Latest source lint (all changed TS/TSX) and focused TypeScript pass with zero
errors. Fixed MUI 9 slotProps/sx usage, separated reusable login screen from the
Next page exports, and removed the abandoned preview environment overlay.
Google and Discord OAuth transactions now retain explicit linking intent so an
expired connecting flow cannot silently become a new signup. Adding email fails
closed without a live recent account session. Verification resend and pending
signup recovery are connected. New boundary regression is running.

Email reconnection now proves the retained credential password plus a recent
same-user session, reactivates only that immutable credential identity, rotates
the session and retains ownership. It does not attach a credential belonging to
another user. Email address change is being added with new-address verification, recent
authentication, notification of the old address and unchanged credential identity.

## Latest source checkpoint, before browser/build

Eleven tests pass across full login service and Google OIDC. This includes
pending-email recovery, email reconnection, verified email changes, stable
ownership, session revocation and invalid signatures. Provider/password and HTTP
boundary suites passed earlier. Ordinary scope fixtures explicitly provision
legacy access; seven tests/three files passed. Email tokens now include a
pending-address field and change-email purpose; migration remains unapplied to
all existing/hosted databases.

Latest type/lint process: session4606. It checks every changed/untracked TS/TSX
root against the actual repository. Do not restart if still live; inspect its
handle and /tmp/login-slice-types.log. Full build is not started yet.

UI /login/change-email completes new-address proof with recent sign-in, keeps the
credential/user identity, revokes prior sessions and sends notices to old and new
addresses. Mail transport is real Resend code but local proof is synthetic only.
Missing mail configuration and transport failure must be tested in browser QA.
Next: integrated build with cached real fonts in isolated candidate; synthetic
browser fixture on a separate port/distDir for signup, verification, login,
reset, Google/Discord linking, role/access checks, desktop/mobile/theme checks.

## Restart recovery and browser boundary findings

The Codespace restarted during dev-browser QA; the browser handle disappeared
and both preview processes were confirmed absent. Retained evidence proves email
signup, rejection before verification, password-proof verification and real
session login through the UI; the server then returned 200 for /workspace with a
Journal-only plan and no Discord. The browser did not complete; no overall pass.

Fixed a custom-server origin mismatch proven by sanitized diagnostic values:
Next reported localhost while the browser used 127.0.0.1. Explicit configured
public origin now applies in development too, allowing HTTP only for loopback
outside production. Three HTTP/origin tests passed; signup HTTP changed from
400 to 200 and a synthetic message was captured. MUI required-label selectors
were corrected for the accessible asterisk; production labels were associated.
Dev browser load waits were changed to DOMContentLoaded instead of all assets.

Stopped the first production build deliberately before completion to correct
email response timing. Mail now uses an AES-GCM encrypted persistent outbox,
atomic credential/token enqueue, leases, bounded retries and per-delivery
idempotency. Provider delivery is outside database transactions and requests do
not wait for network responses. Seven queue/service tests passed before the
final atomic-enqueue assertion was added; rerun that targeted assertion in the
completed checkpoint. Never rotate the queue encryption master with unsent rows
without draining/recovering them; it is purpose-derived from the login secret.

All existing/hosted databases remain unchanged. New migration contents were
revised only while unapplied; old synthetic fixtures are preserved and must not
be reused against the revised checksum. New full-build fixture:
`/workspaces/private-data/membership-qa-fixtures/run-lCycOp/build-fixture.json`.
Fresh initialization: 142 migrations, final order179, zero FK issues.
Next compiled browser QA will use a fresh login fixture, local HTTPS with a
synthetic certificate, real production sessions and no source auth overlay.
Typecheck session40852 currently running; read its live handle and
/workspaces/private-data/login-typecheck.log. No full build or complete browser
acceptance claimed. Goal remains active.


## Compiled QA preparation checkpoint

Full build session99857 is live on candidate .next; compilation succeeded in
5.2 minutes and TypeScript phase began. Recent source tightening (explicit
connect=1 mode and scalar input validation) occurred during that build, so treat
it as preliminary; re-run incrementally against a stable final tree before
acceptance. Do not interrupt a live build solely due to a wait timeout.

Focused all-changed-source TypeScript (with actual ambient declarations) passed
zero diagnostics. Targeted atomic rollback test passed: an enqueue failure
leaves no pending credential or token. Source formatting/lint passed before
latest small intent/body-boundary changes; recheck those at final checkpoint.

Fresh compiled HTTPS browser fixture is
`/workspaces/private-data/login-qa-3GR71S/fixture.json`, source179 including outbox.
Synthetic RSA/OIDC and TLS keys are private QA-only files. PUBLIC_ORIGIN is
https://127.0.0.1:3032. Run compiled-server.cjs with only fixture env plus
provider-sink.cjs and compiled-guard.cjs preloads; use production NODE_ENV.
No auth source overlay. Browser runner accepts LOGIN_QA_ORIGIN and ignores only
its own synthetic TLS certificate. Mail helper polls the synthetic queue sink.
Old dev fixtures remain preserved with their old migration checksum; never
apply updated179 to them to suppress mismatches.

Still required: stable-tree full build; completed signed-member browser flow;
Google/Discord account linkage and standalone login, password/email change,
reset/replay, mobile/themes/keyboard/performance and owner administration denial;
final docs, narrow local commits and explicit completion audit. Real OAuth and
sender acceptance requires securely configured external credentials and remains
separate from local implementation proof. Goal is active, not complete.

Final source review tightened normal-sign-in versus explicit connect=1 intent,
scalar JSON credential validation and generic recovery response timing. Four
HTTP/intent tests passed. Recovery responses have a 250ms floor and resend uses
a dummy hash for unknown addresses. An outbox due-job index prevents polling
from scanning all retained sent-mail metadata. This last index changes the
unapplied candidate checksum again: generate fresh final fixtures and never
reuse earlier applied179 files. No existing data migrated or edited.


## Owner verification constraint — no builds

The owner explicitly instructed “dont run any builds”. The login build was
interrupted and its process was confirmed absent. No further builds are
authorized; the earlier preliminary build is not final-source acceptance.
Continue focused tests, lint, no-emission TypeScript checks and source review.
Do not start a dev compiler as a workaround for this instruction. Browser
acceptance that needs a newly compiled artifact remains unproven.

The current targeted authentication/regression suite is still running. Its
existing Journal admin stale-membership assertion has failed; the tested admin
authorization implementation and its test are unchanged by this login slice.
Keep the failure visible and investigate it rather than weakening an assertion.
A new outbox test now exercises ciphertext substitution across delivery IDs;
its pass is not claimed before the running suite reports it. Generated
public/sw.js deletion from the interrupted build was restored from HEAD.

Final focused source check completed with zero TypeScript diagnostics; targeted
lint passed. The 12-file suite finished: 32 tests passed and one unchanged
admin test failed. History identifies commit 4980d577ef5721a4e93dea3dbb3da2e379dff9c9
(`fix(admin): remove owner evidence timeout`) as the deliberate removal of the
five-minute owner timeout. The old test still expects that timeout. This login
slice does not restore it or alter administrator authorization. Treat this as
an existing stale regression expectation, not a new authentication pass.

Six additional focused tests passed: encrypted-mail delivery-ID substitution,
retry/expiration, Journal-only dashboard admission, unavailable catalog denial,
and ensuring product admission does not grant unrelated tool permissions.
No build was run after the owner's instruction. Full browser acceptance and
real-provider configuration remain pending; no published/live readiness claim.


## Login UI checkpoint

Backend checkpoint is preserved at local commit 829f5dfac. Login/signup,
verification/reset/email-change and connected-method screens now share MUI
theme tokens and the existing Account layout. Ordinary sign-in links use
/login; Discord-specific provider/admin flows remain available. Help Center
includes the login/connected-account/recovery guide; Academy lesson slugs and
progress keys are unchanged.

An incomplete email link now explains its missing code instead of leaving only
a disabled action. Five real React DOM component tests pass: token fragments
are stripped without a network request, missing tokens disable confirmation,
mismatched passwords never submit, sole-provider disconnect is disabled, and
Discord disconnect explains benefit loss before confirmation/cancel. These
are component checks, not visual browser acceptance. Focused lint and
no-emission TypeScript checks passed on the current UI sources.

No complete BUILD_ID exists in either candidate artifact directory. Therefore
there is no usable compiled preview for current-source browser acceptance.
No build or dev compiler was started. Desktop/mobile Light/Navy Dark visual
approval, complete browser flows and live-provider acceptance remain open.


## Ownership and performance audit

UI checkpoint preserved at ed72d45fb. Expanded the real disposable SQLite
link/reconnect regression to compare the member's Journal account rows, active
entitlement, effective 30-generation allowance, usage anchor and recorded
generation usage before/after linking, unlinking and reconnecting. The targeted
regression passed. Password overload/recovery test passed; all three password
tests pass. Synthetic Codespaces benchmark: hash 98ms, verify 86ms, ten queued
hashes 380ms, 101 timer ticks, maximum observed tick gap 15ms. This is local
measurement, not production capacity acceptance.

[Requirement audit](platform-multi-provider-login-acceptance.md) records each
requirement and the remaining browser, live-provider, UI and release gates.
No build was run. Goal remains active and full acceptance is not claimed.

Additional Google negative checks now prove rejection of an untrusted issuer
and an OAuth transaction older than ten minutes. The targeted run passed eight
tests across Google negative cases and ownership preservation. Current-shell
and standard local env-file key-presence checks found none of the required
Google, Discord, Resend/sender or login-secret keys. No secret values were
printed; hosted state was not queried or inferred.

The focused TypeScript helper now keeps explicit login source roots after
commits, so a clean working tree cannot turn it into a check of ambient files
only. It no longer rewrites authentication source virtually. Reproducible
command: `node scripts/login-browser-qa/typecheck.cjs` (no emit, no build).

Stable-root no-emission TypeScript check passed: 300 roots including ambient declarations, zero diagnostics. Targeted lint passed for all three expanded test files.


## Provider-independent request scope

The new disposable-database request-scope regression passed: real Google and
verified-email sessions resolve their own stable workspaces and Journal accounts
without any Discord membership. Before entitlement, billing access is allowed
and dashboard access denied. After granting a Journal-only plan, both providers
resolve normal hosted member scope, with no cross-user account selection. No
local-development authentication override was used. Targeted lint passed.

Browser completion is still blocked by the absent complete compiled artifact
and the owner's no-build instruction, as recorded across preceding checkpoints.
Live-provider acceptance still lacks securely configured local provider/sender
credentials. These are the same outstanding conditions; repeated source checks
cannot substitute for browser or external acceptance. Draft synthetic browser
harness files and the isolated-output ignore rule remain preserved locally;
they have not been run after the no-build instruction or claimed accepted.

The complete stable-root check passed with 301 roots and zero diagnostics.
Strict Mode component testing then reproduced a real fragment-read regression:
the repeated effect cleared the token after its URL fragment was stripped.
Token initialization now remembers the mode already read, preserving the proof
through effect replay without retaining it in the address bar. All five UI
component tests pass with Strict Mode enabled for the fragment regression;
targeted lint passes. No build or browser-ready claim.

Final component-only TypeScript check passed with zero diagnostics. Current
artifact recheck still finds no BUILD_ID in .next or .next-login-qa. The same
browser/no-build and unavailable-provider conditions have persisted across
multiple goal continuations. No remaining source-only check can prove these
open acceptance gates. Full goal completion remains unproven; stop automatic
implementation work at blocked verification rather than inventing readiness.


## Owner-requested QA run

[QA report](platform-multi-provider-login-qa-2026-10-14.md) records the whole
login flow audit and evidence tiers. Initial core run: 47 tests passed, one
unchanged stale admin timeout assertion failed. Added actual email HTTP route
integration with real Argon2, session cookies and encrypted disposable mail
storage; external network and mail worker disabled.

QA fixed Discord's account-change reauthentication shortcut and password-reset
authority remaining after email disconnect. The disconnected-email regression
was reproduced red before the fix. Final four-file affected-flow run: 13 tests
passed. Final stable-root TypeScript: 302 roots, zero diagnostics. Targeted lint
and Academy registry validator passed (26 pre-existing draft/archive warnings).
Help Center and provider runbook updated for disconnected-email recovery.
No build, production-data or hosted-configuration operation occurred. Browser
and live-provider acceptance remain unproven; full implementation goal remains
blocked on those same previously recorded conditions.


## Second owner-requested QA checkpoint

Seven focused suites passed 31 tests, including new logout/logout-all,
cross-site logout, unverified Google email claims and authentication mail
transport checks. No new application bug found in these exercised paths.
Final stable-root TypeScript: 303 roots, zero diagnostics; targeted lint and
whitespace checks pass. An initial test-fixture NODE_ENV typing error was
corrected and the four mail tests rerun successfully. This slice changes
tests/documentation only and requires no Help Center content change.
Full evidence and limits are appended to the existing QA report. The prior
admin timeout assertion failure remains tracked; it was not rerun in this
focused pass. No builds, publication, existing database migration or real
provider operations. Browser/live-provider acceptance remains unproven.


## Guarded screen-preview tooling

Owner authorized registered feature previews on independent available ports.
The coordinator launcher now supports --profile while preserving the normal
3013 default, forbidden 3015, exact HEAD, disposable-data, complete migration
metadata, active-build, memory and port-ownership checks. Six focused guard
tests and an actual occupied-port refusal passed. The login screen server uses
separate development output/config and no auth-source overlay or real provider
keys. See [workflow](feature-preview-workflow.md).

An initial screen startup found alias resolution relative to the isolated
TypeScript config; explicitly setting its baseUrl to the repository fixes the
configuration. The failed 3033 process was stopped only after verifying its
PID, command and cwd; its profile and disposable data remain preserved. A fresh
registered source/port is required for the corrected entry. This is a public
login-screen preview, not completion of signed-member/live-provider acceptance.
No production build, publication or hosted database operation.


Login screen preview reached HTTP 200 on port 3034 at source 25cea04bd.
Real Chromium desktop/mobile checks confirmed the sign-in heading, no page
errors and no mobile horizontal overflow. This verifies public screen rendering,
not provider authentication or protected member flows. The Codespaces root
address exposed the wrapper's restriction message; the server entry now
redirects root GET/HEAD requests to /login. Revised registrations may supply
an explicit profile name, preserving the earlier source-bound registration.


Owner requested removing the existing-account linking explanation from public
sign-in/signup because it is out of place for new members. Removed that copy
only; connected-account guidance stays in Account → Login methods. Public
login root redirect was verified in Chromium (HTTP200, final /login, heading
present) before this copy revision. No authentication behavior changed.


## Functional email preview setup — 2026-10-15

Owner requested functional setup after confirming actual Resend inbox delivery.
Registered functional profiles retain the exact-source launcher and fresh isolated
database. They enable authentication POST routes, login pages, public plans and
Account login methods; other application mutations remain unavailable. The
explicit development-session switch accepts only real, valid persisted sessions;
it does not enable the local owner bypass or change production authorization.
Screen-only profiles retain disabled providers/mutations. The private fixture
contains a random persistent mail/throttle key; Resend credentials are inherited
from Codespaces secrets and never written to profiles or repository files.

Read-only Railway inspection confirms Discord credentials exist in production,
but Google credentials and the login-specific sender variable are absent there.
No hosted variables were changed. Google consent and Discord test callback
registration remain provider-controlled acceptance dependencies. No production
build, deployment, or existing database migration is authorized by this slice.
Help Center member instructions are unchanged; this slice changes preview
operation only. Verification results follow below.

Verification: all four request-scope tests passed with a 60-second fixture
timeout (two initial legacy fixtures exceeded the default five seconds). Targeted
ESLint and affected-root TypeScript passed with zero diagnostics; all six launcher
safety tests passed. A broader TypeScript attempt exceeded the 2-GiB Node heap;
it is not recorded as passed. Both preview scripts pass Node syntax checks.
Browser/readiness results remain pending until the exact-source profile starts.

Functional browser checks confirmed signup rendering and actual email login
through the application API, session cookie and Account login methods. The
forwarded endpoint requires GitHub authentication; automation used a local
transport proxy preserving the configured origin/forwarding headers. Logout
returned its expected 307. Review identified that the preview route allowlist
also needs /signed-out; that destination is now included. Real inbox delivery
was confirmed separately by the owner; real signup/reset link consumption and
OAuth consent remain owner/provider acceptance, not claimed complete.

The development-session preview also needed the normal sign-in redirect when
opening Account without a session. The shell now applies that redirect under
the explicit development-session flag as well as in production. Targeted shell
ESLint and TypeScript passed with zero diagnostics. The previous browser check
correctly rejected the transient post-logout error; final browser acceptance is
rerun on the committed profile revision below.


## Google callback session-cookie correction — 2026-10-15

Owner completed actual Google consent, but returned to sign-in. Safe route/status
inspection showed Google callback -> Account -> sign-in. A real NextResponse
reproduction and new callback-route regression tests demonstrated that mutating
response.cookies after manually appending the session Set-Cookie replaced the
session header. OAuth cleanup now uses the existing header-preserving deletion
helper in Google and Discord callbacks, retaining both the session and expired
transaction/link cookies. No identity, provider or database changes are involved.

Both new callback tests failed before the fix and pass after it, covering the
production shared-domain and preview host-only cases. All 13 focused callback/
Google OAuth tests pass; targeted ESLint and TypeScript pass with zero diagnostics.
Help Center instructions remain accurate; this repairs existing intended login
behavior. No production builds, publication or hosted configuration mutations.
Real post-fix Google callback/session acceptance requires owner retry.


## Workspace landing and optional Discord onboarding — 2026-10-15

Implemented the owner direction and confirmation that missing Discord must not
block app entry, signup or checkout. Default Google/email login destination is
Workspace; explicit return targets and linking remain intact. Workspace has a
no-plan welcome state, and the shared frame accepts authenticated entry only
for that actual route. The proxy overwrites request path context on every route
so a forged Workspace header cannot relax another page. Journal reads remain
behind a real grant or the existing server-side operator allowance.

Added optional Requires Discord plan/add-on presentation setting, rehydration,
public/private catalog disclosure, selected add-on disclosure and combined
package propagation. Existing presentation storage is used without migrations;
legacy documents retain absent fields to preserve their revision hashes.
Effective active plan versions drive a non-blocking reminder for unconnected
members; others receive a dismissible community introduction. Connection goes
through existing Account login methods with recent proof. No Discord API calls
or background polling were added. Light/Navy Dark use shared Alert tokens.
Help Center login and plan guides are updated.

Focused HTTP/proxy/catalog tests passed (14 tests), plus six catalog tests with
added bundle/expiry coverage. Initial targeted ESLint and TypeScript passed.
The required historical dashboard-template check reports four unchanged
failures: the existing shared-frame layout, existing navigation destinations
outside the dashboard group, the pre-existing DashboardShell mention in
feature-help-link.tsx, and unchanged shell navigation constants. These are
verified against HEAD and not repaired as unrelated work. Browser review of
Workspace entry and notices remains the next checkpoint. No builds, production
mutation, publication, provider notifications or existing database migration.

A per-navigation server template now rechecks normal dashboard admission after
Workspace entry, even when Next retains the shared layout. Its regression test
confirms navigation away from Workspace invokes the normal guard and propagates
a denial. Seven proxy/navigation tests pass. Six catalog tests also cover
required add-ons propagating into a bundle, paid activation/cancellation, expiry,
unrelated users and revoked identities. The owner has not yet registered the
Discord preview callback; real Discord linking acceptance remains blocked on
that external setup, while app entry and the reminders are independently testable.

Final targeted lint/TypeScript passed after the navigation template was added.
Actual Chromium confirmed ordinary email sign-in reaches Workspace without a
plan, the community introduction can be dismissed, and a required private test
plan keeps its reminder visible without blocking Workspace. Light/Navy Dark and
390px mobile checks passed with zero browser page errors; the visual review
then found the new welcome title inherited body color in Navy Dark. It now uses
the shared text.primary token, with no page-local dark styling. Test data was
limited to the pre-existing synthetic member and a private synthetic grant;
the owner's Google account, plans and appearance were not changed. No public
QA catalog cards were created.

## Separate Discord connection from server joining — 2026-10-15

The community introduction no longer assumes a plan. It provides the existing
TradersLink server invite. Required-plan reminders expose Connect Discord and
Join Discord server as separate steps; connected users instead receive Join and
Check membership. The notice hides only with an active Discord identity and a
confirmed membership for the configured server, honoring later confirmed
absence. Rechecking uses explicit Discord sign-in; callback refresh now includes
the configured server even without commercial Discord offer rules. No provider
polling, automatic joining or app-entry restriction was added. Help Center updated.
The existing public invite was confirmed valid and matched the configured server.

Eleven focused tests passed across catalog lifecycle, notice behavior and OAuth
cookie regression; targeted TypeScript reported zero diagnostics and targeted
lint passed. React review preserved shared MUI tokens, direct imports and small
primitive props without new fetching effects or dependencies. Production builds
remain prohibited by owner instruction. Live preview review follows the narrow
local checkpoint; real Discord OAuth acceptance still needs callback setup.

Desktop Discord notices now use 50% of the available content width, as requested
by the owner; mobile retains full width. Shared Alert appearance is unchanged.
This display-only adjustment needs preview review, with no new logic tests or build.

Discord notice actions now sit below the paragraph, including Join Discord
server and Later, while retaining the desktop half-width and mobile full-width.

## Account-bound Discord membership recheck — 2026-10-15

Continuation QA found Check membership used ordinary sign-in without explicit
consent. Existing signed-in request detection could redirect before verification;
a different Discord selection could also switch the current app account.
The action now POSTs through the existing CSRF-checked connections endpoint,
issuing a single-use recent-session/provider/user-bound linking intent and
explicit consent. Existing identity-conflict checks reject a different Discord
account. Only the exact Workspace destination can override the existing account
settings return; other return targets keep the previous safe destination.
Expired recent proof provides a sign-in-again action. No provider fetching is
added to ordinary dashboard loads. Help Center updated.

Fifteen focused component, HTTP-route and real disposable-service tests passed,
including same-user recheck, mismatched identity, replay, CSRF and external return
rejection. Targeted ESLint and TypeScript pass. No builds or production mutations.
The owner now confirms the preview Discord callback is registered. Credentials
remain absent from this Codespace snapshot; real Discord consent acceptance
requires securely supplying DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.

The browser recheck passed through the real connections API and intent cookies
with a synthetic identity belonging only to the existing disposable test member.
The external Discord authorization endpoint was intercepted, not accepted live.
Synthetic identity was revoked afterward; the real owner account was untouched.

The outstanding no-plan Workspace heading now resolves its color directly from
the shared live MUI palette in a small client heading. Inline token application
prevents inherited global text styling from overriding the dark appearance. No
page-local dark color, shell reconstruction or trading-data behavior is added.

## Discord first-login Workspace admission — 2026-10-15

Real callback QA with mocked external Discord responses and disposable fully
migrated databases reproduced two failures: no-plan/no-server users returning
to Workspace or Workspace with a query were sent to access-required. The exact
Workspace welcome destination is now admitted after successful authentication;
other protected destinations keep their established admission rules. The two
regressions now pass, and the protected Rules control remains denied. All three
callback tests verify a valid retained Discord session and zero server-membership
rows. Targeted lint and TypeScript passed. No real provider or hosted data was
used. The prior heading browser check also confirmed the shared Light token and
white Navy Dark heading, half-width desktop notice and actions below its copy.

The owner's preview account is intentionally not assigned a production plan;
its no-plan welcome must not be described as removal of the full Workspace.
An entitled disposable-member rendering check is the next local verification.

## Workspace preview boundary and shutdown recovery — 2026-10-15

Source commits and disposable accounts survived the Codespaces shutdown. The
registered login preview was restarted with its exact-source guards. Eighteen
focused tests across the account-bound recheck and Discord callback admission
passed before shutdown; targeted lint/TypeScript passed. The heading, desktop
half-width notice, below-paragraph actions and mobile width passed live browser
checks in both appearances.

The normal Workspace was not removed. The separate preview member has no plan,
so it sees the no-plan welcome. An entitled fresh test member reaches the existing
demo invitation, but the login-only preview blocks the demo-activation endpoint.
A direct official-demo fixture attempt also returned
`demo_august_saved_candles_unavailable`; demo acceptance is not claimed.
An authenticated read-only HTML check with a temporary entitled post-onboarding
synthetic member and empty Journal confirmed Add Trade, Trading Rules and
Calendar are rendered and the no-plan welcome is absent. This is bounded server
rendering evidence, not full interactive Workspace acceptance. Non-login APIs
remain disabled in this preview. The interactive attempt was stopped; temporary
synthetic grants/onboarding state were removed, without modifying the owner
account or copying live data. Evidence is in private
`login-workspace-ssr-check.log` and the browser logs. The successful recheck browser
run intercepted the external Discord boundary, rather than claiming live consent.

Next external requirement: securely supply the existing Discord application's
DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to this Codespace; the owner has
confirmed its preview callback is registered. Real Discord connection/joining,
email verification/reset acceptance and broader app acceptance remain open. No
builds, production changes, publication or existing-data migrations were run.

## Codespaces forwarded-origin rejection — 2026-10-15

After the owner configured Discord and signed in through Google, Connect Discord
failed at POST /api/auth/connections with the generic invalid/expired message,
before Discord authorization. Earlier loopback HTTP tests supplied the canonical
Origin manually and missed the forwarding boundary. Using GitHub's documented
X-Github-Token mechanism to access this private forwarded URL reproduced the
same HTTP400 on a synthetic email sign-in through the actual proxy.

The functional preview server now restores only the registered Codespaces
public origin when forwarding has changed it to this exact port's loopback
origin, browser Sec-Fetch-Site is same-origin, the destination matches the
registered host and the referrer matches that host or its forwarding target.
The shared application Origin/CSRF checks remain strict. The helper runs only
for auth POSTs in the disposable functional preview, never production. Bounded
boolean diagnostics contain no cookies, credentials, bodies or raw headers.
Fourteen focused forwarding/HTTP tests, targeted lint, CJS syntax checks and
TypeScript passed. Actual forwarded pre/post verification is retained in the
private run evidence and the Coordinator recovery handoff. Real Discord consent
and callback acceptance still need the owner to complete the provider flow.
No build, deployment, hosted configuration mutation or existing-data migration.

## Discord connection callback timestamp correction — 2026-10-15

Owner completed Discord consent, but the callback reported
TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED. The account-link branch passed
Discord's raw joined_at into storage, unlike ordinary Discord sign-in, which
normalizes it to canonical UTC. Both now use the existing timestamp normalizer.
Two real callback regression cases use provider microseconds and UTC offsets,
with only external Discord responses mocked; they verify the existing Google
user survives, both methods are active, membership is saved canonically, and
the new session cookie survives OAuth-cookie cleanup. The three prior no-plan
callback cases also pass. Targeted lint, CJS syntax and TypeScript pass.

The functional preview now admits /sign-in-help. Failed connections returning
to /account/login go back to Login methods to create a fresh account-bound
intent, rather than retrying as an ordinary Discord sign-in. Help Center login
guidance was reviewed; the existing connect-from-Login-methods instructions
remain correct. No new login behavior or guide change is required.

The older sign-in service tests initially exceeded their default five-second
timeout while initializing the complete disposable schema; a focused rerun
uses a thirty-second allowance and passes both tests (seven focused tests
pass overall). Live provider consent/callback acceptance
remains the owner's next check. No build, deployment, production mutation or
existing-data migration.

## Discord server explanation after connecting — 2026-10-15

Owner confirmed real Discord authorization and connection now succeed on the
existing Google account. Existing server members previously lost the community
notice entirely after connecting, and Login methods had no server explanation.
Login methods now always offers server information. Verified members see a
connection/membership confirmation and Open Discord server; other users see
Join Discord server and the distinction between connecting and joining.
Workspace-bound linking returns with connected=discord so confirmed members
see the same confirmation after connection, without adding a notice on ordinary
Workspace visits. Actual membership is still read server-side; the query flag
only requests informational display. Required setup reminders remain until
connection and membership are confirmed. Desktop half width, mobile full width
and below-paragraph actions retain shared appearance tokens.

The Help Center login guide was updated. Focused component/callback tests cover
existing membership, ordinary-visit suppression, both callback destinations,
account continuity and unjoined join/recheck behavior. No builds, publication,
production changes or existing-data migrations. Preview/browser verification
is recorded in the Coordinator handoff.

## Final email handler checkpoint and next restriction audit — 2026-10-15

Owner confirmed the Discord server notice. A complete email handler recheck
found one stale assertion expecting /plans instead of the approved /workspace
landing. Corrected the expectation; the full handler verification/reset/session
flow passes against disposable storage with external delivery blocked. Real
mailbox verification/reset remains open. Acceptance records now distinguish
owner-confirmed Google/Discord from this synthetic email proof. The first
Trade Analyzer restriction entrypoint audit is recorded separately; no gates
were activated or hosted data changed. No builds.

## Email labels and eight-character passwords — 2026-10-15

Owner reported labels overlapping typed email-account values and requested an
eight-character minimum. All login/signup/link/reset field labels now remain
floated, including the account change-email field, so autofill and typed text
cannot share the label position. Password creation/reset validation now accepts
eight Unicode characters and rejects seven, while preserving the existing
byte bound and Argon2id parameters. Login helper text and Help Center guidance
match. Twelve focused password, email-handler and component tests pass,
including exact-eight-character signup/reset and initially floated labels.
Targeted lint and TypeScript pass. No build, deployment or existing-data
migration. Registered preview recovery/visual checks are in the Coordinator
handoff; real mailbox verification/reset acceptance remains pending.

## Empty authentication response recovery — 2026-10-15

Owner reported an empty-JSON parsing error on Add email and password. Preview
status again showed stopped; no successful application POST appeared for the
failed attempt. Removed the unwanted Spaces are welcome helper wording.
Authentication UI consumers now use one bounded-shape JSON reader that converts
empty/non-JSON transport replies into a plain retry message. The form retains
entered values on failure; it never treats a missing reply as success.

Sixteen focused tests pass, including an empty-response UI regression and a
full real-handler Google-account email-link/verification/sign-in test with an
eight-character password, one retained user and both login methods. External
mail delivery is intercepted in the test. Targeted lint and TypeScript pass.
The preview server now catches rejected request-handler promises with generic
503 JSON and logs stop signals/exit codes without OAuth proofs. Its private
monitor records launcher refusal reasons and waits only for temporary low-memory
or active-build conditions, without bypassing any launcher check. Source,
ownership and migration refusals still stop it. No builds or hosted mutations.
Preview process-loss root cause remains unproven; owner mailbox acceptance is
still required and no email-delivery success is claimed for the failed click.

## Functional preview compiler alignment — 2026-10-15

Repeated public502 responses traced to external SIGTERM of the test server.
Attached execution and reduced heap/native-pool settings alone did not maintain
availability; one1024MiB trial additionally confirmed V8 out-of-memory and was
rejected. The custom login preview forced Webpack, unlike the normal Platform
local server, which defaults to Turbopack. Align the preview with that existing
runner, retaining the same real authentication/database/session logic, isolated
output, origin restoration, route limits and exact-source launcher checks.
This changes development compilation only; no production build is run.
Runtime acceptance is recorded in the Coordinator recovery handoff.

## No five-minute account-change gate and branded email — 2026-10-15

Owner confirmed email submission/delivery worked and requested removal of the
ordinary recent-login gate. The service now requires only an active session for
login-method changes, email addition/verification/change and account-bound
provider intents; no five-minute age cutoff remains. Removed the permanent
Sign in again control. Tests permit changes from an hour/day-old session and
still reject absent/expired sessions, conflicts and last-method removal.

Signup/add-email/resend responses carry the submitted address and the requested
confirmation sentence; React renders the address as strong text. Password-reset
requests use a reset-specific prompt. Email delivery now includes branded HTML
and text: navy Confirm Email Address button, identical fallback URL, appropriate
ignore notice and TradersLink signature. A context field in the existing
encrypted payload distinguishes signup from adding email to an existing account.
Reset/change/security notifications adapt the same layout. No schema change.

Twenty-two focused service/route/mail/UI tests pass; the final mail-only recheck
also passes all five cases. Targeted lint and TypeScript pass. Offline browser
checks pass signup/add-email HTML at desktop640 and mobile390, including equal
button/fallback targets and no horizontal overflow. No actual test email sent,
build, deployment, existing-data migration or owner account mutation. New email
rendering/delivery through the owner's mailbox remains an owner review step.

## Pending confirmation retry — 2026-10-15

Read-only diagnosis of the known disposable test account confirmed an unverified,
account-bound credential and only the previous sent outbox entry. Repeated Add
email returned the confirmation sentence without queuing mail. Signup/Add email
now renew pending verification after checking the original password, preserving
account/session binding and invalidating the older link. The route regression
checks a second queued message, old-link rejection and successful latest-link
verification. The existing UI mismatch check shows Passwords do not match and
prevents submission. Help guidance updated. No real email sent by the agent.

Validation: 11 focused route/UI tests pass; targeted ESLint and TypeScript pass.
No builds or deployment run.

## Browser sign-out redirect correction — 2026-10-15

Owner confirmed resend from the login form delivers email, but browser sign-out
reached the preview unsupported-method guard. Logout handlers used default307,
preserving POST when redirecting to GET-only signed-out/security pages. All
three logout handlers now use303, including recovery redirects; revocation and
cookie clearing remain unchanged. Relevant route expectations updated. Help
review: existing sign-out guidance remains correct; no guide change required.

Two focused route tests pass, including revocation/cookie behavior; targeted
lint and TypeScript pass. No production builds or deployment.

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

Validation: 17 focused service/route/UI tests pass; all four request-scope tests
pass with a30-second timeout after two initial five-second timeouts. Final
email-route recheck passes both tests, including the new unverified-login
message. Targeted lint and TypeScript pass. No owner verification token consumed
or actual email sent by the agent.
