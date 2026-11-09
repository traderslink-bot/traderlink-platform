import { constants } from "node:fs";
import { mkdir,open,rename,unlink } from "node:fs/promises";
import { dirname,isAbsolute,resolve } from "node:path";
import { randomUUID } from "node:crypto";

export type ManualScannerTicker=Readonly<{symbol:string;exchange:"NASDAQ"|"NYSE"|"AMEX";addedAtUtc:string}>;
const SYMBOL=/^[A-Z][A-Z0-9.-]{0,15}$/u,MAX=100;

export class ManualTickerStore{
  constructor(private readonly file:string){if(!isAbsolute(file)||file!==resolve(file))throw Error("scanner_manual_tickers_path_invalid");}
  async list():Promise<readonly ManualScannerTicker[]>{
    let handle;try{handle=await open(this.file,constants.O_RDONLY|constants.O_NOFOLLOW);}catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return [];throw error;}
    try{const info=await handle.stat();if(!info.isFile()||info.size>32_768)throw Error("scanner_manual_tickers_storage_invalid");const value=JSON.parse(await handle.readFile("utf8")) as unknown;
      if(!Array.isArray(value)||value.length>MAX||value.some(row=>!row||typeof row!=="object"||!SYMBOL.test(String((row as ManualScannerTicker).symbol))||!["NASDAQ","NYSE","AMEX"].includes(String((row as ManualScannerTicker).exchange))||!Number.isFinite(Date.parse(String((row as ManualScannerTicker).addedAtUtc)))))throw Error("scanner_manual_tickers_storage_invalid");
      return Object.freeze((value as ManualScannerTicker[]).map(row=>Object.freeze({...row})).sort((a,b)=>a.symbol.localeCompare(b.symbol)));
    }finally{await handle.close();}
  }
  async add(symbol:string,exchange:"NASDAQ"|"NYSE"|"AMEX",now=Date.now()):Promise<readonly ManualScannerTicker[]>{const normalized=symbol.trim().toUpperCase();if(!SYMBOL.test(normalized))throw Error("scanner_manual_ticker_invalid");const current=await this.list();if(current.some(row=>row.symbol===normalized))return current;if(current.length>=MAX)throw Error("scanner_manual_ticker_limit");return this.write([...current,{symbol:normalized,exchange,addedAtUtc:new Date(now).toISOString()}]);}
  async remove(symbol:string):Promise<readonly ManualScannerTicker[]>{const normalized=symbol.trim().toUpperCase();if(!SYMBOL.test(normalized))throw Error("scanner_manual_ticker_invalid");return this.write((await this.list()).filter(row=>row.symbol!==normalized));}
  private async write(rows:readonly ManualScannerTicker[]):Promise<readonly ManualScannerTicker[]>{await mkdir(dirname(this.file),{recursive:true,mode:0o700});const temporary=`${this.file}.${randomUUID()}.tmp`;try{const handle=await open(temporary,"wx",0o600);try{await handle.writeFile(`${JSON.stringify(rows)}\n`);await handle.sync();}finally{await handle.close();}await rename(temporary,this.file);}finally{await unlink(temporary).catch(()=>{});}return this.list();}
}
