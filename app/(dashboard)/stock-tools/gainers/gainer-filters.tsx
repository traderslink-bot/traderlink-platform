"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DashboardPrimaryAction } from "../../../dashboard-ui";

export type GainerPeriod = "day" | "month" | "year" | "range";

export type GainerFilters = {
  period: GainerPeriod;
  day: string;
  month: string;
  year: string;
  from: string;
  to: string;
  ticker: string;
  cutoff: number;
  volume: number;
  sort: "date" | "gain" | "volume";
};

export const VOLUME_OPTIONS = [0, 1_000_000, 5_000_000, 10_000_000, 50_000_000] as const;

export function GainerFilterForm({ filters, earliest, latest, years }: {
  filters: GainerFilters;
  earliest: string;
  latest: string;
  years: string[];
}) {
  const [period, setPeriod] = useState(filters.period);
  const [minimumVolume, setMinimumVolume] = useState(filters.volume);
  return (
    <Box component="form" action="/stock-tools/gainers" method="get" role="search" aria-label="Find top gainers"
      sx={{
        alignItems: "end",
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        "& label": { display: "grid", gap: 0.5, fontSize: 14, whiteSpace: "nowrap" },
        "& input, & select": {
          border: 1, borderColor: "divider", borderRadius: 1, boxSizing: "border-box",
          height: 44, px: 1, font: "inherit", whiteSpace: "nowrap", color: "text.primary",
          bgcolor: "background.paper", width: "auto", maxWidth: "100%",
        },
        "& input[name=ticker]": { width: "17ch" },
      }}>
      <label>Period
        <select name="period" value={period} onChange={(event) => setPeriod(event.target.value as GainerPeriod)}>
          <option value="day">Day</option><option value="month">Month</option>
          <option value="year">Year</option><option value="range">Custom range</option>
        </select>
      </label>
      {period === "day" && <label>Trading date<input name="day" type="date" min={earliest} max={latest} defaultValue={filters.day} required /></label>}
      {period === "month" && <label>Month<input name="month" type="month" min={earliest.slice(0, 7)} max={latest.slice(0, 7)} defaultValue={filters.month} required /></label>}
      {period === "year" && (
        <label>Year<select name="year" defaultValue={filters.year}>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select></label>
      )}
      {period === "range" && (
        <>
          <label>From<input name="from" type="date" min={earliest} max={latest} defaultValue={filters.from} required /></label>
          <label>To<input name="to" type="date" min={earliest} max={latest} defaultValue={filters.to} required /></label>
        </>
      )}
      <label>Ticker (optional)<input name="ticker" defaultValue={filters.ticker} placeholder="e.g. AAPL" maxLength={16} spellCheck={false} /></label>
      <label>Daily rank<select name="cutoff" defaultValue={filters.cutoff}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((rank) => <option key={rank} value={rank}>Top {rank}</option>)}
      </select></label>
      <label>Sort by<select name="sort" defaultValue={filters.sort}>
        <option value="date">Newest date</option><option value="gain">Highest gain</option>
        <option value="volume">Highest dollar volume</option>
      </select></label>
      <Box component="details" sx={{ "& > summary": { cursor: "pointer", py: 1.5, whiteSpace: "nowrap" } }}>
        <summary>{minimumVolume ? `Dollar volume · $${minimumVolume / 1_000_000}M min.` : "Dollar volume"}</summary>
        <Box sx={{ display: "grid", gap: 0.5 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
            <label htmlFor="dashboard-gainers-volume">Min. $Vol</label>
            <Tooltip describeChild title="Shows only stocks with at least this much dollar volume on the trading date. Choose Any to show all volumes.">
              <IconButton size="small" aria-label="About minimum dollar volume" sx={{ p: 0.25 }}>
                <InfoOutlinedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <select id="dashboard-gainers-volume" name="volume" value={minimumVolume} onChange={(event) => setMinimumVolume(Number(event.target.value))}>
            {VOLUME_OPTIONS.map((value) => <option key={value} value={value}>{value ? `$${value / 1_000_000}M` : "Any"}</option>)}
          </select>
        </Box>
      </Box>
      <DashboardPrimaryAction type="submit" sx={{ height: 44, whiteSpace: "nowrap" }}>Apply filters</DashboardPrimaryAction>
    </Box>
  );
}
