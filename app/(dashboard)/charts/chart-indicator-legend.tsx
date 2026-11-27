"use client";

import { useId, useState } from "react";
import ArrowRight from "@mui/icons-material/ArrowRight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import { chartIndicatorCatalog, isVolumeProfile } from "@/src/modules/scanner/alpaca/chart-indicator-catalog";
import type { IndicatorType } from "@/src/modules/scanner/alpaca/chart-preferences";

const indicatorName = (type: IndicatorType) => chartIndicatorCatalog[type].short;

/** Fold presentation only: retain the readout nodes used by the chart's live painter. */
export function ChartIndicatorLegend({ paneId, types, hidden, dark, openType, onOpenOptions }: {
  paneId?: string;
  types: readonly IndicatorType[];
  hidden: ReadonlySet<IndicatorType>;
  dark: boolean;
  openType?: IndicatorType;
  onOpenOptions: (type: IndicatorType, anchor: HTMLElement) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const groupId = useId();
  const count = types.filter(type => !hidden.has(type)).length;
  const name = paneId && types.length === 1 ? indicatorName(types[0]) : "indicator";
  const label = collapsed ? `Expand ${name} details (${count})` : `Collapse ${name} details`;
  const color = dark ? "#e3e8ef" : "#243246";
  return <Box data-chart-indicator-legend data-chart-indicator-pane={paneId} sx={{
    position:"absolute",zIndex:1,top:paneId?"var(--chart-legend-pane-top, 0px)":22,
    left:8,right:"var(--chart-indicator-right, 65px)",pointerEvents:"none",
    ...(paneId ? { visibility:"var(--chart-legend-pane-visibility, hidden)", maxHeight:"var(--chart-legend-pane-height, 0px)", overflow:"hidden" } : {}),
    fontSize:11,lineHeight:1.25,display:"flex",alignItems:"flex-start",gap:0.25,
  }}>
    {count > 0 && <ButtonBase type="button" aria-label={label} title={label}
      aria-expanded={!collapsed} aria-controls={groupId} onClick={() => setCollapsed(value => !value)}
      sx={{pointerEvents:"auto",color,flexShrink:0,height:24,minWidth:22,pr:collapsed?0.5:0,
        gap:0.25,fontSize:11,fontWeight:700,"&.Mui-focusVisible":{outline:"2px solid",outlineOffset:1}}}>
      <ArrowRight aria-hidden="true" sx={{fontSize:18,transform:collapsed?"none":"rotate(90deg)"}}/>
      {collapsed && <Box component="span" sx={{fontVariantNumeric:"tabular-nums"}}>{count}</Box>}
    </ButtonBase>}
    <Box id={groupId} data-chart-indicator-details sx={{display:collapsed?"none":"flex",flexDirection:"column",gap:0,minWidth:0}}>
      {types.map(type => <Box key={type} sx={{display:hidden.has(type)?"none":"flex",alignItems:"flex-start",gap:0.6,minHeight:18,minWidth:0,
        ...(isVolumeProfile(type) && { flexWrap:"wrap", rowGap:0 })}}>
        <Button size="small" aria-haspopup="menu" aria-expanded={openType===type} aria-label={`${indicatorName(type)} options`} title={isVolumeProfile(type) ? indicatorName(type) : undefined}
          onClick={event => onOpenOptions(type,event.currentTarget)}
          sx={{pointerEvents:"auto",color,minWidth:0,minHeight:18,flexShrink:0,px:0.4,py:0,fontSize:11,lineHeight:1.25,fontWeight:700}}>
          {isVolumeProfile(type) ? <>
            <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
              {type === "VisibleVolumeProfile" ? "VRVP" : "SVP"}
            </Box>
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{indicatorName(type)}</Box>
          </> : indicatorName(type)}
        </Button>
        {isVolumeProfile(type) && <Box component="abbr" title="Estimated from candle volume" sx={{fontSize:10,textDecoration:"none"}}>
          <Box component="span" sx={{ display: { xs:"inline", sm:"none" } }}>Est.</Box>
          <Box component="span" sx={{ display: { xs:"none", sm:"inline" } }}>Estimated</Box>
        </Box>}
        <Box data-indicator-readout={type} sx={{display:"flex",gap:0.75,flexWrap:{xs:"nowrap",md:"wrap"},minWidth:0,minHeight:18,alignItems:"center",
          fontVariantNumeric:"tabular-nums",overflowX:{xs:"auto",md:"visible"},scrollbarWidth:"none",
          pointerEvents:{xs:"auto",md:"none"},"& span":{whiteSpace:"nowrap"},
          ...(isVolumeProfile(type) && { width:"max-content", maxWidth:"100%", "& > span":{ whiteSpace:"normal" } })}}/>
      </Box>)}
    </Box>
  </Box>;
}
