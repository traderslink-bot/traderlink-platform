"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../dashboard-template";

export type WorkspaceFirstTimeOnboardingResult =
  | "moomoo-failed"
  | null;

type GuideState = "overview" | "moomoo-setup" | "moomoo-create" | "moomoo-connected";

const DAILY_TRACKER_ONBOARDING_HREF = "/trade-tracker?gettingStarted=daily-entry";
const MOOMOO_CONNECTION_HREF = "/api/connections/moomoo/start?from=workspace-onboarding";

function GuideSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Stack spacing={0.75} sx={{ minWidth: 0 }}>
      <Typography component="h3" sx={{ fontWeight: 800 }} variant="body1">
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

function DailyTrackerLink({ children }: { children: ReactNode }) {
  return (
    <DashboardPrimaryAction href={DAILY_TRACKER_ONBOARDING_HREF}>
      {children}
    </DashboardPrimaryAction>
  );
}

export function WorkspaceFirstTimeOnboardingPanel({
  moomooConnectionPending,
  moomooConnected,
  result,
}: {
  moomooConnectionPending: boolean;
  moomooConnected: boolean;
  result: WorkspaceFirstTimeOnboardingResult;
}) {
  const [state, setState] = useState<GuideState>(
    result === "moomoo-failed"
      ? "moomoo-setup"
      : moomooConnected ? "moomoo-connected" : "overview",
  );

  if (state === "moomoo-connected") {
    return (
      <DashboardPanel title="Moomoo is connected">
        <Stack spacing={1.5} sx={{ alignItems: "flex-start", maxWidth: 720 }}>
          <Typography color="text.secondary" variant="body2">
            Your eligible completed trades can now receive chart-based Trade Analyzer reviews. Continue with your first execution in Daily Trade Tracker.
          </Typography>
          <DailyTrackerLink>Continue to Daily Trade Tracker</DailyTrackerLink>
        </Stack>
      </DashboardPanel>
    );
  }

  if (state === "moomoo-setup") {
    return (
      <DashboardPanel title="Connect Moomoo for Trade Analyzer">
        <Stack spacing={1.5} sx={{ alignItems: "flex-start", maxWidth: 720 }}>
          {result === "moomoo-failed" ? (
            <Typography color="error.main" variant="body2">
              Moomoo could not be connected. You can try again or continue to Daily Trade Tracker.
            </Typography>
          ) : null}
          <Typography color="text.secondary" variant="body2">
            If you already have a Moomoo account, connect it now. If not, you can review the free-account steps first. Daily Trade Tracker works either way.
          </Typography>
          {moomooConnectionPending && result === null ? (
            <Typography color="warning.main" sx={{ fontWeight: 700 }} variant="body2">
              Moomoo is not connected yet. Finish Moomoo&apos;s verification, then return here to connect it.
            </Typography>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
            <DashboardPrimaryAction href={MOOMOO_CONNECTION_HREF}>
              {result === "moomoo-failed" ? "Try connecting Moomoo again" : "I already have a Moomoo account"}
            </DashboardPrimaryAction>
            <DashboardSecondaryAction onClick={() => setState("moomoo-create")}>
              Create a free Moomoo account
            </DashboardSecondaryAction>
          </Stack>
          <Button href={DAILY_TRACKER_ONBOARDING_HREF} sx={{ px: 0 }} variant="text">
            Continue to Daily Trade Tracker without Trade Analyzer
          </Button>
        </Stack>
      </DashboardPanel>
    );
  }

  if (state === "moomoo-create") {
    return (
      <DashboardPanel title="Create a free Moomoo account">
        <Stack spacing={1.5} sx={{ alignItems: "flex-start", maxWidth: 720 }}>
          <Typography color="text.secondary" variant="body2">
            Review these steps before you start. Moomoo is optional: you can use Daily Trade Tracker without it.
          </Typography>
          <Box component="ol" sx={{ color: "text.secondary", display: "grid", gap: 1, m: 0, pl: 2.5 }}>
            <li>Create a Moomoo login on their website using email or phone.</li>
            <li>If the website sends you to brokerage-account setup, stop there.</li>
            <li>Download the Moomoo mobile app and sign in with the login you just created.</li>
            <li>In the app, choose “Do this later” on the brokerage selection.</li>
            <li>Return here and connect your signed-in Moomoo account.</li>
          </Box>
          <Typography color="text.secondary" variant="body2">
            Moomoo is not connected until it returns you to TradersLink after you select the connection option below.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
            <Button
              component="a"
              href="https://www.moomoo.com/us/"
              rel="noopener noreferrer"
              target="_blank"
              variant="contained"
            >
              Go to Moomoo to create your account
            </Button>
            <DashboardSecondaryAction href={MOOMOO_CONNECTION_HREF}>
              I&apos;m signed in to Moomoo — Connect Moomoo
            </DashboardSecondaryAction>
          </Stack>
          <Button href={DAILY_TRACKER_ONBOARDING_HREF} sx={{ px: 0 }} variant="text">
            Continue to Daily Trade Tracker
          </Button>
        </Stack>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel title="Get started tracking your trades">
      <Stack spacing={2.25}>
        <GuideSection title="How trades are built">
          <Typography color="text.secondary" variant="body2">
            TradersLink uses your buy and sell executions to automatically build your trades. An execution is one buy or sell. A trade starts when you open a position and ends when your position returns to zero. Buy 100 shares, then sell 100 shares = one completed trade. If you add and reduce shares along the way but never reach zero, it is still one trade until the remaining shares are closed.
          </Typography>
        </GuideSection>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.25, md: 3 },
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <GuideSection title="Trade Tracker">
            <Typography color="text.secondary" variant="body2">
              TradersLink offers several ways to enter your trades, but you will get the most value from Daily Trade Tracker.
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Add the buy and sell executions from your trading day, then use notes, tags, and trading rules to capture what happened and learn from each trade.
            </Typography>
          </GuideSection>

          <GuideSection title="Trade Analyzer">
            <Typography color="text.secondary" variant="body2">
              Trade Analyzer builds on eligible completed trades from Daily Trade Tracker. It helps you review how you entered, exited, sized, held, and managed a trade.
            </Typography>
            <Typography color="text.secondary" variant="body2">
              While TradersLink is in beta, connect a free Moomoo account to provide the market data needed for chart-based trade reviews.
            </Typography>
          </GuideSection>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
          <DailyTrackerLink>Start using Daily Trade Tracker</DailyTrackerLink>
          <DashboardSecondaryAction onClick={() => setState("moomoo-setup")}>
            Set up Trade Analyzer first
          </DashboardSecondaryAction>
        </Stack>
        <Typography color="text.secondary" variant="caption">
          Other ways to enter trades: Quick Trade Entry, Swing Trade Entry, and Import statements.
        </Typography>
      </Stack>
    </DashboardPanel>
  );
}
