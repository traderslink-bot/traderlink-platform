# Membership plan add-ons

Owner request: October 13, 2026. Local implementation completed for package editing and new-signup selection;
local verification passed. No production payment, database migration or
publication authorized.

## Customer outcome

A member selects one base plan and zero or more distinct add-on packages. The
summary lists each selected package, its monthly price, and the combined monthly
price. For example, a $20 plan plus a $10 Stock Tools package plus a $5 package
costs $35 per month. A free base plan contributes $0. Exact currency amounts and
provider-confirmed payment determine access; changing checkboxes never grants it.

## Owner experience

Reuse the unified package editor for titles, brief/expanded feature descriptions,
feature order, allowances and prices. Add Package type: Plan or Add-on. Add-ons
are managed separately in the list and displayed as optional packages alongside
base-plan selection. They are not standalone base plans and need not contain the
mandatory Journal foundation that base plans include. Preserve all existing
plans and saved drafts; default older documents to Plan.

Add-ons may be combined with any eligible base plan; do not introduce arbitrary
package count limits. A customer selects a distinct add-on once. Existing active
packages can remain grandfathered when the owner edits or archives an add-on.
Archive/delete stop new selection without erasing paid access or billing history.

## Existing integration boundary

The current Stripe checkout reserves one offer, builds one recurring item, and
projects payment evidence to that offer's version. Current independent grants
combine boolean permissions by union and numeric limits by maximum. Extending
only the plan-card UI would not implement combined billing or correct access.

Implement a versioned bundle selection recording base offer and selected add-on
offers, exact prices, currency and billing terms. Server-side selection validates
current enrollment status, package types and compatibility. Claims, retries,
provider checkout, invoices, refunds/cancellation and entitlement projection must
carry the complete selection atomically. One successful payment must activate
all purchased packages exactly once. Failed or abandoned payment must activate
none. Removing an add-on must preserve unrelated plan/add-on access and usage.

For aligned monthly terms, Stripe supports several products on one subscription
and invoice. Source: https://docs.stripe.com/billing/subscriptions/multiple-products
Do not promise a single monthly bill for annual or lifetime base-plan terms
without an explicit compatible commercial model. Whop needs separate capability
validation before offering the same combined-payment flow there.

## Owner decisions — October 13

- Add overlapping allowances together: 10 analyses plus 20 analyses means 30.
  This applies to the selected base-plus-add-on bundle; preserve existing
  independent-grant behavior outside bundles.
- Initial delivery supports monthly and free base plans. The owner does not
  currently sell annual plans and explicitly selected this initial scope.
- Multiple add-ons are supported. Monthly prices share currency and billing
  date so the customer pays the combined total together.
- Annual/lifetime base-plan support is future extensibility, not an imposed
  business restriction. Preserve the package model's ability to support it.

No open allowance-aggregation or initial-billing-scope question remains.

For different reset periods, do not add counters without defining their windows.
Unlimited access must remain unlimited. Define amendment timing/proration before
charging for mid-cycle changes, and show the amount before customer confirmation.

## Verification and delivery

1. Editor/draft compatibility, add-on catalog separation and selection/total UI.
2. Versioned bundle claims and exact-money validation, followed by payment and
   entitlement projection with duplicate/stale-event/retry coverage.
3. Adding/removing packages, cancellation, retained access, usage accounting and
   grandfathering checks on disposable data.
4. Owner browser review using display-only packages. Real provider tests and
   deployment remain separate authorization boundaries.

All schema additions need migration-lineage allocation before runtime use.
No preview migration or mutation of the owner's existing packages is part of
this design checkpoint.

## Implementation checkpoint

Package type and bundle component offer IDs are backward-compatible fields in
existing versioned presentation JSON. No schema migration is required. The owner
uses New add-on and the same feature/price editor; Journal is optional for add-ons.
Published addons appear as optional selections within monthly/free plan cards,
with expandable features and a combined total. Add-ons cannot enroll standalone.

The server validates published public offers, distinct packages, currency,
provider and monthly/free terms and derives an immutable buyer-bound aggregate
plan/offer using the existing storage contracts. It sums numeric allowances,
unions boolean access, preserves unlimited, selects shorter News delays, and
retains original usage anchors. Matching reset periods are required for overlapping
finite metered allowances; no invented cross-window conversion is performed.
Free packages must have no separate expiry duration in this monthly bundle flow.
Existing independent grants continue using maximum. Generated bundle records
are excluded from owner/public plan catalogs. A single combined-price Stripe
subscription uses the existing signature-verified event/entitlement lifecycle.
Free base access is fulfilled independently and survives paid-bundle cancellation.
Retries reuse the same pending bundle claim and stable checkout expiry.

Current scope is new signup; mid-cycle amendments to an existing paid subscription
are not implemented. The server refuses a second combined paid subscription for
an existing subscriber. Existing bundle access/prices remain grandfathered when
packages are edited or archived. Whop combined checkout and independent per-item
removal remain outside this initial signup flow.

Verification passed: 21 focused exact-money/composition/lifecycle tests,
mocked signed Stripe payment/duplicate/cancellation, real-browser selector
selection/totals/mobile and forwarded owner editor review (no draft saved),
focused TypeScript/lint, and one full application build. A first browser assertion
used a dollar symbol instead of the actual USD currency-code format; correcting
the assertion passed without a product change. No real provider charge or mutation of the
owner's retained package records is part of verification.

The preview remains the isolated membership QA checkout/branch on port 3027.


## Feature-upgrade discovery correction — October 15 owner local date

Owner reiterated that an add-on is an upgrade option. Feature-filtered Plans
must retain matching add-ons and compatible public monthly/free base plans so
new-signup selection is possible even when the base itself lacks the requested
feature. Apply ticker-specific plan filtering to matches before adding compatible
base-plan context; never reintroduce a rejected add-on. Contextual bases do not
claim to contain the feature. Existing paid subscription amendments still need
their own implementation and billing timing/proration decision; this catalog
correction does not authorize or implement a second subscription or real charge.


## Existing-member amendment decision and implementation contract

Owner decision, October15 local date: start an added package immediately with a
prorated charge for the remaining monthly period. Show the charge and new monthly
total before confirmation. Activation follows successful payment; preserve the
existing subscription identity and renewal date. Free base-plan purchases continue
through the existing free-base/new-paid-bundle flow.

The current recurring checkout uses one aggregate subscription item. Amend that
item to a new immutable combined price rather than creating another subscription.
Preserve the member's accepted base and previous add-on snapshots, including
archived/grandfathered terms; only newly selected add-ons need current public
enrollment validation. Reject repeated packages and incompatible currencies or
reset windows. Carry existing consumption/usage anchors into the target bundle.

Required durable amendment state: member/subscription/item identity, immutable
original and target offer/version, original and target recurring exact amounts,
currency, requested add-on component IDs, proration timestamp, quote expiry,
provider price/invoice references, idempotency/fencing identity and lifecycle.
Allocate and reconcile its additive candidate migration before runtime/schema
implementation; no mutation of an existing/hosted database is authorized here.
Do not encode this payment lifecycle in generic audit JSON or mutate an existing
paid claim to represent a second operation.

Use a Stripe invoice preview for the actual current subscription and apply the
same proration timestamp to the update. Re-read/revalidate the current subscription
and item before confirmation; reject expired/stale quotes, another pending update,
cancellation or incompatible billing terms. The update uses pending_if_incomplete
and always_invoice without resetting the billing anchor. Pending payment or
customer authentication preserves current access; present the provider-supported
payment step. A failed/expired amendment never grants its new features.

Apply access only from verified payment evidence matched to the durable amendment's
invoice, subscription, customer, currency and target price/version. Mutable
subscription metadata alone cannot identify the amendment for an older invoice.
Handle the webhook arriving before the update HTTP response, duplicate/reordered
paid events, pending expiration, cancellation during payment and a later amendment.
Atomically change the existing subscription entitlement to the new aggregate
version and mark the amendment applied; keep the same entitlement/source identity.
Never let an old event replace a newer accepted bundle or resurrect a canceled
subscription. Reconcile the local provider offer after accepted payment and ensure
later renewal coverage retains the accepted bundle.

Verification must cover quotes/proration equality, taxes/discounts and exact
currency units, multiple add-ons,10+20=30/unlimited and retained consumed usage,
duplicate confirmation/retry, insufficient authentication/ownership, provider
failure/authentication/pending/expiry, webhook-before-response, stale/mismatched
invoice and cancellation/renewal ordering. Use mocked provider responses and
disposable candidate storage first. No real provider call, charge, hosted schema
change or live acceptance is implied by this design contract.

Primary references checked during this continuation:
- https://docs.stripe.com/api/invoices/create_preview (same proration timestamp)
- https://docs.stripe.com/billing/subscriptions/pending-updates (payment-gated
  pending updates, supported fields and pending lifecycle events)


## Amendment implementation checkpoint — October 15 owner local date

Candidate implementation is in the isolated membership worktree. Migration0167
(order180) adds immutable amendment snapshots and a one-open-operation fence.
No existing database, hosted database or payment provider has been changed.

Implemented: owner-scoped quote/confirm/reconcile actions; existing-subscription
price amendment with a fixed proration timestamp and stable idempotency key;
exact invoice/customer/currency/period/price validation; payment-gated atomic
entitlement replacement; retained usage anchors; pending invoice link; bounded
read-only status polling; restored open operations; add-on card entry link; and
Help guide alignment. The same subscription, entitlement and renewal date remain.

Supported billing terms are one monthly automatic-payment item, quantity1, no
schedule/pause/cancellation/pending update, taxes, discounts or billing adjustments.
New paid add-ons must have equal initial and renewal prices. Unsupported terms
fail before the subscription update. An uncertain provider dispatch stays under
review and blocks another amendment; reconciliation handles accepted updates.
A member-triggered payment check can retry the exact confirmed request with the
same idempotency key only inside the original short quote window, after checking
that Stripe still shows the untouched paid subscription and no pending change.
After that window an uncertain dispatch stays under review rather than charging
with a fresh key.

Verification checkpoint: focused repository/provider tests use only in-memory
SQLite and synthetic mocked Stripe responses. Browser acceptance and real Stripe
test-mode acceptance remain outstanding. Do not represent this as live-ready.
The full migration-file verifier still stops at the pre-existing0156 literal
format mismatch; verify0167 separately and reconcile the complete predecessor
ledger before any existing-database application or release. No build is run.


Browser verification update: b6d28764a signed-member UI/action/database flows pass
on desktop Light/Navy and mobile Navy with an explicitly mocked payment harness.
Two sequential add-ons keep one subscription and renewal date while adding the
allowances. Status API ownership/non-disclosure checks pass. This advances local
browser evidence only; real Stripe test-mode acceptance and release eligibility
are still separate. The harness is isolated under scripts/feature-preview and
fails closed for unknown external payment requests.


## Additional payment edge-case QA — October15 owner local date

The provider service suite now passes21 cases. Added proof for a zero-charge
free add-on, quote expiry before confirmation, no uncertain-dispatch retry beyond
the quote window, cancellation while payment is pending, and rejection of
cancellation/schedule/tax/discount/pending-update terms before creating a price.
A signed-event renewal retains the amended offer/version; a subsequent signed
cancellation revokes access, and a late amendment invoice cannot resurrect it.
The free-update mock now includes the paid status on the expanded latest invoice,
matching the response contract required by the existing validator. No runtime
code or appearance changed in this test-only slice.

Real sandbox acceptance cannot run yet: STRIPE_SECRET_KEY and
STRIPE_MEMBERSHIP_WEBHOOK_SECRET are absent from the current process and local
Next environment files (presence checked without printing values). Owner was
asked for a sandbox API key through Codespaces secrets, never chat. Use only
explicit test-mode resources and new disposable candidate storage for acceptance;
do not borrow production credentials or mutate existing subscriptions. Hosted
webhook delivery additionally needs its own test endpoint/signing secret.
No build, real provider call, hosted configuration change or deployment performed.


## Local-only continuation and recovery correction — October15 local date

Owner selected Continue local testing for now; real Stripe acceptance is deferred.
Repeated provider failure while an amendment was already reconciliation_required
previously changed it to failed, releasing the one-open-operation fence. Corrected
the repository to preserve reconciliation_required across repeated uncertainty.
The member cannot begin another amendment while that charge remains unresolved;
recovery continues with the same confirmed request and idempotency key.

Focused verification:22 service tests plus4 repository tests pass. A separate
invoice-ordering regression passes: the credit for a previously purchased package
in a later invoice does not cause an ambiguous match; delivery of the old invoice
after the newer purchase cannot replace the newer bundle or reduce its allowance.
Scoped lint and TypeScript271 roots/zero diagnostics pass. Help guide reviewed:
its existing under-review/no-resubmission wording already matches this correction,
so no guide change is required. No appearance changed; no build, external provider
call, existing/hosted database mutation or deployment occurred.


Restart recovery checkpoint: a process stopping after beginConfirmation but before
provider dispatch left a confirming operation without an invoice. Manual payment
checking now retries that already-confirmed request inside its quote window,
using the same immutable arguments/idempotency key and unchanged-subscription
preflight.24 service tests pass, including this restart and concurrent confirm
(one provider update, one entitlement). Scoped lint/TypeScript270 roots pass.
No builds, external payment calls or hosted changes. Local testing continues.

## Owner-requested local acceptance run — October15 Toronto

At source5464fc642, ran23 targeted membership/add-on/Discord test files:158
passed, with two outdated demo image assertions failing. Updated only those
assertions from the retired whole-image filenames to actual section-01 assets;
both rerun cases pass, giving160 passing checks across the selected scope.
Scoped lint passes. No product behavior changed, so Help Center guides need no
update. Existing demo rendering checks still prove no member-results reads.

Fresh disposable fixture membership-local-acceptance-3038-r1 used seven signed
synthetic members and a fail-closed local Stripe substitute. Real browser/action
flows pass Light desktop1440 and Navy mobile390: select add-on, review USD5 due
today and USD30 monthly total, confirm, then display active with no horizontal
overflow. Read-only follow-up checks prove one applied amendment per member,
one unchanged subscription, renewal unchanged, and summed Analyzer allowance30.
Status API returns200 only to the purchasing member and404 to another member
or anonymous request, without provider customer/subscription/price identifiers.

Service coverage includes pending authentication without early access, duplicate
and reordered signed payment events, lost responses, restart/concurrent confirm,
quote expiry/amount changes, void/canceled payments, free packages and uncertain
payment fencing. Discord notice/callback checks are mocked local proof; no actual
OAuth or server-role delivery was performed. This run does not claim real Stripe
or Discord acceptance. No builds, live provider calls, hosted mutations or release.

## Stripe sandbox connection — October16

Owner authorized sandbox API access and webhook creation. Sandbox key was
verified via read-only Stripe endpoint listing; zero pre-existing endpoints.
Dedicated receiver on3039 exposes only health and signed test-mode membership
webhooks; all dashboard/test-login paths404. Uses a new disposable migration-
verified database and actual membership webhook route. Live-mode payloads are
rejected before hydration. Signing secret stays in private fixture storage.
Setup and real delivery verification in progress; production remains untouched.

Sandbox webhook setup verified: endpoint we_1UREY9BmtNckE9JXi5cYWhC2, URL
https://literate-carnival-wvgrj7p47gvc5q95-3039.app.github.dev/api/webhooks/membership-stripe .
Eleven selected checkout/invoice/subscription events enabled. Only3039 was made
public; dashboard preview ports stay private. A real sandbox Checkout Session
was created and expired without payment. Stripe signed delivery returned200 and
the actual route stored checkout.session.expired as ignored because this delivery
probe intentionally had no membership claim. This proves transport/signature/
receipt processing, not paid membership activation. Unsigned and live-mode
requests400; test-login route404; health200. No real charge or customer data used.

STRIPE_MEMBERSHIP_WEBHOOK_SECRET was saved via encrypted GitHub Codespaces user
secret scoped to traderslink-bot/traderlink-platform; value never printed or
committed. Current receiver reads the same secret from mode0600 private fixture.
Codespace must stay running for this development destination. It is separate
from any eventual production webhook/secret. Pending: real sandbox successful
payment, payment failure/authentication and recurring amendment acceptance.

## Real sandbox API acceptance and correction — October16

App checkout service created a real monthly sandbox Checkout Session. Automated
hosted payment hit Stripe's anti-bot challenge and remains unaccepted; no CAPTCHA
bypass attempted. That unpaid claim stayed reserved with zero paid entitlements.
A supported sandbox PaymentMethod API test returned card_declined. Separate
sandbox API subscription payment with the same synthetic claim metadata became
active; actual signed invoice.paid delivery fulfilled the claim and stored the
active subscription. This proves API/webhook membership activation, not completed
hosted checkout UI. No live-mode key or real funds/card/member data used.

Real app add-on quote/confirm found current invoices omit legacy paid boolean.
Paid status/amounts were correct but access stayed pending. Evidence reconciliation
now accepts paid terminal status with fully settled numeric amounts when that
legacy field is absent; explicit false and unsettled amounts still do not unlock.
Recovery read the same paid invoice without another provider update/charge and
raised allowance10 to30. A second distinct add-on then quoted/confirmed as applied
and raised allowance to50. Subscription and renewal date unchanged.26 focused
service tests pass including current-format paid/unsettled cases, scoped lint
passes, TypeScript270 roots/zero diagnostics passes. Help guide reviewed: expected
paid activation behavior is unchanged, no guide update required. No builds.

Canceled only the synthetic sandbox subscription and expired its unused hosted
Checkout Session; signed cancellation reconciliation verification follows below.

Signed customer.subscription.deleted returned applied, subscription became
inactive and paid Analyzer access was removed. All14 synthetic Journal accounts
remain present. Real sandbox first-payment/add-on/cancellation API/webhook
evidence passes; hosted checkout anti-bot/3DS browser acceptance remains open.

## Additional payment QA — October16

Owner requested more testing. Five focused payment/catalog/access files pass64
cases. Added three invoice settlement regressions: numeric-string amount_paid,
negative amount_paid, and an explicitly false legacy paid flag all keep the
add-on pending and retain allowance10. Service suite now29/29; combined selected
scope67 cases passes across the initial64 plus these3 targeted reruns. Scoped
lint passes; TypeScript269 roots/zero diagnostics passes. Test-only change;
reviewed expected Help Center behavior is unchanged. No build or product UI edit.

Against the running isolated receiver, replayed a retrieved real sandbox paid
invoice inside a NEW locally signed test event after cancellation. First result
conflict safely retained revoked access; byte-identical replay returned duplicate.
Modified body with original signature400; same event ID with conflicting signed
content503. These are locally signed replay probes, not new Stripe deliveries.
The intentional conflict records belong only to this disposable QA database.
Read-only follow-up still confirms inactive subscription, no paid Analyzer access
and14 saved Journal accounts.

Public receiver checks pass: body above1MB413, malformed JSON400, live-mode body400,
test-login route404, Account/Membership route404. The API key stays sandbox-only
and all other preview ports remain private. No new charges, production changes,
real account emails or Discord sends. Hosted Checkout/3DS human browser acceptance
remains outstanding due the previously recorded Stripe anti-bot challenge.
