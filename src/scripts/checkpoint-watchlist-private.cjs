const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {prepare,parents,runtime}=require('./package-watchlist-private.cjs');
const maps=prepare();
for(const p of ['docs/migration/watchlist-private-category-plan.md','docs/migration/watchlist-private-category-progress.md','src/scripts/package-watchlist-private.cjs','src/scripts/verify-watchlist-private.cjs','src/scripts/typecheck-watchlist-private.cjs','src/scripts/checkpoint-watchlist-private.cjs'])maps.platform.set(p,fs.readFileSync(p,'utf8'));
for(const [lane,files] of Object.entries(maps)){
 const cwd=lane==='platform'?process.cwd():runtime;
 const env={...process.env,GIT_INDEX_FILE:path.join(process.cwd(),'data',`watchlist-private-${lane}.index`)};
 const git=(args,input)=>cp.execFileSync('git',['-c',`safe.directory=${runtime}`,...args],{cwd,env,input,encoding:'utf8',maxBuffer:20e6}).trim();
 git(['read-tree',parents[lane]]);
 for(const [file,content] of files){const blob=git(['hash-object','-w','--stdin'],content);git(['update-index','--add','--cacheinfo',`100644,${blob},${file}`]);}
 const tree=git(['write-tree']);git(['diff','--check',parents[lane],tree]);
 const sha=git(['commit-tree',tree,'-p',parents[lane]],'Add owner-only Private Watchlist category and ordinary public promotion\n');
 git(['update-ref','refs/codex/checkpoints/watchlist-private',sha]);
 console.log(JSON.stringify({lane,sha,parent:parents[lane],allowlist:[...files.keys()]},null,2));
}
