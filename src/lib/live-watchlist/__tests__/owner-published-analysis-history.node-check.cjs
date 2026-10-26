const ts=require('typescript'),path=require('node:path');
const root=path.resolve(__dirname,'../../../..');
const options={noEmit:true,skipLibCheck:true,strict:true,target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,baseUrl:root,paths:{'@/*':['./*']},types:['node','react']};
const host=ts.createCompilerHost(options),read=host.readFile;
// Isolate only the large public page import; all history-specific source is real.
host.readFile=file=>file.endsWith('/app/watchlist/live-watchlist-client.tsx')?`
import type {ReactNode} from 'react';
import type {LiveWatchlistCardContent,LiveWatchlistSymbolState} from '@/src/lib/live-watchlist/live-watchlist-types';
import type {AnalysisHistoryRow} from '@/src/lib/live-watchlist/analysis-publication-history';
export declare function TradersLinkAiReadCard(props:{card:LiveWatchlistCardContent;traderNotes?:string|null;symbol:Pick<LiveWatchlistSymbolState,'marketDataStatus'>;livePrice:number|null;failureRecoveryVisible?:boolean;dipBuyPlanVisible?:boolean;historicalRows?:AnalysisHistoryRow[]}):ReactNode;
`:read(file);
const program=ts.createProgram(['node_modules/next/types/global.d.ts','app/(dashboard)/admin/watchlist/watchlist-analysis-history.tsx','app/watchlist/simple-analysis-card.tsx','app/watchlist/analysis-history-lines.tsx','src/lib/live-watchlist/owner-published-analysis-history.ts'].map(file=>path.join(root,file)),options,host);
const diagnostics=ts.getPreEmitDiagnostics(program);
for(const diagnostic of diagnostics)console.error((diagnostic.file?.fileName||'')+': '+ts.flattenDiagnosticMessageText(diagnostic.messageText,' '));
if(diagnostics.length)process.exitCode=1;else console.log('History projection/viewer and real Simple/timeline components pass bounded semantic check.');
