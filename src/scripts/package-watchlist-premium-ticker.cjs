const cp=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict');
const parent='248624490af0236b71fb002874e7d25e9b3241c0';
const source=p=>cp.execFileSync('git',['show',`${parent}:${p}`],{encoding:'utf8',maxBuffer:20e6});
const deleted=['src/modules/platform/server/database/migrations/0155_platform_watchlist_premium_analysis_access.ts'];
function once(s,a,b){assert.equal(s.split(a).length,2,a.slice(0,100));return s.replace(a,b);}
function prepare(){
 const files=new Map();
 const fresh=['src/modules/watchlist/server/access/watchlist-analysis-visibility.ts','src/modules/watchlist/server/access/watchlist-ticker-projection.ts',
 'app/api/admin/watchlist/analysis-visibility/route.ts','src/modules/watchlist/server/runtime/watchlist-premium-control.ts',
 'src/modules/platform/server/database/migrations/0155_platform_watchlist_premium_access_controls.ts','app/watchlist/premium-ticker-lock.tsx',
 'docs/migration/watchlist-premium-ticker-plan.md','docs/migration/watchlist-premium-ticker-progress.md',
 'src/scripts/package-watchlist-premium-ticker.cjs','src/scripts/verify-watchlist-premium-ticker.cjs','src/scripts/typecheck-watchlist-premium-ticker.cjs','src/scripts/checkpoint-watchlist-premium-ticker.cjs'];
 fresh.forEach(p=>files.set(p,fs.readFileSync(p,'utf8')));
 let p='src/modules/platform/server/database/platform-migration-manifest.ts',s=source(p);
 s=s.replaceAll('0155_platform_watchlist_premium_analysis_access','0155_platform_watchlist_premium_access_controls').replaceAll('platformWatchlistPremiumAnalysisAccessMigration','platformWatchlistPremiumAccessControlsMigration');files.set(p,s);
 p='src/lib/live-watchlist/live-watchlist-list.ts';s=source(p);s=once(s,'> & {\n  companyInfo?', '> & {\n  premiumTickerHidden?: boolean;\n  companyInfo?');files.set(p,s);
 const projectionImport='import { projectWatchlistTickersForViewer } from "@/src/modules/watchlist/server/access/watchlist-ticker-projection";\n';
 p='app/api/live-watchlist/route.ts';s=source(p);s=once(s,'projectLiveWatchlistList(data),','projectWatchlistTickersForViewer(projectLiveWatchlistList(data), request.headers),');files.set(p,projectionImport+s);
 p='app/watchlist/page.tsx';s=source(p);s=once(s,'initialState={projectLiveWatchlistList(state)}','initialState={projectWatchlistTickersForViewer(projectLiveWatchlistList(state), await headers())}');files.set(p,'import { headers } from "next/headers";\n'+projectionImport+s);
 const accessImport='import { canViewWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";\n';
 const lockImport='import { PremiumTickerLock } from "@/app/watchlist/premium-ticker-lock";\n';
 p='app/watchlist/[symbol]/page.tsx';s=source(p);
 s=once(s,'  const state = await new LiveWatchlistStore().getSymbol(symbol);','  if (!canViewWatchlistTicker(requestHeaders, symbol)) return <WatchlistDashboardFrame><PremiumTickerLock /></WatchlistDashboardFrame>;\n  const state = await new LiveWatchlistStore().getSymbol(symbol);');
 s=once(s,'return buildWatchlistPreviewMetadata(`/watchlist/${symbol.toUpperCase()}`);','return buildWatchlistPreviewMetadata(canViewWatchlistTicker(await headers(), symbol) ? `/watchlist/${symbol.toUpperCase()}` : "/watchlist");');files.set(p,accessImport+lockImport+s);
 p='app/watchlist/archive/[archiveId]/page.tsx';s=source(p);
 s=once(s,'<LiveWatchlistArchiveDetailClient archive=', '<LiveWatchlistArchiveDetailClient archive=');
 s=once(s,'  return (\n    <WatchlistDashboardFrame>','  if (!canViewWatchlistTicker(await headers(), archive.symbol)) return <WatchlistDashboardFrame><PremiumTickerLock /></WatchlistDashboardFrame>;\n  return (\n    <WatchlistDashboardFrame>');files.set(p,accessImport+lockImport+s);
 p='app/watchlist/archive/page.tsx';s=source(p);s=once(s,'  return (\n    <WatchlistDashboardFrame>', '  const viewerHeaders = await headers();\n  return (\n    <WatchlistDashboardFrame>');s=once(s,'archives={archives.map(', 'archives={archives.filter(item => canViewWatchlistTicker(viewerHeaders, item.symbol)).map(');files.set(p,'import { headers } from "next/headers";\n'+accessImport+s);
 for(const [path,anchor] of [
  ['app/api/live-watchlist/symbols/[symbol]/route.ts','  const store = new LiveWatchlistStore();'],
  ['app/api/live-watchlist/symbols/[symbol]/analysis-history/route.ts','  const state = await new LiveWatchlistStore().getSymbol(symbol);'],
  ['app/api/live-watchlist/symbols/[symbol]/indicators/route.ts','  const ticker = await new LiveWatchlistStore().getSymbol(symbol);']]){
   s=source(path);s=once(s,anchor,'  if (!canViewWatchlistTicker(request.headers, symbol)) return Response.json({ code: "premium_ticker_required" }, { status: 403, headers: { "Cache-Control": "private, no-store" } });\n'+anchor);files.set(path,accessImport+s);
 }
 p='src/lib/live-watchlist/live-watchlist-events.ts';s=source(p);
 s='import type { LiveWatchlistListSymbol } from "./live-watchlist-list";\n'+s;
 s=once(s,'  id: number;','  id: number;\n  projectSymbol?: (symbol: LiveWatchlistListSymbol) => LiveWatchlistListSymbol;');
 s=once(s,'createLiveWatchlistStream()', 'createLiveWatchlistStream(projectSymbol?: (symbol: LiveWatchlistListSymbol) => LiveWatchlistListSymbol)');
 s=once(s,'{ id, controller }','{ id, controller, projectSymbol }');
 s=once(s,'  const event = encodeSse("symbol", projectLiveWatchlistListSymbol(symbol));','  const projected = projectLiveWatchlistListSymbol(symbol);');
 s=once(s,'  const projected = projectLiveWatchlistListSymbol(symbol);\n  for (const [id, subscriber] of subscribers.entries()) {\n    try {\n      subscriber.controller.enqueue(event);','  const projected = projectLiveWatchlistListSymbol(symbol);\n  for (const [id, subscriber] of subscribers.entries()) {\n    try {\n      subscriber.controller.enqueue(encodeSse("symbol", subscriber.projectSymbol ? subscriber.projectSymbol(projected) : projected));');
 files.set(p,s);
 p='app/api/live-watchlist/stream/route.ts';s=source(p);s=once(s,'createLiveWatchlistStream()', 'createLiveWatchlistStream(symbol => projectWatchlistTickerForViewer(symbol, request.headers))');files.set(p,'import { projectWatchlistTickerForViewer } from "@/src/modules/watchlist/server/access/watchlist-ticker-projection";\n'+s);
 p='app/watchlist/live-watchlist-client.tsx';s=source(p);
 s=once(s,'import { PremiumAnalysisCard }', 'import { PremiumTickerLock } from "./premium-ticker-lock";\nimport { PremiumAnalysisCard }');
 const anchor='const countryFlag = getWatchlistCountryFlag(symbol.companyInfo?.country);';
 s=once(s,anchor,`          if (symbol.premiumTickerHidden) return <a key={symbol.symbol} href="https://whop.com/traderslink-1049/premium-access-2026" className={\`watchlist-row \${compactRows.row}\`}>
            <span className={\`watchlist-symbol-cell \${compactRows.ticker}\`}><strong aria-label="Premium ticker"><span aria-hidden="true" style={{filter:"blur(4px)",userSelect:"none"}}>••••</span></strong><small style={{color:"#b45309",display:"block"}}>Premium members only</small></span>
            <span className={compactRows.details} style={{color:"#b45309",fontWeight:700,textDecoration:"underline"}}>Access Premium</span>
          </a>;
`+anchor);
 s=once(s,'symbols.map((symbol) => symbol.symbol)', 'symbols.filter(symbol => !symbol.premiumTickerHidden).map((symbol) => symbol.symbol)');
 s=once(s,'  const [symbols, setSymbols] = useState(initialState.symbols);','  const [symbols, setSymbols] = useState(initialState.symbols);\n  const knownListKeys = useRef(new Set(initialState.symbols.map(item => item.symbol)));\n  useEffect(() => { knownListKeys.current = new Set(symbols.map(item => item.symbol)); }, [symbols]);');
 s=once(s,'          generatedAt: payload.generatedAt,\n        }));', '          generatedAt: payload.generatedAt,\n        }).filter(item => payload.symbols.some(next => next.symbol === item.symbol)));');
 s=once(s,'      setSymbols((current) => mergeLiveWatchlistListSymbol(current, "cards" in next ? projectLiveWatchlistListSymbol(next) : next));',`      if (!knownListKeys.current.has(next.symbol)) { void refresh(); return; }
      if ("premiumTickerHidden" in next && next.premiumTickerHidden) return;
      setSymbols((current) => mergeLiveWatchlistListSymbol(current, "cards" in next ? projectLiveWatchlistListSymbol(next) : next));`);
 s=once(s,'  const [detailsDenied, setDetailsDenied] = useState(false);','  const [detailsDenied, setDetailsDenied] = useState(false);\n  const [premiumTickerDenied, setPremiumTickerDenied] = useState(false);');
 s=once(s,'if (!cancelled) setDetailsDenied(true);','const denial = await response.json().catch(() => ({}));\n          if (!cancelled) { setPremiumTickerDenied(denial.code === "premium_ticker_required"); setDetailsDenied(true); }');
 s=once(s,'if (detailsDenied) return <WatchlistFeatureMessage feature="ticker_details" />;','if (detailsDenied) return premiumTickerDenied ? <PremiumTickerLock /> : <WatchlistFeatureMessage feature="ticker_details" />;');files.set(p,s);
 p='src/modules/help/watchlist-guides.ts';s=source(p);s=once(s,'Some ticker analyses are reserved for Premium members.', 'Premium-only ticker hides a ticker from free members on the list and locks its detail page. Access Premium opens the membership page. Turning this setting off restores normal ticker access; the independent Premium-only analysis setting remains unchanged. Neither toggle sends notifications. Previously shared URLs or images cannot be recalled. Some ticker analyses are reserved for Premium members.');files.set(p,s);
 files.set('docs/migration/watchlist-premium-analysis-plan.md',source('docs/migration/watchlist-premium-analysis-plan.md')+'\n\n## Owner-approved ticker access extension\n\nSee [Premium-only ticker](watchlist-premium-ticker-plan.md). The child replaces unapplied0155 with0155_platform_watchlist_premium_access_controls; do not release the superseded analysis-only migration. Both controls are independent.\n');
 return files;
}
module.exports={prepare,parent,source,deleted};
if(require.main===module) console.log([...prepare().keys()].join('\n'));
