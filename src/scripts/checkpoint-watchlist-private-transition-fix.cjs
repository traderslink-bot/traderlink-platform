const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const fix=require('./package-watchlist-private-transition-fix.cjs');
const platformParent='890e57d4af90e95c3ecfa5de4bcf7559771a763e';
const platformFiles=['docs/migration/watchlist-private-category-progress.md','src/scripts/package-watchlist-private-transition-fix.cjs','src/scripts/verify-watchlist-private-transition-fix.cjs','src/scripts/checkpoint-watchlist-private-transition-fix.cjs'];
for(const [lane,cwd,parent,files] of [
 ['runtime',fix.runtime,fix.parent,new Map([[fix.file,fix.prepare()]])],
 ['platform',process.cwd(),platformParent,new Map(platformFiles.map(p=>[p,fs.readFileSync(p,'utf8')]))],
]){
 const env={...process.env,GIT_INDEX_FILE:path.join(process.cwd(),'data',`watchlist-private-transition-${lane}.index`)};
 const git=(args,input)=>cp.execFileSync('git',['-c',`safe.directory=${fix.runtime}`,...args],{cwd,env,input,encoding:'utf8',maxBuffer:20e6}).trim();
 git(['read-tree',parent]);
 for(const [file,content] of files){const blob=git(['hash-object','-w','--stdin'],content);git(['update-index','--add','--cacheinfo',`100644,${blob},${file}`]);}
 const tree=git(['write-tree']);git(['diff','--check',parent,tree]);
 const sha=git(['commit-tree',tree,'-p',parent],'Fix Private Watchlist transition acknowledgement and active re-add\n');
 git(['update-ref','refs/codex/checkpoints/watchlist-private-transition-fix',sha]);
 console.log(JSON.stringify({lane,sha,parent,allowlist:[...files.keys()]},null,2));
}
