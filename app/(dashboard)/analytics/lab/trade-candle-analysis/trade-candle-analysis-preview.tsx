"use client";

import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef } from "react";

import {
  DashboardPage,
  DashboardPanel,
} from "../../../../dashboard-template";

type PreviewCandle = {
  close: number;
  high: number;
  low: number;
  open: number;
  time: number;
};

const PREVIEW_CANDLES: readonly PreviewCandle[] = [
  { time: 1718376600, open: 1.06, high: 1.1, low: 1.04, close: 1.09 },
  { time: 1718376900, open: 1.09, high: 1.14, low: 1.08, close: 1.12 },
  { time: 1718377200, open: 1.12, high: 1.2, low: 1.1, close: 1.18 },
  { time: 1718377500, open: 1.18, high: 1.24, low: 1.16, close: 1.22 },
  { time: 1718377800, open: 1.22, high: 1.3, low: 1.2, close: 1.27 },
  { time: 1718378100, open: 1.27, high: 1.38, low: 1.25, close: 1.34 },
  { time: 1718378400, open: 1.34, high: 1.43, low: 1.31, close: 1.4 },
  { time: 1718378700, open: 1.4, high: 1.51, low: 1.37, close: 1.48 },
  { time: 1718379000, open: 1.48, high: 1.58, low: 1.44, close: 1.52 },
  { time: 1718379300, open: 1.52, high: 1.55, low: 1.46, close: 1.49 },
  { time: 1718379600, open: 1.49, high: 1.6, low: 1.47, close: 1.57 },
  { time: 1718379900, open: 1.57, high: 1.68, low: 1.54, close: 1.64 },
  { time: 1718380200, open: 1.64, high: 1.66, low: 1.56, close: 1.59 },
  { time: 1718380500, open: 1.59, high: 1.62, low: 1.5, close: 1.53 },
];

type LightweightChartsApi = {
  CandlestickSeries: unknown;
  ColorType: { Solid: string };
  LineStyle: { Dashed: number; Dotted: number };
  createChart: (
    container: HTMLDivElement,
    options: Record<string, unknown>,
  ) => {
    addSeries: (
      series: unknown,
      options: Record<string, unknown>,
    ) => {
      createPriceLine: (options: Record<string, unknown>) => void;
      setData: (candles: readonly PreviewCandle[]) => void;
    };
    remove: () => void;
    timeScale: () => { fitContent: () => void };
  };
};

declare global {
  interface Window {
    LightweightCharts?: LightweightChartsApi;
  }
}

function loadLightweightCharts(): Promise<LightweightChartsApi> {
  if (window.LightweightCharts) {
    return Promise.resolve(window.LightweightCharts);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-trade-candle-chart-library="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.LightweightCharts) resolve(window.LightweightCharts);
      });
      existing.addEventListener("error", () =>
        reject(new Error("trade_candle_chart_library_unavailable")),
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.dataset.tradeCandleChartLibrary = "true";
    script.src =
      "https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js";
    script.onload = () => {
      if (window.LightweightCharts) {
        resolve(window.LightweightCharts);
      } else {
        reject(new Error("trade_candle_chart_library_unavailable"));
      }
    };
    script.onerror = () =>
      reject(new Error("trade_candle_chart_library_unavailable"));
    document.head.appendChild(script);
  });
}

function TradeCandleChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let active = true;
    let chart: ReturnType<LightweightChartsApi["createChart"]> | null = null;

    void loadLightweightCharts()
      .then((library) => {
        if (!active) return;
        chart = library.createChart(container, {
          attributionLogo: true,
          autoSize: true,
          grid: {
            horzLines: { color: "#e7ebf2" },
            vertLines: { color: "#f1f3f7" },
          },
          handleScroll: { mouseWheel: true, pressedMouseMove: true, vertTouchDrag: true },
          handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
          layout: {
            attributionLogo: true,
            background: { type: library.ColorType.Solid, color: "#ffffff" },
            textColor: "#526176",
          },
          localization: { priceFormatter: (price: number) => `$${price.toFixed(2)}` },
          rightPriceScale: { borderColor: "#dfe5ef" },
          timeScale: { borderColor: "#dfe5ef", timeVisible: true },
        });
        const candles = chart.addSeries(library.CandlestickSeries, {
          borderDownColor: "#ca4b5b",
          borderUpColor: "#15825a",
          downColor: "#ca4b5b",
          upColor: "#15825a",
          wickDownColor: "#ca4b5b",
          wickUpColor: "#15825a",
        });
        candles.setData(PREVIEW_CANDLES);
        candles.createPriceLine({
          axisLabelVisible: true,
          color: "#137333",
          lineStyle: library.LineStyle.Dashed,
          lineWidth: 2,
          price: 1.1,
          title: "Entry $1.10",
        });
        candles.createPriceLine({
          axisLabelVisible: true,
          color: "#b3261e",
          lineStyle: library.LineStyle.Dashed,
          lineWidth: 2,
          price: 1.34,
          title: "Exit $1.34",
        });
        candles.createPriceLine({
          axisLabelVisible: true,
          color: "#00639b",
          lineStyle: library.LineStyle.Dotted,
          lineWidth: 1,
          price: 1.58,
          title: "30m high $1.58",
        });
        chart.timeScale().fitContent();
      })
      .catch(() => undefined);

    return () => {
      active = false;
      chart?.remove();
    };
  }, []);

  return (
    <Box
      aria-label="Design preview candlestick chart for a completed long trade"
      ref={containerRef}
      sx={{ height: { xs: 360, md: 480 }, minWidth: 0, width: "100%" }}
    />
  );
}

function Observation({
  children,
  label,
}: {
  children: string;
  label: string;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700 }}>{children}</Typography>
    </Stack>
  );
}

export function TradeCandleAnalysisPreview() {
  return (
    <DashboardPage>
      <Stack spacing={0.75}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Box>
            <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
              Analytics Lab experiment
            </Typography>
            <Typography component="h1" variant="h1">
              Trade Candle Analysis
            </Typography>
          </Box>
          <Chip color="warning" label="Design preview" size="small" />
        </Stack>
        <Typography color="text.secondary" variant="body2">
          Fixture data only. Yahoo candles and verified broker executions are not connected yet.
        </Typography>
      </Stack>

      <Alert severity="info">
        Feedback appears only when the required candle window is complete. The first
        30 minutes after exit are the primary review; the next 30 minutes provide
        context without changing that first finding.
      </Alert>

      <DashboardPanel
        action={
          <Stack direction="row" spacing={0.75}>
            <Chip label="5-minute candles" size="small" variant="outlined" />
            <Chip label="Long" size="small" variant="outlined" />
          </Stack>
        }
        title="Candle replay"
      >
        <TradeCandleChart />
        <Stack
          direction={{ xs: "column", md: "row" }}
          divider={<Divider flexItem orientation="vertical" />}
          spacing={2}
          sx={{ mt: 2 }}
        >
          <Observation label="Entry">9:40 AM · $1.10</Observation>
          <Observation label="Final exit">10:05 AM · $1.34</Observation>
          <Observation label="Primary review">First 30 minutes after exit</Observation>
          <Observation label="Context">Up to 60 minutes after exit</Observation>
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 2 }}>
          <OpenInNewRoundedIcon color="primary" fontSize="small" />
          <Typography color="text.secondary" variant="caption">
            Chart powered by{" "}
            <Box
              component="a"
              href="https://www.tradingview.com/"
              rel="noreferrer"
              sx={{ color: "primary.main", fontWeight: 700 }}
              target="_blank"
            >
              TradingView Lightweight Charts
            </Box>
            .
          </Typography>
        </Stack>
      </DashboardPanel>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <DashboardPanel title="Profit giveback">
          <Stack spacing={1.25}>
            <Typography sx={{ fontWeight: 700 }}>
              Observed peak was $1.51 while the trade was open.
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Final exit at $1.34 came after the fixture trade reached its observed
              high. The live analyzer will stay quiet if the held-position candles
              are incomplete.
            </Typography>
            <Chip label="Complete trade window" size="small" variant="outlined" />
          </Stack>
        </DashboardPanel>

        <DashboardPanel title="Exit timing">
          <Stack spacing={1.25}>
            <Typography sx={{ fontWeight: 700 }}>
              Price continued higher after exit.
            </Typography>
            <Typography color="text.secondary" variant="body2">
              The observed high reached $1.58 in the first 30 minutes after the
              $1.34 exit. Price later reached $1.68 in the 60-minute context.
            </Typography>
            <Chip color="info" label="Primary window complete" size="small" variant="outlined" />
          </Stack>
        </DashboardPanel>

        <DashboardPanel title="Entry timing">
          <Stack spacing={1.25}>
            <Typography sx={{ fontWeight: 700 }}>
              Price held above the $1.10 entry.
            </Typography>
            <Typography color="text.secondary" variant="body2">
              The fixture shows immediate continuation after entry. The live
              analyzer will report only what the observed pre- and post-entry
              candle windows support.
            </Typography>
            <Chip label="Complete entry windows" size="small" variant="outlined" />
          </Stack>
        </DashboardPanel>
      </Box>
    </DashboardPage>
  );
}
