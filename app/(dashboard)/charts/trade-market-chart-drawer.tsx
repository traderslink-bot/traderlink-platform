"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import InsightsRounded from "@mui/icons-material/InsightsRounded";
import CenterFocusStrongRounded from "@mui/icons-material/CenterFocusStrongRounded";
import { Box, Button, Drawer, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import type { DaySessionTradeAnalyzer } from "../trade-tracker/[sessionDate]/day-session-types";
import { WrittenTradeAnalysis } from "../trade-tracker/written-trade-analysis";
import { MarketChart } from "./market-chart";
import type { MarketTradeContext, MarketTradeMark } from "./chart-trade-context";

export default function TradeMarketChartDrawer({
  analysis, context, currency, direction, interval, onClose, selectedEventId, symbol, timezone,
}: {
  analysis: DaySessionTradeAnalyzer;
  context: MarketTradeContext;
  currency: string;
  direction: "long" | "short";
  interval: ChartTimeframe;
  onClose: () => void;
  selectedEventId?: string | null;
  symbol: string;
  timezone: string;
}) {
  const [timeframe, setTimeframe] = useState(interval);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [focusRevision, setFocusRevision] = useState(0);
  const [marked, setMarked] = useState<readonly MarketTradeMark[]>(() =>
    selectedEventId ? context.marks.filter(item => item.id === `analysis-fill-${selectedEventId}`) : []);
  const selectMarks = useCallback((marks: readonly MarketTradeMark[]) => {
    setMarked(marks);
    setShowAnalysis(true);
  }, []);
  const time = (seconds: number) => new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit",
  }).format(seconds * 1000);

  return <Drawer anchor="right" open onClose={onClose} slotProps={{ paper: {
    role: "dialog", "aria-modal": true, "aria-label": `${symbol} full chart`,
    ...{ "data-journal-chart-drawer": "trade-context" },
    sx: { width: "100vw", maxWidth: "none", borderRadius: 0 },
  } }}>
    <Stack sx={{ height: "100dvh", minHeight: 0 }}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", minHeight: 44, pl: 0.5, pr: 0.75 }}>
        <Tooltip title="Back to Trade Analyzer"><IconButton aria-label="Back to Trade Analyzer" onClick={onClose} sx={{ width: 44, height: 44 }}><ArrowBackRounded /></IconButton></Tooltip>
        <Typography component="h2" noWrap sx={{ fontSize: 14, fontWeight: 800, flex: 1, minWidth: 0 }}>{symbol} · {direction === "long" ? "Long" : "Short"}</Typography>
        <Tooltip title="Fit trade"><IconButton aria-label="Fit trade" onClick={() => setFocusRevision(value => value + 1)} sx={{ width: 44, height: 44 }}><CenterFocusStrongRounded /></IconButton></Tooltip>
        <Button aria-controls="full-chart-trade-analysis" aria-expanded={showAnalysis} color="inherit" size="small"
          startIcon={<InsightsRounded />} variant={showAnalysis ? "outlined" : "text"} onClick={() => setShowAnalysis(value => !value)}
          sx={{ minHeight: 40, textTransform: "none" }}>Analysis</Button>
      </Stack>
      <Stack data-trade-market-content direction={{ xs: "column", md: "row" }} sx={{ flex: 1, minHeight: 0 }}>
        <Box data-trade-market-chart sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <MarketChart symbol={symbol} timeframe={timeframe} onTimeframeChange={setTimeframe}
            compactMobile tradeContext={context} tradeFocusRevision={focusRevision} onTradeMarkClick={selectMarks} />
        </Box>
        {showAnalysis && <Box id="full-chart-trade-analysis" component="aside" aria-label="Saved trade analysis"
          sx={{ width: { xs: "100%", md: 420 }, maxWidth: "100%", maxHeight: { xs: "45%", md: "none" }, overflow: "auto",
            flexShrink: 0, borderTop: { xs: 1, md: 0 }, borderLeft: { md: 1 }, borderColor: "divider", p: 1.5 }}>
          {marked.length > 0 && <Stack spacing={0.75} sx={{ mb: 2 }}>
            {marked.map(mark => <Box key={mark.id}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{mark.label}</Typography>
              <Typography color="text.secondary" variant="caption">{time(mark.time)}{mark.details ? ` · ${mark.details}` : ""}</Typography>
            </Box>)}
          </Stack>}
          <WrittenTradeAnalysis analysis={analysis} currency={currency} direction={direction} timezone={timezone} timeframe={timeframe === "5m" ? "5m" : "1m"} />
        </Box>}
      </Stack>
    </Stack>
  </Drawer>;
}
