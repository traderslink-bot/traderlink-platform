// Isolated rendering harness for the real shared component. Synthetic data only.
import React from "react";
import { createRoot } from "react-dom/client";
import { Box, CssBaseline, ThemeProvider, Typography } from "@mui/material";
import { createTraderMaterialTheme } from "../app/mui-theme";
import { WrittenTradeAnalysis } from "../app/(dashboard)/trade-tracker/written-trade-analysis";
import type { DaySessionTradeAnalyzer } from "../app/(dashboard)/trade-tracker/[sessionDate]/day-session-types";
const params = new URLSearchParams(location.search);
const count = Number(params.get("count") ?? 15);
const base = Date.parse("2026-08-28T13:00:00Z") / 1000;
const event = (kind: string, minute: number, price: string, quantity: string) => ({ eventId: `${kind}-${minute}`, sequence: minute, kind, executedAt: new Date((base + minute * 60) * 1000).toISOString(), price, quantity, fees: params.has("blank") ? null : "-0.50" });
const analysis = {
  status: "ready", reviewContext: { analyzedTradeCount: count, basis: params.has("net") ? "net" : "gross" },
  events: params.has("empty") ? [] : [event("entry", 0, "1", "1000"), event("partial_exit", 4, "1.5", "400"), event("final_exit", 7, "0.6", "600")],
  candles: [[0, 1.2], [1, .8], [2, 1.1], [3, 1.5], [4, 1.8], [5, .8]].map(([minute, close]) => ({ time: base + minute! * 60, close: String(close) })),
} as DaySessionTradeAnalyzer;
createRoot(document.getElementById("root")!).render(<ThemeProvider theme={createTraderMaterialTheme(params.has("dark") ? "dark" : "light")}><CssBaseline /><Box sx={{ maxWidth: 1120, mx: "auto", p: { xs: 1.5, md: 3 }, bgcolor: "background.paper" }}><Typography variant="caption" color="text.secondary">Isolated component QA · synthetic trade</Typography><WrittenTradeAnalysis analysis={analysis} direction="long" currency="USD" timezone="America/New_York"><Typography variant="body2">Existing entry, exit and candle-context detail is passed here by each analyzer surface.</Typography></WrittenTradeAnalysis></Box></ThemeProvider>);
