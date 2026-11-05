import {describe,expect,it} from "vitest";
import {selectActiveScannerHalts} from "./active-halts";

const halt=(id:string,ticker:string,tradeTimeEt:string|null)=>({id,ticker,market:"NASDAQ",haltTimeEt:"10:00:00",reasonCode:"LUDP",reason:"Volatility trading pause",quoteTimeEt:"10:05:00",tradeTimeEt});
describe("active scanner halts",()=>{
  it("keeps the newest current halt per ticker and removes it once trading resumes",()=>{
    const rows=[halt("new","AAA",null),halt("old","AAA","10:05:00"),halt("resumed","BBB","10:06:00")];
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:07:00.000Z")).map(row=>row.id)).toEqual(["new"]);
  });
  it("keeps a future scheduled resume active until its Eastern time passes",()=>{
    const rows=[halt("future","AAA","10:10:00")];
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:09:00.000Z"))).toHaveLength(1);
    expect(selectActiveScannerHalts(rows,new Date("2026-11-05T15:10:00.000Z"))).toHaveLength(0);
  });
});
