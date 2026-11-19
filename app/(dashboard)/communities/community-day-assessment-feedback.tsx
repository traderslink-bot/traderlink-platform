import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type {CoachingDayAssessment} from '@/src/modules/communities/contracts/coaching-review-workspace';
import {DAY_SESSION_FIELDS} from '@/src/modules/communities/contracts/coaching-trading-day-evaluation';

/** Recorded accepted day answers, separate from individual trade evaluations. */
export function CommunityDayAssessmentFeedback({day}:{day:CoachingDayAssessment}){
 return <>{DAY_SESSION_FIELDS.filter(field=>day.sessionFeedback?.[field.id]?.trim()).map(field=><Box key={field.id}><Typography sx={{fontWeight:700}}>{field.title}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{day.sessionFeedback?.[field.id]}</Typography></Box>)}</>;
}
