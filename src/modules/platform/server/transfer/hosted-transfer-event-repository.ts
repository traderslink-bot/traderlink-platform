import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
} from "../database/platform-migration-contract";
import {
  assertHostedTransferDigest,
  type HostedTransferModule,
  type HostedTransferModuleCounts,
} from "./hosted-transfer-contract";

export class HostedTransferEventRepository {
  constructor(private readonly database: Database.Database) {}

  insert(input: Readonly<{
    transferEventId: string;
    transferRunId: string;
    module: HostedTransferModule;
    eventKind: "executed" | "reconciled";
    previewSha256: string;
    sourceSnapshotSha256: string;
    reconciliationSha256: string | null;
    counts: HostedTransferModuleCounts;
    createdAtUtc: string;
  }>): void {
    assertCanonicalUuidV4(input.transferEventId, "transferEventId");
    assertCanonicalUuidV4(input.transferRunId, "transferRunId");
    assertCanonicalUtcTimestamp(input.createdAtUtc, "createdAtUtc");
    assertHostedTransferDigest(input.previewSha256, "previewSha256");
    assertHostedTransferDigest(input.sourceSnapshotSha256, "sourceSnapshotSha256");
    if (input.reconciliationSha256) {
      assertHostedTransferDigest(input.reconciliationSha256, "reconciliationSha256");
    }
    this.database.prepare(`INSERT INTO platform_hosted_transfer_events (
  transfer_event_id, transfer_run_id, module_namespace, event_kind,
  preview_sha256, source_snapshot_sha256, reconciliation_sha256,
  source_row_count, accepted_row_count, unchanged_row_count,
  pending_row_count, conflict_row_count, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        input.transferEventId,
        input.transferRunId,
        input.module,
        input.eventKind,
        input.previewSha256,
        input.sourceSnapshotSha256,
        input.reconciliationSha256,
        input.counts.source,
        input.counts.accepted,
        input.counts.unchanged,
        input.counts.pending,
        input.counts.conflicts,
        input.createdAtUtc,
      );
  }
}
