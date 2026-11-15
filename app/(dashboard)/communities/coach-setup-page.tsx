"use client";
import type {TraderLinkCommunityCoachingSnapshot as TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/server/traderlink-community-platform-repository";

import {useRouter} from "next/navigation";
import {CoachingReviewDraftGuard} from "./coaching-review-draft-guard";
import {CoachingPlansPage} from "./coaching-plans-page";
import {useSyncExternalStore} from "react";
import {Box,Button,Grid,Stack,TextField} from "@mui/material";
import {DashboardPanel} from "@/app/dashboard-ui";

import {saveCommunityCoachAction} from "./community-actions";
import {useCoachingDraftNavigation} from "./coaching-draft-navigation";
import {CoachingPlanBuilder} from "./coaching-plan-builder";
import MuiTypography from "@mui/material/Typography";
import type {TypographyProps} from "@mui/material/Typography";

function Typography({fontWeight,style,...props}:TypographyProps&{fontWeight?:number}){return <MuiTypography {...props} style={{...style,fontWeight}}/>}

const subscribeHydration=()=>()=>{};
const clientReady=()=>true;
const serverReady=()=>false;

export function CoachSetupPage({snapshot,isReview=false,page="profile",editingPlanId}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview?:boolean;page?:"profile"|"plans"|"plan-list";editingPlanId?:string}){
 const profile=snapshot.coaches.find(item=>item.userId===snapshot.viewer.userId); const plans=profile?snapshot.plans.filter(item=>item.coachProfileId===profile.coachProfileId):[];
 const ready=useSyncExternalStore(subscribeHydration,clientReady,serverReady);
 const router=useRouter();
 const editingPlan=plans.find(plan=>plan.planId===editingPlanId)??null;
 const editorKey=editingPlan?`${editingPlan.planId}:${editingPlan.revision}`:"new";
 const navigation=useCoachingDraftNavigation(page==="profile"?"coach-profile-editor":"coach-plan-builder",`${profile?.coachProfileId??"no-profile"}:${editorKey}`);
 return <>{navigation.confirmation}{page==="profile"?<CoachingReviewDraftGuard readOnly={isReview} title="Unsaved profile changes" description="Save your profile before leaving, or discard your changes." resetFormsOnDiscard><Grid container spacing={2}><Grid size={{xs:12}}><DashboardPanel title="Coach profile"><Box id="coach-profile-editor" tabIndex={-1} sx={{scrollMarginTop:96}} action={isReview?undefined:saveCommunityCoachAction} component="form"><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="capacity" type="hidden" value="10000"/><Stack spacing={2} sx={{maxWidth:960}}>{!profile?<Typography>Save your coach profile first, then open Create plans.</Typography>:null}<Grid container spacing={2}><Grid size={{xs:12,md:5}}><TextField fullWidth defaultValue={profile?.displayName??snapshot.viewer.displayName} label="Coach name" name="displayName" required/></Grid><Grid size={{xs:12,md:7}}><TextField fullWidth defaultValue={profile?.headline} label="Headline" name="headline"/></Grid></Grid><TextField defaultValue={profile?.biography} label="About your coaching" minRows={3} multiline name="biography"/><TextField defaultValue={profile?.deliverySummary} label="How you coach" minRows={2} multiline name="deliverySummary"/><Stack direction="row" sx={{gap:1,flexWrap:"wrap"}}><Button disabled={isReview||!ready} type="submit" variant="contained">Save coach profile</Button>{profile?<Button href={`/communities/${snapshot.community.slug}/workspace/setup/plans`}>Create plans</Button>:null}</Stack></Stack></Box></DashboardPanel></Grid></Grid></CoachingReviewDraftGuard>:null}
 {page==="plans"?<>{!profile?<DashboardPanel title="Create plans"><Stack spacing={1}><Typography>Save your coach profile before creating a plan.</Typography><Button href={`/communities/${snapshot.community.slug}/workspace/setup`} variant="outlined">Set up coach profile</Button></Stack></DashboardPanel>:null}{profile?<DashboardPanel title={editingPlan?"Edit coaching plan":"Create coaching plan"}><CoachingPlanBuilder key={editingPlan?`${editingPlan.planId}:${editingPlan.revision}`:"new"} plan={editingPlan??undefined} onCancel={editingPlan?()=>navigation.requestChange(()=>router.push(`/communities/${snapshot.community.slug}/workspace/plans`)):undefined} coachProfileId={profile.coachProfileId} isReview={isReview} snapshot={snapshot}/></DashboardPanel>:null}</>:null}
 {page==="plan-list"?<CoachingPlansPage snapshot={snapshot} isReview={isReview} ready={ready}/>:null}</>;
}
