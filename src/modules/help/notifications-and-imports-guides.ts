import type { HelpGuide } from "./help-guide-types";

export const NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "import-a-statement",
    title: "Import a statement",
    description: "Add a broker CSV statement, review its format and save the accepted executions to your Trade Tracker.",
    sections: Object.freeze([
      Object.freeze({
        id: "choose-a-statement",
        title: "Choose a CSV statement",
        summary: "Start with the broker statement you want to add to the selected Trade Tracker account.",
        keywords: Object.freeze(["import trades", "csv", "broker statement", "choose statement", "upload"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Open Import Trades and choose the CSV statement from your broker. Statements can be imported in any order; TradersLink keeps accepted source evidence with the Trade Tracker records it creates." }),
          Object.freeze({ kind: "callout", title: "Use the selected Trade Tracker account", text: "An import belongs to the Trade Tracker account currently selected in TraderLink. Confirm that account before continuing." }),
        ]),
      }),
      Object.freeze({
        id: "review-the-format",
        title: "Review the statement format",
        summary: "Use a verified format when it is recognized, or map the columns when the layout is new.",
        keywords: Object.freeze(["verified format", "map columns", "statement format", "broker layout"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "TradersLink recognizes verified statement formats when it can. When a layout is new, map the columns that contain the ticker, date and time, Buy or Sell side, quantity and price. Add fees, currency or an execution reference when the statement includes them." }),
          Object.freeze({ kind: "callout", title: "Changed layouts are reviewed", text: "A successful mapping can be reused for the same trading account. A changed statement layout returns for your review instead of being guessed." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "review-import-result",
    title: "Review the mapping and import result",
    description: "Check the preview before saving and understand what happens after an import completes.",
    sections: Object.freeze([
      Object.freeze({
        id: "mapping-review",
        title: "Review the mapping",
        summary: "Check that each required statement column is assigned before you continue.",
        keywords: Object.freeze(["mapping review", "preview", "ticker", "date", "price", "fees"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "The mapping review is your chance to check that TradersLink read the statement columns as intended before it saves executions. Desktop shows mapping issues in a table and mobile uses readable issue cards. Correct the mapping when a column does not match the broker statement." }),
          Object.freeze({ kind: "callout", title: "Unknown is better than guessed", text: "Leave an unavailable fact unavailable rather than entering an invented value just to complete a field." }),
        ]),
      }),
      Object.freeze({
        id: "after-completion",
        title: "After the import completes",
        summary: "Review the Import history and follow up only when a specific factual question remains.",
        keywords: Object.freeze(["import complete", "import history", "data decisions", "duplicate", "follow up"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A completed import appears in Import history. Accepted executions join the same Trade Tracker history as manual entries. If a genuine duplicate, contradiction or missing fact needs attention, TradersLink directs only that item to Data Decisions." }),
          Object.freeze({ kind: "link", href: "/help/data-decisions/getting-started", label: "Read Data Decisions help", text: "See how to answer a factual follow-up without hiding unrelated valid trades." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "import-history-and-follow-up",
    title: "Use import history and follow-up decisions",
    description: "Find prior imports and use the appropriate Trade Tracker page for the next step.",
    sections: Object.freeze([
      Object.freeze({
        id: "import-history",
        title: "Use Import history",
        summary: "Return to Import Trades to see the statements already added for the selected account.",
        keywords: Object.freeze(["import history", "previous import", "reimport", "trade tracker account"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Import history keeps the added statements together for the selected Trade Tracker account. Desktop shows a table and mobile uses one card per import with its source, period, status, execution count and any Data Decisions link. Use it to confirm an import outcome before deciding whether you need another statement or a factual follow-up." }),
        ]),
      }),
      Object.freeze({
        id: "choose-the-follow-up-page",
        title: "Choose the follow-up page",
        summary: "Use the page that matches the work you need to do next.",
        keywords: Object.freeze(["after import", "daily tracker", "quick entry", "data decisions", "open positions"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze(["Open Data Decisions only for a specific item that needs source evidence.", "Open Daily Trade Tracker to review a current or recent trading day.", "Open Quick Trade Entry to add manual executions across past trading dates.", "Open Open Positions to view confirmed positions that remain open."]) }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "notifications",
    title: "Notifications",
    description: "See what finished, what needs your attention and where to find every update in TraderLink.",
    sections: Object.freeze([
      Object.freeze({
        id: "find-notifications",
        title: "Find your updates",
        summary: "Use the bell for recent updates or open the full Notifications page whenever you need it.",
        keywords: Object.freeze(["bell", "unread", "notifications page", "updates", "import complete"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Select the bell at the top of TraderLink to see your most recent updates. A number on the bell means you have unread updates. Select View all notifications to see the full list." }),
          Object.freeze({ kind: "paragraph", text: "On a phone, the recent-updates menu fits the available screen height, wraps long update text and keeps each dismiss control easy to reach." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Select an update to open the related page, such as Import Trades, Data Decisions or a chart.",
            "Opening an update marks it as read. This only changes the update, never your trades or statement.",
            "Close an update after you have seen it to remove it from your notifications. This never changes your trades or statement.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "updates-you-may-see",
        title: "Updates you may see",
        summary: "Understand the plain-language updates TraderLink can show.",
        keywords: Object.freeze(["statement import", "broker import", "data decisions", "chart update", "ai review"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Update", "What it means"]), rows: Object.freeze([
            Object.freeze(["Statement import complete", "Your statement was added to your Trade Tracker and is ready to review."]),
            Object.freeze(["Statement import needs attention", "TraderLink added what it could and needs you to look at a few items before they can be settled."]),
            Object.freeze(["Broker import complete", "Newly imported broker trades are available in your Trade Tracker."]),
            Object.freeze(["Broker import needs attention", "The import could not finish. Open the update to review the next step."]),
            Object.freeze(["Reconnect Moomoo", "Your Moomoo connection needs to be reconnected before TraderLink can continue updates."]),
            Object.freeze(["Data Decisions need your review", "Some trade details need your confirmation before every affected result can be complete."]),
            Object.freeze(["Chart update ready", "A completed chart update is available for an eligible trade review."]),
            Object.freeze(["AI Review ready", "A saved weekly or monthly review is ready to read when AI Reviews are available for your account."]),
          ]) }),
          Object.freeze({ kind: "callout", title: "Your updates stay private", text: "An update tells you what happened and where to go next. It does not show statement rows, broker account numbers or trade values." }),
        ]),
      }),
      Object.freeze({
        id: "offline-notifications",
        title: "Read saved updates offline",
        summary: "Open Notifications online once to keep a bounded read-only copy on this device.",
        keywords: Object.freeze(["offline notifications", "last updated", "saved pages", "offline data", "remove offline data"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "When you open Notifications while online, TraderLink can keep a bounded read-only copy for the selected Trade Tracker account. Offline pages clearly show when that copy was last updated. Reading the copy does not mark an update as read or change any Journal fact." }),
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open Preferences", text: "Select Account in the top bar, choose Preferences and find Offline data." }),
            Object.freeze({ title: "2. Review what is saved", text: "See how many pages are saved, whether an unsynced trade is waiting, when pages were last updated and the browser's estimated app storage." }),
            Object.freeze({ title: "3. Remove it deliberately", text: "Choose Remove offline data when you want to clear the current account's saved pages and offline trade entries from this device. TraderLink warns you first when an unsynced trade exists only on the device." }),
          ]) }),
          Object.freeze({ kind: "callout", title: "Saved pages are not a backup", text: "TraderLink keeps up to 50 MB of read-only page copies in the browser and removes the oldest copies first. It never automatically removes an unsynced trade. Device storage can still be removed by the browser or operating system, and a pending trade counts only after TraderLink accepts it into the Journal." }),
        ]),
      }),
      Object.freeze({
        id: "push-notifications",
        title: "Turn on push notifications",
        summary: "Choose account updates and press release channels that may alert this device.",
        keywords: Object.freeze(["push notifications", "press releases", "news filtered", "market cap", "lock screen", "permission", "phone alerts"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open Notifications settings", text: "In the installed app, select Set up notifications in the notice at the top of the page. You can also select Account in the top bar, choose Preferences and find Push notifications." }),
            Object.freeze({ title: "2. Choose alerts", text: "Choose account and trading updates, then choose the News Filtered and market-cap Press Releases channels you want on this device." }),
            Object.freeze({ title: "3. Enable this device", text: "Select Enable push notifications. TraderLink asks the browser for permission only after you select this button." }),
          ]) }),
          Object.freeze({ kind: "callout", title: "Private alerts stay generic", text: "Account and trading alerts never show tickers, P/L, prices, quantities, account details, statement names, broker identity, notes or AI Review text. Press release alerts may show the public ticker and headline so you know which public article arrived." }),
          Object.freeze({ kind: "paragraph", text: "A press release alert opens the signed-in Press Releases page and shows that article in the details drawer. Reading it marks the article as read across every Press Releases channel where it appears." }),
          Object.freeze({ kind: "paragraph", text: "If you do not want push notifications, select Don't show again in the installed-app notice. You can still turn them on later from Account Preferences." }),
          Object.freeze({ kind: "paragraph", text: "Push notifications are separate from the Notifications page and Discord messages. Turning push off on one device does not remove in-app updates or change your Discord choices." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "discord-notifications",
    title: "Discord notifications",
    description: "Choose which TraderLink updates you would also like to receive by Discord message.",
    sections: Object.freeze([
      Object.freeze({
        id: "choose-updates",
        title: "Choose your Discord updates",
        summary: "Turn categories on or off in Account settings.",
        keywords: Object.freeze(["Discord", "DM", "account settings", "broker imports", "statement imports"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open Account settings", text: "Select Account in the top bar, then choose Preferences and find Notifications." }),
            Object.freeze({ title: "2. Choose the updates you want", text: "Choose AI Reviews, broker connection, broker imports, Data Decisions, chart updates, statement imports, or any combination that helps you." }),
            Object.freeze({ title: "3. Save your choices", text: "You can change these choices whenever you want." }),
          ]) }),
          Object.freeze({ kind: "callout", title: "Discord is optional", text: "Every update still appears in the Notifications page. Turning a Discord category off does not hide it from TraderLink." }),
        ]),
      }),
      Object.freeze({
        id: "statement-completion-message",
        title: "Ask for a message when a statement is ready",
        summary: "Choose an extra one-time message while asking TraderLink to review an unsupported statement.",
        keywords: Object.freeze(["statement ready", "import complete", "one-time", "AI review", "Discord message"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "When a statement needs extra review, you can select Send me a Discord DM when this import is complete. This is optional and applies to that statement import." }),
          Object.freeze({ kind: "paragraph", text: "The message lets you know the import is ready or needs your attention. It does not include statement details, broker account numbers or trade values." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "statement-will-not-import",
    title: "When a statement will not import",
    description: "Choose the right next step when TraderLink does not yet recognize your statement format.",
    sections: Object.freeze([
      Object.freeze({
        id: "why-it-happens",
        title: "Why an import can stop",
        summary: "A broker can use a layout TraderLink has not seen before or change a layout it used before.",
        keywords: Object.freeze(["statement failed", "unsupported", "format", "layout", "import stopped"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A statement can stop before anything is added when TraderLink cannot safely recognize its layout. This is meant to protect your Trade Tracker from guessing at columns or trade details." }),
          Object.freeze({ kind: "callout", title: "Nothing is changed yet", text: "A stopped import does not change your existing trades. You can choose the next step without losing the statement you selected." }),
        ]),
      }),
      Object.freeze({
        id: "allow-ai-review",
        title: "Allow a private statement review",
        summary: "Let TraderLink use the statement to prepare a safe import when you choose to do so.",
        keywords: Object.freeze(["allow AI", "private", "review statement", "successful import", "consent"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Choose Allow AI to review this statement when you want help with a statement TraderLink does not yet recognize. The review is used only to prepare this import. Your statement remains private to your Trade Tracker." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "TraderLink checks the statement format and prepares the column choices needed for the import.",
            "It checks the result against the same statement before adding anything to your Trade Tracker.",
            "If the check succeeds, TraderLink continues your original import. It does not replace trades you already have.",
            "You can choose a Discord message for this import if you would like to know when it is ready.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "map-it-yourself",
        title: "Map the statement yourself instead",
        summary: "Choose the columns when you would rather not allow a private statement review.",
        keywords: Object.freeze(["map columns", "manual mapping", "headers", "buy", "sell", "date", "price"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Select the statement table and tell TraderLink which columns contain the ticker, date and time, Buy or Sell, quantity and price. Add fees, currency or an execution reference when your statement includes them." }),
          Object.freeze({ kind: "callout", title: "Your mapping stays useful", text: "After you review and save a successful mapping, TraderLink can recognize the same statement layout for that trading account in the future. A changed layout is shown for review instead of being guessed." }),
        ]),
      }),
      Object.freeze({
        id: "after-the-import",
        title: "After the import",
        summary: "Review the result and handle only the items that still need you.",
        keywords: Object.freeze(["after import", "data decisions", "review", "duplicates", "existing trades"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A completed import appears in Import Trades. If TraderLink finds a genuine duplicate or unclear match, it keeps the valid imported trades available and shows only the specific items that need your decision." }),
          Object.freeze({ kind: "link", href: "/imports", label: "Open Import Trades", text: "Use Import Trades to upload another statement, review saved imports and open any follow-up work." }),
        ]),
      }),
    ]),
  }),
]);

export function notificationsAndImportsGuideBySlug(slug: string): HelpGuide | undefined {
  return NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES.find((guide) => guide.slug === slug);
}
