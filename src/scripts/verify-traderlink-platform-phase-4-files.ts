import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { JOURNAL_ANALYTICS_MAX_METRICS_PER_QUERY } from "../modules/journal-analytics/contracts/analytics-query";
import {
  JOURNAL_ANALYTICS_CAPABILITY_IDS,
  JOURNAL_ANALYTICS_LEGACY_MIGRATION_METRIC_IDS,
} from "../modules/journal-analytics/server/analytics-capability-manifest";
import {
  JOURNAL_ANALYTICS_FIRST_SLICE_METRIC_IDS,
  journalAnalyticsMetricRegistry,
} from "../modules/journal-analytics/server/analytics-metric-registry";

function fail(check: string): never {
  throw new Error(`TRADERLINK_PHASE_4_STATIC_VERIFICATION_FAILED:${check}`);
}

function equalSets(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

function sourceFiles(directory: string): readonly string[] {
  return Object.freeze(readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(location);
    return entry.isFile() && entry.name.endsWith(".ts") &&
        !entry.name.endsWith(".test.ts")
      ? [location]
      : [];
  }));
}

function documentedLegacyMetricIds(catalog: string): readonly string[] {
  const legacy = catalog.split("## Existing V3 metric catalog: 126 migration candidates")[1]
    ?.split("## Additional execution/round-trip analytics to support")[0];
  if (!legacy) fail("catalog_legacy_section");
  return Object.freeze(legacy.split(/\r?\n/u)
    .filter((line) => line.trimStart().startsWith("`"))
    .flatMap((line) => [...line.matchAll(/`([a-z0-9_]+)`/gu)]
      .map((match) => match[1])));
}

function main(): void {
  const repository = process.cwd();
  const catalog = readFileSync(
    path.join(repository, "docs", "migration", "analytics-capability-catalog.md"),
    "utf8",
  );
  const documentedLegacy = documentedLegacyMetricIds(catalog);
  if (documentedLegacy.length !== 126) fail("catalog_legacy_count");
  if (!equalSets(documentedLegacy, JOURNAL_ANALYTICS_LEGACY_MIGRATION_METRIC_IDS)) {
    fail("catalog_legacy_manifest_mismatch");
  }
  if (new Set(JOURNAL_ANALYTICS_CAPABILITY_IDS).size !==
      JOURNAL_ANALYTICS_CAPABILITY_IDS.length) {
    fail("capability_manifest_duplicate");
  }
  const definitions = journalAnalyticsMetricRegistry.definitions;
  const definitionIds = definitions.map((definition) => definition.metricId);
  if (!equalSets(definitionIds, JOURNAL_ANALYTICS_CAPABILITY_IDS)) {
    fail("registry_manifest_mismatch");
  }
  if (new Set(definitionIds).size !== definitions.length) {
    fail("registry_duplicate");
  }
  if (definitions.length > JOURNAL_ANALYTICS_MAX_METRICS_PER_QUERY) {
    fail("registry_exceeds_query_limit");
  }
  for (const metricId of JOURNAL_ANALYTICS_FIRST_SLICE_METRIC_IDS) {
    if (!definitionIds.includes(metricId)) fail("first_slice_missing");
  }
  for (const definition of definitions) {
    if (
      definition.metricId.length === 0 || definition.title.length < 3 ||
      definition.description.length < 10 || definition.formulaVersion.length === 0 ||
      definition.requiredFacts.length === 0 || definition.unit.length === 0
    ) fail("definition_incomplete");
    if (definition.capabilityState === "unavailable") {
      if (!definition.unavailableReasonCode ||
          !/^[a-z0-9_]+$/u.test(definition.unavailableReasonCode)) {
        fail("unavailable_reason_missing");
      }
    } else if (definition.unavailableReasonCode !== null) {
      fail("available_reason_present");
    }
  }
  const forbidden = [
    "trader-intelligence-v3",
    "v3-dashboard",
    "better-sqlite3",
    '"use client"',
    "sample fallback",
  ];
  const analyticsRoot = path.join(
    repository,
    "src",
    "modules",
    "journal-analytics",
  );
  for (const file of sourceFiles(analyticsRoot)) {
    const source = readFileSync(file, "utf8").toLowerCase();
    if (forbidden.some((value) => source.includes(value))) {
      fail("forbidden_analytics_dependency");
    }
  }
  const routeFiles = [
    "app/(dashboard)/layout.tsx",
    "app/(dashboard)/workspace/page.tsx",
    "app/(dashboard)/workspace/workspace-dashboard.tsx",
    "app/(dashboard)/trades/roundtrips/page.tsx",
    "app/(dashboard)/analytics/page.tsx",
    "app/(dashboard)/analytics/performance/page.tsx",
    "app/(dashboard)/analytics/results/page.tsx",
    "app/(dashboard)/analytics/timing/page.tsx",
    "app/(dashboard)/analytics/execution/page.tsx",
    "app/(dashboard)/analytics/lab/page.tsx",
    "app/api/intelligence/dashboard/overview/route.ts",
    "app/journal-analytics-server-page.tsx",
  ] as const;
  for (const relativePath of routeFiles) {
    const source = readFileSync(path.join(repository, relativePath), "utf8");
    if (
      source.includes("trader-intelligence-v3") ||
      source.includes("V3DashboardTemplate") ||
      source.includes("resolveConfiguredDashboardAnalytics") ||
      source.includes("validateTraderIntelligenceDeployment")
    ) {
      fail("route_v3_dependency");
    }
  }
  const launcher = readFileSync(
    path.join(repository, "src", "scripts", "run-traderlink-platform-local-server.ts"),
    "utf8",
  );
  if (
    launcher.includes("trader-intelligence-v3") ||
    launcher.includes("run-trader-intelligence-local-server") ||
    !launcher.includes("TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD_ENV")
  ) {
    fail("replacement_launcher_boundary");
  }
  const digest = createHash("sha256")
    .update(JSON.stringify(definitions), "utf8")
    .digest("hex");
  process.stdout.write(JSON.stringify({
    status: "ok",
    legacyMetricCount: documentedLegacy.length,
    capabilityCount: JOURNAL_ANALYTICS_CAPABILITY_IDS.length,
    implementedOrConditionalCount: definitions.filter((definition) =>
      definition.capabilityState !== "unavailable").length,
    unavailableCount: definitions.filter((definition) =>
      definition.capabilityState === "unavailable").length,
    v3FreeRouteFileCount: routeFiles.length,
    registryDigestSha256: digest,
  }) + "\n");
}

main();
