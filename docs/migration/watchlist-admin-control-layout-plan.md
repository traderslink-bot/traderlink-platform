# Watchlist admin control layout

Owner approved October 5, 2026 after live desktop inspection. Layout only; preserve every request, access rule, saved selection, notification choice and action handler.

- Visible: ticker/status, analysis editor, notes, approval, analysis refresh/retry, and existing ticker-only publication controls when applicable.
- More actions: Access (both Premium switches); Move (destination, move, notification choice, edited caption and delivery details); Posting (approval notification/channel choices and independent social/repost actions); Settings (card visibility and levels refresh); Diagnostics (technical metadata and thread copy); Remove (existing destructive controls).
- Keep actual errors and current operation status visible. Do not hide failures as a styling fix.
- Desktop groups align locally; mobile groups wrap/stack without losing labels or targets. No global card-padding changes.
- Preserve expanded-state tracking and existing periodic rerender behavior. No new requests, polls, provider calls or migration.

Progress: [implementation record](watchlist-admin-control-layout-progress.md).

Acceptance: focused embedded-script and DOM grouping checks; owner visual review remains separate. No local server/full build or production deployment in this slice.
