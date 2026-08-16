# AI Chat runtime progress

## Status

The local AI Chat runtime is implemented against the complete current-dashboard
capability matrix. This supplements the controlling
[AI Companion Plan](ai-chat-plan.md), the
[current dashboard capability matrix](ai-chat-current-dashboard-capability-matrix.md),
and the complete
[language plan](traderslink_ai_chatbot_complete_language_plan.md).

The live-provider technical checkpoint is complete. Production Chat remains
off because the platform control is deliberately disabled and its production
request, token and spend caps have not been selected. Enabling those settings
is an owner launch decision; it is not permission to copy a credential from
another application or bypass the control.

## Implemented runtime

- The official OpenAI Agents SDK over the Responses API owns one bounded
  manager-agent loop. Private-content tracing and provider response storage are
  disabled.
- Account-scoped conversations retain bounded history, exact deterministic
  factual snapshots, immutable usage/cost receipts, safe retries and private
  original messages. Operational records and logs contain no full chat text.
- The deterministic dispatcher covers the current Journal, Tracker, Analytics,
  saved Trade Analyzer/Candle Review, Import, Data Decisions, Notifications,
  Account, Help, AI Review, Trading Rules and Trade Tags read families recorded
  in the capability matrix.
- The cumulative factual-result ceiling is 48 KB. Provider reservation includes
  its repeated use, bounded history/question/context, expanded tool schemas and
  structured output while remaining below the immutable 256 KB input guard.
  Oversized results fail closed and are never silently shortened.
- Every supported write begins as an account-scoped, expiring preview. Manual
  executions, notes/focuses, Swing changes, tags, Trading Rules, bounded Data
  Decisions, notifications, reporting currency, Journal account changes and AI
  Review settings/requests use their canonical command only after explicit
  confirmation. Generation itself performs no product mutation.
- The global responsive drawer and `/ai-chat` direct route reuse the same Chat
  surface. Drawer navigation preserves the trader's current dashboard route.
- Trade Explorer is intentionally isolated behind its current versioned adapter
  because that product feature is incomplete and will be updated.

## Retry boundary

If a provider call finishes but the final receipt/attempt validation cannot be
persisted atomically, the transaction intentionally rolls back, leaving the
assistant pending and the attempt started. A retry with the same digest returns
that pending attempt and does not begin a second provider call.

## 2026-08-16 verification

- Seventeen focused Chat files cover conversation persistence, routes,
  deterministic tools, dashboard/page context, saved Analyzer reads, action
  drafts, privacy redaction, provider controls, generation budgeting and the
  locked language registry and privacy-safe paid-plan Help. The final
  no-provider acceptance population is 100 tests with one worker and no file
  parallelism; the separately gated live test is skipped by default.
- Action-draft route and service checks directly cover account-scoped listing,
  mutation-request enforcement, empty-body confirm/reject, extra-field
  rejection, no-write rejection, 24-hour expiry and stable terminal retries.
  The Agents SDK adapter also checks its exact exposed tool-name inventory
  against the deterministic registry before a provider request.
- Controlled no-worker browser checks passed on desktop and a 390 by 844 mobile
  viewport. The drawer opened and closed without leaving `/workspace`; the
  direct page loaded the same conversation surface; no browser console errors
  were observed.
- `verify-coach-ai-chat-live-provider.ts` plus its opt-in Node-only Vitest entry
  passed five synthetic cases through the actual OpenAI Agents SDK and
  `gpt-5.6-sol` Responses runtime in 28.4 seconds. It verified grounded account
  facts, a grounded follow-up, manual execution extraction, a confirmation-only
  action draft, unsupported-advice refusal and complete usage accounting under
  a $2 caller-supplied ceiling. The verifier exposes no key or private Journal
  content and opens no platform database.
- No project dependency or lockfile changed. No protected database mutation,
  product action, server start, push or deployment occurred. Production Chat
  remains disabled pending owner-selected caps and launch activation.
