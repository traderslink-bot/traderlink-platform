'use client';
import {Box,Button,Checkbox,Dialog,DialogActions,DialogContent,DialogTitle,Drawer,FormControlLabel,IconButton,MenuItem,Stack,Snackbar,TextField,Tooltip,Typography} from '@mui/material';
import DashboardCustomizeOutlined from '@mui/icons-material/DashboardCustomizeOutlined';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import DragIndicator from '@mui/icons-material/DragIndicator';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import UnfoldMore from '@mui/icons-material/UnfoldMore';
import {useEffect,useRef,useState,type RefObject} from 'react';
import {createPortal} from 'react-dom';
import {widgets,widgetNames} from './scanner-desktop-layout';
import {MOBILE_STACKED_CARD_LIMIT,moveMobileCard,toggleMobileCard,type MobileLayout,type MobileOrientation} from './scanner-mobile-layout';
import type {useMobileWorkspaceLayout} from './use-mobile-workspace-layout';
import type {WorkspaceCardWidget as Widget} from '../scanner-workspace-layout';
import {AddWorkspaceCardButton,type AddWorkspaceCardOptions} from './scanner-layout-editor';
function MobileHeightField({height,onChange}:{height:number;onChange:(value:number)=>void}){
 const [text,setText]=useState<string|null>(null),[invalid,setInvalid]=useState(false);
 const commit=(value:string)=>{const n=Number(value);if(value.trim()&&Number.isFinite(n)&&n>=35&&n<=300){onChange(n/100);setText(null);setInvalid(false);}else setInvalid(true);};
 return <TextField label="Height (%)" type="number" size="small" value={text??Math.round(height*100)} sx={{width:112}} error={invalid} helperText={invalid?'Use 35–300%':undefined}
  slotProps={{htmlInput:{min:35,max:300,step:"any",required:true}}} onChange={e=>{setText(e.target.value);setInvalid(false);}}
  onBlur={e=>{if(text!==null)commit(e.target.value);}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit((e.target as HTMLInputElement).value);}else if(e.key==='Escape'&&text!==null){e.stopPropagation();setText(null);setInvalid(false);}}}/>;
}
export function MobileWorkspaceLayoutEditor({addCard,editor,orientation}:{addCard:AddWorkspaceCardOptions;editor:ReturnType<typeof useMobileWorkspaceLayout>;orientation:MobileOrientation}){
 const [replaceName,setReplaceName]=useState<string|null>(null);
 const [open,setOpen]=useState(false),[target,setTarget]=useState<Widget|null>(null);const trigger=useRef<HTMLButtonElement>(null);
 const scrollArea=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number}|null>(null),dragFrame=useRef(0);
 const stopDrag=()=>{drag.current=null;cancelAnimationFrame(dragFrame.current);setTarget(null);};
 useEffect(()=>()=>cancelAnimationFrame(dragFrame.current),[]);
 const updateTarget=(x:number,y:number)=>{const hit=document.elementFromPoint(x,y)?.closest('[data-mobile-editor-card]')?.getAttribute('data-mobile-editor-card') as Widget|null;setTarget(hit&&editor.layout.order.includes(hit)?hit:null);};
 const tick=()=>{const point=drag.current,area=scrollArea.current;if(!point||!area)return;const rect=area.getBoundingClientRect();const distance=point.y<rect.top+40?-10:point.y>rect.bottom-40?10:0;if(distance){area.scrollTop+=distance;updateTarget(point.x,point.y);}dragFrame.current=requestAnimationFrame(tick);};
 const close=()=>{stopDrag();setOpen(false);requestAnimationFrame(()=>trigger.current?.focus());};
 const save=()=>{const invalid=Array.from(scrollArea.current?.querySelectorAll('input')??[]).find(input=>!input.checkValidity());if(invalid){invalid.reportValidity();invalid.focus();return;}if(editor.name.trim()!==editor.selectedName&&editor.lane.layouts.some(l=>l.name===editor.name.trim())){setReplaceName(editor.name.trim());return;}if(editor.save())close();};
 const change=editor.update,layout=editor.layout;
 const actions=<Stack direction="row" spacing={0.5}>
  <Button variant="outlined" color="inherit" size="small" onClick={()=>{editor.cancel();close();}}>Cancel</Button>
  <Button variant="contained" size="small" disabled={!editor.name.trim()} onClick={save}>Save</Button>
 </Stack>;
 return <>
  <Tooltip title={editor.editing?'Layout settings':'Edit layout'}><IconButton ref={trigger} aria-label={editor.editing?'Layout settings':'Edit layout'} aria-expanded={open} disabled={!editor.ready}
   onClick={()=>{if(!editor.editing)editor.start();setOpen(true);}}><DashboardCustomizeOutlined fontSize="small"/></IconButton></Tooltip>
  {editor.editing&&<>
   <Tooltip title="Cancel layout changes"><IconButton aria-label="Cancel" onClick={()=>{editor.cancel();close();}}><CloseRounded/></IconButton></Tooltip>
   <Tooltip title="Save layout"><Box component="span"><IconButton aria-label="Save" disabled={!editor.name.trim()} onClick={save}><CheckRounded/></IconButton></Box></Tooltip>
  </>}
  <Snackbar open={!open&&Boolean(editor.error)} message={editor.error} onClose={editor.clearError} action={<IconButton aria-label="Dismiss layout save message" color="inherit" onClick={editor.clearError}><CloseRounded/></IconButton>}/>
  <Drawer anchor="bottom" open={open} onClose={close} slotProps={{paper:{role:'dialog','aria-modal':true,'aria-label':`Mobile ${orientation} layout`,sx:{maxHeight:'85dvh',borderRadius:0}}}}>
   <Stack direction="row" sx={{alignItems:'center',justifyContent:'space-between',px:1.5,py:0.5,flexShrink:0}}>
    <Typography component="h2" sx={{fontWeight:700,fontSize:16}}>Mobile {orientation} layout</Typography>
    <IconButton aria-label="Close layout settings" onClick={close}><CloseRounded/></IconButton>
   </Stack>
   <Stack ref={scrollArea} spacing={1.5} sx={{px:1.5,pb:'max(16px,env(safe-area-inset-bottom))',overflowY:'auto',minHeight:0}}>
    <Stack direction="row" spacing={1} sx={{flexWrap:'wrap',rowGap:1}}>
     <TextField select label="Saved layout" size="small" slotProps={{inputLabel:{shrink:true},select:{displayEmpty:true}}} value={editor.selectedName} onChange={e=>editor.select(e.target.value)} sx={{width:170}}>
      {!editor.lane.layouts.some(l=>l.name==='')&&<MenuItem value="">Default</MenuItem>}{editor.lane.layouts.map(l=><MenuItem key={l.name} value={l.name}>{l.name||'Default'}</MenuItem>)}
     </TextField>
     <TextField label="Layout name" size="small" value={editor.name} onChange={e=>editor.setName(e.target.value)} slotProps={{htmlInput:{maxLength:40}}} sx={{width:170,maxWidth:'100%'}}/>
    </Stack>
    <Stack direction="row" spacing={1}>
     <TextField select label="View" size="small" value={layout.mode} onChange={e=>change({...layout,mode:e.target.value as MobileLayout['mode']})} sx={{width:130}}><MenuItem value="tabs">Tabs</MenuItem><MenuItem value="stacked" disabled={layout.order.length>MOBILE_STACKED_CARD_LIMIT}>Stacked</MenuItem></TextField>
     {orientation==='landscape'&&<TextField select label="Columns" size="small" value={layout.columns} onChange={e=>change({...layout,columns:Number(e.target.value) as 1|2})} sx={{width:100}}><MenuItem value={1}>1</MenuItem><MenuItem value={2}>2</MenuItem></TextField>}
    </Stack>
    <Typography variant="caption">Tabs fills the screen. Card heights and columns apply to Stacked.</Typography>
    {(layout.order.length>MOBILE_STACKED_CARD_LIMIT||
      layout.order.length===MOBILE_STACKED_CARD_LIMIT&&layout.mode==='stacked')&&<Typography variant="caption" color="text.secondary">
      {layout.order.length>MOBILE_STACKED_CARD_LIMIT?"Mobile layouts with more than seven cards use Tabs.":"Adding another card switches the mobile layout to Tabs."}
    </Typography>}
    <AddWorkspaceCardButton {...addCard}/>
    <Box role="list" aria-label="Mobile card order">
     {[...layout.order,...widgets.filter(w=>!layout.order.includes(w))].map(widget=>{const index=layout.order.indexOf(widget),visible=index>=0;
      return <Box role="listitem" key={widget} data-mobile-editor-card={widget} sx={{border:1,borderColor:target===widget?'primary.main':'divider',p:0.5,mb:0.5}}>
       <Stack direction="row" sx={{alignItems:'center',gap:0.25}}>
        <IconButton aria-label={`Move ${widgetNames[widget]}`} disabled={!visible} sx={{touchAction:'none',cursor:'grab'}}
         onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY};dragFrame.current=requestAnimationFrame(tick);}}
         onPointerMove={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;drag.current={x:e.clientX,y:e.clientY};updateTarget(e.clientX,e.clientY);}}
         onPointerUp={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;e.currentTarget.releasePointerCapture(e.pointerId);if(target)change(moveMobileCard(layout,widget,target));stopDrag();}}
         onPointerCancel={stopDrag} onLostPointerCapture={stopDrag}><DragIndicator/></IconButton>
        <FormControlLabel sx={{m:0,flex:1,minWidth:0}} label={widgetNames[widget]} control={<Checkbox checked={visible} onChange={()=>change(toggleMobileCard(layout,widget))}/>}/>
        <IconButton aria-label={`Move ${widgetNames[widget]} up`} disabled={index<=0} onClick={()=>change(moveMobileCard(layout,widget,layout.order[index-1]))}><ArrowUpward fontSize="small"/></IconButton>
        <IconButton aria-label={`Move ${widgetNames[widget]} down`} disabled={!visible||index===layout.order.length-1} onClick={()=>change(moveMobileCard(layout,widget,layout.order[index+1]))}><ArrowDownward fontSize="small"/></IconButton>
       </Stack>
       {visible&&<Stack direction="row" spacing={1} sx={{ml:0.5,mt:0.75,alignItems:'center'}}>
        <MobileHeightField height={layout.heights[widget]??1} onChange={value=>change({...layout,heights:{...layout.heights,[widget]:value}})}/>
        {orientation==='landscape'&&layout.columns===2&&!layout.wide.includes(widget)&&<TextField select size="small" label="Column" value={layout.placement?.[widget]??'auto'} sx={{width:110}} onChange={e=>{const placement={...layout.placement};if(e.target.value==='auto')delete placement[widget];else placement[widget]=Number(e.target.value) as 1|2;change({...layout,placement});}}><MenuItem value="auto">Auto</MenuItem><MenuItem value={1}>Left</MenuItem><MenuItem value={2}>Right</MenuItem></TextField>}
        {orientation==='landscape'&&layout.columns===2&&<FormControlLabel label="Full width" control={
          <Checkbox checked={layout.wide.includes(widget)} onChange={(_,wide)=>change({...layout,wide:wide?[...layout.wide,widget]:layout.wide.filter(w=>w!==widget)})}/>
        }/>}
       </Stack>}
      </Box>;
     })}
    </Box>
    {editor.error&&<Typography role="status" color="error" variant="caption">{editor.error}</Typography>}
    <Stack direction="row" spacing={1} sx={{flexWrap:'wrap',rowGap:1}}><Button variant="outlined" color="inherit" disabled={!editor.canUndo} onClick={editor.undo}>Undo</Button><Button variant="outlined" color="inherit" onClick={editor.reset}>Reset to default</Button>{actions}</Stack>
   </Stack>
  </Drawer>
  <Dialog open={replaceName!==null} onClose={()=>setReplaceName(null)} aria-labelledby="replace-mobile-layout-title">
   <DialogTitle id="replace-mobile-layout-title">Replace saved layout?</DialogTitle>
   <DialogContent>Replace “{replaceName}” with this arrangement?</DialogContent>
   <DialogActions><Button variant="outlined" color="inherit" onClick={()=>setReplaceName(null)}>Cancel</Button><Button variant="outlined" color="error" onClick={()=>{setReplaceName(null);if(editor.save())close();}}>Replace</Button></DialogActions>
  </Dialog>
 </>;
}
export function MobileCardResizeHandles({rootRef,layout,viewport,onChange}:{rootRef:RefObject<HTMLDivElement|null>;layout:MobileLayout;viewport:number;onChange:(layout:MobileLayout)=>void}){
 const gesture=useRef<{widget:Widget;y:number;height:number;next:number}|null>(null);const [outline,setOutline]=useState<{widget:Widget;height:number;left:number;top:number;width:number}|null>(null);
 const [cards,setCards]=useState<{widget:Widget;card:HTMLElement}[]>([]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>{const root=rootRef.current;setCards(root?layout.order.flatMap(widget=>{const card=root.querySelector<HTMLElement>(`[data-scanner-workspace-card="${widget}"]`);return card?[{widget,card}]:[];}):[]);});return()=>cancelAnimationFrame(frame);},[rootRef,layout.order]);
 return <>{outline&&cards.filter(item=>item.widget===outline.widget).map(({card})=>createPortal(<Box key="resize-outline" sx={{position:'absolute',left:outline.left,top:outline.top,width:outline.width,height:outline.height,border:'2px solid',borderColor:'primary.main',pointerEvents:'none',zIndex:8}}/>,card.parentElement!))}{cards.map(({widget,card})=>{
 return createPortal(<>
  <Tooltip title={`Resize ${widgetNames[widget]}`}><IconButton aria-label={`Resize ${widgetNames[widget]} height`} sx={{position:'absolute',bottom:0,left:'calc(50% - 22px)',width:44,height:36,zIndex:9,touchAction:'none',bgcolor:'background.paper',border:1,borderColor:'divider',borderRadius:0}}
   onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);const height=card.getBoundingClientRect().height;gesture.current={widget,y:e.clientY,height,next:height};}}
   onPointerMove={e=>{const g=gesture.current;if(!g||!e.currentTarget.hasPointerCapture(e.pointerId))return;g.next=Math.max(viewport*.35,Math.min(viewport*3,g.height+e.clientY-g.y));setOutline({widget,height:g.next,left:card.offsetLeft,top:card.offsetTop,width:card.offsetWidth});}}
   onPointerUp={e=>{const g=gesture.current;if(!g||!e.currentTarget.hasPointerCapture(e.pointerId))return;gesture.current=null;setOutline(null);e.currentTarget.releasePointerCapture(e.pointerId);onChange({...layout,heights:{...layout.heights,[widget]:g.next/viewport}});}}
   onPointerCancel={()=>{gesture.current=null;setOutline(null);}} onLostPointerCapture={()=>{gesture.current=null;setOutline(null);}}
   onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();onChange({...layout,heights:{...layout.heights,[widget]:Math.max(.35,Math.min(3,(layout.heights[widget]??1)+(e.key==='ArrowUp'?-.05:.05)))}});}else if(e.key==='Escape'){gesture.current=null;setOutline(null);}}}><UnfoldMore/></IconButton></Tooltip>
 </>,card,widget);
 })}</>;
}
