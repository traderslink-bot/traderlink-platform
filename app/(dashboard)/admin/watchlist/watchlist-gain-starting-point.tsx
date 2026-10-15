'use client';
import { useCallback, useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { easternInput, easternCandidates } from '@/src/lib/live-watchlist/gain-start-time';
import { JOURNAL_ADMIN_REQUEST_HEADER } from '@/src/modules/platform/contracts/journal-admin-request';
import type { gainStartingPointView } from '@/src/lib/live-watchlist/gain-starting-point';
type View = ReturnType<typeof gainStartingPointView>;
const endpoint='/api/admin/watchlist/gain-starting-point';
export function WatchlistGainStartingPoint({symbol,onClose}:{symbol:string;onClose:()=>void}) {
  const [view,setView]=useState<View|null>(null),[price,setPrice]=useState(''),[time,setTime]=useState(''),[occurrence,setOccurrence]=useState('0');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const fill=useCallback((v:View)=>{setView(v);setPrice(v.price===null?'':String(v.price));setTime(v.at?easternInput(v.at):'');setOccurrence(v.at&&easternCandidates(easternInput(v.at))[1]===Math.floor(v.at/60000)*60000?'1':'0');},[]);
  useEffect(()=>{const controller=new AbortController();fetch(endpoint+'?symbol='+encodeURIComponent(symbol),{cache:'no-store',signal:controller.signal}).then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error||'Unable to load.');return b;}).then(fill).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[symbol,fill]);
  const candidates=easternCandidates(time);
  async function save(reset=false){
    if(!view)return;setError('');setSaved(false);
    const at=candidates[Number(occurrence)];
    if(!reset&&(!price.trim()||!Number.isFinite(Number(price))||Number(price)<=0||at===undefined)){setError('Enter a positive price and a valid Eastern date/time.');return;}
    setBusy(true);
    try {const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',[JOURNAL_ADMIN_REQUEST_HEADER]:'1'},body:JSON.stringify({symbol,publicationAt:view.publicationAt,revision:view.revision,reset,price:Number(price),at:!reset&&view.at&&at===Math.floor(view.at/60000)*60000?view.at:at})});const b=await r.json();if(!r.ok)throw Error(b.error||'Unable to save.');fill(b);setSaved(true);}catch(e){setError(e instanceof Error?e.message:'Unable to save.');}finally{setBusy(false);}
  }
  return <Dialog open onClose={()=>{if(!busy)onClose();}} fullWidth maxWidth="sm" aria-labelledby="gain-start-title">
    <DialogTitle id="gain-start-title">{symbol} Gain starting point</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{pt:1}}>
      {error&&<Alert severity="error">{error}</Alert>}{saved&&<Alert severity="success">Starting point saved. No notifications sent.</Alert>}
      {!view&&!error&&<span role="status">Loading starting point…</span>}
      {view&&<><TextField label="Starting price ($)" value={price} disabled={busy} onChange={e=>{setPrice(e.target.value);setSaved(false);}} slotProps={{htmlInput:{inputMode:'decimal'}}}/>
      <TextField label="Starting date/time (ET)" type="datetime-local" value={time} disabled={busy} onChange={e=>{setTime(e.target.value);setOccurrence('0');setSaved(false);}} slotProps={{inputLabel:{shrink:true}}}/>
      {candidates.length===2&&<label>Repeated time <select value={occurrence} onChange={e=>setOccurrence(e.target.value)} disabled={busy}><option value="0">First occurrence (EDT)</option><option value="1">Second occurrence (EST)</option></select></label>}
      <span>Changes only Potential Gain. The posted time, analysis and notifications stay unchanged.</span>
      {view.availableFrom&&<span>Available price tracking starts {new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(view.availableFrom)} ET. Earlier prices are not reconstructed.</span>}
      {view.gain&&<span>Recorded high: ${view.gain.highPrice} · Potential gain: {view.gain.potentialGainPct.toFixed(1)}%</span>}</>}
    </Stack></DialogContent>
    <DialogActions sx={{flexWrap:'wrap',gap:1}}><Button disabled={busy} onClick={onClose}>Close</Button><Button disabled={busy||!view?.publication?.price} onClick={()=>save(true)}>Reset to Watchlist publication</Button><Button variant="contained" disabled={busy||!view} onClick={()=>save()}>Save</Button></DialogActions>
  </Dialog>;
}
