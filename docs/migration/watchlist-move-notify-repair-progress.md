# Notified Watchlist move repair — October 1, 2026

Owner reports SDEV moves successfully without notifications but not with notifications selected. Read-only live owner GET confirms four silent/skipped moves; SDEV currently Main Session. No live test post/move/deletion was performed by this investigation.

## Exact repair

- Released shared notification access helper queries `platform_watchlist_visibility`, which has no migration in the released source. Use current `evaluateMembershipFeature(..., "watchlist.access")` instead. Keep active Platform user, active Discord identity, current Discord membership, and channel opt-ins. No new table or access-policy setting.
- Rewrite single-quoted API paths as well as double-quoted paths in the owner console. Move delivery details used a single-quoted URL and otherwise escaped the authenticated proxy. Preserve already rewritten URLs.
- Log a sanitized SQLite error code/stage for a failed move-notification intent; never print recipient data, credentials or request bodies.

## Verification boundary

Focused regression checks cover the obsolete-query reproduction, current access decision, recipient snapshot and move intent persistence in real in-memory SQLite without a fictional visibility table, opt-out/inactive/member-denied outcomes, duplicate identity, and console proxy rewriting with both quote styles. No hosted migration needed. Live notification sending remains an owner action after release.
