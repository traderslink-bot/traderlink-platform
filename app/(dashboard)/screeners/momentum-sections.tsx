"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { useId, useState, type ReactNode } from "react";
import type { LiveScannerRow, LiveScreenResults } from "@/src/modules/scanner/live/contracts";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";

export function MomentumSections({ sections, compact, renderResults }: {
  sections: NonNullable<LiveScreenResults["momentumSections"]>;
  compact?: boolean;
  renderResults: (rows: readonly LiveScannerRow[], total: number) => ReactNode;
}) {
  const [showEarly, setShowEarly] = useState(false);
  const earlyId = useId();
  return <Box data-momentum-sections sx={theme => ({
    ...scannerScrollStyles(theme), minHeight:0, minWidth:0, overflowY:"auto",
    maxHeight:compact ? 420 : undefined,
    "& .MuiTableContainer-root":{maxHeight:"none",overflowX:"auto"},
  })}>
    <Typography component="h3" sx={{fontSize:"0.7rem",fontWeight:750,px:0.5,mb:0.4}}>
      Confirmed ({sections.confirmedTotal})
    </Typography>
    {sections.confirmed.length ? renderResults(sections.confirmed,sections.confirmedTotal) :
      <Typography color="text.secondary" sx={{fontSize:"0.65rem",px:0.5,mb:0.5}}>No confirmed signals.</Typography>}
    <ButtonBase aria-expanded={showEarly} aria-controls={earlyId} onClick={() => setShowEarly(open => !open)}
      sx={{width:"100%",justifyContent:"space-between",fontSize:"0.7rem",fontWeight:750,px:0.5,minHeight:32,borderTop:1,borderColor:"divider"}}>
      Early signals ({sections.earlyTotal}) <span aria-hidden>{showEarly ? "−" : "+"}</span>
    </ButtonBase>
    <div id={earlyId} hidden={!showEarly}>
      {showEarly && (sections.early.length ? renderResults(sections.early,sections.earlyTotal) :
        <Typography color="text.secondary" sx={{fontSize:"0.65rem",px:0.5,mb:0.5}}>No early signals.</Typography>)}
    </div>
  </Box>;
}
