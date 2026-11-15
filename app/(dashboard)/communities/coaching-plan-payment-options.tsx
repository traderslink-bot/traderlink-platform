"use client";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { CoachingPlanPaymentOptions } from "@/src/modules/communities/contracts/coaching-payment-options";
import type { TraderLinkCommunityCoachingItemType } from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";

export function CoachingPlanPaymentOptionsFields({value,onChange,billing,offers,onBillingChange,paymentInstructions,onPaymentInstructionsChange}:{
  value:CoachingPlanPaymentOptions;
  onChange:(value:CoachingPlanPaymentOptions)=>void;
  billing:string;
  onBillingChange?:(billing:string)=>void;
  paymentInstructions?:string;
  onPaymentInstructionsChange?:(value:string)=>void;
  offers:readonly Readonly<{type:TraderLinkCommunityCoachingItemType;label:string}>[];
}) {
  return <Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}><Stack spacing={2}>
    <Typography component="h3" variant="h3">Payment</Typography>
    <Grid container spacing={2}>
      {onBillingChange?<Grid size={{xs:12,md:6}}><TextField select required fullWidth label="Payment frequency" value={billing} onChange={event=>onBillingChange(event.target.value)}>
        <MenuItem value="" disabled>Choose payment frequency</MenuItem><MenuItem value="one_time">Per purchase</MenuItem><MenuItem value="weekly">Weekly</MenuItem><MenuItem value="monthly">Monthly</MenuItem><MenuItem value="custom">Custom</MenuItem>
      </TextField></Grid>:null}
      <Grid size={{xs:12,md:6}}><TextField select fullWidth label="Payment method" value={value.method} onChange={event=>onChange({...value,method:event.target.value as CoachingPlanPaymentOptions["method"]})}>
        <MenuItem value="offsite">Arrange payment directly</MenuItem><MenuItem value="whop">Pay through Whop</MenuItem>
      </TextField></Grid>
      {value.method==="whop"&&["monthly","custom"].includes(billing)?<Grid size={{xs:12,md:6}}><TextField fullWidth type="number" label="Billing interval in days" value={value.billingIntervalDays??""} required slotProps={{htmlInput:{min:1,step:1}}} onChange={event=>onChange({...value,billingIntervalDays:event.target.value?Number(event.target.value):null})} helperText="Students see this exact interval before paying. Calendar months can have different lengths."/></Grid>:null}
    </Grid>
    {onPaymentInstructionsChange?<TextField fullWidth multiline minRows={3} label="Payment instructions" value={paymentInstructions??""} onChange={event=>onPaymentInstructionsChange(event.target.value)}/>:null}
    {value.method==="offsite"?<Typography variant="body2" color="text.secondary">Use your payment instructions to arrange payment with the student.</Typography>:<>
      <Typography variant="body2" color="text.secondary">Student payments go to your own Whop account. Connect it in Profile. Existing accepted agreements keep their original payment terms.</Typography>
      <Typography variant="body2">{billing==="one_time"?"Work included in this purchase":"Work included per payment"}</Typography>
      <Grid container spacing={2}>{offers.map(offer=><Grid key={offer.type} size={{xs:12,md:6}}><TextField fullWidth type="number" label={`${offer.label}: occurrences`} value={value.serviceOccurrences[offer.type]??1} slotProps={{htmlInput:{min:1,step:1}}} onChange={event=>onChange({...value,serviceOccurrences:{...value.serviceOccurrences,[offer.type]:Number(event.target.value)}})} helperText={offer.type==="trade_review"?"Review count; trades per review is set separately.":offer.type==="trading_day_review"?"Review count; days and trade limits are set separately.":undefined}/></Grid>)}</Grid>
    </>}
  </Stack></Box>;
}
