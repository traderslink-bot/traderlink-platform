# AI Chat Complete QA Report

## Status

Complete for the current locally implemented TraderLink Platform product
surface. Production activation, production caps, entitlement rollout, and
provider operations remain owner launch decisions. The accepted Trade Explorer
Sort/Rank and completed-trade Review slice was reconciled into its isolated
versioned Chat adapter on 2026-08-18. Advanced comparison studies remain an
unavailable future product dependency.

This report closes the focused whole-feature QA run governed by the
[AI Companion Plan](ai-chat-plan.md), the
[current dashboard capability matrix](ai-chat-current-dashboard-capability-matrix.md),
the [runtime progress record](ai-chat-runtime-progress.md), and the
[language reconciliation record](traderlink-ai-chat-language-reconciliation-progress.md).

## 2026-08-18 Trade Explorer capability follow-up

- The isolated Trade Explorer tool now uses the accepted page result families.
  Individual Trades accept only factual row sorts and bind the selected order
  to the bounded cursor. Trading Days, Tickers, Entry Times, Holding Time,
  Position Size and Periods accept only their current grouping and supported
  Rank by metric, with unavailable values kept last inside each required
  currency/timezone partition.
- Win/loss/flat remain explicit Result filters. Population metrics cannot
  become individual-trade sorts, and grouped requests do not return or imply a
  separately sorted supporting-trade list.
- One exact confirmed completed trade's saved annotation read now links to its
  Trade Explorer Review workflow. Chat does not receive a combined Review
  mutation; the editor retains one atomic Save, stale/account checks and
  read-only preset results. Existing Chat tag proposals retain their expiring
  preview and explicit confirmation.
- The AI Chat Help guide, runtime capability registry, current-dashboard
  matrix, parent plan and progress records were reconciled without changing
  unrelated product families. The runtime capability contract is now v3 and
  the factual-tool contract is v2; historical immutable answer snapshots are
  preserved rather than replayed as current requests.
- Repository instructions prohibited Vitest and other test-runner execution
  for this slice. The updated contract fixtures compile; targeted ESLint, the
  full no-emit TypeScript check and diff/static checks pass. No provider call,
  Journal write, browser server, push or deployment was performed.

## Audited product coverage

- One private account-scoped conversation surface shared by the global
  desktop/mobile drawer and the `/ai-chat` page.
- The 13 current bounded factual-read or confirmation-draft capability
  families in the runtime registry.
- All 34 deterministic factual tools and all 12 confirmed action-draft kinds.
- Daily Tracker assistance, natural-language manual execution drafts, saved AI
  Review follow-up, review scheduling changes, Journal reads, Analytics,
  Imports, Data Decisions, Notifications, Account settings, privacy-safe
  Moomoo connection/import status, saved Trade Analyzer/Candle Review facts,
  Trading Rules, Trade Tags, Help, and bounded Trade Explorer reads.
- Conversation persistence, provider reservations, usage/cost receipts,
  retries, stale generation recovery, confirmation expiry, page context,
  evidence presentation, and Help language.

## Findings corrected

### Paid-answer terminalization

A valid paid provider answer could previously be rolled back and left pending
when a derived confirmation draft was rejected during final persistence. That
lost the actual usage receipt until lease recovery eventually marked the
attempt failed. Derived drafts are now validated and materialized before the
answer is finalized. If that bounded step fails, the answer and attempt reach
one failed terminal state and the immutable receipt still records the actual
provider usage and cost. Receipt-versus-reservation mismatches remain integrity
failures and still roll back without being misreported as an ordinary draft
failure.

### Pending confirmation-card refresh

The saved answer poll previously refreshed only conversation messages. A reply
that completed in another request could appear without its execution, daily
note, AI Review delivery or supported product-change confirmation card until a
page reload. While one answer is pending, the client now refreshes the message
and all four account-scoped draft collections together. A finished reply and
its required confirmation surface therefore arrive in the same polling cycle.

### Interrupted generation recovery

A generation that was interrupted after its attempt started could remain
pending indefinitely. Provider requests now have a two-minute abort boundary,
and account-plus-conversation-scoped reconciliation expires pending attempts
after a ten-minute lease. Reconciliation runs before idempotent generation
lookup and before message-history reads. The client polls a pending answer and
prevents a second send until that attempt reaches a terminal state.

### Factual evidence presentation

Completed answers now expose at most four compact, display-safe evidence cards
from the immutable saved factual snapshot. The service verifies the snapshot
digest and exact user, workspace, account, conversation, and message scope.
Only allowlisted current product routes can become links. Raw IDs, hashes,
unknown tools, untrusted links, raw statement data, credentials, and secrets
are never presented.

### Current-page conversation hint

The drawer and direct page now pass a strictly validated reduced pathname as a
conversation hint. It supports ordinary phrases such as “this page,” but it is
not factual evidence and cannot establish account scope, filters, dates, trade
state, results, permissions, or action authority. Unsupported, operational,
admin, malformed, encoded, query-string, hash, URL, traversal, and control-
character inputs fail closed or reduce to no hint.

### Retry identity

The generation idempotency digest now binds the canonical question intent,
analysis scope, trusted Daily Tracker context, and reduced current-page hint.
Reusing the same request identifier with materially different filters or
context cannot return an answer created for another population.

### Language-to-runtime coverage

The locked 417-entry language inventory is reconciled to every current live
capability family. Representative fixtures now name their exact expected
factual tools or action-draft kind. Focused guards require the fixture-tool
union to equal all 34 names in the factual-tool registry and require the action
fixtures to equal all 12 top-level kinds in the canonical action contract.
Future, unavailable, product-excluded, and safety-protected language was not
promoted to live support.

## Boundaries confirmed

- The official OpenAI Agents SDK uses the Responses API with provider response
  storage disabled and private-content tracing disabled.
- The server derives identity and selected Journal account scope. The model
  receives no database, filesystem, arbitrary network, raw statement, secret,
  credential, billing identity, or owner-administration access.
- Factual tools reuse canonical Journal and product services. The model does
  not calculate financial results from raw rows and cannot refresh market
  data. Analyzer and Candle Review reads use saved facts only.
- Every supported mutation remains a preview with an explicit trader
  confirmation, canonical command validation, stale-state protection,
  idempotency, and 24-hour draft expiry. The model cannot directly write.
- Moomoo coverage is privacy-safe status and Help only. Sign-in, OAuth,
  disconnect, linking, backfill, scheduling, and import-run changes stay in
  their guarded product UI.
- The complete 34-tool catalog remains available because Chat is a global
  companion and a trader may ask about another feature without navigating
  away. Tools are bounded and deterministic; current-page context is only a
  relevance hint.
- Ordinary operational logs do not contain original messages, full answers,
  raw Journal facts, secrets, or provider bodies. Private conversation content
  remains in its account-scoped record.

## Verification record

- The language generator produced all 417 locked entries.
- The focused language inventory suite passed three tests with one worker and
  proved exact 34-tool and 12-action coverage.
- The page-context suite passed 28 tests with one worker.
- The evidence and message-route suites passed 28 tests with one worker.
- The interrupted-generation recovery suite passed two tests with one worker.
- Targeted lint passed for the integrated runtime, API, UI, evidence, recovery,
  page-context, and Help files.
- The final consolidated one-worker Chat regression passed 160 tests across
  26 files. The opt-in live-provider file and test were the only skipped
  checks. Targeted lint and the full no-emit TypeScript check passed.
- A second independent whole-feature audit on 2026-08-16 rechecked all 13 live
  capability families, all 34 factual tools, all 12 confirmation-draft kinds,
  current routes and compatibility redirects, Moomoo privacy-safe status,
  account erasure coverage, provider privacy/cost controls, recovery, evidence,
  Help and the locked language mapping. Its final one-worker regression passed
  161 tests across 26 files; the opt-in paid-provider file and test were the
  only skipped checks. The full no-emit TypeScript check and focused lint also
  passed. One initial consolidated run hit a five-second timeout in a
  pre-existing AI Review schedule test under local resource pressure; that file
  passed alone and the unchanged full population passed with a ten-second test
  timeout. A fresh no-worker browser pass then verified the shared drawer on
  desktop and a 390 by 844 mobile viewport, direct `/ai-chat`, route
  preservation, all five scoped conversation/draft reads and a visible close
  action with no browser warnings or errors. The review server was stopped.
- The full working-tree whitespace check passed. Controlled no-worker desktop
  and 390 by 844 mobile checks opened and closed the drawer without leaving
  `/workspace`; the direct `/ai-chat` page showed the same Chat surface; no
  browser console errors were observed. The review server was stopped.

The opt-in live-provider evaluation is not repeated during this low-resource
QA pass. Its previously accepted synthetic Agents SDK run remains recorded in
the runtime progress document. No private Journal data or product mutation is
required for that verifier.

## 2026-08-16 post-audit remediation

A follow-up engineering pass corrected two issues found after the original QA
acceptance:

- Chat receipts, provider reservations and spend-cap accounting now preserve
  ordinary input, cached-read input, cache-write input and output usage as four
  separate price classes. Migration 0058 adds immutable rate snapshots and
  actual cache-token counts without inventing prices for the existing local
  configuration. Chat remains unavailable until all four prices are explicitly
  configured.
- The desktop companion is now wide enough for both conversation history and
  the active thread at a 1280-pixel viewport. Mobile remains a full-width,
  closable surface and opening Chat still preserves the dashboard route.

The controlling capability matrix was also rechecked against the current
dashboard. Selection Loop is not a current feature, `/reflection-loop`
redirects to AI Reviews, and the incomplete Analytics Lab routes redirect to
Analytics. They are intentionally excluded from Chat coverage rather than
being revived as AI capabilities.

The protected local database received migration 0058 only after a pre-migration
online backup, independent restore verification and disposable-copy rehearsal.
The focused cache verifier proved exact receipt cost, complete-price guards,
row preservation, schema columns, foreign keys and SQLite quick check both
before and after the local migration. No provider request, Journal mutation,
deployment or push was part of this pass. The repository instruction prohibited
running Vitest or another test runner; this follow-up used the dedicated
operational verifier, targeted static checks and controlled browser acceptance.
That browser pass confirmed an 860-pixel desktop drawer at 1280 by 720, a
full-width 390 by 844 mobile drawer, separate mobile conversation-list and Chat
close controls, direct `/ai-chat`, route preservation and no browser warnings
or errors. The no-worker review server was stopped afterward.

## Remaining launch and product boundaries

- Select and enable the production model, all four token prices (ordinary
  input, cached input, cache-write input and output), request/token/spend caps,
  entitlement, support, and monitoring settings.
- Keep Trade Explorer advanced comparison studies unavailable until their own
  deterministic query, factual coverage and evaluation contract is accepted.
- Implement the separately planned deterministic rule-recommendation service
  before Chat can read or explain saved recommendation evidence.
- Keep raw statement review opt-in and outside ordinary Chat context.

No deployment or push is authorized by this QA acceptance.
