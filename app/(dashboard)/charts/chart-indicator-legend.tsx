"use client";

import { useId, useState, type Ref } from "react";
import ArrowRight from "@mui/icons-material/ArrowRight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import type { IndicatorType } from "@/src/modules/scanner/alpaca/chart-preferences";

const indicatorName = (type: IndicatorType) => type === "Bollinger" ? "BOLL" : type;

/** Fold presentation only: retain the readout nodes used by the chart's live painter. */
export function ChartIndicatorLegend({ legendRef, types, hidden, compact, dark, openType, onOpenOptions }: {
  legendRef: Ref<HTMLDivElement>;
  types: readonly IndicatorType[];
  hidden: ReadonlySet<IndicatorType>;
  compact: boolean;
  dark: boolean;
  openType?: IndicatorType;
  onOpenOptions: (type: IndicatorType, anchor: HTMLElement) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const groupId = useId();
  const count = types.filter(type => !hidden.has(type)).length;
  const label = collapsed ? `Expand indicator details (${count})` : "Collapse indicator details";
  const color = dark ? "#e3e8ef" : "#243246";
  return <Box ref={legendRef} data-chart-indicator-legend sx={{
    position:"absolute",zIndex:1,top:compact?22:4,left:8,right:65,pointerEvents:"none",
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
      {types.map(type => <Box key={type} sx={{display:hidden.has(type)?"none":"flex",alignItems:"center",gap:0.6,minHeight:18,minWidth:0}}>
        <Button size="small" aria-haspopup="menu" aria-expanded={openType===type} aria-label={`${indicatorName(type)} options`}
          onClick={event => onOpenOptions(type,event.currentTarget)}
          sx={{pointerEvents:"auto",color,minWidth:0,minHeight:18,px:0.4,py:0,fontSize:11,lineHeight:1.25,fontWeight:700}}>
          {indicatorName(type)}
        </Button>
        <Box data-indicator-readout={type} sx={{display:"flex",gap:0.75,flexWrap:"wrap",minWidth:0,fontVariantNumeric:"tabular-nums","& span":{whiteSpace:"nowrap"}}}/>
      </Box>)}
    </Box>
  </Box>;
}
