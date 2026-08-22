import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Your TraderLink session has ended.",
  title: "Signed out | TraderLink Platform",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function SignedOutPage() {
  return (
    <Box sx={{ alignItems: "center", bgcolor: "#f5f7fb", display: "flex", flex: 1, justifyContent: "center", p: { xs: 2, sm: 3 } }}>
      <Paper elevation={0} sx={{ maxWidth: 480, p: { xs: 3, sm: 4 }, textAlign: "center", width: "100%" }}>
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <CheckCircleRoundedIcon color="primary" sx={{ fontSize: 48 }} />
          <Box>
            <Typography component="h1" variant="h1">You&apos;re signed out</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body1">
              Your TraderLink session has ended on this device.
            </Typography>
          </Box>
          <Button href="/api/auth/discord/login?returnTo=%2Fworkspace" size="large" variant="contained">
            Sign in with Discord
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
