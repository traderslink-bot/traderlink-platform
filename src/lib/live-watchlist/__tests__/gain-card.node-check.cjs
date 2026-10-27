const ts=require('typescript'),path=require('node:path');
const root=path.resolve(__dirname,'../../../..');
const options={noEmit:true,skipLibCheck:true,strict:true,target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,baseUrl:root,paths:{'@/*':['./*']},types:['node','react']};
const program=ts.createProgram(['node_modules/next/types/global.d.ts','app/(dashboard)/admin/watchlist/watchlist-gain-starting-point.tsx','src/lib/live-watchlist/gain-starting-point.ts'].map(p=>path.join(root,p)),options);
const diagnostics=ts.getPreEmitDiagnostics(program);
for(const d of diagnostics)console.error((d.file?.fileName||'')+': '+ts.flattenDiagnosticMessageText(d.messageText,' '));
if(diagnostics.length)process.exitCode=1;else console.log('Gain editor and actual helper pass focused semantic TypeScript check.');
