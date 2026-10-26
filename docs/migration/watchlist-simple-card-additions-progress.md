# Simplified card additions progress

Scope and source pins: [plan](watchlist-simple-card-additions-plan.md).

Related owner viewer: [previous published analysis cards](watchlist-published-analysis-history-progress.md).

Later owner-editing extension: [unrestricted target/pullback rows and numbered pullbacks](watchlist-owner-analysis-rows-progress.md).

Inspected deployed source: simplified schema currently has setup/pullbacks/upside only; dedicated catalyst and risk fields are empty. Owner-save has a simple-format allowlist and both editors return early, so all must be extended. Trader Notes are currently a separate card. No local port-3010 listener was found; none started. Existing dirty work is preserved.

## Implementation checkpoint

Implemented as exact-parent source candidates in `src/scripts/compose-simple-card-additions.cjs`, with narrow generated Platform/Runtime patches. No stale whole working-tree file is a release source.

- Same-request simplified breakout price, explanation/confirmation and internal evidence; catalyst and risk use the existing detailed payload fields and catalyst provenance normalization. No search, retry, approval, notification or boundary control changes.
- Runtime and Platform parsers accept absent breakout on older reads. Both owner editor entry points allow add/remove/edit/hide; existing source URLs remain server-owned.
- Notes occupy the top-right of both analysis formats on desktop and follow the overview on mobile. Empty notes omit the section. A valid visible analysis suppresses the former standalone notes card; absent/hidden/restricted/invalid analysis retains that fallback.
- Simplified targets occupy two thirds of the bottom row; catalyst/risk stack in the other third. Mobile stacks vertically. Older-article date treatment preserved; Premium preview conceals numbers in new fields. Existing two-image selection is unchanged.
- Help updated with the new simple-format content and notes placement. React checklist applied: no extra fetch/effect, scoped CSS, text escaping, accessible field labels and existing disabled/save state preserved.

Focused offline checks: six saved simple reads remain readable; synthetic new fields exercise save/hide/remove, source preservation and HTML escaping. All changed TS/TSX sources transpile. Twelve 390/1280px layout checks pass with requests blocked and no server. Inspected desktop/mobile screenshots. The initial isolated CSS-module mock was incorrect; fixed it, required exactly two row grids, reran and confirmed actual columns. Fixed badge/title overlap and spacing between catalyst/risk during visual review.

Evidence: `data/watchlist-simple-card-additions/offline-cards.json`, `preview-390.png`, `preview-1280.png`. New breakout/catalyst/risk values in those fixtures are illustrative test content, NOT fresh model output or new claims about those symbols. No paid generation or live saved analysis changed. Full release build, real generated new-field quality and hosted acceptance remain unverified. No deploy, push, commit, notifications, service restart or migration performed. Owner visual review can use the offline preview; release remains separate.
