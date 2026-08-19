import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export const metadata: Metadata = {
  title: "Offline | TraderLink Platform",
};

export default function OfflinePage() {
  return (
    <Box
      component="main"
      sx={{
        alignItems: "center",
        bgcolor: "#f5f7fb",
        display: "flex",
        flex: 1,
        justifyContent: "center",
        minHeight: "100dvh",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          maxWidth: 520,
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          width: "100%",
        }}
      >
        <Box
          alt=""
          component="img"
          src="/icons/traderlink-192.png"
          sx={{ borderRadius: 2.5, height: 72, mb: 2.5, width: 72 }}
        />
        <Typography component="h1" variant="h4">
          TraderLink is offline
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.25 }}>
          Reconnect to update this page. Saved offline information will stay on
          this device when it is available.
        </Typography>
        <Button href="/workspace" sx={{ mt: 3 }} variant="contained">
          Try again
        </Button>
      </Paper>
    </Box>
  );
}
