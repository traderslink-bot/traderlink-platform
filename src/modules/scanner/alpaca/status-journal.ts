import { closeSync, existsSync, fsyncSync, openSync, readFileSync, statSync, writeSync } from "node:fs";
import { AlpacaTradingStatusBook } from "./trading-status";

/** Append status events before exposing them; never stores credentials or trades. */
export function openStatusJournal(path: string, book: AlpacaTradingStatusBook) {
  if(existsSync(path)) {
    const stat=statSync(path);
    if(!stat.isFile()||(stat.mode&0o077)!==0)throw Error("invalid_status_journal_permissions");
    for(const line of readFileSync(path,"utf8").split("\n").filter(Boolean))book.observe(JSON.parse(line));
  }
  const descriptor=openSync(path,"a",0o600);
  const appendMany=(values:readonly unknown[])=>{
    if(!values.length)return;
    const bytes=Buffer.from(values.map(value=>JSON.stringify(value)).join("\n")+"\n");
    let written=0;
    while(written<bytes.length){const count=writeSync(descriptor,bytes,written,bytes.length-written);if(count<=0)throw Error("status_journal_write_failed");written+=count;}
    fsyncSync(descriptor);
  };
  return {
    append(value:unknown){appendMany([value]);},appendMany,
    close(){closeSync(descriptor);},
  };
}
