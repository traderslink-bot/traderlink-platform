# Membership acceptance matrix

Status: Local implementation and QA complete under the owner's revised scope.
This is the full owner-requested inventory, not a reduced release scope.
The [final local checkpoint](membership-local-acceptance-checkpoint.md) records
signed-member, offline and Discord callback evidence and its limits.
The [controlling plan](membership-and-subscription-platform-plan.md)
and [detailed QA evidence](membership-full-qa-completion-progress.md) govern it.
No production activation or real customer payment is authorized by this work.

The [2026-09-28 fresh browser checkpoint](membership-final-browser-qa-progress.md)
now completes the requested follow-up. It records exactly which flows were
repeated and preserves the older evidence below as historical where applicable.

Owner scope update: payment-processor integration and verification are deferred
to a separate goal, to be done last. Existing adapter code and simulated evidence
are preserved; missing Stripe/Whop credentials no longer block this goal's local
membership acceptance. Member runtime, Workspace/offline and Discord access QA
were completed in this goal using the local acceptance methods recorded below.

| Requirement | Implementation and evidence | Remaining acceptance |
| --- | --- | --- |
| Any number of plans and future features | Extensible registry, owner feature registration, editable drafts, published versions, additive grants and unlimited numeric values; browser registered a custom numeric feature and whole-app draft persisted all 16 selectable features with unlimited limits. Browser copied version 1, edited Coaching/custom limit 7, saved/reloaded and published version 2; independent database checks preserved version 1 features, all existing offers and member grants | Future feature code still needs its enforcement connection |
| Owner prices, providers and free/paid/lifetime/recurring offers | Foundation/provider verifiers plus browser custom-provider registration and recurring-offer creation/activation with separate initial/renewal prices and two-month interval. Browser created/activated CAD 12.34 one-time/nine-day and CAD 99.99 lifetime offers, verified public cards and exact saved terms. Disposable command coverage verifies activation/pause and refusal of free fulfillment. Configured provider names display correctly | Stripe test-account connection and real provider checkout are external acceptance |
| Stripe website and optional Whop/external checkout | Checkout/portal adapters, verified event projection, current-provider reconciliation, duplicate handling and owner Stripe invitation recovery; mocked provider and disposable event evidence; browser recovery approval/withdrawal | Real provider test-mode checkout/webhook/portal acceptance not claimed; no live credentials or charges used |
| Arbitrary free/paid trials and whole-app trials | Browser three-day free-trial creation/activation/enrollment; browser 14-day paid/card-required trial with custom capacity and separate external checkout mapping. Exact saved terms and public renewal display verified | Actual provider acceptance remains separate; no real charge or external checkout performed |
| Per-member temporary/lifetime/recurring access | Browser timed grant/revoke, lifetime and every-two-month owner grants, immediate migration, queued renewal migration and cancellation; persisted values independently checked. Member rows display current version and pending target | Actual processor renewal remains provider acceptance; owner grants do not charge a provider |
| Multiple Discord servers and arbitrary roles/prices | Editable server/role/offer rules, automatic grants versus purchase eligibility, sponsorship; disposable eligibility cases; browser create/edit/reload; actual OAuth callback with mocked role removal, departure, rejoin and per-server failure cases | Real Discord account verification is not claimed by this local checkpoint |
| Public Plans plus independently controlled unlisted pages | Separate offer selection, editable title/expiry/claim limits on stable secret URL, empty pages; public/private browser separation and same-URL coaching edits passed. Final source search found invitation URLs only in owner link creation and the invitation's own sign-in return URL; sitemap includes only public Plans; private route supplies noindex/nofollow/noarchive/nocache/no-referrer | Compliant-crawler exclusion verified; possession of the link is not a confidentiality guarantee or an authentication substitute |
| Existing owner admin and usable member selection | Memberships in Journal Administration; owner-authorized actions; opaque member picker reuses Users API; browser 50-to-53 pagination, selection, timed grant, revoke and access diagnostic passed | Full remaining command matrix above; no raw internal member ID required from owner |
| Member Plan & billing | Stable authenticated billing without paid dashboard/guild requirement; free claim and billing browser evidence; normal signed-member browser retained billing after all grants revoked, while Workspace redirected to Plans | Real Stripe portal belongs to the final payment goal |
| Owner-controlled feature enforcement, preserving private data | Off/shadow/enforced policies; all 15 built-in keys reconciled; shared reads permit Journal or Analytics; signed request and actual denied-handler checks; populated normal-member Workspace omitted denied Analytics while keeping Journal review; IndexedDB capture and network-disabled offline reload passed | Future feature code must connect its enforcement key; old offline snapshots are not remotely erased |
| Help, verification and data preservation | Help aligned; full disposable migration rehearsal; final request/foundation/Discord fixtures; 115-entrypoint compiler; selected-route compile/generate; generated artifacts restored and unrelated work preserved | Not a whole-repository build, hosted release or real payment acceptance |

## Local completion and external follow-up

The [entrypoint audit](membership-access-entrypoint-audit.md) reconciles all 15
built-in keys and records intentionally shared/ungated surfaces. It is source
evidence alongside the completed signed-member and populated offline runtime checks.

Latest checkpoint: foundation, request authorization, Discord callback fixtures,
115-entrypoint focused compiler and the selected-route compile/generate passed.
The prior mocked Stripe/Whop hydration and 131-entry migration rehearsal passed.
Production configuration was not inspected. Normal-member rendering used only
synthetic data and a loopback QA harness, not a production deployment.

1. Custom numeric feature, whole-app draft, free-trial creation/activation and
   local-owner enrollment passed the disposable browser checkpoint. Normal
   signed-member rendering also passed. One-time/lifetime offer creation, activation,
   saved terms and public display now pass. Draft edit/reload/publish also passes. Custom
   external provider, recurring price and paid/card-required trial controls also
   passed; this does not establish real processor payment acceptance.
2. Lifetime/recurring grants and migration controls passed the disposable browser
   checkpoint, including queued-change cancellation. Actual processor renewal
   remains separate from synthetic subscription-shaped evidence.
3. Signed-member authorization was verified without the loopback owner bypass;
   the separate harness omitted only Railway startup maintenance/workers.
4. Route/navigation/Help reconciliation and bounded local verification are
   complete. Next is the separately scoped payment-provider goal, followed by an
   explicitly authorized hosted release checkpoint. Real provider/Discord account
   acceptance is not implied by local mocks.

Existing Journal ownership, coaching consent, authentication and stored-data
protections are not replaced by plan membership. Custom future features need
their runtime enforcement connection; registering a name alone cannot gate code
that has not been built.
