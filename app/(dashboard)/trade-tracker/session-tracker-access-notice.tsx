import { Alert, Button, Stack, Typography } from "@mui/material";
import { DashboardPage } from "../../dashboard-template";

export function SessionTrackerAccessNotice() {
  return <DashboardPage>
    <Typography component="h1" variant="h1">Session Tracker</Typography>
    <Alert severity="info" sx={{ mt: 2, maxWidth: 560 }}>
      Turn each trading day into a chance to improve. Unlock Session Tracker to review your session and the trades you took.
      <Stack sx={{ mt: 1, alignItems: "flex-start" }}><Button href="/plans?feature=journal.session_tracker" variant="contained">Unlock Session Tracker</Button></Stack>
    </Alert>
  </DashboardPage>;
}
