// Test-only independent process. No env files, providers, app server or workers.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const root=process.cwd(),resolve=Module._resolveFilename;
Module._resolveFilename=function(name,...args){if(name==='server-only')return path.join(root,'src/test/server-only.ts');if(name.startsWith('@/'))name=path.join(root,name.slice(2));return resolve.call(this,name,...args);};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8').replaceAll('import.meta.url',JSON.stringify(require('node:url').pathToFileURL(file).href)),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const store=require('../news-article-store.ts');
process.once('message',async input=>{try{const a=await store.upsertNewsArticle(input);await store.resetNewsDatabaseForTests();process.send({id:a.id});process.disconnect();}catch(e){console.error(e.message);process.exitCode=1;process.disconnect();}});
process.send({ready:true});
