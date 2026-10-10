import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";
import { coachAcceptsStudents, coachingPlanHasSpace } from "@/src/modules/communities/contracts/coaching-plan-availability";
import { loadCommunityDashboard } from "../../../community-dashboard-loader";
import { requestCommunityCoachingAction } from "../../../community-actions";

export default async function CommunityCoachPage({params}:{params:Promise<{communitySlug:string;coachSlug:string}>}) {
  const {communitySlug,coachSlug}=await params;
  const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/coaches/${coachSlug}`);
  const coach=loaded.snapshot.coaches.find(item=>item.slug===coachSlug);
  if(!coach)notFound();
  const plans=loaded.snapshot.plans.filter(plan=>plan.coachProfileId===coach.coachProfileId&&plan.status==="active");
  const accepting=coach.status==="active"&&coachAcceptsStudents(plans,coach.coachProfileId);
  return <DashboardPage>
    <Typography component="a" href={`/communities/${communitySlug}/coaches`} sx={{color:"primary.main",fontWeight:800,textDecoration:"none"}}>← Back to coaches</Typography>
    <Grid container spacing={2}>
      <Grid size={{xs:12,lg:5}}><DashboardPanel hideHeader><Stack spacing={1.5}>
        <Stack direction="row" sx={{justifyContent:"space-between"}}><Typography component="h1" variant="h1">{coach.displayName}</Typography><Chip color={accepting?"success":"default"} label={accepting?"Accepting students":"At capacity"}/></Stack>
        <Typography color="primary.main" style={{fontWeight:800}}>{coach.headline}</Typography>
        <Typography sx={{lineHeight:1.7}}>{coach.biography}</Typography>
        <Typography style={{fontWeight:800}}>How coaching is provided</Typography>
        <Typography color="text.secondary">{coach.deliverySummary}</Typography>
      </Stack></DashboardPanel></Grid>
      <Grid size={{xs:12,lg:7}}><DashboardPanel title="Plans offered in this server"><Stack spacing={2}>
        {plans.map(plan=>{
          const existing=loaded.snapshot.relationships.find(r=>r.planId===plan.planId&&r.studentUserId===loaded.snapshot.viewer.userId&&(r.status==="active"||r.status==="pending"));
          const canRequest=coach.status==="active"&&coach.userId!==loaded.snapshot.viewer.userId&&coachingPlanHasSpace(plan);
          return <Stack key={plan.planId} sx={{border:1,borderColor:"divider",borderRadius:2,p:2}} spacing={1}>
            <Stack direction="row" sx={{justifyContent:"space-between"}}><Typography variant="h2">{plan.name}</Typography><Typography color="primary.main" style={{fontWeight:900}}>{plan.priceLabel}</Typography></Stack>
            <Typography color="text.secondary" variant="body2">{plan.description}</Typography>
            <Typography variant="body2">{plan.paymentInstructions}</Typography>
            <Typography variant="caption">{plan.activeStudents??0} of {plan.studentCapacity} places filled</Typography>
            {existing?<Button href={`/communities/${communitySlug}/coaching`} variant="outlined">{existing.status==="active"?"My coaching":"View request"}</Button>:<form action={loaded.isReview?undefined:requestCommunityCoachingAction}>
              <input name="communitySlug" type="hidden" value={communitySlug}/><input name="planId" type="hidden" value={plan.planId}/>
              <Button disabled={loaded.isReview||!canRequest} type="submit" variant="contained">Request coaching</Button>
            </form>}
          </Stack>;
        })}
      </Stack></DashboardPanel></Grid>
    </Grid>
  </DashboardPage>;
}
