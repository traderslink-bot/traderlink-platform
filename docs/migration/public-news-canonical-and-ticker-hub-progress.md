# Public News canonical URLs and dashboard invitation progress

Plan: [canonical correction and ticker hub](public-news-canonical-and-ticker-hub-plan.md).

## Status — 2026-11-01

Canonical source changes complete locally; runtime verification and release
pending. Owner cancelled the ticker hub and approved presentable dashboard invitation
pages with the shared public header/footer. Both public listing routes now
render that invitation locally; full/free article routes remain unchanged.

Live Railway metadata assigns public root/www hosts to traderlink-public-static
and the app host to traderlink-platform-web-restore-0909. Read-only CLI verified
PLATFORM_UPSTREAM points from public service to that Platform service over
private networking on port 8080. Preserved public-static branch Nginx forwards
non-static routes upstream while retaining the requested host. Fresh news pages
had identical main text/links and shared JavaScript assets. Source reads share
the news_articles store written by POST /api/news/articles. Owner confirms PC
publishes once to that API; no separate publisher was identified.

## Source allowlist

- proxy.ts: only the new app-host GET/HEAD News redirect block. Preserve earlier
  dirty community, instrumentation, login and Help work.
- src/modules/news/contracts/public-news-url.ts: shared reader URL helper.
- app/api/news/articles/route.ts: full/free absolute response URLs.
- app/api/news/watchlist-ai-source/[ticker]/route.ts: public source URL.
- src/modules/news/server/scanner-recent-press-releases.ts: scanner reader URLs.
- app/(dashboard)/press-releases/press-release-article-drawer.tsx: article-page
  action destination. The repository's relative publicPath contract stays intact.
- This record, the linked plan and their migration-progress.md index link.

## Review and remaining gates

- Manual source/diff review: redirect precedes early return, exact /news
  boundary excludes /api/news/** and /newsletter, GET/HEAD only, path/query
  preserved, destination port cleared, no public-host redirect loop.
- Public News relative links remain on the canonical host after redirect.
- Help Center notifications/imports and paid-plan guides reviewed. No update
  required: drawer controls, push destination, read state and membership
  workflows remain unchanged; article-page link destinations are corrected.
- Tests, lint/types, builds and runtime/browser checks UNRUN under explicit
  owner task restriction. Public full/free article behavior still needs runtime
  qualification before release; source review is not acceptance.
- No staging, commit, push, deployment, preview operation, migration or hosted
  variable change performed. Existing dirty work preserved. Coordinator owns
  Git and integration; include only this slice's hunk in already-dirty proxy.ts.
- Baselines of five edited existing files are temporarily available under
  /tmp/traderlink-news-canonical-before; they are not a durable Git checkpoint.
- Required later verification: index/ticker/full/free redirects, query retention,
  no loop, public destination/access behavior, drawer behavior and generated
  canonical URLs. Preserve API write semantics; no synthetic production POSTs.

## Owner-approved invitation implementation

Additional allowlist:
- app/news/page.tsx: public News invitation, no article-store query/listing.
- app/news/[ticker]/page.tsx: ticker invitation, bounded symbol validation,
  matching metadata and no article-store query/listing.
- app/news/news-dashboard-invitation.tsx: shared server-rendered invitation.
- app/news/news-dashboard-invitation.module.css: scoped public website styling.

The public root layout already applies PublicWebsiteChrome to /news/** and
supplies the public navigation/footer once. No shared chrome changes or copies.
The app-host redirect reaches that public layout. Mobile stacks the panel and
benefits; action spans its card width; focus/hover/active states are explicit.
SVG uses explicit currentColor and is decorative. No client state, data fetch,
loading state, forms or mutations were introduced. React best-practices manual
review completed; automated checks and browser review remain unrun per task
restriction. Current public Help guides require no edits: dashboard workflows
are unchanged. No noindex or paywall changes were made.

Runtime qualification must additionally inspect both invitation routes on
mobile/desktop, shared header/footer, keyboard menu/action behavior, valid and
invalid ticker paths, and direct full/free article access. These are pending,
not claimed passes. No Git or release action was taken by this feature worker.
