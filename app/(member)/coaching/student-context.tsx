"use client";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import {IndependentCoachingForm} from './coaching-form';
export type IndependentStudentContextModel={notes:{body:string;revision:number}|null;goals:{body:string;revision:number};history:readonly {kind:string;atUtc:string}[]};
const HISTORY:Record<string,string>={agreement_accepted:'Coaching agreement accepted',request_declined:'Enrollment request declined',request_withdrawn:'Enrollment request withdrawn',journal_access_updated:'Journal access updated',work_created:'Agreed work added',review_delivered:'Review delivered',goals_updated:'Student goals updated'};
export function IndependentStudentContext({enrollmentId,context,isCoach,active}:{enrollmentId:string;context:IndependentStudentContextModel;isCoach:boolean;active:boolean}){
 return <Stack spacing={3}>{isCoach&&context.notes?<Box>{active?<IndependentCoachingForm key={`notes-${context.notes.revision}`} intent="save_student_notes" label="Save notes" hidden={{enrollmentId,expectedRevision:String(context.notes.revision)}}><TextField label="Private coach notes" name="body" defaultValue={context.notes.body} helperText="Only this private note is hidden from the student. Your delivered review feedback is shared." multiline minRows={5}/></IndependentCoachingForm>:<Typography sx={{whiteSpace:'pre-wrap'}}>{context.notes.body||'No private notes saved.'}</Typography>}</Box>:null}
 <Box><Typography variant="h3" sx={{mb:1}}>Student goals</Typography>{!isCoach&&active?<IndependentCoachingForm key={`goals-${context.goals.revision}`} intent="save_student_goals" label="Save goals" hidden={{enrollmentId,expectedRevision:String(context.goals.revision)}}><TextField label="Goals for this coaching plan" name="body" defaultValue={context.goals.body} multiline minRows={5} helperText="Your coach can see these goals. Save them before submitting work; each submitted review keeps the goals from that time."/></IndependentCoachingForm>:<Typography sx={{whiteSpace:'pre-wrap'}}>{context.goals.body||'The student has not added coaching goals yet.'}</Typography>}</Box>
 <Accordion disableGutters><AccordionSummary>Coaching activity</AccordionSummary><AccordionDetails><Stack spacing={1}>{context.history.filter(event=>HISTORY[event.kind]).map((event,index)=><Typography key={`${event.atUtc}-${index}`} variant="body2">{HISTORY[event.kind]} · {new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'}).format(new Date(event.atUtc))} ET</Typography>)}{!context.history.length?<Typography>No coaching activity yet.</Typography>:null}</Stack></AccordionDetails></Accordion>
 </Stack>;
}
