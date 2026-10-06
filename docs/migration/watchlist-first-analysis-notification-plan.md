# First analysis notification classification

Owner reports listing tickers without analysis, then approving their first analysis with Notify users, produces misleading follow-up messages.

## Scope and approved behavior

- Distinguish an already-public ticker from an already-public analysis using website-acknowledged analysis approvals in the current listing cycle.
- Announce the first analysis added to an existing listing as `TICKER Analysis published` with normal owner attribution. Body: `The first analysis is now available. View the setups and levels in the app.`
- Retain Analysis updated, original-price comparison and follow-up explanation for later analyses. Preserve automatic update attribution.
- Apply consistently to Discord, push and email. Preserve approval, Notify users, images, links, mentions, retries and event identity. No migration or notification resend.
- Verify listing-only, first analysis, genuine update, missing price, unpublished approval and legacy context with focused offline tests.

Implementation and focused verification complete; deployment/live delivery not performed. [Progress](watchlist-first-analysis-notification-progress.md).
