"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {useState} from "react";
import type {CommunityContentFeedKind,CommunityContentPageType} from "@/src/modules/communities/contracts/community-branded-content";

type DestinationFamily=Exclude<CommunityContentPageType,"swing">;

const presets={
 alert:[["standard_alert","Alert"],["watchlist_list","Watchlist list"],["research_swing","Detailed research"]],
 watchlist:[["watchlist_list","Watchlist list"],["standard_alert","Alert"],["research_swing","Detailed research"]],
 content:[["article","Article"],["research_report","Research report"],["guide","Guide / tutorial"],["brief_update","Brief update"]],
} as const;

const metadataFields=[
 ["publicationPrice","Price when published"],
 ["company","Company"],
 ["exchange","Exchange"],
 ["industry","Industry"],
 ["website","Website"],
 ["marketCap","Market cap"],
] as const;

export function CommunityPageCreateForm({communitySlug,pageLimitReached,publishers,categories,discordDestinations,action}:{communitySlug:string;pageLimitReached:boolean;publishers:ReadonlyArray<{userId:string;displayName:string}>;categories:ReadonlyArray<{categoryId:string;name:string}>;discordDestinations:ReadonlyArray<{destinationId:string;name:string;contentType:"alerts"|"watchlists"|"general"}>;action:(data:FormData)=>Promise<never>}){
 const [family,setFamily]=useState<DestinationFamily>("alert");
 const [feedKind,setFeedKind]=useState<CommunityContentFeedKind>("general");
 const needsPublisher=feedKind==="publisher"||feedKind==="publisher_category",needsCategory=feedKind==="category"||feedKind==="publisher_category",needsSecondSlug=feedKind==="publisher_category";
 return <Box action={action} component="form"><input name="communitySlug" type="hidden" value={communitySlug}/><Stack spacing={2}>
  <Stack direction={{xs:"column",md:"row"}} spacing={2}><TextField name="title" label="Destination name" required fullWidth/><TextField name="pageType" label="Content type" value={family} onChange={event=>setFamily(event.target.value as DestinationFamily)} select fullWidth>{[["alert","Alerts"],["watchlist","Watchlists"],["content","Content"]].map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField key={family} name="templateKey" label="Template" defaultValue={presets[family][0][0]} select fullWidth>{presets[family].map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField name="feedKind" label="Content filter" value={feedKind} onChange={event=>setFeedKind(event.target.value as CommunityContentFeedKind)} select fullWidth>{[["general","All content published here"],["publisher","One publisher"],["category","One topic"],["publisher_category","Publisher and topic"]].map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField name="permissionMode" label="Who can publish" defaultValue="inherit" select fullWidth><MenuItem value="inherit">Assigned groups and individuals</MenuItem><MenuItem value="restricted">Individuals only</MenuItem></TextField></Stack>
  <Stack direction={{xs:"column",md:"row"}} spacing={2}><TextField name="slug" label="URL name" helperText="The destination address; it does not need to match a person or topic name." required fullWidth/>{needsSecondSlug?<TextField name="secondarySlug" label="Second URL name" helperText="Adds the second address segment for a publisher-and-topic destination." required fullWidth/>:null}<TextField name="displayCount" type="number" label="Posts shown" defaultValue="20" slotProps={{htmlInput:{min:1,max:100}}} required fullWidth/></Stack>
  <Stack direction={{xs:"column",md:"row"}} spacing={2}>{needsPublisher?<TextField name="publisherUserId" label="Publisher filter" defaultValue="" select required fullWidth><MenuItem value="" disabled>Choose a publisher</MenuItem>{publishers.map(member=><MenuItem key={member.userId} value={member.userId}>{member.displayName}</MenuItem>)}</TextField>:null}{needsCategory?<TextField name="categoryId" label="Topic" defaultValue="" select required fullWidth><MenuItem value="" disabled>Choose a topic</MenuItem>{categories.map(category=><MenuItem key={category.categoryId} value={category.categoryId}>{category.name}</MenuItem>)}</TextField>:null}<TextField key={`discord-${family}`} name="discordDestinationId" label="Connected Discord channel" defaultValue="" select fullWidth><MenuItem value="">No connected channel</MenuItem>{discordDestinations.filter(item=>item.contentType===(family==="alert"?"alerts":family==="watchlist"?"watchlists":"general")).map(item=><MenuItem key={item.destinationId} value={item.destinationId}>#{item.name}</MenuItem>)}</TextField><TextField name="logoUrl" label="Logo URL" fullWidth/></Stack>
  <TextField name="description" label="Page description" multiline minRows={2}/><CreateMetadataChecks/><Box><Button disabled={pageLimitReached} type="submit" variant="contained">Create page</Button></Box>
 </Stack></Box>;
}

export function DestinationSecondSlugField({feedKind,secondarySlug}:{feedKind:CommunityContentFeedKind;secondarySlug:string|null}){return feedKind==="publisher_category"?<TextField name="secondarySlug" label="Second URL name" helperText={secondarySlug===null?"This legacy destination can keep its current address until you intentionally add a second segment.":"The second address segment for this publisher-and-topic destination."} defaultValue={secondarySlug??""} required={secondarySlug!==null} fullWidth/>:null;}
export function DestinationCategoryField({feedKind,categoryId,categories}:{feedKind:CommunityContentFeedKind;categoryId:string|null;categories:ReadonlyArray<{categoryId:string;name:string}>}){return feedKind==="category"||feedKind==="publisher_category"?<TextField name="categoryId" label="Topic" defaultValue={categoryId??""} select required={categoryId!==null} fullWidth><MenuItem value="" disabled={categoryId!==null}>{categoryId===null?"Legacy destination has no topic":"Choose a topic"}</MenuItem>{categories.map(category=><MenuItem key={category.categoryId} value={category.categoryId}>{category.name}</MenuItem>)}</TextField>:null;}

function CreateMetadataChecks(){return <Box><Typography sx={{fontWeight:700,mb:0.5}}>Automatic market details</Typography><Stack direction={{xs:"column",sm:"row"}} sx={{flexWrap:"wrap"}}>{metadataFields.map(([name,label])=><Box component="label" key={name} sx={{alignItems:"center",display:"inline-flex",gap:1,minHeight:40,mr:2}}><input defaultChecked={name!=="website"} name={name} type="checkbox"/>{label}</Box>)}</Stack></Box>;}
