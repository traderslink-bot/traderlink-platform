# Watchlist publication time correction

Owner-approved scope: only correct the posted date/time on Watchlist listing and ticker details, including analysis history labels. No content, reference price, gain calculations, notes, layout, notification or approval changes.

## Evidence

GYGY was added at 1790474304459 and analysis generated at 1790477750809 (Sep 26, 10:55 PM ET). First approval revision 12 at 1790525858659; website acknowledgement revision 14 at 1790525859219 (Sep 27, 12:17 PM ET). Current firstPostedAt incorrectly derives from card generation. Coordinator read-only verified these events against runtime d3249ed and Platform cac37b94.

## Implementation and verification

- Initial owner publication freezes firstPostedAt at approval dispatch, not at generation or preview. Existing approved retries retain frozen payload. Subsequent analysis approvals do not rewrite listing time. Listing without analysis receives the same correction.
- Analysis history includes optional publishedAt from the acknowledged website event; keeps generatedAt for generation identity and stale-response checks, and preserves reference prices. Rendering uses publishedAt when available.
- Existing GYGY correction must be separately guarded and timestamp-only: update firstPostedAt from recorded website acknowledgement, preserving potentialGain, analysis, notes and all unrelated state. Do not send an ordinary firstPostedAt publisher patch: that resets potentialGain.
- Focused offline actual-method check passes: first approval timestamp, immutable retry, both already-listed cases, acknowledged history, unchanged generation identity/reference price and unapproved exclusion. No broad tests/builds, paid AI requests or hosted mutations. No release requested yet.
- Help reviewed: existing text says original published time, so the fix restores documented behavior; no new Help copy necessary.

Related previous slice: [Notes with approved analysis](watchlist-notes-with-analysis-progress.md).
