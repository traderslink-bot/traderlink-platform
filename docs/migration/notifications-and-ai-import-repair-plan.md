# Notifications And AI Import Repair Plan

**Status:** Owner-authorized implementation in progress

**Progress record:** [Notifications And AI Import Repair Progress](notifications-and-ai-import-repair-progress.md)

**Remote delivery follow-on:** [Notification Remote Delivery Activation Plan](notification-remote-delivery-activation-plan.md) replaces the deferred Discord-only activation work with one shared Discord-and-email delivery system for existing Platform notifications.

**Follow-on coverage implementation:** [Notification Coverage Expansion Plan](notification-coverage-expansion-plan.md) records the owner-approved 2026-08-18 expansion for AI Review readiness, Data Decisions, Moomoo reauthorization, and quiet automatic-sync behavior. Its progress record names the remaining visual and hosted-activation gates.

## Goal

Give every TraderLink user one clear place to see completed work and anything
that needs attention. Add a privacy-safe, user-authorized AI repair path when a
statement cannot otherwise be imported.

The feature is local and host-neutral until the separate hosted go-live
decision supplies the durable worker host, OpenAI API project, bot credentials
and deploy/retry authority.

## Owner-approved product decisions

- The dashboard header has a bell with an unread count. It opens a concise
  notification panel; **View all notifications** opens the full Notifications
  page. Notifications are not a permanent left-navigation item.
- Account Settings owns notification delivery preferences.
- Discord DM is the first optional away-from-dashboard delivery method. Users
  choose which notification categories can send a DM.
- A failed statement shows this first option:

  > Your statement is not yet supported, so the import failed.
  >
  > Allow AI to review your statement so TraderLink can configure it for a
  > successful import. Your statement remains private to your TraderLink
  > journal. AI processing is used only to complete this import.

- That same dialog includes an optional **Send me a Discord DM when this import
  is complete** choice. Declining AI review falls back to the existing
  privacy-safe header/layout observation path; raw statement data is not sent
  to AI.
- When an AI repair completes, the original held attempt is retried. Existing
  Journal facts are never rewritten.

## In-scope notification sources

1. Weekly and monthly AI Reviews becoming available.
2. Moomoo execution-import completion or a user-actionable failure.
3. The final after-session Moomoo candle/chart update.
4. Statement import configuration, completion and user-actionable failure.

The first release does not add email or browser-push delivery.

### AI Review notification activation

- Weekly and monthly review notifications are a paid-feature delivery only.
- Their event wiring may be built locally, but in-app and Discord delivery
  remains inactive until the AI Reviews production go-live plan has configured
  real paid entitlement, provider, scheduler health, delivery controls and the
  Admin master switch.
- A review notification is emitted only after an entitled user has one exact
  issued review. Scheduler summaries, queued work, failed entitlement checks
  and unavailable provider configuration never become user-ready messages.

### Moomoo notification eligibility

- A quote-only/free Moomoo connection may receive the final chart-update
  notification only when the user has eligible Daily Trade Tracker analysis
  work and the final candle reconciliation completes.
- Moomoo execution-import notifications require an active `trade:read`
  connection, at least one authorized trading account, an explicit link to the
  selected Journal account and an actual durable import job. A quote-only
  connection never receives execution-import notifications.
- Neither notification reveals broker account identifiers, execution values or
  candle values. Each links to the relevant Tracker chart or Import History.

## Integrity, privacy and delivery rules

- Notifications are owner/workspace scoped, immutable in meaning and may carry
  only plain-language, privacy-safe labels and opaque destinations. Never put
  statement values, broker identifiers, raw execution data, provider tokens or
  internal failure codes in an in-app notification or DM.
- An unread/read state is user-specific. Marking a notification read never
  changes the underlying import, review, connection or candle result.
- Discord delivery is opt-in by category. Delivery failures do not remove the
  in-app notification and are retried only within a bounded, auditable policy.
- AI review of full statement bytes requires the user’s explicit, purpose-bound
  consent. The ordinary failed-import header/layout observation remains the
  no-consent path.
- The AI repair worker may produce a candidate adapter/template only after it
  creates synthetic test evidence and proves a complete private preview of the
  original held import. It must not persist real statement values in Git,
  fixtures, notifications or ordinary logs.
- Automatic hosted repair/deployment is disabled until the production worker,
  source-vault, OpenAI retention configuration, bot, deployment authority,
  budget and rollback controls are separately configured and accepted.

## Implementation slices

### Slice 1 — Notification foundation and dashboard UI

- Add the Platform-owned notification/event and delivery-preference contract.
- Add account/workspace-scoped repositories, read models and private APIs.
- Add header bell/panel, full Notifications page, read/unread controls and
  Account notification preferences.
- Update the migration progress and this progress record while work proceeds.

### Slice 2 — Existing event sources

- Emit notification events from completed AI Reviews, Moomoo execution import
  lifecycle and final candle refresh only where their current result contracts
  prove an exact user-visible completion.
- AI Review notifications are emitted from the per-user issued-review result,
  never from a cron aggregate.
- Keep AI Review notification delivery inactive until the linked paid-feature
  go-live controls are configured and accepted.
- Moomoo import notifications are emitted only when the durable job transitions
  to `completed` or terminal `failed`, never per fetched page.
- The current Moomoo analyzer performs its final reconciliation at 4:15 AM
  America/New_York on the following morning. It creates a newer immutable
  market-session version and does not change Journal facts. Its worker is
  currently development-only, so the event is wired only after the hosted
  scheduler exists.

### Slice 3 — Discord delivery

- Add a server-only Discord delivery adapter, category preferences, bounded
  retry state and a safe failure fallback.
- Keep bot credentials and all Discord subject identifiers server-only.
- Do not activate delivery until the configured production Discord bot and
  hosting environment are available.

The local feature saves per-category user choices and the per-import completion
request only. It does not attempt a Discord API call, store a bot token, or
claim that a DM worker exists before host activation.

### Admin operations surface

Add a bounded Notifications section to Journal Administration with only
privacy-safe operational controls:

- provider readiness (configured, unavailable or paused), last successful
  delivery time and aggregate recent delivery/retry/failure counts;
- one global delivery pause/resume control for incident response;
- aggregate queue health and stuck-job visibility for AI import repair;
- aggregate category controls that determine whether a product category is
  eligible for delivery after its own product gates pass.

The Admin surface never stores or displays a Discord bot token, raw Discord
subject, direct-message body, statement content, broker identity or a control
to send an arbitrary user DM. Bot secrets are configured only in the selected
host's secret store after local feature completion.

### Slice 4 — AI statement import repair

- Add the failed-import consent dialog and durable repair-job state.
- Reuse the existing private support-source and import-attempt contracts; do
  not create a second statement store.
- Build the server-owned agent contract: inspect only the consented source,
  create a parser candidate plus synthetic fixture, run a private preview,
  publish the exact result and retry only the original held attempt.
- Emit progress/completion notifications through the shared foundation.

### Slice 5 — Hosted activation and acceptance

- After the owner selects the persistent host, configure the host-side worker,
  OpenAI API project/data controls, Discord bot secret, controlled deployment
  authority, spend limits, monitoring, backups and rollback.
- Run the agreed focused verification and final owner visual review before the
  feature is activated for users.

## Current shared-checkout coordination

The notification foundation requires a new migration. Existing unrelated work
currently owns uncommitted migration `0052` and the shared migration manifest.
This feature must wait for that migration to settle before it allocates its
next global number or edits the manifest. Isolated planning and non-migration
work may continue; no existing migration is modified or absorbed.

## Explicit exclusions

- No email or browser-push notifications.
- No automatic order actions, broker write scopes or changes to existing
  imported Journal facts.
- No retention of unconsented failed statement bytes.
- No claim that a production Railway/OpenAI/Discord integration is active
  before those external resources are provisioned and verified.
