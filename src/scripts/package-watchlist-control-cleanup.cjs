// Narrow source package, preserving the Runtime working tree and underlying APIs.
const cp=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability',parent='01f862b5d9fc5cfc256926d52a2eb3c5ae8a1e87';
const git=(args,input,index)=>cp.execFileSync('git',['-c',`safe.directory=${runtime}`,...args],{cwd:runtime,input,encoding:'utf8',maxBuffer:15e6,env:{...process.env,...(index?{GIT_INDEX_FILE:index}:{})}}).trimEnd();
const one=(s,a,b)=>{assert.equal(s.split(a).length,2,a);return s.replace(a,b)};
const file='src/runtime/manual-watchlist-page.ts';
function prepare(){let s=git(['show',`${parent}:${file}`])+'\n';
const start=s.indexOf('          const repostButton ='),end=s.indexOf('          const refreshButton =',start);assert.ok(start>0&&end>start);s=s.slice(0,start)+s.slice(end);
const dipStart=s.indexOf('        const dipBuyPlanVisible ='),dipEnd=s.indexOf('        if (entry.lifecycle === "activation_failed")',dipStart);assert.ok(dipStart>0&&dipEnd>dipStart);s=s.slice(0,dipStart)+s.slice(dipEnd);
s=one(s,'actionGroups.settings.appendChild(refreshButton);','actionGroups.diagnostics.appendChild(refreshButton);');
s=one(s,'"AI Card: Shown" : "AI Card: Hidden"','"Analysis card: Shown" : "Analysis card: Hidden"');
s=one(s,'retryButton.textContent = "Retry";','retryButton.textContent = "Retry activation";');
s=one(s,'        const deactivateButton = document.createElement("button");','        if (entry.lifecycle === "activating") {\n        const deactivateButton = document.createElement("button");');
s=one(s,'deactivateButton.textContent = entry.lifecycle === "activating" ? "Cancel" : "Deactivate";','deactivateButton.textContent = "Cancel";');
s=one(s,'        actionGroups.remove.appendChild(deactivateButton);','        actionGroups.remove.appendChild(deactivateButton);\n        }');
s=one(s,'setStatus(payload.error || "Deactivate failed", true);','setStatus(payload.error || "Cancellation failed", true);');
s=one(s,'setStatus("Deactivated " + payload.entry.symbol);','setStatus("Cancelled activation for " + payload.entry.symbol);');
s=one(s,'setStatus("Deactivate request failed for " + entry.symbol','setStatus("Cancellation request failed for " + entry.symbol');
return new Map([[file,s]]);}
module.exports={prepare,parent,runtime,file};
if(require.main===module){const files=prepare();const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');for(const[f,s]of files){assert.equal(ts.transpileModule(s,{fileName:f,reportDiagnostics:true}).diagnostics.length,0);assert.ok(!s.includes('repostButton'));assert.ok(!s.includes('dipBuyPlanVisibilityButton'));assert.ok(s.includes('actionGroups.diagnostics.appendChild(refreshButton)'));assert.ok(s.includes('"Analysis card: Shown"'));assert.ok(s.includes('"Retry activation"'));}
if(process.argv.includes('--commit')){const index=path.join(process.cwd(),'data/control-cleanup.index');git(['read-tree',parent],undefined,index);for(const[f,s]of files){const b=git(['hash-object','-w','--stdin'],s,index);git(['update-index','--add','--cacheinfo',`100644,${b},${f}`],undefined,index);}const tree=git(['write-tree'],undefined,index);git(['diff','--check',parent,tree],undefined,index);const sha=git(['commit-tree',tree,'-p',parent],'Simplify watchlist ticker controls without removing backend features\n',index);git(['update-ref','refs/codex/watchlist-control-cleanup',sha],undefined,index);console.log(JSON.stringify({sha,parent,allowlist:[...files.keys()]}));}else console.log('PASS: narrow control cleanup and TypeScript syntax.');}
