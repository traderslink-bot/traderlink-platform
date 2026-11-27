"use client";

import { useRef, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, Popover, Stack, TextField, Typography } from "@mui/material";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import { isSameTimeVolumeMetric } from "@/src/modules/scanner/custom/signal-filters";
import { SCAN_METRICS, type ScanMetric } from "@/src/modules/scanner/custom/definition";

export type ScannerFilterCategory = {
  category: string;
  metrics: readonly ScanMetric[];
};

export function ScannerFilterPicker({ label, categories, onAdd }: {
  label: string;
  categories: readonly ScannerFilterCategory[];
  onAdd: (metrics: readonly ScanMetric[]) => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ScanMetric[]>([]);
  const searchable = categories.length > 1;
  const query = search.trim().toLowerCase();
  const visible = categories.map(({ category, metrics }) => ({
    category,
    metrics: metrics.filter(metric => category.toLowerCase().includes(query) ||
      ((isSameTimeVolumeMetric(metric) || metric === "volumeVsDailyAverage20") && "rvol".includes(query)) ||
      SCAN_METRICS[metric].label.toLowerCase().includes(query)),
  })).filter(group => group.metrics.length);
  const close = () => {
    setAnchor(null);
    trigger.current?.focus();
  };

  return <>
    <Button ref={trigger} size="small" variant="outlined" color="inherit" endIcon={<ExpandMoreRounded />}
      aria-haspopup="dialog" aria-expanded={Boolean(anchor)} sx={{ minHeight: { xs: 44, md: 34 } }}
      onClick={event => { setSearch(""); setSelected([]); setAnchor(event.currentTarget); }}>
      {label}
    </Button>
    <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={close} disableRestoreFocus
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      slotProps={{ paper: { role: "dialog", "aria-label": label, sx: {
        width: 325, maxWidth: "calc(100vw - 32px)", borderRadius: 0,
      } } }}>
      {anchor && <Stack spacing={1} sx={{ p: 1.25 }}>
        {searchable && <TextField autoFocus size="small" label="Find a filter" value={search}
          onChange={event => setSearch(event.target.value)} />}
        <Stack spacing={0.75} sx={{ maxHeight: "min(42dvh, 300px)", overflowY: "auto", pr: 0.5 }}>
          {visible.length === 0 && <Typography variant="body2">No filters found.</Typography>}
          {visible.map(({ category, metrics }) => <Box key={category} role="group" aria-label={category}>
            {searchable && <Typography variant="subtitle2" sx={{ px: 0.5 }}>{category}</Typography>}
            {metrics.map(metric => <FormControlLabel key={metric} label={SCAN_METRICS[metric].label}
              sx={{ display: "flex", m: 0, minHeight: { xs: 44, md: 32 } }}
              control={<Checkbox size="small" checked={selected.includes(metric)}
                onChange={(_, checked) => setSelected(current =>
                  checked ? [...current, metric] : current.filter(item => item !== metric))} />} />)}
          </Box>)}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button size="small" color="inherit" onClick={close}>Cancel</Button>
          <Button size="small" variant="contained" disabled={!selected.length}
            onClick={() => { setAnchor(null); onAdd(selected); }}>Add selected{selected.length ? ` (${selected.length})` : ""}</Button>
        </Stack>
      </Stack>}
    </Popover>
  </>;
}
