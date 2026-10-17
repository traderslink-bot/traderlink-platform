"use client";
import {usePublicationLock} from "./community-publication-form";
import {useState} from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
export function CommunityDestinationPicker({publishing,kind,objectId}:{publishing:TraderLinkCommunityDashboardSnapshot["publishing"];kind:"alerts"|"watchlists";objectId?:string}){
 const locked=usePublicationLock();
 const options=publishing?.destinations.filter(item=>item.contentType===kind)??[];
 const saved=objectId?publishing?.intents[`${kind==="alerts"?"alert":"watchlist"}:${objectId}`]:undefined;
 const [mode,setMode]=useState(saved?.distribution??"discord");
 const [selected,setSelected]=useState<readonly string[]>(saved?.destinationIds??(options.length===1?[options[0].destinationId]:[]));
 const missing=selected.filter(id=>!options.some(option=>option.destinationId===id));
 return <Stack spacing={1}><TextField disabled={locked} select label="Distribution" name="distribution" value={mode} onChange={event=>setMode(event.target.value as "website"|"discord")}><MenuItem value="website">Save on TraderLink without a Discord post</MenuItem><MenuItem value="discord">Send to Discord</MenuItem></TextField>{<><Typography variant="body2">Choose the exact channels for this publication.</Typography>{!options.length?<Typography role="status">No permitted destinations. Ask the community owner to assign a channel before publishing.</Typography>:null}{options.map(option=><FormControlLabel key={option.destinationId} label={`#${option.name}`} control={<Checkbox disabled={locked} name="destinationId" value={option.destinationId} checked={selected.includes(option.destinationId)} onChange={(_,checked)=>setSelected(current=>checked?[...current,option.destinationId]:current.filter(id=>id!==option.destinationId))}/>}/>)}{missing.length?<><Typography color="error" role="alert">Previously selected channels are no longer available. Remove them before publishing.</Typography>{missing.map(id=><FormControlLabel key={id} label="Remove unavailable channel" control={<Checkbox disabled={locked} name="destinationId" value={id} checked onChange={()=>setSelected(current=>current.filter(item=>item!==id))}/>}/>)}</>:null}<Typography variant="body2">Selected: {options.filter(option=>selected.includes(option.destinationId)).map(option=>`#${option.name}`).join(", ")||"None"}. Delivery is confirmed only after Discord returns a receipt.</Typography></>}<Typography variant="body2">{mode==="discord"?"The selected channels receive your chosen post format. TraderLink follows their viewing permissions.":"No Discord message will be sent. The selected channel association still controls who can view this on TraderLink."}</Typography></Stack>;
}
