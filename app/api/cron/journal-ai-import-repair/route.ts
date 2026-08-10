import { timingSafeEqual } from "node:crypto";

import { createJournalAiImportRepairOpenAiProvider } from "@/src/modules/journal/server/administration/journal-ai-import-repair-openai-adapter";
import { JournalAiImportRepairWorker } from "@/src/modules/journal/server/administration/journal-ai-import-repair-worker";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization");
  if (!secret || !supplied) return false;
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const received = Buffer.from(supplied, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ ok: false }, { status: 401 });
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
