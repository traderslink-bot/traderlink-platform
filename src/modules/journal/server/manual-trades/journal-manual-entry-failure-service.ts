import { createHash } from "node:crypto";

import type { JournalManualTrackerKind } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type JournalManualEntryFailureCategory =
  | "entry_changed"
  | "duplicate_conflict"
  | "entry_dates_need_review"
  | "save_conflict"
  | "save_unavailable";

function categoryFor(error: unknown): JournalManualEntryFailureCategory {
  const code = isTraderLinkPlatformError(error) ? error.code : "";
  if (code === "TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID") return "entry_changed";
  if (code === "TRADERLINK_MANUAL_TRADE_OFFLINE_DUPLICATE_CONFLICT") return "duplicate_conflict";
  if (code === "TRADERLINK_MANUAL_TRADE_SINGLE_DAY_REQUIRED") return "entry_dates_need_review";
  if (code.includes("CONFLICT")) return "save_conflict";
  return "save_unavailable";
}

/** Records no request body, trade value, raw error, or browser identifier. */
export function recordJournalManualEntryFailure(input: Readonly<{
  error: unknown;
  idempotencyKey: string;
  scope: WorkspaceAccessScope;
  tracker: JournalManualTrackerKind;
  now?: Date;
}>): void {
  const accountId = input.scope.activeAccountId;
  if (!accountId) return;
  const category = categoryFor(input.error);
  const timestamp = createCanonicalUtcTimestamp(input.now ?? new Date());
  const fingerprint = createHash("sha256").update([
    "journal-manual-entry-failure-v1",
    input.scope.userId,
    input.scope.workspaceId,
    accountId,
    input.tracker,
    input.idempotencyKey,
    category,
  ].join("\u001f"), "utf8").digest("hex");
  withPlatformDatabase({ mode: "runtime" }, (database) => {
    database.prepare(`INSERT OR IGNORE INTO journal_manual_entry_failures (
  manual_entry_failure_id, user_id, workspace_id, account_id, tracker,
  failure_fingerprint_sha256, safe_reason_category, occurred_at_utc, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        createCanonicalUuidV4(), input.scope.userId, input.scope.workspaceId,
        accountId, input.tracker, fingerprint, category, timestamp, timestamp,
      );
  });
}
