# Watchlist support heading

Owner approved replacing “Needs to hold” with “Support to watch” on September 27, 2026.

Completed locally: analysis card heading, inline editor heading, related legacy pullback explanatory reference, and focused rendering assertions. Internal needsToHold keys, prompts, calculations, stored prices and approval behavior are unchanged.

Help reviewed: watchlist-guides.ts has no matching old heading and needs no change for this label-only correction. Existing images remain unchanged.

September 27 owner explicitly authorized deployment. Exact Platform patch: watchlist-support-heading-platform.patch, SHA256 BF3ABFB4D71F7BD36CA01533FEE2C07723D0BCED4762883F10858BFB5D4708AE; three code/test files, five replacement lines, no unrelated dirty contents. Coordinator reconciles onto current main, not this checkout ancestry.

Runtime image heading, review-control headings and display-only normalization fallback are complete in commits 19ae4a37163653b075f31f26f7cbcd12b1913c82 and 4336910d3c0b5e559eafc3029a3e53b7d767550e, based on live 8a64efb64bd17066798b62c51441e77f1a7b5b91. Combined allowlist: src/lib/ai/watchlist-analysis-image.ts, src/lib/ai/traderslink-ai-read-service.ts, src/runtime/manual-watchlist-analysis-review-panel.ts. Four display string replacements. Prompt/internal keys and logic unchanged; checkout clean.

Verification: whitespace check passes. Two focused rendered-heading/hidden-section tests pass. Broader old visibility test file gives 9 pass and one failure expecting dilutionRisk editor to exist; that behavior is outside this label patch and was not changed. Initial test launch required borrowing the existing runtime TypeScript dependency through NODE_PATH; no install occurred. No builds, local servers, paid requests or notifications. Coordinator has immutable handoff and release authority; deployment confirmation pending.
