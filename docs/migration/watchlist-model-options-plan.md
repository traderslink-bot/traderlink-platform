# Watchlist model options — 2026-09-24

Owner approved the narrow scope in this task. Progress: [record](watchlist-model-options-progress.md).

## Complete scope
- Retain GPT-5.6 Luna and Terra; add GPT-6 Luna and Sol with full version labels.
- Offer None, Low, Medium, High, Extra high, Max; all four models document these efforts.
- Carry exact model/effort through settings persistence, restart, admin validation, service request and audit types.
- Update prospective standard token cost estimates; preserve historical recorded costs and explicit operator overrides.
- Keep current defaults and persisted selections, prompts, packet, output limits, review/publishing, notifications and web-search settings unchanged.
- Keep single-request behavior; no paid automatic fallback added.
- Update Help and perform focused offline settings/request/price/UI checks. No broad tests, local server, deployment or paid request in this slice.

## QA / release boundary
Use immutable source parents supplied by Coordinator, never absorb mixed checkout files. Verify all 24 model/effort combinations, invalid values, legacy settings reload, unchanged unrelated settings, request fields and cached/uncached pricing. Source/model compatibility is not a claim of paid quality evaluation. Coordinator owns release; prior model remains selected until owner changes it. Before rollback from a new-model selection, restore an old supported selection or preserve settings for forward recovery.

## Sources
Official model pages read September 24, 2026:
- https://developers.openai.com/api/docs/models/gpt-6-luna
- https://developers.openai.com/api/docs/models/gpt-6-sol
- https://developers.openai.com/api/docs/models/gpt-5.6-luna
- https://developers.openai.com/api/docs/models/gpt-5.6-terra

Plan QA: no defaults migration, no request multiplication, no rewriting historical ledger, no unsupported GPT-6 Terra label. Long-context pricing above 272K input tokens must be accounted for in new estimates.
