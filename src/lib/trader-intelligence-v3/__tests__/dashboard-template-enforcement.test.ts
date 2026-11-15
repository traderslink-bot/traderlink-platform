import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

import { DASHBOARD_NAVIGATION_HREFS } from "@/app/dashboard-navigation";

const dashboardRoot = join(process.cwd(), "app", "(dashboard)");
const retiredLegacyAnalyticsLabClient = join(
  dashboardRoot,
  "analytics",
  "lab",
  "analytics-lab-client.tsx",
);
const reviewedFeaturePanelFiles = new Set([
  join(dashboardRoot, "market-news", "general", "general-market-news-feed.tsx"),
  join(dashboardRoot, "ai-reviews", "trade-tracker-review-coverage.tsx"),
  join(dashboardRoot, "calendar", "calendar-client.tsx"),
  join(dashboardRoot, "press-releases", "press-release-article-drawer.tsx"),
  join(dashboardRoot, "workspace", "workspace-rules-panel.tsx"),
  join(dashboardRoot, "analytics", "candle-pattern-occurrence-explorer.tsx"),
  join(dashboardRoot, "analytics", "trade-analysis-client.tsx"),
  join(dashboardRoot, "analytics", "trade-detail-drawer.tsx"),
  join(dashboardRoot, "analytics", "trade-explorer", "trade-explorer-client.tsx"),
  join(dashboardRoot, "analytics", "trade-explorer", "trade-review-editor.tsx"),
  join(dashboardRoot, "analytics", "trade-explorer", "trade-tag-creation-drawer.tsx"),
  join(dashboardRoot, "charts", "chart-preferences-panel.tsx"),
  join(dashboardRoot, "charts", "trade-market-chart-drawer.tsx"),
  join(dashboardRoot, "notes", "journal-notes-drawer.tsx"),
  join(dashboardRoot, "scanner", "scanner-client.tsx"),
  join(dashboardRoot, "screeners", "declines-card.tsx"),
  join(dashboardRoot, "screeners", "live-screeners-client.tsx"),
  join(dashboardRoot, "screeners", "premarket-pullbacks-card.tsx"),
  join(dashboardRoot, "screeners", "screener-press-release-board.tsx"),
  join(dashboardRoot, "screeners", "workspace", "declines-card.tsx"),
  join(dashboardRoot, "screeners", "workspace", "live-screeners-client.tsx"),
  join(dashboardRoot, "screeners", "workspace", "premarket-pullbacks-card.tsx"),
  join(dashboardRoot, "screeners", "workspace", "screener-press-release-board.tsx"),
  join(dashboardRoot, "trades", "trade-details-drawer.tsx"),
  join(dashboardRoot, "workspace", "workspace-atomic-trade-edit-drawer.tsx"),
  join(dashboardRoot, "workspace", "workspace-calendar-panel.tsx"),
  join(dashboardRoot, "workspace", "workspace-more-filters-drawer.tsx"),
  join(dashboardRoot, "workspace", "workspace-news-scanner-panel.tsx"),
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

describe("TraderLink Platform dashboard template enforcement", () => {
  it("wraps every dashboard route with the approved shared template", () => {
    const layout = readFileSync(join(dashboardRoot, "layout.tsx"), "utf8");
    const frame = readFileSync("app/dashboard-layout-frame.tsx", "utf8");
    expect(layout).toContain(
      'import { TraderLinkPlatformDashboardFrame } from "../dashboard-layout-frame"',
    );
    expect(layout).toContain("<TraderLinkPlatformDashboardFrame>{children}</TraderLinkPlatformDashboardFrame>");
    expect(frame).toContain('import { TraderLinkPlatformDashboardTemplate } from "./dashboard-template"');
    expect(frame).toContain("<TraderLinkPlatformDashboardTemplate");
    expect(frame).toContain("</TraderLinkPlatformDashboardTemplate>");
  });

  it("requires a route for every configured navigation destination", () => {
    const routes = filesBelow(dashboardRoot)
      .filter((path) => path.endsWith(`${sep}page.tsx`))
      .map(routeForPage);
    const pressReleaseRoute = "app/(dashboard)/press-releases/[[...channel]]/page.tsx";
    const channels = readFileSync(pressReleaseRoute, "utf8");
    const resolves = (href: string) => routes.includes(href) ||
      (href === "/watchlist" && existsSync("app/watchlist/page.tsx")) ||
      (href.startsWith("/press-releases/") &&
        channels.includes(`case "${href.slice("/press-releases/".length)}":`));
    expect(DASHBOARD_NAVIGATION_HREFS.filter(href => !resolves(href))).toEqual([]);
  });

  it("rejects local dashboard shells, headers, sidebars, and page containers", () => {
    const forbidden = [
      /from ["']@mui\/material\/AppBar["']/,
      /from ["']@mui\/material\/Toolbar["']/,
      /<\w*DashboardShell\b|(?:function|class)\s+\w*DashboardShell\b|from ["'][^"']*dashboard-shell["']/,
      /logo-horizontal-main\.png/,
      /component=["']main["']/,
      /<main(?:\s|>)/,
    ];
    const violations = filesBelow(dashboardRoot)
      .filter(
        (path) =>
          path.endsWith(".tsx") &&
          path !== join(dashboardRoot, "layout.tsx") &&
          path !== retiredLegacyAnalyticsLabClient,
      )
      .flatMap((path) => {
        const source = readFileSync(path, "utf8");
        return forbidden
          .filter((pattern) => pattern.test(source))
          .map(
            (pattern) => `${relative(process.cwd(), path)}:${pattern.source}`,
          );
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
    const navigation = readFileSync("app/dashboard-navigation.ts", "utf8");
    expect(navigation).toContain("DASHBOARD_ROUTE_TITLES");
    expect(shell).toContain("DASHBOARD_SIDEBAR_NAVIGATION_SECTIONS");
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
