# Premium ticker progress

Plan: [approved behavior and inventory](watchlist-premium-ticker-plan.md).

2026-10-04: Implementing exact-parent overlay on24862449. Reserved expanded unapplied0155 confirmed by coordinator. Existing analysis checkpoint preserved. No production or notification changes.

## Source checkpoint

- Independent owner controls and durable audit implemented. Ticker edits never modify analysis access and vice versa. Unknown settings default Off only after successful database reads; failed reads conceal ticker information.
- Server list and SSE use opaque placeholders stripped of ticker/company/price/flag/detail links. Listing renders a blurred placeholder, small orange Premium members only and Access Premium.
- Authenticated free direct detail routes show the locked card; detail/history/indicator APIs return private403. Logged-out visitors retain the existing sign-in flow. Archive detail is locked and restricted archive list entries omitted.
- Active list polling drops identities removed by a privacy transition; SSE refreshes membership-changing keys without adding requests for every ordinary price tick. Open detail polling hides the old detail when denied.
- Confirmed publisher-only recap, candle, overnight quote and indicator-refresh routes remain token protected and unchanged. Existing Discord/X content and known URLs cannot be recalled.
- Focused memory-only checks passed: toggles/defaults/independence/audit, free/Premium/owner/failure decisions, placeholder serialization and SSE; TS/TSX syntax and embedded controls. Core strict TypeScript (list/stream/migration) passed at384MB.
- No full local build or integrated typecheck retried; preceding640MB limit remains documented. Hosted integrated build and rendered desktop/mobile/real-account acceptance still required. No deployment authority in this slice.
- Release must supersede analysis-only0155 with0155_platform_watchlist_premium_access_controls and apply only after0154. No migration applied locally or hosted; disposable in-memory SQLite only.
