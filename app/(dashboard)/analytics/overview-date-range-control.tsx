"use client";

import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type OverviewDateRange = Readonly<{
  kind: "all" | "3m" | "6m" | "12m" | "ytd" | "custom";
  startDate: string | null;
  endDate: string | null;
}>;

const OPTIONS: readonly Readonly<{ value: OverviewDateRange["kind"]; label: string }>[] = [
  { value: "all", label: "All time" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "ytd", label: "This year" },
  { value: "custom", label: "Custom range" },
];

export function OverviewDateRangeControl({ href = "/analytics", value }: { href?: string; value: OverviewDateRange }) {
  const router = useRouter();
  const [kind, setKind] = useState<OverviewDateRange["kind"]>(value.kind);
  const [startDate, setStartDate] = useState(value.startDate ?? "");
  const [endDate, setEndDate] = useState(value.endDate ?? "");
  const apply = () => {
    const params = new URLSearchParams({ range: kind });
    if (kind === "custom") {
      params.set("start", startDate);
      params.set("end", endDate);
    }
    router.push(`${href}?${params.toString()}`);
  };
  return <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}><TextField label="Date range" onChange={(event) => setKind(event.target.value as OverviewDateRange["kind"])} select size="small" sx={{ minWidth: 180 }} value={kind}>{OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>{kind === "custom" ? <><FormControl size="small" sx={{ minWidth: 156 }}><InputLabel htmlFor="overview-start-date" shrink>Start date</InputLabel><OutlinedInput id="overview-start-date" inputProps={{ "aria-label": "Start date" }} label="Start date" notched onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} /></FormControl><FormControl size="small" sx={{ minWidth: 156 }}><InputLabel htmlFor="overview-end-date" shrink>End date</InputLabel><OutlinedInput id="overview-end-date" inputProps={{ "aria-label": "End date" }} label="End date" notched onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} /></FormControl></> : null}<Button onClick={apply} variant="outlined">Update</Button></Stack>;
}
