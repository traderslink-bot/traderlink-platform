import { withWritableJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { membershipFeatureDeniedResponse } from "@/src/modules/platform/server/membership/platform-membership-access";
import {
  journalTradingRuleValidationMessage,
  mutateJournalTradingRules,
  readJournalTradingRulesDashboard,
} from "@/src/modules/journal/server/annotations/journal-trading-rules-dashboard";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function record(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
  }
  return value as Record<string, unknown>;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers, { membershipFeatures: ["journal.access"] });
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    if (typeof body.action !== "string") {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
    }
    const data = withWritableJournalAnnotations(scope, (service, account) => {
      mutateJournalTradingRules(service, account, {
        ...body,
        action: body.action,
      });
      return readJournalTradingRulesDashboard(
        service,
        account,
        currentJournalAccountSelectionRef(scope),
      );
    });
    return Response.json({ ok: true, data });
  } catch (error) {
    const denied = membershipFeatureDeniedResponse(error);
    if (denied) return denied;
    const platformError = isTraderLinkPlatformError(error) ? error : null;
    const code = platformError
      ? platformError.code
      : "TRADERLINK_JOURNAL_ANNOTATION_INVALID";
    const conflict = code === "TRADERLINK_JOURNAL_ANNOTATION_CONFLICT" ||
      code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT";
    return Response.json({
      ok: false,
      error: {
        code,
        message: conflict
          ? "This rule or Journal account changed. Refresh and try again."
          : journalTradingRuleValidationMessage(platformError?.safeContext.field),
      },
    }, { status: conflict ? 409 : 400 });
  }
}
