# Daily gainers private archive

The private preview includes the latest five trading sessions as HTML tables, a trading-date picker, and ticker appearance counts with a Top 1–10 cutoff. The match table gives the date, symbol traded that day, rank, and gain. Historical symbols that share a confirmed identity are counted together. Ambiguous identities require a date-specific lookup.

## Data and coverage

Alpaca SIP supplies daily bars and the Alpaca calendar supplies trading sessions, including the session preceding the requested range. Both closes must come from bars with actual trades, so zero-trade carry-forward prices cannot become an IPO or relisting baseline. The job ranks positive split-adjusted close-to-close returns with a ticker tie-break, and checks the ten winners independently with a heap and a price-difference formula.

The eligible inventory includes active and inactive U.S. exchange-listed records whose Alpaca asset names identify common shares, ordinary shares, or capital stock. Funds, preferred shares, depositary shares, warrants, rights and units are excluded by name when identified. Same-CUSIP ticker changes with an unambiguous history allow the old ticker to participate through its effective date and preserve the trading ticker on each row. The job uses an as-of bars request to retrieve both sides on one split-adjustment basis before it compares the closes. When that pair is missing or ambiguous, the rename-day comparison is skipped.

This is an Alpaca-covered archive. The asset inventory is current with inactive records, so the archive may miss unclassified or unavailable historical listings. Alpaca's corporate-action history can also omit changes, particularly in early years. A date-specific listing and security-type feed would be needed before describing the older rankings as market-wide. January 5, 2016 is the first eligible comparison observed in the SIP history. The first January session lacks the previous SIP close required for a ranking.

## Verification

- January 5, 2016 through November 11, 2026 contains 2,730 consecutive Alpaca calendar sessions and 27,300 ranked rows. The backfill used 5,981,456 traded daily bars, verified 483 rename-day comparisons on a consistent split basis, and found 309 ranked tickers in the inactive Alpaca inventory. The bars endpoint rejected eight candidate symbols.
- Re-fetched 540 displayed rows from SIP across quarterly samples and the largest moves. Checked for calendar gaps and duplicate securities, and recalculated the gain on every displayed row.
- Chromium checked the date picker, five recent session tables with JavaScript disabled, Top 1/5/10 counts, historical ticker aliases, no-match feedback, keyboard input, and layout at 320px.

## Private update and review

The unprivileged VPS timer `traderlink-daily-gainers-preview.timer` is scheduled for 5:15 p.m. New York time on weekdays. The companion one-shot service uses the market calendar and refreshes a rolling window to pick up revisions and missed runs. It atomically writes the private JSON and preview snapshot. Holidays leave the latest date unchanged. The service uses the existing read-only owner-test configuration and no app server, public listener, or hosted credentials.

The private archives are under `/home/traderlink/preview-runtime/admin-watchlist/daily-gainers`. The source backfill can regenerate a range when needed.

```sh
umask 077
python3 src/scripts/backfill-daily-gainers.py 2025-01-01 2025-12-31 /path/to/private/2025.json
systemctl --user start traderlink-daily-gainers-preview.service
journalctl --user -u traderlink-daily-gainers-preview.service -n 20 --no-pager
```

The owner reviews the private layout and feature before release. No current Help Center guide covers this private feature. The shared chart preview lane remains available to its current feature owner.

## Public SEO design for the release checkpoint

Use a landing URL such as `/stock-gainers/` with the latest completed session, five recent daily tables, an archive link, and the ticker lookup. Render recent tables and date links in the initial HTML. Each verified session should have a stable canonical URL such as `/stock-gainers/2026-10-30/` with a date-specific title and ranking table. Use crawlable month archive links, previous and next session links, and sitemap entries for canonical date pages. Keep rank cutoff and date-range search state on the lookup UI so it does not generate many duplicate URLs. The private snapshot uses in-page links for review.

A separately labeled explanation of a move can be added when a verified company announcement or news source is available.

## Hub, date range, and private SEO pages

The current hub starts with the first 2025 session. The original 2016–2024 ranking files are retained. This checkpoint has 467 day pages, 23 month archives, and one hub. The hub shows five recent tables and links to monthly archives. A month lists every trading date and its winner. Daily pages contain their complete table, canonical URL, a date-specific title and description, and links to the month and adjacent trading dates. The sitemap is generated privately alongside the pages. Preview documents carry `noindex,nofollow`. No public route or sitemap is deployed.

Ticker searches accept an inclusive date range and a Top 1–10 cutoff. The summary shows the number of qualifying appearances, best rank, and last appearance within the selected range. Daily and ticker rows show estimated dollar volume calculated from unadjusted SIP bar volume multiplied by unadjusted VWAP. Recent estimates can change as Alpaca updates its daily bar. The scheduled refresh rechecks the recent window. Saved rankings and dollar volumes serve previews and page builds without an Alpaca request from visitors.

The private static pages are generated under the archive's `site/` directory. Chromium verified range filtering, invalid ranges, the one-session summary, dollar-volume rendering, and the 320px layout. The hub-to-month-to-day-to-previous-day path worked with JavaScript disabled. The 491 page documents and sitemap were checked for link coverage. All 4,670 rows have dollar volume, with independent raw SIP spot checks on prior sessions.

## Dashboard page and public navigation proposal

The authenticated dashboard route is `/stock-tools/gainers`, linked as **Stock Gainers** under **Stock Tools** in the left navigation. It reads an app-side snapshot of the saved rankings, and its date selector and ticker results stay within the dashboard route. The private export writes `dashboard/archive.json` outside the static SEO site. The assigned development workspace resolves the isolated snapshot automatically. A hosted dashboard release needs its own saved archive path configured through `TRADERLINK_DAILY_GAINERS_ARCHIVE_PATH`.

The public hub remains `/stock-gainers/`. Proposed public placement is a **Stock Gainers** link beside **Market News** in the shared public top navigation and a **View stock gainers** link in the homepage market section. Both go to the public hub. The hub links to dates and months. Public navigation placement is pending owner review. No descriptive copy is proposed.

Removed the copy beneath the public ticker search controls and the preview footer. Requested search statistics appear above the controls, with matching rows below. The public preview and dashboard use separate layouts and routes.

Focused TypeScript and ESLint, saved archive and navigation checks, and the private search browser check passed. The full workspace type check exceeded Node’s heap. The legacy dashboard template enforcement suite reported four failures in existing shared layout, shell, and route assertions. The active chart preview occupies the shared dashboard lane, so authenticated browser review of this new route remains pending. Existing Help Center guides do not require edits for this private checkpoint.

## Public landing navigation and hub copy

The owner selected the main landing-page top navigation. The [landing navigation patch](stock-gainers-landing-navigation.patch) inserts **Top Stock Gainers** between **Features** and **Academy** on the homepage, Trading Journal, Trade Analyzer, and Trade Analytics. It applies to the preserved static landing tree at `66d94180d`. The same markup supplies the desktop and mobile menus. The public landing source is released separately from this workspace. The patch and private hub copy are ready for review. The homepage body link remains a proposal.

The private hub now has its approved-topic introduction near the title and a short matching meta description. The search section remains free of descriptive copy. Desktop and mobile menu checks passed on all four patched pages, and the private hub copy and metadata were verified in Chromium.

SEO copy review placed the top 10 U.S. stock gainers and after-close timing in the opening sentence. The next sentence identifies the historical rankings and ticker lookup. Small-cap and micro-cap movers are described as part of the results. The generated preview and private hub metadata were checked against the revised copy.

The owner review moved **Find top gainers by date** above the recent tables and ticker lookup. Chromium verified the section order and confirmed that changing the date replaces the ten ranked rows.

The public hub now has one **Find top gainers** panel with day, month, year, and custom date range views. Optional ticker, daily rank, minimum dollar volume, and sort order apply to the same results table. Ticker statistics reflect the current filters. Multi-session views show ranked daily appearances and paginate at 25 rows. Chromium verified all period modes, filtering, gain sorting, pagination, and the 320px layout. This revision applies to the public hub preview.

**Browse by month** sits with the hub filters, above the results. Chromium verified that selecting a month from the links applies that month to the results.

The public hub filters use content-sized controls on desktop and wrap as needed. Chromium verified compact desktop widths and that the custom range controls fit at 720px and 320px.

Filter labels and values stay on one line. Every input and select is 44px high and keeps its compact width on desktop and mobile. Whole controls can move onto a new row. Chromium verified all four period modes at both widths.

The owner approved using the public hub introduction on the authenticated dashboard. The dashboard shows the same text above the daily results controls. Targeted ESLint passed.

## Production export handoff

`src/scripts/export-daily-gainers-release.py` takes one saved dashboard snapshot and a new output directory. It makes an indexable static bundle under `static/stock-gainers/`, copies the same snapshot to `dashboard/archive.json`, and records a SHA-256 manifest. The private renderer defaults to noindex. The first release export was verified against its 493 file digests and made read-only. It covers 467 sessions, 4,670 rows, and 491 public pages through November 11, 2026.

The production refresh should run as a dedicated VPS job after the U.S. close, with its own archive and credential binding. It should reconcile recent bars, export into a new immutable directory, and validate the manifest and latest trading date before handing off the bundle. Promote the static files and sitemap through the public static release lane and atomically replace the app snapshot at its own provisioned path. Preserve the previous release for rollback. Mark the update complete after both hosted surfaces show the same expected latest date. The existing private timer writes only private files. Production transport, promotion, and hosted checks are Coordinator work.
