"use client";

import {useActionState, useEffect, useState} from "react";
import {Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField} from "@mui/material";
import type {TraderLinkCommunityDashboardSnapshot, TraderLinkCommunityTeachingItem} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {createCoachingTeachingWithFeedbackAction} from "./community-actions";
import {CommunityTypography as Typography} from "./community-typography";

export function CoachingLessonComposer({snapshot, source, disabled, onPendingChange}: {
  snapshot: TraderLinkCommunityDashboardSnapshot;
  source?: TraderLinkCommunityTeachingItem;
  disabled: boolean;
  onPendingChange: (pending:boolean) => void;
}) {
  const [submission, setSubmission] = useState("draft");
  const [feedback, save, pending] = useActionState(createCoachingTeachingWithFeedbackAction, {error:""});
  useEffect(() => {onPendingChange(pending);}, [pending, onPendingChange]);
  const [title, setTitle] = useState(source?.title ?? "");
  const [kind, setKind] = useState(source?.teachingType ?? "lesson");
  const [body, setBody] = useState(source?.body ?? "");
  const [url, setUrl] = useState(source?.deliveryUrl ?? "");
  const [schedule, setSchedule] = useState("");
  const [audience, setAudience] = useState(source?.audienceMode ?? "all_students");
  const [planId, setPlanId] = useState(source?.planId ?? "");
  const [selected, setSelected] = useState(source?.students.map(student => student.relationshipId) ?? []);
  const students = snapshot.relationships.filter(student => student.coachUserId === snapshot.viewer.userId && student.status === "active" && !student.archivedAtUtc);
  const profile = snapshot.coaches.find(coach => coach.userId === snapshot.viewer.userId);
  const plans = snapshot.plans.filter(plan => plan.coachProfileId === profile?.coachProfileId);
  const recipients = students.filter(student => audience === "all_students" || (audience === "plan" ? student.planId === planId : selected.includes(student.relationshipId)));

  return <Box id="coach-lesson-composer" tabIndex={-1} sx={{scrollMarginTop:96}} component="form" onSubmit={event => setSubmission((event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "on" ? "publish" : "draft")} action={disabled ? undefined : save}>
    <input name="communitySlug" type="hidden" value={snapshot.community.slug}/>
    <input name="sourceTeachingId" type="hidden" value={source?.teachingId ?? ""}/>
    <Stack spacing={1.5}>
      {pending ? <Typography role="status">{submission === "publish" ? "Publishing lesson…" : "Saving draft…"} Editing and Reuse will be available when this finishes.</Typography> : null}
      {source ? <Alert severity="info">Reusing “{source.title}”. Saving creates a separate lesson.</Alert> : null}
      <TextField disabled={disabled || pending} label="Title" name="title" required value={title} onChange={event => setTitle(event.target.value)}/>
      <TextField disabled={disabled || pending} label="Type" name="teachingType" select value={kind} onChange={event => setKind(event.target.value as typeof kind)}>
        <MenuItem value="lesson">Lesson</MenuItem><MenuItem value="class">Class</MenuItem><MenuItem value="assignment">Assignment</MenuItem>
      </TextField>
      <TextField disabled={disabled || pending} label="Content" name="body" minRows={4} multiline value={body} onChange={event => setBody(event.target.value)}/>
      <TextField disabled={disabled || pending} label="Delivery link" name="deliveryUrl" type="url" value={url} onChange={event => setUrl(event.target.value)}/>
      <TextField disabled={disabled || pending} label="Schedule (UTC)" name="scheduledAt" type="datetime-local" value={schedule} onChange={event => setSchedule(event.target.value)} slotProps={{inputLabel:{shrink:true}}}/>
      <TextField disabled={disabled || pending} label="Audience" name="audienceMode" select value={audience} onChange={event => setAudience(event.target.value as typeof audience)}>
        <MenuItem value="all_students">All students</MenuItem><MenuItem value="plan">Plan</MenuItem><MenuItem value="selected_students">Selected students</MenuItem>
      </TextField>
      {audience === "plan" ? <TextField disabled={disabled || pending} label="Plan" name="planId" select value={planId} onChange={event => setPlanId(event.target.value)}>
        <MenuItem value="">Choose a plan</MenuItem>{plans.map(plan => <MenuItem key={plan.planId} value={plan.planId}>{plan.name}</MenuItem>)}
      </TextField> : null}
      {audience === "selected_students" ? <Stack component="fieldset" sx={{border:0,p:0,m:0}}>
        <Typography component="legend">Choose students</Typography>
        {students.map(student => <FormControlLabel key={student.relationshipId} label={student.studentDisplayName} control={<Checkbox disabled={disabled || pending} name="relationshipId" value={student.relationshipId} checked={selected.includes(student.relationshipId)} onChange={event => setSelected(current => event.target.checked ? [...current, student.relationshipId] : current.filter(id => id !== student.relationshipId))}/>}/>)}
      </Stack> : null}
      <Box role="status" aria-live="polite">
        <Typography sx={{fontWeight:700}}>Recipients: {recipients.length} {recipients.length === 1 ? "student" : "students"}</Typography>
        {recipients.length ? <Box component="details"><Box component="summary" sx={{cursor:"pointer"}}>View recipients</Box>{recipients.map(student => <Typography key={student.relationshipId}>{student.studentDisplayName}</Typography>)}</Box>
          : <Typography>No active students match this audience. Choose a different audience or save a draft until students are enrolled.</Typography>}
      </Box>
      <Typography variant="body2">Save a draft to keep working privately. Publishing makes the lesson available to the students listed above.</Typography>
      {feedback.error ? <Alert severity="error" role="alert">{feedback.error}</Alert> : null}
      <Stack direction={{xs:"column",sm:"row"}} spacing={1}>
        <Button disabled={disabled || pending} type="submit" name="publish" value="" variant="outlined">{pending && submission === "draft" ? "Saving draft…" : "Save draft"}</Button>
        <Button disabled={disabled || pending || !recipients.length} type="submit" name="publish" value="on" variant="contained">{pending && submission === "publish" ? "Publishing lesson…" : "Publish lesson"}</Button>
      </Stack>
    </Stack>
  </Box>;
}
