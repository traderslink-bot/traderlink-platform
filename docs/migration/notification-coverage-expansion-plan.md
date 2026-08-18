# Notification Coverage Expansion Plan

**Status:** Local implementation and visual review accepted; hosted-only activation gates remain

**Extends:** [Notifications And AI Import Repair Plan](notifications-and-ai-import-repair-plan.md)

**Progress record:** [Notification Coverage Expansion Progress](notification-coverage-expansion-progress.md)

## Goal

Make sure TraderLink tells a trader when something finished that they were
waiting for, or when the trader needs to make a factual choice or reconnect a
service. Do not turn ordinary saves, background polling, or internal failures
into noisy alerts.

The existing bell, compact panel, full Notifications page, and Account
Settings delivery controls remain the approved UI baseline. This plan adds
coverage; it does not add a left-navigation item, email, browser push, or a
new notification surface.

## Audit result

The current Platform notification contract has four categories: AI Reviews,
broker imports, chart updates, and statement imports. It already creates
idempotent in-app events for:

- a completed statement import or an imported statement that needs review;
- a terminal Moomoo execution-import failure or completed job;
- AI statement-repair started, completed, or needing attention.

The following event writers are not yet present:

- an exact issued AI Review becoming ready;
- a newly opened Data Decision that was not already covered by an import
  notification;
- Moomoo reauthorization becoming required;
- the final Moomoo chart update after the hosted scheduler is available.

Automatic Moomoo sync is due every 15 minutes by default. The current
completion writer would notify for every completed incremental job, including
one that found no new trades. That is not acceptable notification behavior.

## Product rules

1. Every alert must answer one of two questions: **what is ready?** or
   **what do I need to do?**
2. In-app events are always retained in the trader's scoped Notifications
   page. Discord DM remains optional by category and remains inactive until
   the separate bot/host activation gate is accepted.
3. A notification contains only plain-language status and an allowlisted
   in-app destination. It never includes statement content, execution values,
   broker-account information, connection tokens, internal issue codes, or AI
   output.
4. Each event is idempotent from its durable source identity. Retries, page
   replays, refreshes, and reopening a page must not create another alert.
5. An import that both completes and opens Data Decisions produces one useful
   **needs attention** notice, not an import notice plus one notice per
   decision. A later, genuinely new decision from another workflow produces
   its own single Data Decisions notice.
6. We do not notify for a save the trader has just made on the same screen,
   successful background work with no new trader-visible result, transient
   retry attempts, admin-only health, or generic system errors.

## Coverage to implement

| Category shown in settings | When it is created | Plain trader wording | Destination | Discord eligibility |
| --- | --- | --- | --- | --- |
| AI Reviews | An entitled user's requested or scheduled review has one exact issued review record. | `Your AI Review is ready` / `Your weekly AI Review is ready to read.` | Saved AI Review | Opt-in after paid-feature and bot activation |
| AI Reviews | A review requested by an eligible user reaches its final retry outcome without an issued review. This is not created for disabled providers, inactive entitlement, or scheduler configuration gates. | `AI Review needs attention` / `We could not prepare this review. You can check your AI Review settings and try again.` | AI & plan | Opt-in after activation |
| Broker imports | A first-history or older-history Moomoo job completes, including a no-new-trades result because completion of that trader-requested job is useful. | `Broker import complete` / `Your requested broker import is ready in your journal.` | Import history | Opt-in after bot activation |
| Broker imports | An automatic incremental Moomoo job completes **and** accepted a new execution, matched a changed execution, or opened a new Data Decision. No alert is created for a no-change sync. | `New broker trades are available` / `Your latest broker trades are available in your journal.` | Import history or Data Decisions when review is needed | Opt-in after bot activation |
| Broker imports | A Moomoo job reaches terminal failure after its bounded retry policy. | `Broker import needs attention` / `Your broker import could not be completed. You can review the import and try again.` | Import history | Opt-in after bot activation |
| Broker connection | Refresh or execution access changes an active Moomoo connection to reauthorization required. One event is emitted for that state transition, not for every later failed poll. | `Reconnect Moomoo` / `Your Moomoo connection needs to be reconnected before TraderLink can continue updates.` | Broker connections | Opt-in after bot activation |
| Data Decisions | A command opens one or more new pending decisions and no import-result notification already covers the same transaction. This includes manual-versus-broker reconciliation and later deterministic findings. | `Data Decisions need your review` / `Some trade details need your confirmation before every affected result can be complete.` | Data Decisions | Opt-in after bot activation |
| Statement imports | Existing completion, needs-attention, and consented AI-repair lifecycle notifications. | Existing approved wording | Imports or Data Decisions | Existing policy |
| Chart updates | The next-morning final Moomoo candle reconciliation completes for eligible Daily Trade Tracker analysis, after its hosted scheduler exists. | `Your final chart update is ready` / `Your completed trade chart has its final session update.` | Relevant Tracker chart | Opt-in after scheduler and bot activation |

The existing Account Settings checkboxes gain two clearly named options:
**Broker connection** and **Data Decisions**. The other four labels stay as
approved: **AI Reviews**, **Broker imports**, **Chart updates**, and
**Statement imports**. This small visible change requires owner visual approval
before it is accepted.

## Deliberate exclusions

- No alert for a manual trade, note, rule, tag, setting, or Data Decision the
  trader just saved; the immediate screen confirmation is sufficient.
- No per-page Moomoo progress alert, no empty incremental-sync success alert,
  and no repeated connection-failure alert while reauthorization remains
  required.
- No notification for unresolved Decisions merely because time passed in the
  first release. The original actionable event stays visible in Notifications;
  a future reminder/digest needs separate owner approval and a hosted schedule.
- No alert for an unavailable AI provider, missing entitlement, budget guard,
  or scheduler-health gate. Those are fail-closed delivery conditions, not a
  trader-ready or trader-actionable result.
- No notifications for AI Chat replies, ordinary analytics refreshes, private
  Admin events, billing/webhook internals, or speculative rule ideas. Their
  current product surfaces already show the result, and a new alert would be
  misleading or noisy.

## Implementation slices

### Slice 1 — Extend the durable notification vocabulary

- Add `broker_connection` and `data_decision` categories plus the bounded
  kinds `broker_connection_reauthorization_required`,
  `data_decision_needs_review`, and `ai_review_needs_attention`.
- Add a new migration rather than editing immutable migration `0053`.
  Allocate its number only after the shared migration manifest is stable.
- Preserve account/workspace scope, receipt behavior, category preference
  defaults, and immutable event meaning. Existing preferences stay unchanged;
  the new Discord categories default off.
- Update the notification panel, full page, Account Settings labels, admin
  aggregate controls, AI Chat notification tools, and Help guides together.

### Slice 2 — Wire exact source transitions

- Emit the AI Review ready event in the server-owned issuance path only after
  an entitlement recheck and the immutable issued-review record are committed.
  Its idempotency key is based on the issued-review identity, never a cron run.
- Emit final eligible AI Review failure only after bounded retry resolution;
  use the review request identity as its idempotency key.
- Change Moomoo completion handling to read durable job kind and result counts:
  initial/older-history jobs notify once on terminal completion; incremental
  jobs notify only when a trader-visible change occurred. Keep terminal failure
  behavior and make Data Decisions take precedence as the destination.
- Emit one connection event as the repository changes active to
  reauthorization-required. A successful fresh authorization closes the
  condition in the connection UI; it does not create a congratulatory alert.
- Add a Journal-owned notification bridge at the command boundary that can see
  which pending decision IDs are newly opened. It must coalesce import-created
  decisions into the existing import notice and leave existing decisions alone.

### Slice 3 — Delivery and hosted gates

- Implement the already-planned bounded Discord delivery worker after the bot,
  persistent host, secret store, retries, pause controls, and audit model are
  accepted.
- Wire AI Review delivery only after paid entitlement, provider, scheduler
  health, delivery controls, and the Admin master switch are active.
- Wire final chart-update delivery only after its hosted scheduler and eligible
  Daily Trade Tracker result contract are live.
- Run a host-side failure/rollback rehearsal proving that a failed DM never
  deletes its in-app event and that an opt-out prevents remote delivery.

## Acceptance criteria

- One exact issued eligible AI Review creates one ready notification; retries
  and review reads create none.
- A large Moomoo history import creates one terminal result notification; a
  no-change 15-minute sync creates none; an incremental sync with new Journal
  facts creates one.
- A terminal import failure and a reauthorization transition each create one
  actionable notification without exposing provider details.
- Import-created Data Decisions are represented once. A later new manual or
  reconciliation Decision creates exactly one Data Decisions notice, while a
  resolved or pre-existing Decision creates none.
- All new events remain isolated to their user/workspace/account, use only
  allowlisted paths, default new Discord categories to off, and preserve
  existing in-app behavior if remote delivery fails.
- Owner reviews the two new Account Settings labels and the updated Help copy
  before the visible slice is accepted.

## Verification approach

Use synthetic disposable database cases and focused source checks only while
implementing: issuance/retry idempotency, all Moomoo job kinds and state
transitions, connection reauthorization deduplication, import/Data Decision
coalescing, category preference defaulting, and cross-account denial. Do not
open the private Journal database or activate AI, Discord, Moomoo, or a hosted
worker for this local implementation slice.

## Owner decision requested

The owner approved this coverage matrix, the two new Account Settings
categories, and the completed local implementation on 2026-08-18. The
implementation keeps empty 15-minute automatic sync completions quiet and uses
one combined notification when an import creates Data Decisions. The remaining
hosted-only activation gates remain in force.
