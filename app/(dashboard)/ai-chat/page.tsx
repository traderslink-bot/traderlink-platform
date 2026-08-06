import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { DashboardPage } from "../../dashboard-template";
import { AiChatClient } from "./ai-chat-client";

export const metadata: Metadata = {
  title: "AI Chat | TraderLink Platform",
  description: "Ask questions about your saved trading record.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AiChatPage() {
  return (
    <DashboardPage>
      <Box>
        <Typography component="h1" variant="h1">AI Chat</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }} variant="body2">
          Ask questions about your completed trades, explore what has been working, and keep each conversation saved with the Journal account you are viewing.
        </Typography>
      </Box>
      <AiChatClient />
    </DashboardPage>
  );
}
