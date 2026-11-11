// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { openStatusJournal } from "./status-journal";
import { AlpacaTradingStatusBook } from "./trading-status";

it("recovers halt, quotation-only and resumption lifecycles without inventing an expiry", () => {
  const directory=mkdtempSync(join(tmpdir(),"alpaca-status-")),path=join(directory,"statuses.jsonl");
  try {
    const book=new AlpacaTradingStatusBook(),journal=openStatusJournal(path,book);
    const events:unknown[]=[];
    for(const [sc,t] of [["H","2026-11-09T16:20:00Z"],["Q","2026-11-09T16:24:00Z"],["T","2026-11-09T16:25:00Z"],["P","2026-11-09T17:20:00Z"]]){
      const row={T:"s",S:"OMH",sc,t,z:"C",rc:"LUDP",rm:"Pause"};
      if(book.observe(row))events.push(row);
    }
    journal.appendMany(events);
    journal.close();
    const recovered=new AlpacaTradingStatusBook(),restored=openStatusJournal(path,recovered);
    try {
      expect(recovered.read("OMH")).toMatchObject({halted:true,haltedAt:"2026-11-09T17:20:00Z"});
      expect(recovered.events()).toHaveLength(2);
      expect(recovered.events()[0]).toMatchObject({halted:false,quoteResumedAt:"2026-11-09T16:24:00Z",tradeResumedAt:"2026-11-09T16:25:00Z"});
    } finally {restored.close();}
  } finally {rmSync(directory,{recursive:true,force:true});}
});

it("retains the valid prefix but rejects a damaged tail or interior without modifying evidence",()=>{
 const directory=mkdtempSync(join(tmpdir(),"alpaca-status-damage-")),path=join(directory,"statuses.jsonl");
 try{
  const valid=JSON.stringify({T:"s",S:"OMH",sc:"H",t:"2026-11-09T16:20:00Z",z:"C",rc:"LUDP",rm:"Pause"})+"\n";
  for(const body of [valid+'{"T":"s"',valid+'broken-interior\n'+valid]){
   writeFileSync(path,body,{mode:0o600});const book=new AlpacaTradingStatusBook();
   expect(()=>openStatusJournal(path,book)).toThrow();
   expect(book.read("OMH")?.halted).toBe(true);expect(readFileSync(path,"utf8")).toBe(body);
  }
 }finally{rmSync(directory,{recursive:true,force:true});}
});
