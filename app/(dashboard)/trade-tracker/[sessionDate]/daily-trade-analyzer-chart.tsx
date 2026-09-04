"use client";

import {
  Box,
  Button,
  Checkbox,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
import {
  candlePatternName,
  candlePatternShortName,
} from "@/src/lib/trade-candle-analysis/pattern-presentation";

import { TradeAnalyzerAnnotationPrimitive, type TradeAnalyzerAnnotationAppearance } from "./trade-analyzer-annotation-primitive";

import type { DaySessionTradeAnalyzer } from "./day-session-types";

export type DailyTradeChartInterval = "1m" | "5m" | "15m" | "1h";
type ChartRangeMode = "all_candles" | "around_trade";
type ChartLayer = "candlePatterns" | "ema" | "executions" | "rules" | "volume" | "vwap";
type ChartLayerVisibility = Readonly<Record<ChartLayer, boolean>>;

type ChartCandle = DaySessionTradeAnalyzer["candles"][number];
type ChartPattern = Readonly<{ kind: string; time: number }>;
type ChartSemanticColors = Readonly<{
  buy: string;
  ema: string;
  rule: string;
  sell: string;
  volume: string;
  vwap: string;
}>;
type PatternColorMap = Readonly<Record<string, string>>;

const DARK_ANALYZER_LIGHT_CHART_THEME = Object.freeze({
  actionHover: "#0b3475",
  background: "#ffffff",
  candleLoss: "#d14343",
  candleWin: "#1b8a5a",
  controlBorder: "#b8c6d9",
  controlText: "#41516a",
  grid: "#dce5f0",
  text: "#172033",
});

const LIGHT_ANALYZER_ANNOTATION_APPEARANCE: TradeAnalyzerAnnotationAppearance = Object.freeze({
  executionFill: "#ffffff",
  patternOutline: "rgba(255,255,255,0.98)",
  ruleText: "#ffffff",
  selectedExecutionFill: "#fff7d6",
  selectionShadow: "rgba(1,30,86,0.28)",
});

const LIGHT_ANALYZER_SEMANTIC_COLORS: ChartSemanticColors = Object.freeze({
  buy: "#087443",
  ema: "#ef6c00",
  rule: "#9A6700",
  sell: "#b42318",
  volume: "rgba(1, 30, 86, 0.30)",
  vwap: "#7b1fa2",
});

const CHART_INTERVAL_SECONDS: Readonly<Record<DailyTradeChartInterval, number>> = Object.freeze({
  "1m": 60,
  "5m": 5 * 60,
  "15m": 15 * 60,
  "1h": 60 * 60,
});

const CHART_INTERVALS = Object.freeze(["1m", "5m", "15m", "1h"] as const);
const CHART_ZOOM_IN_FACTOR = 0.82;
const CHART_ZOOM_OUT_FACTOR = 1.22;
const DEFAULT_CHART_LAYERS: ChartLayerVisibility = Object.freeze({
  candlePatterns: true,
  ema: true,
  executions: true,
  rules: true,
  volume: true,
  vwap: true,
});

function zoomChartTimeScale(
  chart: IChartApi,
  factor: number,
  maximumSpan: number,
  anchorLogical?: number,
): void {
  const timeScale = chart.timeScale();
  const range = timeScale.getVisibleLogicalRange();
  if (!range) return;
  const currentSpan = Math.max(1, range.to - range.from);
  const anchor = anchorLogical ?? range.from + currentSpan / 2;
  const anchorRatio = Math.max(0, Math.min(1, (anchor - range.from) / currentSpan));
  const nextSpan = Math.max(12, Math.min(maximumSpan, currentSpan * factor));
  timeScale.setVisibleLogicalRange({
    from: anchor - nextSpan * anchorRatio,
    to: anchor + nextSpan * (1 - anchorRatio),
  });
}

function ChartZoomControls({
  actionColor,
  actionHoverColor,
  mobile,
  onZoomIn,
  onZoomOut,
}: {
  actionColor: string;
  actionHoverColor: string;
  mobile: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const buttonStyle = {
    bgcolor: actionColor,
    border: 1,
    borderColor: actionColor,
    borderRadius: 1,
    color: "#fff",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 900,
    height: mobile ? 44 : 32,
    lineHeight: 1,
    p: 0,
    touchAction: "manipulation",
    width: mobile ? 44 : 32,
    "&:hover": {
      bgcolor: actionHoverColor,
      borderColor: actionHoverColor,
    },
  } as const;
  return (
    <Stack
      aria-label="Chart zoom controls"
      direction="row"
      role="group"
      spacing={0.4}
      sx={mobile
        ? { bottom: 32, display: { xs: "flex", md: "none" }, position: "absolute", right: 72, zIndex: 7 }
        : { display: { xs: "none", md: "flex" }, pointerEvents: "auto" }}
    >
      <Box
        aria-label="Zoom chart out"
        component="button"
        onClick={onZoomOut}
        sx={buttonStyle}
        title="Zoom out"
        type="button"
      >
        {"\u2212"}
      </Box>
      <Box
        aria-label="Zoom chart in"
        component="button"
        onClick={onZoomIn}
        sx={buttonStyle}
        title="Zoom in"
        type="button"
      >
        +
      </Box>
    </Stack>
  );
}

function chartBucketTime(time: number, interval: DailyTradeChartInterval): number {
  const seconds = CHART_INTERVAL_SECONDS[interval];
  return Math.floor(time / seconds) * seconds;
}

function aggregateChartCandles(
  candles: readonly ChartCandle[],
  interval: DailyTradeChartInterval,
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
  interval: DailyTradeChartInterval,
): readonly ChartPattern[] {
  if (interval === "1h") return Object.freeze([]);
  return analysis.events.flatMap((event) => event.patterns)
    .filter((pattern) => pattern.timeframe === interval);
}

function initialVisibleSpan(
  interval: DailyTradeChartInterval,
  candleCount: number,
  fullscreen: boolean,
  width: number,
): number {
  const bounds: Readonly<Record<DailyTradeChartInterval, Readonly<{
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
  const pixelsPerBar = selected.pixelsPerBar * (fullscreen ? 2 : 1);
  return Math.min(
    candleCount,
    Math.max(selected.minimum, Math.min(selected.maximum, Math.round(width / pixelsPerBar))),
  );
}

function easternTime(timestamp: number, includeSeconds = false): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" as const } : {}),
    hour12: false,
    timeZone: "America/New_York",
  }).format(new Date(timestamp * 1000));
}

function eventLabel(kind: DaySessionTradeAnalyzer["events"][number]["kind"]): string {
  if (kind === "entry") return "Entry";
  if (kind === "add") return "Add";
  if (kind === "partial_exit") return "Partial exit";
  if (kind === "temporary_flat") return "Temporary flat";
  return "Final exit";
}

const PATTERN_EXPLANATIONS: Readonly<Record<string, string>> = {
  compression: "Range and volume contracted materially inside the preceding candle.",
  compression_break_bearish: "Price closed decisively below a confirmed compressed range on increased activity.",
  compression_break_bullish: "Price closed decisively above a confirmed compressed range on increased activity.",
  doji: "A meaningful-range candle closed with an exceptionally small body, showing temporary balance between buyers and sellers.",
  engulfing_bearish: "A meaningful bearish body fully engulfed the preceding bullish body.",
  engulfing_bullish: "A meaningful bullish body fully engulfed the preceding bearish body.",
  evening_star_bearish: "After an advance, a small middle body was followed by a meaningful bearish close through the first candle's midpoint.",
  expansion_bearish: "The candle's range and body expanded materially and closed near its low.",
  expansion_bullish: "The candle's range and body expanded materially and closed near its high.",
  hammer_bullish: "After a meaningful decline, a dominant lower wick rejected a local low and the next candle confirmed recovery.",
  harami_bearish: "After an advance, a smaller bearish body formed inside the preceding meaningful bullish body.",
  harami_bullish: "After a decline, a smaller bullish body formed inside the preceding meaningful bearish body.",
  high_volume_exhaustion: "An extended move stalled at a local extreme on exceptional volume, then the following candle confirmed the failure.",
  morning_star_bullish: "After a decline, a small middle body was followed by a meaningful bullish close through the first candle's midpoint.",
  rejection_lower: "Price tested a local low, left a dominant lower wick, and closed back in the candle's upper portion.",
  rejection_upper: "Price tested a local high, left a dominant upper wick, and closed back in the candle's lower portion.",
  shooting_star_bearish: "After a meaningful advance, a dominant upper wick rejected a local high and the next candle confirmed weakness.",
  three_black_crows_bearish: "After an advance, three meaningful bearish candles opened inside the prior body and closed progressively lower.",
  three_white_soldiers_bullish: "After a decline, three meaningful bullish candles opened inside the prior body and closed progressively higher.",
};
function patternLabel(kind: string): string {
  return candlePatternShortName(kind);
}

const LIGHT_PATTERN_COLORS: PatternColorMap = Object.freeze({
  compression: "#455a64",
  compression_break_bearish: "#d84315",
  compression_break_bullish: "#0277bd",
  doji: "#546e7a",
  engulfing_bearish: "#ad1457",
  engulfing_bullish: "#00897b",
  evening_star_bearish: "#8e24aa",
  expansion_bearish: "#c62828",
  expansion_bullish: "#2e7d32",
  hammer_bullish: "#1565c0",
  harami_bearish: "#c62828",
  harami_bullish: "#00897b",
  high_volume_exhaustion: "#7b1fa2",
  morning_star_bullish: "#1565c0",
  rejection_lower: "#6a1b9a",
  rejection_upper: "#ef6c00",
  shooting_star_bearish: "#c62828",
  three_black_crows_bearish: "#b71c1c",
  three_white_soldiers_bullish: "#1b5e20",
});

function patternColor(kind: string, colors: PatternColorMap): string {
  return colors[kind] ?? colors.compression!;
}

function patternPosition(kind: string): "aboveBar" | "belowBar" {
  return kind.includes("bullish") || kind === "rejection_lower" ? "belowBar" : "aboveBar";
}

function formatPrice(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    currency,
    currencyDisplay: "narrowSymbol",
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

function formatTurnover(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency",
  }).format(value);
}

type ChartDetail = Readonly<{
  candle: ChartCandle;
  event: DaySessionTradeAnalyzer["events"][number] | null;
  priceAction: Readonly<{ explanation: string; title: string }> | null;
  rules: readonly ChartRuleDetail[];
}>;

export type ChartRuleEvidence = Readonly<{
  label: string;
  netPnl: string | null;
  occurredAt: string;
  ruleId: string;
  triggerAt: string | null;
}>;
type ChartRuleDetail = ChartRuleEvidence & Readonly<{ violationCount: number }>;
const EMPTY_RULE_EVIDENCE: readonly ChartRuleEvidence[] = Object.freeze([]);

export function DailyTradeAnalyzerChart({
  analysis,
  currency,
  direction,
  interval,
  onIntervalChange,
  ruleEvidence = EMPTY_RULE_EVIDENCE,
  selectedEventId,
  symbol,
  tradeLabelColor,
  tradeNumber,
}: {
  analysis: DaySessionTradeAnalyzer;
  currency: string;
  direction: "long" | "short";
  interval: DailyTradeChartInterval;
  onIntervalChange: (interval: DailyTradeChartInterval) => void;
  ruleEvidence?: readonly ChartRuleEvidence[];
  selectedEventId: string | null;
  symbol: string;
  tradeLabelColor: "success" | "error";
  tradeNumber: number;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const chartTheme = theme.palette.mode === "dark"
    ? DARK_ANALYZER_LIGHT_CHART_THEME
    : theme.palette.traderLink.chart;
  const usesDarkChartControls = theme.palette.mode === "dark";
  const annotationAppearance = LIGHT_ANALYZER_ANNOTATION_APPEARANCE;
  const chartSemanticColors = LIGHT_ANALYZER_SEMANTIC_COLORS;
  const chartPatternColors = LIGHT_PATTERN_COLORS;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const chartCandleCountRef = useRef(0);
  const annotationPrimitiveRef = useRef<TradeAnalyzerAnnotationPrimitive | null>(null);
  const eventCandleIndexesRef = useRef<Map<string, number>>(new Map());
  const selectedEventIdRef = useRef(selectedEventId);
  const pinnedDetailRef = useRef(false);
  const dismissedDetailRef = useRef(false);
  const [detail, setDetail] = useState<ChartDetail | null>(null);
  const [displayMenuAnchor, setDisplayMenuAnchor] = useState<HTMLElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layers, setLayers] = useState<ChartLayerVisibility>(DEFAULT_CHART_LAYERS);
  const [rangeMode, setRangeMode] = useState<ChartRangeMode>("around_trade");
  const [rangeRevision, setRangeRevision] = useState(0);
  const chartInterval = interval;

  const [mobilePatternKeyOpen, setMobilePatternKeyOpen] = useState(false);
  const exactTurnoverAvailable = useMemo(
    () => analysis.candles.length > 0 && analysis.candles.every((candle) =>
      candle.turnover !== null && Number.isFinite(Number(candle.turnover)) && Number(candle.turnover) >= 0,
    ),
    [analysis.candles],
  );
  const chartPatterns = useMemo(
    () => patternsForChartInterval(analysis, chartInterval),
    [analysis, chartInterval],
  );
  const visiblePatternKinds = [...new Set(chartPatterns.map((pattern) => pattern.kind))];
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !["pending", "ready", "provider_unavailable"].includes(analysis.status) || analysis.candles.length === 0) return;
    pinnedDetailRef.current = false;
    dismissedDetailRef.current = false;
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
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: false,
        pinch: true,
      },
      handleScroll: {
        horzTouchDrag: true,
        mouseWheel: false,
        pressedMouseMove: true,
        vertTouchDrag: false,
      },
      height: 420,
      layout: { background: { color: chartTheme.background }, textColor: chartTheme.text },
      grid: theme.palette.mode === "dark" ? {
        horzLines: { visible: false },
        vertLines: { visible: false },
      } : undefined,
      rightPriceScale: { borderColor: chartTheme.grid },
      timeScale: {
        borderColor: chartTheme.grid,
        tickMarkFormatter: (time: Time) => typeof time === "number" ? easternTime(time) : "",
        timeVisible: true,
      },
      localization: {
        timeFormatter: (time: Time) => typeof time === "number" ? easternTime(time) : "",
      },
    });
    chartCandleCountRef.current = numericCandles.length;
    const handleWheelZoom = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const chartBounds = container.getBoundingClientRect();
      const anchor = chart.timeScale().coordinateToLogical(event.clientX - chartBounds.left);
      zoomChartTimeScale(
        chart,
        event.deltaY < 0 ? CHART_ZOOM_IN_FACTOR : CHART_ZOOM_OUT_FACTOR,
        Math.max(30, numericCandles.length + 20),
        anchor === null ? undefined : anchor,
      );
    };
    container.addEventListener("wheel", handleWheelZoom, { passive: false });
    const candles = chart.addSeries(CandlestickSeries, {
      downColor: chartTheme.candleLoss,
      borderDownColor: chartTheme.candleLoss,
      borderUpColor: chartTheme.candleWin,
      upColor: chartTheme.candleWin,
      wickDownColor: chartTheme.candleLoss,
      wickUpColor: chartTheme.candleWin,
    });
    candles.setData(numericCandles.map((candle) => ({
      close: candle.close,
      high: candle.high,
      low: candle.low,
      open: candle.open,
      time: candle.time as Time,
    })));

    const indicators = calculateIndicatorPoints(
      numericCandles,
      { vwapSource: "turnover" },
    );
    if (exactTurnoverAvailable && layers.vwap) {
      const vwap = chart.addSeries(LineSeries, {
        color: chartSemanticColors.vwap,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        lineWidth: 2,
        priceLineVisible: false,
        title: "Session VWAP",
      });
      vwap.setData(indicators.flatMap((point) =>
        point.vwap === null ? [] : [{ time: point.time as Time, value: point.vwap }],
      ));
    }
    if (layers.ema) {
      const ema9 = chart.addSeries(LineSeries, {
        color: chartSemanticColors.ema,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        lineWidth: 2,
        priceLineVisible: false,
        title: `${chartInterval} EMA 9`,
      });
      ema9.setData(indicators.flatMap((point) =>
        point.ema9 === null ? [] : [{ time: point.time as Time, value: point.ema9 }],
      ));
    }

    if (layers.volume) {
      const volume = chart.addSeries(HistogramSeries, {
        color: chartSemanticColors.volume,
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      }, 1);
      volume.setData(displayedCandles.map((candle) => ({
        time: candle.time as Time,
        value: Number(candle.volume),
      })));
      chart.panes()[1]?.setHeight(92);
    }

    const sideSequence = { BUY: 0, SELL: 0 };
    const executionModels = analysis.events.flatMap((event) => {
      if (event.candleTime === null || !Number.isFinite(Number(event.price))) return [];
      const openingAction = event.kind === "entry" || event.kind === "add";
      const side = direction === "long" ? (openingAction ? "BUY" : "SELL") : (openingAction ? "SELL" : "BUY");
      sideSequence[side] += 1;
      const sequence = sideSequence[side];
      return [{
        color: side === "BUY" ? chartSemanticColors.buy : chartSemanticColors.sell,
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
          color: patternColor(pattern.kind, chartPatternColors),
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
      annotationDetails.set(id, { candle, event: model.event, priceAction: null, rules: [] });
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
          title: candlePatternName(model.kind),
        },
        rules: [],
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
    const rulesByCandle = new Map<number, ChartRuleEvidence[]>();
    for (const rule of ruleEvidence) {
      const occurredAt = Date.parse(rule.occurredAt);
      if (!Number.isFinite(occurredAt)) continue;
      const time = chartBucketTime(Math.floor(occurredAt / 1000), chartInterval);
      rulesByCandle.set(time, [...(rulesByCandle.get(time) ?? []), rule]);
    }
    const ruleAnnotations = [...rulesByCandle.entries()].flatMap(([time, rules]) => {
      const candle = candleByTime.get(time);
      if (!candle) return [];
      const occurrencesByRule = new Map<string, ChartRuleEvidence[]>();
      for (const rule of rules) occurrencesByRule.set(rule.ruleId, [...(occurrencesByRule.get(rule.ruleId) ?? []), rule]);
      const groupedRules: ChartRuleDetail[] = [...occurrencesByRule.values()].map((occurrences) => ({
        ...occurrences[0]!,
        netPnl: occurrences.every((item) => item.netPnl !== null)
          ? Decimal.sum(...occurrences.map((item) => new Decimal(item.netPnl!))).toFixed()
          : null,
        violationCount: occurrences.length,
      }));
      const id = `rule-${time}`;
      annotationDetails.set(id, { candle, event: null, priceAction: null, rules: groupedRules });
      return [{
        color: chartSemanticColors.rule,
        id,
        kind: "rule" as const,
        label: groupedRules.length === 1 ? "1 RULE" : `${groupedRules.length} RULES`,
        preferredPosition: "above" as const,
        price: Number(candle.high),
        time,
      }];
    });
    const annotationPrimitive = new TradeAnalyzerAnnotationPrimitive([
      ...(layers.executions ? executionAnnotations : []),
      ...(layers.rules ? ruleAnnotations : []),
      ...(layers.candlePatterns ? patternAnnotations : []),
    ], annotationAppearance);
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
      const candleEvent = layers.executions
        ? analysis.events.find((event) =>
          event.candleTime !== null && chartBucketTime(event.candleTime, chartInterval) === param.time) ?? null
        : null;
      return { candle, event: candleEvent, priceAction: null, rules: [] };
    }
    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!pinnedDetailRef.current && !dismissedDetailRef.current) setDetail(detailFromEvent(param));
    };
    const handleClick = (param: MouseEventParams<Time>) => {
      dismissedDetailRef.current = false;
      const next = detailFromEvent(param);
      pinnedDetailRef.current = next !== null;
      setDetail(next);
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
    if (rangeMode === "around_trade" && numericCandles.length > 1 && executionIndexes.length > 0) {
      const firstExecutionIndex = Math.min(...executionIndexes);
      const visibleSpan = initialVisibleSpan(
        chartInterval,
        numericCandles.length,
        isFullscreen,
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
      container.removeEventListener("wheel", handleWheelZoom);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.unsubscribeClick(handleClick);
      candles.detachPrimitive(annotationPrimitive);
      chartRef.current = null;
      chartCandleCountRef.current = 0;
      annotationPrimitiveRef.current = null;
      eventCandleIndexesRef.current = new Map();
      chart.remove();
    };
  }, [analysis, annotationAppearance, chartInterval, chartPatternColors, chartPatterns, chartSemanticColors, chartTheme, currency, direction, exactTurnoverAvailable, isFullscreen, layers, rangeMode, rangeRevision, ruleEvidence]);

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

  const zoomFromControl = (factor: number) => {
    const chart = chartRef.current;
    if (!chart) return;
    zoomChartTimeScale(
      chart,
      factor,
      Math.max(30, chartCandleCountRef.current + 20),
    );
  };

  const toggleLayer = (layer: ChartLayer) => {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement === frameRef.current) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    if (frameRef.current?.requestFullscreen) {
      void frameRef.current.requestFullscreen().catch(() => undefined);
    }
  };

  const displayOptions: readonly Readonly<{
    available: boolean;
    layer: ChartLayer;
    label: string;
    unavailableReason?: string;
  }>[] = [
    { available: true, label: "Volume", layer: "volume" },
    {
      available: analysis.events.length > 0,
      label: "Executions",
      layer: "executions",
      unavailableReason: "No execution markers are available for this trade.",
    },
    {
      available: ruleEvidence.length > 0,
      label: "Rules",
      layer: "rules",
      unavailableReason: "No rule markers are available for this trade.",
    },
    {
      available: visiblePatternKinds.length > 0,
      label: "Candle patterns",
      layer: "candlePatterns",
      unavailableReason: "No candle patterns are available for this timeframe.",
    },
    {
      available: exactTurnoverAvailable,
      label: "VWAP",
      layer: "vwap",
      unavailableReason: "Complete turnover data is required for Session VWAP.",
    },
    { available: true, label: "EMA", layer: "ema" },
  ];

  return (
    <Box
      ref={frameRef}
      sx={{ bgcolor: chartTheme.background, borderBottom: 1, borderColor: chartTheme.controlBorder, color: chartTheme.text, height: isFullscreen ? "100dvh" : undefined, overflow: "hidden" }}
    >
      <Box sx={{ position: "relative" }}>
      <Stack
        direction="row"
        spacing={{ xs: 0.75, md: 1.5 }}
        sx={{ alignItems: "center", left: 14, pointerEvents: "none", position: "absolute", top: 10, zIndex: 8 }}
      >
        <Typography
          sx={{ bgcolor: "primary.main", borderRadius: 1, color: "primary.contrastText", fontWeight: 900, px: 1.25, py: 0.5 }}
          variant="h6"
        >
          {symbol}
        </Typography>
        <Typography
          sx={{
            bgcolor: tradeLabelColor === "success" ? "success.main" : "error.main",
            borderRadius: 1,
            color: tradeLabelColor === "success" ? "success.contrastText" : "error.contrastText",
            display: { xs: "none", sm: "block" },
            fontWeight: 850,
            px: 0.75,
            py: 0.35,
          }}
          variant="body2"
        >
          Trade {tradeNumber}
        </Typography>
        <ToggleButtonGroup
          aria-label="Chart timeframe"
          exclusive
          onChange={(_event, value: DailyTradeChartInterval | null) => {
            if (value) onIntervalChange(value);
          }}
          size="small"
          sx={{
            bgcolor: usesDarkChartControls ? theme.palette.secondary.main : "rgba(255,255,255,0.96)",
            border: usesDarkChartControls ? 1 : 0,
            borderColor: usesDarkChartControls ? theme.palette.secondary.main : undefined,
            height: { xs: 44, md: 28 },
            pointerEvents: "auto",
            "& .MuiToggleButton-root": {
              borderColor: usesDarkChartControls ? theme.palette.secondary.main : chartTheme.controlBorder,
              color: usesDarkChartControls ? theme.palette.text.primary : chartTheme.controlText,
              fontSize: { xs: 12, md: "0.66rem" },
              fontWeight: 850,
              minWidth: { xs: 40, md: 34 },
              px: 0.65,
              py: 0.25,
              "&:hover": usesDarkChartControls ? {
                bgcolor: theme.palette.action.hover,
                borderColor: theme.palette.secondary.main,
              } : undefined,
              "&.Mui-disabled": usesDarkChartControls ? {
                bgcolor: theme.palette.action.disabledBackground,
                borderColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              } : undefined,
            },
            "& .Mui-selected": {
              bgcolor: usesDarkChartControls ? `${theme.palette.primary.main} !important` : "primary.main !important",
              color: usesDarkChartControls ? `${theme.palette.primary.contrastText} !important` : "primary.contrastText !important",
            },
          }}
          value={chartInterval}
        >
          {CHART_INTERVALS.map((interval) => (
            <ToggleButton key={interval} value={interval}>{interval}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ChartZoomControls
          actionColor={usesDarkChartControls ? theme.palette.secondary.main : theme.palette.primary.main}
          actionHoverColor={usesDarkChartControls ? theme.palette.action.hover : chartTheme.actionHover}
          mobile={false}
          onZoomIn={() => zoomFromControl(CHART_ZOOM_IN_FACTOR)}
          onZoomOut={() => zoomFromControl(CHART_ZOOM_OUT_FACTOR)}
        />
        {exactTurnoverAvailable ? (
          <Typography sx={{ color: chartTheme.controlText, display: { xs: "none", md: "block" }, fontSize: "0.66rem", fontWeight: 800 }}>
            {chartInterval === "1h" ? "1h chart only" : `Pattern context: ${chartInterval}`}
          </Typography>
        ) : (
          <Tooltip title="Moomoo did not return complete turnover data for this chart.">
            <Typography
              aria-label="VWAP unavailable because Moomoo did not return complete turnover data for this chart"
              component="span"
              sx={{ color: "error.main", cursor: "help", fontSize: "0.66rem", fontWeight: 850 }}
            >
              VWAP unavailable
            </Typography>
          </Tooltip>
        )}
        {exactTurnoverAvailable && layers.vwap ? (
          <Typography sx={{ color: chartSemanticColors.vwap, display: { xs: "none", md: "block" }, fontWeight: 800 }} variant="caption">
            - Session VWAP
          </Typography>
        ) : null}
        {layers.ema ? (
          <Typography sx={{ color: chartSemanticColors.ema, display: { xs: "none", md: "block" }, fontWeight: 800 }} variant="caption">
            - {chartInterval} EMA 9
          </Typography>
        ) : null}
      </Stack>
      {layers.candlePatterns && visiblePatternKinds.length > 0 ? (
        <>
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "rgba(255,255,255,0.94)",
              border: 1,
              borderColor: chartTheme.controlBorder,
              borderRadius: 1,
              display: { xs: "none", md: "flex" },
              flexWrap: "wrap",
              gap: 0.75,
              maxWidth: 520,
              p: 0.75,
              position: "absolute",
              right: 72,
              top: 10,
              zIndex: 3,
            }}
          >
            {visiblePatternKinds.map((kind) => (
              <Stack direction="row" key={kind} spacing={0.45} sx={{ alignItems: "center" }}>
                <Box sx={{ bgcolor: patternColor(kind, chartPatternColors), borderRadius: "50%", height: 8, width: 8 }} />
                <Typography sx={{ fontSize: "0.66rem", fontWeight: 750, whiteSpace: "nowrap" }}>
                  {candlePatternName(kind)}
                </Typography>
              </Stack>
            ))}
          </Box>
          <Box
            aria-controls="mobile-candle-patterns"
            aria-expanded={mobilePatternKeyOpen}
            component="button"
            onClick={() => setMobilePatternKeyOpen((open) => !open)}
            sx={{
              alignItems: "center",
              bgcolor: usesDarkChartControls ? theme.palette.secondary.main : "rgba(255,255,255,0.96)",
              border: 1,
              borderColor: usesDarkChartControls ? theme.palette.secondary.main : chartTheme.controlBorder,
              borderRadius: 1,
              color: usesDarkChartControls ? theme.palette.text.primary : chartTheme.text,
              display: { xs: "flex", md: "none" },
              fontSize: 12,
              fontWeight: 850,
              gap: 0.55,
              minHeight: 44,
              px: 1,
              py: 0.5,
              position: "absolute",
              right: 8,
              top: 52,
              zIndex: 5,
              "&:hover": usesDarkChartControls ? { bgcolor: theme.palette.action.hover } : undefined,
              "&:focus-visible": usesDarkChartControls ? { outline: `2px solid ${theme.palette.primary.light}`, outlineOffset: 2 } : undefined,
            }}
            type="button"
          >
            Candle patterns
            <Box aria-hidden component="span" sx={{ fontSize: "0.9rem", lineHeight: 0.8 }}>
              {mobilePatternKeyOpen ? "−" : "+"}
            </Box>
          </Box>
          {mobilePatternKeyOpen ? (
            <Box
              id="mobile-candle-patterns"
              sx={{
                bgcolor: "rgba(255,255,255,0.98)",
                border: 1,
                borderColor: chartTheme.controlBorder,
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
                    <Box sx={{ bgcolor: patternColor(kind, chartPatternColors), borderRadius: "50%", height: 9, width: 9 }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 750 }}>
                      {candlePatternName(kind)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ) : null}
        </>
      ) : null}
      <ChartZoomControls
        actionColor={usesDarkChartControls ? theme.palette.secondary.main : theme.palette.primary.main}
        actionHoverColor={usesDarkChartControls ? theme.palette.action.hover : chartTheme.actionHover}
        mobile
        onZoomIn={() => zoomFromControl(CHART_ZOOM_IN_FACTOR)}
        onZoomOut={() => zoomFromControl(CHART_ZOOM_OUT_FACTOR)}
      />
      {detail ? (
        <Box
          sx={{
            bgcolor: "rgba(255,255,255,0.96)",
            border: 1,
            borderColor: chartTheme.controlBorder,
            borderRadius: 1.25,
            boxShadow: "0 4px 16px rgba(1,30,86,0.12)",
            maxWidth: 310,
            p: 1.25,
            pointerEvents: "auto",
            position: "absolute",
            right: 64,
            top: { xs: 92, md: 86 },
            zIndex: 5,
          }}
        >
          <Button
            aria-label="Close chart details"
            onClick={() => {
              pinnedDetailRef.current = false;
              dismissedDetailRef.current = true;
              setDetail(null);
            }}
            size="small"
            sx={{ minHeight: 40, minWidth: 40, position: "absolute", right: 2, top: 2 }}
          >
            ×
          </Button>
          <Typography sx={{ fontWeight: 850 }} variant="caption">
            {detail.event
              ? easternTime(Math.floor(Date.parse(detail.event.executedAt) / 1000), true)
              : easternTime(detail.candle.time)} ET
            {detail.event ? " execution" : ` · ${chartInterval} candle`}
          </Typography>
          <Typography sx={{ color: chartTheme.controlText, display: "block" }} variant="caption">
            O {formatPrice(Number(detail.candle.open), currency)} | H {formatPrice(Number(detail.candle.high), currency)} | L {formatPrice(Number(detail.candle.low), currency)} | C {formatPrice(Number(detail.candle.close), currency)}
          </Typography>
          {layers.volume ? (
            <Typography sx={{ color: chartTheme.controlText, display: "block" }} variant="caption">
              Volume {formatVolume(Number(detail.candle.volume))}
            </Typography>
          ) : null}
          {detail.candle.turnover === null ? null : (
            <Typography sx={{ color: chartTheme.controlText, display: "block" }} variant="caption">
              Candle turnover {formatTurnover(Number(detail.candle.turnover), currency)}
            </Typography>
          )}
          {detail.priceAction ? (
            <>
              <Typography sx={{ display: "block", fontWeight: 850, mt: 0.5 }} variant="caption">
                {detail.priceAction.title}
              </Typography>
              <Typography sx={{ color: chartTheme.controlText, display: "block" }} variant="caption">
                {detail.priceAction.explanation}
              </Typography>
            </>
          ) : null}
          {detail.event ? (
            <Typography sx={{ display: "block", fontWeight: 850, mt: 0.5 }} variant="caption">
              {eventLabel(detail.event.kind)}: {detail.event.quantity} shares at {formatPrice(Number(detail.event.price), currency)}
            </Typography>
          ) : null}
          {detail.rules.length > 0 ? (
            <Stack spacing={0.75} sx={{ borderTop: 1, borderColor: "divider", mt: 1, pt: 1 }}>
              <Typography sx={{ color: chartSemanticColors.rule, fontWeight: 900 }} variant="caption">
                Broken rule{detail.rules.length === 1 ? "" : "s"}
              </Typography>
              {detail.rules.map((rule) => (
                <Box key={`${rule.label}:${rule.occurredAt}`}>
                  <Typography sx={{ fontWeight: 800 }} variant="caption">{rule.label}</Typography>
                  <Typography sx={{ color: chartTheme.controlText, display: "block" }} variant="caption">
                    {easternTime(Math.floor(Date.parse(rule.occurredAt) / 1000), true)} ET · {rule.violationCount} violation{rule.violationCount === 1 ? "" : "s"} on this candle
                    {rule.netPnl === null ? " · P/L unavailable" : ` · ${formatPrice(Number(rule.netPnl), currency)} P/L`}
                  </Typography>
                  {rule.triggerAt ? (
                    <Typography sx={{ color: chartTheme.controlText, display: "block" }} variant="caption">
                      Trigger {easternTime(Math.floor(Date.parse(rule.triggerAt) / 1000), true)} ET
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Stack>
          ) : null}
        </Box>
      ) : null}
      <Box
        ref={containerRef}
        sx={{
          height: isFullscreen
            ? { xs: "calc(100dvh - 112px)", md: "calc(100dvh - 56px)" }
            : 420,
          width: "100%",
        }}
      />
      </Box>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          alignItems: "center",
          borderTop: 1,
          borderColor: "divider",
          flexWrap: "wrap",
          justifyContent: { xs: "stretch", md: "flex-end" },
          p: 0.75,
          rowGap: 0.75,
        }}
      >
        <ToggleButtonGroup
          aria-label="Chart range"
          exclusive
          onChange={(_event, value: ChartRangeMode | null) => {
            if (value) setRangeMode(value);
            setRangeRevision((revision) => revision + 1);
          }}
          size="small"
          sx={{
            width: { xs: "100%", md: "auto" },
            ...(usesDarkChartControls ? {
              bgcolor: theme.palette.secondary.main,
              border: 1,
              borderColor: theme.palette.secondary.main,
            } : {}),
            "& .MuiToggleButton-root": {
              ...(usesDarkChartControls ? {
                borderColor: theme.palette.secondary.main,
                color: theme.palette.text.primary,
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                  borderColor: theme.palette.secondary.main,
                },
                "&.Mui-selected": {
                  bgcolor: `${theme.palette.primary.main} !important`,
                  color: `${theme.palette.primary.contrastText} !important`,
                },
                "&.Mui-disabled": {
                  bgcolor: theme.palette.action.disabledBackground,
                  borderColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                },
              } : {}),
              flex: { xs: 1, md: "initial" },
              fontWeight: 800,
              minHeight: { xs: 44, md: 32 },
              px: 1.25,
            },
          }}
          value={rangeMode}
        >
          <ToggleButton value="around_trade">Around trade</ToggleButton>
          <ToggleButton value="all_candles">All candles</ToggleButton>
        </ToggleButtonGroup>
        <Button
          aria-controls={displayMenuAnchor ? "trade-analyzer-display-menu" : undefined}
          aria-expanded={displayMenuAnchor ? "true" : undefined}
          aria-haspopup="menu"
          onClick={(event) => setDisplayMenuAnchor(event.currentTarget)}
          size="small"
          sx={{
            minHeight: { xs: 44, md: 32 },
            ...(usesDarkChartControls ? {
              bgcolor: theme.palette.secondary.main,
              borderColor: theme.palette.secondary.main,
              color: theme.palette.text.primary,
              "&:hover": { bgcolor: theme.palette.action.hover, borderColor: theme.palette.secondary.main },
              "&.Mui-disabled": { bgcolor: theme.palette.action.disabledBackground, borderColor: theme.palette.action.disabledBackground, color: theme.palette.action.disabled },
            } : {}),
          }}
          variant="outlined"
        >
          Display
        </Button>
        <Button
          onClick={toggleFullscreen}
          size="small"
          sx={{
            minHeight: { xs: 44, md: 32 },
            ...(usesDarkChartControls ? {
              bgcolor: theme.palette.secondary.main,
              borderColor: theme.palette.secondary.main,
              color: theme.palette.text.primary,
              "&:hover": { bgcolor: theme.palette.action.hover, borderColor: theme.palette.secondary.main },
              "&.Mui-disabled": { bgcolor: theme.palette.action.disabledBackground, borderColor: theme.palette.action.disabledBackground, color: theme.palette.action.disabled },
            } : {}),
          }}
          variant="outlined"
        >
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </Button>
      </Stack>
      <Menu
        anchorEl={displayMenuAnchor}
        disablePortal
        id="trade-analyzer-display-menu"
        onClose={() => setDisplayMenuAnchor(null)}
        open={Boolean(displayMenuAnchor)}
      >
        {displayOptions.map((option) => (
          <MenuItem
            disabled={!option.available}
            key={option.layer}
            onClick={() => toggleLayer(option.layer)}
          >
            <Checkbox checked={layers[option.layer]} disabled={!option.available} />
            <ListItemText
              primary={option.label}
              secondary={option.available ? undefined : option.unavailableReason}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
