# TraderLink AI Chat Language Reconciliation Progress

## Status

Complete — focused reconciliation of the completed 417-entry language
inventory with the current AI Chat capability surface. This record does not
reopen the 20-category inventory or claim that a recognized future capability
is live.

## Purpose

The language inventory must describe the capabilities that the current Chat
runtime can actually read or route to a confirmation-gated draft. The prior
generated inventory was checked for digest, count, and minimum mappings, but
that check did not prove that each current live capability family had a
canonical language route and exercised representative evaluation coverage.

## Scope and file boundary

This reconciliation may change only:

- `docs/migration/traderslink_ai_chatbot_complete_language_plan.md`
- `docs/migration/traderslink_ai_language_inventory_master.md`
- `docs/migration/language-inventory/**`
- `src/scripts/generate-coach-ai-chat-language-registry.ts`
- `src/modules/coach/server/coach-ai-chat-language-inventory.generated.ts`
- `src/modules/coach/server/coach-ai-chat-language-inventory.test.ts`
- `src/modules/coach/server/coach-ai-chat-capability-registry.ts` when mapping
  metadata is required
- this progress record

Runtime, provider, action, UI, and API-route files remain out of scope because
they are under concurrent QA repair.

## Safety invariants

- Do not expose raw statements, secrets, identity internals, or account data
  outside the server-authorized account scope.
- Do not imply arbitrary market data, signals, trading advice, autonomous
  mutation, or tool execution.
- Keep draft and confirmation routes separate from writes. A confirmed action
  remains subject to its authoritative service validation.
- Preserve truthful `planned`, `unavailable`, and product-excluded states.

## Work plan

| Step | Status | Evidence required |
| --- | --- | --- |
| Inventory all live capability families and existing canonical mappings | Complete | 417 generated entries across all 20 category files audited against 34 factual tools, 12 action-draft kinds, and the current dashboard matrix |
| Reconcile canonical mappings and representative language evaluations | Complete | All 13 live capability families have non-empty canonical mappings and 24 validated representative fixtures |
| Strengthen generator and test guardrails | Complete | The focused test fails for an unmapped live family, a missing canonical route, an invalid fixture kind, a missing/unknown factual tool, or an action-kind mismatch with the canonical contract |
| Synchronize language-plan, master, and category status claims | Complete | All 20 category files carry a bounded reconciliation note; source statuses and product-excluded boundaries remain unchanged |
| Run focused generation and language-inventory checks | Complete | Generator completed and the one-file Vitest run passed with one worker |

## Required live-family coverage

The audit must account for current Workspace and latest AI Review; Daily and
Swing Trackers; Calendar annotations and review state; Analytics; explicitly
incomplete/versioned Trade Explorer; saved Trade Analyzer and Candle Review
facts; Imports; Data Decisions; Notifications; Account, Profile, Preferences,
and AI settings; privacy-safe Moomoo configuration state; Whop access/help;
rules and tags; saved AI Reviews including two-week reviews; and every
trader-confirmed Chat action.

## Completion evidence

The generated registry has 417 canonical entries, 65 entries with at least one
current-runtime mapping, and 96 mapping occurrences. The live-family evidence
is intentionally not a support count: one canonical term may safely route to
more than one bounded family while its source status remains unchanged.

The nine factual-read fixtures identify exact factual-tool names. Their deduped
union must equal the 34 names in `coachAiChatFactualToolRegistry`, with neither
missing nor unknown names. The action-draft contract intentionally exposes its
12 top-level extraction kinds as a discriminated TypeScript union rather than a
runtime list; the focused test reads that union's top-level branches and
requires the 12 action fixtures to match it exactly. This is validation of
language coverage metadata, not invocation of a router, provider, or action.

| Live capability family | Kind | Canonical mappings | Representative fixture coverage |
| --- | --- | ---: | --- |
| `closed_trade_facts` | Factual read | 33 | `runtime-closed-trades-summary` |
| `daily_tracker_drafts` | Confirmed draft | 4 | `runtime-daily-tracker-draft` |
| `manual_execution_drafts` | Confirmed draft | 2 | `runtime-manual-execution-draft` |
| `review_delivery_draft` | Confirmed draft | 2 | `runtime-ai-review-delivery` |
| `journal_period_context` | Factual read | 6 | `runtime-journal-period-context` |
| `saved_ai_review_follow_up` | Factual read | 4 | `runtime-saved-ai-review-follow-up` |
| `product_help` | Factual read | 2 | `runtime-product-help` |
| `current_dashboard_journal_reads` | Factual read | 9 | `runtime-dashboard-journal-reads` |
| `current_dashboard_analytics_reads` | Factual read | 10 | `runtime-dashboard-analytics-reads` |
| `current_product_status_reads` | Factual read | 5 | `runtime-product-status-reads` |
| `saved_trade_analyzer_reads` | Factual read | 5 | `runtime-saved-trade-analyzer` |
| `trading_rule_and_tag_reads` | Factual read | 6 | `runtime-rules-tags` |
| `confirmed_product_changes` | Confirmed draft | 5 | 12 fixtures: reporting currency, notification read, account selection/creation, Swing note, position type, notification preferences, AI Review setting/request, trade tags, Trading Rule, and Data Decision |

The focused checks completed with one worker:

1. `npx.cmd tsx src/scripts/generate-coach-ai-chat-language-registry.ts`
   — generated 417 entries.
2. `npx.cmd vitest run src/modules/coach/server/coach-ai-chat-language-inventory.test.ts --reporter=dot --maxWorkers=1`
   — 1 file and 3 tests passed.

## Recommended runtime-progress wording

Use this wording in the concurrently maintained runtime progress record; it is
provided here rather than editing that record:

> The AI Chat language reconciliation is complete. All 13 current bounded
> factual-read and confirmation-draft capability families have non-empty
> mappings to the locked 417-entry language inventory and validated
> representative fixtures, including the 12 confirmed action kinds. This does
> not promote future language concepts to live support, change source
> capability statuses, or weaken the existing raw-statement, privacy,
> market-data, advice, account-scope, and confirmation boundaries.

## Unresolved product decisions

None within this language-reconciliation scope. Existing product-excluded and
safety-protected boundaries remain decisions for their owning runtime plans:
guarded Moomoo connection/import changes, raw statements and credentials,
arbitrary market data or signals, autonomous mutations, deletion/erasure,
billing/authentication changes, and owner administration.
