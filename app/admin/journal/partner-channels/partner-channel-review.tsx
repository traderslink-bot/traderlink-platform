"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PartnerChannelRoleReview } from "./partner-channel-role-review";

export type PartnerChannelReviewItem = Readonly<{
  communityId: string;
  displayName: string;
  channelCount: number;
  agreementType: "standard" | "private" | "unavailable";
  submittedAtUtc: string;
  verification: "recheck_required";
}>;

function reviewItems(value: unknown): readonly PartnerChannelReviewItem[] | null {
  if (!value || typeof value !== "object" || !("ok" in value) || value.ok !== true
    || !("result" in value) || !Array.isArray(value.result) || value.result.length > 100) return null;
  const items: PartnerChannelReviewItem[] = [];
  for (const item of value.result) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    if (typeof row.communityId !== "string" || typeof row.displayName !== "string"
      || !Number.isInteger(row.channelCount)
      || !["standard", "private", "unavailable"].includes(String(row.agreementType))
      || typeof row.submittedAtUtc !== "string" || row.verification !== "recheck_required") return null;
    items.push({ communityId: row.communityId, displayName: row.displayName,
      channelCount: row.channelCount as number,
      agreementType: row.agreementType as PartnerChannelReviewItem["agreementType"],
      submittedAtUtc: row.submittedAtUtc, verification: "recheck_required" });
  }
  return items;
}

function formatSubmitted(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "Unavailable";
}

export function PartnerChannelReview() {
  const [items, setItems] = useState<readonly PartnerChannelReviewItem[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/journal/partner-channels", { cache: "no-store", credentials: "same-origin",
      signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("unavailable");
      const result = reviewItems(await response.json());
      if (!result) throw new Error("unavailable");
      setItems(result);
    }).catch(() => { if (!controller.signal.aborted) setUnavailable(true); });
    return () => controller.abort();
  }, []);
  return <Stack spacing={2.5}>
    <Box>
      <Typography component="h1" variant="h4">Partner channel review</Typography>
    </Box>
    <Alert severity="info">Final approval rechecks Discord channels, managed roles, destinations, and Whop offers. Approval leaves the partner in Setup required and does not activate publishing.</Alert>
    {unavailable ? <Alert severity="warning">Partner channel requests are temporarily unavailable. No review action was taken.</Alert>
      : items === null ? <Paper variant="outlined" sx={{ alignItems: "center", display: "flex", gap: 1.5, p: 3 }}>
        <CircularProgress size={22} /><Typography>Loading review requests…</Typography>
      </Paper> : items.length === 0 ? <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">No requests awaiting review</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }}>Submitted communities will appear here.</Typography>
    </Paper> : <Stack spacing={1.5}>{items.map((item) => <Paper key={item.communityId} variant="outlined" sx={{ p: 2.5 }}>
      <Box sx={{ alignItems: "center", display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "2fr repeat(5, 1fr)" } }}>
        <Box><Typography color="text.secondary" variant="caption">Community</Typography><Typography sx={{ fontWeight: 800 }}>{item.displayName}</Typography></Box>
        <Box><Typography color="text.secondary" variant="caption">Channels</Typography><Typography>{item.channelCount}</Typography></Box>
        <Box><Typography color="text.secondary" variant="caption">Agreement</Typography><Typography sx={{ textTransform: "capitalize" }}>{item.agreementType}</Typography></Box>
        <Box><Typography color="text.secondary" variant="caption">Submitted</Typography><Typography>{formatSubmitted(item.submittedAtUtc)}</Typography></Box>
        <Box><Typography color="text.secondary" variant="caption">Verification</Typography><Typography>Recheck required</Typography></Box>
        <Button component={Link} href={`/admin/journal/partner-channels/${item.communityId}`} variant="outlined">Review</Button>
      </Box>
    </Paper>)}</Stack>}
    <PartnerChannelRoleReview />
  </Stack>;
}
