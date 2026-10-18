import {coachingReviewLabel} from "@/src/modules/communities/contracts/coaching-review-workspace";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type {TraderLinkCommunityTradeReview} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {CommunityTypography as Typography} from "./community-typography";
import {updateCommunityTradeReviewAction} from "./community-actions";

const statusLabel=(value:string)=>value==="in_review"?"In progress":value==="requested"?"Not started":value.replaceAll("_"," ").replace(/^./,letter=>letter.toUpperCase());

export function CoachReviewEditor({communitySlug,relationshipId,review,previousFocus,isReview,paused=false}:{communitySlug:string;relationshipId:string;review:TraderLinkCommunityTradeReview;previousFocus:string|null;isReview:boolean;paused?:boolean}){
 const disabled=isReview||paused||review.acceptanceState==="pending"||review.deliveryState!=="draft";
 const overall=true;
 const nextSteps=true;
 return <Box action={disabled?undefined:updateCommunityTradeReviewAction} component="form">
  <input name="communitySlug" type="hidden" value={communitySlug}/>
  <input name="relationshipId" type="hidden" value={relationshipId}/>
  <input name="stayInReview" type="hidden" value="yes"/>
  <input name="reviewId" type="hidden" value={review.reviewId}/>
  <Stack spacing={2}>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{alignItems:{sm:"center"},justifyContent:"space-between"}}>
    <Box><Typography sx={{ fontWeight: 800 }}>{review.title}</Typography><Typography color="text.secondary" variant="caption">{coachingReviewLabel(review.workspaceKind,review.reviewType)}{review.periodStart?` · ${review.periodStart} – ${review.periodEnd}`:""}</Typography></Box>
    <Chip color={review.deliveryState==="draft"?"warning":review.deliveryState==="cancelled"?"default":"success"} label={review.deliveryState==="draft"?(review.acceptanceState==="pending"?"Pending acceptance":statusLabel(review.status)):review.deliveryState==="follow_up"?"Follow-up required":statusLabel(review.deliveryState)}/>
   </Stack>
   {review.studentContext?<Typography variant="body2">{review.studentContext}</Typography>:null}
   {previousFocus?<Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}><Typography sx={{ fontWeight: 800 }}>Previous focus</Typography><Typography sx={{mt:.5}} variant="body2">{previousFocus}</Typography><Grid container spacing={1} sx={{mt:.5}}><Grid size={{xs:12,md:4}}><TextField disabled={disabled} defaultValue={review.previousFocusStatus??"not_evaluated"} fullWidth label="Progress" name="previousFocusStatus" select slotProps={{select:{native:true}}}><option value="not_evaluated">Not evaluated</option><option value="improving">Improving</option><option value="still_struggling">Still struggling</option><option value="achieved">Achieved</option><option value="replaced">Replaced</option></TextField></Grid><Grid size={{xs:12,md:8}}><TextField disabled={disabled} defaultValue={review.previousFocusAssessment} fullWidth label="Progress notes" name="previousFocusAssessment"/></Grid></Grid></Box>:null}
   <TextField disabled={disabled} defaultValue={review.coachFeedback} fullWidth label={review.workspaceKind==="strategy"?"Strategy assessment":"Review summary"} minRows={5} multiline name="coachFeedback"/>
   <Grid container spacing={1.5}>
    {overall||review.wentWell?<Grid size={{xs:12,md:6}}><TextField disabled={disabled} defaultValue={review.wentWell} fullWidth label="What went well" minRows={3} multiline name="wentWell"/></Grid>:null}
    {overall||review.needsWork?<Grid size={{xs:12,md:6}}><TextField disabled={disabled} defaultValue={review.needsWork} fullWidth label="What needs work" minRows={3} multiline name="needsWork"/></Grid>:null}
    {nextSteps||review.nextFocus?<Grid size={{xs:12,md:6}}><TextField disabled={disabled} defaultValue={review.nextFocus} fullWidth label="Next focus" minRows={3} multiline name="nextFocus"/></Grid>:null}
    <Grid size={{xs:12,md:6}}><TextField disabled={disabled} defaultValue={review.coachPrivateNotes} fullWidth label="Private coach notes" minRows={3} multiline name="coachPrivateNotes"/></Grid>
   </Grid>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{justifyContent:"flex-end"}}><Button disabled={disabled} name="status" type="submit" value="in_review" variant="contained">Save draft</Button></Stack>
  </Stack>
 </Box>;
}
