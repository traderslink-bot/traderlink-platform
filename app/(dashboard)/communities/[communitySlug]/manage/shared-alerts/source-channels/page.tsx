import { notFound, unstable_rethrow } from "next/navigation";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DashboardPage, DashboardPanel, DashboardSecondaryAction } from "@/app/dashboard-template";
import { CommunityNavigation } from "@/app/(dashboard)/communities/community-navigation";
import { SharedAlertsSourceClient } from "@/app/(dashboard)/communities/shared-alerts/shared-alerts-source-client";
import { loadSharedAlertsSourceOwnerPage } from "@/src/modules/communities/server/shared-alerts-source-page-access";
import { SharedAlertError } from "@/src/modules/communities/server/shared-alerts-errors";

export const dynamic = "force-dynamic";

export default async function SharedSourceChannelAssignmentsPage({ params }: Readonly<{ params: Promise<{ communitySlug: string }> }>) {
  const { communitySlug } = await params;
  let source;
  try { source = await loadSharedAlertsSourceOwnerPage(communitySlug, { mode: "assignments" }); }
  catch (error) {
    unstable_rethrow(error);
    if (error instanceof SharedAlertError && ["not_found", "not_owner"].includes(error.code)) notFound();
    return <DashboardPage><Typography component="h1" variant="h1">Source channel assignments</Typography><DashboardPanel><Alert severity="warning">Source channel assignments are unavailable. Check your server ownership and Discord connection, then reload.</Alert></DashboardPanel></DashboardPage>;
  }
  if (!source) notFound();
  return <DashboardPage>
    <CommunityNavigation scope="shared-alerts" snapshot={source.navigation} />
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1, justifyContent: "space-between", alignItems: { sm: "center" } }}><Typography component="h1" variant="h1">Source channel assignments</Typography><DashboardSecondaryAction href={`/communities/${communitySlug}/manage/shared-alerts?tab=settings`}>Back to Shared alerts</DashboardSecondaryAction></Stack>
      <DashboardPanel><SharedAlertsSourceClient view="owner_assignments" communitySlug={communitySlug} destinations={source.destinations} publishers={source.publishers} /></DashboardPanel>
    </Stack>
  </DashboardPage>;
}
