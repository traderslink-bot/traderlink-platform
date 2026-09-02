import { withReadonlyJournalAnnotations, withWritableJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireExpectedJournalAccountSelection, requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HEADERS = { "cache-control": "private, no-store, max-age=0" };
type Category = "what_worked" | "what_needs_work" | "technical_recap" | "general";
type Target = Readonly<{ kind: "trading_day"; tradingDate: string }> | Readonly<{ kind: "round_trip"; roundTripId: string }>;

function target(value: URLSearchParams | Record<string, unknown>): Target {
  const targetKind = value instanceof URLSearchParams ? value.get("targetKind") : value.targetKind;
  if (targetKind === "trading_day") { const tradingDate = value instanceof URLSearchParams ? value.get("tradingDate") : value.tradingDate; if (typeof tradingDate !== "string") platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "tradingDate" }); return { kind: targetKind, tradingDate }; }
  if (targetKind === "round_trip") { const roundTripId = value instanceof URLSearchParams ? value.get("roundTripId") : value.roundTripId; if (typeof roundTripId !== "string") platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "roundTripId" }); return { kind: targetKind, roundTripId }; }
  return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "targetKind" });
}
function category(value: unknown): Category { if (value === "what_worked" || value === "what_needs_work" || value === "technical_recap" || value === "general") return value; return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "category" }); }
function validText(value: unknown): string { if (typeof value !== "string") platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "text" }); return value; }
function read(scope: ReturnType<typeof requireTraderLinkPlatformRequestScope>, targetValue: Target, categoryValue: Category) {
  return withReadonlyJournalAnnotations(scope, (service, account) => {
    if (targetValue.kind === "trading_day") {
      const note = service.readDailyNote(account, targetValue.tradingDate);
      const field = categoryValue === "what_worked" ? note?.whatWorked : categoryValue === "what_needs_work" ? note?.whatNeedsWork : categoryValue === "technical_recap" ? note?.technicalRecap : note?.anythingElse;
      return { available: true, revision: note?.revision ?? null, text: field ?? "" };
    }
    const note = service.readRoundTripNotes(account, [targetValue.roundTripId])[targetValue.roundTripId] ?? null;
    if (categoryValue === "technical_recap") return { available: true, revision: note?.revision ?? null, text: note?.technicalNote ?? "" };
    if (categoryValue === "general") return { available: true, revision: note?.revision ?? null, text: note?.tradeNote ?? "" };
    return { available: false, revision: null, text: "" };
  });
}
export async function GET(request: Request): Promise<Response> {
  try { const scope = requireTraderLinkPlatformRequestScope(request.headers); const query = new URL(request.url).searchParams; return Response.json({ note: read(scope, target(query), category(query.get("category"))), status: "ready" }, { headers: HEADERS }); } catch (error) { return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 }); }
}
export async function PUT(request: Request): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers); const body = await request.json() as Record<string, unknown>;
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const targetValue = target(body); const categoryValue = category(body.category); const noteText = validText(body.text);
    if (targetValue.kind === "round_trip" && categoryValue !== "technical_recap" && categoryValue !== "general") {
      return Response.json({ status: "unsupported" }, { headers: HEADERS, status: 400 });
    }
    const saved = withWritableJournalAnnotations(scope, (service, account) => {
      if (targetValue.kind === "trading_day") {
        const current = service.readDailyNote(account, targetValue.tradingDate);
        return service.saveDailyNote(account, {
          anythingElse: categoryValue === "general" ? noteText : current?.anythingElse ?? "",
          expectedRevision: body.expectedRevision,
          technicalRecap: categoryValue === "technical_recap" ? noteText : current?.technicalRecap ?? "",
          tomorrowsFocus: current?.tomorrowsFocus ?? "",
          tradingDate: targetValue.tradingDate,
          whatNeedsWork: categoryValue === "what_needs_work" ? noteText : current?.whatNeedsWork ?? "",
          whatWorked: categoryValue === "what_worked" ? noteText : current?.whatWorked ?? "",
        });
      }
      const current = service.readRoundTripNotes(account, [targetValue.roundTripId])[targetValue.roundTripId] ?? null;
      return service.saveRoundTripNote(account, {
        expectedRevision: body.expectedRevision,
        roundTripId: targetValue.roundTripId,
        technicalNote: categoryValue === "technical_recap" ? noteText : current?.technicalNote ?? "",
        tradeNote: categoryValue === "general" ? noteText : current?.tradeNote ?? "",
      });
    }, { allowDemoAccountAnnotations: true });
    return Response.json({ status: "ready" }, { headers: HEADERS });
  } catch (error) { const conflict = isTraderLinkPlatformError(error) && error.code === "TRADERLINK_JOURNAL_ANNOTATION_CONFLICT"; return Response.json({ status: "unavailable" }, { headers: HEADERS, status: conflict ? 409 : 400 }); }
}
