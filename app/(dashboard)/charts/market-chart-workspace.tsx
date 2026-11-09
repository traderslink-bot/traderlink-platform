"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState, type FormEvent } from "react";
import { DashboardPrimaryAction } from "@/app/dashboard-template";
import { AlpacaLightweightChart } from "./alpaca-lightweight-chart";

export function MarketChartWorkspace() {
  const [symbol, setSymbol] = useState("NWGL");
  const [draft, setDraft] = useState("NWGL");
  const [error, setError] = useState(false);

  const openSymbol = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = draft.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.\-]{0,14}$/.test(next)) {
      setError(true);
      return;
    }
    setError(false);
    setDraft(next);
    setSymbol(next);
  };

  return (
    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 0, height: "var(--market-chart-height, calc(100dvh - 80px))", minHeight: 360, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Stack component="form" onSubmit={openSymbol} direction="row" spacing={1} sx={{ p: 1, alignItems: "flex-start", borderBottom: 1, borderColor: "divider" }}>
        <TextField label="Stock symbol" size="small" value={draft} onChange={event => { setDraft(event.target.value); setError(false); }} error={error} helperText={error ? "Enter a stock symbol." : undefined} slotProps={{ htmlInput: { maxLength: 15, autoCapitalize: "characters", autoCorrect: "off", spellCheck: false } }} sx={{ width: 160 }} />
        <DashboardPrimaryAction type="submit">Open chart</DashboardPrimaryAction>
      </Stack>
      <AlpacaLightweightChart symbol={symbol} sx={{ flex: 1, height: "auto" }} />
    </Box>
  );
}
