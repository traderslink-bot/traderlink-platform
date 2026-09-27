"use client";

import {useMemo, useState} from "react";
import {alpha} from "@mui/material/styles";
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
import {CommunityTypography as Typography} from "./community-typography";
import type {TraderLinkCommunityCoachingItemType, TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {createCommunityCoachingPlanAction} from "./community-actions";
import {PLAN_OFFERS, PERFORMANCE_INCLUSIONS, REVIEW_RESOURCES, FREQUENCIES, PERIODS, initialOfferSettings, offerSummary, offerColor, type Offer, type OfferSettings} from "./coaching-plan-offers";

type ItemType = TraderLinkCommunityCoachingItemType;
type Settings = Record<ItemType, OfferSettings>;
const INITIAL_SETTINGS = Object.fromEntries(PLAN_OFFERS.map(offer => [offer.type, initialOfferSettings(offer)])) as Settings;

export function CoachingPlanBuilder({snapshot, coachProfileId, isReview=false}:{
  snapshot:TraderLinkCommunityDashboardSnapshot; coachProfileId:string; isReview?:boolean;
}) {
  const [selected, setSelected] = useState<ItemType[]>([]);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [billing, setBilling] = useState("monthly");
  const [quote, setQuote] = useState(false);
  const [capacity, setCapacity] = useState("10");
  const roles = useMemo(() => Array.from(new Set([...snapshot.audiences.flatMap(x => x.discordRoleIds), ...snapshot.staffRoles.flatMap(x => x.discordRoleIds)])), [snapshot]);
  const active = PLAN_OFFERS.filter(offer => selected.includes(offer.type));
  const toggle = (type:ItemType) => setSelected(current => current.includes(type) ? current.filter(item => item!==type) : [...current, type]);
  const update = (type:ItemType, patch:Partial<OfferSettings>) => setSettings(current => ({...current, [type]:{...current[type], ...patch}}));
  const savedDescription = [description.trim(), ...active.map(offer => {
    const value = settings[offer.type];
    return [offer.label, offerSummary(offer, value).join(" · "), value.details.trim()].filter(Boolean).join("\n");
  })].filter(Boolean).join("\n\n");
  const tooLong = savedDescription.length > 4000;

  return <Box id="coach-plan-builder" component="form" action={isReview ? undefined : createCommunityCoachingPlanAction}>
    <input type="hidden" name="communitySlug" value={snapshot.community.slug}/>
    <input type="hidden" name="coachProfileId" value={coachProfileId}/>
    <input type="hidden" name="planStyle" value={selected.length===1 && selected[0]==="custom_task" ? "custom" : "structured"}/>
    <input type="hidden" name="description" value={savedDescription}/>
    {active.map(offer => <ServiceFields key={offer.type} offer={offer} value={settings[offer.type]}/>)}
    <Grid container spacing={3}>
      <Grid size={{xs:12, lg:8}}>
        <Stack spacing={3}>
          <TextField fullWidth required label="Plan name" name="name" value={name} onChange={event => setName(event.target.value)} slotProps={{htmlInput:{maxLength:100}}}/>
          <Box>
            <Stack direction="row" sx={{justifyContent:"space-between",alignItems:"center",mb:1.5}}><Typography component="h3" variant="h3">Coaching included</Typography><Button href="#coach-plan-preview" size="small">Preview</Button></Stack>
            {(["Reviews", "Sessions and support"] as const).map(group => <Box key={group} sx={{mb:2}}>
              <Typography fontWeight={700} sx={{mb:1}}>{group}</Typography>
              <Grid container spacing={1}>
                {PLAN_OFFERS.filter(offer => offer.group===group).map(offer => {
                  const added = selected.includes(offer.type);
                  return <Grid key={offer.type} size={{xs:6, md:4}}>
                    <Button type="button" fullWidth aria-label={offer.label} aria-describedby={`offer-description-${offer.type}`} aria-pressed={added} onClick={() => toggle(offer.type)} variant="outlined"
                      sx={theme => {const color=offerColor(offer,theme.palette.mode);return {
                        height:"100%", flexDirection:"column", alignItems:"flex-start", textAlign:"left", gap:1,
                        p:1.5, color, borderColor:alpha(color,added?1:.5), borderWidth:2, borderTopWidth:4,
                        bgcolor:alpha(color,added?.16:.07), boxShadow:added?`inset 0 0 0 1px ${color}`:"none",
                        "&:hover":{borderColor:color,bgcolor:alpha(color,.2),boxShadow:added?`inset 0 0 0 1px ${color}`:"none"},
                        "&.Mui-focusVisible":{outline:`3px solid ${color}`,outlineOffset:3},
                      };}}>
                      <Typography component="span" fontWeight={750} sx={{color:"inherit"}}>{offer.label}</Typography>
                      <Typography component="span" id={`offer-description-${offer.type}`} variant="body2" sx={{color:"text.primary",fontWeight:400,lineHeight:1.5}}>{offer.description}</Typography>
                      <Chip component="span" size="small" label={added ? "Added" : "+"} sx={theme => ({mt:"auto",color:offerColor(offer,theme.palette.mode),bgcolor:"transparent",border:"1px solid currentColor",fontWeight:800})}/>
                    </Button>
                  </Grid>;
                })}
              </Grid>
            </Box>)}
          </Box>
          {active.map(offer => <OfferEditor key={offer.type} offer={offer} value={settings[offer.type]} onChange={patch => update(offer.type, patch)} onRemove={() => toggle(offer.type)}/>)}
          <Divider/>
          <Typography component="h3" variant="h3">Price and enrollment</Typography>
          <Grid container spacing={2}>
            <Grid size={{xs:12, sm:6}}><TextField fullWidth label="Billing" name="billingCadence" select value={billing} onChange={event => setBilling(event.target.value)}>
              <MenuItem value="weekly">Weekly</MenuItem><MenuItem value="monthly">Monthly</MenuItem><MenuItem value="one_time">One-time</MenuItem><MenuItem value="custom">Custom</MenuItem>
            </TextField></Grid>
            <Grid size={{xs:12, sm:6}}><TextField fullWidth required label="Student capacity" name="studentCapacity" type="number" value={capacity} onChange={event => setCapacity(event.target.value)} slotProps={{htmlInput:{min:1,step:1}}}/></Grid>
            <Grid size={{xs:8, sm:6}}><TextField fullWidth required={!quote} disabled={quote} label="Price" name="price" type="number" value={price} onChange={event => setPrice(event.target.value)} slotProps={{htmlInput:{min:0,step:"0.01"}}}/></Grid>
            <Grid size={{xs:4, sm:6}}><TextField fullWidth label="Currency" name="currency" select value={currency} onChange={event => setCurrency(event.target.value)}><MenuItem value="USD">USD</MenuItem><MenuItem value="CAD">CAD</MenuItem></TextField></Grid>
            <Grid size={12}><FormControlLabel label="Quote required" control={<Checkbox name="quoteRequired" checked={quote} onChange={event => setQuote(event.target.checked)}/>}/></Grid>
            <Grid size={12}><TextField fullWidth multiline minRows={3} label="About this plan" value={description} onChange={event => setDescription(event.target.value)} slotProps={{htmlInput:{maxLength:2000}}}/></Grid>
          </Grid>
          <Box component="details" sx={{border:1, borderColor:"divider", borderRadius:2, p:2}}>
            <Box component="summary" sx={{cursor:"pointer", fontWeight:700}}>Discord enrollment settings</Box>
            <Stack spacing={2} sx={{mt:2}}>
              <TextField defaultValue={roles[0]??""} fullWidth label="Discord coaching role" name="requiredDiscordRoleId" required select={roles.length>0}>
                {roles.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
              </TextField>
              <TextField fullWidth multiline minRows={2} label="Payment and enrollment instructions" name="paymentInstructions"/>
              <TextField defaultValue="" fullWidth label="Archive paused students after" name="autoArchiveAfterDays" select>
                <MenuItem value="">Never</MenuItem><MenuItem value="30">30 days</MenuItem><MenuItem value="60">60 days</MenuItem><MenuItem value="90">90 days</MenuItem>
              </TextField>
            </Stack>
          </Box>
        </Stack>
      </Grid>
      <Grid size={{xs:12, lg:4}}>
        <Box id="coach-plan-preview" sx={{position:{lg:"sticky"}, top:{lg:24}, scrollMarginTop:80, border:1, borderColor:"divider", borderRadius:2, p:2.5, bgcolor:"background.paper"}}>
          <Stack spacing={2}>
            <Typography component="h3" variant="h3">Plan preview</Typography>
            <Typography fontWeight={800}>{name || "Untitled plan"}</Typography>
            <Stack direction="row" spacing={1} sx={{flexWrap:"wrap", gap:1}}>
              <Chip color="success" label={quote ? "Quote required" : price ? currency+" "+price : "Price not set"}/>
              <Chip color="info" label={{weekly:"Weekly billing",monthly:"Monthly billing",one_time:"One-time",custom:"Custom billing"}[billing]}/>
              <Chip color="warning" label={(capacity || "—")+" students"}/>
            </Stack>
            <Divider/>
            {!active.length ? <Typography color="text.secondary">No services selected</Typography> : active.map(offer => <Box key={offer.type}>
              <Typography fontWeight={800}>{offer.label}</Typography>
              <Stack direction="row" sx={{flexWrap:"wrap", gap:.75, mt:1}}>
                {offerSummary(offer, settings[offer.type]).map(text => <Chip key={text} size="small" variant="outlined" label={text} sx={theme => ({color:offerColor(offer,theme.palette.mode),borderColor:alpha(offerColor(offer,theme.palette.mode),.5),height:"auto", "& .MuiChip-label":{whiteSpace:"normal", py:.5}})}/>)}
              </Stack>
              {settings[offer.type].details ? <Typography variant="body2" sx={{mt:1, whiteSpace:"pre-wrap"}}>{settings[offer.type].details}</Typography> : null}
            </Box>)}
            {description ? <Typography variant="body2" sx={{whiteSpace:"pre-wrap"}}>{description}</Typography> : null}
            {tooLong ? <Typography color="error" role="alert">Plan details exceed 4,000 characters.</Typography> : null}
            <Button disabled={isReview || !active.length || tooLong} name="intent" type="submit" value="draft" variant="outlined">Save draft</Button>
            <Button disabled={isReview || !active.length || tooLong || !roles.length} name="intent" type="submit" value="publish" variant="contained">Publish plan</Button>
            <Button href="#coach-plan-builder" sx={{display:{lg:"none"}}}>Back to plan</Button>
          </Stack>
        </Box>
      </Grid>
    </Grid>
  </Box>;
}

function ServiceFields({offer, value}:{offer:Offer; value:OfferSettings}) {
  const fields:Record<string,string> = {
    item:"on", measurement:offer.measure, frequency:value.frequency, coverage:value.coverage,
    quantity:value.quantity || "1", due:value.dueDays || "0", selection:offer.type==="trade_review"?value.selection:"not_applicable",
    followUp:offer.type==="review_follow_up"?value.followUpDays:"0", minutes:value.minutes, depth:value.depth,
  };
  return <>{Object.entries(fields).map(([key, text]) => <input key={key} type="hidden" name={key+":"+offer.type} value={text}/>)}
    {value.timeline ? <input type="hidden" name={"timeline:"+offer.type} value="on"/> : null}
    {value.focus.map(focus => <input key={focus} type="hidden" name={"focus:"+offer.type} value={focus}/>)}
  </>;
}

function OfferEditor({offer, value, onChange, onRemove}:{
  offer:Offer; value:OfferSettings; onChange:(patch:Partial<OfferSettings>)=>void; onRemove:()=>void;
}) {
  const focusToggle = (key:OfferSettings["focus"][number]) => onChange({focus:value.focus.includes(key)?value.focus.filter(item=>item!==key):[...value.focus,key]});
  const isReview = offer.group==="Reviews";
  return <Box sx={theme => ({border:1, borderColor:"divider", borderTop:4, borderTopColor:offerColor(offer,theme.palette.mode), borderRadius:2, p:{xs:2,sm:2.5}})}>
    <Stack direction="row" sx={{justifyContent:"space-between", alignItems:"center", mb:2}}>
      <Typography component="h3" variant="h3">{offer.label}</Typography>
      <Button type="button" size="small" color="error" onClick={onRemove} aria-label={"Remove "+offer.label}>Remove</Button>
    </Stack>
    <Stack spacing={2}>
      {offer.type==="performance_review" ? <Box>
        <Typography fontWeight={700}>Include in performance review</Typography>
        <Chip label="Performance results and comparisons" size="small" color="success" sx={{my:1}}/>
        <Grid container>{PERFORMANCE_INCLUSIONS.map(item=><Grid key={item.key} size={{xs:12,sm:6}}><FormControlLabel label={item.label} control={<Checkbox checked={value.focus.includes(item.key)} onChange={()=>focusToggle(item.key)}/>}/></Grid>)}</Grid>
      </Box> : null}
      {offer.type==="trade_review" ? <Grid container spacing={2}>
        <Grid size={{xs:12,sm:6}}><TextField fullWidth required label={offer.count} type="number" value={value.quantity} onChange={event=>onChange({quantity:event.target.value})} slotProps={{htmlInput:{min:1,step:1}}}/></Grid>
        <Grid size={{xs:12,sm:6}}><TextField fullWidth label="Trades chosen by" select value={value.selection} onChange={event=>onChange({selection:event.target.value as OfferSettings["selection"]})}><MenuItem value="coach">Coach</MenuItem><MenuItem value="student">Student</MenuItem><MenuItem value="coach_or_student">Coach or student</MenuItem></TextField></Grid>
        <Grid size={12}><Stack direction={{xs:"column",sm:"row"}}><FormControlLabel label="Include each trade’s Journal notes and tags" control={<Checkbox checked={value.focus.includes("journal")} onChange={()=>focusToggle("journal")}/>}/><FormControlLabel label="Include each trade’s rules" control={<Checkbox checked={value.focus.includes("rules")} onChange={()=>focusToggle("rules")}/>}/></Stack></Grid>
      </Grid> : null}
      {offer.type==="trading_day_review" ? <Grid container spacing={2}>
        <Grid size={{xs:12,sm:6}}><TextField fullWidth required label={offer.count} type="number" value={value.quantity} onChange={event=>onChange({quantity:event.target.value})} slotProps={{htmlInput:{min:1,step:1}}}/></Grid>
        <Grid size={{xs:12,sm:6}}><TextField fullWidth label="Review includes" select value={value.depth} onChange={event=>onChange({depth:event.target.value as OfferSettings["depth"],focus:event.target.value==="complete_day"?["journal","rules"]:[]})}><MenuItem value="trades_only">Trades only</MenuItem><MenuItem value="complete_day">Trades and complete trading-day Journal</MenuItem></TextField></Grid>
      </Grid> : null}
      {offer.type==="custom_task" ? <FormControlLabel label="Add a schedule" control={<Checkbox checked={value.timeline} onChange={event=>onChange({timeline:event.target.checked})}/>}/> : null}
      {offer.count && !["trade_review","trading_day_review"].includes(offer.type) ? <TextField fullWidth required label={offer.count} type="number" value={value.quantity} onChange={event=>onChange({quantity:event.target.value})} slotProps={{htmlInput:{min:1,step:1}}}/> : null}
      {value.timeline ? <Grid container spacing={2}>
        <Grid size={{xs:12,sm:6}}><TextField fullWidth label={offer.type==="questions"?"Allowance renews":"How often"} select value={value.frequency} onChange={event=>onChange({frequency:event.target.value as OfferSettings["frequency"]})}>{Object.entries(FREQUENCIES).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField></Grid>
        {offer.period ? <Grid size={{xs:12,sm:6}}><TextField fullWidth label="Period covered" select value={value.coverage} onChange={event=>onChange({coverage:event.target.value as OfferSettings["coverage"]})}>{Object.entries(PERIODS).filter(([key])=>key!=="single_item"||Boolean(offer.count)).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField></Grid> : null}
        <Grid size={{xs:12,sm:6}}><TextField fullWidth label={offer.type==="questions"?"Reply within (days)":"Deliver within (days)"} type="number" value={value.dueDays} onChange={event=>onChange({dueDays:event.target.value})} slotProps={{htmlInput:{min:0,step:1}}}/></Grid>
        {!isReview && offer.type!=="questions" ? <Grid size={{xs:12,sm:6}}><TextField fullWidth label="Session length (minutes)" type="number" value={value.minutes} onChange={event=>onChange({minutes:event.target.value})} slotProps={{htmlInput:{min:1,step:1}}}/></Grid> : null}
      </Grid> : null}
      {offer.type==="review_follow_up" ? <TextField fullWidth required label="Follow-up period (days)" type="number" value={value.followUpDays} onChange={event=>onChange({followUpDays:event.target.value})} slotProps={{htmlInput:{min:1,step:1}}}/> : null}
      {isReview ? <Box component="details" open={offer.type==="performance_review"} sx={{borderTop:1,borderColor:"divider",pt:1.5}}>
        <Box component="summary" sx={{cursor:"pointer",fontWeight:700}}>Review resources</Box>
        <Stack sx={{mt:1}}>{REVIEW_RESOURCES.map(resource=><FormControlLabel key={resource} label={resource} control={<Checkbox checked={value.resources.includes(resource)} onChange={()=>onChange({resources:value.resources.includes(resource)?value.resources.filter(item=>item!==resource):[...value.resources,resource]})}/>}/>)}</Stack>
      </Box> : null}
      <TextField fullWidth multiline minRows={2} required={offer.type==="custom_task"} label={offer.type==="strategy_review"?"Strategy / setup and feedback":offer.type==="rules_review"?"Rules focus and feedback":offer.type==="risk_review"?"Risk focus and feedback":offer.type==="goal_review"?"Goals and feedback":offer.type==="group_lesson"?"Lesson topics and delivery":offer.type==="custom_task"?"What you offer":"What the student receives"} value={value.details} onChange={event=>onChange({details:event.target.value})} slotProps={{htmlInput:{maxLength:1000}}}/>
    </Stack>
  </Box>;
}
