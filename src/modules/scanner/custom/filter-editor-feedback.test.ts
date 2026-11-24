import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { CustomScannersClient } from "@/app/(dashboard)/scanners/custom-scanners-client";

vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ title, action, children }: { title: string; action: ReactNode; children: ReactNode }) =>
    createElement("section", null, createElement("h2", null, title), action, children),
}));
vi.mock("@/app/(dashboard)/charts/market-chart", () => ({ MarketChart: () => null }));
vi.mock("@/app/(dashboard)/scanners/custom-scan-results", () => ({ CustomScanResults: () => null }));
vi.mock("@/app/(dashboard)/scanners/scanner-match-chart", () => ({ ScannerInlineMatch: () => null }));
vi.mock("@/app/(dashboard)/scanners/use-custom-scans", () => ({
  useCustomScanResults: () => ({ values: {}, queries: [] }),
  useSavedCustomScans: () => ({ book: { revision: 0, scans: [] } }),
}));

it.each([false, true])("focuses and reveals an added filter (within group: %s)", async grouped => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const scrollTargets: HTMLElement[] = [];
  const previousScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value(this: HTMLElement) { scrollTargets.push(this); },
  });
  const container = document.body.appendChild(document.createElement("div"));
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(CustomScannersClient, { returnScope: "filter-feedback" })));
    expect(container.querySelector("h2")?.textContent).toBe("Scanners");
    const filters = [...container.querySelectorAll("button")].find(button => button.textContent === "Filters");
    expect(filters).toBeDefined();
    await act(async () => filters!.click());
    const drawer = document.querySelector('[aria-label="Scan filters"]')!;
    const addGroup = [...drawer.querySelectorAll("button")].find(button => button.textContent === "Add group");
    if (grouped) await act(async () => addGroup!.click());
    const target = grouped ? drawer.querySelector('[aria-label="Filter group 1"]')! : drawer;
    const add = target.querySelector<HTMLButtonElement>('[aria-label="Add Float filter"]')!;
    await act(async () => add.click());
    const rule = target.querySelector('[role="group"][aria-label="Float filter"]')!;
    expect(rule).not.toBeNull();
    expect(document.activeElement).toBe(rule);
    expect(scrollTargets).toEqual([rule]);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    if (previousScroll) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", previousScroll);
    else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    vi.unstubAllGlobals();
  }
});
