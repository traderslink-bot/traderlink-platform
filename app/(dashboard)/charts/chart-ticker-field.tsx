"use client";

import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { useState, type FormEvent } from "react";
import { chartSymbol, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";

export function ChartTickerField({ symbol, timeframe, onSubmit, disabled }: {
  symbol: string;
  timeframe: ChartTimeframe;
  onSubmit: (symbol: string) => string | undefined;
  disabled: boolean;
}) {
  const [value, setValue] = useState(symbol);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("symbol") as HTMLInputElement;
    let message: string | undefined;
    try {
      message = onSubmit(chartSymbol(value));
    } catch {
      message = "Enter a valid ticker symbol.";
    }
    input.setCustomValidity(message ?? "");
    if (message) input.reportValidity();
    else input.blur();
  };

  return <Box component="form" onSubmit={submit} sx={{ minWidth: 0 }}>
    <InputBase name="symbol" value={value} disabled={disabled} title="Search ticker" placeholder="Ticker"
      startAdornment={<SearchOutlined aria-hidden sx={{ fontSize: 14, ml: 0.375, color: "text.secondary" }}/>}
      inputProps={{ "aria-label": `Ticker for ${symbol} ${timeframe} chart`, maxLength: 15, enterKeyHint: "search", autoCapitalize: "characters", spellCheck: false }}
      onFocus={event=>event.target.select()}
      onChange={event=>{event.target.setCustomValidity("");setValue(event.target.value.toUpperCase());}}
      sx={{ width: 80, maxWidth: "100%", height: 24, fontSize: 12, fontWeight: 700, color:"text.primary",
        border: 1, borderColor: "divider", borderRadius: 0.5,
        "& input":{ pl:0.25, pr:0.5, py:0, minWidth:0 }, "&:hover":{borderColor:"text.secondary"},
        "&:focus-within":{borderColor:"primary.main",outline:"1px solid",outlineColor:"primary.main"} }}/>
  </Box>;
}
