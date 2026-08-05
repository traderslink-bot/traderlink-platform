import type {
  JournalAdminAuditItem,
  JournalAdminPage,
} from "@/src/modules/journal/contracts/journal-administration-contracts";
import {
  boundedToken,
  journalAdminCoverage,
  journalAdminPageSize,
  journalAdminReference,
  resolveJournalAdminInternalId,
  type JournalAdminReadContext,
} from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { platformFailure } from "../database/platform-migration-contract";

type AuditRow = Readonly<{
  audit_event_id: string;
  actor_kind: string;
  actor_user_id: string | null;
  actor_display_name: string | null;
  actor_role: string;
  action: string;
  target_kind: string;
  outcome: string;
  reason_code: string;
  details_json: string;
  created_at_utc: string;
}>;

function safeDetails(value: string): Readonly<Record<string, string | number | boolean | null>> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
    }
    return Object.freeze({
      ...(parsed as Record<string, string | number | boolean | null>),
    });
  } catch (error) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {}, error);
  }
}

export class PlatformAdminAuditService {
  constructor(private readonly context: JournalAdminReadContext) {}

  list(input: Readonly<{
    cursor?: string | null;
    pageSize?: number;
    action?: string;
    outcome?: string;
    targetKind?: string;
  }> = {}): JournalAdminPage<JournalAdminAuditItem> {
    const pageSize = journalAdminPageSize(input.pageSize);
    const clauses: string[] = [];
    const bindings: Array<string | number> = [];
    if (input.cursor) {
      const cursor = resolveJournalAdminInternalId(
        this.context,
        input.cursor,
        ["audit_event"],
      );
      clauses.push(`(event.created_at_utc < (
          SELECT created_at_utc FROM platform_admin_audit_events WHERE audit_event_id = ?)
        OR (event.created_at_utc = (
          SELECT created_at_utc FROM platform_admin_audit_events WHERE audit_event_id = ?)
          AND event.audit_event_id < ?))`);
      bindings.push(cursor.internalId, cursor.internalId, cursor.internalId);
    }
    for (const [column, field, value] of [
      ["event.action", "action", input.action],
      ["event.outcome", "outcome", input.outcome],
      ["event.target_kind", "targetKind", input.targetKind],
    ] as const) {
      const token = boundedToken(value, field);
      if (token) {
        clauses.push(`${column} = ?`);
        bindings.push(token);
      }
    }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.context.database.prepare<unknown[], AuditRow>(`SELECT
  event.audit_event_id, event.actor_kind, event.actor_user_id,
  user.display_name AS actor_display_name, event.actor_role, event.action,
  event.target_kind, event.outcome, event.reason_code, event.details_json,
  event.created_at_utc
FROM platform_admin_audit_events event
LEFT JOIN platform_users user ON user.user_id = event.actor_user_id
${where}
ORDER BY event.created_at_utc DESC, event.audit_event_id DESC LIMIT ?`)
      .all(...bindings, pageSize + 1);
    const visible = rows.slice(0, pageSize).map((row): JournalAdminAuditItem => Object.freeze({
      auditRef: journalAdminReference(this.context, "audit_event", row.audit_event_id),
      actorKind: row.actor_kind,
      actorDisplayName: row.actor_display_name,
      actorRole: row.actor_role,
      action: row.action,
      targetKind: row.target_kind,
      outcome: row.outcome,
      reasonCode: row.reason_code,
      details: safeDetails(row.details_json),
      createdAtUtc: row.created_at_utc,
    }));
    return Object.freeze({
      items: Object.freeze(visible),
      nextCursor: rows.length > pageSize ? visible.at(-1)?.auditRef ?? null : null,
      coverage: journalAdminCoverage(this.context),
    });
  }
}
