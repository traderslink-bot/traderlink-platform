"use client";

import { Box, Typography } from "@mui/material";
import {
  CandlestickSeries,
  HistogramSeries,
  createChart,
  createSeriesMarkers,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import type { DaySessionTradeAnalyzer } from "./day-session-types";

function easternTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  }).format(new Date(timestamp * 1000));
}

export function DailyTradeAnalyzerChart({
  analysis,
  symbol,
  tradeNumber,
}: {
  analysis: DaySessionTradeAnalyzer;
  symbol: string;
  tradeNumber: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || analysis.status !== "ready" || analysis.candles.length === 0) return;
    const chart = createChart(container, {
      autoSize: true,
      height: 390,
      layout: { background: { color: "#f8fbff" }, textColor: "#172033" },
      rightPriceScale: { borderColor: "#dce5f0" },
      timeScale: {
        borderColor: "#dce5f0",
        tickMarkFormatter: (time) => typeof time === "number" ? easternTime(time) : "",
        timeVisible: true,
      },
      localization: {
        timeFormatter: (time) => typeof time === "number" ? easternTime(time) : "",
      },
    });
    const candles = chart.addSeries(CandlestickSeries, {
      downColor: "#d14343",
      borderDownColor: "#d14343",
      borderUpColor: "#1b8a5a",
      upColor: "#1b8a5a",
      wickDownColor: "#d14343",
      wickUpColor: "#1b8a5a",
    });
    candles.setData(analysis.candles.map((candle) => ({
      close: Number(candle.close),
      high: Number(candle.high),
      low: Number(candle.low),
      open: Number(candle.open),
      time: candle.time as Time,
    })));
    const volume = chart.addSeries(HistogramSeries, {
      color: "rgba(1, 30, 86, 0.30)",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    }, 1);
    volume.setData(analysis.candles.map((candle) => ({
      time: candle.time as Time,
      value: Number(candle.volume),
    })));
    chart.panes()[1]?.setHeight(74);
    const eventsByCandle = new Map<number, DaySessionTradeAnalyzer["events"]>();
    for (const event of analysis.events) {
      if (event.candleTime === null) continue;
      eventsByCandle.set(event.candleTime, [...(eventsByCandle.get(event.candleTime) ?? []), event]);
    }
    createSeriesMarkers(candles, [...eventsByCandle.entries()].map(([time, events]) => {
      const exits = events.filter((event) => event.kind === "final_exit" || event.kind === "partial_exit");
      const entries = events.filter((event) => event.kind === "entry" || event.kind === "add");
      return {
        color: exits.length > 0 && entries.length > 0 ? "#2459a6" : exits.length > 0 ? "#b42318" : "#087443",
        position: exits.length > 0 && entries.length > 0 ? "inBar" : exits.length > 0 ? "aboveBar" : "belowBar",
        shape: "circle",
        time: time as Time,
      };
    }));
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [analysis]);

  return (
    <Box sx={{ bgcolor: "#f8fbff", borderBottom: 1, borderColor: "divider", position: "relative" }}>
      <Typography sx={{ left: 16, position: "absolute", top: 12, zIndex: 1 }} variant="caption">
        {symbol} · Trade {tradeNumber}
      </Typography>
      <Box ref={containerRef} sx={{ height: 390, width: "100%" }} />
    </Box>
  );
}
