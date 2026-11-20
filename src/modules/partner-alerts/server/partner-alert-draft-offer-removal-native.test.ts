// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// Actual registered SQLite/Core/Auth/session/writer; explicit synthetic Discord/seller
// observations and disqualifying fixture facts. No installed/provider/role proof.
let directory: string;
let bundlePath: string;
const sourceRoot = process.cwd();
// Keep native fixture construction scoped to native cases so affected UI-only
// checks do not rebuild or execute the unchanged native boundary.
describe("local native SQLite boundary", () => {
beforeAll(async () => {
  directory = mkdtempSync("/tmp/paid-offer-native-");
  const fixture = join(sourceRoot, "src/test/fixtures/premium-current-access-native-controller.ts");
  const original = readFileSync(fixture, "utf8"), marker = " const initial=capture();";
  expect(original.indexOf(marker)).toBeGreaterThan(0);
  expect(original.indexOf(marker)).toBe(original.lastIndexOf(marker));
  const prefix = original.slice(0, original.indexOf(marker));
  // Reuse native initialization only; the fixture's historical 204 qualifier
  // negatives have their own suite and execution-order assumptions.
  const negativesStart = prefix.indexOf(" // Correct actual204 must require");
  const negativesEnd = prefix.indexOf(" let core=bind(db);");
  expect(negativesStart).toBeGreaterThan(0);
  expect(negativesEnd).toBeGreaterThan(negativesStart);
  const initialization = (prefix.slice(0, negativesStart) + prefix.slice(negativesEnd))
    .replace("new PlatformDiscordSignInService(db,{now:()=>new Date(clock)})",
      "new PlatformDiscordSignInService(db,{now:()=>new Date(Date.parse(clock)-3600000)})");
  const secondActor = " const second=new PlatformDiscordSignInService(db,{now:()=>new Date(Date.parse(clock)-3600000)}).signIn({authSubject:\"99999\",username:\"second\",globalDisplayName:\"Second\",avatarHash:null,guildId:\"1559172784813514804\",roleIds:[],guildOwner:true,joinedAtUtc:null},{deferDemoActivation:true});\n"
    + " db.prepare(\"INSERT INTO platform_erasure_lifecycles VALUES(?,?,1,?,1,'live','synthetic_profile',1,?,NULL)\").run(randomUUID(),second.userId,randomUUID(),profileUntil);\n";
  const nativeInitialization = initialization.replace(" const realm:", secondActor + " const realm:");
  expect(nativeInitialization).not.toBe(initialization);
  const program = imports + nativeInitialization + exercise
    + "\n}\nrun().catch(error=>{console.error(error);process.exitCode=1;});\n";
  const programFile = join(directory, "native-input.ts");
  bundlePath = join(directory, "case.cjs");
  writeFileSync(programFile, program, { mode: 0o600, flag: "wx" });
  // esbuild runs in a plain Node child. jsdom's distinct typed-array realm is
  // valid for React controls but must never be supplied to a native build tool.
  const compiled = spawnSync(process.execPath, ["--input-type=module", "-e", nativeBuildScript,
    sourceRoot, fixture, programFile, bundlePath, process.env.TRADERLINK_PAID_OFFER_TEST_EVIDENCE_DIR ?? ""], {
    cwd: sourceRoot, encoding: "utf8", timeout: 25_000, maxBuffer: 128 * 1024,
  });
  expect(compiled.status, compiled.stderr + compiled.stdout).toBe(0);
  const line = compiled.stdout.split("\n").find(value => value.startsWith("PAID_OFFER_NATIVE_BUILD "));
  expect(line, compiled.stdout).toBeTruthy();
  console.log(line);
}, 30_000);
afterAll(() => { if (directory) rmSync(directory, { recursive: true, force: true }); });


const cases = ["standalone", "stale", "returned-changes", "returned-decline", "price-history",
  "foreign-owner", "forged-provenance", "atomic-rollback", "metadata-original-session", "metadata-grant"] as const;
it.each(cases)("current native owner offer retirement: %s", scenario => {
  const childDirectory = mkdtempSync(join(directory, "case-"));
  for (const file of ["membership/platform-premium-authority-repository.ts", "membership/platform-premium-whop-native.ts",
    "privacy/platform-premium-signer-redaction.ts"]) {
    const target = join(childDirectory, "src/modules/platform/server", file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(join(sourceRoot, "src/modules/platform/server", file)), { mode: 0o600 });
  }
  const child = spawnSync(process.execPath, [bundlePath, "--runtime-authority-unit", scenario], {
    cwd: childDirectory, env: { ...process.env, NODE_ENV: "test", NODE_PATH: join(sourceRoot, "node_modules") },
    encoding: "utf8", timeout: 30_000, maxBuffer: 128 * 1024,
  });
  expect(child.status, child.stderr + child.stdout).toBe(0);
  const line = child.stdout.split("\n").find(value => value.startsWith("PAID_OFFER_NATIVE "));
  expect(line, child.stdout).toBeTruthy();
  expect(JSON.parse(line!.slice("PAID_OFFER_NATIVE ".length))).toMatchObject({
    scenario, actualNativeCoreAndAuth: true, syntheticDiscordAndSeller: true, realNetwork: 0,
    actualStageQualified: false,
  });
}, 35_000);
});

const nativeBuildScript = `
import {build} from "esbuild";
import {createHash} from "node:crypto";
import {existsSync,readFileSync,writeFileSync} from "node:fs";
import {createRequire} from "node:module";
import {dirname,join,relative,resolve} from "node:path";
import {pathToFileURL} from "node:url";
const [sourceRoot,fixture,programFile,bundlePath,evidence]=process.argv.slice(1);
const program=readFileSync(programFile,"utf8"), require=createRequire(join(sourceRoot,"package.json"));
const bundled=await build({entryPoints:[fixture],bundle:true,platform:"node",format:"cjs",
 target:"node22",packages:"external",write:false,metafile:true,logLevel:"silent",plugins:[{
 name:"actual-current-source-native-owner-fixture",setup(plugin){
  plugin.onResolve({filter:/.*/},args=>{
   if(args.path==="server-only")return{path:require.resolve("next/dist/compiled/server-only/empty.js")};
   if(args.path.startsWith("@/")){
    const chosen=["",".ts",".tsx",".js",".json","/index.ts"].map(ext=>join(sourceRoot,args.path.slice(2)+ext)).find(existsSync);
    if(chosen)return{path:chosen};
   }
   if(args.path.startsWith(".")&&!resolve(args.resolveDir,args.path).startsWith(sourceRoot+"/"))throw Error("Native fixture escaped current source");
  });
  plugin.onLoad({filter:/\\.tsx?$/},args=>({
   contents:(args.path===fixture?program:readFileSync(args.path,"utf8"))
    .replace(/import\\.meta\\.url/g,JSON.stringify(pathToFileURL(args.path).href)),
   loader:args.path.endsWith(".tsx")?"tsx":"ts",resolveDir:dirname(args.path)
  }));
 }}]});
writeFileSync(bundlePath,bundled.outputFiles[0].contents,{mode:0o600,flag:"wx"});
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const consumed=Object.keys(bundled.metafile.inputs).sort().map(input=>{
 const absolute=resolve(sourceRoot,input);return{path:relative(sourceRoot,absolute),
 sha256:sha(absolute===fixture?program:readFileSync(absolute))};
});
const receipt={sourceRoot,entryTransformation:"Current native initialization; unrelated qualifier negatives omitted; explicit second synthetic principal/new native draft cases",
 schemaManifestSourceSha256:sha(readFileSync(join(sourceRoot,"src/modules/platform/server/database/platform-migration-manifest.ts"))),
 transformedProgramSha256:sha(program),bundleSha256:sha(bundled.outputFiles[0].contents),
 consumedSourceCount:consumed.length,consumedVectorSha256:sha(JSON.stringify(consumed)),consumed};
if(evidence){
 if(!evidence.startsWith("/home/traderlink/preview-runtime/paid-nonfinancial-checks-"))throw Error("Unexpected local evidence directory");
 writeFileSync(join(evidence,"consumed-source.json"),JSON.stringify(receipt,null,2)+"\\n",{flag:"wx",mode:0o600});
}
console.log("PAID_OFFER_NATIVE_BUILD "+JSON.stringify({transformedProgramSha256:receipt.transformedProgramSha256,
 bundleSha256:receipt.bundleSha256,consumedSourceCount:consumed.length,consumedVectorSha256:receipt.consumedVectorSha256}));
`;

const imports = `
import {PlatformSessionRepository} from "@/src/modules/platform/server/authentication/platform-session-repository";
import {PartnerAlertAdmission} from "@/src/modules/partner-alerts/server/partner-alert-admission";
import {PartnerAlertRequestWriter} from "@/src/modules/partner-alerts/server/partner-alert-request-writer";
import {readPartnerAlertMutation} from "@/src/modules/partner-alerts/server/partner-alert-request-boundary";
import {PARTNER_ALERT_IDEMPOTENCY_HEADER} from "@/src/modules/partner-alerts/contracts/partner-alert-request";
import {JOURNAL_ADMIN_IDEMPOTENCY_HEADER} from "@/src/modules/platform/contracts/journal-admin-request";
import {PlatformDiscordMembershipRepository} from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import {TraderLinkCommunityRepository} from "@/src/modules/communities/server/traderlink-community-repository";
import {recordPartnerAlertStripeSeller} from "@/src/modules/partner-alerts/server/database/partner-alert-stripe-seller-writer";
import {parsePartnerAlertWorkflowCommand} from "@/src/modules/partner-alerts/server/partner-alert-workflow";
import {requirePartnerAlertOfferCoverage} from "@/src/modules/partner-alerts/contracts/partner-alert-offer-coverage";

import {PartnerAlertValidationError} from "@/src/modules/partner-alerts/contracts/partner-alert-contracts";
`;
const exercise = `
 {
 const scenario=process.argv[3];
 assert.equal(db.prepare("SELECT count(*) FROM platform_schema_migrations").pluck().get(),platformMigrationManifest.length);
 PartnerAlertAdmission.bind(db);
 const memberships=new PlatformDiscordMembershipRepository(db), communities=new TraderLinkCommunityRepository(db);
 const allUsers=[actor.userId,second.userId];
 const inFixture=(operation:()=>void)=>core.runForUsers(allUsers,operation);
 let community:ReturnType<TraderLinkCommunityRepository["createFromVerifiedDiscordOwner"]>;
 let foreign:ReturnType<TraderLinkCommunityRepository["createFromVerifiedDiscordOwner"]>;
 inFixture(()=>{
   for(const [user,id] of [[actor,guildId],[second,"1559172784813514804"]] as const)
     memberships.upsertCurrent({userId:user.userId,guildId:id,username:"synthetic",globalDisplayName:null,avatarHash:null,
       roleIds:[],guildOwner:true,joinedAtUtc:null,verifiedAtUtc:clock});
   community=communities.createFromVerifiedDiscordOwner({ownerUserId:actor.userId,discordGuildId:guildId,
     slug:"synthetic-publisher",displayName:"Synthetic server",timestamp:clock});
   foreign=communities.createFromVerifiedDiscordOwner({ownerUserId:second.userId,discordGuildId:"1559172784813514804",
     slug:"foreign-publisher",displayName:"Foreign server",timestamp:clock});
   new PlatformOperatorRepository(db).insert({operatorGrantId:randomUUID(),userId:actor.userId,
     grantedByKind:"bootstrap_console",grantedByUserId:null,grantReceiptSha256:hash("SYNTHETIC_TEST_OPERATOR"),
     recoveryOfGrantId:null,grantedAtUtc:clock});
 });
 const cid=community!.communityId, fid=foreign!.communityId;
 const account=(id:string)=>"acct_fixture_"+id.replaceAll("-","");
 const writer=new PartnerAlertRequestWriter(db,{environment:process.env,now:()=>new Date(clock),createId:randomUUID,
   destinationGuildId:guildId,maximumActorAgeMs:30000,maximumDiscordEvidenceAgeMs:300000,
   outputBotUserId:"12349",outputConfigurationRef:"synthetic_output",stripeEnvironment:"sandbox",whopEnvironment:"sandbox",
   verifiedStripeOffer:(id,offer)=>({communityId:id,communityOwnerUserId:id===cid?actor.userId:second.userId,
     sellerAccountId:account(id),environment:"sandbox",offer,observedAtUtc:clock,validUntilUtc:profileUntil})});
 const revision=(id=cid)=>db.prepare("SELECT revision FROM partner_alert_partners WHERE community_id=?").pluck().get(id) as number|undefined;
 const request=(body:unknown,key:string,operator=false,who=actor)=>{
   const id=operator?cid:((body as {communityId:string}).communityId);
   return new Request("https://synthetic.example.com/"+(operator?"api/admin/journal/partner-channels/"+id:"api/partner-channels/communities/"+id),{
     method:"POST",headers:{host:"synthetic.example.com",origin:"https://synthetic.example.com","sec-fetch-site":"same-origin",
       "content-type":"application/json",cookie:platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)+"="+who.session.token,
       [operator?"x-traderlink-journal-admin-request":"x-traderlink-platform-mutation"]:"1",
       [operator?JOURNAL_ADMIN_IDEMPOTENCY_HEADER:PARTNER_ALERT_IDEMPOTENCY_HEADER]:key},body:JSON.stringify(body)});
 };
 const issue=async(command:Record<string,unknown>,options:{key?:string;operator?:boolean;who?:typeof actor;id?:string;expected?:number}={})=>{
   const id=options.id??cid, body={...command,communityId:id,expectedRevision:options.expected??revision(id)??0};
   const key=options.key??randomUUID(), req=request(body,key,options.operator,options.who);
   const prepared=await readPartnerAlertMutation(req,options.operator?{kind:"operator"}:{kind:"community_owner",communityId:id},
     {configuredOrigin:"https://synthetic.example.com"});
   return {result:writer.executeMutation(req,prepared),body,key};
 };
 const applied=async(command:Record<string,unknown>,options:Parameters<typeof issue>[1]={})=>{
   const result=await issue(command,options);assert.equal(result.result.kind,"applied",JSON.stringify(result));return result;
 };
 const paidImage=()=>hash(JSON.stringify(db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'partner_alert_%' ORDER BY name")
   .all().map((row:{name:string})=>[row.name,db.prepare('SELECT * FROM "'+row.name+'"').all()
     .map(value=>JSON.stringify(value)).sort()])));
 const deny=async(command:Record<string,unknown>,options:Parameters<typeof issue>[1]={},expectedKind="conflict")=>{
   const before=paidImage();let refusal:string|undefined;
   try{refusal=(await issue(command,options)).result.kind;}catch(error){
     if(options.who!==second)throw error;
     assert(error instanceof PartnerAlertValidationError && error.field==="communityOwner","Unexpected foreign-owner failure");
     refusal="forbidden";
   }
   assert.equal(refusal,options.who===second?"forbidden":scenario==="atomic-rollback"?"invalid":expectedKind,"Unexpected native failure class");
   assert.equal(paidImage(),before,"Refusal changed Paid state");
 };
 const policy={blockedServerNames:[],blockedPhrases:[],authorMode:"all_humans",allowedAuthorIds:[]};
 await applied({action:"savePartnerDraft",displayName:"Synthetic server",contentPolicy:policy});
 const m1=randomUUID(),m2=randomUUID();
 await applied({action:"saveMappingDraft",mappingId:m1,sourceChannelId:"40001",displayName:"Source one"});
 await applied({action:"saveMappingDraft",mappingId:m2,sourceChannelId:"40002",displayName:"Source two"});
 const map=(id=m1)=>db.prepare("SELECT * FROM partner_alert_mappings WHERE mapping_id=?").get(id) as Record<string,unknown>;
 const offers=(offerId:string)=>db.prepare("SELECT * FROM partner_alert_offers WHERE offer_id=? ORDER BY version").all(offerId) as Record<string,unknown>[];
 const offerId=randomUUID();
 const makeOffer=(version:number,mappingIds:readonly string[],id=cid,oid=offerId)=>({offerId:oid,communityId:id,version,
   kind:mappingIds.length===1?"channel":"package",title:"Synthetic offer",mappingIds,currency:{code:"USD",minorUnitDigits:2},
   amountMinor:1000,cadence:{unit:"calendar_month",count:1},billingProvider:"stripe"});
 const seller=(id=cid,owner=actor.userId)=>inFixture(()=>recordPartnerAlertStripeSeller(db,{communityId:id,ownerUserId:owner,
   environment:"sandbox",state:"ready",accountId:account(id),atMs:Date.parse(clock)}));
 const saveOffer=async(version:number,mappingIds:readonly string[])=>{seller();return applied({action:"saveOfferVersion",offer:makeOffer(version,mappingIds)});};
 const remove=()=>({action:"removeDraftMapping",mappingId:m1});
 const change=()=>({action:"saveMappingDraft",mappingId:m1,sourceChannelId:"40003",displayName:"Source three"});
 await saveOffer(1,[m1,m2]);
 const removeOffer=(version=1)=>({action:"removeDraftOffer",offerId,expectedLatestOfferVersion:version});
 if(scenario==="standalone"){
   await saveOffer(2,[m2]);
   const other=randomUUID();await applied({action:"saveOfferVersion",offer:makeOffer(1,[m1],cid,other)});
   const rows=JSON.stringify([map(m1),map(m2),offers(other)]);
   const immutable=JSON.stringify(db.prepare("SELECT offer_id,version,offer_json FROM partner_alert_offers ORDER BY offer_id,version").all());
   const links=JSON.stringify(db.prepare("SELECT * FROM partner_alert_offer_channels ORDER BY offer_id,offer_version,mapping_id").all());
   const removed=await applied(removeOffer(2));
   assert(offers(offerId).every(row=>row.review_state==="withdrawn"));
   assert.equal(JSON.stringify([map(m1),map(m2),offers(other)]),rows);
   assert.equal(JSON.stringify(db.prepare("SELECT offer_id,version,offer_json FROM partner_alert_offers ORDER BY offer_id,version").all()),immutable);
   assert.equal(JSON.stringify(db.prepare("SELECT * FROM partner_alert_offer_channels ORDER BY offer_id,offer_version,mapping_id").all()),links);
   assert.equal((removed.result as {result:{resourceVersion:number}}).result.resourceVersion,2);
   const image=paidImage();assert.deepEqual((await issue(removeOffer(2),{key:removed.key,expected:removed.body.expectedRevision})).result,removed.result);assert.equal(paidImage(),image);
   await applied(change());
   assert(offers(offerId).every(row=>row.review_state==="withdrawn"),"Own exact standalone provenance must permit later source correction without resurrection");
 }else if(scenario==="stale"){
   await deny(removeOffer(2));const expected=revision();
   await applied({action:"savePartnerDraft",displayName:"Synthetic server",contentPolicy:{...policy,blockedPhrases:["new"]}});
   await deny(removeOffer(),{expected});
 }else if(scenario==="returned-changes"||scenario==="returned-decline"){
   await applied({action:"submitRequest",rulesVersion:1});
   await applied({action:scenario==="returned-changes"?"requestChanges":"declinePartner",reason:"Actual synthetic review decision"},{operator:true});
   await saveOffer(2,[m1,m2]);
   assert.equal(db.prepare("SELECT submitted_application_revision FROM partner_alert_partners WHERE community_id=?").pluck().get(cid),null);
   await deny(removeOffer(2));
 }else if(scenario==="price-history"){
   inFixture(()=>{
     db.prepare("UPDATE partner_alert_offers SET review_state='approved' WHERE offer_id=?").run(offerId);
     const sid=db.prepare("SELECT seller_id FROM partner_alert_stripe_sellers WHERE community_id=?").pluck().get(cid);
     db.prepare("INSERT INTO partner_alert_stripe_prices VALUES(?,?,'sandbox',?,?,1,'price_fixture','usd',1000,?,NULL)").run(sid,cid,account(cid),offerId,Date.parse(clock));
     db.prepare("UPDATE partner_alert_offers SET review_state='withdrawn' WHERE offer_id=?").run(offerId);
     db.prepare("INSERT INTO partner_alert_audit_events VALUES(?,?,?,'offer.draft_retired',?,?,?)").run(randomUUID(),cid,actor.userId,offerId,JSON.stringify({mappingId:m1,offerVersion:1}),clock);
   });
   await saveOffer(2,[m1,m2]);await deny(removeOffer(2));
 }else if(scenario==="foreign-owner"){
   await deny(removeOffer(),{who:second});
 }else if(scenario==="forged-provenance"){
   inFixture(()=>{
     db.prepare("UPDATE partner_alert_offers SET review_state='withdrawn' WHERE offer_id=?").run(offerId);
     db.prepare("INSERT INTO partner_alert_audit_events VALUES(?,?,?,'offer.draft_retired_standalone',?,?,?)")
       .run(randomUUID(),cid,actor.userId,offerId,JSON.stringify({offerVersion:1,removedAtLatestVersion:1,requestId:randomUUID()}),clock);
   });
   await saveOffer(2,[m1,m2]);await deny(removeOffer(2));
 }else if(scenario==="metadata-original-session"||scenario==="metadata-grant"){
   const original=request({},randomUUID());const req=new Request(original.url,{method:"GET",headers:original.headers});
   const selected={kind:"inspection_contact" as const,communityId:cid};
   const first=writer.preauthorizeMetadataRead(req,selected);
   assert.equal(first.reviewerDiscordUserId,"12345");writer.revalidateMetadataRead(req,first);
   assert.throws(()=>writer.revalidateMetadataRead(req,first),"Consumed metadata permit reused");
   const operator=writer.preauthorizeMetadataRead(req,{kind:"operator_resources",communityId:cid,mappingId:m1});
   assert.equal(operator.mappingRevision,1);assert.equal(operator.sourceChannelId,"40001");writer.revalidateMetadataRead(req,operator);
   const pending=writer.preauthorizeMetadataRead(req,selected);await Promise.resolve();
   if(scenario==="metadata-original-session")new PlatformSessionRepository(db).revokeActiveSessionForUser({userId:actor.userId,
     sessionId:actor.session.session.sessionId,timestamp:clock});
   else inFixture(()=>{const repo=new PlatformOperatorRepository(db);repo.revoke({operatorGrantId:repo.findActive()!.operatorGrantId,
     revokedByKind:"operator",revokedByUserId:actor.userId,reasonCode:"synthetic_review",revokedAtUtc:clock});});
   const before=paidImage();assert.throws(()=>writer.revalidateMetadataRead(req,pending));assert.equal(paidImage(),before);
 }else if(scenario==="atomic-rollback"){
   inFixture(()=>db.prepare("UPDATE partner_alert_partners SET revision=? WHERE community_id=?").run(Number.MAX_SAFE_INTEGER,cid));
   await deny(removeOffer());assert(offers(offerId).every(row=>row.review_state==="draft"));
 }else throw Error("Unknown finite offer scenario");
 // New owner action never becomes an operator method or carries client authority.
 assert.throws(()=>parsePartnerAlertWorkflowCommand({action:"removeDraftOffer",communityId:cid,expectedRevision:1,offerId,expectedLatestOfferVersion:1},{kind:"operator"}));
 assert.throws(()=>parsePartnerAlertWorkflowCommand({action:"removeDraftOffer",communityId:cid,expectedRevision:1,offerId,expectedLatestOfferVersion:1,actorUserId:actor.userId},{kind:"community_owner",communityId:cid}));
 assert.throws(()=>requirePartnerAlertOfferCoverage(cid,[m1],[]));
 assert.equal(networkRequests,0);assert.deepEqual(db.pragma("foreign_key_check"),[]);
 const receipt={scenario,actualNativeCoreAndAuth:true,syntheticDiscordAndSeller:true,realNetwork:networkRequests,actualStageQualified:false};
 db.close();console.log("PAID_OFFER_NATIVE "+JSON.stringify(receipt));
 }
`;

