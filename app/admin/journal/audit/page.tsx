import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Metadata } from "next";

import { createJournalAdminReadContext } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { PlatformAdminAuditService } from "@/src/modules/platform/server/administration/platform-admin-audit-service";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminEmpty,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminStatus,
  JournalAdminTable,
  formatAdminUtc,
} from "../journal-admin-ui";

export const metadata: Metadata = { title: "Audit | Journal Administration" };
export const dynamic = "force-dynamic";

export default async function JournalAdminAuditPage() {
  const audit = await withJournalAdminPageDatabase((database, scope) =>
    new PlatformAdminAuditService(createJournalAdminReadContext({ database, scope }))
      .list({ pageSize: 50 }));
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description="An immutable history of private access, owner authority, support exports and administrative actions. Tokens, raw identifiers and downloaded content never appear here."
        eyebrow="Platform accountability"
        title="Audit"
      />
      {audit.items.length === 0 ? (
        <JournalAdminEmpty>No administrative audit events are recorded.</JournalAdminEmpty>
      ) : (
        <JournalAdminTable>
          <Table size="small">
            <TableHead><TableRow><TableCell>Time</TableCell><TableCell>Operator</TableCell><TableCell>Action</TableCell><TableCell>Target</TableCell><TableCell>Reason</TableCell><TableCell>Outcome</TableCell></TableRow></TableHead>
            <TableBody>
              {audit.items.map((item) => (
                <TableRow hover key={item.auditRef}>
                  <TableCell>{formatAdminUtc(item.createdAtUtc)}</TableCell>
                  <TableCell>{item.actorDisplayName ?? item.actorKind.replaceAll("_", " ")}<br />{item.actorRole.replaceAll("_", " ")}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{item.action.replaceAll("_", " ")}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{item.targetKind.replaceAll("_", " ")}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{item.reasonCode.replaceAll("_", " ")}</TableCell>
                  <TableCell><JournalAdminStatus state={item.outcome} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </JournalAdminTable>
      )}
    </JournalAdminPage>
  );
}
