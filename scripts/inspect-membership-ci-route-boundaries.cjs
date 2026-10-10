// Read-only source inventory over an immutable Git commit. No app or test runtime.
const cp = require("node:child_process");
const path = require("node:path").posix;
const ts = require("typescript");
const ref = process.argv.slice(2).find((argument) => !argument.startsWith("--")) || "c813f492d8cf0b9bacf24bcc8a5a58b4da8da642";
if (!/^[a-f0-9]{7,40}$/.test(ref)) throw Error("Pass an immutable Git commit hash.");
const names = cp.execFileSync("git", ["ls-tree", "-r", "--name-only", ref, "app", "src/lib/trader-intelligence-v3/contracts/route-containment.ts", "src/lib/trader-intelligence-v3/testing/route-containment-ast.ts", "src/lib/trader-intelligence-v3/testing/typescript-source-analysis.ts"], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 }).trim().split("\n");
const analysisRoot = "src/lib/trader-intelligence-v3/";
const selected = names.filter((name) =>
  (name.startsWith("app/") && /\.(ts|tsx)$/.test(name)) ||
  ["contracts/route-containment.ts", "testing/route-containment-ast.ts", "testing/typescript-source-analysis.ts"].some((part) => name === analysisRoot + part));
const data = cp.execFileSync("git", ["cat-file", "--batch"], {
  input: selected.map((name) => `${ref}:${name}\n`).join(""), maxBuffer: 64 * 1024 * 1024,
});
const sources = new Map();
const objectIds = new Map();
let offset = 0;
for (const name of selected) {
  const end = data.indexOf(10, offset);
  const size = Number(data.subarray(offset, end).toString().split(" ")[2]);
  if (!Number.isFinite(size)) throw Error(`Missing Git object: ${name}`);
  sources.set(name, data.subarray(end + 1, end + 1 + size).toString());
  objectIds.set(name, data.subarray(offset, end).toString().split(" ")[0]);
  offset = end + 1 + size + 1;
}
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name).exports;
  const allowed = name.startsWith(analysisRoot) || name === "app/dashboard-navigation.ts";
  if (!allowed || !sources.has(name)) throw Error(`Unapproved analysis import: ${name}`);
  const module = { exports: {} };
  cache.set(name, module);
  const code = ts.transpileModule(sources.get(name), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "module", "exports", code)((specifier) => {
    if (specifier === "typescript") return ts;
    if (!specifier.startsWith(".")) throw Error(`Unexpected dependency: ${specifier}`);
    return load(path.normalize(path.join(path.dirname(name), specifier)) + ".ts");
  }, module, module.exports);
  return module.exports;
}
const matrix = load(analysisRoot + "contracts/route-containment.ts").TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX;
const scanner = load(analysisRoot + "testing/route-containment-ast.ts");
const records = (predicate) => selected.filter(predicate).map((name) => ({ path: name, source: sources.get(name) }));
const args = {
  routeRecords: records((name) => name.startsWith("app/api/") && name.endsWith("/route.ts")),
  intelligenceClientRecords: records((name) => name.startsWith("app/(dashboard)/") || name.startsWith("app/intelligence/")),
  matrix,
};
const findings = scanner.scanTraderIntelligenceRouteContainment(args);
const groups = {};
for (const finding of findings) (groups[finding.code] ||= []).push(finding);
const pages = selected.filter((name) => (name.startsWith("app/(dashboard)/") || name.startsWith("app/intelligence/")) && name.endsWith("/page.tsx"));
const discovered = [...pages, ...scanner.discoverTraderIntelligenceApiRoutes(args)];
const configured = new Set(matrix.map((row) => row.modulePath));
const hrefs = load("app/dashboard-navigation.ts").DASHBOARD_NAVIGATION_HREFS;
const dashboardRoutes = new Set(pages.filter((name) => name.startsWith("app/(dashboard)/")).map((name) => name.slice("app/(dashboard)".length).replace(/\/page.tsx$/, "")));
const movedNavigation = hrefs.filter((href) => !dashboardRoutes.has(href)).map((href) => ({
  href,
  pages: selected.filter((name) => name.endsWith("/page.tsx") && name.replace(/\/\([^/]+\)/g, "").replace(/^app/, "").replace(/\/page.tsx$/, "") === href),
}));
const unclassifiedGuardEvidence = findings.filter((row) => row.code === "ti_v3_route_unclassified").map((row) => {
  const source = sources.get(row.path);
  const ast = ts.createSourceFile(row.path, source, ts.ScriptTarget.Latest, true);
  const candidates = new Set();
  function visit(node) {
    if (ts.isCallExpression(node) && /require|authoriz|verify|guard|with.*Route|cron|secret/i.test(node.expression.getText(ast))) candidates.add(node.expression.getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return { path: row.path, boundaryCallCandidates: [...candidates] };
});
if (process.argv.includes("--inventory")) {
  const httpMethods = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
  const inventory = [...discovered].sort().map((name) => {
    const source = sources.get(name);
    const ast = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, name.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const prior = matrix.find((row) => row.modulePath === name);
    const methods = [];
    function evidence(node) {
      const calls = [];
      function walk(child) {
        if (ts.isCallExpression(child)) {
          const expression = child.expression.getText(ast);
          if (expression.length < 130 && /require|authoriz|verify|guard|with.*(?:Route|Request|Database)|allowed|isSameOrigin|sessions\.(?:resolve|revoke)/i.test(expression)) {
            calls.push({ expression, line: ast.getLineAndCharacterOfPosition(child.getStart(ast)).line + 1 });
          }
        }
        ts.forEachChild(child, walk);
      }
      walk(node);
      return calls;
    }
    for (const statement of ast.statements) {
      const exported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
      if (exported && ts.isFunctionDeclaration(statement) && httpMethods.has(statement.name?.text)) methods.push({ method: statement.name.text, form: "function", evidence: evidence(statement) });
      if (exported && ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
        if (httpMethods.has(declaration.name.getText(ast))) methods.push({ method: declaration.name.getText(ast), form: "variable", initializer: declaration.initializer?.getText(ast).slice(0, 240), evidence: evidence(declaration) });
      }
      if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) for (const element of statement.exportClause.elements) {
        if (httpMethods.has(element.name.text)) methods.push({ method: element.name.text, form: "re-export", module: statement.moduleSpecifier?.getText(ast), symbol: element.propertyName?.text || element.name.text, evidence: [] });
      }
    }
    const page = name.endsWith("/page.tsx");
    return {
      path: name, sourceBlob: objectIds.get(name), kind: page ? "page" : "api",
      priorContract: prior ? { classification: prior.classification, boundary: prior.authorizationBoundary, methods: prior.methods, authentication: prior.authenticationRequirement, authorization: prior.authorizationRequirement, mutation: prior.mutationProtectionRequirement, cache: prior.cachePolicy } : null,
      methods: page ? [{ method: "render", form: "page", evidence: evidence(ast) }] : methods,
      inheritedPageBoundary: !page ? null : name.startsWith("app/(dashboard)/") ? "app/(dashboard)/layout.tsx -> app/dashboard-layout-frame.tsx" : "app/intelligence/layout.tsx",
      reviewStatus: prior ? "existing_matrix_contract_static_scan_only" : page ? "shared_layout_proven_page_specific_review_open" : "method_contract_review_required",
    };
  });
  console.log(JSON.stringify({ ref, limitations: "Evidence inventory, not an authorization verdict. Call names do not prove dominance, correct inputs, or delegated guards. No unclassified route is accepted automatically.", count: inventory.length, inventory }, null, 2));
  process.exit(0);
}
console.log(JSON.stringify({ ref, matrixCount: matrix.length, discoveredCount: discovered.length,
  missingFromMatrix: discovered.filter((name) => !configured.has(name)),
  obsoleteMatrixEntries: [...configured].filter((name) => !discovered.includes(name)),
  findingCounts: Object.fromEntries(Object.entries(groups).map(([key, rows]) => [key, rows.length])),
  methodFindings: findings.filter((row) => row.code !== "ti_v3_route_unclassified"), movedNavigation,
  ...(process.argv.includes("--guards") ? { unclassifiedGuardEvidence } : {}),
}, null, 2));
