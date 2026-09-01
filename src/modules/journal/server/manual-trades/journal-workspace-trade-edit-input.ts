import type { JournalWorkspaceTradeEditCommit, JournalWorkspaceTradeEditDraft } from "../../contracts/journal-workspace-trade-edit-contracts";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { parseJournalManualTradeEntry, requireJsonRecord, requireJsonText } from "./journal-manual-trade-input";

const OPAQUE_REF = /^[0-9a-f]{64}$/u;

export function parseJournalWorkspaceTradeEditDraft(value: unknown): JournalWorkspaceTradeEditDraft {
  const input = requireJsonRecord(value, "workspaceTradeEditDraft");
  const snapshotRef = requireJsonText(input.snapshotRef, "snapshotRef");
  if (!OPAQUE_REF.test(snapshotRef) || !Array.isArray(input.rows) || input.rows.length < 1 || input.rows.length > 200) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "workspaceTradeEditDraft" });
  }
  const rows = input.rows.map((value) => {
    const row = requireJsonRecord(value, "workspaceTradeEditRow");
    if (row.kind === "existing") {
      const executionRef = requireJsonText(row.executionRef, "executionRef");
      if (!OPAQUE_REF.test(executionRef) || typeof row.removed !== "boolean") {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "workspaceTradeEditExistingRow" });
      }
      if (row.removed) {
        if (row.entry !== undefined && row.entry !== null) {
          platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "workspaceTradeEditRemovedRow" });
        }
        return Object.freeze({ kind: "existing" as const, executionRef, removed: true, entry: null });
      }
      return Object.freeze({
        kind: "existing" as const,
        executionRef,
        removed: false,
        entry: parseJournalManualTradeEntry(row.entry),
      });
    }
    if (row.kind === "new") {
      return Object.freeze({ kind: "new" as const, entry: parseJournalManualTradeEntry(row.entry) });
    }
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "workspaceTradeEditRow" });
  });
  if (new Set(rows.filter((row) => row.kind === "existing").map((row) => row.executionRef)).size !== rows.filter((row) => row.kind === "existing").length) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "executionRef" });
  }
  if (new Set(rows.map((row) => row.entry?.clientRowRef).filter(Boolean)).size !== rows.filter((row) => row.entry !== null).length) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "clientRowRef" });
  }
  const tradeStyle = input.tradeStyle === undefined || input.tradeStyle === null
    ? null
    : input.tradeStyle;
  if (tradeStyle !== null && tradeStyle !== "day_trade" && tradeStyle !== "swing" && tradeStyle !== "other") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tradeStyle" });
  }
  return Object.freeze({ snapshotRef, rows: Object.freeze(rows), tradeStyle });
}

export function parseJournalWorkspaceTradeEditCommit(value: unknown): JournalWorkspaceTradeEditCommit {
  const input = requireJsonRecord(value, "workspaceTradeEditCommit");
  const previewRef = requireJsonText(input.previewRef, "previewRef");
  const idempotencyKey = requireJsonText(input.idempotencyKey, "idempotencyKey");
  if (previewRef.length < 80 || previewRef.length > 500 || idempotencyKey.length < 16 || idempotencyKey.length > 100) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "workspaceTradeEditCommit" });
  }
  return Object.freeze({ previewRef, idempotencyKey });
}
