import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, statSync } from "node:fs";
import { mkdir, open, readdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { gunzip as gunzipCallback, gzip as gzipCallback } from "node:zlib";
import Database from "better-sqlite3";
import type { ScannerAuditCycle, ScannerAuditDailyReview, ScannerAuditHealth, ScannerAuditRejectionPage, ScannerAuditTimelinePage, ScannerAuditTimelinePoint } from "../contracts";

const gzip=promisify(gzipCallback), gunzip=promisify(gunzipCallback);
const SYMBOL=/^[A-Z][A-Z0-9.-]{0,14}$/u, DATE=/^\d{4}-\d{2}-\d{2}$/u;

function database(root:string): Database.Database {
  const db=new Database(join(root,"audit-control.sqlite"));
  db.pragma("journal_mode = WAL"); db.pragma("synchronous = FULL");
  db.exec(`CREATE TABLE IF NOT EXISTS scanner_audit_schema_migrations(
    version INTEGER PRIMARY KEY,applied_at_utc TEXT NOT NULL);
  INSERT OR IGNORE INTO scanner_audit_schema_migrations VALUES(1,datetime('now'));
  INSERT OR IGNORE INTO scanner_audit_schema_migrations VALUES(2,datetime('now'));
  CREATE TABLE IF NOT EXISTS scanner_audit_cycles(
    cycle_id TEXT PRIMARY KEY,runtime_instance_id TEXT NOT NULL,trading_date TEXT NOT NULL,session TEXT NOT NULL,scheduled_at INTEGER NOT NULL,
    completed_at INTEGER NOT NULL,status TEXT NOT NULL,configuration_hash TEXT NOT NULL,universe_count INTEGER NOT NULL,
    universe_hash TEXT NOT NULL,observation_count INTEGER NOT NULL,missing_count INTEGER NOT NULL,issue_count INTEGER NOT NULL,
    evidence_path TEXT NOT NULL,evidence_offset INTEGER NOT NULL,evidence_length INTEGER NOT NULL,evidence_sha256 TEXT NOT NULL,
    write_duration_ms INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS scanner_audit_cycles_date_time ON scanner_audit_cycles(trading_date,completed_at);
  CREATE TABLE IF NOT EXISTS scanner_audit_versions(
    configuration_hash TEXT PRIMARY KEY,configuration_json TEXT NOT NULL,first_seen_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS scanner_audit_integrity_events(
    event_id TEXT PRIMARY KEY,at_utc TEXT NOT NULL,code TEXT NOT NULL,detail TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS scanner_audit_candidate_events(
    event_id TEXT PRIMARY KEY,cycle_id TEXT NOT NULL,trading_date TEXT NOT NULL,session TEXT NOT NULL,symbol TEXT NOT NULL,
    at_utc TEXT NOT NULL,event_code TEXT NOT NULL,detail_json TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS scanner_audit_candidate_events_symbol_time ON scanner_audit_candidate_events(trading_date,symbol,at_utc);
  CREATE TABLE IF NOT EXISTS scanner_audit_symbol_state(
    trading_date TEXT NOT NULL,session TEXT NOT NULL,symbol TEXT NOT NULL,gainer_rank INTEGER,momentum_rank INTEGER,
    best_momentum_score REAL,last_cycle_id TEXT NOT NULL,PRIMARY KEY(trading_date,session,symbol));
  CREATE TABLE IF NOT EXISTS scanner_audit_seen_symbols(
    trading_date TEXT NOT NULL,session TEXT NOT NULL,symbol TEXT NOT NULL,first_cycle_id TEXT NOT NULL,
    PRIMARY KEY(trading_date,session,symbol));
  CREATE TABLE IF NOT EXISTS scanner_audit_cycle_summaries(
    cycle_id TEXT PRIMARY KEY,trading_date TEXT NOT NULL,session TEXT NOT NULL,gainer_qualified INTEGER NOT NULL,
    momentum_qualified INTEGER NOT NULL,gainer_displayed INTEGER NOT NULL,momentum_displayed INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS scanner_audit_cycle_summaries_date_session ON scanner_audit_cycle_summaries(trading_date,session);
  CREATE TABLE IF NOT EXISTS scanner_audit_cycle_reason_counts(
    cycle_id TEXT NOT NULL,trading_date TEXT NOT NULL,session TEXT NOT NULL,scanner TEXT NOT NULL,reason_code TEXT NOT NULL,
    reason_count INTEGER NOT NULL,PRIMARY KEY(cycle_id,scanner,reason_code));
  CREATE INDEX IF NOT EXISTS scanner_audit_reason_counts_date ON scanner_audit_cycle_reason_counts(trading_date,scanner,reason_code);
  CREATE TABLE IF NOT EXISTS scanner_audit_state(
    state_key TEXT PRIMARY KEY,state_value TEXT NOT NULL);`);
  return db;
}

export class ScannerAuditStore {
  private db:Database.Database;
  constructor(private readonly root:string) { mkdirSync(root,{recursive:true,mode:0o700});this.db=database(root);this.reconcileKnownSegments(); }
  static async create(root:string):Promise<ScannerAuditStore>{await mkdir(root,{recursive:true,mode:0o700});return new ScannerAuditStore(root);}
  recordingEnabled():boolean {
    const row=this.db.prepare("SELECT state_value FROM scanner_audit_state WHERE state_key='recording_enabled'").get() as {state_value:string}|undefined;
    return row?.state_value==="1";
  }
  setRecordingEnabled(enabled:boolean):void {
    this.db.prepare("INSERT INTO scanner_audit_state VALUES('recording_enabled',?) ON CONFLICT(state_key) DO UPDATE SET state_value=excluded.state_value").run(enabled?"1":"0");
  }
  async deleteHistory():Promise<void> {
    this.db.transaction(()=>{
      this.db.exec(`
        DELETE FROM scanner_audit_cycles;
        DELETE FROM scanner_audit_versions;
        DELETE FROM scanner_audit_integrity_events;
        DELETE FROM scanner_audit_candidate_events;
        DELETE FROM scanner_audit_symbol_state;
        DELETE FROM scanner_audit_seen_symbols;
        DELETE FROM scanner_audit_cycle_summaries;
        DELETE FROM scanner_audit_cycle_reason_counts;
        DELETE FROM scanner_audit_state WHERE state_key<>'recording_enabled';
      `);
    })();
    this.db.pragma("wal_checkpoint(TRUNCATE)");
    for(const entry of await readdir(this.root,{withFileTypes:true})){
      if(entry.isDirectory()&&DATE.test(entry.name))await rm(join(this.root,entry.name),{recursive:true,force:true});
    }
  }
  recordGap(code:string,detail:string,tradingDate:string):void{
    const transaction=this.db.transaction(()=>{
      this.db.prepare(`INSERT INTO scanner_audit_integrity_events VALUES(?,?,?,?)`).run(randomUUID(),new Date().toISOString(),code,detail.slice(0,500));
      this.db.prepare(`INSERT INTO scanner_audit_state VALUES(?,'1') ON CONFLICT(state_key) DO UPDATE SET
        state_value=CAST(CAST(state_value AS INTEGER)+1 AS TEXT)`).run(`coverage_gap_count:${tradingDate}`);
    });
    try{transaction();}catch{/* Health retains the in-process error when storage itself is unavailable. */}
  }
  async record(cycle:ScannerAuditCycle):Promise<number>{
    const existing=this.db.prepare(`SELECT 1 FROM scanner_audit_cycles WHERE cycle_id=?`).get(cycle.cycleId);
    if(existing)return 0;
    const started=Date.now(), hour=new Date(cycle.completedAt).toISOString().slice(11,13);
    const relative=join(cycle.tradingDate,cycle.session,`${hour}.jsonl.gz`), path=join(this.root,relative);
    await mkdir(dirname(path),{recursive:true,mode:0o700});
    const encoded=Buffer.from(`${JSON.stringify(cycle)}\n`), compressed=await gzip(encoded,{level:6});
    let offset=0; try{offset=(await stat(path)).size;}catch{/* new segment */}
    const handle=await open(path,"a",0o600);
    try{await handle.write(compressed);await handle.sync();}finally{await handle.close();}
    const digest=createHash("sha256").update(compressed).digest("hex");
    const transaction=this.db.transaction(()=>{
      this.db.prepare(`INSERT OR IGNORE INTO scanner_audit_versions VALUES(?,?,?)`).run(
        cycle.configurationHash,JSON.stringify(cycle.configuration),cycle.completedAt);
      this.db.prepare(`INSERT INTO scanner_audit_cycles VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        cycle.cycleId,cycle.runtimeInstanceId,cycle.tradingDate,cycle.session,cycle.scheduledAt,cycle.completedAt,cycle.status,
        cycle.configurationHash,cycle.universeCount,cycle.universeHash,cycle.decisions.length,cycle.missingSymbols.length,cycle.issues.length,
        relative,offset,compressed.length,digest,0);
      const readState=this.db.prepare(`SELECT gainer_rank,momentum_rank,best_momentum_score FROM scanner_audit_symbol_state WHERE trading_date=? AND session=? AND symbol=?`);
      const writeState=this.db.prepare(`INSERT INTO scanner_audit_symbol_state VALUES(?,?,?,?,?,?,?) ON CONFLICT(trading_date,session,symbol) DO UPDATE SET
        gainer_rank=excluded.gainer_rank,momentum_rank=excluded.momentum_rank,best_momentum_score=excluded.best_momentum_score,last_cycle_id=excluded.last_cycle_id`);
      const event=this.db.prepare(`INSERT INTO scanner_audit_candidate_events VALUES(?,?,?,?,?,?,?,?)`);
      const seen=this.db.prepare(`INSERT OR IGNORE INTO scanner_audit_seen_symbols VALUES(?,?,?,?)`);
      for(const decision of cycle.decisions){
        const previous=readState.get(cycle.tradingDate,cycle.session,decision.symbol) as {gainer_rank:number|null;momentum_rank:number|null;best_momentum_score:number|null}|undefined;
        const codes:string[]=[];
        if(seen.run(cycle.tradingDate,cycle.session,decision.symbol,cycle.cycleId).changes)codes.push("first_observed");
        if(previous){
          if(previous.gainer_rank===null&&decision.gainerRank!==null)codes.push("gainer_entered");
          if(previous.gainer_rank!==null&&decision.gainerRank===null)codes.push("gainer_left");
          if(previous.momentum_rank===null&&decision.momentumRank!==null)codes.push("momentum_entered");
          if(previous.momentum_rank!==null&&decision.momentumRank===null)codes.push("momentum_left");
          if(decision.momentumRank!==null&&previous.momentum_rank!==null&&Math.abs(decision.momentumRank-previous.momentum_rank)>=5)codes.push("momentum_rank_changed");
        }
        const score=decision.momentumScore?.total??null,best=Math.max(previous?.best_momentum_score??-Infinity,score??-Infinity);
        if(decision.momentumRank!==null&&score!==null&&score>(previous?.best_momentum_score??-Infinity))codes.push("momentum_score_high");
        for(const code of codes)event.run(randomUUID(),cycle.cycleId,cycle.tradingDate,cycle.session,decision.symbol,
          new Date(cycle.completedAt).toISOString(),code,JSON.stringify({gainerRank:decision.gainerRank,momentumRank:decision.momentumRank,
            score,gainerFailures:decision.gainerFailures,momentumFailures:decision.momentumFailures}));
        writeState.run(cycle.tradingDate,cycle.session,decision.symbol,decision.gainerRank,decision.momentumRank,
          Number.isFinite(best)?best:null,cycle.cycleId);
      }
      this.db.prepare(`INSERT INTO scanner_audit_cycle_summaries VALUES(?,?,?,?,?,?,?)`).run(cycle.cycleId,cycle.tradingDate,cycle.session,
        cycle.decisions.filter(value=>value.gainerFailures.length===0).length,cycle.decisions.filter(value=>value.momentumFailures.length===0).length,
        cycle.decisions.filter(value=>value.gainerDisplayed).length,cycle.decisions.filter(value=>value.momentumDisplayed).length);
      const reasonCounts=new Map<string,number>();
      for(const decision of cycle.decisions){for(const reason of decision.gainerFailures)reasonCounts.set(`gainers\u0000${reason}`,(reasonCounts.get(`gainers\u0000${reason}`)??0)+1);
        for(const reason of decision.momentumFailures)reasonCounts.set(`momentum\u0000${reason}`,(reasonCounts.get(`momentum\u0000${reason}`)??0)+1);}
      const insertReason=this.db.prepare(`INSERT INTO scanner_audit_cycle_reason_counts VALUES(?,?,?,?,?,?)`);
      for(const [key,count] of reasonCounts){const [scanner,reason]=key.split("\u0000");insertReason.run(cycle.cycleId,cycle.tradingDate,cycle.session,scanner,reason,count);}
    });
    try{transaction();}catch(error){
      this.db.prepare(`INSERT INTO scanner_audit_integrity_events VALUES(?,?,?,?)`).run(randomUUID(),new Date().toISOString(),
        "control_commit_failed",error instanceof Error?error.message:"unknown"); throw error;
    }
    const duration=Date.now()-started;
    this.db.prepare(`UPDATE scanner_audit_cycles SET write_duration_ms=? WHERE cycle_id=?`).run(duration,cycle.cycleId);
    return duration;
  }
  health(runtime:Readonly<{queueDepth:number;droppedCycles:number;lastError:string|null;expectedActive?:boolean;now?:number}>):ScannerAuditHealth{
    const latest=this.db.prepare(`SELECT * FROM scanner_audit_cycles ORDER BY completed_at DESC LIMIT 1`).get() as Record<string,unknown>|undefined;
    const latestStoredGap=this.db.prepare(`SELECT state_key FROM scanner_audit_state
      WHERE state_key LIKE 'coverage_gap_count:%' AND CAST(state_value AS INTEGER)>0 ORDER BY state_key DESC LIMIT 1`).get() as {state_key:string}|undefined;
    const today=latest?String(latest.trading_date):latestStoredGap?.state_key.slice("coverage_gap_count:".length)??new Date().toISOString().slice(0,10);
    const storedGaps=Number((this.db.prepare(`SELECT state_value FROM scanner_audit_state WHERE state_key=?`).get(`coverage_gap_count:${today}`) as {state_value?:string}|undefined)?.state_value??0);
    const totals=this.db.prepare(`SELECT COUNT(*) cycles,COALESCE(SUM(observation_count),0) observations,
      COALESCE(SUM(evidence_length),0) bytes FROM scanner_audit_cycles WHERE trading_date=?`).get(today) as Record<string,number>;
    const lastAt=latest?Number(latest.completed_at):null;
    const droppedCycles=Math.max(storedGaps,runtime.droppedCycles);
    const stale=runtime.expectedActive===true&&(lastAt===null||(runtime.now??Date.now())-lastAt>20_000);
    const state:ScannerAuditHealth["state"]=stale?"missing":runtime.lastError||droppedCycles?"degraded":latest?.status==="partial"?"partial":lastAt===null?"missing":"complete";
    const observations=Number(totals.observations),bytes=Number(totals.bytes),bytesPerObservation=observations?bytes/observations:null;
    const dbBytes=["audit-control.sqlite","audit-control.sqlite-wal","audit-control.sqlite-shm"].reduce((total,name)=>{
      try{return total+statSync(join(this.root,name)).size;}catch{return total;}},0);
    return {state,lastCycleAtUtc:lastAt===null?null:new Date(lastAt).toISOString(),lastCycleId:latest?String(latest.cycle_id):null,
      lastStatus:latest?String(latest.status):null,tradingDate:latest?String(latest.trading_date):null,
      session:latest?String(latest.session) as ScannerAuditHealth["session"]:null,cyclesToday:Number(totals.cycles),
      observationsToday:observations,evidenceBytesToday:bytes,controlDatabaseBytes:dbBytes,bytesPerObservation,
      projectedTwentyDayBytes:bytesPerObservation===null?null:Math.round(bytesPerObservation*14_400_000*20),queueDepth:runtime.queueDepth,
      droppedCycles,lastWriteDurationMs:latest?Number(latest.write_duration_ms):null,lastError:stale?"audit_cycle_stale":runtime.lastError};
  }
  async timeline(tradingDate:string,symbol:string,options:Readonly<{beforeUtc?:string;limit?:number}>={}):Promise<ScannerAuditTimelinePage>{
    if(!DATE.test(tradingDate)||!SYMBOL.test(symbol))throw Error("scanner_audit_query_invalid");
    const before=options.beforeUtc===undefined?null:Date.parse(options.beforeUtc),limit=Math.min(500,Math.max(1,options.limit??250));
    if(before!==null&&!Number.isFinite(before))throw Error("scanner_audit_query_invalid");
    const members=(this.db.prepare(`SELECT cycle_id,completed_at,evidence_path,evidence_offset,evidence_length,evidence_sha256
      FROM scanner_audit_cycles WHERE trading_date=? AND (? IS NULL OR completed_at<?) ORDER BY completed_at DESC LIMIT ?`).all(
        tradingDate,before,before,limit+1) as {cycle_id:string;completed_at:number;evidence_path:string;evidence_offset:number;evidence_length:number;evidence_sha256:string}[]);
    const hasEarlier=members.length>limit,selected=members.slice(0,limit);
    const points:ScannerAuditTimelinePoint[]=[];
    const groups=new Map<string,typeof members>();
    for(const item of selected)groups.set(item.evidence_path,[...(groups.get(item.evidence_path)??[]),item]);
    for(const [relative,items] of groups){
      const handle=await open(join(this.root,relative),"r");
      try{for(const item of items){const compressed=Buffer.alloc(item.evidence_length);
        const result=await handle.read(compressed,0,item.evidence_length,item.evidence_offset);
        if(result.bytesRead!==item.evidence_length)throw Error("scanner_audit_evidence_truncated");
        if(createHash("sha256").update(compressed).digest("hex")!==item.evidence_sha256){
          this.db.prepare(`INSERT INTO scanner_audit_integrity_events VALUES(?,?,?,?)`).run(randomUUID(),new Date().toISOString(),
            "evidence_checksum_mismatch",item.cycle_id);throw Error("scanner_audit_evidence_corrupt");}
        const text=(await gunzip(compressed)).toString("utf8");
        for(const line of text.split("\n")){if(!line)continue;const cycle=JSON.parse(line) as ScannerAuditCycle;
          if(cycle.cycleId!==item.cycle_id)throw Error("scanner_audit_evidence_identity_mismatch");
          const decision=cycle.decisions.find(value=>value.symbol===symbol);if(decision)points.push({cycleId:cycle.cycleId,
            atUtc:new Date(cycle.completedAt).toISOString(),session:cycle.session,decision});}}
      }finally{await handle.close();}
    }
    const sorted=Object.freeze(points.sort((left,right)=>left.atUtc.localeCompare(right.atUtc)));
    return {points:sorted,nextBeforeUtc:hasEarlier&&selected.length?new Date(Math.min(...selected.map(item=>item.completed_at))).toISOString():null};
  }
  dailyReview(tradingDate:string):ScannerAuditDailyReview{
    if(!DATE.test(tradingDate))throw Error("scanner_audit_query_invalid");
    const sessions=this.db.prepare(`SELECT c.session,COUNT(*) cycles,SUM(CASE WHEN c.status='partial' THEN 1 ELSE 0 END) partial_cycles,
      SUM(c.observation_count) observations,COALESCE(SUM(s.gainer_qualified),0) gainer_qualified,
      COALESCE(SUM(s.momentum_qualified),0) momentum_qualified,COALESCE(SUM(s.gainer_displayed),0) gainer_displayed,
      COALESCE(SUM(s.momentum_displayed),0) momentum_displayed FROM scanner_audit_cycles c
      LEFT JOIN scanner_audit_cycle_summaries s ON s.cycle_id=c.cycle_id WHERE c.trading_date=? GROUP BY c.session ORDER BY MIN(c.completed_at)`).all(tradingDate) as Array<Record<string,number|string>>;
    const reasons=this.db.prepare(`SELECT scanner,reason_code,SUM(reason_count) count FROM scanner_audit_cycle_reason_counts
      WHERE trading_date=? GROUP BY scanner,reason_code ORDER BY count DESC,scanner,reason_code LIMIT 40`).all(tradingDate) as Array<Record<string,number|string>>;
    return {tradingDate,sessions:sessions.map(value=>({session:String(value.session) as ScannerAuditDailyReview["sessions"][number]["session"],cycles:Number(value.cycles),
      partialCycles:Number(value.partial_cycles),observations:Number(value.observations),gainerQualified:Number(value.gainer_qualified),momentumQualified:Number(value.momentum_qualified),
      gainerDisplayed:Number(value.gainer_displayed),momentumDisplayed:Number(value.momentum_displayed)})),rejectionReasons:reasons.map(value=>({scanner:String(value.scanner) as "gainers"|"momentum",reason:String(value.reason_code),count:Number(value.count)}))};
  }
  async rejections(tradingDate:string,options:Readonly<{scanner:"gainers"|"momentum";session?:string;reason?:string;symbol?:string;cursor?:string;limit?:number}>):Promise<ScannerAuditRejectionPage>{
    const session=options.session??"",symbol=(options.symbol??"").trim().toUpperCase(),reason=(options.reason??"").trim(),cursor=(options.cursor??"").trim();
    const cursorSeparator=cursor.lastIndexOf(":"),cursorCycle=cursorSeparator<0?"":cursor.slice(0,cursorSeparator),cursorSymbol=cursorSeparator<0?"":cursor.slice(cursorSeparator+1).toUpperCase();
    const validSession=session===""||session==="premarket"||session==="regular"||session==="after_hours";
    if(!DATE.test(tradingDate)||!validSession||symbol&&!SYMBOL.test(symbol)||cursor&&(cursorSeparator<1||cursorCycle.length>100||!/^[A-Za-z0-9._-]+$/u.test(cursorCycle)||!SYMBOL.test(cursorSymbol))||reason&&!/^[a-z0-9_]{1,80}$/u.test(reason))throw Error("scanner_audit_query_invalid");
    const limit=Math.min(100,Math.max(1,options.limit??50));
    const item=(cursorCycle?this.db.prepare(`SELECT cycle_id,completed_at,session,evidence_path,evidence_offset,evidence_length,evidence_sha256 FROM scanner_audit_cycles
      WHERE trading_date=? AND cycle_id=? AND (?='' OR session=?) LIMIT 1`).get(tradingDate,cursorCycle,session,session):this.db.prepare(`SELECT cycle_id,completed_at,session,evidence_path,evidence_offset,evidence_length,evidence_sha256 FROM scanner_audit_cycles
      WHERE trading_date=? AND (?='' OR session=?) ORDER BY completed_at DESC LIMIT 1`).get(tradingDate,session,session)) as {cycle_id:string;completed_at:number;session:string;evidence_path:string;evidence_offset:number;evidence_length:number;evidence_sha256:string}|undefined;
    if(!item)return {rows:[],nextCursor:null};const cycle=await this.readCycle(item),matches:ScannerAuditRejectionPage["rows"][number][]=[];
    for(const decision of [...cycle.decisions].sort((left,right)=>left.symbol.localeCompare(right.symbol))){if(symbol&&decision.symbol!==symbol||cursorSymbol&&decision.symbol<=cursorSymbol)continue;
      const failures=options.scanner==="gainers"?decision.gainerFailures:decision.momentumFailures,matched=reason?failures.includes(reason):failures[0];if(!matched)continue;
      matches.push({cycleId:cycle.cycleId,atUtc:new Date(cycle.completedAt).toISOString(),session:cycle.session,scanner:options.scanner,reason:reason||failures[0],decision});if(matches.length>limit)break;}
    const hasMore=matches.length>limit,rows=matches.slice(0,limit);return {rows,nextCursor:hasMore?`${cycle.cycleId}:${rows.at(-1)?.decision.symbol}`:null};
  }
  private async readCycle(item:{cycle_id:string;evidence_path:string;evidence_offset:number;evidence_length:number;evidence_sha256:string}):Promise<ScannerAuditCycle>{
    const handle=await open(join(this.root,item.evidence_path),"r");try{const compressed=Buffer.alloc(item.evidence_length),result=await handle.read(compressed,0,item.evidence_length,item.evidence_offset);
      if(result.bytesRead!==item.evidence_length)throw Error("scanner_audit_evidence_truncated");if(createHash("sha256").update(compressed).digest("hex")!==item.evidence_sha256)throw Error("scanner_audit_evidence_corrupt");
      const cycle=JSON.parse((await gunzip(compressed)).toString("utf8").trim()) as ScannerAuditCycle;if(cycle.cycleId!==item.cycle_id)throw Error("scanner_audit_evidence_identity_mismatch");return cycle;
    }finally{await handle.close();}}
  private reconcileKnownSegments():void{
    const rows=this.db.prepare(`SELECT trading_date,evidence_path,MAX(evidence_offset+evidence_length) expected FROM scanner_audit_cycles GROUP BY trading_date,evidence_path`).all() as Array<{trading_date:string;evidence_path:string;expected:number}>;
    for(const row of rows){let actual=-1;try{actual=statSync(join(this.root,row.evidence_path)).size;}catch{/* missing file */}
      if(actual===row.expected)continue;
      const key=`segment_reconciled:${row.evidence_path}:${row.expected}:${actual}`;
      const transaction=this.db.transaction(()=>{const inserted=this.db.prepare(`INSERT OR IGNORE INTO scanner_audit_state VALUES(?,'1')`).run(key).changes;
        if(!inserted)return;this.db.prepare(`INSERT INTO scanner_audit_integrity_events VALUES(?,?,?,?)`).run(randomUUID(),new Date().toISOString(),
          actual<row.expected?"evidence_segment_truncated":"evidence_segment_unindexed_tail",`${row.evidence_path}:${row.expected}:${actual}`);
        this.db.prepare(`INSERT INTO scanner_audit_state VALUES(?,'1') ON CONFLICT(state_key) DO UPDATE SET state_value=CAST(CAST(state_value AS INTEGER)+1 AS TEXT)`).run(`coverage_gap_count:${row.trading_date}`);});
      transaction();
    }
  }
  close():void{this.db.close();}
}

export class ScannerAuditRecorder {
  private queue:ScannerAuditCycle[]=[];
  private drainTask:Promise<void>|undefined;
  private reads=new Set<Promise<unknown>>();
  private dropped=0;
  private error:string|null=null;
  private enabled:boolean;
  private deleting=false;

  constructor(private readonly store:ScannerAuditStore,private readonly maximumQueue=24){
    this.enabled=store.recordingEnabled();
  }
  recordingState(){return {enabled:this.enabled,deleting:this.deleting};}
  isRecording(){return this.enabled&&!this.deleting;}
  async setRecording(enabled:boolean):Promise<void>{
    this.requireAvailable();
    this.store.setRecordingEnabled(enabled);
    this.enabled=enabled;
    if(!enabled){
      this.queue.length=0;
      await this.drainTask;
    }
  }
  async deleteHistory():Promise<void>{
    this.requireAvailable();
    this.deleting=true;
    this.queue.length=0;
    try{
      await this.drainTask;
      await Promise.allSettled([...this.reads]);
      await this.store.deleteHistory();
      this.dropped=0;
      this.error=null;
    }finally{this.deleting=false;}
  }
  enqueue(cycle:ScannerAuditCycle):void{
    if(!this.isRecording())return;
    if(this.queue.length>=this.maximumQueue){
      this.dropped++;
      this.error="audit_queue_overflow";
      this.store.recordGap("audit_queue_overflow",cycle.cycleId,cycle.tradingDate);
      return;
    }
    this.queue.push(cycle);
    this.startDrain();
  }
  health(options:Readonly<{expectedActive?:boolean;now?:number}>={}):ScannerAuditHealth{
    this.requireAvailable();
    return this.store.health({queueDepth:this.queue.length,droppedCycles:this.dropped,lastError:this.error,...options,expectedActive:this.isRecording()&&options.expectedActive});
  }
  timeline(date:string,symbol:string,options:Readonly<{beforeUtc?:string;limit?:number}>={}):Promise<ScannerAuditTimelinePage>{
    this.requireAvailable();
    return this.track(this.store.timeline(date,symbol,options));
  }
  dailyReview(date:string):ScannerAuditDailyReview{this.requireAvailable();return this.store.dailyReview(date);}
  rejections(date:string,options:Parameters<ScannerAuditStore["rejections"]>[1]):Promise<ScannerAuditRejectionPage>{
    this.requireAvailable();
    return this.track(this.store.rejections(date,options));
  }
  private requireAvailable(){if(this.deleting)throw Error("audit_delete_in_progress");}
  private async track<T>(operation:Promise<T>):Promise<T>{
    this.reads.add(operation);
    try{return await operation;}finally{this.reads.delete(operation);}
  }
  private startDrain(){
    if(this.drainTask||!this.queue.length)return;
    this.drainTask=this.drain().finally(()=>{
      this.drainTask=undefined;
      this.startDrain();
    });
  }
  private async drain():Promise<void>{
    while(this.queue.length){
      const cycle=this.queue.shift()!;
      try{await this.store.record(cycle);this.error=null;}
      catch(error){
        this.error=error instanceof Error?error.message:"audit_write_failed";
        this.store.recordGap("audit_write_failed",`${cycle.cycleId}:${this.error}`,cycle.tradingDate);
      }
    }
  }
}
