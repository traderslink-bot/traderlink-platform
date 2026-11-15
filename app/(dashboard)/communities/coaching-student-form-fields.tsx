"use client";
import type {ReactNode} from 'react';
import {useFormStatus} from 'react-dom';
import {Box,Typography} from '@mui/material';
export function CoachingStudentFormFields({children}:{children:ReactNode}){
 const {pending}=useFormStatus();
 return <Box component="fieldset" disabled={pending} data-coaching-pending={pending?'true':undefined} sx={{border:0,p:0,m:0,minWidth:0}}>{pending?<Typography role="status" sx={{mb:1}}>Saving…</Typography>:null}{children}</Box>;
}
