import "server-only";
import type Database from "better-sqlite3";
import type { WorkspaceAccessScope, WorkspaceRole } from "../../contracts/workspace-access-scope";
import { PlatformNotificationRepository } from "../notifications/platform-notification-repository";
import { PlatformRemoteNotificationDeliveryRepository } from "../notifications/platform-remote-notification-delivery-repository";
import { PlatformWebPushRepository } from "../notifications/platform-web-push-repository";
import { loadPlatformWebPushConfiguration, loadPlatformWebPushEncryptionConfiguration } from "../notifications/platform-web-push-configuration";

import { loadPlatformNotificationEmailEncryptionConfiguration } from "../notifications/platform-notification-email-configuration";

export function readMoomooAlertReadiness(db: Database.Database, scope: WorkspaceAccessScope,
  environment: NodeJS.ProcessEnv = process.env) {
  const preferences = new PlatformNotificationRepository(db).readPreferences(scope);
  const emailConfirmed = Boolean(db.prepare(`SELECT 1 FROM platform_notification_email_addresses
    WHERE user_id=? AND state='confirmed'`).get(scope.userId));
  const pushRegistered = Boolean(db.prepare(`SELECT 1 FROM platform_web_push_subscriptions
    WHERE user_id=? AND state='active'`).get(scope.userId));
  let emailConfigured = false, pushConfigured = false;
  try { loadPlatformNotificationEmailEncryptionConfiguration(environment);
    emailConfigured = (environment.RESEND_API_KEY?.trim().length ?? 0) >= 20;
  } catch { /* An encryption key or provider configuration is missing. */ }
  try { loadPlatformWebPushConfiguration(environment); pushConfigured = true; } catch { /* Not configured. */ }
  return { emailEnabled: preferences.emailCategories.includes("broker_connection"), emailConfirmed, emailConfigured,
    pushEnabled: preferences.webPushCategories.includes("broker_connection"), pushRegistered, pushConfigured,
    providerDelivery: "unverified" as const, phoneDisplay: "unknown" as const };
}

const OWNER_SUBJECTS_ENV = "TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT";
type Owner = { user_id: string; workspace_id: string; role: WorkspaceRole };

/** Explicit server configuration only. Labels, emails, admin grants and browser
 * input never establish permission to receive another user's broker alert.
 * Ambiguity fails closed to the connection owner's ordinary notification. */
export function resolveMoomooAlertRecipients(db: Database.Database, source: WorkspaceAccessScope,
  connectionId: string, environment: NodeJS.ProcessEnv = process.env): Readonly<{
    scopes: readonly WorkspaceAccessScope[]; ownerFanout: boolean;
  }> {
  const self = { ...source, activeAccountId: null, allowedAccountIds: [] };
  const fallback = { scopes: [self], ownerFanout: false };
  const subjects = environment[OWNER_SUBJECTS_ENV]?.split(",").map(value => value.trim()) ?? [];
  if (subjects.length !== 2 || new Set(subjects).size !== 2 || subjects.some(value => !/^[0-9]{1,32}$/u.test(value))) return fallback;
  const owners: Owner[] = [];
  for (const subject of subjects) {
    const rows = db.prepare(`SELECT u.user_id,m.workspace_id,m.role
      FROM platform_auth_identities i JOIN platform_users u ON u.user_id=i.user_id
      JOIN platform_workspace_memberships m ON m.user_id=u.user_id
      JOIN platform_workspaces w ON w.workspace_id=m.workspace_id
      WHERE i.auth_provider='discord' AND i.auth_subject=? AND i.status='active'
      AND u.status='active' AND m.status='active' AND m.role='owner' AND w.status='active'`).all(subject) as Owner[];
    if (rows.length !== 1) return fallback;
    owners.push(rows[0]!);
  }
  if (owners[0]!.user_id === owners[1]!.user_id) return fallback;
  const connections = db.prepare(`SELECT connection_id,user_id,workspace_id,authorized_scopes
    FROM platform_broker_connections WHERE provider='moomoo' AND connection_state<>'revoked'
      AND user_id IN (?,?)`).all(...owners.map(owner => owner.user_id)) as {
        connection_id: string; user_id: string; workspace_id: string; authorized_scopes: string;
      }[];
  const eligible = connections.filter(row => {
    try { const scopes: unknown = JSON.parse(row.authorized_scopes); return Array.isArray(scopes) && scopes.includes("quote:read"); }
    catch { return false; }
  });
  if (eligible.length !== 1 || eligible[0]!.connection_id !== connectionId ||
    eligible[0]!.user_id !== source.userId || eligible[0]!.workspace_id !== source.workspaceId ||
    !owners.some(owner => owner.user_id === source.userId && owner.workspace_id === source.workspaceId)) return fallback;
  return { ownerFanout: true, scopes: owners.map(owner => ({ userId: owner.user_id,
    workspaceId: owner.workspace_id, workspaceRole: owner.role, allowedAccountIds: [], activeAccountId: null })) };
}

/** The attempt UUID is persisted in the same transaction as the transition.
 * Replays repair missing channel queues, whose own unique keys prevent resends.
 * Queueing is NOT proof of provider delivery or a phone receiving a push. */
export function reconcileMoomooConnectionAlert(db: Database.Database, input: {
  scope: WorkspaceAccessScope; connectionId: string; episodeId: string; occurredAtUtc: string;
}, environment: NodeJS.ProcessEnv = process.env): { ownerFanout: boolean; recipients: number; channelQueueUnavailable: boolean } {
  const recipients = resolveMoomooAlertRecipients(db, input.scope, input.connectionId, environment);
  let channelQueueUnavailable = false;
  for (const scope of recipients.scopes) {
    // Reuse an alert already emitted by the previous implementation for this
    // exact episode; upgrading must not notify the source user twice.
    const legacyKey = `broker_connection_reauthorization_${input.connectionId}`;
    const legacy = scope.userId === input.scope.userId && db.prepare(`SELECT 1 FROM platform_notifications
      WHERE recipient_user_id=? AND workspace_id=? AND source_event_key=? AND occurred_at_utc=?
      AND NOT EXISTS (SELECT 1 FROM platform_broker_connection_attempts previous
        JOIN platform_broker_connection_attempts episode ON episode.connection_attempt_id=?
        WHERE previous.connection_id=? AND previous.outcome='failed'
          AND previous.safe_reason_category='refresh_required' AND previous.rowid<episode.rowid)`)
      .get(scope.userId, scope.workspaceId, legacyKey, input.occurredAtUtc, input.episodeId, input.connectionId);
    const notification = new PlatformNotificationRepository(db).create({
      category: "broker_connection", kind: "broker_connection_reauthorization_required",
      scope, journalAccountId: null, occurredAtUtc: input.occurredAtUtc,
      sourceEventKey: legacy ? legacyKey : `broker_connection_reauthorization_${input.episodeId}`,
      destinationPath: scope.userId === input.scope.userId ? "/account/trading" : "/notifications",
      title: "Reconnect Moomoo",
      summary: recipients.ownerFanout
        ? "This Guy's Moomoo connection needs to be reconnected. Sign in to This Guy's account and open Account → Trading to reconnect it."
        : "Your Moomoo connection needs to be reconnected. Open Account → Trading to reconnect it.",
      webPushDelivery: false, remoteDelivery: false,
    });
    try {
      new PlatformWebPushRepository(db, loadPlatformWebPushEncryptionConfiguration(environment)).enqueueNotification({
        category: "broker_connection", notificationRef: notification.notificationRef,
        occurredAtUtc: input.occurredAtUtc, userId: scope.userId,
      });
    } catch { channelQueueUnavailable = true; }
    try {
      new PlatformRemoteNotificationDeliveryRepository(db).enqueueNotification({
        category: "broker_connection", notificationRef: notification.notificationRef,
        occurredAtUtc: input.occurredAtUtc, userId: scope.userId,
      });
    } catch { channelQueueUnavailable = true; }
  }
  return { ownerFanout: recipients.ownerFanout, recipients: recipients.scopes.length, channelQueueUnavailable };
}
