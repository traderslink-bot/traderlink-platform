import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

export class PlatformOperationalEventRepository {
  constructor(private readonly database: Database.Database) {}

  append(input: Readonly<{
    operationKind: "backup" | "restore" | "integrity" | "startup" | "deployment" | "background_job";
    operationRefSha256: string;
    state: "started" | "completed" | "failed" | "unavailable";
    outcomeCode: string;
    applicationVersion: string | null;
    safeCounts: Readonly<Record<string, number>>;
    evidenceSha256: string | null;
    startedAtUtc: string;
    completedAtUtc: string | null;
    createdAtUtc: string;
  }>): string {
    assertCanonicalUtcTimestamp(input.startedAtUtc, "startedAtUtc");
    assertCanonicalUtcTimestamp(input.createdAtUtc, "createdAtUtc");
    if (input.completedAtUtc !== null) {
      assertCanonicalUtcTimestamp(input.completedAtUtc, "completedAtUtc");
    }
    const counts = Object.entries(input.safeCounts);
    if (
      counts.length > 32 ||
      counts.some(([key, value]) =>
        !/^[a-z][a-z0-9_]{0,63}$/u.test(key) ||
        !Number.isSafeInteger(value) || value < 0)
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "safeCounts",
      });
    }
    const eventId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO platform_operational_events (
  operational_event_id, operation_kind, operation_ref_sha256, state,
  outcome_code, application_version, safe_counts_json, evidence_sha256,
  started_at_utc, completed_at_utc, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        eventId,
        input.operationKind,
        input.operationRefSha256,
        input.state,
        input.outcomeCode,
        input.applicationVersion,
        JSON.stringify(Object.fromEntries(counts.sort(([left], [right]) =>
          left.localeCompare(right)))),
        input.evidenceSha256,
        input.startedAtUtc,
        input.completedAtUtc,
        input.createdAtUtc,
      );
    return eventId;
  }
}
