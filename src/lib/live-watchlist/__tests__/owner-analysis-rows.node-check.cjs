// Bounded semantic check: real row models, parsers, editor and Simple card.
// Only the editor's large dynamically loaded public page is isolated at its props boundary.
const ts = require('typescript');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const options = { noEmit:true, skipLibCheck:true, strict:true, target:ts.ScriptTarget.ES2023,
  module:ts.ModuleKind.ESNext, moduleResolution:ts.ModuleResolutionKind.Bundler,
  jsx:ts.JsxEmit.ReactJSX, esModuleInterop:true, baseUrl:root, paths:{'@/*':['./*']},
  types:['node','react'], allowSyntheticDefaultImports:true };
const host = ts.createCompilerHost(options), read = host.readFile;
host.readFile = filename => filename.endsWith('/app/watchlist/live-watchlist-client.tsx') ? `
import type {ReactNode} from 'react';
import type {LiveWatchlistCardContent,LiveWatchlistSymbolState} from '@/src/lib/live-watchlist/live-watchlist-types';
export declare function TradersLinkAiReadCard(props:{traderNotes?:string|null;card:LiveWatchlistCardContent;
symbol:Pick<LiveWatchlistSymbolState,'marketDataStatus'>;livePrice:number|null;failureRecoveryVisible?:boolean;
dipBuyPlanVisible?:boolean;renderSectionEditor?:(keys:readonly string[])=>ReactNode}):ReactNode;
` : read(filename);
const program=ts.createProgram([
  'node_modules/next/types/global.d.ts',
  'app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx',
  'app/watchlist/simple-analysis-card.tsx',
  'src/lib/live-watchlist/premium-analysis-preview.ts',
].map(file=>path.join(root,file)),options,host);
const diagnostics=ts.getPreEmitDiagnostics(program);
for(const item of diagnostics) console.error((item.file?.fileName||'')+': '+ts.flattenDiagnosticMessageText(item.messageText,' '));
if(diagnostics.length) process.exitCode=1;
else console.log('Owner row models, parser, editor and Simple card semantic check passed.');
