import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

export type PlatformAdminAuditAction =
  | "operator_grant_previewed"
  | "operator_granted"
  | "operator_recovered"
  | "operator_revoked"
  | "admin_access_allowed"
  | "admin_access_denied"
  | "user_detail_accessed"
  | "import_detail_accessed"
  | "statement_format_transitioned"
  | "statement_format_merged"
  | "developer_package_created"
  | "consented_source_downloaded"
  | "support_consent_granted"
  | "support_consent_revoked"
  | "operational_receipt_recorded";

export type PlatformAdminAuditTargetKind =
  | "authority"
  | "user"
  | "import"
  | "statement_format"
  | "support_source"
  | "system"
  | "none";

export type PlatformAdminSafeDetails = Readonly<Record<
  string,
  string | number | boolean | null
>>;

const TOKEN_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/u;

function safeDetailsJson(details: PlatformAdminSafeDetails): string {
  const entries = Object.entries(details);
  if (
    entries.length > 20 ||
    entries.some(([key, value]) =>
      !TOKEN_PATTERN.test(key) ||
      (typeof value === "string" && !TOKEN_PATTERN.test(value)) ||
      (typeof value === "number" && !Number.isSafeInteger(value)))
  ) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_AUDIT_FAILED");
  }
  return JSON.stringify(Object.fromEntries(entries.sort(([left], [right]) =>
    left.localeCompare(right))));
}

export class PlatformAdminAuditRepository {
  constructor(private readonly database: Database.Database) {}

  append(input: Readonly<{
    auditEventId?: string;
    actorKind: "bootstrap_console" | "platform_user" | "system";
    actorUserId: string | null;
    actorRole:
      | "bootstrap_console"
      | "journal_owner_admin"
      | "development_journal_owner_admin"
      | "authenticated_user"
      | "system";
    action: PlatformAdminAuditAction;
    targetKind: PlatformAdminAuditTargetKind;
    targetRefSha256: string | null;
    outcome: "success" | "denied" | "failed";
    reasonCode: string;
    correlationRefSha256: string;
    previewReceiptSha256: string | null;
    details: PlatformAdminSafeDetails;
    createdAtUtc: string;
  }>): string {
    const auditEventId = input.auditEventId ?? createCanonicalUuidV4();
    assertCanonicalUuidV4(auditEventId, "auditEventId");
    if (input.actorUserId !== null) {
      assertCanonicalUuidV4(input.actorUserId, "actorUserId");
    }
    assertCanonicalUtcTimestamp(input.createdAtUtc, "createdAtUtc");
    try {
      this.database.prepare(`INSERT INTO platform_admin_audit_events (
  audit_event_id, actor_kind, actor_user_id, actor_role, action, target_kind,
  target_ref_sha256, outcome, reason_code, correlation_ref_sha256,
  preview_receipt_sha256, details_json, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(
          auditEventId,
          input.actorKind,
          input.actorUserId,
          input.actorRole,
          input.action,
          input.targetKind,
          input.targetRefSha256,
          input.outcome,
          input.reasonCode,
          input.correlationRefSha256,
          input.previewReceiptSha256,
          safeDetailsJson(input.details),
          input.createdAtUtc,
        );
    } catch (error) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_AUDIT_FAILED", {}, error);
    }
    return auditEventId;
  }
}
