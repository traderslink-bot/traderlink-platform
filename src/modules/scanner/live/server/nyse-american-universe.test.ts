// @vitest-environment node
import {expect,it} from "vitest";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {UniverseStore} from "./universe-store";
import {validateUniverseUpload} from "../universe-validation";
import {parseFinnhubExchange} from "./finnhub-exchange";
it("persists American listings without mislabelling their venue",async()=>{
 const directory=await mkdtemp(join(tmpdir(),"scanner-american-"));
 const now=Date.parse("2026-11-09T15:00:00Z");
 const upload={tradingDate:"2026-11-09",csv:"symbol,exchange,market_cap\nGPUS,AMEX,49699568",metadata:{completeness_status:"complete",source_url:"https://api.nasdaq.com/api/screener/stocks",collection_started_at_utc:"2026-11-09T14:00:00Z",collection_finished_at_utc:"2026-11-09T14:01:00Z",displayed_total:1,extracted_unique_count:1,applied_filters:{exchanges:["NASDAQ","NYSE","AMEX"],market_cap_max:500000000}}};
 try{
  const store=new UniverseStore(directory);await store.import(upload,now);
  expect((await store.read("2026-11-09"))?.stocks).toEqual([{symbol:"GPUS",exchange:"AMEX",marketCapAtCollection:49699568}]);
  expect(parseFinnhubExchange({ticker:"GPUS",exchange:"NYSE AMERICAN"},"GPUS")).toBe("AMEX");
  expect(()=>validateUniverseUpload({...upload,metadata:{...upload.metadata,applied_filters:{exchanges:["NASDAQ","NYSE"],market_cap_max:500000000}}},now)).toThrow("scanner_universe_filters_invalid");
 }finally{await rm(directory,{recursive:true,force:true});}
});
