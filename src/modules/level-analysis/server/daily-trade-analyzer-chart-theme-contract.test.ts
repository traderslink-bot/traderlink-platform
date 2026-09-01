import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function chartSource(): string {
  return readFileSync(resolve(
    process.cwd(),
    "app/(dashboard)/trade-tracker/[sessionDate]/daily-trade-analyzer-chart.tsx",
  ), "utf8");
}

describe("Daily Trade Analyzer chart appearance contract", () => {
  it("uses a clean Light chart surface without a Dark-mode grid", () => {
    const source = chartSource();

    expect(source).toContain('background: "#ffffff"');
    expect(source).toContain('text: "#172033"');
    expect(source).toContain("const chartTheme = theme.palette.mode === \"dark\"");
    expect(source).toContain("? DARK_ANALYZER_LIGHT_CHART_THEME");
    expect(source).toContain('grid: theme.palette.mode === "dark" ? {');
    expect(source).toContain("horzLines: { visible: false }");
    expect(source).toContain("vertLines: { visible: false }");
    expect(source).toContain("} : undefined,");
    expect(source).toContain("const annotationAppearance = LIGHT_ANALYZER_ANNOTATION_APPEARANCE");
    expect(source).toContain("const chartPatternColors = LIGHT_PATTERN_COLORS");
    expect(source).toContain("const chartSemanticColors = LIGHT_ANALYZER_SEMANTIC_COLORS");
  });
});
