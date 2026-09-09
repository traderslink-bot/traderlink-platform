import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import {notFound} from "next/navigation";
import {DashboardPage,DashboardPanel} from "@/app/dashboard-ui";
import {createTraderLinkCommunityReviewFixture} from "@/src/modules/communities/server/traderlink-community-review-fixture";
import {loadCommunityDashboard} from "../../../../../../community-dashboard-loader";
import {CoachWorkspaceNavigation} from "../../../../../../coach-workspace-navigation";
import {CoachReviewEditor} from "../../../../../../coach-review-editor";
import {CoachTradeReviewWorkspace} from "../../../../../../coach-trade-review-workspace";
import {CommunityTypography as Typography} from "../../../../../../community-typography";

export default async function CoachReviewWorkspacePage({params}:{params:Promise<{communitySlug:string;relationshipId:string;reviewId:string}>}){
 const {communitySlug,relationshipId,reviewId}=await params;
 const isReview=communitySlug==="review";
 const snapshot=isReview?createTraderLinkCommunityReviewFixture("coach"):(await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/students/${relationshipId}/reviews/${reviewId}`)).snapshot;
 const relationship=snapshot.relationships.find(item=>item.relationshipId===relationshipId&&item.coachUserId===snapshot.viewer.userId);
 const review=snapshot.tradeReviews.find(item=>item.reviewId===reviewId&&item.relationshipId===relationshipId);
 if(!relationship||!review)notFound();
 const previous=snapshot.tradeReviews.find(item=>item.relationshipId===relationshipId&&item.reviewId!==reviewId&&Boolean(item.nextFocus)&&item.updatedAtUtc<review.updatedAtUtc);
 const trades=review.roundTripIds;
 return <DashboardPage>
  <CoachWorkspaceNavigation slug={communitySlug}/>
  <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{alignItems:{sm:"center"},justifyContent:"space-between"}}><Box><Typography component="h1" variant="h1">{review.title}</Typography><Typography color="text.secondary">{relationship.studentDisplayName} · {relationship.planName}</Typography></Box><Stack direction="row" spacing={1}><Button href={`/communities/${communitySlug}/workspace/students/${relationshipId}`} variant="outlined">Student workspace</Button><Button href={`/communities/${communitySlug}/workspace/students/${relationshipId}/reviews/${reviewId}/final`} variant="contained">Review and send</Button></Stack></Stack>
  <Grid container spacing={2}>
   <Grid size={{xs:12,lg:8}}><CoachTradeReviewWorkspace initialTradeIds={trades} isReview={isReview}/><DashboardPanel title="Overall review"><CoachReviewEditor communitySlug={communitySlug} isReview={isReview} previousFocus={previous?.nextFocus??null} relationshipId={relationshipId} review={review}/></DashboardPanel></Grid>
   <Grid size={{xs:12,lg:4}}><Stack spacing={2}><DashboardPanel title="Review agreement"><Stack spacing={1}><Typography fontWeight={800}>{relationship.planName}</Typography><Typography variant="body2">{review.reviewType.replaceAll("_"," ")}</Typography>{review.periodStart?<Typography variant="body2">{review.periodStart} – {review.periodEnd}</Typography>:null}<Stack direction="row" spacing={1}><Chip label={`${trades.length} ${trades.length===1?"trade":"trades"}`}/><Chip color="info" label="Overall review"/></Stack></Stack></DashboardPanel><DashboardPanel title="Review progress"><Stack spacing={1}><Typography variant="body2">Trade reviews saved: 0 of {trades.length}</Typography><Typography variant="body2">Overall review: In progress</Typography><Typography variant="body2">Final review: Not ready</Typography></Stack></DashboardPanel></Stack></Grid>
  </Grid>
 </DashboardPage>;
}
