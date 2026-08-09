import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Metadata } from "next";

import { createJournalAdminReadContext } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { PlatformAdminErrorService } from "@/src/modules/platform/server/administration/platform-admin-error-service";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminEmpty,
  JournalAdminMetricCard,
  JournalAdminMetricGrid,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminPanel,
  JournalAdminTable,
  formatAdminInteger,
  formatAdminUtc,
} from "../journal-admin-ui";

export const metadata: Metadata = { title: "Errors | Journal Administration" };
export const dynamic = "force-dynamic";

function details(counts: Readonly<Record<string, number>>): string {
  const values: string[] = [];
  if (counts.http_status !== undefined) values.push(`HTTP ${counts.http_status}`);
  if (counts.provider_code !== undefined) {
    const providerCode = counts.provider_code_negative === 1
      ? -counts.provider_code
      : counts.provider_code;
    values.push(`Provider ${providerCode}`);
  }
  return values.length > 0 ? values.join(" / ") : "No numeric detail";
}
export default async function JournalAdminErrorsPage() {
  const status = await withJournalAdminPageDatabase((database, scope) =>
    new PlatformAdminErrorService(createJournalAdminReadContext({ database, scope })).read());
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description="Review privacy-safe application failures without exposing account numbers, tokens, broker payloads or trading data. Moomoo connection and import errors are included now; other TraderLink sources can be added here later."
        eyebrow="Platform operations"
        title="Errors"
      />
      {status.last24Hours > 0 ? (
        <Alert severity="error">
          {formatAdminInteger(status.last24Hours)} Moomoo {status.last24Hours === 1 ? "error was" : "errors were"} recorded in the last 24 hours.
        </Alert>
      ) : (
        <Alert severity="success">No Moomoo errors were recorded in the last 24 hours.</Alert>
      )}
      <JournalAdminMetricGrid>
        <JournalAdminMetricCard caption="Moomoo failures" label="Last 24 hours" value={formatAdminInteger(status.last24Hours)} />
        <JournalAdminMetricCard caption="Moomoo failures" label="Last 7 days" value={formatAdminInteger(status.last7Days)} />
        <JournalAdminMetricCard caption="Reporting to this page" label="Error sources" value={formatAdminInteger(status.sourceCount)} />
        <JournalAdminMetricCard caption="Most recent recorded failure" label="Latest error" value={status.latestAtUtc ? formatAdminUtc(status.latestAtUtc) : "None"} />
      </JournalAdminMetricGrid>
      <JournalAdminPanel title="Recent errors">
        {status.errors.length === 0 ? (
          <JournalAdminEmpty>No Moomoo connection or import errors have been recorded.</JournalAdminEmpty>
        ) : (
          <JournalAdminTable>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Failure</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {status.errors.map((item) => (
                  <TableRow key={item.errorRef}>
                    <TableCell>{formatAdminUtc(item.occurredAtUtc)}</TableCell>
                    <TableCell>{item.source}</TableCell>
                    <TableCell>{item.operation}</TableCell>
                    <TableCell>{item.failure}</TableCell>
                    <TableCell>{details(item.safeCounts)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </JournalAdminTable>
        )}
      </JournalAdminPanel>
    </JournalAdminPage>
  );
}
