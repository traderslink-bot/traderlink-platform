"use client";
import type {TraderLinkCommunityCoachingSnapshot as TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/server/traderlink-community-platform-repository";

import {CoachingPlanPaymentOptionsFields} from "./coaching-plan-payment-options";
import type {CoachingPlanPaymentOptions} from "@/src/modules/communities/contracts/coaching-payment-options";

import {useActionState, useMemo, useState, type ReactNode} from "react";
import {alpha, useTheme} from "@mui/material/styles";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {CommunityTypography as Typography} from "./community-typography";
import type {TraderLinkCommunityCoachingItemType,TraderLinkCommunityCoachingPlan} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {saveCoachingPlanWithFeedbackAction} from "./community-actions";
import type {IndependentCoachingPlan} from "@/src/modules/communities/contracts/independent-coaching";
import {IndependentCoachingForm} from "@/app/(member)/coaching/coaching-form";
import {PLAN_OFFERS, initialOfferSettings,effectiveOfferSettings, offerSummary, offerColor, type Offer, type OfferSettings} from "./coaching-plan-offers";
import {CoachingPlanOfferEditor,CoachingReviewFollowUp} from "@/app/coaching-plan-offer-editor";
import {defaultTradeEvaluationTemplate,tradeWrittenFields,type TradeEvaluationTemplate} from '@/src/modules/communities/contracts/coaching-trade-evaluation';
import {defaultDaySessionReview} from '@/src/modules/communities/contracts/coaching-trading-day-evaluation';
import {defaultPerformanceTemplate,withRequiredPerformanceAssessment,PERFORMANCE_RULES_CRITERION,type PerformanceTemplate} from '@/src/modules/communities/contracts/coaching-performance-evaluation';
import {PerformanceTemplateEditor,PerformanceTemplateSummary} from '@/app/(member)/coaching/performance-template-editor';
import {DaySessionSetup} from '@/app/(member)/coaching/day-session-assessment';
import {TradeEvaluationTemplateEditor} from '@/app/(member)/coaching/evaluation-template-editor';
import {TradeEvaluationTemplateSummary} from '@/app/(member)/coaching/evaluation-template-summary';
export {CoachingPlanOfferEditor} from "@/app/coaching-plan-offer-editor";

type ItemType = TraderLinkCommunityCoachingItemType;
type Settings = Record<ItemType, OfferSettings>;
const INITIAL_SETTINGS = Object.fromEntries(PLAN_OFFERS.map(offer => [offer.type, initialOfferSettings(offer)])) as Settings;

function upgradeTradeTemplate(template:TradeEvaluationTemplate,focus:readonly string[]):TradeEvaluationTemplate{const fields=[...tradeWrittenFields(template)],design:{version:1;journalEvidence:boolean;rulesFieldId?:string}={version:1,journalEvidence:focus.includes('journal')};return {...template,reviewDesign:design,writtenFeedback:{version:template.writtenFeedback?.version??1,fields}};}
function cleanTradeTemplate(template:TradeEvaluationTemplate):TradeEvaluationTemplate{const strategyFieldId=template.reviewDesign?.strategyFieldId,rulesFieldId=template.reviewDesign?.rulesFieldId;const reviewDesign=template.reviewDesign?{version:1 as const,journalEvidence:template.daySessionReview?true:template.reviewDesign.journalEvidence}:template.reviewDesign;const daySessionReview=template.daySessionReview?{...template.daySessionReview,journalEvidence:true,fields:template.daySessionReview.fields.map(field=>({...field,enabled:false,required:false}))}:template.daySessionReview;const writtenFeedback=template.writtenFeedback?{...template.writtenFeedback,fields:template.writtenFeedback.fields.filter(field=>field.id!==strategyFieldId&&field.id!==rulesFieldId).map(field=>field.id==='whatWorked'?{...field,title:'Key observation'}:field)}:template.writtenFeedback;return {...template,...(reviewDesign?{reviewDesign}:{}),...(daySessionReview?{daySessionReview}:{}),...(writtenFeedback?{writtenFeedback}:{})};}
function performanceTemplate(focus:readonly string[]):PerformanceTemplate{const value=defaultPerformanceTemplate();return {...value,periodDesign:{...value.periodDesign,journalEvidence:focus.includes('journal'),overallGoals:focus.includes('goals'),...(focus.includes('rules')?{rulesCriterionId:PERFORMANCE_RULES_CRITERION}:{})}};}

export function CoachingPlanBuilder({snapshot, coachProfileId, isReview=false, plan:communityPlan, independentPlan, onCancel}:{
  snapshot?:TraderLinkCommunityDashboardSnapshot; coachProfileId?:string; isReview?:boolean; plan?:TraderLinkCommunityCoachingPlan; independentPlan?:IndependentCoachingPlan; onCancel?:()=>void;
}) {
  const plan:TraderLinkCommunityCoachingPlan|undefined=communityPlan??(independentPlan?{
    planId:independentPlan.planId,revision:independentPlan.revision,coachProfileId:"independent",communityId:"independent",name:independentPlan.terms.planName,description:independentPlan.terms.description,cadence:"custom",tradeReviewLimit:null,studentCapacity:10000,messagingIncluded:independentPlan.terms.items.some(item=>item.itemType==="questions"||item.followUpDays>0),tradeReviewsIncluded:independentPlan.terms.items.some(item=>item.itemType.endsWith("_review")),sessionsIncluded:independentPlan.terms.items.some(item=>item.itemType==="private_session"),teachingIncluded:independentPlan.terms.items.some(item=>item.itemType==="group_lesson"),priceLabel:"",paymentInstructions:independentPlan.terms.paymentInstructions,priceAmountMinor:independentPlan.terms.priceAmountMinor,currency:independentPlan.terms.currency,billingCadence:independentPlan.terms.billingCadence as TraderLinkCommunityCoachingPlan["billingCadence"],quoteRequired:independentPlan.terms.quoteRequired??false,requiredDiscordRoleId:null,autoArchiveAfterDays:null,planStyle:"structured",items:independentPlan.terms.items,journalScopes:[],audienceId:"independent",status:independentPlan.status,builderConfig:{...(independentPlan.terms.builderConfig??{about:independentPlan.terms.description,offers:{}}),tradeEvaluationTemplates:Object.fromEntries(independentPlan.terms.items.flatMap(item=>independentPlan.terms.tradeEvaluationTemplates?.[item.planItemId]?[[item.itemType,independentPlan.terms.tradeEvaluationTemplates[item.planItemId]]]:[])),performanceEvaluationTemplates:Object.fromEntries(independentPlan.terms.items.flatMap(item=>independentPlan.terms.performanceEvaluationTemplates?.[item.planItemId]?[[item.itemType,independentPlan.terms.performanceEvaluationTemplates[item.planItemId]]]:[]))}
  }:undefined);
  const independent=Boolean(independentPlan||!snapshot);
  const theme=useTheme();
  const [feedback,savePlan,pending]=useActionState(saveCoachingPlanWithFeedbackAction,{error:""});
  const [selected, setSelected] = useState<ItemType[]>(()=>plan?.items.map(item=>item.itemType)??[]);
  const [editingService,setEditingService]=useState<ItemType|null>(null);
  const [settings, setSettings] = useState<Settings>(()=>{
    const initial={...INITIAL_SETTINGS};
    for(const item of plan?.items??[]){
      if(!initial[item.itemType])continue;
      initial[item.itemType]={...initial[item.itemType],frequency:item.frequency,coverage:item.coveragePeriod,
        deliveryDayCount:plan?.builderConfig?.offers[item.itemType]?.deliveryDayCount??'calendar',tradeReviewFormat:plan?.builderConfig?.offers[item.itemType]?.tradeReviewFormat,reviewSchedule:plan?.builderConfig?.offers[item.itemType]?.reviewSchedule,maxTradesSubmittedPerDay:plan?.builderConfig?.offers[item.itemType]?.submissionLimits?.perDay===undefined?"":String(plan.builderConfig.offers[item.itemType]!.submissionLimits!.perDay),quantity:String(item.quantity),dueDays:String(item.dueOffsetDays),minutes:item.plannedMinutes===null?"":String(item.plannedMinutes),
        selection:item.selectionMode==="not_applicable"?"coach_or_student":item.selectionMode,depth:item.reviewDepth,
        followUpEnabled:item.itemType!=="review_follow_up"&&item.followUpDays>0,followUpDays:String(item.followUpDays||3),focus:(item.focusAreas??[]).filter(key=>!['trade_review','trading_day_review'].includes(item.itemType)||key!=='goals'),timeline:item.timelineEnabled,
        tradeCapBasis:plan?.builderConfig?.offers[item.itemType]?.tradeCap?.basis??"per_day",tradeCapQuantity:String(plan?.builderConfig?.offers[item.itemType]?.tradeCap?.quantity??5),
        details:plan?.builderConfig?.offers[item.itemType]?.details??"",resources:[...plan?.builderConfig?.offers[item.itemType]?.resources??[]]};
    }
    return initial;
  });
  const [tradeTemplates,setTradeTemplates]=useState<Partial<Record<ItemType,TradeEvaluationTemplate>>>(()=>({
    trade_review:cleanTradeTemplate(plan?.builderConfig?.tradeEvaluationTemplates?.trade_review??defaultTradeEvaluationTemplate()),
    trading_day_review:cleanTradeTemplate(plan?.builderConfig?.tradeEvaluationTemplates?.trading_day_review??{...defaultTradeEvaluationTemplate(),name:'Trading-day trade evaluation',reviewDesign:{version:1,journalEvidence:true},daySessionReview:defaultDaySessionReview()}),
  }));
  const [performanceTemplateDrafts,setPerformanceTemplates]=useState<Partial<Record<ItemType,PerformanceTemplate>>>(()=>({performance_review:plan?.builderConfig?.performanceEvaluationTemplates?.performance_review??defaultPerformanceTemplate()}));
  const [name, setName] = useState(plan?.name??"");
  const performanceTemplates=Object.fromEntries(Object.entries(performanceTemplateDrafts).map(([kind,template])=>[kind,withRequiredPerformanceAssessment(template)])) as Partial<Record<ItemType,PerformanceTemplate>>;
  const [description, setDescription] = useState(plan?.builderConfig?.about??plan?.description??"");
  const [price, setPrice] = useState(plan?.priceAmountMinor==null?"":(plan.priceAmountMinor/100).toFixed(2));
  const currency = "USD";
  const [billing, setBilling] = useState<string>(plan?.billingCadence??"");
  const [quote, setQuote] = useState(plan?.quoteRequired??false);
  const [status,setStatus]=useState(plan?.status??"draft");
  const [capacity, setCapacity] = useState(String(plan?.studentCapacity??10));
  const [paymentInstructions,setPaymentInstructions]=useState(plan?.paymentInstructions??"");
  const [paymentOptions,setPaymentOptions]=useState<CoachingPlanPaymentOptions>(()=>plan?.builderConfig?.payment??{method:"offsite",providerName:null,billingIntervalDays:null,serviceOccurrences:{}});
  const priceSummary=quote?"Price on request":price.trim()!==""&&Number.isFinite(Number(price))?new Intl.NumberFormat("en-US",{style:"currency",currency}).format(Number(price)):null;
  const billingSummary=({one_time:"Per purchase",weekly:"Weekly",monthly:"Monthly",custom:"Custom"} as Record<string,string>)[billing];
  const paymentSummary=[priceSummary,billingSummary].filter(Boolean).join(" — ");
  const [archiveAfterDays,setArchiveAfterDays]=useState(String(plan?.autoArchiveAfterDays??""));
  const [coachingRole, setCoachingRole] = useState(plan?.requiredDiscordRoleId??"");
  const roles = useMemo(() => Array.from(new Set([...(snapshot?.coachingRoleOptions??[]).map(role=>role.id), ...(snapshot?.audiences??[]).flatMap(x => x.discordRoleIds), ...(snapshot?.staffRoles??[]).flatMap(x => x.discordRoleIds), ...(plan?.requiredDiscordRoleId?[plan.requiredDiscordRoleId]:[])])), [snapshot,plan]);
  const legacyItems = plan?.items.filter(item=>["journal_review","rules_review","risk_review","goal_review","strategy_review"].includes(item.itemType))??[];
  const active = PLAN_OFFERS.filter(offer => selected.includes(offer.type));
  const toggle = (type:ItemType) => setSelected(current => current.includes(type) ? current.filter(item => item!==type) : [...current, type]);
  const update = (type:ItemType, patch:Partial<OfferSettings>) => setSettings(current => ({...current, [type]:{...current[type], ...patch}}));
  const savedDescription = [description.trim(), ...active.map(offer => {
    const value = settings[offer.type];
    return [offer.label, offerSummary(offer, value).join(" · "), value.details.trim()].filter(Boolean).join("\n");
  })].filter(Boolean).join("\n\n");
  const tooLong = savedDescription.length > 4000;

  const editor=<Box id="coach-plan-builder" tabIndex={-1} sx={{scrollMarginTop:96}}><Grid container spacing={3}>
      <Grid size={{xs:12, lg:8}}>
        <Stack spacing={3}>
          <Box sx={{border:1,borderColor:'divider',borderRadius:2,p:2}}><Typography color="text.primary" sx={{maxWidth:1200,lineHeight:1.7}}>Create customized coaching plans for your community, built around your trading style and the services you want to offer. Choose review types, trade limits, frequency, and completion deadlines. TradersLink automatically organizes the coaching schedule, tracks upcoming and completed reviews, and manages deadline reminders for both you and your students. Coaches have direct access to student trade journals, rules, tags, notes, and performance analytics. Everything needed to deliver organized, personalized coaching is in one place.</Typography></Box>
          {legacyItems.length?<Alert severity="info">Existing standalone review services are preserved: {legacyItems.map(item=>({journal_review:"Journal",rules_review:"Rules",risk_review:"Risk",goal_review:"Goals",strategy_review:"Strategy"}[item.itemType as "journal_review"|"rules_review"|"risk_review"|"goal_review"|"strategy_review"])).join(", ")}. New reviews use Trade, Trading day or Performance with focus areas. Accepted agreements and history remain unchanged.</Alert>:null}
          <Box>
            {(["Reviews", "Sessions and support"] as const).map(group => <Box key={group} sx={{mb:2}}>
              <Typography sx={{ fontWeight: 700, mb:1}}>{group}</Typography>
              <Grid container spacing={1}>
                {PLAN_OFFERS.filter(offer => offer.group===group&&(!offer.legacyOnly||selected.includes(offer.type))).map(offer => {
                  const added = selected.includes(offer.type);
                  return <Grid key={offer.type} size={{xs:6, md:4}}>
                    <Stack spacing={1} sx={{height:"100%"}}>
                    <Button type="button" fullWidth aria-label={offer.label} aria-describedby={`offer-description-${offer.type}`} aria-pressed={added} onClick={() => {if(!added)setSelected(current=>[...current,offer.type]);setEditingService(offer.type);}} variant="outlined"
                      sx={theme => {const color=offerColor(offer,theme.palette.mode);return {
                        flex:1, flexDirection:"column", alignItems:"flex-start", textAlign:"left", gap:1,
                        p:1.5, color, borderColor:alpha(color,added?1:.5), borderWidth:2, borderTopWidth:4,
                        bgcolor:alpha(color,added?.16:.07), boxShadow:added?`inset 0 0 0 1px ${color}`:"none",
                        "&:hover":{borderColor:color,bgcolor:alpha(color,.2),boxShadow:added?`inset 0 0 0 1px ${color}`:"none"},
                        "&.Mui-focusVisible":{outline:`3px solid ${color}`,outlineOffset:3},
                      };}}>
                      <Typography component="span" sx={{ fontWeight: 750, color:"inherit"}}>{offer.label}</Typography>
                      <Typography component="span" id={`offer-description-${offer.type}`} variant="body2" sx={{color:"text.primary",fontWeight:400,lineHeight:1.5}}>{offer.description}</Typography>
                      <Chip component="span" size="small" label={added ? "Open" : "Add"} sx={theme => ({mt:"auto",color:offerColor(offer,theme.palette.mode),bgcolor:"transparent",border:"1px solid currentColor",fontWeight:800})}/>
                    </Button>
                    </Stack>
                  </Grid>;
                })}
              </Grid>
            </Box>)}
          </Box>
          <Drawer anchor="right" open={Boolean(editingService)} onClose={()=>setEditingService(null)} slotProps={{paper:{sx:{width:{xs:'100%',sm:720,lg:880},maxWidth:'100%',bgcolor:'background.paper'}}}}>
            <Stack direction="row" sx={{position:'sticky',top:0,zIndex:2,alignItems:'center',justifyContent:'space-between',gap:2,p:{xs:2,sm:2.5},borderBottom:1,borderColor:'divider',bgcolor:'background.paper'}}><Box><Typography component="h2" variant="h3">{active.find(offer=>offer.type===editingService)?.label??'Service setup'}</Typography><Typography variant="body2" color="text.secondary">Set what the student receives. Your changes stay in this plan when you close this panel.</Typography></Box><IconButton type="button" aria-label="Close service setup" onClick={()=>setEditingService(null)}><Close/></IconButton></Stack>
            <Box sx={{p:{xs:2,sm:3},pb:{xs:4,sm:5}}}>{active.filter(offer=>offer.type===editingService).map(offer=>{const tradeTemplate=tradeTemplates[offer.type],performance=performanceTemplates[offer.type];const service=<CoachingPlanOfferEditor embedded hideReviewFocus={['trade_review','trading_day_review'].includes(offer.type)&&Boolean(tradeTemplate)||offer.type==='performance_review'&&Boolean(performance)} offer={offer} value={settings[offer.type]} onChange={patch=>update(offer.type,patch)} onRemove={()=>{toggle(offer.type);setEditingService(null);}}/>;if(offer.type==='performance_review')return <Box key={offer.type}>{service}<Box sx={{mt:2}}>{performance?<PerformanceTemplateEditor value={performance} onChange={value=>setPerformanceTemplates(current=>({...current,[offer.type]:value}))}/>:<Button type="button" variant="outlined" onClick={()=>setPerformanceTemplates(current=>({...current,[offer.type]:performanceTemplate(settings[offer.type].focus)}))}>Add Performance evaluation</Button>}</Box></Box>;if(!['trade_review','trading_day_review'].includes(offer.type))return <Box key={offer.type}>{service}</Box>;return <Box key={offer.type} sx={theme=>({border:1,borderColor:'divider',borderTop:4,borderTopColor:offerColor(offer,theme.palette.mode),borderRadius:2,p:{xs:2,sm:2.5},'& > #coach-plan-service-trade_review, & > #coach-plan-service-trading_day_review':{border:0,borderRadius:0,p:0}})}>{service}<Divider sx={{my:2}}/>{tradeTemplate?<Stack spacing={2}><TradeEvaluationTemplateEditor value={tradeTemplate} onChange={value=>setTradeTemplates(current=>({...current,[offer.type]:value}))}/>{tradeTemplate.daySessionReview?<DaySessionSetup/>:null}</Stack>:<Button type="button" variant="outlined" onClick={()=>setTradeTemplates(current=>({...current,[offer.type]:cleanTradeTemplate(upgradeTradeTemplate(defaultTradeEvaluationTemplate(),settings[offer.type].focus))}))}>Add structured trade evaluation</Button>}</Box>;})}{active.filter(offer=>offer.type===editingService&&offer.group==='Reviews').map(offer=><Box key={`follow-up:${offer.type}`} sx={{mt:3}}><CoachingReviewFollowUp value={settings[offer.type]} onChange={patch=>update(offer.type,patch)}/></Box>)}<Box sx={{display:'flex',justifyContent:'flex-end',mt:3}}><Button type="button" variant="contained" onClick={()=>setEditingService(null)}>Done</Button></Box></Box>
          </Drawer>
          <Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}><Stack spacing={2}>
            <Typography color="text.primary" component="h3" variant="h3">Plan details</Typography>
            <Grid container spacing={2}>
              <Grid size={{xs:12,md:8}}><TextField fullWidth required label="Plan name" name="name" value={name} onChange={event=>setName(event.target.value)} slotProps={{htmlInput:{maxLength:100}}}/></Grid>
              <Grid size={{xs:12,md:4}}><TextField fullWidth label="Status" name={independent?"status":undefined} select value={status} disabled={!independent} onChange={event=>setStatus(event.target.value as typeof status)}><MenuItem value="draft">Draft</MenuItem><MenuItem value="active">Published</MenuItem><MenuItem value="paused">Paused</MenuItem><MenuItem value="archived">Archived</MenuItem></TextField></Grid>
              <Grid size={{xs:12,md:6}}><TextField fullWidth label="Price" type="number" required={!quote} disabled={quote} value={price} onChange={event=>setPrice(event.target.value)} slotProps={{htmlInput:{min:0,step:"0.01"}}}/></Grid>
              <Grid size={{xs:12,md:6}}><FormControlLabel control={<Checkbox checked={quote} onChange={event=>setQuote(event.target.checked)}/>} label={<Typography color="text.primary">Quote required</Typography>}/></Grid>
              <Grid size={12}><TextField fullWidth label="About this plan" multiline minRows={3} value={description} onChange={event=>setDescription(event.target.value)} helperText={`${description.length.toLocaleString("en-US")} / 500 characters`} error={description.length>500} slotProps={{htmlInput:{maxLength:500},inputLabel:{sx:{color:"text.primary"}}}}/></Grid>
              <Grid size={{xs:12,md:6}}><TextField fullWidth required label="Student capacity" type="number" value={capacity} onChange={event=>setCapacity(event.target.value)} slotProps={{htmlInput:{min:1,step:1}}}/></Grid>
            </Grid>
          </Stack></Box>
          <CoachingPlanPaymentOptionsFields value={paymentOptions} onChange={setPaymentOptions} billing={billing} onBillingChange={setBilling} offers={active} paymentInstructions={paymentInstructions} onPaymentInstructionsChange={setPaymentInstructions}/>
          {snapshot?<Box id="coach-plan-enrollment" component="details" sx={{border:1, borderColor:"divider", borderRadius:2, p:2}}>
            <Box component="summary" sx={{cursor:"pointer", fontWeight:700}}>Discord enrollment settings</Box>
            <Stack spacing={2} sx={{mt:2}}>
              <TextField value={coachingRole} onChange={event=>setCoachingRole(event.target.value)} id="coach-plan-required-role" fullWidth label="Student enrollment role" name="requiredDiscordRoleId" select helperText="Students need this Discord role to access this plan. Your server owner or admin manages Discord roles; this does not assign your coach responsibilities.">
                <MenuItem value="">Select role</MenuItem>
                {roles.map(role => <MenuItem key={role} value={role}>{snapshot?.coachingRoleOptions?.find(item=>item.id===role)?.name??(snapshot?.staffRoles??[]).find(item=>item.discordRoleIds.includes(role))?.name??(snapshot?.audiences??[]).find(item=>item.discordRoleIds.includes(role))?.name??"Previously selected role (unavailable)"}</MenuItem>)}
              </TextField>
              <TextField value={paymentInstructions} onChange={event=>setPaymentInstructions(event.target.value)} fullWidth multiline minRows={2} label="Payment and enrollment instructions" name="paymentInstructions"/>
              <TextField value={archiveAfterDays} onChange={event=>setArchiveAfterDays(event.target.value)} fullWidth label="Archive paused students after" name="autoArchiveAfterDays" select>
                <MenuItem value="">Never</MenuItem><MenuItem value="30">30 days</MenuItem><MenuItem value="60">60 days</MenuItem><MenuItem value="90">90 days</MenuItem>
              </TextField>
            </Stack>
          </Box>:null}
        </Stack>
      </Grid>
      <Grid size={{xs:12, lg:4}}>
        <Box id="coach-plan-preview" tabIndex={-1} aria-label="Plan preview" style={{color:theme.palette.text.primary}} sx={{position:{lg:"sticky"},top:{lg:24},border:1,borderColor:"divider",borderRadius:2,p:2,scrollMarginTop:24,color:"inherit","& .MuiTypography-root:not([data-offer-heading]), & summary, & dt, & dd, & .MuiButton-root, & .MuiChip-label":{color:"inherit !important"},"&:focus-visible":{outline:"3px solid",outlineColor:"primary.main",outlineOffset:3}}}>
          <Stack spacing={2}>
            <Typography color="text.primary" sx={{fontWeight:700,overflowWrap:"anywhere"}}>{name||"Your coaching plan"}</Typography>
            {description?<Typography color="text.primary" variant="body2" sx={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{description}</Typography>:null}
            {paymentSummary?<Typography color="text.primary">{paymentSummary}</Typography>:null}
            <Divider/>
            {!active.length?<Typography color="text.primary" variant="body2">To build your coaching plan add one or any combination of trader reviews, trading day reviews and performance reviews. After you add a review you can customize it to your preference. When you are done you can view  a summary below. You can continue adding reviews or fill out the forms at the bottom of the page and publish your plan.</Typography>:active.map((offer,offerIndex)=>{const tradeTemplate=tradeTemplates[offer.type],performanceTemplate=performanceTemplates[offer.type];return <Box key={offer.type}>
              <Stack direction="row" sx={{gap:1,alignItems:"center",justifyContent:"space-between"}}><Typography data-offer-heading sx={theme=>({fontWeight:700,color:offerColor(offer,theme.palette.mode)})}>{offer.label}</Typography><Stack direction="row" spacing={.5}><Button type="button" size="small" aria-label={`Edit ${offer.label} from preview`} onClick={()=>setEditingService(offer.type)}>Edit</Button>{offer.group==="Reviews"?<Button type="button" size="small" color="error" aria-label={`Remove ${offer.label} from plan`} onClick={()=>setSelected(current=>current.filter(type=>type!==offer.type))}>Remove</Button>:null}</Stack></Stack>
              <Stack spacing={.5}>{offerSummary(offer,settings[offer.type]).map((line,index)=><PlanSummaryLine key={index} text={line}/>)}</Stack>
              {tradeTemplate?<EvaluationDetails title={`${tradeTemplate.name} details`}><TradeEvaluationTemplateSummary hideTitle presentation="offer" templates={{[offer.type]:tradeTemplate}}/></EvaluationDetails>:null}
              {performanceTemplate?<EvaluationDetails title={`${performanceTemplate.name} details`}><PerformanceTemplateSummary hideTitle presentation="offer" template={performanceTemplate}/></EvaluationDetails>:null}
              {offerIndex<active.length-1?<Divider sx={{mt:2}}/>:null}
            </Box>})}
            {legacyItems.length?<Typography variant="body2">Existing services are preserved when you save this plan.</Typography>:null}
            {feedback.error?<Alert severity="error" role="alert">{feedback.error}</Alert>:null}
            {tooLong||description.length>500?<Typography color="error" role="alert">Fix the plan details before saving.</Typography>:null}
            {!independent?<Button disabled={isReview||pending||!active.length||tooLong||description.length>500} name="intent" type="submit" value={plan?"save":"draft"} variant="outlined">{plan?"Save changes":"Save draft"}</Button>:null}
            {!independent&&plan?.status!=="active"?<Button disabled={isReview||pending||!active.length||tooLong||description.length>500} name="intent" type="submit" value="publish" variant="contained">Publish plan</Button>:null}
            {onCancel?<Button type="button" onClick={onCancel}>Cancel edit</Button>:null}
            <Button href="#coach-plan-builder" sx={{display:{lg:"none"}}}>Back to plan</Button>
          </Stack>
        </Box>
      </Grid>
    </Grid></Box>;
  const offerConfiguration={about:description,payment:paymentOptions,offers:Object.fromEntries(active.map(offer=>[offer.type,{details:settings[offer.type].details,resources:settings[offer.type].resources,...(['trade_review','trading_day_review'].includes(offer.type)?{submissionSchedule:'weekend_choice' as const,weeklySchedule:'monday' as const,deliveryDayCount:settings[offer.type].deliveryDayCount??'calendar'}:{}),...(offer.type==="trade_review"?{tradeReviewFormat:effectiveOfferSettings(offer.type,settings[offer.type]).tradeReviewFormat,reviewSchedule:effectiveOfferSettings(offer.type,settings[offer.type]).reviewSchedule}:{}),...(offer.type==="trade_review"&&(!settings[offer.type].timeline||settings[offer.type].reviewSchedule==='student_choice')?{submissionLimits:{perPeriod:Number(settings[offer.type].quantity),...(settings[offer.type].maxTradesSubmittedPerDay?{perDay:Number(settings[offer.type].maxTradesSubmittedPerDay)}:{})}}:{}),...(offer.type==="performance_review"?{includeDayJournal:settings[offer.type].focus.includes("journal")} : {}),...(offer.type==="trading_day_review"?{tradeCap:{basis:settings[offer.type].tradeCapBasis,quantity:Number(settings[offer.type].tradeCapQuantity)}}:{})}])),tradeEvaluationTemplates:Object.fromEntries(active.filter(offer=>["trade_review","trading_day_review"].includes(offer.type)&&tradeTemplates[offer.type]).map(offer=>[offer.type,tradeTemplates[offer.type]])),performanceEvaluationTemplates:Object.fromEntries(active.filter(offer=>offer.type==="performance_review"&&performanceTemplates[offer.type]).map(offer=>[offer.type,performanceTemplates[offer.type]]))};
  const items=active.map((offer,index)=>{const value=effectiveOfferSettings(offer.type,settings[offer.type]),existing=plan?.items.find(item=>item.itemType===offer.type);return {planItemId:existing?.planItemId??`service:${offer.type}`,itemType:offer.type,frequency:value.frequency,coveragePeriod:value.coverage,quantity:Number(value.quantity||1),dueOffsetDays:Number(value.dueDays||0),selectionMode:["trade_review","trading_day_review"].includes(offer.type)?value.selection:"not_applicable" as const,followUpDays:value.followUpEnabled?Number(value.followUpDays):0,measurementKind:offer.measure,plannedMinutes:value.minutes?Number(value.minutes):null,timelineEnabled:value.timeline,reviewDepth:value.depth,ordinal:index,focusAreas:value.focus};});
  if(independent){
    const tradeEvaluationTemplates=Object.fromEntries(items.flatMap(item=>tradeTemplates[item.itemType]?[[item.planItemId,tradeTemplates[item.itemType]]]:[]));
    const performanceEvaluationTemplates=Object.fromEntries(items.flatMap(item=>performanceTemplates[item.itemType]?[[item.planItemId,performanceTemplates[item.itemType]]]:[]));
    const terms={planId:independentPlan?.planId??"new",planRevision:independentPlan?.revision??1,planName:name,description,priceAmountMinor:price?Math.round(Number(price)*100):0,currency,billingCadence:billing,quoteRequired:quote,paymentInstructions,requiredDiscordRoleId:null,autoArchiveAfterDays:null,startDate:independentPlan?.terms.startDate??null,customIntervalDays:independentPlan?.terms.customIntervalDays??null,coverageDays:independentPlan?.terms.coverageDays??{},dueTimeUtc:independentPlan?.terms.dueTimeUtc??"18:00",items,...(Object.keys(tradeEvaluationTemplates).length?{tradeEvaluationTemplates}:{}),...(Object.keys(performanceEvaluationTemplates).length?{performanceEvaluationTemplates}:{}),builderConfig:offerConfiguration};
    return <IndependentCoachingForm intent="save_plan" label="Save plan" hidden={{planId:independentPlan?.planId??"",expectedRevision:String(independentPlan?.revision??0)}}><input type="hidden" name="terms" value={JSON.stringify(terms)}/>{editor}</IndependentCoachingForm>;
  }
  if(!snapshot||!coachProfileId)return null;
  return <Box component="form" action={isReview?undefined:savePlan}><input type="hidden" name="communitySlug" value={snapshot.community.slug}/><input type="hidden" name="coachProfileId" value={coachProfileId}/><input type="hidden" name="planId" value={plan?.planId??""}/><input type="hidden" name="expectedRevision" value={plan?.revision??1}/><input type="hidden" name="builderConfig" value={JSON.stringify(offerConfiguration)}/><input type="hidden" name="planStyle" value={selected.length===1&&selected[0]==="custom_task"?"custom":"structured"}/><input type="hidden" name="description" value={savedDescription}/><input type="hidden" name="billingCadence" value={billing}/><input type="hidden" name="currency" value={currency}/><input type="hidden" name="studentCapacity" value={capacity}/><input type="hidden" name="paymentInstructions" value={paymentInstructions}/>{quote?<input type="hidden" name="quoteRequired" value="on"/>:null}<input type="hidden" name="price" value={price}/>{active.map(offer=><CoachingPlanServiceFields key={offer.type} offer={offer} value={settings[offer.type]}/>)}{editor}</Box>;
}


function PlanSummaryLine({text}:{text:string}) {
  const separator=text.indexOf(":");
  if(separator<0)return <Typography variant="body2" color="text.secondary">{text}</Typography>;
  return <Typography variant="body2" color="text.secondary"><Box component="span" sx={{fontWeight:700}}>{text.slice(0,separator)}:</Box>{text.slice(separator+1)}</Typography>;
}

function EvaluationDetails({title,children}:{title:string;children:ReactNode}) {
  return <Box component="details" sx={{mt:1.5,"& > summary::-webkit-details-marker":{display:"none"},"&[open] .evaluation-expand-icon":{transform:"rotate(180deg)"}}}><Box component="summary" sx={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:1,py:1.25,cursor:"pointer",listStyle:"none"}}><Typography sx={{fontWeight:700}}>{title}</Typography><ExpandMore className="evaluation-expand-icon" aria-hidden sx={{transition:"transform 160ms ease"}}/></Box><Box sx={{pt:.5}}>{children}</Box></Box>;
}

export function CoachingPlanServiceFields({offer, value}:{offer:Offer; value:OfferSettings}) {
  value=effectiveOfferSettings(offer.type,value);
  const fields:Record<string,string> = {
    item:"on", measurement:offer.measure, frequency:value.frequency, coverage:value.coverage,
    quantity:value.quantity || "1", due:value.dueDays || "0", selection:["trade_review","trading_day_review"].includes(offer.type)?value.selection:"not_applicable",
    followUp:value.followUpEnabled||offer.type==="review_follow_up"?value.followUpDays:"0", minutes:value.minutes, depth:value.depth,
  };
  return <>{Object.entries(fields).map(([key, text]) => <input key={key} type="hidden" name={key+":"+offer.type} value={text}/>)}
    {value.timeline ? <input type="hidden" name={"timeline:"+offer.type} value="on"/> : null}
    {value.focus.map(focus => <input key={focus} type="hidden" name={"focus:"+offer.type} value={focus}/>)}
  </>;
}
