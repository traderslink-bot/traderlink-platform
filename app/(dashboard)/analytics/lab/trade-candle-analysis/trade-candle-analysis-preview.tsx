"use client";

import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";

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
  volume: number;
};

type SimulationCase = {
  candles: readonly PreviewCandle[];
  entryPrice: number;
  entryTime: string;
  exitPrice?: number;
  exitTime?: string;
  id: "cycu" | "gctk" | "nuwe";
  noFeedbackReason?: string;
  primaryHigh?: { price: number; time: string };
  symbol: string;
  title: string;
  volumeLabel: string;
};

type LiveSimulationResult =
  | {
      replay: readonly PreviewCandle[];
      results: {
        entryTiming: { detail: string; title: string };
        exitTiming: { detail: string; title: string };
        profitGiveback: { detail: string; title: string };
      };
      status: "ready";
      symbol: string;
      simulatedTrade: {
        entryPrice: number;
        entryTime: number;
        exitPrice: number;
        exitTime: number;
      };
      patternObservations: readonly {
        kind: string;
        time: number;
        zone: "entry" | "exit" | "held_peak";
      }[];
    }
  | { reason: string; status: "no_feedback"; symbol: string };

const SIMULATION_CASES: readonly SimulationCase[] = [
  {
    id: "cycu",
    symbol: "CYCU",
    title: "Early exit continuation",
    entryTime: "9:30 AM",
    entryPrice: 0.321,
    exitTime: "9:39 AM",
    exitPrice: 0.335,
    primaryHigh: { time: "10:14 AM", price: 0.54 },
    volumeLabel: "Active regular-hours volume",
    candles: [
      { time: 1785418200, open: 0.321, high: 0.358, low: 0.3199, close: 0.3229, volume: 31607047 },
      { time: 1785418500, open: 0.3221, high: 0.35, low: 0.32, close: 0.335, volume: 2005489 },
      { time: 1785418800, open: 0.3344, high: 0.378, low: 0.3344, close: 0.3689, volume: 5871386 },
      { time: 1785419100, open: 0.3693, high: 0.4, low: 0.3557, close: 0.3754, volume: 6939330 },
      { time: 1785419400, open: 0.3755, high: 0.397, low: 0.36, close: 0.3676, volume: 5640748 },
      { time: 1785419700, open: 0.3675, high: 0.4, low: 0.36, close: 0.385, volume: 5785419 },
      { time: 1785420000, open: 0.385, high: 0.47, low: 0.3759, close: 0.4542, volume: 14158727 },
      { time: 1785420300, open: 0.4539, high: 0.4999, low: 0.4415, close: 0.4802, volume: 16739866 },
      { time: 1785420600, open: 0.48, high: 0.54, low: 0.444, close: 0.5107, volume: 18624476 },
      { time: 1785420900, open: 0.5107, high: 0.5195, low: 0.4728, close: 0.4794, volume: 14864836 },
      { time: 1785421200, open: 0.4813, high: 0.5106, low: 0.475, close: 0.481, volume: 12275817 },
      { time: 1785421500, open: 0.481, high: 0.5496, low: 0.4633, close: 0.5167, volume: 14473405 },
      { time: 1785421800, open: 0.5167, high: 0.5175, low: 0.4455, close: 0.4507, volume: 12071148 },
      { time: 1785422100, open: 0.4509, high: 0.467, low: 0.4344, close: 0.4436, volume: 7814899 },
      { time: 1785422400, open: 0.4442, high: 0.465, low: 0.428, close: 0.451, volume: 5906215 },
      { time: 1785422700, open: 0.4511, high: 0.4586, low: 0.43, close: 0.4399, volume: 3864413 },
      { time: 1785423000, open: 0.4394, high: 0.4395, low: 0.412, close: 0.4331, volume: 4054928 },
      { time: 1785423300, open: 0.433, high: 0.4483, low: 0.4252, close: 0.4471, volume: 2723995 },
    ],
  },
  {
    id: "nuwe",
    symbol: "NUWE",
    title: "Early exit continuation",
    entryTime: "9:30 AM",
    entryPrice: 5.6846,
    exitTime: "9:39 AM",
    exitPrice: 5.9101,
    primaryHigh: { time: "9:42 AM", price: 6.3999 },
    volumeLabel: "Active regular-hours volume",
    candles: [
      { time: 1785418200, open: 5.6846, high: 6.2199, low: 5.25, close: 5.6351, volume: 58357379 },
      { time: 1785418500, open: 5.63, high: 6.33, low: 5.46, close: 5.9101, volume: 6867265 },
      { time: 1785418800, open: 5.9184, high: 6.3999, low: 5.3601, close: 5.475, volume: 3936349 },
      { time: 1785419100, open: 5.5, high: 6, low: 5.31, close: 5.9599, volume: 2559402 },
      { time: 1785419400, open: 5.9577, high: 6.0399, low: 5.6, close: 5.8901, volume: 2411373 },
      { time: 1785419700, open: 5.885, high: 5.91, low: 5.47, close: 5.5531, volume: 1721850 },
      { time: 1785420000, open: 5.57, high: 5.57, low: 4.5201, close: 4.6499, volume: 3548266 },
      { time: 1785420300, open: 4.6201, high: 4.87, low: 4.6011, close: 4.8699, volume: 1239414 },
      { time: 1785420600, open: 4.8692, high: 4.87, low: 4.3901, close: 4.391, volume: 1044526 },
      { time: 1785420900, open: 4.391, high: 4.6999, low: 4.36, close: 4.585, volume: 860263 },
      { time: 1785421200, open: 4.585, high: 4.69, low: 4.2, close: 4.3091, volume: 1343171 },
      { time: 1785421500, open: 4.3, high: 4.425, low: 4.26, close: 4.3375, volume: 507933 },
      { time: 1785421800, open: 4.3218, high: 4.3218, low: 3.86, close: 3.9391, volume: 1550713 },
      { time: 1785422100, open: 3.9316, high: 4.16, low: 3.81, close: 4.12, volume: 1297707 },
      { time: 1785422400, open: 4.121, high: 4.32, low: 3.96, close: 4.29, volume: 1067815 },
      { time: 1785422700, open: 4.28, high: 4.33, low: 4.1304, close: 4.21, volume: 885228 },
      { time: 1785423000, open: 4.2199, high: 4.45, low: 4.07, close: 4.42, volume: 1059235 },
      { time: 1785423300, open: 4.41, high: 4.58, low: 4.32, close: 4.57, volume: 1492756 },
    ],
  },
  {
    id: "gctk",
    symbol: "GCTK",
    title: "No qualifying early-exit simulation",
    entryTime: "9:30 AM",
    entryPrice: 0.4081,
    noFeedbackReason:
      "No profitable simulated exit between 9:35 and 10:00 AM was followed by a higher observed price in the 60-minute context.",
    volumeLabel: "Regular-hours volume available",
    candles: [
      { time: 1785418200, open: 0.4081, high: 0.4081, low: 0.37, close: 0.3819, volume: 43353509 },
      { time: 1785418500, open: 0.3802, high: 0.385, low: 0.363, close: 0.3745, volume: 1767296 },
      { time: 1785418800, open: 0.3745, high: 0.3786, low: 0.3644, close: 0.3712, volume: 989262 },
      { time: 1785419100, open: 0.3713, high: 0.3746, low: 0.3558, close: 0.3561, volume: 1112129 },
      { time: 1785419400, open: 0.3562, high: 0.3619, low: 0.3431, close: 0.3547, volume: 1263500 },
      { time: 1785419700, open: 0.3547, high: 0.359, low: 0.3522, close: 0.3563, volume: 320269 },
      { time: 1785420000, open: 0.356, high: 0.356, low: 0.3365, close: 0.3429, volume: 827337 },
      { time: 1785420300, open: 0.3429, high: 0.3555, low: 0.3428, close: 0.3545, volume: 593594 },
      { time: 1785420600, open: 0.3522, high: 0.36, low: 0.3503, close: 0.3552, volume: 419812 },
      { time: 1785420900, open: 0.3554, high: 0.3564, low: 0.35, close: 0.3541, volume: 184178 },
      { time: 1785421200, open: 0.3541, high: 0.3632, low: 0.354, close: 0.3607, volume: 477622 },
      { time: 1785421500, open: 0.3607, high: 0.369, low: 0.35, close: 0.3595, volume: 757745 },
      { time: 1785421800, open: 0.358, high: 0.3653, low: 0.3541, close: 0.3552, volume: 228441 },
      { time: 1785422100, open: 0.3551, high: 0.36, low: 0.3536, close: 0.3551, volume: 363875 },
      { time: 1785422400, open: 0.3549, high: 0.369, low: 0.3549, close: 0.3669, volume: 240141 },
      { time: 1785422700, open: 0.3664, high: 0.3766, low: 0.3586, close: 0.3703, volume: 512428 },
      { time: 1785423000, open: 0.3702, high: 0.38, low: 0.37, close: 0.3756, volume: 456918 },
      { time: 1785423300, open: 0.3765, high: 0.3799, low: 0.3651, close: 0.3661, volume: 589120 },
    ],
  },
];

const DEFAULT_SIMULATION_CASE = SIMULATION_CASES[0]!;

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

function formatPrice(price: number): string {
  return `$${price.toFixed(4)}`;
}

function formatEasternTime(time: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(time * 1000));
}

function TradeCandleChart({ scenario }: { scenario: SimulationCase }) {
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
          localization: { priceFormatter: formatPrice },
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
        candles.setData(scenario.candles);
        candles.createPriceLine({
          axisLabelVisible: true,
          color: "#137333",
          lineStyle: library.LineStyle.Dashed,
          lineWidth: 2,
          price: scenario.entryPrice,
          title: `Entry ${formatPrice(scenario.entryPrice)}`,
        });
        if (scenario.exitPrice) {
          candles.createPriceLine({
            axisLabelVisible: true,
            color: "#b3261e",
            lineStyle: library.LineStyle.Dashed,
            lineWidth: 2,
            price: scenario.exitPrice,
            title: `Simulated exit ${formatPrice(scenario.exitPrice)}`,
          });
        }
        if (scenario.primaryHigh) {
          candles.createPriceLine({
            axisLabelVisible: true,
            color: "#00639b",
            lineStyle: library.LineStyle.Dotted,
            lineWidth: 1,
            price: scenario.primaryHigh.price,
            title: `30m high ${formatPrice(scenario.primaryHigh.price)}`,
          });
        }
        chart.timeScale().fitContent();
      })
      .catch(() => undefined);

    return () => {
      active = false;
      chart?.remove();
    };
  }, [scenario]);

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
  const [selectedScenarioId, setSelectedScenarioId] = useState<SimulationCase["id"]>(
    "cycu",
  );
  const scenario =
    SIMULATION_CASES.find((item) => item.id === selectedScenarioId) ??
    DEFAULT_SIMULATION_CASE;
  const hasExitContinuation = Boolean(scenario.exitPrice && scenario.primaryHigh);
  const [liveResult, setLiveResult] = useState<LiveSimulationResult | null>(null);
  const displayedScenario =
    liveResult?.status === "ready"
      ? {
          ...scenario,
          candles: liveResult.replay,
          entryPrice: liveResult.simulatedTrade.entryPrice,
          entryTime: formatEasternTime(liveResult.simulatedTrade.entryTime),
          exitPrice: liveResult.simulatedTrade.exitPrice,
          exitTime: formatEasternTime(liveResult.simulatedTrade.exitTime),
        }
      : scenario;
  const liveFindings =
    liveResult?.status === "ready" ? liveResult.results : null;

  useEffect(() => {
    let active = true;
    setLiveResult(null);
    void fetch(`/api/intelligence/trade-candle-analysis/simulations?symbol=${scenario.symbol}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as LiveSimulationResult;
      })
      .then((result) => {
        if (active) setLiveResult(result);
      })
      .catch(() => {
        if (active) {
          setLiveResult({
            status: "no_feedback",
            symbol: scenario.symbol,
            reason: "Live Yahoo analysis is unavailable right now. The snapshot remains available for review.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [scenario.symbol]);

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
          Simulated trades over normalized Yahoo regular-hours snapshots from July 30,
          2026. They are not broker executions and do not update trader P/L.
        </Typography>
      </Stack>

      <Alert severity="info">
        The replay covers 9:30–11:00 AM ET with volume-aware five-minute display
        candles. One-minute coverage determines whether feedback is allowed. The first
        30 minutes after exit are primary; the next 30 minutes add context.
      </Alert>

      {liveResult ? (
        <Alert severity={liveResult.status === "ready" ? "success" : "info"}>
          {liveResult.status === "ready" ? (
            <Stack spacing={0.5}>
              <Typography sx={{ fontWeight: 700 }} variant="body2">
                Current Yahoo result for {liveResult.symbol}
              </Typography>
              <Typography variant="body2">{liveResult.results.exitTiming.title}</Typography>
              <Typography variant="body2">{liveResult.results.exitTiming.detail}</Typography>
            </Stack>
          ) : (
            `No live feedback for ${liveResult.symbol}: ${liveResult.reason}`
          )}
        </Alert>
      ) : null}

      {liveResult?.status === "ready" && liveResult.patternObservations.length > 0 ? (
        <DashboardPanel title="Execution context">
          <Stack spacing={1}>
            {liveResult.patternObservations.map((observation) => (
              <Typography key={`${observation.zone}-${observation.kind}-${observation.time}`} variant="body2">
                {observation.zone === "held_peak" ? "Near the held-position peak" : `Near ${observation.zone}`}: {observation.kind.replaceAll("_", " ")} at {formatEasternTime(observation.time)}.
              </Typography>
            ))}
          </Stack>
        </DashboardPanel>
      ) : null}

      <DashboardPanel
        action={
          <Stack direction="row" spacing={0.75}>
            <Chip label="5-minute replay" size="small" variant="outlined" />
            <Chip label="Simulated long" size="small" variant="outlined" />
          </Stack>
        }
        title="Candle replay"
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} sx={{ mb: 2 }}>
          {SIMULATION_CASES.map((item) => (
            <Chip
              color={item.id === scenario.id ? "primary" : "default"}
              key={item.id}
              label={`${item.symbol} · ${item.title}`}
              onClick={() => setSelectedScenarioId(item.id)}
              size="small"
              variant={item.id === scenario.id ? "filled" : "outlined"}
            />
          ))}
        </Stack>
        <TradeCandleChart scenario={displayedScenario} />
        <Stack
          direction={{ xs: "column", md: "row" }}
          divider={<Divider flexItem orientation="vertical" />}
          spacing={2}
          sx={{ mt: 2 }}
        >
          <Observation label="Simulated entry">
            {displayedScenario.entryTime} · {formatPrice(displayedScenario.entryPrice)}
          </Observation>
          <Observation label="Simulated exit">
            {displayedScenario.exitTime && displayedScenario.exitPrice
              ? `${displayedScenario.exitTime} · ${formatPrice(displayedScenario.exitPrice)}`
              : "No qualifying exit"}
          </Observation>
          <Observation label="Primary review">First 30 minutes after exit</Observation>
          <Observation label="Volume context">
            {liveResult?.status === "ready"
              ? "Live Yahoo active-volume coverage"
              : scenario.volumeLabel}
          </Observation>
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
              {liveFindings
                ? liveFindings.profitGiveback.title
                : hasExitContinuation
                ? `The simulated exit retained a gain from the ${formatPrice(scenario.entryPrice)} entry.`
                : "No qualifying profitable early-exit simulation was found."}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {liveFindings
                ? liveFindings.profitGiveback.detail
                : hasExitContinuation
                ? "This demonstrates an exit path, not a broker-fill reconstruction. A live profit-giveback result needs complete held-position candles."
                : scenario.noFeedbackReason}
            </Typography>
            <Chip
              label={liveFindings?.profitGiveback.title ?? (hasExitContinuation ? "Simulated gain retained" : "No feedback")}
              size="small"
              variant="outlined"
            />
          </Stack>
        </DashboardPanel>

        <DashboardPanel title="Exit timing">
          <Stack spacing={1.25}>
            <Typography sx={{ fontWeight: 700 }}>
              {liveFindings
                ? liveFindings.exitTiming.title
                : hasExitContinuation
                ? "Price continued higher after the simulated exit."
                : "No missed-profit conclusion."}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {liveFindings
                ? liveFindings.exitTiming.detail
                : hasExitContinuation && scenario.exitPrice && scenario.primaryHigh
                ? `The observed high reached ${formatPrice(scenario.primaryHigh.price)} at ${scenario.primaryHigh.time}, within 30 minutes of the ${formatPrice(scenario.exitPrice)} simulated exit.`
                : scenario.noFeedbackReason}
            </Typography>
            <Chip
              color={liveFindings?.exitTiming.title.includes("continued") || hasExitContinuation ? "info" : "default"}
              label={liveFindings?.exitTiming.title ?? (hasExitContinuation ? "Primary window complete" : "No feedback")}
              size="small"
              variant="outlined"
            />
          </Stack>
        </DashboardPanel>

        <DashboardPanel title="Entry timing">
          <Stack spacing={1.25}>
            <Typography sx={{ fontWeight: 700 }}>
              {liveFindings
                ? liveFindings.entryTiming.title
                : hasExitContinuation
                ? `The simulation begins at the observed ${formatPrice(scenario.entryPrice)} open.`
                : "No alternate entry is inferred."}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {liveFindings
                ? liveFindings.entryTiming.detail
                : "Entry timing stays separate from the exit example. The live analyzer will report only what complete pre- and post-entry candle windows support."}
            </Typography>
            <Chip label={liveFindings?.entryTiming.title ?? "Evidence-gated"} size="small" variant="outlined" />
          </Stack>
        </DashboardPanel>
      </Box>
    </DashboardPage>
  );
}
