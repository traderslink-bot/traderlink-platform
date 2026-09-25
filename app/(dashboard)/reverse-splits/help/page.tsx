import type { Metadata } from "next";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DashboardPage, DashboardPanel, DashboardSecondaryAction } from "@/app/dashboard-template";
import { REVERSE_SPLIT_HELP_GUIDE } from "@/src/modules/help/reverse-split-guides";
import { requireReverseSplitReviewPageAccess } from "@/src/modules/news/server/reverse-splits/access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  await requireReverseSplitReviewPageAccess();
  return { title: "Reverse Splits Help | TradersLink Platform", robots: { index: false, follow: false } };
}

export default async function ReverseSplitsHelpPage() {
  await requireReverseSplitReviewPageAccess();
  return <DashboardPage>
    <Typography component="h1" variant="h1">Reverse Splits Help</Typography>
    <Alert severity="info">Owner review only. Live data collection and notifications are off. This guide describes the intended feature; the preview contains no market records.</Alert>
    <DashboardSecondaryAction component={Link} href="/reverse-splits">Back to Reverse Splits</DashboardSecondaryAction>
    {REVERSE_SPLIT_HELP_GUIDE.sections.map((section) => <DashboardPanel key={section.id} title={section.title}>
      <Stack spacing={2}>
        {section.blocks.map((block, index) => block.kind === "paragraph"
          ? <Typography key={`${section.id}-${index}`} color="text.secondary">{block.text}</Typography>
          : block.kind === "link" ? <DashboardSecondaryAction component={Link} href={block.href} key={`${section.id}-${index}`}>{block.label}</DashboardSecondaryAction> : null)}
      </Stack>
    </DashboardPanel>)}
  </DashboardPage>;
}
