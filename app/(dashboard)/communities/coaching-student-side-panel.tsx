"use client";
import Link from "next/link";
import {useEffect,useId,type ReactNode} from 'react';
import {Box,Button,Drawer,MenuItem,Stack,TextField,Typography} from '@mui/material';
import type {ButtonProps} from '@mui/material/Button';
import {CoachingReviewDraftGuard} from './coaching-review-draft-guard';

export function CoachingStudentSidePanel({title,student,closeHref,selectedPlan,plans,children,allPlansHref,directory=false}:{title:string;student:string;closeHref:string;selectedPlan:string;plans:readonly {id:string;name:string;href:string}[];children:ReactNode;allPlansHref?:string;directory?:boolean}){
 const id=useId(),closeId=`${id}-close`,titleId=`${id}-title`;
 return <Drawer anchor="right" open onClose={()=>document.getElementById(closeId)?.click()} slotProps={{paper:{role:'dialog','aria-modal':true,'aria-labelledby':titleId,sx:{width:{xs:'100%',md:720},maxWidth:'100vw',height:'100dvh',bgcolor:'background.default'}}}}>
  <CoachingReviewDraftGuard resetFormsOnDiscard title={`Unsaved ${title.toLowerCase()}`} description="Save or send your changes before leaving. Continuing discards unfinished text or selected attachments.">
   <Box sx={{position:'sticky',top:0,zIndex:1,bgcolor:'background.paper',borderBottom:1,borderColor:'divider',p:{xs:2,sm:3}}}>
    <Stack direction="row" spacing={2} sx={{alignItems:'center',justifyContent:'space-between'}}><Box><Typography id={titleId} component="h2" variant="h2">{title}</Typography><Typography color="text.secondary" variant="body2">{student}</Typography></Box><Button component={Link} autoFocus id={closeId} href={closeHref} variant="outlined">Close</Button></Stack>
    {plans.length>1?<TextField fullWidth size="small" sx={{mt:2,'& .MuiSelect-select':{whiteSpace:'normal'}}} select slotProps={{inputLabel:{shrink:true},select:{displayEmpty:true,renderValue:value=>plans.find(plan=>plan.id===value)?.name??'All plans'}}} label="Coaching plan" value={selectedPlan} onChange={e=>document.getElementById(`${id}-plan-${e.target.value}`)?.click()}>{allPlansHref?<MenuItem value="">All plans</MenuItem>:null}{plans.map(plan=><MenuItem sx={{whiteSpace:'normal'}} key={plan.id} value={plan.id}>{plan.name}</MenuItem>)}</TextField>:plans[0]?<Typography sx={{mt:1}} variant="body2">{plans[0].name}</Typography>:null}
    {allPlansHref?<Link hidden tabIndex={-1} aria-hidden="true" id={`${id}-plan-`} href={allPlansHref}>All plans</Link>:null}{plans.map(plan=><Link hidden tabIndex={-1} aria-hidden="true" id={`${id}-plan-${plan.id}`} key={plan.id} href={plan.href}>{plan.name}</Link>)}
   </Box>
   <Box onSubmitCapture={directory?event=>{const form=event.target;if(!(form instanceof HTMLFormElement))return;let input=form.querySelector<HTMLInputElement>('input[name=studentDirectory]');if(!input){input=document.createElement('input');input.type='hidden';input.name='studentDirectory';form.append(input);}input.value='yes';const params=new URLSearchParams(window.location.search);for(const key of ['q','view']){let field=form.querySelector<HTMLInputElement>(`input[name=directory${key}]`);if(!field){field=document.createElement('input');field.type='hidden';field.name=`directory${key}`;form.append(field);}field.value=params.get(key)??'';}}:undefined} sx={{p:{xs:2,sm:3},overflowWrap:'anywhere','& .MuiButton-root':{width:'auto',maxWidth:'100%'}}}>{children}</Box>
  </CoachingReviewDraftGuard>
 </Drawer>;
}

export function CoachingStudentFocus({section,taskId}:{section?:string;taskId?:string}){
 useEffect(()=>{if(!section&&!taskId)return;let second=0;const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{const target=document.getElementById(taskId?`coaching-task-${taskId}`:`student-section-${section}`);if(taskId)target?.scrollIntoView?.({block:'nearest'});target?.focus({preventScroll:true});});});return()=>{cancelAnimationFrame(first);cancelAnimationFrame(second);};},[section,taskId]);
 return null;
}

export function CoachingStudentLinkButton(props:Omit<ButtonProps<typeof Link>,'component'>&{href:string}){
 return <Button component={Link} {...props}/>;
}
