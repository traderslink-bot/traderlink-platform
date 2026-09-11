// Bounded semantic check of owner components; the large public page is replaced
// only at its import boundary by the exported card's declared props contract.
const ts = require('typescript');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const dependencies = process.env.WATCHLIST_TYPE_DEPENDENCIES;
if (!dependencies) throw new Error('Set WATCHLIST_TYPE_DEPENDENCIES to the installed Platform node_modules directory.');
const options = { noEmit: true, skipLibCheck: true, strict: true, target: ts.ScriptTarget.ES2023,
  module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true, baseUrl: root, paths: { '@/*': ['./*'], react: [dependencies + '/@types/react/index.d.ts'], 'react/*': [dependencies + '/@types/react/*'], '*': [dependencies + '/*'] },
  typeRoots: [dependencies + '/@types'], types: ['react'] };
const host = ts.createCompilerHost(options), read = host.readFile;
host.readFile = filename => filename.replaceAll('\\', '/').endsWith('/app/watchlist/live-watchlist-client.tsx') ? `
import type { ReactNode } from 'react';
import type { LiveWatchlistCardContent, LiveWatchlistSymbolState } from '@/src/lib/live-watchlist/live-watchlist-types';
export declare function TradersLinkAiReadCard(props: {
  card: LiveWatchlistCardContent; symbol: Pick<LiveWatchlistSymbolState, 'marketDataStatus'>;
  livePrice: number | null; dipBuyPlanVisible?: boolean;
  renderSectionEditor?: (keys: readonly string[]) => ReactNode;
}): ReactNode;
` : read(filename);
const program = ts.createProgram([
  path.join(root, 'app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx'),
  path.join(root, 'app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx'),
], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
for (const item of diagnostics) console.log((item.file?.fileName || '') + ': ' + ts.flattenDiagnosticMessageText(item.messageText, ' '));
if (diagnostics.length) process.exitCode = 1;
else console.log('Owner editor semantic check passed (public page isolated at card props boundary).');
