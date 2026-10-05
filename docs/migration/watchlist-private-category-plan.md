# Owner-only Private Watchlist

Owner approved October 4, 2026. Add to the pending Premium access release if safely combinable; otherwise preserve as a separate coordinated slice. Progress: [implementation record](watchlist-private-category-progress.md).

## Product contract

- Add **Private** to the existing add-ticker and move-category selectors and an owner-only Private section in Watchlist admin. Reuse the existing row layout, analysis editor, notes and removal controls.
- Only the authenticated owner can see Private tickers. Premium membership does not grant access. Do not show member placeholders, category counts, company facts, prices, URLs, analysis, notes or archived private content.
- Private is separate from the two Premium controls. Preserve their saved values when moving categories.
- Owner may generate/edit analysis and save notes privately. No Discord, free-channel, X, email, push, automatic analysis announcement or potential-gain post may be sent while a ticker is Private. Enforce this in service handlers, not only by hiding buttons.
- Moving Private to a normal category is the owner's publication action: publish the saved analysis if one exists, or publish the ticker without analysis. The owner can view/edit privately before moving. Respect the move's notify-users choice. Use normal first-add copy, never moved-from-Private copy. Public posted date/time starts at public publication, not private activation. Private draft history must not become public analysis history.
- Repeated requests must not send duplicates. A private move must not accidentally reuse a previous public delivery receipt or an owner-edited move caption.
- Moving an existing public ticker into Private removes member access promptly, but does not retroactively erase already delivered external posts. Preserve current owner-configured removal/delete behavior; do not introduce automatic deletion on moves.
- The current public category behavior and Premium controls remain unchanged for all non-Private tickers.

## Implementation boundaries

1. Confirm the exact pending Platform and Runtime integration parents with Visible release coordinator. Do not assume dirty checkout HEAD is the accepted release.
2. Extend both Runtime and Platform category contracts, persistence parsing and owner UI. Trace initial activation, notes-only, approval, manual refresh, automatic refresh, move, retry, free-channel, X and potential-gain delivery paths.
3. Carry Private state to the server-side access boundary before any publication can run. Filter list/SSR/SSE and deny detail/history/indicators/archive reads for non-owners. Do not rely on Premium blur, client filtering or missing list links.
4. Preserve owner previews while isolating private drafts/history. Promote through the existing ordinary publication workflow; do not fabricate another analysis or send another OpenAI request merely to move categories.
5. Update owner Help and progress. Keep source allowlists separate from unrelated pending Swing/editor work.

## Checkpoint verification

- Owner, Premium, free and unauthenticated access; direct URLs, list JSON, SSE, history, indicator and archive surfaces.
- Private add with/without AI; save/edit notes and analysis; manual and automatic refresh remain private.
- Every outbound route refuses Private delivery, including queued/retry jobs and per-ticker gain posts, with zero real notifications during tests.
- Private-to-public generates ordinary first-add copy/date with no Private origin or private history; no duplicate posting on retry.
- Public-to-Private and back, Premium controls retained, removal/re-addition and stale browser updates.
- Focused low-resource checks first; integrated build/browser acceptance reported separately. No migration changes or deployment without coordinator reservation/owner release authority.

## Current release boundary

Pending Platform source: `25721454e89fea5343841006aafc92700536ee90` (Premium controls); migration `0155_platform_watchlist_premium_access_controls`, not yet assumed applied. Pending Runtime editable-post checkpoint: `d10aeb996219fca02d4e607ede2eb696b79595be`, formerly parented to `692251c850abb8b7f9cf95dfc497523cfd5664c4`. These are recorded candidates, not verified current deployed parents. Do not deploy the mixed working tree.
