import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX } from "../contracts";
import platformInventory from "../testing/platform-route-inventory-20261027.json";
import { platformRouteInventoryFindings, type RouteInventoryEntry } from "../testing/platform-route-inventory";
import {
  discoverTraderIntelligenceApiRoutes,
  scanTraderIntelligenceRouteContainment,
  type TraderIntelligenceRouteSourceRecord,
} from "../testing";

function findFiles(
  directory: string,
  predicate: (fileName: string) => boolean,
): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return findFiles(path, predicate);
    }
    return predicate(entry.name)
      ? [relative(process.cwd(), path).replaceAll("\\", "/")]
      : [];
  });
}

function records(paths: readonly string[]): readonly TraderIntelligenceRouteSourceRecord[] {
  return paths.map((path) => ({ path, source: readFileSync(path, "utf8") }));
}

function allApiRouteRecords() {
  return records(
    findFiles(join(process.cwd(), "app", "api"), (name) => name === "route.ts"),
  );
}

function intelligenceClientRecords() {
  return records([
    ...findFiles(
      join(process.cwd(), "app", "intelligence"),
      (name) => /\.(?:ts|tsx)$/.test(name),
    ),
    ...findFiles(
      join(process.cwd(), "app", "(dashboard)"),
      (name) => /\.(?:ts|tsx)$/.test(name),
    ),
  ]);
}

describe("Trader Intelligence route containment matrix", () => {
  it("inventories current pages and discovered APIs once, with excluded owner lanes explicit", () => {
    const actualRoutes = [
      ...findFiles(
        join(process.cwd(), "app", "(dashboard)"),
        (name) => name === "page.tsx",
      ),
      ...findFiles(
        join(process.cwd(), "app", "intelligence"),
        (name) => name === "page.tsx",
      ),
      // OAuth entry no longer appears in Journal client references, but remains a hosted route.
      "app/api/auth/discord/login/route.ts",
      ...discoverTraderIntelligenceApiRoutes({
        routeRecords: allApiRouteRecords(),
        intelligenceClientRecords: intelligenceClientRecords(),
      }),
    ].sort();
    const retiredPerformancePage = "app/(dashboard)/analytics/performance/page.tsx";
    expect(existsSync(retiredPerformancePage)).toBe(false);
    expect(readFileSync("src/modules/platform/contracts/legacy-intelligence-route-disposition.ts", "utf8"))
      .toContain('"/analytics/performance"');
    const classifiedRoutes = [...TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX.filter(
      entry => entry.modulePath !== retiredPerformancePage,
    ).map(
      (entry) => entry.modulePath,
    ), ...platformInventory.map(entry => entry.path)].sort();

    expect(new Set(classifiedRoutes).size).toBe(classifiedRoutes.length);
    expect(classifiedRoutes).toEqual(actualRoutes);
    // This reviewed snapshot is explicit, not discovered-and-auto-approved at test time.
    expect(platformInventory.filter(entry => entry.excludedOwnerLane)).toHaveLength(34);
    for (const entry of platformInventory.filter(entry => entry.excludedOwnerLane)) {
      expect(entry.path).toMatch(/app\/api\/(?:coach|billing)\/|app\/api\/cron\/ai-|app\/\(dashboard\)\/(?:ai-chat|ai-reviews|community)\//u);
    }
  });

  it("uses AST inspection to require exact wrapper paths and complete method coverage", () => {
    expect(
      scanTraderIntelligenceRouteContainment({
        routeRecords: allApiRouteRecords().filter(record =>
          TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX.some(entry => entry.modulePath === record.path)),
        intelligenceClientRecords: intelligenceClientRecords(),
        matrix: TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX,
      }),
    ).toEqual([]);
    for (const entry of platformInventory as readonly RouteInventoryEntry[]) {
      if (entry.methods && !entry.excludedOwnerLane) expect(
        platformRouteInventoryFindings(entry, readFileSync(entry.path, "utf8")), entry.path,
      ).toEqual([]);
    }
  });

  it("rejects a removed guard, unused import, wrong binding, dead helper, or unreviewed HTTP method", () => {
    const entry: RouteInventoryEntry = {
      path: "app/api/platform/journal/example/route.ts",
      methods: { GET: [{ name: "requireTraderLinkPlatformRequestScope", module: "@/src/modules/platform/server/authentication/require-platform-request-scope#requireTraderLinkPlatformRequestScope" }] },
    };
    const imported = 'import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";';
    const good = `${imported} export function GET(request: Request) { return requireTraderLinkPlatformRequestScope(request.headers); }`;
    expect(platformRouteInventoryFindings(entry, good)).toEqual([]);
    for (const broken of [
      `${imported} export function GET() { return Response.json({}); }`,
      good.replace("return requireTraderLinkPlatformRequestScope(request.headers);", "function unused() { requireTraderLinkPlatformRequestScope(request.headers); } return Response.json({});"),
      good.replace("@/src/modules/platform/server/authentication/require-platform-request-scope", "./untrusted"),
      `${good} export function POST() { return Response.json({}); }`,
    ]) expect(platformRouteInventoryFindings(entry, broken).length).toBeGreaterThan(0);
  });

  it("keeps local-only, cron and OAuth boundaries explicit rather than treating them as public bypasses", () => {
    for (const path of ["app/api/platform/daily-trade-analyzer/run/route.ts", "app/api/platform/moomoo-execution-import/run/route.ts"]) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain('process.env.NODE_ENV === "development"');
      expect(source).toContain('process.env[TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV] === "1"');
      expect(source).toContain("token.length > 0");
      expect(source).toContain("if (!allowed(request))");
      const entry = platformInventory.find(entry => entry.path === path)! as RouteInventoryEntry;
      expect(platformRouteInventoryFindings(entry, source.replace("token.length > 0", "true"))).toContain("POST: local boundary changed allowed");
    }
    for (const path of ["app/api/cron/journal-ai-import-repair/route.ts", "app/api/cron/moomoo-execution-import/route.ts"]) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain("if (!secret || !supplied) return false;");
      expect(source).toContain("timingSafeEqual(");
      expect(source).toContain("if (!authorized(request))");
    }
    const oauth = readFileSync("app/api/auth/discord/callback/route.ts", "utf8");
    expect(oauth).toContain("if (!state || !expectedState || state !== expectedState)");
    expect(oauth).toContain("await exchangeDiscordCode(");
    expect(oauth.indexOf("if (!state || !expectedState || state !== expectedState)")).toBeLessThan(oauth.indexOf("await exchangeDiscordCode("));
    expect(oauth).toContain('returnTo, "invalid-state"');
  });

  it("requires mutation classifications to include an unsafe HTTP method", () => {
    for (const entry of TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX) {
      if (entry.classification === "owner_mutation") {
        expect(
          entry.methods.some(
            (method) => !["GET", "HEAD", "OPTIONS"].includes(method),
          ),
        ).toBe(true);
      }
    }
  });

  it("rejects an unclassified journal API regardless of prefix", () => {
    const routeRecords = [
      ...allApiRouteRecords(),
      {
        path: "app/api/new-journal-surface/route.ts",
        source:
          'import { SqliteImportCommitRepository } from "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository"; export const GET = async () => Response.json(new SqliteImportCommitRepository());',
      },
    ];
    expect(
      scanTraderIntelligenceRouteContainment({
        routeRecords,
        intelligenceClientRecords: intelligenceClientRecords(),
        matrix: TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX,
      }),
    ).toContainEqual(
      expect.objectContaining({
        code: "ti_v3_route_unclassified",
        path: "app/api/new-journal-surface/route.ts",
      }),
    );
  });

  it.each([
    [
      "unused wrapper import",
      'import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth"; export const GET = async () => Response.json({ ok: true });',
      "ti_v3_route_method_unwrapped",
    ],
    [
      "unwrapped const POST",
      'import "@/src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository"; export const POST = async () => Response.json({ ok: true });',
      "ti_v3_route_method_unwrapped",
    ],
    [
      "wrong wrapper module path",
      'import { withTraderIntelligenceOwnerRoute } from "@/src/lib/trader-intelligence-v3/auth"; const GETHandler = async () => Response.json({ ok: true }); export const GET = withTraderIntelligenceOwnerRoute("app/api/wrong/route.ts", GETHandler);',
      "ti_v3_route_wrapper_module_path_mismatch",
    ],
  ])("detects route bypass: %s", (_label, source, code) => {
    const path = "app/api/trades/route.ts";
    expect(
      scanTraderIntelligenceRouteContainment({
        routeRecords: [{ path, source }],
        intelligenceClientRecords: [],
        matrix: TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX.filter(
          (entry) => entry.modulePath === path,
        ),
      }),
    ).toContainEqual(expect.objectContaining({ code, path }));
  });

  it("guards repository-backed pages before legacy read-model access", () => {
    const repositoryBackedPages = [
      "app/intelligence/analytics/page.tsx",
      "app/intelligence/coach/page.tsx",
      "app/intelligence/imports/[batchId]/page.tsx",
      "app/intelligence/imports/page.tsx",
      "app/intelligence/page.tsx",
      "app/intelligence/progress/page.tsx",
      "app/intelligence/review/page.tsx",
      "app/intelligence/trades/[tradeId]/page.tsx",
      "app/intelligence/trades/page.tsx",
      "app/intelligence/trades/ticker-story/[threadId]/page.tsx",
    ];
    for (const path of repositoryBackedPages) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain(`requireTraderIntelligenceOwnerPageAccess("${path}")`);
    }
  });

  it("guards pages using the supported request-time headers API", () => {
    const source = readFileSync(
      "src/lib/trader-intelligence-v3/auth/next-owner-boundary.ts",
      "utf8",
    );
    expect(source).toContain('import { cookies, headers } from "next/headers"');
    expect(source).toContain("headers()");
    expect(source).toContain("localRequest: { headers: requestHeaders }");
  });

  it("forces the Intelligence route tree to dynamic private rendering", () => {
    const layoutSource = readFileSync("app/intelligence/layout.tsx", "utf8");
    const dashboardLayoutSource = readFileSync(
      "app/(dashboard)/layout.tsx",
      "utf8",
    );
    const nextConfigSource = readFileSync("next.config.ts", "utf8");

    expect(layoutSource).toContain('dynamic = "force-dynamic"');
    expect(layoutSource).toContain('fetchCache = "force-no-store"');
    expect(layoutSource).toContain("requireTraderIntelligenceOwnerPageAccess");
    expect(dashboardLayoutSource).toContain('dynamic = "force-dynamic"');
    expect(dashboardLayoutSource).toContain('fetchCache = "force-no-store"');
    expect(dashboardLayoutSource).toContain("<TraderLinkPlatformDashboardFrame>");
    const frame = readFileSync("app/dashboard-layout-frame.tsx", "utf8");
    expect(frame).toContain("requireTraderLinkPlatformServerComponentPageIdentity()");
    expect(frame).toContain("requireTraderLinkPlatformAuthenticatedPageIdentity({");
    expect(frame).toContain("requireTraderLinkPlatformBillingPageIdentity()");
    expect(nextConfigSource).toContain('"/intelligence/:path*"');
    expect(nextConfigSource).toContain('"/workspace/:path*"');
    expect(nextConfigSource).toContain('"/trades/:path*"');
    expect(nextConfigSource).toContain('"/analytics/:path*"');
    expect(nextConfigSource).toContain('value: "private, no-store, max-age=0"');
  });
});
