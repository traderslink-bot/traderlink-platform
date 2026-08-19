import type Database from "better-sqlite3";

import {
  DEFAULT_PLATFORM_NOTIFICATION_PREFERENCES,
  PLATFORM_NOTIFICATION_CATEGORIES,
  PLATFORM_NOTIFICATION_KINDS,
  type PlatformNotification,
  type PlatformNotificationCategory,
  type PlatformNotificationKind,
  type PlatformNotificationPreferences,
} from "@/src/modules/platform/contracts/platform-notification-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { loadPlatformWebPushEncryptionConfiguration } from "./platform-web-push-configuration";
import { PlatformWebPushRepository } from "./platform-web-push-repository";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  assertLowercaseToken,
  createCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

type NotificationRow = Readonly<{
  category: string;
  destination_path: string | null;
  kind: string;
  notification_id: string;
  occurred_at_utc: string;
  read_at_utc: string | null;
  summary: string;
  title: string;
}>;

type PreferenceRow = Readonly<{
  category: string;
  discord_dm_enabled: number;
  web_push_enabled: number;
}>;

function parseCategory(value: unknown): PlatformNotificationCategory {
  if (typeof value !== "string" || !(PLATFORM_NOTIFICATION_CATEGORIES as readonly string[]).includes(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "notificationCategory" });
  }
  return value as PlatformNotificationCategory;
}

function parseKind(value: unknown): PlatformNotificationKind {
  if (typeof value !== "string" || !(PLATFORM_NOTIFICATION_KINDS as readonly string[]).includes(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "notificationKind" });
  }
  return value as PlatformNotificationKind;
}

function assertNotificationText(value: unknown, field: string, maximumLength: number): string {
  if (typeof value !== "string" || value.length === 0 || value.length > maximumLength || /[\r\n]/u.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function parseDestinationPath(value: unknown): string | null {
  if (value === null) return null;
  if (
    typeof value !== "string" || value.length === 0 || value.length > 512 ||
    !value.startsWith("/") || value.startsWith("//") || value.includes("\\") ||
    value.includes("://") || /[\r\n]/u.test(value)
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "notificationDestination" });
  }
  return value;
}

function toNotification(row: NotificationRow): PlatformNotification {
  return Object.freeze({
    category: parseCategory(row.category),
    destinationPath: row.destination_path,
    kind: parseKind(row.kind),
    notificationRef: row.notification_id,
    occurredAtUtc: row.occurred_at_utc,
    readAtUtc: row.read_at_utc,
    summary: row.summary,
    title: row.title,
  });
}

export class PlatformNotificationRepository {
  constructor(private readonly database: Database.Database) {}

  private assertActiveScope(scope: WorkspaceAccessScope): void {
    const row = this.database.prepare<[string, string], { found: number }>(`SELECT 1 AS found
FROM platform_workspace_memberships membership
JOIN platform_users user ON user.user_id = membership.user_id
JOIN platform_workspaces workspace ON workspace.workspace_id = membership.workspace_id
WHERE membership.user_id = ? AND membership.workspace_id = ?
  AND membership.status = 'active' AND user.status = 'active'
  AND workspace.status = 'active'`).get(scope.userId, scope.workspaceId);
    if (!row) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }

  list(scope: WorkspaceAccessScope, limit = 50): readonly PlatformNotification[] {
    this.assertActiveScope(scope);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "notificationLimit" });
    }
    const rows = this.database.prepare<[string, string, number], NotificationRow>(`SELECT
  notification.notification_id,
  notification.category,
  notification.kind,
  notification.title,
  notification.summary,
  notification.destination_path,
  notification.occurred_at_utc,
  receipt.read_at_utc
FROM platform_notifications notification
JOIN platform_notification_receipts receipt
  ON receipt.notification_id = notification.notification_id
  AND receipt.recipient_user_id = notification.recipient_user_id
WHERE notification.workspace_id = ? AND notification.recipient_user_id = ?
ORDER BY notification.occurred_at_utc DESC, notification.notification_id DESC
LIMIT ?`).all(scope.workspaceId, scope.userId, limit);
    return Object.freeze(rows.map(toNotification));
  }

  create(input: Readonly<{
    category: unknown;
    destinationPath: unknown;
    journalAccountId: string | null;
    kind: unknown;
    occurredAtUtc: string;
    scope: WorkspaceAccessScope;
    sourceEventKey: string;
    summary: unknown;
    title: unknown;
  }>): PlatformNotification {
    this.assertActiveScope(input.scope);
    const category = parseCategory(input.category);
    const kind = parseKind(input.kind);
    const title = assertNotificationText(input.title, "notificationTitle", 160);
    const summary = assertNotificationText(input.summary, "notificationSummary", 500);
    const destinationPath = parseDestinationPath(input.destinationPath);
    assertLowercaseToken(input.sourceEventKey, "notificationSourceEvent", 128);
    assertCanonicalUtcTimestamp(input.occurredAtUtc, "notificationOccurredAtUtc");
    if (input.journalAccountId !== null) {
      assertCanonicalUuidV4(input.journalAccountId, "notificationJournalAccountId");
      if (!input.scope.allowedAccountIds.includes(input.journalAccountId)) {
        platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
    }
    const existing = this.database.prepare<[string, string, string], NotificationRow>(`SELECT
  notification.notification_id, notification.category, notification.kind,
  notification.title, notification.summary, notification.destination_path,
  notification.occurred_at_utc, receipt.read_at_utc
FROM platform_notifications notification
JOIN platform_notification_receipts receipt
  ON receipt.notification_id = notification.notification_id
  AND receipt.recipient_user_id = notification.recipient_user_id
WHERE notification.workspace_id = ? AND notification.recipient_user_id = ?
  AND notification.source_event_key = ?`).get(
      input.scope.workspaceId,
      input.scope.userId,
      input.sourceEventKey,
    );
    if (existing) return toNotification(existing);

    const notificationId = createCanonicalUuidV4();
    const insert = this.database.transaction(() => {
      this.database.prepare(`INSERT INTO platform_notifications (
  notification_id, workspace_id, recipient_user_id, journal_account_id,
  category, kind, source_event_key, title, summary, destination_path,
  occurred_at_utc, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        notificationId,
        input.scope.workspaceId,
        input.scope.userId,
        input.journalAccountId,
        category,
        kind,
        input.sourceEventKey,
        title,
        summary,
        destinationPath,
        input.occurredAtUtc,
        input.occurredAtUtc,
      );
      this.database.prepare(`INSERT INTO platform_notification_receipts (
  notification_id, recipient_user_id, read_at_utc, created_at_utc
) VALUES (?, ?, NULL, ?)`).run(notificationId, input.scope.userId, input.occurredAtUtc);
    });
    insert();
    try {
      new PlatformWebPushRepository(
        this.database,
        loadPlatformWebPushEncryptionConfiguration(),
      ).enqueueNotification({
        category,
        notificationRef: notificationId,
        occurredAtUtc: input.occurredAtUtc,
        userId: input.scope.userId,
      });
    } catch {
      // In-app notifications remain authoritative when hosted Web Push is not configured.
    }
    return Object.freeze({
      category,
      destinationPath,
      kind,
      notificationRef: notificationId,
      occurredAtUtc: input.occurredAtUtc,
      readAtUtc: null,
      summary,
      title,
    });
  }

  markRead(scope: WorkspaceAccessScope, notificationRef: string, readAtUtc: string): void {
    this.assertActiveScope(scope);
    assertCanonicalUuidV4(notificationRef, "notificationRef");
    assertCanonicalUtcTimestamp(readAtUtc, "notificationReadAtUtc");
    const result = this.database.prepare(`UPDATE platform_notification_receipts
SET read_at_utc = ?
WHERE notification_id = ? AND recipient_user_id = ? AND read_at_utc IS NULL
  AND EXISTS (
    SELECT 1 FROM platform_notifications notification
    WHERE notification.notification_id = platform_notification_receipts.notification_id
      AND notification.workspace_id = ?
      AND notification.recipient_user_id = ?
  )`).run(readAtUtc, notificationRef, scope.userId, scope.workspaceId, scope.userId);
    if (result.changes !== 1) {
      const exists = this.database.prepare<[string, string, string], { found: number }>(`SELECT 1 AS found
FROM platform_notifications notification
JOIN platform_notification_receipts receipt ON receipt.notification_id = notification.notification_id
WHERE notification.notification_id = ? AND notification.workspace_id = ?
  AND receipt.recipient_user_id = ?`).get(notificationRef, scope.workspaceId, scope.userId);
      if (!exists) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    }
  }

  readPreferences(scope: WorkspaceAccessScope): PlatformNotificationPreferences {
    this.assertActiveScope(scope);
    const rows = this.database.prepare<[string], PreferenceRow>(`SELECT category, discord_dm_enabled, web_push_enabled
FROM platform_notification_delivery_preferences
WHERE user_id = ?`).all(scope.userId);
    const enabled = new Set(rows
      .filter((row) => row.discord_dm_enabled === 1)
      .map((row) => parseCategory(row.category)));
    const webPushEnabled = new Set(rows
      .filter((row) => row.web_push_enabled === 1)
      .map((row) => parseCategory(row.category)));
    return Object.freeze({
      ...DEFAULT_PLATFORM_NOTIFICATION_PREFERENCES,
      discordDmCategories: Object.freeze(PLATFORM_NOTIFICATION_CATEGORIES.filter((category) => enabled.has(category))),
      webPushCategories: Object.freeze(PLATFORM_NOTIFICATION_CATEGORIES.filter((category) => webPushEnabled.has(category))),
    });
  }

  replaceDiscordDmCategories(input: Readonly<{
    categories: readonly unknown[];
    scope: WorkspaceAccessScope;
    updatedAtUtc: string;
  }>): PlatformNotificationPreferences {
    this.assertActiveScope(input.scope);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "notificationPreferencesUpdatedAtUtc");
    const selected = new Set(input.categories.map(parseCategory));
    const save = this.database.transaction(() => {
      for (const category of PLATFORM_NOTIFICATION_CATEGORIES) {
        this.database.prepare(`INSERT INTO platform_notification_delivery_preferences (
  user_id, category, discord_dm_enabled, updated_at_utc
) VALUES (?, ?, ?, ?)
ON CONFLICT(user_id, category) DO UPDATE SET
  discord_dm_enabled = excluded.discord_dm_enabled,
  updated_at_utc = excluded.updated_at_utc`).run(
          input.scope.userId,
          category,
          selected.has(category) ? 1 : 0,
          input.updatedAtUtc,
        );
      }
    });
    save();
    return Object.freeze({
      discordDmCategories: Object.freeze(PLATFORM_NOTIFICATION_CATEGORIES.filter((category) => selected.has(category))),
      webPushCategories: this.readPreferences(input.scope).webPushCategories,
    });
  }

  replaceWebPushCategories(input: Readonly<{
    categories: readonly unknown[];
    scope: WorkspaceAccessScope;
    updatedAtUtc: string;
  }>): PlatformNotificationPreferences {
    this.assertActiveScope(input.scope);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "notificationPreferencesUpdatedAtUtc");
    const selected = new Set(input.categories.map(parseCategory));
    const save = this.database.transaction(() => {
      for (const category of PLATFORM_NOTIFICATION_CATEGORIES) {
        this.database.prepare(`INSERT INTO platform_notification_delivery_preferences (
  user_id, category, discord_dm_enabled, web_push_enabled, updated_at_utc
) VALUES (?, ?, 0, ?, ?)
ON CONFLICT(user_id, category) DO UPDATE SET
  web_push_enabled = excluded.web_push_enabled,
  updated_at_utc = excluded.updated_at_utc`).run(
          input.scope.userId,
          category,
          selected.has(category) ? 1 : 0,
          input.updatedAtUtc,
        );
      }
    });
    save();
    return Object.freeze({
      discordDmCategories: this.readPreferences(input.scope).discordDmCategories,
      webPushCategories: Object.freeze(PLATFORM_NOTIFICATION_CATEGORIES.filter((category) => selected.has(category))),
    });
  }
}
