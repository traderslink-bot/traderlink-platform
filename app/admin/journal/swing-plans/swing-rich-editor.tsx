"use client";
import { useRef, useState } from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { SwingBlock } from "@/src/modules/swings/swing-plan-contract";
import { markSwingText, replaceSwingText } from "@/src/modules/swings/swing-rich-edit";
import { SwingRichContent } from "@/app/swings/swing-plan-content";
export function SwingRichEditor({blocks,onChange,label}:{blocks:SwingBlock[];onChange:(blocks:SwingBlock[])=>void;label:string}){
  const selection=useRef({id:"",start:0,end:0});const [link,setLink]=useState("");
  const update=(id:string,block:SwingBlock)=>onChange(blocks.map(b=>b.id===id?block:b));
  const format=(mark:{bold?:boolean;italic?:boolean;underline?:boolean;href?:string})=>{
    const s=selection.current,b=blocks.find(b=>b.id===s.id);if(b&&b.kind!=="image")update(b.id,{...b,runs:markSwingText(b.runs,s.start,s.end,mark)});
  };
  return <Stack spacing={1} aria-label={label}>
    <Stack direction="row" sx={{gap:1,flexWrap:"wrap"}}>
      <Button onClick={()=>format({bold:true})}>Bold selection</Button><Button onClick={()=>format({italic:true})}>Italic</Button><Button onClick={()=>format({underline:true})}>Underline</Button>
      <Button onClick={()=>format({bold:false,italic:false,underline:false,href:undefined})}>Clear formatting</Button>
      <TextField size="small" label="Link address" value={link} onChange={e=>setLink(e.target.value)}/><Button onClick={()=>format({href:link})}>Link selection</Button>
    </Stack>
    {blocks.map((block,index)=><Box key={block.id} sx={{border:1,borderColor:"divider",p:1.5,borderRadius:1}}>
      <Stack direction="row" sx={{gap:1,flexWrap:"wrap",alignItems:"center"}}>
        {block.kind!=="image"&&<TextField select size="small" label="Text style" value={block.kind} onChange={e=>update(block.id,{...block,kind:e.target.value as "paragraph"|"heading"|"bullet"|"numbered"})}>
          <MenuItem value="paragraph">Paragraph</MenuItem><MenuItem value="heading">Heading</MenuItem><MenuItem value="bullet">Bullet</MenuItem><MenuItem value="numbered">Numbered item</MenuItem>
        </TextField>}
        <Button disabled={!index} onClick={()=>{const next=[...blocks];[next[index-1],next[index]]=[next[index],next[index-1]];onChange(next);}}>Move up</Button>
        <Button disabled={index===blocks.length-1} onClick={()=>{const next=[...blocks];[next[index+1],next[index]]=[next[index],next[index+1]];onChange(next);}}>Move down</Button>
        <Button color="error" onClick={()=>onChange(blocks.filter(b=>b.id!==block.id))}>Remove block</Button>
      </Stack>
      {block.kind==="image"?<Stack spacing={1}><TextField label="Image URL (HTTPS)" value={block.src} onChange={e=>update(block.id,{...block,src:e.target.value})}/><TextField label="Image description" value={block.alt} onChange={e=>update(block.id,{...block,alt:e.target.value})}/></Stack>:
        <TextField fullWidth multiline minRows={3} label={`${label} text ${index+1}`} value={block.runs.map(r=>r.text).join("")} onSelect={e=>{const t=e.target as HTMLTextAreaElement;selection.current={id:block.id,start:t.selectionStart??0,end:t.selectionEnd??0};}} onChange={e=>update(block.id,{...block,runs:replaceSwingText(block.runs,e.target.value)})}/>}
    </Box>)}
    <Stack direction="row" sx={{gap:1}}><Button onClick={()=>onChange([...blocks,{id:crypto.randomUUID(),kind:"paragraph",runs:[{text:""}]}])}>Add text</Button><Button onClick={()=>onChange([...blocks,{id:crypto.randomUUID(),kind:"image",src:"",alt:""}])}>Add image</Button></Stack>
    <Box aria-label={`${label} formatted preview`}><SwingRichContent blocks={blocks}/></Box>
  </Stack>;
}
