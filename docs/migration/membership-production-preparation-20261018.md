# Membership production release and provider setup — owner review

Status: PREPARATION ONLY, 2026-10-18. No production change authorized.
Owner requires everyone to retain current access, plans to remain inactive,
and a complete concrete change list before deployment approval.

## Ownership and candidate

Coordinator owns integration and release. Community Stats currently holds the
staging/Railway lane for its 168-to-169 release. Coordinator will refresh
production metadata after that lane closes. Membership staging acceptance at
7598c0912997ee95f9939e9ba7690b6310ac9a51 is evidence, NOT an approved production
candidate. Historical membership-production-release-progress.md authorization,
parents and migration counts are superseded by this owner-review requirement.

Required before asking approval: current configured production branch and remote
parent; exact reconciled candidate SHA/tree; full changed-file and migration
manifest; identification of any unrelated integrated features; current live
production deployment/image/schema/health/volume; immutable rollback image and
restore-verified database checkpoint procedure. No copying the mixed worktree
or promoting the entire staging image by assumption.

## Intended user-visible scope

- Membership administration and plan/billing flows, including combined base and
  add-ons, prorated monthly additions, trials, lifecycle handling and refunds
  limited to the refunded purchase while preserving independent access.
- Google/email sign-in and connected login-method details, add-email without a
  name requirement, verification/change/reset feedback and conflict handling.
- Discord link/conflict/disconnect ordering corrections, retaining other methods
  and last-method protection. No identity moves or automatic account merges.
- Approved authenticated account/settings access and notification/preferences
  corrections, without granting additional broker/product/admin permissions.
- Default-off membership enforcement: nobody needs to buy a plan to retain
  existing access. Existing independent workspace/admin/Discord guards remain.

This is the intended feature inventory, not the final source diff. Coordinator's
reconciled full manifest must substantiate it and disclose all additional scope.
No Feature landing-page Plans section, redesign, catalog publication or new
pricing is included.

## Proposed production configuration — verify current presence first

| Setting | Intended value/action after approval | Effect |
| --- | --- | --- |
| TRADERLINK_PLATFORM_PUBLIC_ORIGIN | https://app.traderslink.pro | Canonical login/email redirects |
| TRADERLINK_MEMBERSHIP_APP_ORIGIN | https://app.traderslink.pro | Billing return URLs |
| GOOGLE_CLIENT_ID | Production OAuth client identifier, secure provisioning | Enables Google sign-in with matching secret |
| GOOGLE_CLIENT_SECRET | Matching production secret, never displayed or committed | OAuth token exchange |
| RESEND_API_KEY | Production-capable key scoped appropriately to verified sending domain | Login mail delivery |
| TRADERLINK_LOGIN_EMAIL_FROM | Exact existing approved verified sender; Coordinator must identify it before approval | Visible From address |
| STRIPE_SECRET_KEY | Intended production Stripe account LIVE secret/restricted key with required operations | Enables live provider API; no sale without published offers |
| STRIPE_MEMBERSHIP_WEBHOOK_SECRET | Secret for exact production endpoint below | Verifies provider events |

Do not overwrite already-correct settings or copy sandbox secrets/client IDs by
assumption. Presence is not provider validity. Confirm account/project/domain,
credential family, sender verification, API permissions and tested Stripe API
version. Current helper does not explicitly pin Stripe-Version; record the
account/endpoint version and reconcile with sandbox proof before approval.
Verify existing login signing/encryption/rate-limit prerequisites without rotating
working credentials. No new Whop configuration or Discord scopes/server/roles.

## Proposed provider dashboard changes — no action yet

Google: register/verify production web-client callback
https://app.traderslink.pro/api/auth/google/callback. Review consent-screen
production audience/domain readiness and any origin requirement for this client.
Keep existing staging registrations and working production Discord callback.
If already configured correctly, make no dashboard change.

Resend: confirm approved sender domain is verified and permitted for intended
recipients. No DNS change is included until exact required records and existing
records have been reviewed. Reuse a verified production sender where possible.

Stripe LIVE: create or reconcile one endpoint
https://app.traderslink.pro/api/webhooks/membership-stripe. Record exact account,
endpoint ID, API version and event subscriptions. Proposed source-derived event
inventory (validate against reconciled candidate before approval):

- checkout.session.completed
- checkout.session.expired
- checkout.session.async_payment_succeeded
- checkout.session.async_payment_failed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed
- charge.refunded
- refund.created
- refund.updated
- refund.failed

Do not subscribe all unrelated events. Do not replace an existing endpoint without
checking its consumers. No products, prices, plans, payment links, subscriptions,
charges, refunds or live payment tests are created by this preparation.
Customer portal configuration must be reviewed if used; do not enable plan
switching/cancellation options or products beyond the agreed behavior silently.

## Preservation and release gates

1. Fresh readonly baseline: all users, enabled states, identities, memberships,
   owner/admin grants, independent entitlements, policies and catalog publication
   flags. The earlier 94-user/38-key comparison is historical, not today's count.
2. Compare effective access for every current user across the complete controlled
   capability inventory, not only entitlement row counts. Retain enforcement off
   where currently off; preserve explicit existing policies and all other guards.
3. Keep all official/legacy plans and offers in their current inactive/non-sellable
   state. No staging QA catalog/data, test identities or provider objects imported.
4. Audit migrations for defaults/seeds/backfills that could enroll, revoke, enforce
   or publish. Rehearse exact current production prefix and target on a disposable
   copy; verify current features are retained. No live migration before approval.
5. Record single-writer cutover, checkpoint restore proof, rollback application
   and schema compatibility, health criteria, and precise abort/restore triggers.
6. Show owner exact SHA/file/migration/config/provider manifest plus any downtime
   before requesting approval. Approval must distinguish code release from actual
   provider activation; neither is currently authorized.
7. After approval only: verify live source/image/health/schema and access/catalog
   preservation; grouped real-domain Google/email login and billing endpoint
   smoke checks. Do not activate plans or take live payment to perform smoke QA.

## Current proof / outstanding preparation

Staging Membership acceptance and exact rollback are recorded in
[membership-final-staging-preflight-20261018.md](membership-final-staging-preflight-20261018.md).
Discord real lifecycle passed; source checkpoint 7598c091. Existing payment,
refund-preservation, email/password and multi-addon staging results retained.
Exact colon-prefixed Stripe error has source proof and ordinary failure browser
coverage; no global provider fault injected.

Outstanding: Coordinator fresh production baseline and reconciled source manifest;
exact sender, provider account/client/endpoint/API-version readiness; final target
migration delta and recovery evidence. These are release preparation gates, not
newly observed feature defects. Do not present this document as deployment-ready
or ask for approval until the missing concrete details are filled in.

## Fresh preparation evidence — 2026-10-18

Remote main and live production source both remain
2c4621771a0d9deeaa607be0aa9654af189fa6cc. Read-only Railway metadata:
environment 666e1624-a1eb-4e94-8e16-5ed73ad4b4af; app service
fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb; SUCCESS deployment
5ad3377c-3dad-405c-be8d-ca313263d3a5; sole RUNNING instance
0179714d-ad71-4e0a-a40a-0a8bc4cfc71a; image
sha256:7a4f121a7ee9fc4188e3a0da405dcba5e06b76a8f1716ed31b5327b3a1ec884e.
Public health: ready, migrationCount 140, sqlite_single_node.

Direct comparison with accepted Membership staging checkpoint 7598c091 changes
934 files, 50966 insertions and 1607 deletions, including Coaching, Communities,
analytics and demo assets. Full exact comparison is
[membership-production-staging-comparison-20261018.txt](membership-production-staging-comparison-20261018.txt).
This is an AUDIT of a rejected broad promotion, not the approved release allowlist.
Thirteen added migration source files are not the same as a reconciled ledger
delta; do not assume migrating production from 140 to staging 168/169 is valid.

Owner reports verified Stripe live account access and authorizes read-only
readiness inspection. No Stripe dashboard is visible in connected browser
inventory yet; owner asked whether Coordinator has live credentials or can open
its dashboard. This does not mean the Stripe account is unverified or blocked.
It means live account/API/endpoint readiness has not yet been independently
confirmed. No credential values requested in chat.

### Live Stripe dashboard readiness — verified read-only

Owner provided the sandbox dashboard in connected Chrome10. Its account is
acct_1UREDiBmtNckE9JX. Normal Exit sandbox navigation opened the distinct LIVE
TradersLink account acct_1UREDYPfKlzyEG3S; do not configure production with the
sandbox account's credentials or endpoint secret.

- LIVE account status: active past-due photo-ID task for the account owner;
  Payments is listed as Paused soon, with pause at CA$989 volume. Owner must
  resolve identity verification with Stripe before paid-plan launch. No identity
  document was accessed or submitted by the agent.
- LIVE Workbench webhooks: empty Add destination state; production Membership
  event destination is not configured. No endpoint was created or changed.
- LIVE default API version: 2026-09-30.endive, shown as Default/Latest in
  Workbench. Validate candidate and webhook payload compatibility against this
  account version; do not silently upgrade/downgrade settings.
- No secret key retrieved, revealed, created or copied. Presence of a masked
  publishable key does not establish a server-side live credential handoff.
- No charges, products, subscriptions, portal settings or provider data changed.

These block declaring live paid-plan activation ready, not a reviewed code-only
release with catalog inactive. Keep them distinct in the approval request.

The exact-instance production readonly SSH probe stalled before returning any
results and was interrupted by the agent. Fresh provider-presence/table digests
are therefore still pending Coordinator confirmation. No query output is claimed
and no production data was changed. Public metadata/health refresh succeeded.

Broad-comparison file categories: 577 application-source files, 44 configuration/
tooling files, 82 documentation files, 161 public assets and 70 test files.
The 934-file comparison is therefore not merely documentation/assets and cannot
be substituted for a Membership-only approved production manifest.

### Fresh production configuration presence — successful metadata check

Exact production project/environment/service were specified to Railway variable
list; raw response was held only in shell memory and never printed or saved.
Presence-only result: RESEND_API_KEY and
TRADERLINK_PLATFORM_ADMIN_RATE_LIMIT_SECRET already exist. Reuse and validate
these; no automatic replacement or rotation. TRADERLINK_LOGIN_EMAIL_FROM,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, STRIPE_SECRET_KEY and
STRIPE_MEMBERSHIP_WEBHOOK_SECRET are absent. Explicit
TRADERLINK_PLATFORM_PUBLIC_ORIGIN and TRADERLINK_MEMBERSHIP_APP_ORIGIN are absent;
existing Discord-origin fallback and billing production default may already be
correct, so absence alone is not a redirect defect. Proposed explicit production
origins are a reviewed configuration change, not an observed functional failure.
This supersedes historical blanket claims that all email credentials are absent.
No production variable was changed; server-side LIVE Stripe handoff is not done.

First-parent staging history confirms Membership and Coaching were integrated in
one lineage beginning with 57968e484 (combined review preparation), followed by
Membership-specific and Coaching/Communities-specific corrections. Selecting
only the last Discord fix or promoting the whole checkpoint would both be
incorrect: the production candidate needs the complete Membership dependency
slice and preservation of existing production source, excluding unrelated
staging-only functionality unless separately reviewed and approved.

## Owner-approved live webhook creation — complete

Owner's explicit approval after the webhook-only confirmation authorizes this
single provider mutation, not a production code/configuration release.

- LIVE account: acct_1UREDYPfKlzyEG3S.
- Endpoint: we_1US0bVPfKlzyEG3SuqoIfeb8, Active.
- Name: TradersLink Membership — Production.
- URL: https://app.traderslink.pro/api/webhooks/membership-stripe.
- Scope: Your account. Payload: Snapshot. API: 2026-09-30.endive.
- Expanded saved 13-event allowlist exactly matches the inventory above.
- Event deliveries total0/failed0. Creation verified, delivery NOT yet accepted.
- Signing secret remained masked; never revealed/retrieved/copied/rotated.
- No Railway variables, restart, migration, source deployment, plans, identity
  connections, entitlements or transactions changed. Current access preserved.
- Coordinator informed. Secure server-secret provisioning and release remain
  separately approval-gated. No live test charge or event-send was performed.
- Private ignored screenshot: data/membership-staging-qa-20261017/live-stripe-webhook-created.png.

## Coordinator-confirmed final production baseline

Configured source repo traderslink-bot/traderlink-platform, branch main,
rootDirectory null; live source/deployment/image/instance matches fresh metadata
above. Volume instance 70a1d45f-ec71-4526-9778-2a6fd6fed150; volume
5784d008-9785-407c-b3b0-01c26ecec025, /data READY, reported use
8088.256512 MB of 50000 MB. Dockerfile builder; health /api/platform/health;
overlap0/draining30. Public ready/schema140.

Current image is a schema140 rollback baseline ONLY: compatibility after proposed
Membership migrations is not proven. No current production checkpoint path has
been verified. The exact production-child candidate/migration reconciliation,
rehearsal and database recovery evidence remain required before asking for
release approval. Coordinator confirms Stats staging lane closed and healthy;
no production action authorized beyond the webhook creation recorded above.

## Owner-approved webhook secret provisioning — in progress

Owner explicitly authorizes secure secret installation and delivery verification,
with plans inactive/access preserved and NO APP DEPLOYMENT. Coordinator owns the
Railway action and has held handoff until current Stats lane closes. No secret
has been revealed/transferred yet. Owner's Chrome10 also has Railway access.

Approved secure transport: capture visible secret only in browser-tool process
memory; immediately DPAPI CurrentUser encrypt into ignored QA data; re-mask
before any AX/screenshot; no plaintext chat/log/argv/clipboard/file. Coordinator
receives only encrypted path/checksum, decrypts in memory and sends via stdin to
Railway variable set STRIPE_MEMBERSHIP_WEBHOOK_SECRET --skip-deploys, with command
output suppressed. Verify presence/equality in memory only, not by printing value.

### Read-only existing-handler compatibility and proof boundary

Exact current production source 2c462177 contains the webhook route and original
Membership provider receipt table. Route503 until process.env secret is present;
invalid signatures400. HMAC freshness window300seconds. For charge.refunded,
original hydrate function returns null without a Stripe API request; original
apply sees empty subscription metadata, result ignored and inserts one receipt.
No claim/grant/plan/user path is entered. Therefore a native Stripe sample with no
Membership claim can establish transport/signature/receipt acceptance only.
It cannot prove the newer refund-access feature against this older production
source. Do not generate a real charge/refund to produce test events.

Before any separately approved activation/test: Coordinator must verify running
compiled handler matches source, fresh protected-table digests and inactive
catalog, exact image/source/schema/volume, absence of other staged config and
single-writer controls. After harmless event: expect only event receipt change;
protected access/catalog rows identical, health/schema/image unchanged. No real
member or payment mutation is authorized.

Railway documents that changed variables must be applied to a deployment before
the running process receives them. Saving with skip-deploys does not activate the
secret in the existing process. Do not assume ordinary restart uses refreshed
variables; verify the exact same-image activation method. Owner approval for
runtime replacement/restart is separate from secret storage. Current no-deploy
instruction remains controlling; no delivery test is to be sent before approved
activation. Sources: https://docs.railway.com/variables and
https://docs.railway.com/deployments/staged-changes.

### Delivery tool inspection — no event sent

Live endpoint dashboard currently has no Send test event control. Overflow only
shows Disable, Roll secret and Delete; Event deliveries has Search/Status/Refresh
and No event deliveries found. No live financial fixture will be made to force
an event. If only a locally HMAC-signed inert request is possible, label it as
endpoint/signature verification, not Stripe-originated delivery proof. That check
also remains held until the secret is active and preservation baseline verified.

### Encrypted signing-secret handoff delivered

New ignored DPAPI CurrentUser file stripe-live-webhook-secret.dpapi is262bytes,
SHA256235f0fe7d8b486800afbb30d67d62eb93bd298db036400dc94eeebeff4cfcfca.
Secret was captured once from authorized visible Stripe UI into process memory,
DPAPI encrypted through stdin (no argv/plaintext file), and variable cleared.
No plaintext chat/log/clipboard/screenshot. The reveal toggle changed after the
secret was shown; safe page reload re-masked it, confirmed on loaded endpoint
page before emitting any unredacted observation. Coordinator received only
absolute encrypted path, size/hash and masking proof. No secret rotated.
Railway installation confirmation remains pending; no runtime activation allowed.

### Production Railway variable storage — COMPLETE

Coordinator verified STRIPE_MEMBERSHIP_WEBHOOK_SECRET was previously absent and
is now stored in exact production project/environment/service using stdin and
--skip-deploys. In-memory comparison confirmed stored value matches the encrypted
handoff. No secret value was printed, committed or kept in a plaintext file.

Pre/post production unchanged: deployment5ad3377c-3dad-405c-be8d-ca313263d3a5,
image sha256:7a4f121a7ee9fc4188e3a0da405dcba5e06b76a8f1716ed31b5327b3a1ec884e,
instance0179714d-ad71-4e0a-a40a-0a8bc4cfc71a. HTTP200 ready,
sqlite_single_node/schema140. No deployment, restart, migration, plan activation
or test transaction. Plans/current access were not changed.

Coordinator removed exact262-byte DPAPI transport and one-use installer after
verification; no encrypted transport retained. Current runtime predates this
variable, so delivery verification is NOT complete. Do not label variable storage
as active handler configuration. Runtime activation requires separate explicit
owner approval and a verified same-source/image activation method. Current owner
instruction remains no app deployment. Native live Stripe test control was not
available; no synthetic request or real payment was sent to manufacture proof.

## Owner approval expanded — production release authorized

Owner corrected the deployment hold and, after the agent explicitly distinguished
secret-only activation from the full Membership/Login/Stripe release, answered
"all". Both activation and full feature release are now authorized within the
original preservation constraints. This supersedes prior no-deploy holds for
this feature only. Coordinator notified and retains production integration/lane
ownership. Narrow production-child reconciliation, complete dependency/source
manifest, migration rehearsal, protected access/catalog comparison and rollback
proof remain mandatory before publishing. Mixed staging promotion is not approved.
Plans remain inactive; no QA catalog transfer, identity movement or real charge.

### Narrow production candidate source assembly

Clean three-way reconciliation preserved current production changes while taking
the dedicated Membership branch and16 Membership correction commits. Temporary
index only; current checkout/index/branch unchanged. One logout/sidebar conflict
was resolved by applying the already-approved logout function to the production
shell, without Coaching/Communities sidebar additions.

Source tree681696aea9ecfe54ce051e77400978a2c3846c57 changes569files,19708insertions,
1002deletions fromproduction2c462177. Complete filename manifest is in the ignored
QA production-candidate-files.txt. No production Dockerfile, Railway settings,
GitHub workflows or Communities source/routes changed. Core login service,
Membership server directory and default-off product contract are byte-identical
to accepted staging checkpoint7598c091. Targeted source import resolution found
zero missing relative/project imports; full diff whitespace check passed.
No Vitest/local build/local server. Hosted checks/rehearsal and production cutover
remain Coordinator-owned gates, not claimed complete.

Four exact additive migrations (existing140prefix retained; target144expected,
subject to exact hosted ledger rehearsal):
-0165_platform_membership_unified_editor/order178/e05c1c35b540c43438faa272399dfd0b73b6cfb94f155fa638d899b43b6db76d
-0166_platform_multi_provider_login/order179/1610b37db7b1dc20dc0a649d57c4d5609a7eda8f8f384ee4bf6a21095a683558
-0167_platform_membership_addon_amendments/order180/b468f6dc957235c4c1f562f58ca6eef06672c2917c30fd183c54610e11c0f5fc
-0172_platform_login_identity_profiles/order185/3d86b83a677e628b1bdc3dc5f56629460166a750a83d3b4c14ad06414aaad004

Migrations create editor/auth/add-on/profile storage, adapt identity-update guard,
carry existing trial lineage forward, and initialize the approved notification
missing-preference default-on marker. Explicit stored opt-outs stay opt-outs;
browser/Discord delivery permissions remain separate. No official plan/offer,
trial enrollment, membership enforcement or paid sale is activated by this plan.
