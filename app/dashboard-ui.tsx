import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type { ButtonProps } from "@mui/material/Button";

export function DashboardPage({ children }: { children: ReactNode }) {
  return (
    <Stack
      data-traderlink-platform-dashboard-page
      spacing={2.5}
      sx={{ minWidth: 0, width: "100%" }}
    >
      {children}
    </Stack>
  );
}

type DashboardActionProps = Omit<
  ButtonProps,
  "color" | "disableElevation" | "variant"
>;

export function DashboardPrimaryAction(props: DashboardActionProps) {
  return (
    <Button {...props} color="primary" disableElevation variant="contained" />
  );
}

export function DashboardSecondaryAction(props: DashboardActionProps) {
  return (
    <Button {...props} color="primary" disableElevation variant="outlined" />
  );
}

export function DashboardMetricCard({
  caption,
  label,
  value,
}: {
  caption: string;
  label: string;
  value: string;
}) {
  return (
    <Card data-traderlink-platform-dashboard-card="metric" sx={{ minWidth: 0 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography color="text.secondary" noWrap variant="caption">
          {label}
        </Typography>
        <Typography
          color="text.primary"
          component="div"
          noWrap
          sx={{ fontSize: "1.35rem", fontWeight: 720, mt: 0.5 }}
        >
          {value}
        </Typography>
        <Typography
          color="text.secondary"
          noWrap
          sx={{ mt: 0.5 }}
          variant="caption"
        >
          {caption}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function DashboardPanel({
  action,
  children,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <Card data-traderlink-platform-dashboard-card="panel" sx={{ height: "100%", minWidth: 0 }}>
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          "&:last-child": { pb: { xs: 2, sm: 2.5 } },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            {eyebrow ? (
              <Typography
                color="primary.main"
                sx={{ fontWeight: 700 }}
                variant="caption"
              >
                {eyebrow}
              </Typography>
            ) : null}
            <Typography component="h2" variant="h2">
              {title}
            </Typography>
          </Box>
          {action}
        </Stack>
        <Box sx={{ mt: 2 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

export function DashboardUnavailableState({
  actionHref,
  actionLabel,
  compact = false,
  description,
  title = "No verified analytics yet",
}: {
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
  description: string;
  title?: string;
}) {
  return (
    <Stack
      sx={{
        alignItems: compact ? "flex-start" : "center",
        bgcolor: "rgba(1, 30, 86, 0.035)",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        justifyContent: "center",
        minHeight: compact ? 120 : 220,
        p: compact ? 2 : 3,
        textAlign: compact ? "left" : "center",
      }}
    >
      <InfoOutlinedIcon color="primary" />
      <Typography sx={{ fontWeight: 700, mt: 1 }}>{title}</Typography>
      <Typography
        color="text.secondary"
        sx={{ maxWidth: 540, mt: 0.75 }}
        variant="body2"
      >
        {description}
      </Typography>
      {actionHref && actionLabel ? (
        <Button
          endIcon={<ArrowForwardRoundedIcon />}
          href={actionHref}
          sx={{ mt: 1.5 }}
          variant="text"
        >
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  );
}

export function DashboardDataScopeChip() {
  return (
    <Chip
      color="default"
      label="Verified execution data"
      size="small"
      variant="outlined"
    />
  );
}
