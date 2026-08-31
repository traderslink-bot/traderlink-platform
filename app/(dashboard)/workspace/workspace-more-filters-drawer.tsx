"use client";

import { Button, Drawer, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { WorkspaceTradeLibraryQuery } from "./workspace-trade-library";

export function WorkspaceMoreFiltersDrawer({ customEndDate, customStartDate, onClose, open, query }: Readonly<{
  customEndDate: string | null;
  customStartDate: string | null;
  onClose: () => void;
  open: boolean;
  query: WorkspaceTradeLibraryQuery;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const [draft, setDraft] = useState(() => ({
    endDate: customEndDate ?? "", filter: query.filter, group: query.group,
    searchTicker: query.searchTicker, sort: query.sort, startDate: customStartDate ?? "",
  }));
  useEffect(() => {
    if (!open) return;
    setDraft({ endDate: customEndDate ?? "", filter: query.filter, group: query.group, searchTicker: query.searchTicker, sort: query.sort, startDate: customStartDate ?? "" });
  }, [customEndDate, customStartDate, open, query]);
  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(currentSearch);
      const values = Object.entries(draft);
      for (const [key, value] of values) {
        const isDefault = (key === "filter" && value === "all") || (key === "group" && value === "none") || (key === "sort" && value === "newest") || value === "";
        if (isDefault) next.delete(key); else next.set(key, value);
      }
      const nextSearch = next.toString();
      if (nextSearch !== currentSearch) router.replace(next.size === 0 ? "/workspace" : `/workspace?${nextSearch}`, { scroll: false });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [currentSearch, draft, open, router]);
  const active = Number(Boolean(draft.searchTicker)) + Number(draft.filter !== "all") + Number(Boolean(draft.startDate)) + Number(Boolean(draft.endDate)) + Number(draft.sort !== "newest") + Number(draft.group !== "none");
  const clear = () => setDraft({ endDate: "", filter: "all", group: "none", searchTicker: "", sort: "newest", startDate: "" });
  return <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { width: { xs: "100vw", sm: 400 } } } }}>
    <Stack spacing={1.25} sx={{ p: 2 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography component="h2" variant="h6">More filters</Typography><Button onClick={onClose}>Close</Button></Stack>
      <TextField label="Search ticker" onChange={(event) => setDraft((value) => ({ ...value, searchTicker: event.target.value.toUpperCase() }))} size="small" value={draft.searchTicker} />
      <TextField label="Filter" onChange={(event) => setDraft((value) => ({ ...value, filter: event.target.value as typeof value.filter }))} select size="small" value={draft.filter}><MenuItem value="all">All</MenuItem><MenuItem value="open">Open</MenuItem><MenuItem value="swing">Swing</MenuItem><MenuItem value="closed">Closed</MenuItem></TextField>
      <TextField label="From" onChange={(event) => setDraft((value) => ({ ...value, startDate: event.target.value }))} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={draft.startDate} />
      <TextField label="To" onChange={(event) => setDraft((value) => ({ ...value, endDate: event.target.value }))} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={draft.endDate} />
      <TextField label="Sort" onChange={(event) => setDraft((value) => ({ ...value, sort: event.target.value as typeof value.sort }))} select size="small" value={draft.sort}>
        <MenuItem value="newest">Newest</MenuItem><MenuItem value="oldest">Oldest</MenuItem><MenuItem value="position">Position</MenuItem><MenuItem value="buy_quantity">QTY</MenuItem><MenuItem value="entry">Entry</MenuItem><MenuItem value="exit">Exit</MenuItem><MenuItem value="entry_value">Entry value</MenuItem><MenuItem value="hold">Hold</MenuItem><MenuItem value="pnl_high">Gain/Loss high</MenuItem><MenuItem value="pnl_low">Gain/Loss low</MenuItem>
      </TextField>
      <TextField label="Group" onChange={(event) => setDraft((value) => ({ ...value, group: event.target.value as typeof value.group }))} select size="small" value={draft.group}><MenuItem value="none">None</MenuItem><MenuItem value="day">Day</MenuItem><MenuItem value="ticker">Ticker</MenuItem></TextField>
      <Typography color="text.secondary" variant="body2">{active} active filter{active === 1 ? "" : "s"}</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}><Button onClick={clear}>Clear filters</Button><Button disabled={draft.sort === "newest"} onClick={() => setDraft((value) => ({ ...value, sort: "newest" }))}>Return to newest</Button></Stack>
    </Stack>
  </Drawer>;
}
