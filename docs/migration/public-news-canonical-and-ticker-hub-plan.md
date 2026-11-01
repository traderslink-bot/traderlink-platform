# Public News canonical URLs and dashboard invitation

Owner direction, 2026-11-01: retain public `traderslink.pro/news`, redirect app
reader pages and fix generated reader links. Later owner direction replaces
public article/ticker lists with a dashboard invitation; the ticker hub is cancelled.
Progress: [source and release status](public-news-canonical-and-ticker-hub-progress.md).

## Approved correction

- GET/HEAD app-host `/news` and `/news/**` permanently redirect (308) to the
  same public-host path/query, including ticker, full and free views.
- Preserve POST `https://app.traderslink.pro/api/news/articles`, publishing
  authentication/payloads, relative response path fields and shared storage.
- Return public-domain absolute full/free article URLs and Watchlist AI source
  URLs. Point shared dashboard drawer and scanner reader links there directly.
- Preserve drawer controls, read state, dashboard access, external source-site
  fallback links, article content, navigation and footer.
- Existing distributed app URLs remain usable through redirects. No PC script
  edit, second publishing destination or extra article database is needed.

## Approved dashboard invitation — 2026-11-01

Owner approved implementation of the proposed design and explicitly requested
traderslink.pro's shared footer as well as its top navigation.

- /news title: Follow the news. Find your next research opportunity.
- /news/TICKER title: Follow $TICKER news in TraderLink.
- White page with navy feature panel and a white dashboard invitation card.
- Three benefits: News by ticker; Press releases and filings; Clear article summaries.
- Open TraderLink links to https://app.traderslink.pro/dashboard-entry.
- Membership note: News access depends on your membership.
- Use the root layout's existing PublicWebsiteChrome header/footer. No local
  navigation or footer copies. Existing public mobile menu remains unchanged.
- Stack content and use a full-width action on mobile. Visible keyboard focus,
  semantic sections and decorative SVG with explicit currentColor treatment.
- Remove public index/ticker article queries, article listings and ticker directory.
  There is no search, hub, pagination or archive browsing work.
- Validate ticker syntax for the invitation; ticker existence is not asserted.
- Direct full/free article routes remain publicly readable and their source is
  unchanged. No authentication/paywall or noindex change is part of this slice.
  Unlisted articles can still be shared or discovered; this is not privacy.
- No article records, publishing or dashboard workflows are removed.

## Current operating limits

No tests, builds, servers, restarts, migrations or hosted changes in this task.
Coordinator owns Git commits and release integration. Local review does not
establish runtime, browser, owner visual or production acceptance. The dashboard invitation design is owner-approved; runtime and production
acceptance remain separate.
