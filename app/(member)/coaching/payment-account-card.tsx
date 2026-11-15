"use client";
import {useEffect,useState} from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {DashboardPanel} from '@/app/dashboard-ui';
export function CoachingPaymentAccountCard(){
 const [state,setState]=useState<{available:boolean;merchantConnected:boolean;identityConnected:boolean}|null>(null),[error,setError]=useState(false);
 useEffect(()=>{const abort=new AbortController();fetch('/api/coaching/payments/status',{cache:'no-store',signal:abort.signal}).then(async response=>{if(!response.ok)throw new Error('unavailable');return response.json();}).then(setState).catch(()=>{if(!abort.signal.aborted)setError(true);});return()=>abort.abort();},[]);
 return <DashboardPanel title="Coach service payments"><Stack spacing={2}>
  <Typography>Receive student payments through your own Whop account.</Typography>
  {error?<Alert severity="warning">Payment setup could not be loaded. Refresh to try again.</Alert>:!state?<Typography role="status">Loading payment setup…</Typography>:<>
   <Chip size="small" sx={{alignSelf:'flex-start'}} color={state.merchantConnected?'success':'default'} label={state.merchantConnected?'Whop account connected':'Whop account not connected'}/>
   {!state.available?<Typography variant="body2" color="text.secondary">Payment setup is not enabled in this environment yet.</Typography>:null}
   <Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}>
    <Button variant="outlined" href="/api/coaching/whop/connect" disabled={!state.available}>{state.merchantConnected?'Reconnect Whop':'Connect Whop'}</Button>
    {state.merchantConnected?<Button href="/api/coaching/whop/onboarding" disabled={!state.available}>Complete Whop setup</Button>:null}
   </Stack>
   <Typography variant="body2" color="text.secondary">Whop handles identity verification and payout setup. Your plan price and platform commission are shown before a student pays.</Typography>
  </>}
 </Stack></DashboardPanel>;
}
