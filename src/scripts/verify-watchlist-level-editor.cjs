const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const root=path.resolve(__dirname,'../..');
function load(file) {
  const source=fs.readFileSync(path.join(root,file),'utf8'),module={exports:{}};
  const compiled=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  assert.equal(compiled.diagnostics.length,0,file);
  vm.runInNewContext(compiled.outputText,{module,exports:module.exports,structuredClone,require:id=>load(path.posix.join(path.posix.dirname(file),id+'.ts'))});
  return module.exports;
}
const {editLevelRows}=load('src/lib/live-watchlist/analysis-level-row-edit.ts');
const original=[{price:7.15,label:'far',condition:'keep far'},{price:3.24,label:'near',condition:'keep near'}];
const before=JSON.stringify(original),blank={price:null,label:'',condition:''};
assert.equal(editLevelRows(original,'insert-above',0,blank,20)[0].price,null);
assert.equal(editLevelRows(original,'insert-below',0,blank,20)[1].price,null);
assert.equal(editLevelRows(original,'down',0,blank,20)[1].condition,'keep far');
assert.equal(editLevelRows(original,'up',1,blank,20)[0].condition,'keep near');
assert.equal(editLevelRows(original,'sort',0,blank,20)[0].price,3.24);
assert.equal(editLevelRows(original,'insert-above',0,blank,2).length,2);
assert.equal(editLevelRows(original,'up',0,blank,20)[0].price,7.15);
assert.equal(JSON.stringify(original),before);
assert.equal(editLevelRows([{low:7},{low:3}],'sort',0,blank,5,'low')[0].low,3);
const {includeBreakoutCheckpoint}=load('src/scripts/fixtures/watchlist-breakout-checkpoint.ts');
const read={breakoutContinuation:{price:3.47,rationale:'Clear the session high.'},targets:original};
const projected=includeBreakoutCheckpoint(read,2.81);
assert.equal(projected.targets.map(row=>row.price).join(','),'3.24,3.47,7.15');
assert.equal(projected.targets[1].label,'Breakout level');
assert.equal(projected.targets[1].condition,'Clear the session high.');
assert.equal(includeBreakoutCheckpoint(projected,2.81).targets.length,3);
assert.equal(includeBreakoutCheckpoint(read,4),read);
assert.equal(includeBreakoutCheckpoint({...read,breakoutContinuation:{price:null,rationale:''}},2.81).targets.length,2);
const same=includeBreakoutCheckpoint({...read,targets:[{price:3.47,label:'old',condition:'Retain explanation'}]},2.81);
assert.equal(same.targets.length,1);assert.equal(same.targets[0].condition,'Retain explanation');
assert.equal(JSON.stringify(original),before);
const {prepare}=require('./package-watchlist-level-editor.cjs');
const packageSources=prepare();
for(const [file,text] of [...packageSources.platform,...packageSources.changes]) {
  if(!/\.tsx?$/.test(file)) continue;
  const compiled=ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
  assert.equal(compiled.diagnostics.length,0,file);
}
const entry=path.join(root,'src/lib/live-watchlist/analysis-level-row-edit.ts');
const fixture=path.join(root,'src/scripts/fixtures/watchlist-breakout-checkpoint.ts');
const program=ts.createProgram([entry,fixture],{strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,types:[]});
const diagnostics=ts.getPreEmitDiagnostics(program);
assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')).join('\n'));
console.log('PASS: whole-row insert/reorder/sort, limits, immutable originals, GOW breakout sequence, duplicate reuse, null/already-cleared breakout. No network or AI calls.');
