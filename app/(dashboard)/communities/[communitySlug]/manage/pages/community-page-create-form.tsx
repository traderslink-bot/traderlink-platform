"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {useState} from "react";
import type {CommunityContentPageType} from "@/src/modules/communities/contracts/community-branded-content";

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

export function CommunityPageCreateForm({communitySlug,pageLimitReached,publishers,categories,action}:{communitySlug:string;pageLimitReached:boolean;publishers:ReadonlyArray<{userId:string;displayName:string}>;categories:ReadonlyArray<{categoryId:string;name:string}>;action:(data:FormData)=>Promise<never>}){
 const [family,setFamily]=useState<DestinationFamily>("alert");
 return <Box action={action} component="form"><input name="communitySlug" type="hidden" value={communitySlug}/><Stack spacing={2}>
  <Stack direction={{xs:"column",md:"row"}} spacing={2}><TextField name="title" label="Page name" required fullWidth/><TextField name="pageType" label="Content type" value={family} onChange={event=>setFamily(event.target.value as DestinationFamily)} select fullWidth>{[["alert","Alerts"],["watchlist","Watchlists"],["content","Content"]].map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField key={family} name="templateKey" label="Template" defaultValue={presets[family][0][0]} select fullWidth>{presets[family].map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField name="feedKind" label="Content filter" defaultValue="general" select fullWidth>{[["general","All content published here"],["publisher","One publisher"],["category","One category"],["publisher_category","Publisher and category"]].map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField name="permissionMode" label="Permission source" defaultValue="inherit" select fullWidth><MenuItem value="inherit">Inherit category access</MenuItem><MenuItem value="restricted">Only this page’s publishers</MenuItem></TextField></Stack>
  <Stack direction={{xs:"column",md:"row"}} spacing={2}><TextField name="slug" label="URL name" helperText="Lowercase letters, numbers and hyphens" required fullWidth/><TextField name="secondarySlug" label="Second URL name" helperText="Required for publisher and category pages" fullWidth/><TextField name="displayCount" type="number" label="Posts shown" defaultValue="20" slotProps={{htmlInput:{min:1,max:100}}} required fullWidth/></Stack>
  <Stack direction={{xs:"column",md:"row"}} spacing={2}><TextField name="publisherUserId" label="Publisher" defaultValue="" select fullWidth><MenuItem value="">None</MenuItem>{publishers.map(member=><MenuItem key={member.userId} value={member.userId}>{member.displayName}</MenuItem>)}</TextField><TextField name="categoryId" label="Category" defaultValue="" select fullWidth><MenuItem value="">None</MenuItem>{categories.map(category=><MenuItem key={category.categoryId} value={category.categoryId}>{category.name}</MenuItem>)}</TextField><TextField name="logoUrl" label="Logo URL" fullWidth/></Stack>
  <TextField name="description" label="Page description" multiline minRows={2}/><CreateMetadataChecks/><Box><Button disabled={pageLimitReached} type="submit" variant="contained">Create page</Button></Box>
 </Stack></Box>;
}

function CreateMetadataChecks(){return <Box><Typography sx={{fontWeight:700,mb:0.5}}>Automatic market details</Typography><Stack direction={{xs:"column",sm:"row"}} sx={{flexWrap:"wrap"}}>{metadataFields.map(([name,label])=><Box component="label" key={name} sx={{alignItems:"center",display:"inline-flex",gap:1,minHeight:40,mr:2}}><input defaultChecked={name!=="website"} name={name} type="checkbox"/>{label}</Box>)}</Stack></Box>;}
