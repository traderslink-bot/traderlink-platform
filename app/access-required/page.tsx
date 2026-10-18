import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { normalizeDiscordAuthReturnTo } from "@/src/lib/academy/discord-auth-return";

export const dynamic = "force-dynamic";


export default async function DashboardAccessRequiredPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const requestedReturnTo = (await searchParams).returnTo;
  const returnTo = normalizeDiscordAuthReturnTo(
    typeof requestedReturnTo === "string" ? requestedReturnTo : "/workspace",
  );
  const retryHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <Box sx={{ alignItems: "center", bgcolor: "background.default", display: "flex", justifyContent: "center", minHeight: "100vh", p: 3 }}>
      <Paper sx={{ maxWidth: 520, p: { xs: 3, sm: 4 }, width: "100%" }}>
        <Stack spacing={2}>
          <Typography component="h1" variant="h1">Dashboard access is not available yet</Typography>
          <Typography color="text.secondary">
            You are signed in, but this account does not currently have app access. Choose an available plan. If your access comes through Discord, connect that account in Account → Login methods.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button href="/plans" variant="contained">View plans</Button>
            <Button href={retryHref} variant="outlined">Sign in again</Button>
          </Stack>
          <Button href="https://traderslink.pro/beta" variant="text">Return to beta</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
