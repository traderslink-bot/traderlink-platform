import {CommunityTradeEvaluationFeedback} from './community-trade-evaluation-feedback';
import {CommunityDayAssessmentFeedback} from './community-day-assessment-feedback';
import {performancePrimitive} from '@/src/modules/communities/contracts/coaching-performance-evaluation';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {DashboardPage,DashboardPanel} from "@/app/dashboard-ui";
import type {CommunityRetainedHistory} from "@/src/modules/communities/server/traderlink-community-platform-repository";
import {coachingTradeFeedbackText} from "@/src/modules/communities/contracts/coaching-trade-feedback";

/** Server-only presentation of a minimal saved-evidence DTO; no forms or live resources. */
export function CommunityRetainedHistoryPage({history}:{history:CommunityRetainedHistory}) {
 const base=`/communities/${history.slug}`;
 return <DashboardPage><Typography component="h1" variant="h1">Coaching history</Typography>
  <Stack spacing={3} sx={{minWidth:0,overflowWrap:"anywhere"}}>{history.relationships.map(relation=><DashboardPanel key={relation.relationshipId} title={relation.planName}>
   <Stack spacing={2}><Typography>{history.role==="coach"?relation.studentName:relation.coachName}</Typography>
    <Typography color="text.secondary">Read-only history. Current Journal data and coaching actions are unavailable here.</Typography>
    {relation.agreements.map((agreement,index)=><Typography key={index} variant="body2">Accepted agreement: {agreement.planName} · {agreement.acceptedAtUtc}</Typography>)}
    {relation.reviews.length?relation.reviews.map(review=><Box key={review.reviewId} sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}>
     <Stack spacing={1}><Typography component="h2" variant="h2">{review.title}</Typography><Chip label="Delivered" color="success" size="small" sx={{alignSelf:"flex-start"}}/>
      <Typography variant="body2">{review.deliveredAtUtc}</Typography>
      {[["Review",review.performanceEvaluationTemplate?"":review.summary],["What went well",review.wentWell],["What needs work",review.needsWork],["Next focus",review.nextFocus],...(history.role==="coach"?[["Private coach notes",review.coachPrivateNotes??""]]:[])].filter(([,text])=>text).map(([label,text])=><Box key={label}><Typography sx={{fontWeight:700}}>{label}</Typography><Typography sx={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{text}</Typography></Box>)}
      {review.performanceEvaluationTemplate?<CommunityTradeEvaluationFeedback subject="performance" template={performancePrimitive(review.performanceEvaluationTemplate)} value={review.summary} readOnly/>:null}
      {review.dayAssessments.map(day=><Box key={day.date}><Typography sx={{fontWeight:700}}>Trading day {day.date}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{day.assessment}</Typography><CommunityDayAssessmentFeedback day={day}/></Box>)}
      {review.trades.map((trade,index)=><Box key={index}><Typography sx={{fontWeight:700}}>{trade.label||`Trade ${index+1}`}</Typography><Box sx={{overflowWrap:"anywhere"}}>{review.tradeEvaluationTemplate?<CommunityTradeEvaluationFeedback template={review.tradeEvaluationTemplate} value={trade.feedback} readOnly/>:<Typography sx={{whiteSpace:"pre-wrap"}}>{coachingTradeFeedbackText(trade.feedback)}</Typography>}</Box></Box>)}
      {history.role==="coach"?<Button href={`${base}/workspace/students/${relation.relationshipId}/reviews/${review.reviewId}/final?view=history`} variant="outlined">Open saved review</Button>:null}
     </Stack></Box>):<Typography>No delivered reviews.</Typography>}
    {relation.records.map((record,index)=><Box key={`record-${index}`}><Typography sx={{fontWeight:700}}>{record.title}{record.private?" · Private coach note":""}</Typography><Typography sx={{whiteSpace:"pre-wrap"}}>{record.body}</Typography></Box>)}
    {relation.sessions.map((session,index)=><Box key={`session-${index}`}><Typography sx={{fontWeight:700}}>{session.title}</Typography><Typography sx={{whiteSpace:"pre-wrap"}}>{session.notes}</Typography>{session.coachPrivateNotes?<Typography sx={{whiteSpace:"pre-wrap"}}>Private coach notes: {session.coachPrivateNotes}</Typography>:null}</Box>)}
    {relation.attachments.map(image=><Box key={image.attachmentId}><Typography sx={{fontWeight:700}}>{image.context}</Typography><Typography variant="caption">{image.filename}</Typography><Box component="img" alt={image.filename} src={image.href} sx={{display:"block",maxWidth:"100%",maxHeight:480,borderRadius:1,mt:1}}/></Box>)}
    {relation.messages.map((message,index)=><Box key={`message-${index}`}><Typography sx={{fontWeight:700}}>{message.author}</Typography><Typography variant="caption">{message.atUtc}</Typography><Typography sx={{whiteSpace:"pre-wrap"}}>{message.body}</Typography></Box>)}
   </Stack></DashboardPanel>)}</Stack>
 </DashboardPage>;
}
