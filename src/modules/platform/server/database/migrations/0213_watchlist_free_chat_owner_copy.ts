import type { PlatformMigration } from "../platform-migration-contract";

export const watchlistFreeChatOwnerCopyMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform", migrationId: "0213_watchlist_free_chat_owner_copy", executionOrder: 270,
  statements: Object.freeze([
    "ALTER TABLE platform_watchlist_free_chat_posts ADD COLUMN owner_copy_json TEXT;",
  ]),
});
