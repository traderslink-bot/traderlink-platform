# Notification Remote Delivery Activation Plan

**Status:** Owner-approved implementation in progress

**Extends:** [Notifications And AI Import Repair Plan](notifications-and-ai-import-repair-plan.md)

**Progress record:** [Notification Remote Delivery Activation Progress](notification-remote-delivery-activation-progress.md)

## Goal

Make every existing Platform notification capable of reaching the trader through
the remote channels selected in Account Preferences:

1. Discord direct message; and
2. email sent from `notifications@traderslink.pro` through Resend, with replies
   directed to `support@traderslink.pro`.

The in-app notification remains the permanent, user-scoped record. Remote
delivery is an additional delivery attempt, never a replacement for the
dashboard record.

## Required outcome

- Replace the current one-off statement-import Discord call with delivery for
  every eligible Platform notification category.
- Add email as an equivalent category-based delivery channel, using the same
  notification event, recipient scope, idempotency and delivery state.
- Store an account-owned notification email address separately from Discord
  identity and protect it from other users and ordinary Admin views. The
  address is confirmed from the same Account Notifications settings flow before
  it can receive app notifications, primarily through a one-click opaque link
  with a short-code fallback.
- Use a durable delivery queue with bounded retry, success/failure state and a
  provider-safe error summary. Do not call Discord or Resend directly from an
  event writer.
- Add one authenticated scheduled delivery route that processes both Discord
  and email work. A failed remote delivery leaves the in-app notification
  intact.
- Keep all outgoing content limited to the existing notification title,
  summary and an allowlisted dashboard link. Never send Journal facts,
  statements, broker identifiers, account identifiers, tokens or internal
  errors.

## Delivery design

### Shared queue

Add a new versioned Platform migration only after the current shared migration
slot is clear. It will add:

- the user-owned notification email address and its protected delivery state;
- email category preferences alongside the existing Discord and Web Push
  preferences; and
- immutable notification-delivery attempts keyed by notification, channel and
  recipient, with bounded retry scheduling and provider result state.

The migration must not reuse or edit existing notification migrations. It must
preserve the in-app read receipt and the existing Web Push delivery records.

### Discord

- Create one worker that claims due Discord attempts, resolves the current
  Discord identity server-side, and sends a single generic direct message with
  the Platform notification link.
- Respect the saved Discord category preference for every Platform
  notification category.
- Retire the special statement-import-only sender after its behavior is covered
  by the shared worker.

### Email

- Use Resend's server API with a Railway-only `RESEND_API_KEY`, sending from
  `TradersLink Notifications <notifications@traderslink.pro>` and replying to
  `support@traderslink.pro`.
- Send a concise HTML and plain-text message containing the notification title,
  summary and dashboard link.
- The email worker uses the same queue, retry policy and audit evidence as
  Discord; it does not create a parallel notification system.

### Operations

- The existing Notifications Admin surface receives aggregate delivery health.
  It never exposes recipient addresses, Discord subjects, message bodies or
  provider secrets, and it has no arbitrary-send control.
- The first release adds no arbitrary owner broadcast or send-anything tool.
  This scope is delivery of the app's existing user-specific notifications.

## Implementation order

1. Reserve a clear Platform migration number without absorbing concurrent
   migration work.
2. Add the durable delivery and email-preference model plus scoped repository
   contracts.
3. Route every `PlatformNotificationRepository.create` event into the queue.
4. Implement the Discord and Resend delivery adapters and the shared scheduled
   worker.
5. Update Account Preferences and the existing Notifications Help content.
6. Run focused disposable-database, adapter and route checks; then verify the
   hosted queue with safe test notifications before enabling user delivery.

## Boundaries

- No notification data, email address or Discord identity is exposed across
  users or to the public site.
- No remote provider key appears in code, logs, Git or the Admin UI.
- No delivery attempt can duplicate a notification merely because a worker,
  browser or scheduled invocation retries.
- Existing in-app notifications continue to work if Discord, Resend or the
  scheduler is unavailable.
