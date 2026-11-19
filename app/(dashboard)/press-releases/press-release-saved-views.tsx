"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DEFAULT_NEWS_FILTERS, type NewsFilters } from "@/src/modules/news/contracts/press-release-filters";
import { newsViewFilterSummary, type SavedNewsView, type SaveNewsViewInput } from "@/src/modules/news/contracts/press-release-saved-views";
import { deletePressReleaseSavedView, readPressReleaseSavedViews, savePressReleaseSavedView, setPressReleaseViewAlerts } from "./press-release-view-actions";

type Result = {ok:true;views:readonly SavedNewsView[]}|{ok:false;message:string};
export function PressReleaseSavedViews({initialViews,currentFilters,onApply,initialSelectedId="",filtersAllowed=true,alertsAllowed=true}: {
  initialViews:readonly SavedNewsView[];currentFilters?:NewsFilters;onApply?:(filters:NewsFilters)=>void;
  initialSelectedId?:string;filtersAllowed?:boolean;alertsAllowed?:boolean;
}) {
  const [views,setViews]=useState(initialViews),[selectedId,setSelectedId]=useState(initialSelectedId),[panel,setPanel]=useState<"manage"|"edit"|"delete"|null>(null);
  const [editor,setEditor]=useState<SaveNewsViewInput|null>(null),[deleting,setDeleting]=useState<SavedNewsView|null>(null),[returnToManage,setReturnToManage]=useState(false);
  const [feedback,setFeedback]=useState<{text:string;error:boolean}|null>(null),[working,startTransition]=useTransition();
  const title=useRef<HTMLHeadingElement>(null);
  const selected=views.find(view=>view.id===selectedId);
  useEffect(()=>{if(panel==="manage")title.current?.focus();},[panel]);
  function perform(operation:()=>Promise<Result>,success:string,after?:(views:readonly SavedNewsView[])=>void) {
    setFeedback(null);startTransition(async()=>{try{const result=await operation();if(!result.ok){setFeedback({text:result.message,error:true});return;}setViews(result.views);setSelectedId(current=>result.views.some(view=>view.id===current)?current:"");setFeedback({text:success,error:false});after?.(result.views);}catch{setFeedback({text:"Your saved views could not be updated. Please try again.",error:true});}});
  }
  function edit(view:SavedNewsView|null,fromManage=false) {
    setEditor({id:view?.id??null,revision:view?.revision??null,name:view?.name??"",filters:fromManage?view?.filters??DEFAULT_NEWS_FILTERS:currentFilters??view?.filters??DEFAULT_NEWS_FILTERS,alertsEnabled:view?.alertsEnabled??false});
    setReturnToManage(fromManage && onApply!==undefined);setFeedback(null);setPanel("edit");
  }
  function submitEditor(){
    const document=editor;if(!document||working||!document.name.trim())return;
    perform(()=>savePressReleaseSavedView(document),"View saved to your account.",next=>{setSelectedId(next.find(view=>view.name===document.name.trim())?.id??selectedId);setPanel(returnToManage?"manage":null);});
  }
  function close(){if(!working){setPanel(null);setEditor(null);setDeleting(null);}}
  const list=<Stack spacing={1.25}>{views.length?views.map(view=><Box key={view.id} sx={{border:1,borderColor:"divider",borderRadius:1,p:1.5,minWidth:0}}>
    <Typography sx={{fontWeight:700,overflowWrap:"anywhere"}}>{view.name}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{overflowWrap:"anywhere",mt:0.5}}>{newsViewFilterSummary(view.filters)}</Typography>
    <FormControlLabel label={`Alerts for ${view.name}`} control={<Checkbox checked={view.alertsEnabled} disabled={working||(!alertsAllowed&&!view.alertsEnabled)} onChange={(_,enabled)=>perform(()=>setPressReleaseViewAlerts({id:view.id,revision:view.revision,enabled}),enabled?"Filtered alerts turned on.":"Filtered alerts turned off.")}/>}/>
    <Stack direction="row" useFlexGap sx={{gap:1,flexWrap:"wrap"}}>
      {onApply?<Button disabled={working||!filtersAllowed} onClick={()=>{setSelectedId(view.id);onApply(view.filters);close();}}>Use {view.name}</Button>:<Button component={Link} href={`/press-releases?view=${encodeURIComponent(view.id)}`}>Edit filters</Button>}
      <Button disabled={working||!filtersAllowed} onClick={()=>edit(view,true)}>Rename view</Button>
      <Button color="error" disabled={working} onClick={()=>{setDeleting(view);setReturnToManage(onApply!==undefined);setPanel("delete");}}>Delete view</Button>
    </Stack>
  </Box>):<Typography color="text.secondary">No saved views yet. Choose filters in Press Releases, then select Save view.</Typography>}</Stack>;
  const feedbackView=feedback?<Alert severity={feedback.error?"error":"success"} action={feedback.error?<Button color="inherit" disabled={working} onClick={()=>perform(readPressReleaseSavedViews,"Saved views refreshed.")}>Refresh views</Button>:undefined}>{feedback.text}</Alert>:null;
  return <Stack spacing={1} sx={{minWidth:0}}>
    {onApply?<Stack direction={{xs:"column",sm:"row"}} useFlexGap sx={{gap:1,alignItems:{sm:"center"}}}>
      {views.length?<TextField select size="small" label="Saved view" value={selectedId} disabled={working||!filtersAllowed} onChange={event=>{setSelectedId(event.target.value);const view=views.find(item=>item.id===event.target.value);if(view)onApply(view.filters);}} sx={{minWidth:190,flex:1}}><MenuItem value="">Current filters</MenuItem>{views.map(view=><MenuItem key={view.id} value={view.id}>{view.name}</MenuItem>)}</TextField>:null}
      <Button variant="outlined" disabled={working||!filtersAllowed} onClick={()=>edit(selected??null)}>{selected?"Update view":"Save view"}</Button>
      {selected?<Button disabled={working||!filtersAllowed} onClick={()=>edit(null)}>Save as new view</Button>:null}
      {views.length?<Button disabled={working} onClick={()=>setPanel("manage")}>Manage views</Button>:null}
    </Stack>:<>
      <Typography component="h3" variant="h3">Filtered press-release alerts</Typography>
      <Typography variant="body2" color="text.secondary">Each saved view can alert you about new matching releases, including a custom market-cap range. Use the device notification controls on this page to enable push on each device.</Typography>
      {list}
      <Button component={Link} href="/press-releases?customAlert=1" variant="outlined" sx={{alignSelf:"flex-start"}}>Create custom filtered alert</Button>
    </>}
    {!panel?feedbackView:null}
    <Dialog open={panel!==null} onClose={close} fullWidth maxWidth="sm" aria-labelledby="saved-news-view-title">
      <DialogTitle id="saved-news-view-title" ref={title} tabIndex={-1}>{panel==="manage"?"Saved press-release views":panel==="delete"?"Delete saved view?":editor?.id?"Update saved view":"Save press-release view"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {feedbackView}
          {panel==="manage"?list:null}
          {panel==="edit"&&editor?<>
            <TextField label="View name" autoFocus fullWidth value={editor.name} disabled={working} onChange={event=>setEditor({...editor,name:event.target.value})} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();submitEditor();}}} slotProps={{htmlInput:{maxLength:60}}}/>
            <Typography variant="body2" sx={{overflowWrap:"anywhere"}}>{newsViewFilterSummary(editor.filters as NewsFilters)}</Typography>
            <FormControlLabel label="Notify me about new matching releases" control={<Checkbox checked={editor.alertsEnabled} disabled={working||(!alertsAllowed&&!editor.alertsEnabled)} onChange={(_,alertsEnabled)=>setEditor({...editor,alertsEnabled})}/>}/>
            <Typography variant="body2" color="text.secondary">Alerts use this view’s matching criteria. Sort order and read status only change your feed. Existing channel alerts are managed separately in Settings.</Typography>
            <Link href="/account/preferences#push-notifications">Notification settings and device setup</Link>
          </>:null}
          {panel==="delete"?<Typography>Delete “{deleting?.name}” and stop its filtered alerts? Press releases and your other views are kept.</Typography>:null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{px:3,py:2,gap:1,flexWrap:"wrap"}}>
        <Button disabled={working} onClick={close}>{panel==="manage"?"Close":"Cancel"}</Button>
        {panel==="edit"&&editor?<Button disabled={working||!editor.name.trim()} variant="contained" onClick={submitEditor}>Save view</Button>:null}
        {panel==="delete"&&deleting?<Button disabled={working} variant="contained" color="error" onClick={()=>perform(()=>deletePressReleaseSavedView({id:deleting.id,revision:deleting.revision}),"Saved view deleted.",()=>{if(selectedId===deleting.id)setSelectedId("");setPanel(returnToManage?"manage":null);})}>Delete view</Button>:null}
      </DialogActions>
    </Dialog>
  </Stack>;
}
