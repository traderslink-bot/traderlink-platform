"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";

export type SavedCandle = { time: number; openDecimal: string; highDecimal: string; lowDecimal: string; closeDecimal: string };
export function SavedMarketDataChart({ candles }: { candles: readonly SavedCandle[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  useEffect(() => {
    if (!ref.current) return;
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false });
    const label = (time: unknown) => typeof time === "number" ? formatter.format(new Date(time * 1000)) : "";
    const chart = createChart(ref.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: theme.palette.background.paper }, textColor: theme.palette.text.primary },
      grid: { vertLines: { color: theme.palette.divider }, horzLines: { color: theme.palette.divider } },
      timeScale: { timeVisible: true, secondsVisible: false, tickMarkFormatter: label },
      localization: { timeFormatter: label },
    });
    const series = chart.addSeries(CandlestickSeries, { upColor: "#22865b", downColor: "#d94d57", borderVisible: false, wickUpColor: "#22865b", wickDownColor: "#d94d57" });
    series.setData(candles.map((candle) => ({ time: candle.time as UTCTimestamp, open: Number(candle.openDecimal), high: Number(candle.highDecimal), low: Number(candle.lowDecimal), close: Number(candle.closeDecimal) })));
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [candles, theme]);
  return <div ref={ref} aria-label="Saved one-minute candles; times in New York" style={{ width: "100%", height: 420 }} />;
}
