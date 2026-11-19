// @vitest-environment node
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { afterAll, beforeAll, expect, it } from "vitest";

/** Actual current registered SQLite, Core, Auth/session/operator, request parsing,
 * provider-plan consumption and approval transaction. Provider observations and
 * initial review rows are explicitly SYNTHETIC; no staging/provider proof. */
let directory: string;
let bundlePath: string;
const sourceRoot = process.cwd();
beforeAll(async () => {
  directory = mkdtempSync("/tmp/paid-context-native-");
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
  const initialization = prefix.slice(0, negativesStart) + prefix.slice(negativesEnd);
  const program = imports + initialization + exercise
    + "\n}\nrun().catch(error=>{console.error(error);process.exitCode=1;});\n";
  const require = createRequire(import.meta.url);
  const bundled = await build({ entryPoints: [fixture], bundle: true, platform: "node", format: "cjs",
    target: "node22", packages: "external", write: false, logLevel: "silent", plugins: [{
      name: "current-source-native-context-no-authority-mocks", setup(plugin) {
        plugin.onResolve({ filter: /.*/ }, args => {
          if (args.path === "server-only") return { path: require.resolve("next/dist/compiled/server-only/empty.js") };
          const relative = args.path.startsWith("@/") ? args.path.slice(2) : null;
          if (relative) {
            const selected = ["", ".ts", ".tsx", ".js", ".json", "/index.ts"]
              .map(ext => join(sourceRoot, relative + ext)).find(path => existsSync(path));
            if (selected) return { path: selected };
          }
          if (args.path.startsWith(".")) {
            const absolute = resolve(args.resolveDir, args.path);
            if (!absolute.startsWith(sourceRoot + "/")) throw Error("Fixture escaped assigned current source");
          }
          return undefined;
        });
        plugin.onLoad({ filter: /\.tsx?$/ }, args => ({
          contents: (args.path === fixture ? program : readFileSync(args.path, "utf8"))
            .replace(/import\.meta\.url/g, JSON.stringify(pathToFileURL(args.path).href)),
          loader: args.path.endsWith(".tsx") ? "tsx" : "ts", resolveDir: dirname(args.path),
        }));
      },
    }] });
  bundlePath = join(directory, "case.cjs");
  writeFileSync(bundlePath, bundled.outputFiles[0]!.contents, { mode: 0o600 });
}, 30_000);
afterAll(() => { if (directory) rmSync(directory, { recursive: true, force: true }); });

const cases = ["first-and-replay", "matching-context", "wrong-configuration", "lost-approved-context",
  "activated-mapping", "missing-inspection", "missing-offer", "expired-resource", "unauthorized",
  "enrollment-rollback", "expiry-rollback", "owner-save"] as const;
it.each(cases)("native approval context: %s", scenario => {
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
  const line = child.stdout.split("\n").find(value => value.startsWith("PAID_CONTEXT_NATIVE "));
  expect(line, child.stdout).toBeTruthy();
  expect(JSON.parse(line!.slice("PAID_CONTEXT_NATIVE ".length))).toEqual({
    scenario, actualNativeCoreAndAuth: true, actualWriterApproval: true, syntheticProviderFacts: true,
    realNetwork: 0, actualStageQualified: false,
  });
}, 35_000);

const imports = `
import {PartnerAlertAdmission} from "@/src/modules/partner-alerts/server/partner-alert-admission";
import {PartnerAlertRequestWriter} from "@/src/modules/partner-alerts/server/partner-alert-request-writer";
import {readPartnerAlertMutation} from "@/src/modules/partner-alerts/server/partner-alert-request-boundary";
import {createPartnerAlertProviderFactSet} from "@/src/modules/partner-alerts/server/partner-alert-provider-facts";
import {TraderLinkCommunityRepository} from "@/src/modules/communities/server/traderlink-community-repository";
`;

const exercise = `
 {
 const scenario=process.argv[3];
 const admission=PartnerAlertAdmission.bind(db);
 const operatorGrantId=randomUUID();
 if(scenario!=="unauthorized")new PlatformOperatorRepository(db).insert({operatorGrantId,userId:actor.userId,
  grantedByKind:"bootstrap_console",grantedByUserId:null,grantReceiptSha256:hash("SYNTHETIC_OPERATOR"),recoveryOfGrantId:null,grantedAtUtc:clock});
 const community=new TraderLinkCommunityRepository(db).createFromVerifiedDiscordOwner({ownerUserId:actor.userId,
  discordGuildId:guildId,slug:"synthetic-context-qa",displayName:"Synthetic Discord community",timestamp:clock});
 const communityId=community.communityId,mappingId=randomUUID(),offerId=randomUUID();
 const policy={blockedServerNames:[],blockedPhrases:[],authorMode:"all_humans",allowedAuthorIds:[],mirrorBotUserId:"12349"};
 const insert=(table:string,row:Record<string,unknown>)=>db.prepare("INSERT INTO "+table+" ("+Object.keys(row).join(",")+") VALUES ("+Object.keys(row).map(()=>"?").join(",")+")").run(...Object.values(row));
 // Explicit synthetic prior application/review facts. No claims of provider or operator acceptance.
 insert("partner_alert_partners",{community_id:communityId,owner_user_id:actor.userId,source_guild_id:guildId,
  display_name:community.displayName,content_policy_json:JSON.stringify(policy),status:"awaiting_approval",review_requested:1,
  revision:4,submitted_application_revision:3,created_at_utc:clock,updated_at_utc:clock});
 insert("partner_alert_application_consents",{community_id:communityId,application_revision:3,rules_version:1,accepted_at_utc:clock});
 if(scenario!=="missing-inspection")insert("partner_alert_application_inspections",{community_id:communityId,application_revision:3,inspected_at_utc:clock});
 insert("partner_alert_mappings",{mapping_id:mappingId,community_id:communityId,source_guild_id:guildId,
  source_channel_id:"12350",display_name:"Synthetic source",destination_guild_id:guildId,destination_channel_id:"12351",
  destination_role_id:"12352",revision:1,approved_revision:1,ever_approved:1,review_state:"approved",
  delivery_state:"paused",activated_at_utc:scenario==="activated-mapping"?clock:null,created_at_utc:clock,updated_at_utc:clock});
 const offer={offerId,communityId,version:1,kind:"channel",title:"Synthetic channel",mappingIds:[mappingId],
  currency:{code:"USD",minorUnitDigits:2},amountMinor:100,cadence:{unit:"calendar_month",count:1},billingProvider:"stripe"};
 if(scenario!=="missing-offer"){
  insert("partner_alert_offers",{offer_id:offerId,community_id:communityId,version:1,kind:"channel",offer_json:JSON.stringify(offer),review_state:"draft",created_at_utc:clock});
  insert("partner_alert_offer_channels",{community_id:communityId,offer_id:offerId,offer_version:1,mapping_id:mappingId});
  db.prepare("UPDATE partner_alert_offers SET review_state='approved' WHERE offer_id=? AND version=1").run(offerId);
 }
 insert("partner_alert_stripe_sellers",{seller_id:randomUUID(),community_id:communityId,owner_user_id:actor.userId,
  environment:"sandbox",stripe_account_id:"acct_synthetic",state:"ready",created_at_ms:Date.parse(clock),updated_at_ms:Date.parse(clock)});
 if(scenario==="lost-approved-context")db.prepare("UPDATE partner_alert_partners SET approved_at_utc=?,approved_by_user_id=?,approved_application_revision=2 WHERE community_id=?").run(clock,actor.userId,communityId);
 if(scenario==="matching-context"||scenario==="wrong-configuration")insert("partner_alert_context_epochs",{community_id:communityId,
  revision:7,provider_generation:8,policy_generation:9,configuration_ref:scenario==="matching-context"?"synthetic_output":"other_output"});
 if(scenario==="owner-save")db.prepare("UPDATE partner_alert_partners SET status='draft',review_requested=0 WHERE community_id=?").run(communityId);
 const writer=new PartnerAlertRequestWriter(db,{environment:process.env,now:()=>new Date(clock),createId:randomUUID,
  destinationGuildId:guildId,maximumActorAgeMs:60000,maximumDiscordEvidenceAgeMs:300000,
  outputBotUserId:"12349",outputConfigurationRef:"synthetic_output",stripeEnvironment:"sandbox",whopEnvironment:"sandbox"});
 const prepare=async(requestId=randomUUID(),body:Record<string,unknown>={action:"approvePartner",communityId,expectedRevision:4})=>{
  const request=new Request("https://synthetic.example.com/admin/partner-channels",{method:"POST",headers:{
   host:"synthetic.example.com",origin:"https://synthetic.example.com","content-type":"application/json","sec-fetch-site":"same-origin",
   "x-traderlink-journal-admin-request":"1","x-traderlink-journal-admin-idempotency-key":requestId,
   "x-traderlink-platform-mutation":"1",
   "x-traderlink-partner-alert-idempotency-key":requestId,cookie:platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)+"="+actor.session.token},body:JSON.stringify(body)});
  const prepared=await readPartnerAlertMutation(request,scenario==="owner-save"?{kind:"community_owner",communityId}:{kind:"operator"},{configuredOrigin:"https://synthetic.example.com"});
  return {request,prepared};
 };
 const execute=async()=>{
  const input=await prepare();
  const plan=writer.preauthorizeProviderVerification(input.request,input.prepared);
  const facts=createPartnerAlertProviderFactSet(plan,{resources:plan.resourceChecks.map(target=>({...target,
   sourceTextChannel:true,sourceReadable:true,messageContentAvailable:true,destinationReadOnly:true,destinationPrivate:true,
   destinationRoleManageable:true,destinationRoleExclusiveToTradersLink:true,observedAtUtc:clock,
   validUntilUtc:scenario==="expired-resource"?clock:new Date(Date.parse(clock)+60000).toISOString()})),offers:[],
   stripeOffers:(plan.stripeOfferChecks??[]).map(target=>({...target,communityOwnerUserId:actor.userId,
    sellerAccountId:"acct_synthetic",environment:"sandbox",observedAtUtc:clock,validUntilUtc:new Date(Date.parse(clock)+60000).toISOString()})),pricing:null});
  return {...input,result:writer.executeMutation(input.request,input.prepared,{plan,facts})};
 };
 const snapshot=()=>({partner:db.prepare("SELECT * FROM partner_alert_partners WHERE community_id=?").get(communityId),
  context:db.prepare("SELECT * FROM partner_alert_context_epochs WHERE community_id=?").get(communityId),
  inspection:db.prepare("SELECT * FROM partner_alert_application_inspections WHERE community_id=?").get(communityId),
  commands:db.prepare("SELECT * FROM partner_alert_commands WHERE community_id=?").all(communityId),
  audit:db.prepare("SELECT * FROM partner_alert_audit_events WHERE community_id=?").all(communityId),
  seller:db.prepare("SELECT * FROM partner_alert_stripe_sellers WHERE community_id=?").get(communityId)});
 const before=snapshot();
 let enrollmentReached=false;
 if(scenario==="enrollment-rollback"||scenario==="expiry-rollback"){
  const originalOnboard=admission.onboardCommunity.bind(admission);
  admission.onboardCommunity=(id,configuration)=>{originalOnboard(id,configuration);
   enrollmentReached=true;
   assert(db.prepare("SELECT 1 FROM partner_alert_context_epochs WHERE community_id=?").get(id));
   if(scenario==="enrollment-rollback")throw Error("SYNTHETIC_POST_ENROLLMENT_FAILURE");
   clock=new Date(Date.parse(clock)+60001).toISOString();
  };
 }
 if(scenario==="owner-save"){
  const {mirrorBotUserId,...requestedPolicy}=policy;
  const input=await prepare(randomUUID(),{action:"savePartnerDraft",communityId,expectedRevision:4,
   displayName:community.displayName,contentPolicy:requestedPolicy});
  const result=writer.executeMutation(input.request,input.prepared);assert.equal(result.kind,"applied");
  assert.equal(snapshot().context,undefined);assert.equal((snapshot().partner as any).revision,5);
 }else if(scenario==="first-and-replay"||scenario==="matching-context"){
  const applied=await execute();assert.equal(applied.result.kind,"applied");
  const after=snapshot();assert.equal((after.partner as any).status,"setup_required");
  assert.equal((after.partner as any).revision,5);assert.equal(after.commands.length,1);
  if(scenario==="first-and-replay")assert.deepEqual(after.context,{community_id:communityId,revision:1,provider_generation:1,policy_generation:1,configuration_ref:"synthetic_output"});
  else{assert.equal((after.context as any).policy_generation,9);assert.equal((after.context as any).configuration_ref,"synthetic_output");assert.equal((after.context as any).revision,9);assert.equal((after.context as any).provider_generation,10);}
  const replay=await prepare(applied.prepared.requestId);assert.deepEqual(writer.tryMutationReplay(replay.request,replay.prepared),applied.result);
  assert.deepEqual(snapshot(),after);
  const changed=await prepare(applied.prepared.requestId,{action:"approvePartner",communityId,expectedRevision:5});
  assert.equal(writer.tryMutationReplay(changed.request,changed.prepared)?.kind,"conflict");assert.deepEqual(snapshot(),after);
 }else{
  let result:any=null;try{result=(await execute()).result;}catch(error){result={kind:"refused",message:(error as Error).message};}
  const expectedKinds:Record<string,string>={"wrong-configuration":"unavailable","lost-approved-context":"unavailable",
   "activated-mapping":"unavailable","missing-inspection":"conflict","missing-offer":"invalid","expired-resource":"forbidden",
   "enrollment-rollback":"unavailable","expiry-rollback":"invalid","unauthorized":"refused"};
  assert.equal(result.kind,expectedKinds[scenario],JSON.stringify(result));assert.deepEqual(snapshot(),before);
  if(scenario==="enrollment-rollback"||scenario==="expiry-rollback")assert.equal(enrollmentReached,true);
 }
 assert.equal(networkRequests,0);db.close();console.log("PAID_CONTEXT_NATIVE "+JSON.stringify({scenario,
  actualNativeCoreAndAuth:true,actualWriterApproval:true,syntheticProviderFacts:true,realNetwork:0,actualStageQualified:false}));
 }
`;
