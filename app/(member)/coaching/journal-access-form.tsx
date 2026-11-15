"use client";
import {useState} from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import {COACHING_ACCESS_LABELS,type CoachingRequiredScope} from '@/src/modules/communities/contracts/coaching-required-access';
import {IndependentCoachingForm} from './coaching-form';

export function IndependentJournalAccessForm({enrollmentId,accounts,current,required}:{enrollmentId:string;accounts:readonly {accountId:string;name:string}[];current:{accountId:string|null;accountAvailable?:boolean;scopes:readonly CoachingRequiredScope[]};required:readonly CoachingRequiredScope[]}){
 const startingAccount=accounts.some(a=>a.accountId===current.accountId)?current.accountId!:accounts[0]?.accountId??'';
 const [scopes,setScopes]=useState<readonly CoachingRequiredScope[]>(current.scopes),[account,setAccount]=useState(startingAccount);
 const [baseline,setBaseline]=useState({account:startingAccount,scopes:current.scopes});
 const unsavedChanges=account!==baseline.account||scopes.some(scope=>!baseline.scopes.includes(scope))||baseline.scopes.some(scope=>!scopes.includes(scope));
 const missing=required.filter(scope=>!scopes.includes(scope));
 return <Stack spacing={2}><IndependentCoachingForm intent="share_journal" label="Save coach access" hidden={{enrollmentId}} unsavedChanges={unsavedChanges} onSaved={()=>setBaseline({account,scopes})}>
  <input name="scopes" type="hidden" value={JSON.stringify(scopes)}/>
  <Stack spacing={2}>
   {current.accountId&&current.accountAvailable===false?<Alert severity="warning">The previously allowed account is unavailable. Choose an active account or remove coach access.</Alert>:null}
   {missing.length?<Alert severity="info">Your plan needs: {missing.map(scope=>COACHING_ACCESS_LABELS[scope]??scope).join(' · ')}<Button data-coaching-edit onClick={()=>setScopes(old=>[...new Set([...old,...required])])}>Select required access</Button></Alert>:null}
   <TextField select name="accountId" label="Journal account" value={account} onChange={event=>setAccount(event.target.value)} required sx={{maxWidth:420}}>{accounts.map(account=><MenuItem key={account.accountId} value={account.accountId}>{account.name}</MenuItem>)}</TextField>
   <Stack direction="row" sx={{flexWrap:'wrap',gap:1}}>{Object.entries(COACHING_ACCESS_LABELS).map(([key,label])=><FormControlLabel key={key} label={label} control={<Checkbox checked={scopes.includes(key as CoachingRequiredScope)} onChange={event=>setScopes(old=>event.target.checked?[...old,key as CoachingRequiredScope]:old.filter(value=>value!==key))}/>}/>)}</Stack>
   <Alert severity="info">Your coach can view only the selected Journal information. Removing access takes effect when you save; completed coaching feedback stays in your coaching history.</Alert>
  </Stack>
 </IndependentCoachingForm>{current.scopes.length?<IndependentCoachingForm intent="share_journal" label="Remove coach access" hidden={{enrollmentId,accountId:current.accountId??'revoke',scopes:'[]'}}/>:null}</Stack>;
}
