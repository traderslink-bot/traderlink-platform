import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Demo data callout appearance contract", () => {
  it("uses one Dark-aware foreground token for every dashboard indicator and Workspace callout", () => {
    const callout = source("app/(dashboard)/demo-data-callout.tsx");
    const template = source("app/dashboard-template.tsx");

    expect(callout).toContain("const demoBodyColor = theme.palette.text.primary");
    expect(callout).toContain('const demoHeadingColor = theme.palette.mode === "dark"');
    expect(callout).toContain("? theme.palette.text.primary");
    expect(callout).toContain(": theme.palette.error.main;");
    expect(callout).toContain('sx={{ color: demoHeadingColor, fontWeight: 800 }}');
    expect(callout).toContain('component="h2" sx={{ color: demoHeadingColor,');
    expect(callout).toContain('sx={{ color: demoBodyColor }} variant="body2"');
    expect(callout).toContain("Your Trade Journal account is preloaded with sample trades from August.");
    expect(callout).toContain("When you’re ready to track your own trades, clear the demo data and start fresh.");
    expect(callout).toContain('pathname === "/home" || pathname === "/workspace" || pathname === "/trade-analyzer"');
    const analyzer = source("app/(dashboard)/trade-analyzer/page.tsx");
    expect(analyzer).toContain("Explore Trade Analyzer with demo data");
    expect(analyzer.match(/<ClearDemoDataAction\b/g)).toHaveLength(1);
    expect(template).toContain("<DemoDataAccountIndicator");
  });
});
