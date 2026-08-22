import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";

export default function DashboardLoading() {
  return (
    <Stack
      aria-live="polite"
      role="status"
      spacing={1.5}
      sx={{ alignItems: "center", justifyContent: "center", minHeight: "55vh" }}
    >
      <Box
        sx={{
          animation: "traderlink-link-pulse 1.15s ease-in-out infinite",
          borderRadius: 3,
          height: 64,
          overflow: "hidden",
          "@keyframes traderlink-link-pulse": {
            "0%, 100%": { opacity: 0.55, transform: "scale(0.92) rotate(-5deg)" },
            "50%": { opacity: 1, transform: "scale(1.06) rotate(5deg)" },
          },
          "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 1 },
          width: 64,
        }}
      >
        <Image
          alt=""
          height={64}
          priority
          src="/icons/traderlink-192.png"
          width={64}
        />
      </Box>
      <Typography color="text.secondary" sx={{ fontWeight: 750 }} variant="body2">
        Loading…
      </Typography>
    </Stack>
  );
}
