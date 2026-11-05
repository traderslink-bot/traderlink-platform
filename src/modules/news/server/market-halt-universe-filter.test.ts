import type { DailyUniverse } from "../../scanner/live/contracts";
import type { MarketHalt } from "./market-halt-feed";
import { filterMarketHaltsToUniverse } from "./market-halt-universe-filter";

const halt=(ticker:string,date="2026-11-05"):MarketHalt=>({haltDateEt:date,haltTimeEt:"11:05:00",issueName:ticker,market:"NASDAQ",reasonCode:"LUDP",reasonDescription:"Volatility trading pause",resumptionQuoteTimeEt:null,resumptionTradeTimeEt:null,source:"nasdaq",ticker});
const universe:DailyUniverse={version:1,tradingDate:"2026-11-05",acceptedAtUtc:"2026-11-05T08:00:00.000Z",lastCollectionAtUtc:"2026-11-05T08:00:00.000Z",latestUploadCount:3,sourceHashes:[],stocks:[
  {symbol:"NANO",exchange:"NASDAQ",marketCapAtCollection:20_000_000},
  {symbol:"LIMIT",exchange:"NYSE",marketCapAtCollection:200_000_000},
  {symbol:"LARGE",exchange:"NASDAQ",marketCapAtCollection:200_000_001},
]};

it("keeps only current-universe halts at or below $200M",()=>{
  const result=filterMarketHaltsToUniverse([halt("NANO"),halt("LIMIT"),halt("LARGE"),halt("BATS"),halt("NANO","2026-11-04")],new Map([[universe.tradingDate,universe]]));
  expect(result.map(item=>item.ticker)).toEqual(["NANO","LIMIT"]);
});
