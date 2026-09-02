"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { DashboardSecondaryAction } from "../dashboard-template";
import { TradingViewChart } from "./charts/trading-view-chart";

type DashboardChartContextValue = Readonly<{
  closeChart: () => void;
  open: boolean;
  openRequest: number;
  openChart: (symbol?: string) => void;
  symbol: string;
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const visibleHeight = fullScreen ? "100dvh" : { xs: 460, md: 620 };
  const ticker = symbol.replace(/^.*:/, "");

  useEffect(() => {
    setFullScreen(false);
    setMinimized(false);
    const frame = window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [openRequest]);

  useEffect(() => {
    if (!minimized) window.dispatchEvent(new Event("resize"));
  }, [fullScreen, minimized]);

  return (
    <Box
      ref={panelRef}
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
      {minimized ? (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minHeight: 52, px: 1.5 }}>
          <DashboardSecondaryAction
            aria-label={`Restore ${ticker} chart`}
            onClick={() => setMinimized(false)}
            startIcon={<VisibilityIcon />}
            sx={{ flex: 1, justifyContent: "flex-start" }}
          >
            Minimized {ticker} Chart
          </DashboardSecondaryAction>
          <Tooltip title="Close chart">
            <IconButton aria-label="Close chart" onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
          </Tooltip>
        </Stack>
      ) : (
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
          </Stack>
          <Stack direction="row" spacing={0.25}>
            <Tooltip title="Minimize chart">
              <IconButton aria-label="Minimize chart" onClick={() => {
                setFullScreen(false);
                setMinimized(true);
              }} size="small">
                <KeyboardArrowDownRoundedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={fullScreen ? "Exit full screen" : "Full screen"}>
              <IconButton aria-label={fullScreen ? "Exit full screen" : "Full screen"} onClick={() => setFullScreen((current) => !current)} size="small">
                {fullScreen ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Close chart">
              <IconButton aria-label="Close chart" onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      )}
      <Box
        aria-hidden={minimized}
        sx={{
          display: minimized ? "none" : "block",
          height: "calc(100% - 52px)",
          minHeight: 0,
          overflow: "hidden",
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
    <DashboardChartContext.Provider value={{ closeChart: () => setOpen(false), open, openChart, openRequest, symbol }}>
      {children}
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

export function DashboardChartPanelSlot() {
  const { closeChart, open, openRequest, symbol } = useDashboardChart();
  return open ? <DashboardChartPanel onClose={closeChart} openRequest={openRequest} symbol={symbol} /> : null;
}
