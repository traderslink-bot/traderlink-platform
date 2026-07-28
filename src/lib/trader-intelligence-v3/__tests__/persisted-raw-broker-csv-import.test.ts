import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createLocalExecutionSourceDocumentStore,
  ingestAndBuildPersistedRawBrokerCsvImport,
  replayPersistedRawBrokerCsvImport,
} from "../ingestion";

const roots: string[] = [];

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop() as string, { recursive: true, force: true });
  }
});

const mapping = {
  symbol: "Symbol",
  executedAt: "ExecutedAt",
  side: "Side",
  quantity: "Quantity",
  price: "Price",
  currency: "Currency",
  commission: "Commission",
  fees: "Fees",
  netCashAmount: "Net",
  orderId: "OrderId",
  executionId: "ExecutionId",
} as const;

function request(csv: string) {
  return {
    csvUtf8: new TextEncoder().encode(csv),
    canonicalOwnerKey: "owner_local_test",
    canonicalAccountKey: "account_local_test",
    sourceIdentity: "source_ibkr_local_test",
    sourceSystem: "ibkr_csv",
    brokerCode: "ibkr",
    columnMapping: mapping,
    timestampPrecision: "nanosecond" as const,
    sourceTimezoneEvidence: "broker_csv_explicit_utc",
    chargeCoverageState: "complete" as const,
    resolveInstrument: (symbol: string) => ({
      state: "resolved" as const,
      stableInstrumentKey: "instrument_nasdaq_" + symbol.toLowerCase(),
      securityType: "common_stock",
      basisContinuityState: "resolved" as const,
    }),
  };
}

describe("persisted raw broker CSV import", () => {
  it("rejects a temporary raw-source store unless the caller declares synthetic test mode", () => {
    const root = mkdtempSync(join(tmpdir(), "ti-v3-m1-store-safety-"));
    roots.push(root);

    expect(createLocalExecutionSourceDocumentStore({
      directory: root,
      repositoryRoot: "C:\\repository-not-the-test-root",
    })).toMatchObject({
      ok: false,
      error: { code: "ti_v3_execution_source_store_path_invalid" },
    });
  });

  it("persists and rehydrates one v3 source-document/execution authority across a fresh store instance", () => {
    const root = mkdtempSync(join(tmpdir(), "ti-v3-m1-persist-"));
    roots.push(root);
    const input = request([
      "Symbol,ExecutedAt,Side,Quantity,Price,Currency,Commission,Fees,Net,OrderId,ExecutionId",
      "TEST,2026-07-26T13:45:00.123456789Z,buy,2.5,1.25,USD,0.125,0.005,-3.255,order-1,exec-1",
      "TEST,2026-07-26T14:45:00.123456789Z,sell,2.5,2.25,USD,0.125,0.005,5.245,order-2,exec-2",
      "BAD,2026-07-26 09:45:00,buy,1,1.25,USD,0,0,-1.25,order-3,exec-3",
    ].join("\n"));

    const record = ingestAndBuildPersistedRawBrokerCsvImport(input);
    expect(record.ok).toBe(true);
    if (!record.ok) return;
    expect(record.value.acceptedExecutionCount).toBe("2");
    expect(record.value.rejectedRowCount).toBe("1");
    expect(record.value.issues).toMatchObject([
      { code: "ti_v3_raw_csv_row_invalid", rowNumber: "4" },
    ]);

    const firstStore = createLocalExecutionSourceDocumentStore({
      directory: root,
      syntheticTestMode: true,
    });
    expect(firstStore.ok).toBe(true);
    if (!firstStore.ok) return;
    expect(firstStore.value.persist(record.value)).toMatchObject({ ok: true });

    const restartedStore = createLocalExecutionSourceDocumentStore({
      directory: root,
      syntheticTestMode: true,
    });
    expect(restartedStore.ok).toBe(true);
    if (!restartedStore.ok) return;
    const restored = restartedStore.value.read({
      canonicalOwnerKey: input.canonicalOwnerKey,
      canonicalAccountKey: input.canonicalAccountKey,
      persistenceDigest: record.value.persistenceDigest,
    });
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.value.persistenceDigest).toBe(record.value.persistenceDigest);
    expect(restored.value.sourceDocumentDigest).toBe(record.value.sourceDocumentDigest);
    expect(restored.value.acceptedExecutions.map((entry) => entry.canonicalContentDigest))
      .toEqual(record.value.acceptedExecutions.map((entry) => entry.canonicalContentDigest));

    const replay = replayPersistedRawBrokerCsvImport(
      restored.value,
      input.resolveInstrument,
    );
    expect(replay.ok).toBe(true);
    expect(restartedStore.value.read({
      canonicalOwnerKey: "owner_foreign",
      canonicalAccountKey: input.canonicalAccountKey,
      persistenceDigest: record.value.persistenceDigest,
    })).toMatchObject({
      ok: false,
      error: { code: "ti_v3_execution_source_store_not_found" },
    });
  });
});
