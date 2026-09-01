"use client";

import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type MoomooMarketDataConnectionPromptSurface =
  | "analyzer"
  | "chart"
  | "entry-exit"
  | "green-to-red"
  | "drawer";

const COPY: Readonly<Record<MoomooMarketDataConnectionPromptSurface, Readonly<{
  detail: string;
  title: string;
}>>> = Object.freeze({
  analyzer: Object.freeze({
    detail: "Connect Moomoo to save chart-based analysis for eligible trades, then compare your entries, exits, Green-to-Red behavior and candle patterns over time.",
    title: "Connect Moomoo to use Trade Analyzer",
  }),
  chart: Object.freeze({
    detail: "It unlocks your Trade Tracker chart replay: see entries and exits on 1-minute, 5-minute, 15-minute and 1-hour candles, with volume, VWAP, EMA 9, patterns and the complete trade path.",
    title: "Connect Moomoo to use the trade chart",
  }),
  "entry-exit": Object.freeze({
    detail: "It gives Entry & Exit analysis the candle-by-candle context around your fills: price movement after entry, VWAP, EMA 9, volume and how much price moved before each exit.",
    title: "Connect Moomoo to analyze entries and exits",
  }),
  "green-to-red": Object.freeze({
    detail: "It gives Green-to-Red analysis the recorded path through breakeven, peak profit, pullback, recovery and sustained profit opportunities.",
    title: "Connect Moomoo to analyze Green-to-Red trades",
  }),
  drawer: Object.freeze({
    detail: "This trade drawer can replay your executions against the saved price chart once Moomoo market data is connected.",
    title: "Connect Moomoo to view this trade chart",
  }),
});

export function MoomooMarketDataConnectionPrompt({
  compact = false,
  surface,
}: {
  compact?: boolean;
  surface: MoomooMarketDataConnectionPromptSurface;
}) {
  const copy = COPY[surface];
  return (
    <Box
      component="section"
      sx={{
        bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : "rgba(1, 30, 86, 0.045)",
        border: 1,
        borderColor: "primary.light",
        borderRadius: 1.5,
        p: compact ? 1.5 : { xs: 2, sm: 2.5 },
      }}
    >
      <Typography component="h3" sx={{ fontWeight: 850 }} variant={compact ? "body1" : "h6"}>
        {copy.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.6 }} variant="body2">
        Create a free Moomoo account in minutes. You do not need to open a Moomoo trading or brokerage account to connect the market data.
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.6 }} variant="body2">
        {copy.detail}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
        <Button
          component="a"
          endIcon={<OpenInNewRoundedIcon />}
          href="https://www.moomoo.com/us/"
          rel="noopener noreferrer"
          target="_blank"
          variant="outlined"
        >
          Create a free Moomoo account
        </Button>
        <Button href="/account/trading" variant="contained">
          Connect Moomoo
        </Button>
      </Stack>
    </Box>
  );
}
