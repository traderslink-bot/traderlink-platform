# AI Chat factual tools progress

## Status

Implemented locally on 2026-08-05 as a narrow, non-routed server contract slice. This record supplements the controlling [AI Companion Plan](ai-chat-plan.md) and [complete language plan](traderslink_ai_chatbot_complete_language_plan.md); it does not change either plan or authorize a visible product surface.

## Completed in this slice

- Immutable, versioned contracts for four deterministic tools: closed-trade summary, approved grouping, bounded closed-trade list, and one closed-trade detail.
- A machine-readable registry limited to the implemented factual tools and first-slice Journal Analytics metrics.
- Server-authoritative WorkspaceAccessScope and selected-account inputs. Tool requests cannot choose an account.
- Typed allowlists for metrics, grouping, date range, currency, factual filters, money basis, and table pagination.
- Grouped results are bounded to 100 groups. Broader results fail clearly and must be rerun with a shorter period or narrower filters; facts are never silently truncated.
- Direct forwarding of Journal Analytics result states, coverage, currency partitions, limitations, and fact-set revision without replacing unavailable values with zero.
- Trade detail from the canonical Journal fact set, ordered allocation facts, and the optional current trader trade note/tags. The retired technical-note field, source rows, and private identifiers are excluded.
- Indistinguishable `not_found` errors for cross-account and nonexistent closed-trade identifiers.

## Explicitly not included

- No route, UI, Chat persistence, migration 0029 table access, language inventory, provider call, model package, Journal write, raw statement access, arbitrary SQL, market/candle data, sample data, or V3 dependency.
- No sequence behavior, tag/rule/setup performance aggregate, simulation, unrealized/account-equity, raw-statement repair, or market/indicator capability. These remain unavailable until separately contracted and implemented.

## Verification

The canonical checkout passed eight focused one-worker tests for request validation, selected-account scoping, exact analytics response forwarding, unavailable states, grouping-result bounds, page bounds/cursors, generic missing-trade behavior, allocation ordering, optional notes/tags, and privacy-safe errors. Focused ESLint and `git diff --check` also passed. No dependency installation or download was needed.
