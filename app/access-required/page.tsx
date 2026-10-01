import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { normalizeDiscordAuthReturnTo } from "@/src/lib/academy/discord-auth-return";

export const dynamic = "force-dynamic";

const DISCORD_INVITE_URL = "https://discord.gg/9dmGpfpRDD";

export default async function DashboardAccessRequiredPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const requestedReturnTo = (await searchParams).returnTo;
  const returnTo = normalizeDiscordAuthReturnTo(
    typeof requestedReturnTo === "string" ? requestedReturnTo : "/workspace",
  );
  const retryHref = `/api/auth/discord/login?prompt=consent&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <Box sx={{ alignItems: "center", bgcolor: "background.default", display: "flex", justifyContent: "center", minHeight: "100vh", p: 3 }}>
      <Paper sx={{ maxWidth: 520, p: { xs: 3, sm: 4 }, width: "100%" }}>
        <Stack spacing={2}>
          <Typography component="h1" variant="h1">Dashboard access is not available yet</Typography>
          <Typography color="text.secondary">
            Your Discord sign-in worked, but this account does not currently have dashboard access. Join the free TradersLink Discord, or sign in again if you already joined.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button href={DISCORD_INVITE_URL} variant="contained">Join Free Discord</Button>
            <Button href={retryHref} variant="outlined">Try Discord sign-in again</Button>
          </Stack>
          <Button href="https://traderslink.pro/beta" variant="text">Return to beta</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
