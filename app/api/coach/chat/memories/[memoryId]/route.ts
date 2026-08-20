import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  assertNoQueryParameters,
  parseJsonBody,
  readyResponse,
  respondToChatRouteError,
} from "@/src/modules/coach/server/coach-ai-chat-route-runtime";
import {
  parseRelationshipMemoryId,
  parseRelationshipMemoryPatchBody,
  withWritableRelationshipMemoryRepository,
} from "@/src/modules/coach/server/coach-ai-relationship-memory-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MemoryRouteContext = Readonly<{
  params: Promise<{ memoryId: string }>;
}>;

export async function PATCH(
  request: Request,
  { params }: MemoryRouteContext,
): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const { memoryId } = await params;
    const id = parseRelationshipMemoryId(memoryId);
    const input = parseRelationshipMemoryPatchBody(await parseJsonBody(request));
    const memory = withWritableRelationshipMemoryRepository(scope, (repository) =>
      repository.update(scope, id, input));
    return readyResponse({ status: "ready", memory });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: MemoryRouteContext,
): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    assertNoQueryParameters(new URL(request.url));
    const { memoryId } = await params;
    const id = parseRelationshipMemoryId(memoryId);
    const memory = withWritableRelationshipMemoryRepository(scope, (repository) =>
      repository.forget(scope, id));
    return readyResponse({ status: "ready", memory });
  } catch (error) {
    return respondToChatRouteError(error);
  }
}
