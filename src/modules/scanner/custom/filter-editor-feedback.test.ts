import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { CustomScannersClient } from "@/app/(dashboard)/scanners/custom-scanners-client";

vi.mock("next/dynamic", () => ({
  default: () => ({ singleScanner }: { singleScanner?: string }) => singleScanner
    ? createElement("div", { "data-live-scan": singleScanner })
    : null,
}));
vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ title, action, children }: { title: string; action: ReactNode; children: ReactNode }) =>
    createElement("section", null, createElement("h2", null, title), action, children),
}));
vi.mock("@/app/(dashboard)/charts/market-chart", () => ({ MarketChart: () => null }));
vi.mock("@/app/(dashboard)/scanners/custom-scan-results", () => ({
  CustomScanResults: ({ definition }: { definition: { rules: unknown[]; match?: string } }) =>
    createElement("div", { "data-applied-rules": JSON.stringify(definition.rules), "data-match": definition.match ?? "all" }),
}));
vi.mock("@/app/(dashboard)/scanners/scanner-match-chart", () => ({ ScannerInlineMatch: () => null }));
vi.mock("@/app/(dashboard)/scanners/use-custom-scans", () => ({
  useCustomScanResults: () => ({ values: {}, queries: [] }),
  useSavedCustomScans: () => ({ book: { revision: 0, scans: [] } }),
}));

function choose(select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function setInput(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function button(target: ParentNode, label: string) {
  return [...target.querySelectorAll("button")].find(item => item.textContent === label)!;
}

it.each([
  ["side", false], ["side", true], ["top", false], ["top", true],
] as const)("focuses and reveals a new filter in %s layout (grouped: %s)", async (layout, grouped) => {
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
    await act(async () => root.render(createElement(CustomScannersClient, { returnScope: "filter-feedback", initialChoice: "live:gainers" })));
    await act(async () => { await new Promise(requestAnimationFrame); });
    expect(container.querySelector("h2")?.textContent).toBe("Scanner");
    expect(container.querySelector('[data-live-scan="gainers"]')).not.toBeNull();
    expect(container.querySelector('section[aria-label="Scan filters"]')).not.toBeNull();
    expect(container.textContent).toContain("Top Gainers starter template");
    expect(container.querySelector('[aria-label="Common filters"]')).not.toBeNull();
    const side = button(container, "Side card");
    expect(side).toBeDefined();
    if (layout === "side") await act(async () => side!.click());
    const drawer = document.querySelector(layout === "side" ? 'div[role="dialog"][aria-label="Scan filters"]' : 'section[aria-label="Scan filters"]')!;
    const addGroup = button(drawer, "Add group");
    if (grouped) await act(async () => addGroup!.click());
    const target = grouped ? drawer.querySelector('[aria-label="Filter group 1"]')! : drawer;
    const label = grouped ? "Add filter to group 1" : "Add filter";
    await act(async () => button(target, label).click());
    const picker = document.querySelector(`[role="dialog"][aria-label="${label}"]`)!;
    expect(picker.querySelector('[role="group"][aria-label="Company"]')).not.toBeNull();
    const checkbox = (name: string) => [...picker.querySelectorAll("label")].find(item => item.textContent === name)!
      .querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    await act(async () => checkbox("Float").click());
    await act(async () => checkbox("Price").click());
    expect(checkbox("Float").checked).toBe(true);
    expect(checkbox("Price").checked).toBe(true);
    await act(async () => button(picker, "Add selected (2)").click());
    const rule = target.querySelector('[role="group"][aria-label="Float filter"]')!;
    expect(rule).not.toBeNull();
    expect(target.querySelector('[role="group"][aria-label="Price filter"]')).not.toBeNull();
    expect(document.activeElement).toBe(rule);
    expect(scrollTargets).toEqual([rule]);
    expect(container.querySelector('[data-live-scan="gainers"]')).not.toBeNull();
    if (layout === "side") {
      const layoutSelect = [...drawer.querySelectorAll("select")].find(select => select.options[0]?.value === "side")!;
      await act(async () => choose(layoutSelect, "top"));
      expect(container.querySelector('section[aria-label="Scan filters"] [aria-label="Float filter"]')).not.toBeNull();
      expect(container.querySelector('[data-live-scan="gainers"]')).not.toBeNull();
    }
  } finally {
    await act(async () => root.unmount());
    container.remove();
    localStorage.removeItem("traderlink:scanner-filter-layout:v2:filter-feedback");
    if (previousScroll) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", previousScroll);
    else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    vi.unstubAllGlobals();
  }
});

it("applies the desktop Price, Float and RVOL shortcuts as three rules in the same scan", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.body.appendChild(document.createElement("div"));
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(CustomScannersClient, { returnScope: "quick-filters" })));
    await act(async () => { await new Promise(requestAnimationFrame); });
    expect(container.querySelector('[aria-label="Common filters"]')).not.toBeNull();
    const field = (name: string) => container.querySelector<HTMLInputElement>(`input[aria-label="${name}"]`)!;
    await act(async () => setInput(field("Quick price minimum"), "0.50"));
    await act(async () => setInput(field("Quick price maximum"), "5"));
    await act(async () => setInput(field("Quick float maximum"), "10M"));
    await act(async () => setInput(field("Quick RVOL minimum"), "3"));
    const applied = container.querySelector("[data-applied-rules]")!;
    expect(applied.getAttribute("data-applied-rules")).toBe("[]");
    await act(async () => button(container, "Apply").click());
    expect(applied.getAttribute("data-match")).toBe("all");
    expect(JSON.parse(applied.getAttribute("data-applied-rules")!)).toMatchObject([
      { metric: "price", minimum: 0.5, maximum: 5 },
      { metric: "float", minimum: null, maximum: 10_000_000 },
      { metric: "sameTimeRegularVolume", minimum: 3, maximum: null, frame: "15m" },
    ]);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});

it("keeps the exact PR duration across unit changes and uses the next edited value", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const previousScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: () => {} });
  const container = document.body.appendChild(document.createElement("div"));
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(CustomScannersClient, { returnScope: "pr-duration" })));
    await act(async () => button(container, "Add filter").click());
    const picker = document.querySelector('[role="dialog"][aria-label="Add filter"]')!;
    const label = [...picker.querySelectorAll("label")].find(item => item.textContent === "Press release")!;
    await act(async () => label.querySelector("input")!.click());
    await act(async () => button(picker, "Add selected (1)").click());
    const rule = () => container.querySelector('[aria-label="Press release filter"]');
    const unit = () => [...rule()!.querySelectorAll<HTMLElement>('[role="combobox"]')]
      .find(item => ["Minutes", "Hours", "Days"].includes(item.textContent ?? ""))!;
    const setUnit = async (name: string) => {
      await act(async () => { unit().dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })); });
      const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(el => el.textContent === name)!;
      await act(async () => option.click());
    };
    const past = () => rule()!.querySelector<HTMLInputElement>('input[inputmode="decimal"]')!;
    for (const minutes of [61, 1]) {
      await setUnit("Minutes");
      await act(async () => setInput(past(), String(minutes)));
      await setUnit("Days");
      await act(async () => button(container, "Apply").click());
      expect(JSON.parse(container.querySelector("[data-applied-rules]")!.getAttribute("data-applied-rules")!))
        .toEqual([{ metric: "pressRelease", minimum: null, maximum: minutes / 60 }]);
      // Apply collapses the rule editor.
      if (!rule()) {
        const toggle = [...container.querySelectorAll("button")].find(item => item.textContent?.startsWith("Press release within"))!;
        await act(async () => toggle.click());
      }
    }
  } finally {
    await act(async () => root.unmount());
    container.remove();
    if (previousScroll) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", previousScroll);
    else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    vi.unstubAllGlobals();
  }
});
