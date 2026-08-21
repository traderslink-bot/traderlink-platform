import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import type { CoachAiChatQualityContextMessage } from "@/src/modules/coach/contracts/ai-chat-quality-feedback-contracts";
import {
  CoachAiChatQualityFeedbackRepository,
  isCoachAiChatQualityFeedbackSchemaAvailable,
} from "@/src/modules/coach/server/coach-ai-chat-quality-feedback-repository";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminMetricCard,
  JournalAdminMetricGrid,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminPanel,
} from "../journal-admin-ui";

export const metadata: Metadata = { title: "Links AI Chat quality | Journal Administration" };
export const dynamic = "force-dynamic";

function timestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function ContextMessage({ message }: Readonly<{ message: CoachAiChatQualityContextMessage }>) {
  const label = message.role === "assistant" ? "Links" : "Trader";
  const text = message.text ?? (message.generationState === "failed"
    ? "Links could not complete this answer."
    : "Links was still working on this answer.");
  return (
    <Paper sx={{ bgcolor: message.role === "assistant" ? "#EEF4FF" : "background.paper", p: 1.25 }} variant="outlined">
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 800 }} variant="caption">{label}</Typography>
        <Typography color="text.secondary" variant="caption">{timestamp(message.createdAtUtc)}</Typography>
      </Stack>
      <Typography sx={{ mt: 0.5, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }} variant="body2">{text}</Typography>
    </Paper>
  );
}

export default async function LinksAiChatQualityPage() {
  const cases = await withJournalAdminPageDatabase((database) =>
    isCoachAiChatQualityFeedbackSchemaAvailable(database)
      ? new CoachAiChatQualityFeedbackRepository(database).listForOwner()
      : null,
  );
  if (cases === null) {
    return (
      <JournalAdminPage>
        <JournalAdminPageHeader eyebrow="Links AI Chat" title="Quality feedback" description="Review private reports when an answer was not helpful or could not be completed." />
        <Alert severity="info">Quality feedback will be available after its protected database update is applied.</Alert>
      </JournalAdminPage>
    );
  }
  const open = cases.filter((item) => item.state === "open").length;
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader eyebrow="Links AI Chat" title="Quality feedback" description="Private owner review of flagged answers and answers Links could not complete. Each report includes the saved conversation around that moment." />
      <JournalAdminMetricGrid>
        <JournalAdminMetricCard caption="Needs your review" label="Open reports" value={String(open)} />
        <JournalAdminMetricCard caption="Private saved history" label="All reports" value={String(cases.length)} />
      </JournalAdminMetricGrid>
      {cases.length === 0 ? <Alert severity="success">No Links AI Chat quality reports have been recorded yet.</Alert> : null}
      <Stack spacing={2}>
        {cases.map((item) => (
          <JournalAdminPanel key={item.caseId} title="Conversation report">
            <Stack spacing={1.25}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                  <Chip color={item.state === "open" ? "warning" : "default"} label={item.state === "open" ? "Needs review" : item.state} size="small" />
                  {item.eventKinds.map((kind) => <Chip key={kind} label={kind === "trader_flagged" ? "Trader flagged" : kind === "automatic_failure" ? "Links could not answer" : "Result unavailable"} size="small" variant="outlined" />)}
                </Stack>
                <Typography color="text.secondary" variant="caption">Reported {timestamp(item.createdAtUtc)}</Typography>
              </Stack>
              {item.failureCode ? <Typography color="text.secondary" variant="caption">Failure reference: {item.failureCode}</Typography> : null}
              <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }} variant="body2">Conversation context</Typography><Stack spacing={0.75}>{item.context.map((message) => <ContextMessage key={message.messageId} message={message} />)}</Stack></Box>
            </Stack>
          </JournalAdminPanel>
        ))}
      </Stack>
    </JournalAdminPage>
  );
}
