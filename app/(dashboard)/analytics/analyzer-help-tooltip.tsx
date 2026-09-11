"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useState, type SyntheticEvent } from "react";

/**
 * An explicitly toggled help control. Mobile browser tooltips auto-dismiss too
 * quickly to read; this stays open until the trader taps it again or elsewhere.
 */
export function AnalyzerHelpTooltip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const stopParentAction = (event: SyntheticEvent) => event.stopPropagation();

  return <ClickAwayListener onClickAway={() => setOpen(false)}>
    <Box component="span" sx={{ display: "inline-flex", flexShrink: 0 }}>
      <Tooltip
        arrow
        disableFocusListener
        disableHoverListener
        disableTouchListener
        open={open}
        slotProps={{ tooltip: { sx: {
          fontSize: { xs: "0.94rem", sm: "0.8125rem" },
          lineHeight: 1.45,
          maxWidth: { xs: "calc(100vw - 32px)", sm: 360 },
          px: { xs: 1.25, sm: 1 },
          py: { xs: 1, sm: 0.75 },
        } } }}
        title={text}
      >
        <IconButton
          aria-label={`Explain ${label}`}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen((current) => !current); }}
          onKeyDown={stopParentAction}
          onMouseDown={stopParentAction}
          onTouchStart={stopParentAction}
          size="small"
          sx={{
            color: "text.secondary",
            height: { xs: 36, sm: 28 },
            ml: 0.15,
            p: { xs: 0.75, sm: 0.35 },
            width: { xs: 36, sm: 28 },
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: { xs: 21, sm: 16 } }} />
        </IconButton>
      </Tooltip>
    </Box>
  </ClickAwayListener>;
}
