const ts=require('typescript');
const path=require('node:path');
const root=process.cwd();
const roots=['src/modules/news/contracts/press-release-filters.ts','src/modules/news/contracts/news-outbound-link.ts','src/modules/news/server/press-release-filter-query.ts','app/(dashboard)/press-releases/press-release-filter-controls.tsx','app/(dashboard)/press-releases/press-release-article-drawer.tsx'];
const options={lib:['lib.esnext.d.ts','lib.dom.d.ts'],strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,allowSyntheticDefaultImports:true,baseUrl:root,paths:{'@/*':['./*']},types:['node','react']};
const program=ts.createProgram(roots.map(file=>path.join(root,file)),options);
const diagnostics=ts.getPreEmitDiagnostics(program);
console.log(JSON.stringify({scope:'Actual filter/URL/query contracts and filter/drawer React component types',roots:roots.length,sourceFiles:program.getSourceFiles().length,diagnostics:diagnostics.length}));
if(diagnostics.length){console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));process.exitCode=1;}
