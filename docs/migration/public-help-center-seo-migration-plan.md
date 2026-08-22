# Public Help Center SEO Migration Plan

**Status:** Implementation in progress

**Progress record:** [Public Help Center SEO Migration Progress](public-help-center-seo-migration-progress.md)

## Outcome

Every TradersLink Help collection, guide and section anchor is publicly
available at `https://traderslink.pro/help/...` from the Railway-hosted
Platform application. The Help Center is not an authenticated dashboard
feature and does not carry the dashboard shell.

## Approved interface

- A compact public header has the TradersLink logo at the left, Academy and
  Help Center links on wider screens, a primary Trade Tracker link to
  `https://app.traderslink.pro/workspace`, and an Account icon menu.
- It has no dashboard sidebar, left hamburger or AI top-nav item.
- Every guide has a visible way back to Trade Tracker.
- The existing public guide catalog moves together; there is no private-guide
  split or reduced SEO inventory.

## Technical contract

- The existing `src/modules/help` guide modules remain the single source for
  the complete public catalog.
- `/help`, `/help/[collection]` and `/help/[collection]/[guideSlug]` render
  outside the authenticated dashboard route group.
- Every collection and guide has indexable metadata, a root-domain canonical
  URL and a sitemap entry.
- Requests for Help on `app.traderslink.pro` permanently redirect to the root
  public domain, preserving their path and query string.
- Dashboard Help controls use root-domain public Help URLs. PWA offline Help
  remains a non-indexable local fallback until separately replaced.

## Acceptance

- All known Help slugs and section IDs are available on the root domain.
- Signed-out Help requests render without a Discord redirect or account read.
- The sitemap contains the Help landing page, every collection and every
  guide; `robots.txt` permits crawling of those routes.
- Public header, search, article anchors, guide links and the Trade Tracker
  return path work on desktop and mobile.
- The Railway release is coordinated with the current one-writer deployment
  owner and checked on the public domain before handoff.
