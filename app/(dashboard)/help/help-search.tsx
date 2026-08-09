"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
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

function searchableText(record: HelpSearchRecord): string {
  return [record.title, record.section, record.summary, ...record.keywords]
    .join(" ")
    .toLocaleLowerCase("en-US");
}

export function HelpSearch({ records }: { records: readonly HelpSearchRecord[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("en-US"));
  const results = useMemo(() => {
    if (!deferredQuery) return [];
    const terms = deferredQuery.split(/\s+/u).filter(Boolean);
    return records.filter((record) => {
      const candidate = searchableText(record);
      return terms.every((term) => candidate.includes(term));
    });
  }, [deferredQuery, records]);

  return (
    <Box>
      <TextField
        autoComplete="off"
        fullWidth
        label="Search help"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try ‘View analysis’, ‘candle patterns’ or ‘daily rules’"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon color="primary" />
              </InputAdornment>
            ),
          },
        }}
        value={query}
      />
      <Box aria-live="polite">
        {deferredQuery ? (
          <Paper sx={{ border: 1, borderColor: "divider", mt: 1, overflow: "hidden" }} variant="outlined">
            {results.length > 0 ? (
              <List disablePadding aria-label="Help search results">
                {results.map((record) => (
                  <ListItemButton
                    component={Link}
                    href={record.href}
                    key={record.id}
                    sx={{
                      alignItems: { xs: "flex-start", sm: "center" },
                      borderBottom: 1,
                      borderColor: "divider",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 1,
                      py: 1.25,
                      "&:last-child": { borderBottom: 0 },
                    }}
                  >
                    <ListItemText
                      primary={record.title}
                      secondary={record.summary}
                      slotProps={{
                        primary: { sx: { fontWeight: 800 } },
                        secondary: { sx: { mt: 0.25 } },
                      }}
                    />
                    <Box sx={{ alignItems: "center", display: "flex", flexShrink: 0, gap: 0.5, textAlign: { xs: "left", sm: "right" }, width: { xs: "100%", sm: "auto" } }}>
                      <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
                        {record.section}
                      </Typography>
                      <ArrowForwardRoundedIcon color="primary" fontSize="small" sx={{ ml: "auto" }} />
                    </Box>
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" sx={{ p: 2 }} variant="body2">
                No matching help was found. Browse the Daily Trade Tracker guide to see the available topics.
              </Typography>
            )}
          </Paper>
        ) : null}
      </Box>
    </Box>
  );
}
