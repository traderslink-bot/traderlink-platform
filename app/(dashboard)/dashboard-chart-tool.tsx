"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CandlestickChartIcon from "@mui/icons-material/CandlestickChart";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { DashboardSecondaryAction } from "../dashboard-template";
import { chartSymbol } from "@/src/modules/scanner/alpaca/candles";

const WorkspaceChart = lazy(async () => {
  const { AlpacaLightweightChart } = await import("./charts/alpaca-lightweight-chart");
  return { default: AlpacaLightweightChart };
});

type DashboardChartContextValue = Readonly<{
  closeChart: () => void;
  open: boolean;
  openRequest: number;
  openChart: (symbol?: string) => void;
  setChartSymbol: (symbol: string) => void;
  symbol: string;
}>;

const DashboardChartContext = createContext<DashboardChartContextValue | null>(null);

function WorkspaceChartTicker({ ticker, onChangeTicker }: Readonly<{
  ticker: string;
  onChangeTicker: (ticker: string) => void;
}>) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("ticker");
    if (!(input instanceof HTMLInputElement)) return;

    try {
      const nextTicker = chartSymbol(input.value);
      input.value = nextTicker;
      onChangeTicker(nextTicker);
      input.blur();
    } catch {
      input.setCustomValidity("Enter a valid ticker symbol.");
      input.reportValidity();
    }
  }

  return (
    <Box component="form" onSubmit={submit} sx={{ minWidth: 0 }}>
      <InputBase
        name="ticker"
        defaultValue={ticker}
        startAdornment={<SearchOutlinedIcon aria-hidden sx={{ fontSize: 15, ml: 0.5, color: "text.secondary" }} />}
        inputProps={{ "aria-label": "Chart ticker", maxLength: 15, enterKeyHint: "search", autoCapitalize: "characters", spellCheck: false }}
        onFocus={(event) => event.target.select()}
        onChange={(event) => event.target.setCustomValidity("")}
        sx={{
          width: 110, maxWidth: "100%", height: 30, fontSize: 12, fontWeight: 700,
          border: 1, borderColor: "divider", borderRadius: 0.5,
          "& input": { px: 0.5, py: 0, minWidth: 0 },
          "&:hover": { borderColor: "text.secondary" },
          "&:focus-within": { borderColor: "primary.main", outline: "1px solid", outlineColor: "primary.main" },
        }}
      />
    </Box>
  );
}

type ChartPanelMode = "normal" | "minimized" | "full-screen";

function DashboardChartPanel({
  onChangeTicker,
  onClose,
  openRequest,
  symbol,
}: Readonly<{
  onChangeTicker: (ticker: string) => void;
  onClose: () => void;
  openRequest: number;
  symbol: string;
}>) {
  const [panelView, setPanelView] = useState<{ request: number; mode: ChartPanelMode }>();
  const mode = panelView?.request === openRequest ? panelView.mode : "normal";
  const fullScreen = mode === "full-screen";
  const minimized = mode === "minimized";
  const setMode = (next: ChartPanelMode) => setPanelView({ request: openRequest, mode: next });
  const panelRef = useRef<HTMLDivElement | null>(null);
  const visibleHeight = fullScreen ? "100dvh" : { xs: 460, md: 620 };
  const ticker = symbol.replace(/^.*:/, "");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [openRequest]);

  return (
    <Box
      ref={panelRef}
      data-journal-workspace-chart
      sx={{
        bgcolor: "background.paper",
        border: fullScreen ? 0 : 1,
        borderColor: "divider",
        borderRadius: 0,
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
            onClick={() => setMode("normal")}
            startIcon={<VisibilityIcon />}
            sx={{ flex: 1, justifyContent: "flex-start" }}
          >
            Minimized {ticker} Chart
          </DashboardSecondaryAction>
          <Tooltip title="Close chart">
            <IconButton aria-label="Close chart" onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
          </Tooltip>
        </Stack>
      ) : null}
      <Box aria-hidden={minimized} sx={{ display: minimized ? "none" : "block", height: "100%", minHeight: 0 }}>
        <Suspense fallback={<Typography role="status" variant="body2" sx={{ p: 1 }}>Loading chart…</Typography>}>
          <WorkspaceChart
            symbol={ticker}
            compactToolbar
            compactIdentity={<WorkspaceChartTicker key={ticker} ticker={ticker} onChangeTicker={onChangeTicker} />}
            actions={
              <Stack direction="row">
                <Tooltip title="Minimize chart">
                  <IconButton aria-label="Minimize chart" onClick={() => setMode("minimized")} size="small" sx={{ minWidth: 34, height: 40 }}>
                    <KeyboardArrowDownRoundedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={fullScreen ? "Exit full screen" : "Full screen"}>
                  <IconButton aria-label={fullScreen ? "Exit full screen" : "Full screen"} onClick={() => setMode(fullScreen ? "normal" : "full-screen")} size="small" sx={{ minWidth: 34, height: 40 }}>
                    {fullScreen ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close chart">
                  <IconButton aria-label="Close chart" onClick={onClose} size="small" sx={{ minWidth: 34, height: 40 }}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            }
          />
        </Suspense>
      </Box>
    </Box>
  );
}

export function DashboardChartProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [open, setOpen] = useState(false);
  const [openRequest, setOpenRequest] = useState(0);
  const [symbol, setSymbol] = useState("AAPL");
  const openChart = (nextSymbol?: string) => {
    if (nextSymbol?.trim()) setSymbol(nextSymbol.trim().toUpperCase());
    setOpenRequest((current) => current + 1);
    setOpen(true);
  };

  return (
    <DashboardChartContext.Provider value={{ closeChart: () => setOpen(false), open, openChart, openRequest, setChartSymbol: setSymbol, symbol }}>
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
      <DashboardSecondaryAction onClick={() => openChart()} startIcon={<CandlestickChartIcon />}>
        Chart
      </DashboardSecondaryAction>
    </Tooltip>
  );
}

export function DashboardChartPanelSlot() {
  const { closeChart, open, openRequest, setChartSymbol, symbol } = useDashboardChart();
  return open ? <DashboardChartPanel onChangeTicker={setChartSymbol} onClose={closeChart} openRequest={openRequest} symbol={symbol} /> : null;
}
