import { describe, expect, it } from "vitest";

import {
  ingestRawBrokerExecutionCsv,
} from "../ingestion";

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
    resolveInstrument: (symbol: string) => ({
      state: "resolved" as const,
      stableInstrumentKey: `instrument_nasdaq_${symbol.toLowerCase()}`,
      securityType: "common_stock",
      basisContinuityState: "resolved" as const,
    }),
  };
}

describe("raw broker CSV ingestion", () => {
  it("preserves raw source provenance and exact decimal economics without the legacy number parser", () => {
    const result = ingestRawBrokerExecutionCsv(request([
      "Symbol,ExecutedAt,Side,Quantity,Price,Currency,Commission,Fees,Net,OrderId,ExecutionId",
      "TEST,2026-07-26T13:45:00.123456789Z,buy,2.5000,0.123456789123,USD,0.125,0.005,-0.438641972807,order-1,exec-1",
      "TEST,2026-07-26T14:45:00.123456789Z,sell,2.5000,1.123456789123,USD,0.125,0.005,2.061358027193,order-2,exec-2",
    ].join("\n")));

    expect(result.issues).toEqual([]);
    expect(result.acceptedExecutions).toHaveLength(2);
    const first = result.acceptedExecutions[0].content;
    expect(result.sourceDocumentDigest).toMatch(/^ti_v3:canonical_source_document:v1:sha256:/);
    expect(first.sourceDocumentDigest).toBe(result.sourceDocumentDigest);
    expect(first.originalSourceRowLocator).toEqual({ kind: "row_number", value: "2", rowOrderPreserved: true });
    expect(first.quantity).toBe("2.5");
    expect(first.price).toBe("0.123456789123");
    expect(first.charges).toEqual([
      { kind: "commission", amount: "0.125", currency: "USD" },
      { kind: "fee", amount: "0.005", currency: "USD" },
    ]);
    expect(first.executionIdOrderingScope).toBe("source_document");
  });

  it("rejects a local timestamp instead of inferring a timezone for broker-confirmed authority", () => {
    const result = ingestRawBrokerExecutionCsv(request([
      "Symbol,ExecutedAt,Side,Quantity,Price,Currency,Commission,Fees,Net,OrderId,ExecutionId",
      "TEST,2026-07-26 09:45:00,buy,1,1.25,USD,0,0,-1.25,order-1,exec-1",
    ].join("\n")));

    expect(result.acceptedExecutions).toEqual([]);
    expect(result.rejectedRowCount).toBe("1");
    expect(result.issues).toMatchObject([
      { code: "ti_v3_raw_csv_row_invalid", rowNumber: "2" },
    ]);
  });
});
