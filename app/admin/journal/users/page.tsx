import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Metadata } from "next";

import { JournalAdminUserService } from "@/src/modules/journal/server/administration/journal-admin-user-service";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminEmpty,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminTable,
  formatAdminInteger,
  formatAdminUtc,
} from "../journal-admin-ui";
import { UserDetailButton } from "./user-detail-button";

export const metadata: Metadata = { title: "Users | Journal Administration" };
export const dynamic = "force-dynamic";

export default async function JournalAdminUsersPage() {
  const users = await withJournalAdminPageDatabase((database, scope) =>
    new JournalAdminUserService({ database, scope }).list({ pageSize: 50 }));
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description="Review safe account activity and Journal adoption without opening trade values, notes, login identifiers or broker account details."
        eyebrow="Platform accounts"
        title="Users"
      />
      {users.items.length === 0 ? (
        <JournalAdminEmpty>No users are available in this environment.</JournalAdminEmpty>
      ) : (
        <JournalAdminTable>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Authentication</TableCell>
                <TableCell>Journal accounts</TableCell>
                <TableCell>Journal activity</TableCell>
                <TableCell>Data Decisions</TableCell>
                <TableCell>Last active</TableCell>
                <TableCell align="right">Private details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.items.map((user) => (
                <TableRow hover key={user.userRef}>
                  <TableCell>
                    <strong>{user.displayName}</strong><br />
                    <Chip label={user.status} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{user.authenticationProviders.join(", ") || "Not linked"}</TableCell>
                  <TableCell>
                    {formatAdminInteger(user.activeJournalAccountCount)} active
                    {user.archivedJournalAccountCount > 0
                      ? ` · ${formatAdminInteger(user.archivedJournalAccountCount)} archived`
                      : ""}
                  </TableCell>
                  <TableCell>
                    {formatAdminInteger(user.committedImportCount)} imports · {formatAdminInteger(user.manualExecutionCount)} manual executions
                  </TableCell>
                  <TableCell>{formatAdminInteger(user.unresolvedDecisionCount)}</TableCell>
                  <TableCell>{formatAdminUtc(user.lastJournalActivityAtUtc)}</TableCell>
                  <TableCell align="right"><UserDetailButton userRef={user.userRef} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </JournalAdminTable>
      )}
    </JournalAdminPage>
  );
}
