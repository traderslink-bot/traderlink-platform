# Membership final staging checks and production preservation preflight

Owner direction: finish the specific remaining Membership/Login/Stripe staging
checks, create disposable fixtures, accumulate fixes in one batch, and perform a
read-only production preflight. No deploy, restart, migration, publication or
production mutation. Do not repeat completed unrelated application QA.

## Controlling remaining inventory

| Target | Acceptance | Status |
| --- | --- | --- |
| Public base + two add-ons | Actual browser selection, correct combined price, genuine Stripe TEST checkout, provider fulfillment and exact combined access without duplicate grants | Downstream PASS with disclosed prepared-snapshot bridge; first-time live creation FAIL, correction held |
| Trial-duration correction | Delayed completed Stripe TEST checkout, correct duration from actual completion and actual webhook entitlement | PASS, full 259200 seconds after 914-second checkout delay |
| Discord link/unlink/reconnect | Successful normal OAuth cycle, same app user, other methods/access retained, no guild/role mutation | Coordinator-held during Coaching; no shared identity mutation |
| Email verification matrix | Resend invalidates older proof, expired proof rejected, duplicate/foreign ownership rejected, correct proof succeeds and stable user retained | PASS in browser/service fixture; prior real delivery proof retained |
| Held stale disconnect notice correction | Keep exact local one-line correction; browser retest requires later approved staging release | Local only, do not deploy |
| Production configuration | Read-only live Stripe family/mappings, webhook event/URL/signature setup, OAuth/email origins, source/schema/recovery prerequisites; never print secrets | Read-only COMPLETE; Stripe/Google/email not configured for production |
| Production access/catalog preservation | Baseline existing user/access/policy/plan/offer state; review migration/default behavior; no official plan or QA catalog publication, no access loss | COMPLETE policy-model comparison; default-off correction held, hosted acceptance pending |
| Cleanup | Cancel/expire only new TEST financial fixtures; retire only new QA catalog; revoke only new synthetic sessions/access; preserve preexisting rows and health | PASS; lane released to Coordinator |

Fixture creation is not a pass. State exact browser/provider/service boundaries.
No Vitest, local build, dependency installation or local preview. Financial final
actions subject to browser handoff are grouped only after all pages are prepared.

## Future production invariants

- Everyone retains their current access; release must not silently turn on plan
  enforcement or require enrollment to retain existing features.
- Owner has not configured official plans. Do not copy staging QA plans/offers,
  trials, entitlements or provider objects into production. Do not invent or
  activate an official catalog as part of release.
- Baseline read-only production state before any future approved release, then
  compare after release. Any preservation conflict must be resolved before release.
- Production remains read-only throughout this task.

## Plans design decision — deferred implementation

Full Plans-page design is paused. Owner wants the current design reused without
its top navigation and footer as a section on each Feature static landing page.
The section is visible only when plans are activated. Record this as the future
controlling requirement; do not modify a sibling static-site project in this
Membership QA pass. Determine the authoritative activation signal and review
the section with the owner before implementing that separate UI slice.

## Batch changes

Existing one-condition stale disconnect-notice fix remains held. Further proven
defects, if found, will be documented with exact scope before correction and kept
in the same batch. No deployment authorized.

## Execution checkpoint — exact staging and newly found failure

Coordinator released the fixture window after Coaching QA checkpoint on source
`3b14e32afef5ad1b47326c2522035eaaad338bfb`, tree
`5639a677e1097a548772bfc3279889460c854d64`, deployment
`705a5794-dee1-4f1e-b65c-9a4c89bd3d18`, instance
`d3db7938-9e58-4f7a-bd7a-c9b1581cf7d5`, image
`sha256:1e7d4347c36897c3cb91d55819914cef07acaf3d478159ff65a4c80009394f0e`.
Schema168/HTTP200/ready, quick_check ok/FK0. No release by this worker.

New isolated fixture root:
`/data/membership-qa-checkpoints/20261018-final-acceptance`.
Five synthetic users, four source plans and one derived combined plan; no
existing user/provider/Coaching configuration intentionally changed. One
read-only checkpoint backup retained for preservation comparison. All helper
source is ignored data, not release source. A fixture timestamp setup initially
violated the expires-after-created invariant; resumed the same existing fixture
with internally consistent past timestamps, without duplicating users/plans.

### Confirmed live failure and held corrections

Browser selected paid base USD1 + two add-ons USD2/USD3, total USD6/month.
Actual Choose this plan returned a generic sign-in error. Exact deployed
reservation diagnosed `Stripe: connection is not ready for live checkout.`
The staging-only exception permits private test offers but rejected publication
of the public buyer-bound bundle. The action's `Stripe ` prefix whitelist also
missed `Stripe:` and misclassified the error as sign-in failure.

Held source batch, exact diff from3b14e32a:

1. `src/modules/platform/contracts/membership-plan-editor.ts`: retain exact
   server-provided staging/test configuration gate, additionally allow
   public/website derived documents with more than one bundle component.
   Ordinary public test plans remain rejected; production gate remains false.
2. `app/plans/checkout-actions.ts`: accept both Stripe-space and Stripe-colon
   prefixes for the existing safe billing-error presentation.
3. Existing `app/(member)/account/login/connected-methods.tsx` stale-notice guard.

No source deployed. First-time live public bundle creation remains FAIL until a
later owner-approved batch release/retest; downstream fixture acceptance must
never be called proof of this held correction.

### Explicit downstream fixture bridge

The exact compiled unchanged reservation function was exposed only in a short
SSH diagnostic Node process. For the fixed synthetic buyer and three QA offers,
a DB-object Proxy mapped only standalone provider-definition SELECT `.all()`
return rows from Stripe test to ready in process memory. It did not alter
provider rows, process environment, hosted image, route, running app worker or
production. Normal reservation validation and buyer-bound fingerprinting wrote
one combined snapshot and reserved claim. Coordinator's technical hold arrived
after execution; disclosed timing immediately and held browser retry/payment
until its subsequent exact-scope clearance.

Buyer `f0f82778-71d7-4c86-be41-bd0fba96cfa7`, claim
`cff49d25-4373-4371-8059-5e48e1ebf186`, combined plan
`d4a9070e-d937-4781-8b6e-db8e1c02253f`, version
`415c3b58-1c9f-4591-a534-12037b260fa0`, offer
`3de37750-d6cb-41d8-99b9-6888859ad1ff`, fingerprint
`bundle_5262511c0544f100a2cc28aab1b71acb899207b468606bd526dab2f14604ff7a`.
Read-only audit independently recomputed buyer/version/offer fingerprint and
confirmed buyer=created_by. Full provider-definition rows before checkpoint and
after bridge have identical SHA256
`34b90df829c2aa52e1829a295adf1931a55239ca1872de033440ecee0acb1c2c`.
Existing Membership plans/versions/offers/entitlements/policies/operator rows
preserved. Whole-database comparison also observes unrelated live auth/Discord
and Coaching timestamp changes; do not attribute those concurrent writes to
this worker or claim byte-identical whole-database state.

After clearance and immediate revalidation, the genuine hosted public action
found the same prepared fingerprint and opened Stripe Sandbox USD6/month.
Both owner final-click payments subsequently completed and were independently
verified paid/fulfilled. No root final payment click performed. The bridge proves a prepared-data downstream path,
not first-time public bundle publication or the undeployed source fix.

### Additional email matrix completed in browser

PASS: older proof invalidated by resend rejected; separate unused expired proof
rejected; newest resent proof succeeded; unverified credential remained unverified
after invalid proofs. Actual deployed service rejected a duplicate foreign-owned
credential and a change to another verified fixture's address. Browser missing
session and wrong-account change attempts showed dedicated sign-in guidance and
did not consume the link; the same link then succeeded for its correct account.
Same synthetic user retained, exact new email verified, session rotated. No real
email delivery; queueMail captured. Prior real inbox delivery proof retained.

### Historical preflight preparation (superseded by completed checkpoint below)

Prepared a target-guarded SQLite-readonly probe for configuration families,
access/catalog/policy counts/digests and Stripe GET webhook configuration.
Awaiting Coordinator's freshly verified production IDs/context; no production
probe executed yet. Source inspection identifies a preservation risk:
evaluateMembershipFeature permits access when its policy table is absent, but
defaults many products to enforced when the table exists without overrides.
Must compare effective decisions for current users before production release;
preserving grant rows alone is insufficient. This is a preflight risk, not yet
an observed production access failure. Do not alter production policy or publish
official/QA plans to address it during this read-only task.

## Final checkpoint — completed, no deployment

Actual owner-completed Stripe checkouts are complete/paid and their claims
fulfilled. USD6/month base plus two add-ons produced exactly one combined grant
with allowance70 (10+20+40); browser billing and Stripe Sandbox portal agree.
The delayed USD1 entry / USD2 monthly trial received 259200 seconds from actual
provider trial start, despite a 914-second checkout delay. The trial-only add-on
eligibility notice is expected: existing-subscription add-ons require an active
monthly subscription. The combined purchase PASS uses the disclosed bridge;
first-time public TEST bundle publication remains a live failure until release.

Four-file source batch is held locally, uncommitted and undeployed:

- `app/(member)/account/login/connected-methods.tsx`: hide obsolete disconnect
  feedback after reconnect. SHA256 396234415A809311480EC3C727F78567E5A514E260DC81A9797F5789F02AD5B5.
- `app/plans/checkout-actions.ts`: recognize Stripe colon-prefixed billing errors
  instead of presenting them as sign-in failures. SHA256 059F03AD556E3E68AB50871A678CAB4CB89A8AB9EABAA3618DD3325298720755.
- `src/modules/platform/contracts/membership-plan-editor.ts`: permit generated
  public multi-offer website TEST bundles only under the existing staging/test
  permission; retain production restriction. SHA256 F9F70AD86C75190339804BC9EC368E5C9A02170AB9A488D13000163284685B4B.
- `src/modules/platform/contracts/membership-product-features.ts`: default plan
  enforcement off until owner activation; retain explicit saved policies and
  other authorization guards. SHA256 B59A83F39EFFCCBE3B5ED1B09B129BFC6C80ECB292A90669D6809C1583E9F4EF.

### Completed production read-only preflight

Verified source2c4621771a0d9deeaa607be0aa9654af189fa6cc,
deployment5ad3377c-3dad-405c-be8d-ca313263d3a5,
image sha256:7a4f121a7ee9fc4188e3a0da405dcba5e06b76a8f1716ed31b5327b3a1ec884e,
sole instance0179714d-ad71-4e0a-a40a-0a8bc4cfc71a,
volume5784d008-9785-407c-b3b0-01c26ecec025. Database opened readonly/query_only.
94 active users, one owner-admin, zero active plan grants/subscriptions/policies,
and zero active sellable offers. Three legacy stored plan rows are historical
catalog, not an owner-configured official launch; do not delete or activate them.
Stripe key/webhook secret, Google and email delivery configuration are absent.
Their production activation requires separate approved setup. No production
writes, restarts, deployments, migrations or financial mutations occurred.

Current production defaults off; uncorrected staging candidate defaults enforced
for38 keys. Pure SQL policy-model comparison covered94 users x38 keys =3572
access decisions. Current and corrected allow94/deny0 per key; uncorrected allows
owner1/denies93. Corrected matches every current decision. In-memory explicit
policy/quota overlays retained enforcement behavior. Protected table hashes
unchanged. Decision digest5ddcb57dc06a8fafa6bb040dbc392a527f8231813a9fa31008ae0d2c11615035.
Coordinator accepted this source/policy-model evidence; corrected hosted/browser
acceptance still requires an approved staging release. Other workspace and
Discord guards remain additional requirements. Sanitized evidence is under the
ignored QA directory in production-preservation-comparison.json.

### Cleanup and final release gates

Independent final-cleanup-proof.json verifies five synthetic users disabled;
zero active synthetic sessions, identities, grants, unused links or offers;
five plans retired; two subscriptions cancelled; both checkouts non-open.
Three automatic Stripe TEST products/prices cannot be deactivated by Stripe API
and remain inert provider history, with no active billing. Existing Membership,
provider and operator rows preserve checkpoint hashes. SQLite quick_check ok,
foreign-key errors0, staging health HTTP200/schema168. Browser replay of both
payment buyer sessions was denied. Original IAB login restored; synthetic Chrome
cookie removed. Encrypted handoff deleted and credential variables cleared.
Coordinator notified that the fixture lane is released for queued Coaching work.

No Vitest, local build, commit, push or deployment. Four fixes need one approved
staging deployment and focused hosted/browser retest. Discord full unlink/relink
remains Coordinator-held during Coaching. Production Stripe/Google/email setup
is not ready, and default-off preservation must receive staged acceptance before
production release. Future Feature-page Plans sections remain deferred design,
conditional on owner activation; no static-site edits or plan activation here.

## Four-fix deployment authorized — browser retest in progress

Owner explicitly authorized one staging deployment of the exact four-file batch
and browser retest. Coordinator confirmed Coaching owns the current lane and
Membership is queued immediately after its bounded acceptance. Do not create
fixtures until Coordinator explicitly releases the post-deployment fixture
window. Production excluded. Prepared ignored two-user/four-plan retest helper;
no setup executed while waiting. Normal fresh public bundle checkout must pass
without the earlier process-local bridge. Preserve original browser cookies and
restore them after exact fixture cleanup.
