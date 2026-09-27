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

## September 27: GPT-6 Luna High allowance

Owner approved increasing High after the saved GYGY High read used 15,062 output tokens. The request builder now gives `gpt-6-luna` with `high` effort at least 32,000 tokens, preserving a larger configured allowance. Existing Extra High policy stays unchanged. Other models at High and all other efforts are unchanged. Both full/simple formats use the same request policy, including a fallback that explicitly selects this model/effort. No new retry or fallback is introduced.

Runtime commit: `8a64efb64bd17066798b62c51441e77f1a7b5b91`, parent `9737cc42a1fba6ff21f6b7345855576c9d0216bd`. Exact allowlist: `src/lib/ai/traderslink-ai-read-service.ts`, `scripts/verify-watchlist-output-allowance.cjs`. Runtime checkout clean after commit. Coordinator confirmed source ownership and queued the source-only handoff; hosted release remains held.

Completed source checkpoint: 73 focused offline request-builder assertions pass across three models, six efforts, two formats and two configured allowances, plus the review guard. Diff whitespace check passes. No paid AI calls, notifications, settings changes or hosted actions performed. Timeout remains 180 seconds. No Help update is needed for this internal limit change. Deployment is pending coordinator handling and applicable owner release authority.

## Pricing research (not a feature change)

Official OpenAI pricing checked 2026-09-26: web search is USD 10 per 1,000 calls (1 cent each), plus search-content tokens at model rates and normal generated-output charges. GPT-6 Luna standard short-context rates are USD 0.10 input / 0.50 output per million tokens; cache writes have their own rate. One analysis may make multiple search calls. Web search remains off.

Sources: https://developers.openai.com/api/docs/pricing and https://developers.openai.com/api/docs/models/gpt-6-luna
