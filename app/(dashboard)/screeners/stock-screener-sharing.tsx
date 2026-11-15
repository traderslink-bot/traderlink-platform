"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SESSIONS, type SavedScreen, type SavedScreens } from "@/src/modules/stock-screeners/contracts";
import { sharedScreenLinkPath, sharedScreenPath, type CommunityPage, type ShareCommand, type SharedScreen } from "@/src/modules/stock-screeners/sharing-contracts";
import { requestStockScreeners } from "./stock-screener-api";

export function ScreenShareDialog({ screen, revision, onSavedRefresh, onClose }: {
  screen: SavedScreen; revision: number; onSavedRefresh: (saved: SavedScreens) => void; onClose: () => void;
}) {
  const [shared, setShared] = useState<SharedScreen | null>();
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  const [origin, setOrigin] = useState("");
  const [madePrivateElsewhere, setMadePrivateElsewhere] = useState(false);
  const personal = screen.definition.universe === "list" || madePrivateElsewhere;
  const changed = shared && !matchesSavedScreen(shared);
  const link = shared ? origin + sharedScreenLinkPath(shared.id) : "";

  useEffect(() => {
    let active = true;
    const origin = window.location.origin;
    requestStockScreeners<SharedScreen | null>("?sharing=" + encodeURIComponent(screen.id)).then(value => {
      if (active) { setOrigin(origin); setShared(value); }
    }).catch(() => {
      if (active) setProblem("Sharing is unavailable. Close this dialog and try again.");
    });
    return () => { active = false; };
  }, [screen.id]);

  function matchesSavedScreen(preset: SharedScreen) {
    return preset.name === screen.name
      && JSON.stringify(preset.definition) === JSON.stringify({ ...screen.definition, tickers: [] });
  }

  function confirmsChange(command: ShareCommand, preset: SharedScreen | null) {
    if (command.operation === "revoke") return preset === null;
    if (!preset || preset.listed !== command.listed) return false;
    return command.operation === "publish"
      ? preset.id !== command.expectedId && matchesSavedScreen(preset)
      : preset.id === command.expectedId;
  }

  async function change(command: ShareCommand, message: string) {
    setWorking(true);
    setProblem("");
    setNotice("");
    try {
      setShared(await requestStockScreeners<SharedScreen | null>("", { action: "share", ...command }));
      setNotice(message);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "private_tickers") {
        setShared(null);
        setMadePrivateElsewhere(true);
        return;
      }
      if (code === "share_conflict" || code === "request_interrupted") {
        const current = await requestStockScreeners<SharedScreen | null>("?sharing=" + encodeURIComponent(screen.id)).catch(() => undefined);
        if (current !== undefined) {
          setShared(current);
          if (confirmsChange(command, current)) {
            setNotice(message);
            return;
          }
          if ((current?.id ?? null) !== command.expectedId) {
            setProblem("Sharing settings changed. Review them and try again.");
            return;
          }
          if (code === "share_conflict" && command.operation === "publish") {
            const latest = await requestStockScreeners<SavedScreens>("").catch(() => null);
            const latestScreen = latest?.screens.find(item => item.id === screen.id);
            if (latest && latest.revision > command.revision && JSON.stringify(latestScreen) === JSON.stringify(screen)) {
              onSavedRefresh(latest);
              setProblem("Your other saved screens changed. Try publishing again.");
              return;
            }
          }
        }
      }
      setProblem(code === "share_conflict" ? "This screen changed in another tab. Reload Screeners and try again."
        : code === "request_interrupted" ? "Could not confirm the sharing change. Try again."
          : "The sharing change could not be saved. Try again.");
    } finally {
      setWorking(false);
    }
  }

  function publish() {
    void change({ screenId: screen.id, expectedId: shared?.id ?? null, operation: "publish", listed: shared?.listed ?? false, revision },
      shared ? "Shared version replaced. Copy the new link." : "Member link created.");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Link copied.");
    } catch {
      setNotice("Select and copy the link from the field.");
    }
  }

  return <Dialog open fullWidth maxWidth="xs" onClose={() => { if (!working) onClose(); }} aria-labelledby="share-screen-title">
    <DialogTitle id="share-screen-title" sx={{ overflowWrap: "anywhere" }}>Share {screen.name}</DialogTitle>
    <DialogContent dividers sx={{ display: "grid", gap: 1.25 }}>
      {problem && <Alert severity="error">{problem}</Alert>}
      {shared === undefined && !problem && <LinearProgress aria-label="Loading sharing settings" />}
      {shared === null && <Typography variant="body2" color="text.secondary">
        {personal ? "Screens using My tickers stay private. Save a version using All covered U.S. stocks to share it."
          : "Members with Screeners access can see your display name and the saved rules, run the screen, and make their own copy."}
      </Typography>}
      {shared && !personal && <>
        <TextField label="Member link" size="small" value={link} fullWidth slotProps={{ input: { readOnly: true } }}
          onFocus={event => event.target.select()} />
        <Typography variant="body2" color="text.secondary">
          {shared.listed ? "Listed in Community presets as " + shared.author + "." : "Available to members who have the link."}
        </Typography>
        {changed && <Typography variant="body2" color="text.secondary">
          The saved setup has changed. Replacing the shared version creates a new link.
        </Typography>}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          <Button size="small" variant="outlined" onClick={() => void copyLink()} disabled={working}>Copy link</Button>
          <Button size="small" variant="outlined" onClick={() => void change({ screenId: screen.id, expectedId: shared.id,
            operation: "visibility", listed: !shared.listed }, shared.listed ? "Gallery listing removed." : "Added to Community presets.")}
            disabled={working}>{shared.listed ? "Remove gallery listing" : "List in Community presets"}</Button>
          {changed && <Button size="small" variant="outlined" onClick={publish} disabled={working}>Replace shared version</Button>}
        </Box>
        <Box>
          <Button size="small" variant="outlined" color="error" disabled={working}
            onClick={() => void change({ screenId: screen.id, expectedId: shared.id, operation: "revoke" }, "Sharing turned off.")}>Turn off sharing</Button>
        </Box>
      </>}
      {notice && <Typography variant="body2" color="success.main" role="status">{notice}</Typography>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={working}>Close</Button>
      {shared === null && !personal && <Button variant="contained" onClick={publish} disabled={working}>Create member link</Button>}
    </DialogActions>
  </Dialog>;
}

export function CommunityPresetsDialog({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState<CommunityPage>();
  const [problem, setProblem] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    requestStockScreeners<CommunityPage>("?community=1").then(value => {
      if (active) setPage(value);
    }).catch(() => {
      if (active) setProblem("Community presets are unavailable. Try again.");
    });
    return () => { active = false; };
  }, []);

  async function loadMore(after: string | null) {
    setWorking(true);
    setProblem("");
    try {
      const next = await requestStockScreeners<CommunityPage>("?community=1" + (after ? "&after=" + encodeURIComponent(after) : ""));
      setPage(previous => ({ screens: [...(after ? previous?.screens ?? [] : []), ...next.screens], next: next.next }));
    } catch {
      setProblem("Community presets are unavailable. Try again.");
    } finally {
      setWorking(false);
    }
  }

  return <Dialog open fullWidth maxWidth="sm" onClose={onClose} aria-labelledby="community-presets-title">
    <DialogTitle id="community-presets-title">Community presets</DialogTitle>
    <DialogContent dividers>
      {problem && <Alert severity="error">{problem}</Alert>}
      {!page && !problem && <LinearProgress aria-label="Loading community presets" />}
      {page && page.screens.length === 0 && !page.next && <Typography variant="body2" color="text.secondary">No community presets yet.</Typography>}
      {page?.screens.map(preset => <Box key={preset.id} sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "space-between",
        py: 1, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
          <Typography variant="body2" sx={{ fontWeight: 650 }}>{preset.name}</Typography>
          <Typography variant="caption" color="text.secondary">{preset.author} · {SESSIONS[preset.definition.session]}</Typography>
        </Box>
        <Button component={Link} href={sharedScreenPath(preset.id)} prefetch={false} onNavigate={onClose} size="small" variant="outlined"
          aria-label={"Open " + preset.name} sx={{ flexShrink: 0 }}>Open preset</Button>
      </Box>)}
      {(page?.next || problem) && <Button size="small" variant="outlined" sx={{ mt: 1 }} disabled={working}
        onClick={() => void loadMore(page?.next ?? null)}>{problem ? "Retry" : "Load more"}</Button>}
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
  </Dialog>;
}
