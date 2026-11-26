"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { Logical, Time, UTCTimestamp } from "lightweight-charts";
import type { PriceMovementBar, PriceMovementKind } from "@/src/modules/scanner/alpaca/chart-price-movement";
import { createChartTradeReplay, readChartTradeReplayFrame } from "@/src/modules/scanner/alpaca/chart-trade-replay";
import { resolveChartTimeZone } from "@/src/modules/scanner/alpaca/chart-time-zone";
import type { ChartPreferences } from "@/src/modules/scanner/alpaca/chart-preferences";

type Style = Pick<ChartPreferences, "upColor" | "downColor" | "timezone" | "grid">;

export default function PriceMovementChart({ kind, symbol, generation, step, dark, style }: {
  kind: PriceMovementKind; symbol: string; generation: string; step: number; dark: boolean; style: Style;
}) {
  const container = useRef<HTMLDivElement>(null);
  const crosshair = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");
  const [attempt, setAttempt] = useState(0);
  const retries = useRef(0);
  const { upColor, downColor, timezone, grid } = style;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let cancelled = false;
    let close: (() => void) | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    async function connect() {
      const { createChart, CandlestickSeries, ColorType } = await import("lightweight-charts");
      if (cancelled || !element) return;
      const replay = createChartTradeReplay(kind, step);
      let bars: readonly PriceMovementBar[] = [];
      let published = false;
      const timestamp = new Intl.DateTimeFormat("en-GB", {
        timeZone: resolveChartTimeZone(timezone), hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
      const label = (position: unknown) => {
        const bar = typeof position === "number" ? bars[position - 1] : undefined;
        return bar ? timestamp.format(Date.parse(bar.time)) : "";
      };
      const chart = createChart(element, {
        autoSize: true,
        rightPriceScale: { entireTextOnly: true },
        layout: { background: { type: ColorType.Solid, color: dark ? "#101722" : "#ffffff" }, textColor: dark ? "#c7d2df" : "#354358", fontSize: 11 },
        grid: { vertLines: { visible: grid }, horzLines: { visible: grid } },
        timeScale: {
          timeVisible: true, rightOffset: 3, tickMarkMaxCharacterLength: 8,
          // A bar ordinal is the chart coordinate. The visible labels use the actual trade clock.
          tickMarkFormatter: (position: Time) => {
            if (typeof position !== "number") return "";
            const x = chart.timeScale().logicalToCoordinate((position - 1) as Logical);
            return x === null || x < 28 || x > chart.timeScale().width() - 28 ? "" : label(position);
          },
        },
        localization: { timeFormatter: label },
      });
      close = () => chart.remove();
      const series = chart.addSeries(CandlestickSeries, {
        upColor, downColor, wickUpColor: upColor, wickDownColor: downColor, borderVisible: false,
        lastValueVisible: false, priceLineVisible: false,
        priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
      });
      let guide: ReturnType<typeof series.createPriceLine> | undefined;
      function clear() {
        delete element?.dataset.chartTradePosition;
        bars = [];
        published = false;
        series.setData([]);
        if (guide) series.removePriceLine(guide);
        guide = undefined;
        if (crosshair.current) crosshair.current.textContent = "";
      }
      chart.subscribeCrosshairMove(event => {
        const bar = typeof event.time === "number" ? bars[event.time - 1] : undefined;
        if (crosshair.current) crosshair.current.textContent = bar
          ? `${label(event.time)} · O ${bar.open} H ${bar.high} L ${bar.low} C ${bar.close}${bar.complete ? "" : " · Forming"}`
          : "";
      });

      setStatus("Loading regular-session trades…");
      const query = new URLSearchParams({ symbol, generation });
      const stream = new EventSource(`/api/charts/ordered-trades?${query}`);
      close = () => { stream.close(); chart.remove(); };
      const interrupted = (message: string, recover = false) => {
        clear();
        stream.close();
        if (recover && retries.current < 4) {
          const delay = 1_000 * 2 ** retries.current++;
          setStatus("Reconnecting to reload the trade feed…");
          retry = setTimeout(() => { if (!cancelled) setAttempt(value => value + 1); }, delay);
        } else setStatus(message);
      };
      stream.onerror = () => { if (!cancelled) interrupted("The ordered trade feed is unavailable.", true); };
      stream.addEventListener("status", event => {
        if (cancelled) return;
        try {
          const { state } = JSON.parse(event.data);
          if (state === "unavailable" || state === "limit") interrupted("Ordered trades are unavailable for this session.");
          else if (state === "closed") setStatus("Regular session is closed.");
          else if (state === "warming") { clear(); setStatus("Loading regular-session trades…"); }
        } catch { interrupted("The trade feed returned an invalid status."); }
      });
      stream.addEventListener("tape", event => {
        if (cancelled) return;
        try {
          const data = JSON.parse(event.data);
          const frame = readChartTradeReplayFrame(data);
          if (frame.kind === "snapshot") {
            // Cutoff is the REST bootstrap boundary. Replacement snapshots can also contain live prints.
            const start = Date.parse(data.start), cutoff = Date.parse(data.cutoff);
            if (data.symbol !== symbol || data.session !== "regular" ||
                typeof data.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
                !Number.isFinite(start) || !Number.isFinite(cutoff) || cutoff < start ||
                frame.trades.some(trade => Date.parse(trade.time) < start)) {
              throw Error("invalid_trade_coverage");
            }
          }
          const next = replay(frame);
          if (next.status === "ignored") return;
          if (next.status !== "ready") {
            if (frame.kind === "reset") { clear(); setStatus("Rebuilding from the trade feed…"); }
            else interrupted("Trade coverage was interrupted. Reconnect to reload it.", true);
            return;
          }

          if (frame.kind === "snapshot") retries.current = 0;
          const previous = bars;
          bars = next.bars;
          const point = (bar: PriceMovementBar) => ({ ...bar, time: (bar.position + 1) as UTCTimestamp,
            ...(bar.complete ? {} : { color: (bar.close >= bar.open ? upColor : downColor) + "80" }) });
          if (!published || frame.kind === "snapshot" || bars.length < previous.length) series.setData(bars.map(point));
          else {
            const from = Math.max(0, previous.length - (previous.at(-1)?.complete === false ? 1 : 0));
            for (let i = from; i < bars.length; i++) series.update(point(bars[i]));
          }
          if (!published && bars.length) {
            chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, bars.length - 100), to: bars.length + 2 });
            published = true;
          }
          if (next.lastTrade) {
            const price = next.lastTrade.price;
            if (guide) guide.applyOptions({ price });
            else guide = series.createPriceLine({ price, color: "#f39c12", title: "Trade", axisLabelVisible: true });
          }
          setStatus(bars.length ? "" : next.lastTrade ? "Waiting for enough price movement…" : "No trades in this session.");
          element.dataset.chartTradePosition = String(next.cursor);
        } catch { interrupted("The trade feed returned incomplete data."); }
      });
    }
    void connect().catch(() => { close?.(); close = undefined; if (!cancelled) setStatus("The ordered trade chart could not load."); });
    return () => { cancelled = true; clearTimeout(retry); close?.(); };
  }, [attempt, dark, downColor, generation, grid, kind, step, symbol, timezone, upColor]);

  return <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
    <Box ref={container} data-chart-price-movement={kind} sx={{ position: "absolute", inset: 0 }} />
    <Box ref={crosshair} data-chart-movement-readout sx={{ position: "absolute", top: 2, left: 8, pointerEvents: "none", fontSize: 10 }} />
    {status && <Box sx={{ position: "absolute", top: 3, right: 8, display: "flex", gap: 1, alignItems: "center" }}>
      <Typography role="status" variant="caption">{status}</Typography>
      {/(unavailable|could not|invalid|incomplete|interrupted)/.test(status) &&
        <Button size="small" onClick={() => { retries.current = 0; setAttempt(value => value + 1); }}>Reconnect</Button>}
    </Box>}
  </Box>;
}
