"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { useId, useState, type ReactNode } from "react";
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";

/** Help is a sibling control, never an interactive child of the toggle. */
export function AnalyzerDisclosureSection({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  return <Paper variant="outlined">
    <Stack direction="row" sx={{ alignItems: "center", px: 2 }}>
      <Box component="h3" sx={{ m: 0, flex: 1, minWidth: 0, font: "inherit" }}>
        <ButtonBase id={`${id}-heading`} aria-expanded={expanded} aria-controls={`${id}-content`}
          onClick={() => setExpanded(value => !value)}
          sx={{ width: "100%", minHeight: 48, justifyContent: "space-between", textAlign: "left",
            "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 } }}>
          {title}<ExpandMoreIcon sx={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none" }} />
        </ButtonBase>
      </Box>
      <AnalyzerHelpTooltip label={title} text={help} />
    </Stack>
    <Collapse in={expanded}>
      <Box id={`${id}-content`} role="region" aria-labelledby={`${id}-heading`} sx={{ px: 2, pb: 2 }}>
        {children}
      </Box>
    </Collapse>
  </Paper>;
}
