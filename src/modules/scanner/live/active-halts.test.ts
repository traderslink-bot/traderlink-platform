import {describe,expect,it} from "vitest";
import {selectActiveScannerHalts} from "./active-halts";

const halt=(id:string,ticker:string,tradeTimeEt:string|null)=>({id,ticker,market:"NASDAQ",haltTimeEt:"10:00:00",reasonCode:"LUDP",reason:"Volatility trading pause",quoteTimeEt:"10:05:00",tradeTimeEt});
describe("active scanner halts",()=>{
  it("removes a halt confirmed by the EODHD real-time trade stream",()=>{
    const rows=[halt("eodhd-resumed","AAA",null)];
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:07:00.000Z"),[],new Map(),new Set(["eodhd-resumed"]))).toEqual([]);
  });
  it("keeps the newest halt per ticker when no post-halt trade is observed",()=>{
    const rows=[halt("new","AAA",null),halt("old","AAA","10:05:00"),halt("scheduled","BBB","10:06:00")];
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:07:00.000Z"),[],new Map([["AAA","NASDAQ"],["BBB","NASDAQ"]] as const)).map(row=>row.id)).toEqual(["new"]);
  });
  it("removes a halt after price or volume movement between two post-halt Moomoo observations",()=>{
    const rows=[halt("missing-resume","AAA",null)];
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:07:00.000Z"),[{symbol:"AAA",previousObservedAt:Date.parse("2026-11-05T14:59:59.000Z"),observedAt:Date.parse("2026-11-05T15:05:04.000Z")}],new Map([["AAA","NASDAQ"]] as const))).toHaveLength(1);
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:07:00.000Z"),[{symbol:"AAA",previousObservedAt:Date.parse("2026-11-05T15:05:04.000Z"),observedAt:Date.parse("2026-11-05T15:05:09.000Z")}],new Map([["AAA","NASDAQ"]] as const))).toHaveLength(0);
  });
  it("does not let movement from an earlier lifecycle clear a later repeat halt",()=>{
    const rows=[{...halt("second","AAA",null),haltTimeEt:"11:00:00"}];
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T16:01:00.000Z"),[{symbol:"AAA",previousObservedAt:Date.parse("2026-11-05T15:05:04.000Z"),observedAt:Date.parse("2026-11-05T15:05:09.000Z")}],new Map([["AAA","NASDAQ"]] as const))).toHaveLength(1);
  });
  it("removes any halt after its official trade-resume time",()=>{
    const rows=[halt("scheduled","AAA","10:10:00")];
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:09:00.000Z"),[],new Map())).toHaveLength(1);
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:20:00.000Z"),[],new Map())).toHaveLength(0);
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:20:00.000Z"),[],new Map([["AAA","NASDAQ"]] as const))).toHaveLength(0);
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:20:00.000Z"),[{symbol:"AAA",previousObservedAt:Date.parse("2026-11-05T15:10:04.000Z"),observedAt:Date.parse("2026-11-05T15:10:09.000Z")}],new Map([["AAA","NASDAQ"]] as const))).toHaveLength(0);
  });
});
