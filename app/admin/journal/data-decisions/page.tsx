import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Metadata } from "next";

import { JournalAdminDecisionService } from "@/src/modules/journal/server/administration/journal-admin-decision-service";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminEmpty,
  JournalAdminMetricCard,
  JournalAdminMetricGrid,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminPanel,
  JournalAdminStatus,
  JournalAdminTable,
  formatAdminInteger,
  formatAdminUtc,
} from "../journal-admin-ui";

export const metadata: Metadata = { title: "Data Decisions | Journal Administration" };
export const dynamic = "force-dynamic";

export default async function JournalAdminDataDecisionsPage() {
  const data = await withJournalAdminPageDatabase((database, scope) =>
    new JournalAdminDecisionService({ database, scope }).read());
  const unresolved = data.aggregates.reduce((total, item) => total + item.unresolvedCount, 0);
  const resolved = data.aggregates.reduce((total, item) => total + item.resolvedCount, 0);
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description="See where statement or execution facts need attention. Administration can identify importer problems, but only the trader can decide what their records mean."
        eyebrow="Journal integrity"
        title="Data Decisions"
      />
      <Alert severity="info">
        This page is operational and read-only. It cannot correct, exclude, merge or classify a trader’s facts.
      </Alert>
      <JournalAdminMetricGrid>
        <JournalAdminMetricCard caption="Waiting for trader review" label="Unresolved" value={formatAdminInteger(unresolved)} />
        <JournalAdminMetricCard caption="Completed trader decisions" label="Resolved" value={formatAdminInteger(resolved)} />
        <JournalAdminMetricCard caption="Distinct issue and target combinations" label="Issue patterns" value={formatAdminInteger(data.aggregates.length)} />
        <JournalAdminMetricCard caption="Recorded operational receipts" label="Rebuild failures" value={data.rebuildFailureCount === null ? "N/A" : formatAdminInteger(data.rebuildFailureCount)} />
      </JournalAdminMetricGrid>

      <JournalAdminPanel title="Issue patterns">
        {data.aggregates.length === 0 ? (
          <JournalAdminEmpty>No Data Decision issue patterns are present.</JournalAdminEmpty>
        ) : (
          <JournalAdminTable>
            <Table size="small">
              <TableHead><TableRow><TableCell>Issue</TableCell><TableCell>Target</TableCell><TableCell>Unresolved</TableCell><TableCell>Resolved</TableCell><TableCell>Accounts</TableCell><TableCell>Oldest unresolved</TableCell></TableRow></TableHead>
              <TableBody>
                {data.aggregates.map((item) => (
                  <TableRow key={`${item.issueCode}-${item.targetKind}`}>
                    <TableCell sx={{ textTransform: "capitalize" }}>{item.issueCode.replaceAll("_", " ")}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{item.targetKind.replaceAll("_", " ")}</TableCell>
                    <TableCell>{formatAdminInteger(item.unresolvedCount)}</TableCell>
                    <TableCell>{formatAdminInteger(item.resolvedCount)}</TableCell>
                    <TableCell>{formatAdminInteger(item.affectedAccountCount)}</TableCell>
                    <TableCell>{formatAdminUtc(item.oldestUnresolvedAtUtc)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </JournalAdminTable>
        )}
      </JournalAdminPanel>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" } }}>
        <JournalAdminPanel title="Oldest unresolved items">
          {data.oldestUnresolved.length === 0 ? (
            <JournalAdminEmpty>No trader decisions are waiting.</JournalAdminEmpty>
          ) : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Issue</TableCell><TableCell>User and account</TableCell><TableCell>Age</TableCell><TableCell>State</TableCell></TableRow></TableHead>
              <TableBody>
                {data.oldestUnresolved.map((item) => (
                  <TableRow key={item.decisionRef}>
                    <TableCell sx={{ textTransform: "capitalize" }}>{item.issueCode.replaceAll("_", " ")}</TableCell>
                    <TableCell><strong>{item.userDisplayName}</strong><br />{item.accountDisplayName}</TableCell>
                    <TableCell>{formatAdminInteger(item.ageDays)} days</TableCell>
                    <TableCell><JournalAdminStatus state={item.state} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </JournalAdminPanel>
        <JournalAdminPanel title="Resolution actions">
          {data.resolutionActions.length === 0 ? (
            <JournalAdminEmpty>No completed trader actions are recorded.</JournalAdminEmpty>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {data.resolutionActions.map((item) => (
                <Chip key={item.action} label={`${item.action.replaceAll("_", " ")} · ${formatAdminInteger(item.count)}`} />
              ))}
            </Box>
          )}
        </JournalAdminPanel>
      </Box>
    </JournalAdminPage>
  );
}
