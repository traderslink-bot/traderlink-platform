# Approved Watchlist notification progress

Plan: [full scope and QA](watchlist-approved-push-email-plan.md).

- [x] Owner approved push/email direction, independent Account preferences, no images.
- [x] Traced category contracts, preference UI, existing delivery and approval entry point.
- [x] Written plan and initial failure-mode QA.
- [x] Coordinator reserved `0137_platform_watchlist_publication_notifications`,
  exact predecessor `0136_shared_trade_analyzer_owner_exemptions` (source only).
- [x] Exact UI/message copy approved by owner; migration allocation confirmed.
- [x] Finalize durable approval intent/event/queue schema and transport integration.
- [x] Implement approval-ledger reconciliation, Platform delivery, consent and settings.
- [ ] Focused tests, Help, immutable build and migration rehearsal.
- [ ] Coordinator production release and controlled real-device/email acceptance.

Implementation started after the owner confirmed the exact control placement and
copy. Added the bounded approval-publication wire contract and exact push/email
copy builder. Dedicated Watchlist preferences and delivery storage will avoid
creating in-app bell receipts or Discord DMs through the generic notification
repository. Proposed delivery lifetime is one hour from website publication, with
at most five attempts; integration QA must verify transport TTL and retry bounds.
The Account Push and Email lists now include independent Watchlist choices in
local source, including Select all, existing save controls, authenticated actions
and confirmed-email requirements. Existing generic categories are unchanged.
Migration 0137 is registered in the production-parent manifest but not applied.
The owner proxy saves an intent before forwarding approval; the worker verifies
the matching owner/draft/new approval revision plus website acknowledgement from
the existing runtime ledger. This removes the need for a separate runtime outbox,
new secret or new callback endpoint. Pending intents survive restarts and capture
their recipient list before publication. Discord success is not required. Adds,
edits and retry-Discord paths never create intents. The delivery worker is now
connected to the existing hosted background-worker bootstrap. No hosted settings,
emails or pushes changed. Final immutable build/type checks and migration review
must pass before release; source alone is not hosted acceptance.

Focused checks passed:
- Wire contract: validated cycle/ticker/timestamps, exact approved copy, no extra
  payload fields, historical-event acknowledgement without stale delivery.
- In-memory store: default-off independent preferences, duplicate recipient
  suppression, replay does not enroll recipients, conflicting event rejection,
  atomic rollback after partial fan-out, new activation eligibility, expiration,
  foreign keys and immutable accepted events.
- Mocked end-to-end flow: explicit approval intent, no send before website receipt,
  send with no Discord receipt, repeated approval, opt-out and cancellation.
- Mocked email: both links plus settings link, no images, stable idempotency key,
  unsafe-link rejection, unchanged ordinary email output and retryable throttling.

Operational bounds: 15-second guarded workers, three approval checks per pass
with 8-second read timeout and 30-second next check; ten deliveries per pass,
10-second transport timeout, five attempts and one-hour lifetime. Email uses
the existing Resend sender and idempotency keys. Push reuses encrypted device
subscriptions, VAPID and the installed service-worker payload; the cycle tag
reduces duplicate display after an uncertain retry but cannot prove exactly-once
external receipt. Provider acceptance is not device/inbox receipt proof.

Release: Platform-only (runtime stays unchanged). Apply only reserved 0137 after
guarded 0136 predecessor/backup checks. Retaining 0137 in the verifier is required
for a code rollback after application; do not deploy an old manifest against the
new database. No backfill; migration creates empty tables and defaults are OFF.
No public user opt-ins or live test sends are part of these offline checks.

Shared-file pre-edit blobs (needed to preserve newer production push diagnostics
when reconciling only this feature's delta):
- Account notification UI: `5d5ba7ecd7d9575f2a36a8d72e88646bf9b750ad`.
- Account notification actions: `a8576efaf5366c272b3413c62c962f133b6245a4`.
- Account preferences page: `759d7582bd5e9320acff0fa459620fae9457529e`.

Confirmed parents: Platform `65e74ea499fac4d848a27d60de9e17142d117ac1`;
runtime `94728c8101ba8f32d53de1f00c4b61ff0619d1ea`.
