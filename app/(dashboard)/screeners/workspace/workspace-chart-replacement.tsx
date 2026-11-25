"use client";

import { useId } from "react";
import { Dialog, DialogTitle, MenuItem, MenuList } from "@mui/material";
import type { ChartMultiview } from "@/src/modules/scanner/alpaca/chart-multiview";
import { workspaceChartPanels } from "./workspace-chart-panels";

export function WorkspaceChartReplacement({ request, onClose, onReplace }: {
  request: { symbol: string; layout: ChartMultiview } | null;
  onClose: () => void;
  onReplace: (panelId: string) => void;
}) {
  const titleId = useId();

  return <Dialog open={request !== null} onClose={onClose} aria-labelledby={titleId}
    slotProps={{ paper: { sx: { width: 264, maxWidth: "calc(100% - 24px)", m: 1.5 } } }}>
    <DialogTitle id={titleId} sx={{ px: 2, py: 1, fontSize: 15 }}>
      Open {request?.symbol} in place of…
    </DialogTitle>
    <MenuList aria-labelledby={titleId} autoFocusItem={request !== null} dense disablePadding sx={{ pb: 0.5 }}>
      {request && workspaceChartPanels(request.layout).map(({ group, panel }) =>
        <MenuItem key={panel.id} onClick={() => onReplace(panel.id)} sx={{ minHeight: 44, px: 2 }}>
          {group.symbol} · {panel.timeframe}
        </MenuItem>)}
    </MenuList>
  </Dialog>;
}
