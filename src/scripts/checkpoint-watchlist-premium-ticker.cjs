const cp=require('node:child_process'),path=require('node:path');
const {prepare,parent,deleted}=require('./package-watchlist-premium-ticker.cjs');
const files=prepare();
const env={...process.env,GIT_INDEX_FILE:path.join(process.cwd(),'data/watchlist-premium-ticker.index')};
const git=(args,input)=>cp.execFileSync('git',args,{env,input,encoding:'utf8',maxBuffer:20e6}).trim();
git(['read-tree',parent]);
for(const file of deleted)git(['update-index','--force-remove',file]);
for(const [file,content] of files){const blob=git(['hash-object','-w','--stdin'],content);git(['update-index','--add','--cacheinfo',`100644,${blob},${file}`]);}
const tree=git(['write-tree']);git(['diff','--check',parent,tree]);
const sha=git(['commit-tree',tree,'-p',parent],'Add independent Premium-only ticker visibility and detail access\n');
git(['update-ref','refs/codex/checkpoints/watchlist-premium-ticker',sha]);
console.log(JSON.stringify({sha,parent,changed:[...files.keys()],deleted},null,2));
