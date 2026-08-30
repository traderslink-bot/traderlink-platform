# Trade Analyzer Static Landing Page Plan

**Status:** Owner approved release candidate; serialized publication pending

**Progress record:** [Trade Analyzer Static Landing Page Progress](trade-analyzer-static-landing-page-progress.md)

**Related public-site plan:** [Railway Public Site Cutover Plan](railway-public-site-cutover-plan.md)

## Goal

Build a static, SEO-focused `/trade-analyzer` product page that shows traders
how TradersLink turns a completed trade into chart analysis, execution-level
analysis, and longer-term evidence about entries, exits, MFE and MAE, profit
capture, risk management, and candle patterns.

The page must use plain trader-facing language and the owner's real dashboard
screenshots. It must feel like the approved `/trading-journal` page without
copying that page section for section: a white public-site header, a strong
layered hero, varied section surfaces, asymmetrical screenshot compositions,
real FAQs, the existing analytics-consent behavior, the approved footer, and
`https://traderslink.pro/beta` for every signup CTA.

The page explains observed trading evidence. It must not present a pattern,
comparison, measured opportunity, or historical result as a prediction,
trading signal, causal claim, or prescribed exit.

## Audience and search intent

The primary audience is an active day trader who has completed trades but wants
more than a P/L number or a basic trade log. The page speaks to traders trying
to understand entry quality, exit timing, profit giveback, risk exposure, and
repeatable behavior across completed trades.

- Primary intent: `trade analyzer`
- Supporting intent: `trading analysis tool`, `trade analysis`, `day trade
  analyzer`, `entry and exit analysis`, `MFE and MAE`, `maximum favorable
  excursion`, `maximum adverse excursion`, `green to red trading`, `profit
  taking analysis`, `risk management analysis`, and `candlestick pattern
  analysis`
- Conversion intent: understand the product, recognize a useful review
  workflow, and create a free TradersLink account.
- Non-target intent: live trade signals, automated financial advice,
  predictive pattern scores, or a standalone charting platform.

## Complete page inventory

### 1. Hero — **A Trade Analyzer that shows what happened between entry and exit.**

- Introduce the Analyzer as the next step after a trade is completed.
- Explain that TradersLink connects the chart, executions, written analysis,
  and saved results rather than reducing review to the final P/L.
- Use `chart-with-trades.png` as one dominant hero image. It shows the Analyzer
  chart and the completed trades beneath it with enough vertical depth to stand
  alone; do not layer smaller screenshots over it.
- Primary CTA: `Sign up free`.
- Supporting note: `No credit card required.`

### 2. Chart analysis — **Analyze the completed trade on the chart.**

- Explain numbered buy/sell executions, the selected execution detail, candle
  OHLC context, volume and turnover, Session VWAP, timeframe-specific EMA 9,
  candle-pattern labels, and one-minute/five-minute review.
- Show how the chart belongs to the completed trade inside the Daily Trade
  Tracker while keeping the Analyzer useful as a focused review tool.
- Keep this visual deliberately simple: the Strong Bullish Candle on the chart,
  its matching detail panel, and the separate OHLC-value crop aligned below
  them. Reserve the wide candle-name legend and busier multi-pattern crops for
  the Candle Patterns chapter.

### 3. Written analysis — **Move from the chart to the details behind the trade.**

- Show the supplied one-minute, five-minute, and combined-exit analysis crops.
- Explain that each fill can retain its exact time, shares, price, side,
  execution-candle position, nearby patterns, market context, and measured
  favorable/adverse movement where supported.
- Distinguish one execution's response from the combined path of the completed
  trade.

### 4. Entry & Exit — **Study every entry, add, partial exit, and final exit.**

- Explain execution-level entry and exit review in plain language.
- Cover Session VWAP and EMA 9 distance in dollars and percentage, relative
  volume, volume and turnover, execution-candle context, favorable/adverse
  movement, saved time paths, and exit giveback where the saved evidence
  supports them.
- Use the four individual opportunity/risk cards as floating details, the
  colored entry-context table as the main evidence surface, and the full
  dashboard view only as supporting context.
- Do not imply that proximity to VWAP/EMA or any cohort caused a result.

### 5. MFE & MAE — **See how far price moved for you—and against you.**

- Define Maximum Favorable Excursion and Maximum Adverse Excursion in ordinary
  language before using the abbreviations repeatedly.
- Explain that TradersLink measures favorable and adverse price movement after
  each eligible entry or add until the position becomes flat.
- Show dollar-per-share and percentage-of-entry-price results, including
  average and median comparisons.
- Use the nine individual cards in a varied cluster around one wider MFE/MAE
  evidence view. Preserve the red/green meaning of the supplied values.

### 6. Green-to-Red — **See where open profit became giveback.**

- Speak directly to the review problem: a trade moved into profit, then some or
  all of that opportunity disappeared before the final exit.
- Explain actual result, strongest sustained completed-close opportunity,
  potential result, missed opportunity, peak profit retained, peak-to-red and
  peak-to-exit damage, time before turning red, recovery, adding after the
  measured peak, and partial exits before the first move below breakeven.
- Use the colored Profit Capture and Green-to-Red outcome cards, then the
  colored risk-management table. The full-dashboard image provides context but
  does not replace the smaller evidence details.
- State that the comparisons show observed outcomes and do not prove that
  holding, adding, or scaling out caused the result.

### 7. Candle Patterns — **Connect candle patterns to real executions.**

- Explain that the detector saves completed-candle observations around entries
  and exits on one-minute and five-minute views.
- Use the chart legend, labeled candle crops, pattern detail crops, colored
  results table, detected-results view, and most-observed-pattern view.
- Give concise educational definitions for the complete current detector
  inventory: Compression; Bullish and Bearish compression break; Bullish and
  Bearish engulfing shift; Bullish and Bearish expansion; Confirmed Hammer;
  Confirmed Shooting Star; Lower-wick and Upper-wick rejection; and Possible
  high-volume exhaustion.
- Explain that confirmation uses completed candle facts, patterns after an
  execution are excluded from entry/exit comparison, and an observation is not
  a prediction or trading signal.

### 8. Long-term results — **Turn completed trade reviews into patterns you can study.**

- Connect the single-trade analysis to the saved Entry & Exit, MFE & MAE,
  Green-to-Red, Candle Patterns, and Analyzed Trades result pages.
- Explain that traders can compare groups, inspect colored tables and cards,
  and return to the supporting completed trade without treating averages as
  advice.
- Use one restrained full-dashboard sequence or a tabbed static composition;
  do not create an automatic slideshow or moving carousel.

### 9. FAQ — **Questions you may want answers to**

Include accessible accordions with visible answers and matching structured
data:

1. What is a trade analyzer?
2. How does TradersLink analyze entries and exits?
3. What do MFE and MAE mean in trading?
4. What does Green-to-Red analysis show?
5. Which candle patterns can TradersLink detect?
6. Does the Trade Analyzer provide trade signals or financial advice?
7. Can I open Trade Analyzer from the Daily Trade Tracker?

FAQ copy must follow the implemented data-availability boundaries and must not
promise analysis for every imported historical trade.

### 10. Final CTA and footer

- CTA heading: `Analyze your trades inside TradersLink.`
- CTA button: `Sign up free`.
- CTA destination: `https://traderslink.pro/beta`.
- Supporting note: `No credit card required.`
- Preserve the approved consent dialog, legal links, footer wording, and footer
  background from the current static homepage and Trading Journal page.

## Visual system

- Reuse the approved public header, TradersLink logo, deep navy, brand blue,
  dark-slate text, button treatment, footer, and consent dialog.
- Give the page its own scoped CSS and JavaScript in
  `static-landing-site/trade-analyzer/index.html`.
- Use a deep-navy hero with restrained chart/grid decoration. Below it,
  alternate white, pale blue, warm off-white, and one restrained pale-green or
  cool-gray evidence surface so adjacent chapters remain visually distinct.
- Avoid a repeated two-column text-plus-one-large-image template. Use layered
  crops, floating metric cards, edge-aligned tables, visual sequences, and
  occasional full-dashboard anchors.
- No automatic carousels, auto-tabbing, or scroll videos. Owner direction on
  the homepage rejected those motion patterns as distracting.
- Retain the approved noticeable-on-scroll reveal for major sections, omit it
  from the final CTA/footer, and respect `prefers-reduced-motion`.
- Never stretch screenshots. Use intrinsic dimensions, `object-fit: contain`,
  controlled overflow, purposeful crops, and separate mobile crops only when
  a wide table/chart would otherwise be unreadable.
- Mobile must preserve legibility of the chart, card values, and table labels;
  decorative overlaps become ordered stacks rather than tiny desktop
  collages.

## Current source-asset inventory

The owner's Desktop source folder contains 66 reviewed source/crop files:

- 15 root chart, candle-detail, and written-analysis images;
- 4 Candle Patterns images;
- 10 Entry & Exit images;
- 24 Green-to-Red images; and
- 13 MFE & MAE images.

The exact inventory and copy status are recorded in the progress file. Four
full-dashboard images are already present in the tracked static asset tree.
The remaining selected source files will be copied into
`static-landing-site/landing-assets/trade analyzer/` without modifying or
overwriting the owner's Desktop originals. Not every supplied image must be
visible at once; every selected visual must have a stated role, and unused
options remain available for later owner revisions.

## Static route and internal-link contract

- Source document: `static-landing-site/trade-analyzer/index.html`.
- Canonical URL: `https://traderslink.pro/trade-analyzer`.
- `/trade-analyzer/` redirects to the canonical no-trailing-slash URL.
- All unrelated routes continue proxying unchanged to Platform.
- Add `Trade Analyzer` to the homepage Features menu and add restrained
  contextual links from the homepage Analyzer chapter and the Trading Journal
  Analyzer chapter. Existing signup buttons stay signup CTAs.
- Header links remain Features, Help, Log in, and Sign up free. Help and Log in
  keep their current destinations.
- Add `/trade-analyzer` to `landing-pages-sitemap.xml`; static `robots.txt`
  continues to advertise the static and proxied Platform sitemaps.

## SEO contract

- Title: `Trade Analyzer for Day Traders | TradersLink`
- Description: `Analyze completed trades and study entries, exits, MFE and MAE, profit giveback, risk management, and candle patterns with TradersLink Trade Analyzer.`
- One H1 containing `Trade Analyzer`, semantic heading order, descriptive image
  alternatives, and trader-facing copy that naturally covers the supporting
  intent without keyword repetition.
- Canonical, robots, Open Graph, and X/Twitter metadata use the canonical
  no-trailing-slash URL and a real Analyzer screenshot social image.
- Add `WebPage`, `SoftwareApplication`, `BreadcrumbList`, and `FAQPage`
  structured data only where the visible page supports the same facts.
- FAQ structured data must exactly match the visible questions and answers.
- Every image declares intrinsic dimensions. Below-the-fold images use lazy
  loading and asynchronous decoding; only the primary hero image receives high
  fetch priority.
- Internal links use descriptive anchor text and connect `/`,
  `/trading-journal`, and `/trade-analyzer` without creating duplicate keyword
  pages such as `/trade-analysis`.

## Accessibility and performance contract

- Navigation, menus, FAQ controls, and all interactive elements are keyboard
  operable with visible focus states.
- Decorative images use empty alternatives; product screenshots use concise
  alternatives describing the useful visible fact rather than filenames.
- Color is never the only explanation for favorable/adverse or positive/
  negative results.
- Respect reduced-motion preferences and avoid autoplaying media.
- Preserve source aspect ratios and reserve image space to limit layout shift.
- Prefer the small supplied crops over repeatedly loading full-dashboard PNGs;
  optimize copies only after confirming that text remains readable.

## Staged implementation and owner checkpoints

### Stage 0 — Plan and asset contract

- Save this plan and its progress tracker.
- Record the complete 66-file Desktop inventory and the current four tracked
  assets.
- Receive owner approval of the page order, copy direction, and hero concept
  before editing the page.

### Stage 1 — Hero and chart analysis

- Copy only the assets required for the hero and chart chapter.
- Build the static page shell, approved header, hero, and chart analysis.
- Owner reviews the dominant hero image, simplified Chart Analysis composition,
  copy, section width, and mobile
  direction before Stage 2.

### Stage 2 — Written analysis and Entry & Exit

- Add the one-minute/five-minute written-analysis chapter.
- Add Entry & Exit with its colored context table and four individual cards.
- Owner reviews clarity, visual variety, and factual wording before Stage 3.

### Stage 3 — MFE & MAE and Green-to-Red

- Add the MFE/MAE definition and metric-card composition.
- Add Profit Capture, Green-to-Red outcomes, and risk-management evidence.
- Owner reviews card density, colored evidence, and non-causal wording before
  Stage 4.

### Stage 4 — Candle Patterns, long-term results, FAQ, and desktop flow

- Add the detector explanation and supported-pattern teaching content.
- Add the long-term-results bridge, visible FAQ, final CTA, consent, and footer.
- Complete the full desktop flow and receive owner approval.

### Stage 5 — Responsive, SEO, and focused verification

- Complete the phone/tablet recomposition and owner mobile review.
- Verify HTML and JavaScript parsing, local asset references, Nginx route and
  redirect behavior, canonical and social metadata, JSON-LD, heading order,
  keyboard navigation, focus, reduced motion, consent, CTA destinations,
  sitemap inclusion, intrinsic image sizing, and responsive overflow.
- Do not run the Platform production build or broad test suites; this page
  belongs to the independent static Railway service.

### Stage 6 — Release handoff

- Create narrow local checkpoints only for owner-accepted, verified slices.
- Do not deploy until the owner gives explicit final visual approval and the
  Coordinator opens the static-site release lane.
- Release verification must cover `/trade-analyzer`, its canonical redirect,
  every CTA/internal link, Help, Login, Privacy, Terms, consent, static assets,
  mobile behavior, and the existing proxied public routes.

## Explicit boundaries

- No dashboard, data, API, authentication, database, Analyzer calculation, or
  analytics-tracking changes.
- No invented results, modified dashboard values, generated product imagery,
  predictive claims, trade signals, or financial advice.
- No production build, Git push, Railway change, DNS change, or deployment
  without the later explicit release boundary.
- `/trade-analyzer` is the sole canonical SEO path. Do not add duplicate
  `/trade-analysis`, `/day-trade-analyzer`, or plural landing pages.
