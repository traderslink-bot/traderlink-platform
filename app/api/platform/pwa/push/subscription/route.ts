import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { loadPlatformWebPushEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-web-push-configuration";
import { PlatformWebPushRepository } from "@/src/modules/platform/server/notifications/platform-web-push-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = Object.freeze({
  "cache-control": "private, no-store, max-age=0",
  "x-content-type-options": "nosniff",
});

type SubscriptionMutation = Readonly<{
  categories?: readonly unknown[];
  endpoint?: unknown;
  operation?: unknown;
  subscription?: unknown;
}>;

async function body(request: Request): Promise<SubscriptionMutation> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 20_000) {
    throw new Error("push_request_too_large");
  }
  const raw = await request.text();
  if (raw.length < 2 || raw.length > 20_000) throw new Error("push_request_invalid");
  return JSON.parse(raw) as SubscriptionMutation;
}

function errorResponse(error: unknown): Response {
  const configuration = isTraderLinkPlatformError(error) &&
    error.code === "TRADERLINK_WEB_PUSH_CONFIGURATION_INVALID";
  const invalid = isTraderLinkPlatformError(error) &&
    error.code === "TRADERLINK_WEB_PUSH_STORAGE_INVALID";
  const invalidRequest = error instanceof SyntaxError ||
    (error instanceof Error && error.message.startsWith("push_request_"));
  const unauthorized = isTraderLinkPlatformError(error) &&
    error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED";
  return Response.json(
    { status: "unavailable" },
    {
      headers: HEADERS,
      status: configuration ? 503 : invalid || invalidRequest ? 400 : unauthorized ? 401 : 500,
    },
  );
}

export async function POST(request: Request): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const input = await body(request);
    if (input.operation === "status") {
      const status = withPlatformDatabase({ mode: "runtime" }, (database) =>
        new PlatformWebPushRepository(
          database,
          loadPlatformWebPushEncryptionConfiguration(),
        ).status({ endpoint: input.endpoint, scope })
      );
      return Response.json({ status }, { headers: HEADERS });
    }
    const categories = Array.isArray(input.categories) ? input.categories : null;
    withPlatformDatabase({ mode: "runtime" }, (database) => database.transaction(() => {
      new PlatformWebPushRepository(
        database,
        loadPlatformWebPushEncryptionConfiguration(),
      ).subscribe({
        scope,
        subscription: input.subscription,
        updatedAtUtc: createCanonicalUtcTimestamp(),
      });
      if (categories) {
        new PlatformNotificationRepository(database).replaceWebPushCategories({
          categories,
          scope,
          updatedAtUtc: createCanonicalUtcTimestamp(),
        });
      }
    }).immediate());
    return Response.json({ status: "ready" }, { headers: HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const input = await body(request);
    withPlatformDatabase({ mode: "runtime" }, (database) => {
      new PlatformWebPushRepository(
        database,
        loadPlatformWebPushEncryptionConfiguration(),
      ).revoke({
        endpoint: input.endpoint,
        scope,
        updatedAtUtc: createCanonicalUtcTimestamp(),
      });
    });
    return Response.json({ status: "ready" }, { headers: HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}
