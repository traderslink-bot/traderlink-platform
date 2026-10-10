export const notificationRoles = Object.freeze([
  { key: "watchlist", label: "@watchlist", description: "Watchlist posts and updates" },
  { key: "trading_tips", label: "@trading tips", description: "Trading tips and education" },
  { key: "day_trade", label: "@day trade", description: "Day-trading posts and discussions" },
  { key: "swing_trade", label: "@swing trade", description: "Swing-trading posts and discussions" },
  { key: "im_in", label: "@I'm in", description: "Members sharing stock entries" },
  { key: "im_out", label: "@I'm out", description: "Members sharing stock exits" },
  { key: "watching", label: "@watching", description: "Members sharing stocks they are watching" },
] as const);

export type NotificationRoleKey = typeof notificationRoles[number]["key"];
export const openSelectorId = "tl:notification-roles:v1:open";
export const noMentions = Object.freeze({ parse: [], users: [], roles: [], replied_user: false });

export function isNotificationRoleKey(value: unknown): value is NotificationRoleKey {
  return notificationRoles.some(role => role.key === value);
}

/** Plain labels never become role mentions. Publishing requires a separate explicit action. */
export function notificationPanelPayload() {
  return {
    allowed_mentions: noMentions,
    embeds: [{
      title: "Notifications",
      color: 0x5865f2,
      fields: notificationRoles.map(role => ({ name: role.label, value: role.description, inline: false })),
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
        min_values: 0, max_values: notificationRoles.length,
        options: notificationRoles.map(role => ({
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
