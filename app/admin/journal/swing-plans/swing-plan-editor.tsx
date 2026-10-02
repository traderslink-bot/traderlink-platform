"use client";
import { useEffect, useState } from "react";
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { newSwingPlan, type SwingPlanDocument } from "@/src/modules/swings/swing-plan-contract";
import type { SwingPlanSummary } from "@/src/modules/swings/server/swing-plan-store";
import { SwingPlanContent } from "@/app/swings/swing-plan-content";
import { SwingThemeSurface } from "@/app/swings/swing-theme-surface";
import { SwingLockedPreview } from "@/app/swings/swing-locked-preview";
import { SwingRichEditor } from "./swing-rich-editor";
import { SwingPostEditor } from "./swing-post-editor";
import { swingPremiumComment } from "@/src/modules/swings/swing-plan-contract";
import styles from "@/app/swings/swing-idea.module.css";
type Draft={id:string;slug:string;version:number;publishedVersion:number|null;document:SwingPlanDocument;publishedDocument:SwingPlanDocument|null};
async function request(body?:unknown,id?:string){const r=await fetch('/api/admin/journal/swing-plans'+(id?'?id='+encodeURIComponent(id):''),{method:body?'POST':'GET',cache:'no-store',headers:body?{'Content-Type':'application/json','x-traderlink-journal-admin-request':'1'}:undefined,body:body?JSON.stringify(body):undefined});const result=await r.json();if(!r.ok)throw Error(result.error||'Unable to complete this action. Your unsaved edits are preserved.');return result;}
export function SwingPlanEditor({initialPlans}:{initialPlans:SwingPlanSummary[]}){
  const [plans,setPlans]=useState(initialPlans),[draft,setDraft]=useState<Draft|null>(null),[doc,setDoc]=useState<SwingPlanDocument>(newSwingPlan),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[preview,setPreview]=useState<'member'|'locked'|null>(null);
  const [profile,setProfile]=useState<{label:string;value:string}[]|null>(null);
  const [editorOpen,setEditorOpen]=useState(true);
  const [postDrafts,setPostDrafts]=useState<Record<string,Partial<Record<'premium'|'free',string>>>>({});
  const hasUnsavedWork=dirty||Object.keys(postDrafts).length>0;
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(hasUnsavedWork){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[hasUnsavedWork]);
  useEffect(()=>{
    if(!hasUnsavedWork)return;
    const guard=(event:MouseEvent)=>{
      const link=event.target instanceof Element?event.target.closest('a'):null;
      if(!link||link.target==='_blank'||!link.href||event.ctrlKey||event.metaKey||event.shiftKey||link.href===window.location.href)return;
      if(!window.confirm('Leave without saving your changes?')){event.preventDefault();event.stopPropagation();}
    };
    document.addEventListener('click',guard,true);
    return()=>document.removeEventListener('click',guard,true);
  },[hasUnsavedWork]);
  const edit=(next:SwingPlanDocument)=>{setDoc(next);setDirty(true);};
  const run=async(fn:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await fn();}catch(e){setMessage(e instanceof Error?e.message:'Action failed.');}finally{setBusy(false);}};
  const load=async(id:string)=>{if(!id)return;if(dirty&&!window.confirm('Discard unsaved changes and open this plan?'))return;await run(async()=>{const r=await request(undefined,id);if(!r.plan)throw Error('Plan not found.');setDraft(r.plan);setDoc(r.plan.document);setDirty(false);setProfile(null);setEditorOpen(true);});};
  const close=()=>{setEditorOpen(false);setDraft(null);setDoc(newSwingPlan());setDirty(false);setProfile(null);};
  const remember=(plan:Draft)=>setPlans(current=>[{id:plan.id,slug:plan.slug,ticker:plan.document.ticker,title:plan.document.title,draftVersion:plan.version,publishedVersion:plan.publishedVersion,status:plan.document.status,updatedAt:Date.now()},...current.filter(item=>item.id!==plan.id)]);
  const save=async()=>{const r=await request({action:'save',id:draft?.id,version:draft?.version??0,document:doc});setDraft(r.plan);setDoc(r.plan.document);setDirty(false);remember(r.plan);return r.plan as Draft;};
  return <Stack spacing={2}><Typography variant="h1">Swing Trade Plans</Typography>
    <Stack direction="row" sx={{gap:1,flexWrap:"wrap"}}><Button disabled={busy} variant="contained" onClick={()=>{if(dirty&&!window.confirm('Discard unsaved changes and start a new plan?'))return;setDraft(null);setDoc(newSwingPlan());setDirty(false);setProfile(null);setMessage('');setEditorOpen(true);}}>New plan</Button><Button href="/admin/journal/swings">View activity</Button></Stack>
    <TextField select label="Saved plans" value={draft?.id??''} disabled={busy} onChange={e=>void load(e.target.value)}><MenuItem value="">New unsaved plan</MenuItem>{plans.map(p=><MenuItem key={p.id} value={p.id}>{p.ticker||'Untitled'} — {p.title} · {p.publishedVersion?'Published':'Draft'}</MenuItem>)}</TextField>
    {message&&<Alert severity="info">{message}</Alert>}
    <Button disabled={busy} onClick={()=>{if(dirty&&!window.confirm('Discard unsaved changes and open the original swing idea?'))return;void run(async()=>{const r=await request({action:'import-original'});setDraft(r.plan);setDoc(r.plan.document);setDirty(false);setProfile(null);setEditorOpen(true);remember(r.plan);setMessage('Original idea opened as a draft. The existing page stays unchanged until you publish.');});}}>Edit original swing idea</Button>
    {editorOpen&&<fieldset disabled={busy} style={{border:0,padding:0,margin:0,minWidth:0}}><Stack spacing={2}>
      <Stack direction={{xs:'column',sm:'row'}} sx={{gap:2}}><TextField label="Ticker" value={doc.ticker} onChange={e=>edit({...doc,ticker:e.target.value.toUpperCase()})}/><TextField fullWidth label="Plan title" value={doc.title} onChange={e=>edit({...doc,title:e.target.value})}/></Stack>
      <TextField select label="Idea status" value={doc.status} onChange={e=>edit({...doc,status:e.target.value as 'open'|'closed'})}><MenuItem value="open">Open</MenuItem><MenuItem value="closed">Closed</MenuItem></TextField>
      <Box sx={{border:1,borderColor:'divider',p:2,borderRadius:2}}><Typography variant="h2">Company details</Typography>
        <FormControlLabel control={<Checkbox checked={doc.company.visible} onChange={e=>edit({...doc,company:{...doc.company,visible:e.target.checked}})}/>} label="Show company details"/>
        <Button onClick={()=>void run(async()=>{const r=await request({action:'company',ticker:doc.ticker});if(!r.profile){setMessage('Company details unavailable. You can enter them yourself and continue.');return;}setProfile(Object.entries(r.profile).filter(([,v])=>v!==null).map(([label,value])=>({label:({marketCapitalization:'Market capitalization (millions)',shareOutstanding:'Shares outstanding (millions)',weburl:'Website'} as Record<string,string>)[label]||label,value:String(value)})));})}>Fetch company details</Button>
        {profile&&<Alert severity="info">Provider details are ready. Applying replaces the company fields in this draft only. <Button onClick={()=>{edit({...doc,company:{...doc.company,fields:profile,fetchedAt:Date.now()}});setProfile(null);}}>Use these details</Button><Button onClick={()=>setProfile(null)}>Keep my details</Button><dl>{profile.map(f=><div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl></Alert>}
        {doc.company.fields.map((f,i)=><Stack direction={{xs:'column',sm:'row'}} sx={{gap:1}} key={i}><TextField label="Field name" value={f.label} onChange={e=>edit({...doc,company:{...doc.company,fields:doc.company.fields.map((x,j)=>j===i?{...x,label:e.target.value}:x)}})}/><TextField fullWidth label="Value" value={f.value} onChange={e=>edit({...doc,company:{...doc.company,fields:doc.company.fields.map((x,j)=>j===i?{...x,value:e.target.value}:x)}})}/><Button onClick={()=>edit({...doc,company:{...doc.company,fields:doc.company.fields.filter((_,j)=>j!==i)}})}>Remove</Button></Stack>)}
        <Button onClick={()=>edit({...doc,company:{...doc.company,fields:[...doc.company.fields,{label:'',value:''}]}})}>Add company field</Button>
      </Box>
      {doc.sections.map((s,index)=><Box key={s.id} sx={{border:1,borderColor:'divider',p:2,borderRadius:2}}>
        <Stack direction="row" sx={{gap:1,flexWrap:"wrap"}}><TextField label="Section title" value={s.title} onChange={e=>edit({...doc,sections:doc.sections.map(x=>x.id===s.id?{...x,title:e.target.value}:x)})}/><FormControlLabel control={<Checkbox checked={s.visible} onChange={e=>edit({...doc,sections:doc.sections.map(x=>x.id===s.id?{...x,visible:e.target.checked}:x)})}/>} label="Show section"/>
          <Button disabled={!index} onClick={()=>{const next=[...doc.sections];[next[index-1],next[index]]=[next[index],next[index-1]];edit({...doc,sections:next});}}>Move up</Button><Button disabled={index===doc.sections.length-1} onClick={()=>{const next=[...doc.sections];[next[index+1],next[index]]=[next[index],next[index+1]];edit({...doc,sections:next});}}>Move down</Button><Button color="error" onClick={()=>{if(window.confirm('Remove this section from the draft? Published content is unchanged until you publish.'))edit({...doc,sections:doc.sections.filter(x=>x.id!==s.id)});}}>Remove section</Button>
        </Stack><SwingRichEditor label={s.title||'Section'} blocks={s.blocks} onChange={blocks=>edit({...doc,sections:doc.sections.map(x=>x.id===s.id?{...x,blocks}:x)})}/>
      </Box>)}
      <Button onClick={()=>edit({...doc,sections:[...doc.sections,{id:crypto.randomUUID(),title:'Custom section',visible:true,blocks:[]}]})}>Add custom section</Button>
      <Typography variant="h2">Dated updates</Typography>
      {doc.updates.map(u=><Box key={u.id}><TextField label="Update title" value={u.title} onChange={e=>edit({...doc,updates:doc.updates.map(x=>x.id===u.id?{...x,title:e.target.value}:x)})}/><SwingRichEditor label="Update" blocks={u.blocks} onChange={blocks=>edit({...doc,updates:doc.updates.map(x=>x.id===u.id?{...x,blocks}:x)})}/></Box>)}
      <Button onClick={()=>edit({...doc,updates:[...doc.updates,{id:crypto.randomUUID(),at:Date.now(),title:'Update',blocks:[]}]})}>Add dated update</Button>
      {doc.status==='closed'&&<><Typography variant="h2">Closing summary</Typography><SwingRichEditor label="Closing summary" blocks={doc.closingSummary} onChange={closingSummary=>edit({...doc,closingSummary})}/></>}
      <Typography variant="h2">Public preview</Typography><Alert severity="info">These fields are visible to everyone, including free members and Discord link previews. Do not include the ticker or private research.</Alert>
      {(['headline','title','description'] as const).map(key=><TextField key={key} label={{headline:'Locked page headline',title:'Public embed title',description:'Public embed description'}[key]} value={doc.teaser[key]} onChange={e=>edit({...doc,teaser:{...doc.teaser,[key]:e.target.value}})}/>)}
      <Typography variant="h2">Saved post comments</Typography>
      <TextField multiline minRows={3} label="Premium post comment" helperText="Optional. If blank, the trade thesis is used. Saving or publishing does not send a post." value={doc.premiumComment} onChange={e=>edit({...doc,premiumComment:e.target.value})}/>
      <TextField multiline minRows={3} label="Free post comment" helperText="Your own teaser, without the ticker or private thesis. Preview and send separately after publishing." value={doc.freeComment} onChange={e=>edit({...doc,freeComment:e.target.value})}/>
      <Stack direction="row" sx={{gap:1,flexWrap:"wrap"}}><Button onClick={()=>setPreview('member')}>Preview Premium page</Button><Button onClick={()=>setPreview('locked')}>Preview locked page</Button><Button variant="outlined" onClick={()=>void run(async()=>{await save();setMessage('Draft saved. Members still see the published version.');})}>Save draft</Button><Button variant="contained" onClick={()=>void run(async()=>{const saved=dirty||!draft?await save():draft;await request({action:'publish',id:saved.id,version:saved.version});const published={...saved,publishedVersion:saved.version,publishedDocument:saved.document};setDraft(published);remember(published);setMessage('Plan published. No Discord posts sent.');})}>Publish plan</Button></Stack>
      {draft?.publishedVersion&&<Button href={`/swings/${draft.slug}`} target="_blank">Open published plan</Button>}
      <Stack direction="row" sx={{gap:1}}><Button onClick={()=>void run(async()=>{await save();close();setMessage('Draft saved and closed.');})}>Save and close</Button><Button onClick={()=>{if(!dirty||window.confirm('Close without saving your changes?'))close();}}>Close editor</Button></Stack>
    </Stack></fieldset>}
    {editorOpen&&draft?.publishedDocument&&<Box><Typography variant="body2">Discord posts use the published plan. Draft changes are not included. Typed post comments are kept while this editor page stays open, including when you switch plans or publish.</Typography><SwingPostEditor key={`${draft.id}:${draft.publishedVersion}`} id={draft.id} defaultComment={swingPremiumComment(draft.publishedDocument)} freeComment={draft.publishedDocument.freeComment} drafts={postDrafts[draft.id]??{}} onCommentChange={(channel,value)=>setPostDrafts(current=>({...current,[draft.id]:{...current[draft.id],[channel]:value}}))}/></Box>}
    <Dialog open={!!preview} onClose={()=>setPreview(null)} maxWidth="md" fullWidth><DialogTitle>{preview==='member'?'Premium page preview':'Locked page preview'}<Button onClick={()=>setPreview(null)}>Close</Button></DialogTitle><DialogContent><SwingThemeSurface><div className={styles.page}>{preview==='member'?<SwingPlanContent document={doc}/>:<SwingLockedPreview teaser={doc.teaser.headline} slug={draft?.slug??'preview'}/>}</div></SwingThemeSurface></DialogContent></Dialog>
  </Stack>;
}
