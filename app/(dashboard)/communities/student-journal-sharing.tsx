"use client";
import {useState} from "react";
import {Box,Button,Checkbox,FormControlLabel,MenuItem,Stack,TextField} from "@mui/material";
import {DashboardPanel} from "@/app/dashboard-ui";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {grantCoachJournalAccessAction,revokeCoachJournalAccessAction} from "./community-actions";
import {CommunityTypography as Typography} from "./community-typography";

export function StudentJournalSharing({snapshot,isReview,selectedRelationshipId}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview:boolean;selectedRelationshipId:string}){
 const relationships=snapshot.relationships.filter(item=>item.relationshipId===selectedRelationshipId&&item.studentUserId===snapshot.viewer.userId&&item.status==="active"&&!item.archivedAtUtc&&item.accessStatus==="active");
 const [scope,setScope]=useState("trades");
 const active=snapshot.journalGrants.filter(item=>item.studentUserId===snapshot.viewer.userId&&item.status==="active");
 return <DashboardPanel title="Journal sharing">
  {relationships.length?<Box action={isReview?undefined:grantCoachJournalAccessAction} component="form"><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><Stack spacing={1.5}>
   <input name="relationshipId" type="hidden" value={relationships[0].relationshipId}/>
   <TextField label="Coach" value={`${relationships[0].coachDisplayName} · ${relationships[0].planName}`} slotProps={{input:{readOnly:true}}}/>
   <TextField label="Data shared" name="dataScope" onChange={event=>setScope(event.target.value)} select value={scope}><MenuItem value="summary">Account summary</MenuItem><MenuItem value="trades">Summary and trade history</MenuItem><MenuItem value="analytics">Account analytics</MenuItem></TextField>
   {scope==="trades"?<Stack direction={{xs:"column",sm:"row"}} spacing={1}>{[["trade_notes","Trade notes"],["rules","Trade rules"],["tags","Trade tags"],["journal_notes","Trading-day notes"],["day_rules","Trading-day rules"]].map(([value,label])=><FormControlLabel control={<Checkbox name="sharedField" value={value}/>} key={value} label={label}/>)}</Stack>:null}
   <Button disabled={isReview} type="submit" variant="contained">Share selected account</Button>
  </Stack></Box>:null}
  <Stack spacing={1} sx={{mt:2}}>{active.map(grant=><Stack direction="row" key={grant.grantId} sx={{alignItems:"center",justifyContent:"space-between"}}><Typography>{snapshot.relationships.find(item=>item.relationshipId===grant.relationshipId)?.coachDisplayName} · {grant.dataScope==="trades"?"Trade history":grant.dataScope==="summary"?"Account summary":grant.dataScope==="analytics"?"Account analytics":"Journal"}{grant.sharedFields?.length?` · ${grant.sharedFields.map(field=>({trade_notes:"Notes",rules:"Rules",tags:"Tags",journal_notes:"Trading-day notes",day_rules:"Trading-day rules"}[field]??field)).join(", ")}`:""}</Typography><Box action={isReview?undefined:revokeCoachJournalAccessAction} component="form"><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="grantId" type="hidden" value={grant.grantId}/><Button color="error" disabled={isReview} type="submit">Revoke</Button></Box></Stack>)}</Stack>
 </DashboardPanel>;
}
