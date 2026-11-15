"use client";
import {useState} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import {GENERAL_FEEDBACK_ID,GENERAL_FEEDBACK_DESCRIPTION,STANDARD_TRADE_CRITERIA,tradeWrittenFields,type WrittenFeedbackField,defaultTradeCriterion,tradeCriterionLevels,type TradeCriterion,type TradeEvaluationTemplate} from '@/src/modules/communities/contracts/coaching-trade-evaluation';
export function TradeEvaluationTemplateEditor({value,onChange,criterionPresets,context='trade',requiredWrittenFieldIds=[]}:{requiredWrittenFieldIds?:readonly string[];criterionPresets?:readonly TradeCriterion[];context?:'trade'|'performance';overallGoals?:boolean;onOverallGoalsChange?:(value:boolean)=>void;value:TradeEvaluationTemplate;onChange:(value:TradeEvaluationTemplate)=>void;deferSupportingEvidence?:boolean}){
 const presets=criterionPresets??STANDARD_TRADE_CRITERIA.map(item=>defaultTradeCriterion(item.id));
 const lockedStandard=(id:string)=>context==='trade'&&STANDARD_TRADE_CRITERIA.some(item=>item.id===id);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [guidanceFieldId,setGuidanceFieldId]=useState<string|null>(null);
 const written=tradeWrittenFields(value);
 const serviceFieldIds=new Set([value.reviewDesign?.rulesFieldId,value.reviewDesign?.strategyFieldId].filter((id):id is string=>Boolean(id)));
 const visibleWritten=written.filter(field=>!serviceFieldIds.has(field.id));
 const writtenPurpose=(field:WrittenFeedbackField)=>field.id===GENERAL_FEEDBACK_ID?GENERAL_FEEDBACK_DESCRIPTION:requiredWrittenFieldIds.includes(field.id)?"Evaluate the student's overall progress during the review period.":field.id==='whatWorked'?(context==='performance'?'Identify what worked across the review period and should continue.':'Summarize the most important thing this trade shows, whether positive, negative or mixed.'):field.id==='whatToImprove'?'Explain the most important behavior or decision to improve.':field.id==='nextAction'?(context==='performance'?'Give the student a specific action for the next review period.':'Give the student a specific action for the next trade.'):'Define the written response the coach must provide.';
 const updateWritten=(fields:readonly WrittenFeedbackField[])=>{const requiredFields=fields.map(field=>field.enabled?{...field,required:field.id!==GENERAL_FEEDBACK_ID}:field),design=value.reviewDesign;onChange({...value,writtenFeedback:{version:value.writtenFeedback?.version??1,fields:requiredFields},...(design?{reviewDesign:{version:1,journalEvidence:design.journalEvidence,...(requiredFields.some(field=>field.id===design.rulesFieldId)?{rulesFieldId:design.rulesFieldId}:{}),...(requiredFields.some(field=>field.id===design.strategyFieldId)?{strategyFieldId:design.strategyFieldId}:{})}}:{})});};

 const patchWritten=(id:string,patch:Partial<WrittenFeedbackField>)=>updateWritten(written.map(field=>field.id===id?{...field,...patch}:field));
 const custom=value.criteria.filter(c=>!presets.some(standard=>standard.id===c.id));
 const patch=(id:string,fields:Partial<TradeCriterion>)=>onChange({...value,criteria:value.criteria.map(c=>c.id===id?{...c,...fields}:c)});
 const criterionEditor=(criterion:TradeCriterion)=>{
  const expanded=selectedId===criterion.id;
  return <Collapse in={expanded} timeout="auto" unmountOnExit><Stack id={`trade-template-panel-${criterion.id}`} role="region" aria-labelledby={`trade-template-toggle-${criterion.id}`} spacing={2} sx={{borderTop:1,borderColor:'divider',p:{xs:2,sm:2.5}}}>
   {lockedStandard(criterion.id)?<Typography component="h5" variant="h3">{criterion.name}</Typography>:<Grid container spacing={2}><Grid size={{xs:12,sm:7}}><TextField fullWidth id={`trade-template-field-${criterion.id}`} label="Field name" required value={criterion.name} onChange={event=>patch(criterion.id,{name:event.target.value})} slotProps={{htmlInput:{maxLength:80}}}/></Grid><Grid size={{xs:12,sm:5}}><TextField fullWidth select label="Response" value={criterion.kind} onChange={event=>{const kind=event.target.value as TradeCriterion['kind'];patch(criterion.id,{kind,rubric:kind==='rating'?{version:criterion.rubric?.version??1,levels:[...(criterion.rubric?.levels??['','','','',''])]}:undefined});}}><MenuItem value="rating">Rating · 1–5</MenuItem><MenuItem value="yes_no">Yes / No</MenuItem><MenuItem value="written">Written response</MenuItem></TextField></Grid></Grid>}
   <TextField label="What does it assess?" required multiline minRows={2} value={criterion.meaning} onChange={event=>patch(criterion.id,{meaning:event.target.value,...(criterion.kind==='rating'&&!criterion.rubric?{rubric:{version:1,levels:[...tradeCriterionLevels(value,criterion)]}}:{})})} slotProps={{htmlInput:{maxLength:400}}}/>
   {criterion.kind==='rating'?<Stack spacing={1.5}><Typography variant="body2">Define each score, from 1 (lowest) to 5 (highest). Use Insufficient information during a review when the evidence is unavailable.</Typography>{tradeCriterionLevels(value,criterion).map((level,index)=><TextField key={index} label={`Score ${index+1}${index===0?' · lowest':index===4?' · highest':''}`} value={level} required multiline minRows={2} onChange={event=>{const levels=[...tradeCriterionLevels(value,criterion)];levels[index]=event.target.value;patch(criterion.id,{rubric:{version:criterion.rubric?.version??1,levels}});}} slotProps={{htmlInput:{maxLength:400}}}/>)}</Stack>:null}
   <Stack direction={{xs:'column',sm:'row'}} sx={{gap:1,alignItems:{xs:'stretch',sm:'center'}}}>
    <Button type="button" variant="outlined" onClick={()=>setSelectedId(null)}>Done</Button>
    {!lockedStandard(criterion.id)?<Button type="button" color="error" data-coaching-edit onClick={()=>{onChange({...value,criteria:value.criteria.filter(c=>c.id!==criterion.id)});setSelectedId(null);}}>Remove field</Button>:null}
   </Stack>
  </Stack></Collapse>;
 };
 return <Box sx={{border:1,borderColor:'divider',borderRadius:2,p:{xs:2,sm:3}}}><Stack spacing={3}>
  <Typography component="h3" variant="h3">{context==='performance'?'Performance evaluation':value.daySessionReview?'Trade evaluation · each selected trade':'Trade evaluation'}</Typography>
  {context==='performance'?<Typography variant="body2" color="text.secondary">Customize your students evaluation to fit your preferences . Select the criteria you will evaluate below or add your own custom criteria</Typography>:null}
  <Stack spacing={1.5} sx={{width:'100%',maxWidth:760}}><Typography component="h4" variant="h3">Criteria</Typography>
   {presets.map(preset=>{const criterion=value.criteria.find(c=>c.id===preset.id)??preset,included=value.criteria.some(c=>c.id===preset.id),expanded=included&&selectedId===preset.id;return <Box key={preset.id} sx={{border:1,borderColor:expanded?'primary.main':'divider',borderRadius:2,overflow:'hidden',bgcolor:expanded?'action.hover':'background.paper'}}>
    <Stack direction="row" sx={{alignItems:'center',gap:1,p:1,minHeight:64}}>
     <Checkbox slotProps={{input:{'aria-label':`${included?'Remove':'Include'} ${preset.name}`}}} checked={included} onChange={event=>{if(event.target.checked){onChange({...value,criteria:[...value.criteria,preset]});setSelectedId(preset.id);}else{onChange({...value,criteria:value.criteria.filter(c=>c.id!==preset.id)});if(selectedId===preset.id)setSelectedId(null);}}}/>
     <Button id={`trade-template-toggle-${preset.id}`} type="button" disabled={!included} aria-expanded={expanded} aria-controls={`trade-template-panel-${preset.id}`} onClick={()=>setSelectedId(expanded?null:preset.id)} sx={{flex:1,minWidth:0,justifyContent:'space-between',textAlign:'left',color:'text.primary',px:1,py:1}} endIcon={<ExpandMoreRounded sx={{transform:expanded?'rotate(180deg)':'none',transition:theme=>theme.transitions.create('transform')}}/>}><Box component="span" sx={{minWidth:0}}><Typography component="span" sx={{display:'block',fontWeight:700}}>{preset.name}</Typography><Typography component="span" variant="body2" color="text.secondary" sx={{display:'block'}}>{preset.meaning}</Typography></Box></Button>
     <Chip size="small" variant={included?'filled':'outlined'} color={included?'primary':'default'} label={included?'Included':'Not included'} sx={{display:{xs:'none',sm:'inline-flex'}}}/>
    </Stack>
    {included?criterionEditor(criterion):null}
   </Box>;})}
   {custom.map(criterion=>{const expanded=selectedId===criterion.id;return <Box key={criterion.id} sx={{border:1,borderColor:expanded?'primary.main':'divider',borderRadius:2,overflow:'hidden',bgcolor:expanded?'action.hover':'background.paper'}}>
    <Stack direction="row" sx={{alignItems:'center',gap:1,p:1,minHeight:64}}><Chip size="small" color="primary" label="Custom"/><Button id={`trade-template-toggle-${criterion.id}`} type="button" aria-expanded={expanded} aria-controls={`trade-template-panel-${criterion.id}`} onClick={()=>setSelectedId(expanded?null:criterion.id)} sx={{flex:1,minWidth:0,justifyContent:'space-between',textAlign:'left',color:'text.primary',px:1,py:1}} endIcon={<ExpandMoreRounded sx={{transform:expanded?'rotate(180deg)':'none',transition:theme=>theme.transitions.create('transform')}}/>}><Box component="span" sx={{minWidth:0}}><Typography component="span" sx={{display:'block',fontWeight:700}}>{criterion.name||'Unnamed custom field'}</Typography><Typography component="span" variant="body2" color="text.secondary" sx={{display:'block'}}>{criterion.meaning||'Add a name, meaning and response type.'}</Typography></Box></Button></Stack>
    {criterionEditor(criterion)}
   </Box>;})}
   <Box><Button type="button" variant="outlined" data-coaching-edit disabled={custom.length>=12} onClick={()=>{const id=`custom:${crypto.randomUUID()}`;onChange({...value,criteria:[...value.criteria,{id,name:'',meaning:'',kind:'rating',version:1,rubric:{version:1,levels:['','','','','']}}]});setSelectedId(id);requestAnimationFrame(()=>document.getElementById(`trade-template-field-${id}`)?.focus());}}>Add custom field</Button></Box>
  </Stack>
  {!value.criteria.some(c=>c.kind==='rating')?<Alert severity="warning">{context==='performance'?'Keep at least one rated criterion for Performance improvement tracking.':'Keep at least one rated criterion for automatic improvement history.'}</Alert>:null}
  <Stack spacing={2} sx={{borderTop:1,borderColor:'divider',pt:3}}>
   <Typography component="h4" variant="h3">Written feedback</Typography>
   <Typography variant="body2" color="text.secondary">Customize the feedback in your plan so students know what the plan is about and what they can expect from their coach. Use the presets or add your own. These appear as text boxes you fill out for your students review.</Typography>
   <Grid container spacing={2}>{visibleWritten.map(field=>{const locked=requiredWrittenFieldIds.includes(field.id),custom=field.id.startsWith('written:')&&field.id!==GENERAL_FEEDBACK_ID&&!locked,showGuidance=guidanceFieldId===field.id,purpose=writtenPurpose(field);return <Grid key={field.id} size={{xs:12,md:6}}><Stack spacing={1.5} sx={{border:1,borderColor:'divider',borderRadius:1,p:2,height:'100%'}}>
    <Stack direction="row" sx={{justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}><Stack direction="row" sx={{alignItems:'center'}}>{locked?<Stack direction="row" spacing={1} sx={{alignItems:'center'}}><Typography sx={{fontWeight:700}}>{field.title}</Typography><Chip size="small" label="Required"/></Stack>:<FormControlLabel label={custom?'Include custom field':field.title} control={<Checkbox checked={field.enabled} onChange={event=>patchWritten(field.id,{enabled:event.target.checked,...(event.target.checked?{required:field.id!==GENERAL_FEEDBACK_ID}:{})})}/>}/>}{!custom?<Tooltip title={purpose}><IconButton size="small" aria-label={`About ${field.title}`}><InfoOutlined fontSize="small"/></IconButton></Tooltip>:null}</Stack>{custom?<Button type="button" data-coaching-edit onClick={()=>updateWritten(written.filter(item=>item.id!==field.id))}>Remove</Button>:null}</Stack>
    {custom?<TextField label="Field title" value={field.title} required disabled={!field.enabled} onChange={event=>patchWritten(field.id,{title:event.target.value})} error={field.title.length>80} helperText={field.title.length>80?'Use 80 characters or fewer.':undefined}/>:null}
    {!custom?<Typography variant="body2" color="text.secondary">{purpose}</Typography>:null}

    {field.enabled?<Box><Button type="button" size="small" onClick={()=>setGuidanceFieldId(showGuidance?null:field.id)} aria-expanded={showGuidance} aria-controls={`written-guidance-${field.id}`}>{showGuidance?'Hide instructions':field.guidance?'Edit instructions':'Customize instructions'}</Button></Box>:null}
    <Collapse in={showGuidance&&field.enabled} timeout="auto" unmountOnExit><TextField id={`written-guidance-${field.id}`} fullWidth label="Instructions for the coach (optional)" multiline minRows={2} value={field.guidance??''} onChange={event=>patchWritten(field.id,{guidance:event.target.value})} helperText={`${(field.guidance?.length??0).toLocaleString('en-US')} / 1,000 characters · Shown while the coach completes this section.`} slotProps={{htmlInput:{maxLength:1000}}}/></Collapse>
   </Stack></Grid>;})}</Grid>
   <Box><Button type="button" variant="outlined" data-coaching-edit disabled={written.length>=12} onClick={()=>{const id=`written:${crypto.randomUUID()}`;updateWritten([...written,{id,title:'',enabled:true,required:true,version:1}]);}}>Add written field</Button></Box>
  </Stack>
 </Stack></Box>;
}
