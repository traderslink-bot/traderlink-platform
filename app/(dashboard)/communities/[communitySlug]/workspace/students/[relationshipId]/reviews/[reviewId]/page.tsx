import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import {notFound} from "next/navigation";
import {DashboardPage,DashboardPanel} from "@/app/dashboard-ui";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {TraderLinkCommunityCoachJournalReadService,type CoachStudentJournalTrade} from "@/src/modules/communities/server/traderlink-community-coach-journal-read-service";
import {loadCommunityDashboard} from "../../../../../../community-dashboard-loader";
import {CoachWorkspaceNavigation} from "../../../../../../coach-workspace-navigation";
import {CoachReviewEditor} from "../../../../../../coach-review-editor";
import {CoachTradeReviewWorkspacePersistent} from "../../../../../../coach-trade-review-workspace-persistent";
import {CommunityTypography as Typography} from "../../../../../../community-typography";

export default async function CoachReviewWorkspacePage({params}:{params:Promise<{communitySlug:string;relationshipId:string;reviewId:string}>}){
 const {communitySlug,relationshipId,reviewId}=await params;
 const isReview=communitySlug==="review";
 const snapshot=(await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/students/${relationshipId}/reviews/${reviewId}`)).snapshot;
 const relationship=snapshot.relationships.find(item=>item.relationshipId===relationshipId&&item.coachUserId===snapshot.viewer.userId);
 const review=snapshot.tradeReviews.find(item=>item.reviewId===reviewId&&item.relationshipId===relationshipId);
 if(!relationship||!review)notFound();
 const previous=snapshot.tradeReviews.find(item=>item.relationshipId===relationshipId&&item.reviewId!==reviewId&&Boolean(item.nextFocus)&&Boolean(item.deliveredAtUtc)&&item.updatedAtUtc<review.updatedAtUtc);
 const fixtureTrades:readonly CoachStudentJournalTrade[]=Object.freeze([{roundTripId:"10000000-0000-4000-8000-000000000050",symbol:"NVDA",direction:"long",openedAtUtc:"2026-09-04T14:05:00.000Z",closedAtUtc:"2026-09-04T15:12:00.000Z",state:"ready_closed",quantityDecimal:"100",entryPriceDecimal:"117.20",exitPriceDecimal:"119.06",netPnlDecimal:"186",grossPnlDecimal:"186",currency:"USD"},{roundTripId:"10000000-0000-4000-8000-000000000051",symbol:"AMD",direction:"long",openedAtUtc:"2026-09-04T15:10:00.000Z",closedAtUtc:"2026-09-04T16:01:00.000Z",state:"ready_closed",quantityDecimal:"200",entryPriceDecimal:"154.10",exitPriceDecimal:"154.66",netPnlDecimal:"112",grossPnlDecimal:"112",currency:"USD"},{roundTripId:"10000000-0000-4000-8000-000000000066",symbol:"TSLA",direction:"short",openedAtUtc:"2026-09-04T16:12:00.000Z",closedAtUtc:"2026-09-04T17:06:00.000Z",state:"ready_closed",quantityDecimal:"50",entryPriceDecimal:"231.30",exitPriceDecimal:"232.79",netPnlDecimal:"-74.5",grossPnlDecimal:"-74.5",currency:"USD"},{roundTripId:"10000000-0000-4000-8000-000000000067",symbol:"MSFT",direction:"long",openedAtUtc:"2026-09-03T14:20:00.000Z",closedAtUtc:"2026-09-03T15:15:00.000Z",state:"ready_closed",quantityDecimal:"40",entryPriceDecimal:"417.10",exitPriceDecimal:"418.30",netPnlDecimal:"48",grossPnlDecimal:"48",currency:"USD"}]);
 const canReadJournal=relationship.accessStatus!=="access_paused"&&snapshot.journalGrants.some(grant=>grant.relationshipId===relationshipId&&grant.status==="active"&&["trades","complete"].includes(grant.dataScope));const journalTrades=isReview?fixtureTrades:canReadJournal?withReadonlyPlatformDatabase({},database=>new TraderLinkCommunityCoachJournalReadService(database).read({coachUserId:snapshot.viewer.userId,relationshipId}).trades):[];
 const selected=snapshot.reviewTrades.filter(item=>item.reviewId===reviewId);
 const actions=snapshot.reviewActions.filter(item=>item.reviewId===reviewId);
 const attachments=snapshot.coachingAttachments.filter(item=>item.targetId===reviewId);
 const saved=selected.filter(item=>item.workflowState==="saved").length;
 const trades=selected.filter(item=>item.workflowState!=="removed");
 return <DashboardPage>
  <CoachWorkspaceNavigation slug={communitySlug}/>
  <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{alignItems:{sm:"center"},justifyContent:"space-between"}}><Box><Typography component="h1" variant="h1">{review.title}</Typography><Typography color="text.secondary">{relationship.studentDisplayName} · {relationship.planName}</Typography></Box><Stack direction="row" spacing={1}><Button href={`/communities/${communitySlug}/workspace/students/${relationshipId}`} variant="outlined">Student workspace</Button><Button href={`/communities/${communitySlug}/workspace/students/${relationshipId}/reviews/${reviewId}/final`} variant="contained">Review and send</Button></Stack></Stack>
  <Grid container spacing={2}>
   <Grid size={{xs:12,lg:8}}><CoachTradeReviewWorkspacePersistent actions={actions} reviewedTrades={snapshot.reviewTrades.filter(item=>snapshot.tradeReviews.some(other=>other.relationshipId===relationshipId&&other.reviewId===item.reviewId)&&item.workflowState==="saved").map(item=>({roundTripId:item.roundTripId,savedAtUtc:item.savedAtUtc}))} attachments={attachments} communitySlug={communitySlug} initialSelections={selected} isReview={isReview} relationshipId={relationshipId} reviewId={reviewId} readOnly={review.deliveryState!=="draft"||relationship.accessStatus==="access_paused"} lastReviewAt={snapshot.tradeReviews.filter(item=>item.relationshipId===relationshipId&&item.reviewId!==reviewId&&item.deliveredAtUtc).map(item=>item.deliveredAtUtc!).sort().at(-1)??null} trades={journalTrades}/><DashboardPanel title="Overall review"><CoachReviewEditor paused={relationship.accessStatus==="access_paused"} communitySlug={communitySlug} isReview={isReview} previousFocus={previous?.nextFocus??null} relationshipId={relationshipId} review={review}/></DashboardPanel></Grid>
   <Grid size={{xs:12,lg:4}}><Stack spacing={2}><DashboardPanel title="Review agreement"><Stack spacing={1}>{relationship.accessStatus==="access_paused"?<Chip color="error" label="Coaching access paused"/>:null}<Typography fontWeight={800}>{relationship.planName}</Typography><Typography variant="body2">{review.reviewType.replaceAll("_"," ")}</Typography>{review.periodStart?<Typography variant="body2">{review.periodStart} – {review.periodEnd}</Typography>:null}<Stack direction="row" spacing={1}><Chip label={`${trades.length} ${trades.length===1?"trade":"trades"}`}/><Chip color="info" label="Overall review"/></Stack></Stack></DashboardPanel><DashboardPanel title="Review progress"><Stack spacing={1}><Typography variant="body2">Trade reviews saved: {saved} of {trades.length}</Typography><Typography variant="body2">Overall review: {review.coachFeedback||review.wentWell||review.needsWork||review.nextFocus?"In progress":"Not started"}</Typography><Typography variant="body2">Final review: {saved===trades.length&&(saved>0||Boolean(review.coachFeedback))?"Ready":"Not ready"}</Typography></Stack></DashboardPanel></Stack></Grid>
  </Grid>
 </DashboardPage>;
}
