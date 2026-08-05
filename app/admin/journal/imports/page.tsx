import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Metadata } from "next";

import { JournalAdminImportService } from "@/src/modules/journal/server/administration/journal-admin-import-service";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminEmpty,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminStatus,
  JournalAdminTable,
  formatAdminDuration,
  formatAdminInteger,
  formatAdminUtc,
} from "../journal-admin-ui";
import { ImportDetailButton } from "./import-detail-button";

export const metadata: Metadata = { title: "Imports | Journal Administration" };
export const dynamic = "force-dynamic";

export default async function JournalAdminImportsPage() {
  const imports = await withJournalAdminPageDatabase((database, scope) =>
    new JournalAdminImportService({ database, scope }).list({ pageSize: 50 }));
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description="Track every admitted statement upload and preserved historical import without exposing statement values, filenames or broker account identifiers."
        eyebrow="Journal operations"
        title="Imports"
      />
      {imports.items.length === 0 ? (
        <JournalAdminEmpty>No broker statement imports are available in this environment.</JournalAdminEmpty>
      ) : (
        <JournalAdminTable>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Submitted</TableCell>
                <TableCell>User and account</TableCell>
                <TableCell>Broker</TableCell>
                <TableCell>Outcome</TableCell>
                <TableCell>Rows</TableCell>
                <TableCell>Processing</TableCell>
                <TableCell>Support evidence</TableCell>
                <TableCell align="right">Private details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {imports.items.map((item) => (
                <TableRow hover key={item.importRef}>
                  <TableCell>{formatAdminUtc(item.submittedAtUtc)}</TableCell>
                  <TableCell><strong>{item.userDisplayName}</strong><br />{item.accountDisplayName}</TableCell>
                  <TableCell>{item.safeBrokerLabel ?? "Not supplied"}</TableCell>
                  <TableCell><JournalAdminStatus state={item.currentState} /></TableCell>
                  <TableCell>
                    {formatAdminInteger(item.preservedRowCount)} preserved<br />
                    {formatAdminInteger(item.mappedExecutionCount)} executions
                  </TableCell>
                  <TableCell>{formatAdminDuration(item.processingDurationMs)}</TableCell>
                  <TableCell>
                    {item.consentedSourceAvailable
                      ? "Private source available"
                      : item.developerPackageAvailable
                        ? "Safe package available"
                        : "Not available"}
                  </TableCell>
                  <TableCell align="right"><ImportDetailButton importRef={item.importRef} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </JournalAdminTable>
      )}
    </JournalAdminPage>
  );
}
