# Links AI Chat quality feedback plan

## Purpose

Give the owner a private, durable queue of every Links AI Chat answer that a
trader flags as unhelpful and every saved generation that cannot produce an
answer. This is quality telemetry for improving Links, not a trader-facing
support ticket system.

## Approved product contract

- Each completed Links answer has one quiet **Not helpful** link at the bottom
  left of its answer bubble. It is intentionally a small text action, not a
  reaction count or a disruptive rating prompt.
- A trader flag creates one immutable quality case for that answer. Repeating
  the action returns the existing case and changes the link to **Flagged**.
- Automatic cases are created for a failed or blocked saved answer, and for a
  deterministic answer whose result is explicitly unavailable or empty. An
  automatic case never waits for the trader to flag it.
- Each case snapshots the triggering user question and answer plus up to six
  saved messages before and six saved messages after it when those messages
  exist. The snapshot records original order, role, display-safe text,
  generation state and timestamp. It is capped at thirteen messages and
  remains immutable even if a conversation is later archived.
- The case also stores the account/workspace scope, conversation and message
  references, selected analysis scope, generation source, model/attempt and
  safe failure code when available. Raw provider prompts, credentials,
  unbounded tool results and internal account identifiers are excluded.
- A case creates an idempotent private in-app notification for the one Journal
  owner administrator. The notification links to the owner-only quality queue;
  web-push delivery may use the existing opt-in mechanism but is never required
  for the durable in-app notification.
- `/admin/journal/links-quality` is owner-administrator-only. It lists open
  cases first, lets the owner review the captured context and metadata, and
  records a resolved/dismissed outcome without altering the original report.

## Implementation slices

1. Add the migration, typed contracts and scoped quality-case repository.
   Extend the notification contract safely for the new Links quality category.
2. Record automatic cases from Links generation terminal states and provide the
   trader-scoped flag route. Both paths share one idempotent capture service.
3. Add the small completed-answer action, saved state refresh and private owner
   queue/detail UI. Add the owner navigation entry.
4. Verify account isolation, owner-only access, immutable bounded context,
   idempotency, failure capture, notification creation and the exact UI copy.

## Boundaries

- The owner can review private trader conversation excerpts only through the
  existing `journal_owner_admin` authority. A workspace role, paid access or a
  user-supplied identifier never grants access.
- The capture path does not retry a provider request, write Journal facts,
  reveal factual-tool payloads, modify relationship memory or change a Chat
  answer.
- The feature is intentionally not an automatic model-training export. Any
  later external quality-evaluation export requires a separate privacy and
  owner-approval decision.
