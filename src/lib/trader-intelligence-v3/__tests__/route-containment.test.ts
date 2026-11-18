import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX } from "../contracts";
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

function allAppRouteRecords() {
  return records(
    findFiles(join(process.cwd(), "app"), (name) => name === "route.ts"),
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
  it("discovers registered App Router handlers outside the api directory", () => {
    expect(allAppRouteRecords().some(record => record.path ===
      "app/%5F%5Fprivate/community-staging-qa/[nonce]/route.ts")).toBe(true);
  });

  it.each([
    {name: "actual synchronous Whop flow", admitted: true, rewrite: (source: string) => source},
    {name: "trusted import alias", admitted: true, rewrite: (source: string) => source
      .replace("createWhopOAuthFlowBinding, requireWhopOAuthRequestIdentity }", "createWhopOAuthFlowBinding, requireWhopOAuthRequestIdentity as actualIdentity }")
      .replace("requireWhopOAuthRequestIdentity(request)", "actualIdentity(request)")},
    {name: "untrusted same-name export", admitted: false, rewrite: (source: string) => source.replace(
      "@/src/modules/platform/server/billing/whop-ai-review-staging-identity", "@/untrusted")},
    {name: "wrong identity request", admitted: false, rewrite: (source: string) => source.replace(
      "requireWhopOAuthRequestIdentity(request)", "requireWhopOAuthRequestIdentity(otherRequest)")},
    {name: "wrong configuration user", admitted: false, rewrite: (source: string) => source.replace(
      "loadWhopOAuthRequestConfiguration(request, identity.scope.userId)", "loadWhopOAuthRequestConfiguration(request, otherUserId)")},
    {name: "missing identity call", admitted: false, rewrite: (source: string) => source.replace(
      "const identity = requireWhopOAuthRequestIdentity(request);", 'const identity = {scope:{userId:"fake"}};')},
    {name: "shadowed imported helper", admitted: false, rewrite: (source: string) => source.replace(
      "const identity = requireWhopOAuthRequestIdentity(request);", "const requireWhopOAuthRequestIdentity = () => fake; const identity = requireWhopOAuthRequestIdentity(request);")},
    {name: "effect before identity/configuration", admitted: false, rewrite: (source: string) => source.replace(
      "const identity = requireWhopOAuthRequestIdentity(request);", 'const response = NextResponse.redirect("https://untrusted"); const identity = requireWhopOAuthRequestIdentity(request);')},
  ])("checks exact Whop connect flow: $name", ({rewrite, admitted}) => {
    const path = "app/api/billing/whop/connect/route.ts";
    const source = readFileSync(path, "utf8");
    const matrix = TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX.filter(entry => entry.modulePath === path);
    expect(matrix).toHaveLength(1);
    const findings = scanTraderIntelligenceRouteContainment({
      routeRecords: [{path, source: rewrite(source)}], intelligenceClientRecords: [], matrix,
    });
    if (admitted) expect(findings).toEqual([]);
    else expect(findings.some(finding => finding.code === "ti_v3_route_method_unwrapped")).toBe(true);
  });

  it("classifies every Intelligence page and discovered API exactly once", () => {
    const actualRoutes = [
      ...findFiles(
        join(process.cwd(), "app", "(dashboard)"),
        (name) => name === "page.tsx",
      ),
      ...findFiles(
        join(process.cwd(), "app", "intelligence"),
        (name) => name === "page.tsx",
      ),
      ...discoverTraderIntelligenceApiRoutes({
        routeRecords: allAppRouteRecords(),
        intelligenceClientRecords: intelligenceClientRecords(),
      }),
      ...allAppRouteRecords().filter(record =>
        TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX.some(entry => entry.modulePath === record.path),
      ).map(record => record.path),
    ];
    const classifiedRoutes = TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX.map(
      (entry) => entry.modulePath,
    ).sort();

    expect(new Set(classifiedRoutes).size).toBe(classifiedRoutes.length);
    expect(classifiedRoutes).toEqual([...new Set(actualRoutes)].sort());
  });

  it("uses AST inspection to require exact wrapper paths and complete method coverage", () => {
    expect(
      scanTraderIntelligenceRouteContainment({
        routeRecords: allAppRouteRecords(),
        intelligenceClientRecords: intelligenceClientRecords(),
        matrix: TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX,
      }),
    ).toEqual([]);
  });

  it("recognizes the imported Journal admin guard on the raw delivery route", () => {
    const path = "app/api/admin/level-analysis/deliveries/[deliveryId]/raw/route.ts";
    const source = readFileSync(path, "utf8");
    const matrix = TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX.filter(entry => entry.modulePath === path);
    expect(matrix).toHaveLength(1);
    const check = (testedSource: string) => scanTraderIntelligenceRouteContainment({
      routeRecords: [{ path, source: testedSource }],
      intelligenceClientRecords: [],
      matrix,
    });
    expect(check(source)).toEqual([]);
    const untrusted = source.replace(
      "@/src/modules/platform/server/administration/platform-admin-authorization",
      "./unrecognized-guard",
    );
    expect(check(untrusted)).toContainEqual(expect.objectContaining({
      code: "ti_v3_route_method_unwrapped", path, method: "GET",
    }));
  });

  it.each([
    "app/api/admin/market-data/route.ts",
    "app/api/charts/provider/route.ts",
    "app/api/company/details/route.ts",
    "app/api/company/technicals/route.ts",
  ])("requires the actual imported Platform guard for %s", path => {
    const source = readFileSync(path, "utf8");
    const matrix = TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX.filter(entry => entry.modulePath === path);
    expect(matrix).toHaveLength(1);
    const check = (testedSource: string) => scanTraderIntelligenceRouteContainment({
      routeRecords: [{ path, source: testedSource }], intelligenceClientRecords: [], matrix,
    });
    expect(check(source)).toEqual([]);
    const unguarded = source.replace(
      "@/src/modules/platform/server/authentication/require-platform-request-scope",
      "./unrecognized-market-data-guard",
    );
    for (const method of matrix[0].methods) expect(check(unguarded)).toContainEqual(expect.objectContaining({
      code: "ti_v3_route_method_unwrapped", path, method,
    }));
  });

  it("requires Scanner settings to pass its verified owner predicate to the shared handler", () => {
    const path = "app/api/admin/screeners/settings/route.ts";
    const source = readFileSync(path, "utf8");
    const check = (testedSource: string) => scanTraderIntelligenceRouteContainment({
      routeRecords: [{ path, source: testedSource }],
      intelligenceClientRecords: [],
      matrix: TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX.filter(entry => entry.modulePath === path),
    });
    expect(check(source)).toEqual([]);
    expect(check(source.replace("{ owner,mutation:", "{ owner: () => true,mutation:")))
      .toContainEqual(expect.objectContaining({
        code: "ti_v3_route_method_unwrapped", path, method: "GET",
      }));
  });

  it("requires the exact imported Paid owner-review gate, including aliases", () => {
    const path = "app/api/partner-channels/communities/[communityId]/offers/[offerKey]/access/route.ts";
    const gateModule = "@/src/modules/partner-alerts/server/partner-alert-owner-review-request";
    const source = `import {partnerAlertOwnerReviewRequestDenied as gate} from '${gateModule}';
      export async function POST(request:Request) { const denied=gate(request); if(denied)return denied; return Response.json({ok:true}); }`;
    const check = (testedSource: string) => scanTraderIntelligenceRouteContainment({
      routeRecords: [{ path, source: testedSource }], intelligenceClientRecords: [],
      matrix: TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX.filter(entry => entry.modulePath === path),
    });
    expect(check(source)).toEqual([]);
    for (const untrusted of [
      source.replace(gateModule, "@/untrusted/owner-review"),
      source.replace("const denied=gate(request);", "const denied=null;"),
      source.replace("import {", "import type {"),
      source.replace("const denied=gate(request);", "/* gate(request) */ const denied=null;"),
    ]) expect(check(untrusted)).toContainEqual(expect.objectContaining({code:"ti_v3_route_method_unwrapped",path,method:"POST"}));
  });

  it("requires an imported worker gate on scheduled routes", () => {
    const path = "app/api/cron/ai-reviews/route.ts";
    const source = readFileSync(path, "utf8");
    const check = (testedSource: string) => scanTraderIntelligenceRouteContainment({
      routeRecords: [{ path, source: testedSource }],
      intelligenceClientRecords: [],
      matrix: TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX.filter(entry => entry.modulePath === path),
    });
    expect(check(source)).toEqual([]);
    expect(check(source.replace("!isAuthorizedPlatformCronRequest(request)", "false")))
      .toContainEqual(expect.objectContaining({
        code: "ti_v3_route_method_unwrapped", path, method: "GET",
      }));
  });

  it("requires mutation classifications to include an unsafe HTTP method", () => {
    for (const entry of TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX) {
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
      ...allAppRouteRecords(),
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
        matrix: TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX,
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
        matrix: TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX.filter(
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
    const dashboardFrameSource = readFileSync("app/dashboard-layout-frame.tsx", "utf8");
    expect(dashboardLayoutSource).toContain("<TraderLinkPlatformDashboardFrame>");
    expect(dashboardFrameSource).toContain("await requireTraderLinkPlatformServerComponentPageIdentity()");
    expect(nextConfigSource).toContain('"/intelligence/:path*"');
    expect(nextConfigSource).toContain('"/workspace/:path*"');
    expect(nextConfigSource).toContain('"/trades/:path*"');
    expect(nextConfigSource).toContain('"/analytics/:path*"');
    expect(nextConfigSource).toContain('value: "private, no-store, max-age=0"');
  });
});
