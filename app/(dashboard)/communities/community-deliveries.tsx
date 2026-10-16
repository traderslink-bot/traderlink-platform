import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {DashboardPanel} from "@/app/dashboard-ui";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {retryCommunityDeliveryAction} from "./community-actions";

export function CommunityDeliveries({snapshot,isReview}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview:boolean}){
 return <DashboardPanel title="Discord deliveries"><Stack spacing={2}>{(snapshot.deliveries??[]).map(item=>{
  const label=item.outcome==="confirmed"?"Delivered":item.outcome==="uncertain"?"Check Discord":item.outcome==="rejected"?"Not sent":item.status==="sending"?"Sending":item.status==="cancelled"?"Cancelled":"Queued";
  return <Box key={item.deliveryId} sx={{borderBottom:1,borderColor:"divider",pb:2}}><Stack direction={{xs:"column",md:"row"}} spacing={1} sx={{justifyContent:"space-between"}}><Box><Typography sx={{ fontWeight: 800 }}>#{item.channelName}</Typography><Typography variant="body2">Publisher: {item.publisherName??"Not recorded (legacy delivery)"}</Typography><Typography>{item.objectType.charAt(0).toUpperCase()+item.objectType.slice(1)}</Typography><Typography variant="caption">{item.updatedAtUtc.slice(0,16).replace('T',' ')} UTC</Typography></Box><Chip label={label} color={item.outcome==="confirmed"?"success":item.outcome==="uncertain"?"warning":item.outcome==="rejected"?"error":"info"}/></Stack>{item.error?<Typography variant="body2" sx={{mt:1}}>{item.error}</Typography>:null}{item.messageId?<Typography variant="caption">Message {item.messageId}</Typography>:null}{['failed','delivered'].includes(item.status)?<Box component="form" action={isReview?undefined:retryCommunityDeliveryAction} sx={{mt:1}}><input type="hidden" name="communitySlug" value={snapshot.community.slug}/><input type="hidden" name="deliveryId" value={item.deliveryId}/><input type="hidden" name="attemptKey" value={item.attemptKey}/><Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{justifyContent:"flex-end",alignItems:{sm:"center"}}}>{item.outcome==="uncertain"?<FormControlLabel control={<Checkbox name="confirmUncertain" required/>} label="I checked Discord; send again"/>:null}<Button type="submit" variant="outlined" disabled={isReview}>{item.outcome==="confirmed"||item.outcome==="uncertain"?"Send again":"Retry"}</Button></Stack></Box>:null}</Box>;
 })}{!snapshot.deliveries?.length?<Typography>No deliveries</Typography>:null}</Stack></DashboardPanel>;
}
