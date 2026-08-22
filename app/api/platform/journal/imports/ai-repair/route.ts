import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { openPlatformDatabase, withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp, isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { resolveJournalOpaqueReference } from "@/src/modules/journal/server/administration/journal-opaque-reference-authority";
import { JournalAiImportRepairRepository } from "@/src/modules/journal/server/administration/journal-ai-import-repair-repository";
import { JournalAiImportRepairWorker } from "@/src/modules/journal/server/administration/journal-ai-import-repair-worker";
import { createJournalAiImportRepairOpenAiProvider } from "@/src/modules/journal/server/administration/journal-ai-import-repair-openai-adapter";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { grantJournalAttemptSupportConsent } from "@/src/modules/journal/server/administration/journal-support-consent-service";
import { loadJournalPrivacyHmacConfiguration } from "@/src/modules/journal/server/imports/journal-import-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const data = await request.formData();
    const importRef = data.get("importRef");
    const file = data.get("statement");
    const discordCompletionRequested = data.get("discordCompletionRequested") === "yes";
    if (!(file instanceof File) || typeof importRef !== "string") {
      return Response.json({ status: "unavailable" }, { status: 400 });
    }
    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    const importAttemptId = resolveJournalOpaqueReference({
      configuration: loadJournalPrivacyHmacConfiguration(), scope,
      kind: "import_attempt", reference: importRef,
    });
    const sourceMimeType = ["text/csv", "text/plain", "application/csv"].includes(file.type)
      ? file.type
      : "text/csv";
    const consent = grantJournalAttemptSupportConsent(scope, {
      importAttemptId, sourceBytes, sourceMimeType,
    });
    const job = withPlatformDatabase({ mode: "runtime" }, (database) => {
      const job = new JournalAiImportRepairRepository(database).createOrRead({
        scope, importAttemptId, supportConsentId: consent.supportConsentId,
        discordCompletionRequested, timestamp: createCanonicalUtcTimestamp(),
      });
      new PlatformNotificationRepository(database).create({
        category: "statement_import", destinationPath: "/imports", journalAccountId: scope.activeAccountId,
        kind: "statement_ai_repair_started", occurredAtUtc: createCanonicalUtcTimestamp(), scope,
        sourceEventKey: `statement_ai_repair_started_${job.repairJobId}`,
        title: "Statement import is being prepared", summary: "We will continue this import once its private review is complete.",
      });
      return job;
    });
    // Railway runs one persistent application process. Start the consented
    // request now instead of leaving it dependent on an external cron service.
    const provider = createJournalAiImportRepairOpenAiProvider(process.env);
    if (!provider) return Response.json({ status: "unavailable" }, { status: 503 });
    const database = openPlatformDatabase({ mode: "runtime" });
    try {
      await new JournalAiImportRepairWorker(database, provider).runOne();
    } finally {
      database.close();
    }
    return Response.json({ status: "queued", repairJobRef: job.repairJobId });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_JOURNAL_AI_REPAIR_FAILED";
    // Keep the log free of source data while making hosted configuration failures diagnosable.
    console.error("TraderLink AI import repair request unavailable", { code });
    return Response.json({ status: "unavailable", code }, { status: 409 });
  }
}
