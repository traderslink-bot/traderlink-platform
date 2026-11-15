"use client";
import {CommunityCoachingFeedbackForm as CommunityPublicationForm} from './community-coaching-feedback-form';
import {Box,Button,Chip,MenuItem,Stack,TextField} from '@mui/material';
import {DashboardPanel} from '@/app/dashboard-ui';
import type {TraderLinkCommunityCoachingSnapshot as Snapshot} from '@/src/modules/communities/server/traderlink-community-platform-repository';
import type {TraderLinkCommunityRelationship as Relationship} from '@/src/modules/communities/contracts/traderlink-community-platform-contracts';
import {coachStudentLessons} from '@/src/modules/communities/contracts/coaching-student-directory';
import {CommunityTypography as Typography} from './community-typography';
import {saveCoachingTeachingProgressWithFeedbackAction} from './community-actions';

export function CoachStudentLessons({snapshot,relationships,disabled,workReturn}:{snapshot:Snapshot;relationships:readonly Relationship[];disabled:boolean;workReturn:string|null}){
 const lessons=coachStudentLessons(snapshot,relationships);
 return <DashboardPanel title="Included lessons"><Stack spacing={2}>
  {!lessons.length?<Typography>No lessons assigned to {relationships.length===1?'this plan':'this student'} yet.</Typography>:null}
  {lessons.map(lesson=><Box key={lesson.teachingId} id={`student-lesson-${lesson.teachingId}`} sx={{border:1,borderColor:'divider',borderRadius:2,p:2,scrollMarginTop:96}}><Stack spacing={1.5}>
   <Typography component="h2" variant="h3">{lesson.title}</Typography><Chip sx={{alignSelf:'flex-start'}} label={lesson.status} size="small"/>
   <Typography sx={{whiteSpace:'pre-wrap'}}>{lesson.body}</Typography>
   {lesson.scheduledAtUtc?<Typography variant="body2">Scheduled: {new Date(lesson.scheduledAtUtc).toLocaleString('en',{timeZone:'UTC'})} UTC</Typography>:null}
   {lesson.dueAtUtc?<Typography variant="body2">Due: {new Date(lesson.dueAtUtc).toLocaleString('en',{timeZone:'UTC'})} UTC</Typography>:null}
   <Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}>{lesson.deliveryUrl?<Button href={lesson.deliveryUrl} target="_blank" rel="noopener noreferrer" variant="outlined">Open lesson</Button>:null}{lesson.recordingUrl?<Button href={lesson.recordingUrl} target="_blank" rel="noopener noreferrer" variant="outlined">Watch recording</Button>:null}</Stack>
   {lesson.students.map(assignment=>{const relationship=relationships.find(r=>r.relationshipId===assignment.relationshipId)!;const agreementAccepted=snapshot.coachingAgreements?.some(agreement=>agreement.relationshipId===assignment.relationshipId&&agreement.status==="accepted");const readOnly=disabled||!agreementAccepted||relationship.status!=='active'||Boolean(relationship.archivedAtUtc)||relationship.accessStatus!=='active'||!['published','completed'].includes(lesson.status)||Boolean(lesson.availableAtUtc&&lesson.availableAtUtc>(snapshot.generatedAtUtc??new Date().toISOString()));return <Box key={assignment.relationshipId} data-coaching-action-only><CommunityPublicationForm action={saveCoachingTeachingProgressWithFeedbackAction} disabled={readOnly}>{locked=><>
    <input type="hidden" name="communitySlug" value={snapshot.community.slug}/><input type="hidden" name="relationshipId" value={relationship.relationshipId}/><input type="hidden" name="teachingId" value={lesson.teachingId}/><input type="hidden" name="returnTo" value="student"/><input type="hidden" name="returnSection" value="lessons"/><input type="hidden" name="workReturn" value={workReturn??''}/>
    <Stack spacing={1}>{!agreementAccepted?<Typography variant="body2" color="text.secondary">Awaiting student agreement</Typography>:null}<Typography variant="body2">{relationship.planName} · {assignment.status}</Typography><Stack direction={{xs:'column',sm:'row'}} spacing={1}><TextField select size="small" name="status" label="Lesson progress" disabled={locked} defaultValue={assignment.status==='assigned'?'attending':assignment.status}><MenuItem value="assigned" disabled>Assigned</MenuItem><MenuItem value="attending">Attending</MenuItem><MenuItem value="completed">Completed</MenuItem><MenuItem value="excused">Excused</MenuItem></TextField><Button type="submit" variant="outlined" disabled={locked}>Save progress</Button></Stack></Stack>
   </>}</CommunityPublicationForm></Box>;})}
  </Stack></Box>)}
 </Stack></DashboardPanel>;
}
