import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Dark chart controls and dashboard description contract", () => {
  it("keeps Analyzer controls intentionally dark while preserving Light presentation", () => {
    const chart = source("app/(dashboard)/trade-tracker/[sessionDate]/daily-trade-analyzer-chart.tsx");

    expect(chart).toContain('const usesDarkChartControls = theme.palette.mode === "dark"');
    expect(chart).toContain("bgcolor: usesDarkChartControls ? theme.palette.secondary.main");
    expect(chart).toContain("color: usesDarkChartControls ? theme.palette.text.primary");
    expect(chart).toContain('"&.Mui-disabled": usesDarkChartControls');
    expect(chart).toContain('"& .Mui-selected": {');
    expect(chart).toContain("Display");
    expect(chart).toContain("Fullscreen");
    expect(chart).toContain("ChartZoomControls");
  });

  it("renders disabled AI and Demo text through direct element color rules", () => {
    const comingSoon = source("app/(dashboard)/ai-coming-soon.tsx");
    const demo = source("app/(dashboard)/demo-data-callout.tsx");

    expect(comingSoon).toContain('sx={{ color: "text.primary", maxWidth: 760 }}');
    expect(comingSoon).not.toContain("DashboardAppearanceText");
    expect(demo).toContain('const demoBodyColor = theme.palette.text.primary');
    expect(demo).toContain('const demoHeadingColor = theme.palette.mode === "dark"');
    expect(demo).toContain("Viewing demo data");
    expect(demo).toContain("Clear demo data and start fresh");
    expect(demo).toContain('sx={{ color: demoBodyColor }} variant="body2"');
  });
});
