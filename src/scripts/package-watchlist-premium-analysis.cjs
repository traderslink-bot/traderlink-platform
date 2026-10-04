// Exact-parent overlay: preserve dirty checkout and separately held releases.
const cp=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict');
const parent='3fdd4241777e825195299c899754f933f1c2acaa';
const source=path=>cp.execFileSync('git',['show',`${parent}:${path}`],{encoding:'utf8',maxBuffer:20e6});
function once(s,a,b){assert.equal(s.split(a).length,2,a.slice(0,120));return s.replace(a,b);}
function prepare(){
 const files=new Map();
 const fresh=[
  'src/lib/live-watchlist/premium-analysis-preview.ts',
  'src/modules/watchlist/server/access/watchlist-analysis-visibility.ts',
  'app/api/admin/watchlist/analysis-visibility/route.ts',
  'app/watchlist/premium-analysis-card.tsx','app/watchlist/premium-analysis-card.module.css',
  'src/modules/watchlist/server/runtime/watchlist-premium-control.ts',
  'src/modules/platform/server/database/migrations/0155_platform_watchlist_premium_analysis_access.ts',
  'docs/migration/watchlist-premium-analysis-plan.md','docs/migration/watchlist-premium-analysis-progress.md',
  'src/scripts/package-watchlist-premium-analysis.cjs','src/scripts/verify-watchlist-premium-analysis.cjs','src/scripts/typecheck-watchlist-premium-analysis.cjs',
  'src/scripts/checkpoint-watchlist-premium-analysis.cjs'
 ];
 fresh.forEach(path=>files.set(path,fs.readFileSync(path,'utf8')));
 let path='src/modules/platform/server/database/platform-migration-manifest.ts',s=source(path);
 s='import { platformWatchlistPremiumAnalysisAccessMigration } from "./migrations/0155_platform_watchlist_premium_analysis_access";\n'+s;
 const entry='    Object.freeze({ sourcePath: "src/modules/platform/server/database/migrations/0154_platform_premium_swing_plan_authorship.ts", migration: platformPremiumSwingPlanAuthorshipMigration }),';
 s=once(s,entry,entry+'\n    Object.freeze({ sourcePath: "src/modules/platform/server/database/migrations/0155_platform_watchlist_premium_analysis_access.ts", migration: platformWatchlistPremiumAnalysisAccessMigration }),');
 s=once(s,'    "0154_platform_premium_swing_plan_authorship":','    "0155_platform_watchlist_premium_analysis_access": Object.freeze(["platform_watchlist_analysis_visibility", "platform_watchlist_analysis_visibility_audit"]),\n    "0154_platform_premium_swing_plan_authorship":');files.set(path,s);
 path='src/lib/live-watchlist/live-watchlist-types.ts';s=source(path);s=once(s,'export type LiveWatchlistSymbolState = {','export type LiveWatchlistSymbolState = {\n  premiumAnalysisPricesAllowed?: boolean;\n  premiumAnalysisPreview?: import("./premium-analysis-preview").PremiumAnalysisPreview | null;');files.set(path,s);
 path='src/lib/live-watchlist/watchlist-member-projection.ts';s=source(path);
 s='import { buildPremiumAnalysisPreview } from "./premium-analysis-preview";\nimport { parseTradersLinkAiRead } from "./traderslink-ai-read";\n'+s;
 s=once(s,'analysisAllowed: boolean)', 'analysisAllowed: boolean, pricesAllowed = state.premiumAnalysisPricesAllowed !== false)');
 s=once(s,'  if (!analysisAllowed) {',`  let premiumAnalysisPreview = state.premiumAnalysisPreview ?? null;
  if (!analysisAllowed) premiumAnalysisPreview = null;
  if (analysisAllowed && !pricesAllowed) {
    const body = cards.tradersLinkAiRead?.body;
    const read = body ? parseTradersLinkAiRead(body) : null;
    premiumAnalysisPreview = read && state.tradersLinkAiReadCardVisible !== false ? buildPremiumAnalysisPreview(read) : premiumAnalysisPreview;
  }
  if (!analysisAllowed || !pricesAllowed || premiumAnalysisPreview) {`);
 s=once(s,'return { ...state, cards, membershipAnalysisAllowed:', 'return { ...state, cards, premiumAnalysisPricesAllowed: pricesAllowed, premiumAnalysisPreview, membershipAnalysisAllowed:');
 s=once(s,'...(!analysisAllowed ? {','...(!analysisAllowed || !pricesAllowed || premiumAnalysisPreview ? {');files.set(path,s);
 const accessImport='import { canViewWatchlistAnalysisPrices } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";\n';
 path='app/api/live-watchlist/symbols/[symbol]/route.ts';s=source(path);
 s=once(s,'watchlistDetailProjection(state, features.tradeAnalysis)','watchlistDetailProjection(state, features.tradeAnalysis, canViewWatchlistAnalysisPrices(request.headers, state.symbol))');files.set(path,accessImport+s);
 path='app/watchlist/[symbol]/page.tsx';s=source(path);
 s=once(s,'watchlistDetailProjection(state, features.tradeAnalysis)','watchlistDetailProjection(state, features.tradeAnalysis, canViewWatchlistAnalysisPrices(requestHeaders, state.symbol))');files.set(path,accessImport+s);
 path='app/watchlist/archive/[archiveId]/page.tsx';s=source(path);
 s=once(s,'watchlistDetailProjection(archive.state, features.tradeAnalysis)','watchlistDetailProjection(archive.state, features.tradeAnalysis, canViewWatchlistAnalysisPrices(await headers(), archive.symbol))');
 if(!s.includes('from "next/headers"'))s='import { headers } from "next/headers";\n'+s;files.set(path,accessImport+s);
 path='app/api/live-watchlist/symbols/[symbol]/analysis-history/route.ts';s=source(path);
 s=once(s,'  const state = await new LiveWatchlistStore().getSymbol(symbol);','  if (!canViewWatchlistAnalysisPrices(request.headers, symbol)) return NextResponse.json({ rows: [] }, { headers: { "Cache-Control": "private, no-store" } });\n  const state = await new LiveWatchlistStore().getSymbol(symbol);');files.set(path,accessImport+s);
 path='app/watchlist/live-watchlist-client.tsx';s=source(path);
 s=once(s,'import { SimpleAnalysisCard }','import { PremiumAnalysisCard } from "./premium-analysis-card";\nimport { SimpleAnalysisCard }');
 s=once(s,'<WatchlistFeatureMessage feature="trade_analysis" /> :','<WatchlistFeatureMessage feature="trade_analysis" /> : symbol.premiumAnalysisPreview ? <PremiumAnalysisCard preview={symbol.premiumAnalysisPreview} symbol={symbol.symbol} /> :');
 s=once(s,'setSymbol((current) => watchlistDetailProjection(reconcileLiveWatchlistSymbolState(current, payload.symbol), payload.symbol.membershipAnalysisAllowed !== false));',`setSymbol((current) => {
          const next = reconcileLiveWatchlistSymbolState(current, payload.symbol);
          next.premiumAnalysisPricesAllowed = payload.symbol.premiumAnalysisPricesAllowed;
          next.premiumAnalysisPreview = payload.symbol.premiumAnalysisPreview ?? null;
          if (next.premiumAnalysisPricesAllowed === false) {
            delete next.cards.tradersLinkAiRead;
            delete next.cards.liveTraderRead;
          }
          return watchlistDetailProjection(next, payload.symbol.membershipAnalysisAllowed !== false);
        });`);files.set(path,s);
 path='src/modules/watchlist/server/runtime/watchlist-runtime-admin-document.ts';s=source(path);
 s='import { WATCHLIST_PREMIUM_CONTROL } from "./watchlist-premium-control";\n'+s;
 s=once(s,'  const rewritten = document','  const rewritten = document.replace("function attach(entry, actions, more = actions, options = actions, header = actions, listing = actions) {", "function attach(entry, actions, more = actions, options = actions, header = actions, listing = actions) { window.watchlistPremiumControl?.(entry.symbol, options);")');
 s=s.replaceAll('${SECTION_NAVIGATION_INJECTION}', '${SECTION_NAVIGATION_INJECTION}${WATCHLIST_PREMIUM_CONTROL}');files.set(path,s);
 path='src/modules/help/watchlist-guides.ts';s=source(path);
 s=once(s,'id: "setups", title: "TradersLink Analysis",','id: "setups", title: "TradersLink Analysis",');
 s=once(s,'blocks: [{ kind: "paragraph", text: "Watchlist posts', 'blocks: [{ kind: "paragraph", text: "Some ticker analyses are reserved for Premium members. Free members can read a preview with prices concealed and use Access Premium to join. Other ticker cards remain available under their normal access settings. The owner can change Premium-only analysis separately for each ticker; this does not generate analysis or send a notification. The setting does not recall previously shared Discord or X images." }, { kind: "paragraph", text: "Watchlist posts');files.set(path,s);
 return files;
}
module.exports={prepare,parent,source};
if(require.main===module){for(const [path] of prepare())console.log(path);}
