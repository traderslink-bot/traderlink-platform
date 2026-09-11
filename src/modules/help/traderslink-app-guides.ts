import type { HelpGuide } from "./help-guide-types";

export const TRADERSLINK_APP_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "using-traderslink-app",
    title: "Using the TradersLink app",
    description: "Install TradersLink, keep useful pages on your device, enter trades offline and choose alerts for this device.",
    sections: Object.freeze([
      Object.freeze({
        id: "install-traderslink",
        title: "Install TradersLink",
        summary: "Install the complete TradersLink dashboard from a supported browser.",
        keywords: Object.freeze(["install app", "PWA", "Chrome", "Edge", "iPhone", "iPad", "Add to Home Screen"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "The installed TradersLink app is the same dashboard you use in your browser. Installing it gives you an app icon, a simpler way to reopen TraderLink and the option to use saved pages and trade entry when your connection is unavailable." }),
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Use the install message", text: "When Chrome or Edge is ready, TradersLink shows an Install TradersLink app message on a signed-in dashboard page. Select Install TradersLink app, then accept the browser's install prompt." }),
            Object.freeze({ title: "2. Choose not to be reminded", text: "After that message has appeared three times, it includes Don't show this again. Select it only if you do not want future install reminders on this browser. You can always install later from Account General." }),
            Object.freeze({ title: "3. Install from your browser when needed", text: "In Chrome or Edge, open the browser menu and choose Install app. On an iPhone or iPad, open TraderLink in Safari, select Share, then choose Add to Home Screen." }),
          ]) }),
          Object.freeze({ kind: "link", href: "/account/trading#pwa-app", label: "Open App settings", text: "Account General has the installation button, browser-specific steps and your device's offline-data controls." }),
        ]),
      }),
      Object.freeze({
        id: "what-the-app-does",
        title: "What the app does",
        summary: "Use the normal TraderLink dashboard with offline support for selected work.",
        keywords: Object.freeze(["benefits", "dashboard", "offline pages", "saved pages", "same dashboard"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "The installed app keeps the normal TradersLink dashboard and navigation. Installing it does not create a separate, reduced trading app.",
            "After you open supported pages online, TradersLink can keep bounded, last-updated copies on this device for offline reading.",
            "Session Tracker, Swing Trade Tracker and Quick Trade Entry can save a new manual trade on this device when you are offline.",
            "Push alerts are optional. You choose whether this device may receive them.",
          ]) }),
          Object.freeze({ kind: "callout", title: "Current facts still need a connection", text: "Saved pages clearly show when they were last updated. Imports, account changes, live market data, AI requests and Data Decisions need an internet connection so TraderLink can use the latest facts safely." }),
        ]),
      }),
      Object.freeze({
        id: "device-storage",
        title: "Device storage and privacy",
        summary: "Saved pages are limited, account-aware and never replace your Journal records.",
        keywords: Object.freeze(["device storage", "offline data", "remove offline data", "privacy", "50 MB", "backup"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "TradersLink keeps a bounded read-only copy of useful pages in this browser for the selected Trade Tracker account. It keeps up to 50 MB and removes the oldest saved page copies first when space is needed. Unsynced trades are never removed automatically." }),
          Object.freeze({ kind: "paragraph", text: "Saved pages do not include raw statements, broker account identifiers, credentials, provider identities, AI request details or Journal evidence-vault material. Device storage is not a backup: your browser or operating system can remove it." }),
          Object.freeze({ kind: "paragraph", text: "To see saved-page count, last update time, storage use or to remove device data, open Account General. Removing offline data also removes pending offline trades for the selected account, so read the warning before confirming." }),
        ]),
      }),
      Object.freeze({
        id: "enter-trades-offline",
        title: "Enter trades without a connection",
        summary: "Save a complete manual trade batch on this device and let TraderLink check it when you reconnect.",
        keywords: Object.freeze(["offline trade entry", "Session Tracker", "Swing Trade Tracker", "Quick Trade Entry", "sync", "saved on this device"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "After you open Session Tracker, Swing Trade Tracker or Quick Trade Entry online once, the installed app can reopen its trade-entry form without a connection. Enter the same exact date, time, price and quantity shown by your broker so TraderLink can later check the trade correctly." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "A saved offline trade is shown as Saved on this device. It is not yet part of your positions, P/L, trade counts, rules results or Analytics.",
            "When you reconnect, TradersLink checks the saved batch through the normal preview and save process. It can show Syncing, Saved to TraderLink or Needs your review.",
            "If the same trade was already entered on the website, TraderLink stops before adding it again and asks you whether it was already entered or is genuinely separate.",
          ]) }),
          Object.freeze({ kind: "callout", title: "Keep related fills together", text: "Enter opening, add, reduce and closing fills that belong to one update in the same saved batch. TraderLink never guesses its way through a duplicate or unclear result." }),
        ]),
      }),
      Object.freeze({
        id: "push-alerts",
        title: "Choose push alerts",
        summary: "Turn on alerts only when you want them on this device.",
        keywords: Object.freeze(["push alerts", "notifications", "permission", "phone alerts", "turn off notifications"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Installing TradersLink does not turn on notifications by itself. In the installed app, open Account Preferences and choose Enable push notifications. Your browser asks for permission only after you select that action." }),
          Object.freeze({ kind: "paragraph", text: "Alert category choices apply to your account's connected devices. You can turn push off on this device without changing your in-app updates or Discord choices. Removing offline page data does not turn push off. Lock-screen messages for account and trading updates stay generic and do not show trade or account details." }),
          Object.freeze({ kind: "paragraph", text: "In Account Preferences, choose Send test notification to check that an alert appears on the device you are using. When an app update is ready, save any edits before choosing Update app. Offline entries already saved on your device will remain." }),
          Object.freeze({ kind: "link", href: "/account/preferences#push-notifications", label: "Open Push notifications", text: "Use Account Preferences to turn alerts on or off and choose the categories this device may receive." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "daily-watchlist-recaps",
    title: "Daily Watchlist Recaps",
    description: "Generate, edit and post an owner-reviewed Watchlist recap.",
    sections: Object.freeze([
      Object.freeze({
        id: "build-recap",
        title: "Build a recap",
        summary: "Generate natural-sentence results from the Watchlist analysis and later price action.",
        keywords: Object.freeze(["Daily Recaps", "Watchlist", "pullback", "breakout", "Discord"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Choose the date", text: "Open Admin Watchlist, choose Daily Recaps and select the New York trading date." }),
            Object.freeze({ title: "2. Generate drafts", text: "Generate one ticker or all Watchlist posts for the date. A normal move receives a potential-gain recap. Pullback recovery, breakout levels and setup invalidation are included when those analysis paths occurred." }),
            Object.freeze({ title: "3. Edit and select", text: "Edit every ticker recap as needed, then choose Add to recap or Don't use. Flag for audit records an app issue without blocking editing, selection or posting." }),
            Object.freeze({ title: "4. Review the final post", text: "Edit the entire combined Discord post. Save final post keeps your text across refreshes without posting. Use selected recaps replaces that body with the currently selected ticker recaps after confirmation. Select Post to Discord when ready and confirm the final action." }),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "A stock does not have to reach its regular pullback area to produce a recovery recap. The recap can describe the actual dip and run, stating that price turned before reaching the area. Deep recoveries are not generated as successful analysis stories. A later dip does not erase an earlier completed run; if a higher run follows a break below the regular area, the recap uses the posted-price potential gain." }),
          Object.freeze({ kind: "paragraph", text: "When an initial move is followed by a successful regular pullback and another run, the recap can describe both moves with separate percentages. The later run does not have to exceed the earlier high." }),
          Object.freeze({ kind: "paragraph", text: "A saved final body keeps its original ticker associations when selections change. Use selected recaps replaces both the body and its associated tickers; editing the final wording does not change those associations." }),
          Object.freeze({ kind: "callout", title: "Post history", text: "Post history keeps the submitted text and delivery status. Retry post reuses that saved attempt. If delivery is uncertain, check Discord and confirm either that the unconfirmed message is absent or supply its Discord message link. The app then continues any remaining messages." }),
          Object.freeze({ kind: "callout", title: "Stored recap data", text: "The Stored recap data card shows drafts, posts, audit flags, oldest date and approximate storage. After 30 days, manual cleanup can remove eligible supporting price evidence while keeping posted text, receipts and open audit flags." }),
          Object.freeze({ kind: "paragraph", text: "A saved audit note never prevents editing or posting. Repeated posting attempts use a durable receipt so the same approved request cannot create duplicate Discord posts." }),
        ]),
      }),
    ]),
  }),
]);

export function tradersLinkAppGuideBySlug(slug: string): HelpGuide | undefined {
  return TRADERSLINK_APP_HELP_GUIDES.find((guide) => guide.slug === slug);
}
