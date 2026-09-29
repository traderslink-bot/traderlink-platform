const cp = require('node:child_process'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ts = require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const root = process.cwd(), runtime = 'C:/Users/jerac/.codex/worktrees/watchlist-source-selector/levels-system-post-mtf-handoff-stability';
const pp = '0b7a88ce37b0531a3181d3f46c97cbbc54c26d9d', rp = '00e2dfc210a8dc27f470b5b199c08f407cef0257';
function git(cwd,args,input,index) { return cp.execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,...args],{cwd,env:{...process.env,...(index?{GIT_INDEX_FILE:index}:{})},input,encoding:'utf8'}); }
const changes = { platform: new Map(), runtime: new Map() };
function edit(lane,file,fn) { const cwd=lane==='platform'?root:runtime, parent=lane==='platform'?pp:rp;
 const raw=git(cwd,['show',`${parent}:${file}`]), before=raw.replace(/\r\n/g,'\n'), after=fn(before);
 assert.notEqual(after,before,file); changes[lane].set(file,{before,after,crlf:raw.includes('\r\n')}); }
function one(s,a,b) { assert.equal(s.split(a).length,2,a); return s.replace(a,b); }
function source(s) { return ts.createSourceFile('file.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX); }
function method(s,name,fn) { const found=[]; function walk(n){if(ts.isMethodDeclaration(n)&&n.name.getText()===name)found.push(n);ts.forEachChild(n,walk);} walk(source(s)); assert.equal(found.length,1,name); const n=found[0];return s.slice(0,n.getStart())+fn(n.getText(),n)+s.slice(n.end); }
// Mirror only AST fields/spreads, never an entire containing object or method.
function mirror(s) { const edits=[]; function walk(n){
 if ((ts.isPropertySignature(n)||ts.isPropertyAssignment(n))&&n.name.getText()==='tradersLinkAiReadCardVisible') { edits.push(n);return; }
 if(ts.isSpreadAssignment(n)&&n.getText().includes('tradersLinkAiReadCardVisible')) { edits.push(n);return; }
 ts.forEachChild(n,walk); } walk(source(s)); assert.ok(edits.length);
 for(const n of edits.sort((a,b)=>b.pos-a.pos)) { const text=n.getText().replaceAll('tradersLinkAiReadCardVisible','indicatorCardVisible'); const sep=ts.isPropertySignature(n)?'':','; const indent=s.slice(s.lastIndexOf('\n',n.getStart())+1,n.getStart()); s=s.slice(0,n.getStart())+text+sep+'\n'+indent+s.slice(n.getStart()); } return s; }
for(const lane of ['platform','runtime']) {
 for(const file of ['src/lib/live-watchlist/live-watchlist-types.ts','src/lib/live-watchlist/live-watchlist-store.ts'].filter(f=>lane==='platform'||!f.endsWith('store.ts'))) edit(lane,file,mirror);
}
for(const file of ['src/lib/monitoring/monitoring-types.ts','src/lib/monitoring/watchlist-store.ts','src/lib/monitoring/watchlist-state-persistence.ts','src/lib/live-watchlist/live-watchlist-audit-archive.ts']) edit('runtime',file,s=>{
 s=mirror(s);
 if(file.endsWith('watchlist-state-persistence.ts')) { const needle='  if (\n    value.tradersLinkAiReadCardVisible !== undefined'; const start=s.indexOf(needle);assert.ok(start>=0);const end=s.indexOf('\n  }',start)+4; const block=s.slice(start,end); s=s.slice(0,start)+block.replaceAll('tradersLinkAiReadCardVisible','indicatorCardVisible')+'\n\n'+s.slice(start); }
 return s;
});
edit('platform','app/api/admin/watchlist/runtime/[...path]/route.ts',s=>one(s,'  "/api/watchlist/ai-read-visibility",','  "/api/watchlist/ai-read-visibility",\n  "/api/watchlist/indicator-visibility",'));
edit('platform','app/watchlist/live-watchlist-client.tsx',s=>{
 s=one(s,'  const traderReadCard = symbol.cards.liveTraderRead;','  // Retired: retain stored history, but never render the legacy card.\n  const traderReadCard = LEGACY_WATCHLIST_READ_ENABLED ? symbol.cards.liveTraderRead : undefined;');
 s=one(s,'if (symbol.watchlistLifecycleLabelsVisible !== true || !lifecycle)', 'if (!LEGACY_WATCHLIST_READ_ENABLED || symbol.watchlistLifecycleLabelsVisible !== true || !lifecycle)');
 s=one(s,'function WatchlistLifecycleBadge(', 'const LEGACY_WATCHLIST_READ_ENABLED = false;\n\nfunction WatchlistLifecycleBadge(');
 const card='      <WatchlistIndicatorsCard key={`${symbol.symbol}:${symbol.firstPostedAt}`} symbol={symbol.symbol} firstPostedAt={symbol.firstPostedAt} livePrice={symbol.latestPrice} />';
 return one(s,card,'      {symbol.indicatorCardVisible !== false ? (\n'+card+'\n      ) : null}');
});
edit('platform','app/api/live-watchlist/indicators/refresh/route.ts',s=>s.replaceAll('ticker.status === "deactivated" ||','ticker.status === "deactivated" || ticker.indicatorCardVisible === false ||').replaceAll('ticker.status !== "deactivated" &&','ticker.status !== "deactivated" && ticker.indicatorCardVisible !== false &&'));
edit('platform','app/api/live-watchlist/symbols/[symbol]/indicators/route.ts',s=>one(s,'  const snapshot = readCachedWatchlistIndicators','  if (ticker.indicatorCardVisible === false) return Response.json({ snapshot: null }, { headers });\n  const snapshot = readCachedWatchlistIndicators'));
edit('platform','src/modules/watchlist/server/indicators/indicator-refresh-runtime.ts',s=>{
 s=one(s,'import "server-only";','import "server-only";\nimport { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";');
 s=one(s,'      load: async input => {','      load: async input => {\n        const allowed = async () => {\n          const ticker = await new LiveWatchlistStore().getSymbol(input.request.symbol);\n          return !!ticker && ticker.status !== "deactivated" && ticker.indicatorCardVisible !== false;\n        };');
 s=one(s,'return fetchIndicatorHistory({ ...input, coordinator,','return fetchIndicatorHistory({ ...input, coordinator, requestAllowed: allowed,');
 return s;
});
edit('platform','src/lib/live-watchlist/indicators/indicator-history-provider.ts',s=>{
 s=one(s,'  nextEnd?: number | null;','  nextEnd?: number | null;\n  /** Recheck owner visibility immediately before each queued transport/retry. */\n  requestAllowed?: () => Promise<boolean>;');
 const old='execute: signal => requestIndicatorHistoryPage({ provider: input.provider, url, signal, accessToken: input.accessToken, fetcher: input.fetcher })';
 return one(s,old,'execute: async signal => {\n        if (input.requestAllowed && !(await input.requestAllowed())) return { ok: false as const, reason: "permission" as const, requestAccepted: false as const };\n        return requestIndicatorHistoryPage({ provider: input.provider, url, signal, accessToken: input.accessToken, fetcher: input.fetcher });\n      }');
});
edit('runtime','src/lib/monitoring/manual-watchlist-runtime-manager.ts',s=>{
 s=one(s,'function resolveInitialLiveTraderReadCardVisible(): boolean {','const LEGACY_WATCHLIST_READ_ENABLED = false;\n\nfunction resolveInitialLiveTraderReadCardVisible(): boolean {');
 s=one(s,'private liveTraderReadCardVisible = resolveInitialLiveTraderReadCardVisible();','private liveTraderReadCardVisible = LEGACY_WATCHLIST_READ_ENABLED && resolveInitialLiveTraderReadCardVisible();');
 s=one(s,'this.liveTraderReadCardVisible =\n      options.initialLiveTraderReadCardVisible ?? resolveInitialLiveTraderReadCardVisible();','this.liveTraderReadCardVisible = LEGACY_WATCHLIST_READ_ENABLED &&\n      (options.initialLiveTraderReadCardVisible ?? resolveInitialLiveTraderReadCardVisible());');
 s=one(s,'this.watchlistLifecycleLabelsVisible = options.initialWatchlistLifecycleLabelsVisible ?? false;','this.watchlistLifecycleLabelsVisible = false; // Retired.');
 s=method(s,'setLiveTraderReadCardVisible',m=>one(m,'this.liveTraderReadCardVisible = visible;','visible = false; // Compatibility endpoint cannot revive retired UI.\n    this.liveTraderReadCardVisible = false;'));
 s=method(s,'setWatchlistLifecycleLabelsVisible',m=>one(m,'this.watchlistLifecycleLabelsVisible = visible;','visible = false;\n    this.watchlistLifecycleLabelsVisible = false;'));
 s=method(s,'pullbackReadEnabled',m=>one(m,'return this.options.pullbackReadEnabled !== false;','return false; // Legacy-only Yahoo polling is retired; Indicators use their own loader.'));
 s=method(s,'setTradersLinkAiReadCardVisible',m=>m+'\n\n  async setIndicatorCardVisible(symbolInput: string, visible: boolean): Promise<WatchlistEntry | null> {\n    const symbol = normalizeSymbol(symbolInput);\n    const entry = this.watchlistStore.patchEntry(symbol, { indicatorCardVisible: visible });\n    if (!entry) return null;\n    this.persistWatchlist();\n    if (this.liveWatchlistPublisher && this.isWatchlistPublicationApproved({ symbol, cards: {} })) {\n      await this.liveWatchlistPublisher.publish({ symbol, updatedAt: this.options.now?.() ?? Date.now(), indicatorCardVisible: visible, cards: {} });\n    }\n    return entry;\n  }');
 s=method(s,'refreshPullbackReadIntradayCandles',m=>{
 m=one(m,'|| !entry?.active)', '|| !entry?.active || entry.indicatorCardVisible === false)');
 m=one(m,'const volumeRead = this.resolveLiveVolumeRead(', 'const volumeRead = entry.tags.includes("auto-reversal-watch") ? this.resolveLiveVolumeRead(');
 m=one(m,'        endTimeMs,\n      );','        endTimeMs,\n      ) : null;');return m;
 });
 s=method(s,'applyLiveTraderReadCardVisibility',m=>one(m,'...(entry ? { watchlistGroup: getWatchlistEntrySessionGroup(entry) } : {}),','...(entry ? { watchlistGroup: getWatchlistEntrySessionGroup(entry), indicatorCardVisible: entry.indicatorCardVisible !== false } : {}),'));
 s=method(s,'publishWebsitePullbackTraderRead',m=>one(one(m,'const reversalWatchEntry = watchlistEntry?.tags.includes("auto-reversal-watch") === true;','const reversalWatchEntry = watchlistEntry?.tags.includes("auto-reversal-watch") === true;\n    // Only the separate reversal workflow still consumes this legacy calculation.\n    if (!reversalWatchEntry) return;'),'(!pullbackReadEnabled && tradeSetupReadMode === "off")','(!pullbackReadEnabled && tradeSetupReadMode === "off" && !reversalWatchEntry)'));
 // Avoid legacy volume computation on ordinary ticker price updates.
 const marker='      const yahooLiveVolumeRead ='; const at=s.indexOf(marker); assert.ok(at>0);
 const preceding=s.lastIndexOf('if (technicalContext) {',at); assert.ok(at-preceding<100);
 s=s.slice(0,preceding)+s.slice(preceding).replace('if (technicalContext) {','if (technicalContext && this.watchlistStore.getEntry(update.symbol)?.tags.includes("auto-reversal-watch") === true) {');
 return s;
});
edit('runtime','src/runtime/manual-watchlist-server.ts',s=>{
 const start=s.indexOf('    if (request.method === "POST" && url.pathname === "/api/watchlist/ai-read-visibility") {');assert.ok(start>=0);
 const end=s.indexOf('\n    if (',start+10);assert.ok(end>start);
 const block=s.slice(start,end).replaceAll('ai-read-visibility','indicator-visibility').replaceAll('setTradersLinkAiReadCardVisible','setIndicatorCardVisible');
 return s.slice(0,start)+block+'\n'+s.slice(start);
});
edit('runtime','src/runtime/manual-watchlist-page.ts',s=>{
 const start=s.indexOf('        const aiCardVisible =');assert.ok(start>=0);
 const end=s.indexOf('        actions.appendChild(aiVisibilityButton);',start)+'        actions.appendChild(aiVisibilityButton);'.length;
 let block=s.slice(start,end).replaceAll('aiCardVisible','indicatorCardVisible').replaceAll('aiVisibilityButton','indicatorVisibilityButton').replaceAll('tradersLinkAiReadCardVisible','indicatorCardVisible').replaceAll('ai-read-visibility','indicator-visibility').replaceAll('AI Card: Shown','Indicator card: On').replaceAll('AI Card: Hidden','Indicator card: Off').replaceAll('TradersLink AI Read','Indicator card').replaceAll('AI Read visibility','Indicator visibility').replace('indicatorVisibilityButton.disabled = aiReadConfigured === false;','indicatorVisibilityButton.setAttribute("role", "switch");\n        indicatorVisibilityButton.setAttribute("aria-label", "Show indicator card for " + entry.symbol);\n        indicatorVisibilityButton.setAttribute("aria-checked", String(indicatorCardVisible));');
 s=s.slice(0,end)+'\n\n'+block+s.slice(end);
 for(const id of ['live-trader-read-visible-toggle','watchlist-lifecycle-labels-visible-toggle']) {
 const label='<label for="'+id+'">';const pos=s.indexOf(label);assert.ok(pos>=0);const div=s.lastIndexOf('<div class="provider-control">',pos);assert.ok(div>=0);
 s=s.slice(0,div)+s.slice(div).replace('<div class="provider-control">','<div class="provider-control" hidden style="display:none">'); }
 return s;
});
edit('platform','src/modules/help/watchlist-guides.ts',s=>one(s,'Owners can select General Watchlist when adding a ticker','Each ticker has an Indicator card switch in Watchlist Admin. Turning it off hides the card and stops its indicator data requests; turning it on resumes scheduled updates. Analysis and other ticker features are unchanged. The old Trader Read card and lifecycle labels are retired. Owners can select General Watchlist when adding a ticker'));
edit('platform','docs/migration/watchlist-deterministic-indicators-plan.md',s=>s+'\n\n## Per-ticker visibility and legacy retirement\n\nOwner-approved follow-up: [plan](watchlist-legacy-retirement-plan.md) and [progress](watchlist-legacy-retirement-progress.md). Local implementation and focused offline checks are complete; coordinated deployment and hosted/visual acceptance remain pending. Off hides the indicator card and suppresses its provider requests without disabling current Analysis or other market-data consumers.\n');
// Syntax-only checkpoint, plus an exact diff. Does not start a server or call any provider.
for(const [lane,files] of Object.entries(changes)) {
 let count=0;for(const [file,{after}] of files) { if(!/\.tsx?$/.test(file))continue;count++;const result=ts.transpileModule(after,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});assert.equal(result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file); }
 console.log(`${lane}: ${count} source files pass focused syntax checks.`);
}
if(process.argv.includes('--package')) for(const [lane,files] of Object.entries(changes)) {
 const cwd=lane==='platform'?root:runtime,parent=lane==='platform'?pp:rp,index=path.join(root,`data/legacy-retirement-${lane}.index`);
 git(cwd,['read-tree',parent],undefined,index);
 const write=(file,content)=>{const blob=git(cwd,['hash-object','-w','--stdin'],content,index).trim();git(cwd,['update-index','--add','--cacheinfo',`100644,${blob},${file}`],undefined,index);};
 for(const [file,{after,crlf}] of files)write(file,crlf?after.replace(/\n/g,'\r\n'):after);
 if(lane==='platform')for(const file of ['docs/migration/watchlist-legacy-retirement-plan.md','docs/migration/watchlist-legacy-retirement-progress.md','src/scripts/package-watchlist-legacy-retirement.cjs','src/scripts/verify-watchlist-legacy-retirement.cjs'])write(file,fs.readFileSync(file));
 git(cwd,['diff','--cached','--check',parent],undefined,index);
 const tree=git(cwd,['write-tree'],undefined,index).trim();
 if(process.argv.includes('--commit')) { const commit=git(cwd,['commit-tree',tree,'-p',parent,'-m','Retire legacy Watchlist read and add per-ticker indicator control'],undefined,index).trim();git(cwd,['update-ref',`refs/codex/watchlist-legacy-retirement-${lane}`,commit],undefined,index);console.log(JSON.stringify({lane,parent,commit})); }
 console.log(git(cwd,['diff','--cached','--stat',parent],undefined,index));
}
module.exports={changes};
