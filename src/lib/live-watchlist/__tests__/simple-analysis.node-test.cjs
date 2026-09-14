const assert = require("node:assert/strict");
const {test} = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const {renderToStaticMarkup} = require("react-dom/server");
// Low-resource source checks without a Next server, build, browser or paid request.
const compile = (mod,file) => {
  const source=fs.readFileSync(file,"utf8");
  const parsed=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith("tsx")?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length,0,"Source syntax: "+file);
  mod._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);
};
require.extensions[".ts"]=compile;
require.extensions[".tsx"]=compile;
const {SimpleAnalysisCard}=require("../../../../app/watchlist/simple-analysis-card.tsx");
const {makeAnalysisEdit,mergeAnalysisEdit}=require("../analysis-inline-edit.ts");
const {parseSimpleAnalysis}=require("../simple-analysis.ts");
const {parseTradersLinkAiRead}=require("../traderslink-ai-read.ts");
const simple={setup:"A setup <script>unsafe</script>",pullbacks:[
  {low:.2,high:.22,confirmation:"Wait for buyers",invalidation:.19,explanation:"First base"},
  {low:.17,high:.18,confirmation:"Wait for reclaim",invalidation:.16,explanation:"Lower base"}],
  upside:[{low:.27,high:.29,explanation:"Prior resistance"}],invalidation:{price:.16,explanation:"Broader base fails"}};
const read={analysisFormat:"simple",version:3,symbol:"TEST",currentPrice:.25,dataAsOf:1789400000000,
  simpleAnalysis:simple,ownerHiddenSections:[]};
test("stored simple identity parses independently of selector and older current reads still parse",()=>{
  const level={label:"",price:null,rationale:""},context={summary:"",dayTradeRelevance:"",sourceUrls:[]};
  const saved={...read,generatedAt:read.dataAsOf,generationId:"test",marketSession:"regular",bias:"neutral",confidence:"medium",
    currentRead:simple.setup,needsToHold:level,cautionBelow:level,momentumFailure:level,mustClear:level,breakoutContinuation:level,
    targets:[],downsideCheckpoints:[],pullbackPlans:{shallow:null,deep:null},failureRecovery:null,
    catalystRealityCheck:{...context,status:"none"},dilutionRisk:{...context,level:"unknown"},
    listingStatus:{...context,status:"unknown",immediacy:"unknown"},riskSummary:[],sources:[],model:"test",usedWebSearch:false};
  assert.equal(parseTradersLinkAiRead(JSON.stringify(saved)).analysisFormat,"simple");
  assert.equal(parseTradersLinkAiRead(JSON.stringify({...saved,simpleAnalysis:null})),null);
  const current={...saved};delete current.analysisFormat;delete current.simpleAnalysis;
  assert.ok(parseTradersLinkAiRead(JSON.stringify(current)));
});
test("separate card preserves areas, escapes text and hides only owner-selected sections",()=>{
  const before=JSON.stringify(read);
  const html=renderToStaticMarkup(React.createElement(SimpleAnalysisCard,{read}));
  assert.match(html,/\$0.27–\$0.29/);
  assert.match(html,/Deeper pullback/);assert.match(html,/Thesis invalidation/);
  assert.doesNotMatch(html,/<script>|Listing monitor|Dilution risk|Live 5-minute|bias/);
  const hidden=renderToStaticMarkup(React.createElement(SimpleAnalysisCard,{read:{...read,ownerHiddenSections:["shallow","targets"]}}));
  assert.doesNotMatch(hidden,/First base|Where it could go next|Deeper pullback/);
  assert.match(hidden,/Lower base/);assert.match(hidden,/>Pullback</);
  assert.equal(JSON.stringify(read),before);
});
test("owner editing keeps format and range endpoints without overwriting original",()=>{
  const patch=makeAnalysisEdit(read);patch.simpleAnalysis.upside[0].high=.32;
  const merged=mergeAnalysisEdit(read,patch);
  assert.equal(merged.analysisFormat,"simple");
  assert.equal(parseSimpleAnalysis(merged.simpleAnalysis).upside[0].high,.32);
  assert.equal(read.simpleAnalysis.upside[0].high,.29);
  assert.equal(parseSimpleAnalysis({...simple,upside:[{low:NaN,high:.4,explanation:"bad"}]}),null);
});
test("changed TSX editor and card source remain syntactically valid",()=>{
  for(const relative of ["../../../../app/watchlist/live-watchlist-client.tsx","../../../../app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx"]){
    const file=path.resolve(__dirname,relative),source=fs.readFileSync(file,"utf8");
    assert.equal(ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).parseDiagnostics.length,0);
  }
});
