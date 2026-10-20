"use client";
import {coachingSharingRequirements} from "./coaching-sharing-requirements";
import {COACHING_DRAFT_SAVED,COACHING_DRAFT_DISCARDED} from "./coaching-draft-navigation";
import {COACHING_ACCESS_LABELS} from "@/src/modules/communities/contracts/coaching-required-access";
import {useActionState,useEffect,useState} from "react";
import {Alert,Box,Button,Checkbox,FormControlLabel,Stack,TextField} from "@mui/material";
import {DashboardPanel} from "@/app/dashboard-ui";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
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
 const [feedback,save,pending]=useActionState(saveStudentJournalSharingAction,{error:"",saved:false});
 const [changed,setChanged]=useState(false);
 useEffect(()=>{
  if(isReview||!relationship||!accountId)return;
  try{const raw=sessionStorage.getItem(recoveryKey);if(raw){const recovery=JSON.parse(raw) as {baseline?:string;selected?:unknown};if(recovery.baseline===savedSelection&&Array.isArray(recovery.selected)&&recovery.selected.every(value=>options.some(([key])=>key===value))){setSelected(recovery.selected);setChanged(true);}else sessionStorage.removeItem(recoveryKey);}}catch{/* Navigation protection also works without browser storage. */}
  const discard=(event:Event)=>{if((event as CustomEvent<{formId:string}>).detail?.formId!=='student-coaching-content')return;try{sessionStorage.removeItem(recoveryKey);}catch{/* No browser storage. */}setSelected(JSON.parse(savedSelection) as string[]);setChanged(false);};
  document.addEventListener(COACHING_DRAFT_DISCARDED,discard);return()=>document.removeEventListener(COACHING_DRAFT_DISCARDED,discard);
 },[isReview,Boolean(relationship),accountId,recoveryKey,savedSelection]);
 useEffect(()=>{if(feedback.saved){try{sessionStorage.removeItem(recoveryKey);}catch{/* No browser storage. */}setChanged(false);const hash=`#${new URLSearchParams({student:selectedRelationshipId,section:"sharing"})}`;if(window.location.hash!==hash)window.history.replaceState(window.history.state,"",hash);document.dispatchEvent(new CustomEvent(COACHING_DRAFT_SAVED,{detail:{formId:"student-coaching-content"}}));}},[feedback,recoveryKey,selectedRelationshipId]);
 const updateSelection=(next:readonly string[])=>{const values=options.filter(([key])=>next.includes(key)).map(([key])=>key);setChanged(true);setSelected(values);try{if(JSON.stringify(values)===savedSelection)sessionStorage.removeItem(recoveryKey);else sessionStorage.setItem(recoveryKey,JSON.stringify({baseline:savedSelection,selected:values}));}catch{/* No browser storage. */}};
 return <DashboardPanel title="Journal sharing">
 {relationship&&accountId?<Box component="form" action={isReview?undefined:save} data-coaching-controlled-draft data-coaching-unsaved={changed&&JSON.stringify(options.filter(([key])=>selected.includes(key)).map(([key])=>key))!==savedSelection?"true":"false"}><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="relationshipId" type="hidden" value={selectedRelationshipId}/><input name="journalAccountId" type="hidden" value={accountId}/><Stack spacing={1.5}>
 {requirements.required.length?<><Typography sx={{fontWeight:700}}>Required by your accepted coaching work</Typography><Typography>{requirements.required.map(scope=>COACHING_ACCESS_LABELS[scope]??scope).join(' · ')}</Typography><Typography>{requirements.missing.length?'Not yet shared: '+requirements.missing.map(scope=>COACHING_ACCESS_LABELS[scope]??scope).join(' · '):'Required access is currently shared.'}</Typography><Button disabled={isReview||pending} onClick={()=>updateSelection([...selected,...requirements.required,'summary',...(requirements.required.some(scope=>!['summary','analytics'].includes(scope))?['trades']:[])])}>Select required access</Button></>:null}
 <TextField label="Coach" value={`${relationship.coachDisplayName} · ${relationship.planName}`} slotProps={{input:{readOnly:true}}}/>
 <Typography sx={{fontWeight:700}}>Journal account: {snapshot.viewer.activeJournalAccountName??"Selected account"}</Typography>
 <Typography variant="body2">Choose what to share from this Journal account. Change the active account in Account settings to share a different one. Notes, rules and tags require Trades. Trades also includes the account summary.</Typography>
 {selected.includes("trades")?<input type="hidden" name="sharingOption" value="summary"/>:null}
 <Stack>{options.map(([value,label])=><FormControlLabel key={value} label={label} control={<Checkbox name="sharingOption" value={value} checked={selected.includes(value)||(value==="summary"&&selected.includes("trades"))} disabled={isReview||pending||(value==="summary"&&selected.includes("trades"))} onChange={event=>updateSelection(event.target.checked?[...selected,value]:selected.filter(key=>key!==value))}/>}/> )}</Stack>
 {feedback.error?<Alert severity="error" role="alert">{feedback.error}</Alert>:null}{feedback.saved&&!changed?<Alert severity="success" role="status">Sharing saved.</Alert>:null}
 <Button disabled={isReview||pending} type="submit" variant="contained">{pending?"Saving…":"Save sharing"}</Button>
 </Stack></Box>:<Typography>{!accountId?"Select a Journal account to manage sharing.":"Sharing is available while this coaching relationship is active."}</Typography>}
 </DashboardPanel>;
}
