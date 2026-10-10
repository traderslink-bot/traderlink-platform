import Alert from "@mui/material/Alert";
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
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { notificationRoles, isNotificationRoleKey } from "@/src/modules/platform/server/discord-notification-roles/catalog";
import { notificationMemberDirectory } from "@/src/modules/platform/server/discord-notification-roles/member-directory";
import { JournalAdminPage, JournalAdminPanel, JournalAdminTable } from "../journal-admin-ui";

export const metadata: Metadata = { title: "Discord notification members | Journal Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DiscordNotificationMembersPage({ searchParams }: {
  searchParams: Promise<{ role?: string | string[]; match?: string; page?: string }>;
}) {
  // Authorize before accessing Discord. Do not hold a SQLite handle across network requests.
  const scope = await withJournalAdminPageDatabase((_database, authorized) => authorized);
  const params = await searchParams;
  const selected = [...new Set((Array.isArray(params.role) ? params.role : params.role ? [params.role] : []).filter(isNotificationRoleKey))];
  const match = params.match === "all" ? "all" : "any";
  const directory = await notificationMemberDirectory(scope);
  const filtered = directory.status === "ready" ? directory.members.filter(member => selected.length === 0
    || (match === "all" ? selected.every(role => member.roles.includes(role)) : selected.some(role => member.roles.includes(role)))) : [];
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const requestedPage = Number(params.page);
  const page = Math.min(pages, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
  const rows = filtered.slice((page - 1) * 20, page * 20);
  function pageUrl(number: number) {
    const query = new URLSearchParams({ page: String(number), match });
    selected.forEach(role => query.append("role", role));
    return `/admin/journal/discord-notifications?${query}`;
  }
  return <JournalAdminPage>
    <Typography component="h1" variant="h1">Discord notification members</Typography>
    <JournalAdminPanel title="Members">
      <Box component="form" method="get" action="/admin/journal/discord-notifications">
        <Stack spacing={1.5} direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { sm: "center" }, mb: 2 }}>
          <Box component="fieldset" sx={{ border: 1, borderColor: "divider", borderRadius: 1, m: 0 }}>
            <legend>Roles</legend>
            <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap" }} spacing={1.5}>
              {notificationRoles.map(role => <label key={role.key}><input type="checkbox" name="role" value={role.key} defaultChecked={selected.includes(role.key)} /> {role.label}</label>)}
            </Stack>
          </Box>
          <label>Match <select name="match" defaultValue={match}><option value="any">Any selected role</option><option value="all">All selected roles</option></select></label>
          <Button type="submit" variant="contained">Apply filters</Button>
          <Button href={pageUrl(page)} variant="outlined">Refresh</Button>
          <Button href="/admin/journal/discord-notifications">Clear filters</Button>
        </Stack>
      </Box>
      {directory.status === "unavailable" ? <Alert severity="warning">{directory.message}</Alert> : <>
        <Typography sx={{ mb: 1.5 }}>Members: {filtered.length} · Updated {new Date(directory.checkedAt).toLocaleString("en-CA", { timeZone: "America/Toronto" })} Toronto time</Typography>
        <JournalAdminTable><Table aria-label="Discord notification members">
          <TableHead><TableRow><TableCell>Discord account</TableCell><TableCell>Selected roles</TableCell><TableCell>Premium Member</TableCell></TableRow></TableHead>
          <TableBody>{rows.map(member => <TableRow key={member.id}>
            <TableCell><Typography>{member.displayName}</Typography><Typography variant="body2" color="text.secondary">@{member.username}</Typography></TableCell>
            <TableCell><Stack direction="row" useFlexGap sx={{ flexWrap: "wrap" }} spacing={0.5}>{notificationRoles.filter(role => member.roles.includes(role.key)).map(role => <Chip key={role.key} label={role.label} size="small" />)}</Stack></TableCell>
            <TableCell>{member.premium ? "Yes" : "No"}</TableCell>
          </TableRow>)}{rows.length === 0 && <TableRow><TableCell colSpan={3}>{selected.length ? "No members match these role filters." : "No members currently hold a notification role."}</TableCell></TableRow>}</TableBody>
        </Table></JournalAdminTable>
        <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography>{filtered.length ? `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, filtered.length)} of ${filtered.length}` : "Showing 0 members"}</Typography>
          <Button href={pageUrl(page - 1)} disabled={page === 1} variant="outlined">Previous</Button>
          <Typography>Page {page} of {pages}</Typography>
          <Button href={pageUrl(page + 1)} disabled={page === pages} variant="outlined">Next</Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Premium Member reflects the current Discord role. Whop continues to control paid-channel access. Role assignment does not prove a member used the selector.</Typography>
      </>}
    </JournalAdminPanel>
  </JournalAdminPage>;
}
