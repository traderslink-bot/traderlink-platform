import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { WhopAiReviewAccessRecord } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";

function renewalDate(value: string | null): string | null {
  return value ? new Intl.DateTimeFormat("en-US", { dateStyle: "long" })
    .format(new Date(value)) : null;
}

export function AiReviewSubscriptionStatus({
  access,
  configured,
  checkoutUrl,
  billingPortalUrl,
}: Readonly<{
  access: WhopAiReviewAccessRecord | null;
  configured: boolean;
  checkoutUrl: string | null;
  billingPortalUrl: string | null;
}>) {
  if (!configured || !access) {
    return <Alert severity="info">AI Review subscriptions are being prepared. No paid review can start until the connection is ready.</Alert>;
  }
  if (access.state === "conflict") {
    return <Alert severity="warning">This Whop connection needs support review before paid AI Reviews can start. No subscription access was granted from conflicting information.</Alert>;
  }
  if (access.state === "active") {
    const end = renewalDate(access.renewalPeriodEndUtc);
    return (
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip color="success" label="AI Review access active" size="small" />
          {access.cancelAtPeriodEnd ? <Chip label="Ends after current period" size="small" /> : null}
        </Stack>
        <Typography color="text.secondary" variant="body2">
          {access.cancelAtPeriodEnd
            ? `Your saved reviews remain available. New reviews continue${end ? ` through ${end}` : " through the current paid period"}, then pause unless the membership is renewed.`
            : `Whop confirms paid access${end ? ` through the current period ending ${end}` : ""}. Your Trade Tracker account still controls review frequency and timing.`}
        </Typography>
        {billingPortalUrl ? <Button href={billingPortalUrl} rel="noreferrer" target="_blank" variant="outlined">Manage subscription in Whop</Button> : null}
      </Stack>
    );
  }
  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="body2">
        {access.state === "not_linked"
          ? "Connect the Whop account used for your subscription. TraderLink will verify the account directly with Whop and will not match access by email."
          : "Your Whop account is connected, but an active AI Review membership has not been confirmed yet."}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
        {access.state === "not_linked" ? <Button href="/api/billing/whop/connect" variant="contained">Connect Whop</Button> : null}
        {checkoutUrl ? <Button href={checkoutUrl} rel="noreferrer" target="_blank" variant={access.state === "not_linked" ? "outlined" : "contained"}>View AI Review subscription</Button> : null}
      </Stack>
    </Stack>
  );
}
