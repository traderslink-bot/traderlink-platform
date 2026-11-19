// @vitest-environment node
import {existsSync,mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';
import {expect,it} from 'vitest';

/** Real SQLite204/Auth/session/operator/Core frames. Namespace and signed v5
 * reader are explicit UNIT ports: this component test is not actual-stage
 * approval, provider/buyer proof or a signed-review acceptance test. */
async function nativeCase(exercise:string){
 const paid=process.cwd();
 const combined=process.env.PAID_HOSTED_QA_NATIVE_SOURCE_ROOT??(existsSync(join(paid,'src/modules/platform/server/database/migrations/0216_platform_premium_current_access_events.ts'))?paid:'/home/traderlink/projects/community-combined-204-integration-20261117');
 const directory=mkdtempSync('/tmp/paid-hosted-qa-native-');const require=createRequire(import.meta.url);
 const fixture=join(combined,'src/test/fixtures/premium-current-access-native-controller.ts');
 const original=readFileSync(fixture,'utf8'),marker=' const initial=capture();';
 if(original.indexOf(marker)<0||original.indexOf(marker)!==original.lastIndexOf(marker))throw Error('Frozen native fixture marker changed');
 const program='import {PartnerAlertDeliveryWorker} from "@/src/modules/partner-alerts/server/partner-alert-delivery-worker";\nimport {PartnerAlertAdmission} from "@/src/modules/partner-alerts/server/partner-alert-admission";\nimport * as hostedQA from "@/src/modules/partner-alerts/server/partner-alert-hosted-qa-authority";\nimport {generateKeyPairSync,sign} from "node:crypto";\nimport {chmodSync} from "node:fs";\nimport {requireTraderLinkPlatformAuthenticatedRequestIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";\n'+original.slice(0,original.indexOf(marker))+exercise+'\n}\nrun().catch(error=>{console.error(error);process.exitCode=1;});\n';
 const selected=(relative:string)=>['','.ts','.tsx','.js','.json','/index.ts'].map(ext=>relative+ext).map(name=>join((name.startsWith('src/modules/partner-alerts/server/partner-alert-hosted-qa-')||name==='src/modules/partner-alerts/server/partner-alert-delivery-worker.ts')?paid:combined,name)).find(path=>existsSync(path));
 try{
  const bundle=await build({entryPoints:[fixture],bundle:true,platform:'node',format:'cjs',target:'node22',packages:'external',write:false,logLevel:'silent',plugins:[{name:'actual-a74-Core-and-Paid-component-with-explicit-unit-ports',setup(plugin){
   plugin.onResolve({filter:/.*/},args=>{
    if(args.path==='server-only')return{path:require.resolve('next/dist/compiled/server-only/empty.js')};
    let relative:string|undefined;
    if(args.path.startsWith('@/'))relative=args.path.slice(2);else if(args.path.startsWith('.')){const absolute=resolve(args.resolveDir,args.path);for(const root of [paid,combined])if(absolute.startsWith(root+'/')){relative=absolute.slice(root.length+1);break;}}
    if(relative?.replace(/\.ts$/,'')==='src/modules/communities/server/community-staging-qa-target')return{path:'namespace',namespace:'unit'};
    if(relative?.replace(/\.ts$/,'')==='src/modules/partner-alerts/server/partner-alert-stripe-erasure-worker-input')return{path:'v5',namespace:'unit'};
    if(relative){const path=selected(relative);if(path)return{path};}return undefined;
   });
   plugin.onLoad({filter:/.*/,namespace:'unit'},args=>({contents:args.path==='namespace'
    ?'export function assertCommunityStagingQaTarget(db,pins){if(!db.open||db.readonly||pins.origin!=="https://synthetic.example.com")throw Error("UNIT namespace refused");}'
    :'export function readPartnerAlertStripeErasureWorkerInputs(){const port=globalThis.PAID_QA_UNIT_V5;if(!port||port.refused)throw Error("UNIT v5 reader refused");return port.inputs;}',loader:'js'}));
   plugin.onLoad({filter:/\.tsx?$/},args=>({contents:(args.path===fixture?program:readFileSync(args.path,'utf8').replace(args.path.endsWith('/partner-alert-hosted-qa-authority.ts')?'"/data/private/paid-hosted-qa/runs"':'__NO_UNIT_REPLACEMENT__',JSON.stringify(join(directory,'private-runs')))).replace(/import\.meta\.url/g,JSON.stringify(pathToFileURL(args.path).href)),loader:args.path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)}));
  }}]});
  for(const file of ['membership/platform-premium-authority-repository.ts','membership/platform-premium-whop-native.ts','privacy/platform-premium-signer-redaction.ts']){const target=join(directory,'src/modules/platform/server',file);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(combined,'src/modules/platform/server',file)),{mode:0o600});}
  const entry=join(directory,'case.cjs');writeFileSync(entry,bundle.outputFiles[0]!.contents,{mode:0o600});
  const child=spawnSync(process.execPath,[entry,'--runtime-authority-unit'],{cwd:directory,env:{...process.env,NODE_ENV:'test',NODE_PATH:join(combined,'node_modules')},encoding:'utf8',timeout:40000,maxBuffer:128*1024});
  expect(child.status,child.stderr+child.stdout).toBe(0);const line=child.stdout.split('\n').find(line=>line.startsWith('PAID_HOSTED_QA_NATIVE '));expect(line,child.stdout).toBeTruthy();return JSON.parse(line!.slice('PAID_HOSTED_QA_NATIVE '.length));
 }finally{rmSync(directory,{recursive:true,force:true});}
}

it('uses real native owner/session frames; synchronous parent expires and cannot be kept across a callback',async()=>{
 const receipt=await nativeCase(`
  new PlatformOperatorRepository(db).insert({operatorGrantId:randomUUID(),userId:actor.userId,grantedByKind:"bootstrap_console",grantedByUserId:null,grantReceiptSha256:hash("SYNTHETIC_QA_OPERATOR"),recoveryOfGrantId:null,grantedAtUtc:clock});
  const request=new Request("https://synthetic.example.com/__private/finite-qa",{method:"POST",headers:{origin:"https://synthetic.example.com",cookie:platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)+"="+actor.session.token}});
  const identity=()=>requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers,{environment:process.env,databasePath:db.name});
  let frameAfter:unknown=null;
  const enter=(operation:()=>void)=>core.withRequestAuditFrame(request,process.env,frame=>{
   const actual=identity();core.attachRequestPrincipal(actual,identity);const owner=frame.authorize(actual,request.headers);core.retainOwnerScope(owner);core.requirePlatformOwner();
   assert.equal(owner.mode,"production_discord_owner");assert.equal(owner.role,"journal_owner_admin");assert(owner.permissions.includes("manage_users"));frameAfter=frame;operation();
  });
  enter(()=>assert.equal(core.requestPrincipal().userId,actor.userId));
  assert.throws(()=>core.requestPrincipal());
  assert.throws(()=>(frameAfter as {revalidate:(...args:unknown[])=>void}).revalidate(null,identity(),request.headers));
  assert.throws(()=>enter(()=>{clock=new Date(Date.parse(clock)+60001).toISOString();core.requirePlatformOwner();}));
  enter(()=>assert.equal(core.requestPrincipal().userId,actor.userId));
  assert.throws(()=>enter(()=>{request.headers.set("cookie",platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)+"=invalid-token");core.requirePlatformOwner();}));
  assert.equal(networkRequests,0);db.close();console.log('PAID_HOSTED_QA_NATIVE '+JSON.stringify({actualCore:true,actualAuthSession:true,actualOwnerFrame:true,closedParentRefused:true,expiredParentRefused:true,changedSessionRefused:true,realNetwork:networkRequests,actualStageQualified:false}));
 `);
 expect(receipt).toMatchObject({actualCore:true,actualAuthSession:true,actualOwnerFrame:true,closedParentRefused:true,expiredParentRefused:true,changedSessionRefused:true,realNetwork:0,actualStageQualified:false});
},45000);

const nativeAuthoritySetup=`
 new PlatformOperatorRepository(db).insert({operatorGrantId:randomUUID(),userId:actor.userId,grantedByKind:"bootstrap_console",grantedByUserId:null,grantReceiptSha256:hash("SYNTHETIC_QA_OPERATOR"),recoveryOfGrantId:null,grantedAtUtc:clock});
 const abort=new AbortController();
 let request=new Request("https://synthetic.example.com/__private/finite-qa",{method:"POST",signal:abort.signal,headers:{origin:"https://synthetic.example.com",cookie:platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)+"="+actor.session.token}});
 const pins={origin:"https://synthetic.example.com",sourceCommit:"c".repeat(40),sourceVectorSha256:"d".repeat(64),schemaSha256:migrated.finalSchemaSha256,buildId:"UNIT_NATIVE_ONLY",artifactSha256:"e".repeat(64)};
 const keys=generateKeyPairSync("ed25519"),reviewPublicKey=keys.publicKey.export({format:"pem",type:"spki"}).toString();
 process.env.TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE="disabled_isolated_staging";
 const manifest={protocol:hostedQA.HOSTED_PAID_QA_DOMAIN,runId:randomUUID(),mode:"mirroring" as const,issuedAtUtc:new Date().toISOString(),expiresAtUtc:new Date(Date.now()+600000).toISOString(),pins,operatorSha256:"f".repeat(64),guildId:hostedQA.HOSTED_PAID_QA_GUILD,botUserId:hostedQA.HOSTED_PAID_QA_BOT,communityId:randomUUID(),buyerUserId:actor.userId,buyerDiscordUserId:"12345",permittedAuthorId:"12346",bindings:[{mappingId:randomUUID(),sourceChannelId:"12350",destinationChannelId:"12351",roleId:"12352"}],protectedRoleIds:[guildId,paidRoleId],limits:{http:2,roleWrites:0,sends:2,edits:2,deletes:2,sourceMessages:2,gatewayPackets:128,gatewayBytes:4194304}};
 const signEnvelope=(value=manifest)=>({manifest:value,signature:sign(null,hostedQA.serializeHostedPaidQaManifest(value),keys.privateKey).toString("base64url")});
 const journalRoot=hostedQA.HOSTED_PAID_QA_JOURNAL_ROOT;mkdirSync(journalRoot,{mode:0o700});chmodSync(journalRoot,0o700);
 const journalKey=randomBytes(32),journalPath=join(journalRoot,manifest.runId+".json");
 const unit={refused:false,inputs:{erasureRuntime:{binding:{key:journalKey}},releaseFormat:"v5",effectMode:"discord_roles",schemaSha256:migrated.finalSchemaSha256,profileCatalogSha256:hash(catalogBytes),erasureProfileRef:"synthetic_profile",forbiddenRoleIds:[guildId,paidRoleId],assertCurrentRelease:()=>{if(unit.refused)throw Error("UNIT v5 changed");},readCurrentConfiguration:()=>({discordBotUserId:manifest.botUserId,outputBindings:manifest.bindings.map(b=>({...b,communityId:manifest.communityId,sourceGuildId:guildId,destinationGuildId:guildId,destinationRoleId:b.roleId}))})}};
 (globalThis as unknown as {PAID_QA_UNIT_V5:unknown}).PAID_QA_UNIT_V5=unit;
 const input={database:db,core,request,pins,envelope:signEnvelope(),operatorSha256:manifest.operatorSha256,reviewPublicKey,journalPath,journalKey,workerEnvironment:{...process.env,PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY:reviewPublicKey}};
`;
it('issues genuine owner-bound authority, rejects copied capability and preserves spent budget across reopen',async()=>{
 const receipt=await nativeCase(nativeAuthoritySetup+`
 assert.throws(()=>hostedQA.issuePartnerAlertHostedQaAuthority({...input,journalKey:randomBytes(32)}));
 const actualCatalog=unit.inputs.profileCatalogSha256;unit.inputs.profileCatalogSha256="0".repeat(64);
 assert.throws(()=>hostedQA.issuePartnerAlertHostedQaAuthority(input));unit.inputs.profileCatalogSha256=actualCatalog;
 const authority=hostedQA.issuePartnerAlertHostedQaAuthority(input);
 hostedQA.withPartnerAlertHostedQaParent(authority,()=>assert.equal(core.requestPrincipal().userId,actor.userId));
 assert.throws(()=>core.requestPrincipal());assert.throws(()=>hostedQA.assertPartnerAlertHostedQaCurrent({...authority}));
 unit.inputs.profileCatalogSha256="0".repeat(64);assert.throws(()=>hostedQA.assertPartnerAlertHostedQaCurrent(authority));unit.inputs.profileCatalogSha256=actualCatalog;
 hostedQA.reserveHostedQaBudget(authority,"http");hostedQA.closeHostedQaAuthority(authority);
 assert.throws(()=>hostedQA.assertPartnerAlertHostedQaCurrent(authority));
 const resumed=hostedQA.issuePartnerAlertHostedQaAuthority(input);hostedQA.reserveHostedQaBudget(resumed,"http");assert.throws(()=>hostedQA.reserveHostedQaBudget(resumed,"http"));hostedQA.closeHostedQaAuthority(resumed);
 const forged={...input,envelope:{...input.envelope,signature:"A".repeat(86)}};assert.throws(()=>hostedQA.issuePartnerAlertHostedQaAuthority(forged));
 assert.throws(()=>hostedQA.issuePartnerAlertHostedQaAuthority({...input,journalPath:join(journalRoot,randomUUID()+".json")}));
 assert.equal(networkRequests,0);db.close();console.log('PAID_HOSTED_QA_NATIVE '+JSON.stringify({actualFactory:true,actualCore:true,realOwner:true,copyRefused:true,spentBudgetPersists:true,forgeryRefused:true,forkPathRefused:true,realNetwork:0,actualStageQualified:false}));
 `);expect(receipt).toMatchObject({actualFactory:true,actualCore:true,realOwner:true,copyRefused:true,spentBudgetPersists:true,forgeryRefused:true,forkPathRefused:true,realNetwork:0,actualStageQualified:false});
},45000);
it('factory rechecks actual owner session, original cutoff, v5 and synchronous admission before work',async()=>{
 const receipt=await nativeCase(nativeAuthoritySetup+`
 let cap=hostedQA.issuePartnerAlertHostedQaAuthority(input);
 assert.throws(()=>hostedQA.withPartnerAlertHostedQaParent(cap,()=>Promise.resolve()));
 hostedQA.assertPartnerAlertHostedQaCurrent(cap);
 const actualNow=Date.now;Date.now=()=>actualNow()+120001;
 try{assert.throws(()=>hostedQA.assertPartnerAlertHostedQaCurrent(cap));}finally{Date.now=actualNow;}
 assert.throws(()=>hostedQA.assertPartnerAlertHostedQaCurrent(cap));
 hostedQA.closeHostedQaAuthority(cap);
 request=new Request(request.url,{method:"POST",signal:abort.signal,headers:new Headers(request.headers)});input.request=request;
 cap=hostedQA.issuePartnerAlertHostedQaAuthority(input);
 hostedQA.assertPartnerAlertHostedQaCurrent(cap);
 unit.refused=true;assert.throws(()=>hostedQA.assertPartnerAlertHostedQaCurrent(cap));unit.refused=false;
 const headers=request.headers.get("cookie")!;
 request.headers.set("cookie",platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)+"=invalid-token");assert.throws(()=>hostedQA.assertPartnerAlertHostedQaCurrent(cap));request.headers.set("cookie",headers);
 hostedQA.assertPartnerAlertHostedQaCurrent(cap);
 db.prepare("UPDATE platform_auth_sessions SET created_at_utc=?,expires_at_utc=? WHERE user_id=?").run(new Date(Date.parse(baseAt)-60000).toISOString(),new Date(Date.parse(baseAt)-1000).toISOString(),actor.userId);
 assert.throws(()=>hostedQA.assertPartnerAlertHostedQaCurrent(cap));hostedQA.closeHostedQaAuthority(cap);
 assert.equal(networkRequests,0);db.close();console.log('PAID_HOSTED_QA_NATIVE '+JSON.stringify({actualFactory:true,asyncFrameRefused:true,originalCutoffRefused:true,v5ChangeRefused:true,headerSwapRefused:true,actualSessionExpiryRefused:true,realNetwork:0,actualStageQualified:false}));
 `);expect(receipt).toMatchObject({actualFactory:true,asyncFrameRefused:true,originalCutoffRefused:true,v5ChangeRefused:true,headerSwapRefused:true,actualSessionExpiryRefused:true,realNetwork:0,actualStageQualified:false});
},45000);
it('journal and signed scope cannot be forged or forked into a fresh budget',async()=>{
 const receipt=await nativeCase(nativeAuthoritySetup+`
 const cap=hostedQA.issuePartnerAlertHostedQaAuthority(input);hostedQA.reserveHostedQaBudget(cap,"http");
 const saved=readFileSync(journalPath),forged=JSON.parse(saved.toString("utf8"));forged.payload.counts.http=0;writeFileSync(journalPath,JSON.stringify(forged));assert.throws(()=>hostedQA.reserveHostedQaBudget(cap,"http"));writeFileSync(journalPath,saved);
 const outside=structuredClone(manifest);outside.guildId="12345" as never;assert.throws(()=>hostedQA.serializeHostedPaidQaManifest(outside));
 const unsafe=structuredClone(manifest);unsafe.bindings[0]!.roleId=paidRoleId;assert.throws(()=>hostedQA.serializeHostedPaidQaManifest(unsafe));
 hostedQA.closeHostedQaAuthority(cap);
 const noV5={...unit.inputs,releaseFormat:"v4"};unit.inputs=noV5 as typeof unit.inputs;assert.throws(()=>hostedQA.issuePartnerAlertHostedQaAuthority(input),{message:"paid_hosted_qa_refused"});unit.inputs.releaseFormat="v5";
 abort.abort();assert.throws(()=>hostedQA.issuePartnerAlertHostedQaAuthority(input));
 assert.equal(networkRequests,0);db.close();console.log('PAID_HOSTED_QA_NATIVE '+JSON.stringify({journalMacRefused:true,foreignGuildRefused:true,protectedRoleRefused:true,abortRefused:true,realNetwork:0,actualStageQualified:false}));
 `);expect(receipt).toMatchObject({journalMacRefused:true,foreignGuildRefused:true,protectedRoleRefused:true,abortRefused:true,realNetwork:0,actualStageQualified:false});
},45000);
