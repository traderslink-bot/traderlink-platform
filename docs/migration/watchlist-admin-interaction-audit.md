# Watchlist admin interaction audit

September 30, 2026. Source review, not live acceptance. Controlling [plan](watchlist-editor-and-category-move-plan.md) and [progress](watchlist-editor-and-category-move-progress.md).

Inspected immutable Platform checkpoint `81e79a05a2f3439f4863f788b6cf860968817ba5` and runtime `e660742117d01e7468f093105335a10e72808f39`. These include the locally prepared editor slice; this report does not assert they are deployed.

## Confirmed connections and gaps

1. Current runtime move method changes placement only and publishes a status patch. It does not generate another analysis or reset listing facts. The optional member announcement is genuinely new work, not a rename of an existing move notification.
2. New analysis approvals select the current Watchlist category. Previously frozen approvals retain their original category for Discord retry. A move must not silently rewrite an already-started delivery. The new move operation needs independent identity and must report any old in-flight send rather than count it as the destination announcement.
3. Removal collects acknowledged Discord receipts across review cycles belonging to the active listing and queues deletion. The existing deletion worker processes pending jobs, marks errors failed, and exposes failures, but has no independent failed-job retry in that module. A move-cleanup retry must not invoke publication again.
4. Published-only removal calls queue removal without a review, so there are no saved message receipts available through that path. It can remove website listings without deleting Discord posts. Determine whether this fallback is reachable for ordinary owner removals before proposing a repair.
5. Admin actions are appended from two modules into one action area. Runtime page adds snapshot/levels/AI refresh, visibility switches, move and removal; row-review adds generation cancel, gain post, Free Chat/X, notes, editor, publication choices and delivery details. This explains inconsistent grouping as features accumulated. Preserve the actual node handlers; do not rebuild behavior from button text.
6. Free Chat preferences and publication deduplication are keyed by review cycle and approval revision, not ticker alone. The move operation must remain separate; category moves should not reset or implicitly enable Free Chat.

## Cases requiring additional proof

- A Discord send finishing after removal: confirm whether the late receipt is picked up for cleanup. Receipt history can accept a late acknowledgement, while removal captures its receipt list earlier. Do not claim a live orphan until the complete path is verified.
- Rapid moves while an earlier send is in progress: serialize per ticker, preserve destination receipts and suppress stale later member announcements without undoing the latest placement.
- Website status publishing fails after local placement changed: reconcile the website on retry without inventing another move operation or discarding the true source category.
- Remove and re-add the same ticker while a previous delivery is pending: verify current cycle checks for every destination before any new send.
- Owner-edited image export versus saved approval: verify exact selected approval, not the newest unapproved draft, remains the source.

## Updated notification intent

Actual analysis updates retain original/updated analysis reference prices and percentage change, per the owner's TNON example. Moving the ticker alone is not an analysis update. When both occur, member copy must identify both actions and keep update context. No changes to Potential Gain, saved analysis history, or automatic-update attribution.

## Approved action layout

- Visible review/publish group: status, View / edit analysis, My notes, Approve/publish, Publish ticker without analysis where applicable; relevant notification and Free Chat/X choices adjacent to the action they affect.
- Visible move group: destination selector, Move to List, unchecked Move Discord post and notify users, destination name.
- More actions: generation/refresh, levels, visibility, separate social/gain posts, delivery details and cleanup retry. Show running/cancelling status outside the collapsed group.
- Separate removal group: Remove from List / Deactivate; retain existing behavior until the difference is audited and explained, rather than removing either control blindly.

No new layout, live messages, removals, migrations or deployment performed by this audit.

## Local correction checkpoint

Finding 3 has a prepared runtime/API/settings-panel correction: Retry failed deletions queues only failed existing removal jobs and leaves publication untouched. Also narrowed mention-settings locking to mention controls, avoiding cross-section enable/disable interference. Focused mocked checks pass; live acceptance pending. Broader category-move and ticker-layout work remains open.

## Completed follow-through

- Category moves now have separate durable identities. The checkbox is off by default. Placement does not regenerate research or reset saved listing/gain facts. Destination send must be acknowledged before source receipt cleanup; retry does not resend a confirmed message.
- Rapid moves are serialized by ticker. Old retries cannot reverse the latest category; member delivery rechecks current operation/cycle and access before sending. A removed/re-added ticker does not inherit pending member notifications.
- Confirmed late Discord receipts are now passed to move/removal cleanup after acknowledgement. Source-category-only cleanup does not touch Free Chat/X. Global removal cleanup retains its existing enable setting; explicit move cleanup follows the owner's move checkbox.
- The original website publish method is reused on placement retry, so a local placement followed by publisher failure can reconcile without changing analysis or tracking history.
- Existing frozen approval/image routing remains unchanged: later owner edits are not rendered into earlier saved deliveries. New approvals use the current category; a completed move since the prior approval adds its destination to genuine update copy while retaining the original/update price comparison.
- The published-only fallback has no reliable receipt identity and is deliberately not given ticker-name/channel-search deletion. Ordinary active entries continue through receipt-aware deactivation. No speculative deletion added.
- Action groups and independent cleanup retry implemented. Remaining proof is hosted/browser acceptance, not additional planned source work.
