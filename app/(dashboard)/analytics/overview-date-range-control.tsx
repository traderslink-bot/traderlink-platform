"use client";

import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export type OverviewDateRange = Readonly<{
  kind: "all" | "today" | "this_week" | "last_week" | "this_month" |
    "last_month" | "30d" | "3m" | "6m" | "12m" | "ytd" | "custom";
  startDate: string | null;
  endDate: string | null;
}>;

const OPTIONS: readonly Readonly<{ value: OverviewDateRange["kind"]; label: string }>[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
];

export function OverviewDateRangeControl({ href = "/analytics", value }: { href?: string; value: OverviewDateRange }) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [kind, setKind] = useState<OverviewDateRange["kind"]>(value.kind);
  const [startDate, setStartDate] = useState(value.startDate ?? "");
  const [endDate, setEndDate] = useState(value.endDate ?? "");
  const apply = () => {
    const params = new URLSearchParams(currentSearchParams.toString());
    params.set("range", kind);
    params.delete("start");
    params.delete("end");
    params.delete("after");
    params.delete("page");
    if (kind === "custom") {
      params.set("start", startDate);
      params.set("end", endDate);
    }
    router.push(`${href}?${params.toString()}`);
  };
  const selectedDates = value.startDate && value.endDate
    ? `${value.startDate} through ${value.endDate}`
    : "All completed trade dates";
  return <Stack spacing={0.5}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}><TextField label="Date range" onChange={(event) => setKind(event.target.value as OverviewDateRange["kind"])} select size="small" sx={{ minWidth: 180 }} value={kind}>{OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>{kind === "custom" ? <><FormControl size="small" sx={{ minWidth: 156 }}><InputLabel htmlFor="overview-start-date" shrink>Start date</InputLabel><OutlinedInput id="overview-start-date" inputProps={{ "aria-label": "Start date" }} label="Start date" notched onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} /></FormControl><FormControl size="small" sx={{ minWidth: 156 }}><InputLabel htmlFor="overview-end-date" shrink>End date</InputLabel><OutlinedInput id="overview-end-date" inputProps={{ "aria-label": "End date" }} label="End date" notched onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} /></FormControl></> : null}<Button disabled={kind === "custom" && (!startDate || !endDate || startDate > endDate)} onClick={apply} variant="outlined">Update</Button></Stack>
    <Typography color="text.secondary" variant="caption">{selectedDates} · based on each trade&apos;s closing date</Typography>
  </Stack>;
}
