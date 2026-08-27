import { JournalDemoStagingReviewActivationService } from "@/src/modules/journal/server/demo/journal-demo-staging-review-activation-service";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { serializeJournalAccountSelectionCookie } from "@/src/modules/platform/server/authentication/journal-account-selection-cookie";
import {
  consumeJournalAdminRateLimit,
  journalAdminPrivateHeaders,
  requireJournalAdminMutationRequest,
} from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

import {
  journalAdminJson,
  journalAdminUnavailable,
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
    consumeJournalAdminRateLimit({
      category: "sensitive",
      headers: request.headers,
      userId: identity.scope.userId,
    });
    const activation = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new JournalDemoStagingReviewActivationService(database)
        .activateForCurrentOwner({
          administratorUserId: identity.scope.userId,
          scope: identity.scope,
        }));
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
