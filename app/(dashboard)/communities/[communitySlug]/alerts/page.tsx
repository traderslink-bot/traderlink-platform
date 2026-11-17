import CommunitySectionPage from "../[...section]/page";
import { notFound, unstable_rethrow } from "next/navigation";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DashboardPage, DashboardPanel, DashboardSecondaryAction } from "@/app/dashboard-template";
import { SharedAlertError } from "@/src/modules/communities/server/shared-alerts-errors";
import { loadSharedAlertsSourcePublisherPage } from "@/src/modules/communities/server/shared-alerts-source-page-access";
import { SharedAlertsSourceClient } from "../../shared-alerts/shared-alerts-source-client";
import { CommunityNavigation } from "../../community-navigation";

export const dynamic = "force-dynamic";

export default async function SharedSourceAlertsPage({ params, searchParams }: Readonly<{
  params: Promise<{ communitySlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { communitySlug } = await params, query = await searchParams;
  if (Array.isArray(query.edit) || Array.isArray(query.page)) notFound();
  let source;
  try { source = await loadSharedAlertsSourcePublisherPage(communitySlug, { alertId: query.edit || undefined, page: Number(query.page) }); }
  catch (error) {
    unstable_rethrow(error);
    if (error instanceof SharedAlertError && error.code === "not_found") notFound();
    return <DashboardPage><Typography variant="h1" component="h1">Alerts</Typography><DashboardPanel><Alert severity="warning">Publishing access is unavailable. Check your individual publishing permission and Discord connection.</Alert></DashboardPanel></DashboardPage>;
  }
  if (!source) return CommunitySectionPage({ params: Promise.resolve({ communitySlug, section: ["alerts"] }) });
  const base = `/communities/${communitySlug}/alerts`;
  return <DashboardPage>
    <CommunityNavigation scope="shared-alerts" snapshot={{...source.navigation, relationships: []}} />
    <Typography variant="h1" component="h1">Alerts</Typography>
    <DashboardPanel title={source.selected ? "Edit alert" : "Write an alert"}>
      <SharedAlertsSourceClient view="publisher" communitySlug={communitySlug} audiences={source.audiences} destinations={source.destinations} initialAlert={source.selected ?? undefined} initialDestinationIds={source.initialDestinationIds} initialDistribution={source.initialDistribution} />
    </DashboardPanel>
    <DashboardPanel title="Saved alerts">
      <Stack spacing={2}>
        {!source.alerts.length ? <Typography>No alerts have been saved yet.</Typography> : source.alerts.map(alert => <Stack key={alert.id} direction={{ xs: "column", sm: "row" }} sx={{ gap: 1, justifyContent: "space-between", alignItems: { sm: "center" }, minWidth: 0 }}>
          <Stack spacing={0.5} sx={{ minWidth: 0 }}><Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{alert.title}</Typography><Chip size="small" label={alert.status === "published" ? "Published" : alert.status === "draft" ? "Draft" : "Withdrawn"} sx={{ alignSelf: "flex-start" }} /></Stack>
          <DashboardSecondaryAction href={`${base}?edit=${encodeURIComponent(alert.id)}`}>{alert.status === "archived" ? "View saved alert" : "Edit alert"}</DashboardSecondaryAction>
        </Stack>)}
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
          {source.page > 1 ? <DashboardSecondaryAction href={`${base}?page=${source.page - 1}`}>Previous</DashboardSecondaryAction> : null}
          {source.page * 25 < source.total ? <DashboardSecondaryAction href={`${base}?page=${source.page + 1}`}>Next</DashboardSecondaryAction> : null}
          {source.selected ? <DashboardSecondaryAction href={base}>Write a new alert</DashboardSecondaryAction> : null}
        </Stack>
      </Stack>
    </DashboardPanel>
  </DashboardPage>;
}
