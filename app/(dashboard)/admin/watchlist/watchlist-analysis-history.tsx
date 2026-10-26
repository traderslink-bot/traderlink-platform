"use client";

import { useEffect,useState } from "react";
import dynamic from "next/dynamic";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { ownerPublishedAnalysisHistory,type OwnerPublishedHistory } from "@/src/lib/live-watchlist/owner-published-analysis-history";
import { formatAnalysisHistoryRow } from "@/src/lib/live-watchlist/analysis-publication-history";

const AnalysisCard=dynamic(()=>import("@/app/watchlist/live-watchlist-client").then(module=>module.TradersLinkAiReadCard),{loading:()=> <p role="status">Loading analysis card…</p>});

export function WatchlistAnalysisHistory({symbol,expectedCycleId,onClose}:{symbol:string;expectedCycleId:string;onClose:()=>void}) {
  const [history,setHistory]=useState<OwnerPublishedHistory|null>(null);
  const [selected,setSelected]=useState(0);
  const [error,setError]=useState("");
  const [attempt,setAttempt]=useState(0);
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    let disposed=false;
    const timeout=setTimeout(()=>controller.abort(),30000);
    void fetch("/api/admin/watchlist/runtime/watchlist/analysis-review?symbol="+encodeURIComponent(symbol),{method:"GET",cache:"no-store",credentials:"same-origin",signal:controller.signal})
      .then(async response=>{if(!response.ok) throw new Error("Saved analyses could not be loaded. Check your owner session and try again.");return response.json();})
      .then(value=>{if(controller.signal.aborted)return;const result=ownerPublishedAnalysisHistory(value,symbol);if(result.cycleId!==expectedCycleId)throw new Error("Watchlist activation changed.");setHistory(result);setSelected(0);})
      .catch(reason=>{if(disposed)return;if(reason instanceof Error&&reason.message==="Watchlist activation changed.")setError("This ticker has changed on the Watchlist. Close this view and reopen it from the updated ticker row.");else if(!controller.signal.aborted)setError("Saved analyses could not be loaded. Try again.");else setError("Loading timed out. Try again.");})
      .finally(()=>clearTimeout(timeout));
    return ()=>{disposed=true;clearTimeout(timeout);controller.abort();};
  },[symbol,expectedCycleId,attempt]);
  const version=history?.versions[selected];
  return <Dialog open onClose={onClose} fullWidth maxWidth="lg" fullScreen={expanded} aria-labelledby="previous-analyses-title" scroll="paper">
    <DialogTitle id="previous-analyses-title">{symbol} — Previous analyses</DialogTitle>
    <DialogContent>
      {error?<Alert severity="error" action={<Button onClick={()=>{setError("");setHistory(null);setAttempt(value=>value+1);}}>Retry</Button>}>{error}</Alert>:!history?<p role="status">Loading published analyses…</p>:null}
      {history?.incomplete?<Alert severity="info">Some earlier published cards are not available in this saved history. No replacement has been generated.</Alert>:null}
      {history&&!history.versions.length?<p>No published analysis is saved for this ticker’s current Watchlist activation.</p>:null}
      {history&&history.versions.length>0?<TextField select label="Published analysis" fullWidth margin="normal" value={selected} onChange={event=>setSelected(Number(event.target.value))}>
        {history.versions.map((item,index)=><MenuItem key={item.revision} value={index}>{formatAnalysisHistoryRow(item.historyRows.at(-1)!,index)}</MenuItem>)}
      </TextField>:null}
      {version?<Box sx={{width:"100%",maxWidth:1100,mx:"auto",py:1}}>
        <AnalysisCard card={version.card} traderNotes={version.traderNotes} symbol={{}} livePrice={null} dipBuyPlanVisible={version.dipBuyPlanVisible} failureRecoveryVisible={version.failureRecoveryVisible} historicalRows={version.historyRows} />
      </Box>:null}
    </DialogContent>
    <DialogActions><Button onClick={()=>setExpanded(value=>!value)}>{expanded?"Standard view":"Expand view"}</Button><Button onClick={onClose}>Close</Button></DialogActions>
  </Dialog>;
}
