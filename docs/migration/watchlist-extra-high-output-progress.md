# Extra High Watchlist response allowance

Owner approved 2026-09-26. Follow-up to the [closed-market plan](watchlist-closed-market-analysis-plan.md); independent of closed-market admission.

## Scope and plan QA

- Both saved GYGY Extra High responses returned HTTP 200, status incomplete, reason max_output_tokens. Each used all 16,000 output tokens for reasoning and produced no visible answer. High completed with 15,062 output tokens (12,948 reasoning).
- Raise the request allowance to at least 32,000 only for xhigh. Preserve larger configured allowances and other efforts. Use the same policy for full and simple formats and for whichever primary/fallback request selects xhigh.
- Simple format previously inherited a hardcoded 16,000 from its test request builder. Set its actual production request allowance explicitly too.
- Preserve packet, prompt, schema, owner review, notifications, model choice, fallback choice, provider settings and the existing request timeout. Do not turn on web search.
- Help reviewed: this internal allowance does not change a user workflow or add a control; no Help copy change required.
- Verify actual request-builder behavior offline at this coherent checkpoint. No paid call or deployment is needed to prove request construction; a live generation remains separate acceptance and may still encounter a timeout or need more reasoning.

## Progress

- Implementation complete in the assigned runtime source-selector checkout, parent 09602a3f36655d28ac31dade0da13eaf2a4061e1.
- Runtime commit: 9737cc42a1fba6ff21f6b7345855576c9d0216bd. Complete allowlist: `src/lib/ai/traderslink-ai-read-service.ts`, `scripts/verify-watchlist-output-allowance.cjs`. Runtime checkout clean after commit.
- Focused verification: 25 offline actual request-builder checks pass, covering both formats, all six efforts, larger configured allowance, web search off and the simple-review guard. Runtime diff whitespace check passes. Existing frozen primary/fallback construction continues to feed the selected effort to the shared builder; fallback orchestration is unchanged.
- Source implementation/checkpoint complete. No hosted settings changed; deployment and live-generation acceptance remain unverified. The 180-second request timeout is unchanged.

## Pricing research (not a feature change)

Official OpenAI pricing checked 2026-09-26: web search is USD 10 per 1,000 calls (1 cent each), plus search-content tokens at model rates and normal generated-output charges. GPT-6 Luna standard short-context rates are USD 0.10 input / 0.50 output per million tokens; cache writes have their own rate. One analysis may make multiple search calls. Web search remains off.

Sources: https://developers.openai.com/api/docs/pricing and https://developers.openai.com/api/docs/models/gpt-6-luna
