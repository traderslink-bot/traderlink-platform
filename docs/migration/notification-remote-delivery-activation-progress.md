# Notification Remote Delivery Activation Progress

**Status:** Owner-approved implementation in progress

**Controlling plan:** [Notification Remote Delivery Activation Plan](notification-remote-delivery-activation-plan.md)

## Confirmed starting point

- [x] Platform notifications are already durable, user-scoped in-app events.
- [x] Discord category preferences are visible and stored, but the ordinary
      notification path does not dispatch them.
- [x] Production has a Discord bot credential and the required Web Push
      configuration, but only a special statement-import completion path sends
      a Discord direct message today.
- [x] Platform identity has no stored notification email address and no Resend
      delivery path.
- [x] The delivery work will replace the one-off Discord sender with one queue
      shared by Discord and email, leaving in-app notification records intact.
- [x] Email delivery will send from `notifications@traderslink.pro`, reply to
      `support@traderslink.pro`, and use one in-settings address confirmation
      flow before notification delivery starts.

## Implementation underway

- [x] Added migration `0083_platform_notification_remote_delivery` with the
      protected email-address history, email category preference column and
      durable Discord/email delivery queue.
- [x] Added server-only generic Discord and Resend delivery adapters. They
      receive only notification-safe title, summary and dashboard destination;
      they never read or expose provider secrets.
- [x] Queue every new Platform notification for selected Discord and email
      delivery, and remove the statement-import-only Discord sender.
- [x] Added encrypted notification-email confirmation and email-category
      controls in Account Notifications, with a one-click email link and a
      short-code fallback.
- [x] Added the authenticated shared Discord/email delivery route with bounded
      queue processing and retry state.
- [x] Retries use deterministic provider idempotency: Resend delivery keys and
      Discord enforced nonces prevent a recovered delivery from creating a
      duplicate message.
- [x] Focused ESLint passes for the scoped notification files and a disposable
      empty-database initialization applied migrations through `0083`.
- [x] Railway now has the protected Resend sender key and the separate
      notification-email encryption key ring.
- [ ] Publish the scoped release and run the hosted user-scoped delivery
      checks.
- [ ] Run the hosted user-scoped Discord and email delivery checks.

## Current boundary

The implementation has reserved migration `0083` after the current remote
migration prefix. Required Railway configuration is present; the scoped commit
is being prepared against the exact remote parent.

## Next implementation checkpoint

1. Run the focused migration and delivery checks.
2. Commit only this feature's file allowlist.
3. Publish through the existing authenticated delivery schedule.
4. Exercise a safe user-scoped
   Discord and email notification.
