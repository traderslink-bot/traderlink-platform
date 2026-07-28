"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";

const TRADING_VIEW_WIDGET_URL =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

export function TradingViewChart() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    const chartContainer = chartContainerRef.current;

    if (!chartContainer) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = TRADING_VIEW_WIDGET_URL;
    script.type = "text/javascript";
    script.text = JSON.stringify({
      allow_symbol_change: true,
      autosize: true,
      backgroundColor: "#FFFFFF",
      calendar: false,
      details: false,
      gridColor: "rgba(1, 30, 86, 0.08)",
      hide_legend: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_volume: false,
      interval: "15",
      locale: "en",
      save_image: true,
      style: "1",
      symbol: "NASDAQ:AAPL",
      theme: "light",
      timezone: "America/New_York",
      withdateranges: true,
    });
    script.onload = () => setHasLoaded(true);
    script.onerror = () => setHasLoadError(true);
    chartContainer.appendChild(script);

    return () => {
      chartContainer.replaceChildren();
    };
  }, []);

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        height: { xs: "calc(100vh - 132px)", sm: "calc(100vh - 112px)" },
        minHeight: { xs: 560, sm: 720 },
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      {!hasLoaded && !hasLoadError ? (
        <Stack
          spacing={1.5}
          sx={{
            alignItems: "center",
            bgcolor: "rgba(1, 30, 86, 0.035)",
            borderRadius: 2,
            inset: 0,
            justifyContent: "center",
            position: "absolute",
            zIndex: 1,
          }}
        >
          <CircularProgress size={28} />
          <Typography color="text.secondary" variant="body2">
            Loading market chart...
          </Typography>
        </Stack>
      ) : null}
      {hasLoadError ? (
        <Stack
          spacing={0.75}
          sx={{
            alignItems: "center",
            bgcolor: "rgba(1, 30, 86, 0.035)",
            borderRadius: 2,
            inset: 0,
            justifyContent: "center",
            position: "absolute",
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>Chart unavailable</Typography>
          <Typography color="text.secondary" variant="body2">
            Please check your connection and try again.
          </Typography>
        </Stack>
      ) : null}
      <Box
        className="tradingview-widget-container"
        ref={chartContainerRef}
        sx={{ height: "100%", width: "100%" }}
      />
    </Box>
  );
}
