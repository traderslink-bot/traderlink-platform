"use client";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import type { HelpSearchRecord } from "@/src/modules/help/help-content-registry";

export function HelpSearch({ records }: { records: readonly HelpSearchRecord[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = useDeferredValue(query.trim().toLocaleLowerCase("en-US"));
  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    const terms = normalizedQuery.split(/\s+/u).filter(Boolean);
    return records.filter((record) => {
      const searchable = [record.title, record.section, record.summary, ...record.keywords].join(" ").toLocaleLowerCase("en-US");
      return terms.every((term) => searchable.includes(term));
    });
  }, [normalizedQuery, records]);

  return <Box><TextField autoComplete="off" fullWidth label="Search help" onChange={(event) => setQuery(event.target.value)} placeholder="Search guides and answers" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="primary" /></InputAdornment> } }} value={query} />{normalizedQuery ? <Paper sx={{ border: 1, borderColor: "divider", mt: 1, overflow: "hidden" }} variant="outlined">{results.length ? <List disablePadding aria-label="Help search results">{results.map((record) => <ListItemButton component={Link} href={record.href} key={record.id} sx={{ alignItems: "flex-start", borderBottom: 1, borderColor: "divider", flexDirection: { xs: "column", sm: "row" }, gap: 0.5, "&:last-child": { borderBottom: 0 } }}><ListItemText primary={record.title} secondary={record.summary} slotProps={{ primary: { sx: { fontWeight: 800 } } }} /><Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">{record.section}</Typography></ListItemButton>)}</List> : <Typography color="text.secondary" sx={{ p: 2 }}>No matching guide was found.</Typography>}</Paper> : null}</Box>;
}
