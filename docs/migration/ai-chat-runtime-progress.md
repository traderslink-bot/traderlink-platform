# AI Chat runtime progress

## Status

Implemented locally as a server-only saved-question orchestration slice. This
supplements the controlling [AI Companion Plan](ai-chat-plan.md), the complete
[language plan](traderslink_ai_chatbot_complete_language_plan.md), and the
existing Chat persistence/provider-control records. It does not authorize a
route, UI, provider call, migration, Journal write, manual entry, deployment,
or entitlement change.

## Completed in this slice

- A strict stored answer contract: direct answer, one to four supporting
  observations, optional honest limitation, optional next question, and
  evidence references that must resolve to saved deterministic-tool calls.
- A dispatcher over only the four implemented closed-trade factual tools. It
  preserves returned coverage, unavailable states, limitations, revisions, and
  current notes/tags. It records exact request/result snapshots and fails if
  their combined serialized result exceeds 72 KB; no result is shortened.
- A direct OpenAI AI SDK adapter that reads `OPENAI_API_KEY` server-side only,
  uses the immutable provider/model/pricing snapshot on the reserved attempt,
  permits only the four deterministic tools, and performs at most two factual
  tool steps followed by one structured-answer step. This permits a bounded
  sequential lookup without allowing open-ended tool loops.
- Reservation includes the bounded history and question, the maximum factual
  result budget twice (its repeated inclusion in the two later model steps),
  bounded history/question repeats, and a separate 32 KB allowance for the
  real system contract, all four tool schemas, structured output, and all three
  model steps. The complete reserved representation remains below the
  provider-control 256 KB input guard. Actual recorded usage/cost is checked
  against that immutable reservation before completion.
- The generation service verifies scope before all work; atomically appends a
  user message, creates its pending assistant, and reserves the provider
  attempt; marks the attempt started immediately before a provider call; and
  atomically records either the completed answer/snapshot/receipt or a
  failure/receipt state. SQLite transactions do not remain open during the
  external call.
- Account-scoped retry digests are read before a new message is appended. The
  same conversation/question reuses its existing pending, completed, failed,
  or blocked attempt. Reuse for another conversation or question fails closed.

## Important retry boundary

If a provider call finishes but the final receipt/attempt validation cannot be
persisted atomically, the transaction intentionally rolls back, leaving the
assistant pending and the attempt started. A retry with the same digest returns
that pending attempt and does not begin a second provider call. This slice does
not claim automatic recovery of an answer that was received but could not be
saved; safe reconciliation/owner-operational handling remains a later
explicitly designed boundary.

## Verification

- Focused one-worker tests use fake injected generators/tools for success,
  factual snapshots, no-tool answers, pre-provider cap blocking, failures with
  and without usage, receipt mismatch rollback, duplicate retry, scope denial,
  bounded history, reservation overhead, and privacy-safe errors.
- No test invokes OpenAI. No dependency was installed or downloaded.
