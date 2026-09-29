# Watchlist legacy retirement and per-ticker indicators

Owner approved: retire and disable the old Trader Read and lifecycle labels without deleting their implementation. Add a per-ticker Show indicator card control. No deployment in this slice.

## Complete scope

- Preserve the current TradersLink Analysis, Potential Path, prices, notes, publication approval, notifications, and separate reversal selection.
- Prevent saved legacy visibility settings from re-enabling retired displays. Hide their Admin controls, retaining compatibility handlers and stored history.
- Stop legacy-only polling and ordinary-ticker Trader Read calculations. Retain shared technical context and reversal-specific dependencies until separately retired.
- Persist indicator visibility per ticker, defaulting to shown for existing entries. Carry it through publisher contracts and Platform storage.
- Add Show indicator card to each Admin ticker. Changing it must not trigger AI or notifications.
- Off: hide member card and block scheduled indicator requests in both runtime and Platform, including queued provider work. An already-sent request cannot be recalled.
- On: allow the existing shared scheduler to resume. Preserve analysis/halt/other independent Moomoo consumers.
- Maintain Help and [progress](watchlist-legacy-retirement-progress.md).

## Verification checkpoint

Exact-parent allowlists based on queued Swings commits. Focused offline contract checks for default/on/off persistence, publisher propagation, schedule gating, member projection, and unchanged approval/AI paths. No local server or broad test suite. Hosted request cessation and owner visual acceptance remain separate after a coordinated deployment.
