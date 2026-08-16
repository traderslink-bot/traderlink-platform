# AI Chat runtime progress

## Status

The local AI Chat runtime is implemented against the complete current-dashboard
capability matrix. This supplements the controlling
[AI Companion Plan](ai-chat-plan.md), the
[current dashboard capability matrix](ai-chat-current-dashboard-capability-matrix.md),
and the complete
[language plan](traderslink_ai_chatbot_complete_language_plan.md). The focused
whole-feature result is recorded in the
[AI Chat Complete QA Report](ai-chat-complete-qa-report.md).

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

Provider calls have a two-minute abort boundary. A pending generation that
outlives its ten-minute lease is reconciled to a failed terminal state within
the same user, workspace, Journal account and conversation before generation
retry or message-history display. The client polls while an answer is pending
and prevents a second send until that attempt becomes terminal. The same
idempotency digest never starts a duplicate provider request.

The digest binds the normalized question, selected analysis scope, trusted
Daily Tracker context and reduced current-page hint. The current-page value is
strictly allowlisted and is a conversational navigation hint only; it is never
factual evidence or action authority.

## Language and evidence reconciliation

- All 13 current bounded factual-read and confirmation-draft capability
  families have non-empty mappings to the locked 417-entry language inventory.
- Representative fixtures name their exact expected tools. Their deduplicated
  union equals all 34 deterministic factual tools, and the confirmation
  fixtures equal all 12 canonical action-draft kinds.
- Completed assistant answers may display at most four compact evidence cards
  derived from their immutable factual snapshot. Digest, account, conversation
  and message scope are verified; only allowlisted internal routes can be
  linked. Raw IDs, hashes, secrets and untrusted links are suppressed.
- Future language concepts remain unavailable until their deterministic
  service exists. In particular, rule recommendations remain planning-only and
  Trade Explorer remains an incomplete versioned adapter.

## 2026-08-16 second whole-feature QA

- The complete current product inventory was audited again: 13 live capability
  families, 34 deterministic factual tools, 12 confirmed action kinds, current
  dashboard routes and aliases, saved Analyzer/Candle facts, Help, account
  scope, privacy-safe Moomoo status and the 417-entry language reconciliation.
- Paid provider usage can no longer be stranded when an invalid derived draft
  fails after generation. Derived content rolls back, the assistant and attempt
  fail terminally, and the actual usage/cost receipt is preserved. A true
  receipt/reservation integrity mismatch still fails closed and is not
  converted into an ordinary provider failure.
- Pending-answer polling now refreshes messages and every supported
  confirmation collection together, so execution, Daily Companion, review
  delivery and product-action cards do not require a reload after an
  idempotent or cross-request completion.
- The final no-provider, one-worker regression passed 161 tests across 26
  files, with only the opt-in paid-provider file/test skipped. Focused lint and
  the full no-emit TypeScript check passed. The one initial resource-timing
  timeout was isolated, passed alone, and disappeared in the final full run
  with a ten-second per-test boundary.
- Controlled desktop and 390 by 844 mobile browser checks reopened the shared
  drawer from `/workspace`, preserved that route, exposed a visible close
  action, loaded the direct `/ai-chat` surface and completed all scoped read
  requests without browser warnings or errors. The no-worker review server was
  stopped afterward.

## 2026-08-15 verification

- The final focused Chat suite covers conversation persistence, routes,
  deterministic tools, dashboard/page context, saved Analyzer reads, action
  drafts, privacy redaction, provider controls, generation budgeting,
  interrupted-attempt recovery, display-safe evidence, the locked language
  registry and privacy-safe paid-plan Help. The separately gated live test is
  skipped by default. The final one-worker run passed 160 tests across 26
  files, with only that one live-provider file and test skipped.
- Targeted ESLint and the full no-emit TypeScript check passed after the
  integrated QA fixes.
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
- No project dependency or lockfile changed. No protected Journal mutation,
  confirmed product action, provider request, push or deployment occurred. The
  controlled no-worker review server was stopped after browser acceptance.
  Production Chat remains disabled pending owner-selected caps and launch
  activation.
