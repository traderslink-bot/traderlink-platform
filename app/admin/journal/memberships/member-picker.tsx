"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { JournalAdminUserListItem } from "@/src/modules/journal/contracts/journal-administration-contracts";

type Member = Pick<JournalAdminUserListItem, "userRef" | "displayName" | "createdAtUtc" | "status">;

export function MembershipMemberPicker() {
  const [members, setMembers] = useState<Member[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");

  async function loadMembers() {
    if (loading) return;
    setLoading(true);
    setError(false);
    try {
      const query = new URLSearchParams({ pageSize: "50" });
      if (cursor) query.set("cursor", cursor);
      const response = await fetch(`/api/admin/journal/users?${query}`, { cache: "no-store", credentials: "same-origin" });
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.users?.items)) throw new Error("unavailable");
      const page = body.users as { items: Member[]; nextCursor: string | null };
      setMembers(current => [...current, ...page.items]);
      setCursor(page.nextCursor);
      setLoaded(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const matches = members.filter(member => member.userRef === selected || member.displayName.toLowerCase().includes(search.toLowerCase()));
  return <Stack spacing={1}>
    {members.length ? <TextField label="Filter loaded members" value={search} onChange={event => setSearch(event.target.value)} /> : null}
    <TextField select required name="userRef" label="Member" value={selected} onChange={event => setSelected(event.target.value)}
      helperText={loaded ? `${members.length} ${members.length === 1 ? "member" : "members"} loaded.${cursor ? " Load more to reach additional members." : ""}` : "Load the member list, then choose a member."}>
      {matches.map(member => <MenuItem key={member.userRef} value={member.userRef}>
        {member.displayName} · joined {member.createdAtUtc.slice(0, 10)} · {member.status === "active" ? "Enabled" : "Disabled"}
      </MenuItem>)}
    </TextField>
    {!loaded || cursor ? <Button type="button" variant="outlined" disabled={loading} onClick={() => void loadMembers()}>
      {loading ? "Loading members..." : loaded ? "Load more members" : "Load members"}
    </Button> : null}
    {error ? <Alert severity="error">Members could not be loaded. Try again.</Alert> : null}
    {loaded && !members.length ? <Alert severity="info">No members are available.</Alert> : null}
  </Stack>;
}
