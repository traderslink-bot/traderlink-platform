import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  DASHBOARD_SIDEBAR_NAVIGATION_SECTIONS,
  isDashboardNavigationItem,
  isTradeJournalNavigationPath,
} from "@/app/dashboard-navigation";

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
    expect(callout).toContain("Explore the sample trade history, notes, and performance summaries");
    expect(callout).toContain("When you’re ready to track your own trades, clear the demo data and start fresh.");
    expect(callout).toContain('if (!expectedAccountSelectionRef || pathname === "/workspace" || !isTradeJournalNavigationPath(pathname)) return null');
    expect(template).toContain("<DemoDataAccountIndicator");
  });
});


describe("Demo notice visibility", () => {
  it("follows the Trade Journal sidebar group and its subpages", () => {
    for (const { group } of DASHBOARD_SIDEBAR_NAVIGATION_SECTIONS) {
      const expected = group.id === "tradeJournal";
      for (const section of [group, ...(group.subgroups ?? [])]) {
        for (const item of section.items.filter(isDashboardNavigationItem)) {
          expect(isTradeJournalNavigationPath(item.href), item.href).toBe(expected);
        }
      }
    }
    expect(isTradeJournalNavigationPath("/analytics/trade-explorer/example")).toBe(true);
    expect(isTradeJournalNavigationPath("/analytics-preview")).toBe(false);
    expect(isTradeJournalNavigationPath("/market-news/week-ahead/example")).toBe(false);
    expect(isTradeJournalNavigationPath("/account")).toBe(false);
    expect(isTradeJournalNavigationPath("/welcome")).toBe(false);
  });
});
