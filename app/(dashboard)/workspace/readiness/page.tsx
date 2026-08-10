import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import {
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
} from "../../../dashboard-template";
import { LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS } from "@/src/modules/platform/contracts/legacy-intelligence-route-disposition";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformReadinessReadService } from "@/src/modules/platform/server/readiness/platform-readiness-read-service";

export const metadata: Metadata = {
  description: "Privacy-safe replacement application and launch readiness facts.",
  title: "Platform Readiness | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function singleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function PlatformReadinessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [scope, params] = await Promise.all([
    requireTraderLinkPlatformPageScope(),
    searchParams,
  ]);
  const readiness = withReadonlyPlatformDatabase({}, (database) =>
    new PlatformReadinessReadService(database).get(scope),
  );
  const requestedCapability = singleValue(params.capability);
  const legacyDisposition = LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS.find(
    (route) =>
      route.kind === "operations_only" &&
      route.capability === requestedCapability,
  );

  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Platform
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          Platform Readiness
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 780, mt: 1 }} variant="body2">
          Replacement ownership, storage and launch gates from the active Platform boundary. No private identifiers, broker data or trade values are shown here.
        </Typography>
      </Box>

      {legacyDisposition ? (
        <DashboardPanel title="Legacy tool disposition">
          <Typography sx={{ fontWeight: 800 }}>{legacyDisposition.capability}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
            This was an internal test or operations tool, not an end-user dashboard feature. Its source remains preserved, but it is not connected to the retired V3 runtime.
          </Typography>
        </DashboardPanel>
      ) : null}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" } }}>
        <DashboardMetricCard caption="Replacement schema contract" label="Database" value={readiness.storage.state === "verified" ? "Verified" : "Pending"} />
        <DashboardMetricCard caption="Applied in immutable order" label="Migrations" value={`${readiness.storage.appliedMigrationCount} / ${readiness.storage.expectedMigrationCount}`} />
        <DashboardMetricCard caption={`${readiness.storage.domainTableCount} domain tables plus the registry`} label="Owned tables" value={`${readiness.storage.observedTableCount} / ${readiness.storage.expectedTableCount}`} />
        <DashboardMetricCard caption="Every preserved page has a disposition" label="Legacy routes mapped" value={`${readiness.legacyRoutes.total} / 52`} />
      </Box>

      <DashboardPanel title="Replacement ownership">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
          <CheckCircleRoundedIcon color="success" />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800 }}>Stable Platform ownership is active</Typography>
            <Typography color="text.secondary" variant="body2">
              The current workspace has {readiness.ownership.allowedJournalAccountCount} available Trade Tracker account{readiness.ownership.allowedJournalAccountCount === 1 ? "" : "s"}, and the active account is selected inside the authorized workspace.
            </Typography>
          </Box>
          <Chip color="success" label="Ready for local review" size="small" />
        </Stack>
      </DashboardPanel>

      <DashboardPanel title="Module storage boundaries">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
          {readiness.modules.map((module) => (
            <Stack key={module.moduleNamespace} direction="row" spacing={1.5} sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}>
              <StorageRoundedIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 800, textTransform: "capitalize" }}>{module.moduleNamespace.replaceAll("-", " ")}</Typography>
                <Typography color="text.secondary" variant="body2">{module.appliedMigrationCount} applied migration{module.appliedMigrationCount === 1 ? "" : "s"}</Typography>
              </Box>
              <Chip color="success" label="Applied" size="small" />
            </Stack>
          ))}
        </Box>
      </DashboardPanel>

      <DashboardPanel title="Legacy route disposition">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
          <RouteRoundedIcon color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800 }}>All 52 legacy pages have an explicit destination</Typography>
            <Typography color="text.secondary" variant="body2">
              {readiness.legacyRoutes.byDisposition.canonical_redirect} canonical redirects, {readiness.legacyRoutes.byDisposition.compatibility_redirect} compatibility redirects, {readiness.legacyRoutes.byDisposition.operations_only} operations-only tools and {readiness.legacyRoutes.byDisposition.owner_rejected_test_surface} rejected mock surface. Legacy source is preserved but no longer needs to run the dashboard.
            </Typography>
          </Box>
        </Stack>
      </DashboardPanel>

      <DashboardPanel title="Launch gates">
        <Stack spacing={1.5}>
          {readiness.launchGates.map((gate) => (
            <Stack key={gate.id} direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
              {gate.state === "ready" ? <CheckCircleRoundedIcon color="success" /> : <HourglassTopRoundedIcon color="warning" />}
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 800 }}>{gate.label}</Typography>
                <Typography color="text.secondary" variant="body2">{gate.detail}</Typography>
              </Box>
              <Chip color={gate.state === "ready" ? "success" : "warning"} label={gate.state === "ready" ? "Ready" : "Pending"} size="small" />
            </Stack>
          ))}
        </Stack>
      </DashboardPanel>
    </DashboardPage>
  );
}
