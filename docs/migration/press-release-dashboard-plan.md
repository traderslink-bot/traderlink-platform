# Press Release Dashboard Plan

**Status:** Implementation and local runtime verification complete; owner visual/product review pending

**Progress:** [Press Release Dashboard Progress](press-release-dashboard-progress.md)

**Halt alerts extension:** [Nasdaq and NYSE Halt Alerts Plan](nasdaq-nyse-halt-alerts-plan.md)

**Prepared:** 2026-08-20

## Outcome

Add the existing Press Release app alerts to the authenticated TraderLink
Platform dashboard without replacing Discord delivery or duplicating News
article content.

The Press Release app continues to publish one canonical News article. The
existing public article URL remains the Discord destination and the future
community-page article surface. The dashboard renders the same canonical
article in a compact channel feed and responsive detail drawer.

## Owner-approved product contract

- Keep all existing Discord alerts and public article links.
- Add a **Press Releases** group to the dashboard left navigation.
- Do not add a Press Releases or newspaper shortcut to the top navigation.
- Show the total unique unread article count beside the Press Releases group.
- Show the applicable unread count beside every channel destination.
- Count one article once in the group total even if it is visible through more
  than one aggregate channel.
- Opening an article marks that article read everywhere it appears for the
  current Platform user.
- Keep News articles and public URLs. Do not add automatic article deletion.
- Store only sparse per-user read receipts and bounded delivery evidence in
  addition to the canonical article.
- Keep press-release Push selection in Account Preferences, using the same
  channel choices traders recognize from Discord.
- PWA Push opens the exact authenticated dashboard article. An expired login
  must return to that destination after Discord OAuth.

## Navigation and channel inventory

The first dashboard inventory is:

1. **All Press Releases** - every dashboard-eligible published alert.
2. **News Filtered** - the existing filtered News route.
3. **All Market Cap** - every supported market-cap alert band.
4. **Under $30M** - `market_cap_under_30m`.
5. **$30M-$50M** - `market_cap_30m_to_50m`.
6. **$50M-$100M** - `market_cap_50m_to_100m`.

Internal route tags never appear in visible copy. Articles tagged `drop` are
not ordinary dashboard alerts.

## Feed design

Desktop uses a dense newswire-style row, approximately 52-60 pixels high:

```text
Unread | Time ET | Ticker | Market cap | Type | Headline
```

- Each article occupies one line on desktop.
- The headline column consumes remaining width and renders only the article headline; no feed-row snippet or summary preview appears at any width.
- The All Press Releases page also identifies the article channel.
- All Market Cap and the three market-cap band pages visibly show the stored
  market-cap fact when it is available.
- Missing market cap remains blank; the UI does not invent a value or show a
  meaningless `N/A` placeholder.
- Mobile uses a compact multi-line row with a naturally wrapping full headline and a full-width drawer; the headline is not line-clamped, ellipsized or clipped.
- Newest articles appear first. All/Unread, ticker/headline search and bounded
  date controls remain available without loading the complete history at once.

## Drawer and deep-link contract

Clicking anywhere on a row opens a right-side desktop drawer. On narrow
screens, the drawer occupies the full width. It shows only stored facts:

- ticker, publication time, market cap when available and article/filing type;
- full headline and AI summary;
- stored positives, negatives, risk flags and support/resistance levels when
  present;
- original source link when present; and
- the existing public full-article link.

The URL identifies the selected article so PWA Push, refresh and login return
can reopen the exact drawer. A late Push deep link remains valid even when the
article is older than the default list window.

## Public article shell alignment — 2026-08-23

The detailed canonical article route (`/news/[ticker]/[slug]`, including its
free access variant) uses the exact public Help Center header rather than the
Academy site shell. It retains the News content, canonical article URL and
public footer. The dashboard and public Help header use the same light
TradersLink logo asset as the article header.

## Data ownership and access

- `news_articles` and immutable `news_article_versions` remain canonical.
- News owns sparse per-user article read receipts and channel Push choices.
- Platform owns the encrypted device subscription and shared Web Push
  transport. News owns press-release delivery attempts, which do not appear in
  the ordinary account/trading notification bell or `/notifications` list.
- Press Release dashboard reads are user-scoped and require the existing
  Premium Discord access decision. Loopback local-development owner access
  remains available for review.
- Publishing one canonical article may fan out one idempotent Push envelope per
  eligible subscribed Platform user. It must not create duplicate News
  articles.

## Verification boundary

During implementation, use only focused lint, TypeScript/static checks and
source-level migration/navigation verification. Do not run Vitest or broad
test suites. Final visual acceptance requires owner review at desktop and
mobile widths. Hosted Discord, Push and production publication remain separate
live gates.

## Help alignment

The same slice adds plain-language Help coverage for browsing channels,
understanding unread badges, choosing Push channels and opening a PWA alert.
