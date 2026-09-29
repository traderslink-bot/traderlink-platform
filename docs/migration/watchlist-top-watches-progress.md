# Dated Top Watches progress

[Controlling plan](watchlist-top-watches-plan.md). Local implementation and focused offline checks complete, based on queued Platform `e22000fcb5811577bff9cd80628cda3f13dfb682` and Runtime `a6289ccfa4dafa3e04898348560bf17deaf1e612`.

Source inventory: Platform group types/classification/store/list UI/Help; Runtime group types/classification/store/persistence/archive/publisher/manager/Admin server/Admin page, plus existing exchange calendar. Preserve the earlier queued Swings, indicator retirement/toggle and tooltip slices.

## Behavior

Add / Activate and Move to List offer the upcoming trading-date group and existing dated groups. The selected date is retained across page polling while new upcoming choices appear. Admin and members see separate fixed-date headings. Existing removal and exact-group clear work without affecting other dates. Runtime calendar selection has no network cost. Both repositories accept the persisted dated identity; old groups are unchanged. No migration, notifications, AI or market-data requests are introduced by grouping.

## Verification and release boundary

`node src/scripts/verify-watchlist-top-watches.cjs` passes: ten exchange-calendar cases (overnight, regular open, weekend, Labor Day, Thanksgiving, early close, year boundary and known special closure), strict date validation, existing group preservation, runtime persistence and archive round trips, activation/member classification, publish status patch propagation, move-in/out isolation, and generated Admin JavaScript syntax/labels. Exact-parent source syntax and diff checks pass. No broad suite, full TypeScript/build, browser session or live ticker mutation was run.

Release Platform support before Runtime begins publishing the new dated group, preserving queued prerequisites. Hosted acceptance remains: add a test ticker to the dated group without notifications, move between dates/other groups, confirm both Admin and member headings, and verify a reload does not advance its saved date. No deployment performed in this slice.
