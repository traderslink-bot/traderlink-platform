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
    expect(callout).toContain('color={demoHeadingColor} sx={{ fontWeight: 800 }}');
    expect(callout).toContain('color={demoHeadingColor} component="h2"');
    expect(callout).toContain('color={demoBodyColor} variant="body2"');
    expect(callout).toContain("Your account has been preloaded with demo data");
    expect(callout).toContain("Take a tour, explore the features");
    expect(callout).toContain("Ready to start tracking your own journey?");
    expect(callout).toContain('if (!expectedAccountSelectionRef || pathname === "/workspace") return null');
    expect(template).toContain("<DemoDataAccountIndicator");
  });
});
