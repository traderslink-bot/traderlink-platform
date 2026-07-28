import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  canonicalOwnerKeyForServerImport,
  createLocalExecutionSourceDocumentStore,
  createServerRawBrokerCsvImportService,
  parseServerInstrumentResolutionMap,
} from "../ingestion";

const roots: string[] = [];

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop() as string, { recursive: true, force: true });
  }
});

const owner = {
  identity: { ownerId: "local owner / 01" },
  authorizationMode: "local_owner_adapter" as const,
};

const mapping = {
  symbol: "Symbol",
  executedAt: "ExecutedAt",
  side: "Side",
  quantity: "Quantity",
  price: "Price",
  currency: "Currency",
} as const;

describe("server raw broker CSV import", () => {
  it("uses a server-held account and instrument map, preserving unknown symbols as unresolved", () => {
    const root = mkdtempSync(join(tmpdir(), "ti-v3-m1-server-import-"));
    roots.push(root);
    const store = createLocalExecutionSourceDocumentStore({
      directory: root,
      syntheticTestMode: true,
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const resolutions = parseServerInstrumentResolutionMap(JSON.stringify({
      TEST: {
        stableInstrumentKey: "instrument_nasdaq_test",
        securityType: "common_stock",
      },
    }));
    expect(resolutions.ok).toBe(true);
    if (!resolutions.ok) return;

    const service = createServerRawBrokerCsvImportService({
      owner,
      canonicalAccountKey: "account_primary",
      instrumentResolutions: resolutions.value,
      sourceStore: store.value,
    });
    expect(service.ok).toBe(true);
    if (!service.ok) return;
    expect(service.value.canonicalOwnerKey).toBe(canonicalOwnerKeyForServerImport(owner));

    const persisted = service.value.persist({
      csvUtf8: new TextEncoder().encode([
        "Symbol,ExecutedAt,Side,Quantity,Price,Currency",
        "TEST,2026-07-27T13:45:00.000000000Z,buy,2,1.25,USD",
        "MISSING,2026-07-27T14:45:00.000000000Z,sell,2,2.25,USD",
      ].join("\n")),
      sourceIdentity: "source_ibkr_statement",
      sourceSystem: "ibkr_csv",
      brokerCode: "ibkr",
      columnMapping: mapping,
      timestampPrecision: "nanosecond",
      sourceTimezoneEvidence: "broker_csv_explicit_utc",
      chargeCoverageState: "unknown",
    });
    expect(persisted.ok).toBe(true);
    if (!persisted.ok) return;
    expect(persisted.value.canonicalAccountKey).toBe("account_primary");
    expect(persisted.value.acceptedExecutions.map((item) => item.content.canonicalOwnerKey))
      .toEqual([service.value.canonicalOwnerKey, service.value.canonicalOwnerKey]);
    expect(persisted.value.acceptedExecutions.map((item) => item.content.stableInstrumentKey))
      .toEqual(["instrument_nasdaq_test", null]);
    expect(persisted.value.acceptedExecutions[1]?.content.instrumentResolutionState)
      .toBe("unresolved");

    const restartedStore = createLocalExecutionSourceDocumentStore({
      directory: root,
      syntheticTestMode: true,
    });
    expect(restartedStore.ok).toBe(true);
    if (!restartedStore.ok) return;
    const restartedService = createServerRawBrokerCsvImportService({
      owner,
      canonicalAccountKey: "account_primary",
      instrumentResolutions: resolutions.value,
      sourceStore: restartedStore.value,
    });
    expect(restartedService.ok).toBe(true);
    if (!restartedService.ok) return;
    const restored = restartedService.value.read(persisted.value.persistenceDigest);
    expect(restored).toMatchObject({ ok: true });
    if (!restored.ok) return;
    expect(restored.value.persistenceDigest).toBe(persisted.value.persistenceDigest);
    expect(restored.value.acceptedExecutions.map((item) => item.canonicalContentDigest))
      .toEqual(persisted.value.acceptedExecutions.map((item) => item.canonicalContentDigest));

    const beforeClose = restartedService.value.projectLifecycles([
      persisted.value.persistenceDigest,
    ]);
    expect(beforeClose.ok).toBe(true);
    if (!beforeClose.ok) return;
    expect(beforeClose.value.openLifecycleCount).toBe("2");
    expect(beforeClose.value.lifecycles.map((item) => [item.rawBrokerSymbol, item.state]))
      .toEqual([[
        "TEST",
        "open",
      ], [
        "MISSING",
        "open",
      ]]);
    expect(beforeClose.value.lifecycles.find((item) => item.rawBrokerSymbol === "MISSING")?.limitationCodes)
      .toEqual([
        "ti_v3_lifecycle_open_position",
        "ti_v3_lifecycle_instrument_unresolved",
      ]);
    const initialReadiness = service.value.resolveAnalyticsReadiness([
      persisted.value.persistenceDigest,
    ]);
    const restartedReadiness = restartedService.value.resolveAnalyticsReadiness([
      persisted.value.persistenceDigest,
    ]);
    expect(initialReadiness.ok).toBe(true);
    expect(restartedReadiness.ok).toBe(true);
    if (!initialReadiness.ok || !restartedReadiness.ok) return;
    expect(restartedReadiness.value.readinessDigest).toBe(initialReadiness.value.readinessDigest);
    expect(restartedReadiness.value).toMatchObject({
      datasetState: "unavailable",
      datasetReceiptDigest: null,
      partitionReceiptDigests: [],
      queryIdentityDigest: null,
    });
    expect(restartedReadiness.value.reasonCodes).toEqual(expect.arrayContaining([
      "ti_v3_analytics_opening_inventory_authority_missing",
      "ti_v3_analytics_correction_authority_missing",
      "ti_v3_analytics_statement_period_authority_missing",
      "ti_v3_analytics_open_position_present",
    ]));

    const euroSource = service.value.persist({
      csvUtf8: new TextEncoder().encode([
        "Symbol,ExecutedAt,Side,Quantity,Price,Currency",
        "TEST,2026-07-28T13:45:00.000000000Z,buy,1,1.50,EUR",
      ].join("\n")),
      sourceIdentity: "source_ibkr_statement_eur",
      sourceSystem: "ibkr_csv",
      brokerCode: "ibkr",
      columnMapping: mapping,
      timestampPrecision: "nanosecond",
      sourceTimezoneEvidence: "broker_csv_explicit_utc",
      chargeCoverageState: "unknown",
    });
    expect(euroSource.ok).toBe(true);
    if (!euroSource.ok) return;
    const selected = restartedService.value.readMany([
      euroSource.value.persistenceDigest,
      persisted.value.persistenceDigest,
    ]);
    expect(selected.ok).toBe(true);
    if (!selected.ok) return;
    expect(selected.value.map((record) => record.persistenceDigest))
      .toEqual([...selected.value.map((record) => record.persistenceDigest)].sort());
    expect(new Set(selected.value.flatMap((record) =>
      record.acceptedExecutions.map((entry) => entry.content.currency),
    ))).toEqual(new Set(["EUR", "USD"]));
    expect(restartedService.value.readMany([
      persisted.value.persistenceDigest,
      persisted.value.persistenceDigest,
    ])).toMatchObject({
      ok: false,
      error: { code: "ti_v3_server_import_source_selection_duplicate" },
    });

    const closingSource = restartedService.value.persist({
      csvUtf8: new TextEncoder().encode([
        "Symbol,ExecutedAt,Side,Quantity,Price,Currency",
        "TEST,2026-07-29T13:45:00.000000000Z,sell,2,2.25,USD",
        "MISSING,2026-07-29T14:45:00.000000000Z,buy,2,1.25,USD",
      ].join("\n")),
      sourceIdentity: "source_ibkr_statement_close",
      sourceSystem: "ibkr_csv",
      brokerCode: "ibkr",
      columnMapping: mapping,
      timestampPrecision: "nanosecond",
      sourceTimezoneEvidence: "broker_csv_explicit_utc",
      chargeCoverageState: "unknown",
    });
    expect(closingSource.ok).toBe(true);
    if (!closingSource.ok) return;
    const afterClose = restartedService.value.projectLifecycles([
      persisted.value.persistenceDigest,
      closingSource.value.persistenceDigest,
    ]);
    expect(afterClose.ok).toBe(true);
    if (!afterClose.ok) return;
    expect(afterClose.value.openLifecycleCount).toBe("0");
    expect(afterClose.value.closedLifecycleCount).toBe("2");
    expect(afterClose.value.lifecycles.map((item) => [item.rawBrokerSymbol, item.state]))
      .toEqual([[
        "TEST",
        "closed",
      ], [
        "MISSING",
        "closed",
      ]]);
    expect(afterClose.value.lifecycles.find((item) => item.rawBrokerSymbol === "MISSING")?.limitationCodes)
      .toEqual(["ti_v3_lifecycle_instrument_unresolved"]);
    const readinessAfterClose = restartedService.value.resolveAnalyticsReadiness([
      persisted.value.persistenceDigest,
      closingSource.value.persistenceDigest,
    ]);
    expect(readinessAfterClose.ok).toBe(true);
    if (!readinessAfterClose.ok) return;
    expect(readinessAfterClose.value.datasetState).toBe("unavailable");
    expect(readinessAfterClose.value.reasonCodes).not.toContain(
      "ti_v3_analytics_open_position_present",
    );

    expect(store.value.read({
      canonicalOwnerKey: "owner_foreign",
      canonicalAccountKey: "account_primary",
      persistenceDigest: persisted.value.persistenceDigest,
    })).toMatchObject({ ok: false });
  });

  it("rejects undeclared or malformed server instrument authority", () => {
    expect(parseServerInstrumentResolutionMap('{"TEST":{"stableInstrumentKey":"instrument_nasdaq_test"}}'))
      .toMatchObject({ ok: false, error: { code: "ti_v3_server_import_instrument_map_invalid" } });
    expect(parseServerInstrumentResolutionMap('{"test":{"stableInstrumentKey":"instrument_nasdaq_test","securityType":"common_stock"}}'))
      .toMatchObject({ ok: false, error: { code: "ti_v3_server_import_instrument_map_invalid" } });
  });
});
