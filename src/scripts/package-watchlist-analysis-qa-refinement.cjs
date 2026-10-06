const cp=require('node:child_process'),assert=require('node:assert/strict');
const runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const parents={runtime:'85f43e7e59ee7b1f5c29bc1fbdbf05d6eac8cc6b',platform:'81a964fe97690f72e303aa0f8dc1e27ecf0466e1'};
const base=(lane,f)=>cp.execFileSync('git',[...(lane==='runtime'?['-c',`safe.directory=${runtime}`,'-C',runtime]:[]),'show',`${parents[lane]}:${f}`],{encoding:'utf8',maxBuffer:20e6});
const one=(s,a,b)=>{assert.equal(s.split(a).length,2,a);return s.replace(a,b)};
function prepare(lane){const files=new Map();
if(lane==='runtime'){
 const f='src/lib/ai/traderslink-ai-read-owner-contract.ts';let s=base(lane,f);
 s=one(s,'approachCheckpoints describe up to two meaningful','approachCheckpoints describe up to four meaningful');
 s=one(s,'"maxItems": 2,\n      "description": "Independent observed resistance','"maxItems": 4,\n      "description": "Independent observed resistance');
 s=one(s,'but it may occur before or after recovery establishment.','and it must be above setupRestorePrice; otherwise leave the objective null.');
 s=one(s,'Every material factual claim in Catalyst Reality Check must include the exact URL of at least one source actually used.','Support material catalyst claims with the exact URLs of sources actually used in catalystRealityCheck.sourceUrls only. Do not place source URLs or source-introduction narration in visible summary or dayTradeRelevance prose.');
 // Consolidate repeated upside selection instructions without shrinking evidence or adding rejection rules.
 const lines=s.split('\n');const starts=['Upside coverage:', '- Build an ordered upside route,', '- Do not stop the upside map at a nearby first target'];
 let removed=0;s=lines.filter(line=>{if(starts.some(x=>line.startsWith('  "'+x))){removed++;return false;}return true;}).join('\n');assert.equal(removed,3);
 s=one(s,'  "Pullback presentation:', '  '+JSON.stringify('Upside selection: build one coherent route from the current reference through significant intervening resistance, the main breakout when supported, and useful farther continuation areas. Prefer a few distinct reaction areas, not every minor price. Put meaningful levels below the breakout in approachCheckpoints and levels above it in the selected breakout candidate targets. Four approach slots and six candidate target slots are capacities, not quotas: normally select about three to five significant checkpoints across the route, using more only for distinct material barriers. Do not omit a meaningful intervening level to keep a distant endpoint. Group genuine clusters in the explanation without averaging distinct observed highs into an invented price. Include supported resistance at least 30% above reference when available, and farther when useful; 30% is not a ceiling. Do not invent a level or jump to unrelated historical extremes to fill coverage. The app may add at most two observed outer levels, but do not rely on that to complete your analysis. Explain each selected area briefly: why it matters and what price must do to continue. Never remove valid model or owner-edited levels merely to enforce the preferred row count.')+',\n  "Pullback presentation:');
 files.set(f,s);
 const service='src/lib/ai/traderslink-ai-read-service.ts';s=base(lane,service);
 s=one(s,'raw.approachCheckpoints.map(normalizeTarget).filter((target): target is TradersLinkAiReadTarget => target !== null).slice(0, 2)','raw.approachCheckpoints.map(normalizeTarget).filter((target): target is TradersLinkAiReadTarget => target !== null).slice(0, 4)');
 s=one(s,'((parsed as Record<string, unknown>).approachCheckpoints as unknown[]).slice(0, 2)','((parsed as Record<string, unknown>).approachCheckpoints as unknown[]).slice(0, 4)');
 s=one(s,'but it may occur before or after recovery establishment.','and it must be above setupRestorePrice; otherwise leave the objective null.');
 // Apply the same source-field distinction to the ordinary full prompt.
 s=one(s,'Every material factual claim in Catalyst Reality Check must include the exact URL of at least one source actually used.','Support material catalyst claims with exact source URLs in catalystRealityCheck.sourceUrls, not in visible prose.');
 files.set(service,s);
 const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript'),vm=require('node:vm'),crypto=require('node:crypto');
 const ast=ts.createSourceFile('service.ts',s,ts.ScriptTarget.Latest,true);
 const functions=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&['buildTradersLinkAiReadDeveloperPrompt','buildTradersLinkAiReadResponseSchema'].includes(n.name?.text)).map(n=>n.getText(ast)).join('\n');
 const m={exports:{}};vm.runInNewContext(ts.transpileModule(files.get(f)+'\n'+functions,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:m,exports:m.exports});
 const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
 const test='src/tests/traderslink-ai-read-service.test.ts';let testSource=base(lane,test);
 testSource=one(testSource,'11ca1214b4771a1ad78d6c7899da8ea64ba348b3f76d2704683e1d09da595d76',hash(m.exports.buildTradersLinkAiReadDeveloperPrompt(true)));
 testSource=one(testSource,'f0284008ee7a943a51aca5a9affe1f1885e2fe1af913e9459428f09d02311473',hash(JSON.stringify(m.exports.buildTradersLinkAiReadResponseSchema(true))));
 files.set(test,testSource);
}else{
 const f='app/watchlist/live-watchlist-client.tsx';let s=base(lane,f);
 s=one(s,'heading="Shallow pullback — momentum retest"','heading={showDeep ? "Pullback" : "Pullback"}');
 s=one(s,'description="For traders seeking a controlled retest while momentum remains intact."','description="A potential dip-buy area; wait for the confirmation described below."');
 s=one(s,'heading="Deep pullback — reset setup"','heading={showShallow ? "Deeper pullback" : "Pullback"}');
 s=one(s,'description="For traders waiting for the accelerated move to unwind into its base."','description="A lower area to watch for buyers to return, with its own confirmation and risk level."');
 s=s.replace('heading={showDeep ? "Pullback" : "Pullback"}','heading="Pullback"');files.set(f,s);
 const help='src/modules/help/watchlist-guides.ts';s=base(lane,help);s=one(s,'Analysis card: Shown/Hidden controls the whole analysis for one ticker.','The full analysis labels its nearer dip-buy plan Pullback and its lower alternative Deeper pullback. If only one plan is displayed, it is labelled Pullback. Meaningful resistance can appear before and after the main breakout; the analysis need not fill every available row. Analysis card: Shown/Hidden controls the whole analysis for one ticker.');files.set(help,s);
 const plan='docs/migration/watchlist-runtime-dashboard-admin-plan.md';files.set(plan,base(lane,plan)+'\n\nPrompt/card QA refinement: [progress](watchlist-analysis-qa-refinement-progress.md).\n');
}return files;}
module.exports={prepare,parents,runtime,base};
if(require.main===module)for(const lane of ['runtime','platform'])console.log(lane,[...prepare(lane).keys()]);
