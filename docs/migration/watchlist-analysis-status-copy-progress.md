# Watchlist analysis status wording

Status: Implementation complete; narrow local verification complete. Not deployed.

Owner request: remove AI references from alerts and notifications on the ticker analysis card.

## Complete changed visible-string inventory

- Halted with saved analysis: "Analysis update: Trading is halted. This read remains on the last confirmed candle until trading resumes."
- Halted without saved analysis: "Analysis update: Trading is halted. Waiting for confirmed candles before publishing a read."
- Possible halt: "Analysis update: A possible halt was detected. Waiting for confirmation before treating new price action as current."
- Failed analysis: "Analysis contained inaccuracies and was rejected."

Only the three "AI Read update" prefixes and the failed notice's "AI analysis" wording change. Full and status-card render paths share these strings. Simple analysis has no separate AI-labelled status message. Explanatory tooltips, pullback descriptions, AI disclosure, listing-page explanation and internal identifiers remain unchanged: they are not alerts/notifications.

Help reviewed: watchlist-guides.ts does not quote these messages. No guide change needed for this wording-only correction.

Verification: exact four-replacement diff against production parent, unchanged executable structure after reversing replacements, halt variants and possible-halt/normal states checked using the actual helper, targeted ESLint (existing unused-helper warning only). No broad suite, local server or build.

Release parent: 9ae6bb62dc64917e129a70342601568200aec3e1. Allowlist: app/watchlist/live-watchlist-client.tsx; this record; watchlist-runtime-dashboard-admin-plan.md. Zero behavior, API, database, runtime or migration change. Coordinator owns any later authorized deployment.
