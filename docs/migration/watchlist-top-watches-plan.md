# Dated Top Watches

Owner-approved title: **Top Watches · Sep 30**, with the actual trading date. This is a separate manually selected group, not a rename of Top Regular Hour Watches and not a new ranking algorithm.

## Scope

- Add the dated choice to Add / Activate and Move to List.
- Use the runtime's existing U.S. equities calendar, in New York time. Before regular open on a trading day choose that upcoming session; otherwise choose the next trading day. Skip weekends, holidays and known special closures. Early-close days remain trading days.
- Persist the complete date in the group identity (`top_watches:YYYY-MM-DD`). Never derive an existing group's date from the current clock, activation date, analysis time or a deploy.
- Render separate date headings in Admin and the member list, using `Top Watches · Sep 30`. Retain the year in the stored identity and accessible label. Keep existing dated groups selectable alongside the upcoming date so a next-day refresh does not silently move a ticker.
- Preserve ordinary activation, approval, analysis, notifications, prices, notes, indicators and existing groups. No automatic moves, deletes or notifications when the date changes.
- Support existing per-ticker move/removal actions and exact dated-group bulk clear. Do not change other groups' clear behavior.
- Update Help and [progress](watchlist-top-watches-progress.md). No migration or hosted changes required.

## Verification

Focused offline checks: weekends/holidays/year boundary/overnight and early-close calendar selection; invalid dates; group propagation through persistence, archive, publication and member projection; two date groups remain separate and stable; Admin embedded JavaScript syntax; unchanged existing group classification. No local server, broad suite, provider request or deployment. Browser/hosted acceptance follows coordinated release.


Approved Top Watches tooltip: Tickers selected ahead of the displayed trading date for their potential to make a move. This list does not suggest whether you should hold them overnight. See [tooltip progress](watchlist-top-watches-tooltip-progress.md).


Owner revision: public heading is Overnight Watches without date; combine existing dated memberships for display only, preserving stored assignments. Order: Top Regular, Main, Overnight, Post-Market, General, Swings. Admin retains date suffixes to distinguish saved destinations. See [progress](watchlist-overnight-rename-progress.md).
