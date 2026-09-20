import type { HelpGuide } from "./help-guide-types";

export const TOOLS_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "swing-trade-ideas", title: "Swing Trade Ideas",
    description: "Open Premium swing ideas and understand member access.",
    sections: Object.freeze([
      Object.freeze({id:"view-idea",title:"View a swing idea",summary:"Open Swing Trade Ideas under Stock Tools.",keywords:Object.freeze(["swing", "Premium", "research", "Whop"]),blocks:Object.freeze([
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
          Object.freeze({ kind: "paragraph", text: "Open Halt Alerts (Nasdaq/NYSE) from the left navigation and turn on Halt alerts. To receive alerts away from the page, also turn on Push notifications in Account Notifications and approve your browser's notification request." }),
          Object.freeze({ kind: "paragraph", text: "You can install TradersLink on a supported desktop or mobile device from the same Halt Alerts drawer." }),
        ]),
      }),
      Object.freeze({
        id: "read-a-halt-alert",
        title: "Read a halt alert",
        summary: "Each alert identifies the stock, exchange reason and any posted return-to-trading times.",
        keywords: Object.freeze(["halt reason", "halt code", "news pending", "volatility pause", "resume trading"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A halt alert shows the ticker, time, exchange reason and the reason code when the exchange provides one. It also explains the reason in plain language and shows posted quote or trading-resumption times when they are available." }),
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
