# Membership add-on entry and mobile disconnect corrections

Owner requested both fixes on 2026-10-17 and explicitly selected updating the existing monthly subscription after reviewing billing options. Coordinator confirmed source-only ownership in the existing Membership worktree. No commit, release, hosted changes or production action authorized.

Status: SOURCE IMPLEMENTATION COMPLETE. Hosted/runtime and owner visual acceptance PENDING. Do not mark the feature release accepted from static review.

## Corrections

- Private Add to your current plan links carry the exact offer and invitation through a non-cached authentication entry route, then billing. Login and billing send no-referrer metadata.
- Billing reads only offers authorized by the current invitation when a private context is supplied. It preselects the requested add-on and a matching-currency subscription; missing/expired offers, incompatible currency, ineligible subscriptions and another open review are explained. Unlisted packages remain off public plans.
- The existing monthly subscription amendment path still obtains Stripe proration, presents due-today/new-monthly-total/unchanged-renewal-date, and waits for verified payment before activating access. No separate subscription or second standalone Checkout Session is created by this flow.
- Private invitation validity and included offer IDs are verified inside the reservation transaction. One amendment reserves one existing membership claim; its ID matches the amendment ID, binding it to the buyer and generated target offer without a migration or storing the raw secret.
- Confirmation rechecks invitation status/expiry/capacity. Successful evidence projection consumes the claim once in the same transaction as entitlement/subscription projection. Failed/abandoned/expired reviews release reservations. Confirming/pending/reconciliation states keep reservations through generic checkout cleanup. Voided/uncollectible invoice evidence releases the reservation. Expired/revoked invitations fail closed; a payment requiring reconciliation never silently grants access.
- Disconnect confirmation is directly beneath its provider control. Successful unlink updates connected-method state, retains success beside that provider and refreshes server-rendered connection information. Existing final-login-method protection remains in both UI and server. Theme components, accessible alert/status roles and existing billing confirmation controls are retained.

## Review and proof boundary

Scoped diff whitespace checks passed; manually traced entry/auth return, invitation validation, reservation/expiry/failure/confirmation/payment projection/idempotency, public behavior defaults and UI states. React quality checklist applied. No Vitest, other runtime tests, typecheck, build, dependency install, local preview, provider call or hosted write performed. Local dependencies/compiler were unavailable; no compile or runtime pass is claimed.

Required next approved checkpoint: hosted compile/build; private selection through signed-out/sign-in; quote/currency/ineligible/open-review states; invitation expiry/revocation/cap race/abandon/failure/replay; successful prorated sandbox payment and unchanged renewal; mobile Google cancel/confirm/success in Light and Navy. Existing subscription special-term safeguards still apply. Newly selecting a base-plan/private add-on bundle is outside this existing-subscription amendment correction.

## Source allowlist

- app/(member)/account/login/connected-methods.tsx
- app/(member)/account/membership/addon-actions.ts
- app/(member)/account/membership/addon-amendment-panel.tsx
- app/(member)/account/membership/page.tsx
- app/login/page.tsx
- app/plans/plan-addon-card.tsx
- app/plans/plan-catalog.tsx
- app/plans/add-on/route.ts (new)
- src/modules/platform/server/membership/membership-addon-invitation.ts (new)
- src/modules/platform/server/membership/membership-addon-amendment-bundle.ts
- src/modules/platform/server/membership/membership-addon-amendment-repository.ts
- src/modules/platform/server/membership/membership-addon-amendment-service.ts
- src/modules/platform/server/membership/membership-addon-amendment-evidence.ts
- src/modules/platform/server/membership/platform-membership-claims.ts
- this progress record and the narrow link/status in membership-and-subscription-platform-plan.md

Existing four Stripe-readiness/cancellation source edits, AGENTS/resume changes,
QA records/helpers and public preview assets remain separate and untouched by
this correction. Baseline HEAD
`f217c376c64bb4d83bb25a5c81e1b8e314b40fcf`; no commit made.

## Authorized staging release and retest

Owner explicitly requested coordinating with Coordinator, deploying both
corrections to staging and retesting add-on purchase/mobile Google disconnect;
production excluded. Coordinator owns the single staging release lane and
frozen artifact/build/health/rollback checks. Browser baseline health observed
`ready` / `sqlite_single_node` / schema166 before release. Real Google
login-method retest uses the separate owner-controlled QA email account with
email/password retained; no original owner-account credential changes. Exact
release and retest evidence will be appended here.

Retest controlling checklist (pending new deployment):

- Verify exact replacement source/deployment/image, migration count166, health and rollback; preserve Coaching and prior Stripe corrections.
- Create one disposable unlisted monthly Stripe TEST add-on and private invitation through staging admin UI. Do not expose it on public plans.
- Signed-out add-on entry retains offer/invitation through sign-in; signed-in entry preselects the private add-on and an eligible matching-currency monthly subscription.
- Ineligible/scheduled-cancel state explains why amendment is unavailable; reactivate only the existing synthetic Stripe test subscription for the paid case and restore cancellation afterward.
- Review exact prorated due-today, combined monthly total and unchanged renewal. Change selection releases reservation; repeated/resumed operation must not produce a second charge.
- Confirm only in Stripe TEST mode; provider invoice/webhook/local membership evidence must agree before claiming active access. Verify one invitation claim, preserved independent grants, renewal unchanged and no second subscription.
- Mobile390x844: separate QA account retains email/password, Google confirmation immediately under its control, cancel makes no unlink, confirmed unlink shows local success/status and only Google removed. Capture Light/Navy without altering original owner account.
- Revoke the single approved synthetic QA session, delete encrypted handoff and
  verify logout/replay denial. Report failures/blocked cases honestly; no
  production actions.
