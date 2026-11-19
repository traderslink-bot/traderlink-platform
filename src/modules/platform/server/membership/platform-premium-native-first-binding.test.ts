import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { build } from "esbuild";
import { expect, it } from "vitest";
/** One disposable real-node child owns its cwd/catalog/source copies. Never
 * writes the caller's real catalog or substitutes an admission/store module. */
function nativeVariant(text:string):string{
 const once=(from:string,to:string)=>{if(!text.includes(from)||text.indexOf(from)!==text.lastIndexOf(from))throw Error("Frozen native controller marker changed");text=text.replace(from,to);};
 once(' const initial=capture();',' let initial=capture();');
 const marker=' const nativeUntil=new Date(Date.parse(baseAt)+(capabilityUnit?120000:30000)).toISOString();';
 once(marker,` let nativeBindingNegatives=0;
 const otherFacts=()=>hash(JSON.stringify(["platform_premium_paid_observations","platform_premium_paid_events","platform_premium_role_jobs","platform_erasure_operation_claims","platform_membership_provider_event_receipts"].map(table=>db.prepare('SELECT * FROM "'+table+'"').all())));
 const baselineFacts=otherFacts();
 const reject=(original=initial.ticket,scope="offer",subject="buyer")=>{const before=hash(db.serialize());assert.throws(()=>core.runForUsers([actor.userId],()=>repo.recordVerifiedWhopSubjectBindingV2(original,scope,subject)));assert.equal(hash(db.serialize()),before);nativeBindingNegatives+=1;};
 assert.throws(()=>repo.recordVerifiedWhopSubjectBindingV2(initial.ticket,"offer","buyer"));nativeBindingNegatives+=1;
 reject(initial.ticket,"other_scope");reject(initial.ticket,"offer","foreign_subject");
 reject({...initial.ticket,factsSha256:"f".repeat(64)});reject({...initial.ticket,whopGeneration:undefined} as never);
 reject({...initial.ticket,scope:{...initial.ticket.scope,userId:randomUUID()}});
 const rejectMutation=(sql:string)=>{const before=hash(db.serialize());assert.throws(()=>core.runForUsers([actor.userId],()=>{db.exec(sql);const fresh=repo.captureV2(key);assert.equal(fresh.kind,"snapshot");if(fresh.kind!=="snapshot")throw Error("No snapshot");repo.recordVerifiedWhopSubjectBindingV2(fresh.ticket,"offer","buyer");}));assert.equal(hash(db.serialize()),before);nativeBindingNegatives+=1;};
 rejectMutation("UPDATE platform_premium_authority_policies SET native_qualification_json=NULL WHERE policy_ref='policy'");
 rejectMutation("UPDATE platform_premium_authority_policies SET offer_scopes_json=json_set(offer_scopes_json,'$[0].environment','live') WHERE policy_ref='policy'");
 rejectMutation("UPDATE platform_erasure_profiles SET generation=generation+1 WHERE profile_ref='synthetic_profile'");
 rejectMutation("UPDATE platform_erasure_profiles SET valid_until_utc='"+baseAt+"' WHERE profile_ref='synthetic_profile'");
 rejectMutation("UPDATE platform_schema_migrations SET checksum_sha256='"+"f".repeat(64)+"' WHERE migration_id='0216_platform_premium_current_access_events'");
 const conflictBefore=hash(db.serialize());assert.throws(()=>core.runForUsers([actor.userId],()=>{db.prepare("INSERT INTO platform_premium_native_bindings VALUES(?,?,?,?)").run(key,purchase.purchase.payer.linkId,createWhopPrivacyReference("other_native","user",process.env.TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY!),"other_native");const fresh=repo.captureV2(key);assert.equal(fresh.kind,"snapshot");if(fresh.kind!=="snapshot")throw Error("No snapshot");repo.recordVerifiedWhopSubjectBindingV2(fresh.ticket,"offer","buyer");}));assert.equal(hash(db.serialize()),conflictBefore);nativeBindingNegatives+=1;
 const prepare=db.prepare.bind(db),atomicBefore=hash(db.serialize());
 db.prepare=((sql:string)=>{const statement=prepare(sql);if(sql.startsWith("INSERT INTO platform_premium_native_bindings VALUES"))return{run:(...args:unknown[])=>{statement.run(...args);throw Error("SYNTHETIC interrupted identity write");}};return statement;}) as typeof db.prepare;
 try{assert.throws(()=>core.runForUsers([actor.userId],()=>repo.recordVerifiedWhopSubjectBindingV2(initial.ticket,"offer","buyer")));}finally{db.prepare=prepare;}
 assert.equal(hash(db.serialize()),atomicBefore);nativeBindingNegatives+=1;
 const sourceFile=join(process.cwd(),"src/modules/platform/server/membership/platform-premium-authority-repository.ts"),rawSource=readFileSync(sourceFile);
 const clonePath=join(process.cwd(),"source-pin-negative.sqlite");writeFileSync(clonePath,db.serialize());const clone=new Database(clonePath);configurePlatformDatabaseConnection(clone,"initializer");
 try{writeFileSync(sourceFile,Buffer.concat([rawSource,Buffer.from("\\n// SYNTHETIC tamper")]));assert.throws(()=>bind(clone));assert.equal(currentPlatformErasureAdmission(clone),null);}finally{writeFileSync(sourceFile,rawSource);clone.close();}
 const sourcePinFailureProved=true;
 const originalBindingTicket=initial.ticket;
 assert.equal(core.runForUsers([actor.userId],()=>repo.recordVerifiedWhopSubjectBindingV2(originalBindingTicket,"offer","buyer")).kind,"bound");
 assert.equal(core.runForUsers([actor.userId],()=>repo.isCurrentV2(originalBindingTicket)),false);
 const freshBinding=capture();assert.equal(freshBinding.ticket.scope.identityGeneration,originalBindingTicket.scope.identityGeneration+1);assert.equal(freshBinding.ticket.authorityRevision,originalBindingTicket.authorityRevision+1);
 reject(originalBindingTicket);
 const duplicateBefore=hash(db.serialize());assert.equal(core.runForUsers([actor.userId],()=>repo.recordVerifiedWhopSubjectBindingV2(freshBinding.ticket,"offer","buyer")).kind,"duplicate");assert.equal(hash(db.serialize()),duplicateBefore);
 assert.equal(otherFacts(),baselineFacts);const identityOnlyNoOtherFacts=true;
 initial=capture(); // Explicit NEW intent for the subsequent real prepared observation.
`+marker);
 once('actualNormalOwnerFrame:true,sandboxPositiveOnlyWithOpaqueToken:true,','actualNormalOwnerFrame:true,nativeFirstBinding:true,nativeBindingNegatives,identityOnlyNoOtherFacts,sourcePinFailureProved,sandboxPositiveOnlyWithOpaqueToken:true,');
 return text;
}
async function runNativeFirstBinding():Promise<void>{
 const capabilityUnit=true;
 const core=process.cwd(),combined=process.env.CORE_CURRENT_ACCESS_COMBINED_ROOT??core;
 const directory=mkdtempSync(join(tmpdir(),"premium-native-first-binding-"));
 const require=createRequire(import.meta.url);
 const paths=new Set([
  "src/modules/platform/contracts/platform-premium-access.ts",
  ...["platform-premium-authority-repository.ts","platform-premium-current-authority.ts","platform-premium-whop-current-access.ts","platform-premium-current-paid-evidence.ts",
   "platform-premium-current-access-event.ts","platform-premium-eligibility-event.ts","platform-premium-role-current-access-schema.ts","platform-premium-role-repository.ts",
   "platform-premium-role-store.ts","platform-premium-role-reconciliation.ts"].map(file=>"src/modules/platform/server/membership/"+file),
  "src/modules/platform/server/privacy/platform-erasure-admission.ts","src/modules/platform/server/database/migrations/0216_platform_premium_current_access_events.ts",
  "src/test/fixtures/premium-current-access-native-controller.ts"]);
 const select=(relative:string)=>["",".ts",".tsx",".js",".json","/index.ts"].map(ext=>relative+ext)
  .map(file=>join(paths.has(file)?core:combined,file)).find(file=>existsSync(file));
 try{
  const result=await build({entryPoints:[join(core,"src/test/fixtures/premium-current-access-native-controller.ts")],bundle:true,platform:"node",format:"cjs",target:"node22",write:false,sourcemap:"inline",
   packages:"external",plugins:[{name:"actual-source-with-narrow-Core-slice",setup(plugin){
    plugin.onResolve({filter:/.*/},args=>{
     if(args.path==="server-only")return{path:require.resolve("next/dist/compiled/server-only/empty.js")};
     let relative:string|undefined;
     if(args.path.startsWith("@/"))relative=args.path.slice(2);
     else if(args.path.startsWith(".")){const absolute=resolve(args.resolveDir,args.path);relative=absolute.startsWith(core+"/")?absolute.slice(core.length+1):absolute.startsWith(combined+"/")?absolute.slice(combined.length+1):undefined;}
     if(capabilityUnit&&relative?.replace(/\.ts$/,"")==="src/modules/communities/server/community-staging-qa-target")return{path:"target-unit-only",namespace:"target-unit-only"};
     if(relative?.replace(/\.ts$/,"")==="src/modules/platform/server/database/platform-migration-manifest")return{path:"current-manifest",namespace:"native204"};
     if(relative){const found=select(relative);if(found)return{path:found};}
     return undefined;
    });
    plugin.onLoad({filter:/.*/,namespace:"target-unit-only"},()=>({contents:'export function assertCommunityStagingQaTarget(db,pins){if(!db.open||pins.origin!=="https://synthetic.example.com"||pins.sourceCommit!=="'+"c".repeat(40)+'")throw Error("Synthetic target binding refused");}',loader:"js"}));
    plugin.onLoad({filter:/\.tsx?$/},args=>({contents:(args.path===join(core,"src/test/fixtures/premium-current-access-native-controller.ts")?nativeVariant(readFileSync(args.path,"utf8")):readFileSync(args.path,"utf8")).replace(/import\.meta\.url/g,JSON.stringify(pathToFileURL(args.path).href)),loader:args.path.endsWith(".tsx")?"tsx":"ts",resolveDir:dirname(args.path)}));
    plugin.onLoad({filter:/.*/,namespace:"native204"},()=>{
     let source=readFileSync(join(combined,"src/modules/platform/server/database/platform-migration-manifest.ts"),"utf8")
      .replace(/from (["'])(\.[^"']+)\1/g,(_match,q,path)=>"from "+q+combined+"/src/modules/platform/server/database/"+path+q);
     if(!source.includes('migrationId: "0216_platform_premium_current_access_events"')&&!source.includes("migration:platformPremiumCurrentAccessEventsMigration")&&!source.includes("migration: platformPremiumCurrentAccessEventsMigration")){
      const tail='    Object.freeze({sourcePath:"src/modules/communities/server/database/migrations/0215_traderlink_community_stats_attribution.ts",migration:traderLinkCommunityStatsAttributionMigration}),';
      if(!source.includes(tail))throw Error("Expected exact combined203 predecessor");
      source='import {platformPremiumCurrentAccessEventsMigration} from "'+join(core,"src/modules/platform/server/database/migrations/0216_platform_premium_current_access_events.ts")+'";\n'+source;
      source=source.replace(tail,tail+'\n    Object.freeze({sourcePath:"src/modules/platform/server/database/migrations/0216_platform_premium_current_access_events.ts",migration:platformPremiumCurrentAccessEventsMigration}),');
     }
     return{contents:source,loader:"ts",resolveDir:combined};
    });
   }}]});
  for(const relative of ["membership/platform-premium-authority-repository.ts","membership/platform-premium-whop-native.ts","privacy/platform-premium-signer-redaction.ts"]){
   const file=join(directory,"src/modules/platform/server",relative);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,readFileSync(select("src/modules/platform/server/"+relative)!),{mode:0o600});
  }
  const filename=join(directory,"controller.cjs");writeFileSync(filename,result.outputFiles[0]!.contents,{mode:0o600});
  const child=spawnSync(process.execPath,["--enable-source-maps",filename,...(capabilityUnit?["--runtime-authority-unit"]:[])],{cwd:directory,encoding:"utf8",timeout:30000,
   env:{...process.env,NODE_ENV:"test",NODE_PATH:join(combined,"node_modules")},maxBuffer:128*1024});
  expect(child.status,child.stderr).toBe(0);
  const receiptLine=child.stdout.split("\n").find(line=>line.startsWith("CORE_CURRENT_ACCESS_RECEIPT "));expect(receiptLine,child.stdout).toBeTruthy();
  const receipt=JSON.parse(receiptLine!.slice("CORE_CURRENT_ACCESS_RECEIPT ".length));
  if(capabilityUnit){expect(receipt).toMatchObject({syntheticOnly:true,targetGuardMocked:true,actualStageQualified:false,actualNormalOwnerFrame:true,
    sandboxPositiveOnlyWithOpaqueToken:true,delayedReader:true,nativeFirstBinding:true,identityOnlyNoOtherFacts:true,sourcePinFailureProved:true,networkRequests:0});expect(receipt.negativeCases).toBeGreaterThanOrEqual(13);return;}
  expect(receipt).toMatchObject({syntheticOnly:true,actualCoreAdmission:true,actualSQLiteStore:true,migrations:204,qualifierNegatives:9,unknownRoundTripsAsNull:true,
   originalTicketPreservedAcrossReopen:true,staleOriginalRefused:true,expiryRefreshNotRemoval:true,legacyFalseDoesNotOverrideCurrent:true,periodHistoryNotInvented:true,networkRequests:0});
 }finally{rmSync(directory,{recursive:true,force:true});}
}
it("persists only a canonically verified native identity under actual Core204 writer/fencing; namespace is UNIT-only",runNativeFirstBinding,45000);
