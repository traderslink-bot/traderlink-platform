# TraderLink Membership And Subscription Platform Plan

**Owner-approved addition:** [Trade Analyzer and Levels Generator allowances](membership-generation-allowances-progress.md). Both require per-plan quantities, unlimited options and configurable reset periods; production-engine reconciliation is underway, not complete.

**Owner-approved addition:** [Independent Watchlist detail and preparation gates](watchlist-membership-feature-split-progress.md). Implementation is local; owner UI acceptance remains pending and is separate from the earlier completed QA inventory.

**Status:** Local implementation and focused follow-up QA complete. The Discord partial-outage finding is fixed and the [follow-up QA](membership-follow-up-qa-2026-09-27.md) rerun passed. Payment-processor integration/verification remains a separate later goal. The owner authorized the first production release on 2026-09-28; current reconciliation and release evidence are recorded in the [production release progress](membership-production-release-progress.md).

**QA corrections:** [Implementation and remaining acceptance](membership-and-subscription-qa-fixes-progress.md)

**Final browser acceptance:** [Fresh non-payment local pass](membership-final-browser-qa-progress.md) completed on 2026-09-28: admin plan publication, coaching-only private page, trial enrollment, timed grant/revocation, Discord configuration, invitation expiry/revocation and signed-member access/free enrollment passed. Earlier browser/runtime blockers are no longer active. The report distinguishes fresh checks from historical matrix evidence and retained-build limits.

**Active completion goal:** [Full QA and completion tracker](membership-full-qa-completion-progress.md). The owner has authorized completing the full inventory and fixing QA findings without further approval prompts. Production activation/publication remains outside this authorization.

**Acceptance inventory:** [Requirement-by-requirement matrix](membership-acceptance-matrix.md) separates verified evidence from remaining checks across the complete requested scope.

**Final local checkpoint:** [Signed-member, offline and Discord QA](membership-local-acceptance-checkpoint.md).

**Latest checkpoint:** Genuine signed-session browser checks passed for independent Journal/Analytics access, revocation and retained billing; populated Journal-only Workspace capture and offline reload passed. Fixed Discord departed-server refresh and Journal-only offline validation. Focused compiler passed 115 entrypoints; selected-route compile/generate passed. See the final local checkpoint for the precise harness and external verification boundaries. Earlier checkpoint notes below are historical.

Browser follow-up verified empty private-page creation, later coaching-only
population on the same URL, public/private separation and editable Discord
server/roles after reload. Fixed stale admin counts after link creation.

Standalone Watchlist follow-up corrected no-guild website-plan admission across its request/page identity, frame and login return; disposable request verification passes. Rendered Watchlist/OAuth acceptance remains open.

Owner-control follow-up removed the unnecessary requirement to create an offer before creating a private page. Empty-page creation and later same-URL population pass disposable and browser verification.

Payment follow-up added verified Stripe recovery of expired/released reservations with duplicate protection; owner invitation revocation/capacity remains enforced unless the owner approves a checkout-specific exception. Disposable event projection and browser approval/withdrawal pass; live-provider acceptance remains open.

Stripe ordering follow-up separates paid invoice coverage from subscription lifecycle, retrieves current subscription state, preserves longer paid coverage and terminal cancellation, and passes disposable/mocked event-ordering cases. Full acceptance is still open.

**Canonical application:** `C:\Users\jerac\Documents\TraderLink\traderlink-platform`

**Progress:** [Membership And Subscription Platform Progress](membership-and-subscription-platform-progress.md)

**QA:** [2026-09-27 QA report](membership-and-subscription-platform-qa-2026-09-27.md)

## Outcome

Build one owner-controlled membership authority for unlimited versioned plans,
feature bundles, prices, trials, Discord programs, coaching access and
individual grants. Stripe is the normal website/app processor. Whop remains the
normal Discord commerce option and may be exposed on selected plans. Platform
authorization, not a processor or navigation state, decides effective access.

Customization is the controlling product requirement. Code-supplied features
are starter definitions, not a closed allowlist. The owner may register future
feature keys, compose them into any number of plans and offers, set any valid
price or access period, and override ordinary eligibility. Validation protects
identity, private data, exact money, chronology and verified payment evidence;
it must not impose unrequested commercial tiers or product limits.

## Accepted contracts

- Stable Platform users own access; email, Discord display names and role names
  are never identity keys.
- The owner-controlled feature catalog is extensible without a membership
  schema change. New runtime features require their server enforcement point,
  then become selectable in the catalog.
- Published plan versions and full-app trial snapshots are immutable.
- Existing members stay grandfathered unless the owner explicitly migrates
  them immediately or at renewal.
- Paid, free, trial, Discord and owner grants combine additively. Boolean
  features use union and limits use the highest active value.
- Stripe is the default web/app offer. Whop is the default Discord offer. A
  plan may expose either or both when explicitly configured.
- Provider lifecycle evidence is projected into one internal entitlement
  model. Browser success redirects never grant access.
- Cancellation at period end retains access through the paid period. Payment
  failure alone is not revocation.
- Ending access preserves Journal facts, saved reviews and coaching history.
- Public product positioning covers journaling, analytics, education,
  community and coaching, not signals or stock-alert promises.
- Discord membership or roles never authorize private Journal reads; coaching
  still requires explicit trader grants.

## Delivery checkpoints

1. Provider-neutral schema, feature registry, repository and resolver.
2. Owner-approved Memberships information architecture and plan builder.
3. Free plans, grants, trials and Discord program commands.
4. Stripe test-mode Checkout, portal, webhooks and reconciliation.
5. Whop external-offer compatibility and optional API capability gate.
6. Member Plan & billing and owner-approved public Plans page.
7. Feature-by-feature shadow authorization, Help/legal alignment and bounded
   activation.

The owner approved continued UI completion and QA corrections on 2026-09-27. No live processor activation,
subscriber migration, production migration, push or deployment is implied.

## Verification boundary

Grant access and member-access diagnostics use a paginated owner-only member
picker backed by the existing Users API. Internal user IDs are not exposed;
opaque references are resolved after owner authorization. Browser QA verified
timed grants, revocation and selection beyond the first 50 members.

Browser QA also verified lifetime and recurring owner grants, customized draft
publication, immediate migration, and queued-renewal migration/cancellation.
Member rows and selectors display the current version and pending target with
its renewal boundary. Owner grants do not charge members; synthetic renewal
verification does not represent a real payment-processor subscription.

Custom provider registration, recurring offers with separate initial/renewal
prices and paid/card-required trial controls now pass disposable browser QA.
Member-facing catalogs use the owner-configured provider display name while
checkout continues using the stable provider key. Exact trial/renewal terms
were verified without opening a payment provider or charging anyone.

Focused paid-offer command QA additionally covers one-time and lifetime prices,
duration, activation/pause and rejection of unpaid fulfillment. Full signed-member
rendering still requires a production-mode runtime; local owner preview is not
equivalent evidence. See the acceptance matrix for this remaining boundary.

Existing Discord access rules are editable in owner administration: offer,
server, role list, grant versus purchase eligibility, payment arrangement,
verification validity and start/end dates. Editing preserves rule identity and
status; activation remains an explicit status control.

Workspace follows Journal access. Its aggregate performance cards independently
follow Analytics access, so Journal-only plans retain their review content.
The shared analytics engine remains reusable by other authorized modules.
Dedicated analyzed-trades and candle-pattern occurrence/replay APIs follow the
same Analytics policy as their pages; client failures distinguish missing plan
access from unavailable analysis. Shared Journal analysis consumers retain their
own scope rather than being indiscriminately gated by Analytics.
Single-trade analysis and execution details shared by Journal and Analytics
allow either permitted feature. Broker execution-mismatch confirmation remains
a Journal mutation. Feature permissions never replace account ownership checks.

Trading Rules, Rule Results and rule/idea mutations follow Journal access before
reading data, saving an offline view or processing a write. Denials preserve
saved rules and return the standard membership response; shared annotation
services retain their independent data-ownership contracts.

The compatibility analytics overview API follows Analytics access; Candle Review
generation follows Journal access. Denials occur before their data/provider work
and use the shared membership response. Existing saved reviews are not erased.

Data Decisions and import history follow the owner-configured Journal access
policy at their page/API entrypoints. Denial preserves saved records and
unresolved decisions, and uses the common non-cacheable membership message.

Owner administration includes a per-checkout Stripe invitation-recovery approval
and withdrawal control. Approval does not represent payment or grant access;
only verified payment processing may fulfill the approved checkout. Record the
owner's note and preserve invitation limits and normal subscription lifecycle.
Disposable browser approval and withdrawal now pass through the real owner
form and persisted audit record, without granting access or changing invitation
status. Signed-member denial screens and live provider delivery remain separate
acceptance checks; the loopback owner preview cannot prove member enforcement.

Whop reconciliation now retrieves current membership state for signed payment,
activation, deactivation and cancellation-change events. Delayed notifications
must not override that current state. Focused ordering evidence is tracked in
[full QA progress](membership-full-qa-completion-progress.md); live provider
acceptance remains outstanding.

QA continuation: Journal note, tag and daily rule-review endpoints now follow
the configured Journal policy. Eight direct signed-session denial checks and
the 105-entrypoint focused compiler pass; see the full QA progress record.
Community Watchlists pages and writes now follow the Community policy, with
disposable grant/revocation/ownership checks; rendered member acceptance remains open.

The one-time/lifetime offer and draft-edit/publish browser checkpoint now passes,
including exact saved terms and preservation of existing version-1 offers and
members. See the acceptance matrix and full QA progress for evidence boundaries.

Review entrypoint reconciliation now covers Trade Explorer review actions and
shared factual Coach/Review APIs. Moomoo import command admission and worker
execution are both gated, with denied-command zero-write and API checks recorded
in the full QA progress. Final entrypoint and rendered-member acceptance remain open.

The [15-feature entrypoint audit](membership-access-entrypoint-audit.md) records
current source boundaries and deliberate shared/privacy exceptions. Source
reconciliation is complete for that registry; signed-member rendering, populated
Workspace/offline and real provider acceptance remain separate open gates.

Do not run Vitest. During implementation use serial, focused TypeScript, lint
and static/disposable verification only. Broader build, browser/E2E and final
acceptance checks occur only at the owner-approved final checkpoint.

Owner-directed scope update: payment-processor integration/verification will be
a separate goal performed last. Finish local membership and member-facing QA
without requiring Stripe/Whop credentials. Preserve provider code and clearly
label its simulated evidence; do not claim real integration acceptance.
