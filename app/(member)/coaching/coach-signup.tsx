import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {DashboardPanel} from '@/app/dashboard-template';
import type {CoachingCommercialAccess} from '@/src/modules/communities/server/coaching-commercial-access';
import {IndependentCoachingForm} from './coaching-form';
import {CoachingPaymentAccountCard} from './payment-account-card';
export function IndependentCoachSignup({access}:{access:CoachingCommercialAccess}){
 return <Grid container spacing={3}><Grid size={{xs:12,lg:7}}><DashboardPanel title="Complete coach signup"><Stack spacing={3}>
  {access.reason==='unsupported_community_commission'?<Alert severity="info">Commission checkout for community plans is not part of the initial release. The owner can configure a supported coach subscription or separately approve free community coaching. Outside coaching uses its own platform signup.</Alert>:access.reason==='owner_configuration'?<Alert severity="info">The TraderLink owner needs to configure this coaching arrangement before coach tools are available.</Alert>:<Typography>Complete the requirements below to unlock coach tools and create plans.</Typography>}
  {access.commissionRequired?<Box><Typography variant="h3" sx={{mb:1}}>Commission signup</Typography><Typography sx={{mb:2}}>The platform commission is {(access.policy.commissionBasisPoints/100).toLocaleString('en-US')}% of your coaching service revenue. It comes from your revenue; it is not added to the student’s price. You do not need a student sale to complete signup.</Typography>{access.consentReady?<Alert severity="success">Current commission terms accepted.</Alert>:<IndependentCoachingForm intent="accept_coach_terms" label="Accept commission terms" hidden={{scope:access.scope,communityId:access.communityId??'',policyVersion:access.policy.policyVersion}}><FormControlLabel control={<Checkbox name="consent" value="yes" required/>} label="I accept these commission terms for this coaching arrangement."/></IndependentCoachingForm>}{access.merchantReady&&access.consentReady&&!access.feeReady?<Box sx={{mt:2}}><IndependentCoachingForm intent="verify_coach_setup" label="Complete commission setup" hidden={{scope:access.scope,communityId:access.communityId??''}}><Typography>Apply the owner-configured commission to your connected coach account and verify setup. This does not charge you or a student; existing payment terms cannot be repriced here.</Typography></IndependentCoachingForm></Box>:null}{access.feeReady?<Alert severity="success" sx={{mt:2}}>Commission setup verified.</Alert>:null}{!access.merchantReady?<Typography sx={{mt:2}}>Connect your own Whop account to complete commission signup.</Typography>:<Alert severity="success" sx={{mt:2}}>Coach payment account verified.</Alert>}</Box>:null}
  {access.subscriptionRequired?<Box><Typography variant="h3" sx={{mb:1}}>Coach subscription</Typography>{access.subscriptionReady?<Alert severity="success">A qualifying coach subscription is active.</Alert>:<><Typography sx={{mb:2}}>Choose the owner-configured coach subscription in Plan &amp; billing. Coach access unlocks after the subscription is confirmed.</Typography><Button href="/account/membership" variant="outlined">Open Plan &amp; billing</Button></>}</Box>:null}
  {access.scope==='community'?<Typography variant="body2" color="text.secondary">This signup applies to this community. Coaching outside it requires the platform coaching arrangement.</Typography>:null}
 </Stack></DashboardPanel></Grid>{access.commissionRequired?<Grid size={{xs:12,lg:5}}><CoachingPaymentAccountCard/></Grid>:null}</Grid>;
}
