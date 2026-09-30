# Analysis update notification context

Owner approved September 30, 2026. Implementation only; production remains gated.

## Complete scope

- Automatic boundary updates: `TNON Analysis updated — Auto updated by AI`.
- Owner approvals: `TNON Analysis updated by "This Guy"`.
- Compare first published analysis reference price in this listing cycle to this update's saved analysis reference price. Never use a live quote or initial listing-only price.
- Copy: `Originally analyzed at $4.00. Now $5.20 (+30.0%).` Prices are illustrative.
- Discord/email also say: `A follow-up to the original analysis, with updated levels and setups for those holding a position or watching the trade develop.` Push uses the headline and comparison.
- Missing historical prices omit the comparison, never prevent approval or delivery.
- Preserve approval, opt-ins, recipients, Discord audience/routing/images/links, delivery identities and retries. No new AI calls, no rewritten historical notifications.

## Reviewed implementation

Freeze bounded context in Runtime's approved publication. Persist it once in Platform's existing immutable event, not per recipient. Existing event schema contains no suitable payload column; migration 0152 adds one nullable JSON column. Preserve immutability trigger and all records. Runtime automatic reconciliation sends trimmed history, so context must travel in the frozen publication.

Checkpoint: offline focused assertions for owner/automatic, first published versus pending reads, negative/zero changes, micro prices, absent history, duplicate delivery and SQL preservation. No live sends, migrations or deployment.

See [progress](watchlist-update-context-progress.md).

Owner-approved follow-up: automatic boundary-update Discord posts carry no analysis images or image-specific caption. Initial posts and manual approvals retain images.
