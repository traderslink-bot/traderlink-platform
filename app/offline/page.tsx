import type { Metadata } from "next";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardShell } from "../dashboard-shell";
import { DashboardPage } from "../dashboard-ui";

export const metadata: Metadata = {
  title: "Offline | TraderLink Platform",
};

export default function OfflinePage() {
  return (
    <DashboardShell offline>
      <DashboardPage>
        <Typography component="h1" variant="h1">
          Offline access
        </Typography>
        <Stack
          aria-labelledby="offline-access-title"
          role="status"
          sx={{
            alignItems: "center",
            borderTop: 1,
            borderColor: "divider",
            justifyContent: "center",
            minHeight: { xs: 360, sm: 440 },
            px: 2,
            py: 5,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "rgba(1, 30, 86, 0.06)",
              borderRadius: "50%",
              color: "primary.main",
              display: "flex",
              height: 64,
              justifyContent: "center",
              width: 64,
            }}
          >
            <CloudOffRoundedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography
            id="offline-access-title"
            sx={{ fontWeight: 760, mt: 2 }}
            variant="h2"
          >
            Connect to load live information
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 520, mt: 1 }}>
            Your TraderLink navigation is still available. Saved pages and
            offline trade entry appear in their normal locations when they are
            available on this device.
          </Typography>
          <Button href="/workspace" sx={{ mt: 3 }} variant="contained">
            Try again
          </Button>
        </Stack>
      </DashboardPage>
    </DashboardShell>
  );
}
