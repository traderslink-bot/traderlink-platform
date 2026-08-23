"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

type ActiveSession = Readonly<{
  createdAtUtc: string;
  lastSeenAtUtc: string;
  sessionId: string;
}>;

function formatSessionTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AccountSessionControls({
  activeSessions,
  currentSessionId,
  hasDiscordSession,
}: {
  activeSessions: readonly ActiveSession[];
  currentSessionId: string | null;
  hasDiscordSession: boolean;
}) {
  const [confirmAllSessions, setConfirmAllSessions] = useState(false);

  if (!hasDiscordSession) {
    return (
      <Alert severity="info">
        This local review session stays on this computer. When you use Discord sign-in, this page will show controls for ending your TraderLink sessions.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography color="text.secondary" variant="body2">
        You currently have {activeSessions.length} active {activeSessions.length === 1 ? "sign-in" : "sign-ins"}. Each entry is a browser or device where you opened TraderLink.
      </Typography>

      <Stack spacing={1.25}>
        <Typography sx={{ fontWeight: 800 }} variant="subtitle2">Signed-in browsers and devices</Typography>
        {activeSessions.map((session) => {
          const current = session.sessionId === currentSessionId;
          return (
            <Box
              key={session.sessionId}
              sx={{ alignItems: { sm: "center" }, border: 1, borderColor: "divider", borderRadius: 1.5, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.25, justifyContent: "space-between", p: 1.5 }}
            >
              <Box>
                <Typography sx={{ fontWeight: 800 }}>
                  {current ? "This browser" : "Browser sign-in"}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Last active {formatSessionTime(session.lastSeenAtUtc)}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  Signed in {formatSessionTime(session.createdAtUtc)}
                </Typography>
              </Box>
              <Box component="form" action={`/api/auth/logout-session/${session.sessionId}`} method="post" sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
                <Button color="error" size="small" type="submit" variant="outlined">
                  {current ? "Sign out of this browser" : "Sign out"}
                </Button>
              </Box>
            </Box>
          );
        })}
      </Stack>

      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}>
        <Stack spacing={1.25}>
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Sign out of this device</Typography>
            <Typography color="text.secondary" variant="body2">
              End TraderLink on this browser only. Your other signed-in browsers and devices stay connected.
            </Typography>
          </Box>
          <Box component="form" action="/api/auth/logout" method="post" sx={{ alignSelf: "flex-start" }}>
            <Button size="small" type="submit" variant="outlined">Sign out of this device</Button>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ border: 1, borderColor: "error.light", borderRadius: 1.5, p: 2 }}>
        <Stack spacing={1.25}>
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Sign out everywhere</Typography>
            <Typography color="text.secondary" variant="body2">
              End every active TraderLink sign-in, including this one. You will need to sign in with Discord again on each device.
            </Typography>
          </Box>
          <Button color="error" onClick={() => setConfirmAllSessions(true)} size="small" sx={{ alignSelf: "flex-start" }} variant="outlined">
            Sign out everywhere
          </Button>
        </Stack>
      </Box>

      <Dialog fullWidth maxWidth="sm" onClose={() => setConfirmAllSessions(false)} open={confirmAllSessions}>
        <DialogTitle>Sign out everywhere?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Alert severity="warning">
              This ends every active TraderLink sign-in for your account, including this browser.
            </Alert>
            <Typography color="text.secondary" variant="body2">
              You will need to sign in with Discord again anywhere you want to use TraderLink.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAllSessions(false)}>Cancel</Button>
          <Box component="form" action="/api/auth/logout-all" method="post">
            <Button color="error" type="submit" variant="contained">Sign out everywhere</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
