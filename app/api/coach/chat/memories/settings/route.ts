import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  assertNoQueryParameters,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import {
  parseRelationshipMemorySettingsBody,
  withWritableRelationshipMemoryRepository,
} from "@/src/modules/coach/server/coach-ai-relationship-memory-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const input = parseRelationshipMemorySettingsBody(await parseJsonBody(request));
    const memory = withWritableRelationshipMemoryRepository(scope, (repository) => {
      if (input.action === "set_enabled") {
        repository.setEnabled(scope, input.enabled);
      } else {
        repository.forgetAll(scope);
      }
      return repository.read(scope);
    });
    return readyResponse({ status: "ready", memory });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
