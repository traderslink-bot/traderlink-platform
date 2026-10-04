# Premium analysis implementation progress

Plan: [per-ticker Premium analysis](watchlist-premium-analysis-plan.md).

## 2026-10-04

- Owner confirmed independent per-ticker toggle, default off, and exact notice/link.
- Read repository rules and inspected integration-parent analysis projection, membership checks and detail routes.
- Identified price-in-prose and client reconciliation as required protection paths, not just CSS changes.
- Recorded complete implementation inventory and design QA in the plan.
- Owner subsequently explicitly authorized coordinator contact. Coordinator reserved `0155_platform_watchlist_premium_analysis_access`, exact predecessor 0154; source parent is the held Swing checkpoint `3fdd4241777e825195299c899754f933f1c2acaa`.
- Implemented source overlay: durable per-symbol setting and audit, owner-authenticated GET/POST, compact admin checkbox, explicit price-free preview model and card, detail/API/archive/history projections, client stale-card removal, Help and migration registration.
- Existing per-symbol settings survive list removal/re-addition; never silently reset a previously restricted ticker. Symbols with no setting default free after successful settings read.
- Default keeps all existing tickers free; read errors conceal prices. Owner bypass remains available.
- Inspected list and SSE: list-only projection excludes analysis cards. Recap endpoint is publisher-token protected. Previously sent Discord/X images and the static landing preview are not recalled or changed by the toggle.
- Focused checks pass: projection, numeric prose concealment, hidden sections, card preservation, access matrix, fail-closed reads, settings/audit in disposable memory-only SQLite, TS/TSX syntax and embedded-script syntax. Core strict TypeScript (preview model and migration) passes.
- Broader integration TypeScript attempt exceeded the 640 MB heap cap. It did not pass; no retry with a higher memory budget. Full build and rendered owner/mobile acceptance remain outstanding.
- No production writes, migration application, push, deployment, real Discord posts or AI calls.
- Package only the exact-parent overlay; do not deploy the mixed working tree. Release requires 0154 before 0155 and owner deployment instruction.
