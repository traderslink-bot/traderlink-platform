import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import type { PlatformAdminReferenceKeyConfiguration } from "@/src/modules/platform/server/administration/platform-admin-reference-authority";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { createJournalAdminReadContext, resolveJournalAdminInternalId } from "./journal-admin-read-helpers";

export type JournalAdminUserControlAction = "disable" | "enable" | "sign_out_all";

function actionDetails(action: JournalAdminUserControlAction): Readonly<{ confirmation: string }> {
  if (action === "disable") return Object.freeze({ confirmation: "DISABLE USER" });
  if (action === "enable") return Object.freeze({ confirmation: "ENABLE USER" });
  return Object.freeze({ confirmation: "SIGN OUT ALL DEVICES" });
}

export class JournalAdminUserControlService {
  constructor(private readonly input: Readonly<{
    database: Database.Database;
    scope: JournalAdminScope;
    configuration?: PlatformAdminReferenceKeyConfiguration;
    now?: Date;
  }>) {}

  execute(input: Readonly<{
    userRef: string;
    action: JournalAdminUserControlAction;
    confirmation: string;
    reasonCode: string;
    correlationRefSha256: string;
  }>): Readonly<{ status: "active" | "disabled"; revokedSessionCount: number }> {
    const context = createJournalAdminReadContext({
      database: this.input.database,
      scope: this.input.scope,
      configuration: this.input.configuration,
      now: this.input.now,
    });
    const resolved = resolveJournalAdminInternalId(context, input.userRef, ["user"]);
    const details = actionDetails(input.action);
    if (input.confirmation !== details.confirmation || !/^[a-z][a-z0-9_]{2,63}$/u.test(input.reasonCode)) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    if (resolved.internalId === this.input.scope.userId) platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    const timestamp = context.nowUtc;
    const operation = this.input.database.transaction(() => {
      const prior = this.input.database.prepare<[string, string], {
        resulting_status: "active" | "disabled";
        sessions_revoked: number;
      }>(`SELECT resulting_status, sessions_revoked
FROM platform_user_control_audit_events
WHERE actor_user_id = ? AND correlation_ref_sha256 = ?`).get(
        this.input.scope.userId,
        input.correlationRefSha256,
      );
      if (prior) {
        return Object.freeze({
          status: prior.resulting_status,
          revokedSessionCount: prior.sessions_revoked,
        });
      }
      const user = this.input.database.prepare<[string], { status: "active" | "disabled" }>("SELECT status FROM platform_users WHERE user_id = ?").get(resolved.internalId);
      if (!user) platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
      let status = user.status;
      let revokedSessionCount = 0;
      if (input.action === "disable" && status !== "disabled") {
        this.input.database.prepare("UPDATE platform_users SET status = 'disabled', updated_at_utc = ? WHERE user_id = ? AND status = 'active'").run(timestamp, resolved.internalId);
        status = "disabled";
      } else if (input.action === "enable" && status !== "active") {
        this.input.database.prepare("UPDATE platform_users SET status = 'active', updated_at_utc = ? WHERE user_id = ? AND status = 'disabled'").run(timestamp, resolved.internalId);
        status = "active";
      }
      if (input.action === "disable" || input.action === "sign_out_all") {
        revokedSessionCount = this.input.database.prepare(`UPDATE platform_auth_sessions SET revoked_at_utc = ?
WHERE user_id = ? AND revoked_at_utc IS NULL AND expires_at_utc > ?`).run(timestamp, resolved.internalId, timestamp).changes;
      }
      this.input.database.prepare(`INSERT INTO platform_user_control_audit_events (
        user_control_audit_event_id, actor_user_id, target_user_id, action, reason_code,
        sessions_revoked, resulting_status, correlation_ref_sha256, created_at_utc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        randomUUID(), this.input.scope.userId, resolved.internalId, input.action,
        input.reasonCode, revokedSessionCount, status, input.correlationRefSha256, timestamp,
      );
      return Object.freeze({ status, revokedSessionCount });
    });
    try { return operation.immediate(); } catch (error) {
      if (isTraderLinkPlatformError(error)) throw error;
      platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT", {}, error);
    }
  }
}
