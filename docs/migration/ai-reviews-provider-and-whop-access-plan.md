# AI Reviews Provider Acceptance and Whop Access Plan

## Status

Owner-authorized on 2026-08-09. The linked
[progress record](ai-reviews-provider-and-whop-access-progress.md) is the resume
state. This plan follows the accepted AI Reviews period, evidence, retry and UI
contracts; it does not redesign the Daily Trade Tracker or AI Chat.

## Accepted product contract

- A paid subscription grants AI Reviews to the TraderLink user and all active
  Trade Tracker accounts they are authorized to use. Each account still has its
  own On/Off, frequency and timing choices.
- The promised cadence is not a metered customer allowance. A qualifying
  account may receive its selected weekly or two-week review and its monthly
  review. Platform request, token and spend controls remain emergency safety
  controls, not customer-facing quotas; blocked work stays retryable.
- Whop is the first billing and subscription authority. Whop owns the product,
  price, trial and recurring billing period so TraderLink cannot drift from the
  amount shown at checkout. TraderLink Admin shows connection and access health,
  accepted Whop product identifiers and provider controls; it does not maintain
  a second price ledger.
- Monthly renewal follows the subscriber's own billing anniversary. A member
  who cancels at period end remains entitled through the paid period. When Whop
  deactivates the membership, new generation stops while every saved review
  remains readable in AI Reviews. Reactivation resumes future eligible work; it
  does not create duplicate reviews.
- A raw `payment.failed` notification is operational evidence, not by itself an
  entitlement revocation. Whop may retry it. `membership.deactivated` is the
  authoritative loss-of-access event.

## Phase A - controlled real-provider acceptance

- [x] Add one explicit-confirmation local runner for the approved v2 weekly,
  two-week and monthly provider contracts.
- [x] Read only the protected local development database and use only the
  existing `AIR..` fixture. Never save a generated acceptance review into the
  account or mutate provider/Admin controls.
- [x] Exercise execution-only, note-rich, incomplete-saved-note, prior-review
  continuity, two-week and exact-calendar-month evidence.
- [x] Prove a context-free single trade is rejected by the evidence gate without
  making a provider call.
- [x] Capture model, token usage, estimated cost and bounded fixture-only output
  privately; record only non-sensitive conclusions in the progress document.
- [x] Check every output against the supplied facts for invented numbers,
  unsupported recurring-pattern claims, prohibited advice and missing coverage
  limitations. Compare a lower-cost model only if it can materially reduce cost
  without weakening usefulness.

## Phase B - Whop entitlement foundation

- [x] Reserve a new migration only after confirming the shared migration number.
  Persist a versioned Whop membership projection, replay-safe webhook receipts,
  current entitlement state, billing-period boundaries, cancel-at-period-end
  state and privacy-safe identity-link evidence. Store no review content,
  payment-card data or customer email.
- [x] Validate Standard Webhooks signatures, timestamp freshness, event ID
  replay, company/product allowlists and event payloads before any write.
- [x] Accept `membership.activated`, `membership.deactivated` and
  `membership.cancel_at_period_end_changed`. Record `payment.failed` only as
  operational state; never revoke solely from that event.
- [x] Bind the signed-in TraderLink user to their Whop user through Whop OAuth
  2.1 with PKCE. Match the OAuth `sub` claim to the webhook projection through
  keyed privacy-safe references only. Never authorize by email, Discord social
  lookup or a user-supplied identifier, and never persist Whop access tokens.
- [x] Make the paid-access adapter read the current stored Whop projection for
  the authenticated Platform user. Fail closed when configuration, signature,
  product, identity link or membership state is unavailable or conflicting.
- [x] Keep issued reviews readable after deactivation and leave unstarted work
  pending without calling the provider. On reactivation, the existing
  idempotent coordinator may resume still-valid work.
- [x] Add Account subscription status and manage/checkout actions only after the
  entitlement contract is complete. Add Admin Whop connection, product,
  webhook and unmatched-link health without exposing customer identity.
- [x] Add an owner-only, paginated Whop API reconciliation path that reuses the
  replay-safe projection contract, stores aggregate run health only and never
  revokes access merely because a membership is absent from one response.

## Phase C - production AI configuration

- [x] Select the production model from measured acceptance quality and cost.
- [x] Record current official ordinary-input, cache-read, cache-write and output
  prices and require all four values before enabling provider work.
- [x] Configure the server-only provider credential.
- [x] Set the accepted USD 2.00 per-subscriber Whop paid-cycle safeguard across
  weekly, two-week and monthly AI Reviews. Keep daily request/token/spend limits
  as burst protection, the shared trailing-30-day amount as a non-blocking
  Admin warning and a separately configured emergency global stop as the only
  spend control that may pause every subscriber. AI Chat remains separate.
- [x] Run one end-to-end fixture issuance through reservation, provider call,
  immutable receipt and saved-review reopening. Reopening must make no call.
- [x] Keep the global Admin switch off until Whop access, provider configuration,
  scheduler readiness and launch checks are all green.

## Phase D - hosted activation and launch

Hosting, scheduler, production migrations, backups, observability, deployment
and activation remain governed by
[TraderLink Platform Live Launch Readiness](traderlink-platform-live-launch-readiness.md).
No work in Phases A-C authorizes deployment or customer activation.

## QA findings incorporated before implementation

1. Duplicating price and trial values in TraderLink Admin would create two
   billing truths. Whop remains authoritative; Admin manages the connection.
2. Revoking on the first failed payment would conflict with retryable Whop
   payments. Deactivation, not failure, changes entitlement.
3. Webhook order is not guaranteed. Every projection update must compare event
   time/version, remain replay-safe and support reconciliation from the Whop API.
4. Email and social-account matching are unsafe and mutable. The current Whop
   contract uses OAuth `sub` proof from the already authenticated TraderLink
   session, matched to signed-webhook state without logging raw identifiers.
5. Paid access belongs to the Platform user, while review cadence remains per
   Trade Tracker account. This prevents duplicate purchases without removing
   account-specific review choices.
6. Safety caps are still necessary for credential theft, loops and provider
   incidents, but must pause/retry promised reviews rather than silently discard
   them or act as a paid-plan quota.
7. The coordinator must evaluate paid access per Platform user. A global
   connector-health check cannot grant all accounts access merely because one
   paid membership exists.
8. Internal unresolved-record counters remain in the immutable TraderLink
   snapshot but are removed from the provider package. The model receives only
   a plain-language coverage limitation, never Data Decisions field names or
   codes.
9. The Account page keeps only three trader decisions: AI Reviews On/Off,
   weekly/two-week/monthly cadence, and weekly timing. Provider, calendar,
   payment, retry and safety controls remain Admin-owned.
10. Execution facts never require a completed Daily Trade Tracker review. All
    non-empty saved notes, tags and recorded rule results available when the
    evidence snapshot freezes may be used. Completion affects only whether the
    extra-time mode may start sooner.
11. A context-free single closed trade defers once into a two-week evidence
    period because it cannot support useful feedback alone. It is never
    discarded. Two closed trades, one trade with saved context, or substantive
    saved reflection evidence can support a review.
12. A daily spend cap limits a sudden loop or key-abuse burst but cannot contain
    one subscriber across a paid month. The accepted correction is a USD 2.00
    per-subscriber paid-cycle limit, using stored Whop renewal boundaries, plus
    a non-blocking global warning and a separately configured emergency global
    stop. The detailed correction is governed by the
    [AI Reviews Subscriber Safeguards and Review Presentation Plan](ai-reviews-safeguards-and-presentation-plan.md).

## Superseded budget-safeguard contract

The original shared hard-ceiling design below was implemented for initial
provider containment but is superseded by the subscriber-safe contract linked
above. It must not remain the normal launch behavior because one user's spend
could block unrelated subscribers.

- Store exactly one nullable trailing-30-day AI Reviews estimated-spend ceiling.
  Keep it Admin-only; traders never see it as a usage allowance.
- The master availability switch cannot be enabled while this ceiling or either
  cadence's existing daily request/token/spend limits are blank.
- Before every provider call, compare the new reservation's conservative maximum
  cost with the combined trailing-30-day weekly and monthly cost. Count actual
  immutable receipt cost within the rolling window for finalized provider work.
  Count the reserved maximum for every still-reserved or started call regardless
  of age, so an outstanding provider liability cannot age out before it starts;
  the guard remains safe without permanently overstating completed usage.
- A reached ceiling blocks before transmission, preserves the frozen request and
  remains retryable after the window advances or Admin deliberately changes the
  ceiling. Issued reviews remain readable.
- Persist no customer quota, payment data, provider key or private review content
  in this budget control.

## Acceptance boundary

The feature is provider-accepted when Phase A passes. It is paid-access complete
when Phase B is implemented and verified against signed Whop test events. It is
production-configured when Phase C passes. It is live only after Phase D is
separately accepted and activated.

The high-volume cost and payload follow-up is governed by the
[AI Reviews Monthly Cost Benchmark Plan](ai-reviews-monthly-cost-benchmark-plan.md).
The exact beta checkpoint and remaining hosted launch work are consolidated in
[AI Reviews Beta Handoff](ai-reviews-beta-handoff.md).
