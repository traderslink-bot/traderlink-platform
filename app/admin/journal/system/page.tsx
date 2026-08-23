import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { createJournalAdminReadContext } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { PlatformAdminSystemService } from "@/src/modules/platform/server/administration/platform-admin-system-service";
import { PlatformDashboardMemberAccessRepository } from "@/src/modules/platform/server/authentication/platform-dashboard-member-access-repository";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminMetricCard,
  JournalAdminMetricGrid,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminPanel,
  JournalAdminStatus,
  JournalAdminTable,
  formatAdminBytes,
  formatAdminDuration,
  formatAdminInteger,
  formatAdminUtc,
} from "../journal-admin-ui";
import { DashboardMemberAccessControl } from "./dashboard-member-access-control";

export const metadata: Metadata = { title: "System | Journal Administration" };
export const dynamic = "force-dynamic";

function formatOperationalDetails(counts: Readonly<Record<string, number>>): string {
  const details: string[] = [];
  if (counts.http_status !== undefined) details.push(`HTTP ${counts.http_status}`);
  if (counts.provider_code !== undefined) {
    const providerCode = counts.provider_code_negative === 1
      ? -counts.provider_code
      : counts.provider_code;
    details.push(`Provider ${providerCode}`);
  }
  return details.length > 0 ? details.join(" · ") : "—";
}

export default async function JournalAdminSystemPage() {
  const state = await withJournalAdminPageDatabase((database, scope) => Object.freeze({
    system: new PlatformAdminSystemService(createJournalAdminReadContext({ database, scope })).read(),
    dashboardMemberAccess: new PlatformDashboardMemberAccessRepository(database).read(),
  }));
  const system = state.system;
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description="Review safe application, database, import-processing, backup and login readiness without exposing secrets or local storage paths."
        eyebrow="Platform operations"
        title="System"
      />
      {system.unresolvedOperationalFailureCount > 0 ? (
        <Alert severity="error">{formatAdminInteger(system.unresolvedOperationalFailureCount)} operational failures need review.</Alert>
      ) : (
        <Alert severity="success">No unresolved operational failure is recorded.</Alert>
      )}
      <JournalAdminMetricGrid>
        <JournalAdminMetricCard caption={system.schema.latestMigrationId ?? "No migration"} label="Schema migrations" value={formatAdminInteger(system.schema.migrationCount)} />
        <JournalAdminMetricCard caption="Current database file" label="Database size" value={formatAdminBytes(system.storage.databaseBytes)} />
        <JournalAdminMetricCard caption="Current write-ahead log" label="WAL size" value={formatAdminBytes(system.storage.walBytes)} />
        <JournalAdminMetricCard caption="Import work in progress" label="Machine processing" value={formatAdminInteger(system.processing.machineProcessingCount)} />
        <JournalAdminMetricCard caption="Mapping or confirmation needed" label="Waiting for users" value={formatAdminInteger(system.processing.userWaitingCount)} />
        <JournalAdminMetricCard caption="Recent completed attempts" label="Median import time" value={formatAdminDuration(system.processing.completedDurationP50Ms)} />
        <JournalAdminMetricCard caption="Recent completed attempts" label="95th percentile" value={formatAdminDuration(system.processing.completedDurationP95Ms)} />
        <JournalAdminMetricCard caption={system.application.version ?? "Version unavailable"} label="Environment" value={system.application.environment} />
      </JournalAdminMetricGrid>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
        <JournalAdminPanel title="Login readiness">
          <Stack spacing={1.25} sx={{
            "& > :not(:last-child)": { borderBottom: 1, borderColor: "divider", pb: 1.25 },
          }}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Discord server</Typography><JournalAdminStatus state={system.discord.guildConfigured ? "active" : "unavailable"} /></Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Discord application</Typography><JournalAdminStatus state={system.discord.applicationConfigured ? "active" : "unavailable"} /></Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Discord private credential</Typography><JournalAdminStatus state={system.discord.clientSecretConfigured ? "active" : "unavailable"} /></Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Public login</Typography><JournalAdminStatus state={system.discord.publicLoginReady ? "ready" : "not_ready"} /></Stack>
          </Stack>
        </JournalAdminPanel>
        <JournalAdminPanel title="Storage capacity">
          <Stack spacing={1.25} sx={{
            "& > :not(:last-child)": { borderBottom: 1, borderColor: "divider", pb: 1.25 },
          }}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Total volume</Typography><Typography sx={{ fontWeight: 800 }}>{formatAdminBytes(system.storage.volumeTotalBytes)}</Typography></Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography>Free volume</Typography><Typography sx={{ fontWeight: 800 }}>{formatAdminBytes(system.storage.volumeFreeBytes)}</Typography></Stack>
            <Typography color="text.secondary" variant="body2">{system.storage.note ?? "Storage measurements are available."}</Typography>
          </Stack>
        </JournalAdminPanel>
      </Box>

      <JournalAdminPanel title="Dashboard member access">
        <DashboardMemberAccessControl
          initialAllowAllDiscordMembers={state.dashboardMemberAccess.allowAllDiscordMembers}
        />
      </JournalAdminPanel>

      <JournalAdminPanel title="Operational receipts">
        <JournalAdminTable>
          <Table size="small">
            <TableHead><TableRow><TableCell>Operation</TableCell><TableCell>State</TableCell><TableCell>Outcome</TableCell><TableCell>Details</TableCell><TableCell>Started</TableCell><TableCell>Completed</TableCell></TableRow></TableHead>
            <TableBody>
              {system.latestOperations.map((item) => (
                <TableRow key={item.operationRef}>
                  <TableCell sx={{ textTransform: "capitalize" }}>{item.kind.replaceAll("_", " ")}</TableCell>
                  <TableCell><JournalAdminStatus state={item.state} /></TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{item.outcomeCode.replaceAll("_", " ")}</TableCell>
                  <TableCell>{formatOperationalDetails(item.safeCounts)}</TableCell>
                  <TableCell>{formatAdminUtc(item.startedAtUtc)}</TableCell>
                  <TableCell>{formatAdminUtc(item.completedAtUtc)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </JournalAdminTable>
      </JournalAdminPanel>
    </JournalAdminPage>
  );
}
