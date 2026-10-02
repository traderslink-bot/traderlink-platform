const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript'),path=require('node:path'),fs=require('node:fs');
const root=process.cwd(),deps='C:/Users/jerac/Documents/TraderLink/traderlink-platform';
const {execFileSync}=require('node:child_process');
const {parent,base,candidate}=require('./premium-swing-plan-candidate.cjs');
const overlay=candidate();
const tracked=new Set(execFileSync('git',['ls-tree','-r','--name-only',parent],{encoding:'utf8',maxBuffer:8*1024*1024}).trim().split('\n'));
const directories=new Set();for(const file of [...tracked,...overlay.keys()]){let dir=path.posix.dirname(file);while(dir!=='.'){directories.add(dir);dir=path.posix.dirname(dir);}}
const relative=file=>{const r=path.relative(root,file).replace(/\\/g,'/');return !r.startsWith('../')&&!path.isAbsolute(r)?r:null;};
const files=[
'src/modules/swings/swing-plan-contract.ts','src/modules/swings/swing-rich-edit.ts','src/modules/swings/server/swing-plan-store.ts',
'src/modules/swings/server/swing-plan-discord.ts','app/api/admin/journal/swing-plans/route.ts','app/api/admin/journal/swing-plans/discord/route.ts',
'app/api/swings/visits/route.ts','app/swings/swing-visit-recorder.tsx',
'src/modules/platform/server/database/migrations/0154_platform_premium_swing_plan_authorship.ts',
'app/swings/swing-plan-content.tsx','app/admin/journal/swing-plans/swing-rich-editor.tsx','app/admin/journal/swing-plans/swing-post-editor.tsx','app/admin/journal/swing-plans/swing-plan-editor.tsx'];
const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX,baseUrl:root,paths:{'@/*':['./*']},typeRoots:[deps+'/node_modules/@types'],types:['node','react']};
const host=ts.createCompilerHost(options),virtual=path.resolve('data/swing-typecheck-css.d.ts'),read=host.readFile.bind(host),exists=host.fileExists.bind(host),dirExists=host.directoryExists.bind(host);
host.readFile=f=>{if(path.resolve(f)===virtual)return "declare module '*.module.css' {const s:Record<string,string>;export default s;}";const r=relative(f);return r===null?read(f):overlay.get(r)??(tracked.has(r)?base(r):undefined);};
host.fileExists=f=>{if(path.resolve(f)===virtual)return true;const r=relative(f);return r===null?exists(f):overlay.has(r)||tracked.has(r);};
host.directoryExists=f=>{const r=relative(f);return r===null?dirExists(f):r===''||directories.has(r);};
host.resolveModuleNames=(names,containing)=>names.map(name=>ts.resolveModuleName(name,containing,options,host).resolvedModule??ts.resolveModuleName(name,deps+'/check.ts',options,host).resolvedModule);
const d=ts.getPreEmitDiagnostics(ts.createProgram([...files,virtual],options,host));
if(d.length){console.log(ts.formatDiagnosticsWithColorAndContext(d,{getCurrentDirectory:()=>root,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));process.exitCode=1;}else console.log('PASS focused strict TypeScript on exact release-parent overlay: authoring contract, store, renderer, editor and posting routes.');
