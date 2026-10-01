# Watchlist level editing and optional category notifications

Owner approved September 30, 2026. No deployment or live sends authorized in this slice.

## Complete controlling inventory

1. Standard upside rows: Insert above/below, Move up/down, optional Sort by price. Price, label and explanation stay together. Apply equivalent controls to simple-analysis upside areas; preserve existing limits and remove/add controls.
2. Row operations preserve every other unsaved field and hidden-section selection. Preserve existing close/navigation unsaved-edit warning. Never auto-sort during typing.
3. Include a supported breakout price once in the ordered Where it could go next route, clearly labelled Breakout level, while retaining the separate breakout section. No invented levels, no new AI calls, no approval restrictions; respect subsequent owner edits.
4. Category move defaults to placement only. Optional unchecked Move Discord post and notify users identifies the destination by name. Preserve analysis, review cycle, original posted date/price, Potential Gain, notes and pending edits; do not generate AI.
5. Opted-in move: destination category Discord post explicitly says ticker moved; retain appropriate audience/link behavior and send opted-in push/email. Remove source-category Discord messages only after destination delivery is confirmed. No deletion/reposting of Free Chat or X.
6. Durable operation identity and delivery receipts prevent duplicate posts/notifications on retries. Deletion failures stay visible and retryable independently. Missing destination webhook still allows placement change and gives a clear delivery-unavailable result.
7. Handle same-category no-op, not-yet-published ticker, repeated click/lost response, rapid subsequent move, shared category channel, and listing-only ticker without triggering analysis publication.
8. Update Help, checkpoint/progress and narrow allowlists. Focused offline checks at a complete slice; no broad build/server/real notifications without an authorized acceptance checkpoint.

## Checkpoints

- A: complete locally — editor controls and breakout route consistency.
- B: complete locally — durable optional move delivery and source-message cleanup, with matching UI.
- C: focused source/integration QA complete; coordinator release handoff prepared. Hosted delivery and owner visual acceptance remain post-deployment boundaries.

## Plan QA

Reuse the existing unsaved-close warning instead of adding another dialog. Avoid inferring old-channel messages from ticker alone: source channel and saved receipt identity must match. Freeze destination and published content per operation; later moves must not rewrite earlier receipts. Same-channel moves must never delete the newly posted message. An unapproved draft is never the move message source. Notification failure must not undo a successful category move or trigger an AI request.

Implementation progress: [tracker](watchlist-editor-and-category-move-progress.md).

## Owner follow-up: notification context and admin workflow audit

- The later TNON example supersedes the proposal to remove analysis-update price comparisons. Retain original and updated analysis reference prices and percentage change for actual analysis updates, including manually approved image posts and automatic updates. These are saved analysis prices, not a current live quote. Preserve analysis history and Potential Gain independently.
- Distinguish move-only announcements from actual analysis updates. Move-only Overnight Watches copy identifies the next trading session without implying a new analysis. If a new analysis is also published as part of a move, identify both actions and retain the analysis price context. Do not treat an unchanged previously approved analysis as newly generated solely because it moved.
- Audit indirect interactions: pending analysis during moves/removals; destination of later updates; remove/re-add identity; source Discord cleanup; Free Chat/X independence; saved edits versus frozen approved images; settings and selections surviving polling. Report confirmed bugs separately from optional product suggestions.
- Owner's subsequent instruction to proceed authorizes the proposed per-ticker grouping: review/publish and associated choices first, grouped move controls next, secondary generation/visibility/social/retry actions under More actions, Remove/Deactivate separated. Preserve all existing controls and mobile usability. Final visual acceptance remains outstanding.
