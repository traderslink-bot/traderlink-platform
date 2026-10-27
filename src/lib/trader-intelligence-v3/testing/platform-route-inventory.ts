// Static regression inventory only: never imported by application routes.
// This does not replace runtime authorization or prove all control-flow paths safe.
import { createHash } from "node:crypto";
import ts from "typescript";

export type RouteInventoryEntry = Readonly<{
  path: string;
  excludedOwnerLane?: boolean;
  methods?: Readonly<Record<string, readonly Readonly<{
    name: string;
    module?: string;
    localSha256?: string;
  }>[]>>;
}>;

const httpMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

export function inspectPlatformRoute(path: string, source: string) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const imports = new Map<string, string>();
  const local = new Map<string, ts.Node>();
  const methods = new Map<string, ts.Node>();
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) {
        imports.set(binding.name.text, `${statement.moduleSpecifier.text}#${binding.propertyName?.text ?? binding.name.text}`);
      }
    }
    const exported = ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      local.set(statement.name.text, statement);
      if (exported && httpMethods.has(statement.name.text)) methods.set(statement.name.text, statement);
    }
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        local.set(declaration.name.text, declaration.initializer);
        if (exported && httpMethods.has(declaration.name.text)) methods.set(declaration.name.text, declaration.initializer);
      }
    }
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const binding of statement.exportClause.elements) {
        const target = local.get(binding.propertyName?.text ?? binding.name.text);
        if (httpMethods.has(binding.name.text) && target) methods.set(binding.name.text, target);
      }
    }
  }
  function callsFrom(root: ts.Node): ReadonlySet<string> {
    const calls = new Set<string>();
    const seen = new Set<ts.Node>();
    const visit = (node: ts.Node): void => {
      if (seen.has(node)) return;
      seen.add(node);
      // Do not credit a guard sitting in an uncalled nested helper.
      if (node !== root && (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node))) return;
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        calls.add(name);
        const target = local.get(name);
        if (target) {
          if (ts.isFunctionDeclaration(target) || ts.isArrowFunction(target) || ts.isFunctionExpression(target)) {
            if (target.body) visit(target.body);
          } else visit(target);
        }
      }
      if (ts.isCallExpression(node)) {
        // Include callbacks passed to calls (including Promise.then), not uncalled helpers.
        for (const argument of node.arguments) {
          if ((ts.isArrowFunction(argument) || ts.isFunctionExpression(argument))) visit(argument.body);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(root);
    return calls;
  }
  return {
    methods: Object.fromEntries([...methods].map(([method, node]) => [method, callsFrom(node)])),
    imports,
    localHashes: new Map([...local].map(([name, node]) => [name,
      createHash("sha256").update(node.getText(file)).digest("hex")])),
  };
}

export function platformRouteInventoryFindings(entry: RouteInventoryEntry, source: string): readonly string[] {
  if (entry.excludedOwnerLane) return [];
  if (!entry.methods) return ["missing method inventory"];
  const actual = inspectPlatformRoute(entry.path, source);
  const findings: string[] = [];
  if (JSON.stringify(Object.keys(actual.methods).sort()) !== JSON.stringify(Object.keys(entry.methods).sort())) findings.push("HTTP method inventory changed");
  for (const [method, guards] of Object.entries(entry.methods)) {
    if (!guards.length) findings.push(`${method}: no reviewed boundary`);
    for (const guard of guards) {
      if (!actual.methods[method]?.has(guard.name)) findings.push(`${method}: missing call ${guard.name}`);
      if (guard.module && actual.imports.get(guard.name) !== guard.module) findings.push(`${method}: wrong import ${guard.name}`);
      if (guard.localSha256 && actual.localHashes.get(guard.name) !== guard.localSha256) findings.push(`${method}: local boundary changed ${guard.name}`);
    }
  }
  return findings;
}
