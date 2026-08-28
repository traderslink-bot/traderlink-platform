import { JournalDemoStagingReviewActivationService } from "@/src/modules/journal/server/demo/journal-demo-staging-review-activation-service";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { serializeJournalAccountSelectionCookie } from "@/src/modules/platform/server/authentication/journal-account-selection-cookie";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { consumeJournalAdminRateLimit } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import {
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGING_REVIEW_ACTIVATION_ENV =
  "TRADERLINK_DEMO_STAGING_REVIEW_ACTIVATION" as const;
const PRIVATE_HEADERS = Object.freeze({
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
});

function enabledForStagingReview(): boolean {
  return process.env[STAGING_REVIEW_ACTIVATION_ENV] === "enabled";
}

function unavailable(status: number): Response {
  return Response.json(
    { status: "unavailable" },
    { headers: PRIVATE_HEADERS, status },
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!enabledForStagingReview()) {
    return new Response(null, { headers: PRIVATE_HEADERS, status: 404 });
  }
  try {
    requireJournalMutationRequest(request);
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    // This limiter is independent of the global admin grant and protects this
    // staging-only materialization action without receiving a target identity.
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
      return unavailable(409);
    }
    const response = Response.json(
      { status: "materialized" },
      { headers: PRIVATE_HEADERS },
    );
    response.headers.set(
      "set-cookie",
      serializeJournalAccountSelectionCookie(activation.selectionRef),
    );
    return response;
  } catch (error) {
    return unavailable(
      isTraderLinkPlatformError(error) &&
        error.code === "TRADERLINK_JOURNAL_ADMIN_RATE_LIMITED"
        ? 429
        : 403,
    );
  }
}
