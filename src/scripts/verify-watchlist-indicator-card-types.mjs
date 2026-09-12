import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const dependencies = createRequire(process.env.TRADERLINK_FOCUSED_DEPENDENCY_PACKAGE ?? new URL("../../package.json", import.meta.url));
const ts = dependencies("typescript");
const root = fileURLToPath(new URL("../../", import.meta.url));
const reactTypes = dirname(dependencies.resolve("@types/react/package.json"));
const css = resolve(root, "src/scripts/indicator-css-virtual.d.ts");
const options = { noEmit: true, strict: true, skipLibCheck: true, jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts"], types: [], allowSyntheticDefaultImports: true,
  baseUrl: root, paths: { "@/*": ["./*"], react: [resolve(reactTypes, "index.d.ts")],
    "react/jsx-runtime": [resolve(reactTypes, "jsx-runtime.d.ts")] } };
const host = ts.createCompilerHost(options);
const sourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (file, ...args) => file === css
  ? ts.createSourceFile(file, "declare const styles: Record<string, string>; export default styles;", ts.ScriptTarget.ES2022)
  : sourceFile(file, ...args);
host.resolveModuleNames = (names, containingFile) => names.map(name => name.endsWith(".module.css")
  ? { resolvedFileName: css, extension: ts.Extension.Dts }
  : ts.resolveModuleName(name, containingFile, options, host).resolvedModule);
const program = ts.createProgram([resolve(root, "app/watchlist/watchlist-indicators-card.tsx")], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: file => file, getCurrentDirectory: () => root, getNewLine: () => "\n" }));
  process.exitCode = 1;
} else console.log("PASS: focused strict TypeScript check of the Indicators card and its actual presentation/member contracts. Virtual CSS declaration only; no build, dependency install or generated files.");
