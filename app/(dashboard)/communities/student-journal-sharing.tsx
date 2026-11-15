"use client";
import type {TraderLinkCommunityCoachingSnapshot as TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/server/traderlink-community-platform-repository";

import {coachingSharingRequirements} from "./coaching-sharing-requirements";
import {COACHING_DRAFT_SAVED,COACHING_DRAFT_DISCARDED} from "./coaching-draft-navigation";
import {COACHING_ACCESS_LABELS} from "@/src/modules/communities/contracts/coaching-required-access";
import {useActionState,useEffect,useState} from "react";
import {Alert,Box,Button,Checkbox,FormControlLabel,Stack} from "@mui/material";
import {DashboardPanel} from "@/app/dashboard-ui";

import {saveStudentJournalSharingAction} from "./community-actions";
import {CommunityTypography as Typography} from "./community-typography";
const options=[["summary","Account summary"],["trades","Trades"],["trade_notes","Notes"],["rules","Rules"],["tags","Tags"],["journal_notes","Trading-day notes"],["day_rules","Trading-day rules"],["analytics","Analytics"]] as const;
export function StudentJournalSharing({snapshot,isReview,selectedRelationshipId}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview:boolean;selectedRelationshipId:string}){
 const relationship=snapshot.relationships.find(item=>item.relationshipId===selectedRelationshipId&&item.studentUserId===snapshot.viewer.userId&&item.status==="active"&&!item.archivedAtUtc&&item.accessStatus==="active");
 const requirements=coachingSharingRequirements(snapshot,selectedRelationshipId);
 const accountId=snapshot.viewer.activeJournalAccountId;
 const active=snapshot.journalGrants.filter(item=>item.studentUserId===snapshot.viewer.userId&&item.relationshipId===selectedRelationshipId&&item.journalAccountId===accountId&&item.status==="active");
 const savedSelection=JSON.stringify(options.filter(([key])=>active.some(grant=>grant.dataScope==="complete"||grant.dataScope===key||(grant.dataScope==="trades"&&grant.sharedFields?.includes(key)))).map(([key])=>key));
 const recoveryKey=`coaching-student-sharing:${snapshot.viewer.userId}:${snapshot.community.slug}:${selectedRelationshipId}:${accountId??"none"}`;
 const [selected,setSelected]=useState<string[]>(()=>options.filter(([key])=>active.some(grant=>grant.dataScope==="complete"||grant.dataScope===key||(grant.dataScope==="trades"&&grant.sharedFields?.includes(key)))).map(([key])=>key));
 const [changed,setChanged]=useState(false);
 const [feedback,save,pending]=useActionState(async(previous:{error:string;saved:boolean},form:FormData)=>{const result=await saveStudentJournalSharingAction(previous,form);if(result.saved)setChanged(false);return result;},{error:"",saved:false});
 const sharingAvailable=Boolean(relationship&&accountId&&!isReview);
 useEffect(()=>{
  if(!sharingAvailable)return;
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore browser-only draft recovery after hydration.
  try{const raw=sessionStorage.getItem(recoveryKey);if(raw){const recovery=JSON.parse(raw) as {baseline?:string;selected?:unknown};if(recovery.baseline===savedSelection&&Array.isArray(recovery.selected)&&recovery.selected.every(value=>options.some(([key])=>key===value))){setSelected(recovery.selected);setChanged(true);}else sessionStorage.removeItem(recoveryKey);}}catch{/* Navigation protection also works without browser storage. */}
  const discard=(event:Event)=>{if((event as CustomEvent<{formId:string}>).detail?.formId!=='student-coaching-content')return;try{sessionStorage.removeItem(recoveryKey);}catch{/* No browser storage. */}setSelected(JSON.parse(savedSelection) as string[]);setChanged(false);};
  document.addEventListener(COACHING_DRAFT_DISCARDED,discard);return()=>document.removeEventListener(COACHING_DRAFT_DISCARDED,discard);
 },[sharingAvailable,recoveryKey,savedSelection]);
 useEffect(()=>{if(feedback.saved){try{sessionStorage.removeItem(recoveryKey);}catch{/* No browser storage. */}const hash=`#${new URLSearchParams({student:selectedRelationshipId,section:"sharing"})}`;if(window.location.hash!==hash)window.history.replaceState(window.history.state,"",hash);document.dispatchEvent(new CustomEvent(COACHING_DRAFT_SAVED,{detail:{formId:"student-coaching-content"}}));}},[feedback,recoveryKey,selectedRelationshipId]);
 const updateSelection=(next:readonly string[])=>{const values=options.filter(([key])=>next.includes(key)).map(([key])=>key);setChanged(true);setSelected(values);try{if(JSON.stringify(values)===savedSelection)sessionStorage.removeItem(recoveryKey);else sessionStorage.setItem(recoveryKey,JSON.stringify({baseline:savedSelection,selected:values}));}catch{/* No browser storage. */}};
 const requiredScopes=new Set<string>([
  ...(JSON.parse(savedSelection) as string[]),...requirements.required,
  ...(requirements.required.some(scope=>!["summary","analytics"].includes(scope))?["trades","summary"]:[]),
 ]);
 const requiredSelection=options.filter(([key])=>requiredScopes.has(key)).map(([key])=>key);
 const hidden=<><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="relationshipId" type="hidden" value={selectedRelationshipId}/><input name="journalAccountId" type="hidden" value={accountId??""}/></>;
 const missing=requirements.missing;
 const disabled=isReview||pending;
 return <DashboardPanel title="Journal access">
 {relationship&&accountId?<Stack spacing={2}>
  <Typography sx={{fontWeight:700}}>Journal account: {snapshot.viewer.activeJournalAccountName??"Selected account"}</Typography>
  {missing.length?<>
   <Typography>To complete {relationship.planName}, {relationship.coachDisplayName} needs access to:</Typography>
   <Box component="ul" sx={{m:0,pl:3}}>{missing.map(scope=><Typography component="li" key={scope}>{COACHING_ACCESS_LABELS[scope]??scope}</Typography>)}</Box>
   <Typography variant="body2" color="text.secondary">Allowing access lets your coach view this data in the Journal account above. You can change or revoke access later.</Typography>
   <Box component="form" action={isReview?undefined:save} data-coaching-action-only="true" onSubmit={()=>updateSelection(requiredSelection)}>
    {hidden}{requiredSelection.map(scope=><input key={scope} name="sharingOption" type="hidden" value={scope}/>)}
    <Button disabled={disabled} type="submit" variant="contained">{pending?"Saving access…":"Allow required access"}</Button>
   </Box>
  </>:requirements.required.length?<Typography>{relationship.coachDisplayName} has the Journal access required for {relationship.planName}.</Typography>:<Typography>This plan does not require Journal access. You can choose additional access below.</Typography>}
  {feedback.error?<Alert severity="error" role="alert">{feedback.error.replace(/sharing/gi,"access")}</Alert>:null}
  {feedback.saved&&!changed?<Alert severity="success" role="status">Journal access saved.</Alert>:null}
  <Box component="details">
   <Box component="summary" sx={{cursor:"pointer",fontWeight:700,borderRadius:1,"&:focus-visible":{outline:"2px solid",outlineColor:"primary.main",outlineOffset:4}}}>Manage or revoke access</Box>
   <Box component="form" action={isReview?undefined:save} sx={{mt:2}} data-coaching-controlled-draft data-coaching-unsaved={changed&&JSON.stringify(options.filter(([key])=>selected.includes(key)).map(([key])=>key))!==savedSelection?"true":"false"}>
    {hidden}
    <Stack spacing={1.5}>
     <Typography variant="body2">Choose what {relationship.coachDisplayName} can view. Notes, rules and tags need Trades; Trades includes the account summary. Removing required access may stop your coach from completing the review.</Typography>
     {selected.includes("trades")?<input type="hidden" name="sharingOption" value="summary"/>:null}
     <Stack>{options.map(([value,label])=><FormControlLabel key={value} label={label} control={<Checkbox name="sharingOption" value={value} checked={selected.includes(value)||(value==="summary"&&selected.includes("trades"))} disabled={disabled||(value==="summary"&&selected.includes("trades"))} onChange={event=>updateSelection(event.target.checked?[...selected,value]:selected.filter(key=>key!==value))}/>}/>)}</Stack>
     <Button disabled={disabled} type="submit" variant="outlined">{pending?"Saving access…":"Save access"}</Button>
    </Stack>
   </Box>
  </Box>
  <Typography variant="body2" color="text.secondary">To use a different Journal, choose it in Account settings before granting access.</Typography>
 </Stack>:<Stack spacing={1}><Typography>{!accountId?"Select a Journal account to manage access.":"Journal access can be changed while this coaching plan is active."}</Typography>{!accountId?<Button href="/account/trading" variant="outlined">Select Journal account</Button>:null}</Stack>}
 </DashboardPanel>;
}
