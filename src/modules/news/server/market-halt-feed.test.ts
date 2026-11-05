import { parseNasdaqTradeHalts, parseNyseTradeHalts } from "./market-halt-feed";

describe("market halt feed normalization", () => {
  it("normalizes Nasdaq trading dates", () => {
    const halts = parseNasdaqTradeHalts(`<item>
      <ndaq:HaltDate>09/09/2026</ndaq:HaltDate>
      <ndaq:HaltTime>12:09:41.166</ndaq:HaltTime>
      <ndaq:IssueSymbol>RIBB</ndaq:IssueSymbol>
      <ndaq:IssueName>Ribbon Communications Inc</ndaq:IssueName>
      <ndaq:Market>NASDAQ</ndaq:Market>
      <ndaq:ReasonCode>LUDP</ndaq:ReasonCode>
      <ndaq:ResumptionQuoteTime>12:09:41</ndaq:ResumptionQuoteTime>
      <ndaq:ResumptionTradeTime>12:14:41</ndaq:ResumptionTradeTime>
    </item>`);

    expect(halts).toHaveLength(1);
    expect(halts[0]?.haltDateEt).toBe("2026-09-09");
    expect(halts[0]?.source).toBe("nasdaq");
  });

  it("excludes halt symbols longer than four characters from both feeds", () => {
    const nasdaqHalts = parseNasdaqTradeHalts(`<item>
      <ndaq:HaltDate>09/11/2026</ndaq:HaltDate>
      <ndaq:HaltTime>10:15:00</ndaq:HaltTime>
      <ndaq:IssueSymbol>RFAIU</ndaq:IssueSymbol>
      <ndaq:IssueName>RF Acquisition Corp II Unit</ndaq:IssueName>
      <ndaq:Market>NASDAQ</ndaq:Market>
      <ndaq:ReasonCode>LUDP</ndaq:ReasonCode>
    </item>`);
    const nyseHalts = parseNyseTradeHalts(`Halt Date,Halt Time,Symbol,Name,Market,Reason,Resume Date,Resume Time
2026-09-11,10:15:00,ABCDE,Example Unit,NYSE American,LULD Pause,,`);

    expect(nasdaqHalts).toHaveLength(0);
    expect(nyseHalts).toHaveLength(0);
  });

  it("keeps four-character halt symbols eligible", () => {
    const halts = parseNasdaqTradeHalts(`<item>
      <ndaq:HaltDate>09/11/2026</ndaq:HaltDate>
      <ndaq:HaltTime>10:15:00</ndaq:HaltTime>
      <ndaq:IssueSymbol>QSER</ndaq:IssueSymbol>
      <ndaq:IssueName>Four Character Example</ndaq:IssueName>
      <ndaq:Market>NASDAQ</ndaq:Market>
      <ndaq:ReasonCode>LUDP</ndaq:ReasonCode>
    </item>`);

    expect(halts).toHaveLength(1);
    expect(halts[0]?.ticker).toBe("QSER");
  });

  it("excludes ETF and ETN issue names while retaining ordinary companies", () => {
    const nasdaqHalts = parseNasdaqTradeHalts(`<item>
      <ndaq:HaltDate>11/05/2026</ndaq:HaltDate><ndaq:HaltTime>10:53:22</ndaq:HaltTime>
      <ndaq:IssueSymbol>TPEI</ndaq:IssueSymbol><ndaq:IssueName>MicroSectors -3x Short Taiwan ETNs</ndaq:IssueName>
      <ndaq:Market>BATS</ndaq:Market><ndaq:ReasonCode>M</ndaq:ReasonCode>
    </item><item>
      <ndaq:HaltDate>11/05/2026</ndaq:HaltDate><ndaq:HaltTime>10:57:32</ndaq:HaltTime>
      <ndaq:IssueSymbol>AEHL</ndaq:IssueSymbol><ndaq:IssueName>Antelope Entprs Hld Cl A Ord</ndaq:IssueName>
      <ndaq:Market>NASDAQ</ndaq:Market><ndaq:ReasonCode>LUDP</ndaq:ReasonCode>
    </item>`);
    const nyseHalts = parseNyseTradeHalts(`Halt Date,Halt Time,Symbol,Name,Market,Reason,Resume Date,Resume Time
2026-11-05,10:52:22,BCOR,Grayscale Bitcoin Adopters ETF,NYSE Arca,LULD Pause,2026-11-05,10:57:22
2026-11-05,10:52:30,ACME,Acme Corporation,NYSE,LULD Pause,2026-11-05,10:57:30`);

    expect(nasdaqHalts.map((halt) => halt.ticker)).toEqual(["AEHL"]);
    expect(nyseHalts.map((halt) => halt.ticker)).toEqual(["ACME"]);
  });

  it("rejects stale same-day resumption times inherited from an earlier halt", () => {
    const [halt] = parseNasdaqTradeHalts(`<item>
      <ndaq:HaltDate>11/05/2026</ndaq:HaltDate><ndaq:HaltTime>11:05:57.163</ndaq:HaltTime>
      <ndaq:IssueSymbol>OMH</ndaq:IssueSymbol><ndaq:IssueName>Ohmyhome Ltd Ords A</ndaq:IssueName>
      <ndaq:Market>NASDAQ</ndaq:Market><ndaq:ReasonCode>LUDP</ndaq:ReasonCode>
      <ndaq:ResumptionDate>11/05/2026</ndaq:ResumptionDate>
      <ndaq:ResumptionQuoteTime>09:31:15</ndaq:ResumptionQuoteTime>
      <ndaq:ResumptionTradeTime>09:42:18</ndaq:ResumptionTradeTime>
    </item>`);

    expect(halt).toMatchObject({ticker:"OMH",haltTimeEt:"11:05:57.163",resumptionQuoteTimeEt:null,resumptionTradeTimeEt:null});
  });

  it("parses the current NYSE Resume Time header", () => {
    const halts = parseNyseTradeHalts(`Halt Date,Halt Time,Symbol,Name,Exchange,Reason,Resume Date,NYSE Resume Time
2026-11-04,13:22:24,TEST,Test Corp,NYSE,LULD Pause,2026-11-04,13:27:24`);

    expect(halts).toHaveLength(1);
    expect(halts[0]?.resumptionTradeTimeEt).toBe("13:27:24");
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
