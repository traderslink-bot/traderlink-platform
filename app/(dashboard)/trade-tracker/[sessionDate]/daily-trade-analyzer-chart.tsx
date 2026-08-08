"use client";

import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import Decimal from "decimal.js";
import {
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";

import { calculateIndicatorPoints } from "@/src/lib/trade-candle-analysis/indicator-context";
import { detectMicroCapCandlePatterns } from "@/src/lib/trade-candle-analysis/pattern-detection";

import { TradeAnalyzerAnnotationPrimitive } from "./trade-analyzer-annotation-primitive";

import type { DaySessionTradeAnalyzer } from "./day-session-types";

type ChartInterval = "1m" | "5m" | "15m" | "1h";

type ChartCandle = DaySessionTradeAnalyzer["candles"][number];
type ChartPattern = Readonly<{ kind: string; time: number }>;

const CHART_INTERVAL_SECONDS: Readonly<Record<ChartInterval, number>> = Object.freeze({
  "1m": 60,
  "5m": 5 * 60,
  "15m": 15 * 60,
  "1h": 60 * 60,
});

const CHART_INTERVALS = Object.freeze(["1m", "5m", "15m", "1h"] as const);

function chartBucketTime(time: number, interval: ChartInterval): number {
  const seconds = CHART_INTERVAL_SECONDS[interval];
  return Math.floor(time / seconds) * seconds;
}

function aggregateChartCandles(
  candles: readonly ChartCandle[],
  interval: ChartInterval,
): readonly ChartCandle[] {
  if (interval === "1m") return candles;
  const buckets = new Map<number, {
    close: string;
    high: string;
    low: string;
    open: string;
    time: number;
    turnover: Decimal | null;
    volume: Decimal;
  }>();
  for (const candle of candles) {
    const time = chartBucketTime(candle.time, interval);
    const current = buckets.get(time);
    if (!current) {
      buckets.set(time, {
        close: candle.close,
        high: candle.high,
        low: candle.low,
        open: candle.open,
        time,
        turnover: candle.turnover === null ? null : new Decimal(candle.turnover),
        volume: new Decimal(candle.volume),
      });
      continue;
    }
    current.close = candle.close;
    if (new Decimal(candle.high).greaterThan(current.high)) current.high = candle.high;
    if (new Decimal(candle.low).lessThan(current.low)) current.low = candle.low;
    current.volume = current.volume.plus(candle.volume);
    current.turnover = current.turnover === null || candle.turnover === null
      ? null
      : current.turnover.plus(candle.turnover);
  }
  return Object.freeze([...buckets.values()].map((candle) => Object.freeze({
    close: candle.close,
    high: candle.high,
    low: candle.low,
    open: candle.open,
    time: candle.time,
    turnover: candle.turnover?.toFixed() ?? null,
    volume: candle.volume.toFixed(),
  })));
}

function patternsForChartInterval(
  analysis: DaySessionTradeAnalyzer,
  interval: ChartInterval,
): readonly ChartPattern[] {
  if (interval === "1m") {
    return analysis.events.flatMap((event) => event.patterns);
  }
  const executionBuckets = new Set(analysis.events.flatMap((event) =>
    event.candleTime === null ? [] : [chartBucketTime(event.candleTime, interval)],
  ));
  const sourceCountByBucket = new Map<number, number>();
  for (const candle of analysis.candles) {
    const bucket = chartBucketTime(candle.time, interval);
    sourceCountByBucket.set(bucket, (sourceCountByBucket.get(bucket) ?? 0) + 1);
  }
  const requiredSourceCount = CHART_INTERVAL_SECONDS[interval] / CHART_INTERVAL_SECONDS["1m"];
  const intervalCandles = aggregateChartCandles(analysis.candles, interval).filter((candle) =>
    sourceCountByBucket.get(candle.time) === requiredSourceCount,
  ).map((candle) => ({
    close: Number(candle.close),
    high: Number(candle.high),
    low: Number(candle.low),
    open: Number(candle.open),
    time: candle.time,
    turnover: candle.turnover === null ? null : Number(candle.turnover),
    volume: Number(candle.volume),
  }));
  const continuousRuns = intervalCandles.reduce<Array<typeof intervalCandles>>((runs, candle) => {
    const current = runs.at(-1);
    const previous = current?.at(-1);
    if (!previous || candle.time === previous.time + CHART_INTERVAL_SECONDS[interval]) {
      if (current) current.push(candle);
      else runs.push([candle]);
    } else {
      runs.push([candle]);
    }
    return runs;
  }, []);
  return continuousRuns.flatMap((candles) => detectMicroCapCandlePatterns(candles)).filter((pattern) =>
    executionBuckets.has(pattern.time),
  );
}

function initialVisibleSpan(
  interval: ChartInterval,
  candleCount: number,
  width: number,
): number {
  const bounds: Readonly<Record<ChartInterval, Readonly<{
    maximum: number;
    minimum: number;
    pixelsPerBar: number;
  }>>> = {
    "1m": { maximum: 240, minimum: 90, pixelsPerBar: 5 },
    "5m": { maximum: 96, minimum: 48, pixelsPerBar: 8 },
    "15m": { maximum: 48, minimum: 24, pixelsPerBar: 12 },
    "1h": { maximum: 24, minimum: 12, pixelsPerBar: 16 },
  };
  const selected = bounds[interval];
  return Math.min(
    candleCount,
    Math.max(selected.minimum, Math.min(selected.maximum, Math.round(width / selected.pixelsPerBar))),
  );
}

function easternTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  }).format(new Date(timestamp * 1000));
}

function eventLabel(kind: DaySessionTradeAnalyzer["events"][number]["kind"]): string {
  if (kind === "entry") return "Entry";
  if (kind === "add") return "Add";
  if (kind === "partial_exit") return "Partial exit";
  return "Final exit";
}

const PATTERN_EXPLANATIONS: Readonly<Record<string, string>> = {
  compression: "Range and volume contracted materially inside the preceding candle.",
  compression_break_bearish: "Price closed decisively below a confirmed compressed range on increased activity.",
  compression_break_bullish: "Price closed decisively above a confirmed compressed range on increased activity.",
  engulfing_bearish: "A meaningful bearish body fully engulfed the preceding bullish body.",
  engulfing_bullish: "A meaningful bullish body fully engulfed the preceding bearish body.",
  expansion_bearish: "The candle's range and body expanded materially and closed near its low.",
  expansion_bullish: "The candle's range and body expanded materially and closed near its high.",
  hammer_bullish: "After a meaningful decline, a dominant lower wick rejected a local low and the next candle confirmed recovery.",
  high_volume_exhaustion: "An extended move stalled at a local extreme on exceptional volume, then the following candle confirmed the failure.",
  rejection_lower: "Price tested a local low, left a dominant lower wick, and closed back in the candle's upper portion.",
  rejection_upper: "Price tested a local high, left a dominant upper wick, and closed back in the candle's lower portion.",
  shooting_star_bearish: "After a meaningful advance, a dominant upper wick rejected a local high and the next candle confirmed weakness.",
};
const PATTERN_FULL_NAMES: Readonly<Record<string, string>> = {
  compression: "Compression",
  compression_break_bearish: "Bearish compression break",
  compression_break_bullish: "Bullish compression break",
  engulfing_bearish: "Bearish engulfing shift",
  engulfing_bullish: "Bullish engulfing shift",
  expansion_bearish: "Bearish expansion",
  expansion_bullish: "Bullish expansion",
  hammer_bullish: "Confirmed Hammer",
  high_volume_exhaustion: "Possible high-volume exhaustion",
  rejection_lower: "Lower-wick rejection",
  rejection_upper: "Upper-wick rejection",
  shooting_star_bearish: "Confirmed Shooting Star",
};

function patternLabel(kind: string): string {
  const labels: Readonly<Record<string, string>> = {
    compression: "Compress",
    compression_break_bearish: "Bear Break",
    compression_break_bullish: "Bull Break",
    engulfing_bearish: "Bear Engulf",
    engulfing_bullish: "Bull Engulf",
    expansion_bearish: "Bear Exp",
    expansion_bullish: "Bull Exp",
    hammer_bullish: "Hammer",
    high_volume_exhaustion: "Poss Exhaust",
    rejection_lower: "Low Reject",
    rejection_upper: "Upper Reject",
    shooting_star_bearish: "Shoot Star",
  };
  return labels[kind] ?? kind.replaceAll("_", " ");
}

function patternColor(kind: string): string {
  const colors: Readonly<Record<string, string>> = {
    compression: "#455a64",
    compression_break_bearish: "#d84315",
    compression_break_bullish: "#0277bd",
    engulfing_bearish: "#ad1457",
    engulfing_bullish: "#00897b",
    expansion_bearish: "#c62828",
    expansion_bullish: "#2e7d32",
    hammer_bullish: "#1565c0",
    high_volume_exhaustion: "#7b1fa2",
    rejection_lower: "#6a1b9a",
    rejection_upper: "#ef6c00",
    shooting_star_bearish: "#c62828",
  };
  return colors[kind] ?? "#455a64";
}

function patternPosition(kind: string): "aboveBar" | "belowBar" {
  return kind.includes("bullish") || kind === "rejection_lower" ? "belowBar" : "aboveBar";
}

function formatPrice(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatVolume(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

function formatTurnover(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency",
  }).format(value);
}

type ChartDetail = Readonly<{
  candle: ChartCandle;
  event: DaySessionTradeAnalyzer["events"][number] | null;
  priceAction: Readonly<{ explanation: string; title: string }> | null;
}>;

export function DailyTradeAnalyzerChart({
  analysis,
  currency,
  direction,
  selectedEventId,
  symbol,
  tradeNumber,
}: {
  analysis: DaySessionTradeAnalyzer;
  currency: string;
  direction: "long" | "short";
  selectedEventId: string | null;
  symbol: string;
  tradeNumber: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const annotationPrimitiveRef = useRef<TradeAnalyzerAnnotationPrimitive | null>(null);
  const eventCandleIndexesRef = useRef<Map<string, number>>(new Map());
  const selectedEventIdRef = useRef(selectedEventId);
  const pinnedDetailRef = useRef(false);
  const [detail, setDetail] = useState<ChartDetail | null>(null);
  const [chartInterval, setChartInterval] = useState<ChartInterval>("1m");

  const [mobilePatternKeyOpen, setMobilePatternKeyOpen] = useState(false);
  const chartPatterns = useMemo(
    () => patternsForChartInterval(analysis, chartInterval),
    [analysis, chartInterval],
  );
  const visiblePatternKinds = [...new Set(chartPatterns.map((pattern) => pattern.kind))];
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !["pending", "ready", "provider_unavailable"].includes(analysis.status) || analysis.candles.length === 0) return;
    pinnedDetailRef.current = false;
    const clearDetailTimer = window.setTimeout(() => setDetail(null), 0);
    const displayedCandles = aggregateChartCandles(analysis.candles, chartInterval);
    const numericCandles = displayedCandles.map((candle) => ({
      close: Number(candle.close),
      high: Number(candle.high),
      low: Number(candle.low),
      open: Number(candle.open),
      time: candle.time,
      turnover: candle.turnover === null ? null : Number(candle.turnover),
      volume: Number(candle.volume),
    }));
    const candleByTime = new Map(displayedCandles.map((candle) => [candle.time, candle]));
    const chart = createChart(container, {
      autoSize: true,
      height: 420,
      layout: { background: { color: "#f8fbff" }, textColor: "#172033" },
      rightPriceScale: { borderColor: "#dce5f0" },
      timeScale: {
        borderColor: "#dce5f0",
        tickMarkFormatter: (time: Time) => typeof time === "number" ? easternTime(time) : "",
        timeVisible: true,
      },
      localization: {
        timeFormatter: (time: Time) => typeof time === "number" ? easternTime(time) : "",
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
    candles.setData(numericCandles.map((candle) => ({
      close: candle.close,
      high: candle.high,
      low: candle.low,
      open: candle.open,
      time: candle.time as Time,
    })));

    const hasExactTurnover = numericCandles.every((candle) => candle.turnover !== null);
    const indicators = calculateIndicatorPoints(
      numericCandles,
      { vwapSource: hasExactTurnover ? "turnover" : "typical_price" },
    );
    const vwap = chart.addSeries(LineSeries, {
      color: "#7b1fa2",
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      lineWidth: 2,
      priceLineVisible: false,
      title: "Session VWAP",
    });
    vwap.setData(indicators.flatMap((point) =>
      point.vwap === null ? [] : [{ time: point.time as Time, value: point.vwap }],
    ));
    const ema9 = chart.addSeries(LineSeries, {
      color: "#ef6c00",
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      lineWidth: 2,
      priceLineVisible: false,
      title: `${chartInterval} EMA 9`,
    });
    ema9.setData(indicators.flatMap((point) =>
      point.ema9 === null ? [] : [{ time: point.time as Time, value: point.ema9 }],
    ));

    const volume = chart.addSeries(HistogramSeries, {
      color: "rgba(1, 30, 86, 0.30)",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    }, 1);
    volume.setData(displayedCandles.map((candle) => ({
      time: candle.time as Time,
      value: Number(candle.volume),
    })));
    chart.panes()[1]?.setHeight(92);

    const sideSequence = { BUY: 0, SELL: 0 };
    const executionModels = analysis.events.flatMap((event) => {
      if (event.candleTime === null || !Number.isFinite(Number(event.price))) return [];
      const openingAction = event.kind === "entry" || event.kind === "add";
      const side = direction === "long" ? (openingAction ? "BUY" : "SELL") : (openingAction ? "SELL" : "BUY");
      sideSequence[side] += 1;
      const sequence = sideSequence[side];
      return [{
        color: side === "BUY" ? "#087443" : "#b42318",
        event,
        label: `${side} ${sequence}`,
        side,
        time: chartBucketTime(event.candleTime, chartInterval),
      }];
    });

    const seenPatterns = new Set<string>();
    const patternModels = chartPatterns.flatMap((pattern) => {
        const key = `${pattern.time}:${pattern.kind}`;
        const candle = candleByTime.get(pattern.time);
        if (seenPatterns.has(key) || !candle) return [];
        seenPatterns.add(key);
        return [{
          candle,
          color: patternColor(pattern.kind),
          kind: pattern.kind,
          label: patternLabel(pattern.kind),
          position: patternPosition(pattern.kind),
          time: pattern.time,
        }];
      });
    const annotationDetails = new Map<string, ChartDetail>();
    const executionAnnotations = executionModels.flatMap((model) => {
      const candle = candleByTime.get(model.time) ?? null;
      if (!candle) return [];
      const id = `execution-${model.event.eventId}`;
      annotationDetails.set(id, { candle, event: model.event, priceAction: null });
      return [{
        color: model.color,
        id,
        kind: "execution" as const,
        label: model.label,
        preferredPosition: model.side === "BUY" ? "above" as const : "below" as const,
        price: Number(model.event.price),
        time: model.time,
      }];
    });
    const patternAnnotations = patternModels.map((model, index) => {
      const id = `pattern-${index}`;
      annotationDetails.set(id, {
        candle: model.candle,
        event: null,
        priceAction: {
          explanation: PATTERN_EXPLANATIONS[model.kind] ?? "Observed price action at this candle.",
          title: PATTERN_FULL_NAMES[model.kind] ?? patternLabel(model.kind),
        },
      });
      return {
        color: model.color,
        id,
        kind: "pattern" as const,
        label: model.label,
        preferredPosition: model.position === "aboveBar" ? "above" as const : "below" as const,
        price: model.position === "aboveBar" ? Number(model.candle.high) : Number(model.candle.low),
        time: model.time,
      };
    });
    const annotationPrimitive = new TradeAnalyzerAnnotationPrimitive([
      ...executionAnnotations,
      ...patternAnnotations,
    ]);
    candles.attachPrimitive(annotationPrimitive);
    annotationPrimitive.setSelectedId(selectedEventIdRef.current ? `execution-${selectedEventIdRef.current}` : null);
    chartRef.current = chart;
    annotationPrimitiveRef.current = annotationPrimitive;

    function detailFromEvent(param: MouseEventParams<Time>): ChartDetail | null {
      const objectId = typeof param.hoveredInfo?.objectId === "string"
        ? param.hoveredInfo.objectId
        : null;
      const annotationDetail = objectId ? annotationDetails.get(objectId) ?? null : null;
      if (annotationDetail) return annotationDetail;
      if (typeof param.time !== "number") return null;
      const candle = candleByTime.get(param.time);
      if (!candle) return null;
      const candleEvent = analysis.events.find((event) =>
        event.candleTime !== null && chartBucketTime(event.candleTime, chartInterval) === param.time) ?? null;
      return { candle, event: candleEvent, priceAction: null };
    }
    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!pinnedDetailRef.current) setDetail(detailFromEvent(param));
    };
    const handleClick = (param: MouseEventParams<Time>) => {
      pinnedDetailRef.current = false;
      setDetail(detailFromEvent(param));
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);
    chart.subscribeClick(handleClick);
    chart.timeScale().fitContent();
    const candleIndexByTime = new Map(numericCandles.map((candle, index) => [candle.time, index] as const));
    eventCandleIndexesRef.current = new Map(analysis.events.flatMap((event) => {
      const index = event.candleTime === null
        ? undefined
        : candleIndexByTime.get(chartBucketTime(event.candleTime, chartInterval));
      return index === undefined ? [] : [[event.eventId, index] as const];
    }));
    const executionIndexes = analysis.events.flatMap((event) => {
      const index = event.candleTime === null
        ? undefined
        : candleIndexByTime.get(chartBucketTime(event.candleTime, chartInterval));
      return index === undefined ? [] : [index];
    });
    if (numericCandles.length > 1 && executionIndexes.length > 0) {
      const firstExecutionIndex = Math.min(...executionIndexes);
      const visibleSpan = initialVisibleSpan(
        chartInterval,
        numericCandles.length,
        container.clientWidth,
      );
      if (visibleSpan < numericCandles.length) {
        const maximumFrom = numericCandles.length - visibleSpan;
        const from = Math.max(
          0,
          Math.min(maximumFrom, firstExecutionIndex - Math.floor(visibleSpan * 0.25)),
        );
        chart.timeScale().setVisibleLogicalRange({ from, to: from + visibleSpan - 1 });
      }
    }
    return () => {
      window.clearTimeout(clearDetailTimer);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.unsubscribeClick(handleClick);
      candles.detachPrimitive(annotationPrimitive);
      chartRef.current = null;
      annotationPrimitiveRef.current = null;
      eventCandleIndexesRef.current = new Map();
      chart.remove();
    };
  }, [analysis, chartInterval, chartPatterns, currency, direction]);

  useEffect(() => {
    selectedEventIdRef.current = selectedEventId;
    const chart = chartRef.current;
    const primitive = annotationPrimitiveRef.current;
    if (!chart || !primitive) return;
    primitive.setSelectedId(selectedEventId ? `execution-${selectedEventId}` : null);
    if (!selectedEventId) return;
    const eventIndex = eventCandleIndexesRef.current.get(selectedEventId);
    const visibleRange = chart.timeScale().getVisibleLogicalRange();
    if (eventIndex === undefined || !visibleRange) return;
    const span = Math.max(30, visibleRange.to - visibleRange.from);
    chart.timeScale().setVisibleLogicalRange({
      from: eventIndex - span * 0.35,
      to: eventIndex + span * 0.65,
    });
  }, [selectedEventId]);

  return (
    <Box sx={{ bgcolor: "#f8fbff", borderBottom: 1, borderColor: "divider", position: "relative" }}>
      <Stack
        direction="row"
        spacing={{ xs: 0.75, md: 1.5 }}
        sx={{ alignItems: "center", left: 14, pointerEvents: "none", position: "absolute", top: 10, zIndex: 8 }}
      >
        <Typography
          sx={{ bgcolor: "#011e56", borderRadius: 1, color: "#fff", fontWeight: 900, px: 1.25, py: 0.5 }}
          variant="h6"
        >
          {symbol}
        </Typography>
        <Typography sx={{ display: { xs: "none", sm: "block" }, fontWeight: 800 }} variant="body2">
          Trade {tradeNumber}
        </Typography>
        <ToggleButtonGroup
          aria-label="Chart timeframe"
          exclusive
          onChange={(_event, value: ChartInterval | null) => {
            if (value) setChartInterval(value);
          }}
          size="small"
          sx={{
            bgcolor: "rgba(255,255,255,0.96)",
            height: 28,
            pointerEvents: "auto",
            "& .MuiToggleButton-root": {
              borderColor: "#b8c6d9",
              color: "#41516a",
              fontSize: "0.66rem",
              fontWeight: 850,
              minWidth: 34,
              px: 0.65,
              py: 0.25,
            },
            "& .Mui-selected": {
              bgcolor: "#011e56 !important",
              color: "#fff !important",
            },
          }}
          value={chartInterval}
        >
          {CHART_INTERVALS.map((interval) => (
            <ToggleButton key={interval} value={interval}>{interval}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography sx={{ color: "#41516a", fontSize: "0.66rem", fontWeight: 800 }}>
          Analysis: 1m
        </Typography>
        <Typography sx={{ color: "#7b1fa2", display: { xs: "none", md: "block" }, fontWeight: 800 }} variant="caption">
          - Session VWAP
        </Typography>
        <Typography sx={{ color: "#ef6c00", display: { xs: "none", md: "block" }, fontWeight: 800 }} variant="caption">
          - {chartInterval} EMA 9
        </Typography>
      </Stack>
      {visiblePatternKinds.length > 0 ? (
        <>
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "rgba(255,255,255,0.94)",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              display: { xs: "none", md: "flex" },
              flexWrap: "wrap",
              gap: 0.75,
              maxWidth: 520,
              p: 0.75,
              position: "absolute",
              right: 12,
              top: 10,
              zIndex: 3,
            }}
          >
            {visiblePatternKinds.map((kind) => (
              <Stack direction="row" key={kind} spacing={0.45} sx={{ alignItems: "center" }}>
                <Box sx={{ bgcolor: patternColor(kind), borderRadius: "50%", height: 8, width: 8 }} />
                <Typography sx={{ fontSize: "0.66rem", fontWeight: 750, whiteSpace: "nowrap" }}>
                  {PATTERN_FULL_NAMES[kind] ?? patternLabel(kind)}
                </Typography>
              </Stack>
            ))}
          </Box>
          <Box
            component="button"
            onClick={() => setMobilePatternKeyOpen((open) => !open)}
            sx={{
              bgcolor: "rgba(255,255,255,0.96)",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              display: { xs: "block", md: "none" },
              fontSize: "0.68rem",
              fontWeight: 850,
              p: 0.6,
              position: "absolute",
              right: 8,
              top: 52,
              zIndex: 5,
            }}
            type="button"
          >
            Price action key
          </Box>
          {mobilePatternKeyOpen ? (
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.98)",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                display: { xs: "block", md: "none" },
                left: 8,
                p: 1,
                position: "absolute",
                right: 8,
                top: 84,
                zIndex: 6,
              }}
            >
              <Stack spacing={0.65}>
                {visiblePatternKinds.map((kind) => (
                  <Stack direction="row" key={kind} spacing={0.65} sx={{ alignItems: "center" }}>
                    <Box sx={{ bgcolor: patternColor(kind), borderRadius: "50%", height: 9, width: 9 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 750 }}>
                      {PATTERN_FULL_NAMES[kind] ?? patternLabel(kind)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ) : null}
        </>
      ) : null}
      {detail ? (
        <Box
          sx={{
            bgcolor: "rgba(255,255,255,0.96)",
            border: 1,
            borderColor: "divider",
            borderRadius: 1.25,
            boxShadow: "0 4px 16px rgba(1,30,86,0.12)",
            maxWidth: 310,
            p: 1.25,
            pointerEvents: "none",
            position: "absolute",
            right: 64,
            top: { xs: 92, md: 86 },
            zIndex: 5,
          }}
        >
          <Typography sx={{ fontWeight: 850 }} variant="caption">
            {detail.event
              ? easternTime(Math.floor(Date.parse(detail.event.executedAt) / 1000))
              : easternTime(detail.candle.time)} ET
            {detail.event ? " execution" : ` · ${chartInterval} candle`}
          </Typography>
          <Typography color="text.secondary" sx={{ display: "block" }} variant="caption">
            O {formatPrice(Number(detail.candle.open), currency)} | H {formatPrice(Number(detail.candle.high), currency)} | L {formatPrice(Number(detail.candle.low), currency)} | C {formatPrice(Number(detail.candle.close), currency)}
          </Typography>
          <Typography color="text.secondary" sx={{ display: "block" }} variant="caption">
            Volume {formatVolume(Number(detail.candle.volume))}
          </Typography>
          {detail.candle.turnover === null ? null : (
            <Typography color="text.secondary" sx={{ display: "block" }} variant="caption">
              Candle turnover {formatTurnover(Number(detail.candle.turnover))}
            </Typography>
          )}
          {detail.priceAction ? (
            <>
              <Typography sx={{ display: "block", fontWeight: 850, mt: 0.5 }} variant="caption">
                {detail.priceAction.title}
              </Typography>
              <Typography color="text.secondary" sx={{ display: "block" }} variant="caption">
                {detail.priceAction.explanation}
              </Typography>
            </>
          ) : null}
          {detail.event ? (
            <Typography sx={{ display: "block", fontWeight: 850, mt: 0.5 }} variant="caption">
              {eventLabel(detail.event.kind)}: {detail.event.quantity} shares at {formatPrice(Number(detail.event.price), currency)}
            </Typography>
          ) : null}
        </Box>
      ) : null}
      <Box ref={containerRef} sx={{ height: 420, width: "100%" }} />
    </Box>
  );
}
