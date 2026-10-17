import {Button, Stack, Typography} from "@mui/material";
import {DashboardUnavailableState} from "@/app/dashboard-ui";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";

export function CoachingEmptyState({snapshot, title}: {snapshot:TraderLinkCommunityDashboardSnapshot; title:string}) {
  const base = `/communities/${snapshot.community.slug}`;
  const profile = snapshot.coaches.find(coach => coach.userId === snapshot.viewer.userId);
  const plans = snapshot.plans.filter(plan => plan.coachProfileId === profile?.coachProfileId);
  const students = snapshot.relationships.some(student => student.coachUserId === snapshot.viewer.userId && student.status === "active" && !student.archivedAtUtc);
  const step = !profile ? {text:"Save your coach profile, then create your first plan.", label:"Set up coach profile", href:`${base}/workspace/setup`}
    : !plans.length ? {text:"Create a coaching plan before students can request coaching.", label:"Create a plan", href:`${base}/workspace/setup/plans#coach-plan-builder`}
    : !plans.some(plan => plan.status === "active") ? {text:"Publish a plan when you are ready to accept coaching requests.", label:"Review plans", href:`${base}/workspace/plans`}
    : !students ? {text:"Students can request your published plans from Coaches. Open Students to check the Requests tab.", label:"Open Students", href:`${base}/workspace/students`}
    : {text:"Open a student workspace to prepare an agreement, create a review or schedule a session.", label:"Open Students", href:`${base}/workspace/students`};
  return <Stack spacing={1}><DashboardUnavailableState compact title={title} description=""/><Typography>{step.text}</Typography><Button href={step.href} variant="outlined">{step.label}</Button></Stack>;
}
