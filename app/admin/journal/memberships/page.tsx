import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { withJournalAdminPageDatabase } from
  "@/src/modules/platform/server/administration/require-journal-admin-page";
import { PlatformMembershipAdminService } from
  "@/src/modules/platform/server/membership/platform-membership-admin-service";
import {
  JournalAdminEmpty,
  JournalAdminMetricCard,
  JournalAdminMetricGrid,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminPanel,
} from "../journal-admin-ui";
import { PrivatePlanLinkForm } from "./private-link-form";
import { MembershipManagementPanels } from "./management-panels";

export const metadata: Metadata = { title: "Memberships | Journal Administration" };
export const dynamic = "force-dynamic";

const sections = [
  "Overview", "Plans", "Features", "Prices & checkout", "Trials",
  "Discord access", "Members", "Grant access", "Subscriptions",
  "Billing health", "Audit history", "Private links",
] as const;

export default async function MembershipsAdminPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const query = await searchParams;
  const section = sections.find((item) => item === query.section) ?? "Overview";
  const { snapshot, panel } = await withJournalAdminPageDatabase((database) => {
    const snapshot = new PlatformMembershipAdminService(database).read();
    return { snapshot, panel: snapshot.available ? MembershipManagementPanels({ database, section }) : null };
  });
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description=""
        eyebrow="Private owner access"
        title="Memberships"
      />
      {!snapshot.available ? (
        <Alert severity="info">The membership foundation is awaiting its controlled database migration.</Alert>
      ) : null}
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        {sections.map((item) => (
          <Chip component="a" clickable href={`/admin/journal/memberships?section=${encodeURIComponent(item)}`} color={item === section ? "primary" : "default"} key={item} label={item} variant={item === section ? "filled" : "outlined"} />
        ))}
      </Stack>
      <JournalAdminMetricGrid>
        <JournalAdminMetricCard caption="All plan states" label="Plans" value={snapshot.counts.plans.toString()} />
        <JournalAdminMetricCard caption="Immutable published snapshots" label="Published versions" value={snapshot.counts.publishedVersions.toString()} />
        <JournalAdminMetricCard caption="Stripe, Whop, free and external" label="Active offers" value={snapshot.counts.activeOffers.toString()} />
        <JournalAdminMetricCard caption="All additive access sources" label="Active entitlements" value={snapshot.counts.activeEntitlements.toString()} />
        <JournalAdminMetricCard caption="Currently enrollable" label="Active trials" value={snapshot.counts.activeTrials.toString()} />
        <JournalAdminMetricCard caption="Unlisted and revocable" label="Private links" value={snapshot.counts.activeShareLinks.toString()} />
      </JournalAdminMetricGrid>
      {panel}
      <JournalAdminPanel
        action={<Button href="/admin/journal/memberships/plans/new" startIcon={<AddRoundedIcon />} variant="contained">New plan</Button>}
        title="Plans"
      >
        {snapshot.plans.length === 0 ? (
          <JournalAdminEmpty>No membership plans have been created.</JournalAdminEmpty>
        ) : (
          <Stack spacing={1.25}>
            {snapshot.plans.map((plan) => (
              <Box key={plan.planId} sx={{ alignItems: { sm: "center" }, borderBottom: 1, borderColor: "divider", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, justifyContent: "space-between", pb: 1.25 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{plan.name}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {plan.versionCount} versions · {plan.offerCount} offers
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label={plan.visibility} size="small" variant="outlined" />
                  <Chip color={plan.status === "active" ? "success" : "default"} label={plan.status} size="small" />
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </JournalAdminPanel>
      <JournalAdminPanel title="Private plan link">
        <PrivatePlanLinkForm offers={snapshot.offers} />
      </JournalAdminPanel>
    </JournalAdminPage>
  );
}
