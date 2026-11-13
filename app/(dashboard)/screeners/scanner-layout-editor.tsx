"use client";

import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { desktopRows, placeCard, widgetNames, widgets, type DesktopPositions } from "./scanner-desktop-layout";
import type { ScannerWorkspaceWidget } from "./scanner-workspace-layout";

export type NamedLayout={name:string;positions:DesktopPositions};
type Gesture={widget:ScannerWorkspaceWidget;resize:boolean;x:number;y:number;stepX:number;stepY:number;gapX:number;gapY:number;next:DesktopPositions|null};

export function ScannerLayoutHandles({ positions,onChange }: {positions:DesktopPositions;onChange:(next:DesktopPositions)=>void}) {
  const layer=useRef<HTMLDivElement>(null);
  const outline=useRef<HTMLDivElement>(null);
  const gesture=useRef<Gesture|null>(null);
  const [status,setStatus]=useState("");
  const finish=(commit:boolean)=>{
    const active=gesture.current;
    gesture.current=null;
    if(outline.current)outline.current.hidden=true;
    if(commit&&active){
      if(active.next)onChange(active.next);
      setStatus(active.next?"": "That position is occupied or outside the grid.");
    }
  };
  const update=(event:PointerEvent)=>{
    const active=gesture.current,node=outline.current;
    if(!active||!node)return;
    const p=positions[active.widget];
    const dx=Math.round((event.clientX-active.x)/active.stepX),dy=Math.round((event.clientY-active.y)/active.stepY);
    const target=active.resize
      ? {...p,w:Math.max(1,Math.min(4-p.x,p.w+dx)),h:Math.max(1,Math.min(4-p.y,p.h+dy))}
      : {...p,x:Math.max(0,Math.min(4-p.w,p.x+dx)),y:Math.max(0,Math.min(4-p.h,p.y+dy))};
    active.next=placeCard(positions,active.widget,target,active.resize);
    Object.assign(node.style,{left:`${target.x*active.stepX}px`,top:`${target.y*active.stepY}px`,
      width:`${target.w*active.stepX-active.gapX}px`,height:`${target.h*active.stepY-active.gapY}px`,
      borderColor:active.next?"":"var(--scanner-layout-invalid,#d32f2f)"});
    node.hidden=false;
  };
  const start=(event:PointerEvent<HTMLButtonElement>,widget:ScannerWorkspaceWidget,resize:boolean)=>{
    if(event.button!==0||!layer.current)return;
    const grid=layer.current.parentElement!;
    const {columnGap,rowGap}=getComputedStyle(grid);
    const gapX=parseFloat(columnGap)||0,gapY=parseFloat(rowGap)||0;
    const bounds=layer.current.getBoundingClientRect();
    gesture.current={widget,resize,x:event.clientX,y:event.clientY,stepX:(bounds.width+gapX)/4,
      stepY:(bounds.height+gapY)/desktopRows(positions),gapX,gapY,next:null};
    event.currentTarget.setPointerCapture(event.pointerId);
    update(event);
  };
  const key=(event:KeyboardEvent,widget:ScannerWorkspaceWidget,resize:boolean)=>{
    const dx=Number(event.key==="ArrowRight")-Number(event.key==="ArrowLeft");
    const dy=Number(event.key==="ArrowDown")-Number(event.key==="ArrowUp");
    if(!dx&&!dy)return;
    event.preventDefault();
    const p=positions[widget];
    const next=placeCard(positions,widget,resize?{...p,w:p.w+dx,h:p.h+dy}:{...p,x:p.x+dx,y:p.y+dy},resize);
    if(next)onChange(next);
    setStatus(next?"":"That position is occupied or outside the grid.");
  };
  return <Box ref={layer} sx={{position:"absolute",inset:0,display:"grid",gridTemplateColumns:"inherit",gridTemplateRows:"inherit",
    gap:"inherit",pointerEvents:"none",zIndex:5}}>
    {widgets.map(widget=>{
      const p=positions[widget];
      return <Box key={widget} sx={{gridColumn:`${p.x+1} / span ${p.w}`,gridRow:`${p.y+1} / span ${p.h}`,
        position:"relative",border:1,borderColor:"divider",minWidth:0}}>
        {[false,true].map(resize=><Button key={String(resize)} size="small" variant="contained"
          aria-label={`${resize?"Resize":"Move"} ${widgetNames[widget]}`}
          onPointerDown={e=>start(e,widget,resize)} onPointerMove={update} onPointerUp={e=>{update(e);finish(true);}}
          onPointerCancel={()=>finish(false)} onLostPointerCapture={()=>finish(false)} onKeyDown={e=>key(e,widget,resize)}
          sx={{position:"absolute",right:4,...(resize?{bottom:4}:{top:4}),pointerEvents:"auto",touchAction:"none",
            cursor:resize?"nwse-resize":"move",minWidth:0,textTransform:"none"}}>{resize?"Resize":"Move"}</Button>)}
      </Box>;
    })}
    <Box ref={outline} hidden data-scanner-layout-outline sx={{position:"absolute",border:"2px dashed",borderColor:"primary.main",zIndex:2}}/>
    <Box role="status" sx={{position:"absolute",width:1,height:1,overflow:"hidden",clipPath:"inset(50%)"}}>{status}</Box>
  </Box>;
}

export function ScannerLayoutToolbar({editing,name,setName,saved,onEdit,onSelect,onSave,onCancel,onReset}:{
  editing:boolean;name:string;setName:(name:string)=>void;saved:NamedLayout[];
  onEdit:()=>void;onSelect:(name:string)=>void;onSave:()=>void;onCancel:()=>void;onReset:()=>void;
}) {
  return <Stack direction="row" sx={{alignItems:"center",justifyContent:"flex-end",gap:0.75,mb:0.6,flexWrap:"wrap"}}>
    {editing?<><Typography variant="caption" sx={{mr:"auto"}}>Drag Move or Resize, or use the arrow keys on a handle.</Typography>
      <TextField label="Layout name" size="small" value={name} onChange={e=>setName(e.target.value)} slotProps={{htmlInput:{maxLength:40}}}/>
      <Button size="small" onClick={onReset}>Reset to default</Button>
      <Button size="small" onClick={onCancel}>Cancel</Button>
      <Button size="small" variant="contained" onClick={onSave} disabled={!name.trim()}>Save</Button>
    </>:<>
      {saved.length>0&&<TextField select label="Layout" size="small" value={name} onChange={e=>onSelect(e.target.value)} sx={{minWidth:150}}>
        <MenuItem value="">Default</MenuItem>
        {saved.map(item=><MenuItem key={item.name} value={item.name}>{item.name}</MenuItem>)}
      </TextField>}
      <Button size="small" variant="outlined" onClick={onEdit}>Edit layout</Button>
    </>}
  </Stack>;
}
