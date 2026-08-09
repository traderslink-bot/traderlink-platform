# Help Center And Daily Trade Tracker Guides Plan

Status: draft for owner review; Help Center implementation has not started

Progress record: [Help Center And Daily Trade Tracker Guides Progress](./help-center-daily-trade-tracker-progress.md)

Related product records:

- [Day Trade Tracker And Swing Trade Tracker Plan](./day-and-swing-trade-tracker-plan.md)
- [Moomoo Daily Trade Tracker Analyzer Plan](./moomoo-daily-trade-tracker-analyzer-plan.md)
- [Moomoo Daily Trade Tracker Analyzer Progress](./moomoo-daily-trade-tracker-analyzer-progress.md)
- [AI Reviews And Paid Plan Help Guides Plan](./help-center-ai-reviews-and-paid-plan-plan.md)

## 1. Outcome

Create the first professional TraderLink Help Center inside the authenticated
dashboard. The initial release will establish the reusable Help Center layout,
navigation, search, start page and writing conventions, then publish a complete
Daily Trade Tracker guide collection.

The Help Center must help an ordinary trader answer three questions quickly:

1. What can I do here?
2. How do I do it?
3. What should I expect to happen next?

The content must describe the product the user can actually use. It must not
expose database, migration, worker, provider, contract or internal status
language.

## 2. Fixed product decisions

- Help is part of the TraderLink dashboard, not a separate documentation site.
- The existing light Material dashboard shell and global left navigation remain
  the visual baseline.
- The global dashboard navigation receives one clear **Help Center** link.
- Help has its own quieter article navigation inside the page. It does not add a
  second permanent application drawer.
- Desktop uses a Help article list on the left of the Help content. Mobile uses
  a **Browse help** control that expands the same list.
- The start page introduces the Help Center, provides search and shows the
  available guide collections. It does not display empty cards for future
  features.
- The first collection is **Daily Trade Tracker**.
- The Daily Trade Tracker is documented through several focused guides rather
  than one very long page.
- Help search is local to the published Help content. The first release does not
  need an external service, AI search, a CMS or a new database.
- Content is written in plain trader-facing language and defines unfamiliar
  terms before using abbreviations.
- Help must never imply that analysis is a prediction, a trading signal or
  investment advice.
- The current trade-path feature is titled **Green-to-red analysis**. Its Help
  coverage includes trades that never became profitable, stayed profitable,
  moved from green to red, recovered above breakeven, ended red or ended flat.
  Do not invent a separate **Red-to-green** panel unless the product later adds
  one; recovery from red is explained using the result the user actually sees.
- Help must distinguish current behavior from planned behavior. In particular,
  Moomoo candle access is active for chart analysis, while automatic Moomoo
  execution importing is not described as available until that feature is live.
- Overnight-session chart analysis is not presented as supported.
- No screenshots are required for the first implementation checkpoint. The
  layout and written content must work without them. Approved screenshots may
  be added later without changing the information architecture.

## 3. Route and navigation contract

### Global dashboard navigation

Add **Help Center** as a standalone global navigation item near **Account**. It
opens `/help` and uses a conventional help icon. Route-title resolution must
recognize Help Center routes so the dashboard header remains correct on every
article.

### Help routes

| Route | Purpose |
| --- | --- |
| `/help` | Help Center start page and search |
| `/help/daily-trade-tracker` | Daily Trade Tracker collection overview |
| `/help/daily-trade-tracker/getting-started` | Page tour and recommended daily workflow |
| `/help/daily-trade-tracker/add-edit-trades` | Entering, checking and correcting executions |
| `/help/daily-trade-tracker/review-trades` | Ticker cards, multiple trades, tags and execution selection |
| `/help/daily-trade-tracker/charts-analysis` | Charts, controls, timeframes and written analysis |
| `/help/daily-trade-tracker/rules-notes-day-review` | Rules, notes, open positions and finishing the day |
| `/help/daily-trade-tracker/data-timing-limitations` | Candle timing, final updates, coverage and supported boundaries |

Article slugs and order come from one typed Help registry so search, navigation,
breadcrumbs and previous/next links cannot drift apart.

## 4. Professional Help Center template

### Desktop

The dashboard's existing global sidebar remains unchanged except for the new
Help Center link. Inside the dashboard content area, Help uses this layout:

```text
+----------------------+----------------------------------------------+
| Help guides          | Breadcrumb                                   |
|                      | Article title and short summary               |
| Daily Trade Tracker  | In this guide                                 |
|   Getting started    |                                              |
|   Add and edit       | Article sections with steps and callouts      |
|   Review trades      |                                              |
|   Charts & analysis  | Previous guide              Next guide       |
+----------------------+----------------------------------------------+
```

- The Help navigation column is approximately 240 pixels wide and may remain
  visible while the article scrolls.
- The article uses a readable maximum width rather than stretching paragraphs
  across the entire dashboard.
- A separate permanent right-hand table of contents is intentionally omitted.
  The global sidebar, Help navigation and article are enough structure without
  crowding typical laptop widths.
- Each article begins with a compact **In this guide** list that links to its
  sections.

### Mobile

```text
+----------------------------------+
| Breadcrumb                       |
| Article title                    |
| [Browse help  +]                 |
| In this guide                    |
| Article content                  |
| [Previous]              [Next]   |
+----------------------------------+
```

- The dashboard's existing menu continues to own global navigation.
- **Browse help** expands the Help collection and article list in the content
  area. It must not trap the user in a second permanent drawer.
- The current article is clearly identified.
- Breadcrumbs, article controls, tables and callouts must not cause horizontal
  page overflow.
- Touch targets are at least 44 pixels high where practical.

### Article anatomy

Every guide uses the same order when the section applies:

1. Breadcrumb.
2. Clear title.
3. One-sentence explanation of what the guide helps the user do.
4. **In this guide** section links.
5. Short sections with steps, examples and definitions.
6. A relevant **Open Daily Trade Tracker** action when useful.
7. Previous and next guide links.

Callouts use plain labels:

- **Tip** for optional help.
- **Good to know** for behavior worth understanding.
- **Important** when the user could otherwise misunderstand or lose work.

The first release does not show a non-functional **Was this helpful?** control.
Feedback may be added only when there is a real place to save and review it.

## 5. Help Center start page

The start page includes:

- page title **Help Center**;
- a short welcome statement;
- a prominent search field labelled **Search help**;
- search results grouped by guide, with the matching article title, short
  summary and highlighted section name where available;
- one **Daily Trade Tracker** collection card with a plain summary and links to
  its most-used guides;
- a **Start with the Daily Trade Tracker** action; and
- a small **Popular help** area based on deliberately selected links, not fake
  popularity data.

Recommended initial popular links:

- Add a trade manually.
- Understand the trade chart.
- Review an entry or exit.
- Finish a trading day.
- When analysis updates.

The page does not show placeholders such as **More coming soon**. New
collections appear when their real guides are ready.

## 6. Daily Trade Tracker collection overview

The collection overview explains the full workflow before sending the user
into individual guides:

1. Add or import executions that belong to the trading day.
2. Review each ticker and trade.
3. Use the chart and analysis to study entries, exits and price movement.
4. Add tags, review rules and write notes.
5. Classify any open positions.
6. Mark the day reviewed when journaling is complete.

It also explains the page structure:

- weekly navigation and week total;
- selected-day summary;
- ticker cards;
- one or more trades inside each ticker;
- chart and analysis for the selected trade;
- open positions;
- daily rules, notes and day review.

## 7. Daily Trade Tracker guide coverage

### Guide 1: Getting started

This guide covers:

- opening the Daily Trade Tracker;
- moving between available dates and the trading week;
- understanding P/L, Trades, Tickers and Rules broken in the day summary;
- understanding the week total and traded-day cards;
- the recommended same-day review workflow;
- the difference between a ticker, a trade and an execution;
- how multiple completed trades in one ticker remain separate;
- why the chart and expanded details show one selected trade at a time;
- desktop and mobile trade-card behavior; and
- what a historical read-only day means when that state is shown.

### Guide 2: Add and edit trades

This guide covers:

- opening manual execution entry;
- entering one trading day at a time in the Day Trade Tracker;
- using the broker-shown trading date, Eastern Time, ticker, side, quantity and
  price;
- entering fees when the broker reports them and leaving fees blank when it
  does not;
- adding and removing execution rows;
- recording partial entries, adds, partial exits and the final exit;
- understanding that TradersLink checks the complete execution set before it
  saves it, while the user's form remains available if the save cannot finish;
- saving executions and starting another trade;
- recognizing the recorded-execution count after a successful save;
- opening **View candle review** when that follow-up link is available;
- how the saved executions are organized by ticker and position lifecycle;
- editing a manual execution later;
- why an execution being compared with broker data may need to be handled in
  Data Decisions before it can be edited;
- avoiding duplicate entries; and
- entering any past date while keeping each Day Tracker save to one Eastern
  Time trading date; and
- the difference between manual Day Tracker entry and bulk statement-import
  workflows.

The guide must ask for exact broker details without claiming that a trader's
manual memory is exact evidence.

#### How executions become trades

This guide includes a dedicated plain-language section explaining that an
execution is one broker fill and a trade may contain several executions:

- TradersLink orders accepted executions by account, ticker and execution time.
- A position moving from zero shares to a positive quantity starts a Long
  trade. Additional buys add to it and sells reduce it.
- A position moving from zero shares to a negative quantity starts a Short
  trade. Additional sells add to it and buys reduce it.
- The trade closes when the position returns to zero.
- The next execution after zero starts a new trade, even when it is the same
  ticker on the same day.
- Partial entries and exits remain inside the same trade while a quantity is
  still open.
- Manual and imported executions belong to the same Journal history. A possible
  duplicate is reviewed rather than silently counted twice.

Use a small Long example and a small Short example so the user can see the
running share quantity return to zero. Do not expose the internal term
`round trip` without immediately explaining it as one complete trade from open
to flat.

### Guide 3: Review trades

This guide covers:

- the ticker card's result color and ticker summary;
- selecting Trade 1, Trade 2 or another completed trade;
- how the selected trade replaces the prior trade in that ticker's chart and
  expanded details;
- expanding or collapsing trade cards on desktop and mobile;
- direction, holding period, execution count, P/L and return;
- adding, editing and managing tags;
- reading the execution list;
- using **View analysis** on any buy or sell;
- the difference between combined trade analysis and a selected execution's
  Entry analysis or Exit analysis;
- combined entry, combined exit, candle-pattern and trade-outcome sections;
- execution context, market activity, candle patterns and price response for an
  individual execution;
- why Green-to-red analysis is trade-level and appears with the combined view,
  not an isolated fill; and
- trade notes and the Daily Notes workflow covered in the completion guide.

The tags section explains the available Setup, Entry and execution, Exit,
Mistake, Emotion, Market context, Risk and process, and Custom groups. It shows
how to choose presets, create a custom tag, rename a tag and retire a tag while
preserving its prior trade history.

#### View analysis for an individual execution

This receives a complete walkthrough with an example buy and an example sell:

1. Expand the selected trade's **Executions** section.
2. Select **View analysis** beside any buy or sell fill.
3. The chart highlights that exact execution marker and moves the selected fill
   into view without changing the saved trade.
4. A buy that opens or adds to the position shows **Entry analysis**. A sell
   that reduces or closes a Long position shows **Exit analysis**. The guide
   also explains the corresponding entry/exit meaning for Short trades rather
   than assuming every trade is Long.
5. Review the selected fill's **Execution context**, **Market activity**,
   **1-minute candle patterns** or **5-minute candle patterns**, and **Price
   response** sections.
6. Select **Combined overview** to return to the complete trade analysis and
   Green-to-red column.

The guide explains the facts in each individual-execution category:

- exact time, shares and price;
- distance above or below Session VWAP and EMA 9;
- location and precision inside the execution candle, with the one-minute
  sequence limitation;
- execution-candle or completed five-minute volume, relative volume and
  turnover;
- cumulative session volume and turnover where available;
- exact and nearby patterns, their timing relative to the fill and whether
  confirmation was available at that time;
- movement in favor of and against the position after that execution;
- the 60-minute path after that fill when enough candles exist; and
- the difference between a fill-level result and trade-level MFE, MAE, holding
  time, actual P/L, Green-to-red and profit-opportunity results.

The Help text makes clear that selecting **View analysis** changes the review
view only. It does not change, split or edit the execution.

### Guide 4: Charts and analysis

This guide covers every visible chart and analysis feature:

- candlesticks and volume;
- buy and sell markers, their numbered fills, exact price anchors and detail
  interaction;
- hovering or selecting a candle to read its time, open, high, low, close,
  volume and turnover, plus pattern or execution details when present;
- the selected trade label;
- Session VWAP and the selected timeframe's EMA 9;
- candle turnover where shown;
- the candle-pattern key and chart labels;
- expanding the Candle patterns key on mobile;
- explicit plus/minus zoom controls;
- desktop Ctrl/Cmd plus mouse-wheel zoom;
- ordinary mouse-wheel page scrolling over the chart;
- mobile page scrolling, horizontal chart movement and pinch zoom;
- the 1-minute, 5-minute, 15-minute and 1-hour chart views;
- full Trade analysis on the 1-minute and 5-minute views;
- 15-minute and 1-hour views as chart context rather than separate written
  analysis;
- why indicator values and candle patterns can change with timeframe;
- exact and nearby candle patterns before or at an execution;
- confirmation requirements and why not every familiar candle shape receives a
  pattern label;
- plain definitions of VWAP, EMA 9, relative volume, turnover, execution
  precision, MFE, MAE and holding time;
- combined entry and exit context weighted by fill size;
- Entry analysis and Exit analysis for each execution;
- price movement in favor of and against the position;
- 5, 15, 30 and 60-minute post-execution paths where available;
- Green-to-red behavior, breakeven returns and the finished result;
- best sustained and additional profit-opportunity windows;
- actual Journal P/L versus calculated price-path opportunity; and
- factual limits of one-minute candles, including that a candle does not reveal
  whether its high or low occurred before or after a fill inside that minute.

Definitions must always answer why a fact matters. A raw value such as
`VWAP $5.82` is not presented without explaining whether the execution was
above, below or near it.

#### Detected candle patterns

The guide names and explains every pattern the current analyzer can display:

1. Compression.
2. Bullish compression break.
3. Bearish compression break.
4. Bullish engulfing shift.
5. Bearish engulfing shift.
6. Bullish expansion.
7. Bearish expansion.
8. Confirmed Hammer.
9. Confirmed Shooting Star.
10. Lower-wick rejection.
11. Upper-wick rejection.
12. Possible high-volume exhaustion.

For every pattern, the guide explains:

- what the candle or candle sequence must show;
- whether following-candle confirmation is required;
- what the short chart label means;
- whether it was on the execution candle or one of the nearby preceding
  candles;
- whether it was complete before the fill or only known after the candle
  closed;
- that a detected pattern is an observation, not a prediction; and
- why a candle that looks vaguely similar may correctly receive no label.

The Help content also explains that pattern detection is timeframe-sensitive.
A valid 1-minute pattern is not automatically a valid 5-minute or 15-minute
pattern because those bars have different open, high, low, close and volume
facts.

#### Green-to-red and recovery results

The guide explains every visible result and supporting fact:

- **Never green**: no exact fill or completed one-minute close showed positive
  calculated trade P/L before the position became flat.
- **Stayed green**: after the trade became profitable, its calculated path did
  not later move below breakeven before the final exit.
- **Green to red, ended red**.
- **Green to red, recovered**: the path later returned above breakeven and the
  guide explains the recorded recovery time and final actual result.
- **Green to red, ended flat**.
- first profitable time, peak calculated P/L and peak time;
- first move below breakeven, reversal amount and elapsed time;
- position size at the peak and below-breakeven point;
- adds after the peak and partial exits before the move below breakeven;
- calculated final path P/L versus actual net P/L;
- treatment of reported and unreported fees; and
- why transitions use completed one-minute closes and exact fills rather than
  unknowable intraminute high/low order.

### Guide 5: Rules, notes and finish the day

This guide covers:

- preset trade rules and preset daily rules;
- rules that TraderLink can evaluate automatically;
- reviewing custom rules as Followed, Broken or Not reviewed;
- creating a custom daily rule in the trader's own words;
- adding trade notes;
- writing Daily Notes in What worked, What needs work, Technical recap, Current
  Focuses and Anything else;
- saving notes and recognizing the saved/error state;
- reviewing open positions shown on the trading day;
- remaining quantity, average entry and opened time;
- choosing whether an open position remains a Day trade or becomes a Swing;
- opening the Swing Tracker for an active Swing;
- why every open position must have a type before the day can be marked
  reviewed;
- marking the day reviewed; and
- understanding that executions, tags and notes may still be edited later.

The rules section explicitly distinguishes:

- **Trade rules**, which apply to one selected trade or position;
- **Daily rules**, which apply to the trader's behavior or results across the
  complete trading day;
- **Preset rules**, which are chosen from TraderLink's supported rule list and
  may be evaluated automatically when the required facts are available; and
- **Custom rules**, which the trader writes in their own words and reviews as
  Followed, Broken or Not reviewed.

The guide also defines **N/A** as a result used when the selected preset rule
could not meaningfully apply to that trade or day. It does not tell the user to
manually change a deterministic preset result.

It links directly to `/rules` for choosing and managing the full rule list. It
also explains that **Rules broken** in the day summary is a count of recorded
broken rule results for that trading day, not an AI opinion.

The day-review section explicitly explains that **Mark day reviewed**:

- is the trader's signal that journaling for that date is complete;
- saves pending trade and daily notes before recording completion;
- requires every open position to be classified;
- does not lock the day or prevent later edits;
- lets TraderLink and AI Reviews distinguish a completed daily review from
  notes that were saved but not marked complete; and
- may allow an eligible AI Review to start sooner under the user's selected AI
  Review timing, while later edits do not rewrite an already issued review.

Open-position Help names every current choice: Not classified, Active swing,
Day trade still open, Unplanned hold (bag hold) and Long-term hold. It explains
that time held does not change the selection automatically.

### Guide 6: Data timing and limitations

This guide covers:

- the Moomoo connection needed for current chart data;
- shared server-side candle reuse without exposing storage details to users;
- same-day analysis using the candles that have formed so far;
- why a newly exited trade may show fewer than 60 post-exit minutes;
- the final update after 60 minutes of post-exit candles are available;
- the single post-session reconciliation after Moomoo finalizes the session;
- the possibility that candle values, chart details or analysis may update once
  after the session;
- preservation of already useful analysis if the final update fails;
- incomplete coverage and truthful unavailable states;
- supported U.S. session coverage and the current lack of overnight-session
  analysis;
- the difference between market-data access and execution importing;
- why one-minute bars cannot prove the within-candle order of events; and
- the fact that the analysis describes recorded market behavior and does not
  predict future prices.

The required user-facing disclosure is:

> Same-day analysis uses the candles available at the time. Moomoo may finalize
> those candles after the session, so TradersLink performs one final update to
> the chart and analysis.

## 8. Complete feature-to-guide map

This map is the final content QA checklist. A feature cannot be called covered
merely because its button or label is named; the assigned guide must explain
what it does, how to use it, what happens next and any important limitation.

| Daily Trade Tracker feature | Guide that explains it |
| --- | --- |
| Week cards, date navigation, week total and day summary | Getting started |
| P/L, Trades, Tickers and Rules broken | Getting started; Rules, notes and finish the day |
| Ticker, trade and execution terminology | Getting started; Add and edit trades |
| How chronological fills build Long and Short trades | Add and edit trades |
| Partial entry, add, partial exit, final exit and return to zero | Add and edit trades |
| Manual entry fields, Eastern Time, fees, validation and save | Add and edit trades |
| Edit manual execution and Data Decisions conflict | Add and edit trades |
| Enter another trade and View candle review | Add and edit trades |
| Multiple trades in one ticker and selected-trade replacement | Review trades |
| Desktop and mobile trade expansion | Getting started; Review trades |
| Trade result, return, direction, duration and execution count | Review trades |
| Preset/custom tags, tag categories and tag management | Review trades |
| Trade rules and Daily rules | Rules, notes and finish the day |
| Preset/custom rules and Followed/Broken/Not reviewed/N/A | Rules, notes and finish the day |
| Link to the complete Rules page | Rules, notes and finish the day |
| Execution list and the full individual View analysis workflow | Review trades; Charts and analysis |
| Combined entry, combined exit and trade outcome | Charts and analysis |
| Individual Entry analysis and Exit analysis | Review trades; Charts and analysis |
| Execution context, market activity, candle patterns and price response | Charts and analysis |
| 1-minute and 5-minute written analysis | Charts and analysis |
| 15-minute and 1-hour chart-only context | Charts and analysis |
| Candles, volume, turnover, Session VWAP and EMA 9 | Charts and analysis |
| Candle detail for time, OHLC, volume, turnover, pattern and execution | Charts and analysis |
| Execution markers, fill numbering and exact-price interaction | Charts and analysis |
| Desktop/mobile chart scrolling, panning and zoom | Charts and analysis |
| All 12 supported candle-pattern results | Charts and analysis |
| Exact/nearby pattern timing and confirmation | Charts and analysis |
| MFE, MAE, holding time and post-execution paths | Charts and analysis |
| Entry/exit precision and one-minute sequence limits | Charts and analysis |
| Green-to-red statuses, recovery and position changes | Charts and analysis |
| Best sustained and other profit-opportunity windows | Charts and analysis |
| Calculated price path versus actual net P/L and fees | Charts and analysis |
| Trade notes | Review trades; Rules, notes and finish the day |
| Daily Notes fields and save states | Rules, notes and finish the day |
| Open-position facts and all current classifications | Rules, notes and finish the day |
| Swing Tracker handoff and time-held behavior | Rules, notes and finish the day |
| Mark day reviewed, completion requirements and later edits | Rules, notes and finish the day |
| AI Review relationship to a completed Daily Tracker review | Rules, notes and finish the day |
| Pending post-exit minutes and final 60-minute update | Data timing and limitations |
| One post-session Moomoo candle reconciliation | Data timing and limitations |
| Incomplete/unavailable coverage and preserved prior analysis | Data timing and limitations |
| Market-data connection versus execution importing | Data timing and limitations |
| Current U.S. session and overnight limitation | Data timing and limitations |
| Historical read-only presentation | Getting started |

## 9. Search behavior

The initial search uses a small client component over the static Help registry.
It searches:

- collection names;
- article titles and summaries;
- section titles;
- curated keywords and common trader terms; and
- approved synonyms such as `fill` and `execution`.

Search requirements:

- results update without a full page reload;
- keyboard users can move through and open results;
- clearing the field restores the start page;
- no-result copy suggests browsing the Daily Trade Tracker guides;
- an empty query does not pretend to return ranked results; and
- search never sends account, trade or note data elsewhere.

## 10. Content model and Next.js architecture

Use the existing Next.js App Router and Material dashboard components.

Recommended structure:

```text
app/(dashboard)/help/
  layout.tsx
  page.tsx
  help-center-layout.tsx
  help-search.tsx
  help-browse-navigation.tsx
  daily-trade-tracker/
    page.tsx
    [articleSlug]/page.tsx
src/modules/help/
  help-content-registry.ts
  daily-trade-tracker-help-content.ts
```

Implementation rules:

- Pages and the nested Help layout remain Server Components by default.
- Only search and responsive browse interactions become Client Components.
- Use Next.js `Link` for Help navigation.
- The dynamic article route reads asynchronous `params`, rejects unknown slugs
  with `notFound()`, supplies static params from the registry and generates
  article metadata from the same source.
- The registry is the source of truth for article order, titles, summaries,
  keywords and section anchors.
- Article content is structured TypeScript/React content in the first release.
  Do not add MDX, Fumadocs or another documentation framework until the volume
  of approved Help content demonstrates a real need.
- The Help layout must stay inside `app/(dashboard)` and inherit the existing
  authenticated dashboard shell.
- Global navigation and Help route titles are changed only in the existing
  dashboard navigation contract.

The exact file set may be refined during implementation, but any new shared
framework or dependency requires a plan update and owner approval.

## 11. Editorial standard

### Voice

- Use `you` and direct verbs: **Select a trade**, **Open View analysis** and
  **Save your notes**.
- Prefer short paragraphs and numbered steps.
- Explain what happens after an action.
- Use the labels that appear in the product.
- Define specialist terms at first use.
- Put the most common workflow first and exceptions later.

### Avoid

- internal action or issue codes;
- schema, migration, repository, worker or provider language;
- unexplained analytics abbreviations;
- unsupported promises such as real-time, complete, exact or automatic when
  coverage can vary;
- generic filler titles or subtitles that do not identify the subject; and
- advice that tells the trader what to buy, sell or expect next.

### Plain-language glossary entries

The Daily Trade Tracker collection includes short definitions for:

- execution/fill;
- trade/round trip;
- VWAP;
- EMA 9;
- relative volume;
- turnover;
- MFE, described as the largest favorable move while the position was open;
- MAE, described as the largest move against the position while it was open;
- entry/exit precision;
- Green-to-red;
- profit-opportunity window;
- candle pattern; and
- post-exit analysis.

The user-facing text does not need to lead with the acronyms MFE and MAE. The
plain meaning comes first, with the acronym in parentheses for traders who know
it.

## 12. Accessibility and responsive acceptance

- Use semantic breadcrumbs, navigation, headings, sections and lists.
- Maintain one `h1` per page and a logical heading order.
- Mark the current Help article with `aria-current`.
- Provide visible keyboard focus on every link, button and search result.
- Associate search and mobile browse controls with their labels and expanded
  state.
- Do not rely on color alone to communicate Tip, Good to know or Important.
- Preserve the approved navy/white action contrast and Material text contrast.
- Keep article text readable at 200% zoom.
- Verify desktop at 1440 pixels and a common laptop width.
- Verify mobile at 390 pixels and one narrower phone width.
- Confirm the Help navigation, article tables and callouts do not create page
  overflow.

## 13. Privacy, factual integrity and maintenance

- Help examples use invented generic values and tickers clearly presented as
  examples. No development-account facts, broker identifiers or private notes
  are copied into Help content.
- The Help Center does not read the user's trades to personalize articles in
  the first release.
- Each article records a content version or reviewed date in the source registry
  for maintainers, but internal version details do not clutter the visible page.
- A feature change that affects visible behavior must update its related Help
  article in the same coherent feature slice.
- Future Help collections reuse this template and registry rather than creating
  new page-specific navigation systems.

## 14. Implementation sequence and owner checkpoints

### Help 0: Plan acceptance

- Perfect this information architecture and content inventory.
- Receive owner approval before creating Help UI.

Status: complete; owner approved the plan.

### Help 1: Template, navigation and start page

- Add the global Help Center navigation item and route titles.
- Implement the nested Help layout, desktop article navigation, mobile Browse
  help control, start page and local search.
- Add the Daily Trade Tracker collection card with initial navigation metadata.
- Perform focused technical checks.
- Stop for owner desktop/mobile visual approval of the template.

Status: implemented. Focused lint passes. The owner could not complete the
visual checkpoint remotely because Windows Firewall blocked the LAN preview;
visual polish is deferred until 2026-08-10 without discarding the approved
information architecture.

### Help 2: Collection overview and core workflow guides

- Publish the Daily Trade Tracker overview.
- Publish Getting started, Add and edit trades, and Review trades.
- Verify all product labels and workflows against the live Tracker.
- Stop for owner content and presentation approval.

Status: implemented; technical and owner presentation review remain open.

Implementation record: the current collection contains six guide routes, 28
direct section anchors and 35 static search records. Navigation receives a
small server-provided metadata list so the client layout does not import the
complete long-form article library.

### Help 3: Analysis and completion guides

- Publish Charts and analysis, Rules/notes/day review, and Data timing and
  limitations.
- Add the plain-language glossary definitions where they are first needed.
- Verify every chart, analysis and lifecycle statement against the accepted
  Tracker/analyzer records.
- Stop for owner content and presentation approval.

Status: implemented; technical and owner presentation review remain open.

### Help 4: Final acceptance

- Run the final targeted lint and TypeScript checks.
- Run the dashboard-template architecture verifier.
- Run the production build because this slice adds routes and metadata.
- Complete desktop and mobile browser regression.
- Confirm no broken Help links, invalid anchors, overflow, console errors or
  error overlay.
- Update this plan and the progress record.
- Create one narrow local Help Center commit without absorbing concurrent work.

Owner review added one scaling requirement: the left navigation initially shows
top-level Help collections only. Selecting a collection opens its overview and
expands that collection's article links. The current collection remains open,
and every collection can be collapsed independently so future guides do not
turn the left navigation into one long flat list.

No Vitest suite is part of the active UI design cadence. Any later automated
content/registry test requires an explicit checkpoint decision.

## 15. Acceptance criteria

The first Help Center release is complete only when:

- Help Center is reachable from the authenticated dashboard navigation;
- the start page, search, collection overview and all six guides are present;
- desktop and mobile navigation are clear and do not compete with the global
  dashboard navigation;
- every currently supported Daily Trade Tracker workflow listed in this plan is
  covered;
- 1-minute, 5-minute, 15-minute and 1-hour chart behavior is described
  accurately;
- same-day, post-exit and post-session update timing is explained plainly;
- manual entry, editing, multiple trades, per-execution analysis, rules, tags,
  notes, open positions and day completion are all documented;
- internal implementation language does not leak into visible copy;
- every Help route has correct metadata, breadcrumb state and previous/next
  navigation;
- search uses only published Help content and does not expose user data;
- keyboard, mobile and responsive checks pass;
- the owner approves the Help template and final content; and
- the accepted slice is preserved in a narrow local commit.

## 16. Deferred scope

- Help collections for Swing Trade Tracker, Imports, Data Decisions, Rules,
  Analytics, AI Chat, remaining Account features and Administration. AI Reviews
  and Paid plan and billing are now governed by the linked Help plan.
- Personalized recommendations based on the user's account or trades.
- AI-generated Help answers.
- External documentation hosting or a content-management system.
- Public, unauthenticated Help pages.
- Video tutorials and approved screenshots.
- Help feedback storage and support-ticket integration.
- Automatic broker-execution-import instructions until that workflow is live
  and owner approved.
