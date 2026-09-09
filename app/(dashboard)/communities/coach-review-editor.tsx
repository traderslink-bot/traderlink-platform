import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type {TraderLinkCommunityTradeReview} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {CommunityTypography as Typography} from "./community-typography";
import {updateCommunityTradeReviewAction} from "./community-actions";

const statusLabel=(value:string)=>value.replaceAll("_"," ").replace(/^./,letter=>letter.toUpperCase());

export function CoachReviewEditor({communitySlug,relationshipId,review,previousFocus,isReview}:{communitySlug:string;relationshipId:string;review:TraderLinkCommunityTradeReview;previousFocus:string|null;isReview:boolean}){
 return <Box action={isReview?undefined:updateCommunityTradeReviewAction} component="form">
  <input name="communitySlug" type="hidden" value={communitySlug}/>
  <input name="relationshipId" type="hidden" value={relationshipId}/>
  <input name="reviewId" type="hidden" value={review.reviewId}/>
  <Stack spacing={2}>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{alignItems:{sm:"center"},justifyContent:"space-between"}}>
    <Box><Typography fontWeight={800}>{review.title}</Typography><Typography color="text.secondary" variant="caption">{statusLabel(review.reviewType)}{review.periodStart?` · ${review.periodStart} – ${review.periodEnd}`:""}</Typography></Box>
    <Chip color={review.status==="completed"?"success":"warning"} label={statusLabel(review.status)}/>
   </Stack>
   {review.studentContext?<Typography variant="body2">{review.studentContext}</Typography>:null}
   {previousFocus?<Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}><Typography fontWeight={800}>Previous focus</Typography><Typography sx={{mt:.5}} variant="body2">{previousFocus}</Typography><Grid container spacing={1} sx={{mt:.5}}><Grid size={{xs:12,md:4}}><TextField defaultValue={review.previousFocusStatus??"not_evaluated"} fullWidth label="Progress" name="previousFocusStatus" select><MenuItem value="not_evaluated">Not evaluated</MenuItem><MenuItem value="improving">Improving</MenuItem><MenuItem value="still_struggling">Still struggling</MenuItem><MenuItem value="achieved">Achieved</MenuItem><MenuItem value="replaced">Replaced</MenuItem></TextField></Grid><Grid size={{xs:12,md:8}}><TextField defaultValue={review.previousFocusAssessment} fullWidth label="Progress notes" name="previousFocusAssessment"/></Grid></Grid></Box>:null}
   <TextField defaultValue={review.coachFeedback} fullWidth label="Review" minRows={5} multiline name="coachFeedback"/>
   <Grid container spacing={1.5}>
    <Grid size={{xs:12,md:6}}><TextField defaultValue={review.wentWell} fullWidth label="What went well" minRows={3} multiline name="wentWell"/></Grid>
    <Grid size={{xs:12,md:6}}><TextField defaultValue={review.needsWork} fullWidth label="What needs work" minRows={3} multiline name="needsWork"/></Grid>
    <Grid size={{xs:12,md:6}}><TextField defaultValue={review.nextFocus} fullWidth label="Next focus" minRows={3} multiline name="nextFocus"/></Grid>
    <Grid size={{xs:12,md:6}}><TextField defaultValue={review.coachPrivateNotes} fullWidth label="Coach notes" minRows={3} multiline name="coachPrivateNotes"/></Grid>
   </Grid>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{justifyContent:"flex-end"}}><Button disabled={isReview} name="status" type="submit" value="in_review">Save draft</Button><Button disabled={isReview} name="status" type="submit" value="completed" variant="contained">Complete review</Button></Stack>
  </Stack>
 </Box>;
}
