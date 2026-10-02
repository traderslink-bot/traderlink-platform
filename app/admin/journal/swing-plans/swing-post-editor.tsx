"use client";
import { useState } from "react";
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
type Channel='premium'|'free';
type Preview={publicationId:string;version:number;deliveryId?:string;configured:boolean;previousAttempt:boolean;payload:{content:string;embeds:{title:string;description:string;url:string}[]}};
export function SwingPostEditor({id,defaultComment,freeComment}:{id:string;defaultComment:string;freeComment:string}){
  const [channel,setChannel]=useState<Channel>('premium'),[comments,setComments]=useState({premium:defaultComment,free:freeComment}),[preview,setPreview]=useState<Preview|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const comment=comments[channel];
  const [deliveries,setDeliveries]=useState<{delivery_id:string;channel_kind:Channel;version:number;state:string;status_message:string;updated_at_ms:number}[]>([]);
  const [checkedAt,setCheckedAt]=useState(0);
  const act=async(action:'preview'|'send'|'resolve',resolution?:{deliveryId:string;posted:boolean},saved?:{deliveryId:string;channel:Channel})=>{setBusy(true);setMessage('');try{
    const target=saved?.channel??channel;
    const r=await fetch('/api/admin/journal/swing-plans/discord',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','x-traderlink-journal-admin-request':'1'},body:JSON.stringify({action,id,channel:target,comment:comments[target],publicationId:preview?.publicationId,deliveryId:saved?.deliveryId??(action==='send'?preview?.deliveryId:undefined),...resolution})});
    const result=await r.json();if(!r.ok)throw Error(result.error||'Unable to send.');
    if(action==='preview'){setChannel(target);setPreview(result.preview);setDeliveries(result.deliveries);setCheckedAt(Date.now());}
    else{setMessage(result.message);setPreview(null);setDeliveries(result.deliveries??[]);setCheckedAt(Date.now());}
  }catch(e){setMessage(e instanceof Error?e.message:'Delivery unavailable.');}finally{setBusy(false);}};
  return <Stack spacing={1}><Typography variant="h2">Discord post</Typography>
    <TextField select label="Destination" value={channel} disabled={busy} onChange={e=>{setChannel(e.target.value as Channel);setPreview(null);setMessage('');}}><MenuItem value="premium">Premium swing channel</MenuItem><MenuItem value="free">Free channel</MenuItem></TextField>
    <TextField multiline minRows={4} label={channel==='free'?'Your free-channel comment — no ticker or thesis':'Thesis or update comment'} value={comment} disabled={busy} onChange={e=>{setComments(current=>({...current,[channel]:e.target.value}));setPreview(null);}} helperText={channel==='free'?'Only your comment and the link are posted. The public embed is shown below.':'The ticker and full-plan link are added automatically.'}/>
    <Button disabled={busy} onClick={()=>void act('preview')}>Preview post / check delivery</Button>
    {preview?.previousAttempt&&<Alert severity="info">Saved post for published version {preview.version}. Retrying sends this exact message, not a newer version. The page link opens the current published plan. A successful post will not be sent twice.</Alert>}
    {preview&&<Box sx={{border:1,borderColor:'divider',p:2,borderRadius:2}}><Typography sx={{whiteSpace:'pre-wrap'}}>{preview.payload.content}</Typography>{preview.payload.embeds.map(e=><Box key={e.url} sx={{borderLeft:3,borderColor:'primary.main',pl:2,mt:2}}><Typography sx={{fontWeight:700}}>{e.title}</Typography><Typography>{e.description}</Typography><Typography variant="caption">TradersLink · generic logo preview</Typography></Box>)}<Button variant="contained" disabled={busy||!preview.configured} onClick={()=>void act('send')}>Send to {channel==='free'?'Free channel':'Premium swing channel'}</Button>{!preview.configured&&<Alert severity="info">This swing-plan channel has not been configured yet.</Alert>}</Box>}
    {message&&<Alert severity="info">{message}</Alert>}
    {deliveries.map(d=><Box key={d.delivery_id}><Typography>{d.channel_kind==='free'?'Free channel':'Premium swing channel'} · Version {d.version}: {d.status_message}</Typography><Typography variant="caption">{new Date(d.updated_at_ms).toLocaleString()}</Typography>{d.state==='failed'&&<Button disabled={busy} onClick={()=>void act('preview',undefined,{deliveryId:d.delivery_id,channel:d.channel_kind})}>Preview saved post for retry</Button>}{(d.state==='uncertain'||d.state==='sending'&&d.updated_at_ms<checkedAt-60000)&&<Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Button disabled={busy} onClick={()=>{if(window.confirm('Confirm you checked Discord and found this post. This marks it delivered without sending anything.'))void act('resolve',{deliveryId:d.delivery_id,posted:true});}}>I found the post in Discord</Button><Button disabled={busy} onClick={()=>{if(window.confirm('Confirm you checked Discord and this post is absent. This enables a retry; it does not send yet.'))void act('resolve',{deliveryId:d.delivery_id,posted:false});}}>Not posted — allow retry</Button></Stack>}</Box>)}
  </Stack>;
}
