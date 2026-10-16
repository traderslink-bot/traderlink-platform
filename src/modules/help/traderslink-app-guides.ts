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
          Object.freeze({ kind: "paragraph", text: "If a live page cannot load, choose Try again to reopen it. A slow response does not necessarily mean your device is offline. Any saved information shown below remains a last-updated copy, not live data." }),
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
          Object.freeze({ kind: "paragraph", text: "Installing TradersLink does not turn on notifications by itself. In the installed app, open Account Preferences and choose Turn on notifications. Your browser asks for permission only after you select that action." }),
          Object.freeze({ kind: "paragraph", text: "Alert category choices apply to your account's connected devices. You can turn push off on this device without changing your in-app updates or Discord choices. Removing offline page data does not turn push off. Lock-screen messages for account and trading updates stay generic and do not show trade or account details." }),
          Object.freeze({ kind: "paragraph", text: "In Account Preferences, choose Send test notification to check that an alert appears on the device you are using. When an app update is ready, a notice appears above the dashboard content. Save any edits before choosing Update app. If the update takes longer than expected or has already been applied in another tab, choose Reload app to reopen the app. Offline entries already saved on your device will remain." }),
          Object.freeze({ kind: "link", href: "/account/preferences#push-notifications", label: "Open Push notifications", text: "Use Account Preferences to turn alerts on or off and choose the categories this device may receive." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "discord-communities",
    title: "Discord communities in TradersLink",
    description: "Join your server workspace, open role-based posts, share watchlists and control coaching Journal access.",
    sections: Object.freeze([
      Object.freeze({
        id: "joining-a-community",
        title: "Join through your Discord server",
        summary: "A connected server gives all verified members a TraderLink account path.",
        keywords: Object.freeze(["Discord community", "server", "roles", "join TraderLink", "membership"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Sign in with the Discord account that belongs to the connected server. Every verified active member can use TraderLink; the server owner does not choose which roles may create an account." }),
          Object.freeze({ kind: "paragraph", text: "The owner can use current Discord roles to limit only that server's alerts, watchlists or coaching plans. If your role changes, access changes after TraderLink receives a fresh Discord membership check." }),
          Object.freeze({ kind: "link", href: "/communities", label: "Open My Communities", text: "Choose one of your connected Discord communities." }),
          Object.freeze({ kind: "paragraph", text: "Server owners select an approved server and choose Recheck installation. If the app is missing, install the TraderLink Discord app in the Discord tab, return to TraderLink and choose Recheck installation again. Opening or cancelling installation does not confirm success. Discord app installed and ready to connect enables Connect server after current owner verification. If verification is unavailable, ask the server owner to check the app’s Discord access or contact TraderLink support, then recheck. Installation verification does not save a connection or send a message. An existing connection shows Server connected and Manage community; use Manage community to open its settings. This connection status does not confirm current bot access. Channel settings show Discord app detected after successful bot discovery; individual channels may still need permission changes. TraderLink uses the verified Discord server name and creates its community URL automatically. Role and channel setup uses the names fetched from Discord; you do not need to copy IDs. If a channel is unavailable, ask the server owner or someone who manages channel permissions to check the bot's View Channel and Send Messages access, channel-specific overrides and any bot timeout, then refresh. Saving channel settings does not send a test message." }),
        ]),
      }),
      Object.freeze({
        id: "posts-and-watchlists",
        title: "Alerts and shared watchlists",
        summary: "Open server posts in TraderLink and share a watchlist you own.",
        keywords: Object.freeze(["alerts", "watchlists", "share to community", "Discord channel"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Server owners map publishing responsibilities to Discord roles. In Manage, Discord channels, assign each alerts or watchlists destination to individual team publishers or Discord roles. Assignments combine; removing an individual assignment does not remove access granted by a role. A destination assignment alone does not grant publishing responsibility. The verified server owner can use all configured destinations.",
            "A regular member can share an already-published personal Community Watchlist. The member remains its named owner; sharing does not create a server-owned copy.",
            "Choose Website only to queue no Discord message, or Send to Discord and select the exact permitted channels. Separately choose a tracked page link or a full Discord post; a full Discord post needs a Discord destination. Drafts retain distribution and selections. Unavailable selections must be corrected before publishing. Check Discord channels for delivery status: a save confirmation does not mean delivery succeeded. Queued sends and retries recheck the original publisher access. Legacy deliveries without recorded publisher evidence require owner review and are not automatically resent.",
            "Official server watchlists support Notes, DD research and source links for each ticker. Open a ticker's research section while creating or editing the watchlist. This is your own research; saving it does not generate AI analysis.",
            "A failed save keeps your entries. Retry an unchanged submission to check the same save without creating a second alert or watchlist. Published content can be edited, unpublished or archived; previously sent Discord messages are not silently reposted.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "coaching-and-journal-privacy",
        title: "Coaching and Journal privacy",
        summary: "The coach controls their plan while you control every Journal share.",
        keywords: Object.freeze(["coach", "coaching", "Journal sharing", "revoke", "payment"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Coaches create their own plans, delivery details, displayed prices and student limits. New student requests appear under Students → Requests, where the coach can accept or decline them. The coach or server handles payment in Discord; TraderLink does not provide checkout or collect a launch coaching commission." }),
          Object.freeze({ kind: "paragraph", text: "Save your coach profile before creating a plan. A Discord coaching role is required to publish a plan; Choose coaching role opens the required setting, and drafts can be saved first. Use Edit on a selected service card or its Plan preview entry to go to that service's options, including How often and Period covered where available. Switching plans or reusing a lesson asks before discarding unsaved entries. Keep editing returns to the current draft. Plan save errors keep your entries in the editor. If the plan changed in another window, copy the changes you want to keep and reload before saving again. After an interrupted connection, check Coach Setup for a saved plan before creating another. When you switch coaches, Journal sharing shows only the selected coaching relationship." }),
          Object.freeze({ kind: "paragraph", text: "A review that requires trades under your accepted agreement cannot be sent or completed until the required trade feedback is saved. An overall summary does not replace those trade reviews. If Journal access is off and the coach needs trades, the student must choose whether to share trades for that coaching relationship. Summary-only reviews remain available when no trade work is required." }),
          Object.freeze({ kind: "paragraph", text: "Save draft keeps a new lesson private. Publish lesson is a separate action. During saving or publishing, editing and Reuse are temporarily unavailable. Saved lesson editors also lock their text and selection controls until the save finishes. If the save is rejected, you can continue editing the retained entries. Choose an audience, then check its recipient count and names before publishing. Plan and student selectors appear only for their matching audience type. A lesson needs at least one active, unarchived student who matches its audience before publication. If publication is rejected, the saved lesson and recipients stay unchanged and your entries remain in the editor. Restore an archived student or create a lesson for the correct students or plan, then try again." }),
          Object.freeze({ kind: "paragraph", text: "Community navigation groups Alerts and Watchlists under Trading desk, coaching pages under Coaching, and administration under Manage. Coaches shows coach profiles and plans grouped as Available, Requested and Enrolled; each plan identifies its coach. Coach setup groups Profile and plans with Lessons. My coaching shows coaching you receive as a student. Its landing page groups Upcoming work across active plans, Coaches, assigned Lessons and pending or declined Requests. Open a coach to see that coach’s pages; if you have several plans with them, select the plan before using reviews, messages, sessions, tasks, lessons, agreements, Journal sharing or history. Upcoming links open the relevant item without acknowledging a review or submitting work. Unscheduled work remains inside the coach’s pages. Ended relationships retain their history, and paused access is explained. Switching pages or plans asks before discarding entered form values. Lesson purchases and courses are not part of this page. Coach workspace manages the students you coach. Coaching Work session links open the selected session in its student workspace. For a Custom date range, the end date must be on or after the start date; correct the dates or use Clear filters if an error appears. If Coaching Work has no matching results, check the displayed filters or choose Clear filters to return to Upcoming, five days and active work. Private coach notes are not included in the student's final review. Before sending a chart, check its selected filename and preview; Remove selected image clears it without sending. While an image is sending, selection and removal are unavailable until it finishes." }),
          Object.freeze({ kind: "callout", title: "Coaching never opens your Journal automatically", text: "You must separately choose a specific Journal account and data scope for an active coach. You can revoke that read access at any time. A coach cannot edit your executions, P/L, broker evidence or Journal facts." }),
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
