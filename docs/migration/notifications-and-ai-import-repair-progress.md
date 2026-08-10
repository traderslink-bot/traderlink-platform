# Notifications And AI Import Repair Progress

**Status:** Local implementation and owner UI review complete; hosted activation deferred

**Controlling plan:** [Notifications And AI Import Repair Plan](notifications-and-ai-import-repair-plan.md)

## 2026-08-10 owner authorization

- The owner approved implementation through final integrated UI review.
- The approved dashboard pattern is a header bell, compact panel, full
  Notifications page and Account Settings delivery preferences.
- Discord DM is the first optional delivery channel. Email and browser push are
  out of scope.
- The approved failed-import consent wording and optional per-import Discord DM
  choice are recorded in the controlling plan.
- No production host, OpenAI API project, Discord bot, secret, deployment,
  source-vault configuration or user statement has been accessed or changed.

## 2026-08-10 completed local implementation and owner UI approval

- [x] The owner approved the integrated UI after the header bell, compact
      notification panel, full Notifications page, Account Settings delivery
      preferences, failed-import AI-consent dialog and Journal Administration
      Notifications page were assembled.
- [x] `0053_platform_notifications` adds immutable, privacy-safe in-app events,
      per-user read receipts and Discord category preferences. `0054_journal_ai_import_repair`
      adds durable, account-scoped repair jobs without a second statement store.
- [x] Regular statement-import commits and terminal Moomoo import jobs create
      idempotent in-app events. The repair worker emits private progress,
      completion and actionable-failure events.
- [x] The repair worker reads only a purpose-consented support object, requests
      a structured mapping with provider storage disabled, validates it, proves
      a private preview, then retries only the original held attempt. Existing
      Journal facts are never rewritten.
- [x] The OpenAI worker route is fail-closed and disabled until all of the
      explicit host settings are present. It has not made an API request.
- [x] `git diff --check` passed. Targeted ESLint passed with zero errors; one
      unrelated existing unused-prop warning remains in the import screen.
- [x] Empty disposable initialization applied migrations `0001` through `0054`,
      including both new migrations, with schema digest
      `09126121a9b95d0a94008ad9de5389f0b08a18ee9b5715f5cdaddc9c5a971d3b`.
      The temporary database was removed after the check; the real Journal
      database was not opened or changed.

## 2026-08-10 Help Center follow-up in progress

- [x] Added the owner-requested **Notifications and imports** Help Center
      collection using the existing collection, article, navigation, search and
      responsive-layout templates.
- [x] Drafted three plain-language guides: **Notifications**, **Discord
      notifications**, and **When a statement will not import**. The copy avoids
      internal implementation language and gives a manual column-mapping choice
      alongside the private statement-review choice.
- [ ] Resume with a low-resource source review and the existing focused Help
      checks, then present this small Help collection for owner approval. Do not
      change the already-approved notification/import UI, activate Discord or AI
      processing, deploy, or absorb concurrent work.

## 2026-08-10 event-source audit

- [x] AI Reviews: per-user issuance is the notification source; cron aggregate
      completion is not a user notification.
- [x] Moomoo imports: notify only when a durable import job becomes completed
      or terminally failed, not for individual pages/ranges.
- [x] Moomoo final candle update: the current final reconciliation occurs at
      4:15 AM America/New_York the following morning. It is a market-session
      update only and does not change Journal facts. Its runner is currently
      development-only, so it is not a production notification source yet.
- [x] Existing statement imports: terminal attempt transitions already provide
      the exact success and user-action failure boundary. AI repair needs its
      own durable nonterminal job state.
- [x] No existing notification center, Discord DM sender, delivery preference
      or user-notification persistence exists.
- [x] Migration `0052` was committed separately at `47f320d1`; this feature
      owns and adds `0053_platform_notifications` without modifying `0052`.

## 2026-08-10 Moomoo notification eligibility

- [x] A free/quote-only Moomoo connection is eligible only for the completed
      final chart-update notification, and only when it has eligible analyzer
      work.
- [x] Automatic Moomoo execution-import notifications require `trade:read`, an
      authorized trading account, explicit Journal-account linking and a real
      durable import job.

## 2026-08-10 AI Reviews paid-feature boundary

- [x] AI Review notification events are planned but delivery remains inactive
      until the existing paid-entitlement, provider, scheduler-health,
      delivery-control and Admin-master-switch go-live plan is configured and
      accepted.
- [x] Only an issued review for an entitled user may generate a notification.

## 2026-08-10 owner-approved admin boundary

- [~] A privacy-safe Notification operations page is added to Journal
      Administration with aggregate in-app and repair-job health plus explicit
      inactive delivery readiness. Global/category controls remain fail-closed
      until a delivery worker exists.
- [x] Discord bot credentials, direct-message content and raw Discord subjects
      remain server-only and outside every Admin response.

## Slice status

- [x] Slice 1 - Notification foundation and dashboard UI (the `0053` platform
      notification, receipt and preference records are added; scoped reads,
      read-on-open behavior, the header panel, full page and Account Settings
      preference controls are wired locally.)
- [x] Slice 2 - Existing event sources (successful Journal statement imports
      and Moomoo durable terminal jobs now create idempotent in-app events.
      Paid AI Review and development-only chart reconciliation remain explicitly
      inactive until their existing product go-live conditions are met.)
- [ ] Slice 3 - Discord delivery
- [x] Slice 4 - AI statement import repair (the failed-import consent dialog,
      opaque attempt reference, existing support-source consent, durable queued
      repair job, disabled-by-default OpenAI structured-output provider, private
      preview, original-attempt retry and safe progress/completion/failure events
      are wired. The worker cannot run until host-side consent acknowledgement,
      provider credentials and explicit enablement are separately configured.)
- [ ] Slice 5 - Hosted activation and final acceptance

## Current next step

Hosted activation is a separate owner-controlled release task:

1. Choose and provision the persistent Railway runtime and volume; run the
   registered migrations there and configure backups/monitoring.
2. Configure the private source vault outside the repository and test consent
   expiry/purge behavior before accepting real statement repair.
3. Create the OpenAI API project, spending limits and server secret; explicitly
   acknowledge the selected data controls, choose the repair model, and enable
   `TRADERLINK_PLATFORM_AI_IMPORT_REPAIR_ENABLED` only after a synthetic
   end-to-end repair proves preview and original-attempt retry behavior.
4. Create and connect the Discord bot, retain its credential only in Railway
   secrets, implement the bounded DM delivery/retry worker, and connect the
   saved category/per-import opt-ins. Never add arbitrary-send or secret views
   to Admin.
5. Add the paid-entitlement gate before emitting AI Review notifications, and
   add the final Moomoo chart-update event only when its hosted scheduler exists.
6. Complete focused worker/delivery tests and a hosted failure/rollback rehearsal
   before making any notification or AI-repair processing available to users.
