import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import type { DaySessionTradeAnalyzer } from "@/app/(dashboard)/trade-tracker/[sessionDate]/day-session-types";

const state = vi.hoisted(() => ({ props: null as unknown as Record<string, unknown> }));
vi.mock("@/app/(dashboard)/charts/market-chart", () => ({ MarketChart: (props: Record<string, unknown>) => {
  state.props = props; return <div data-shared-chart-fixture>{String(props.symbol)} · {String(props.timeframe)}</div>;
} }));
vi.mock("@/app/(dashboard)/trade-tracker/written-trade-analysis", () => ({ WrittenTradeAnalysis: () => <div>Saved analysis details</div> }));
import TradeMarketChartDrawer from "@/app/(dashboard)/charts/trade-market-chart-drawer";

it("keeps Analyzer full-chart handoff, fills, timeframe, Fit trade and return action connected to the shared chart", async () => {
  const host = document.createElement("div"), root = createRoot(host), close = vi.fn(); document.body.append(host);
  const context = { from: 1731940200, to: 1731940500, marks: [{ id: "analysis-fill-entry", time: 1731940200, kind: "buy" as const, label: "Entry 100 @ 0.0277" }] };
  try {
    await act(async () => root.render(<TradeMarketChartDrawer analysis={{ status: "ready" } as DaySessionTradeAnalyzer}
      context={context} currency="USD" direction="long" interval="1m" onClose={close} selectedEventId="entry" symbol="SHFS" timezone="America/New_York" />));
    expect(document.querySelector('[aria-label="SHFS full chart"]')).not.toBeNull();
    expect(state.props.symbol).toBe("SHFS"); expect(state.props.tradeContext).toBe(context);
    await act(async () => (state.props.onTimeframeChange as (value: string) => void)("1W"));
    expect(state.props.timeframe).toBe("1W"); expect(state.props.tradeContext).toBe(context);
    await act(async () => (document.querySelector('[aria-label="Fit trade"]') as HTMLButtonElement).click());
    expect(state.props.tradeFocusRevision).toBe(1);
    await act(async () => (state.props.onTradeMarkClick as (value: unknown) => void)(context.marks));
    expect(document.querySelector('[aria-label="Saved trade analysis"]')?.textContent).toContain("Entry 100 @ 0.0277");
    expect(document.body.textContent).toContain("Saved analysis details");
    await act(async () => (document.querySelector('[aria-label="Back to Trade Analyzer"]') as HTMLButtonElement).click());
    expect(close).toHaveBeenCalledTimes(1);
    expect(host.textContent).not.toMatch(/Alpaca|Moomoo|Finnhub|EODHD/);
  } finally { await act(async () => root.unmount()); host.remove(); }
});
