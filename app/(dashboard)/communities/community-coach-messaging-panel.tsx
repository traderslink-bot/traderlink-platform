"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { DashboardPanel } from "@/app/dashboard-ui";
import type { TraderLinkCommunityDashboardSnapshot } from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { sendCommunityCoachingMessageAction } from "./community-actions";

export function CommunityCoachMessagingPanel({snapshot,isReview}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview:boolean}) {
  const relationships=snapshot.relationships.filter(item=>item.coachUserId===snapshot.viewer.userId&&item.status==="active");
  const relationshipIds=new Set(relationships.map(item=>item.relationshipId));
  const messages=snapshot.coachingMessages.filter(item=>relationshipIds.has(item.relationshipId));
  return <DashboardPanel title="Coach messages">
    <Stack divider={<Divider/>}>{messages.map(message=><Box key={message.messageId} sx={{py:1.25}}><Stack direction="row" sx={{justifyContent:"space-between"}}><Typography style={{fontWeight:800}}>{message.authorName}</Typography><Typography color="text.secondary" variant="caption">{new Date(message.createdAtUtc).toLocaleString()}</Typography></Stack><Typography variant="body2">{message.body}</Typography></Box>)}</Stack>
    {relationships.length?<Box action={isReview?undefined:sendCommunityCoachingMessageAction} component="form" sx={{mt:2}}><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><Stack direction={{xs:"column",md:"row"}} spacing={1}><TextField defaultValue={relationships[0].relationshipId} label="Student" name="relationshipId" select sx={{minWidth:220}}>{relationships.map(item=><MenuItem key={item.relationshipId} value={item.relationshipId}>{item.studentDisplayName}</MenuItem>)}</TextField><TextField fullWidth label="Message" name="body" required/><Button disabled={isReview} type="submit" variant="contained">Send</Button></Stack></Box>:null}
  </DashboardPanel>;
}
