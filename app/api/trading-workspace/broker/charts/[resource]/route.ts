import { readWorkspaceMoomooAccess } from "@/src/modules/market-data/server/workspace-moomoo-access";
import { workspaceMoomooChartResponse } from "@/src/modules/market-data/server/workspace-moomoo-chart-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  return workspaceMoomooChartResponse(request, resource, readWorkspaceMoomooAccess(request));
}
