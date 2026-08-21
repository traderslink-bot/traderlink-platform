import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { JournalAdminOverviewService } from "@/src/modules/journal/server/administration/journal-admin-overview-service";
import { createJournalAdminReadContext } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { PlatformAdminErrorService } from "@/src/modules/platform/server/administration/platform-admin-error-service";
import { isCoachAiChatQualityFeedbackSchemaAvailable } from "@/src/modules/coach/server/coach-ai-chat-quality-feedback-repository";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { JournalAdminShell } from "./journal-admin-shell";

export const metadata: Metadata = {
  title: "Journal Administration | TraderLink Platform",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

function environmentLabel(): "Local" | "Preview" | "Production" {
  if (process.env.VERCEL_ENV === "preview") return "Preview";
  if (process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV)) {
    return "Production";
  }
  return "Local";
}

export default async function JournalAdminLayout({ children }: { children: ReactNode }) {
  let shell: Readonly<{
    alertCount: number;
    dataAsOfUtc: string;
    operatorRole: string;
  }>;
  try {
    shell = await withJournalAdminPageDatabase((database, scope) => {
      const overview = new JournalAdminOverviewService({ database, scope }).read();
      const recentMoomooErrors = new PlatformAdminErrorService(
        createJournalAdminReadContext({ database, scope }),
      ).recentFailureCount();
      const linksQualityAlerts = isCoachAiChatQualityFeedbackSchemaAvailable(database)
        ? database.prepare<[], { count: number }>(`SELECT COUNT(*) AS count
FROM coach_ai_chat_quality_cases WHERE case_state = 'open'`).get()!.count
        : 0;
      return Object.freeze({
        alertCount: overview.imports.systemFailed +
          overview.formats.privacyReviewRequired + recentMoomooErrors + linksQualityAlerts,
        dataAsOfUtc: overview.coverage.dataAsOfUtc,
        operatorRole: scope.role === "journal_owner_admin"
          ? "Owner administrator"
          : "Local owner review",
      });
    });
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      redirect("/api/auth/discord/login?returnTo=%2Fadmin%2Fjournal");
    }
    throw error;
  }
  return (
    <JournalAdminShell
      alertCount={shell.alertCount}
      dataAsOfUtc={shell.dataAsOfUtc}
      environment={environmentLabel()}
      operatorRole={shell.operatorRole}
    >
      {children}
    </JournalAdminShell>
  );
}
