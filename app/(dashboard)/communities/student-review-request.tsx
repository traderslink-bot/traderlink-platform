"use client";
import {useState,useTransition} from "react";
import {Box,Button,Checkbox,FormControlLabel,Stack,TextField} from "@mui/material";
import type {CoachStudentJournalTrade} from "@/src/modules/communities/server/traderlink-community-coach-journal-read-service";
import {createCommunityExpandedReviewAction,loadStudentReviewTradesAction} from "./community-actions";
import {CommunityTypography as Typography} from "./community-typography";

export function StudentReviewRequest({communitySlug,relationshipId,disabled}:{communitySlug:string;relationshipId:string;disabled:boolean}){
 const [pending,startTransition]=useTransition();const [trades,setTrades]=useState<readonly CoachStudentJournalTrade[]>([]);const [selected,setSelected]=useState<string[]>([]);const [error,setError]=useState("");
 const load=()=>startTransition(async()=>{const form=new FormData();form.set("communitySlug",communitySlug);form.set("relationshipId",relationshipId);try{setTrades(await loadStudentReviewTradesAction(form));setError("");}catch{setError("Shared trades are unavailable. Check Journal sharing and coaching access.");}});
 return <Box action={disabled?undefined:createCommunityExpandedReviewAction} component="form" sx={{mt:2}}><input name="communitySlug" type="hidden" value={communitySlug}/><input name="relationshipId" type="hidden" value={relationshipId}/><input name="reviewType" type="hidden" value={selected.length===1?"single_trade":"multiple_trades"}/><input name="returnTo" type="hidden" value="student"/><Stack spacing={1}>
  <TextField label="Review title" name="title" required/><TextField label="What you want reviewed" multiline minRows={2} name="context"/>
  <Button disabled={disabled||pending} onClick={load} variant="outlined">Choose trades</Button>
  {error?<Typography color="error" role="alert">{error}</Typography>:null}
  {trades.length?<Stack sx={{maxHeight:320,overflowY:"auto"}}>{trades.map(trade=><FormControlLabel key={trade.roundTripId} label={`${trade.symbol} · ${trade.openedAtUtc.slice(0,10)} · ${trade.direction}`} control={<Checkbox checked={selected.includes(trade.roundTripId)} name="roundTripId" onChange={(_,on)=>setSelected(current=>on?[...current,trade.roundTripId]:current.filter(id=>id!==trade.roundTripId))} value={trade.roundTripId}/>}/>)}</Stack>:null}
  <Button disabled={disabled||pending} type="submit" variant="contained">Request review</Button>
 </Stack></Box>;
}
