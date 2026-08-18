import {
  issueNextJournalRuleIdea,
  listJournalRuleIdeas,
  setJournalRuleIdeaDisposition,
} from "@/src/modules/journal/server/rule-ideas/journal-rule-idea-runtime";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformRequestScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function record(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_RULE_IDEA_INVALID");
  }
  return value as Record<string, unknown>;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    if (body.action === "check") {
      issueNextJournalRuleIdea(scope);
      return Response.json({ ok: true, ideas: listJournalRuleIdeas(scope) });
    }
    if (body.action !== "save_for_later" && body.action !== "not_for_me" && body.action !== "added") {
      platformFailure("TRADERLINK_RULE_IDEA_INVALID");
    }
    if (typeof body.ideaId !== "string" || !Number.isSafeInteger(body.expectedRevision)) {
      platformFailure("TRADERLINK_RULE_IDEA_INVALID");
    }
    setJournalRuleIdeaDisposition(scope, {
      ideaId: body.ideaId,
      expectedRevision: Number(body.expectedRevision),
      disposition: body.action === "save_for_later" ? "saved_for_later" : body.action,
    });
    return Response.json({ ok: true, ideas: listJournalRuleIdeas(scope) });
  } catch (error) {
    const code = isTraderLinkPlatformError(error) ? error.code : "TRADERLINK_RULE_IDEA_INVALID";
    const conflict = code === "TRADERLINK_RULE_IDEA_CONFLICT" || code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT";
    return Response.json({
      ok: false,
      error: {
        code,
        message: conflict
          ? "This Rule idea or selected trading account changed. Refresh and try again."
          : "The Rule idea could not be updated.",
      },
    }, { status: conflict ? 409 : 400 });
  }
}
