// @vitest-environment jsdom
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PARTNER_ALERT_IDEMPOTENCY_HEADER as UI_IDEMPOTENCY_HEADER } from "../contracts/partner-alert-request";
import { CommunityPartnerChannelSetup } from "@/app/(dashboard)/communities/[communitySlug]/partner-channels/community-partner-channel-setup";

// The shell is a rendering port only. Client fetch responses below are explicit
// synthetic UI fixtures, not native authorization, appearance or provider proof.
vi.mock("@/app/dashboard-template", async () => {
  const React = await import("react");
  return {
    DashboardPage: ({ children }: { children: ReactNode }) => React.createElement("section", null, children),
    DashboardPanel: ({ title, children }: { title: string; children: ReactNode }) =>
      React.createElement("section", null, React.createElement("h2", null, title), children),
    DashboardSecondaryAction: ({ children, href }: { children: ReactNode; href?: string }) =>
      React.createElement("a", { href }, children),
  };
});

/** Current registered SQLite/Core/Auth/session and normal owner/operator commands.
 * Discord observations, seller verification and disqualifying stored facts are
 * explicit SYNTHETIC fixtures. No network, provider, hosted or role effect proof. */
let directory: string;
let bundlePath: string;
const sourceRoot = process.cwd();
// Keep native fixture construction scoped to native cases so affected UI-only
// checks do not rebuild or execute the unchanged native boundary.
describe("local native SQLite boundary", () => {
beforeAll(async () => {
  directory = mkdtempSync("/tmp/paid-draft-native-");
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
    sourceRoot, fixture, programFile, bundlePath, process.env.TRADERLINK_PAID_DRAFT_TEST_EVIDENCE_DIR ?? ""], {
    cwd: sourceRoot, encoding: "utf8", timeout: 25_000, maxBuffer: 128 * 1024,
  });
  expect(compiled.status, compiled.stderr + compiled.stdout).toBe(0);
  const line = compiled.stdout.split("\n").find(value => value.startsWith("PAID_DRAFT_NATIVE_BUILD "));
  expect(line, compiled.stdout).toBeTruthy();
  console.log(line);
}, 30_000);
afterAll(() => { if (directory) rmSync(directory, { recursive: true, force: true }); });


const cases = ["remove-readd", "version-remove", "version-change", "stale", "atomic-rollback",
  "returned-changes", "returned-decline", "pending-review", "historical-approval",
  "operator-withdrawal", "price-history", "unrelated-preservation", "active-new", "foreign-owner", "preserved-row-limit"] as const;
it.each(cases)("current native owner draft correction: %s", scenario => {
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
  const line = child.stdout.split("\n").find(value => value.startsWith("PAID_DRAFT_NATIVE "));
  expect(line, child.stdout).toBeTruthy();
  expect(JSON.parse(line!.slice("PAID_DRAFT_NATIVE ".length))).toMatchObject({
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
 if(!evidence.startsWith("/home/traderlink/preview-runtime/paid712-draft-checks-"))throw Error("Unexpected local evidence directory");
 writeFileSync(join(evidence,"consumed-source.json"),JSON.stringify(receipt,null,2)+"\\n",{flag:"wx",mode:0o600});
}
console.log("PAID_DRAFT_NATIVE_BUILD "+JSON.stringify({transformedProgramSha256:receipt.transformedProgramSha256,
 bundleSha256:receipt.bundleSha256,consumedSourceCount:consumed.length,consumedVectorSha256:receipt.consumedVectorSha256}));
`;

const imports = `
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
 if(scenario==="remove-readd"){
   await saveOffer(1,[m1,m2]);
   const beforeLinks=JSON.stringify(db.prepare("SELECT * FROM partner_alert_offer_channels ORDER BY offer_id,offer_version,mapping_id").all());
   const operation=await applied(remove());const removedRevision=revision();
   assert.equal(map().review_state,"withdrawn");assert.equal(offers(offerId)[0].review_state,"withdrawn");
   await applied({action:"saveMappingDraft",mappingId:m1,sourceChannelId:"40001",displayName:"Source one"});
   assert.equal(map().mapping_id,m1);assert.equal(map().revision,3);assert.equal(map().review_state,"draft");
   assert.equal(offers(offerId)[0].review_state,"withdrawn");assert.equal(JSON.stringify(db.prepare("SELECT * FROM partner_alert_offer_channels ORDER BY offer_id,offer_version,mapping_id").all()),beforeLinks);
   const beforeReplay=paidImage();const replay=await issue(remove(),{key:operation.key,expected:operation.body.expectedRevision});
   assert.deepEqual(replay.result,operation.result);assert.equal(paidImage(),beforeReplay);assert.equal(revision(),Number(removedRevision)+1);
   await deny({...remove(),mappingId:m2},{key:operation.key});
   await deny({action:"saveMappingDraft",mappingId:randomUUID(),sourceChannelId:"40001",displayName:"Duplicate"});
 }else if(scenario==="version-remove"||scenario==="version-change"){
   await saveOffer(1,[m1,m2]);await saveOffer(2,[m2]);
   const latest=JSON.stringify(offers(offerId)[1]),links=JSON.stringify(db.prepare("SELECT * FROM partner_alert_offer_channels ORDER BY offer_id,offer_version,mapping_id").all());
   await applied(scenario==="version-remove"?remove():change());
   assert.equal(offers(offerId)[0].review_state,"withdrawn");assert.equal(JSON.stringify(offers(offerId)[1]),latest);
   assert.equal(JSON.stringify(db.prepare("SELECT * FROM partner_alert_offer_channels ORDER BY offer_id,offer_version,mapping_id").all()),links);
   if(scenario==="version-remove")await applied({action:"saveMappingDraft",mappingId:m1,sourceChannelId:"40001",displayName:"Source one"});
   assert.equal(offers(offerId)[0].review_state,"withdrawn");assert.equal(JSON.stringify(offers(offerId)[1]),latest);
   const req=new Request("https://synthetic.example.com/api/partner-channels/communities/"+cid,{headers:{host:"synthetic.example.com",
     cookie:platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)+"="+actor.session.token}});
   const visible=writer.run(req,scope=>scope.readPartner(cid,"partner")).offers;
   assert.equal(visible.length,1);assert.equal(visible[0].version,2);
 }else if(scenario==="stale"){
   const frozen=revision();
   await applied({action:"savePartnerDraft",displayName:"Synthetic server",contentPolicy:{...policy,blockedPhrases:["changed"]}});
   await deny(remove(),{expected:frozen});await deny(change(),{expected:frozen});
 }else if(scenario==="atomic-rollback"){
   await saveOffer(1,[m1,m2]);
   // Keep the genuine schema unchanged. A valid maximum-safe stored revision
   // makes the post-write projected revision invalid, after draft retirement,
   // mapping update and repository audit/receipt were attempted in the writer.
   inFixture(()=>db.prepare("UPDATE partner_alert_partners SET revision=? WHERE community_id=?").run(Number.MAX_SAFE_INTEGER,cid));
   await deny(remove());assert.equal(map().review_state,"draft");assert.equal(offers(offerId)[0].review_state,"draft");
   assert.equal(revision(),Number.MAX_SAFE_INTEGER);
 }else if(scenario==="returned-changes"||scenario==="returned-decline"||scenario==="pending-review"){
   await saveOffer(1,[m1,m2]);
   await applied({action:"submitRequest",rulesVersion:1});
   if(scenario!=="pending-review")await applied({action:scenario==="returned-changes"?"requestChanges":"declinePartner",reason:"Synthetic review decision"},{operator:true});
   const row=db.prepare("SELECT status,review_requested,submitted_application_revision FROM partner_alert_partners WHERE community_id=?").get(cid) as Record<string,unknown>;
   if(scenario!=="pending-review"){assert.deepEqual(row,{status:"draft",review_requested:0,submitted_application_revision:null});assert.equal(map().ever_approved,0);}
   await deny(remove());await deny(change());
   if(scenario==="pending-review")await deny({action:"saveMappingDraft",mappingId:randomUUID(),sourceChannelId:"40004",displayName:"New source"});
 }else if(scenario==="historical-approval"){
   await saveOffer(1,[m1,m2]);
   inFixture(()=>{
     db.prepare("UPDATE partner_alert_offers SET review_state='withdrawn' WHERE offer_id=?").run(offerId);
     db.prepare("INSERT INTO partner_alert_audit_events VALUES(?,?,?,'offer.draft_retired',?,?,?)").run(randomUUID(),cid,actor.userId,offerId,JSON.stringify({mappingId:m1,offerVersion:1}),clock);
     db.prepare("INSERT INTO partner_alert_audit_events VALUES(?,?,?,'offer.approved',?,?,?)").run(randomUUID(),cid,actor.userId,offerId,JSON.stringify({resourceVersion:1}),clock);
   });
   await deny(remove());await deny(change());
 }else if(scenario==="operator-withdrawal"){
   await applied({action:"withdrawMapping",mappingId:m1,reason:"Synthetic operator withdrawal"},{operator:true});
   await deny({action:"saveMappingDraft",mappingId:m1,sourceChannelId:"40001",displayName:"Source one"});
 }else if(scenario==="price-history"){
   await saveOffer(1,[m1,m2]);
   inFixture(()=>{
     db.prepare("UPDATE partner_alert_offers SET review_state='approved' WHERE offer_id=?").run(offerId);
     const sid=db.prepare("SELECT seller_id FROM partner_alert_stripe_sellers WHERE community_id=?").pluck().get(cid);
     db.prepare("INSERT INTO partner_alert_stripe_prices VALUES(?,?,'sandbox',?,?,1,'price_fixture','usd',1000,?,NULL)").run(sid,cid,account(cid),offerId,Date.parse(clock));
     // The real review-closed trigger forbids approved->draft. Preserve it:
     // an actual schema-valid withdrawn version retains its price proof. An
     // explicit own-retirement fixture isolates price history from current state.
     db.prepare("UPDATE partner_alert_offers SET review_state='withdrawn' WHERE offer_id=?").run(offerId);
     db.prepare("INSERT INTO partner_alert_audit_events VALUES(?,?,?,'offer.draft_retired',?,?,?)").run(randomUUID(),cid,actor.userId,offerId,JSON.stringify({mappingId:m1,offerVersion:1}),clock);
   });
   await deny(remove());await deny(change());
 }else if(scenario==="unrelated-preservation"){
   await applied({action:"savePartnerDraft",displayName:"Foreign server",contentPolicy:policy},{id:fid,who:second});
   const fm=randomUUID(),fo=randomUUID();
   await applied({action:"saveMappingDraft",mappingId:fm,sourceChannelId:"50001",displayName:"Foreign source"},{id:fid,who:second});
   seller(fid,second.userId);
   await applied({action:"saveOfferVersion",offer:makeOffer(1,[fm],fid,fo)},{id:fid,who:second});
   inFixture(()=>{
     db.prepare("UPDATE partner_alert_offers SET review_state='approved' WHERE offer_id=?").run(fo);
     const sid=db.prepare("SELECT seller_id FROM partner_alert_stripe_sellers WHERE community_id=?").pluck().get(fid);
     db.prepare("INSERT INTO partner_alert_stripe_prices VALUES(?,?,'sandbox',?,?,1,'price_foreign','usd',1000,?,NULL)").run(sid,fid,account(fid),fo,Date.parse(clock));
   });
   const foreignBefore=JSON.stringify([map(fm),offers(fo),db.prepare("SELECT * FROM partner_alert_stripe_prices WHERE community_id=?").all(fid)]);
   const otherMap=JSON.stringify(map(m2));await applied(remove());
   assert.equal(JSON.stringify([map(fm),offers(fo),db.prepare("SELECT * FROM partner_alert_stripe_prices WHERE community_id=?").all(fid)]),foreignBefore);
   assert.equal(JSON.stringify(map(m2)),otherMap);
 }else if(scenario==="active-new"){
   inFixture(()=>db.prepare("UPDATE partner_alert_partners SET status='active' WHERE community_id=?").run(cid));
   await applied({action:"saveMappingDraft",mappingId:randomUUID(),sourceChannelId:"40004",displayName:"New draft"});
   await deny(remove());await deny(change());
 }else if(scenario==="preserved-row-limit"){
   await saveOffer(1,[m1]);
   inFixture(()=>{
     const insert=db.prepare("INSERT INTO partner_alert_mappings(mapping_id,community_id,source_guild_id,source_channel_id,display_name,revision,review_state,created_at_utc,updated_at_utc) VALUES(?,?,?,?,?,1,'withdrawn',?,?)");
     for(let i=0;i<248;i++)insert.run(randomUUID(),cid,guildId,String(60000+i),"Preserved unrelated draft "+i,clock,clock);
   });
   assert.equal(db.prepare("SELECT count(*) FROM partner_alert_mappings WHERE community_id=?").pluck().get(cid),250);
   await applied(remove());
   await deny({action:"saveMappingDraft",mappingId:randomUUID(),sourceChannelId:"90000",displayName:"New source"},{},"invalid");
   await applied({action:"saveMappingDraft",mappingId:m1,sourceChannelId:"40001",displayName:"Source one"});
   assert.equal(map().review_state,"draft");assert.equal(offers(offerId)[0].review_state,"withdrawn");
   assert.equal(db.prepare("SELECT count(*) FROM partner_alert_mappings WHERE community_id=?").pluck().get(cid),250);
 }else if(scenario==="foreign-owner"){
   await deny(remove(),{who:second});await deny(change(),{who:second});
 }else throw Error("Unknown finite scenario");
 // New owner action never becomes an operator method or carries client authority.
 assert.throws(()=>parsePartnerAlertWorkflowCommand({action:"removeDraftMapping",communityId:cid,expectedRevision:1,mappingId:m1},{kind:"operator"}));
 assert.throws(()=>parsePartnerAlertWorkflowCommand({action:"removeDraftMapping",communityId:cid,expectedRevision:1,mappingId:m1,actorUserId:actor.userId},{kind:"community_owner",communityId:cid}));
 assert.throws(()=>requirePartnerAlertOfferCoverage(cid,[m1],[]));
 assert.equal(networkRequests,0);assert.deepEqual(db.pragma("foreign_key_check"),[]);
 const receipt={scenario,actualNativeCoreAndAuth:true,syntheticDiscordAndSeller:true,realNetwork:networkRequests,actualStageQualified:false};
 db.close();console.log("PAID_DRAFT_NATIVE "+JSON.stringify(receipt));
 }
`;

type UiDto = ReturnType<typeof uiDto>;
function uiDto(covered = false) {
  const communityId = "10000000-0000-4000-8000-000000000001";
  const mappingId = "20000000-0000-4000-8000-000000000002";
  return { communityId, displayName: "Synthetic server", status: "draft", revision: 4,
    currentAgreementId: null, approvedAtUtc: null, reviewRequested: false, personalInspectionConfirmed: false,
    contentPolicy: { blockedServerNames: [] as string[], blockedPhrases: [] as string[],
      authorMode: "all_humans", allowedAuthorIds: [] as string[] },
    mappings: [{ mappingId, sourceChannelId: "40001", displayName: "Source one", revision: 1,
      reviewState: "draft", everApproved: false, approvedRevision: null,
      destinationGuildId: null, destinationChannelId: null, destinationRoleId: null }],
    offers: covered ? [{ reviewState: "draft", offer: {
      offerId: "30000000-0000-4000-8000-000000000003", communityId, version: 1,
      kind: "channel", title: "Current offer", mappingIds: [mappingId], billingProvider: "stripe",
      amountMinor: 1000, currency: { code: "USD", minorUnitDigits: 2 },
      cadence: { unit: "calendar_month", count: 1 },
    } }] : [],
    latestAgreement: null,
  };
}
let uiRoot: Root | null = null;
let uiContainer: HTMLDivElement | null = null;
afterEach(async () => {
  if (uiRoot) await act(async () => { uiRoot!.unmount(); });
  uiRoot = null; uiContainer?.remove(); uiContainer = null;
  vi.unstubAllGlobals();
});
async function flushUi() {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
}
function control(text: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>("button,[role=button]")]
    .find(element => element.textContent?.trim() === text);
  if (!found) throw Error("Missing actual control: " + text);
  return found;
}
async function clickUi(text: string) {
  await act(async () => { control(text).click(); }); await flushUi();
}
async function setUiText(element: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, text);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function authorModeUi() {
  const combo = document.querySelector<HTMLElement>("[role=combobox]")!;
  await act(async () => { combo.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })); });
  await flushUi();
  const option = [...document.querySelectorAll<HTMLElement>("[role=option]")]
    .find(element => element.textContent === "Specific people or bots")!;
  expect(option).toBeTruthy();
  await act(async () => { option.click(); }); await flushUi();
}
async function mountUi(dto: UiDto, options: { unknownOnce?: boolean; conflict?: boolean;
  retryResponses?: (() => Response)[] } = {}) {
  const writes: { body: Record<string, unknown>; key: string }[] = [];
  const receipts = new Map<string, object>();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      const key = new Headers(init.headers).get(UI_IDEMPOTENCY_HEADER) ?? "";
      writes.push({ body, key });
      if (options.conflict) return Response.json({ ok: false }, { status: 409 });
      if (!receipts.has(key)) {
        if (body.action === "savePartnerDraft") {
          dto.contentPolicy = body.contentPolicy as UiDto["contentPolicy"]; dto.revision += 1;
        }
        receipts.set(key, { ok: true, result: { communityId: dto.communityId,
          partnerRevision: Number(body.expectedRevision) + 1,
          resourceId: body.mappingId ?? (body.offer as Record<string, unknown> | undefined)?.offerId ?? dto.communityId,
          resourceVersion: body.mappingId ? (dto.mappings.find(mapping => mapping.mappingId === body.mappingId)?.revision ?? 0) + 1
            : body.offer ? (body.offer as Record<string, unknown>).version : Number(body.expectedRevision) + 1,
          state: body.action === "removeDraftMapping" ? "withdrawn"
            : body.action === "submitRequest" ? dto.status === "draft" ? "awaiting_approval" : dto.status : "draft" } });
        if (options.unknownOnce) throw Error("Synthetic transport loss after accepted write");
      }
      const retry = options.retryResponses?.shift();
      if (retry) return retry();
      return Response.json(receipts.get(key));
    }
    if (url.endsWith("/source-channels")) return Response.json({ ok: true, result: {
      guildName: "Synthetic server", channels: [{ channelId: "40001", name: "Source one" },
        { channelId: "40002", name: "Source two" }], unavailableChannels: [],
    } });
    return Response.json({ ok: true, result: dto });
  }));
  uiContainer = document.createElement("div"); document.body.append(uiContainer);
  uiRoot = createRoot(uiContainer);
  await act(async () => { uiRoot!.render(createElement(CommunityPartnerChannelSetup,
    { communityId: dto.communityId, stripeStatus: "ready", stripeOfferDrafts: true })); });
  await flushUi();
  return writes;
}

it("keeps zero-offer Submit disabled after consent and allows pending inspection with valid coverage", async () => {
  const dto = uiDto(); const writes = await mountUi(dto);
  await clickUi("6. Review");
  await act(async () => { document.querySelector<HTMLInputElement>("input[type=checkbox]")!.click(); });
  expect((control("Submit for review") as HTMLButtonElement).disabled).toBe(true);
  expect(writes).toHaveLength(0);
  await act(async () => { uiRoot!.unmount(); }); uiRoot = null; uiContainer!.remove(); uiContainer = null;
  await mountUi(uiDto(true)); await clickUi("6. Review");
  await act(async () => { document.querySelector<HTMLInputElement>("input[type=checkbox]")!.click(); });
  expect((control("Submit for review") as HTMLButtonElement).disabled).toBe(false);
});

it("saves authors and details separately while preserving the other step's unsaved edits", async () => {
  const dto = uiDto(); const writes = await mountUi(dto);
  await setUiText(document.querySelector<HTMLTextAreaElement>("textarea")!, "Unsaved details");
  await clickUi("5. Content rules"); await authorModeUi();
  await setUiText(document.querySelector<HTMLTextAreaElement>("textarea")!, "50001");
  await clickUi("Save content rules");
  expect(writes).toHaveLength(1);
  expect(writes[0].body.contentPolicy).toMatchObject({ blockedPhrases: [], authorMode: "allowlist", allowedAuthorIds: ["50001"] });
  await setUiText(document.querySelector<HTMLTextAreaElement>("textarea")!, "50002");
  await clickUi("1. Community details");
  expect(document.querySelector<HTMLTextAreaElement>("textarea")!.value).toBe("Unsaved details");
  await clickUi("Save changes");
  expect(writes).toHaveLength(2);
  expect(writes[1].body.contentPolicy).toMatchObject({ blockedPhrases: ["Unsaved details"], authorMode: "allowlist", allowedAuthorIds: ["50001"] });
  await clickUi("5. Content rules");
  expect(document.querySelector<HTMLTextAreaElement>("textarea")!.value).toBe("50002");
});

it("retains the exact unknown save payload and key and freezes fields until identical retry resolves it", async () => {
  const dto = uiDto(); const writes = await mountUi(dto, { unknownOnce: true });
  await clickUi("5. Content rules"); await authorModeUi();
  await setUiText(document.querySelector<HTMLTextAreaElement>("textarea")!, "50001");
  await clickUi("Save content rules");
  expect(writes).toHaveLength(1);
  expect(document.querySelector<HTMLTextAreaElement>("textarea")!.disabled).toBe(true);
  dto.revision += 9; // A newer server state never rebases the unknown command.
  await clickUi("Retry same save");
  expect(writes).toHaveLength(2); expect(writes[1]).toEqual(writes[0]);
  expect(dto.contentPolicy.allowedAuthorIds).toEqual(["50001"]);
  expect(document.querySelector<HTMLTextAreaElement>("textarea")!.disabled).toBe(false);
});

it.each([
  ["expired session", () => Response.json({ ok: false, code: "sign_in_required" }, { status: 401 })],
  ["revoked identity", () => Response.json({ ok: false, code: "forbidden" }, { status: 403 })],
  ["conflict", () => Response.json({ ok: false, code: "conflict" }, { status: 409 })],
  ["rate limit", () => Response.json({ ok: false, code: "rate_limited" }, { status: 429 })],
  ["unavailable retry", () => Response.json({ ok: false }, { status: 503 })],
  ["malformed JSON", () => new Response("{", { headers: { "content-type": "application/json" } })],
  ["null acknowledgement", () => Response.json(null)],
  ["generic success", () => Response.json({ ok: true })],
  ["foreign result", () => Response.json({ ok: true, result: { communityId: "foreign", partnerRevision: 5,
    resourceId: "foreign", resourceVersion: 1, state: "draft" } })],
] as const)("keeps a committed unknown save frozen after %s until its original result is confirmed", async (_name, retryResponse) => {
  const dto = uiDto(), originalRevision = dto.revision;
  const writes = await mountUi(dto, { unknownOnce: true, retryResponses: [retryResponse] });
  await clickUi("5. Content rules"); await authorModeUi();
  await setUiText(document.querySelector<HTMLTextAreaElement>("textarea")!, "50001");
  await clickUi("Save content rules");
  expect(dto.revision).toBe(originalRevision + 1); // First write committed at the explicit synthetic port.
  expect(dto.contentPolicy.allowedAuthorIds).toEqual(["50001"]);
  await clickUi("Retry same save");
  expect(writes).toHaveLength(2); expect(writes[1]).toEqual(writes[0]);
  expect(document.querySelector<HTMLTextAreaElement>("textarea")!.disabled).toBe(true);
  expect((control("Save content rules") as HTMLButtonElement).disabled).toBe(true);
  expect(document.body.textContent).toContain("The save outcome could not be confirmed");
  expect(document.body.textContent).not.toContain("No publishing change was made");
  expect(document.body.textContent).not.toContain("Reload before saving");
  await clickUi("Save content rules"); expect(writes).toHaveLength(2); // No replacement command.
  dto.revision += 9; // A later view cannot replace the original expected revision/key.
  await clickUi("Retry same save");
  expect(writes).toHaveLength(3); expect(writes[2]).toEqual(writes[0]);
  expect(document.querySelector<HTMLTextAreaElement>("textarea")!.disabled).toBe(false);
  expect(document.body.textContent).toContain("This setup step was saved");
});

it("confirms displayed offer/version and retains the displayed revision for a conflicting source removal", async () => {
  const dto = uiDto(true); const writes = await mountUi(dto, { conflict: true });
  await clickUi("3. Source channels"); await clickUi("Remove");
  expect(document.querySelector("[role=dialog]")!.textContent).toContain("Current offer · version 1");
  expect(document.querySelector("[role=dialog]")!.textContent).toContain("Earlier unpublished offer versions");
  dto.revision += 1; // The confirmed displayed revision must remain four.
  await clickUi("Remove draft channel");
  expect(writes).toHaveLength(1);
  expect(writes[0].body).toMatchObject({ action: "removeDraftMapping", expectedRevision: 4,
    mappingId: dto.mappings[0].mappingId });
  expect(document.body.textContent).toContain("Reload before saving");
});

it.each(["draft", "active", "setup_required"])("confirms the existing native submission result for %s publishers", async status => {
  const dto = uiDto(true); dto.status = status;
  const writes = await mountUi(dto);
  await clickUi("6. Review");
  await act(async () => { document.querySelector<HTMLInputElement>("input[type=checkbox]")!.click(); });
  await clickUi("Submit for review");
  expect(writes).toHaveLength(1); expect(writes[0].body.action).toBe("submitRequest");
  expect(document.body.textContent).toContain("This setup step was saved");
  expect(document.body.textContent).not.toContain("The save outcome could not be confirmed");
});
