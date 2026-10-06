const assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const {prepare,base}=require('./package-watchlist-auto-notify.cjs');const files=prepare(),disk=new Map(),cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);const result=ts.transpileModule(files.get(file)??base(file),{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});assert.equal(result.diagnostics.length,0,file);const m={exports:{}};cache.set(file,m.exports);vm.runInNewContext(result.outputText,{module:m,exports:m.exports,process,console,require:id=>id==='node:fs'?{readFileSync:p=>{if(!disk.has(p))throw Object.assign(new Error('missing'),{code:'ENOENT'});return disk.get(p)},mkdirSync:()=>{},writeFileSync:(p,v)=>disk.set(p,v),renameSync:(a,b)=>disk.set(b,disk.get(a))}:id.startsWith('.')?load(path.posix.join(path.posix.dirname(file),id.replace(/\.js$/,'.ts'))):require(id)});return m.exports;}
for(const[f,s]of files)assert.equal(ts.transpileModule(s,{fileName:f,reportDiagnostics:true}).diagnostics.length,0,f);
const P=load('src/lib/ai/traderslink-ai-read-settings.ts').TradersLinkAiReadSettingsPersistence,p=new P({filePath:'/test/settings.json'});
assert.equal(p.save(false).notifyAutomaticAnalysisUpdates,true);
const input={...p.load(),notifyAutomaticAnalysisUpdates:false};p.save(input);assert.equal(new P({filePath:'/test/settings.json'}).load().notifyAutomaticAnalysisUpdates,false);
p.save(false);assert.equal(p.load().notifyAutomaticAnalysisUpdates,false,'Unrelated save preserves OFF');
p.save({...p.load(),notifyAutomaticAnalysisUpdates:true});assert.equal(p.load().notifyAutomaticAnalysisUpdates,true);
const legacy=p.load();delete legacy.notifyAutomaticAnalysisUpdates;disk.set('/test/settings.json',JSON.stringify(legacy));assert.equal(p.load().notifyAutomaticAnalysisUpdates,true,'Legacy defaults ON');
const manager=files.get('src/lib/monitoring/manual-watchlist-runtime-manager.ts');
assert.equal(manager.split('notifyUsers: this.notifyAutomaticAnalysisUpdates').length,2);
assert.match(manager,/initialNotifyAutomaticAnalysisUpdates !== false/);
const api=files.get('src/runtime/manual-watchlist-analysis-review-api.ts');assert.match(api,/typeof settings.notifyAutomaticAnalysisUpdates === "boolean"/);
const panel=files.get('src/runtime/manual-watchlist-analysis-review-panel.ts');assert.match(panel,/"auto-publish", "auto-notify", "owner-notify"/);assert.match(panel,/notifyAutomaticAnalysisUpdates: byId\("auto-notify"\).checked/);
console.log('PASS: five-file TS syntax; persisted ON/OFF/reload/legacy defaults/unrelated save; automatic dispatch and UI/API wiring. No hosted requests or notifications.');
