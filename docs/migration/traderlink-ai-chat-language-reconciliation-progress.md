# TraderLink AI Chat Language Reconciliation Progress

## Status

Complete — all 417 inventory entries are reconciled with the current AI Chat
capability surface. This record does not reopen the 20-category source
definitions or claim that a recognized future capability is live.

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
| Reconcile every canonical entry and representative language evaluation | Complete | Every entry has an exact mapped-live, current-runtime-missing, source-unavailable, or evaluation-only disposition; all 13 live capability families have non-empty mappings and 24 contract-validated representative fixture records |
| Strengthen generator and test guardrails | Complete | The focused test fails for count/disposition drift, an unmapped or duplicate live family, a missing canonical route, an invalid fixture kind, a missing/unknown factual tool, or an action-kind mismatch with the canonical contract |
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

## Full 417-entry audit checkpoint

The generated registry has 417 canonical entries. The completed audit
classifies 239 entries as mapped to at least one live bounded family, covering
235 distinct canonical names through 774 exact family associations. The other
178 entries remain explicitly classified: 136 exact concepts are not exposed
by a current factual-tool or confirmed-action contract, 32 retain a locked
Unavailable boundary, and all 10 Category 20 records are evaluation metadata
rather than user capability routes. No entry is left unclassified.

A mapping is intentionally not a support count: one canonical term may safely
route to more than one bounded family while its source status remains
unchanged. The compact runtime registry groups each canonical term once by its
exact family set instead of repeating common language under every family.

The nine factual-read fixture records identify exact factual-tool names. Their deduped
union must equal the 34 names in `coachAiChatFactualToolRegistry`, with neither
missing nor unknown names. The action-draft contract intentionally exposes its
12 top-level extraction kinds as a discriminated TypeScript union rather than a
runtime list; the focused test reads that union's top-level branches and
requires the 12 action fixtures to match it exactly. This is validation of
language coverage metadata, not invocation of a deterministic language router,
provider, factual tool, or action.

Some current product feature nouns—such as Notifications, Imports, Data
Decisions, Candle Review, Workspace, and account plan/access—are not separate
canonical names in the locked 417-entry source. They are represented by the
live-family descriptions and contract-validated fixture metadata. No invented
canonical entries were added to make the counts look larger.

The planned `evaluate_rule` intent maps only to the current factual read of
saved deterministic Trading Rule outcomes. It does not map to confirmed
product changes, recommend a rule, or let the model judge a rule outcome.

| Live capability family | Kind | Canonical mappings | Representative fixture coverage |
| --- | --- | ---: | --- |
| `closed_trade_facts` | Factual read | 111 | `runtime-closed-trades-summary` |
| `daily_tracker_drafts` | Confirmed draft | 27 | `runtime-daily-tracker-draft` |
| `manual_execution_drafts` | Confirmed draft | 31 | `runtime-manual-execution-draft` |
| `review_delivery_draft` | Confirmed draft | 19 | `runtime-ai-review-delivery` |
| `journal_period_context` | Factual read | 54 | `runtime-journal-period-context` |
| `saved_ai_review_follow_up` | Factual read | 39 | `runtime-saved-ai-review-follow-up` |
| `product_help` | Factual read | 23 | `runtime-product-help` |
| `current_dashboard_journal_reads` | Factual read | 77 | `runtime-dashboard-journal-reads` |
| `current_dashboard_analytics_reads` | Factual read | 145 | `runtime-dashboard-analytics-reads` |
| `current_product_status_reads` | Factual read | 39 | `runtime-product-status-reads` |
| `saved_trade_analyzer_reads` | Factual read | 79 | `runtime-saved-trade-analyzer` |
| `trading_rule_and_tag_reads` | Factual read | 75 | `runtime-rules-tags` |
| `confirmed_product_changes` | Confirmed draft | 44 | 12 fixtures: reporting currency, notification read, account selection/creation, Swing note, position type, notification preferences, AI Review setting/request, trade tags, Trading Rule, and Data Decision |

### Category audit totals

| Category | Entries | Mapped live | Not exposed now | Source unavailable | Evaluation only |
| --- | ---: | ---: | ---: | ---: | ---: |
| `01-intents.md` | 27 | 20 | 7 | 0 | 0 |
| `02-metrics-profit-loss.md` | 22 | 15 | 5 | 2 | 0 |
| `03-metrics-outcomes.md` | 17 | 9 | 8 | 0 | 0 |
| `04-metrics-edge-quality.md` | 13 | 2 | 11 | 0 | 0 |
| `05-metrics-fees-costs.md` | 10 | 1 | 5 | 4 | 0 |
| `06-metrics-position-size.md` | 14 | 4 | 6 | 4 | 0 |
| `07-metrics-time-duration.md` | 19 | 11 | 8 | 0 | 0 |
| `08-metrics-execution.md` | 19 | 7 | 12 | 0 | 0 |
| `09-metrics-behaviour.md` | 21 | 10 | 11 | 0 | 0 |
| `10-metrics-candle-analytics.md` | 18 | 6 | 10 | 2 | 0 |
| `11-dimensions.md` | 111 | 66 | 25 | 20 | 0 |
| `12-operators.md` | 11 | 9 | 2 | 0 | 0 |
| `13-date-time-language.md` | 9 | 7 | 2 | 0 | 0 |
| `14-comparison-ranking-language.md` | 29 | 11 | 18 | 0 | 0 |
| `15-context-conversation-language.md` | 18 | 18 | 0 | 0 | 0 |
| `16-trader-terminology-slang.md` | 15 | 13 | 2 | 0 | 0 |
| `17-ambiguity-language.md` | 17 | 14 | 3 | 0 | 0 |
| `18-response-preferences.md` | 6 | 5 | 1 | 0 | 0 |
| `19-language-policies.md` | 11 | 11 | 0 | 0 | 0 |
| `20-evaluation-suite.md` | 10 | 0 | 0 | 0 | 10 |
| **Total** | **417** | **239** | **136** | **32** | **10** |

The final focused checks ran with one worker after the mapping and independent
documentation review:

1. `npx.cmd tsx src/scripts/generate-coach-ai-chat-language-registry.ts`
   — generated 417 classified entries.
2. `npx.cmd vitest run src/modules/coach/server/coach-ai-chat-language-inventory.test.ts --reporter=dot --maxWorkers=1`
   — passed the one focused file and its exact mapping/tool/action guards.

## Recommended runtime-progress wording

Use this wording in the concurrently maintained runtime progress record; it is
provided here rather than editing that record:

> The AI Chat language reconciliation classifies all 417 locked entries. It
> maps 239 entries (235 distinct canonical names) to all 13 current bounded
> factual-read and confirmation-draft families and leaves 178 exact entries
> explicitly unavailable, not exposed by current contracts, or evaluation-only.
> The 24 contract-validated fixture records identify all 34 factual tools and
> all 12 confirmed action kinds. This does not claim execution of a language
> router or provider, promote future concepts, or weaken raw-statement,
> privacy, market-data, advice, account-scope, or confirmation boundaries.

## Unresolved product decisions

The 178 deliberately unmapped entries are not missing language work. Their
generated audit reasons identify the required runtime/product boundary before
they may become live. Existing product-excluded and safety-protected boundaries
remain decisions for their owning runtime plans:
guarded Moomoo connection/import changes, raw statements and credentials,
arbitrary market data or signals, autonomous mutations, deletion/erasure,
billing/authentication changes, and owner administration.
