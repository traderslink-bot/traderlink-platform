const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'../../../..');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {parseSimpleAnalysis}=require('../simple-analysis.ts');
const {makeAnalysisEdit,mergeAnalysisEdit}=require('../analysis-inline-edit.ts');
const {editLevelRows}=require('../analysis-level-row-edit.ts');
const {analysisPullbacks}=require('../owner-analysis-pullbacks.ts');
const {parseTradersLinkAiRead}=require('../traderslink-ai-read.ts');
const {buildPremiumAnalysisPreview,HIDDEN_ANALYSIS_PRICE}=require('../premium-analysis-preview.ts');
const fixture=fs.readFileSync(path.join(__dirname,'traderslink-ai-read.test.ts'),'utf8').match(/function validBody\(\) \{[\s\S]*?\n\}/)[0];
const base=()=>({...JSON.parse(vm.runInNewContext(fixture+';validBody()')),
 version:3,pullbackPlans:{shallow:null,deep:null},failureRecovery:null});
const plan=i=>({zoneLow:1-i*.001,zoneHigh:1.01-i*.001,confirmationPrice:1.02,confirmation:'Wait for buyers',rationale:'Owner description',invalidationPrice:null,firstObjectivePrice:null,evidenceIds:[],hidden:i===2});
const simple=()=>({setup:'Setup',pullbacks:Array.from({length:12},(_,i)=>({low:.9-i*.01,high:.91-i*.01,explanation:'Owner zone',confirmation:'Wait',invalidation:null,hidden:i===2})),upside:Array.from({length:75},(_,i)=>({low:2+i,high:2+i,explanation:'Owner target'})),invalidation:null});
function card(){const file=path.join(root,'app/watchlist/simple-analysis-card.tsx'),exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,require:name=>name==='react/jsx-runtime'?require(name):name.endsWith('.css')?{}:name.includes('analysis-history-lines')?{AnalysisHistoryLines:()=>null}:name.includes('analysis-trader-notes')?{AnalysisTraderNotes:()=>null}:require(name),Set,Date});return exports.SimpleAnalysisCard;}
test('both saved formats accept large owner lists without truncation',()=>{
 const detail={...base(),ownerPullbacks:Array.from({length:12},(_,i)=>plan(i)),targets:Array.from({length:75},(_,i)=>({label:'',price:2+i,condition:'Wait'}))};
 const parsed=parseTradersLinkAiRead(JSON.stringify(detail));assert.ok(parsed);assert.equal(parsed.ownerPullbacks.length,12);assert.equal(parsed.targets.length,75);
 const read={...base(),analysisFormat:'simple',simpleAnalysis:simple()};
 assert.equal(parseSimpleAnalysis(simple()).pullbacks.length,12);assert.equal(parseTradersLinkAiRead(JSON.stringify(read)).simpleAnalysis.upside.length,75);
});
test('legacy visibility migrates into each row and empty owner lists override the old pair',()=>{
 const legacy={...base(),ownerHiddenSections:['deep'],pullbackPlans:{shallow:plan(0),deep:plan(1)}};
 const patch=makeAnalysisEdit(legacy);assert.equal(patch.ownerPullbacks.length,2);assert.equal(patch.ownerPullbacks[1].hidden,true);assert.equal(patch.pullbackPlans,undefined);
 const merged=mergeAnalysisEdit(legacy,{ownerPullbacks:[]});assert.deepEqual(analysisPullbacks(merged),[]);assert.equal(legacy.pullbackPlans.deep.zoneLow,.999);
 const s={...base(),analysisFormat:'simple',simpleAnalysis:simple(),ownerHiddenSections:['shallow']};delete s.simpleAnalysis.pullbacks[0].hidden;
 const edit=makeAnalysisEdit(s);assert.equal(edit.simpleAnalysis.pullbacks[0].hidden,true);assert.ok(!edit.ownerHiddenSections.includes('shallow'));
});
test('insert, move, sort and delete preserve whole rows beyond previous limits',()=>{
 const rows=Array.from({length:75},(_,i)=>({price:100-i,condition:String(i),hidden:i===40}));
 const inserted=editLevelRows(rows,'insert-below',74,{price:1,condition:'new'},Infinity);assert.equal(inserted.length,76);
 const moved=editLevelRows(inserted,'up',40,null,Infinity);assert.equal(moved[39].hidden,true);assert.equal(moved[39].condition,'40');
 assert.equal(editLevelRows(moved,'sort',0,null,Infinity)[0].condition,'new');assert.equal(rows.length,75);
});
test('real simple card renders numbered extra pullbacks and all targets with hidden rows excluded',()=>{
 const read={...base(),analysisFormat:'simple',simpleAnalysis:simple()},before=JSON.stringify(read);
 const html=renderToStaticMarkup(React.createElement(card(),{read}));
 assert.match(html,/>Pullback 1</);assert.match(html,/>Pullback 12</);assert.doesNotMatch(html,/>Pullback 3</);assert.equal((html.match(/Owner target/g)||[]).length,75);
 assert.equal(JSON.stringify(read),before);
});
test('Premium preview numbers extra rows without leaking their prices or hidden text',()=>{
 const read={...base(),ownerPullbacks:Array.from({length:12},(_,i)=>({...plan(i),rationale:i===2?'Hidden description':'Watch $1.2345'}))};
 const preview=buildPremiumAnalysisPreview(read),text=JSON.stringify(preview);
 assert.ok(preview.sections.some(s=>s.title==='Pullback 12'));assert.ok(!preview.sections.some(s=>s.title==='Pullback 3'));assert.ok(!text.includes('1.2345')&&!text.includes('Hidden description'));assert.ok(text.includes(HIDDEN_ANALYSIS_PRICE));
});
test('malformed row visibility is rejected and preview projection clears generated evidence',()=>{
 assert.equal(parseSimpleAnalysis({...simple(),pullbacks:[{...simple().pullbacks[0],hidden:'yes'}]}),null);
 const merged=mergeAnalysisEdit(base(),{ownerPullbacks:[{...plan(0),evidenceIds:['forged']}]});assert.deepEqual(merged.ownerPullbacks[0].evidenceIds,[]);
 assert.equal(parseTradersLinkAiRead(JSON.stringify({...base(),ownerPullbacks:[{...plan(0),hidden:'yes'}]})),null);
});
