import { parseNasdaqTradeHalts, parseNyseTradeHalts } from "./market-halt-feed";

describe("market halt feed normalization", () => {
  it("normalizes Nasdaq trading dates", () => {
    const halts = parseNasdaqTradeHalts(`<item>
      <ndaq:HaltDate>09/09/2026</ndaq:HaltDate>
      <ndaq:HaltTime>12:09:41.166</ndaq:HaltTime>
      <ndaq:IssueSymbol>RIBBU</ndaq:IssueSymbol>
      <ndaq:IssueName>Ribbon Acquisition Corp Unit</ndaq:IssueName>
      <ndaq:Market>NASDAQ</ndaq:Market>
      <ndaq:ReasonCode>LUDP</ndaq:ReasonCode>
      <ndaq:ResumptionQuoteTime>12:09:41</ndaq:ResumptionQuoteTime>
      <ndaq:ResumptionTradeTime>12:14:41</ndaq:ResumptionTradeTime>
    </item>`);

    expect(halts).toHaveLength(1);
    expect(halts[0]?.haltDateEt).toBe("2026-09-09");
    expect(halts[0]?.source).toBe("nasdaq");
  });

  it("keeps NYSE-family rows and excludes Nasdaq rows from the consolidated NYSE file", () => {
    const halts = parseNyseTradeHalts(`Halt Date,Halt Time,Symbol,Name,Market,Reason,Resume Date,Resume Time
2026-09-09,12:09:41,RIBBU,Ribbon Acquisition Corp Unit,Nasdaq,LULD Pause,2026-09-09,12:14:41
09/09/2026,12:10:00,EXAM,Example Corp,NYSE American,LULD Pause,09/09/2026,12:15:00`);

    expect(halts).toHaveLength(1);
    expect(halts[0]).toMatchObject({
      haltDateEt: "2026-09-09",
      market: "NYSE American",
      source: "nyse",
      ticker: "EXAM",
    });
  });
});
