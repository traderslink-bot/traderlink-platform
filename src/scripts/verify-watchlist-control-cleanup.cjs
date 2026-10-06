const assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process'),path=require('node:path');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const {prepare,parent,runtime,file}=require('./package-watchlist-control-cleanup.cjs'),map=prepare();
const globalChanges=require('./package-watchlist-auto-notify.cjs').prepare();
function load(f){const s=map.get(f)??globalChanges.get(f)??cp.execFileSync('git',['-c',`safe.directory=${runtime}`,'-C',runtime,'show',`${parent}:${f}`],{encoding:'utf8'}),m={exports:{}};vm.runInNewContext(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:m.exports,module:m,require:id=>load(path.posix.join(path.posix.dirname(f),id.replace(/\.js$/,'.ts')))});return m.exports;}
const html=load(file).MANUAL_WATCHLIST_PAGE;let scripts=0;for(const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)){new vm.Script(match[1]);scripts++;}assert.ok(scripts>0);
const s=map.get(file),start=s.indexOf('        if (entry.lifecycle === "activating") {\n        const deactivateButton'),end=s.indexOf('        item.appendChild(meta)',start),block=s.slice(start,end);
assert.ok(start>0&&end>start);
for(const lifecycle of ['activating','active','activation_failed','refresh_pending','extension_pending']){const buttons=[];vm.runInNewContext(block,{entry:{lifecycle},document:{createElement:()=>({addEventListener:()=>{}})},actionGroups:{remove:{appendChild:b=>buttons.push(b)}}});assert.equal(buttons.length,lifecycle==='activating'?1:0);if(buttons.length)assert.equal(buttons[0].textContent,'Cancel');}
assert.ok(html.includes('Notify users of the approved analysis'));assert.ok(html.includes('Notify users when analyses publish automatically'));
assert.ok(!html.includes('Potential dip-buy plan: Shown'));assert.ok(!html.includes('Repost Snapshot'));assert.ok(html.includes('Copy Thread'));assert.ok(html.includes('Retry activation'));
console.log(`PASS: ${scripts} assembled browser scripts parse with both pending notification changes; activation-only Cancel checked across five lifecycle states; removed buttons absent, preserved labels/actions present.`);
