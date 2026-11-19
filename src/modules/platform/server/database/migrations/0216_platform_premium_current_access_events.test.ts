import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
import { beforeAll, expect, it } from "vitest";
import { platformMigrationManifest } from "../platform-migration-manifest";
import { runPlatformMigrations, verifyCompletedPlatformDatabase } from "../run-platform-migrations";
import { calculatePlatformMigrationChecksum } from "../platform-migration-contract";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS } from "../../membership/platform-premium-role-current-access-schema";
import { platformPremiumCurrentAccessEventsMigration as migration } from "./0216_platform_premium_current_access_events";
const predecessor = platformMigrationManifest.filter(row => row.executionOrder < 291);
const complete = [...predecessor, migration];
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
let pristine: Buffer;
beforeAll(() => {
  expect(predecessor).toHaveLength(203);
  expect(predecessor.at(-1)?.executionOrder).toBe(290);
  const db = new Database(":memory:");
  try { db.pragma("foreign_keys=ON"); runPlatformMigrations(db, { manifest: predecessor });
    expect(verifyCompletedPlatformDatabase(db, predecessor).finalSchemaSha256).toBe("bd8a006dd68b2244b385fcccd88733511008dce12650389141d8fb714ff687b4");
    expect(db.prepare("SELECT name FROM sqlite_schema WHERE type IN ('trigger','view') AND instr(lower(sql),'platform_premium_paid_events')>0 ORDER BY name").all())
      .toEqual([{name:"platform_premium_paid_event_live_subject"}]);
    // Synthetic live lifecycle satisfies the unchanged native insert fence.
    // This is fixture data, not qualification of a real admission/profile.
    db.prepare("INSERT INTO platform_users VALUES(?, 'synthetic', 'migration_fixture', 'Synthetic migration user', 'active', ?, ?)").run(scope.userId,at,at);
    db.prepare("INSERT INTO platform_erasure_profiles VALUES('migration_fixture_profile',1,?,'synthetic_retention','synthetic_backup','hold_signer_and_shared_owner',?)")
      .run("bd8a006dd68b2244b385fcccd88733511008dce12650389141d8fb714ff687b4",until);
    db.prepare("INSERT INTO platform_erasure_lifecycles VALUES('migration_fixture_lifecycle',?,1,'migration_fixture_admission',1,'live','migration_fixture_profile',1,?,NULL)").run(scope.userId,until);
    pristine = db.serialize();
  } finally { db.close(); }
}, 30_000);
const at = "2026-11-17T20:00:00.000Z", until = "2026-11-17T20:01:00.000Z";
const scope = { authorityKey: "11111111-1111-4111-8111-111111111111", userId: "22222222-2222-4222-8222-222222222222",
  discordUserId: "12345", guildId: "12346", identityGeneration: 1, entitlementGeneration: 1, erasureGeneration: 1, policyGeneration: 1 };
function event(revision = 1) { return { ticket: { scope, authorityRevision: revision, whopGeneration: 1,
  admissionRef: "synthetic_admission", factsSha256: "a".repeat(64), observedAtUtc: at, validUntilUtc: until },
  authorityKey: scope.authorityKey, authorityRevision: revision, scope, paidEligible: true as boolean | null,
  validUntilUtc: until as string | null, paidThroughUtc: "2026-12-01T00:00:00.000Z" as string | null, observedAtUtc: at }; }
function current(state: "paid" | "not_paid" | "unknown" = "paid", revision = 2) { return { ...event(revision),
  protocol: "platform_premium_current_access_event_v1", basis: "current_provider_access", state,
  paidEligible: state === "unknown" ? null : state === "paid", paidThroughUtc: null, realm: "live",
  nativeObservationRefs: state === "paid" ? ["native_observation"] : [] }; }
function fixture() { const db = new Database(Buffer.from(pristine)); db.pragma("foreign_keys=ON"); return db; }
function insert(db: Database.Database, value: ReturnType<typeof event>, raw = JSON.stringify(value)) {
  db.prepare(`INSERT INTO platform_premium_paid_events
    (guild_id,paid_role_id,authority_key,authority_revision,observed_at_utc,paid_eligible,valid_until_utc,applied,expiry_applied,event_json)
    VALUES(?,?,?,?,?,?,?,1,0,?)`).run(scope.guildId,"12347",scope.authorityKey,value.authorityRevision,at,
      value.paidEligible === null ? null : Number(value.paidEligible),value.validUntilUtc,raw);
}
const rows = (db: Database.Database) => db.prepare("SELECT * FROM platform_premium_paid_events ORDER BY authority_revision").all();
const ledger = (db: Database.Database) => db.prepare("SELECT * FROM platform_schema_migrations ORDER BY execution_order").all();
function apply(db: Database.Database) { return runPlatformMigrations(db, { manifest: complete }); }
it("appends exactly the reserved descriptor and preserves the whole native 203 prefix, schema inventory and replay", () => {
  const db = fixture();
  try { const before = ledger(db); const result = apply(db);
    expect(result.appliedMigrationIds).toEqual([migration.migrationId]);
    expect(ledger(db).slice(0,203)).toEqual(before);
    expect(ledger(db)).toHaveLength(204);
    expect(calculatePlatformMigrationChecksum(migration)).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyCompletedPlatformDatabase(db, complete).finalSchemaSha256).toBe(result.finalSchemaSha256);
    expect(apply(db).appliedMigrationIds).toEqual([]);
    expect(db.prepare("SELECT sql FROM sqlite_schema WHERE type='table' AND name='platform_premium_paid_events'").get()).toEqual({sql:PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS.find(sql=>sql.startsWith('CREATE TABLE "platform_premium_paid_events"'))});
    expect(db.pragma("foreign_key_check")).toEqual([]);
    expect(db.prepare("SELECT name FROM sqlite_schema WHERE name LIKE '%next_v3%'").all()).toEqual([]);
    expect(db.prepare("SELECT name FROM sqlite_temp_schema WHERE name LIKE '%migration_guard%'").all()).toEqual([]);
    console.info(JSON.stringify({ syntheticOnly:true,migrations:204,checksum:calculatePlatformMigrationChecksum(migration),schemaSha256:result.finalSchemaSha256 }));
  } finally { db.close(); }
});
it("copies every old row and raw JSON without changing flags, keys, index or existing ledger records", () => {
  const db = fixture();
  try { insert(db,event(),JSON.stringify(event(),null,2)); insert(db,{ ...event(2),paidEligible:false,paidThroughUtc:null,validUntilUtc:null });
    const fence = db.prepare("SELECT sql FROM sqlite_schema WHERE type='trigger' AND name='platform_premium_paid_event_live_subject'").get();
    const before = rows(db), prior = ledger(db), index = db.prepare<[], {name:string;sql:string}>("SELECT * FROM sqlite_schema WHERE type='index' AND tbl_name='platform_premium_paid_events'").all();
    apply(db); expect(rows(db)).toEqual(before);
    expect(db.prepare("SELECT sql FROM sqlite_schema WHERE type='trigger' AND name='platform_premium_paid_event_live_subject'").get()).toEqual(fence); expect(ledger(db).slice(0,203)).toEqual(prior);
    expect(db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='index' AND tbl_name='platform_premium_paid_events'").all())
      .toEqual(index.map(({ name,sql }) => ({name,sql})));
  } finally { db.close(); }
});
it("retains legacy period checks and round-trips explicit current paid, negative and unknown without making unknown false", () => {
  const db = fixture();
  try { apply(db); insert(db,event());
    for (const [i,state] of (["paid","not_paid","unknown"] as const).entries()) insert(db,current(state,i+2));
    expect(rows(db).map(row => (row as {paid_eligible:number|null}).paid_eligible)).toEqual([1,1,0,null]);
    expect(() => insert(db,{...event(9),paidThroughUtc:null})).toThrow();
    expect(() => insert(db,{...event(10),paidEligible:null})).toThrow();
    for (const [i,delta] of [ { protocol:"wrong" }, { state:"unknown",paidEligible:false }, { state:"paid",paidEligible:null },
      { paidThroughUtc:until }, { nativeObservationRefs:[] }, { realm:"other" }, { validUntilUtc:at },
      { validUntilUtc:"2026-11-17T20:02:00.000Z" }, { basis:"unknown" } ].entries()) {
      expect(() => insert(db,{...current("paid",20+i),...delta})).toThrow();
    }
    expect(rows(db)).toHaveLength(4);
  } finally { db.close(); }
});
it("rejects malformed current-to-legacy downgrades in native CHECKs, not only the parser",()=>{
 const db=fixture();try{apply(db);
  for(const [i,basis]of [undefined,"payment_period"].entries())for(const state of ["unknown",null]){
   const value={...current("unknown",50+i),basis,state,paidEligible:false,validUntilUtc:null};
   expect(()=>insert(db,value)).toThrow();
  }
  for(const key of ["protocol","state","realm","nativeObservationRefs"]){
   expect(()=>insert(db,{...event(60),paidEligible:false,paidThroughUtc:null,validUntilUtc:null},JSON.stringify({...event(60),paidEligible:false,paidThroughUtc:null,validUntilUtc:null,[key]:null}))).toThrow();
  }
  expect(rows(db)).toEqual([]);
 }finally{db.close();}
});
it("refuses unexpected malformed prior rows without sanitizing or losing their exact original bytes",()=>{
 const db=fixture();try{
  const value={...event(),paidEligible:false,paidThroughUtc:null,validUntilUtc:null,protocol:"platform_premium_current_access_event_v1",state:"unknown"};
  insert(db,value);const before=sha(db.serialize()),original=rows(db);
  expect(()=>apply(db)).toThrow();expect(sha(db.serialize())).toBe(before);expect(rows(db)).toEqual(original);expect(ledger(db)).toHaveLength(203);
 }finally{db.close();}
});
it("preserves the exact live-subject fence before and after migration for disabled, stale-profile and erased principals", () => {
  for(const upgrade of [false,true])for(const reason of ["disabled","stale_profile","erased"]){const db=fixture();try{
    if(upgrade)apply(db);
    if(reason==="disabled")db.prepare("UPDATE platform_users SET status='disabled' WHERE user_id=?").run(scope.userId);
    if(reason==="stale_profile")db.prepare("UPDATE platform_erasure_profiles SET generation=generation+1").run();
    if(reason==="erased"){
      for(const phase of ["preparing","settling"])db.prepare("UPDATE platform_erasure_lifecycles SET generation=generation+1,phase=? WHERE user_id=?").run(phase,scope.userId);
      db.prepare("UPDATE platform_erasure_lifecycles SET generation=generation+1,phase='logical_deleted',user_id=NULL WHERE user_id=?").run(scope.userId);
    }
    expect(()=>insert(db,event())).toThrow("premium_subject_erasure_fenced");expect(rows(db)).toEqual([]);
  }finally{db.close();}}
});
it("fails closed on unexpected indexes, triggers, views, inbound FKs or rebuild objects without dropping them", () => {
  for (const extra of ["CREATE INDEX extra_paid_events ON platform_premium_paid_events(authority_key)",
    "CREATE TRIGGER extra_paid_event AFTER INSERT ON platform_premium_paid_events BEGIN SELECT 1; END",
    "CREATE VIEW extra_paid_events AS SELECT * FROM platform_premium_paid_events",
    "CREATE TABLE extra_paid_events(g TEXT,p TEXT,a TEXT,r INTEGER,o TEXT,FOREIGN KEY(g,p,a,r,o) REFERENCES platform_premium_paid_events(guild_id,paid_role_id,authority_key,authority_revision,observed_at_utc))",
    "CREATE TABLE platform_premium_paid_events_next_v3(x TEXT)"]) {
    const db=fixture();try { db.exec(extra);const before=sha(db.serialize());
      expect(() => db.transaction(() => { for(const statement of migration.statements)db.exec(statement); }).immediate()).toThrow();
      expect(sha(db.serialize())).toBe(before);
    } finally {db.close();}
  }
});
it("rolls back copy failures and failures at every destructive boundary, including registration/commit", () => {
  for(const position of [4,5,6,7,8]) { const db=fixture();try {insert(db,event());const before=sha(db.serialize());
    const statements=[...migration.statements];statements.splice(position,0,"SELECT missing_migration_probe()");
    expect(() => runPlatformMigrations(db,{manifest:[...predecessor,{...migration,statements}]})).toThrow();
    expect(sha(db.serialize())).toBe(before);expect(ledger(db)).toHaveLength(203);
    expect(apply(db).appliedMigrationIds).toEqual([migration.migrationId]);
  }finally{db.close();}}
  const db=fixture();try{insert(db,event());const before=sha(db.serialize());
    expect(()=>runPlatformMigrations(db,{manifest:complete,beforeMigrationBoundary:boundary=>{if(boundary==="commit")throw new Error("Commit probe");}})).toThrow();
    expect(sha(db.serialize())).toBe(before);expect(ledger(db)).toHaveLength(203);
  }finally{db.close();}
});
it("recovers an actual interrupted disk transaction then upgrades and reopens cleanly", () => {
  const directory=mkdtempSync(join(tmpdir(),"premium-current-access-crash-")),file=join(directory,"synthetic.sqlite");
  try {writeFileSync(file,pristine,{mode:0o600});let db=new Database(file);db.pragma("foreign_keys=ON");insert(db,event());const before=ledger(db);db.close();
    const require=createRequire(import.meta.url),driver=require.resolve("better-sqlite3");
    const child=spawnSync(process.execPath,["-e",`const D=require(${JSON.stringify(driver)}),d=new D(process.argv[1]);d.pragma('foreign_keys=ON');d.exec('BEGIN IMMEDIATE');for(const s of ${JSON.stringify(migration.statements.slice(0,6))})d.exec(s);process.exit(97);`,file],{encoding:"utf8",timeout:10000});
    expect(child.status,child.stderr).toBe(97);
    db=new Database(file);db.pragma("foreign_keys=ON");expect(ledger(db)).toEqual(before);expect(rows(db)).toHaveLength(1);apply(db);db.close();
    db=new Database(file);db.pragma("foreign_keys=ON");expect(ledger(db)).toHaveLength(204);expect(rows(db)).toHaveLength(1);
    expect(verifyCompletedPlatformDatabase(db,complete).finalSchemaSha256).toMatch(/^[a-f0-9]{64}$/);expect(db.pragma("foreign_key_check")).toEqual([]);db.close();
  }finally{rmSync(directory,{recursive:true,force:true});}
});
