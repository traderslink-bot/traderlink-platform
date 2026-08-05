import {
  createJournalMappingSupportPackage,
  createJournalMappingSupportPackageV2,
  restoreJournalInternalMappingContractFromV2,
  sanitizeJournalInternalMappingContractForV2,
} from "./journal-mapping-support-package";

describe("Journal mapping support package", () => {
  it("exports section and column structure without raw statement values", () => {
    const source = [
      "Account Information,Header,Field Name,Field Value",
      "Account Information,Data,Account,PRIVATE-ACCOUNT",
      "Trades,Header,Symbol,Date/Time,Quantity,T. Price,Comm/Fee",
      'Trades,Data,PRIVATE-SYMBOL,"2026-01-08, 09:35:00",50,7.125,-0.25',
    ].join("\r\n");
    const result = createJournalMappingSupportPackage({
      sourceBytes: Buffer.from(source),
      brokerName: "Example Broker",
      failureCode: "TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED",
    });
    const serialized = JSON.stringify(result);
    expect(result.tables.map((table) => table.tableLabel)).toEqual([
      "Account Information",
      "Trades",
    ]);
    expect(result.tables[1]?.headerLabels).toContain("T. Price");
    expect(serialized).not.toContain("PRIVATE-ACCOUNT");
    expect(serialized).not.toContain("PRIVATE-SYMBOL");
    expect(serialized).not.toContain("7.125");
    expect(result.privacy.rawValuesIncluded).toBe(false);
  });

  it("profiles a generic tabular statement and preserves the supplied broker name", () => {
    const source = [
      "Trade Time\tTicker\tAction\tFilled Qty\tFill Price",
      "2026/01/08 09:35:00\tSECRET\tBuy\t100\t8.75",
    ].join("\n");
    const result = createJournalMappingSupportPackage({
      sourceBytes: Buffer.from(source),
      brokerName: "Moomoo",
      failureCode: "format_not_supported",
    });
    expect(result.brokerName).toBe("Moomoo");
    expect(result.detectedDelimiter).toBe("tab");
    expect(result.tables[0]?.headerLabels).toEqual([
      "Trade Time", "Ticker", "Action", "Filled Qty", "Fill Price",
    ]);
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(JSON.stringify(result)).not.toContain("8.75");
  });

  it("returns a V2 browser package without source correlation or row-dependent counts", () => {
    const first = createJournalMappingSupportPackageV2(
      createJournalMappingSupportPackage({
        sourceBytes: Buffer.from([
          "Trade Time,Ticker,Action,Filled Qty,Fill Price",
          "2026-01-08 09:35:00,SECRET,Buy,100,8.75",
        ].join("\n")),
        brokerName: "Example Broker",
        failureCode: "none",
      }),
    );
    const second = createJournalMappingSupportPackageV2(
      createJournalMappingSupportPackage({
        sourceBytes: Buffer.from([
          "Trade Time,Ticker,Action,Filled Qty,Fill Price",
          "2026-02-12 10:15:00,OTHER,Sell,2,99.10",
          "2026-02-12 10:16:00,OTHER,Buy,2,98.95",
        ].join("\n")),
        brokerName: "Example Broker",
        failureCode: "none",
      }),
    );
    const serialized = JSON.stringify(first);
    expect(first.contractVersion).toBe("journal_statement_mapping_support_v2");
    expect(first.statementLayoutSignatureSha256)
      .toBe(second.statementLayoutSignatureSha256);
    expect(first.recordFieldCounts).toEqual([5]);
    expect(serialized).not.toMatch(/sourceFileSha256|sourceFileSizeBytes|recordCount|rowCount|SECRET|8\.75/u);
  });

  it("replaces private-looking headings and withholds a global layout signature", () => {
    const inspection = createJournalMappingSupportPackage({
        sourceBytes: Buffer.from([
          "Trade Time,ACCOUNT-99887766,=PRIVATE,Ticker,Action,Filled Qty,Fill Price",
          "2026-01-08 09:35:00,private,private,SECRET,Buy,100,8.75",
        ].join("\n")),
        brokerName: "https://private.example/account/99887766",
        failureCode: "TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED",
      });
    const result = createJournalMappingSupportPackageV2(inspection);
    const serialized = JSON.stringify(result);
    expect(result.brokerLabel).toBe("Broker not specified");
    expect(result.privacy.privacyReviewRequired).toBe(true);
    expect(result.statementLayoutSignatureSha256).toBeNull();
    expect(result.tables[0]?.headerLabels).toContain("Column 2");
    expect(result.tables[0]?.headerLabels).toContain("Column 3");
    expect(serialized).not.toContain("99887766");
    expect(serialized).not.toContain("PRIVATE");

    const table = result.tables[0]!;
    const internalMapping = {
      structuralSignatureSha256: inspection.tables[0]!.structuralSignatureSha256,
      tableKind: table.tableKind,
      tableLabel: inspection.tables[0]!.tableLabel,
      headerRowIndex: table.headerRowIndex,
      orderedHeaders: inspection.tables[0]!.headerLabels,
      columns: { executionId: "ACCOUNT-99887766", symbol: "Ticker" },
    };
    const sanitized = sanitizeJournalInternalMappingContractForV2(
      internalMapping,
      inspection,
      result,
    ) as Record<string, unknown>;
    expect(JSON.stringify(sanitized)).not.toContain("99887766");
    expect(sanitized.columns).toEqual({
      executionId: "Column 2",
      symbol: "Ticker",
    });
    const restored = restoreJournalInternalMappingContractFromV2(
      sanitized,
      inspection,
      result,
    ) as Record<string, unknown>;
    expect(restored.structuralSignatureSha256)
      .toBe(inspection.tables[0]?.structuralSignatureSha256);
    expect(restored.columns).toEqual({
      executionId: "ACCOUNT-99887766",
      symbol: "Ticker",
    });
  });
});
