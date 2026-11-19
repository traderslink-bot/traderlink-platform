import { posix } from "node:path";
import ts from "typescript";

import type { TraderIntelligenceRouteContainmentEntry } from "../contracts";
import {
  extractTraderIntelligenceApiReferences,
  extractTraderIntelligenceModuleDependencies,
  parseTraderIntelligenceTypeScript,
} from "./typescript-source-analysis";

export interface TraderIntelligenceRouteSourceRecord {
  path: string;
  source: string;
}

export type TraderIntelligenceRouteDiscoveryFindingCode =
  | "ti_v3_route_unclassified"
  | "ti_v3_route_matrix_duplicate"
  | "ti_v3_route_method_mismatch"
  | "ti_v3_route_method_unwrapped"
  | "ti_v3_route_wrapper_module_path_mismatch"
  | "ti_v3_route_wrapper_import_unused";

export interface TraderIntelligenceRouteDiscoveryFinding {
  code: TraderIntelligenceRouteDiscoveryFindingCode;
  path: string;
  method: string | null;
  detail: string | null;
}

const HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

const TRADER_INTELLIGENCE_DEPENDENCY =
  /(?:trader-intelligence-v3|trader-analytics|trade-analysis|execution-feedback|level-analysis|raw-trade-timeline|execution-sources|pattern-detection|pattern-normalization|pattern-scoring|user-facing-behavior|user-facing-review|behavior-analysis|trade-coaching|(?:^|\/)(?:coach|coaching)(?:\/|$)|import-commit|saved-trade|journal|manual-execution|period-reflection|real-coach|support-resistance)/i;

function normalizedPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function routePathFromModule(modulePath: string): string {
  return modulePath.replace(/^app/, "").replace(/\/route\.ts$/, "");
}

function referenceMatchesRoute(reference: string, routePath: string): boolean {
  const referenceSegments = reference.split("/").filter(Boolean);
  const routeSegments = routePath.split("/").filter(Boolean);
  if (referenceSegments.length !== routeSegments.length) {
    return false;
  }
  return routeSegments.every((segment, index) => {
    const referenceSegment = referenceSegments[index];
    return (
      /^\[.+\]$/.test(segment) ||
      referenceSegment === "*" ||
      referenceSegment === segment
    );
  });
}

type RouteMethodImplementation = ts.Expression | ts.FunctionDeclaration | null;

function exportedRouteMethods(
  sourceFile: ts.SourceFile,
): Map<string, RouteMethodImplementation> {
  const localInitializers = new Map<string, ts.Expression | null>();
  const exported = new Map<string, RouteMethodImplementation>();

  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      const isExported = statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      );
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }
        localInitializers.set(declaration.name.text, declaration.initializer ?? null);
        if (isExported && HTTP_METHODS.has(declaration.name.text)) {
          exported.set(declaration.name.text, declaration.initializer ?? null);
        }
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      const isExported = statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      );
      localInitializers.set(statement.name.text, null);
      if (isExported && HTTP_METHODS.has(statement.name.text)) {
        exported.set(statement.name.text, statement);
      }
    } else if (ts.isExportDeclaration(statement) && statement.exportClause) {
      if (!ts.isNamedExports(statement.exportClause)) {
        continue;
      }
      for (const element of statement.exportClause.elements) {
        const exportedName = element.name.text;
        const localName = element.propertyName?.text ?? exportedName;
        if (HTTP_METHODS.has(exportedName)) {
          exported.set(exportedName, localInitializers.get(localName) ?? null);
        }
      }
    }
  }
  return exported;
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function wrapperCall(
  implementation: RouteMethodImplementation,
): ts.CallExpression | null {
  if (!implementation || ts.isFunctionDeclaration(implementation)) {
    return null;
  }
  const unwrapped = unwrapExpression(implementation);
  return ts.isCallExpression(unwrapped) &&
    ts.isIdentifier(unwrapped.expression) &&
    unwrapped.expression.text === "withTraderIntelligenceOwnerRoute"
    ? unwrapped
    : null;
}

function resolveStaticString(
  sourceFile: ts.SourceFile,
  expression: ts.Expression | undefined,
): string | null {
  if (!expression) return null;
  const value = unwrapExpression(expression);
  if (ts.isStringLiteral(value)) return value.text;
  if (!ts.isIdentifier(value)) return null;
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === value.text &&
        declaration.initializer &&
        ts.isStringLiteral(unwrapExpression(declaration.initializer))
      ) {
        return (unwrapExpression(declaration.initializer) as ts.StringLiteral).text;
      }
    }
  }
  return null;
}

function containsCall(
  implementation: RouteMethodImplementation,
  acceptedNames: ReadonlySet<string>,
  localFunctions: ReadonlyMap<string, ts.FunctionDeclaration>,
  scannerSettingsHandler: string | null,
): boolean {
  if (!implementation) return false;
  let found = false;
  const visited = new Set<string>();
  const visitHelper = (name: string) => {
    const helper = localFunctions.get(name);
    if (helper?.body && !visited.has(name)) {
      visited.add(name);
      visit(helper.body);
    }
  };
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text;
      if (acceptedNames.has(name)) {
        found = true;
        return;
      }
      visitHelper(name);
      const dependencies = node.arguments[1];
      if (name === scannerSettingsHandler && dependencies && ts.isObjectLiteralExpression(dependencies)) {
        const predicates = dependencies.properties.filter(property =>
          property.name && ts.isIdentifier(property.name) && property.name.text === "owner",
        );
        if (predicates.length === 1 && dependencies.properties.every(property => !ts.isSpreadAssignment(property))) {
          const predicate = predicates[0];
          if (ts.isShorthandPropertyAssignment(predicate)) {
            visitHelper(predicate.name.text);
          } else if (ts.isPropertyAssignment(predicate) && ts.isIdentifier(predicate.initializer)) {
            visitHelper(predicate.initializer.text);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(implementation);
  return found;
}

const PLATFORM_SCOPE_MODULE =
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
const PLATFORM_REQUEST_GUARDS = new Set([
  "requireTraderLinkPlatformRequestIdentity",
  "requireTraderLinkPlatformAuthenticatedRequestIdentity",
  "requireTraderLinkPlatformRequestScope",
]);

const DELEGATED_PLATFORM_GUARDS: Readonly<Record<string, readonly string[]>> = {
  "@/src/modules/communities/server/community-delivery-staging-qa-controller": ["startCommunityDeliveryQa"],
  "@/src/modules/communities/server/stats/community-stats-staging-qa-controller": ["startCommunityStatsQa"],
  "@/src/modules/communities/server/shared-alerts-staging-fixture-controller": ["startSharedFixture"],
  "@/src/modules/partner-alerts/server/partner-alert-owner-review-request": ["partnerAlertOwnerReviewRequestDenied"],
  "@/src/modules/communities/server/coaching-pilot-request-identity": ["requireCoachingPilotRequestIdentity"],
  "@/src/modules/platform/server/administration/platform-admin-authorization": ["requireJournalAdminScope"],
  "@/src/modules/watchlist/server/access/watchlist-admin-authorization": ["withWatchlistAdminDatabase"],
  "@/src/modules/platform/server/authentication/platform-sign-out-request-security": ["isSameOriginPlatformSignOutRequest"],
  "@/src/modules/scanner/alpaca/proxy": ["proxyAlpacaChart"],
  "@/src/modules/news/server/general-market-news-http": ["generalNewsFeedResponse", "generalNewsArticleResponse"],
  "app/api/admin/journal/admin-route-runtime": ["withJournalAdminRequest"],
};

const PLATFORM_WORKER_GUARDS = {
  platform_cron_request: [
    "@/src/modules/platform/server/authentication/platform-cron-request-authorization",
    "isAuthorizedPlatformCronRequest",
  ],
  platform_development_worker: [
    "@/src/modules/platform/server/authentication/development-dashboard-network-boundary",
    "isAuthorizedDevelopmentDashboardWorker",
  ],
} as const;

function importedScannerSettingsHandler(sourceFile: ts.SourceFile): string | null {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.moduleSpecifier.text !== "@/src/modules/scanner/live/server/backend-http") continue;
    const clause = statement.importClause;
    const bindings = clause?.namedBindings;
    if (!clause?.isTypeOnly && bindings && ts.isNamedImports(bindings)) {
      const handler = bindings.elements.find(element =>
        !element.isTypeOnly && (element.propertyName ?? element.name).text === "handleScannerSettings",
      );
      if (handler) return handler.name.text;
    }
  }
  return null;
}

/** Exact synchronous connect contract; a helper name alone never admits OAuth effects. */
function trustedWhopConnectIdentityFlow(sourceFile: ts.SourceFile, guardName: string): boolean {
  if (sourceFile.fileName !== "app/api/billing/whop/connect/route.ts") return false;
  let configurationName: string | undefined;
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.moduleSpecifier.text !== "@/src/modules/platform/server/billing/whop-ai-review-staging-identity" ||
        statement.importClause?.isTypeOnly) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      const binding = bindings.elements.find(element => !element.isTypeOnly &&
        (element.propertyName ?? element.name).text === "loadWhopOAuthRequestConfiguration");
      configurationName = binding?.name.text;
    }
  }
  const handler = sourceFile.statements.find((statement): statement is ts.FunctionDeclaration =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === "GET");
  const request = handler?.parameters[0]?.name;
  if (!configurationName || !handler?.body || !request || !ts.isIdentifier(request) ||
      request.text === guardName || request.text === configurationName || handler.body.statements.length !== 1) return false;
  const attempt = handler.body.statements[0];
  if (!ts.isTryStatement(attempt)) return false;
  const [identityStatement, configurationStatement] = attempt.tryBlock.statements;
  if (!identityStatement || !configurationStatement || !ts.isVariableStatement(identityStatement) ||
      !ts.isVariableStatement(configurationStatement) || identityStatement.declarationList.declarations.length !== 1 ||
      configurationStatement.declarationList.declarations.length !== 1) return false;
  const identity = identityStatement.declarationList.declarations[0];
  const configuration = configurationStatement.declarationList.declarations[0];
  if (!ts.isIdentifier(identity.name) || !identity.initializer || !ts.isCallExpression(identity.initializer) ||
      !ts.isIdentifier(identity.initializer.expression) || identity.initializer.expression.text !== guardName ||
      identity.initializer.arguments.length !== 1 || !ts.isIdentifier(identity.initializer.arguments[0]) ||
      identity.initializer.arguments[0].text !== request.text || !configuration.initializer ||
      !ts.isCallExpression(configuration.initializer) || !ts.isIdentifier(configuration.initializer.expression) ||
      configuration.initializer.expression.text !== configurationName || configuration.initializer.arguments.length !== 2) return false;
  const [configurationRequest, userId] = configuration.initializer.arguments;
  return ts.isIdentifier(configurationRequest) && configurationRequest.text === request.text &&
    ts.isPropertyAccessExpression(userId) && userId.name.text === "userId" &&
    ts.isPropertyAccessExpression(userId.expression) && userId.expression.name.text === "scope" &&
    ts.isIdentifier(userId.expression.expression) && userId.expression.expression.text === identity.name.text;
}

function importedPlatformGuards(
  sourceFile: ts.SourceFile,
  boundary: TraderIntelligenceRouteContainmentEntry["authorizationBoundary"],
): ReadonlySet<string> {
  const worker = boundary === "platform_cron_request" || boundary === "platform_development_worker"
    ? PLATFORM_WORKER_GUARDS[boundary]
    : null;
  const guards = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    const modulePath = specifier.startsWith(".")
      ? posix.normalize(posix.join(posix.dirname(sourceFile.fileName), specifier))
      : specifier;
    const bindings = statement.importClause?.namedBindings;
    if (statement.importClause?.isTypeOnly || !bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      if (element.isTypeOnly) continue;
      const imported = (element.propertyName ?? element.name).text;
      if (
        worker
          ? modulePath === worker[0] && imported === worker[1]
          : (modulePath === PLATFORM_SCOPE_MODULE && PLATFORM_REQUEST_GUARDS.has(imported)) ||
            DELEGATED_PLATFORM_GUARDS[modulePath]?.includes(imported) ||
            (modulePath === "@/src/modules/platform/server/billing/whop-ai-review-staging-identity" &&
              imported === "requireWhopOAuthRequestIdentity" && trustedWhopConnectIdentityFlow(sourceFile, element.name.text))
      ) {
        guards.add(element.name.text);
      }
    }
  }
  return guards;
}

export function discoverTraderIntelligenceApiRoutes(args: {
  routeRecords: readonly TraderIntelligenceRouteSourceRecord[];
  intelligenceClientRecords: readonly TraderIntelligenceRouteSourceRecord[];
}): readonly string[] {
  const clientReferences = new Set(
    args.intelligenceClientRecords.flatMap((record) =>
      extractTraderIntelligenceApiReferences(record.path, record.source),
    ),
  );
  return args.routeRecords
    .filter((record) => {
      const path = normalizedPath(record.path);
      const dependencies = extractTraderIntelligenceModuleDependencies(
        path,
        record.source,
      );
      if (
        dependencies.some((dependency) =>
          TRADER_INTELLIGENCE_DEPENDENCY.test(dependency.specifier),
        )
      ) {
        return true;
      }
      const routePath = routePathFromModule(path);
      return [...clientReferences].some((reference) =>
        referenceMatchesRoute(reference, routePath),
      );
    })
    .map((record) => normalizedPath(record.path))
    .sort();
}

export function scanTraderIntelligenceRouteContainment(args: {
  routeRecords: readonly TraderIntelligenceRouteSourceRecord[];
  intelligenceClientRecords: readonly TraderIntelligenceRouteSourceRecord[];
  matrix: readonly TraderIntelligenceRouteContainmentEntry[];
}): readonly TraderIntelligenceRouteDiscoveryFinding[] {
  const findings: TraderIntelligenceRouteDiscoveryFinding[] = [];
  const matrixByPath = new Map<string, TraderIntelligenceRouteContainmentEntry>();
  for (const entry of args.matrix) {
    if (matrixByPath.has(entry.modulePath)) {
      findings.push({
        code: "ti_v3_route_matrix_duplicate",
        path: entry.modulePath,
        method: null,
        detail: null,
      });
    }
    matrixByPath.set(entry.modulePath, entry);
  }

  const discovered = new Set(
    discoverTraderIntelligenceApiRoutes({
      routeRecords: args.routeRecords,
      intelligenceClientRecords: args.intelligenceClientRecords,
    }),
  );

  for (const entry of args.matrix) {
    if (entry.modulePath.endsWith("/route.ts")) discovered.add(entry.modulePath);
  }

  for (const path of discovered) {
    const record = args.routeRecords.find(
      (candidate) => normalizedPath(candidate.path) === path,
    );
    const matrixEntry = matrixByPath.get(path);
    if (!record || !matrixEntry) {
      findings.push({
        code: "ti_v3_route_unclassified",
        path,
        method: null,
        detail: null,
      });
      continue;
    }

    const sourceFile = parseTraderIntelligenceTypeScript(path, record.source);
    const exportedMethods = exportedRouteMethods(sourceFile);
    const actualMethods = [...exportedMethods.keys()].sort();
    const declaredMethods = [...matrixEntry.methods].sort();
    if (JSON.stringify(actualMethods) !== JSON.stringify(declaredMethods)) {
      findings.push({
        code: "ti_v3_route_method_mismatch",
        path,
        method: null,
        detail: `actual=${actualMethods.join(",")};matrix=${declaredMethods.join(",")}`,
      });
    }

    const dependencies = extractTraderIntelligenceModuleDependencies(path, record.source);
    const localFunctions = new Map<string, ts.FunctionDeclaration>();
    for (const statement of sourceFile.statements) {
      if (ts.isFunctionDeclaration(statement) && statement.name) {
        localFunctions.set(statement.name.text, statement);
      }
    }
    const platformRequestGuards = importedPlatformGuards(sourceFile, matrixEntry.authorizationBoundary);
    const scannerSettingsHandler = matrixEntry.authorizationBoundary === "platform_request_scope"
      ? importedScannerSettingsHandler(sourceFile)
      : null;
    let wrapperCallCount = 0;
    for (const [method, initializer] of exportedMethods) {
      if (matrixEntry.authorizationBoundary === "public_oauth_entry") {
        continue;
      }
      if (
        matrixEntry.authorizationBoundary === "platform_request_scope" ||
        matrixEntry.authorizationBoundary === "platform_cron_request" ||
        matrixEntry.authorizationBoundary === "platform_development_worker"
      ) {
        if (!containsCall(initializer, platformRequestGuards, localFunctions, scannerSettingsHandler)) {
          findings.push({
            code: "ti_v3_route_method_unwrapped",
            path,
            method,
            detail: "platform_request_scope_missing",
          });
        }
        continue;
      }
      const call = wrapperCall(initializer);
      if (!call) {
        findings.push({
          code: "ti_v3_route_method_unwrapped",
          path,
          method,
          detail: null,
        });
        continue;
      }
      wrapperCallCount += 1;
      const modulePath = resolveStaticString(sourceFile, call.arguments[0]);
      if (modulePath !== path) {
        findings.push({
          code: "ti_v3_route_wrapper_module_path_mismatch",
          path,
          method,
          detail: modulePath,
        });
      }
    }

    const importsWrapper = dependencies.some(
      (dependency) =>
        dependency.kind === "import" &&
        dependency.importedNames?.includes("withTraderIntelligenceOwnerRoute"),
    );
    if (importsWrapper && wrapperCallCount === 0) {
      findings.push({
        code: "ti_v3_route_wrapper_import_unused",
        path,
        method: null,
        detail: null,
      });
    }
  }

  return findings.sort((left, right) =>
    `${left.path}:${left.code}:${left.method ?? ""}`.localeCompare(
      `${right.path}:${right.code}:${right.method ?? ""}`,
    ),
  );
}
