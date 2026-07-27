# Analytics Agent v1 Project Plan and Progress

## Product boundary

Analytics Agent v1 is the user-facing, deterministic consumer of the Trade
Execution Analytics Engine. It translates supported plain-English execution
questions into governed query plans and returns only engine-backed answers.
It does not read raw trade history, calculate metrics, give trading advice, or
infer market/candle/setup/exit-quality/planned-risk claims.

## Delivery sequence

1. **Foundation — complete on this branch.** Deterministic request and answer
   contracts, question router, capability-to-plan mapping, scope enforcement,
   bounded engine execution, unsupported responses, safe wording, and focused
   fixtures.
2. Execution Question Coverage — expand the supported inventory using only
   verified engine capabilities and governed presets.
3. Answer Quality and Evidence UX — richer display hints and evidence review.
4. Dashboard / Chat Integration — application service and rendering surface.
5. User Review Reports — daily, weekly, monthly, and custom reviews.
6. Guardrails and Final Hardening — representative, authority, and scale
   acceptance coverage.

## Foundation acceptance record

- Agent code lives in `src/lib/trader-intelligence-v3/analytics/agent` and is
  separate from `analytics/query`, `analytics/coach`, and `analytics/simulation`.
- The router is deterministic and model-free. It recognizes core performance,
  time, ticker, price, prior outcome, sequence, repeat attempt, giveback,
  fees, and data-quality questions.
- Every supported intent issues a content-addressed query plan to the existing
  read-only engine. The answer packet preserves plan, result, and execution
  receipt identities plus bounded evidence.
- The caller owner scope must exactly match the partition authority, and the
  caller account scope must be a non-empty partition subset.
- Market/setup, exit-quality, planned-risk, and unknown questions return a
  structured unsupported packet with the required data and a safe alternative.
- Fewer than three completed matching trades return `insufficient_sample` and
  retain the verified result rather than promoting a pattern.

## Current resume point

Foundation is complete and ready for review. The next product slice is broader
execution-question coverage; UI, chat/model routing, reports, market/candle
authority, and Coach behavior remain out of scope.
