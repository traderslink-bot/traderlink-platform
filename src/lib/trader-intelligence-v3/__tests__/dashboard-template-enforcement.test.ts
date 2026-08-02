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

describe("TraderLink Platform dashboard template enforcement", () => {
  it("wraps every dashboard route with the approved shared template", () => {
    const layout = readFileSync(join(dashboardRoot, "layout.tsx"), "utf8");
    expect(layout).toContain(
      'import { TraderLinkPlatformDashboardTemplate } from "../dashboard-template"',
    );
    expect(layout).toContain("<TraderLinkPlatformDashboardTemplate");
    expect(layout).toContain("</TraderLinkPlatformDashboardTemplate>");
  });

  it("keeps every configured navigation destination inside the route group", () => {
    const routes = filesBelow(dashboardRoot)
      .filter((path) => path.endsWith(`${sep}page.tsx`))
      .map(routeForPage);
    expect(
      DASHBOARD_NAVIGATION_HREFS.filter((href) => !routes.includes(href)),
    ).toEqual([]);
  });

  it("rejects local dashboard shells, headers, sidebars, and page containers", () => {
    const forbidden = [
      /from ["']@mui\/material\/AppBar["']/,
      /from ["']@mui\/material\/Drawer["']/,
      /from ["']@mui\/material\/Toolbar["']/,
      /DashboardShell/,
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
    expect(shell).toContain("DASHBOARD_ROUTE_TITLES");
    expect(shell).toContain("DASHBOARD_MAIN_NAVIGATION_GROUPS");
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
