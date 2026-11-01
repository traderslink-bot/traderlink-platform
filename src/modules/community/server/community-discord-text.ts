/** Render untrusted member titles as plain Discord text. */
export function escapeDiscordAnnouncementTitle(value: string): string {
  return value.replace(/([\\`*_{}\[\]()<>~|])/gu, "\\$1").replace(/@/gu, "@\u200b");
}
