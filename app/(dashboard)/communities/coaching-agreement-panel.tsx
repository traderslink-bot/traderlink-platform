"use client";
import {Box,Button,Chip,Grid,Stack,TextField,Typography} from "@mui/material";
import {DashboardPanel} from "@/app/dashboard-ui";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {coachingAgreementAction} from "./community-actions";
import {PLAN_OFFERS,FREQUENCIES,PERIODS} from "./coaching-plan-offers";
import {COACHING_REVIEW_FOCUS} from "@/src/modules/communities/contracts/coaching-review-workspace";

export function CoachingAgreementPanel({snapshot,relationshipId,disabled=false}:{snapshot:TraderLinkCommunityDashboardSnapshot;relationshipId:string;disabled?:boolean}){
 const relationship=snapshot.relationships.find(item=>item.relationshipId===relationshipId);if(!relationship)return null;
 const coach=relationship.coachUserId===snapshot.viewer.userId,plan=snapshot.plans.find(item=>item.planId===relationship.planId);
 const agreements=(snapshot.coachingAgreements??[]).filter(item=>item.relationshipId===relationshipId);
 const accepted=agreements.find(item=>item.status==="accepted"),proposed=agreements.find(item=>item.status==="proposed");
 const hidden=<><input type="hidden" name="communitySlug" value={snapshot.community.slug}/><input type="hidden" name="relationshipId" value={relationshipId}/></>;
 return <DashboardPanel title="Coaching agreement"><Stack spacing={2}>
  {(snapshot.coachingNotices??[]).filter(notice=>notice.relationshipId===relationshipId).slice(0,5).map(notice=><Typography key={notice.noticeId} role="status">{notice.body} · {notice.createdAtUtc.slice(0,10)}</Typography>)}
  {[proposed,accepted].filter(item=>!!item).map(agreement=><Box key={agreement.agreementId} sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}>
   <Stack direction="row" spacing={1}><Typography sx={{fontWeight:800}}>{agreement.terms.planName}</Typography><Chip color={agreement.status==="accepted"?"success":"warning"} label={agreement.status==="accepted"?"Accepted":"Awaiting acceptance"}/></Stack>
   <Typography>{agreement.terms.currency} {(agreement.terms.priceAmountMinor/100).toFixed(2)} · {agreement.terms.billingCadence.replaceAll("_"," ")}</Typography>
   {agreement.terms.items.map(item=>{const offer=PLAN_OFFERS.find(offer=>offer.type===item.itemType),detail=agreement.terms.builderConfig?.offers[item.itemType];return <Box key={item.planItemId} sx={{my:1.5}}>
    <Typography sx={{fontWeight:700}}>{offer?.label??"Journal review"}</Typography>
    <Stack direction="row" sx={{gap:.75,flexWrap:"wrap",mt:.5}}>
     {item.itemType!=="review_follow_up"?<Chip size="small" color="info" label={item.timelineEnabled?(item.frequency==="custom"?`Every ${agreement.terms.customIntervalDays} days`:FREQUENCIES[item.frequency]):"Unscheduled"}/>:null}
     {offer?.count?<Chip size="small" label={`${offer.count}: ${item.quantity}`}/>:null}
     {offer?.period&&item.timelineEnabled?<Chip size="small" label={item.coveragePeriod==="custom"?`${agreement.terms.coverageDays?.[item.planItemId]} days covered`:PERIODS[item.coveragePeriod]}/>:null}
     {item.timelineEnabled&&!["questions","review_follow_up"].includes(item.itemType)?<Chip size="small" color="warning" label={`Due within ${item.dueOffsetDays} ${item.dueOffsetDays===1?"day":"days"}`}/>:null}
     {item.itemType==="review_follow_up"?<Chip size="small" label={`${item.followUpDays} ${item.followUpDays===1?"day":"days"} after read confirmation`}/>:null}
     {item.plannedMinutes?<Chip size="small" label={`${item.plannedMinutes} minutes`}/>:null}
     {item.selectionMode!=="not_applicable"?<Chip size="small" label={`Chosen by ${item.selectionMode==="coach_or_student"?"coach or student":item.selectionMode}`}/>:null}
     {item.reviewDepth==="complete_day"?<Chip size="small" label="Complete day with Journal"/>:null}
     {(item.focusAreas??[]).map(focus=><Chip key={focus} size="small" label={COACHING_REVIEW_FOCUS[focus]}/>)}
     {detail?.resources.map(resource=><Chip key={resource} size="small" label={resource}/>)}
    </Stack>
    {detail?.details?<Typography sx={{whiteSpace:"pre-wrap",mt:.5}}>{detail.details}</Typography>:null}
   </Box>;})}
   <Typography>{agreement.terms.startDate??"No schedule"}{agreement.terms.startDate?` · ${agreement.terms.dueTimeUtc} UTC`:""}</Typography>
   <Typography sx={{whiteSpace:"pre-wrap"}}>{agreement.terms.description}</Typography>
   {!coach&&agreement.status==="proposed"?<Box component="form" action={disabled?undefined:coachingAgreementAction}>{hidden}<input type="hidden" name="agreementId" value={agreement.agreementId}/><Button disabled={disabled} type="submit" name="intent" value="accept" variant="contained">Accept agreement</Button></Box>:null}
  </Box>)}
  {coach&&plan?<Box component="details"><Box component="summary" sx={{cursor:"pointer",fontWeight:700}}>{accepted?"Revise agreement":"Prepare agreement"}</Box><Box component="form" action={disabled?undefined:coachingAgreementAction} sx={{mt:2}}>{hidden}<Grid container spacing={2}>
   <Grid size={{xs:12,sm:4}}><TextField fullWidth label="Agreed price" name="price" type="number" required defaultValue={plan.priceAmountMinor==null?"":(plan.priceAmountMinor/100).toFixed(2)} slotProps={{htmlInput:{min:0,step:"0.01"}}}/></Grid>
   <Grid size={{xs:12,sm:4}}><TextField fullWidth label="Start date" name="startDate" type="date" required={plan.items.some(item=>item.timelineEnabled)} slotProps={{inputLabel:{shrink:true}}}/></Grid>
   <Grid size={{xs:12,sm:4}}><TextField fullWidth label="Deadline time (UTC)" name="dueTimeUtc" type="time" defaultValue="17:00" required slotProps={{inputLabel:{shrink:true}}}/></Grid>
   {plan.items.some(item=>item.timelineEnabled&&item.frequency==="custom")?<Grid size={{xs:12,sm:4}}><TextField fullWidth label="Repeat every (days)" name="customIntervalDays" type="number" required slotProps={{htmlInput:{min:1,max:366}}}/></Grid>:null}
   {plan.items.filter(item=>["trades","trading_days","sessions","lessons","questions","check_ins"].includes(item.measurementKind)).map(item=><Grid key={item.planItemId} size={{xs:12,sm:4}}><TextField fullWidth label={PLAN_OFFERS.find(offer=>offer.type===item.itemType)?.count??"Quantity"} type="number" name={`quantity:${item.planItemId}`} defaultValue={item.quantity} required slotProps={{htmlInput:{min:1,max:500}}}/></Grid>)}
   {plan.items.filter(item=>item.timelineEnabled&&item.coveragePeriod==="custom"&&item.itemType.endsWith("_review")).map(item=><Grid key={`coverage:${item.planItemId}`} size={{xs:12,sm:6}}><TextField fullWidth label={`${PLAN_OFFERS.find(offer=>offer.type===item.itemType)?.label??"Review"} — days covered`} type="number" name={`coverageDays:${item.planItemId}`} required slotProps={{htmlInput:{min:1,max:366}}}/></Grid>)}
   <Grid size={12}><Button disabled={disabled} type="submit" name="intent" value="propose" variant="outlined">Send agreement</Button></Grid>
  </Grid></Box></Box>:null}
  {coach&&accepted&&accepted.terms.items.some(item=>item.timelineEnabled)?<Box component="form" action={disabled?undefined:coachingAgreementAction}>{hidden}<Stack direction={{xs:"column",sm:"row"}} spacing={1}><TextField label="Schedule through" type="date" name="throughDate" required slotProps={{inputLabel:{shrink:true}}}/><Button disabled={disabled} type="submit" name="intent" value="generate" variant="contained">Schedule work</Button></Stack></Box>:null}
 </Stack></DashboardPanel>;
}
