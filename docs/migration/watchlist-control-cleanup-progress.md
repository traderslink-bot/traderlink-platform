# Watchlist ticker control cleanup

Owner approved October 6, 2026. Implementation and focused offline verification complete. Deployment remains on explicit owner hold.

- Remove redundant Potential dip-buy plan visibility button. Preserve pullback analysis, editor controls and stored values.
- Remove Repost Snapshot from ticker actions; preserve underlying endpoint for compatibility.
- Remove Deactivate for settled tickers; preserve Cancel during activation and Remove from list.
- Move Refresh Levels to the existing per-ticker diagnostics section. Its behavior is unchanged, including the existing level-snapshot call; this is not a newly silent refresh.
- Rename AI Card to Analysis card and Retry to Retry activation. Copy Thread remains diagnostics-only.
- Preserve model, generation, approval, publication, Discord, move, access and indicator settings.

Runtime package builds from corrected notification-checkbox commit 01f862b5d9fc5cfc256926d52a2eb3c5ae8a1e87. Verification assembles the page with the separate global-notification candidate, parses every embedded browser script, checks Cancel across five lifecycle states, and confirms removed/preserved controls. No hosted calls, notifications, migration, server or broad suite. Desktop/mobile browser acceptance remains pending deployment.

IPDN analysis selection and boundary-refresh work remains a separate unfinished task. This cleanup does not implement it.
