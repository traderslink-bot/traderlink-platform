import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminMetricCard,
  JournalAdminMetricGrid,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminPanel,
} from "../journal-admin-ui";

export const metadata: Metadata = { title: "Notifications | Journal Administration" };
export const dynamic = "force-dynamic";

export default async function JournalAdminNotificationsPage() {
  const summary = await withJournalAdminPageDatabase((database) => {
    const notifications = database.prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM platform_notifications").get()!.count;
    const unread = database.prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM platform_notification_receipts WHERE read_at_utc IS NULL").get()!.count;
    const repairs = database.prepare<[], { queued: number; processing: number; failed: number }>(`SELECT
      COALESCE(SUM(CASE WHEN job_state = 'queued' THEN 1 ELSE 0 END), 0) AS queued,
      COALESCE(SUM(CASE WHEN job_state = 'processing' THEN 1 ELSE 0 END), 0) AS processing,
      COALESCE(SUM(CASE WHEN job_state = 'failed' THEN 1 ELSE 0 END), 0) AS failed
      FROM journal_ai_import_repair_jobs`).get()!;
    const remote = database.prepare<[], { pending: number; delivered: number; failed: number }>(`SELECT
      COALESCE(SUM(CASE WHEN state IN ('pending', 'sending') THEN 1 ELSE 0 END), 0) AS pending,
      COALESCE(SUM(CASE WHEN state = 'delivered' THEN 1 ELSE 0 END), 0) AS delivered,
      COALESCE(SUM(CASE WHEN state = 'failed' THEN 1 ELSE 0 END), 0) AS failed
FROM platform_notification_remote_deliveries`).get()!;
    return Object.freeze({ notifications, remote, unread, repairs });
  });
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader eyebrow="Platform operations" title="Notifications" description="Review aggregate delivery and repair-work health. No statement content, broker identity, Discord subject or message body is available here." />
      <Alert severity="info">Remote delivery uses each trader&apos;s selected Discord and email categories. In-app notifications remain private to each user.</Alert>
      <JournalAdminMetricGrid>
        <JournalAdminMetricCard label="In-app notifications" value={String(summary.notifications)} caption="All users" />
        <JournalAdminMetricCard label="Unread" value={String(summary.unread)} caption="User-scoped receipts" />
        <JournalAdminMetricCard label="AI repair queued" value={String(summary.repairs.queued)} caption="Awaiting configured worker" />
        <JournalAdminMetricCard label="AI repair processing" value={String(summary.repairs.processing)} caption="No source details shown" />
        <JournalAdminMetricCard label="AI repair failed" value={String(summary.repairs.failed)} caption="Aggregate only" />
        <JournalAdminMetricCard label="Remote delivery queued" value={String(summary.remote.pending)} caption="Discord and email" />
        <JournalAdminMetricCard label="Remote delivery sent" value={String(summary.remote.delivered)} caption="Aggregate only" />
        <JournalAdminMetricCard label="Remote delivery failed" value={String(summary.remote.failed)} caption="Aggregate only" />
      </JournalAdminMetricGrid>
      <JournalAdminPanel title="Delivery controls">
        <Stack spacing={1}><Typography sx={{ fontWeight: 800 }}>User-selected delivery only</Typography><Typography color="text.secondary" variant="body2">This page has no recipient lists or arbitrary-send control. It shows aggregate queue health only.</Typography></Stack>
      </JournalAdminPanel>
    </JournalAdminPage>
  );
}
