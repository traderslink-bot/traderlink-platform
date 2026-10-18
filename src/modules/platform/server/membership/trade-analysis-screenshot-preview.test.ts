// @vitest-environment node
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "@mui/material/styles";
import { describe, expect, it, vi } from "vitest";
import { createTraderMaterialTheme } from "@/app/mui-theme";
vi.mock("@/app/dashboard-template", async () => await import("@/app/dashboard-ui"));
vi.mock("next/navigation", () => ({ usePathname: () => "/analytics/trade-analyzer/day" }));
vi.mock("@/src/modules/platform/contracts/trade-analysis-demo-snapshots", () => ({
  tradeAnalysisDemoSnapshots: { pages: { day: Object.fromEntries(["light", "dark"].map(theme => [theme, {
    desktop: { width: 1100, height: 2400, sections: [1, 2].map((n, i) => ({ src: `/demo-previews/trade-analyzer-analysis/day-${theme}-desktop-section-${n}.webp`, width: 1100, height: 1200, top: i * 1200 })) },
    mobile: { width: 366, height: 4000, sections: [1, 2].map((n, i) => ({ src: `/demo-previews/trade-analyzer-analysis/day-${theme}-mobile-section-${n}.webp`, width: 366, height: 2000, top: i * 2000 })) },
  }])) } },
}));
import { TradeAnalysisLockedPreview } from "@/app/(dashboard)/analytics/trade-analysis-locked-preview";
describe("static actual-UI screenshot preview", () => {
  it.each(["light", "dark"] as const)("selects %s desktop/mobile sources with no live controls", appearance => {
    const html = renderToStaticMarkup(createElement(ThemeProvider, { theme: createTraderMaterialTheme(appearance) },
      createElement(TradeAnalysisLockedPreview, { title: "Day Trade Analysis", view: "day" })));
    expect(html).toContain(`day-${appearance}-desktop-section-1.webp`);
    expect(html).toContain(`day-${appearance}-mobile-section-1.webp`);
    expect(html).toContain('media="(max-width: 899px)"');
    expect(html.match(/loading="lazy"/g)).toHaveLength(2);
    expect(html.match(/<picture /g)).toHaveLength(2);
    expect(html).toContain(`day-${appearance}-desktop-section-2.webp`);
    expect(html).toContain(`day-${appearance}-mobile-section-2.webp`);
    expect(html.match(/Demo account preview of/g)).toHaveLength(1);
    expect(html).toContain('alt=""');
    expect(html).toContain('decoding="async"');
    expect(html).not.toContain("/_next/image");
    expect(html).not.toContain("<canvas");
    expect(html).not.toContain("<input");
    expect(html).toContain('href="/plans"');
    expect(html).toContain("not interactive");
  });
  it("does not fabricate an image when a view has no captures", () => {
    const html = renderToStaticMarkup(createElement(TradeAnalysisLockedPreview, { title: "Candle patterns", view: "candle-patterns" }));
    expect(html).toContain("screenshot for this page is being prepared");
    expect(html).not.toContain("<picture");
  });
});
