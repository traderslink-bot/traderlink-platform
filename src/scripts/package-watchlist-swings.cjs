const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const root=process.cwd(),runtime='C:/Users/jerac/.codex/worktrees/watchlist-source-selector/levels-system-post-mtf-handoff-stability';
const pp='aaba4b285c691e2d8d0d63ac9384c4601cbaa6a6',rp='53bb8e6e065aa82cdc9d044eaf57222fa2225adb';
function git(cwd,index,args,input){return cp.execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,...args],{cwd,env:{...process.env,GIT_INDEX_FILE:index},encoding:'utf8',input});}
const platformFiles=['src/lib/live-watchlist/live-watchlist-session-group.ts','src/lib/live-watchlist/live-watchlist-store.ts','src/lib/live-watchlist/live-watchlist-types.ts','app/watchlist/live-watchlist-client.tsx','src/modules/help/watchlist-guides.ts'];
const runtimeFiles=['src/lib/live-watchlist/live-watchlist-audit-archive.ts','src/lib/live-watchlist/live-watchlist-publisher.ts','src/lib/live-watchlist/live-watchlist-types.ts','src/lib/monitoring/manual-watchlist-runtime-manager.ts','src/lib/monitoring/monitoring-types.ts','src/lib/monitoring/watchlist-entry-session.ts','src/lib/monitoring/watchlist-state-persistence.ts','src/lib/monitoring/watchlist-store.ts','src/runtime/manual-watchlist-page.ts','src/runtime/manual-watchlist-server.ts'];
function replaceOne(s,from,to){assert.equal(s.split(from).length,2,from);return s.replace(from,to);}
function groupContracts(s){return s.replaceAll('| "general";','| "general" | "swings";').replaceAll('| "general" | undefined','| "general" | "swings" | undefined')
 .replace(/([\w.]+) === "general"/g,'$1 === "general" || $1 === "swings"')
 .replace(/([\w.]+) !== "general"/g,'$1 !== "general" && $1 !== "swings"');}
for(const [cwd,parent,files,name]of [[root,pp,platformFiles,'platform'],[runtime,rp,runtimeFiles,'runtime']]){
 const index=path.join(root,`data/swings-${name}.index`);git(cwd,index,['read-tree',parent]);
 for(const file of files){
  const raw=git(cwd,index,['show',`${parent}:${file}`]);const before=raw.replace(/\r\n/g,'\n');let after=before;
  if(!file.endsWith('live-watchlist-client.tsx')&&!file.endsWith('watchlist-guides.ts'))after=groupContracts(after);
  if(file.endsWith('manual-watchlist-page.ts')){
   after=replaceOne(after,'<option value="general">General Watchlist</option>','<option value="general">General Watchlist</option>\n        <option value="swings">Swings</option>');
   const end='        <ul id="general-list"></ul>\n      </div>';
   after=replaceOne(after,end,end+'\n      <div class="watchlist-admin-group">\n        <div class="watchlist-group-heading">\n          <h3>Swings</h3>\n          <button class="danger" id="remove-swings-tickers-button" type="button">Clear Swings</button>\n        </div>\n        <ul id="swings-list"></ul>\n      </div>');
   after=replaceOne(after,'general: document.getElementById("general-list"),','general: document.getElementById("general-list"),\n      swings: document.getElementById("swings-list"),');
   after=replaceOne(after,'["general", "General Watchlist"],','["general", "General Watchlist"],\n            ["swings", "Swings"],');
   after=replaceOne(after,'general: "No General Watchlist tickers are active.",','general: "No General Watchlist tickers are active.",\n        swings: "No Swings tickers are active.",');
   const listener='    document.getElementById("remove-general-tickers-button").addEventListener("click", () => deactivateTickerGroup("general", "General Watchlist"));';
   after=replaceOne(after,listener,listener+'\n    document.getElementById("remove-swings-tickers-button").addEventListener("click", () => deactivateTickerGroup("swings", "Swings"));');
  }
  if(file.endsWith('manual-watchlist-server.ts'))after=replaceOne(after,'postmarket, general, or reversal.','postmarket, general, swings, or reversal.');
  if(file.endsWith('live-watchlist-client.tsx')){
   const declaration='  const generalSymbols = activeSymbols.filter(symbol => getLiveWatchlistEntryGroup(symbol) === "general");';
   after=replaceOne(after,declaration,declaration+'\n  const swingSymbols = activeSymbols.filter(symbol => getLiveWatchlistEntryGroup(symbol) === "swings");');
   after=replaceOne(after,'{generalSymbols.length} general','{generalSymbols.length} general / {swingSymbols.length} swings');
   const anchor='          {generalSymbols.length > 0 ? (';
   const section='          {swingSymbols.length > 0 ? (\n            <section className="watchlist-session-list" aria-labelledby="watchlist-swings-heading">\n              <div className="watchlist-session-heading">\n                <h2 id="watchlist-swings-heading">Swings</h2>\n                <span>{swingSymbols.length}</span>\n              </div>\n              <WatchlistTickerTable marketDataStatus={marketDataStatus} ariaLabel="Swings watchlist tickers" symbols={swingSymbols} reverseSplits={reverseSplits} />\n            </section>\n          ) : null}\n';
   after=replaceOne(after,anchor,section+anchor);
  }
  if(file.endsWith('watchlist-guides.ts'))after=replaceOne(after,'Owners can select General Watchlist when adding a ticker or use Move to List in either direction.','Owners can select General Watchlist when adding a ticker or use Move to List in either direction. Swings is a separate list for swing-trade ideas. Select Swings when adding a ticker or use Move to List to move tickers into or out of it. Choosing this list does not change how analysis is generated.');
  assert.notEqual(after,before,file);
  const result=ts.transpileModule(after,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
  assert.equal(result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file);
  if(file.endsWith('live-watchlist-session-group.ts')){
   const module={exports:{}};vm.runInNewContext(result.outputText,{module,exports:module.exports,Intl,Date});
   for(const group of ['swings','general','main','postmarket','top_regular'])assert.equal(module.exports.getLiveWatchlistEntryGroup({watchlistGroup:group,firstPostedAt:0}),group);
  }
  const output=raw.includes('\r\n')?after.replace(/\n/g,'\r\n'):after;
  const blob=git(cwd,index,['hash-object','-w','--stdin'],output).trim();git(cwd,index,['update-index','--add','--cacheinfo',`100644,${blob},${file}`]);
 }
 if(name==='platform')for(const file of ['docs/migration/watchlist-swings-plan.md','docs/migration/watchlist-swings-progress.md','src/scripts/package-watchlist-swings.cjs']){
  const blob=git(cwd,index,['hash-object','-w','--stdin'],fs.readFileSync(file)).trim();git(cwd,index,['update-index','--add','--cacheinfo',`100644,${blob},${file}`]);
 }
 git(cwd,index,['diff','--cached','--check',parent]);
 if(process.argv.includes('--commit')){
  const tree=git(cwd,index,['write-tree']).trim(),commit=git(cwd,index,['commit-tree',tree,'-p',parent,'-m','Add Swings Watchlist grouping without changing analysis behavior']).trim();git(cwd,index,['update-ref',`refs/codex/watchlist-swings-${name}`,commit]);
  console.log(JSON.stringify({name,parent,commit,files:git(cwd,index,['diff-tree','--no-commit-id','--name-only','-r',commit]).trim().split('\n')}));
 }
 console.log(name+': focused syntax and exact group-contract checks passed.');
}
