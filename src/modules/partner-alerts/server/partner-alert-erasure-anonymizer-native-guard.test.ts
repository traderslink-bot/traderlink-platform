// @vitest-environment node
import Database from "better-sqlite3";
import {afterEach,describe,expect,it,vi} from "vitest";
import {PlatformErasureAdmissionError} from "../../platform/server/privacy/platform-erasure-admission";
import {PARTNER_ALERT_ERASURE_PRINCIPAL_ID,PartnerAlertErasureAnonymizer} from "./partner-alert-erasure-anonymizer";
import {PartnerAlertErasureEvidenceArchiver} from "./partner-alert-erasure-evidence-archiver";

const operation="11111111-1111-4111-8111-111111111111";
const user="22222222-2222-4222-8222-222222222222";
const configuration={binding:{keyRef:"synthetic_guard_key",key:new Uint8Array(32).fill(8)},
  nowUtc:()=>"2026-11-19T12:00:00.000Z",createId:()=>"33333333-3333-4333-8333-333333333333"};
const opened:Database.Database[]=[];
afterEach(()=>{vi.restoreAllMocks();for(const db of opened.splice(0))db.close();});

function fixture(){
  const db=new Database(":memory:");opened.push(db);db.pragma("foreign_keys = ON");
  db.exec(`CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,auth_provider TEXT,auth_subject TEXT,display_name TEXT,status TEXT);
    CREATE TABLE platform_erasure_module_operations(operation_ref TEXT PRIMARY KEY,phase TEXT);
    CREATE TABLE extension_authorities(id INTEGER PRIMARY KEY,
      left_user_id TEXT REFERENCES platform_users(user_id),right_user_id TEXT REFERENCES platform_users(user_id),
      FOREIGN KEY(right_user_id) REFERENCES platform_users(user_id));`);
  db.prepare("INSERT INTO platform_users VALUES(?,?,?,?,?)").run(PARTNER_ALERT_ERASURE_PRINCIPAL_ID,
    "erasure","paid-partner-retained-principal-v1","Removed Partner owner","disabled");
  db.prepare("INSERT INTO platform_users VALUES(?,?,?,?,?)").run(user,"discord","synthetic_user","Synthetic member","active");
  db.prepare("INSERT INTO platform_erasure_module_operations VALUES(?,?)").run(operation,"ready");
  const boundary=new Error("synthetic_stop_after_real_native_authority_guard");
  // Stop at the next participant boundary. No fixture pretends to be an
  // admitted full-erasure/native-profile/retained-successor execution.
  const archive=vi.spyOn(PartnerAlertErasureEvidenceArchiver.prototype,"archive").mockImplementation(()=>{throw boundary;});
  const run=()=>db.transaction(()=>new PartnerAlertErasureAnonymizer(db,configuration)
    .anonymize(operation,user,configuration.nowUtc())).immediate();
  return {db,boundary,archive,run};
}

describe("native incoming-FK authority guard through anonymize",()=>{
  it.each([[null,null],[user,null],[null,user],[user,user]])(
    "permits null/unrelated incoming references without using the retained principal (%s,%s)",(left,right)=>{
      const {db,boundary,archive,run}=fixture();
      db.prepare("INSERT INTO extension_authorities VALUES(1,?,?)").run(left,right);
      expect(run).toThrow(boundary);expect(archive).toHaveBeenCalledOnce();
      expect(db.prepare("SELECT left_user_id,right_user_id FROM extension_authorities").get())
        .toEqual({left_user_id:left,right_user_id:right});
      expect(db.pragma("foreign_key_check")).toEqual([]);
    });

  it.each(["left_user_id","right_user_id"] as const)("holds a retained-principal reference in every incoming column: %s",column=>{
    const {db,archive,run}=fixture();
    db.prepare("INSERT INTO extension_authorities VALUES(1,?,?)")
      .run(column==="left_user_id"?PARTNER_ALERT_ERASURE_PRINCIPAL_ID:user,
        column==="right_user_id"?PARTNER_ALERT_ERASURE_PRINCIPAL_ID:user);
    expect(run).toThrow(PlatformErasureAdmissionError);expect(archive).not.toHaveBeenCalled();
    expect(db.prepare("SELECT count(*) n FROM extension_authorities").get()).toEqual({n:1});
  });

  it("discovers an unknown module's authority and deduplicates its repeated FK column in one native table probe",()=>{
    const {db,boundary,archive,run}=fixture();
    db.prepare("INSERT INTO extension_authorities VALUES(1,NULL,NULL)").run();
    expect(db.pragma("foreign_key_list('extension_authorities')")).toHaveLength(3);
    const prepare=vi.spyOn(db,"prepare");
    expect(run).toThrow(boundary);expect(archive).toHaveBeenCalledOnce();
    const probes=prepare.mock.calls.map(([sql])=>String(sql)).filter(sql=>sql.startsWith('SELECT 1 FROM "extension_authorities"'));
    expect(probes).toHaveLength(1);
    expect(probes[0]!.match(/"left_user_id"/gu)).toHaveLength(1);
    expect(probes[0]!.match(/"right_user_id"/gu)).toHaveLength(1);
  });

  it("does not confuse the same identifier in a different FK parent with Platform authority",()=>{
    const {db,boundary,archive,run}=fixture();
    db.exec("CREATE TABLE other_subjects(id TEXT PRIMARY KEY); CREATE TABLE unrelated_module(user_id TEXT REFERENCES other_subjects(id));");
    db.prepare("INSERT INTO other_subjects VALUES(?)").run(PARTNER_ALERT_ERASURE_PRINCIPAL_ID);
    db.prepare("INSERT INTO unrelated_module VALUES(?)").run(PARTNER_ALERT_ERASURE_PRINCIPAL_ID);
    expect(run).toThrow(boundary);expect(archive).toHaveBeenCalledOnce();
  });

  it.each([
    'CREATE TABLE "untrusted-table"(id INTEGER)',
    'CREATE TABLE untrusted_columns("untrusted-column" TEXT REFERENCES platform_users(user_id))',
  ])("retains the existing hold on an unqualified discovered identifier: %s",ddl=>{
    const {db,archive,run}=fixture();db.exec(ddl);
    expect(run).toThrow(PlatformErasureAdmissionError);expect(archive).not.toHaveBeenCalled();
  });
});
