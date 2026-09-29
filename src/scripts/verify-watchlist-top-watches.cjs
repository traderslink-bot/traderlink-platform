const assert=require('node:assert/strict'),vm=require('node:vm');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const {changes,parents,runtime,git}=require('./package-watchlist-top-watches.cjs');
const read=(lane,file)=>changes[lane].get(file).after;
function evaluate(s,globals={}) {const module={exports:{}};vm.runInNewContext(ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,Date,Intl,console,process:{cwd:()=>'/offline'},require:n=>{throw Error('Unexpected import: '+n);},...globals});return module.exports;}
function extract(s,name){const ast=ts.createSourceFile('file.ts',s,ts.ScriptTarget.Latest,true);const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert.ok(node,name);return node.getText();}
const groups=evaluate(read('platform','src/lib/live-watchlist/top-watches-group.ts'));
const calendar=evaluate(git(runtime,['show',parents.runtime+':src/lib/market-data/us-equity-exchange-calendar.ts']));
const upcoming=evaluate(read('runtime','src/lib/monitoring/top-watches-calendar.ts'),{require:()=>calendar}).upcomingTopWatchesGroup;
for(const [now,date] of [
 ['2026-09-29T20:30:00-04:00','2026-09-30'],
 ['2026-09-30T02:00:00-04:00','2026-09-30'],
 ['2026-09-30T09:29:00-04:00','2026-09-30'],
 ['2026-09-30T09:30:00-04:00','2026-10-01'],
 ['2026-10-02T20:00:00-04:00','2026-10-05'],
 ['2026-09-04T20:00:00-04:00','2026-09-08'],
 ['2026-11-26T12:00:00-05:00','2026-11-27'],
 ['2026-11-27T14:00:00-05:00','2026-11-30'],
 ['2026-12-31T20:00:00-05:00','2027-01-04'],
 ['2025-01-08T20:00:00-05:00','2025-01-10'],
])assert.equal(upcoming(Date.parse(now)),`top_watches:${date}`,now);
const group='top_watches:2026-09-30';assert.equal(groups.topWatchesLabel(group),'Top Watches · Sep 30');
for(const invalid of [null,{},'top_watches','top_watches:2026-02-30','top_watches:2026-9-30','top_watches:<script>'])assert.equal(groups.isTopWatchesGroup(invalid),false);
const platform=evaluate(read('platform','src/lib/live-watchlist/live-watchlist-session-group.ts'),{require:()=>groups});
const entryGroup=evaluate(read('runtime','src/lib/monitoring/watchlist-entry-session.ts'),{require:n=>n.includes('top-watches')?groups:calendar});
for(const g of ['main','general','swings','postmarket','top_regular',group,'top_watches:2026-10-01']) {
 assert.equal(platform.getLiveWatchlistEntryGroup({watchlistGroup:g,firstPostedAt:Date.parse('2026-10-10T12:00:00Z')}),g);
 assert.equal(entryGroup.getWatchlistEntrySessionGroup({watchlistGroup:g,tags:[],activatedAt:Date.parse('2026-10-10T12:00:00Z')}),g);
}
const deps=n=>n.includes('top-watches-group')?groups:n==='node:path'?require(n):n==='node:fs'?new Proxy({},{get:()=>()=>{throw Error('No filesystem writes');}}):{normalizeOvernightLevelReference:()=>undefined,normalizeAiReadAdmission:()=>undefined,normalizePublicationReview:()=>undefined};
const persistence=evaluate(read('runtime','src/lib/monitoring/watchlist-state-persistence.ts')+'\nexport {validateEntry,buildPersistedState};',{require:deps});
const storeModule=evaluate(read('runtime','src/lib/monitoring/watchlist-store.ts'),{require:deps});const store=new storeModule.WatchlistStore();
store.setEntries([{symbol:'FTFT',active:true,priority:1,tags:['manual'],watchlistGroup:group},{symbol:'SOAR',active:true,priority:2,tags:['manual'],watchlistGroup:'top_watches:2026-10-01'}]);
assert.equal(store.getEntry('FTFT').watchlistGroup,group);
const saved=persistence.buildPersistedState(store.getEntries(),Date.now());
for(const entry of saved.entries)assert.equal(persistence.validateEntry(JSON.parse(JSON.stringify(entry))).watchlistGroup,entry.watchlistGroup);
store.patchEntry('FTFT',{watchlistGroup:'general'});assert.equal(store.getEntry('FTFT').watchlistGroup,'general');store.patchEntry('FTFT',{watchlistGroup:group});assert.equal(store.getEntry('SOAR').watchlistGroup,'top_watches:2026-10-01');
const normalizer=evaluate('export '+extract(read('platform','src/lib/live-watchlist/live-watchlist-store.ts'),'normalizeWatchlistGroup'),groups);assert.equal(normalizer.normalizeWatchlistGroup(group),group);
const activation=evaluate('export '+extract(read('runtime','src/lib/monitoring/manual-watchlist-runtime-manager.ts'),'watchlistGroupForActivation'),groups);assert.equal(activation.watchlistGroupForActivation({watchlistGroup:group}),group);
const publisher=evaluate(extract(read('runtime','src/lib/live-watchlist/live-watchlist-publisher.ts'),'buildLiveWatchlistStatusPatch'),{normalizeSymbol:s=>s.toUpperCase()});assert.equal(publisher.buildLiveWatchlistStatusPatch({symbol:'FTFT',status:'live',watchlistGroup:group}).watchlistGroup,group);
const archive=evaluate(read('runtime','src/lib/live-watchlist/live-watchlist-audit-archive.ts')+'\nexport {normalizeArchiveSymbol};',{require:deps});assert.equal(archive.normalizeArchiveSymbol({symbol:'FTFT',watchlistGroup:group},1000).watchlistGroup,group);
const listSource=git(process.cwd(),['show',parents.platform+':src/lib/live-watchlist/live-watchlist-list.ts']);assert.ok(listSource.includes('watchlistGroup: state.watchlistGroup'));
const ui=evaluate(read('runtime','src/runtime/manual-watchlist-page.ts'),{require:()=>({ANALYSIS_REVIEW_PANEL:'',WATCHLIST_ROW_REVIEW:'',WATCHLIST_DISCORD_MENTIONS_PANEL:''})}).MANUAL_WATCHLIST_PAGE;
const scripts=[...ui.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert.ok(scripts.length);for(const script of scripts)new vm.Script(script);
const browser=evaluate('export '+extract(scripts.join('\n'),'isTopWatchesGroup')+'\nexport '+extract(scripts.join('\n'),'topWatchesLabel'));
assert.equal(browser.isTopWatchesGroup(group),true);assert.equal(browser.isTopWatchesGroup('top_watches:2026-02-30'),false);assert.equal(browser.topWatchesLabel(group),groups.topWatchesLabel(group));
assert.ok(ui.includes('dated-top-watches-lists'));assert.ok(ui.includes('...availableTopWatchesGroups.map'));
const server=read('runtime','src/runtime/manual-watchlist-server.ts');assert.equal(server.split('topWatchesTradingDay(body.watchlistGroup.slice(12)).isTradingDay').length-1,2);assert.ok(server.includes('!isTopWatchesGroup(scope)'));
console.log('PASS: ten exchange-calendar cases; valid/invalid fixed dates; unchanged existing groups; persisted two-date buckets; move-in/out; activation/member classification; Admin JavaScript and labels; add/move holiday validation and exact-date clear wiring. Offline only.');
