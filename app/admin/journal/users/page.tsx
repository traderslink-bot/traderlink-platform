import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
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

const filterOptions = [
  ["academy_progress", "Academy progress"], ["source_not_recorded", "Source not recorded"],
  ["never_signed_in", "Never signed in"], ["online_now", "Online now"],
  ["journal_started", "Journal started"], ["journal_not_started", "Journal not started"],
  ["successful_import", "Successful import"], ["failed_import", "Failed import"],
  ["pending_import", "Pending import"], ["manual_entries", "Manual entries"],
  ["manual_entry_issues", "Manual entry issues"],
  ["broker_connected", "Broker connected"], ["broker_statement_source", "Statement source"],
  ["no_broker_evidence", "No broker evidence"],
] as const;

type UserFilter = typeof filterOptions[number][0];

export default async function JournalAdminUsersPage({ searchParams }: { searchParams: Promise<{ filter?: string; status?: string; view?: string }> }) {
  const params = await searchParams;
  const view = params.view;
  const filter = filterOptions.some(([value]) => value === params.filter) ? params.filter as UserFilter : undefined;
  const status = params.status === "active" || params.status === "disabled" ? params.status : undefined;
  const selectedView = view === "new_academy_members" || view === "getting_started" || view === "needs_attention" ? view : undefined;
  const users = await withJournalAdminPageDatabase((database, scope) =>
    new JournalAdminUserService({ database, scope }).list({ pageSize: 50, filters: { filter, status, view: selectedView } }));
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description="Review safe account activity and Journal adoption without opening trade values, notes, login identifiers or broker account details."
        eyebrow="Platform accounts"
        title="Users"
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button href="/admin/journal/users?view=new_academy_members" size="small" variant={selectedView === "new_academy_members" ? "contained" : "outlined"}>New Academy members</Button>
        <Button href="/admin/journal/users?view=getting_started" size="small" variant={selectedView === "getting_started" ? "contained" : "outlined"}>Getting started</Button>
        <Button href="/admin/journal/users?view=needs_attention" size="small" variant={selectedView === "needs_attention" ? "contained" : "outlined"}>Needs attention</Button>
        {selectedView || filter || status ? <Button href="/admin/journal/users" size="small" variant="text">Show all</Button> : null}
      </Stack>
      <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
        <Button href="/admin/journal/users?status=active" size="small" variant={status === "active" ? "contained" : "outlined"}>Enabled</Button>
        <Button href="/admin/journal/users?status=disabled" size="small" variant={status === "disabled" ? "contained" : "outlined"}>Disabled</Button>
        {filterOptions.map(([value, label]) => (
          <Button href={`/admin/journal/users?filter=${value}`} key={value} size="small" variant={filter === value ? "contained" : "outlined"}>{label}</Button>
        ))}
      </Stack>
      {users.items.length === 0 ? (
        <JournalAdminEmpty>No users are available in this environment.</JournalAdminEmpty>
      ) : (
        <>
        <Stack spacing={1.25} sx={{ display: { md: "none" } }}>
          {users.items.map((user) => (
            <Box key={user.userRef} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                <Box><strong>{user.displayName}</strong><br /><Chip label={user.status === "active" ? "Enabled" : "Disabled"} color={user.status === "active" ? "success" : "error"} size="small" variant="outlined" /></Box>
                <Box sx={{ textAlign: "right" }}>{user.needsAttention.length === 0 ? "No attention needed" : user.needsAttention[0]!.replaceAll("_", " ")}<br /><UserDetailButton userRef={user.userRef} /></Box>
              </Stack>
              <Box sx={{ color: "text.secondary", fontSize: "0.8125rem", mt: 1.25 }}>
                {user.journalStarted ? "Journal started" : "Journal not started"} · {user.onlineNow ? "Online now" : user.lastSuccessfulAuthenticationAtUtc ? `Last sign-in ${formatAdminUtc(user.lastSuccessfulAuthenticationAtUtc)}` : "Never signed in"}<br />
                {formatAdminInteger(user.committedImportCount)} successful imports · {formatAdminInteger(user.manualExecutionCount)} manual entries{user.manualEntryFailureCount > 0 ? ` · ${formatAdminInteger(user.manualEntryFailureCount)} entry issues` : ""} · {user.brokerStatus === "connected" ? "Broker connected" : user.brokerStatus === "statement_source" ? "Statement source" : user.brokerStatus === "attention_required" ? "Broker needs attention" : "No broker evidence"}
              </Box>
            </Box>
          ))}
        </Stack>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
        <JournalAdminTable>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Member journey</TableCell>
                <TableCell>Last sign-in</TableCell>
                <TableCell>Journal activity</TableCell>
                <TableCell>Imports</TableCell>
                <TableCell>Manual entries</TableCell>
                <TableCell>Broker</TableCell>
                <TableCell>Data Decisions</TableCell>
                <TableCell>Needs attention</TableCell>
                <TableCell align="right">Private details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.items.map((user) => (
                <TableRow hover key={user.userRef}>
                  <TableCell>
                    <strong>{user.displayName}</strong><br />
                    <Chip label={user.status === "active" ? "Enabled" : "Disabled"} color={user.status === "active" ? "success" : "error"} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{user.academyCompletionCount > 0 ? `${formatAdminInteger(user.academyCompletionCount)} Academy lessons` : "Source not recorded"}<br />{user.journalStarted ? "Journal started" : "Not started"}</TableCell>
                  <TableCell>
                    {user.onlineNow ? "Online now" : user.lastSuccessfulAuthenticationAtUtc ? formatAdminUtc(user.lastSuccessfulAuthenticationAtUtc) : "Never signed in"}
                  </TableCell>
                  <TableCell>
                    {user.lastJournalActivityAtUtc ? formatAdminUtc(user.lastJournalActivityAtUtc) : "No Journal activity"}
                  </TableCell>
                  <TableCell>{formatAdminInteger(user.committedImportCount)} successful{user.failedImportCount > 0 ? ` · ${formatAdminInteger(user.failedImportCount)} failed` : ""}{user.pendingImportCount > 0 ? ` · ${formatAdminInteger(user.pendingImportCount)} pending` : ""}</TableCell>
                  <TableCell>{formatAdminInteger(user.manualExecutionCount)} accepted{user.manualEntryFailureCount > 0 ? ` · ${formatAdminInteger(user.manualEntryFailureCount)} issues` : ""}</TableCell>
                  <TableCell>{user.brokerStatus === "connected" ? "Connected" : user.brokerStatus === "attention_required" ? "Connection needs attention" : user.brokerStatus === "disconnected" ? "Disconnected" : user.brokerStatus === "statement_source" ? "Statement source" : "No broker evidence"}</TableCell>
                  <TableCell>{formatAdminInteger(user.unresolvedDecisionCount)}</TableCell>
                  <TableCell>{user.needsAttention.length === 0 ? "None" : user.needsAttention[0]!.replaceAll("_", " ") + (user.needsAttention.length > 1 ? ` +${user.needsAttention.length - 1}` : "")}</TableCell>
                  <TableCell align="right"><UserDetailButton userRef={user.userRef} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </JournalAdminTable>
        </Box>
        </>
      )}
    </JournalAdminPage>
  );
}
