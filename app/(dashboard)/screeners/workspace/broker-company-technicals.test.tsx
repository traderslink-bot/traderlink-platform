import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { CompanyTechnicalsPanel } from "../../ticker/[symbol]/company-technicals-panel";
import { WorkspaceBrokerChartProvider } from "../../charts/workspace-broker-chart-context";
import { ScannerIndicatorReads } from "../scanner-card-indicators";

vi.mock("@/app/dashboard-ui", () => ({
  DashboardPanel: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

it("uses only the broker technicals feed, renders its quote, and releases it on close", async () => {
  const sources: Source[] = [];
  class Source {
    onmessage?: (event: MessageEvent<string>) => void;
    onerror?: () => void;
    close = vi.fn();
    constructor(readonly url: string) { sources.push(this); }
  }
  const read = vi.fn<typeof fetch>(async () => Response.json({}));
  vi.stubGlobal("EventSource", Source);
  vi.stubGlobal("fetch", read);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () => root.render(<CompanyTechnicalsPanel symbol="TEST" active inDrawer broker
      header={price => <span data-price>{price}</span>} averageVolumes={[111_111, 222_222]}/>));
    expect(sources.map(source => source.url)).toEqual(["/api/trading-workspace/broker/company-technicals?symbol=TEST"]);
    expect(read.mock.calls.length).toBeGreaterThan(0);
    expect(read.mock.calls.every(([url]) => String(url).startsWith("/api/trading-workspace/broker/company-technicals?"))).toBe(true);
    expect(container.querySelector("[data-price]")?.textContent).toBe("");
    await act(async () => sources[0].onmessage?.(new MessageEvent("message", { data: JSON.stringify({
      session: "regular", asOf: Date.UTC(2026, 10, 25, 15),
      quote: { price: 1.2345, observedAt: Date.UTC(2026, 10, 25, 15), premarketVolume: 100, regularVolume: 200 },
    }) })));
    expect(container.querySelector("[data-price]")?.textContent).toBe("$1.2345");
    expect(container.textContent).toContain("Moomoo quote");
    expect(container.textContent).not.toContain("111.1K");
    await act(async () => sources[0].onerror?.());
    expect(container.querySelector("[data-price]")?.textContent).toBe("");
  } finally {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
  }
  expect(sources[0].close).toHaveBeenCalledOnce();
});

it("uses the connected account's candles for compact card indicators", async () => {
  const generation = "a".repeat(64);
  const read = vi.fn<typeof fetch>(async url => {
    if (String(url).endsWith("/provider")) return Response.json({ generation });
    return Response.json({ symbol: "TEST", frame: "5m", vwap: 1.1, rows: [
      { name: "VWAP", text: "$1.10", details: "VWAP", direction: "neutral", signals: [] },
    ] });
  });
  vi.stubGlobal("fetch", read);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () => root.render(<WorkspaceBrokerChartProvider>
      <ScannerIndicatorReads row={{ symbol: "TEST", price: 1.2345 }} now={Date.UTC(2026, 10, 25, 15)} />
    </WorkspaceBrokerChartProvider>));
    expect(read.mock.calls.map(([url]) => url)).toEqual([
      "/api/trading-workspace/broker/charts/provider",
      `/api/trading-workspace/broker/company-technicals?compact=1&symbol=TEST&frame=5m&generation=${generation}`,
    ]);
    expect(container.querySelector('[data-scanner-indicator="VWAP"]')?.textContent).toContain("above");
  } finally {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
  }
});
