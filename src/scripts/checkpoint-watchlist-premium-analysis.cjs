const cp=require('node:child_process'),path=require('node:path');
const {prepare,parent}=require('./package-watchlist-premium-analysis.cjs');
const files=prepare();
const env={...process.env,GIT_INDEX_FILE:path.join(process.cwd(),'data/watchlist-premium-analysis.index')};
const git=(args,input)=>cp.execFileSync('git',args,{env,input,encoding:'utf8',maxBuffer:20e6}).trim();
git(['read-tree',parent]);
for(const [file,source] of files){const blob=git(['hash-object','-w','--stdin'],source);git(['update-index','--add','--cacheinfo',`100644,${blob},${file}`]);}
const tree=git(['write-tree']);git(['diff','--check',parent,tree]);
const sha=git(['commit-tree',tree,'-p',parent], 'Add per-ticker Premium analysis price previews and owner controls\n');
git(['update-ref','refs/codex/checkpoints/watchlist-premium-analysis',sha]);
console.log(JSON.stringify({sha,parent,allowlist:[...files.keys()]},null,2));
