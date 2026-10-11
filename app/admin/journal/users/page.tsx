import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { JournalAdminUserService, type JournalAdminUserFilters } from "@/src/modules/journal/server/administration/journal-admin-user-service";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { JournalAdminEmpty, JournalAdminMetricCard, JournalAdminMetricGrid, JournalAdminPage,
  JournalAdminPageHeader, JournalAdminTable, formatAdminInteger, formatAdminUtc } from "../journal-admin-ui";
import { UserDetailButton } from "./user-detail-button";

export const metadata: Metadata = { title: "Members | Journal Administration" };
export const dynamic = "force-dynamic";

const filterOptions = [
  ["academy_progress", "Academy progress"], ["source_not_recorded", "No completed Academy lessons"],
  ["never_signed_in", "Never signed in"], ["online_now", "Online now"],
  ["journal_started", "Journal started"], ["journal_not_started", "Journal not started"],
  ["successful_import", "Successful import"], ["failed_import", "Failed import"],
  ["pending_import", "Pending import"], ["manual_entries", "Manual entries"],
  ["manual_entry_issues", "Manual entry issues"], ["broker_connected", "Broker connected"],
  ["broker_statement_source", "Statement source"], ["no_broker_evidence", "No broker evidence"],
] as const;
const viewOptions = [
  ["new_academy_members", "Academy progress, never signed in"],
  ["getting_started", "Getting started"], ["needs_attention", "Needs attention"],
] as const;
const attentionLabels = {
  broker_connection: "Broker connection needs attention", recent_import_failure: "Recent import failure",
  manual_entry_issue: "Manual entry issue", pending_decision: "Pending Data Decision", getting_started: "Journal not started",
} as const;
const sourceLabels: Record<string, string> = {
  subscription: "Subscription", free_plan: "Free plan", trial: "Trial", discord: "Discord grant",
  owner_grant: "Owner grant", lifetime_purchase: "Lifetime purchase", migration: "Transferred access",
};
type DirectoryMember = ReturnType<JournalAdminUserService["directory"]>["items"][number];
type Params = { [key: string]: string | string[] | undefined };
const single = (value: string | string[] | undefined) => typeof value === "string" ? value : undefined;

function memberFacts(user: DirectoryMember, membershipAvailable: boolean) {
  return [
    ["Membership", !membershipAvailable ? "Membership records unavailable" : user.memberships.length === 0 ? "No current plan grant" : user.memberships.map((grant) =>
      `${grant.planName} · ${sourceLabels[grant.source] ?? "Plan access"}${grant.endsAtUtc ? ` · ends ${formatAdminUtc(grant.endsAtUtc)}` : " · no scheduled end"}`).join("; ")],
    ["Sign-in", user.onlineNow ? "Online now" : user.lastSuccessfulAuthenticationAtUtc ? `Last seen ${formatAdminUtc(user.lastSuccessfulAuthenticationAtUtc)}` : "Never signed in"],
    ["Academy", `${formatAdminInteger(user.academyCompletionCount)} completed lessons`],
    ["Journal", `${user.journalStarted ? "Started" : "Not started"} · ${formatAdminInteger(user.activeJournalAccountCount)} active accounts · ${formatAdminInteger(user.archivedJournalAccountCount)} archived`],
    ["Journal activity", user.lastJournalActivityAtUtc ? formatAdminUtc(user.lastJournalActivityAtUtc) : "No recorded activity"],
    ["Imports", `${formatAdminInteger(user.committedImportCount)} successful · ${formatAdminInteger(user.failedImportCount)} failed · ${formatAdminInteger(user.pendingImportCount)} pending · ${formatAdminInteger(user.duplicateImportCount)} duplicate`],
    ["Manual entries", `${formatAdminInteger(user.manualExecutionCount)} accepted · ${formatAdminInteger(user.manualEntryFailureCount)} issues`],
    ["Broker", { connected: "Connected", attention_required: "Connection needs attention", disconnected: "Disconnected", statement_source: "Statement source", none: "No broker evidence" }[user.brokerStatus]],
    ["Data Decisions", `${formatAdminInteger(user.unresolvedDecisionCount)} pending`],
    ["Needs attention", user.needsAttention.length ? user.needsAttention.map((item) => attentionLabels[item]).join(" · ") : "None"],
  ] as const;
}

export default async function JournalAdminUsersPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const search = single(params.q)?.trim().slice(0, 100) ?? "";
  const rawFilter = single(params.filter);
  const rawView = single(params.view);
  const rawStatus = single(params.status);
  const filter = filterOptions.some(([value]) => value === rawFilter) ? rawFilter as JournalAdminUserFilters["filter"] : undefined;
  const view = viewOptions.some(([value]) => value === rawView) ? rawView as JournalAdminUserFilters["view"] : undefined;
  const status = rawStatus === "active" || rawStatus === "disabled" ? rawStatus : undefined;
  const users = await withJournalAdminPageDatabase((database, scope) =>
    new JournalAdminUserService({ database, scope }).directory({ page: Number(single(params.page) ?? 1), filters: { search, filter, view, status } }));
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (filter) query.set("filter", filter);
    if (view) query.set("view", view);
    if (status) query.set("status", status);
    query.set("page", String(page));
    return `/admin/journal/users?${query.toString()}`;
  };
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader title="Members" />
      <JournalAdminMetricGrid>
        <JournalAdminMetricCard label="Platform members" value={formatAdminInteger(users.summary.total)} caption="Every registered Platform account" />
        <JournalAdminMetricCard label="Enabled members" value={formatAdminInteger(users.summary.enabled)} caption="Account access enabled" />
        <JournalAdminMetricCard label="Disabled members" value={formatAdminInteger(users.summary.disabled)} caption="Account access disabled" />
        <JournalAdminMetricCard label="Discord-linked members" value={formatAdminInteger(users.summary.discordLinked)} caption="Platform accounts linked to Discord" />
      </JournalAdminMetricGrid>
      <Box component="form" action="/admin/journal/users" method="get" sx={{
        display: "flex", flexWrap: "wrap", alignItems: "end", gap: 1.5,
        "& label": { display: "flex", flexDirection: "column", gap: 0.5, fontSize: "0.875rem" },
        "& input, & select": { font: "inherit", color: "text.primary", backgroundColor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, minHeight: 40, px: 1, maxWidth: "100%" },
      }}>
        <label>Member name<input name="q" defaultValue={search} maxLength={100} placeholder="Search members" type="search" /></label>
        <label>Account status<select name="status" defaultValue={status ?? ""}><option value="">All statuses</option><option value="active">Enabled</option><option value="disabled">Disabled</option></select></label>
        <label>Activity<select name="filter" defaultValue={filter ?? ""}><option value="">All activity</option>{filterOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>View<select name="view" defaultValue={view ?? ""}><option value="">All members</option>{viewOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <Button type="submit" variant="contained">Apply</Button>
        <Button href="/admin/journal/users" variant="outlined">Clear</Button>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Showing {users.items.length ? formatAdminInteger(users.offset + 1) : "0"}–{formatAdminInteger(users.offset + users.items.length)} of {formatAdminInteger(users.totalCount)}{search || filter || view || status ? " matching members" : " members"}. Summary totals include all Platform accounts. Discord server members who have never registered are outside this directory.
      </Typography>
      {users.items.length === 0 ? <JournalAdminEmpty>{users.summary.total === 0 ? "No Platform members are registered in this environment." : "No members match these filters. Clear the filters to show all members."}</JournalAdminEmpty> : <>
        <Stack spacing={1.5} sx={{ display: { md: "none" } }}>
          {users.items.map((user) => <Box key={user.userRef} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{user.displayName}</Typography>
              <Chip label={user.status === "active" ? "Enabled" : "Disabled"} size="small" variant="outlined" color={user.status === "active" ? "success" : "error"} />
            </Stack>
            <Typography variant="body2" sx={{ mt: 1 }}>{user.needsAttention.length ? user.needsAttention.map((item) => attentionLabels[item]).join(" · ") : "No attention needed"}</Typography>
            <Box component="details" sx={{ my: 1.5, "& summary": { cursor: "pointer" } }}>
              <summary>View activity and membership</summary>
              <Box component="dl" sx={{ m: 0, mt: 1, "& dt": { fontWeight: 700, mt: 1 }, "& dd": { m: 0, overflowWrap: "anywhere" } }}>
                {memberFacts(user, users.membershipAvailable).map(([label, value]) => <Box key={label}><dt>{label}</dt><dd>{value}</dd></Box>)}
              </Box>
            </Box>
            <UserDetailButton userRef={user.userRef} />
          </Box>)}
        </Stack>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <JournalAdminTable><Table size="small">
            <TableHead><TableRow>{["Member", "Membership", "Sign-in", "Academy and Journal", "Imports and entries", "Needs attention", "Private details"].map((label) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
            <TableBody>{users.items.map((user) => {
              const facts = Object.fromEntries(memberFacts(user, users.membershipAvailable));
              return <TableRow key={user.userRef} hover>
                <TableCell><strong>{user.displayName}</strong><br /><Chip label={user.status === "active" ? "Enabled" : "Disabled"} size="small" variant="outlined" color={user.status === "active" ? "success" : "error"} /></TableCell>
                <TableCell sx={{ minWidth: 180 }}>{facts.Membership}</TableCell>
                <TableCell>{facts["Sign-in"]}</TableCell>
                <TableCell>{facts.Academy}<br />Journal: {facts.Journal}<br />Activity: {facts["Journal activity"]}</TableCell>
                <TableCell>Imports: {facts.Imports}<br />Manual: {facts["Manual entries"]}<br />Broker: {facts.Broker}</TableCell>
                <TableCell>{facts["Needs attention"]}<br />Data Decisions: {facts["Data Decisions"]}</TableCell>
                <TableCell><UserDetailButton userRef={user.userRef} /></TableCell>
              </TableRow>;
            })}</TableBody>
          </Table></JournalAdminTable>
        </Box>
      </>}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Button href={users.page > 1 ? pageHref(users.page - 1) : undefined} disabled={users.page <= 1} variant="outlined">Previous</Button>
        <Typography variant="body2">Page {formatAdminInteger(users.page)} of {formatAdminInteger(users.pageCount)}</Typography>
        <Button href={users.page < users.pageCount ? pageHref(users.page + 1) : undefined} disabled={users.page >= users.pageCount} variant="outlined">Next</Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">Updated {formatAdminUtc(users.coverage.dataAsOfUtc)}. Current plan grants describe membership records; individual features may also depend on account status and feature availability.</Typography>
    </JournalAdminPage>
  );
}
