import ts from "typescript";

import {
  extractTraderIntelligenceModuleDependencies,
  parseTraderIntelligenceTypeScript,
} from "./typescript-source-analysis";

export type TraderIntelligenceArchitectureFindingCode =
  | "ti_v3_arch_domain_app_import"
  | "ti_v3_arch_domain_next_import"
  | "ti_v3_arch_database_driver_import"
  | "ti_v3_arch_ai_sdk_import"
  | "ti_v3_arch_levels_system_import"
  | "ti_v3_arch_market_provider_import"
  | "ti_v3_arch_academy_coupling"
  | "ti_v3_arch_academy_adapter_import_invalid"
  | "ti_v3_arch_legacy_coaching_internal_import"
  | "ti_v3_arch_route_domain_authority"
  | "ti_v3_arch_decimal_import_outside_boundary"
  | "ti_v3_arch_legacy_exact_truth_import"
  | "ti_v3_arch_financial_number_authority"
  | "ti_v3_arch_locale_sensitive_canonical_comparator";

export interface TraderIntelligenceSourceRecord {
  path: string;
  source: string;
}

export interface TraderIntelligenceArchitectureFinding {
  code: TraderIntelligenceArchitectureFindingCode;
  path: string;
  dependency: string | null;
}

function normalizedPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function pushFinding(
  findings: TraderIntelligenceArchitectureFinding[],
  code: TraderIntelligenceArchitectureFindingCode,
  path: string,
  dependency: string | null,
): void {
  if (
    !findings.some(
      (finding) =>
        finding.code === code &&
        finding.path === path &&
        finding.dependency === dependency,
    )
  ) {
    findings.push({ code, path, dependency });
  }
}

function hasRouteDomainAuthority(path: string, source: string): boolean {
  if (!path.endsWith("/route.ts")) {
    return false;
  }
  const sourceFile = parseTraderIntelligenceTypeScript(path, source);
  let found = false;
  const visit = (node: ts.Node): void => {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isVariableDeclaration(node) ||
        ts.isMethodDeclaration(node)) &&
      node.name &&
      ts.isIdentifier(node.name) &&
      /^(?:calculate|compute|aggregate|reconstruct|derive)[A-Z_]/.test(
        node.name.text,
      )
    ) {
      found = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

function financialNumberAuthorityFindings(path: string, source: string): readonly string[] {
  const isFinancialAuthority =
    path.startsWith("src/lib/trader-intelligence-v3/domain/exact/") ||
    path.startsWith("src/lib/trader-intelligence-v3/domain/accounting/") ||
    path.startsWith("src/lib/trader-intelligence-v3/testing/reference/");
  if (!isFinancialAuthority) return [];
  const sourceFile = parseTraderIntelligenceTypeScript(path, source);
  const findings = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.PlusToken) {
      findings.add("unary_plus");
    }
    if (ts.isCallExpression(node)) {
      if (
        ts.isIdentifier(node.expression) &&
        ["Number", "parseFloat", "parseInt"].includes(node.expression.text)
      ) {
        findings.add(node.expression.text);
      }
      if (ts.isPropertyAccessExpression(node.expression)) {
        const receiver = node.expression.expression;
        const name = node.expression.name.text;
        if (name === "toNumber") findings.add("toNumber");
        if (ts.isIdentifier(receiver) && receiver.text === "Math") {
          findings.add(`Math.${name}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...findings].sort();
}

function hasLocaleSensitiveCanonicalComparator(path: string, source: string): boolean {
  const isCanonicalAuthority =
    path.startsWith("src/lib/trader-intelligence-v3/domain/canonical/") ||
    path.startsWith("src/lib/trader-intelligence-v3/domain/identity/") ||
    path.startsWith("src/lib/trader-intelligence-v3/domain/execution/") ||
    path.startsWith("src/lib/trader-intelligence-v3/domain/accounting/");
  if (!isCanonicalAuthority) return false;
  const sourceFile = parseTraderIntelligenceTypeScript(path, source);
  let found = false;
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "localeCompare"
    ) {
      found = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

export function scanTraderIntelligenceArchitectureBoundaries(
  records: readonly TraderIntelligenceSourceRecord[],
): readonly TraderIntelligenceArchitectureFinding[] {
  const findings: TraderIntelligenceArchitectureFinding[] = [];

  for (const record of records) {
    const path = normalizedPath(record.path);
    const dependencies = extractTraderIntelligenceModuleDependencies(
      path,
      record.source,
    );
    const isV3Core = path.startsWith("src/lib/trader-intelligence-v3/");
    const isDomainOrContracts =
      path.startsWith("src/lib/trader-intelligence-v3/domain/") ||
      path.startsWith("src/lib/trader-intelligence-v3/contracts/");
    const isProvisionalAcademyAdapter =
      path ===
      "src/lib/trader-intelligence-v3/auth/provisional-discord-session-adapter.ts";

    for (const dependency of dependencies) {
      const normalizedDependency = dependency.specifier.toLowerCase();
      if (
        isDomainOrContracts &&
        (dependency.specifier.startsWith("app/") ||
          dependency.specifier.startsWith("@/app/") ||
          dependency.specifier.includes("/app/"))
      ) {
        pushFinding(findings, "ti_v3_arch_domain_app_import", path, dependency.specifier);
      }
      if (isDomainOrContracts && normalizedDependency.startsWith("next")) {
        pushFinding(findings, "ti_v3_arch_domain_next_import", path, dependency.specifier);
      }
      if (
        isV3Core &&
        /(better-sqlite3|(?:^|\/)sqlite3(?:\/|$)|node:sqlite|@libsql|@neondatabase|(?:^|\/)pg(?:\/|$)|postgres|mysql2?|mariadb|mongodb|mongoose|@prisma\/client|drizzle-orm|typeorm|sequelize|redis|sqlite-import-commit-repository|persistence-storage)/.test(
          normalizedDependency,
        )
      ) {
        pushFinding(findings, "ti_v3_arch_database_driver_import", path, dependency.specifier);
      }
      if (
        isV3Core &&
        /(^|\/)(openai|ai|@ai-sdk|langchain|anthropic|cohere-ai|groq-sdk|mistralai|ollama|replicate)(\/|$)|@google\/(?:generative-ai|genai)|@aws-sdk\/client-bedrock-runtime|@azure\/openai/.test(
          normalizedDependency,
        )
      ) {
        pushFinding(findings, "ti_v3_arch_ai_sdk_import", path, dependency.specifier);
      }
      if (isV3Core && normalizedDependency.includes("levels-system")) {
        pushFinding(findings, "ti_v3_arch_levels_system_import", path, dependency.specifier);
      }
      if (isV3Core && normalizedDependency.includes("/academy/")) {
        const exactSymbols = ["ACADEMY_SESSION_COOKIE", "AcademyProgressStore"];
        const exactAdapterImport =
          isProvisionalAcademyAdapter &&
          dependency.kind === "import" &&
          dependency.specifier ===
            "@/src/lib/academy/academy-progress-store" &&
          dependency.importedNames !== null &&
          [...dependency.importedNames].sort().join(",") ===
            [...exactSymbols].sort().join(",");
        if (!isProvisionalAcademyAdapter) {
          pushFinding(findings, "ti_v3_arch_academy_coupling", path, dependency.specifier);
        } else if (!exactAdapterImport) {
          pushFinding(
            findings,
            "ti_v3_arch_academy_adapter_import_invalid",
            path,
            dependency.specifier,
          );
        }
      }
      if (
        isV3Core &&
        /(?:market-data|market_data|market-provider|providers?\/(?:yahoo|eodhd|finnhub|ibkr|polygon|alpaca|iex|tiingo|tradier)|yahoo-finance2|@polygon\.io|alpaca-trade-api)/.test(
          normalizedDependency,
        )
      ) {
        pushFinding(findings, "ti_v3_arch_market_provider_import", path, dependency.specifier);
      }
      if (
        !isV3Core &&
        path.startsWith("src/lib/") &&
        /(?:coach|coaching)/.test(path.toLowerCase()) &&
        normalizedDependency.includes("trader-intelligence-v3/")
      ) {
        pushFinding(
          findings,
          "ti_v3_arch_legacy_coaching_internal_import",
          path,
          dependency.specifier,
        );
      }
      if (
        isV3Core &&
        normalizedDependency === "decimal.js" &&
        path !== "src/lib/trader-intelligence-v3/domain/exact/exact-decimal.ts" &&
        !/^src\/lib\/trader-intelligence-v3\/__tests__\/ga0-a2-exact-decimal(?:\.|-)/.test(path)
      ) {
        pushFinding(
          findings,
          "ti_v3_arch_decimal_import_outside_boundary",
          path,
          dependency.specifier,
        );
      }
      if (
        !isV3Core &&
        /trader-intelligence-v3\/domain(?:\/|$)/.test(normalizedDependency)
      ) {
        pushFinding(
          findings,
          "ti_v3_arch_legacy_exact_truth_import",
          path,
          dependency.specifier,
        );
      }
    }

    if (hasRouteDomainAuthority(path, record.source)) {
      pushFinding(findings, "ti_v3_arch_route_domain_authority", path, null);
    }
    for (const authority of financialNumberAuthorityFindings(path, record.source)) {
      pushFinding(
        findings,
        "ti_v3_arch_financial_number_authority",
        path,
        authority,
      );
    }
    if (hasLocaleSensitiveCanonicalComparator(path, record.source)) {
      pushFinding(
        findings,
        "ti_v3_arch_locale_sensitive_canonical_comparator",
        path,
        "localeCompare",
      );
    }
  }

  return findings.sort((left, right) =>
    `${left.path}:${left.code}:${left.dependency ?? ""}`.localeCompare(
      `${right.path}:${right.code}:${right.dependency ?? ""}`,
    ),
  );
}
