"use client";

import { useEffect, useState } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../dashboard-template";

export type WorkspaceMetric = Readonly<{
  label: string;
  value: string;
  caption: string;
}>;

type WorkspaceAnalyticsResponse = Readonly<{
  status: "ready" | "unavailable";
  metrics?: readonly WorkspaceMetric[];
}>;

const unavailableMetrics: readonly WorkspaceMetric[] = [
  {
    label: "Net realized P/L",
    value: "—",
    caption: "Completed trades",
  },
  {
    label: "Gross P/L",
    value: "—",
    caption: "Before trading costs",
  },
  {
    label: "Expectancy",
    value: "—",
    caption: "Per completed trade",
  },
  {
    label: "Win rate",
    value: "—",
    caption: "Completed round trips",
  },
  {
    label: "Profit factor",
    value: "—",
    caption: "Gross wins ÷ losses",
  },
  {
    label: "Round trips",
    value: "—",
    caption: "Selected period",
  },
];

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function WorkspaceDashboard({
  analyticsMetrics: initialAnalyticsMetrics,
}: {
  analyticsMetrics?: readonly WorkspaceMetric[];
}) {
  const [analyticsMetrics, setAnalyticsMetrics] = useState(initialAnalyticsMetrics);
  const [analyticsStatus, setAnalyticsStatus] = useState<
    "loading" | "ready" | "unavailable"
  >(initialAnalyticsMetrics ? "ready" : "loading");

  useEffect(() => {
    if (initialAnalyticsMetrics) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    void fetch("/api/intelligence/dashboard/overview", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as WorkspaceAnalyticsResponse;
      })
      .then((response) => {
        if (response?.status === "ready" && response.metrics) {
          setAnalyticsMetrics(response.metrics);
          setAnalyticsStatus("ready");
          return;
        }
        setAnalyticsStatus("unavailable");
      })
      .catch(() => setAnalyticsStatus("unavailable"))
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [initialAnalyticsMetrics]);

  const metrics = analyticsMetrics ?? unavailableMetrics;
  return (
    <DashboardPage>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <DashboardDataScopeChip />
        <Button
          disabled
          startIcon={<DateRangeRoundedIcon />}
          variant="outlined"
        >
          All available history
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          },
        }}
      >
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} {...metric} />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            lg: "minmax(0, 2fr) minmax(300px, 0.8fr)",
          },
        }}
      >
        <DashboardPanel
          action={
            <Button
              endIcon={<ArrowForwardRoundedIcon />}
              href="/analytics/performance"
              size="small"
            >
              Performance details
            </Button>
          }
          eyebrow="Account performance"
          title="Performance over time"
        >
          {analyticsStatus === "ready" && analyticsMetrics ? (
            <Stack spacing={1}>
              <Typography color="success.main" sx={{ fontWeight: 700 }}>
                Verified v3 execution analytics are attached.
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Open Performance details for exact daily, drawdown, streak,
                outlier, and period packets.
              </Typography>
            </Stack>
          ) : analyticsStatus === "loading" ? (
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }}>
                Calculating analytics
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Your dashboard is ready. Verified performance figures will fill in here as soon as the saved trading history finishes loading.
              </Typography>
            </Stack>
          ) : (
            <DashboardUnavailableState
              actionHref="/imports"
              actionLabel="Import trades"
              description="Performance will appear when the selected account period has complete, verified execution authority. No legacy or estimated values are substituted."
            />
          )}
        </DashboardPanel>

        <Card sx={{ height: "100%" }}>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              p: { xs: 2, sm: 2.5 },
              "&:last-child": { pb: { xs: 2, sm: 2.5 } },
            }}
          >
            <Typography color="primary.main" sx={{ fontWeight: 700 }} variant="caption">
              Quick action
            </Typography>
            <Typography component="h2" variant="h2">
              Add a manual trade
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
              Enter the symbol, side, execution date and time, quantity, price,
              and trading costs in the complete manual-entry form.
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <Button
                href="/manual-entry"
                startIcon={<AddRoundedIcon />}
                variant="contained"
              >
                Open manual entry
              </Button>
              <Button
                href="/imports"
                startIcon={<FileUploadRoundedIcon />}
                variant="outlined"
              >
                Import a statement
              </Button>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            <Divider sx={{ my: 2 }} />
            <Typography color="text.secondary" variant="caption">
              Account and owner scope are assigned securely by the server.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <DashboardPanel
        action={
          <ButtonGroup aria-label="Day session view" size="small">
            <Button variant="contained">Calendar</Button>
            <Button href="/trade-tracker" variant="outlined">
              List
            </Button>
          </ButtonGroup>
        }
        eyebrow="Day sessions"
        title="Trading calendar"
      >
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Button disabled size="small">
              Previous
            </Button>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <CalendarMonthRoundedIcon color="primary" fontSize="small" />
              <Typography sx={{ fontWeight: 700 }}>Available trading history</Typography>
            </Stack>
            <Button disabled size="small">
              Next
            </Button>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gap: 0.75,
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            }}
          >
            {weekdays.map((weekday) => (
              <Typography
                align="center"
                color="text.secondary"
                key={weekday}
                sx={{ fontWeight: 700, py: 0.5 }}
                variant="caption"
              >
                {weekday}
              </Typography>
            ))}
          </Box>
          <DashboardUnavailableState
            actionHref="/imports"
            actionLabel="Add trading history"
            compact
            description="Trading days, daily P/L, and round-trip counts will appear here after verified v3 history is available."
            title="No day sessions available"
          />
        </Stack>
      </DashboardPanel>
    </DashboardPage>
  );
}
