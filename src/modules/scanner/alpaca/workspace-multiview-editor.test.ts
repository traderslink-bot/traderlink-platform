import { act, createElement, Fragment, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ScannerCompactChart } from "@/app/(dashboard)/screeners/workspace/scanner-compact-chart";
import { ChartMultiviewMenu } from "@/app/(dashboard)/charts/chart-multiview-menu";
import { readWorkspaceChartLayout, useWorkspaceChartLayout, workspaceChartKey } from "@/app/(dashboard)/screeners/workspace/use-workspace-chart-layout";
import { singleChart } from "./chart-multiview";

vi.mock("@/app/(dashboard)/charts/market-chart", () => ({
  MarketChart: ({ closeAction }: { closeAction: ReactNode }) => closeAction,
}));
vi.mock("@/app/(dashboard)/screeners/workspace/workspace-chart-visibility", () => ({
  workspaceChartHasVisibleArea: () => true,
}));

it("edits the starting Workspace chart and three added charts from the same Multiview dialog", async () => {
  const owner = "workspace-multiview-test";
  const storageKey = workspaceChartKey(owner);
  const original = singleChart("LVWR", "5m");
  localStorage.setItem(storageKey, JSON.stringify(original));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  const frames = new Map<number, FrameRequestCallback>();
  let serial = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++serial, callback);
    return serial;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  const node = document.createElement("div");
  document.body.append(node);
  const root = createRoot(node);
  function Workspace() {
    const { layout, change } = useWorkspaceChartLayout(owner);
    const [arrange, setArrange] = useState(false);
    if (!layout) return null;
    const { arrangement, ...menuLayout } = layout;
    return createElement(Fragment, null,
      createElement("nav", null, createElement(ChartMultiviewMenu, {
        layout: menuLayout, onChange: next => change({ ...next, arrangement }), defaultTimeframe: "5m",
        chartTabs: true, iconOnly: true, workspaceFullGrid: true, openingPanelId: layout.selectedPanel ?? undefined, onArrange: () => setArrange(true),
      })),
      createElement(ScannerCompactChart, {
        symbol: "LVWR", layout, onLayoutChange: change, defaultTimeframe: "5m", slot: "slot-6",
        arrange, onEndArrange: () => setArrange(false),
      }));
  }
  const dialog = () => document.querySelector('[role="dialog"]')!;
  const button = (text: string) => [...dialog().querySelectorAll("button")].find(item => item.textContent === text)!;
  const input = (label: string) => [...dialog().querySelectorAll("label")]
    .find(item => item.textContent === label || item.textContent === label + " (starting chart)")?.control as HTMLInputElement;
  const click = (element: HTMLElement) => act(async () => { element.click(); });
  const type = (target: HTMLInputElement, value: string) => act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(target, value);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const saved = () => readWorkspaceChartLayout(localStorage.getItem(storageKey))!;
  try {
    await act(async () => root.render(createElement(Workspace)));
    await act(async () => {
      for (const [id, callback] of [...frames]) { frames.delete(id); callback(0); }
    });
    const launcher = () => node.querySelector<HTMLButtonElement>('nav button[aria-label="Multiview"]')!;
    await vi.waitFor(() => expect(launcher()).toBeTruthy());
    await click(launcher());
    expect(input("Ticker 1 (starting chart)").value).toBe("LVWR");

    for (const [index, symbol] of ["AKAN", "BENF", "APUS"].entries()) {
      await click(button("+ Add ticker"));
      const newTicker = input(`Ticker ${index + 2}`);
      expect(document.activeElement).toBe(newTicker);
      if (index === 2) {
        expect(dialog().textContent).toContain("Enter a ticker to enable Apply.");
        expect(button("Apply").disabled).toBe(true);
      }
      await type(newTicker, symbol);
    }
    expect(button("+ Add ticker").disabled).toBe(true);
    expect(dialog().textContent).toContain("All four chart slots are filled.");
    expect(saved()).toEqual(original);
    await click(button("Apply"));
    expect(saved().groups.map(group => group.symbol)).toEqual(["LVWR", "AKAN", "BENF", "APUS"]);
    expect(saved().groups[0]).toEqual(original.groups[0]);
    expect(launcher().title).toBe("Multiview active");
    expect(node.querySelectorAll('button[aria-label="Multiview"]')).toHaveLength(1);

    await click(launcher());
    await type(input("Ticker 1"), "ONDS");
    await type(input("Ticker 4"), "ATPC");
    await click(button("Apply"));
    expect(saved().groups.map(group => group.symbol)).toEqual(["ONDS", "AKAN", "BENF", "ATPC"]);
    expect(saved().groups[0].panels).toEqual(original.groups[0].panels);

    const move = (label: string) => node.querySelector<HTMLButtonElement>(`button[aria-label="Move ${label} 5m chart"]`)!;
    const toolbarButton = (label: string) => [...node.querySelectorAll("button")].find(item => item.textContent === label)!;
    const ids = saved().groups.map(group => group.panels[0].id);
    await click(launcher());
    await click(button("Arrange charts"));
    await click(move("ONDS"));
    await click(move("ATPC"));
    expect(saved().arrangement).toBeUndefined();
    await click(toolbarButton("Cancel"));
    expect(saved().arrangement).toBeUndefined();

    await click(launcher());
    await click(button("Arrange charts"));
    await click(move("ONDS"));
    await click(move("ATPC"));
    await click(toolbarButton("Done"));
    expect(saved().arrangement?.order).toEqual([ids[3], ids[1], ids[2], ids[0]]);

    await act(async () => {
      for (const [id, callback] of [...frames]) { frames.delete(id); callback(0); }
    });
    const ondsTab = [...node.querySelectorAll<HTMLElement>('[role="tab"]')]
      .find(tab => tab.textContent === "ONDS 5m");
    if (ondsTab) await click(ondsTab);
    const close = () => node.querySelector<HTMLButtonElement>('button[aria-label="Close ONDS 5m chart"]')!;
    await vi.waitFor(() => expect(close()).toBeTruthy());
    await click(close());
    expect(saved().groups.map(group => group.symbol)).toEqual(["AKAN", "BENF", "ATPC"]);
    expect(saved().arrangement?.order).toEqual([ids[3], ids[1], ids[2]]);
  } finally {
    await act(async () => root.unmount());
    node.remove();
    localStorage.removeItem(storageKey);
    vi.unstubAllGlobals();
  }
});
