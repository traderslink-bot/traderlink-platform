const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const path=require('node:path');
const cp=require('node:child_process');
const {prepare,root,runtime,platformParent,runtimeParent}=require('./package-watchlist-category-move.cjs');
const {platform,changes}=prepare();
let failed=false;
for(const [cwd,map] of [[root,platform],[runtime,changes]]){
 const normalize=file=>path.resolve(file).replaceAll('\\','/').toLowerCase();
 const sources=new Map([...map].filter(([file])=>file.endsWith('.ts')&&!file.includes('/fixtures/')).map(([file,text])=>[normalize(path.join(cwd,file)),text]));
 const dependencies=cwd===root?'C:/Users/jerac/Documents/TraderLink/traderlink-platform':runtime;
 const parent=cwd===root?platformParent:runtimeParent;
 const git=args=>cp.execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,...args],{cwd,encoding:'utf8',maxBuffer:20e6});
 const tracked=new Map(git(['ls-tree','-r','--name-only',parent]).trim().split('\n').map(file=>[normalize(path.join(cwd,file)),file]));
 const cache=new Map(),dirs=new Set();for(const file of tracked.keys()){let dir=path.dirname(file).replaceAll('\\','/');while(dir.length>3&&!dirs.has(dir)){dirs.add(dir);dir=path.dirname(dir).replaceAll('\\','/');}}
 const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,esModuleInterop:true,allowSyntheticDefaultImports:true,jsx:ts.JsxEmit.ReactJSX,baseUrl:cwd,paths:{'@/*':['./*']},typeRoots:[dependencies+'/node_modules/@types'],types:['node']};
 const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);
 host.readFile=file=>{const key=normalize(file);if(sources.has(key))return sources.get(key);if(tracked.has(key)){if(!cache.has(key))cache.set(key,git(['show',parent+':'+tracked.get(key)]));return cache.get(key);}return read(file);};
 host.fileExists=file=>sources.has(normalize(file))||tracked.has(normalize(file))||exists(file);
 const directoryExists=host.directoryExists.bind(host);host.directoryExists=dir=>dirs.has(normalize(dir))||directoryExists(dir);
 host.resolveModuleNames=(names,containing)=>names.map(name=>ts.resolveModuleName(name,containing,options,host).resolvedModule??ts.resolveModuleName(name,dependencies+'/typecheck.ts',options,host).resolvedModule);
 const program=ts.createProgram([...map.keys()].filter(file=>file.endsWith('.ts')&&!file.includes('/fixtures/')).map(file=>path.join(cwd,file)),options,host);
 const errors=ts.getPreEmitDiagnostics(program).filter(d=>!d.file||sources.has(normalize(d.file.fileName)));
 if(errors.length){failed=true;console.log(ts.formatDiagnosticsWithColorAndContext(errors,{getCurrentDirectory:()=>cwd,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));}
}
if(failed)process.exitCode=1;else console.log('PASS: scoped strict TypeScript check of prepared integration files against installed dependencies.');
