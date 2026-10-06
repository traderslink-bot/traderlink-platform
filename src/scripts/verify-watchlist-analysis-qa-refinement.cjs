const assert=require('node:assert/strict'),vm=require('node:vm');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const {prepare}=require('./package-watchlist-analysis-qa-refinement.cjs');const r=prepare('runtime'),p=prepare('platform');
const compile=(s,f)=>{const x=ts.transpileModule(s,{fileName:f,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});assert.equal(x.diagnostics.length,0,f);return x.outputText};
for(const[f,s]of [...r,...p])if(/\.tsx?$/.test(f))compile(s,f);
const owner=r.get('src/lib/ai/traderslink-ai-read-owner-contract.ts'),m={exports:{}};vm.runInNewContext(compile(owner,'owner.ts'),{module:m,exports:m.exports});
assert.equal(m.exports.OWNER_REVIEW_RESPONSE_SCHEMA.properties.approachCheckpoints.maxItems,4);
const prompt=m.exports.OWNER_REVIEW_DEVELOPER_PROMPT;
assert.doesNotMatch(prompt,/before or after recovery establishment|claim.*must include the exact URL/);
assert.match(prompt,/sourceUrls only/);assert.match(prompt,/30% is not a ceiling/);assert.match(prompt,/capacities, not quotas/);
const service=r.get('src/lib/ai/traderslink-ai-read-service.ts'),ast=ts.createSourceFile('s.ts',service,ts.ScriptTarget.Latest,true);
const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ownerReviewModelRead');assert.ok(fn);
const ctx={normalizeModelRead:()=>({targets:[]}),normalizeTarget:x=>x,normalizeLevel:x=>x};vm.createContext(ctx);vm.runInContext(compile(fn.getText(ast),'normalize.ts'),ctx);
for(const symbol of ['IPDN','VEEA','SOAR','BMGL','SURG']){
 const approach=[1,2,3,4].map(price=>({price,label:symbol,condition:'Observed supply'}));
 const result=ctx.ownerReviewModelRead({approachCheckpoints:approach,breakoutCandidates:{primary:{level:{price:5},targets:[{price:6},{price:9}]}}},[]);
 assert.deepEqual(Array.from(result.targets,x=>x.price),[1,2,3,4,6,9]);
 assert.equal(ctx.ownerReviewModelRead({approachCheckpoints:approach},[]).targets.length,4);
}
const card=p.get('app/watchlist/live-watchlist-client.tsx');assert.doesNotMatch(card,/Shallow pullback — momentum retest|Deep pullback — reset setup/);
assert.match(card,/heading=\{showShallow \? "Deeper pullback" : "Pullback"\}/);
assert.match(service,/approachCheckpoints as unknown\[\]\)\.slice\(0, 4\)/);
assert.match(service,/if \(ownerDraft\) \{[\s\S]*appendOwnerReviewPotentialPath\(ownerDraft/);
console.log('PASS: modified TS/TSX syntax; four-slot schema and both ingestion paths; actual owner normalizer retains four intermediate plus farther levels, including no-breakout cases; prompt conflicts removed; conditional card labels; owner draft retention unchanged. Synthetic checks only, not historical market replays or paid model evaluation.');
