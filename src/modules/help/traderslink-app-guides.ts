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
            "Daily Trade Tracker, Swing Trade Tracker and Quick Trade Entry can save a new manual trade on this device when you are offline.",
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
        keywords: Object.freeze(["offline trade entry", "Daily Trade Tracker", "Swing Trade Tracker", "Quick Trade Entry", "sync", "saved on this device"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "After you open Daily Trade Tracker, Swing Trade Tracker or Quick Trade Entry online once, the installed app can reopen its trade-entry form without a connection. Enter the same exact date, time, price and quantity shown by your broker so TraderLink can later check the trade correctly." }),
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
          Object.freeze({ kind: "paragraph", text: "Installing TradersLink does not turn on notifications by itself. In the installed app, open Account Notifications and choose Enable push notifications. Your browser asks for permission only after you select that action." }),
          Object.freeze({ kind: "paragraph", text: "You can choose alert categories for this device and turn them off later without changing your in-app updates or Discord choices. Lock-screen messages for account and trading updates stay generic and do not show trade or account details." }),
          Object.freeze({ kind: "link", href: "/account/preferences#push-notifications", label: "Open Push notifications", text: "Use Account Notifications to turn alerts on or off and choose the categories this device may receive." }),
        ]),
      }),
    ]),
  }),
]);

export function tradersLinkAppGuideBySlug(slug: string): HelpGuide | undefined {
  return TRADERSLINK_APP_HELP_GUIDES.find((guide) => guide.slug === slug);
}
