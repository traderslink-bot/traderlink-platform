# Premium-only support and resistance

Owner-approved scope: third independent per-ticker checkbox below existing Premium controls, labelled **Premium-only support & resistance**. Default off. Support, resistance and full ladder become blurred placeholder rows for free members, while Potential Path price/date/card remain visible. CTA: “These levels are reserved for Premium members. Access Premium” links to the existing Whop membership page.

## Implementation complete locally

- Owner-authorized GET/POST control with independent durable setting and audit history.
- Premium member and verified owner access; ordinary free members receive no underlying Potential Path level values when restricted. Access-read failure conceals levels.
- Server-rendered detail, detail JSON refresh and archive projection share the restriction. List and stream already use quote-only allowlists.
- Clears legacy nearest values, labels, map arrays/trade plan/reference levels, level-card body/metadata and full-ladder/nearest cards. Preserves the price/date shell and overnight reference.
- Refresh reconciliation explicitly handles restriction changes and restoration even when quote timestamps have not changed.
- Semantic headings and accessible restriction copy; decorative blurred placeholders are hidden from screen readers. Actual prices are not placed beneath a CSS blur. React checklist reviewed; no new polling or dependency.
- Other cards/analysis access remain independent. No AI/provider/Discord/notification behavior changes. Previously delivered data or images cannot be recalled.

## Migration and release

Coordinator reserved `0156_platform_watchlist_premium_support_resistance`; exact predecessor `0155_platform_watchlist_premium_access_controls`. Adds `platform_watchlist_levels_visibility` and `platform_watchlist_levels_visibility_audit`. Manifest records both tables. Target applied migration count 138. No existing tables rebuilt or records rewritten.

Platform parent `3736df7695f6feab82596b6643d116fb8f3809a2`. No Runtime change. Coordinator owns guarded backup/predecessor verification, migration application and release. No hosted migration/deploy performed here. Rollback to old code would no longer enforce this new restriction; do not silently roll back while any rows are restricted. Schema-prefix guards may also prevent starting older code against the new schema; use coordinated forward repair or guarded restore.

## Verification boundary

Focused disposable SQLite checks passed: migration DDL, off/on/audit, free/Premium/owner/read-failure behavior. Projection fixture proves restricted values absent, price and unrelated card retained, original input unmodified, SSR/API/archive call sites supplied, and default projection retains restriction. TypeScript syntax checks passed. No broad tests, build or local server.

Hosted owner visual and free/Premium session verification remain pending release: save/reload, free placeholders, Premium values, toggle restoration, full ladder, mobile layout, overnight price note. No public posts required. Release build remains a coordinator gate; syntax verification is not a full production build.
