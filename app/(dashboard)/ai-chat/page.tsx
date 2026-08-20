import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { DashboardPage } from "../../dashboard-template";
import { AiChatClient } from "./ai-chat-client";
import type { CoachAiDailyCompanionContextSelector } from "@/src/modules/coach/contracts/ai-daily-companion-contracts";

export const metadata: Metadata = {
  title: "Links AI Chat | TraderLink Platform",
  description: "Ask questions about your saved trading record.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AiChatPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function dailyContextFromSearchParams(
  values: Record<string, string | string[] | undefined>,
): CoachAiDailyCompanionContextSelector | null {
  const date = values.date;
  const currency = values.currency;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(date) ||
      typeof currency !== "string" || !/^[A-Z]{3}$/u.test(currency)) {
    return null;
  }
  return Object.freeze({ kind: "daily_review", tradingDate: date, currency });
}

export default async function AiChatPage({ searchParams }: AiChatPageProps) {
  const initialContext = dailyContextFromSearchParams(await searchParams);
  return (
    <DashboardPage>
      <Box>
        <Typography component="h1" variant="h1">Links AI Chat</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }} variant="body2">
          Ask Links about your completed trades, explore what has been working, and keep each conversation saved with the Trade Tracker account you are viewing.
        </Typography>
      </Box>
      <AiChatClient initialContext={initialContext} />
    </DashboardPage>
  );
}
