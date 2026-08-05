import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip, { type ChipProps } from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TableContainer from "@mui/material/TableContainer";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export function JournalAdminPage({ children }: { children: ReactNode }) {
  return <Stack spacing={2.5} sx={{ minWidth: 0, width: "100%" }}>{children}</Stack>;
}

export function JournalAdminPageHeader({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <Box>
      <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
        {eyebrow}
      </Typography>
      <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">{title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 820, mt: 1 }} variant="body2">
        {description}
      </Typography>
    </Box>
  );
}

export function JournalAdminMetricGrid({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(2, minmax(0, 1fr))",
      lg: "repeat(4, minmax(0, 1fr))",
    } }}>
      {children}
    </Box>
  );
}

export function JournalAdminMetricCard({
  caption,
  label,
  value,
}: {
  caption: string;
  label: string;
  value: string;
}) {
  return (
    <Card sx={{ minWidth: 0 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography color="text.secondary" variant="caption">{label}</Typography>
        <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, mt: 0.5 }}>
          {value}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
          {caption}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function JournalAdminPanel({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
        }}>
          <Typography component="h2" variant="h2">{title}</Typography>
          {action}
        </Stack>
        <Box sx={{ mt: 2 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

export function JournalAdminTable({ children }: { children: ReactNode }) {
  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: "divider" }}>
      <TableContainer>{children}</TableContainer>
    </Paper>
  );
}

export function JournalAdminEmpty({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ bgcolor: "rgba(1, 30, 86, 0.035)", borderRadius: 2, p: 3, textAlign: "center" }}>
      <Typography color="text.secondary" variant="body2">{children}</Typography>
    </Box>
  );
}

function statusColor(state: string): ChipProps["color"] {
  if (["active", "accepted", "committed", "supported", "completed", "success", "ready_closed"].includes(state)) {
    return "success";
  }
  if (["failed", "system_failed", "rejected", "disabled", "support_drift"].includes(state)) {
    return "error";
  }
  if (["pending", "awaiting_mapping", "committed_with_decisions", "ready_for_development", "purge_pending"].includes(state)) {
    return "warning";
  }
  return "default";
}

export function JournalAdminStatus({ state }: { state: string }) {
  return (
    <Chip
      color={statusColor(state)}
      label={state.replaceAll("_", " ")}
      size="small"
      sx={{ textTransform: "capitalize" }}
      variant="outlined"
    />
  );
}

export function formatAdminInteger(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatAdminPercentage(value: number | null): string {
  return value === null ? "N/A" : `${value.toFixed(2).replace(/\.00$/u, "")}%`;
}

export function formatAdminDuration(value: number | null): string {
  if (value === null) return "N/A";
  if (value < 1000) return `${formatAdminInteger(value)} ms`;
  return `${(value / 1000).toFixed(2).replace(/\.00$/u, "")} sec`;
}

export function formatAdminBytes(value: number | null): string {
  if (value === null) return "N/A";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let amount = value;
  let index = 0;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index += 1;
  }
  return `${amount.toFixed(2).replace(/\.00$/u, "")} ${units[index]}`;
}

export function formatAdminUtc(value: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  const hour = date.getUTCHours();
  const displayHour = hour % 12 || 12;
  const pad = (part: number) => part.toString().padStart(2, "0");
  return `${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}/${date.getUTCFullYear()}, ${displayHour}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} ${hour >= 12 ? "PM" : "AM"} UTC`;
}
