export const notificationRoles = Object.freeze([
  { key: "watchlist", label: "@watchlist", description: "Watchlist posts and updates" },
  { key: "trading_tips", label: "@trading tips", description: "Trading tips and education" },
  { key: "day_trade", label: "@day trade", description: "Day-trading posts and discussions" },
  { key: "swing_trade", label: "@swing trade", description: "Swing-trading posts and discussions" },
  { key: "im_in", label: "@I'm in", description: "Members sharing stock entries" },
  { key: "im_out", label: "@I'm out", description: "Members sharing stock exits" },
  { key: "watching", label: "@watching", description: "Members sharing stocks they are watching" },
  { key: "live_scanner", label: "@live scanner", description: "Live stock scanner posts" },
  { key: "news_scanner", label: "@news scanner", description: "News scanner posts" },
  { key: "news_30m_mc", label: "@news 30m mc", description: "News for stocks under $30 million market cap" },
  { key: "news_50m_mc", label: "@news 50m mc", description: "News for stocks under $50 million market cap" },
  { key: "news_100m_mc", label: "@news 100m mc", description: "News for stocks under $100 million market cap" },
  { key: "halt_alerts", label: "@halt alerts", description: "Stock trading halt posts" },
] as const);

export type NotificationRoleKey = typeof notificationRoles[number]["key"];
// Retain day-trade configuration and admin tracking while hiding it from subscriptions.
export const selectableNotificationRoles = notificationRoles.filter(role => role.key !== "day_trade");
export const openSelectorId = "tl:notification-roles:v1:open";
export const noMentions = Object.freeze({ parse: [], users: [], roles: [], replied_user: false });

export function isNotificationRoleKey(value: unknown): value is NotificationRoleKey {
  return notificationRoles.some(role => role.key === value);
}

export function isSelectableNotificationRoleKey(value: unknown): value is NotificationRoleKey {
  return selectableNotificationRoles.some(role => role.key === value);
}

/** Plain labels never become role mentions. Publishing requires a separate explicit action. */
export function notificationPanelPayload() {
  return {
    allowed_mentions: noMentions,
    embeds: [{
      title: "Choose your notifications",
      description: "Select the topics you want alerts for. Tap the save button after you select. We use Discord @mentions to notify you when something you’ve selected is posted. You can return here anytime to change your selections or unsubscribe.",
      color: 0x5865f2,
      fields: [
        { name: "TradersLink", value: "• **@watchlist** — Ticker added to watchlist\n• **@swing trade** — Posts in #this-guy-swing-trades\n• **@trading tips** — Trading tips", inline: false },
        { name: "Community", value: "• **@I'm in** — Members sharing that they entered a stock\n• **@I'm out** — Members sharing that they exited a stock\n• **@watching** — Members sharing stocks they are watching", inline: false },
        { name: "Stock tools", value: "• **@live scanner** — #live-stock-scanner\n• **@news scanner** — #news-scanner\n• **@news 30m mc** — #news-under-30m-mc\n• **@news 50m mc** — #news-under-50m-mc\n• **@news 100m mc** — #news-under-100m-mc\n• **@halt alerts** — #halt-alerts", inline: false },
      ],
      footer: { text: "Alerts depend on your Discord and device notification settings. Your selections control notification preference; your membership controls channel access. Your selections are private. Select your topics, then press Save." },
    }],
    components: [{ type: 1, components: [
      { type: 2, style: 1, label: "Choose notifications", custom_id: openSelectorId },
    ] }],
  };
}

export function privateSelectorPayload(sessionId: string, selected: readonly NotificationRoleKey[], content = "") {
  const prefix = `tl:nr:v1:${sessionId}`;
  return {
    content,
    allowed_mentions: noMentions,
    embeds: [{ title: "Your notifications", color: 0x5865f2 }],
    components: [
      { type: 1, components: [{
        type: 3, custom_id: `${prefix}:select`, placeholder: "Select notifications",
        min_values: 0, max_values: selectableNotificationRoles.length,
        options: selectableNotificationRoles.map(role => ({
          label: role.label, value: role.key, description: role.description, default: selected.includes(role.key),
        })),
      }] },
      { type: 1, components: [
        { type: 2, style: 1, label: "Save", custom_id: `${prefix}:save` },
        { type: 2, style: 2, label: "Clear selection", custom_id: `${prefix}:clear` },
      ] },
    ],
  };
}

export function privateNotice(content: string) {
  return { content, allowed_mentions: noMentions, embeds: [], components: [] };
}
