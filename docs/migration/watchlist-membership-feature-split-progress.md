# Watchlist membership feature split

Status: implementation reconciled with current-release source; focused TypeScript
passed as part of the 39-root additions check. Runtime/UI acceptance is pending.

Owner-approved features: `watchlist.access`, `watchlist.ticker_details`,
`watchlist.trade_analysis`. Each remains independently owner-configurable;
no hard-coded Premium role requirement or automatic policy activation was added.

- Live and archived detail pages check detail access before reading ticker data.
- Detail API checks access and strips the preparation/legacy analysis cards when
  analysis is denied. Initial RSC props use the same sanitized projection.
- Analysis history requires both detail and analysis access; indicators require
  detail access. Publisher/admin endpoints keep their existing separate auth.
- Main list props retain the newer compact production DTO. The list API always
  returns that DTO; omitting `?view=list` cannot retrieve full protected objects.
- Shared SSE carries only compact list/quote facts, never analysis/detail cards.
  This avoids a refresh per tick and retains existing polling/backoff behavior.
- Archive list props exclude detail cards.
- Locked messages link to feature-filtered public offers only. Private invitation
  offers never enter this filter. Zero numeric allowances are not upgrade offers.
- Polling replaces the detail UI after denial and strips analysis after revocation
  even if reconciliation would otherwise retain older cached cards. Information
  already delivered while authorized cannot be recalled.
- New UI uses existing card/theme conventions. Help guides were updated.

The earlier canonical-checkout implementation is superseded by this reconciled
slice in `C:\Users\jerac\Documents\TraderLink\worktrees\membership-production-20260928`,
parent `d5ec13293400a5849636a6049a4761e272eb7928`.
Do not copy the older canonical Watchlist client onto the release code.

Next.js/React guidance influenced server-side checks, minimized serialized data,
shared gate components, and preserving the existing live-refresh lifecycle.
No runtime test, browser acceptance, hosted migration or deployment is claimed.
See [generation allowances](membership-generation-allowances-progress.md) for the
combined acceptance boundaries and the new allowance migration.
