"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { DashboardSecondaryAction } from "../dashboard-template";
import { TradingViewChart } from "./charts/trading-view-chart";

type DashboardChartContextValue = Readonly<{
  openChart: (symbol?: string) => void;
}>;

const DashboardChartContext = createContext<DashboardChartContextValue | null>(null);

function DashboardChartPanel({
  onClose,
  openRequest,
  symbol,
}: Readonly<{
  onClose: () => void;
  openRequest: number;
  symbol: string;
}>) {
  const [fullScreen, setFullScreen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const visibleHeight = fullScreen ? "100dvh" : { xs: 460, md: 620 };

  useEffect(() => {
    setFullScreen(false);
    setMinimized(false);
  }, [openRequest]);

  useEffect(() => {
    if (!minimized) window.dispatchEvent(new Event("resize"));
  }, [fullScreen, minimized]);

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: fullScreen ? 0 : 1,
        borderColor: "divider",
        borderRadius: fullScreen ? 0 : 2,
        boxShadow: fullScreen ? 24 : 0,
        height: minimized ? "auto" : visibleHeight,
        inset: fullScreen ? 0 : "auto",
        overflow: "hidden",
        position: fullScreen ? "fixed" : "relative",
        width: "100%",
        zIndex: fullScreen ? 1300 : "auto",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between", minHeight: 52, px: 1.5 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          <VisibilityIcon color="primary" fontSize="small" />
          <Typography noWrap sx={{ fontWeight: 850 }}>
            Chart · {symbol}
          </Typography>
          {minimized ? <Typography color="text.secondary" variant="caption">Minimized</Typography> : null}
        </Stack>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title={minimized ? "Restore chart" : "Minimize chart"}>
            <IconButton aria-label={minimized ? "Restore chart" : "Minimize chart"} onClick={() => setMinimized((current) => {
              const next = !current;
              if (next) setFullScreen(false);
              return next;
            })} size="small">
              {minimized ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={fullScreen ? "Exit full screen" : "Full screen"}>
            <IconButton aria-label={fullScreen ? "Exit full screen" : "Full screen"} disabled={minimized} onClick={() => setFullScreen((current) => !current)} size="small">
              {fullScreen ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Close chart">
            <IconButton aria-label="Close chart" onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Box
        aria-hidden={minimized}
        sx={{
          height: minimized ? 1 : "calc(100% - 52px)",
          minHeight: minimized ? 1 : 0,
          overflow: "hidden",
          visibility: minimized ? "hidden" : "visible",
        }}
      >
        <TradingViewChart symbol={symbol} sx={{ border: 0, borderRadius: 0, height: "100%", minHeight: 0 }} />
      </Box>
    </Box>
  );
}

export function DashboardChartProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [open, setOpen] = useState(false);
  const [openRequest, setOpenRequest] = useState(0);
  const [symbol, setSymbol] = useState("NASDAQ:AAPL");
  const openChart = (nextSymbol?: string) => {
    if (nextSymbol?.trim()) setSymbol(nextSymbol.trim().toUpperCase());
    setOpenRequest((current) => current + 1);
    setOpen(true);
  };

  return (
    <DashboardChartContext.Provider value={{ openChart }}>
      {children}
      {open ? <DashboardChartPanel onClose={() => setOpen(false)} openRequest={openRequest} symbol={symbol} /> : null}
    </DashboardChartContext.Provider>
  );
}

export function useDashboardChart(): DashboardChartContextValue {
  const context = useContext(DashboardChartContext);
  if (!context) throw new Error("Dashboard chart controls must be used inside DashboardChartProvider.");
  return context;
}

export function DashboardChartAction() {
  const { openChart } = useDashboardChart();
  return (
    <Tooltip title="Open chart">
      <DashboardSecondaryAction onClick={() => openChart()} startIcon={<VisibilityIcon />}>
        Chart
      </DashboardSecondaryAction>
    </Tooltip>
  );
}
