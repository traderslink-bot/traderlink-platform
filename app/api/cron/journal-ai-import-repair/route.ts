import { isAuthorizedPlatformCronRequest } from "@/src/modules/platform/server/authentication/platform-cron-request-authorization";

import { createJournalAiImportRepairOpenAiProvider } from "@/src/modules/journal/server/administration/journal-ai-import-repair-openai-adapter";
import { JournalAiImportRepairWorker } from "@/src/modules/journal/server/administration/journal-ai-import-repair-worker";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedPlatformCronRequest(request)) return Response.json({ ok: false }, { status: 401 });
  const provider = createJournalAiImportRepairOpenAiProvider(process.env);
  if (!provider) return Response.json({ ok: false, state: "disabled" }, { status: 503 });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const processed = await new JournalAiImportRepairWorker(database, provider).runOne();
    return Response.json({ ok: true, processed });
  } finally {
    database.close();
  }
}
