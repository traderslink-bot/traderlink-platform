import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

export type PlatformDashboardMemberAccess = Readonly<{
  allowAllDiscordMembers: boolean;
  updatedAtUtc: string;
}>;

type AccessRow = Readonly<{
  allow_all_discord_members: 0 | 1;
  updated_at_utc: string;
}>;

export class PlatformDashboardMemberAccessRepository {
  constructor(private readonly database: Database.Database) {}

  read(): PlatformDashboardMemberAccess {
    const row = this.database.prepare<[], AccessRow>(`SELECT
  allow_all_discord_members, updated_at_utc
FROM platform_dashboard_member_access_settings
WHERE settings_key = 'member_dashboard_access'`).get();
    if (!row || (row.allow_all_discord_members !== 0 && row.allow_all_discord_members !== 1)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "memberDashboardAccess",
      });
    }
    assertCanonicalUtcTimestamp(row.updated_at_utc, "memberDashboardAccess.updatedAtUtc");
    return Object.freeze({
      allowAllDiscordMembers: row.allow_all_discord_members === 1,
      updatedAtUtc: row.updated_at_utc,
    });
  }

  save(input: Readonly<{
    actorUserId: string;
    allowAllDiscordMembers: boolean;
    now?: Date;
  }>): PlatformDashboardMemberAccess {
    assertCanonicalUuidV4(input.actorUserId, "actorUserId");
    if (typeof input.allowAllDiscordMembers !== "boolean") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "allowAllDiscordMembers",
      });
    }
    const changedAtUtc = createCanonicalUtcTimestamp(input.now);
    const update = this.database.transaction(() => {
      const changed = this.database.prepare(`UPDATE platform_dashboard_member_access_settings
SET allow_all_discord_members = ?, updated_at_utc = ?
WHERE settings_key = 'member_dashboard_access'`).run(
        input.allowAllDiscordMembers ? 1 : 0,
        changedAtUtc,
      );
      if (changed.changes !== 1) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "memberDashboardAccess",
        });
      }
      this.database.prepare(`INSERT INTO platform_dashboard_member_access_events (
  access_event_id, actor_user_id, allow_all_discord_members, changed_at_utc
) VALUES (?, ?, ?, ?)`).run(
        createCanonicalUuidV4(),
        input.actorUserId,
        input.allowAllDiscordMembers ? 1 : 0,
        changedAtUtc,
      );
    });
    update();
    return this.read();
  }
}
