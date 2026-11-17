"use client";

import { Box, Button, Checkbox, ClickAwayListener, FormControlLabel, IconButton, Paper, Popper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import DashboardCustomizeOutlined from "@mui/icons-material/DashboardCustomizeOutlined";
import DragIndicator from "@mui/icons-material/DragIndicator";
import ViewQuiltOutlined from "@mui/icons-material/ViewQuiltOutlined";
import { useRef, useState, type PointerEvent } from "react";
import { widgetNames, widgets } from "./scanner-desktop-layout";
import { minimum, presets, type Edge, type Rect, type Tile } from "./scanner-split-layout";
import { cardAtPoint, cardEntries, cardFits, layoutSize, moveCard, type CardLayout } from "./scanner-free-layout";
import type { ScannerWorkspaceWidget as Widget } from "../scanner-workspace-layout";

import type { ScannerView } from "./scanner-stock-cards";
import type { CardScanners, ScannerCardKind } from "./workspace-scanner-title";

export type CardViews = Partial<Record<ScannerCardKind, ScannerView>>;
export type NamedLayout = { name: string; rectangles: CardLayout; scanners?: CardScanners; views?: CardViews };
const edges: Edge[] = ["top", "right", "bottom", "left"];
const placement = (rect: Rect) => ({
  position:"absolute" as const, left:`${rect.x / 10}%`, top:`${rect.y / 10}%`,
  width:`${rect.w / 10}%`, height:`${rect.h / 10}%`,
});
const clamp = (value:number, minimum:number, maximum:number) => Math.max(minimum, Math.min(maximum,value));

export function ScannerLayoutHandles({rectangles,onChange,onMessage}:{
  rectangles:CardLayout; onChange:(next:CardLayout)=>void; onMessage:(message:string)=>void;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ widget:Widget; edge?:Edge; start:Rect; x:number; y:number; pointerId:number; next?:CardLayout|null } | null>(null);
  const [preview,setPreview] = useState<CardLayout|null>(null);
  const stop = (commit:boolean,pointerId?:number) => {
    const active=gesture.current;
    if(!active||(pointerId!==undefined&&active.pointerId!==pointerId))return;
    gesture.current=null;
    setPreview(null);
    if(commit&&active.next&&active.next!==rectangles)onChange(active.next);
  };
  const start = (event:PointerEvent<HTMLButtonElement>,widget:Widget,rect:Rect,edge?:Edge) => {
    if(event.button!==0||gesture.current)return;
    onMessage("");
    gesture.current={widget,start:rect,edge,x:event.clientX,y:event.clientY,pointerId:event.pointerId};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const resize = (widget:Widget,r:Rect,dx:number,dy:number,edge:Edge,bounds:DOMRect) => {
    const size=minimum(widget);
    const minW=Math.min(r.w,size.w/bounds.width*layoutSize);
    const minH=Math.min(r.h,size.h/bounds.height*layoutSize);
    const next={...r};
    if(edge==="top"){next.y=clamp(r.y+dy,0,r.y+r.h-minH);next.h=r.h+r.y-next.y;}
    if(edge==="bottom")next.h=clamp(r.h+dy,minH,layoutSize-r.y);
    if(edge==="left"){next.x=clamp(r.x+dx,0,r.x+r.w-minW);next.w=r.w+r.x-next.x;}
    if(edge==="right")next.w=clamp(r.w+dx,minW,layoutSize-r.x);
    if(cardFits(rectangles,widget,next))return next;
    // Edge expansion is monotonic, so stop at the first neighbor.
    let lo=0,hi=1;
    const at=(ratio:number)=>({x:r.x+(next.x-r.x)*ratio,y:r.y+(next.y-r.y)*ratio,
      w:r.w+(next.w-r.w)*ratio,h:r.h+(next.h-r.h)*ratio});
    for(let i=0;i<24;i++){
      const mid=(lo+hi)/2;
      if(cardFits(rectangles,widget,at(mid)))lo=mid;
      else hi=mid;
    }
    return at(lo);
  };
  const update = (event:PointerEvent<HTMLButtonElement>) => {
    const active=gesture.current;
    const box=layer.current?.getBoundingClientRect();
    if(!active||active.pointerId!==event.pointerId||!box?.width||!box.height)return false;
    const dx=(event.clientX-active.x)/box.width*layoutSize;
    const dy=(event.clientY-active.y)/box.height*layoutSize;
    if(active.edge){
      const rect=resize(active.widget,active.start,dx,dy,active.edge,box);
      active.next=cardFits(rectangles,active.widget,rect)?{...rectangles,[active.widget]:rect}:null;
    }else{
      const target=cardAtPoint(rectangles,(event.clientX-box.left)/box.width*layoutSize,(event.clientY-box.top)/box.height*layoutSize);
      active.next=moveCard(rectangles,active.widget,active.start.x+dx,active.start.y+dy,{w:box.width,h:box.height},target);
    }
    setPreview(active.next);
    return true;
  };
  const pointer={onPointerMove:update,onPointerUp:(event:PointerEvent<HTMLButtonElement>)=>{
    if(!update(event))return;
    if(!gesture.current?.next)onMessage("Choose an open space or a slot that fits both cards.");
    stop(true,event.pointerId);
  },onPointerCancel:(event:PointerEvent<HTMLButtonElement>)=>stop(false,event.pointerId),
  onLostPointerCapture:(event:PointerEvent<HTMLButtonElement>)=>stop(false,event.pointerId)};
  return <Box ref={layer} onKeyDown={event=>{if(event.key==="Escape")stop(false);}}
    sx={{position:"absolute",inset:0,zIndex:5,pointerEvents:"none",outline:"1px dashed",outlineColor:"divider"}}>
    {cardEntries(rectangles).map(([widget,rect])=><Box key={widget} sx={placement(rect)}>
      <Tooltip title={`Move ${widgetNames[widget]}`}>
        <IconButton aria-label={`Move ${widgetNames[widget]}`} {...pointer}
          onPointerDown={event=>start(event,widget,rect)}
          onKeyDown={event=>{
            const dx=Number(event.key==="ArrowRight")-Number(event.key==="ArrowLeft");
            const dy=Number(event.key==="ArrowDown")-Number(event.key==="ArrowUp");
            const box=layer.current?.getBoundingClientRect();
            if((!dx&&!dy)||!box?.width||!box.height)return;
            event.preventDefault();
            const bounds={w:box.width,h:box.height};
            const x=rect.x+dx*8,y=rect.y+dy*8;
            const target=cardAtPoint(rectangles,rect.x+(dx<0?-8:dx>0?rect.w+8:rect.w/2),
              rect.y+(dy<0?-8:dy>0?rect.h+8:rect.h/2));
            const next=moveCard(rectangles,widget,x,y,bounds)??moveCard(rectangles,widget,x,y,bounds,target);
            if(next&&next!==rectangles)onChange(next);
          }}
          sx={{position:"absolute",top:0,left:0,width:30,height:30,zIndex:1,cursor:"grab",
            pointerEvents:"auto",touchAction:"none",bgcolor:"background.paper",border:1,borderColor:"divider",borderRadius:0}}>
          <DragIndicator fontSize="small"/>
        </IconButton>
      </Tooltip>
      {edges.map(edge=>{
        const vertical=edge==="left"||edge==="right";
        return <Box component="button" type="button" key={edge}
          aria-label={`Resize ${widgetNames[widget]} ${edge} edge`} {...pointer}
          onPointerDown={event=>start(event,widget,rect,edge)}
          onKeyDown={event=>{
            const delta=vertical?Number(event.key==="ArrowRight")-Number(event.key==="ArrowLeft"):
              Number(event.key==="ArrowDown")-Number(event.key==="ArrowUp");
            const box=layer.current?.getBoundingClientRect();
            if(!delta||!box?.width||!box.height)return;
            event.preventDefault();
            const next=resize(widget,rect,vertical?delta*8:0,vertical?0:delta*8,edge,box);
            onChange({...rectangles,[widget]:next});
          }}
          sx={{position:"absolute",[edge]:0,...(vertical?{top:16,bottom:16,width:8}:{left:16,right:16,height:8}),
            pointerEvents:"auto",touchAction:"none",cursor:vertical?"col-resize":"row-resize",
            p:0,border:0,bgcolor:"transparent","&:hover,&:focus-visible":{bgcolor:"primary.main"}}}/>;
      })}
    </Box>)}
    {preview&&cardEntries(preview).filter(([widget,rect])=>rect!==rectangles[widget]).map(([widget,rect])=>
      <Box key={widget} sx={{...placement(rect),boxSizing:"border-box",border:"2px solid",borderColor:"primary.main"}}/>)}
  </Box>;
}

export function ScannerLayoutToolbar({editing,name,active,setName,saved,visible,onToggle,message,onEdit,onSelect,onSave,onCancel,onReset,onPreset,onUndo,canUndo,mobile=false}:{
  mobile?:boolean;editing:boolean;name:string;active:string;setName:(name:string)=>void;saved:NamedLayout[];
  visible:Widget[];onToggle:(widget:Widget)=>void;message:string;
  onPreset:(tile:Tile)=>void;onUndo:()=>void;canUndo:boolean;
  onEdit:()=>void;onSelect:(name:string)=>void;onSave:()=>void;onCancel:()=>void;onReset:()=>void;
}) {
  const [anchor,setAnchor]=useState<HTMLButtonElement|null>(null);
  const close=()=>setAnchor(null);
  const actions=<Stack direction="row" spacing={0.5} sx={{alignItems:"center"}}>
      <Button size="small" variant="outlined" color="inherit" onClick={()=>{onCancel();close();}}
        sx={theme=>({
          color:theme.palette.text.primary,
          borderColor:theme.palette.mode==="dark"?theme.palette.traderLink.chart.controlText:theme.palette.text.secondary,
          "&:hover":{bgcolor:theme.palette.action.hover,borderColor:theme.palette.text.primary},
        })}>Cancel</Button>
      <Button size="small" variant="contained" onClick={()=>{onSave();close();}} disabled={!name.trim()}
        sx={theme=>({
          border:"1px solid",
          borderColor:theme.palette.mode==="dark"?theme.palette.primary.light:theme.palette.primary.main,
          "&.Mui-disabled":{
            bgcolor:theme.palette.action.disabledBackground,
            color:theme.palette.traderLink.chart.controlText,
            borderColor:theme.palette.mode==="dark"?theme.palette.traderLink.chart.controlText:theme.palette.text.secondary,
          },
        })}>Save</Button>
    </Stack>;
  return <>
    <Tooltip title={editing?"Layout settings":"Edit layout"}>
      <IconButton aria-label={editing?"Layout settings":"Edit layout"} aria-expanded={Boolean(anchor)}
        sx={{"@media(max-width:359px)":{"&&":{minWidth:34,width:34,p:0}}}}
        onClick={event=>{if(!editing)onEdit();setAnchor(anchor?null:event.currentTarget);}}>
        {editing?<ViewQuiltOutlined fontSize="small"/>:<DashboardCustomizeOutlined fontSize="small"/>}
      </IconButton>
    </Tooltip>
    {editing&&!mobile&&actions}
    <Popper open={Boolean(anchor)} anchorEl={anchor} placement="bottom-start" sx={{zIndex:1299}}>
      <ClickAwayListener onClickAway={close}>
        <Paper aria-label="Layout settings" role="region" onKeyDown={event=>{
          if(event.key==="Escape"){anchor?.focus();close();}
        }} sx={{p:1.5,mt:0.5,width:270,maxWidth:"calc(100vw - 16px)",maxHeight:"70dvh",overflowY:"auto",border:1,borderColor:"divider"}}>
          <Stack spacing={1}>
            {saved.length>0&&<TextField select label="Layout" size="small" slotProps={{select:{native:true}}} value={active}
              onChange={event=>onSelect(event.target.value)}>
              <option value="">Default</option>
              {saved.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}
            </TextField>}
            <TextField select label="Preset" size="small" slotProps={{inputLabel:{shrink:true},select:{native:true}}} value="" onChange={event=>{
              const preset=presets.find(item=>item.name===event.target.value);
              if(preset)onPreset(preset.tile);
            }}>
              <option value="" disabled>Choose a starting layout</option>
              {presets.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}
            </TextField>
            <TextField label="Layout name" size="small" value={name} onChange={event=>setName(event.target.value)}
              slotProps={{htmlInput:{maxLength:40}}}/>
            <Stack role="group" aria-label="Visible cards">
              <Typography variant="caption" sx={{fontWeight:700}}>Visible cards</Typography>
              {widgets.map(widget=><FormControlLabel key={widget} label={widgetNames[widget]} sx={{m:0}}
                control={<Checkbox size="small" checked={visible.includes(widget)} onChange={()=>onToggle(widget)}/>}/>)}
              {message&&<Typography role="status" variant="caption" color="error">{message}</Typography>}
            </Stack>
            <Button size="small" disabled={!canUndo} color="inherit" onClick={onUndo} sx={{alignSelf:"flex-start"}}>Undo</Button>
            <Button size="small" variant="outlined" color="inherit" onClick={onReset} sx={{alignSelf:"flex-start"}}>Reset to default</Button>
            {editing&&mobile&&actions}
          </Stack>
        </Paper>
      </ClickAwayListener>
    </Popper>
  </>;
}
