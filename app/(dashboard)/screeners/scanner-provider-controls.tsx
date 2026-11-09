"use client";
import {useEffect,useState} from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import {DashboardSecondaryAction} from '@/app/dashboard-template';
import {PLATFORM_MUTATION_REQUEST_HEADER} from '@/src/modules/platform/contracts/platform-request-security';

type Connection={provider:'alpaca'|'moomoo';revision:number;moomooAvailable:boolean};
export function ScannerProviderControls(){
 const [connection,setConnection]=useState<Connection|null>(null),[draft,setDraft]=useState<'alpaca'|'moomoo'>('alpaca'),[busy,setBusy]=useState(false),[message,setMessage]=useState<string|null>(null);
 useEffect(()=>{const controller=new AbortController();void fetch('/api/admin/screeners/provider',{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();return response.json() as Promise<Connection>;}).then(value=>{setConnection(value);setDraft(value.provider);}).catch(()=>{if(!controller.signal.aborted)setMessage('Data connection could not be loaded.');});return()=>controller.abort();},[]);
 const save=async()=>{if(!connection)return;setBusy(true);setMessage(null);try{const response=await fetch('/api/admin/screeners/provider',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',[PLATFORM_MUTATION_REQUEST_HEADER]:'1'},body:JSON.stringify({provider:draft,revision:connection.revision})});if(!response.ok)throw Error();const next=await response.json() as Connection;setConnection(next);setDraft(next.provider);setMessage('Data connection selected. Scanner history starts fresh.');}catch{setMessage('Connection was not switched. Reload the controls and try again.');}finally{setBusy(false);}};
 return <Stack spacing={1}>
  <Stack direction="row" spacing={1} sx={{alignItems:'center',flexWrap:'wrap'}}>
   <TextField select size="small" label="Scanner data connection" value={draft} disabled={!connection||busy} onChange={event=>setDraft(event.target.value as 'alpaca'|'moomoo')} sx={{minWidth:210}}>
    <MenuItem value="alpaca">Alpaca</MenuItem><MenuItem value="moomoo" disabled={!connection?.moomooAvailable}>Moomoo{connection?.moomooAvailable?'':' (off)'}</MenuItem>
   </TextField>
   <DashboardSecondaryAction disabled={!connection||busy||draft===connection.provider} onClick={()=>void save()}>{busy?'Switching…':'Switch connection'}</DashboardSecondaryAction>
  </Stack>
  {message?<Alert severity={message.startsWith('Data connection selected')?'success':'info'}>{message}</Alert>:null}
 </Stack>;
}
