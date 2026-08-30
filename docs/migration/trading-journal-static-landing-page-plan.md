# Trading Journal Static Landing Page Plan

**Status:** Owner approved and live in production

**Progress record:** [Trading Journal Static Landing Page Progress](trading-journal-static-landing-page-progress.md)

## Goal

Build a static, SEO-focused `/trading-journal` page that sells TradersLink's
journaling capabilities through trader-facing benefits, varied visual
storytelling, and real dashboard screenshots. The page is part of the Railway
static front door and must not require a Platform application rebuild.

The page uses a white site header, a deep-navy layered hero, varied section
backgrounds, real starter FAQs, the existing analytics-consent behavior, the
approved footer, and `https://traderslink.pro/beta` for every signup CTA.

## Complete page inventory

1. Hero: **A trading journal for the whole trading day.**
2. Trading Calendar: **See the week. Open the story behind any day.**
3. Trading Rules: **Put your trading rules where the results can answer them.**
4. Trade Notes: **Keep the reason, the decision, and the lesson with the trade.**
5. Trade Tags: **Turn the details you notice into patterns you can study.**
6. Ways to Journal: **Journal the day or quickly review a single trade**
7. Daily Trade Tracker: **Bring the entire trading day together.**
8. Trade Analyzer: **Take the completed trade one step further.**
9. Session Notes: **Finish the day with something useful to carry forward.**
10. FAQ with six accurate, visible questions and matching structured data.
11. Final signup CTA and the approved legal footer.

## Visual and content contract

- The hero uses three new closed ticker-card screenshots arranged with depth on
  a deep-navy background. Calendar screenshots are reserved for the Calendar
  chapter and do not repeat in the hero.
- Calendar uses a pale-blue grid surface and composes the full week, weekly
  metrics, day drawer, and week row without placing every image in an equal
  card.
- Rules presents the Max Trades preset as one progression: select, add,
  configure, activate, and inspect results. Broken-rule details and the
  multi-rule results view complete the story.
- Notes uses the individual trade note as the anchor and reveals where it lives
  within a trade and ticker.
- Tags explains setup, execution, exit, emotion, mistake, and custom categories
  and connects them to later filtering and Analytics.
- Ways to Journal covers the compact Trade Explorer drawer, swing trade
  journaling, and direct day trade or swing trade execution entry.
- Daily Trade Tracker uses the single wide
  `execution-trades-ticker-analyzer-chart.png` product screenshot, which keeps
  the chart, executions, trade, ticker, rules, and notes in one real view. Its
  copy explains the saved full-day record and introduces Analyzer review of
  entries, exits, candle patterns, profit taking, and risk management.
- Analyzer remains a supporting chapter and introduces Entry/Exit and
  Green-to-Red without replacing its future dedicated page.
- The pre-session preparation chapter was removed from this page by owner
  direction. Its standalone HTML/CSS is preserved in the owner's Desktop
  `traderslink-static-landing-pages` folder as reusable reference material;
  no separate public Trading Tools landing page is planned.
- Session Notes uses the full mobile notes view and the four individual note
  types in an editorial composition.
- Decorative surfaces are CSS, not invented product imagery. Screenshots keep
  their intrinsic proportions and must never be stretched.

## Static route and navigation contract

- Source document: `static-landing-site/trading-journal/index.html`.
- Canonical URL: `https://traderslink.pro/trading-journal`.
- `/trading-journal/` redirects to the canonical no-trailing-slash URL.
- All unrelated paths continue proxying unchanged to the Platform service.
- The homepage Features menu includes `Trading Journal`, and the Daily Trade
  Tracker section includes one restrained contextual text link. Existing
  signup buttons remain signup CTAs.
- Header, Help, Login, consent storage, Privacy, Terms, and footer behavior stay
  consistent with the approved homepage.

## SEO contract

- Title: `Trading Journal for Day Traders | TradersLink`
- Description: `Journal your full trading day with trades, automatic rule results, notes, tags, weekly calendar views, session reviews, and trade analysis in TradersLink.`
- Primary intent: `trading journal`
- Supporting intent: `day trading journal`, `trading journal for day traders`,
  `stock trading journal`, `trade notes`, `trading rules`, and
  `trading calendar`
- Include canonical, robots, Open Graph, X/Twitter metadata, descriptive image
  alternatives, one H1, semantic heading order, and `FAQPage` JSON-LD that
  exactly matches the visible FAQ.
- The static front door owns `robots.txt` and a separate
  `landing-pages-sitemap.xml`. Robots references both the existing proxied
  Platform sitemap and the static landing-page sitemap so future landing pages
  do not require a dashboard build.
- Every screenshot declares its intrinsic dimensions. Below-the-fold images
  use lazy loading and asynchronous decoding; only the central hero screenshot
  receives high fetch priority.

## Accessibility and responsive contract

- Header menus and FAQ controls are keyboard operable with visible focus.
- Scroll effects respect `prefers-reduced-motion`.
- Mobile recomposes layered images into readable groups rather than shrinking
  desktop collages. A separate mobile crop is permitted only for the wide
  weekly-calendar screenshot; the source image remains unchanged.
- The consent dialog preserves its existing accessible dialog structure and
  storage contract.

## Owner review checkpoints

1. Hero, Calendar, and Rules composition.
2. Notes, Tags, and Ways to Journal.
3. Daily Tracker, Analyzer, Session Notes, FAQ, and full desktop
   flow.
4. Mobile layout and screenshot legibility.
5. Focused static, route, SEO, structured-data, accessibility, and browser
   verification.

Do not deploy until the owner gives explicit final visual approval and the
Coordinator opens the static release lane.
