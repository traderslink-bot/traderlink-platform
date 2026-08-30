# TradersLink Trade Analytics Static Landing Page Plan

**Status:** Owner review required before HTML/CSS implementation

**Progress record:** [Trade Analytics Static Landing Page Progress](trade-analytics-static-landing-page-progress.md)

## Outcome

Create a static, SEO-focused `/trade-analytics` product page that shows active
traders how TradersLink turns confirmed completed trades into performance
patterns they can investigate. The page must keep every summarized result
connected to the underlying trades, executions, reviews and saved Trade
Analyzer chart.

The page must not resemble a generic collection of journal statistics. Its
story moves progressively deeper:

**Performance -> Patterns -> Trade groups -> Individual trades -> Executions -> Trade Analyzer**

Trade Explorer is a central part of this story. It overlaps the prepared
Ticker, Timing and Trade Breakdown views because it can reorganize completed
trades as trades, trading days, tickers, entry times, holding times, position
sizes and periods. The distinction is:

- Analytics Overview, Ticker, Timing and Trade Breakdown provide fast,
  prepared views of important results.
- Trade Explorer lets the trader investigate their own question, change the
  grouping, filter the population and open the exact trades behind a result.
- Compare Trades places two to four independently selected trade groups beside
  one another.

Small-cap positioning appears naturally in entry-price, ticker, timing,
position-size and trading-behavior copy. It must not be forced into every
section.

## Canonical page and SEO contract

- Canonical URL: `https://traderslink.pro/trade-analytics`
- Indexed path: `/trade-analytics`
- `/trade-analytics/` redirects to the canonical no-trailing-slash path.
- SEO title: `Trade Analytics for Day Traders | TradersLink`
- Meta description: `Analyze your trading performance by ticker, entry time, holding time, position size, price range, and more. Find patterns and open the completed trades behind them.`
- Primary keyword: `trade analytics`
- Supporting intent:
  - `trading analytics`
  - `trading performance analysis`
  - `analyze trades`
  - `trading performance metrics`
  - `trade statistics`
  - `trading journal analytics`
  - `small cap trading analytics`
  - `trading performance tracker`

The page must include canonical, robots, Open Graph and X/Twitter metadata,
plus a real TradersLink product screenshot as the social preview image. Visible
FAQ content and `FAQPage` structured data must match exactly.

## Complete page structure and approved copy direction

### 1. Hero

**Eyebrow:** `Trade Analytics`

**H1:** `Trade analytics built around the trades you actually took.`

**Opening copy:**

Turn your completed trades into patterns you can use. TradersLink connects your
overall performance to the timing, tickers, price ranges, position sizes,
holding times and individual trades behind the results.

Start with the numbers. Follow what stands out. Keep investigating until you
reach the trades and executions that produced it.

**Primary CTA:** `Sign up free`

**CTA destination:** `https://traderslink.pro/beta`

**CTA note:** `No credit card required.`

**Visual composition:**

Use a layered composition rather than a full-dashboard screenshot. Combine:

- Net P/L;
- win rate;
- profit factor;
- one colorful Trade Timing chart; and
- a partial Trade Explorer or Ticker Analytics view.

The hero and later feature sections must not reuse the exact same screenshot
composition. On mobile, recompose real responsive dashboard captures rather
than shrinking the desktop collage.

### 2. Performance Overview

**Eyebrow:** `Performance Overview`

**H2:** `Start with the complete picture.`

**Copy direction:**

Net P/L says where the selected period ended. It does not explain how the
result was produced. TradersLink brings the core performance numbers together
so the trader can understand their relationship. A strong win rate can still
produce a poor result when losses are too large. A lower win rate can work when
winners consistently outweigh losers. Profit factor, expectancy, average wins,
average losses and completed-trade count put the headline result into context.

Show and explain:

- Net P/L
- Win rate
- Profit factor
- Expectancy
- Average win
- Average loss
- Largest win
- Largest loss
- Completed trades
- Monthly Net P/L

The page should sell what these numbers help the trader understand, not merely
define each metric. A profitable period may still contain a weakness worth
investigating. A losing period may still contain a ticker, time range or trade
type that performed well.

**Visual composition:**

Break the nine supplied overview cards into three independently positioned
groups:

1. Net P/L, win rate and profit factor.
2. Expectancy, average win and average loss.
3. Largest win, largest loss and completed trades.

Add a real Monthly Net P/L chart beneath or behind the groups once a suitable
capture is available. Do not present the nine cards as one large screenshot.

### 3. Trade Explorer

**Eyebrow:** `Trade Explorer`

**H2:** `Explore your trading from every angle.`

**Copy direction:**

Most dashboards provide a fixed summary. Trade Explorer lets the trader
reorganize the same confirmed completed trades around the question they want
to answer.

Present every implemented view:

- Trades
- Trading days
- Tickers
- Entry times
- Holding time
- Position size
- Periods

Explain realistic investigations such as reviewing losing trades in one
ticker, isolating entries after a particular time, comparing larger positions
with smaller ones or examining a difficult week.

Explain the implemented controls and drill-down:

- filter by closing date, ticker, direction, result and trade type;
- sort around the result or characteristic being studied;
- change between grouped views and individual completed trades;
- open a trade to inspect entries, exits and individual executions;
- review or update the trade's notes, tags and trading rules; and
- open its saved Trade Analyzer chart when chart coverage is available.

The key message is direct:

> Trade Analytics should not force the trader to accept the question the
> dashboard decided to answer. Trade Explorer lets the trader ask their own.

**Visual composition:**

Make this one of the page's largest visual chapters. Lead with the view
selector, filters and sorting controls, with the results extending beneath.
Layer a real trade-detail panel beside it to show the path from a group into an
individual trade. Use the real responsive Trade Explorer capture on mobile.

### 4. Trade Timing

**Eyebrow:** `Trade Timing`

**H2:** `See when your trading has worked best.`

**Copy direction:**

Trading results can change considerably through the day. The trader may find
that opening trades perform differently from later entries, one weekday
creates activity without strong results, or premarket trades behave
differently from regular-hours trades.

Present every Timing view:

- Entry time
- Exit time
- Day of week
- Trading session

Present the available measures:

- Net P/L
- Average P/L per trade
- Win rate
- Trade count

Explain that the largest total result and the most consistently supported
result may not be the same. One large winner can dominate total P/L, while a
larger group of repeated trades may tell the trader more about how that period
has worked for them.

**Visual composition:**

Lead with the colorful Day of Week and Trading Session views. Use Entry Time
and Exit Time bars as supporting layers. Desktop may use the supplied small
captures; mobile must use the real responsive timing charts.

### 5. Trade Breakdown

**Eyebrow:** `Trade Breakdown`

**H2:** `Find the trade conditions behind your results.`

**Copy direction:**

Trade Breakdown organizes completed trades by the characteristics that may be
influencing the trader's results:

- Entry price
- Entry size
- Maximum position size
- Holding time
- Direction
- Day trade or multi-day trade

#### Entry Price Analysis

Entry price deserves the strongest emphasis because it supports the natural
small-cap angle. A sub-dollar stock, a $3 momentum name and a higher-priced
small cap can present different liquidity, volatility, spread, size and
behavior. Show the trader which price ranges produced their strongest results
and which repeatedly worked against them.

Then connect price with size and holding time. The useful question may not be
only what was traded, but how large the position became, how long it remained
open or how the trader behaved in that price range.

#### Position Size

Explain that P/L alone can hide what happens as position size changes. The
trader may make more dollars on larger positions while producing weaker
average trade quality, or may find that increased size has worked only in
certain conditions.

#### Holding Time

Explain how comparing short and longer holds can reveal whether additional
time historically improved results or allowed profitable trades to weaken.

Every summarized price, size or holding-time group must remain connected to
the completed trades and exact executions underneath it.

**Visual composition:**

Lead with the Entry Price Results summary and colored price table. Layer the
Holding Time, Entry Size and Maximum Position captures around it. Do not use
one large full-dashboard screenshot as the entire section.

### 6. Ticker Analytics

**Eyebrow:** `Ticker Analytics`

**H2:** `Find the tickers that have helped—or hurt—your trading.`

**Copy direction:**

Ticker Analytics compares the selected completed-trade results symbol by
symbol using:

- Net P/L
- Win rate
- Profit factor
- Completed trades
- Trading days
- Average P/L

Explain that the trader can search and sort the ticker list, then open a ticker
to see the completed trades behind it. Useful questions include whether a
strong result came from one exceptional trade or repeated performance, whether
a ticker has repeatedly produced losses, and whether price, timing or trade
management helps explain the result.

The ticker side panel can expose the completed trades, exact executions and
saved Trade Analyzer chart where available. A ticker result must never feel
like an isolated number.

**Visual composition:**

Use the ticker results table as the anchor. Layer a ticker-specific trade list
or responsive trade-detail panel over one edge. A partial Analyzer chart may be
used only if it improves the visual connection and does not duplicate the
later Analyzer bridge.

### 7. Compare Trades

**Eyebrow:** `Compare Trades`

**H2:** `Test the patterns you think you see.`

**Copy direction:**

Compare Trades lets the trader build two to four independently filtered groups
of confirmed completed trades and place their results side by side.

Use accurate examples:

- one week against another;
- one ticker against another;
- long trades against short trades;
- profitable trades against losing trades;
- day trades against multi-day trades;
- morning entries against later entries;
- one holding-time range against another;
- smaller positions against larger positions; and
- one entry-price range against another.

Present the implemented comparison results:

- Completed trades
- Net P/L
- Win rate
- Average P/L
- Profit factor
- Expectancy
- Return on entry value
- Average holding time
- The difference between groups

The personal value is turning a suspicion into something measurable. The
trader can test whether a perceived pattern remains visible when the groups
are compared directly.

**Visual composition:**

Use two clear layers: group-builder controls above and comparison results
below. Avoid making the visitor decipher a giant table before understanding
the comparison concept. Use the real responsive Compare Trades UI on mobile.

### 8. Connected Analysis Workflow

**Eyebrow:** `From Pattern to Trade`

**H2:** `Follow every pattern back to the trades behind it.`

Present the complete workflow:

1. **Notice what stands out.** Start with overall performance or one prepared
   Analytics view.
2. **Narrow the result.** Isolate a timing range, ticker, price range, holding
   time or position size.
3. **Find the exact trades.** Use Trade Explorer to open the completed trades
   responsible for the result.
4. **Review what happened.** Inspect entries, exits, executions, notes, tags,
   trading rules and the saved Analyzer chart.
5. **Compare when needed.** Build selected groups and see whether the
   difference remains visible side by side.

Close with:

**Performance -> Pattern -> Trades -> Executions -> Context**

**Visual composition:**

Use a narrow progression built from small real interface pieces: an Analytics
card or chart, Trade Explorer, trade detail, execution view and Analyzer chart.
Do not use generic icons when the real product can tell the story.

### 9. Trade Analyzer bridge

**Eyebrow:** `Go Deeper`

**H2:** `The numbers show you where to look. Trade Analyzer helps you study what happened there.`

**Copy direction:**

Trade Analytics identifies trades worth investigating. Trade Analyzer studies
the completed trade against its saved market data. Briefly connect the chart,
entries and exits, supported candle patterns, Session VWAP, EMA 9, MFE and MAE,
Green-to-Red results, profit taking and risk management.

Keep this section shorter than the Analytics chapters because the complete
product story already lives on the dedicated Analyzer landing page.

**CTA:** `Explore Trade Analyzer`

**CTA destination:** `/trade-analyzer`

**Visual composition:**

Use one strong real Trade Analyzer chart image. It must differ from any
Analyzer image used earlier on this page.

### 10. FAQ

**H2:** `Questions you may want answers to.`

Use accessible accordion controls and include the following visible answers.
The JSON-LD must match this content exactly.

#### What is trade analytics?

Trade analytics is the process of reviewing completed trading data to
understand how different parts of trading relate to performance. Instead of
looking only at total profit and loss, traders can examine entry time, ticker,
price range, position size, holding time, win rate, expectancy, profit factor
and the individual trades behind those results.

#### What trading metrics should I track?

Useful trading metrics include Net P/L, win rate, profit factor, expectancy,
average win, average loss, completed-trade count and average P/L per trade. The
most useful analysis usually comes from combining those metrics with the
conditions behind the trades, such as when they were entered, the ticker,
position size and holding time.

#### Can I analyze my trades by ticker or entry time?

Yes. TradersLink can organize completed trades by ticker, entry time, exit
time, day of week, trading session, holding time, position size, entry price
and other recorded trade characteristics. Trade Explorer can then open the
individual trades behind those summarized results.

#### Can trade analytics help identify trading patterns?

Trade analytics can surface repeated differences in recorded results. A trader
may find that particular entry times, price ranges, holding periods, tickers or
position sizes produced stronger or weaker outcomes, then inspect the
underlying trades instead of relying only on the summary.

#### Is TradersLink useful for small-cap traders?

Yes. TradersLink is built with active small-cap trading in mind. Entry-price
ranges, ticker results, timing, position size, holding time, executions and
trade-level analysis help traders study how their own decisions change across
the fast-moving stocks they trade.

#### Can I compare different groups of trades?

Yes. Compare Trades places two to four selected groups of completed trades
side by side. Traders can compare periods, tickers, directions, results, trade
types, entry times, holding times, position sizes and entry-price ranges using
P/L, win rate, profit factor, expectancy, average P/L, return on entry value
and average holding time.

#### How do completed trades reach Analytics?

Confirmed completed trades entered through the Daily Trade Tracker, Quick
Trade Entry or supported trade imports feed the same TradersLink trading
journal. Analytics organizes those completed trades without changing the
recorded executions.

### 11. Final CTA

**H2:** `Your completed trades already contain the data.`

**Copy:**

The next step is turning it into something useful. Track your trades, study
your performance, investigate the patterns behind your results and keep every
conclusion connected to the trades that produced it.

**Primary CTA:** `Sign up free`

**CTA destination:** `https://traderslink.pro/beta`

**CTA note:** `No credit card required.`

The final CTA is followed by the approved footer, legal links and consent
behavior. There is no unimplemented `See How TradersLink Works` link.

## Internal-linking contract

Use contextual links only:

- Hero or Performance Overview may link `completed trades` or `trading
  journal` to `/trading-journal`.
- Trade Explorer may link its journaling context to `/trading-journal`.
- Trading Rules must link to `/trading-journal`; there is no separate public
  Trading Rules landing page.
- Ticker Analytics may link `Trade Analyzer chart` to `/trade-analyzer`.
- The Analyzer bridge uses `/trade-analyzer` as its primary internal link.
- The homepage Features menu and homepage Analytics section link to
  `/trade-analytics` when implementation is approved.

Signup buttons remain signup CTAs and point exactly to
`https://traderslink.pro/beta`; they are not repurposed as feature links.

## Visual and responsive contract

- Match the approved visual language of `/trading-journal` and
  `/trade-analyzer` without copying either page section for section.
- Use a white public header, varied section surfaces, layered real product
  screenshots, restrained depth and visible section rhythm.
- Avoid a repeated pattern of equal rectangular screenshots in equal cards.
- Preserve every screenshot's intrinsic ratio; never stretch an image.
- Use overlap, controlled overflow, independent crops and CSS-created
  decorative surfaces.
- Desktop screenshots remain desktop-only where their UI cannot be read on a
  phone.
- Use real responsive dashboard captures for mobile timing, ticker, Trade
  Explorer, Trade Breakdown and Compare Trades compositions.
- The public header collapses to the approved hamburger menu on mobile.
- Mobile tab controls, when used, sit adjacent to the images they control.
- Ensure no horizontal page overflow at small phone widths.
- Decorative motion is limited to noticeable but restrained on-scroll section
  entry; all essential content remains visible without animation.
- Respect `prefers-reduced-motion`.

## Existing screenshot inventory

The reviewed Desktop asset source is
`C:\Users\jerac\Desktop\traderslink-static-landing-pages\landing-assets\analytics\`.
Existing useful captures include:

- `9-card-to-crop-into-individual-card.png`
- `day-of-week-trading-session.png`
- `day-of-week-bars.png`
- `day-of-week-column.png`
- `entry-time.png`
- `exit-time.png`
- `trades-by-day-of-week-small-circle.png`
- `trades-by-session-circle.png`
- `entry-price-results.png`
- `entry-price-table-results.png`
- `trade-hold-time-pl.png`
- `results-by-ticker.png`
- `ticker-analytics-full-dashboard.png`
- `trade-explorer.png`
- `trade-comparison.png`
- `part-tweo-of-trade-comparison.png`

Existing real responsive captures under `landing-assets/mobile-2/` include:

- `trade-analytics-day-of-week-real-mobile.png`
- `trade-analytics-session-real-mobile.png`
- `trade-breakdown-real-mobile.png`
- `ticker-analytics-real-mobile.png`
- `etrade-explorer-no-scroll-video.png`
- `trade-comparison-real-mobile.png`

A real Monthly Net P/L capture and any additional responsive captures should be
collected only if the page composition needs them. Desktop originals must
remain unchanged; implementation copies selected assets into the static site.

## Static implementation contract

After owner approval of this plan:

- Add `static-landing-site/trade-analytics/index.html`.
- Add selected assets under
  `static-landing-site/landing-assets/trade-analytics/`.
- Add the exact static Nginx route for `/trade-analytics` and relative redirect
  for `/trade-analytics/` without disturbing Platform proxy ownership.
- Add the Docker copy for the page directory and verify every Docker COPY
  source exists.
- Add `/trade-analytics` to `landing-pages-sitemap.xml`.
- Update homepage navigation and the existing Analytics feature links without
  changing signup CTA destinations.
- Reuse the approved header, logo, Help/Login links, hamburger behavior,
  consent storage contract, Privacy and Terms links, footer copy and footer
  background treatment.
- Use scoped static HTML, CSS and JavaScript only. Do not add a public API,
  database, authentication, dashboard or analytics-engine change.

## Copy rules

1. Speak about what the trader can learn, not only what the software contains.
2. Avoid repeating `TradersLink allows you to`.
3. Use actual product terminology and implemented feature names.
4. Explain why related metrics should be considered together.
5. Keep small-cap references natural and relevant.
6. Avoid exaggerated promises such as `transform your trading` or `unlock your edge`.
7. Do not fill the page with repetitive legal or cautionary copy.
8. Do not imply that a historical result guarantees a future outcome.
9. Keep every summarized result connected to the trades underneath it.
10. Make the page read like a continuous investigation, not a feature list.

## Owner-review checkpoints

Mobile is designed and reviewed at the same time as desktop. A checkpoint is
not complete when only its desktop composition works. Each checkpoint includes
small-phone stacking, spacing, navigation, image legibility and real responsive
dashboard captures where available.

1. **Plan and copy:** approve page narrative, section order and copy direction.
2. **Hero, Overview and Trade Explorer:** approve the desktop and mobile opening
   visual system and the largest product chapter before the remaining page is
   styled.
3. **Timing, Breakdown and Ticker:** approve desktop and mobile versions of the
   core Analytics chapters and their image compositions.
4. **Compare, workflow, Analyzer bridge, FAQ and CTA:** approve the complete
   desktop and mobile page flow.
5. **Final QA:** verify metadata, structured data, assets, navigation,
   accessibility, consent, internal links, CTAs, redirects and all three
   existing static pages before any release handoff.

Do not deploy until the owner gives explicit final visual approval and the
Coordinator opens the static release lane.
