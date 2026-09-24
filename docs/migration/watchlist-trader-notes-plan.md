# Per-ticker analysis choice and Trader notes

Owner approved September 23. Progress: [implementation record](watchlist-trader-notes-progress.md).

Checkpoint: local implementation and focused QA complete; hosted integration/acceptance not yet performed.

Owner-approved extension: General Watchlist in add/move controls and its own member/admin section. Tooltip: "Stocks being watched for potential opportunities, without a specific trading session or day-trade/swing-trade focus. Open a ticker to view available notes, analysis and price levels." Moving in either direction preserves notes, analysis and tracking time and does not generate analysis or notifications. September 23 owner authorized handoff for production once verified.

## Controlling scope

- Checked-by-default Generate analysis checkbox next to the activation symbol field. Checked preserves existing global/session controls; unchecked suppresses all automatic analysis calls for that activation, including after restart. Manual analysis remains available subject to existing generation configuration.
- Unchecked activation creates a private owner-review cycle regardless of session or global AI settings. It still prepares levels, quotes and indicators; no OpenAI request and no public listing/notifications until owner publication.
- My notes is a separate plain-text field, not the existing private Notes to send to OpenAI field. Drafts persist; no HTML execution or automatic mention expansion. Empty notes omit the member card.
- Row-level My notes editor allows saving drafts before listing and explicitly publishing changed notes after listing. Member card title: Trader notes. Preserve newlines and wrap long text. Notes updates alone do not send notifications.
- Publish ticker without analysis reuses the existing frozen listing approval/delivery flow. Notes are included in the frozen website snapshot; no analysis image. Notify users defaults on for the initial listing, with Discord/email/push honoring the selection.
- Later manual generation produces a private review draft, not a public analysis. Existing view/edit/approve and Notify users controls remain. Approval displays the analysis alongside any already-published notes, without leaking a newer notes draft.
- Re-adding an inactive ticker starts fresh notes and the new checkbox choice; adding an already active ticker must not reset its current draft or publication. Cancellation and old-cycle requests must not alter another activation.
- Preserve published approval history, duplicate-delivery handling, global controls, current trading-data refresh, compact list projection and unrelated app/runtime work. No database migration, AI prompt/model, recap or pricing changes.

## QA review and acceptance

Review specifically: zero generation on unchecked activation and background triggers; private until explicit listing; persisted choice/draft; manual generation still review-held; plain-text rendering; published versus draft separation; notification opt-out across all channels; no accidental reactivation reset; existing checked flow unchanged. Run focused source/behavior checks only, no local server or broad build. Coordinator integrates separate exact-parent Platform/runtime commits; hosted verification and release require owner authorization.
