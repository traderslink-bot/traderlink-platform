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
it('native worker scopes expired-send recovery and pending claims despite unrelated jobs inserted after preflight',async()=>{
 const receipt=await nativeCase(nativeAuthoritySetup+`
 const mapping=manifest.bindings[0]!;
 // Deliberately draft/unpaid fixture: this test grants no publishing consent.
 db.prepare("INSERT INTO traderlink_communities(community_id,discord_guild_id,slug,display_name,status,owner_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'synthetic-qa','Synthetic QA','setup',?,?,?)").run(manifest.communityId,guildId,actor.userId,clock,clock);
 db.prepare("INSERT INTO partner_alert_partners(community_id,owner_user_id,source_guild_id,display_name,content_policy_json,status,revision,created_at_utc,updated_at_utc) VALUES(?,?,?,'Synthetic QA','{}','draft',1,?,?)").run(manifest.communityId,actor.userId,guildId,clock,clock);
 db.prepare("INSERT INTO partner_alert_context_epochs VALUES(?,1,1,1,'synthetic-qa')").run(manifest.communityId);
 db.prepare("INSERT INTO partner_alert_mappings(mapping_id,community_id,source_guild_id,source_channel_id,display_name,destination_guild_id,destination_channel_id,destination_role_id,revision,review_state,created_at_utc,updated_at_utc) VALUES(?,?,?,?,'Synthetic mapping',?,?,?,1,'draft',?,?)").run(mapping.mappingId,manifest.communityId,guildId,mapping.sourceChannelId,guildId,mapping.destinationChannelId,mapping.roleId,clock,clock);
 PartnerAlertAdmission.bind(db);
 const cap=hostedQA.issuePartnerAlertHostedQaAuthority(input);
 assert.equal((db.prepare("SELECT count(*) n FROM partner_alert_deliveries").get() as {n:number}).n,0);
 const ownId=randomUUID(),foreignSending=randomUUID(),foreignPending=randomUUID(),token=randomUUID();
 const add=(id:string,message:string,status:string,offset:number)=>{
  const retain=new Date(Date.parse(clock)+7*86400000).toISOString();
  db.prepare("INSERT INTO partner_alert_source_messages(community_id,source_guild_id,source_channel_id,message_id,revision,state,text_content,source_created_at_utc,retain_until_utc) VALUES(?,?,?,?,1,'allowed','Synthetic body',?,?)").run(manifest.communityId,guildId,mapping.sourceChannelId,message,clock,retain);
  db.prepare("INSERT INTO partner_alert_source_revisions(community_id,source_channel_id,message_id,revision,state,text_content,observed_at_utc) VALUES(?,?,?,1,'allowed','Synthetic body',?)").run(manifest.communityId,mapping.sourceChannelId,message,clock);
  db.prepare("INSERT INTO partner_alert_deliveries(delivery_id,community_id,mapping_id,source_channel_id,message_id,source_revision,part_index,action,status,text_content,next_attempt_at_utc,lease_token,lease_until_utc) VALUES(?,?,?,?,?,1,0,'create',?,'Synthetic body',?,?,?)").run(id,manifest.communityId,mapping.mappingId,mapping.sourceChannelId,message,status,clock,status==='sending'?token:null,status==='sending'?new Date(Date.parse(clock)-offset).toISOString():null);
 };
 add(ownId,'50001','sending',60000);
 assert.equal(hostedQA.registerHostedQaSource(cap,mapping.sourceChannelId,'50001','create'),true);hostedQA.ownHostedQaClaim(cap,ownId,token);
 // Foreign rows arrive AFTER the empty preflight in the SAME channel/community.
 add(foreignSending,'50002','sending',120000);add(foreignPending,'50003','pending',0);
 const foreign=()=>JSON.stringify(db.prepare("SELECT * FROM partner_alert_deliveries WHERE delivery_id IN (?,?) ORDER BY delivery_id").all(foreignSending,foreignPending));const before=foreign();let calls=0;
 const noHttp=async()=>{calls++;throw Error("No HTTP expected for native selector regression");};
 const worker=new PartnerAlertDeliveryWorker(db,{verifyDestination:noHttp,create:noHttp,edit:noHttp,delete:noHttp},{enabled:true,execution:cap,nowUtc:()=>clock,createId:randomUUID,attention:()=>{}});
 assert.equal(await worker.runOnce(),false);
 assert.equal((db.prepare("SELECT status FROM partner_alert_deliveries WHERE delivery_id=?").get(ownId) as {status:string}).status,"uncertain");
 assert.equal(foreign(),before);assert.equal(calls,0);assert.equal(networkRequests,0);assert.deepEqual(db.pragma("foreign_key_check"),[]);
 hostedQA.closeHostedQaAuthority(cap);db.close();console.log('PAID_HOSTED_QA_NATIVE '+JSON.stringify({actualWorker:true,actualPartnerAdmission:true,registered204:true,syntheticDraftFixture:true,ownExpiredUncertain:true,foreignAfterPreflightExact:true,httpCalls:calls,realNetwork:0,actualStageQualified:false}));
 `);expect(receipt).toMatchObject({actualWorker:true,actualPartnerAdmission:true,registered204:true,syntheticDraftFixture:true,ownExpiredUncertain:true,foreignAfterPreflightExact:true,httpCalls:0,realNetwork:0,actualStageQualified:false});
},45000);
