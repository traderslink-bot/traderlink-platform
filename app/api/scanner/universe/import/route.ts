import { handleUniverseImport } from "@/src/modules/scanner/live/server/universe-import-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleUniverseImport(request);
}
