const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {prepare,parents,runtime}=require('./package-watchlist-admin-layout.cjs');const maps=prepare();
for(const p of ['docs/migration/watchlist-admin-control-layout-plan.md','docs/migration/watchlist-admin-control-layout-progress.md','src/scripts/package-watchlist-admin-layout.cjs','src/scripts/verify-watchlist-admin-layout.cjs','src/scripts/checkpoint-watchlist-admin-layout.cjs'])maps.platform.set(p,fs.readFileSync(p,'utf8'));
for(const [lane,files]of Object.entries(maps)){
 const cwd=lane==='runtime'?runtime:process.cwd(),env={...process.env,GIT_INDEX_FILE:path.join(process.cwd(),'data',`watchlist-admin-layout-${lane}.index`)};
 const git=(args,input)=>cp.execFileSync('git',['-c',`safe.directory=${runtime}`,...args],{cwd,env,input,encoding:'utf8',maxBuffer:20e6}).trim();
 git(['read-tree',parents[lane]]);for(const [file,text]of files){const blob=git(['hash-object','-w','--stdin'],text);git(['update-index','--add','--cacheinfo',`100644,${blob},${file}`]);}
 const tree=git(['write-tree']);git(['diff','--check',parents[lane],tree]);const sha=git(['commit-tree',tree,'-p',parents[lane]],'Organize Watchlist admin ticker controls by task\n');git(['update-ref','refs/codex/checkpoints/watchlist-admin-layout',sha]);console.log(JSON.stringify({lane,sha,parent:parents[lane],allowlist:[...files.keys()]}));
}
