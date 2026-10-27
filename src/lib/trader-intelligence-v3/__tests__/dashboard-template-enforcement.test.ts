import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";
import ts from "typescript";

import { DASHBOARD_NAVIGATION_HREFS, DASHBOARD_ROUTE_TITLES } from "@/app/dashboard-navigation";

const dashboardRoot = join(process.cwd(), "app", "(dashboard)");
const retiredLegacyAnalyticsLabClient = join(
  dashboardRoot,
  "analytics",
  "lab",
  "analytics-lab-client.tsx",
);
const reviewedFeaturePanelFiles = new Set([
  join(dashboardRoot, "ai-reviews", "trade-tracker-review-coverage.tsx"),
  join(dashboardRoot, "analytics", "candle-pattern-occurrence-explorer.tsx"),
  join(dashboardRoot, "analytics", "trade-analysis-client.tsx"),
  join(dashboardRoot, "analytics", "trade-detail-drawer.tsx"),
  join(dashboardRoot, "analytics", "trade-explorer", "trade-explorer-client.tsx"),
  join(dashboardRoot, "analytics", "trade-explorer", "trade-review-editor.tsx"),
  join(dashboardRoot, "analytics", "trade-explorer", "trade-tag-creation-drawer.tsx"),
  join(dashboardRoot, "calendar", "calendar-client.tsx"),
  join(dashboardRoot, "notes", "journal-notes-drawer.tsx"),
  join(dashboardRoot, "press-releases", "press-release-article-drawer.tsx"),
  join(dashboardRoot, "scanner", "scanner-client.tsx"),
  join(dashboardRoot, "trades", "trade-details-drawer.tsx"),
  join(dashboardRoot, "workspace", "workspace-atomic-trade-edit-drawer.tsx"),
  join(dashboardRoot, "workspace", "workspace-calendar-panel.tsx"),
  join(dashboardRoot, "workspace", "workspace-more-filters-drawer.tsx"),
  join(dashboardRoot, "workspace", "workspace-news-scanner-panel.tsx"),
  join(dashboardRoot, "workspace", "workspace-rules-panel.tsx"),
  join(dashboardRoot, "workspace", "workspace-trade-analyzer-panel.tsx"),
  join(dashboardRoot, "workspace", "workspace-trade-library-client.tsx"),
]);

function filesBelow(root: string): readonly string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

function routeForPage(path: string): string {
  const directory = relative(
    dashboardRoot,
    path.replace(/[\\/]page\.tsx$/, ""),
  );
  return directory ? `/${directory.split(sep).join("/")}` : "/";
}

function importsMaterialDrawer(source: string): boolean {
  return (
    /import\s+Drawer\s+from\s+["']@mui\/material\/Drawer["']/.test(source) ||
    /import\s*\{[^}]*\bDrawer\b[^}]*\}\s*from\s*["']@mui\/material["']/.test(source)
  );
}

// Inspect executable imports/JSX, not comments mentioning the shared shell.
function localShellViolations(source: string): readonly string[] {
  const file = ts.createSourceFile("surface.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findings: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) &&
      /(?:dashboard-shell|@mui\/material\/(?:AppBar|Toolbar))$/u.test(node.moduleSpecifier.text)) {
      findings.push(node.moduleSpecifier.text);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      if (["main", "DashboardShell", "AppBar", "Toolbar"].includes(node.tagName.getText(file))) findings.push(node.tagName.getText(file));
      for (const attribute of node.attributes.properties) {
        if (ts.isJsxAttribute(attribute) && attribute.name.getText(file) === "component" &&
          attribute.initializer && ts.isStringLiteral(attribute.initializer) && attribute.initializer.text === "main") findings.push("component=main");
      }
    }
    if (ts.isStringLiteral(node) && node.text.includes("logo-horizontal-main.png")) findings.push("local logo");
    ts.forEachChild(node, visit);
  };
  visit(file);
  return findings;
}

describe("TraderLink Platform dashboard template enforcement", () => {
  it("wraps every dashboard route with the approved shared template", () => {
    const layout = readFileSync(join(dashboardRoot, "layout.tsx"), "utf8");
    expect(layout).toContain(
      'import { TraderLinkPlatformDashboardFrame } from "../dashboard-layout-frame"',
    );
    expect(layout).toContain("<TraderLinkPlatformDashboardFrame>{children}</TraderLinkPlatformDashboardFrame>");
    const frame = readFileSync("app/dashboard-layout-frame.tsx", "utf8");
    expect(frame).toContain('import { TraderLinkPlatformDashboardTemplate } from "./dashboard-template"');
    expect(frame).toContain("<TraderLinkPlatformDashboardTemplate");
    expect(frame).toContain("requireTraderLinkPlatformServerComponentPageIdentity()");
  });

  it("keeps every configured navigation destination inside the route group", () => {
    const routes = filesBelow(dashboardRoot)
      .filter((path) => path.endsWith(`${sep}page.tsx`))
      .map(routeForPage);
    expect(
      DASHBOARD_NAVIGATION_HREFS.filter((href) => href !== "/watchlist" && !routes.some(route => {
        const pattern = route.split("/");
        const actual = href.split("/");
        const catchAll = pattern.findIndex(segment => /^\[\[?\.\.\./u.test(segment));
        if (catchAll >= 0) return actual.length >= catchAll && pattern.slice(0, catchAll)
          .every((segment, index) => segment === actual[index]);
        return pattern.length === actual.length && pattern.every((segment, index) =>
          /^\[[^\]]+\]$/u.test(segment) || segment === actual[index]);
      })),
    ).toEqual([]);
    expect(existsSync("app/watchlist/page.tsx")).toBe(true);
    const watchlist = readFileSync("app/watchlist/page.tsx", "utf8");
    expect(watchlist).toContain("await authorizeWatchlistPageAccess()");
    expect(watchlist).toContain("<WatchlistDashboardFrame>");
    expect(readFileSync("app/watchlist/watchlist-dashboard-frame.tsx", "utf8"))
      .toContain('<TraderLinkPlatformDashboardFrame loginReturnTo="/watchlist" watchlistMemberAccess>');
  });

  it("rejects local dashboard shells, headers, sidebars, and page containers", () => {
    const violations = filesBelow(dashboardRoot)
      .filter(
        (path) =>
          path.endsWith(".tsx") &&
          path !== join(dashboardRoot, "layout.tsx") &&
          path !== retiredLegacyAnalyticsLabClient,
      )
      .flatMap((path) => {
        const source = readFileSync(path, "utf8");
        return localShellViolations(source).map(finding => `${relative(process.cwd(), path)}:${finding}`);
    });
    expect(violations).toEqual([]);
    const featurePanelViolations = filesBelow(dashboardRoot)
      .filter((path) => path.endsWith(".tsx"))
      .filter((path) => importsMaterialDrawer(readFileSync(path, "utf8")))
      .filter((path) => !reviewedFeaturePanelFiles.has(path))
      .map((path) => relative(process.cwd(), path));
    expect(featurePanelViolations).toEqual([]);
    expect(
      [...reviewedFeaturePanelFiles].filter((path) =>
        !importsMaterialDrawer(readFileSync(path, "utf8"))),
    ).toEqual([]);
    const labPage = readFileSync(
      join(dashboardRoot, "analytics", "lab", "page.tsx"),
      "utf8",
    );
    expect(labPage).not.toContain("analytics-lab-client");
    expect(labPage).not.toContain("lab-runtime");
  });

  it("ignores shell comments but still rejects real local shell reconstruction", () => {
    expect(localShellViolations("// DashboardShell owns the header\nexport const Help = () => <aside />;")).toEqual([]);
    for (const source of ["const X = () => <main />", 'const X = () => <Box component="main" />',
      'import { AppBar } from "@mui/material"; const X = () => <AppBar />',
      'import { DashboardShell } from "../dashboard-shell";', 'const X = () => <DashboardShell />']) {
      expect(localShellViolations(source).length).toBeGreaterThan(0);
    }
  });

  it("requires dashboard routes to consume the public template API", () => {
    const directUiImports = filesBelow(dashboardRoot)
      .filter((path) => path.endsWith(".tsx"))
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return (
          source.includes('from "../dashboard-ui"') ||
          source.includes('from "../../dashboard-ui"') ||
          source.includes('from "../../../dashboard-ui"')
        );
      })
      .map((path) => relative(process.cwd(), path));
    expect(directUiImports).toEqual([]);
  });

  it("publishes one canonical page, card, and action API", () => {
    const templatePath = join(process.cwd(), "app", "dashboard-template.tsx");
    expect(existsSync(templatePath)).toBe(true);
    const template = readFileSync(templatePath, "utf8");
    for (const requiredExport of [
      "TraderLinkPlatformDashboardTemplate",
      "DashboardPage",
      "DashboardMetricCard",
      "DashboardPanel",
      "DashboardPrimaryAction",
      "DashboardSecondaryAction",
    ]) {
      expect(template).toContain(requiredExport);
    }

    const canonicalSurfaces = [
      "app/dashboard-route-foundations.tsx",
      "app/dashboard-action-foundations.tsx",
      "app/(dashboard)/workspace/workspace-dashboard.tsx",
      "app/(dashboard)/rules/rules-client.tsx",
    ];
    const directImports = canonicalSurfaces.filter(
      (path) =>
        readFileSync(path, "utf8").includes('from "./dashboard-ui"') ||
        readFileSync(path, "utf8").includes('from "../../dashboard-ui"'),
    );
    expect(directImports).toEqual([]);
    for (const path of canonicalSurfaces) {
      expect(readFileSync(path, "utf8")).toContain("DashboardPage");
    }
  });

  it("keeps route titles and navigation in the shared configuration", () => {
    const shell = readFileSync("app/dashboard-shell.tsx", "utf8");
    expect(shell).toContain("DASHBOARD_SIDEBAR_NAVIGATION_SECTIONS");
    expect(shell).toContain('from "./dashboard-navigation"');
    expect(readFileSync("app/dashboard-template.tsx", "utf8")).toContain("DASHBOARD_ROUTE_TITLES");
    for (const href of DASHBOARD_NAVIGATION_HREFS) expect(DASHBOARD_ROUTE_TITLES[href], href).toBeTruthy();
    expect(shell).not.toContain("const navigationGroups");
    expect(shell).not.toContain("const routeTitles");
  });

  it("keeps primary and secondary actions on the approved shared tokens", () => {
    const theme = readFileSync("app/mui-theme.ts", "utf8");
    expect(theme).toContain(
      'export const traderIntelligencePrimaryAction = "#011E56"',
    );
    expect(theme).toContain(
      'props: { color: "primary", variant: "contained" }',
    );
    expect(theme).toContain('color: "#ffffff"');
    expect(theme).toContain('props: { color: "primary", variant: "outlined" }');
    expect(theme).toContain("borderRadius: 8");
    expect(theme).toContain("minHeight: 40");
    expect(theme).toContain("fontWeight: 700");
    expect(theme).toContain('textTransform: "none"');
    expect(theme).toContain('boxShadow: "none"');

    const components = readFileSync("app/dashboard-ui.tsx", "utf8");
    expect(components).toContain(
      'color="primary" disableElevation variant="contained"',
    );
    expect(components).toContain(
      'color="primary" disableElevation variant="outlined"',
    );
  });
});
