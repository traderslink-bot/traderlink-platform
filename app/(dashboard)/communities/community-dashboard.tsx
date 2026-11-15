"use client";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import type {TraderLinkCommunityCoachingSnapshot as TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/server/traderlink-community-platform-repository";
import {isCoachingStaff} from "@/src/modules/communities/contracts/coaching-audience";
import {coachingPlanPriceLabel} from "@/src/modules/communities/contracts/coaching-plan-presentation";
import {CommunityNavigation} from "./community-navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import {useState} from "react";
import {coachAcceptsStudents,coachingPlanHasSpace} from "@/src/modules/communities/contracts/coaching-plan-availability";
import {DashboardPage,DashboardPanel,DashboardUnavailableState} from "@/app/dashboard-ui";
import {requestCommunityCoachingAction} from "./community-actions";
import {CoachingWorkPage} from "./coach-workspace-navigation";
import {StudentCoachingWorkspace} from "./student-coaching-workspace";
function CoachCards({snapshot}:{snapshot:TraderLinkCommunityDashboardSnapshot}){if(!snapshot.coaches.length)return <DashboardUnavailableState compact description="This server has not published a coach profile." title="No coaches yet"/>;return <Grid container spacing={2}>{snapshot.coaches.map(c=><Grid key={c.coachProfileId} size={{xs:12,md:6}}><Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2,height:"100%"}}><Stack direction="row" sx={{justifyContent:"space-between"}}><Typography variant="h2">{c.displayName}</Typography><Chip label={c.status==="active"&&coachAcceptsStudents(snapshot.plans,c.coachProfileId)?"Accepting students":"At capacity"} size="small"/></Stack><Typography color="primary.main" style={{fontWeight:700}} sx={{mt:.5}}>{c.headline}</Typography><Typography color="text.secondary" sx={{mt:1}} variant="body2">{c.biography}</Typography><Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between"}}><Typography color="text.secondary" variant="caption">{c.activeStudents} students</Typography><Button component={Link} href={`/communities/${snapshot.community.slug}/coaches/${c.slug}`} size="small">View coach</Button></Stack></Box></Grid>)}</Grid>}

function Coaches({snapshot,isReview}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview:boolean}){
 const [category,setCategory]=useState<"available"|"requested"|"enrolled">("available");
 if(isCoachingStaff(snapshot.viewer.capabilities))return <DashboardPanel title="Community coaches"><CoachCards snapshot={snapshot}/></DashboardPanel>;
 const statusFor=(planId:string)=>{const own=snapshot.relationships.filter(item=>item.planId===planId&&item.studentUserId===snapshot.viewer.userId);return own.some(item=>item.status==="active")?"enrolled":own.some(item=>item.status==="pending")?"requested":"available";};
 const visiblePlan=(plan:TraderLinkCommunityDashboardSnapshot["plans"][number])=>statusFor(plan.planId)===category&&(category!=="available"||plan.status==="active");
 const plans=snapshot.plans.filter(visiblePlan);
 return <><DashboardPanel title="Community coaches"><CoachCards snapshot={snapshot}/></DashboardPanel><DashboardPanel title="Plans"><Stack direction="row" sx={{gap:1,flexWrap:"wrap",mb:2}}>{(["available","requested","enrolled"] as const).map(value=><Button key={value} aria-pressed={category===value} variant={category===value?"contained":"outlined"} onClick={()=>setCategory(value)}>{value==="available"?"Available":value==="requested"?"Requested":"Enrolled"} ({snapshot.plans.filter(plan=>statusFor(plan.planId)===value&&(value!=="available"||plan.status==="active")).length})</Button>)}</Stack>{!plans.length?<Typography color="text.secondary">{category==="available"?"No available plans.":category==="requested"?"No pending requests.":"No enrolled plans."}</Typography>:null}<Grid container spacing={2}>{plans.map(p=>{
  const coach=snapshot.coaches.find(c=>c.coachProfileId===p.coachProfileId);
  const existing=snapshot.relationships.find(r=>r.planId===p.planId&&r.studentUserId===snapshot.viewer.userId&&(r.status==="active"||r.status==="pending"));
  const canRequest=coach?.status==="active"&&coach.userId!==snapshot.viewer.userId&&coachingPlanHasSpace(p);
  return <Grid key={p.planId} size={{xs:12,md:6,lg:4}}><Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2,height:"100%"}}><Typography variant="h2">{p.name}</Typography>{coach?<Button component={Link} href={`/communities/${snapshot.community.slug}/coaches/${coach.slug}`} size="small">{coach.displayName}</Button>:null}<Typography color="primary.main" style={{fontWeight:800}} sx={{mt:1}}>{coachingPlanPriceLabel(p)}</Typography><Typography color="text.secondary" sx={{mt:1}} variant="body2">{p.description}</Typography><Typography sx={{mt:1}} variant="body2">{p.paymentInstructions}</Typography>{existing?<Button component={Link} href={`/communities/${snapshot.community.slug}/coaching`} fullWidth variant="outlined" sx={{mt:2}}>{existing.status==="active"?"My coaching":"View request"}</Button>:<Box action={isReview?undefined:requestCommunityCoachingAction} component="form" sx={{mt:2}}><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="planId" type="hidden" value={p.planId}/><Button disabled={isReview||!canRequest} fullWidth type="submit" variant="outlined">Request coaching</Button></Box>}</Box></Grid>;
 })}</Grid></DashboardPanel></>;
}
export function CommunityDashboard({snapshot,section,isReview=false,baseOverride}:{snapshot:TraderLinkCommunityDashboardSnapshot;section:"home"|"coaching"|"coaches"|"workspace";isReview?:boolean;baseOverride?:string;discordClientId?:string|null}){
 if(section==="coaching")return <DashboardPage><CommunityNavigation snapshot={snapshot} baseOverride={baseOverride}/><Typography component="h1" variant="h1">My coaching</Typography><StudentCoachingWorkspace isReview={isReview} snapshot={snapshot}/></DashboardPage>;
 return <DashboardPage><CommunityNavigation snapshot={snapshot} baseOverride={baseOverride}/>{section==="home"?<Home snapshot={snapshot}/>:section==="workspace"?<CoachingWorkPage snapshot={snapshot}/>:<Coaches snapshot={snapshot} isReview={isReview}/>}</DashboardPage>;
}

function Home({snapshot}:{snapshot:TraderLinkCommunityDashboardSnapshot}){return <>
  <Grid container spacing={2}>{[{label:isCoachingStaff(snapshot.viewer.capabilities)?"Students":"Coaches",value:String(isCoachingStaff(snapshot.viewer.capabilities)?new Set(snapshot.relationships.filter(r=>r.coachUserId===snapshot.viewer.userId&&r.status==="active"&&!r.archivedAtUtc).map(r=>r.studentUserId)).size:snapshot.coaches.filter(c=>c.status==="active").length),icon:<SchoolRoundedIcon/>},{label:"Members",value:snapshot.community.memberCount.toLocaleString(),icon:<GroupsRoundedIcon/>}].map(x=><Grid key={x.label} size={{xs:12,sm:6,lg:3}}><DashboardPanel hideHeader><Stack direction="row" spacing={1.5} sx={{alignItems:"center"}}><Box sx={{color:"primary.main"}}>{x.icon}</Box><Box><Typography variant="h2">{x.value}</Typography><Typography color="text.secondary" variant="body2">{x.label}</Typography></Box></Stack></DashboardPanel></Grid>)}</Grid>

  <DashboardPanel title="Coaching in this community"><CoachCards snapshot={snapshot}/></DashboardPanel>
</>}
