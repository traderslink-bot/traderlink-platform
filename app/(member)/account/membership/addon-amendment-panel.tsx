"use client";

import { Alert,Box,Button,Checkbox,FormControlLabel,MenuItem,Stack,TextField,Typography } from "@mui/material";
import { useEffect,useRef,useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MembershipAddonAmendmentResult,MembershipAddonAmendmentView,MembershipAmendmentAddonChoice,MembershipAmendmentSubscriptionChoice } from "@/src/modules/platform/contracts/membership-addon-amendment";
import { formatMembershipMoney } from "@/src/modules/platform/contracts/platform-membership-pricing";
import { abandonMembershipAddonQuoteAction,confirmMembershipAddonAction,quoteMembershipAddonAction,refreshMembershipAddonAction } from "./addon-actions";

export function AddonAmendmentPanel({addons,subscriptions,initialAddon,invitationSecret,initialAmendment}:{addons:readonly MembershipAmendmentAddonChoice[];subscriptions:readonly MembershipAmendmentSubscriptionChoice[];initialAddon?:string;invitationSecret?:string;initialAmendment?:MembershipAddonAmendmentView|null}) {
  const router=useRouter(),[pending,startTransition]=useTransition();
  const requestedAddon=addons.find(x=>x.offerId===initialAddon);
  const [subscriptionId,setSubscriptionId]=useState(initialAmendment?.subscriptionId??subscriptions.find(x=>requestedAddon?.free||x.currency===requestedAddon?.currency)?.id??subscriptions[0]?.id??"");
  const [selected,setSelected]=useState<string[]>(initialAmendment?[...initialAmendment.addonOfferIds]:addons.some(x=>x.offerId===initialAddon)?[initialAddon!]:[]);
  const [amendment,setAmendment]=useState<MembershipAddonAmendmentView|null>(initialAmendment??null);
  const [message,setMessage]=useState<string|null>(null),requestId=useRef<string|null>(null);
  const subscription=subscriptions.find(x=>x.id===subscriptionId);
  const choices=addons.filter(x=>x.free||x.currency===subscription?.currency);
  const locked=!!amendment&&!['failed','expired','applied'].includes(amendment.state);
  function receive(result:MembershipAddonAmendmentResult) {
    if(result.ok){setAmendment(result.amendment);setMessage(null)}else setMessage(result.message);
  }
  function quote() {
    requestId.current??=crypto.randomUUID();
    const id=requestId.current;
    startTransition(async()=>{setMessage(null);receive(await quoteMembershipAddonAction(id,subscriptionId,selected,invitationSecret));});
  }
  const amendmentId=amendment?.id,amendmentState=amendment?.state;
  useEffect(()=>{
    if(amendmentState==='applied'){router.refresh();return;}
    if(!amendmentId||!amendmentState||!['confirming','pending_payment','reconciliation_required'].includes(amendmentState))return;
    const controller=new AbortController();let attempts=0,inFlight=false;
    const timer=window.setInterval(async()=>{
      if(inFlight)return;
      if(++attempts>60){window.clearInterval(timer);return;}
      inFlight=true;
      try{
        const response=await fetch(`/api/platform/membership/addon-amendments/${encodeURIComponent(amendmentId)}`,{cache:'no-store',signal:controller.signal});
        if(!response.ok)return;
        const result=await response.json() as MembershipAddonAmendmentResult;
        if(!controller.signal.aborted&&result.ok)setAmendment(result.amendment);
      }catch{/* A manual check remains available. */}finally{inFlight=false;}
    },5000);
    return()=>{window.clearInterval(timer);controller.abort();};
  },[amendmentId,amendmentState,router]);
  const invitationUrl=invitationSecret&&/^[A-Za-z0-9_-]{40,64}$/u.test(invitationSecret)?`/plans/invite/${encodeURIComponent(invitationSecret)}`:null;
  if(initialAddon&&!requestedAddon&&!amendment)return <Alert severity="warning">This add-on is unavailable or its private invitation has expired, been revoked or reached its claim limit. Reopen your latest invitation or contact TradersLink.</Alert>;
  if(!subscriptions.length&&!amendment)return <Stack spacing={1}>
    {requestedAddon?<Typography>Selected add-on: {requestedAddon.name}</Typography>:null}
    <Alert severity="info">Adding to your current plan requires an active monthly Stripe subscription without a scheduled cancellation or billing change. Check your billing below or contact TradersLink.</Alert>
    <Button href={invitationUrl??'/plans'} sx={{alignSelf:'start'}}>{invitationUrl?'Back to private plans':'View plans'}</Button>
  </Stack>;
  if(!addons.length&&!amendment)return <Typography>No add-ons are available right now.</Typography>;
  return <Stack spacing={2} sx={{maxWidth:560}}>
    <Typography>Keep your current plan and add more features. Review today’s prorated charge and your new monthly total before confirming.</Typography>
    {initialAddon&&amendment&&!amendment.addonOfferIds.includes(initialAddon)?<Alert severity="info">You already have an add-on review open. Complete it or change its selection before reviewing the add-on from this link.</Alert>:null}
    {requestedAddon&&!requestedAddon.free&&subscription&&requestedAddon.currency!==subscription.currency?<Alert severity="warning">This add-on uses a different currency from your selected subscription. Choose a matching subscription or contact TradersLink.</Alert>:null}
    <Box component="fieldset" disabled={pending||locked} sx={{border:0,p:0,m:0,minWidth:0,display:'grid',gap:1.5}}>
      <Typography component="legend" sx={{fontWeight:700,mb:1}}>Choose add-ons</Typography>
      {subscriptions.length>1?<TextField label="Current subscription" select value={subscriptionId} onChange={e=>{setSubscriptionId(e.target.value);setSelected([]);requestId.current=null;}}>
        {subscriptions.map(x=><MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}
      </TextField>:null}
      {choices.map(x=><FormControlLabel key={x.offerId} control={<Checkbox checked={selected.includes(x.offerId)} onChange={e=>{setSelected(current=>e.target.checked?[...current,x.offerId]:current.filter(id=>id!==x.offerId));requestId.current=null;}}/>} label={`${x.name} · ${x.free?'$0':`${formatMembershipMoney(x.monthlyMinor,x.currency)}/month`}`}/>)}
      <Button variant="outlined" disabled={!selected.length||selected.some(id=>!choices.some(choice=>choice.offerId===id))||pending||locked} onClick={quote} sx={{justifySelf:'start'}}>Review add-on charge</Button>
    </Box>
    {message?<Alert severity="error">{message}</Alert>:null}
    {amendment?.state==='quoted'?<Stack spacing={1.5}>
      <Typography>Add-ons: {amendment.addonNames.join(", ")}</Typography>
      <Typography><strong>Due today: {formatMembershipMoney(amendment.chargeMinor!,amendment.currency)}</strong></Typography>
      <Typography>New monthly total: {formatMembershipMoney(amendment.monthlyMinor,amendment.currency)}</Typography>
      <Typography>Your billing date stays {new Date(amendment.renewalAt).toLocaleDateString("en-US",{timeZone:"UTC",year:"numeric",month:"short",day:"numeric"})} (UTC). The add-on starts after payment succeeds.</Typography>
      <Stack direction="row" spacing={1} sx={{flexWrap:'wrap',rowGap:1}}>
        <Button variant="contained" disabled={pending} onClick={()=>startTransition(async()=>{receive(await confirmMembershipAddonAction(amendment.id));})}>
          {pending?'Confirming…':amendment.chargeMinor?`Confirm and pay ${formatMembershipMoney(amendment.chargeMinor,amendment.currency)}`:'Confirm add-on'}
        </Button>
        <Button disabled={pending} onClick={()=>startTransition(async()=>{const result=await abandonMembershipAddonQuoteAction(amendment.id);if(result.ok&&result.amendment.state==='expired'){setAmendment(null);requestId.current=null;}else receive(result);})}>Change selection</Button>
      </Stack>
    </Stack>:null}
    {amendment?.state==='preparing'?<Alert severity="info">Your charge preview is being prepared. No payment has been submitted.
      <Box sx={{mt:1}}><Button disabled={pending} onClick={()=>startTransition(async()=>{const result=await abandonMembershipAddonQuoteAction(amendment.id);if(result.ok&&result.amendment.state==='expired'){setAmendment(null);requestId.current=null;}else receive(result);})}>Start a new review</Button></Box>
    </Alert>:null}
    {amendment&&['confirming','pending_payment','reconciliation_required'].includes(amendment.state)?<Alert severity="info">
      We’re checking your add-on payment. Your current plan stays active while payment is pending.
      <Stack direction="row" spacing={1} sx={{mt:1,flexWrap:'wrap',rowGap:1}}>
        {amendment.paymentUrl?<Button href={amendment.paymentUrl} variant="contained">Complete payment</Button>:null}
        <Button disabled={pending} onClick={()=>startTransition(async()=>{receive(await refreshMembershipAddonAction(amendment.id));})}>Check payment</Button>
      </Stack>
    </Alert>:null}
    {amendment?.state==='applied'?<Alert severity="success">Your add-on is active. Your billing date stays the same.</Alert>:null}
    {amendment&&['expired','failed'].includes(amendment.state)?<Alert severity="info">This add-on change was not completed. Your current plan is unchanged.
      <Box sx={{mt:1}}><Button onClick={()=>{setAmendment(null);requestId.current=null;setMessage(null);}}>Review again</Button></Box>
    </Alert>:null}
  </Stack>;
}
