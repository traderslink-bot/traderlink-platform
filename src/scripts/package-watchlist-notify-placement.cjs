const cp=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability',parent='d59756865440b34bc6e9bcd1ae56f5e5599ef0f6';
const env={...process.env,GIT_INDEX_FILE:path.join(process.cwd(),'data/notify-placement.index')};
const git=(args,input)=>cp.execFileSync('git',['-c',`safe.directory=${runtime}`,...args],{cwd:runtime,env,input,encoding:'utf8',maxBuffer:12e6}).trimEnd();
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,a);return s.replace(a,b);};
const file='src/runtime/manual-watchlist-row-review.ts';let s=git(['show',`${parent}:${file}`])+'\n';
s=replace(s,'    if (state?.listed && hasPublishableDraft(state)) {','    let analysisNotifyLabel = null;\n    if (entry.watchlistGroup !== "private" && hasPublishableDraft(state)) {');
s=replace(s,"label.append(checkbox, document.createTextNode(' Notify users')); options.prepend(label);","label.append(checkbox, document.createTextNode(' Notify users of the approved analysis')); analysisNotifyLabel = label;");
s=replace(s,"if (entry.watchlistGroup !== \"private\" && (ready || pending.has(entry.symbol))) actions.append(approve);","if (entry.watchlistGroup !== \"private\" && (ready || pending.has(entry.symbol))) {\n      const publicationControls = document.createElement('div'); publicationControls.className = 'watchlist-analysis-publication-controls';\n      publicationControls.append(approve);\n      if (analysisNotifyLabel) publicationControls.append(analysisNotifyLabel);\n      actions.append(publicationControls);\n    }");
s=replace(s,' Notify users for ticker-only post',' Notify published without analysis');
s=replace(s,'</style>',`.watchlist-analysis-publication-controls { display:flex; flex-direction:column; align-items:flex-start; gap:6px; max-width:100%; }
.watchlist-analysis-publication-controls > button { margin:0; min-height:40px; max-width:100%; white-space:normal; }
.watchlist-analysis-publication-controls > label { display:flex; align-items:center; gap:6px; margin:0; width:auto; cursor:pointer; }
@media(max-width:600px) { .watchlist-analysis-publication-controls > button,.watchlist-analysis-publication-controls > label { min-height:44px; } }
</style>`);
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');assert.equal(ts.transpileModule(s,{fileName:file,reportDiagnostics:true}).diagnostics.length,0);new (require('node:vm').Script)(s.slice(s.indexOf('<script>')+8,s.indexOf('</script>')));
assert.ok(!s.includes("document.createTextNode(' Notify users')); options.prepend"));assert.ok(s.includes('publicationControls.append(approve);'));assert.ok(s.includes('publicationControls.append(analysisNotifyLabel)'));
const files=new Map([[file,s]]);
// Execute the actual checkbox block for first, re-added, listed and private drafts.
const vm=require('node:vm'),block=s.slice(s.indexOf('    let analysisNotifyLabel = null;'),s.indexOf('    const approve = document.createElement'));
for(const listed of [false,true])for(const group of ['main','overnight','private'])for(const selected of [false,true]){
 const choices=new Map([['cycle:2',selected]]),context={entry:{watchlistGroup:group,symbol:'TEST'},state:{listed,status:'Ready for review'},hasPublishableDraft:x=>x.status==='Ready for review',choiceKey:'cycle:2',notificationChoices:choices,pending:new Set(),document:{createElement:()=>({style:{},children:[],append(...x){this.children.push(...x)}}),createTextNode:x=>x}};
 vm.runInNewContext(block+';globalThis.result=analysisNotifyLabel;',context);
 assert.equal(Boolean(context.result),group!=='private');
 if(context.result){const checkbox=context.result.children[0];assert.equal(checkbox.checked,selected);checkbox.checked=!selected;checkbox.onchange();assert.equal(choices.get('cycle:2'),!selected);}
}
if(process.argv.includes('--commit')){git(['read-tree',parent]);for(const[f,text]of files){const blob=git(['hash-object','-w','--stdin'],text);git(['update-index','--add','--cacheinfo',`100644,${blob},${f}`]);}const tree=git(['write-tree']);git(['diff','--check',parent,tree]);const sha=git(['commit-tree',tree,'-p',parent],'Keep analysis notification choice beside its approval action\n');git(['update-ref','refs/codex/watchlist-notify-placement',sha]);console.log(JSON.stringify({sha,parent,allowlist:[...files.keys()]}));}else console.log('PASS: TS syntax, embedded JS syntax, checkbox placement and exact labels.');
