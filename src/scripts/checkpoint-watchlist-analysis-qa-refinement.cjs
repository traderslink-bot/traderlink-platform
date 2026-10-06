const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {prepare,parents,runtime}=require('./package-watchlist-analysis-qa-refinement.cjs');
for(const lane of ['runtime','platform']){
 const files=prepare(lane);
 if(lane==='platform')for(const f of ['docs/migration/watchlist-analysis-qa-refinement-progress.md','src/scripts/package-watchlist-analysis-qa-refinement.cjs','src/scripts/verify-watchlist-analysis-qa-refinement.cjs','src/scripts/checkpoint-watchlist-analysis-qa-refinement.cjs'])files.set(f,fs.readFileSync(f,'utf8'));
 const index=path.join(process.cwd(),`data/analysis-qa-refinement-${lane}.index`);
 const git=(args,input)=>cp.execFileSync('git',[...(lane==='runtime'?['-c',`safe.directory=${runtime}`,'-C',runtime]:[]),...args],{input,encoding:'utf8',maxBuffer:20e6,env:{...process.env,GIT_INDEX_FILE:index}}).trimEnd();
 git(['read-tree',parents[lane]]);
 for(const[f,s]of files){const blob=git(['hash-object','-w','--stdin'],s);git(['update-index','--add','--cacheinfo',`100644,${blob},${f}`]);}
 const tree=git(['write-tree']);git(['diff','--check',parents[lane],tree]);
 const sha=git(['commit-tree',tree,'-p',parents[lane]],'Refine Watchlist analysis instructions and pullback presentation\n');git(['update-ref',`refs/codex/watchlist-analysis-qa-refinement-${lane}`,sha]);
 console.log(JSON.stringify({lane,sha,parent:parents[lane],allowlist:[...files.keys()]}));
}
