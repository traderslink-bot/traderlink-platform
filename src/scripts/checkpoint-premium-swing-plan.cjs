// Explicit local checkpoint only. No push, checkout, branch switch or deployment.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {parent,candidate}=require('./premium-swing-plan-candidate.cjs');
if(process.argv[2]!=='--create')throw Error('Use --create only after reviewing the exact candidate and focused checks.');
const overlay=candidate();
const git=(args,options={})=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024,...options}).trim();
const remote=git(['ls-remote','origin','refs/heads/main']).split(/\s/)[0];assert.equal(remote,parent,'Release parent changed; reconcile before checkpointing.');
const before=git(['rev-parse','HEAD']);
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'traderlink-swing-index-')),index=path.join(directory,'index');
const env={...process.env,GIT_INDEX_FILE:index};
try {
  git(['read-tree',parent],{env});
  for(const [file,source] of overlay){
    const blob=git(['hash-object','-w','--stdin'],{input:source});
    git(['update-index','--add','--cacheinfo','100644',blob,file],{env});
  }
  const tree=git(['write-tree'],{env});
  const changed=git(['diff-tree','--no-commit-id','--name-only','-r',parent,tree]).split('\n').filter(Boolean);
  assert.deepEqual([...changed].sort(),[...overlay.keys()].sort(),'Unexpected candidate path set.');
  const commit=git(['commit-tree',tree,'-p',parent],{input:'Add owner-authored Premium swing trade plans\n\nSeparate drafts and publication, safe public previews, explicit Discord delivery and retained visit history.\n'});
  const ref='refs/codex/checkpoints/premium-swing-plans-'+Date.now();
  git(['update-ref',ref,commit]);
  assert.equal(git(['rev-parse','HEAD']),before,'Checkout HEAD must not change.');
  console.log(JSON.stringify({commit,parent,ref,files:changed,pushed:false,deployed:false},null,2));
} finally {
  // Only the exact disposable index created above; never recursive deletion.
  if(fs.existsSync(index))fs.unlinkSync(index);
  if(fs.readdirSync(directory).length===0)fs.rmdirSync(directory);
}
