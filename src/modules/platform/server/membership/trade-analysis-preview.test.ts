// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { createTraderMaterialTheme } from "@/app/mui-theme";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ usePathname: () => "/analytics/trade-analyzer/day" }));
const mocks = vi.hoisted(() => ({ read: vi.fn(), population: vi.fn() }));
vi.mock("./platform-membership-page-access", () => ({ requireMembershipPreviewPageScope: vi.fn().mockResolvedValue(null) }));
vi.mock("../database/open-readonly-platform-database", () => ({ withReadonlyPlatformDatabase: mocks.read }));
vi.mock("@/src/modules/level-analysis/server/trend-momentum-pattern-runtime", () => ({ withSavedPatternRuntime: mocks.population }));
vi.mock("@/app/dashboard-template", async () => await import("@/app/dashboard-ui"));
import { TradeAnalysisPage } from "@/app/(dashboard)/analytics/trade-analysis-page";
describe("denied Analysis rendering", () => {
  it.each(["light", "dark"] as const)("renders the actual Demo capture in %s without reading member results", async appearance => {
    const element = await TradeAnalysisPage({ baseHref: "/analytics/trade-analyzer/day", searchParams: {}, view: "day" });
    const html = renderToStaticMarkup(createElement(ThemeProvider, { theme: createTraderMaterialTheme(appearance) }, element));
    expect(html).toContain("Demo preview");
    expect(html).toContain("not interactive");
    expect(html).toContain("/plans");
    expect(html).toContain(`day-${appearance}-desktop-section-01.webp`);
    expect(html).toContain(`day-${appearance}-mobile-section-01.webp`);
    expect(html).not.toContain("screenshot for this page is being prepared");
    expect(html).not.toContain("Demo trade A");
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.population).not.toHaveBeenCalled();
    expect(html).not.toContain("offline-saved-view");
  });
});
