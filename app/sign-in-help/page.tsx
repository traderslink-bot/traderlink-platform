import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { normalizeDiscordAuthReturnTo } from "@/src/lib/academy/discord-auth-return";

export const dynamic = "force-dynamic";

const DISCORD_INVITE_URL = "https://discord.gg/9dmGpfpRDD";

const messages: Readonly<Record<string, string>> = Object.freeze({
  failed: "Discord sign-in was cancelled or could not be completed. No account changes were made.",
  "invalid-state": "This sign-in link expired or could not be verified. Start a new Discord sign-in to continue safely.",
  "missing-config": "Discord sign-in is temporarily unavailable. Please try again later.",
  "progress-storage-failed": "Discord authorization succeeded, but TraderLink could not finish setting up your account. Please try again.",
});

export default async function DiscordSignInHelpPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnTo?: string | string[];
    status?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const status = typeof query.status === "string" ? query.status : "failed";
  const returnTo = normalizeDiscordAuthReturnTo(
    typeof query.returnTo === "string" ? query.returnTo : "/workspace",
  );
  const retryHref = `/api/auth/discord/login?prompt=consent&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <Box sx={{ alignItems: "center", bgcolor: "background.default", display: "flex", justifyContent: "center", minHeight: "100vh", p: 3 }}>
      <Paper sx={{ maxWidth: 560, p: { xs: 3, sm: 4 }, width: "100%" }}>
        <Stack spacing={2}>
          <Typography component="h1" variant="h1">Discord sign-in did not finish</Typography>
          <Typography color="text.secondary">
            {messages[status] ?? messages.failed}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button href={retryHref} variant="contained">Try Discord sign-in again</Button>
            <Button href={DISCORD_INVITE_URL} variant="outlined">Join Free Discord</Button>
          </Stack>
          <Button href="https://traderslink.pro/beta" variant="text">Return to beta</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
