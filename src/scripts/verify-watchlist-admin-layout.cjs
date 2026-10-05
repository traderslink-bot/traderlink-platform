const assert=require('node:assert/strict'),vm=require('node:vm');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const {JSDOM}=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/jsdom');
const {prepare}=require('./package-watchlist-admin-layout.cjs');const maps=prepare();
function load(s,imports={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(s,{compilerOptions:{target:99,module:1}}).outputText,{module,exports:module.exports,require:x=>imports[x]||{}});return module.exports;}
for(const map of Object.values(maps))for(const [file,text]of map){const out=ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{target:99,module:1}});assert.equal(out.diagnostics.filter(d=>d.category===1).length,0,file);}
const row=load(maps.runtime.get('src/runtime/manual-watchlist-row-review.ts')).WATCHLIST_ROW_REVIEW;
const page=load(maps.runtime.get('src/runtime/manual-watchlist-page.ts'),{'./manual-watchlist-row-review.js':{WATCHLIST_ROW_REVIEW:row},'./manual-watchlist-analysis-review-panel.js':{ANALYSIS_REVIEW_PANEL:''},'./manual-watchlist-discord-mentions-panel.js':{WATCHLIST_DISCORD_MENTIONS_PANEL:''}}).MANUAL_WATCHLIST_PAGE;
const premium=load(maps.platform.get('src/modules/watchlist/server/runtime/watchlist-premium-control.ts')).WATCHLIST_PREMIUM_CONTROL;
for(const html of [page,row,premium])for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const dom=new JSDOM('<div id="header"><div class="entry-title">TEST</div><div class="meta">technical</div><div class="meta error-line">error stays</div><div class="entry-state">operation</div></div><div id="root"></div>',{runScripts:'outside-only',url:'https://example.test'});
const w=dom.window;let calls=0;w.fetch=async()=>{calls++;return {ok:true,json:async()=>({premiumOnly:false})};};
const start=row.indexOf('  const expandedActions = new Set();'),end=row.indexOf('  function attach(',start);assert(start>0&&end>start);
w.eval(row.slice(start,end)+'\nwindow.makeGroups=groups;');
const header=w.document.getElementById('header'),root=w.document.getElementById('root');
let g=w.makeGroups('TEST',root,header);
assert.deepEqual(Array.from(root.children,x=>x.tagName),['DIV','DIV','DETAILS']);
assert.deepEqual(Array.from(root.querySelectorAll('h4'),x=>x.textContent),['Access','Move','Posting','Settings','Diagnostics','Remove']);
assert.equal(g.diagnostics.textContent,'technical');assert(header.textContent.includes('error stays'));assert(header.textContent.includes('operation'));
assert(root.querySelector('details').contains(g.move));assert(root.querySelector('details').contains(g.options));assert(!root.querySelector('details').contains(g.review));
w.eval(premium.match(/<script>([\s\S]*?)<\/script>/)[1]);w.watchlistPremiumControl('TEST',g.options);
assert.equal(g.access.querySelectorAll('input[role="switch"]').length,2);assert.equal(g.options.querySelectorAll('input').length,0);
assert.equal(g.access.querySelectorAll('.watchlist-access-option').length,2);assert.equal(calls,2);
const details=root.querySelector('details');details.open=true;details.dispatchEvent(new w.Event('toggle'));root.replaceChildren();g=w.makeGroups('TEST',root,header);assert(root.querySelector('details').open);
console.log('PASS: embedded scripts parse; actual DOM grouping; both Premium switches routed to Access; errors retained; diagnostics moved; primary controls outside disclosure; expanded state preserved; no live network calls.');
dom.window.close();
