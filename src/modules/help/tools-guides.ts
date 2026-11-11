import type { HelpGuide } from "./help-guide-types";

export const TOOLS_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "live-screeners", title: "Scanners",
    description: "Read Top Gainers, Momentum, Rapid Drops, Top Losers and Premarket High Pullbacks.",
    sections: Object.freeze([
      Object.freeze({ id:"read-live-screeners",title:"Read the live screeners",summary:"Switch between Top Gainers and Momentum and review the current session.",keywords:Object.freeze(["live screeners","top gainers","momentum","premarket","after hours"]),blocks:Object.freeze([
        Object.freeze({ kind:"paragraph",text:"During production testing, Scanners is available only through the Traderlink owner profile's Scanner Admin page. Top Gainers orders qualifying stocks by the current session gain. Momentum looks for recent price and volume activity, including stocks that are not yet near the top of the daily gainers list, and ranks them with recent price movement, volume acceleration, relative volume when available, recent dollar volume and spread quality. On desktop, select the colored candlestick button beside a ticker to open its TradingView chart. On mobile, expand a row and use View Chart at the bottom right. The current session, update time and available data coverage appear above the results. Shared charts initially load ten recent sessions where candles are available. Pan left to fetch older chunks automatically. The date at the left of the timeline identifies the first visible day; later dates mark day boundaries. Older history loading preserves the current view. Use Indicators to add, configure or remove optional studies; the gear opens Chart settings for appearance, sessions and scales. On mobile these panels open from the bottom. Changes save automatically to your account and follow you across symbols and chart locations; each already-open chart keeps its own active timeframe." }),
        Object.freeze({ kind:"paragraph",text:"Select an indicator name above the candles to open its settings, hide its values or turn it off for that chart. Hide details keeps the indicator plotted. Use Indicators to show hidden details or turn a study back on. These controls apply to the open chart and leave your saved defaults for new charts in place. Indicator labels on the price scale start off. Use Chart settings to toggle them together or Style to adjust individual labels." }),
        Object.freeze({ kind:"paragraph",text:"PR Scanner shows up to 30 recent News Scanner articles in one newest-first column. Each two-line row shows a ticker beside market cap and float, followed by an ellipsized article title. On desktop its card spans two scanner-card widths. Scroll within the list to see older articles, or select an article to open its full article drawer. Mobile keeps the same single-column article list." }),
        Object.freeze({ kind:"paragraph",text:"The desktop grid fits four scanner-card widths per row. Compact Top Gainers rows show ticker, price, gain and volume; compact Momentum rows show ticker, price and one- and five-minute movement. Expand a row for its additional details and News links. Use the top-right full-view icon to open the scanner's complete table in a side drawer. Lists scroll only when needed, with slim scrollbars matching light or dark mode. Full tables keep the existing columns: Momentum includes Day % from the previous trading day's regular close and, during post-market, Post % from today's regular close. Qualification still uses the same recent movement and activity settings. On mobile, existing scanner tabs and expandable rows remain; Day % and Post % are in the expanded details. A missing closing price leaves its comparison unavailable, not zero. These views share incoming data without requesting extra market quotes." }),
        Object.freeze({ kind:"paragraph",text:"Market cap comes from the daily Nasdaq, NYSE and NYSE American stock list. Float is required separately. A missing quote, float, spread or session fact can keep a stock out of the results; missing data is not treated as zero." }),
        Object.freeze({ kind:"paragraph",text:"Top Losers ranks negative percentage changes from the previous regular close, or today's regular close during post-market. Rapid declines do not appear in Top Losers merely because they happened quickly; a stock can fall sharply from a large gain and remain positive for the day." }),
        Object.freeze({ kind:"paragraph",text:"High Drops ranks qualifying tickers by their current percentage below the highest available premarket, regular-session or post-market high. A bolt flags a recent rapid drop. By default, a rapid event requires a 30% fall within five minutes and stays active for fifteen minutes after its most recent new low." }),
        Object.freeze({ kind:"paragraph",text:"Expand a High Drops row to see its session highs, reference high, return distance, volume, float, spread and quote time. Flagged rows also show the rapid drop’s starting price, low and duration. Thin volume or a wide spread does not automatically exclude High Drops." }),
        Object.freeze({ kind:"paragraph",text:"Scanner Admin controls the High Drops list threshold and removal distance, plus the Rapid Drop percentage, observed window and retention period. Changing Rapid Drop controls clears its observed history; a restart or session change also starts that short-window history fresh. The scanner cannot identify a rapid fall it never observed before starting." }),
        Object.freeze({ kind:"paragraph",text:"Member scanner cards keep status notices brief. Between 8:00 PM and 4:00 AM Eastern, each card shows Active 4:00am - 8:00pm est. A disabled scanner shows Disabled. If its data cannot be loaded, it shows Temporarily unavailable. Partial coverage and rolling-history preparation notices stay in Admin; they do not interrupt usable member results. The operating-hours boundary follows Eastern daylight-saving changes. These display changes do not grant access to accounts that are not eligible for the screeners." }),
      ])}),
      Object.freeze({ id:"focus-stocks",title:"Review the upper section",summary:"Review the attached group meeting the scanner's stricter activity qualifications.",keywords:Object.freeze(["strongest candidates","focus stocks","volume acceleration","price acceleration"]),blocks:Object.freeze([
        Object.freeze({ kind:"paragraph",text:"The unlabeled upper section belongs only to Momentum and contains stocks that met its stricter price movement, volume acceleration, dollar-volume and confirmation settings. Its main mobile row shows rolling one- and five-minute price change, rolling one-minute share volume and float. Expand a row to review day gain, session and five-minute volume, one- and five-minute volume-spike ratios, relative volume when available, today's high and session low, Turnover % and spread. Top Gainers keeps day gain, session volume, float and its PR/SEC link in the main row; its expanded view shows today's high, session low, relative volume and Turnover %. The Momentum upper section can be empty, and a stock leaves when its data becomes stale or it no longer qualifies. It ranks observed activity; it is not a trade recommendation or prediction." }),
      ])}),
      Object.freeze({ id:"rolling-observations",title:"Understand rolling activity",summary:"Recent activity uses observed quotes, not reconstructed candles.",keywords:Object.freeze(["rolling volume","timestamps","warmup","float"]),blocks:Object.freeze([
        Object.freeze({ kind:"paragraph",text:"Top Gainers has two views. Day Gainers compares the current price with the previous trading day's regular close and continues updating during post-market. Post-Market Gainers compares the after-hours price with today's regular close. Both use your current session's volume and spread filters. The default changes to Post-Market Gainers after the scheduled regular close, without refreshing the page. If you choose a tab yourself, it stays selected for that trading date. Both views share the same incoming data; changing tabs does not request more market data. Post-market readings use the after-hours price and volume, not the final regular-session price. A new session starts fresh rolling history: one-minute readings need about a minute, five-minute readings about five minutes, and the five-minute volume comparison about ten minutes. Readings begin after incoming after-hours data confirms that trading activity is updating. A general quote timestamp can remain at the regular close; it is preserved separately and is not presented as the after-hours trade time." }),
        Object.freeze({ kind:"paragraph",text:"Rolling one- and five-minute values compare actual observed snapshots, timed by when each response arrives. A last-price timestamp can stay unchanged while volume updates; that does not erase the observed history. Unchanged prices and volume do not create extra trading activity. Because responses do not arrive on exact clock boundaries, their windows can extend up to ten seconds beyond the named interval. Volume is the recorded cumulative difference across that observed window; it is not a reconstructed candle or an estimate of missing trades. A missed scan does not erase earlier readings. Each comparison needs a fresh current quote and an actual observation near its starting boundary; a missing boundary leaves that comparison unavailable without hiding other usable windows. Session changes and reset counters start fresh history. Float updates run separately so a missing float cannot delay quote collection; a stock without a usable float remains outside comparisons that require it." }),
      ])}),
      Object.freeze({ id:"news-and-filings",title:"Open news and filings",summary:"Use the labels attached to a visible ticker to open covered News, press releases or SEC filings.",keywords:Object.freeze(["news","press release","SEC filing","labels"]),blocks:Object.freeze([
        Object.freeze({ kind:"paragraph",text:"PR and SEC links appear only when the existing TraderLink News coverage has a matching item for that ticker. Open the link to read that article on TraderLink. No link means no covered item was found; it does not prove that no external news exists." }),
      ])}),
      Object.freeze({ id:"scanner-audit",title:"Audit scanner decisions",summary:"Use the owner-only audit to inspect data coverage, scores, ranks and rejection reasons.",keywords:Object.freeze(["scanner audit","audit health","ticker timeline","momentum score","rejection reasons"]),blocks:Object.freeze([
        Object.freeze({ kind:"paragraph",text:"From Scanner Admin, open Scanner audit. Audit Health shows whether recent five-second scanner evidence is complete, partial, degraded or missing. It also shows the last recorded cycle, queue and dropped-cycle counts, durable-write time, compressed evidence size and a measured 20-trading-day storage projection. A partial or degraded audit means the record may be incomplete; it does not mean that no stock qualified." }),
        Object.freeze({ kind:"paragraph",text:"Use Ticker timeline with a trading date and ticker to inspect the exact recorded price, rolling one- and five-minute changes, Momentum score, Top Gainers rank, Momentum rank and current blocking reason. The score preserves separate price, volume-acceleration, relative-volume, recent-dollar-volume and spread components in the evidence even when the compact table shows only the total." }),
        Object.freeze({ kind:"paragraph",text:"Scanner Audit evaluates how the scanner observed and ranked market activity. A later price move can help review whether a rule was early, late or too restrictive, but it does not prove that a highlighted stock was a profitable trade or that a missed move was predictable." }),
      ])}),
    ]),
  }),
  Object.freeze({
    slug: "swing-trade-ideas", title: "Swing Trade Ideas",
    description: "Open Premium swing ideas and understand member access.",
    sections: Object.freeze([
      Object.freeze({id:"view-idea",title:"View a swing idea",summary:"Open the shared swing idea link.",keywords:Object.freeze(["swing", "Premium", "research", "Whop"]),blocks:Object.freeze([
        Object.freeze({kind:"paragraph",text:"Signed-in Premium members can open the full research and trading plan. If you already have Premium, use Sign in on the idea page. Otherwise join Premium through the Whop link, connect your Discord account to Whop, then sign in with that Discord account. If your access recently changed, sign in again to refresh membership."}),
        Object.freeze({kind:"paragraph",text:"These are authored ideas, not live-updating prices or automatic trade instructions. Swing Trade Ideas is separate from your Swing Trade Tracker and Trade Analyzer. An internet connection is required to check access."}),
      ])}),
      Object.freeze({id:"activity",title:"Page activity",summary:"The owner can see recorded page visits.",keywords:Object.freeze(["visits", "privacy", "activity"]),blocks:Object.freeze([
        Object.freeze({kind:"paragraph",text:"The owner can see which signed-in members opened an idea, when they visited, and whether they saw the full idea or the locked preview. This does not show whether a visitor read the entire idea. Logged-out visits cannot identify a member. Anonymous and deleted-account history is available for 30 days."}),
      ])}),
    ]),
  }),
  Object.freeze({
    slug: "halt-alerts",
    title: "Halt Alerts",
    description: "Turn on halt alerts, understand what they show and mute one ticker for the day.",
    sections: Object.freeze([
      Object.freeze({
        id: "turn-on-halt-alerts",
        title: "Turn on Halt Alerts",
        summary: "Choose Halt Alerts from the left navigation, then turn the alert switch on.",
        keywords: Object.freeze(["halt alerts", "Nasdaq", "NYSE", "turn on", "push notifications"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Open Halt Alerts (Nasdaq/NYSE) from the left navigation and turn on Halt alerts. If your plan does not include Market halts, the switch offers a link to upgrade. To receive alerts away from the page, also turn on Push notifications in Account Notifications and approve your browser's notification request." }),
          Object.freeze({ kind: "paragraph", text: "You can install TradersLink on a supported desktop or mobile device from the same Halt Alerts drawer." }),
        ]),
      }),
      Object.freeze({
        id: "read-a-halt-alert",
        title: "Read a halt alert",
        summary: "Each alert identifies the stock, exchange reason and any posted return-to-trading times.",
        keywords: Object.freeze(["halt reason", "halt code", "news pending", "volatility pause", "resume trading"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A halt alert shows the ticker, time, exchange reason and the reason code when the exchange provides one. For a volatility halt, the first alert also says UP or DOWN when fresh market data clearly establishes the direction into the halt. The direction is omitted when the evidence is unavailable or unclear. The alert also shows posted quote or trading-resumption times when they are already available. TradersLink sends one halt alert per ticker each trading day; later exchange updates enrich the Halt Alerts card without sending another notification." }),
          Object.freeze({ kind: "paragraph", text: "The Halt Alerts card on Scanners lists every qualifying halt event today, including repeated halts for one ticker, newest first. Its Quote Resume and Trade Resume columns show exchange-posted times; a dash means that time has not been posted. The card updates once a minute and each ticker links to the official source." }),
          Object.freeze({ kind: "paragraph", text: "In Market Events on Scanners, scheduled quote and trade times appear when the exchange posts them. Scanner rows show a pause icon beside the ticker while the qualifying halt is active. The current halt and pause icon clear when trading resumes." }),
          Object.freeze({ kind: "paragraph", text: "Halt Alerts cover qualifying Nasdaq and NYSE news-related and volatility halts. Listing, filing, administrative, IPO, corporate-action, ETF, market-wide and resumption-only notices are not sent as Halt Alerts." }),
        ]),
      }),
      Object.freeze({
        id: "mute-a-ticker-for-today",
        title: "Mute a ticker for today",
        summary: "Keep Halt Alerts on while stopping repeat alerts for one stock until 8:00 PM ET.",
        keywords: Object.freeze(["mute ticker", "mute for today", "unmute", "8 PM", "repeat halt alerts"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Enter a ticker in the Muted Tickers box and choose Mute for today. You can also choose Mute for today directly from a halt notification." }),
          Object.freeze({ kind: "paragraph", text: "Muted tickers reset at 8:00 PM Eastern. To turn one back on sooner, choose the X beside it in the Muted Tickers list." }),
        ]),
      }),
    ]),
  }),
]);

export function toolsGuideBySlug(slug: string): HelpGuide | undefined {
  return TOOLS_HELP_GUIDES.find((guide) => guide.slug === slug);
}
