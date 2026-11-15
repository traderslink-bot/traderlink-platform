"use client";
import {PLATFORM_MUTATION_REQUEST_HEADER} from '@/src/modules/platform/contracts/platform-request-security';
import {useEffect,useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
type Image={imageId:string;roundTripId:string;filename:string};
export function IndependentReviewImages({reviewId,roundTripId,editable,onBlocked}:{reviewId:string;roundTripId?:string;editable:boolean;onBlocked?:(value:boolean)=>void}){
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0),[images,setImages]=useState<readonly Image[]>([]);
 useEffect(()=>{if(!file)return;const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 useEffect(()=>{const controller=new AbortController();fetch(`/api/coaching/review-image?reviewId=${encodeURIComponent(reviewId)}`,{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(setImages).catch(()=>{if(!controller.signal.aborted)setError('Review images could not be loaded.');});return()=>controller.abort();},[reviewId,revision]);
 async function mutate(imageId?:string){
  if(pending||!imageId&&!file)return;setPending(true);onBlocked?.(true);setError('');
  try{const form=new FormData();form.set('reviewId',reviewId);if(roundTripId)form.set('roundTripId',roundTripId);if(file)form.set('image',file);
   const response=await fetch(`/api/coaching/review-image${imageId?`?imageId=${encodeURIComponent(imageId)}`:''}`,{method:imageId?'DELETE':'POST',headers:{[PLATFORM_MUTATION_REQUEST_HEADER]:'1'},body:imageId?undefined:form,credentials:'same-origin'});if(!response.ok)throw Error();
   setFile(null);setPreview('');setRevision(value=>value+1);onBlocked?.(false);
  }catch{setError('The image could not be saved. Your feedback is retained.');onBlocked?.(Boolean(file));}finally{setPending(false);}
 }
 return <Box data-coaching-controlled-draft data-coaching-unsaved={file?'true':'false'} data-coaching-pending={pending?'true':'false'}><Stack spacing={2}>
  {error?<Alert severity="warning" action={<Button onClick={()=>{setError('');setRevision(value=>value+1);}}>Retry loading</Button>}>{error}</Alert>:null}
  <Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}>{images.filter(image=>image.roundTripId===(roundTripId??'')).map(image=><Box key={image.imageId}><Box component="a" href={`/api/coaching/review-image?imageId=${encodeURIComponent(image.imageId)}`} target="_blank" rel="noopener noreferrer"><Box component="img" src={`/api/coaching/review-image?imageId=${encodeURIComponent(image.imageId)}`} alt={image.filename} sx={{height:100,width:150,objectFit:'contain',border:1,borderColor:'divider',borderRadius:1}}/></Box>{editable?<Box><Button disabled={pending||Boolean(file)} onClick={()=>void mutate(image.imageId)}>Remove image</Button></Box>:null}</Box>)}</Stack>
  {editable?<><Box><Button component="label" variant="outlined" disabled={pending}>Upload images<input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={event=>{event.stopPropagation();const next=event.target.files?.[0]??null;if(next&&(next.size>8388608||!['image/png','image/jpeg','image/webp'].includes(next.type))){setError('Use a PNG, JPEG or WebP image of 8 MB or smaller.');event.target.value='';return;}setFile(next);onBlocked?.(Boolean(next));setError('');event.target.value='';}}/></Button><Typography variant="caption" color="text.secondary" sx={{display:'block',mt:.5}}>Upload marked up charts, candle stick patterns or any images that support your review. Use the screenshot feature in the TradingView chart (top of this card).</Typography></Box>{file?<Stack spacing={1}><Typography>{file.name}</Typography>{preview?<Box component="img" src={preview} alt="Selected chart preview" sx={{maxWidth:'100%',maxHeight:260,objectFit:'contain'}}/>:null}<Stack direction="row" spacing={1}><Button variant="contained" disabled={pending} onClick={()=>void mutate()}>{pending?'Uploading…':'Upload image'}</Button><Button disabled={pending} onClick={()=>{setFile(null);setPreview('');onBlocked?.(false);}}>Remove selected image</Button></Stack></Stack>:null}</>:null}
 </Stack></Box>;
}
