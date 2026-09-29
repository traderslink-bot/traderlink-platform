const assert=require('node:assert/strict'),vm=require('node:vm');
const {changes}=require('./package-watchlist-routing-cancel.cjs');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
function run(source,ctx={}){const out=ts.transpileModule(source,{compilerOptions:{target:99,module:1}}).outputText;return vm.runInNewContext(out,{AbortController,AbortSignal,URL,Date,Map,Set,setTimeout,clearTimeout,...ctx});}
function method(source,name){const ast=ts.createSourceFile('x.ts',source,99,true);let found;function walk(n){if(ts.isMethodDeclaration(n)&&n.name.getText(ast)===name)found=n.getText(ast);ts.forEachChild(n,walk);}walk(ast);assert.ok(found,name);return found;}
(async()=>{
 const gateway=changes.runtime.get('src/lib/alerts/discord-rest-thread-gateway.ts').body;
 const env={};let gets=0;
 const G=run('class G {categoryGateways=new Map(); categoryOptions={}; guildId="server"; fetchImpl:any; '+method(gateway,'categoryGateway')+'}; G',{process:{env},DiscordPreparationFailure:class extends Error{},DiscordRestThreadGateway:class {constructor(options){this.options=options;}}});
 const g=new G();g.fetchImpl=async()=>{gets++;return {ok:true,json:async()=>({channel_id:'123456789012345678',guild_id:'server'})};};
 for(const group of [undefined,'main','top_regular','reversal'])assert.equal(await g.categoryGateway(group),null);
 for(const [group,key]of [['postmarket','POSTMARKET'],['top_watches:2026-09-30','POSTMARKET'],['swings','SWINGS'],['general','GENERAL']]){
   env['WATCHLIST_'+key+'_DISCORD_WEBHOOK_URL']='https://discord.com/api/webhooks/123456789012345678/fake-'+key;
   const child=await g.categoryGateway(group);assert.equal(child.options.webhookUrl,env['WATCHLIST_'+key+'_DISCORD_WEBHOOK_URL']);assert.equal(child.options.watchlistChannelId,'123456789012345678');
 }
 assert.equal(gets,3);
 const bad=new G();bad.fetchImpl=g.fetchImpl;delete env.WATCHLIST_SWINGS_DISCORD_WEBHOOK_URL;await assert.rejects(()=>bad.categoryGateway('swings'),/missing or invalid/);assert.equal(gets,3);
 env.WATCHLIST_SWINGS_DISCORD_WEBHOOK_URL='https://evil.example/api/webhooks/123456789012345678/secret';await assert.rejects(()=>bad.categoryGateway('swings'),/missing or invalid/);
 const service=changes.runtime.get('src/lib/ai/traderslink-ai-read-service.ts').body;
 const S=run('class S {timeoutMs=1000; reasoningEffort="high";webSearchEnabled=false;maxOutputTokens=32000;options={apiKey:"fake"};fetchImpl:any;'+method(service,'request')+'}; S',{
   buildRequestBody:()=>({}),createHash:()=>({update(){return this;},digest(){return 'hash';}}),ANALYSIS_CODE_IDENTITY:'test',SIMPLE_ANALYSIS_PROMPT:'',buildTradersLinkAiReadDeveloperPrompt:()=>'',SIMPLE_ANALYSIS_SCHEMA:{},buildTradersLinkAiReadResponseSchema:()=>({})});
 const s=new S();let sent=0;
 s.fetchImpl=async(_url,init)=>{sent++;return await new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));};
 const before=new AbortController();before.abort(Error('cancel'));await assert.rejects(()=>s.request('model',{signal:before.signal},0,'id',()=>{}));assert.equal(sent,0);
 const active=new AbortController();const request=s.request('model',{signal:active.signal},0,'id',()=>{});active.abort(Error('cancel'));await assert.rejects(()=>request,/cancelled by owner/);assert.equal(sent,1);
 assert.ok(service.includes('input.signal?.aborted || !fallback'));
 const mgr=changes.runtime.get('src/lib/monitoring/manual-watchlist-runtime-manager.ts').body;
 const M=run('class M {cancellableAnalysis=new Map();cancelledAutomaticAnalysis=new Map();watchlistStore={getEntry:()=>({tradersLinkAiReadBoundaryState:{generatedAt:12}})};recordTradersLinkAiReadRunOutcome(){};'+method(mgr,'cancelAnalysisGeneration')+'}; M',{normalizeSymbol:s=>s.toUpperCase()});
 const m=new M(),c=new AbortController();m.cancellableAnalysis.set('BKYI',{runId:'new',controller:c});assert.throws(()=>m.cancelAnalysisGeneration('BKYI','old'));assert.equal(c.signal.aborted,false);m.cancelAnalysisGeneration('BKYI','new');assert.equal(c.signal.aborted,true);assert.equal(m.cancelledAutomaticAnalysis.get('BKYI'),12);
 assert.ok(mgr.indexOf('cancellation.signal.throwIfAborted();\n      this.cancellableAnalysis.delete(symbol)')<mgr.indexOf('reviewStore.saveDraft({',mgr.indexOf('read = await service.generate')));
 const row=changes.runtime.get('src/runtime/manual-watchlist-row-review.ts').body;
 const exports={};run(row,{exports});const script=exports.WATCHLIST_ROW_REVIEW.match(/<script>([\s\S]*)<\/script>/)[1];new vm.Script(script);
 assert.ok(row.includes("window.parent.addEventListener('scroll',position,true)"));
 const route=changes.platform.get('app/api/admin/watchlist/runtime/[...path]/route.ts').body;assert.ok(route.includes('requireJournalAdminMutationRequest(request)'));
 console.log('PASS: all route categories, old default, cache, missing/invalid destinations; pre-dispatch/in-flight abort; stale-run protection; fallback and publication guards; generated UI syntax and owner-auth boundary. Zero network or paid requests.');
})().catch(e=>{console.error(e);process.exitCode=1;});
