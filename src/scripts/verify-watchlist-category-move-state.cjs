const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const file=path.join(__dirname,'fixtures/watchlist-category-move-state.ts'),moduleValue={exports:{}};
const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
assert.equal(output.diagnostics.length,0);
vm.runInNewContext(output.outputText,{module:moduleValue,exports:moduleValue.exports,structuredClone});
const {newCategoryMove,advanceCategoryMove}=moduleValue.exports;
const input={id:'operation-1',symbol:'GOW',cycleId:'cycle',from:'main',to:'general',content:'GOW moved to General',createdAt:1,published:true,notify:true};
const old={channelId:'10000000000000001',messageId:'10000000000000002'};
const sent={channelId:old.channelId,messageId:'10000000000000003'};
async function run() {
 let saved,calls={place:0,send:0,notify:0,remove:0},failDelete=true;
 const ports={save:state=>{saved=state;},current:()=>true,place:async()=>{calls.place++;},send:async()=>{calls.send++;return sent;},notify:async()=>{calls.notify++;},remove:async()=>{calls.remove++;if(failDelete)throw Error('No permission');},definitelyNotSent:()=>false};
 let state=await advanceCategoryMove(newCategoryMove(input,[old,old]),ports);
 assert.equal(state.cleanup.length,1);assert.equal(state.cleanup[0].state,'failed');
 failDelete=false;
 state=await advanceCategoryMove(saved,ports);
 assert.equal(state.cleanup[0].state,'deleted');assert.equal(calls.send,1);assert.equal(calls.notify,1);assert.equal(calls.place,1);
 for(const extra of [{notify:false},{published:false},{to:'main'}]) {
   const previous=JSON.stringify(calls);
   await advanceCategoryMove(newCategoryMove({...input,...extra},[old]),{...ports,place:async()=>{}});
   assert.equal(JSON.stringify(calls),previous);
 }
 let ambiguous=await advanceCategoryMove(newCategoryMove(input,[old]),{...ports,send:async()=>{throw Error('lost response');}});
 assert.equal(ambiguous.destination,'uncertain');assert.equal(ambiguous.cleanup[0].state,'pending');
 const prior=calls.send;
 await advanceCategoryMove(ambiguous,ports);assert.equal(calls.send,prior);
 const superseded=await advanceCategoryMove({...newCategoryMove(input,[old]),placement:'complete'},{...ports,current:()=>false});
 assert.equal(superseded.destination,'pending');assert.equal(calls.send,prior);
 const previousPlacement=calls.place;
 await advanceCategoryMove(newCategoryMove(input,[old]),{...ports,current:()=>false});
 assert.equal(calls.place,previousPlacement,'A stale retry must not undo a later move');
 const failed=await advanceCategoryMove(newCategoryMove(input,[old]),{...ports,send:async()=>{throw Error('not configured');},definitelyNotSent:()=>true});
 assert.equal(failed.placement,'complete');assert.equal(failed.destination,'failed');assert.equal(failed.cleanup[0].state,'pending');
 const receiptModule={exports:{}};
 const receiptSource=fs.readFileSync(path.join(__dirname,'fixtures/watchlist-category-move-receipts.ts'),'utf8');
 vm.runInNewContext(ts.transpileModule(receiptSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{module:receiptModule,exports:receiptModule.exports});
 const {sourceCategoryReceipts,categoryMoveCopy}=receiptModule.exports;
 const review={events:[{revision:1,body:{kind:'approve',publication:{discordWatchlistGroup:'main'}}},{revision:2,body:{kind:'approve',publication:{discordWatchlistGroup:'general'}}},
 {revision:3,body:{kind:'discord_chunk',status:'acknowledged',approvalRevision:1,receipt:old}},{revision:4,body:{kind:'discord_chunk',status:'acknowledged',approvalRevision:2,receipt:sent}},
 {revision:5,body:{kind:'discord_chunk',status:'started',approvalRevision:1,receipt:sent}}]};
 assert.equal(JSON.stringify(sourceCategoryReceipts(review,'main')),JSON.stringify([old]));
 assert.equal(sourceCategoryReceipts(review,'swings').length,0);
 const overnight=categoryMoveCopy('TGE','top_watches:2026-10-01');assert.match(overnight.title,/Overnight Watches/);assert.match(overnight.body,/next trading session/);assert.ok(!overnight.title.includes('Analysis updated'));
 console.log('PASS: move-only defaults, unpublished/no-op silence, shared-channel receipt safety, cleanup retry without repost, uncertain-send protection, later-move suppression and missing-route placement. Offline state checks only; runtime/UI wiring pending.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
