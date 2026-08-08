import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export type CoachReviewDeliverySchedule = Readonly<{
  weeklyDeliveryDay: "friday" | "saturday" | "sunday";
  deliveryTimeEastern: string;
  updatedAtUtc: string;
}>;

export type CoachScheduledReviewAccount = Readonly<{
  scope: WorkspaceAccessScope;
  accountTimezone: string;
  monthlyEnabledAtUtc: string;
  schedule: CoachReviewDeliverySchedule;
}>;

export type CoachAiReviewFrequencyV2 = "weekly" | "two_week" | "monthly_only";

export type CoachAiReviewAccountSettingsV2 = Readonly<{
  isEnabled: boolean;
  firstEnabledAtUtc: string;
  currentFrequency: CoachAiReviewFrequencyV2;
  twoWeekAnchorMondayDate: string | null;
  pendingFrequency: CoachAiReviewFrequencyV2 | null;
  pendingEffectiveMondayDate: string | null;
  pendingTwoWeekAnchorMondayDate: string | null;
  revision: number;
  updatedAtUtc: string;
}>;

export type CoachAiReviewAccountSettingsRevisionV2 = CoachAiReviewAccountSettingsV2;

export type CoachScheduledAiReviewAccountV2 = Readonly<{
  scope: WorkspaceAccessScope;
  accountTimezone: string;
  settings: CoachAiReviewAccountSettingsV2;
}>;

export type CoachEffectiveAiReviewFrequencyV2 = Readonly<{
  frequency: CoachAiReviewFrequencyV2;
  twoWeekAnchorMondayDate: string | null;
  effectiveMondayDate: string | null;
  source: "current" | "pending";
}>;

const DELIVERY_TIME_PATTERN = /^(?:1[6-9]|2[0-3]):(?:00|30)$/u;

function activeAccountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

const WEEKLY_DELIVERY_DAYS = new Set(["friday", "saturday", "sunday"]);

function weeklyDeliveryDay(value: unknown): "friday" | "saturday" | "sunday" {
  if (typeof value !== "string" || !WEEKLY_DELIVERY_DAYS.has(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "weeklyDeliveryDay" });
  }
  return value as "friday" | "saturday" | "sunday";
}

function v2Frequency(value: unknown, field: string): CoachAiReviewFrequencyV2 {
  if (value !== "weekly" && value !== "two_week" && value !== "monthly_only") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function optionalMonday(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  const parsed = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ||
      parsed.getUTCDay() !== 1) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function v2Settings(row: Readonly<{
  is_enabled: 0 | 1;
  first_enabled_at_utc: string;
  current_frequency: CoachAiReviewFrequencyV2;
  two_week_anchor_monday_date: string | null;
  pending_frequency: CoachAiReviewFrequencyV2 | null;
  pending_effective_monday_date: string | null;
  pending_two_week_anchor_monday_date: string | null;
  revision: number;
  updated_at_utc: string;
}>): CoachAiReviewAccountSettingsV2 {
  return Object.freeze({
    isEnabled: row.is_enabled === 1,
    firstEnabledAtUtc: row.first_enabled_at_utc,
    currentFrequency: row.current_frequency,
    twoWeekAnchorMondayDate: row.two_week_anchor_monday_date,
    pendingFrequency: row.pending_frequency,
    pendingEffectiveMondayDate: row.pending_effective_monday_date,
    pendingTwoWeekAnchorMondayDate: row.pending_two_week_anchor_monday_date,
    revision: row.revision,
    updatedAtUtc: row.updated_at_utc,
  });
}

export function resolveCoachEffectiveAiReviewFrequencyV2(
  settings: CoachAiReviewAccountSettingsV2,
  cohortMondayDate: string,
): CoachEffectiveAiReviewFrequencyV2 {
  optionalMonday(cohortMondayDate, "cohortMondayDate");
  if (settings.pendingFrequency && settings.pendingEffectiveMondayDate &&
      cohortMondayDate >= settings.pendingEffectiveMondayDate) {
    return Object.freeze({
      frequency: settings.pendingFrequency,
      twoWeekAnchorMondayDate: settings.pendingTwoWeekAnchorMondayDate,
      effectiveMondayDate: settings.pendingEffectiveMondayDate,
      source: "pending",
    });
  }
  return Object.freeze({
    frequency: settings.currentFrequency,
    twoWeekAnchorMondayDate: settings.twoWeekAnchorMondayDate,
    effectiveMondayDate: null,
    source: "current",
  });
}

export class CoachReviewDeliveryScheduleRepository {
  constructor(private readonly database: Database.Database) {}

  read(scope: WorkspaceAccessScope): CoachReviewDeliverySchedule | null {
    const row = this.database.prepare<[string], Readonly<{
      weekly_delivery_day: "friday" | "saturday" | "sunday";
      delivery_time_eastern: string;
      monthly_enabled_at_utc: string;
      updated_at_utc: string;
    }>>(`SELECT weekly_delivery_day, delivery_time_eastern, updated_at_utc
FROM coach_review_delivery_settings
WHERE account_id = ?`).get(activeAccountId(scope));
    return row ? Object.freeze({
      weeklyDeliveryDay: row.weekly_delivery_day,
      deliveryTimeEastern: row.delivery_time_eastern,
      updatedAtUtc: row.updated_at_utc,
    }) : null;
  }

  readV2(scope: WorkspaceAccessScope): CoachAiReviewAccountSettingsV2 | null {
    const row = this.database.prepare<[string], Readonly<{
      is_enabled: 0 | 1;
      first_enabled_at_utc: string;
      current_frequency: CoachAiReviewFrequencyV2;
      two_week_anchor_monday_date: string | null;
      pending_frequency: CoachAiReviewFrequencyV2 | null;
      pending_effective_monday_date: string | null;
      pending_two_week_anchor_monday_date: string | null;
      revision: number;
      updated_at_utc: string;
    }>>(`SELECT is_enabled, first_enabled_at_utc, current_frequency,
  two_week_anchor_monday_date, pending_frequency,
  pending_effective_monday_date, pending_two_week_anchor_monday_date,
  revision, updated_at_utc
FROM coach_ai_review_account_settings_v2
WHERE account_id = ?`).get(activeAccountId(scope));
    return row ? v2Settings(row) : null;
  }

  listRevisionsV2(
    scope: WorkspaceAccessScope,
  ): readonly CoachAiReviewAccountSettingsRevisionV2[] {
    const rows = this.database.prepare<[string], Readonly<{
      is_enabled: 0 | 1;
      first_enabled_at_utc: string;
      current_frequency: CoachAiReviewFrequencyV2;
      two_week_anchor_monday_date: string | null;
      pending_frequency: CoachAiReviewFrequencyV2 | null;
      pending_effective_monday_date: string | null;
      pending_two_week_anchor_monday_date: string | null;
      revision: number;
      updated_at_utc: string;
    }>>(`SELECT is_enabled, first_enabled_at_utc, current_frequency,
  two_week_anchor_monday_date, pending_frequency,
  pending_effective_monday_date, pending_two_week_anchor_monday_date,
  revision, recorded_at_utc AS updated_at_utc
FROM coach_ai_review_account_setting_revisions_v2
WHERE account_id = ? ORDER BY revision`).all(activeAccountId(scope));
    return Object.freeze(rows.map(v2Settings));
  }

  listEnabledAccounts(): readonly CoachScheduledReviewAccount[] {
    const rows = this.database.prepare<[], Readonly<{
      user_id: string;
      workspace_id: string;
      account_id: string;
      workspace_role: "owner" | "admin" | "member";
      trading_timezone: string;
      weekly_delivery_day: "friday" | "saturday" | "sunday";
      delivery_time_eastern: string;
      monthly_enabled_at_utc: string;
      updated_at_utc: string;
    }>>(`SELECT account.created_by_user_id AS user_id,
  account.workspace_id, account.account_id, membership.role AS workspace_role,
  account.trading_timezone, settings.weekly_delivery_day,
  settings.delivery_time_eastern, settings.updated_at_utc,
  monthly.enabled_at_utc AS monthly_enabled_at_utc
FROM coach_review_delivery_settings settings
JOIN coach_monthly_review_settings monthly ON monthly.account_id = settings.account_id
JOIN journal_accounts account ON account.account_id = settings.account_id
JOIN platform_users user ON user.user_id = account.created_by_user_id
JOIN platform_workspaces workspace ON workspace.workspace_id = account.workspace_id
JOIN platform_workspace_memberships membership
  ON membership.workspace_id = account.workspace_id
 AND membership.user_id = account.created_by_user_id
WHERE account.status = 'active' AND user.status = 'active'
  AND workspace.status = 'active' AND membership.status = 'active'
ORDER BY account.workspace_id, account.account_id`).all();
    return Object.freeze(rows.map((row) => Object.freeze({
      scope: Object.freeze({
        userId: row.user_id,
        workspaceId: row.workspace_id,
        workspaceRole: row.workspace_role,
        allowedAccountIds: Object.freeze([row.account_id]),
        activeAccountId: row.account_id,
      }),
      accountTimezone: row.trading_timezone,
      monthlyEnabledAtUtc: row.monthly_enabled_at_utc,
      schedule: Object.freeze({
        weeklyDeliveryDay: row.weekly_delivery_day,
        deliveryTimeEastern: row.delivery_time_eastern,
        updatedAtUtc: row.updated_at_utc,
      }),
    })));
  }

  listEnabledAccountsV2(): readonly CoachScheduledAiReviewAccountV2[] {
    const rows = this.database.prepare<[], Readonly<{
      user_id: string;
      workspace_id: string;
      account_id: string;
      workspace_role: "owner" | "admin" | "member";
      trading_timezone: string;
      is_enabled: 1;
      first_enabled_at_utc: string;
      current_frequency: CoachAiReviewFrequencyV2;
      two_week_anchor_monday_date: string | null;
      pending_frequency: CoachAiReviewFrequencyV2 | null;
      pending_effective_monday_date: string | null;
      pending_two_week_anchor_monday_date: string | null;
      revision: number;
      updated_at_utc: string;
    }>>(`SELECT account.created_by_user_id AS user_id,
  account.workspace_id, account.account_id, membership.role AS workspace_role,
  account.trading_timezone, settings.is_enabled, settings.first_enabled_at_utc,
  settings.current_frequency, settings.two_week_anchor_monday_date,
  settings.pending_frequency, settings.pending_effective_monday_date,
  settings.pending_two_week_anchor_monday_date, settings.revision,
  settings.updated_at_utc
FROM coach_ai_review_account_settings_v2 settings
JOIN journal_accounts account ON account.account_id = settings.account_id
JOIN platform_users user ON user.user_id = account.created_by_user_id
JOIN platform_workspaces workspace ON workspace.workspace_id = account.workspace_id
JOIN platform_workspace_memberships membership
  ON membership.workspace_id = account.workspace_id
 AND membership.user_id = account.created_by_user_id
WHERE settings.is_enabled = 1 AND account.status = 'active'
  AND user.status = 'active' AND workspace.status = 'active'
  AND membership.status = 'active'
ORDER BY account.workspace_id, account.account_id`).all();
    return Object.freeze(rows.map((row) => Object.freeze({
      scope: Object.freeze({
        userId: row.user_id,
        workspaceId: row.workspace_id,
        workspaceRole: row.workspace_role,
        allowedAccountIds: Object.freeze([row.account_id]),
        activeAccountId: row.account_id,
      }),
      accountTimezone: row.trading_timezone,
      settings: v2Settings(row),
    })));
  }

  saveV2(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      isEnabled: boolean;
      currentFrequency: CoachAiReviewFrequencyV2;
      twoWeekAnchorMondayDate: string | null;
      pendingFrequency: CoachAiReviewFrequencyV2 | null;
      pendingEffectiveMondayDate: string | null;
      pendingTwoWeekAnchorMondayDate: string | null;
      expectedRevision: number | null;
    }>,
    now = new Date(),
  ): CoachAiReviewAccountSettingsV2 {
    const current = this.readV2(scope);
    if ((current?.revision ?? null) !== input.expectedRevision ||
        (current === null && !input.isEnabled)) {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const currentFrequency = v2Frequency(input.currentFrequency, "currentFrequency");
    const anchor = optionalMonday(input.twoWeekAnchorMondayDate, "twoWeekAnchorMondayDate");
    const pendingFrequency = input.pendingFrequency === null
      ? null
      : v2Frequency(input.pendingFrequency, "pendingFrequency");
    const pendingEffective = optionalMonday(
      input.pendingEffectiveMondayDate,
      "pendingEffectiveMondayDate",
    );
    const pendingAnchor = optionalMonday(
      input.pendingTwoWeekAnchorMondayDate,
      "pendingTwoWeekAnchorMondayDate",
    );
    if (
      (currentFrequency === "two_week") !== (anchor !== null) ||
      (pendingFrequency === null) !== (pendingEffective === null) ||
      (pendingFrequency === "two_week" && pendingAnchor !== pendingEffective) ||
      (pendingFrequency !== null && pendingFrequency !== "two_week" && pendingAnchor !== null) ||
      (!input.isEnabled && pendingFrequency !== null)
    ) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "frequencyTransition",
    });
    const updatedAtUtc = createCanonicalUtcTimestamp(now);
    if (current && updatedAtUtc <= current.updatedAtUtc) {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const firstEnabledAtUtc = current?.firstEnabledAtUtc ?? updatedAtUtc;
    const revision = (current?.revision ?? 0) + 1;
    const accountId = activeAccountId(scope);
    const persist = this.database.transaction(() => {
    if (current) {
      const result = this.database.prepare(`UPDATE coach_ai_review_account_settings_v2
SET is_enabled = ?, current_frequency = ?, two_week_anchor_monday_date = ?,
  pending_frequency = ?, pending_effective_monday_date = ?,
  pending_two_week_anchor_monday_date = ?, revision = ?, updated_at_utc = ?
WHERE account_id = ? AND revision = ?`).run(
        input.isEnabled ? 1 : 0,
        currentFrequency,
        anchor,
        pendingFrequency,
        pendingEffective,
        pendingAnchor,
        revision,
        updatedAtUtc,
        accountId,
        current.revision,
      );
      if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    } else {
      this.database.prepare(`INSERT INTO coach_ai_review_account_settings_v2 (
  account_id, is_enabled, first_enabled_at_utc, current_frequency,
  two_week_anchor_monday_date, pending_frequency,
  pending_effective_monday_date, pending_two_week_anchor_monday_date,
  revision, updated_at_utc
) VALUES (?, 1, ?, ?, ?, ?, ?, ?, 1, ?)`).run(
        accountId,
        firstEnabledAtUtc,
        currentFrequency,
        anchor,
        pendingFrequency,
        pendingEffective,
        pendingAnchor,
        updatedAtUtc,
      );
    }
    const saved = this.readV2(scope)!;
    this.database.prepare(`INSERT INTO coach_ai_review_account_setting_revisions_v2 (
  account_id, revision, is_enabled, first_enabled_at_utc, current_frequency,
  two_week_anchor_monday_date, pending_frequency,
  pending_effective_monday_date, pending_two_week_anchor_monday_date,
  recorded_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      accountId,
      saved.revision,
      saved.isEnabled ? 1 : 0,
      saved.firstEnabledAtUtc,
      saved.currentFrequency,
      saved.twoWeekAnchorMondayDate,
      saved.pendingFrequency,
      saved.pendingEffectiveMondayDate,
      saved.pendingTwoWeekAnchorMondayDate,
      saved.updatedAtUtc,
    );
    return saved;
    });
    return persist();
  }

  save(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      weeklyDeliveryDay: unknown;
      deliveryTimeEastern: unknown;
      expectedUpdatedAtUtc?: string | null;
      expectedWeeklyDeliveryDay?: "friday" | "saturday" | "sunday";
      expectedDeliveryTimeEastern?: string;
    }>,
    now = new Date(),
  ): CoachReviewDeliverySchedule {
    const deliveryDay = weeklyDeliveryDay(input.weeklyDeliveryDay);
    if (typeof input.deliveryTimeEastern !== "string" || !DELIVERY_TIME_PATTERN.test(input.deliveryTimeEastern)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "deliveryTimeEastern",
      });
    }
    const updatedAtUtc = createCanonicalUtcTimestamp(now);
    const accountId = activeAccountId(scope);
    if (Object.hasOwn(input, "expectedUpdatedAtUtc")) {
      const current = this.read(scope);
      if ((current?.updatedAtUtc ?? null) !== input.expectedUpdatedAtUtc ||
          (input.expectedWeeklyDeliveryDay !== undefined &&
            (current?.weeklyDeliveryDay ?? null) !== input.expectedWeeklyDeliveryDay) ||
          (input.expectedDeliveryTimeEastern !== undefined &&
            (current?.deliveryTimeEastern ?? null) !== input.expectedDeliveryTimeEastern)) {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
    }
    this.database.prepare(`INSERT INTO coach_review_delivery_settings (
  account_id, weekly_delivery_day, delivery_time_eastern, updated_at_utc
) VALUES (?, ?, ?, ?)
ON CONFLICT(account_id) DO UPDATE SET
  weekly_delivery_day = excluded.weekly_delivery_day,
  delivery_time_eastern = excluded.delivery_time_eastern,
  updated_at_utc = excluded.updated_at_utc`).run(
      accountId,
      deliveryDay,
      input.deliveryTimeEastern,
      updatedAtUtc,
    );
    this.database.prepare(`INSERT INTO coach_monthly_review_settings (
  account_id, enabled_at_utc
) VALUES (?, ?)
ON CONFLICT(account_id) DO NOTHING`).run(accountId, updatedAtUtc);
    return Object.freeze({
      weeklyDeliveryDay: deliveryDay,
      deliveryTimeEastern: input.deliveryTimeEastern,
      updatedAtUtc,
    });
  }
}
