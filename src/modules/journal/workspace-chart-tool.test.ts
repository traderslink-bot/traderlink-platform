// @vitest-environment jsdom

import { act, createElement, useEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DashboardChartAction,
  DashboardChartPanelSlot,
  DashboardChartProvider,
  useDashboardChart,
} from "@/app/(dashboard)/dashboard-chart-tool";

const chart = vi.hoisted(() => ({ mount: vi.fn(), unmount: vi.fn() }));

vi.mock("@/app/(dashboard)/charts/market-chart", () => ({
  MarketChart: ({ symbol, compactIdentity, actions }: {
    symbol: string;
    compactIdentity: ReactNode;
    actions: ReactNode;
  }) => {
    useEffect(() => {
      chart.mount();
      return () => { chart.unmount(); };
    }, []);

    return createElement("section", { "data-shared-chart": symbol }, compactIdentity, actions);
  },
}));

vi.mock("@/app/dashboard-template", () => ({
  DashboardSecondaryAction: ({ children, onClick, "aria-label": label }: {
    children: ReactNode;
    onClick: () => void;
    "aria-label"?: string;
  }) => createElement("button", { type: "button", "aria-label": label, onClick }, children),
}));

function TradeRowAction() {
  const { openChart } = useDashboardChart();
  return createElement("button", { type: "button", onClick: () => openChart("NYSE:GME") }, "Chart GME");
}

describe("Journal Workspace shared chart", () => {
  let container: HTMLDivElement;
  let root: Root;
  let scrollIntoView: PropertyDescriptor | undefined;

  function button(name: string) {
    const element = [...container.querySelectorAll("button")].find((item) =>
      (item.getAttribute("aria-label") ?? item.textContent?.trim()) === name);
    expect(element, name).toBeDefined();
    return element!;
  }

  function currentChart() {
    return container.querySelector<HTMLElement>("[data-shared-chart]");
  }

  async function click(name: string) {
    await act(async () => { button(name).click(); });
  }

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    scrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    chart.mount.mockClear();
    chart.unmount.mockClear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        createElement(
          DashboardChartProvider,
          null,
          createElement(DashboardChartAction),
          createElement(TradeRowAction),
          createElement(DashboardChartPanelSlot),
        ),
      );
    });
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
    if (scrollIntoView) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollIntoView);
    else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    vi.unstubAllGlobals();
  });

  it("opens one chart from either entry point and retains its instance when minimized", async () => {
    expect(currentChart()).toBeNull();
    await click("Open chart");
    await vi.waitFor(() => expect(currentChart()?.dataset.sharedChart).toBe("AAPL"));
    await click("Full screen");
    expect(button("Exit full screen")).toBeDefined();
    await click("Minimize chart");
    expect(currentChart()?.parentElement?.getAttribute("aria-hidden")).toBe("true");
    await click("Restore AAPL chart");
    expect(currentChart()?.parentElement?.getAttribute("aria-hidden")).toBe("false");
    await click("Chart GME");
    expect(currentChart()?.dataset.sharedChart).toBe("GME");
    expect(chart.mount).toHaveBeenCalledTimes(1);
    await click("Close chart");
    expect(currentChart()).toBeNull();
    expect(chart.unmount).toHaveBeenCalledTimes(1);
  });

  it("validates an entered ticker and switches symbol without exiting full screen", async () => {
    await click("Open chart");
    await vi.waitFor(() => expect(currentChart()).not.toBeNull());
    await click("Full screen");
    const input = container.querySelector<HTMLInputElement>('input[aria-label="Chart ticker"]')!;
    const submit = async (value: string) => {
      input.value = value;
      await act(async () => {
        input.form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
    };
    await submit("not a ticker");
    expect(input.validationMessage).toBe("Enter a valid ticker symbol.");
    expect(currentChart()?.dataset.sharedChart).toBe("AAPL");
    input.setCustomValidity("");
    await submit(" msft ");
    expect(currentChart()?.dataset.sharedChart).toBe("MSFT");
    expect(button("Exit full screen")).toBeDefined();
  });
});
