import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  assertNoQueryParameters,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import {
  parseCreateRelationshipMemoryBody,
  withReadonlyRelationshipMemoryRepository,
  withWritableRelationshipMemoryRepository,
} from "@/src/modules/coach/server/coach-ai-relationship-memory-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const memory = withReadonlyRelationshipMemoryRepository(scope, (repository) =>
      repository.read(scope));
    return readyResponse({ status: "ready", memory });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const input = parseCreateRelationshipMemoryBody(await parseJsonBody(request));
    const saved = withWritableRelationshipMemoryRepository(scope, (repository) =>
      repository.create(scope, input));
    return readyResponse({ status: "ready", memory: saved }, 201);
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
