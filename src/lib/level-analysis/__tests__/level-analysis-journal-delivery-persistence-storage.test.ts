import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import acceptedRecordFixture from "../__fixtures__/persistence-contract/delivery-record.accepted.compact.json";
import oldSnapshotFixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import deliveryFixture from "../__fixtures__/level-analysis-journal-delivery-package-v1.compact.json";
import { validateLevelAnalysisJournalPayload } from "../level-analysis-journal-delivery-adapter";
import {
  createJournalLevelAnalysisDeliveryRecordFromIngestion,
  type JournalLevelAnalysisDeliveryRecord,
} from "../level-analysis-journal-delivery-persistence-contract";
import { SqliteJournalLevelAnalysisDeliveryRepository } from "../level-analysis-journal-delivery-persistence-storage";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createRepository(): SqliteJournalLevelAnalysisDeliveryRepository {
  return new SqliteJournalLevelAnalysisDeliveryRepository(new Database(":memory:"));
}

describe("level-analysis journal delivery SQLite persistence", () => {
  it("stores and retrieves accepted delivery records plus symbol summaries", () => {
    const repository = createRepository();
    const record = clone(acceptedRecordFixture) as unknown as JournalLevelAnalysisDeliveryRecord;

    const saved = repository.saveDeliveryRecord(record);
    const latest = repository.getLatestAcceptedDelivery({ provider: "ibkr" });
    const symbol = repository.getLatestAcceptedSymbolSummary({
      symbol: "qubt",
      provider: "ibkr",
    });

    expect(saved.status).toBe("stored");
    expect(repository.getDeliveryRecord(record.id)).toEqual(record);
    expect(repository.getDeliveryRecordByRawPayloadHash(record.rawPayloadHash)).toEqual(
      record,
    );
    expect(latest?.id).toBe(record.id);
    expect(symbol).toMatchObject({
      deliveryId: record.id,
      symbol: "QUBT",
      fifteenMinuteContextOnlyStatus: "context_only",
    });
  });

  it("treats duplicate rawPayloadHash saves as idempotent", () => {
    const repository = createRepository();
    const record = clone(acceptedRecordFixture) as unknown as JournalLevelAnalysisDeliveryRecord;

    expect(repository.saveDeliveryRecord(record).status).toBe("stored");
    expect(repository.saveDeliveryRecord({ ...record, id: "lad_duplicate_id" }).status).toBe(
      "duplicate",
    );
    expect(repository.saveDeliveryRecord({ ...record, id: "lad_duplicate_id" }).record.id).toBe(
      record.id,
    );
  });

  it("persists quarantined payloads without trusted symbol summaries", () => {
    const repository = createRepository();
    const malformed = clone(deliveryFixture) as Record<string, unknown>;
    delete malformed.entries;
    const ingestionResult = validateLevelAnalysisJournalPayload(malformed);
    const record = createJournalLevelAnalysisDeliveryRecordFromIngestion({
      id: "laq_missing_entries_storage_test",
      createdAt: "2026-06-06T19:00:00.000Z",
      ingestionResult,
    });

    const saved = repository.saveDeliveryRecord(record);

    expect(saved.status).toBe("stored");
    expect(saved.record.validationStatus).toBe("quarantined");
    expect(repository.getDeliveryRecord(record.id)?.rawPayload).toEqual(malformed);
    expect(
      repository.getLatestAcceptedSymbolSummary({ symbol: "DEVS", provider: "ibkr" }),
    ).toBeNull();
  });

  it("rejects malformed persisted records before writing", () => {
    const repository = createRepository();
    const record = clone(acceptedRecordFixture) as Record<string, unknown>;
    delete record.rawPayload;

    expect(() =>
      repository.saveDeliveryRecord(record as unknown as JournalLevelAnalysisDeliveryRecord),
    ).toThrow(/Invalid journal level analysis delivery record/);
  });

  it("keeps old LevelAnalysisSnapshot v1 ingestion compatible with durable storage", () => {
    const repository = createRepository();
    const ingestionResult = validateLevelAnalysisJournalPayload(clone(oldSnapshotFixture));
    const record = createJournalLevelAnalysisDeliveryRecordFromIngestion({
      id: "lad_old_snapshot_storage_test",
      createdAt: "2026-06-06T19:05:00.000Z",
      ingestionResult,
    });

    const saved = repository.saveDeliveryRecord(record);
    const symbol = repository.getLatestAcceptedSymbolSummary({ symbol: "SNAP" });

    expect(saved.status).toBe("stored");
    expect(saved.record.sourceKind).toBe("single_snapshot_v1");
    expect(saved.record.rawPayload).toEqual(oldSnapshotFixture);
    expect(symbol).toMatchObject({
      deliveryId: record.id,
      symbol: "SNAP",
      fifteenMinuteContextOnlyStatus: "not_supplied",
    });
  });
});
