"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { WhopAccountConnectionNotice, WhopAccountIdentityState } from
  "@/src/modules/platform/server/billing/whop-account-connection";

export function WhopAccountConnection({state,canConnect,notice}: {
  state:WhopAccountIdentityState;canConnect:boolean;notice:WhopAccountConnectionNotice|null;
}) {
  const [pending,setPending] = useState(false);
  useEffect(() => {
    const restore = () => setPending(false);
    window.addEventListener("pageshow",restore);
    return () => window.removeEventListener("pageshow",restore);
  },[]);
  const status = state === "linked" ? "Connected" : state === "not_linked" ? "Not connected"
    : state === "conflict" ? "Needs review" : "Verification unavailable";
  const error = notice === "invalid-state" || notice === "unavailable";
  return <Stack spacing={1} sx={{borderTop:1,borderColor:"divider",pt:2}}>
    <Stack direction={{xs:"column",sm:"row"}} spacing={1.5} sx={{alignItems:{xs:"flex-start",sm:"center"},justifyContent:"space-between"}}>
      <Stack spacing={0.5}>
        <Typography component="h3" variant="body1" sx={{fontWeight:700}}>Whop account</Typography>
        <Typography variant="body2" role="status" aria-live="polite" color={state === "linked" ? "success.main" : "text.secondary"}>
          {pending ? "Opening Whop…" : status}
        </Typography>
      </Stack>
      {state === "not_linked" && canConnect ? <Button href="/api/billing/whop/connect?entry=billing" variant="outlined"
        disabled={pending} onClick={event => {
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) setPending(true);
        }}>{pending ? "Connecting…" : "Connect Whop"}</Button> : null}
    </Stack>
    {state === "not_linked" && canConnect ? <Typography variant="body2" color="text.secondary">
      Connect the Whop account you use for your TraderLink purchases.
    </Typography> : null}
    {state === "conflict" ? <Typography variant="body2" color="error.main">This Whop connection needs support review.</Typography> : null}
    {state === "not_linked" && !canConnect ? <Typography variant="body2" color="text.secondary">Whop connection is currently unavailable.</Typography> : null}
    {error ? <Alert severity="error">We couldn’t connect your Whop account. {canConnect && state === "not_linked" ? "Try again." : "Try again later."}</Alert> : null}
  </Stack>;
}
