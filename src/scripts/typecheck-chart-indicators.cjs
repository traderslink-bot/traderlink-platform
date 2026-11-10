// Read-only TypeScript qualification against an immutable Git source graph.
// Keeps unrelated files in the shared working tree out of this feature check.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),ts=require('typescript');
const root=process.cwd(),ref=process.argv[2];if(!ref||!/^[0-9a-f]{40}$/.test(ref))throw Error('Pass immutable source commit SHA');
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const files=new Set(git('ls-tree','-r','--name-only',ref).trim().split('\n'));
const roots=git('diff','--name-only','caeee3bde2392a7b5a34a9b75659b921c9b095d1',ref).trim().split('\n').filter(file=>/\.(ts|tsx)$/.test(file));
const ambient='src/types/twitter-text.d.ts';if(fs.existsSync(ambient)&&!roots.includes(ambient))roots.push(ambient);
const cache=new Map(),original=ts.createCompilerHost({}),readActual=original.readFile.bind(original),existsActual=original.fileExists.bind(original);
const relative=file=>path.relative(root,file).split(path.sep).join('/');
const passthrough=file=>file.startsWith('../')||file==='node_modules'||file.startsWith('node_modules/')||file.startsWith('.next/')||file==='next-env.d.ts'||file===ambient;
function read(file){const rel=relative(file);if(passthrough(rel))return readActual(file);if(!files.has(rel))return undefined;if(!cache.has(rel))cache.set(rel,git('show',`${ref}:${rel}`));return cache.get(rel);}
const base=JSON.parse(git('show',`${ref}:tsconfig.json`));base.compilerOptions={...base.compilerOptions,noEmit:true,incremental:false,plugins:[],types:['node','react','vitest/globals']};base.include=roots;base.exclude=['node_modules','.next'];
const parsed=ts.parseJsonConfigFileContent(base,ts.sys,root);if(parsed.errors.length)throw Error(ts.formatDiagnosticsWithColorAndContext(parsed.errors,original));
const host=ts.createCompilerHost(parsed.options);host.readFile=read;host.fileExists=file=>{const rel=relative(file);return passthrough(rel)?existsActual(file):files.has(rel);};
const directories=new Set();for(const file of files){let dir=path.dirname(file);while(dir!=='.'){directories.add(dir);dir=path.dirname(dir);}}
const existsDirectory=host.directoryExists?.bind(host);host.directoryExists=dir=>{const rel=relative(dir);return rel===''||passthrough(rel)?existsDirectory?.(dir)??false:directories.has(rel);};
host.getSourceFile=(file,languageVersion)=>{const contents=read(file);return contents===undefined?undefined:ts.createSourceFile(file,contents,languageVersion,true);};
const program=ts.createProgram(parsed.fileNames,parsed.options,host),diagnostics=ts.getPreEmitDiagnostics(program);
console.log(`Immutable ${ref}: ${roots.length} selected roots, ${program.getSourceFiles().length} source/declaration files, ${diagnostics.length} diagnostics.`);
if(diagnostics.length){console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:file=>file,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));process.exitCode=1;}
