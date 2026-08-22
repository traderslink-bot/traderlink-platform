import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

export function JournalAdminAccessDenied() {
  return (
    <Box sx={{ alignItems: "center", bgcolor: "background.default", display: "flex", justifyContent: "center", minHeight: "100vh", p: 3 }}>
      <Paper elevation={0} sx={{ maxWidth: 560, p: { xs: 3, sm: 4 }, width: "100%" }}>
        <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
          <LockOutlinedIcon color="primary" sx={{ fontSize: 42 }} />
          <Box>
            <Typography component="h1" variant="h1">Journal Administration is locked</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body1">
              This signed-in account does not currently have the owner access needed for Journal Administration.
            </Typography>
          </Box>
          <Typography color="text.secondary" variant="body2">
            If you are the TradersLink Discord owner, log out and sign in again with that Discord account. This refreshes the current owner check. If you are not the owner, return to your Journal.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Box component="form" action="/api/auth/logout" method="post">
              <Button fullWidth type="submit" variant="contained">Log out and sign in again</Button>
            </Box>
            <Link href="/workspace" style={{ textDecoration: "none" }}>
              <Button variant="outlined">Return to Journal</Button>
            </Link>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
