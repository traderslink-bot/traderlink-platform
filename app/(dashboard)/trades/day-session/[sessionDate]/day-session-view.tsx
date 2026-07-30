"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";

import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../../../dashboard-template";

import type {
  DaySessionData,
  DaySessionRoundTrip,
  DaySessionRule,
} from "./day-session-types";

function money(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    signDisplay: "always",
    style: "currency",
  }).format(value);
}

function dateLabel(date: string): string {
  return new Date(`${date}T12:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
  });
}

function timeLabel(value: string, timezone: string): string {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
}

function pnlColor(value: number): "success.main" | "error.main" | "text.primary" {
  if (value === 0) return "text.primary";
  return value > 0 ? "success.main" : "error.main";
}

function statusPresentation(
  status: DaySessionRule["status"],
): {
  color: "success" | "error" | "default";
  icon: typeof CheckCircleOutlineRoundedIcon;
  label: string;
} {
  if (status === "followed") {
    return {
      color: "success",
      icon: CheckCircleOutlineRoundedIcon,
      label: "Followed",
    };
  }
  if (status === "broken") {
    return {
      color: "error",
      icon: ErrorOutlineRoundedIcon,
      label: "Broken",
    };
  }
  return {
    color: "default",
    icon: ErrorOutlineRoundedIcon,
    label: "Not reviewed",
  };
}

function TradeReview({
  currency,
  roundTrip,
}: {
  currency: string;
  roundTrip: DaySessionRoundTrip;
}) {
  const status = statusPresentation(roundTrip.journal.ruleStatus);
  const StatusIcon = status.icon;

  return (
    <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
      <Box
        sx={{
          alignItems: { md: "center" },
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr) auto",
            md: "minmax(150px, 1fr) 80px 120px",
          },
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800 }} variant="body2">
            {timeLabel(roundTrip.entryAt, roundTrip.timezone)} –{" "}
            {timeLabel(roundTrip.exitAt, roundTrip.timezone)}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            Completed round trip
          </Typography>
        </Box>
        <Chip
          label={roundTrip.direction === "long" ? "Long" : "Short"}
          size="small"
          variant="outlined"
        />
        <Typography
          color={pnlColor(roundTrip.netPnl)}
          sx={{
            fontFamily: "var(--font-geist-mono)",
            fontWeight: 850,
            gridColumn: { xs: "1 / -1", md: "auto" },
            textAlign: { md: "right" },
          }}
          variant="body1"
        >
          {money(roundTrip.netPnl, currency)}
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={0.75}
        sx={{ flexWrap: "wrap", gap: 0.75, mt: 1.5 }}
      >
        {roundTrip.journal.tags.map((tag) => (
          <Chip key={tag} label={tag} size="small" />
        ))}
      </Stack>

      <Box
        sx={{
          bgcolor: "rgba(1, 30, 86, 0.035)",
          borderRadius: 1.5,
          display: { xs: "none", md: "grid" },
          gap: 1.5,
          gridTemplateColumns: "minmax(0, 1.45fr) minmax(220px, 0.75fr)",
          mt: 1.5,
          p: 1.5,
        }}
      >
        <Box>
          <Typography color="text.secondary" variant="caption">
            Technical notes
          </Typography>
          <Typography sx={{ mt: 0.4 }} variant="body2">
            {roundTrip.journal.technicalNote}
          </Typography>
        </Box>
        <Box>
          <Typography color="text.secondary" variant="caption">
            Rule review
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "flex-start", mt: 0.5 }}
          >
            <StatusIcon
              color={status.color === "default" ? "disabled" : status.color}
              fontSize="small"
            />
            <Box>
              <Typography sx={{ fontWeight: 750 }} variant="body2">
                {status.label}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {roundTrip.journal.ruleSummary}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Accordion
        disableGutters
        elevation={0}
        sx={{
          bgcolor: "transparent",
          display: { xs: "block", md: "none" },
          mt: 1,
          "&::before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRoundedIcon />}
          sx={{
            borderTop: 1,
            borderColor: "divider",
            minHeight: 44,
            px: 0,
            "& .MuiAccordionSummary-content": { my: 1 },
          }}
        >
          <Typography color="primary.main" sx={{ fontWeight: 750 }} variant="body2">
            Trade notes
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            bgcolor: "rgba(1, 30, 86, 0.035)",
            borderRadius: 1.5,
            p: 1.5,
          }}
        >
          <Typography color="text.secondary" variant="caption">
            Technical notes
          </Typography>
          <Typography sx={{ mt: 0.4 }} variant="body2">
            {roundTrip.journal.technicalNote}
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          <Typography color="text.secondary" variant="caption">
            Rule review
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "center", mt: 0.5 }}
          >
            <StatusIcon
              color={status.color === "default" ? "disabled" : status.color}
              fontSize="small"
            />
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              {status.label}: {roundTrip.journal.ruleSummary}
            </Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export function DaySessionView({ data }: { data: DaySessionData }) {
  const tradeCount = data.tickers.reduce(
    (count, ticker) => count + ticker.roundTrips.length,
    0,
  );

  return (
    <DashboardPage>
      <Alert severity="info">
        Design preview only — sample trades and notes are not account data.
      </Alert>

      <DashboardPanel
        action={
          <DashboardSecondaryAction
            component={Link}
            href="/trades/day-sessions"
            startIcon={<ArrowBackRoundedIcon />}
          >
            Day Sessions
          </DashboardSecondaryAction>
        }
        eyebrow="Trading day"
        title={dateLabel(data.date)}
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            mt: 2.5,
          }}
        >
          {[
            ["Net P/L", money(data.netPnl, data.currency), pnlColor(data.netPnl)],
            ["Trades", String(tradeCount), "text.primary"],
            ["Tickers", String(data.tickers.length), "text.primary"],
            [
              "Rules broken",
              String(data.rules.filter((rule) => rule.status === "broken").length),
              "error.main",
            ],
          ].map(([label, value, color]) => (
            <Box
              key={label}
              sx={{
                bgcolor: "rgba(1, 30, 86, 0.035)",
                borderRadius: 1.5,
                p: 2,
              }}
            >
              <Typography color="text.secondary" variant="caption">
                {label}
              </Typography>
              <Typography
                color={color}
                sx={{ fontWeight: 850, mt: 0.35 }}
                variant="h5"
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </DashboardPanel>

      <Stack spacing={2}>
        {data.tickers.map((ticker) => (
          <Card key={ticker.stableInstrumentKey} variant="outlined">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "240px minmax(0, 1fr)" },
              }}
            >
              <Box
                sx={{
                  bgcolor: "rgba(1, 30, 86, 0.035)",
                  borderBottom: { xs: 1, md: 0 },
                  borderColor: "divider",
                  borderRight: { md: 1 },
                  p: { xs: 2, md: 2.5 },
                }}
              >
                <Typography sx={{ fontWeight: 900 }} variant="h4">
                  {ticker.symbol}
                </Typography>
                <Typography
                  color={pnlColor(ticker.netPnl)}
                  sx={{
                    fontFamily: "var(--font-geist-mono)",
                    fontWeight: 850,
                    mt: 1,
                  }}
                  variant="h6"
                >
                  {money(ticker.netPnl, data.currency)}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                  {ticker.roundTrips.length} trade
                  {ticker.roundTrips.length === 1 ? "" : "s"}
                </Typography>
              </Box>
              <Stack divider={<Divider flexItem />}>
                {ticker.roundTrips.map((roundTrip) => (
                  <TradeReview
                    currency={data.currency}
                    key={roundTrip.roundTripKey}
                    roundTrip={roundTrip}
                  />
                ))}
              </Stack>
            </Box>
          </Card>
        ))}
      </Stack>

      <DashboardPanel title="Rules">
        <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
          {data.rules.map((rule) => {
            const status = statusPresentation(rule.status);
            return (
              <Box
                key={rule.label}
                sx={{
                  alignItems: { sm: "center" },
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                  justifyContent: "space-between",
                  py: 1.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 750 }} variant="body2">
                    {rule.label}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {rule.custom ? "Custom" : "Preset"} ·{" "}
                    {rule.applicability === "day" ? "Day rule" : "Trade rule"}
                  </Typography>
                </Box>
                <Chip
                  color={status.color}
                  label={status.label}
                  size="small"
                  variant={status.color === "default" ? "outlined" : "filled"}
                />
              </Box>
            );
          })}
        </Stack>
      </DashboardPanel>

      <DashboardPanel title="Daily Notes">
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            mt: 1.5,
          }}
        >
          <TextField
            label="What worked"
            minRows={4}
            multiline
            placeholder="What did you execute well today?"
          />
          <TextField
            label="What needs work"
            minRows={4}
            multiline
            placeholder="What should you improve next time?"
          />
          <TextField
            label="Technical recap (optional)"
            minRows={4}
            multiline
            placeholder="Setup, stop, target, or execution observations across the day."
          />
          <TextField
            label="Tomorrow's focus"
            minRows={4}
            multiline
            placeholder="What will you carry into the next trading day?"
          />
          <TextField
            label="Anything else"
            minRows={4}
            multiline
            placeholder="Write anything else you want to remember."
            sx={{ gridColumn: { md: "1 / -1" } }}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <DashboardPrimaryAction disabled>Save Notes</DashboardPrimaryAction>
        </Box>
      </DashboardPanel>
    </DashboardPage>
  );
}
