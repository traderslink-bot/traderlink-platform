import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  assertNoQueryParameters,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import {
  parseMeetLinksBody,
  withWritableRelationshipMemoryRepository,
} from "@/src/modules/coach/server/coach-ai-relationship-memory-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const input = parseMeetLinksBody(await parseJsonBody(request));
    const memory = withWritableRelationshipMemoryRepository(scope, (repository) => {
      if (input.action === "skip") {
        repository.setMeetLinksSkipped(scope);
        return repository.read(scope);
      }
      return repository.completeMeetLinks(scope, input.memories);
    });
    return readyResponse({ status: "ready", memory });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
