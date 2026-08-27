import { JournalDemoStagingReviewActivationService } from "@/src/modules/journal/server/demo/journal-demo-staging-review-activation-service";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { serializeJournalAccountSelectionCookie } from "@/src/modules/platform/server/authentication/journal-account-selection-cookie";
import {
  consumeJournalAdminRateLimit,
  journalAdminPrivateHeaders,
  requireJournalAdminMutationRequest,
} from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import {
  journalAdminJson,
  journalAdminUnavailable,
  withJournalAdminRequest,
} from "../../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGING_REVIEW_ACTIVATION_ENV =
  "TRADERLINK_DEMO_STAGING_REVIEW_ACTIVATION" as const;

function enabledForStagingReview(): boolean {
  return process.env[STAGING_REVIEW_ACTIVATION_ENV] === "enabled";
}

export async function POST(request: Request): Promise<Response> {
  if (!enabledForStagingReview()) {
    return new Response(null, {
      headers: journalAdminPrivateHeaders(),
      status: 404,
    });
  }
  try {
    requireJournalAdminMutationRequest(request);
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const activation = withJournalAdminRequest(request, (database, administrator) => {
      if (administrator.userId !== identity.scope.userId) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
      }
      consumeJournalAdminRateLimit({
        category: "sensitive",
        headers: request.headers,
        userId: administrator.userId,
      });
      return new JournalDemoStagingReviewActivationService(database)
        .activateForCurrentOwner({
          administratorUserId: administrator.userId,
          scope: identity.scope,
        });
    });
    if (activation.state !== "materialized" || !activation.selectionRef) {
      return journalAdminJson({ status: "unavailable" }, 409);
    }
    const response = journalAdminJson({ status: "materialized" });
    response.headers.set(
      "set-cookie",
      serializeJournalAccountSelectionCookie(activation.selectionRef),
    );
    return response;
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
