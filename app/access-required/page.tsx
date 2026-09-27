import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardAccessRequiredPage() {
  return (
    <Box sx={{ alignItems: "center", bgcolor: "background.default", display: "flex", justifyContent: "center", minHeight: "100vh", p: 3 }}>
      <Paper sx={{ maxWidth: 520, p: { xs: 3, sm: 4 }, width: "100%" }}>
        <Stack spacing={2}>
          <Typography component="h1" variant="h1">Dashboard access is not available yet</Typography>
          <Typography color="text.secondary">
            Free dashboard access for TradersLink Discord members is currently off. A Premium membership is required right now.
          </Typography>
          <Button component={Link} href="https://traderslink.pro" variant="contained">Return to TradersLink</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
