import { savedScansCatalogueResponse, savedScansStreamResponse } from "@/src/modules/scanner/custom/server/saved-scans-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return savedScansCatalogueResponse(request);
}

export function POST(request: Request) {
  return savedScansStreamResponse(request);
}
