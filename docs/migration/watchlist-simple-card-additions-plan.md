# Simplified analysis additions

Owner-approved scope: Breakout above Potential Targets; Catalyst / recent news and Risk notes stacked in the right third of the targets row; Trader Notes at the top right beside the opening summary. Mobile stacks notes after summary and catalyst/risk after targets. Empty notes leave no gap. Without a usable/accessible analysis, retain the standalone notes card.

## Complete implementation inventory

- Runtime simple prompt/schema: one request supplies breakout, catalyst and risk; preserve the deployed pullback correction and target policy.
- Backward-compatible Runtime and Platform simple-content parsers; absent breakout stays absent on saved reads.
- Existing catalyst normalization/provenance and risk fields, with owner editing and hide controls; no new approval gate, automatic retry or external research.
- Both owner editor entry points, member renderer, premium sanitization and existing image selection behavior.
- Notes moved, not copied into AI output or stored twice; no duplicate public notes, no automatic notes inclusion in notification images.
- Matching Help update; focused offline contract/render checks. No live generation, notifications, migration or deployment.

## Source preservation

Platform candidate is composed against `96519f0d36f549f85981372126099e3f3f47183a`; Runtime against deployed `5f253a9d6ec9ccebfb2a32dba40349631bb44ac5`. Existing checkouts are dirty and older. Preserve them and produce narrow exact-parent patches, never deploy whole local files. Release integration must check the then-current parent.

## Progress

Local source candidate and focused offline contract/layout checkpoint complete. Hosted/model-generation acceptance and release are not claimed. Owner approved placement and requested proceeding. [Progress](watchlist-simple-card-additions-progress.md).
