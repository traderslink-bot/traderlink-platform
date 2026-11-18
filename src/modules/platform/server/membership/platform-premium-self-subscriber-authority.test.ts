import {existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,join,resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {createRequire} from "node:module";
import {spawnSync} from "node:child_process";
import {build} from "esbuild";
import {expect,it} from "vitest";
/** Reuses the frozen admitted native controller as an explicitly transformed TEST
 * fixture. No frozen source changes. Only staging namespace qualification is
 * mocked; actual Core204/native receipts/session/workspace/write fences execute.
 * Decoder/native policy/catalog are synthetic test fixtures, not provider proof. */
async function runSelfController(outcome:"paid"|"not_paid"|"unknown"){
 const own=process.cwd(),combined=process.env.CORE_CURRENT_ACCESS_COMBINED_ROOT??own;
 const directory=mkdtempSync(join(tmpdir(),"premium-self-native-")),require=createRequire(import.meta.url);
 const fixturePath="src/test/fixtures/premium-current-access-native-controller.ts";
 const overrides=new Set([fixturePath,"src/modules/platform/contracts/platform-premium-access.ts","src/modules/platform/server/privacy/platform-erasure-admission.ts",
  "src/modules/platform/server/database/migrations/0216_platform_premium_current_access_events.ts",
  ...["platform-premium-authority-repository","platform-premium-current-authority","platform-premium-current-paid-evidence","platform-premium-whop-current-access",
   "platform-premium-eligibility-event","platform-premium-current-access-event","platform-premium-role-current-access-schema","platform-premium-role-store",
   "platform-premium-role-repository","platform-premium-role-reconciliation","platform-premium-runtime-authority"].map(name=>"src/modules/platform/server/membership/"+name+".ts")]);
 const select=(relative:string)=>["",".ts",".tsx",".js",".json","/index.ts"].map(ext=>relative+ext).map(name=>join(overrides.has(name)?own:combined,name)).find(file=>existsSync(file));
 const once=(text:string,from:string,to:string)=>{if(!text.includes(from)||text.indexOf(from)!==text.lastIndexOf(from))throw Error("Frozen native fixture marker changed");return text.replace(from,to);};
 function variant(text:string){
  text=once(text,"issuePlatformPremiumStagingRuntimeAuthority, evaluatePlatformPremiumWithRuntimeAuthority,",
   "issuePlatformPremiumSelfSubscriberRuntimeAuthority as issuePlatformPremiumStagingRuntimeAuthority, issuePlatformPremiumStagingRuntimeAuthority as originalOwnerIssuer, evaluatePlatformPremiumWithRuntimeAuthority,");
  text=once(text,"guildOwner:capabilityUnit","guildOwner:false");
  const ownerGrant='  new PlatformOperatorRepository(db).insert({operatorGrantId:randomUUID(),userId:actor.userId,grantedByKind:"bootstrap_console",grantedByUserId:null,\n   grantReceiptSha256:hash("synthetic_operator_fixture"),recoveryOfGrantId:null,grantedAtUtc:clock});';
  text=once(text,ownerGrant,'  assert.equal((db.prepare("SELECT count(*) n FROM platform_operator_grants WHERE grant_state=\'active\'").get() as {n:number}).n,0);');
  text=once(text,'const request=new Request("https://synthetic.example.com/__private/premium-runtime",{method:"POST"','const request=new Request("http://0.0.0.0:8080/api/partner/catalog",{method:"GET"');
  text=once(text,'headers:{origin:"https://synthetic.example.com","sec-fetch-site":"same-origin",cookie:', 'headers:{"sec-fetch-site":"same-origin",cookie:');
  const actorMarker=' const realm: "live" | "sandbox"=capabilityUnit?"sandbox":"live";';
  text=once(text,actorMarker,` const other=new PlatformDiscordSignInService(db,{now:()=>new Date(clock)}).signIn({authSubject:"12346",username:"synthetic_other",globalDisplayName:"Synthetic other",avatarHash:null,guildId,roleIds:[],guildOwner:false,joinedAtUtc:null},{deferDemoActivation:true});
 db.prepare("INSERT INTO platform_erasure_lifecycles VALUES(?,?,1,?,1,'live','synthetic_profile',1,?,NULL)").run(randomUUID(),other.userId,randomUUID(),profileUntil);
`+actorMarker);
  text=once(text,'  let original=refreshToken();',`  const originalTicket=capture().ticket;
  assert.throws(()=>originalOwnerIssuer({database:db,request:new Request(pins.origin+"/private-owner",{method:"POST",headers:{...Object.fromEntries(request.headers),origin:pins.origin}}),pins,originalTicket}));
  const otherRequest=new Request(request.url,{headers:{cookie:platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)+"="+other.session.token}});
  assert.throws(()=>issuePlatformPremiumStagingRuntimeAuthority({database:db,request:otherRequest,pins,originalTicket}));
  for(const headers of [{origin:"https://attacker.example"},{"sec-fetch-site":"cross-site"}])assert.throws(()=>issuePlatformPremiumStagingRuntimeAuthority({database:db,request:new Request(request.url,{headers:{...Object.fromEntries(request.headers),...headers}}),pins,originalTicket}));
  assert.throws(()=>issuePlatformPremiumStagingRuntimeAuthority({database:db,request,pins,originalTicket:{...originalTicket,factsSha256:"f".repeat(64)}}));
  let original=refreshToken();`);
  if(outcome==="not_paid")text=once(text,'productAccess:"customer",attribution:"exact_membership"','productAccess:"absent",attribution:"exact_membership"');
  if(outcome==="unknown")text=once(text,'purchase:input.purchase,discovery:"complete"','purchase:input.purchase,discovery:"incomplete"');
  text=once(text,'  assert.equal(evaluatePlatformPremiumWithRuntimeAuthority(loaded.snapshot,clock,binding).partnerPaidEligible,true);',`  const decision=evaluatePlatformPremiumWithRuntimeAuthority(loaded.snapshot,clock,binding);
  assert.equal(decision.partnerPaidEligible,${outcome==="paid"});
  const event=createPlatformPremiumCurrentAccessEvent(loaded.snapshot,decision,clock);assert(event);assert.equal(event.state,${JSON.stringify(outcome)});assert.equal(event.paidEligible,${outcome==="paid"?"true":outcome==="not_paid"?"false":"null"});
  assert(token && token.expiresAtUtc<=nativeUntil && token.expiresAtUtc<=original.validUntilUtc);
  store=new SqlitePlatformPremiumRoleStore(db,{enabled:true,guildId,paidRoleId,runtimeAuthority:binding});
  const intent:PlatformPremiumRoleIntent={ticket:loaded.snapshot.ticket,scope:loaded.snapshot.scope,authorityRevision:loaded.snapshot.authorityRevision,managedAssignmentRef:null,target:{authorityKey:key,guildId,discordUserId:loaded.snapshot.scope.discordUserId!,roleId:paidRoleId},desired:decision.paidRole,validUntilUtc:decision.paidRole==="hold"?null:decision.validUntilUtc,atUtc:clock,reason:decision.reason,basis:"current_provider_access",realm:"sandbox",nativeObservationRefs:event.nativeObservationRefs};
  const roleRepo=new PlatformPremiumRoleRepository(store,ticket=>repo.isCurrentV2(ticket),binding);
  assert.equal(core.runForUsers([actor.userId],()=>roleRepo.stage([intent],event)),true);
  const persisted=db.prepare("SELECT paid_eligible FROM platform_premium_paid_events WHERE json_extract(event_json,'$.basis')='current_provider_access'").get() as {paid_eligible:number|null};assert.equal(persisted.paid_eligible,${outcome==="paid"?"1":outcome==="not_paid"?"0":"null"});
  let transportCalls=0;const worker=new PlatformPremiumRoleReconciliation(currentAuthority,roleRepo,{setRole:async(target,present,_ref,stillCurrent)=>{assert.equal(db.inTransaction,false);assert(stillCurrent());transportCalls+=1;return{kind:"confirmed",target,present};}},{enabled:true,guildId,paidRoleId,complimentaryRoleId:null,nowUtc:()=>clock,createOperationRef:()=>randomUUID(),attention:()=>{}});
  assert.equal(await worker.runOnce(),${outcome!=="unknown"});assert.equal(transportCalls,${outcome==="unknown"?0:1});
  assert.throws(()=>core.runForUsers([actor.userId],()=>roleRepo.stage([{...intent,ticket:{...intent.ticket,factsSha256:"f".repeat(64)}}],event)));`);
  text=once(text,'actualNormalOwnerFrame:true,sandboxPositiveOnlyWithOpaqueToken:true,','actualNormalOwnerFrame:false,actualNonOwnerSession:true,selfOnly:true,truthfulOutcome:'+JSON.stringify(outcome)+',sandboxPositiveOnlyWithOpaqueToken:true,');
  return text;
 }
 try{
  const bundled=await build({entryPoints:[join(own,fixturePath)],bundle:true,platform:"node",format:"cjs",target:"node22",write:false,packages:"external",logLevel:"silent",plugins:[{name:"frozen-native-fixture-self-variant",setup(plugin){
   plugin.onResolve({filter:/.*/},args=>{
    if(args.path==="server-only")return{path:require.resolve("next/dist/compiled/server-only/empty.js")};
    let relative:string|undefined;if(args.path.startsWith("@/"))relative=args.path.slice(2);else if(args.path.startsWith(".")){const absolute=resolve(args.resolveDir,args.path);relative=absolute.startsWith(own+"/")?absolute.slice(own.length+1):absolute.startsWith(combined+"/")?absolute.slice(combined.length+1):undefined;}
    if(relative?.replace(/\.ts$/,"")==="src/modules/communities/server/community-staging-qa-target")return{path:"namespace-unit-port",namespace:"unit"};
    if(relative?.replace(/\.ts$/,"")==="src/modules/platform/server/database/platform-migration-manifest")return{path:"manifest204",namespace:"manifest"};
    if(relative){const file=select(relative);if(file)return{path:file};}return undefined;
   });
   plugin.onLoad({filter:/.*/,namespace:"unit"},()=>({contents:'export function assertCommunityStagingQaTarget(db,pins){if(!db.open||pins.origin!=="https://synthetic.example.com"||pins.sourceCommit!=="'+"c".repeat(40)+'")throw Error("UNIT target refused");}',loader:"js"}));
   plugin.onLoad({filter:/\.tsx?$/},args=>{let text=readFileSync(args.path,"utf8");if(args.path===join(own,fixturePath))text=variant(text);return{contents:text.replace(/import\.meta\.url/g,JSON.stringify(pathToFileURL(args.path).href)),loader:args.path.endsWith(".tsx")?"tsx":"ts",resolveDir:dirname(args.path)};});
   plugin.onLoad({filter:/.*/,namespace:"manifest"},()=>{
    let text=readFileSync(join(combined,"src/modules/platform/server/database/platform-migration-manifest.ts"),"utf8").replace(/from (["'])(\.[^"']+)\1/g,(_m,q,p)=>"from "+q+combined+"/src/modules/platform/server/database/"+p+q);
    if(!text.includes("migration:platformPremiumCurrentAccessEventsMigration")&&!text.includes("migration: platformPremiumCurrentAccessEventsMigration")){text=once(text,'    Object.freeze({sourcePath:"src/modules/communities/server/database/migrations/0215_traderlink_community_stats_attribution.ts",migration:traderLinkCommunityStatsAttributionMigration}),','    Object.freeze({sourcePath:"src/modules/communities/server/database/migrations/0215_traderlink_community_stats_attribution.ts",migration:traderLinkCommunityStatsAttributionMigration}),\n    Object.freeze({sourcePath:"src/modules/platform/server/database/migrations/0216_platform_premium_current_access_events.ts",migration:platformPremiumCurrentAccessEventsMigration}),');text='import {platformPremiumCurrentAccessEventsMigration} from "'+join(own,"src/modules/platform/server/database/migrations/0216_platform_premium_current_access_events.ts")+'";\n'+text;}
    return{contents:text,loader:"ts",resolveDir:combined};
   });
  }}]});
  for(const relative of ["membership/platform-premium-authority-repository.ts","membership/platform-premium-whop-native.ts","privacy/platform-premium-signer-redaction.ts"]){const file=join(directory,"src/modules/platform/server",relative);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,readFileSync(select("src/modules/platform/server/"+relative)!));}
  const childPath=join(directory,"self.cjs");writeFileSync(childPath,bundled.outputFiles[0]!.contents);
  const child=spawnSync(process.execPath,[childPath,"--runtime-authority-unit"],{cwd:directory,encoding:"utf8",timeout:35000,env:{...process.env,NODE_ENV:"test",NODE_PATH:join(combined,"node_modules")},maxBuffer:128*1024});
  expect(child.status,child.stderr+child.stdout).toBe(0);const line=child.stdout.split("\n").find(value=>value.startsWith("CORE_CURRENT_ACCESS_RECEIPT "));expect(line,child.stdout).toBeTruthy();
  expect(JSON.parse(line!.slice("CORE_CURRENT_ACCESS_RECEIPT ".length))).toMatchObject({actualCoreAdmission:true,targetGuardMocked:true,actualStageQualified:false,actualNonOwnerSession:true,selfOnly:true,truthfulOutcome:outcome,networkRequests:0});
 }finally{rmSync(directory,{recursive:true,force:true});}
}
it.each(["paid","not_paid","unknown"] as const)("self-only genuine non-owner native session consumes %s without owner authority or invented payment facts",runSelfController,45000);
