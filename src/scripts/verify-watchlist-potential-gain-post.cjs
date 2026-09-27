const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require(process.argv[2]),Database=require(process.argv[3]);
function load(file,deps={}){
  const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
  assert.equal(compiled.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file);
  const module={exports:{}};vm.runInNewContext(compiled.outputText,{module,exports:module.exports,URL,AbortSignal,Response,Request,Headers,Blob,File,FormData,Buffer,Uint8Array,Date,console,process:{env:{}},require:n=>n.startsWith('node:')?require(n):deps[n]||{}});return module.exports;
}
(async()=>{
 const db=new Database(':memory:'); db.exec("PRAGMA foreign_keys=ON; CREATE TABLE platform_users(user_id TEXT PRIMARY KEY); INSERT INTO platform_users VALUES('owner');");
 const migration=load('src/modules/platform/server/database/migrations/0147_watchlist_potential_gain_posts.ts').watchlistPotentialGainPostsMigration;
 for(const sql of migration.statements)db.exec(sql);
 const service=load('src/modules/watchlist/server/notifications/watchlist-potential-gain-post.ts');
 const png=Buffer.alloc(33);Buffer.from('89504e470d0a1a0a','hex').copy(png);png.write('IHDR',12);png.writeUInt32BE(600,16);png.writeUInt32BE(400,20);
 const input={ownerUserId:'owner',symbol:'TEST',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',message:'Optional owner message',png};
 const env={WATCHLIST_POTENTIAL_GAIN_DISCORD_WEBHOOK_URL:'https://discord.com/api/webhooks/123/fixture_only'};
 let posts=0,gets=0,status=200,channel=service.GAIN_CHANNEL;
 const transport=async(url,options={})=>{
   if(options.method!=='POST'){gets++;return Response.json({channel_id:channel});}
   posts++; assert.equal(new URL(url).searchParams.get('wait'),'true');
   const payload=JSON.parse(options.body.get('payload_json'));assert.equal(payload.content,input.message);assert.deepEqual(payload.allowed_mentions,{parse:[]});
   assert.equal(options.body.get('files[0]').type,'image/png');
   if(status===0)throw Error('fixture timeout');
   return Response.json(status===200?{id:'12345'}:{retry_after:30},{status});
 };
 assert.equal((await service.sendPotentialGainPost(db,input,transport,env)).state,'sent');
 assert.equal((await service.sendPotentialGainPost(db,input,transport,env)).state,'sent');assert.equal(posts,1);assert.equal(gets,1);
 await assert.rejects(()=>service.sendPotentialGainPost(db,{...input,message:'changed'},transport,env));assert.equal(posts,1);
 let sequence=1; const next=()=>({...input,requestId:`bbbbbbbb-bbbb-4bbb-8bbb-${String(sequence++).padStart(12,'0')}`});
 status=429;const retry=next();assert.equal((await service.sendPotentialGainPost(db,retry,transport,env)).state,'retry');const before=posts;
 await service.sendPotentialGainPost(db,retry,transport,env);assert.equal(posts,before);
 db.prepare('UPDATE platform_watchlist_potential_gain_posts SET retry_at_ms=0 WHERE request_id=?').run(retry.requestId);status=200;
 assert.equal((await service.sendPotentialGainPost(db,retry,transport,env)).state,'sent');
 for(const failure of [0,502]){status=failure;const item=next();assert.equal((await service.sendPotentialGainPost(db,item,transport,env)).state,'uncertain');const count=posts;await service.sendPotentialGainPost(db,item,transport,env);assert.equal(posts,count);}
 status=200;channel='wrong';const count=posts;assert.equal((await service.sendPotentialGainPost(db,next(),transport,env)).state,'configuration');assert.equal(posts,count);
 assert.equal(service.potentialGainWebhook({WATCHLIST_POTENTIAL_GAIN_DISCORD_WEBHOOK_URL:'https://example.test/api/webhooks/123/secret'}),null);
 assert.throws(()=>service.validateGainPost({...input,png:Buffer.alloc(12)}));assert.throws(()=>service.validateGainPost({...input,message:'x'.repeat(1801)}));
 assert.throws(()=>service.validateGainPost({...input,symbol:'../TEST'}));
 let owner=false,mutations=0;
 const route=load('app/api/admin/watchlist/potential-gain-post/route.ts',{
   '@/src/modules/platform/server/administration/platform-admin-authorization':{withJournalAdminDatabase:(headers,operation)=>{if(!owner)throw Error();return operation(db,{userId:'owner'});}},
   '@/src/modules/platform/server/administration/platform-admin-request-security':{requireJournalAdminMutationRequest:()=>{mutations++;throw Error();}},
   '@/src/lib/live-watchlist/live-watchlist-store':{LiveWatchlistStore:class{getSymbol(){return null;}}},
   '@/src/modules/watchlist/server/notifications/watchlist-potential-gain-post':service,
 });
 assert.equal((await route.GET(new Request('https://example.test/?symbol=TEST'))).status,404);
 assert.equal((await route.POST(new Request('https://example.test/',{method:'POST'}))).status,404);assert.equal(mutations,1);
 owner=true;assert.equal((await route.GET(new Request('https://example.test/?symbol=TEST'))).status,404);
 for(const file of ['src/lib/live-watchlist/capture-potential-gain-card.ts','app/(dashboard)/admin/watchlist/watchlist-potential-gain-post.tsx','app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx']){
   const r=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});assert.equal(r.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file);
 }
 db.close();console.log('PASS: receipt persistence/dedupe, payload binding,429 retry, uncertain no-resend, destination check, input bounds, owner auth/CSRF path, migration and TSX syntax. No real requests. Visual PNG acceptance and integrated type/build remain pending.');
})().catch(error=>{console.error(error);process.exitCode=1;});
