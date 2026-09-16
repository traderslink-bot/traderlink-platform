# Approved Watchlist push and email notifications

Owner authorized discovery and implementation on 2026-09-15. This plan is the
complete target inventory; it does not authorize production delivery or migration
application. Progress: [implementation record](watchlist-approved-push-email-progress.md).

## Product contract

- Trigger only from an explicit owner approval and successful website publication.
  An add, draft, AI generation, owner edit, indicator refresh, price update or
  Discord retry must not create a new notification. Preserve the current path
  for sessions with analysis/review disabled: no new implicit approval requirement
  and no approval-triggered notification for an unapproved automatic publication.
- Once per ticker activation/publication cycle per recipient/channel, not once
  per edited draft or approval retry. A genuinely new later activation can notify.
- Push and email are independent, off by default. Users choose them under the
  existing Account Notifications Push and Email category lists. Label: `Watchlist`.
  Use existing save controls, device permission/subscription, verified email and
  unsubscribe flows. Preserve Select all semantics and other preferences.
- Do not add a Watchlist Discord-DM setting or alter the existing channel post.
  Do not silently add a new in-app alert stream as a side effect of implementation.
- Push title: `YFOR added to the Watchlist`. Body: `A new Watchlist post is ready.
  Open YFOR to view the analysis and levels.` Clicking opens `/watchlist/YFOR`.
  Native push uses one destination; do not promise two independently clickable links.
- Email subject: `YFOR added to the TradersLink Watchlist`. Body: `A new
  Watchlist post for YFOR is ready.` Links: `View YFOR` and `View Watchlist`.
  Substitute the validated ticker, not owner-edited HTML or arbitrary URLs.
- Neither channel includes the analysis image, attachment, current-price claim,
  AI-generated synopsis, or another AI request. Email uses the existing verified
  notification-email sender and opt-out controls.
- Notification failures never undo approval, hide the ticker, or block Discord.

## Confirmed source boundaries

Platform current inspected production: `65e74ea499fac4d848a27d60de9e17142d117ac1`.
The working copy is mixed; all release deltas must be reconciled on the exact
coordinator parent, not copied wholesale.

- Account UI: `app/(dashboard)/account/notification-preferences.tsx` and actions.
- Shared category/kind contracts: `src/modules/platform/contracts/platform-notification-contracts.ts`.
- Existing notification repository creates an in-app receipt and queues push and
  remote delivery. Do not reuse it blindly: ordinary creation adds an unwanted
  in-app item and remote categories currently include Discord DM.
- Existing push subscription/encryption and email-address confirmation/delivery
  services are the transport building blocks. The press-release push repository
  demonstrates a separate event queue and membership-scoped recipients.
- Notification tables have category CHECK constraints. A migration is needed
  if extending those tables; no historical migration may be edited. The exact
  new migration ID must be reserved by Coordinator before writing its manifest.
- Runtime approval: `approveTradersLinkAiReadForWebsite` and saved review delivery
  ledger in the canonical levels-system-post-mtf-handoff-stability runtime.
  Platform generic ingest also receives frequent market-data patches; those
  patches are NOT proof of a fresh owner approval.

## Implementation contract

1. Inspect current transport contracts and choose the smallest durable dedicated
   Watchlist event/recipient queue compatible with existing transport services.
   Keep user/channel consent separate from device subscriptions. If shared
   category tables are extended, explicitly exclude Watchlist from Discord-DM
   preference validation/rendering and in-app notification listing/unread counts.
2. Persist the explicit approval intent in the existing authenticated Platform
   owner proxy before forwarding approval. Snapshot opted-in recipients there.
   Reconcile against the runtime's existing durable review ledger through its
   authenticated read API: require the matching owner/draft/new approval revision
   AND its website acknowledgement, even if the Discord portion fails. This
   replaces the initially proposed new runtime outbox and callback endpoint:
   existing durable evidence suffices, avoiding runtime or Discord changes.
   Poll only newly recorded pending intents, never scan historical Watchlist adds.
3. Platform accepts the event idempotently. Fan-out must survive a crash mid-batch
   and use stable event/user/channel/device keys. No startup scan or historical
   backfill that sends existing Watchlist entries on rollout. Duplicate event
   delivery cannot re-enroll people who opted in after the event.
4. Target active users with appropriate Watchlist access and explicit channel
   consent. Recheck consent, access, public visibility, confirmed email/device
   state at claim/send. Do not expose private pending tickers. A hidden global
   Watchlist suppresses new member notifications. Reuse the Watchlist access
   policy, not press-release roles or analyzer account scope.
5. Process bounded batches on the existing single-writer runtime. Respect
   provider retry hints, expiration, idempotency support and uncertain-send
   handling. Document delivery semantics honestly; database deduplication alone
   does not guarantee exactly-once external receipt after a network timeout.
6. Keep recipient eligibility fixed at event processing and cap delivery age so
   an outage does not send obsolete day-trading posts days later. Record expired,
   opted-out, inaccessible and failed states separately; finalize exact age and
   retry constants during technical QA before enabling the worker. Delivery expires
   one hour after website acknowledgement; unresolved approval intents expire one
   hour after the request. At most five sends; 30-second exponential retry bounded
   at 15 minutes, respecting push Retry-After and remaining lifetime. Workers run
   every 15 seconds with process overlap guards; review polling backs off 30 seconds
   and handles at most three intents per pass. Push TTL cannot exceed event lifetime.
7. Preserve encrypted credentials/addresses/subscriptions; logs and owner audit
   show safe channel counts, timing, outcomes and retry state, never secrets.
8. Update Watchlist and Account notification Help. Maintain these documents and
   narrow local commits. No new provider configuration unless inspection proves
   the existing configuration cannot serve this feature.

## QA before release

- Push-only, email-only, both, neither; default-off and existing-user upgrades.
- Existing categories, Select all, email verification and device enable/disable.
- Pending/failed generation, edits without approval, repeated approval, changed
  draft, website failure/retry, Discord failure/retry, new activation, cancellation.
- No historical rollout blast; duplicate event/restart/mid-fan-out recovery.
- Opt-out/access removal/global visibility off before dispatch; multiple devices;
  deleted accounts; invalid ticker/destination; cross-user isolation.
- No images in either payload; email contains both approved links; push opens
  the correct ticker. No AI calls, no altered Discord payload or lifecycle.
- Missing email/push configuration, throttling, provider failures, expired device,
  ambiguous timeout, bounded retry and expiration. Event failure cannot fail the
  owner's existing publication operation.
- Focused offline tests first, then immutable build/migration rehearsal at the
  checkpoint. No broad repeated suites or local preview servers.
- Coordinator owns production migration/deploy sequence and rollback. Real
  delivery acceptance targets only explicitly authorized test recipients; never
  opt ordinary users in or send mass test notifications. Provider acceptance is
  not proof of receipt: verify email inbox/device notification separately.

## Initial plan QA

The first QA identified and incorporated: accidental Discord-DM/in-app expansion,
generic-ingest false triggers, Discord-coupled delivery, retry duplicates, rollout
backfill blasts, late opt-in enrollment, revoked access, one-link push limitations,
uncertain external delivery, and retention/expiration. Before UI implementation,
confirm exact existing placement and approved label/message copy with the owner.
