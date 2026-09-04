import type Database from "better-sqlite3";

import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import { assertCanonicalUuidV4, createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";

function integer(value: number, maximum = 1_000_000): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) throw new Error("shared_analyzer_admin_value_invalid");
  return value;
}

export class SharedAnalyzerAdministrationRepository {
  constructor(private readonly database: Database.Database, private readonly scope: JournalAdminScope) {}

  read(now = new Date()) {
    const allowance = new SharedAnalyzerAllowanceRepository(this.database);
    const settings = allowance.settings();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const usage = this.database.prepare(`SELECT count(*) AS total,
 sum(CASE WHEN charge_kind = 'user_charged' THEN 1 ELSE 0 END) AS charged,
 sum(CASE WHEN charge_kind = 'correction_waived' THEN 1 ELSE 0 END) AS waived,
 sum(CASE WHEN started_at_utc >= ? THEN 1 ELSE 0 END) AS rolling
FROM level_analysis_analyzer_acquisitions`).get(since) as
      { total: number; charged: number | null; waived: number | null; rolling: number | null };
    const connections = this.database.prepare(`SELECT connection.user_id, connection.workspace_id,
 account.account_id, account.account_label
FROM platform_broker_connections connection
JOIN journal_accounts account ON account.workspace_id = connection.workspace_id
WHERE connection.provider = 'moomoo' AND connection.connection_state = 'active'
ORDER BY account.account_label, account.account_id`).all() as
      readonly { user_id: string; workspace_id: string; account_id: string; account_label: string }[];
    const users = this.database.prepare(`SELECT user.user_id, user.display_name,
 override.daily_limit, override.period_limit
FROM platform_users user
LEFT JOIN level_analysis_user_allowance_overrides override ON override.user_id = user.user_id
WHERE user.status = 'active'
ORDER BY lower(user.display_name), user.user_id`).all() as readonly {
      user_id: string; display_name: string; daily_limit: number | null; period_limit: number | null;
    }[];
    const designated = this.database.prepare(`SELECT designated_user_id, designated_workspace_id,
 designated_account_id FROM level_analysis_shared_analyzer_settings
WHERE settings_key = 'beta'`).get() as { designated_user_id: string | null;
      designated_workspace_id: string | null; designated_account_id: string | null } | undefined;
    return Object.freeze({ settings, usage: Object.freeze({ total: usage.total,
      charged: usage.charged ?? 0, waived: usage.waived ?? 0, rolling: usage.rolling ?? 0 }),
      designatedConnection: designated?.designated_user_id && designated.designated_workspace_id && designated.designated_account_id
        ? `${designated.designated_user_id}:${designated.designated_workspace_id}:${designated.designated_account_id}` : "",
      connections: Object.freeze(connections.map((item) => Object.freeze({
        userId: item.user_id, workspaceId: item.workspace_id, accountId: item.account_id,
        label: item.account_label,
      }))), users: Object.freeze(users.map((item) => Object.freeze({
        userId: item.user_id, label: item.display_name,
        dailyOverride: item.daily_limit, periodOverride: item.period_limit,
        availability: allowance.availability(item.user_id, now),
      }))) });
  }

  saveSettings(input: Readonly<{
    enabled: boolean; dailyLimit: number; periodLimit: number; globalLimit: number;
    spacingSeconds: number; designatedUserId: string; designatedWorkspaceId: string; designatedAccountId: string;
  }>, now = new Date()): void {
    [input.designatedUserId, input.designatedWorkspaceId, input.designatedAccountId].forEach((value) => assertCanonicalUuidV4(value, "designatedScope"));
    const activeConnection = this.database.prepare(`SELECT 1
FROM platform_broker_connections connection
JOIN journal_accounts account ON account.workspace_id = connection.workspace_id
 AND account.account_id = ?
WHERE connection.user_id = ? AND connection.workspace_id = ?
 AND connection.provider = 'moomoo' AND connection.connection_state = 'active'
LIMIT 1`).get(input.designatedAccountId, input.designatedUserId, input.designatedWorkspaceId);
    if (!activeConnection) throw new Error("shared_analyzer_designated_connection_invalid");
    const timestamp = createCanonicalUtcTimestamp(now);
    const current = new SharedAnalyzerAllowanceRepository(this.database).settings();
    this.database.transaction(() => {
      this.database.prepare(`INSERT INTO level_analysis_shared_analyzer_settings (
 settings_key, enabled, default_daily_limit, default_period_limit,
 global_rolling_24h_limit, request_spacing_seconds, designated_user_id,
 designated_workspace_id, designated_account_id, revision, updated_by_user_id,
 created_at_utc, updated_at_utc
) VALUES ('beta', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
ON CONFLICT(settings_key) DO UPDATE SET enabled = excluded.enabled,
 default_daily_limit = excluded.default_daily_limit,
 default_period_limit = excluded.default_period_limit,
 global_rolling_24h_limit = excluded.global_rolling_24h_limit,
 request_spacing_seconds = excluded.request_spacing_seconds,
 designated_user_id = excluded.designated_user_id,
 designated_workspace_id = excluded.designated_workspace_id,
 designated_account_id = excluded.designated_account_id,
 revision = level_analysis_shared_analyzer_settings.revision + 1,
 updated_by_user_id = excluded.updated_by_user_id, updated_at_utc = excluded.updated_at_utc`).run(
        input.enabled ? 1 : 0, integer(input.dailyLimit), integer(input.periodLimit),
        integer(input.globalLimit), integer(input.spacingSeconds, 3600), input.designatedUserId,
        input.designatedWorkspaceId, input.designatedAccountId, this.scope.userId, timestamp, timestamp,
      );
      this.event("settings_saved", null, { prior_revision: current.revision }, timestamp);
    }).immediate();
  }

  saveOverride(userId: string, dailyLimit: number | null, periodLimit: number | null, now = new Date()): void {
    assertCanonicalUuidV4(userId, "userId");
    const timestamp = createCanonicalUtcTimestamp(now);
    if (dailyLimit === null && periodLimit === null) {
      this.database.prepare(`DELETE FROM level_analysis_user_allowance_overrides WHERE user_id = ?`).run(userId);
      this.event("override_removed", userId, {}, timestamp);
      return;
    }
    this.database.prepare(`INSERT INTO level_analysis_user_allowance_overrides (
 user_id, daily_limit, period_limit, revision, updated_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 1, ?, ?, ?)
ON CONFLICT(user_id) DO UPDATE SET daily_limit = excluded.daily_limit,
 period_limit = excluded.period_limit, revision = level_analysis_user_allowance_overrides.revision + 1,
 updated_by_user_id = excluded.updated_by_user_id, updated_at_utc = excluded.updated_at_utc`).run(
      userId, dailyLimit === null ? null : integer(dailyLimit),
      periodLimit === null ? null : integer(periodLimit), this.scope.userId, timestamp, timestamp,
    );
    this.event("override_saved", userId, {}, timestamp);
  }

  reset(userId: string, kind: "daily" | "period", now = new Date()): void {
    assertCanonicalUuidV4(userId, "userId");
    const allowance = new SharedAnalyzerAllowanceRepository(this.database);
    const cycle = allowance.activeCycle(userId, now);
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
    const date = `${value("year")}-${value("month")}-${value("day")}`;
    const timestamp = createCanonicalUtcTimestamp(now);
    if (!cycle) {
      this.event("usage_reset", userId, { reset_kind: kind }, timestamp);
      return;
    }
    this.database.prepare(`INSERT INTO level_analysis_user_allowance_resets (
 allowance_reset_id, user_id, reset_kind, effective_new_york_date,
 allowance_cycle_id, reset_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(createCanonicalUuidV4(), userId, kind, date,
      cycle.allowance_cycle_id, this.scope.userId, timestamp);
    this.event("usage_reset", userId, { reset_kind: kind }, timestamp);
  }

  private event(kind: "settings_saved" | "override_saved" | "override_removed" | "usage_reset",
    targetUserId: string | null, details: Record<string, string | number>, timestamp: string): void {
    this.database.prepare(`INSERT INTO level_analysis_shared_analyzer_admin_events (
 analyzer_admin_event_id, actor_user_id, event_kind, target_user_id, details_json, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?)`).run(createCanonicalUuidV4(), this.scope.userId, kind,
      targetUserId, JSON.stringify(details), timestamp);
  }
}
