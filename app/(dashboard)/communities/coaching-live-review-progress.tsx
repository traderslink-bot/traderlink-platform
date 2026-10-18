"use client";
import {useContext} from "react";
import {Typography} from "@mui/material";
import {CoachingReviewProgressContext,CoachingReviewDirtyContext} from "./coaching-resource-context";
export function CoachingLiveReviewProgress({reviewId,saved,total,ready}:{reviewId:string;saved:number;total:number;ready:boolean}){const {progress}=useContext(CoachingReviewProgressContext);const dirty=useContext(CoachingReviewDirtyContext);const current=progress?.reviewId===reviewId?progress:null;return <><Typography variant="body2">{current?.saved??saved} of {Math.max(total,current?.selected??0)} trade reviews completed</Typography>{dirty||current?.unsaved?<Typography color="warning.main" role="status">Unsaved review feedback</Typography>:null}<Typography variant="body2">Final review: {ready&&!dirty&&!current?.unsaved?'Ready':'Not ready'}</Typography></>;}
