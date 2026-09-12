import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const dependencies = createRequire(process.env.TRADERLINK_FOCUSED_DEPENDENCY_PACKAGE ?? new URL("../../package.json", import.meta.url));
const ts = dependencies("typescript"), root = fileURLToPath(new URL("../../", import.meta.url));
const modules = dirname(dirname(dependencies.resolve("typescript/package.json")));
const options = { noEmit: true, strict: true, skipLibCheck: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
  types: ["node"], typeRoots: [resolve(modules, "@types")], allowSyntheticDefaultImports: true, baseUrl: root,
  paths: { "@/*": ["./*"], react: [`${modules}/@types/react/index.d.ts`], "react/jsx-runtime": [`${modules}/@types/react/jsx-runtime.d.ts`], "*": [`${modules}/*`] } };
const host = ts.createCompilerHost(options), original = host.getSourceFile.bind(host);
const boundaries = new Map([
  ["@/app/dashboard-template", 'import type { ComponentType, ReactNode } from "react"; export const DashboardPanel: ComponentType<{title: string; children?: ReactNode}>;'],
  ["@/app/watchlist/live-watchlist-client", 'import type { ComponentType } from "react"; export const TradersLinkAiReadCard: ComponentType<any>;'],
  ["./watchlist-analysis-editor", 'import type { ComponentType } from "react"; export const WatchlistAnalysisEditor: ComponentType<{symbol: string; onClose: () => void; onSaved: () => void}>;'],
]);
const virtual = new Map([...boundaries].map(([name, source], index) => [name, { file: resolve(root, `src/scripts/indicator-admin-boundary-${index}.d.ts`), source }]));
host.getSourceFile = (file, ...args) => {
  const boundary = [...virtual.values()].find(value => value.file === file);
  return boundary ? ts.createSourceFile(file, boundary.source, ts.ScriptTarget.ES2022) : original(file, ...args);
};
host.resolveModuleNames = (names, containingFile) => names.map(name => virtual.has(name)
  ? { resolvedFileName: virtual.get(name).file, extension: ts.Extension.Dts }
  : ts.resolveModuleName(name, containingFile, options, host).resolvedModule);
const program = ts.createProgram(["watchlist-indicator-audit-panel.tsx", "watchlist-runtime-admin-client.tsx"].map(file => resolve(root, "app/(dashboard)/admin/watchlist", file)), options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: file => file, getCurrentDirectory: () => root, getNewLine: () => "\n" })); process.exitCode = 1;
} else console.log("PASS: strict focused Indicators admin TypeScript check, actual React/MUI types and audit data contracts; unrelated dashboard shell, existing analysis renderer and editor boundary declarations only. No build or generated files.");
