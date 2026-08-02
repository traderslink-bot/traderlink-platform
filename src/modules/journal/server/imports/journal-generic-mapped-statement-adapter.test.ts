import { createJournalMappingSupportPackage } from "../product/journal-mapping-support-package";
import {
  mappingContractFromSupportTable,
  previewGenericMappedStatement,
} from "./journal-generic-mapped-statement-adapter";

describe("Journal generic mapped statement adapter", () => {
  it("maps a trader-confirmed generic table without converting exact decimals", () => {
    const sourceBytes = Buffer.from([
      "Trade Time\tTicker\tAction\tFilled Qty\tFill Price\tFees\tCurrency\tFill ID",
      "2026/01/08 09:35:00\tALPHA\tBuy\t100.125\t8.7534\t0.125\tUSD\tFILL-1",
      "2026/01/08 10:15:00\tALPHA\tSell\t100.125\t9.0045\t0.125\tUSD\tFILL-2",
    ].join("\n"));
    const support = createJournalMappingSupportPackage({
      sourceBytes,
      brokerName: "Example Broker",
      failureCode: "format_not_supported",
    });
    const table = support.tables[0]!;
    const mapping = mappingContractFromSupportTable({
      brokerName: "Example Broker",
      sourceTimezone: "America/New_York",
      defaultCurrency: "USD",
      delimiter: support.detectedDelimiter,
      table,
      columns: {
        timestamp: "Trade Time",
        symbol: "Ticker",
        side: "Action",
        quantity: "Filled Qty",
        price: "Fill Price",
        fees: "Fees",
        currency: "Currency",
        executionId: "Fill ID",
      },
    });
    const preview = previewGenericMappedStatement({ sourceBytes, mapping });
    expect(preview.executions).toHaveLength(2);
    expect(preview.executions[0]).toEqual(expect.objectContaining({
      quantityDecimal: "100.125",
      priceDecimal: "8.7534",
      feesDecimal: "-0.125",
      side: "buy",
    }));
    expect(preview.rows.filter((row) => row.classification === "mapped_execution"))
      .toHaveLength(2);
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "statement_period_missing",
      isBlocking: false,
    }));
  });

  it("fails closed when a saved exact structure no longer matches", () => {
    const original = Buffer.from([
      "Time,Symbol,Side,Quantity,Price",
      '"2026-01-08, 09:35:00",ALPHA,Buy,10,4.25',
    ].join("\n"));
    const support = createJournalMappingSupportPackage({
      sourceBytes: original,
      brokerName: "Example Broker",
      failureCode: "format_not_supported",
    });
    const mapping = mappingContractFromSupportTable({
      brokerName: "Example Broker",
      sourceTimezone: "America/New_York",
      defaultCurrency: "USD",
      delimiter: support.detectedDelimiter,
      table: support.tables[0]!,
      columns: {
        timestamp: "Time",
        symbol: "Symbol",
        side: "Side",
        quantity: "Quantity",
        price: "Price",
      },
    });
    const changed = Buffer.from([
      "Time,Symbol,Direction,Quantity,Price",
      '"2026-01-08, 09:35:00",ALPHA,Buy,10,4.25',
    ].join("\n"));
    expect(() => previewGenericMappedStatement({
      sourceBytes: changed,
      mapping,
    })).toThrowError("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED");
  });

  it("contains a bad mapped row without suppressing valid rows", () => {
    const sourceBytes = Buffer.from([
      "Timestamp,Symbol,Side,Quantity,Price",
      '"2026-01-08, 09:35:00",ALPHA,Buy,10,4.25',
      '"not-a-time",BETA,Sell,5,3.75',
    ].join("\n"));
    const support = createJournalMappingSupportPackage({
      sourceBytes,
      brokerName: "Example Broker",
      failureCode: "format_not_supported",
    });
    const mapping = mappingContractFromSupportTable({
      brokerName: "Example Broker",
      sourceTimezone: "America/New_York",
      defaultCurrency: "USD",
      delimiter: support.detectedDelimiter,
      table: support.tables[0]!,
      columns: support.tables[0]!.suggestedMapping,
    });
    const preview = previewGenericMappedStatement({ sourceBytes, mapping });
    expect(preview.executions).toHaveLength(1);
    expect(preview.rows.find((row) => row.recordOrdinal === 3)?.classification)
      .toBe("needs_correction");
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "execution_time_invalid",
      recordOrdinal: 3,
      isBlocking: false,
    }));
  });
});
