# Partner Channels — working implementation plan

Updated November 19, 2026, America/Toronto, for the current-712 draft correction batch.
This is the current product and implementation plan. Later direct owner decisions
supersede it. Historical implementation reports do not override its requirements.

## 1. Purpose and boundaries

Connected Discord server owners apply to syndicate selected existing alert
channels into dedicated channels in the owner's TradersLink Discord server.
The publishing server sells access through its own payment account. TradersLink
members need both current paid TradersLink Premium and paid coverage for the
channel or package they purchase.

The November 15 billing decision is to use each publisher's own Stripe account
for new channel and package purchases and continue verifying existing Whop
purchases. Publishers receive the payments and handle their processing fees,
refunds, disputes and payouts. TradersLink charges no fee for this method.
Keep verified existing Whop access in the regular app. The old Whop preview
is shut down. The billing and migration checkpoints are tracked in
[Partner billing verification](partner-alert-whop-evidence-allocation.md).

This feature stands alone. Shared Alerts shares alerts authored through
TradersLink between consenting communities; it is not a prerequisite, ingestion
source, onward relay or commercial integration for Partner Channels. General
server-to-server syndication and payments collected by TradersLink are outside this plan.
Contact that feature only for a concrete shared source/resource conflict.

## 2. Confirmed requirements

| ID | Requirement |
| --- | --- |
| R1 | Initially the TradersLink owner personally recruits known servers. Build a reusable application flow now so other connected servers can apply later. |
| R2 | The TradersLink owner approves each publisher and source/destination channel mapping before publishing. Signup alone never activates it. |
| R3 | Read actual server and channel names from Discord through the bot connection. Track stable Discord IDs and refresh names after renames. No manually chosen neutral names or anonymity option. |
| R4 | Applicants give the TradersLink owner's personal Discord account free access to inspect all their source server channels, including paid channels. Bot access does not establish personal review access. |
| R5 | Publishers choose which channels to offer, their prices and subscription terms. They may sell channels individually, in same-server packages, or both. |
| R6 | Any current paid TradersLink Premium member may purchase any available offer. Publishers do not select or approve individual subscribers. Non-Premium members must obtain paid Premium before subscribing through this feature. |
| R7 | Let publishers set up a new Stripe account or authorize an existing one. Route new paid offers to the verified publisher Stripe account and preserve existing verified Whop access. Bind each individual/package offer to the correct publisher account and channels. |
| R8 | Do not implement or require a TradersLink fee charged to publishing servers now. No publishing-fee checkout, paid publishing agreement or first/additional-channel charge blocks signup or activation. A future configurable fee would belong inside signup and needs a later specification. |
| R9 | Alerts remain in their original channels and are also published into approved destinations in the TradersLink Discord. Destination channels are private and read-only for ordinary subscribers. |
| R10 | Keep setup, approval, publishing health and subscriber access understandable on desktop/mobile in Light and Navy Dark. Show real loading, failure and unavailable states; never imply an unverified save, payment or access grant succeeded. |

The owner’s November 17 Community review instruction restricts every Paid Discord
read/write to `TradersLink Tests`, exact guild `1559172784813514803`. This
includes source reads, destination roles, queued/historical jobs and erasure.
Use the canonical Community guard and verify channel-only targets through
Discord metadata; a channel ID or name cannot establish the approved guild.
This review restriction does not change unrelated global Membership behavior.

## 3. Roles

- **Publishing server owner:** connects their own server, selects source channels,
  supplies review access, configures offers, consents to syndication and submits.
- **TradersLink owner/admin:** inspects applicants, requests changes, approves
  publishers/mappings/offers, manages destination setup and pauses/ends publishing.
- **Trader/subscriber:** browses offers, purchases from the publisher,
  and reads the purchased alerts in TradersLink Discord while both paid requirements hold.
- **TradersLink bot/system:** verifies connections and subscriptions, mirrors
  eligible alerts and maintains destination access. Its authority never substitutes
  for either owner's consent or the trader's paid coverage.

## 4. End-to-end workflow

### A. Connect and apply

1. The server owner signs in with Discord and opens **Publish channels** for their
   community. If no server is connected, take them through the existing community
   connection/bot-install flow and return to this application. Reuse an existing
   valid connection; an invitation is not required to use the application flow and
   never substitutes for approval.
2. Verify current server ownership and the bot's installation/permissions. Retrieve
   server identity and readable supported channels from Discord. A disconnected,
   inaccessible or foreign server cannot be submitted.
3. Show the actual server name and let the owner select source text channels.
   Persist IDs, not names as identity. Show unreadable/unsupported channels with an
   explanation. Bot-authored alerts require an explicit permitted-author selection.
4. Explain personal review access. The applicant arranges free access for the
   configured TradersLink owner account to every channel in the applicant server, including paid/private channels,
   not just the channels selected for syndication. Show pending/confirmed access, separate from bot readability. The
   admin confirms successful inspection before approval; an applicant checkbox alone
   is not proof. Allow submission with review access pending so the admin can
   inspect it; block approval/activation until the admin records confirmation.
5. Configure **Channel access and pricing**: individual channels and/or packages,
   publisher-owned payment account, verified product and price, currency,
   cadence and included channels. Packages cannot include another server's channels.
   Prefer verified offer selection over asking for opaque provider IDs.
6. Review selected channels, review-access status, offers and redistribution/content
   consent. No TradersLink publishing fee appears. Save drafts and corrections
   without losing other steps; reload restores persisted facts.
   Before an application has ever been submitted or approved, allow an owner to
   change or logically remove an eligible draft source. Confirm the displayed
   application revision and current affected offer versions. Retire each entire
   unpublished version containing that source, including earlier versions; keep
   newer coverage excluding it unchanged. Retain all identities, JSON and links.
   Re-add an eligible own-removed source with its same mapping ID, without restoring
   retired offers. Persistent consent, inspection, review and approval history
   excludes this initial-only path even when current draft flags have been reset.
   Existing active-publisher new-source admission remains separate.
   Content rules exposes the existing all-people or explicit-author policy; bot
   authors require explicit IDs. Author and additional-phrase saves preserve the
   other step's saved policy and pending edits. An unconfirmed save retains its
   original full payload and request reference for identical retry. Submit stays
   disabled until individual/package coverage includes every selected channel;
   the native writer remains authoritative and inspection may still be pending.
7. Submit a versioned application. Show **Under review**, not Publishing. The
   applicant can see the admin's reason after changes are requested or the
   application is declined. Resubmission creates a new review with its own consent.

### B. Review and activate

8. The admin opens the application and sees actual server identity, every selected
   channel, proposed destination, offers, permission checks and consent version.
9. The admin checks their own free personal access and inspects the source server.
   They can request changes, decline, or approve the publisher and specific mappings
   and offers. A change to binding/channel coverage requires reapproval.
10. Prepare dedicated destination channels and per-channel access roles in the
    TradersLink Discord. Use actual source branding; exact destination naming and
    whether to create or select an existing channel must be shown before activation.
    Verify private/read-only effective permissions and the bot's role hierarchy.
11. Approval leaves **Setup required** until all connection, permissions, consent,
    offer and subscriber-access checks pass. Activation is an explicit confirmed
    action by the TradersLink owner/admin after publisher consent; no automatic
    publishing merely because a review was approved. Activation does not require
    an existing subscriber purchase: verify access controls and valid offers,
    then evaluate each actual subscriber separately.
12. After activation, process new eligible source messages. Show publishing status,
    last successful delivery and actionable failures. No automatic history backfill.

### C. Subscribe and read

13. A signed-in trader browses publisher names, actual channel names, individual
    offers and packages, with prices and exact billing cadence visible before purchase.
14. Link the trader's Discord account and confirm membership in the TradersLink
    destination server. If they have not joined, show a join-and-recheck step; do
    not report role assignment as successful for a nonmember. Check paid Premium. A non-Premium trader is directed to obtain Premium before
    this feature offers channel checkout. A gifted/trial/admin entitlement does not
    satisfy this feature's paid-Premium requirement.
15. Show channel/package coverage and warn of overlapping existing purchases.
    Open verified publisher Stripe checkout, or verify an existing purchase without
    requiring repurchase. Only active, approved, fully configured offers can open
    new checkout. Every channel in an offer must have publishing activated and
    delivery ready before new buyers can check out. A delivery pause stops new
    sales for affected offers while eligible subscribers keep their access.
    Explain that the publisher handles billing and refunds.
16. On return, verify linked Platform and Discord identities and authoritative paid
    coverage. Checkout redirects, screenshots, plan names or an active membership
    label alone never grant access. Show **Checking** or a specific missing condition.
    When verifying an existing Whop purchase, also verify the linked Whop identity.
17. Show **Open channel in Discord** after confirmed access, linking to the
    authorized TradersLink destination, not the private source channel. Grant only the destination channels covered by both current paid Premium and
    current paid publisher subscriptions. Show access confirmed only after the
    actual Discord operation is confirmed. No publisher approval of each trader.

### D. Maintain and end

18. Source edits update the corresponding mirrored messages; deletes withdraw all
    mirrored parts. Recheck content policy on edits and never resurrect a deletion.
19. Reconcile subscription renewal/expiry, refunds/disputes, Premium changes and
    Discord identity changes. Cancelling renewal is distinct from immediately
    ending already-paid coverage. Preserve access backed by another valid
    overlapping individual/package purchase. A confirmed loss of paid
    TraderLink Premium ends access to the managed channels, including existing
    Whop purchases. An unverified Premium read holds the current assignment.
    Preserve each verified Stripe payment even when its invoice arrives after
    cancellation. An ended subscription does not fund a new role assignment.
    Keep signed refunds and disputes that arrive before their invoice is stored.
    Reconcile the exact payment before granting any role when a full refund or
    lost dispute requires review.
20. Owners can pause publishing or end/withdraw an arrangement. Explain effects on
    new alerts, new sales, existing purchases and billing. A normal publishing pause
    preserves history access only while both paid coverages remain valid; security
    suspension or withdrawn mappings can require access removal. Disconnecting
    TradersLink does not silently cancel external Whop subscriptions.
    Keep paused, previous and closed purchases in the original buyer's catalog.
    Paused and previous purchases can recheck current paid access. Closed purchases
    show the purchased channels and price with checkout and Discord actions disabled.
    A verified Stripe seller disconnect pauses publishing and blocks new purchases.
    Existing Stripe access can last through the last verified paid end date,
    subject to current Premium, refund, dispute and cancellation checks. A fresh
    authorization of the same account requires the current owner and a fresh
    Stripe callback. It preserves the original billing history and publishing
    stays paused until the administrator rechecks setup. Old subscriptions and
    unresolved checkout sessions stay linked to their original authorization.
    Stripe can confirm an old session expired before a new session opens.

## 5. Required behavior and safeguards

### Identity, approval and persistence

- Verify the current actor and community on every read and mutation. An owner of
  one server cannot inspect/edit another application's private data.
- Use versioned drafts, consent, offers and approvals; reject stale conflicting
  writes. Retries use durable idempotency references, including uncertain outcomes.
- Discord renames update display names without recreating mappings, offers,
  subscriptions or history. Ownership transfers and bot removal pause affected
  publishing pending revalidation; a former owner cannot retain control.
- Keep application, publishing, provider-health and subscriber-access states
  separate. An approved publisher can still have an incomplete setup.

### Lifecycle rules

| State/change | Required result |
| --- | --- |
| Draft / changes requested | Owner edits a versioned draft; that draft cannot publish or start new sales. An unchanged, approved active version is governed separately. |
| Under review | Keep the submitted version fixed until review closes. Further edits create a new draft that needs its own approval. |
| Declined | Show the admin's reason in the owner's setup. The declined submission cannot be activated. Previously approved publishing stays in place when an amendment is declined. A later application needs a new review. |
| Approved / setup required | Complete destination and provider checks; no publishing or new sales yet. |
| Active | Approved mappings publish and approved offers are purchasable. |
| Publishing paused | Stop new deliveries and new checkout; retain history access within both paid terms. Resume requires current checks and explicit authorized action. |
| Suspended / disconnected | Stop publishing and new checkout; show the precise access/cleanup consequence and unresolved jobs. Do not infer that external billing stopped. |
| Ended / withdrawn | No new deliveries or checkout for affected mappings/offers. Retain cleanup/payment obligations and apply the explicitly reviewed existing-subscriber disposition. |

Transitions require current owner/admin authority and durable audit records. No
partial approval activates unapproved channels or offers. Existing active versions
must not be silently overwritten by a draft. Price/cadence/package changes create
new offer versions; preserve accepted coverage and paid terms for existing
purchases. Do not apply a new price to an existing subscription or remove paid
package coverage without an explicit change/disposition policy. The exact notices,
renewal transitions and termination remedies remain decisions in section 8.
Editing or reviewing an amendment does not itself pause an unchanged active
version. Security failures or explicit suspension can still pause affected live
mappings immediately. Recheck facts when activating a reviewed revision.

### Whop and paid access

- Verify environment, publisher merchant, offer version, linked customer, paid
  period and refund/dispute facts. Fetch authoritative state after signed events;
  handle duplicate/out-of-order notifications and missed-event reconciliation.
- For Stripe, verify the exact charge and count only succeeded refunds toward
  full-refund role review. A pending refund preserves paid coverage. When a
  failed or canceled refund leaves paid coverage, retire its earlier removal
  evidence and recheck access and the exact Discord role. Keep independent
  cancellations and disputes in force.
- For Stripe disputes, verify the current outcome for the exact dispute and
  invoice. A confirmed loss opens one removal review, including when its
  original notification arrives late. A later win retires that dispute's
  earlier removal evidence and rechecks paid access and the mapped role.
- The Premium-before-purchase gate controls checkout initiated through
  TradersLink. It cannot prevent someone buying directly from a publisher's Whop
  page or an external renewal while Premium is inactive. Such a purchase still
  grants no TradersLink access without paid Premium; show how to restore Premium
  and verify the existing purchase, never require buying it again.
- Verify subscriptions using minimum necessary read permissions. This feature
  does not collect, split, refund or pay out publisher revenue.
- The owner identifies **premium members** as the paid Discord role; a separate
  free-Premium role preserves complimentary ordinary access. Resolve configured
  role IDs, verify payment separately, and never remove the free role during
  paid-role cleanup. Equivalent ordinary permissions must not bypass Partner
  channel access.
- Evaluate Premium AND purchased channel coverage before assigning a dedicated
  per-channel role. Separate broadly allowed Premium/Whop roles cannot enforce
  that AND condition. Audit category/channel/member overwrites for bypasses.
- Union all qualifying purchases before revoking a role. Recheck current evidence
  before writes; stale grants cannot override newer revocations. Identity relinks
  retain old-subject removal obligations until confirmed.
- Provider uncertainty is not proof of nonpayment. Apply a finite qualified
  freshness policy and surface unresolved access; never grant indefinitely or
  manufacture paid evidence. Real Discord admin/owner powers remain outside
  ordinary subscriber permission controls.
- Preserve an existing subscriber role while Whop grants access during renewal
  retries or the result is unresolved. For an expired, canceled or past-due
  membership, confirm that Whop denies access to every reviewed product covering
  the channel. Check independent Stripe purchases before removing the role.
- For an existing Whop buyer, confirm that the linked buyer and known
  membership still match the reviewed merchant, product and plan. Read the
  known membership by ID if the membership list omits it. An unavailable or
  mismatched direct read leaves access unresolved. Check current access for
  each reviewed product covering the mapped channel. Show the
  Discord link for an existing paid assignment when Whop still grants access
  and Discord confirms the role. New paid access requires verified payment.
- In the isolated Stripe sandbox, explicitly select Whop sandbox reads with
  `PARTNER_ALERT_WHOP_READ_ENVIRONMENT=sandbox`. Use the registered test Discord
  guild and a verified Whop sandbox buyer, merchant and reviewed offer. The
  regular app scopes its catalog, membership lookup and role checks to those
  sandbox records and does not need the old Whop preview.

### Alert content and delivery

- Retain the existing text-only/read-only launch baseline: no links, invites,
  media, attachments, mass mentions or promotional posts. Hold the entire suspect
  message, explain why and allow review. Ordinary server/channel identity is
  visible branding, not prohibited content merely because its name appears.
- Remove neutral-alias and blanket source-name suppression requirements. Any
  revised promotion detector must distinguish actual advertising from permitted
  source identity; do not silently disable the other content rules.
- Use authenticated Discord Gateway input restricted to approved guild/channel
  IDs and allowed authors. Exclude mirror loops; no public arbitrary-ingest endpoint.
- Persist messages, revisions, tombstones and delivery jobs before external I/O.
  Preserve full eligible text through ordered multipart delivery; suppress mentions.
- Bound retries and respect rate limits. Reconcile uncertain sends rather than
  reposting blindly. Track outage gaps and delayed alerts; no automatic stale flood.
- Expose held posts, failed/uncertain delivery, permission drift and reconnect
  problems to the responsible owner/admin with a clear recovery action.

### Privacy and recovery

The owner's November 3 direction supersedes the previous 30/90-day alert-text
periods: keep locally stored alert text for no more than seven days. Other record
classes remain separate; audit/payment retention must not become a copy of the
alert body.

| Record | Retention/handling |
| --- | --- |
| Local alert text, including source revisions, delivery payloads and held/rejected content | Maximum seven days from first local receipt; edits/retries do not restart the original message's clock |
| Message mapping and minimal delivery/deletion status | Keep the IDs and status needed for subsequent edits/deletes; no alert-body copy. Define metadata cleanup separately from text cleanup. |
| Provider credentials | Disable/remove immediately on disconnect or erasure; never revive after restore |
| Pseudonymized audit/idempotency evidence | Two years |
| Agreements and payment/refund/dispute evidence | Seven years |

Unsettled external operations remain tracked until actually settled, using minimal
operation identifiers/status after alert text expires. Do not keep their text
indefinitely as an exception to the seven-day limit. Expired unsent payloads must
not be delivered or replayed; surface an expired/needs-attention outcome and retain
only the reconciliation information needed to resolve a possibly completed send. Preserve
qualified nonidentifying successors where shared-owner/signer history requires
them. Platform deletion must fence ingress, sales, credentials, jobs and late
responses without destroying outstanding external cleanup obligations. Journal-only
account deletion must not erase Platform subscriptions. Reuse reviewed shared
privacy/auth contracts; do not invent qualified profiles or migrate databases to
bypass unfinished integration. Technical history contains the detailed contracts.

Text cleanup is local storage housekeeping. It must not delete mirrored Discord
messages, revoke paid access or send Discord delete jobs. Source-message deletion
is a different event and still removes corresponding destination parts using the
retained ID mappings, even after local text expires. For a later source edit,
retrieve/verify current source text when authorized, reapply the content policy
and update the mapped destination parts without resurrecting a deletion. Do not
retain an expired body just to support edits or reset the original expiry clock.
If current source content cannot be obtained, show an unresolved update; never
replace it with guessed or previously purged text.

Expiry must cover revisions, outbox/held bodies, text-bearing logs/caches and
other duplicate local copies. After expiry the UI shows metadata and “Alert text
expired” rather than a broken detail view or a fabricated body. Seven-day expiry
is not the maximum age for delivery retries: stale unsent alerts remain subject
to the separate no-automatic-replay rule.

The owner removed the previous backup retention policy on November 3. There is
no prescribed backup rotation period in this feature plan. The seven-day local
alert-text limit still applies to retained copies; do not introduce an archive
that bypasses it. Restore checks must reapply erasure and text expiry before the
app or workers can read restored data. The retention worker drains all overdue
alert text before Partner workers start. It continues a recurring backlog
between bounded writes without waiting another minute for each page.
This policy change does not delete any
existing backup or alter another feature's recovery policy.

## 6. Current source and honest completion status

Assigned workspace: `/home/traderlink/projects/partner-admin-auth`, branch
`codex/partner-admin-auth-parity-20261028`. Keep unrelated unfinished work intact.
The Paid feature agent owns this plan and implementation. The Coordinator owns
Git checkpoints and integration/releases, not product decisions.

| Area | Evidence to date | Remaining work |
| --- | --- | --- |
| Private app checks | Full app build and compiled startup passed on the 193-entry candidate. Regular catalog, publisher screens, owner/buyer authorization and mobile filters were verified on isolated data | Owner visual acceptance and the reviewed staging handoff |
| Server connection and review access | Discord server/channel name checks and draft ownership. The source picker explains unavailable channels, and the publisher sees inspection status, selected channels and prices before submitting | Verify configured seller and owner identities in staging |
| Individual and package offers | Fresh seller setup and existing sandbox seller authorization. Publisher-entered prices and billing periods passed admin review and genuine Stripe checkout. The previous terms stayed on sale until the amendment was approved, and the existing buyer kept the purchased terms. Canceling a package kept the separately purchased channel in the isolated Discord test | Physical two-channel overlap passed in the registered Discord test server on November 17, including both cancellations and exact baseline cleanup. Release bindings remain separately qualified |
| Premium and destination roles | Genuine Stripe checkout, expiry, late renewal recovery and terminal cancellation granted or removed only the mapped role in the Discord test guild. A genuine Whop sandbox buyer kept the correct link and role. Immediate termination removed only the mapped role in the Discord test guild. Renewal grace and provider outage passed with isolated fixtures | Bind an approved source of current paid TraderLink Premium in the regular app. Reproduce failed-renewal grace against a real Whop sandbox membership |
| Syndication, edits and deletions | Regular Gateway and REST workers passed scoped delivery, edits, deletes, restart and uncertain-send checks using local provider fixtures. Admin pause and delivery recovery keep current paid access | Qualify the approved live bot, source and destination configuration before staging |
| Retention and erasure | Seven-day expiry, historical193 migration/restore and signed buyer erasure passed on disposable data. The current v5 reader validates the full imported manifest. Core's existing account-deletion route passed13 native cases, including ordinary-account renewal without Premium, existing memberships, held work and invalid sessions, with zero network calls. Alert history enforces the original text deadline | Final canonical schema/catalog/profile and source-binding qualification, plus approved handling of a seller's shared community and subscribers. Historical193 fixtures do not qualify the combined migration suffix |

The old Whop preview is shut down. The exact Paid follow-ups are preserved on
`codex/paid-owner-review-20261117` in the canonical Git object store; use its
explicit allowlists rather than copying the older mixed implementation tree.
Provider and final combined-runtime qualification remain open. Source behavior
proofs and final deployment configuration are separate completion records.
The [November 17 QA status](partner-alert-qa-status-20261117.md) reconciles
R1–R10 and the acceptance inventory against the preserved source and test evidence.

## 7. Implementation order and completion checks

Before each batch, inventory the affected source and actual dependencies, record
an exact file allowlist and preserve unrelated edits. Reuse sound authored code;
replace obsolete requirements rather than adding parallel implementations.

| Batch | Deliverable | Completion evidence |
| --- | --- | --- |
| 1. Reconcile existing implementation | Map R1–R10 to actual routes, commands, tables and provider bindings; identify every neutral-name/fee gate | One complete gap inventory with exact files and no unsupported completion claims |
| 2. Application and real identities | Connected-server selection, live names/channels, draft persistence, personal review-access workflow; remove required publishing fees | Owner/foreign-owner/session cases, rename persistence, all steps saved/reloaded; owner reviews corrected screens |
| 3. Offers and review | Individual and package offers through Stripe, existing Whop records, consent, submission, change requests and admin decisions | Same-server package validation, stale/retry cases, free review-access confirmation, no publishing before activation |
| 4. Actual paid access | Real linked identity, paid Premium + channel/package verification, controlled checkout and dedicated roles | Non-Premium checkout denied; valid purchases grant exactly covered channels; overlap/expiry/relink/outage/revocation cases |
| 5. Actual syndication | Approved ingress, complete delivery, moderation, edits/deletes, pause and recovery | Real isolated provider qualification, multipart and uncertain-send cases, no loops/backfill or unauthorized destinations |
| 6. Acceptance | Complete current inventory, guide alignment, build and integrated browser/provider verification | All applicable cases pass with persisted evidence; owner visual approval; separate Coordinator staging/release authorization |

For each completed batch update the progress record with exact source, tests,
passes/failures/unrun cases and next work. Use one consolidated discovery/fix/retest
cycle rather than repeated isolated demonstrations. Focused tests are allowed;
serialize heavy checks and preserve active private previews. Hosted changes and
real external provider effects require their applicable authorization.

### Required acceptance inventory

- **Application:** invited and later self-applying owner; existing connection;
  wrong owner; missing bot/permissions; inspection access covers all server channels, not just selected ones; actual names/renames; source bot allowlist;
  missing personal review access; draft reload/unsaved changes; session expiry.
- **Review:** submit/resubmit, request changes, decline, mapping/offer approval;
  current source inspection; binding changes require approval; activation blocked
  until all checks pass; pending review access can be submitted but not approved;
  an amendment does not stop the approved live version; no publishing-fee dependency.
- **Offers:** individual only, package only and both; exact decimal/currency/cadence;
  wrong merchant/customer/environment; cross-server package rejected; overlapping
  coverage; invalid/deleted provider offer; existing purchase without repurchase.
- **Subscriber:** non-Premium blocked before checkout, Premium only insufficient,
  publisher subscription only insufficient, both valid grant; no manual/gift/trial
  substitution; renewals, period-end cancellation, refunds/disputes, Premium expiry,
  outage, relink, not-in-destination-server recovery and ordinary-role bypass checks;
  inactive/unapproved offers cannot open checkout; external purchase without Premium
  grants no access; activation works with zero subscribers; confirmed-access link
  opens only the authorized TradersLink destination.
- **Publishing:** full text/multipart, permitted author, links/media held, legitimate
  source names allowed, edit/delete, duplicate/out-of-order input, reconnect gap,
  uncertain sends, retry/rate limits, permission drift, pause/resume/end, no relay loop.
- **Privacy/UI:** isolated owners/subscribers, safe logs, credentials/disconnect,
  erasure/late work/restore; seven-day boundary across all text copies; expiry does
  not delete Discord messages or break source deletion; late edits and expired
  unsent/uncertain jobs; backup restore cannot revive expired text; desktop/mobile Light/Navy, keyboard/focus/scroll,
  pending/error/empty/conflict/unknown outcomes and accurate Help guidance.

## 8. Details to settle without guessing

These need a concrete implementation proposal or owner decision before the affected
behavior ships; they do not stop independent work:

- Destination channel naming/grouping and whether admin creates or selects them.
- How long minimal message-mapping metadata remains necessary. Local text cleanup
  never deletes mirrored Discord posts. Any later backup design must respect the
  seven-day text limit; no former backup rotation is a requirement.
- How personal review access is arranged and checked across all paid/private
  source channels; bot installation cannot silently grant human access.
- Exact alert-author permissions and treatment of supported source bots/webhooks.
- Finite provider-evidence freshness, outage recovery, refund/dispute rules and
  any later reviewed replay policy. Preserve existing verified paid-period semantics.
- How existing subscribers are informed/handled when offers, packages or mappings
  end or change. Never silently alter external charges or promise refunds.

## 9. Supporting records

- [Existing-code audit](partner-alert-code-audit-20261103.md): requirement coverage, exact implementation gaps and next batch.

- [November 17 QA status](partner-alert-qa-status-20261117.md) records current coverage, evidence limits and remaining checks after the Stripe and Whop sandbox work.

- [Plan QA record](partner-alert-plan-qa-20261103.md): findings, corrections and remaining design decisions.
- [Current screen specification](partner-alert-ui-review-spec.md): UI behavior for this plan; visible changes still require owner review.
- [Progress and verification](partner-alert-channels-progress.md): chronological evidence; its older product assumptions are superseded here.
- [Private preview evidence](partner-alert-private-preview-testing-20261103.md): exact tests, limitations and phone transport corrections.
- [Preserved technical history](partner-alert-channels-technical-history-through-20261103.md): original plan, hashes, technical contracts and historical restrictions, not the working backlog.
- [Erasure profile artifact](partner-alert-erasure-profile-qualification.json): inspect and qualify actual binding; its presence is not runtime acceptance.
- [Launch responsibility proposal](partner-alert-launch-responsibility-and-complaint-review-proposal-20261101.md): proposal only; no new refund/arbitration authority.
