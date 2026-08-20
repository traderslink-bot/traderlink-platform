"use client";

import { useMemo, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Button, Chip, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";

import { DashboardMetricCard, DashboardPage, DashboardPanel } from "../../../dashboard-template";
import { FeatureHelpLink } from "../../feature-help-link";
import { formatJournalAnalyticsMoney } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

import type { RuleResultEvent, RuleResultsView } from "./rule-results-data";

const PAGE_SIZE = 25;

function factSentence(summary: RuleResultsView["summaries"][number], currency: string): string {
  const parts = [
    `${summary.broken} broken across ${summary.tradingDays} trading day${summary.tradingDays === 1 ? "" : "s"}`,
    `${summary.followed} followed`,
    `${summary.notSelected} not selected`,
    `${summary.nA} N/A`,
    `eligible on ${summary.eligibleTradingDays} trading day${summary.eligibleTradingDays === 1 ? "" : "s"}`,
    `broken-event P/L ${formatJournalAnalyticsMoney(summary.combinedPnl, currency)}`,
    `${summary.brokenWins} gains and ${summary.brokenLosses} losses`,
  ];
  if (summary.largestGain !== null) parts.push(`largest gain ${formatJournalAnalyticsMoney(summary.largestGain, currency)}`);
  if (summary.largestGainSharePercent !== null && summary.brokenWins > 1) parts.push(`largest gain supplied ${summary.largestGainSharePercent}% of broken-event gains`);
  if (summary.largestLoss !== null) parts.push(`largest loss ${formatJournalAnalyticsMoney(summary.largestLoss, currency)}`);
  if (summary.mostFrequentTicker && summary.mostFrequentTickerCount > 1) parts.push(`${summary.mostFrequentTickerCount} broken events occurred in ${summary.mostFrequentTicker}`);
  if (summary.feeCoverage) parts.push(`fee coverage ${summary.feeCoverage}`);
  return `${parts.join(" · ")}.`;
}

export function RuleResultsClient({ initialView }: { initialView: RuleResultsView }) {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("All");
  const [result, setResult] = useState("All");
  const [target, setTarget] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = initialView.events.filter((event) =>
      (source === "All" || event.source === source) &&
      (result === "All" || event.result === result) &&
      (target === "All" || event.target === target) &&
      (!needle || `${event.label} ${event.date} ${event.ticker ?? ""} ${event.note}`.toLowerCase().includes(needle)));
    return rows.sort((left, right) => sort === "oldest"
      ? left.date.localeCompare(right.date)
      : sort === "pnl"
        ? Number(right.netPnl ?? Number.NEGATIVE_INFINITY) - Number(left.netPnl ?? Number.NEGATIVE_INFINITY)
        : right.date.localeCompare(left.date));
  }, [initialView.events, result, search, sort, source, target]);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const brokenEvents = initialView.events.filter((event) => event.result === "Broken");
  const uniqueBrokenRules = new Set(brokenEvents.map((event) => event.ruleId)).size;

  return (
    <DashboardPage>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
        <Box>
          <Typography color="primary.main" sx={{ fontWeight: 700 }} variant="caption">TRADING RULES</Typography>
          <Typography component="h1" variant="h1">Rule Results</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Facts from automatic preset checks and saved manual selections. The app does not judge whether a rule should be kept or changed.</Typography>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}><FeatureHelpLink href="/help/trading-rules/results-history" label="Rule Results" size="medium" /><Button component={Link} href="/rules" startIcon={<ArrowBackRoundedIcon />} variant="outlined">Trading Rules</Button></Stack>
      </Stack>

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", lg: "repeat(4,1fr)" } }}>
        <DashboardMetricCard caption="Distinct rules" label="Rules broken" value={String(uniqueBrokenRules)} />
        <DashboardMetricCard caption="All detected violations" label="Broken events" value={String(brokenEvents.length)} />
        <DashboardMetricCard caption="Preset and manual checks" label="Eligible checks" value={String(initialView.events.length)} />
        <DashboardMetricCard caption="Manual checks without a selection" label="Not selected" value={String(initialView.events.filter((event) => event.result === "Not selected").length)} />
      </Box>

      <DashboardPanel title="Results by rule">
        {initialView.summaries.length === 0 ? <Typography color="text.secondary">No eligible rule results are available yet.</Typography> : (
          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", lg: "repeat(2,1fr)" }, mt: 1.5 }}>
            {initialView.summaries.map((summary) => (
              <Box key={`${summary.ruleId}:${summary.ruleVersion}`} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.75 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 800 }}>{summary.label}</Typography>
                  <Chip label={summary.source} size="small" />
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{factSentence(summary, initialView.currency)}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </DashboardPanel>

      <DashboardPanel title="Rule result history">
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "minmax(220px,1fr) repeat(4,135px)" }, mt: 1.5 }}>
          <TextField label="Search rules, dates, tickers or notes" onChange={(event) => { setSearch(event.target.value); setPage(1); }} size="small" value={search} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} />
          <TextField label="Rule type" onChange={(event) => { setSource(event.target.value); setPage(1); }} select size="small" value={source}>{["All", "Preset", "Manual"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
          <TextField label="Result" onChange={(event) => { setResult(event.target.value); setPage(1); }} select size="small" value={result}>{["All", "Broken", "Followed", "Not selected", "N/A"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
          <TextField label="Target" onChange={(event) => { setTarget(event.target.value); setPage(1); }} select size="small" value={target}>{["All", "Day", "Trade"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
          <TextField label="Sort" onChange={(event) => setSort(event.target.value)} select size="small" value={sort}><MenuItem value="newest">Newest date</MenuItem><MenuItem value="oldest">Oldest date</MenuItem><MenuItem value="pnl">Highest P/L</MenuItem></TextField>
        </Box>
        <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />} sx={{ mt: 1.5 }}>
          {visible.map((event: RuleResultEvent, index) => (
            <Box key={`${event.ruleId}:${event.date}:${event.target}:${index}`} sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "110px minmax(220px,1fr) 100px 110px 120px" }, py: 1.25 }}>
              <Typography variant="body2">{event.date}</Typography>
              <Box><Typography sx={{ fontWeight: 700 }} variant="body2">{event.label}</Typography><Typography color="text.secondary" variant="caption">{event.source} · {event.target}{event.ticker ? ` · ${event.ticker}` : ""}{event.note ? ` · Note: ${event.note}` : ""}</Typography></Box>
              <Chip label={event.result} size="small" sx={{ justifySelf: "start" }} />
              <Typography variant="body2">{formatJournalAnalyticsMoney(event.netPnl, initialView.currency)}</Typography>
              <Button component={Link} href={`/trade-tracker/${event.date}`} size="small">View day</Button>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end", mt: 1.5 }}><Button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Typography variant="body2">Page {page} of {pageCount}</Typography><Button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button></Stack>
      </DashboardPanel>
    </DashboardPage>
  );
}
