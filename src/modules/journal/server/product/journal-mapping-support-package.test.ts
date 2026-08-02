import { createJournalMappingSupportPackage } from "./journal-mapping-support-package";

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
});
