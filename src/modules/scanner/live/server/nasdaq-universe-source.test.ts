import {describe,expect,it,vi} from "vitest";
import {collectNasdaqCandleHistoryRoster,collectNasdaqUniverseUpload,NasdaqUniverseRefresher} from "./nasdaq-universe-source";
import {validateUniverseUpload} from "../universe-validation";
import { importDailyUniverse } from "../universe";
import { readCandleHistoryRoster } from "../../../market-data/candle-history/roster";

const NOW=Date.parse("2026-11-03T08:00:00Z");
const rows=Array.from({length:100},(_,index)=>({symbol:`T${index}`,marketCap:String(1_000_000+index)}));
const request=vi.fn(async(input:string|URL|Request)=>{
  const url = new URL(String(input));
  if (url.pathname.endsWith("/nasdaqlisted.txt")) return new Response([
    "Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares",
    "BLZE|Fixture issuer - Class A Common Stock|Q|N|N|100|N|N",
    "T1|Fixture issuer - Units with common stock and warrants|Q|N|N|100|N|N",
    "T2|Fixture issuer with no descriptor|Q|N|N|100|N|N",
    "T3|Fixture test issue - Common Stock|Q|Y|N|100|N|N",
    "T4|Fixture issuer - ADS, each representing 1.25 ordinary shares|Q|N|N|100|N|N",
    "T5|Fixture issuer - American Depository Share|Q|N|N|100|N|N",
    "T6|Fixture issuer - Class A Non-Voting Common Stock|Q|N|N|100|N|N",
    "T7|Fixture issuer Warrants to Purchase Common Stock|Q|N|N|100|N|N",
    "File Creation Time: 1103202603:00|||||||",
  ].join("\n"));
  if (url.pathname.endsWith("/otherlisted.txt")) return new Response([
    "ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue|NASDAQ Symbol",
    "GPUS|Fixture ETF|A|GPUS|Y|100|N|GPUS",
    "NYSEA|Fixture issuer - Preferred shares|N|NYSEA|N|100|N|NYSEA",
    "NYSEC|Fixture issuer Class A Common Stock|N|NYSEC|N|100|N|NYSEC",
    "NYSEO|Fixture issuer Class A Ordinary Shares|N|NYSEO|N|100|N|NYSEO",
    "File Creation Time: 1103202603:00|||||||",
  ].join("\n"));
  const exchange=url.searchParams.get("exchange");
  const nyseRows = ["NYSEA", "NYSEC", "NYSEO"].map(symbol => ({ symbol, marketCap: "90000000" }));
  return Response.json({data:{rows:exchange==="nasdaq"?[...rows,{symbol:"BLZE",marketCap:"458060000.00",sector:"Technology"},{symbol:"ABCDW",marketCap:"9000000"},{symbol:"TOOBIG",marketCap:"600000000"}]:exchange==="nyse"?nyseRows:[{symbol:"GPUS",marketCap:"49699568",sector:"N/A"}]}});
});

describe("Nasdaq scanner universe source",()=>{
  it("collects a validated Nasdaq, NYSE and NYSE American universe through the $500M ceiling",async()=>{
    const upload=await collectNasdaqUniverseUpload({tradingDate:"2026-11-03",request:request as typeof fetch,now:()=>NOW});
    const checked=validateUniverseUpload(upload,NOW);
    expect(checked.stocks.find(stock=>stock.symbol==="BLZE")).toMatchObject({
      exchange:"NASDAQ",marketCapAtCollection:458060000,sector:"Technology",securityType:"COMMON",
    });
    expect(checked.stocks.some(stock=>stock.symbol==="TOOBIG")).toBe(false);
    expect(checked.stocks.some(stock=>stock.symbol==="NYSEA")).toBe(true);
    expect(checked.stocks.find(stock=>stock.symbol==="GPUS")).toMatchObject({exchange:"AMEX",marketCapAtCollection:49699568,securityType:"ETF"});
    expect(checked.stocks.find(stock=>stock.symbol==="GPUS")?.sector).toBeUndefined();
    expect(checked.stocks.some(stock=>stock.symbol==="ABCDW")).toBe(false);
    expect(checked.stocks.find(stock=>stock.symbol==="NYSEA")?.securityType).toBe("PREFERRED");
    expect(checked.stocks.find(stock=>stock.symbol==="T1")?.securityType).toBe("UNIT");
    expect(checked.stocks.find(stock=>stock.symbol==="T2")?.securityType).toBeUndefined();
    expect(checked.stocks.find(stock=>stock.symbol==="T3")?.securityType).toBeUndefined();
    const recorded = new Map(checked.stocks.map(stock => [stock.symbol, stock.securityType]));
    expect(["T4", "T5", "T6", "T7", "NYSEC", "NYSEO"].map(symbol => recorded.get(symbol)))
      .toEqual(["DEPOSITARY", "DEPOSITARY", "COMMON", undefined, "COMMON", "ORDINARY"]);
    expect(request).toHaveBeenCalledTimes(5);
  });
  it("keeps roster coverage when a directory is unavailable", async () => {
    const capture = async (input: string | URL | Request) => String(input).endsWith("/nasdaqlisted.txt")
      ? new Response("Unavailable", { status: 503 }) : request(input);
    const upload = await collectNasdaqUniverseUpload({ tradingDate:"2026-11-03",request:capture as typeof fetch,now:()=>NOW });
    const { stocks } = validateUniverseUpload(upload, NOW);
    expect(stocks.find(stock => stock.symbol === "BLZE")?.securityType).toBeUndefined();
    expect(stocks.find(stock => stock.symbol === "GPUS")?.securityType).toBe("ETF");
  });
  it("expands the archive roster above $500M using the same listing provider", async () => {
    const upload = await collectNasdaqUniverseUpload({ tradingDate: "2026-11-03", request, now: () => NOW });
    const { universe } = importDailyUniverse(null, upload, NOW);
    const collect = vi.fn((ceiling: number) => collectNasdaqCandleHistoryRoster(ceiling, request));
    const standard = await readCandleHistoryRoster(500_000_000, universe, collect);
    expect(collect).not.toHaveBeenCalled();
    expect(standard.find(stock => stock.symbol === "TOOBIG")).toBeUndefined();
    const widened = await readCandleHistoryRoster(650_000_000, universe, collect);
    expect(collect).toHaveBeenCalledWith(650_000_000);
    expect(widened).toContainEqual({ symbol: "TOOBIG", marketCap: 600_000_000 });
    expect(widened).not.toContainEqual({ symbol: "ABCDW", marketCap: 9_000_000 });
    expect(universe.stocks.some(stock => stock.symbol === "TOOBIG")).toBe(false);
  });
  it("imports once per trading date",async()=>{
    const save=vi.fn(async()=>({}));
    const source=new NasdaqUniverseRefresher({store:{import:save},request:request as typeof fetch,now:()=>NOW});
    await source.refresh("2026-11-03");await source.refresh("2026-11-03");
    expect(save).toHaveBeenCalledTimes(1);
  });
});
