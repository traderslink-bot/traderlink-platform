import { createHash, randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import type { JournalAdminSensitiveAccessReason } from "@/src/modules/journal/contracts/journal-administration-contracts";
import type { JournalAdminScope } from "../../contracts/journal-admin-scope";
import { platformFailure } from "../database/platform-migration-contract";
import { PlatformAdminAuditRepository } from "./platform-admin-audit-repository";
import { consumeJournalAdminRateLimit } from "./platform-admin-request-security";

const REASONS = new Set<JournalAdminSensitiveAccessReason>([
  "owner_support_review",
  "importer_diagnostics",
  "security_review",
  "data_integrity_review",
]);

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function parseJournalAdminSensitiveAccessReason(
  value: unknown,
): JournalAdminSensitiveAccessReason {
  if (typeof value !== "string" ||
    !REASONS.has(value as JournalAdminSensitiveAccessReason)) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  return value as JournalAdminSensitiveAccessReason;
}

export function recordJournalAdminSensitiveAccess(input: Readonly<{
  database: Database.Database;
  scope: JournalAdminScope;
  headers: Headers;
  action: "user_detail_accessed" | "import_detail_accessed";
  targetKind: "user" | "import";
  internalId: string;
  reasonCode: JournalAdminSensitiveAccessReason;
  outcome: "success" | "denied" | "failed";
  nowUtc: string;
  environment?: NodeJS.ProcessEnv;
}>): void {
  consumeJournalAdminRateLimit({
    category: "sensitive",
    environment: input.environment,
    headers: input.headers,
    userId: input.scope.userId,
  });
  const suppliedRequestId = input.headers.get("x-request-id");
  const requestId = suppliedRequestId && suppliedRequestId.length <= 200 &&
      !/[\u0000-\u001f\u007f]/u.test(suppliedRequestId)
    ? suppliedRequestId
    : randomUUID();
  new PlatformAdminAuditRepository(input.database).append({
    actorKind: "platform_user",
    actorUserId: input.scope.userId,
    actorRole: input.scope.role,
    action: input.action,
    targetKind: input.targetKind,
    targetRefSha256: sha256(`journal-admin-target-v1\u001f${input.targetKind}\u001f${input.internalId}`),
    outcome: input.outcome,
    reasonCode: input.reasonCode,
    correlationRefSha256: sha256(`journal-admin-request-v1\u001f${requestId}`),
    previewReceiptSha256: null,
    details: Object.freeze({ access_reason: input.reasonCode }),
    createdAtUtc: input.nowUtc,
  });
}
