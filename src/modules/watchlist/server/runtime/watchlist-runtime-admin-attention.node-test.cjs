const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const file='app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx';
const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let handler;const visit=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(source)==='onMessage')handler=node.initializer.getText(source);ts.forEachChild(node,visit);};visit(source);assert.ok(handler);
test('actual wrapper attention navigation accepts only its same-origin embedded Admin frame',()=>{
 const frame={},seen=[];const context={window:{location:{origin:'https://fixture.invalid'}},frameRef:{current:{contentWindow:frame}},selectRuntimeSection:section=>seen.push(section)};
 const script=ts.transpileModule('const handler='+handler+';globalThis.handler=handler',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(script,context);
 const message={origin:'https://fixture.invalid',source:frame,data:{source:'traderslink-watchlist-admin',type:'open-analysis-attention'}};
 context.handler({...message,origin:'https://untrusted.invalid'});context.handler({...message,source:{}});context.handler({...message,data:{...message.data,source:'other'}});assert.equal(seen.length,0);
 context.handler(message);assert.deepEqual(seen,['ai-controls']);
});
